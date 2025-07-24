const multer = require("multer");
const express = require("express");
const { Jimp } = require("jimp");
const asciigen = require("./asciigen");
const { client } = require("./db");
require("dotenv").config();
const fs = require("fs");
const {rateLimit} = require("express-rate-limit");

const app = express();
const PORT = process.env.PORT;
const limiter = rateLimit({
    windowMs: 1000 * 60 * 15,
    limit: 50,
    message: "Too many requests! Try again later.",
    handler: (req, res, next, options) => {
        res.status(429).json({message: options.message});
    }
})

const upload = multer({ dest: "uploads/"});
app.use(express.static("./frontend"));
app.use(express.json());
app.use(limiter);
app.use(express.urlencoded({ extended: true }));

// generate ascii from URL
app.post(`/submitURL`, async (req, res) => {
    let txt;
    var image;
    try {
        image = await Jimp.read(req.body.input);
    } catch(error) {
        console.error(error);
        res.status(500).json({message: error.message});
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
    } catch(error) {
        console.error(error);
        res.status(500).json({message: error.message});
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

async function getData(email) {
    const response = await client.query(`SELECT * FROM users WHERE email=$1 ORDER BY date;`, [email]);
    return response.rows;
}

// retrieve user data after unlocking vault
app.get(`/data/:email`, async (req, res) => {
    const email = req.params.email;
    const rows = await getData(email);
    return res.status(200).json({rows: rows, message: `Logged in as ${email}.`});
})

// delete from document
app.delete(`/data/:email/:index`, async (req, res) => {
    return res.status(400).json({message: "Sorry! I still need to implement deletion."});
})

// add conversion to document
app.post(`/data/:email`, async (req, res) => {
    const email = req.params.email;
    await client.query("INSERT INTO users (email, name, date, txt) VALUES ($1, $2, CURRENT_DATE, $3)", [email, req.body.name, req.body.text]);
    return res.status(200).json({rows: await getData(email), message: "Saved!"});
})

process.on("SIGINT", async () => {
    console.log("Closing database connection...");
    await client.end();
    process.exit(0);
});

app.listen(PORT, () => { console.log(`Server listening at port ${PORT}`);});
