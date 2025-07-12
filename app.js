const express = require("express");
const app = express();
const mongoose = require("mongoose");
const path = require("path");
const ejsMate = require("ejs-mate");
const Item = require("./models/item");
const { checkUrl } = require("./middlewares/dashboard");

app.set("view engine", "ejs");
app.engine("ejs", ejsMate);
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

mongoose
  .connect("mongodb://127.0.0.1:27017/RetailOps")
  .then(() => console.log("Connected!"));

app.get("/", (req, res) => {
  res.send("Hi, i'm the root!!");
});

//inventory routes
//inventory route
app.get("/inventory", async (req, res) => {
  let { search } = req.query || "";
  console.log(search);
  let Items;
  if (search) {
    const regex = new RegExp(search, "i");
    Items = await Item.find({ productName: regex });
  } else {
    Items = await Item.find({});
  }
  res.render("inventory/index.ejs", { Items, search });
});

//adding new inventory get route
app.get("/inventory/new", async (req, res) => {
  let { name } = req.query || "";
  let item = "";
  if (name) {
    item = await Item.findOne({ productName: name });
  }
  console.log(item);
  res.render("inventory/new", { item });
});

app.get("/inventory/check", async (req, res) => {
  const { name } = req.query;
  if (!name) return res.status(400).json({ error: "Name required" });
  console.log(name);
  const item = await Item.findOne({
    productName: new RegExp("^" + name + "$", "i"),
  });
  console.log(item);
  if (item) {
    res.json({ productId: item.productId, category: item.category });
  } else {
    res.json(null); // No match
  }
});

app.post("/inventory", async (req, res) => {
  const { productName, productId, quantity, category } = req.body;

  const items = productName.map((_, i) => ({
    productName: productName[i].trim(),
    productId: productId[i].trim(),
    quantity: parseInt(quantity[i]),
    category: category[i],
  }));

  try {
    for (const item of items) {
      const existingItem = await Item.findOne({ productId: item.productId });

      if (existingItem) {
        // If item exists, increase its quantity
        existingItem.quantity += item.quantity;
        await existingItem.save();
      } else {
        // New item – insert
        await Item.insertOne(item);
      }
    }

    res.redirect("/inventory");
  } catch (err) {
    console.error("Inventory update failed:", err);
    res.status(500).send("Something went wrong");
  }
});

//category route
app.get("/inventory/:category", async (req, res) => {
  let { category } = req.params;
  let { search } = req.query || "";
  console.log(category);
  let Items;
  if (search) {
    const regex = new RegExp(search, "i");
    const regexCat = new RegExp(category, "i");
    Items = await Item.find({ productName: regex, category: regexCat });
  } else {
    const regex = new RegExp(category, "i");
    Items = await Item.find({ category: regex });
  }
  res.render(`inventory/category.ejs`, { Items, search, category });
});

//dashboard routes
app.get("/dashboard", async (req, res) => {
  const Items = await Item.find({ quantity: { $lt: 10 } });
  res.render("dashboard/index.ejs", { Items });
});

app.listen(8080, () => {
  console.log("App is listening on the port 8080");
});
