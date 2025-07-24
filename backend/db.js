// Connecting to our database
require("dotenv").config();
const { Client } = require("pg");
// pass the required info to connect
const client = new Client({
    user: process.env.DB_USER,
    host: process.env.DB_URL,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
    ssl: {
        rejectUnauthorized: false
    }
});

// actually connect
client.connect().then(() => {console.log("Connected to database!")}).catch((err) => {console.error(err)});
module.exports = {client};