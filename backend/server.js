const multer = require("multer");
const express = require("express");
const path = require('path');
const { Jimp } = require("jimp");
const asciigen = require("./asciigen");
const fs = require("fs");

const app = express();
const PORT = 3000;

const upload = multer({ dest: "uploads/"});
app.use(express.static("./frontend"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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


app.listen(PORT, () => { console.log(`Server running at http://localhost:${PORT}`); });
