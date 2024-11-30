const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());

//Search endpoints
const autocompleteRoutes = require('./routes/autocompleteRoutes.js');
const searchRoutes = require('./routes/searchRoutes.js');
app.use('/api', autocompleteRoutes);
app.use('/api', searchRoutes);

//Mapbox endpoints
const locationRoutes = require('./routes/locationRoutes.js');
app.use('/api', locationRoutes);

//Product endpoints
const productRoutes = require('./routes/productRoutes.js');
app.use('/api', productRoutes);

module.exports = app;