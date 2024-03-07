const { MongoClient } = require("mongodb");
const config = require("./config");

let db;
async function connectDb() {
    try {
        const client = await MongoClient.connect(config.database.uri);
        db = client.db();
        console.log('Successfully connected to MongoDB.');
        return db;
    }
    catch(err)
    {
        console.error('An error occurred connecting to MongoDB:', err);
    }
}

module.exports = {
    connectDb: connectDb
}