const { Pool } = require("pg");
const dotenv =require('dotenv');
dotenv.config();

// Load environment variables from .env file
const pool = new Pool({             
  user: process.env.DB_USER,
  host: process.env.DB_HOSTNAME,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

// Export the pool and connect function
async function connectPostgres() {
  try {
    await pool.connect();// Connect to the database
    console.log('Connected to Postgres');
  } catch (error) {
    console.log(error);
    process.exit(1);
  }
}

// Export the pool and connect function
module.exports={
    pool,
    connectPostgres
}
