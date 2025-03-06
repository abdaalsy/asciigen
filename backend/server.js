const multer = require("multer");
const express = require("express");
const path = require('path');
const { Jimp } = require("jimp");
const asciigen = require("./asciigen");
const { remove } = require("./helper");
require("dotenv").config();
const fs = require("fs");
const {rateLimit} = require("express-rate-limit");

const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = process.env.MONGO_URI;

const app = express();
const PORT = 3000;
const limiter = rateLimit({
    windowMs: 1000 * 60 * 15,
    limit: 50,
    message: "Too many requests, please try again later.",
    handler: (req, res, next, options) => {
        res.status(429).json({message: options.message});
    }
})

const upload = multer({ dest: "uploads/"});
app.use(express.static("./frontend"));
app.use(express.json());
app.use(limiter);
app.use(express.urlencoded({ extended: true }));

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

// generate ascii from URL
app.post(`/submitURL`, async (req, res) => {
    let txt;
    var image;
    try {
        image = await Jimp.read(req.body.input);
    } catch({name, message}) {
        res.status(500).json({message: message});
        return;
    }
    
    txt = await asciigen.generateAscii(image);
    if (txt == "" || txt == null) {
        res.status(500).json({message: "An error occurred while processing this request"});
        return;
    }
    else {
        res.status(200).json({text: txt, message: "Success!"});
    }
    
})

// generate ascii from File
app.post(`/submitFile`, upload.single("input"), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({message: "An error occurred in uploading this file."})
    }
    let txt;
    var image;

    try {
        image = await Jimp.read(req.file.path);
    } catch({name, message}) {
        res.status(500).json({message: message});
        return;
    }
    finally {
        fs.unlink(req.file.path, (err) => {
            if (err) {
                console.log(err);
            }
        });
    }

    txt = await asciigen.generateAscii(image);
    if (txt == "" || txt == null) {
        res.status(500).json({message: "An error occurred while processing this request"});
        return;
    }
    else {
        res.status(200).json({text: txt, message: "Success!"});
    }
    
})

// retrieve user data after unlocking vault
app.get(`/:email`, async (req, res) => {
    await client.connect();
    let collection = client.db("UserData").collection("conversions");
    const email = req.params.email;
    const userDoc = await collection.findOne({"email": email});
    if (userDoc == null) {
        res.status(500).json({message: "An error occurred in retrieving user data."});
        return;
    }
    await client.close();
    res.status(200).json({document: userDoc, message: `Logged in as ${email}.`});
})

// delete from document
app.delete(`/:email/:index`, async (req, res) => {
    await client.connect();
    let collection = client.db("UserData").collection("conversions");
    const deleteIndex = Number(req.params.index);
    const userDoc = await collection.findOne({"email": req.params.email});
    const newConversions =  remove(userDoc.conversions, deleteIndex);
    await collection.updateOne({"email": req.params.email}, {
        $set: {
            "conversions": newConversions
        }
    });
    await client.close();
    res.status(200).json({message: "Deleted! Changes will be reflected after a page reload."})
})

// add conversion to document
app.post(`/:email`, async (req, res) => {
    await client.connect();
    const collection = client.db("UserData").collection("conversions");
    const userDoc = await collection.findOne({"email": req.params.email});
    if (userDoc.conversions.length >= 10) {
        res.status(418).json({message: "Cannot save, you have reached the maximum number of conversions."});
        await client.close();
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
    res.status(200).json({message: "Saved! Changes will be reflected after a page reload."});
    await client.close();
})


app.listen(PORT, () => { console.log(`Server running at http://localhost:${PORT}`); });
