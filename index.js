const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const path = require('path');
const authRouter = require('./routers/authRouter');
const shiftRouter = require('./routers/shiftRouter');
const { initializeDatabase } = require('./config/database');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('views'));

// Инициализация базы данных
initializeDatabase();

// API роуты
app.use('/api/auth', authRouter);
app.use('/api/shifts', shiftRouter);

// Страницы
app.get('/', (req, res) => {
    res.redirect('/login.html');
});

app.get('/login.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'login.html'));
});

app.get('/admin.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'admin.html'));
});

app.get('/worker.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'worker.html'));
});

// Запуск сервера
app.listen(PORT, () => {
    console.log(`✅ Сервер завода «Куралмаш» запущен на http://localhost:${PORT}`);
    console.log(`📋 Страница входа: http://localhost:${PORT}/login.html`);
    console.log(`👑 Администратор: admin / admin123`);
    console.log(`👷 Рабочий: worker / worker123`);
});