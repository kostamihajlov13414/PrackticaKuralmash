const express = require('express');
const { 
    getAllShifts, 
    getMyWorkshopShifts, 
    getShiftById, 
    createShift, 
    updateShift, 
    deleteShift, 
    getStats 
} = require('../controllers/shiftController');
const { authenticateToken, authorizeAdmin } = require('../middleware/auth');

const router = express.Router();

router.use(authenticateToken);

// Админ видит все смены, рабочий только своего цеха
router.get('/', (req, res) => {
    if (req.user.role === 'admin') {
        getAllShifts(req, res);
    } else {
        getMyWorkshopShifts(req, res);
    }
});

router.get('/stats', getStats);
router.get('/:id', getShiftById);
router.post('/', createShift);
router.put('/:id', updateShift);
router.delete('/:id', authorizeAdmin, deleteShift); // Только админ удаляет

module.exports = router;