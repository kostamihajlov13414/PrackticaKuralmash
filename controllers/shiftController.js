const { db } = require('../config/database');

// Получить все смены
const getAllShifts = (req, res) => {
    db.all("SELECT * FROM shifts ORDER BY shift_date DESC, id DESC", [], (err, shifts) => {
        if (err) {
            return res.status(500).json({ error: 'Ошибка загрузки' });
        }
        res.json(shifts);
    });
};

// Получить смены только своего цеха (для рабочего)
const getMyWorkshopShifts = (req, res) => {
    const workshop = req.user.workshop;
    db.all("SELECT * FROM shifts WHERE workshop = ? ORDER BY shift_date DESC, id DESC", [workshop], (err, shifts) => {
        if (err) {
            return res.status(500).json({ error: 'Ошибка загрузки' });
        }
        res.json(shifts);
    });
};

const getShiftById = (req, res) => {
    const { id } = req.params;
    db.get("SELECT * FROM shifts WHERE id = ?", [id], (err, shift) => {
        if (err || !shift) {
            return res.status(404).json({ error: 'Смена не найдена' });
        }
        res.json(shift);
    });
};

const createShift = (req, res) => {
    const { employee_name, workshop, shift_date, shift_type, note } = req.body;
    
    if (!employee_name || !workshop || !shift_date || !shift_type) {
        return res.status(400).json({ error: 'Заполните все обязательные поля' });
    }

    db.run(
        "INSERT INTO shifts (employee_name, workshop, shift_date, shift_type, note, created_by) VALUES (?, ?, ?, ?, ?, ?)",
        [employee_name, workshop, shift_date, shift_type, note || '', req.user.id],
        function(err) {
            if (err) {
                return res.status(500).json({ error: 'Ошибка создания' });
            }
            res.status(201).json({ id: this.lastID, message: 'Смена добавлена' });
        }
    );
};

const updateShift = (req, res) => {
    const { id } = req.params;
    const { employee_name, workshop, shift_date, shift_type, note } = req.body;

    db.run(
        "UPDATE shifts SET employee_name = ?, workshop = ?, shift_date = ?, shift_type = ?, note = ? WHERE id = ?",
        [employee_name, workshop, shift_date, shift_type, note, id],
        function(err) {
            if (err || this.changes === 0) {
                return res.status(404).json({ error: 'Смена не найдена' });
            }
            res.json({ message: 'Смена обновлена' });
        }
    );
};

const deleteShift = (req, res) => {
    const { id } = req.params;
    
    db.run("DELETE FROM shifts WHERE id = ?", [id], function(err) {
        if (err || this.changes === 0) {
            return res.status(404).json({ error: 'Смена не найдена' });
        }
        res.json({ message: 'Смена удалена' });
    });
};

const getStats = (req, res) => {
    let query = "SELECT COUNT(*) as total, SUM(CASE WHEN shift_type = 'День' THEN 1 ELSE 0 END) as day, SUM(CASE WHEN shift_type = 'Ночь' THEN 1 ELSE 0 END) as night, SUM(CASE WHEN shift_type = 'Вечер' THEN 1 ELSE 0 END) as evening FROM shifts";
    let params = [];
    
    if (req.user.role !== 'admin') {
        query = "SELECT COUNT(*) as total, SUM(CASE WHEN shift_type = 'День' THEN 1 ELSE 0 END) as day, SUM(CASE WHEN shift_type = 'Ночь' THEN 1 ELSE 0 END) as night, SUM(CASE WHEN shift_type = 'Вечер' THEN 1 ELSE 0 END) as evening FROM shifts WHERE workshop = ?";
        params = [req.user.workshop];
    }
    
    db.get(query, params, (err, stats) => {
        if (err) {
            return res.status(500).json({ error: 'Ошибка статистики' });
        }
        res.json(stats || { total: 0, day: 0, night: 0, evening: 0 });
    });
};

// НОВЫЕ МЕТОДЫ для получения списков
const getEmployees = (req, res) => {
    db.all("SELECT DISTINCT employee_name FROM shifts ORDER BY employee_name", [], (err, employees) => {
        if (err) {
            return res.status(500).json({ error: 'Ошибка загрузки сотрудников' });
        }
        // Также добавляем сотрудников из таблицы users
        db.all("SELECT DISTINCT fullname as employee_name FROM users WHERE role = 'worker' ORDER BY fullname", [], (err, users) => {
            if (!err && users) {
                const allEmployees = [...employees, ...users];
                const unique = [...new Map(allEmployees.map(e => [e.employee_name, e])).values()];
                unique.sort((a, b) => a.employee_name.localeCompare(b.employee_name));
                res.json(unique);
            } else {
                res.json(employees);
            }
        });
    });
};

const getWorkshops = (req, res) => {
    db.all("SELECT DISTINCT workshop FROM shifts ORDER BY workshop", [], (err, workshops) => {
        if (err) {
            return res.status(500).json({ error: 'Ошибка загрузки цехов' });
        }
        // Добавляем цеха из таблицы users
        db.all("SELECT DISTINCT workshop FROM users ORDER BY workshop", [], (err, userWorkshops) => {
            if (!err && userWorkshops) {
                const allWorkshops = [...workshops, ...userWorkshops];
                const unique = [...new Map(allWorkshops.map(w => [w.workshop, w])).values()];
                unique.sort((a, b) => a.workshop.localeCompare(b.workshop));
                res.json(unique);
            } else {
                res.json(workshops);
            }
        });
    });
};

module.exports = { 
    getAllShifts, 
    getMyWorkshopShifts, 
    getShiftById, 
    createShift, 
    updateShift, 
    deleteShift, 
    getStats,
    getEmployees,
    getWorkshops
};
