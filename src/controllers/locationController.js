const {pool} = require('../config/postgresconfig');
const axios = require('axios');
const dotenv = require('dotenv');
dotenv.config();

const getNearestLocation = async (req, res) => {
    const longitud = req.query.longitud || '';// Longitude from query parameters
    const latitud = req.query.latitud || ''; // Latitude from query parameters
    const tienda = req.query.tienda; // Store ID from query parameters

    // Check if the required parameters are provided
    if (!longitud || !latitud || !tienda) {
      return res.status(400).json({ error: 'The required parameters are missing.' });
    }
  
    try {
        // Query to get the store's location
      const query = `
        SELECT L.nombre_tienda, L.direccion, L.longitud, L.latitud
        FROM locaciones L
        INNER JOIN tiendas T ON L.id_tienda = T.id
        WHERE T.id = $1;
      `;
      const { rows } = await pool.query(query, [tienda]);// Execute the query
  
      if (rows.length === 0) {
        return res.status(404).json({ error: 'No stores were found for the provided ID.' });// If no store is found
      }
      
      // Get the store's location
      const mapboxQueries = rows.map((location) => {
        const { longitud: storeLong, latitud: storeLat } = location;
        return `${longitud},${latitud};${storeLat},${storeLong}`;
      });
  
      const distances = await Promise.all(
        mapboxQueries.map(async (query, index) => {

            // Calculate the distance between the user's location and the store's location
          try {
            const response = await axios.get(
              `https://api.mapbox.com/directions/v5/mapbox/driving/${query}?alternatives=true&geometries=polyline&language=en&overview=full&steps=true&access_token=${process.env.MAPBOX_TOKEN}`
            );
  
            const distanceInMeters = response.data.routes[0].distance;// Distance in meters
            const distanceInKm = (distanceInMeters / 1000).toFixed(2);// Distance in kilometers
            return { ...rows[index], distanceInKm };
          } catch (error) {
            console.error('Error calculating distance with Mapbox:', error.message);
            return { ...rows[index], distanceInKm: null };
          }
        })
      );
    // Sort the distances in ascending order
      const nearestLocation = distances.sort((a, b) => parseFloat(a.distanceInKm) - parseFloat(b.distanceInKm))[0];
      res.json(nearestLocation);
    } catch (error) {
      console.error('Server in the error:', error.message);
      res.status(500).json({ error: 'Server internal error .' });
    }
  };

  const getLocationsByStore = async (req, res) => {
    const tienda = req.query.tienda;
  
    if (!tienda) {
      return res.status(400).json({ error: "The 'tienda' parameter is required." });
    }
  
    try {
      const query = `
        SELECT L.nombre_tienda, L.direccion, L.longitud, L.latitud
        FROM locaciones L
        INNER JOIN tiendas T ON L.id_tienda = T.id
        WHERE T.id = $1;
      `;
      const { rows } = await pool.query(query, [tienda]);
  
      if (rows.length === 0) {
        return res.status(404).json({ error: "No stores found for the given ID" });
      }
  
      res.json(rows);
    } catch (error) {
      console.error("Server error:", error.message);
      res.status(500).json({ error: "Server internal error." });
    }
  };
  module.exports = {
    getNearestLocation,
    getLocationsByStore,
  };