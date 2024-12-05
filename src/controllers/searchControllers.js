const {getCollection} = require('../config/mongoconfig'); 

const searchProducts = async (req, res) => {
  const collection = await getCollection();
  try {
      // Obtain the search query from the request
      const searchText = req.query.searchText || ''; // Search query from the request
      const page = parseInt(req.query.page || '0'); // Actual page number (default 0)
      const pageSize = parseInt(req.query.pageSize || '10'); // Page size (default 10)


      console.log('Search query:', searchText);
      console.log('Page:', page);
      console.log('Page size:', pageSize);

      // Aggregation pipeline to search for products
      const aggregateQuery = [
          {
              $search: {
                  index: 'default',
                  text: {
                      query: searchText,
                      path: {
                          wildcard: '*',
                      },
                      synonyms: 'synonym_mapping',
                  },
              },
          },
          {
              $project: {
                  _id: 1,
                  productoid: 1,
                  imagenurl: 1,
                  nombreDisplay: 1,
                  marca: {
                    $arrayElemAt: [
                      {
                        $filter: {
                          input: "$caracteristicas",
                          as: "caracteristica",
                          cond: { $eq: ["$$caracteristica.nombre", "marca"] }, // Filtra por nombre === 'marca'
                        },
                      },
                      0, // Obtiene el primer objeto del resultado filtrado
                    ],
                  },
              },
          },
      ];

      // Add a `$count` stage to calculate total matching documents
      const totalDocumentsQuery = [
          ...aggregateQuery,
          { $count: "total" }
      ];

      // Execute the count aggregation to get the total matching documents
      const countResult = await collection.aggregate(totalDocumentsQuery).toArray();
      const totalDocuments = countResult.length > 0 ? countResult[0].total : 0;

      // Add pagination stages to the pipeline
      aggregateQuery.push(
          { $skip: page * pageSize },
          { $limit: pageSize }
      );

      // Execute the main aggregation pipeline
      const results = await collection.aggregate(aggregateQuery).toArray();

      // Return the search results as a JSON response
      res.json({
          results,
          hasNextPage: (page + 1) * pageSize < totalDocuments, // Check if there's a next page
      });
  } catch (error) {
      console.error('Error searching products:', error);
      res.status(500).json({ error: 'Error executing the search query' });
  }
};

module.exports = {searchProducts};