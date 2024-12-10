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
    const userLat = req.query.userLat;
    const userLng = req.query.userLng;
    const destLat = req.query.destLat;
    const destLng = req.query.destLng;
    console.log("tienda", tienda);
    console.log("userLat", userLat);
    console.log("userLng", userLng);
    console.log("destLat", destLat);
    console.log("destLng", destLng);
    
  
    if (!tienda) {
      return res.status(400).json({ error: "El parámetro 'tienda' es obligatorio." });
    }
  
    try {
      // Consulta para obtener las locaciones de la tienda
      const query = `
        SELECT L.nombre_tienda, L.direccion, L.longitud, L.latitud, T.logo_ref
        FROM locaciones L
        INNER JOIN tiendas T ON L.id_tienda = T.id
        WHERE T.id = $1;
      `;
      const { rows } = await pool.query(query, [tienda]);
      console.log("TRienda")
  
      if (rows.length === 0) {
        return res.status(404).json({ error: "No se encontraron tiendas para el ID proporcionado." });
      }
      console.log("Aca");
  
      // Si no se proporcionan coordenadas, devolver solo las locaciones
      if (!userLat || !userLng || !destLat || !destLng) {
        return res.json(rows);
      }
      console.log("aca 2")
  
      // Llamada al API de Mapbox Directions para calcular la ruta
      console.log(`https://api.mapbox.com/directions/v5/mapbox/driving/${userLng},${userLat};${destLng},${destLat}?geometries=geojson&access_token=${process.env.MAPBOX_TOKEN}`)
      const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${userLng},${userLat};${destLng},${destLat}?geometries=geojson&access_token=${process.env.MAPBOX_TOKEN}`;
      const routeResponse = await axios.get(url);
      console.log("respuesta: ",routeResponse);
  
      if (routeResponse.data.routes.length === 0) {
        return res.status(404).json({ error: "No se encontró una ruta." });
      }
  
      // Agregar la información de la ruta
      const routeData = {
        route: routeResponse.data.routes[0].geometry, // GeoJSON con la ruta
        duration: routeResponse.data.routes[0].duration, // Duración estimada en segundos
        distance: routeResponse.data.routes[0].distance, // Distancia en metros
      };
      console.log("Ruta: ",routeData);
  
      res.json({ locations: rows, route: routeData });
    } catch (error) {
      console.error("Error en el servidor:", error.message);
      res.status(500).json({ error: "Error interno del servidor." });
    }
  };
  module.exports = {
    getNearestLocation,
    getLocationsByStore,
  };