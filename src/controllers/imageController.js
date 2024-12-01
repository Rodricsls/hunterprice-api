const axios = require('axios');

const sendImageToCBIR = async (req, res)=>{

    try{

        if(!req.file){
            return res.status(400).json({ error: "No image file provided" });
        }

        //Buffer of the image
        const imageBuffer = req.file.buffer;
        console.log(imageBuffer);

        /* 
            Here we have to send the image to the CBIR server

        */
       res.status(200).json({ message: "Image sent to CBIR server" }); //We have to send the data too

    }catch(error){

        console.error("Error:", error);
        res.status(500).json({ error: "Internal Server Error" });

    }

}

module.exports = {
    sendImageToCBIR
}