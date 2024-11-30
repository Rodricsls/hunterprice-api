const { getCollection } = require('../config/mongoconfig.js');

const autocompleteProducts = async (req, res) => {
  try {
    const searchText = req.params.searchText; // Obtain the search text from the request

    if (!searchText) {
      return res.status(400).json({ error: 'Search text is required' });
    }

    // Define the aggregation pipeline
    const aggregateQuery = [
      {
        $search: {
          index: 'default',
          autocomplete: {
            query: searchText, 
            path: 'nombre_producto', //field to search
            fuzzy: {
              maxEdits: 2, //allow 2 errors in the search
              prefixLength: 3, // require at least 3 characters
              maxExpansions: 50, // Limit the number of expansions
            },
          },
        },
      },
      {
        $project: {
          _id: 0, // Exclude the _id field from the results
          nombre_producto: 1, // Include only the nombre_producto field in the results
        },
      },
      {
        $limit: 4, // Limit the number of results to 4
      },
    ];

    //Obtain the collection from the database
    const collection = getCollection();
    const resultados = await collection.aggregate(aggregateQuery).toArray();
    return res.json(resultados);
  } catch (error) {
    console.error('Error searching products:', error);
    return res.status(500).json({ error: 'Unable to fetch data' });
  }
};


module.exports = { autocompleteProducts };