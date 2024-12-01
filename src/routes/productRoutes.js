// src/routes/productRoutes.js

const express = require('express');
const { 
updateProductViews, getProducts, getRecentlyAdded,
getSingleProduct, getSubcategories, getSubcategoryProducts, getMostViewed 
} = require('../controllers/productController.js');

const router = express.Router();

// Route to update product views
router.post('/update-vistas', updateProductViews);

router.get('/getProducts/:categoriaid', getProducts);
router.get('/getSingleProduct/:productoid', getSingleProduct);
router.get('/getSubcategories/:categoriaid', getSubcategories);
router.get('/getSubcategoryProducts/:categoriaName', getSubcategoryProducts);
router.get('/getRecentlyAdded', getRecentlyAdded);
router.get('/getMostViewed', getMostViewed);

module.exports= router;
