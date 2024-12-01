const express = require('express');
const router = express.Router();
const upload = require('../middlewares/multerMiddleware.js');
const { sendImageToCBIR } = require('../controllers/imageController.js');

// Route to handle image upload
router.post('/upload-image', upload.single('image'), sendImageToCBIR);

module.exports = router;