const express = require('express');
const { autocompleteProducts } = require('../controllers/autocompleteController'); // Import correctly

const router = express.Router();

// Route to handle autocomplete requests
router.get('/autocomplete/:searchText', autocompleteProducts); // Use the correct function

module.exports = router;
