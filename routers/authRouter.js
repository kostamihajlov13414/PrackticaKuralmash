const express = require('express');
const { register, login, logout, getMe, getAllUsers } = require('../controllers/authController');
const { authenticateToken, authorizeAdmin } = require('../middleware/auth');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);
router.get('/me', authenticateToken, getMe);
router.get('/users', authenticateToken, authorizeAdmin, getAllUsers);

module.exports = router;