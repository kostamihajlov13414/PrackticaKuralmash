const bcrypt = require('bcryptjs');
const { db } = require('../config/database');
const { generateToken } = require('../middleware/auth');

const register = async (req, res) => {
    const { username, password, fullname, workshop } = req.body;

    if (!username || !password || !fullname || !workshop) {
        return res.status(400).json({ error: 'Все поля обязательны' });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        
        db.run(
            "INSERT INTO users (username, password, fullname, workshop, role) VALUES (?, ?, ?, ?, 'worker')",
            [username, hashedPassword, fullname, workshop],
            function(err) {
                if (err) {
                    if (err.message.includes('UNIQUE')) {
                        return res.status(400).json({ error: 'Пользователь уже существует' });
                    }
                    return res.status(500).json({ error: 'Ошибка сервера' });
                }
                res.status(201).json({ message: 'Регистрация успешна' });
            }
        );
    } catch (error) {
        res.status(500).json({ error: 'Ошибка сервера' });
    }
};

const login = (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: 'Введите логин и пароль' });
    }

    db.get("SELECT * FROM users WHERE username = ?", [username], async (err, user) => {
        if (err || !user) {
            return res.status(401).json({ error: 'Неверный логин или пароль' });
        }

        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) {
            return res.status(401).json({ error: 'Неверный логин или пароль' });
        }

        const token = generateToken(user);
        res.cookie('token', token, { httpOnly: true, maxAge: 24 * 60 * 60 * 1000 });
        res.json({ 
            message: 'Вход выполнен', 
            token,
            user: { id: user.id, username: user.username, fullname: user.fullname, role: user.role, workshop: user.workshop }
        });
    });
};

const logout = (req, res) => {
    res.clearCookie('token');
    res.json({ message: 'Выход выполнен' });
};

const getMe = (req, res) => {
    db.get("SELECT id, username, fullname, workshop, role FROM users WHERE id = ?", [req.user.id], (err, user) => {
        if (err || !user) {
            return res.status(404).json({ error: 'Пользователь не найден' });
        }
        res.json(user);
    });
};

const getAllUsers = (req, res) => {
    db.all("SELECT id, username, fullname, workshop, role, created_at FROM users", [], (err, users) => {
        if (err) {
            return res.status(500).json({ error: 'Ошибка загрузки' });
        }
        res.json(users);
    });
};

module.exports = { register, login, logout, getMe, getAllUsers };