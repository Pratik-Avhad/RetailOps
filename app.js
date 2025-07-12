const express = require("express");
const mongoose = require("mongoose");
const app = express();
const path = require("path");

app.set("view engine", "ejs")
app.set("views", path.join(__dirname,"views"));

mongoose.connect('mongodb://127.0.0.1:27017/RetailOps')
  .then(() => console.log('Connected!'));

app.get("/", (req, res) => {
    res.send("Hi, i'm the root!!")
})

app.listen(8080, () => {
    console.log("App is listening on the port 8080");
})