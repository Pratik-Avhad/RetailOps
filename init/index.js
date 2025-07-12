const express = require("express");
const mongoose = require("mongoose");
const Item = require("../models/item");
const inventoryItems = require("./data");

mongoose.connect('mongodb://127.0.0.1:27017/RetailOps')
  .then(() => console.log('Connected!'));

const AddItemsToInventory = async() => {
    await Item.deleteMany();
    await Item.insertMany(inventoryItems);
    console.log("Items Added Successfully!!");
}

AddItemsToInventory();
