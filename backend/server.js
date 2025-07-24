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


function remove(arr, idx) {
    let newArr = [];
    for (let i=0; i < arr.length; i++) {
        if (i != idx) {
            newArr.push(arr[i]);
        }
    }
    return newArr;
}

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
// app.delete(`/data/:email/:index`, async (req, res) => {
//     let db = await connectDB();
//     let collection = await db.collection("conversions");
//     const deleteIndex = Number(req.params.index);
//     var userDoc = await collection.findOne({"email": req.params.email});
//     const oldConversionsLength = userDoc.conversions.length;
//     const newConversions =  remove(userDoc.conversions, deleteIndex);
//     await collection.updateOne({"email": req.params.email}, {
//         $set: {
//             "conversions": newConversions
//         }
//     });
//     if (newConversions.length == oldConversionsLength) {
//         res.status(500).json({message: "An error occurred, the conversion was not deleted."});
//         return;
//     }
//     userDoc.conversions = newConversions;
//     res.status(200).json({document: userDoc, message: "Deleted!"})
// })

// add conversion to document
// app.post(`/data/:email`, async (req, res) => {
//     let db = await connectDB();
//     const collection = await db.collection("conversions");
//     const userDoc = await collection.findOne({"email": req.params.email});
//     if (userDoc.conversions.length >= 10) {
//         res.status(418).json({message: "Cannot save, you have reached the maximum number of conversions."});
//         return;
//     }
//     let oldLength = userDoc.conversions.length;
//     await userDoc.conversions.push({
//         name: req.body.name,
//         date: req.body.date,
//         text: req.body.text
//     });
//     try {
//         await collection.updateOne({"email": req.params.email}, {
//             $set: {
//                 "conversions": userDoc.conversions
//             }
//         })
//     } catch(error) {  // catch if database is full
//         console.error(error);
//         if (error.message.includes("Quota exceeded") || error.message.includes("WriteError")) {
//             return res.status(507).json({ message: "Cannot save, the database is full." }); 
//         }
//         return;
//     }
//     let newLength = userDoc.conversions.length;
//     if (oldLength === newLength) {
//         return res.status(500).json({message: "The conversion was not saved."});
//     }
//     res.status(200).json({document: userDoc, message: "Saved!"});
// })

process.on("SIGINT", async () => {
    console.log("Closing database connection...");
    await client.end();
    process.exit(0);
});

app.listen(PORT, () => { console.log(`Server listening at port ${PORT}`);});
