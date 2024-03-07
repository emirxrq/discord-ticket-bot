const { MongoClient } = require("mongodb");
const config = require("./botConfig");

let db;

async function connectDB() {
    try {
        const client = await MongoClient.connect(config.database.uri);
        db = client.db();
        console.log('MongoDB\'ye başarıyla bağlandı.');
        return db;
    } catch (err) {
        console.error('MongoDB\'ye bağlanırken bir hata oluştu:', err);
    }
}

module.exports = {
    connectDB: connectDB
};
