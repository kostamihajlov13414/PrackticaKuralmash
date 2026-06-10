const express = require('express');
const { 
    getAllShifts, 
    getMyWorkshopShifts, 
    getShiftById, 
    createShift, 
    updateShift, 
    deleteShift, 
    getStats,
    getEmployees,
    getWorkshops
} = require('../controllers/shiftController');
const { authenticateToken, authorizeAdmin } = require('../middleware/auth');

const router = express.Router();

router.use(authenticateToken);

// Новые маршруты для списков
router.get('/employees', getEmployees);
router.get('/workshops', getWorkshops);

router.get('/', (req, res) => {
    if (req.user.role === 'admin') {
        getAllShifts(req, res);
    } else {
        getMyWorkshopShifts(req, res);
    }
});

router.get('/stats', getStats);
router.get('/:id', getShiftById);
router.post('/', authorizeAdmin, createShift);
router.put('/:id', authorizeAdmin, updateShift);
router.delete('/:id', authorizeAdmin, deleteShift);

module.exports = router;
