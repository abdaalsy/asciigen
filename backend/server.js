const express = require("express");
const path = require('path');

const app = express();
const PORT = 3000;

app.use(express.static("./frontend"));
app.use(express.json());

app.post(`/submit`, (req, res) => {
    console.log(`URL: "${req.body.input}"\nTYPE: "${req.body["input-type"]}"`);
    // call some functions from asciigen.js
    // send back the resulting text
})


app.listen(PORT, () => { console.log(`Server running at http://localhost:${PORT}`); });
