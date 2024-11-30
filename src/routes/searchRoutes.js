const express = require('express');
const {searchProducts} = require('../controllers/searchControllers');

const router = express.Router();

// Route to search products from MongoDB
router.get('/search', searchProducts);

module.exports = router;