const {pool}= require('../config/postgresconfig.js');

const updateProductViews = async (req, res) => {
    const productoid = req.query.identifier; // Identifier of the product
  
    // Validate that the identifier is present
    if (!productoid) {
      return res.status(400).json({ error: "The identifier is required." });
    }
  
    try {
      // Increment the product views
      const updateQuery = `
        UPDATE productos 
        SET vistas = vistas + 1 
        WHERE identifier = $1 
        RETURNING *`;
      const { rows } = await pool.query(updateQuery, [productoid]);
  
      // If no product is found, return a 404 error
      if (rows.length === 0) {
        return res.status(404).json({ error: "The product was not found." });
      }
  
      // Return the updated product
      res.status(200).json({
        message: "Views  updated successfully.",
        producto: rows[0],
      });
    } catch (error) {
      console.error("Server error:", error.message);
      res.status(500).json({ error: "Server internal error." });
    }
  };

  module.exports = {
    updateProductViews,
  };