const express = require("express");
const path = require('path');

const app = express();

// Serve static files from the "frontend" folder
app.use(express.static("./frontend"));

const PORT = 3000;
app.listen(PORT, () => { console.log(`Server running at http://localhost:${PORT}`); });
