const multer = require("multer");
const express = require("express");
const path = require('path');
const { Jimp } = require("jimp");
const asciigen = require("./asciigen");
require("dotenv").config();
const fs = require("fs");

const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = process.env.MONGO_URI;

const app = express();
const PORT = 3000;

const upload = multer({ dest: "uploads/"});
app.use(express.static("./frontend"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});
var conversions;

// async function run() {
//     try {
//         // Connect the client to the server	(optional starting in v4.7)
//         await client.connect();
//         // Send a ping to confirm a successful connection
//         await client.db("admin").command({ ping: 1 });
//         console.log("Pinged your deployment. You successfully connected to MongoDB!");

//         conversions = client.db("UserData").collection("conversions");
//         console.log("Found collection");

//     } finally {
//         // Ensures that the client will close when you finish/error
//         await client.close();
//     }
// }


app.post(`/submitURL`, async (req, res) => {
    const image = await Jimp.read(req.body.input);
    let txt = await asciigen.generateAscii(image);
    res.status(200).send(txt);
})

app.post(`/submitFile`, upload.single("input"), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({error: "An error occurred in uploading this file."})
    }
    const image = await Jimp.read(req.file.path);
    let txt = await asciigen.generateAscii(image);

    fs.unlink(req.file.path, (err) => {
        if (err) {
            console.log(err);
        }
        else {
            console.log("File was deleted.");
        }
    });

    res.status(200).send(txt);
})

app.get(`/user/:email`, async (req, res) => {
    await client.connect();
    conversions = client.db("UserData").collection("conversions");
    const email = req.params.email;
    const userDoc = await conversions.findOne({"email": email});
    delete userDoc._id;
    res.status(200).json(userDoc);
    await client.close();
})


app.listen(PORT, () => { console.log(`Server running at http://localhost:${PORT}`); });
