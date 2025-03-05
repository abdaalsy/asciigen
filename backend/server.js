const multer = require("multer");
const express = require("express");
const path = require('path');
const { Jimp } = require("jimp");
const asciigen = require("./asciigen");
const { remove } = require("./helper");
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

app.get(`/:email`, async (req, res) => {
    await client.connect();
    let collection = client.db("UserData").collection("conversions");
    const email = req.params.email;
    const userDoc = await collection.findOne({"email": email});
    if (userDoc == null) {
        res.status(404).json({message: "The user was not found. Later, have this open up a new document."});
        await client.close();
        return;
    }
    delete userDoc._id;
    await client.close();
    res.status(200).json(userDoc);
})

app.delete(`/:email/:index`, async (req, res) => {
    await client.connect();
    let collection = client.db("UserData").collection("conversions");
    const deleteIndex = Number(req.params.index);
    const userDoc = await collection.findOne({"email": req.params.email});
    const newConversions =  remove(userDoc.conversions, deleteIndex);
    console.log(newConversions);
    await collection.updateOne({"email": req.params.email}, {
        $set: {
            "conversions": newConversions
        }
    });
    await client.close();
    res.status(200).json()
})

app.post(`/:email`, async (req, res) => {
    await client.connect();
    const collection = client.db("UserData").collection("conversions");
    const userDoc = await collection.findOne({"email": req.params.email});
    if (userDoc.conversions.length >= 10) {
        res.status(418).json({message: "Cannot save, you have reached the maximum number of conversions"});
        client.close();
        return;
    }
    await userDoc.conversions.push({
        name: req.body.name,
        date: req.body.date,
        text: req.body.text
    });
    await collection.updateOne({"email": req.params.email}, {
        $set: {
            "conversions": userDoc.conversions
        }
    })
    res.status(200).json();
    client.close();
})


app.listen(PORT, () => { console.log(`Server running at http://localhost:${PORT}`); });
