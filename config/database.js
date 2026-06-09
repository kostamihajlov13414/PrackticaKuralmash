const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');

const dbPath = path.join(__dirname, '../kuralmash.db');
const db = new sqlite3.Database(dbPath);

const initializeDatabase = () => {
    // Таблица пользователей
    db.run(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            fullname TEXT NOT NULL,
            workshop TEXT NOT NULL,
            role TEXT DEFAULT 'worker',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `, (err) => {
        if (err) console.error('Ошибка создания users:', err);
        else console.log('✅ Таблица users готова');
    });

    // Таблица смен
    db.run(`
        CREATE TABLE IF NOT EXISTS shifts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            employee_name TEXT NOT NULL,
            workshop TEXT NOT NULL,
            shift_date TEXT NOT NULL,
            shift_type TEXT NOT NULL,
            note TEXT,
            created_by INTEGER,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (created_by) REFERENCES users(id)
        )
    `, (err) => {
        if (err) {
            console.error('Ошибка создания таблицы shifts:', err);
        } else {
            console.log('✅ Таблица shifts готова');
            // Добавляем демо-данные после создания таблицы
            addDemoData();
        }
    });

    // Функция добавления демо-данных
    const addDemoData = () => {
        // Сначала создаем пользователей
        const createUsersAndShifts = async () => {
            // Создаем администратора
            await createUserIfNotExists('admin', 'admin123', 'Администратор системы', 'Управление', 'admin');
            // Создаем рабочих
            await createUserIfNotExists('worker', 'worker123', 'Ержан Садыков', 'Сборочный цех', 'worker');
            await createUserIfNotExists('ivanov', '123456', 'Иванов Петр', 'Литейный цех', 'worker');
            await createUserIfNotExists('petrov', '123456', 'Петров Сергей', 'Сборочный цех', 'worker');
            await createUserIfNotExists('sidorov', '123456', 'Сидоров Алексей', 'Механосборочный', 'worker');
            
            // Проверяем и добавляем смены
            db.get("SELECT COUNT(*) as count FROM shifts", [], (err, row) => {
                if (err) {
                    console.error('Ошибка проверки shifts:', err);
                    return;
                }
                if (row && row.count === 0) {
                    const demoShifts = [
                        ['Ержан Садыков', 'Сборочный цех', getDateString(0), 'День', 'основная бригада', 2],
                        ['Марат Кусаинов', 'Литейный цех', getDateString(0), 'Ночь', 'плавка', 2],
                        ['Алия Нуртазина', 'Механосборочный', getDateString(1), 'Вечер', 'контроль качества', 1],
                        ['Дамир Жумабаев', 'Сборочный цех', getDateString(2), 'Выходной', 'выходной по графику', 1],
                        ['Гульмира Оразова', 'Инструментальный', getDateString(2), 'День', 'наладка станков', 2],
                        ['Руслан Бектасов', 'Сборочный цех', getDateString(3), 'Ночь', 'срочный заказ', 1],
                        ['Тимур Нуржанов', 'Литейный цех', getDateString(3), 'День', 'плановая работа', 2],
                        ['Айгерим Сапар', 'Механосборочный', getDateString(4), 'Ночь', 'военная приемка', 1]
                    ];
                    
                    const stmt = db.prepare("INSERT INTO shifts (employee_name, workshop, shift_date, shift_type, note, created_by) VALUES (?, ?, ?, ?, ?, ?)");
                    for (const shift of demoShifts) {
                        stmt.run(shift);
                    }
                    stmt.finalize();
                    console.log('✅ Добавлены демо-смены');
                }
            });
        };
        
        createUsersAndShifts();
    };

    // Вспомогательная функция для создания пользователя
    const createUserIfNotExists = async (username, password, fullname, workshop, role) => {
        return new Promise((resolve) => {
            db.get("SELECT * FROM users WHERE username = ?", [username], async (err, row) => {
                if (err) {
                    console.error(`Ошибка проверки ${username}:`, err);
                    resolve();
                    return;
                }
                if (!row) {
                    const hashedPassword = await bcrypt.hash(password, 10);
                    db.run(
                        "INSERT INTO users (username, password, fullname, workshop, role) VALUES (?, ?, ?, ?, ?)",
                        [username, hashedPassword, fullname, workshop, role],
                        (err) => {
                            if (err) console.error(`Ошибка создания ${username}:`, err);
                            else console.log(`✅ Создан пользователь: ${username} (${role})`);
                            resolve();
                        }
                    );
                } else {
                    resolve();
                }
            });
        });
    };

    // Функция для получения даты (сегодня + дни)
    const getDateString = (daysOffset) => {
        const date = new Date();
        date.setDate(date.getDate() + daysOffset);
        return date.toISOString().split('T')[0];
    };
};

module.exports = { db, initializeDatabase };