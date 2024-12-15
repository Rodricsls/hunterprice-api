const { pool } = require("../config/postgresconfig.js");

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

  const query = `
  WITH RECURSIVE subcategories AS (
    SELECT id, nombre, parent_id
    FROM categorias
    WHERE id = $1

    UNION ALL


    SELECT c.id, c.nombre, c.parent_id
    FROM categorias c
    INNER JOIN subcategories sc ON c.parent_id = sc.id
)
SELECT
    p.identifier,
    p.nombre,
    p.imagenurl,
    p."nombreDisplay",
    v.valor AS marca
FROM
    productos p
INNER JOIN subcategories sc ON p.categoriaid = sc.id
INNER JOIN valorescaracteristicasproducto v ON p.identifier = v.productoid
INNER JOIN caracteristicascategoria cc ON v.caracteristicaid = cc.id
WHERE
    p.categoriaid IS NOT NULL
    AND cc.nombrecaracteristica = 'marca'
ORDER BY
    p.nombre ASC;
`;
  try {
    const result = await pool.query(query, [categoriaid]);
    return res.status(200).json(result.rows);
  } catch (error) {
    console.error("Database error:", error);
    return res.status(400).json({ error: "Unable to fetch data" });
  }
};

const getRecentlyAdded = async (req, res) => {
  const RecentlyAddedQuery = `
                                SELECT P.identifier, P."nombreDisplay", P.reg_date, P.imagenurl, VCP.valor 
                                FROM public.productos P
                                INNER JOIN public.valorescaracteristicasproducto VCP ON P.identifier = VCP.productoid
                                INNER JOIN public.caracteristicascategoria CC ON CC.id = VCP.caracteristicaid
                                WHERE VCP.caracteristicaid = 1 OR VCP.caracteristicaid = 6
                                ORDER BY P.reg_date DESC 
                                LIMIT 10;
                            `;
  try {
    const result = await pool.query(RecentlyAddedQuery);
    return res.status(200).json(result.rows);
  } catch (error) {
    console.error("Database error:", error);
    return res.status(400).json({ error: "Unable to fetch data" });
  }
};

const getSingleProduct = async (req, res) => {
  const { productoid } = req.params;

  const CharacteristicsQuery = `
                                SELECT identifier, nombre, imagenurl, valor, nombrecaracteristica
                                FROM public.productos P
                                INNER JOIN public.valorescaracteristicasproducto VCP ON P.identifier = VCP.productoid
                                INNER JOIN public.caracteristicascategoria CC ON CC.id = VCP.caracteristicaid
                                WHERE P.identifier = $1;
                               `;

  const StoresQuery = `
                          SELECT PT.tiendaid, PT.precio, PT.referencia, T.nombre
                          FROM public.productostiendas PT
                          INNER JOIN public.tiendas T ON PT.tiendaid = T.id
                          WHERE PT.productoid = $1;
                          `;

  try {
    const product = {
      productoid: "",
      Nombre: "",
      ImagenURL: "",
      Caracteristicas: {},
      Tiendas: {},
      Referencias: {},
      Precios: {},
    };
    const infoCaracteristicas = await pool.query(CharacteristicsQuery, [
      productoid,
    ]);
    for (const row of infoCaracteristicas.rows) {
      product.productoid = row.identifier;
      product.Nombre = row.nombre;
      product.ImagenURL = row.imagenurl;
      product.Caracteristicas[row.nombrecaracteristica] = row.valor;
    }
    const infoTiendas = await pool.query(StoresQuery, [productoid]);
    let storeCounter = 0;
    for (const row of infoTiendas.rows) {
      product.Tiendas[row.tiendaid] = row.nombre;
      product.Referencias[row.nombre] = row.referencia;
      product.Precios[row.nombre] = row.precio;
    }

    return res.status(200).json(product);
  } catch (error) {
    console.error("Database error:", error);
    return res.status(400).json({ error: "Unable to fetch data" });
  }
};

const getSubcategories = async (req, res) => {
  const { categoriaid } = req.params;
  const SubcategoriesQuery = `
                            SELECT  DISTINCT (nombre), id
                            FROM public.categorias
                            WHERE parent_id = $1
                            `;
  try {
    const result = await pool.query(SubcategoriesQuery, [categoriaid]);
    return res.status(200).json(result.rows);
  } catch (error) {
    console.error("Database error:", error);
    return res.status(400).json({ error: "Unable to fetch data" }, 500);
  }
};

const getSubcategoryProducts = async (req, res) => {
  const { categoriaid } = req.params;
  const SubcategorieProductsQuery = `
                                    SELECT P.identifier, P."nombreDisplay", P.imagenurl 
                                    FROM public.productos P INNER JOIN public.categorias C ON P.categoriaid = C.id
                                    WHERE  C.parent_id = $1 OR P.categoriaid = $1
                            `;
  try {
    const result = await pool.query(SubcategorieProductsQuery, [categoriaid]);
    return res.status(200).json(result.rows);
  } catch (error) {
    console.error("Database error:", error);
    return res.status(400).json({ error: "Unable to fetch data" });
  }
};

const getMostViewed = async (req, res) => {
  const MostViewedQuery = `
                            SELECT P.identifier, P."nombreDisplay", P.reg_date, P.imagenurl, VCP.valor AS marca, P.vistas
                            FROM public.productos P
                            INNER JOIN public.valorescaracteristicasproducto VCP ON P.identifier = VCP.productoid
                            INNER JOIN public.caracteristicascategoria CC ON CC.id = VCP.caracteristicaid
                            WHERE VCP.caracteristicaid = 1 OR VCP.caracteristicaid = 6
                            ORDER BY vistas DESC 
                            LIMIT 10;
                            `;
  try {
    const result = await pool.query(MostViewedQuery);
    return res.status(200).json(result.rows);
  } catch (error) {
    console.error("Database error:", error);
    return res.status(400).json({ error: "Unable to fetch data" });
  }
};

const rateProduct = async (req, res) => {
  const { userId, productId, rating } = req.body;
  console.log(req.body);

  if (!userId || !productId || !rating) {
    return res.status(400).json({
      error: "Todos los campos son requeridos: userId, productId, rating",
    });
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
      res
        .status(200)
        .json({ message: "Calificación actualizada correctamente" });
    } else {
      // Si no existe, inserta una nueva calificación
      const insertQuery = `
          INSERT INTO calificaciones ("user", product, calificacion)
          VALUES ($1, $2, $3)
        `;
      await client.query(insertQuery, [userId, productId, rating]);
      res
        .status(201)
        .json({ message: "Calificación registrada correctamente" });
    }

    client.release();
  } catch (error) {
    console.error("Error manejando calificación:", error);
    res.status(500).json({ error: "Error interno del servidor" });
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
    console.error("Error obteniendo calificaciones:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

// Obtener la calificación del usuario para un producto
const getUserRating = async (req, res) => {
  const { userId, productId } = req.query;

  if (!userId || !productId) {
    return res.status(400).json({
      error: "Todos los campos son requeridos: userId, productId",
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
    console.error("Error obteniendo calificación:", error);
    res.status(500).json({
      error: "Error interno del servidor",
    });
  }
};

const likeProduct = async (req, res) => {
  const { userId, productId } = req.body;
  console.log(req.body);

  // Validate required fields
  if (!userId || !productId) {
    return res
      .status(400)
      .json({ error: "Todos los campos son requeridos: userId, productId" });
  }

  try {
    // Check if a favorite already exists for this user and product
    const checkQuery = `
        SELECT usuarioid FROM favoritos
        WHERE "usuarioid" = $1 AND productoid = $2
      `;
    const checkResult = await pool.query(checkQuery, [userId, productId]);

    if (checkResult.rows.length <= 0) {
      // If no favorite exists, insert a new one
      const insertQuery = `
          INSERT INTO favoritos ("usuarioid", productoid)
          VALUES ($1, $2)
        `;
      await pool.query(insertQuery, [userId, productId]);
      res.status(201).json({ message: "Favorito registrado correctamente" });
    } else {
      //it is already liked
      res.status(200).json({ message: "Ya le diste like a este producto" });
    }
  } catch (error) {
    console.error("Error manejando favorito:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

const dislikeProduct = async (req, res) => {
  const { userId, productId } = req.body;
  console.log(req.body);

  // Validate required fields
  if (!userId || !productId) {
    return res
      .status(400)
      .json({ error: "Todos los campos son requeridos: userId, productId" });
  }

  try {
    // Check if the favorite exists for this user and product
    const checkQuery = `
        SELECT usuarioid FROM favoritos
        WHERE "usuarioid" = $1 AND productoid = $2
      `;
    const checkResult = await pool.query(checkQuery, [userId, productId]);
    console.log(checkResult);

    if (checkResult.rows.length > 0) {
      // If a favorite exists, delete it
      console.log("Aca");
      const deleteQuery = `
          DELETE FROM favoritos
          WHERE usuarioid = $1 AND productoid = $2
        `;
      await pool.query(deleteQuery, [userId, productId]);
      console.log("ya");
      res.status(200).json({ message: "Favorito eliminado correctamente" });
    } else {
      // If no favorite exists, return a not found message
      res.status(404).json({ message: "No existe un favorito para eliminar" });
    }
  } catch (error) {
    console.error("Error eliminando favorito:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

const verifyLike = async (req, res) => {
  const { userId, productId } = req.params;
  console.log(req.params);

  // Validate required fields
  if (!userId || !productId) {
    return res
      .status(400)
      .json({ error: "Todos los campos son requeridos: userId, productId" });
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
      res.status(200).json({
        liked: true,
        message: "El usuario ha dado like a este producto.",
      });
    } else {
      // If the like does not exist, return a not found response
      res.status(200).json({
        liked: false,
        message: "El usuario no ha dado like a este producto.",
      });
    }

    client.release();
  } catch (error) {
    console.error("Error verificando like:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

const getUserLikedProducts = async (req, res) => {
  const { userId } = req.params;

  if (!userId) {
    return res.status(400).json({ error: "User ID is required" });
  }

  try {
    const query = `
    SELECT DISTINCT ON (p.identifier)
    p.identifier, 
    p.nombre, 
    p.imagenurl, 
    p."nombreDisplay",
    v.valor AS marca
FROM 
    favoritos l
INNER JOIN productos p 
    ON l.productoid = p.identifier
LEFT JOIN valorescaracteristicasproducto v 
    ON p.identifier = v.productoid
LEFT JOIN caracteristicascategoria cc 
    ON v.caracteristicaid = cc.id 
WHERE 
    l.usuarioid = $1 AND cc.nombrecaracteristica = 'marca'

    `;

    const { rows } = await pool.query(query, [userId]);

    if (rows.length === 0) {
      return res
        .status(404)
        .json({ message: "No liked products found for this user." });
    }

    res.status(200).json({ likedProducts: rows });
  } catch (error) {
    console.error("Error fetching liked products:", error);
    res.status(500).json({ error: "Internal server error." });
  }
};

const recommendProducts = async (req, res) => {
  const { userId, productId } = req.params;

  try {
    // Get the category of the product being viewed
    const categoryQuery = `
      SELECT categoriaid FROM public.productos WHERE identifier = $1
    `;
    const categoryResult = await pool.query(categoryQuery, [productId]);

    if (categoryResult.rows.length === 0) {
      return res.status(404).json({ error: "Product not found." });
    }

    const categoryId = categoryResult.rows[0].categoriaid;

    // Fetch recommendations based on user searches
    const searchQuery = `
      SELECT DISTINCT p.identifier, p.nombre, p.imagenurl, p."nombreDisplay", v.valor AS marca, bu.tiempo
      FROM public.busquedas_usuario bu
      INNER JOIN public.productos p ON bu.identifier = p.identifier
      LEFT JOIN valorescaracteristicasproducto v 
        ON p.identifier = v.productoid
      LEFT JOIN caracteristicascategoria cc 
        ON v.caracteristicaid = cc.id 
      WHERE 
        bu.usuario_id = $1 
        AND p.categoriaid = $2
        AND p.identifier != $3 
        AND cc.nombrecaracteristica = 'marca'
      ORDER BY bu.tiempo DESC
      LIMIT 5
    `;
    const searchesResult = await pool.query(searchQuery, [
      userId,
      categoryId,
      productId,
    ]);

    if (searchesResult.rows.length > 0) {
      return res.status(200).json({ recommendations: searchesResult.rows });
    }

    // Fallback: Get top-rated products in the same category
    const ratingQuery = `
      SELECT p.identifier, p.nombre, p.imagenurl, p."nombreDisplay", v.valor AS marca
      FROM public.productos p
      LEFT JOIN public.calificaciones c ON p.identifier = c.product
      LEFT JOIN valorescaracteristicasproducto v 
        ON p.identifier = v.productoid
      LEFT JOIN caracteristicascategoria cc 
        ON v.caracteristicaid = cc.id 
      WHERE 
        p.categoriaid = $1 
        AND p.identifier != $2
        AND cc.nombrecaracteristica = 'marca'
      GROUP BY p.identifier, p.nombre, p.imagenurl, p."nombreDisplay", v.valor
      ORDER BY COALESCE(AVG(c.calificacion), 0) DESC
      LIMIT 5
    `;
    const ratingsResult = await pool.query(ratingQuery, [
      categoryId,
      productId,
    ]);

    if (ratingsResult.rows.length > 0) {
      return res.status(200).json({ recommendations: ratingsResult.rows });
    }

    // Fallback: Recommend most viewed products in the same category
    const fallbackQuery = `
      SELECT p.identifier, p.nombre, p.imagenurl, p."nombreDisplay", v.valor AS marca
      FROM public.productos p
      LEFT JOIN valorescaracteristicasproducto v 
        ON p.identifier = v.productoid
      LEFT JOIN caracteristicascategoria cc 
        ON v.caracteristicaid = cc.id 
      WHERE 
        p.categoriaid = $1 
        AND p.identifier != $2
        AND cc.nombrecaracteristica = 'marca'
      ORDER BY p.vistas DESC
      LIMIT 5
    `;
    const fallbackResult = await pool.query(fallbackQuery, [
      categoryId,
      productId,
    ]);

    if (fallbackResult.rows.length > 0) {
      return res.status(200).json({ recommendations: fallbackResult.rows });
    }

    // Ultimate fallback: Recommend most viewed products across all categories
    const globalFallbackQuery = `
      SELECT p.identifier, p.nombre, p.imagenurl, p."nombreDisplay", v.valor AS marca
      FROM public.productos p
      LEFT JOIN valorescaracteristicasproducto v 
        ON p.identifier = v.productoid
      LEFT JOIN caracteristicascategoria cc 
        ON v.caracteristicaid = cc.id 
      WHERE 
        cc.nombrecaracteristica = 'marca'
      ORDER BY p.vistas DESC
      LIMIT 5
    `;
    const globalFallbackResult = await pool.query(globalFallbackQuery);

    return res.status(200).json({ recommendations: globalFallbackResult.rows });
  } catch (error) {
    console.error("Error generating recommendations:", error);
    res.status(500).json({ error: "Internal server error." });
  }
};

// Controller to log user search
const logUserSearch = async (req, res) => {
  const { usuario_id, identifier } = req.body;

  // Validate input
  if (!usuario_id || !identifier) {
    return res
      .status(400)
      .json({ error: "usuario_id and identifier are required." });
  }

  try {
    // Insert the search log into the database
    const query = `
          INSERT INTO public.busquedas_usuario (tiempo, usuario_id, identifier)
          VALUES (NOW(), $1, $2)
      `;
    await pool.query(query, [usuario_id, identifier]);

    return res
      .status(201)
      .json({ message: "User search logged successfully." });
  } catch (error) {
    console.error("Error logging user search:", error);
    return res.status(500).json({ error: "Internal server error." });
  }
};

const getPriceHistory = async (req, res) => {
  const { productId } = req.params;

  try {
    const query = `
      SELECT 
          fp.fecha,
          fp.precio,
          p.nombre AS product_name,
          t.nombre AS store_name
      FROM 
          fechas_precios fp
      INNER JOIN 
          productos p ON fp.identifier = p.identifier
      INNER JOIN 
          tiendas t ON fp.tiendaid = t.id
      WHERE 
          fp.identifier = $1
      ORDER BY 
          fp.fecha ASC;
    `;

    const result = await pool.query(query, [productId]);
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching product price history:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const getCategoryPriceHistory = async (req, res) => {
  const { categoryId } = req.params;

  try {
    const query = `
      SELECT 
          fp.fecha,
          AVG(fp.precio) AS average_price,
          c.nombre AS category_name
      FROM 
          fechas_precios fp
      INNER JOIN 
          productos p ON fp.identifier = p.identifier
      INNER JOIN 
          categorias c ON p.categoriaid = c.id
      WHERE 
          c.id = $1
      GROUP BY 
          fp.fecha, c.nombre
      ORDER BY 
          fp.fecha ASC;
    `;

    const result = await pool.query(query, [categoryId]);
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching category price history:", error);
    res.status(500).json({ error: "Internal Server Error" });
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
  getUserLikedProducts,
  recommendProducts,
  logUserSearch,
  getPriceHistory,
  getCategoryPriceHistory,
};
