const express = require('express');
const { getNearestLocation, getLocationsByStore } = require('../controllers/locationController.js');

const router = express.Router();

// obtain the nearest location
router.get('/nearest-location', getNearestLocation);
router.get('/locations', getLocationsByStore);

module.exports = router;
