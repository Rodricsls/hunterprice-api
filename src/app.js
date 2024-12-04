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

//Image endpoints
const imageRoutes = require('./routes/imageRoutes.js');
app.use('/api', imageRoutes);

//User endpoints
const userRoutes = require('./routes/userRoutes.js');
app.use('/api', userRoutes);

module.exports = app;