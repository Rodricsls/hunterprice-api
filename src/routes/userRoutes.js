const express = require('express');
const { signUp, login, verify } = require('../controllers/userController');

const router = express.Router();

// Ruta para signup
router.post('/signup', signUp);

// Ruta para login
router.post('/login', login);

// Ruta para verificar el token
router.post('/verify', verify);

module.exports = router;
