// src/routes/productRoutes.js

const express = require('express');
const { updateProductViews } = require('../controllers/productController.js');

const router = express.Router();

// Route to update product views
router.post('/update-vistas', updateProductViews);

module.exports= router;
