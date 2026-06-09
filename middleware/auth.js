const jwt = require('jsonwebtoken');

const SECRET_KEY = 'kuralmash_secret_key_2026';

const authenticateToken = (req, res, next) => {
    const token = req.cookies.token || req.headers.authorization?.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({ error: 'Не авторизован' });
    }

    try {
        const user = jwt.verify(token, SECRET_KEY);
        req.user = user;
        next();
    } catch (error) {
        return res.status(403).json({ error: 'Недействительный токен' });
    }
};

const authorizeAdmin = (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Доступ запрещен. Требуются права администратора' });
    }
    next();
};

const generateToken = (user) => {
    return jwt.sign(
        { id: user.id, username: user.username, role: user.role, fullname: user.fullname, workshop: user.workshop },
        SECRET_KEY,
        { expiresIn: '24h' }
    );
};

module.exports = { authenticateToken, authorizeAdmin, generateToken };