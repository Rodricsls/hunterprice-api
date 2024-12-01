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
          SELECT identifier, "nombreDisplay", imagenurl
          FROM public.productos
          WHERE categoriaid = $1;
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
                                WHERE VCP.caracteristicaid = 1 OR VCP.caracteristicaid = 5
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
                                SELECT DISTINCT(valor) 
                                FROM public.valorescaracteristicasproducto VCP
                                INNER JOIN public.productos P ON P.identifier = VCP.productoid
                                WHERE P.categoriaid = $1;
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
    const { categoriaName } = req.params;
    const SubcategorieProductsQuery =  `
                                      SELECT P.identifier, P."nombreDisplay", P.imagenurl 
                                      FROM public.valorescaracteristicasproducto VCP
                                      INNER JOIN public.productos P ON P.identifier = VCP.productoid
                                      WHERE VCP.valor = $1;
                            `;
    try{

      const result = await pool.query(SubcategorieProductsQuery, [categoriaName]);
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
                            WHERE VCP.caracteristicaid = 1 OR VCP.caracteristicaid = 5
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

  module.exports = {
    updateProductViews,
    getProducts,
    getRecentlyAdded,
    getSingleProduct,
    getSubcategories,
    getSubcategoryProducts,
    getMostViewed
  };