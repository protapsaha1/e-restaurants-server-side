const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken")
require("dotenv").config();
const app = express();
const port = process.env.PORT || 5011;

// middleware
app.use(cors())
app.use(express.json())
// middleware


app.listen(port, () => {
    console.log(`red gold is open ${port}`)
});