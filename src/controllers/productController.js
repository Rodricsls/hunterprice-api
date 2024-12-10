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

  const getProducts = async (req, res) => {
    const { categoriaid } = req.params;
    
    // Validate that the identifier is present
    if (!categoriaid) {
      return res.status(400).json({ error: "The identifier is required." });
    }

    
    const query = categoriaid === "1"
    ? `
          SELECT P.identifier, P."nombreDisplay", P.imagenurl, CC.nombrecaracteristica, VCP.valor
          FROM public.productos P
          INNER JOIN public.valorescaracteristicasproducto VCP ON P.identifier = VCP.productoid
          INNER JOIN public.caracteristicascategoria CC ON CC.id = VCP.caracteristicaid
          WHERE P.categoriaid = $1 AND VCP.caracteristicaid = 1;
        `
    : `
          SELECT P.identifier, P."nombreDisplay", P.imagenurl, CC.nombrecaracteristica, VCP.valor
          FROM public.productos P
          INNER JOIN public.valorescaracteristicasproducto VCP ON P.identifier = VCP.productoid
          INNER JOIN public.caracteristicascategoria CC ON CC.id = VCP.caracteristicaid
          WHERE P.categoriaid = $1 AND VCP.caracteristicaid = 6;
        `;
      try{

        const result = await pool.query(query, [categoriaid]);
        return res.status(200).json(result.rows);
      }catch(error){
        console.error("Database error:", error);
        return res.status(400).json({ error: "Unable to fetch data" });
      }
  }

  const getRecentlyAdded = async (req, res) => {

    const RecentlyAddedQuery =  `
                                SELECT P.identifier, P."nombreDisplay", P.reg_date, P.imagenurl, VCP.valor 
                                FROM public.productos P
                                INNER JOIN public.valorescaracteristicasproducto VCP ON P.identifier = VCP.productoid
                                INNER JOIN public.caracteristicascategoria CC ON CC.id = VCP.caracteristicaid
                                WHERE VCP.caracteristicaid = 1 OR VCP.caracteristicaid = 6
                                ORDER BY P.reg_date DESC 
                                LIMIT 10;
                            `;
    try{
      const result = await pool.query(RecentlyAddedQuery);
      return res.status(200).json(result.rows);

    }catch(error){
      console.error("Database error:", error);
      return res.status(400).json({ error: "Unable to fetch data" });
      
    }  

  }

  const getSingleProduct = async (req, res) => {
    const { productoid } = req.params;



    const CharacteristicsQuery =  `
                                SELECT identifier, nombre, imagenurl, valor, nombrecaracteristica
                                FROM public.productos P
                                INNER JOIN public.valorescaracteristicasproducto VCP ON P.identifier = VCP.productoid
                                INNER JOIN public.caracteristicascategoria CC ON CC.id = VCP.caracteristicaid
                                WHERE P.identifier = $1;
                               `;

    const StoresQuery =  `
                          SELECT PT.tiendaid, PT.precio, PT.referencia, T.nombre
                          FROM public.productostiendas PT
                          INNER JOIN public.tiendas T ON PT.tiendaid = T.id
                          WHERE PT.productoid = $1;
                          `;

    try{
      const product =  {
        productoid : "",
        Nombre:  "",
        ImagenURL:  "",
        Caracteristicas: {
         
        },
        Tiendas: {
         
        },
        Referencias: {
            
          },
        Precios: {
          
        },
      }
      const infoCaracteristicas = await pool.query(CharacteristicsQuery, [productoid]);
      for (const row of infoCaracteristicas.rows){
        product.productoid = row.identifier;
        product.Nombre = row.nombre;
        product.ImagenURL = row.imagenurl;
        product.Caracteristicas[row.nombrecaracteristica] = row.valor;
      }
      const infoTiendas = await pool.query(StoresQuery, [productoid]);
      let storeCounter = 0;
      for(const row of infoTiendas.rows){
        product.Tiendas[row.tiendaid] = row.nombre;
        product.Referencias[row.nombre] = row.referencia;
        product.Precios[row.nombre] = row.precio
      }


      return res.status(200).json(product);
    }catch(error){
      console.error("Database error:", error);
      return res.status(400).json({ error: "Unable to fetch data" });
    }
    

  }

  const getSubcategories = async (req, res) => {
    const { categoriaid } = req.params;
    const SubcategoriesQuery =  `
                            SELECT  DISTINCT (nombre), id
                            FROM public.categorias
                            WHERE parent_id = $1
                            `;
    try{

      const result = await pool.query(SubcategoriesQuery, [categoriaid]);
      return res.status(200).json(result.rows)
    }catch(error){
      console.error("Database error:", error);
      return res.status(400).json({ error: "Unable to fetch data" }, 500);
    }
  }

  const getSubcategoryProducts = async (req, res) => {
    const { categoriaid } = req.params;
    const SubcategorieProductsQuery =  `
                                    SELECT P.identifier, P."nombreDisplay", P.imagenurl 
                                    FROM public.productos P INNER JOIN public.categorias C ON P.categoriaid = C.id
                                    WHERE  C.parent_id = $1 OR P.categoriaid = $1
                            `;
    try{

      const result = await pool.query(SubcategorieProductsQuery, [categoriaid]);
      return res.status(200).json(result.rows)
    }catch(error){
      console.error("Database error:", error);
      return res.status(400).json({ error: "Unable to fetch data" });
    } 

  }

  const getMostViewed = async (req, res) => {
    const MostViewedQuery =  `
                            SELECT P.identifier, P."nombreDisplay", P.reg_date, P.imagenurl, VCP.valor, P.vistas
                            FROM public.productos P
                            INNER JOIN public.valorescaracteristicasproducto VCP ON P.identifier = VCP.productoid
                            INNER JOIN public.caracteristicascategoria CC ON CC.id = VCP.caracteristicaid
                            WHERE VCP.caracteristicaid = 1 OR VCP.caracteristicaid = 6
                            ORDER BY vistas DESC 
                            LIMIT 10;
                            `;
    try{

      const result = await pool.query(MostViewedQuery);
      return res.status(200).json(result.rows)
    }catch(error){
      console.error("Database error:", error);
      return res.status(400).json({ error: "Unable to fetch data" });
    } 
  }


  const  rateProduct = async (req, res) => {
    const { userId, productId, rating } = req.body;
    console.log(req.body);
  
    if (!userId || !productId || !rating) {
      return res.status(400).json({ error: 'Todos los campos son requeridos: userId, productId, rating' });
    }
  
    try {
      const client = await pool.connect();
  
      // Verificar si ya existe una calificación para este usuario y producto
      const checkQuery = `
        SELECT id FROM calificaciones
        WHERE "user" = $1 AND product = $2
      `;
      const checkResult = await client.query(checkQuery, [userId, productId]);
  
      if (checkResult.rows.length > 0) {
        // Si ya existe una calificación, actualiza
        const updateQuery = `
          UPDATE calificaciones
          SET calificacion = $1
          WHERE id = $2
        `;
        await client.query(updateQuery, [rating, checkResult.rows[0].id]);
        res.status(200).json({ message: 'Calificación actualizada correctamente' });
      } else {
        // Si no existe, inserta una nueva calificación
        const insertQuery = `
          INSERT INTO calificaciones ("user", product, calificacion)
          VALUES ($1, $2, $3)
        `;
        await client.query(insertQuery, [userId, productId, rating]);
        res.status(201).json({ message: 'Calificación registrada correctamente' });
      }
  
      client.release();
    } catch (error) {
      console.error('Error manejando calificación:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  };

  const productRating = async (req, res) => {
    const { productId } = req.params;
  
    try {
      const client = await pool.connect();
  
      // Obtener todas las calificaciones del producto
      const query = `
        SELECT calificacion, COUNT(*) AS count
        FROM calificaciones
        WHERE product = $1
        GROUP BY calificacion
        ORDER BY calificacion DESC
      `;
      const result = await client.query(query, [productId]);
  
      // Calcular el promedio de calificaciones
      const averageQuery = `
        SELECT AVG(calificacion) AS average, COUNT(*) AS total
        FROM calificaciones
        WHERE product = $1
      `;
      const averageResult = await client.query(averageQuery, [productId]);
  
      const ratings = result.rows;
      const average = parseFloat(averageResult.rows[0].average).toFixed(1);
      const totalRatings = parseInt(averageResult.rows[0].total);
  
      client.release();
  
      res.status(200).json({ ratings, average, totalRatings });
    } catch (error) {
      console.error('Error obteniendo calificaciones:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  };


  
  // Obtener la calificación del usuario para un producto
  const getUserRating = async (req, res) => {
    const { userId, productId } = req.query;
  
    if (!userId || !productId) {
      return res.status(400).json({
        error: 'Todos los campos son requeridos: userId, productId',
      });
    }
  
    try {
      const client = await pool.connect();
  
      // Consulta para obtener la calificación
      const query = `
        SELECT calificacion
        FROM calificaciones
        WHERE "user" = $1 AND product = $2
      `;
      const result = await client.query(query, [userId, productId]);
  
      // Retorna la calificación o 0 si no existe
      const userRating = result.rows.length > 0 ? result.rows[0].calificacion : 0;
  
      res.status(200).json({
        rating: userRating,
      });
  
      client.release();
    } catch (error) {
      console.error('Error obteniendo calificación:', error);
      res.status(500).json({
        error: 'Error interno del servidor',
      });
    }
  };
  
  const likeProduct = async (req, res) => {
    const { userId, productId } = req.body;
    console.log(req.body);
  
    // Validate required fields
    if (!userId || !productId) {
      return res.status(400).json({ error: 'Todos los campos son requeridos: userId, productId' });
    }
  
    try {
      const client = await pool.connect();
  
      // Check if a favorite already exists for this user and product
      const checkQuery = `
        SELECT usuarioid FROM favoritos
        WHERE "usuarioid" = $1 AND productoid = $2
      `;
      const checkResult = await client.query(checkQuery, [userId, productId]);
  
      if (checkResult.rows.length <= 0) {
        // If no favorite exists, insert a new one
        const insertQuery = `
          INSERT INTO favoritos ("usuarioid", productoid)
          VALUES ($1, $2)
        `;
        await client.query(insertQuery, [userId, productId]);
        res.status(201).json({ message: 'Favorito registrado correctamente' });
      }else{
        //it is already liked
        res.status(200).json({ message: 'Ya le diste like a este producto' });
      }
  
      client.release();
    } catch (error) {
      console.error('Error manejando favorito:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  };

  const dislikeProduct = async (req, res) => {
    const { userId, productId } = req.body;
    console.log(req.body);
  
    // Validate required fields
    if (!userId || !productId) {
      return res.status(400).json({ error: 'Todos los campos son requeridos: userId, productId' });
    }
  
    try {
      const client = await pool.connect();
  
      // Check if the favorite exists for this user and product
      const checkQuery = `
        SELECT usuarioid FROM favoritos
        WHERE "usuarioid" = $1 AND productoid = $2
      `;
      const checkResult = await client.query(checkQuery, [userId, productId]);
  
      if (checkResult.rows.length > 0) {
        // If a favorite exists, delete it
        const deleteQuery = `
          DELETE FROM favoritos
          WHERE usuarioid = $1 AND productoid = $2
        `;
        await client.query(deleteQuery, [userId, productId]);
        res.status(200).json({ message: 'Favorito eliminado correctamente' });
      } else {
        // If no favorite exists, return a not found message
        res.status(404).json({ message: 'No existe un favorito para eliminar' });
      }
  
      client.release();
    } catch (error) {
      console.error('Error eliminando favorito:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  };
  
  const verifyLike = async (req, res) => {
    const { userId, productId } = req.params;
    console.log(req.params);
  
    // Validate required fields
    if (!userId || !productId) {
      return res.status(400).json({ error: 'Todos los campos son requeridos: userId, productId' });
    }
  
    try {
      const client = await pool.connect();
  
      // Check if the user has liked the product
      const checkQuery = `
        SELECT usuarioid FROM favoritos
        WHERE "usuarioid" = $1 AND productoid = $2
      `;
      const checkResult = await client.query(checkQuery, [userId, productId]);
  
      if (checkResult.rows.length > 0) {
        // If the like exists, return a success response
        res.status(200).json({ liked: true, message: 'El usuario ha dado like a este producto.' });
      } else {
        // If the like does not exist, return a not found response
        res.status(200).json({ liked: false, message: 'El usuario no ha dado like a este producto.' });
      }
  
      client.release();
    } catch (error) {
      console.error('Error verificando like:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  };
  
  
 
  
  
  

  module.exports = {
    updateProductViews,
    getProducts,
    getRecentlyAdded,
    getSingleProduct,
    getSubcategories,
    getSubcategoryProducts,
    getMostViewed, 
    rateProduct, 
    productRating,
    getUserRating,
    likeProduct,
    dislikeProduct,
    verifyLike,
  };