const {connectMongoDB} = require('./mongoconfig');
const {connectPostgres} = require('./postgresconfig');

// Connect to the databases
async function connectDatabase() {
    
    try{

        await connectMongoDB();//Connect to MongoDB
        await connectPostgres();//Connect to Postgres
        console.log('Connected to databases');

    }catch(error){

        console.log("Error connecting to the datbases: ",error);
        process.exit(1);

    }

}

module.exports = connectDatabase; // Export the function