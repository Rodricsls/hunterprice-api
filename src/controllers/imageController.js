const axios = require('axios');
const {pool}= require('../config/postgresconfig.js');

const sendImageToCBIR = async (req, res)=>{

    try{

        if(!req.file){
            return res.status(400).json({ error: "No image file provided" });
        }
        console.log(">>>> HA ENTRADO UN NUEVO REQUEST <<<<")
        //Buffer of the image
        const imageBuffer = req.file.buffer;
        console.log("Enviando la imagen imageBuffer"); 
        console.log(imageBuffer)

        //Here we have to send the image to the CBIR server
        const response = await axios.post('http://127.0.0.1:8000/getSimilarProducts', imageBuffer, {
            headers: {
              'Content-Type': 'application/octet-stream', // Indicate raw binary data
            },
            maxContentLength: Infinity, // Allow large payloads
            maxBodyLength: Infinity,
          });
        
        console.log('Data:', response.data); // Response data
        const data = response.data;

        

        let similarProductsQuery = `
                                SELECT P.identifier, P."nombreDisplay", P.imagenurl, CC.nombrecaracteristica, VCP.valor
                                FROM public.productos P
                                INNER JOIN public.valorescaracteristicasproducto VCP ON P.identifier = VCP.productoid
                                INNER JOIN public.caracteristicascategoria CC ON CC.id = VCP.caracteristicaid
                                WHERE (VCP.caracteristicaid = 1 OR VCP.caracteristicaid = 6) AND (
                                `

        for(let i = 0; i < data.Resultados.length; i++){
            resultado = data.Resultados[i];
            if((i+1) ==  data.Resultados.length){
                similarProductsQuery += "P.identifier = \'" + resultado.identifier + "\' )";
            }else{
                similarProductsQuery += "P.identifier = \'" + resultado.identifier + "\' OR ";
            }
        }
        console.log("EL QUERY ES EL SIGUIENTE: ");
        console.log(similarProductsQuery);
        
        //Fetching the results from the database
        try{
            const result = await pool.query(similarProductsQuery);
            return res.status(200).json(result.rows);
        }catch(error){
            console.error("Database error:", error);
            return res.status(400).json({ error: "Unable to fetch data" });
        }
            
            
       

    }catch(error){

        console.error("Error:", error);
        res.status(500).json({ error: "Internal Server Error" });

    }

}

module.exports = {
    sendImageToCBIR
}