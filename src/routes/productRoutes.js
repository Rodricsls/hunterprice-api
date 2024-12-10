// src/routes/productRoutes.js

const express = require('express');
const { 
updateProductViews, getProducts, getRecentlyAdded,
getSingleProduct, getSubcategories, getSubcategoryProducts, getMostViewed , rateProduct, productRating, getUserRating,
likeProduct, dislikeProduct, verifyLike
} = require('../controllers/productController.js');

const router = express.Router();

// Route to update product views
router.post('/update-vistas', updateProductViews);

router.get('/getProducts/:categoriaid', getProducts);
router.get('/getSingleProduct/:productoid', getSingleProduct);
router.get('/getSubcategories/:categoriaid', getSubcategories);
router.get('/getSubcategoryProducts/:categoriaid', getSubcategoryProducts);
router.get('/getRecentlyAdded', getRecentlyAdded);
router.get('/getMostViewed', getMostViewed);
router.post('/rateProduct', rateProduct);

router.get('/productRating/:productId', productRating);
router.get('/getUserRating', getUserRating);
router.post('/likeProduct', likeProduct);
router.post('/dislikeProduct', dislikeProduct);
router.get('/verifyLike/:userId/:productId', verifyLike);

module.exports= router;
