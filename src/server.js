require('dotenv').config();
const app = require('./app'); //Import the app configuration
const connectDatabase = require('./config/database');//IConnect to the database

//Configuration of the server port
const PORT = process.env.SERVER_PORT || 3000;

async function startServer() {
  try {

    await connectDatabase();//Connect to the database

    //Start the server
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });

  } catch (error) {
    console.log(error);
    process.exit(1);
  }
}

startServer();

