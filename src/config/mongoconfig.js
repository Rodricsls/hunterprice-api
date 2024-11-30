const { MongoClient } = require('mongodb');
const dotenv = require('dotenv');

dotenv.config(); // Load environment variables from .env file

// Create a new MongoClient instance
let client;
let collection;

// Function to connect to MongoDB
async function connectMongoDB() {
  try {
    // Create a new MongoClient instance
    client = new MongoClient(process.env.MONGO_URL);

    // Connect to the MongoDB server
    await client.connect();
    console.log('Connecting to MongoDB...');

    // Select the database and collection
    const db = client.db(process.env.MONGO_NAME);
    collection = db.collection(process.env.MONGO_COLLECTION);

    return { db, collection }; // Return the collection
  } catch (error) {
    console.error('Error to connect with mongo: ', error);
    process.exit(1); // End the process with an error code
  }
}

// Function to close the MongoDB connection
async function closeMongoDBConnection() {
  try {
    if (client) {
      await client.close();
      console.log('Mongo DB connection closed');
    }
  } catch (error) {
    console.error('Error at closing mongoDB: ', error);
  }
}

//Export the collection

module.exports = {
  connectMongoDB,
  closeMongoDBConnection,
  getCollection: () => collection,
};
