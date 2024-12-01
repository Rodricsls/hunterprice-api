const {getCollection} = require('../config/mongoconfig'); 

const searchProducts = async (req, res)=>{
    const collection = await getCollection();
    try{

        //obtain the search query from the request
        const searchText = req.query.searchText || ''; // Seacrh query from the request
        const page = parseInt(req.query.page || '0'); // Actual page number (default 0)
        const pageSize = parseInt(req.query.pageSize || '10'); // page size (default 10)

        //Aggregation pipeline to search for products
        const aggregateQuery=[

            {
                $search: {
                  index: 'default',
                  text: {
                    query: searchText,
                    path: {
                      wildcard: '*',
                    },
                    fuzzy: {
                      maxEdits: 2,
                      maxExpansions: 50,
                    },
                  },
                },
              },
              {
                $project: {
                  _id: 0,
                  productoid: 1,
                  imagenurl: 1,
                  nombre_display: 1,
                  categoria_principal: 1,
                  caracteristicas: 1,
                },
              },
              {
                $skip: page * pageSize, // Skip the specified number of documents
              },
              {
                $limit: pageSize, // Only return the specified number of documents
            },

        ];

        //ecute the aggregation pipeline
        const results = await collection.aggregate(aggregateQuery).toArray();
        const totalDocuments = await collection.countDocuments(); // Total number of documents in the collection

        // Return the search results as a JSON response
        res.json({
            results,
            hasNextPage: page * pageSize + results.length < totalDocuments,
        });


    }catch(error){

        console.error('Error searching products:', error);
        res.status(500).json({ error: 'Error executing the search query' });

    }
    
}

module.exports = {searchProducts};