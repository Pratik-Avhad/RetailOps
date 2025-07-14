const express = require("express");
const mongoose = require("mongoose");
const Item = require("../models/item");
const User = require("../models/user");
const inventoryItems = require("./data");

mongoose.connect('mongodb://127.0.0.1:27017/RetailOps')
  .then(() => console.log('Connected!'));

const AddItemsToInventory = async() => {
    try {
        // First, create a default user "Sanket" if it doesn't exist
        let defaultUser = await User.findOne({ email: "sanket@retailops.com" });
        
        if (!defaultUser) {
            defaultUser = new User({
                googleId: "default_sanket_user",
                displayName: "Sanket",
                email: "sanket@retailops.com",
                profilePicture: null,
            });
            await defaultUser.save();
            console.log("Default user 'Sanket' created successfully!");
        } else {
            console.log("Default user 'Sanket' already exists!");
        }

        // Clear existing items
        await Item.deleteMany();
        
        // Add owner field to all inventory items
        const itemsWithOwner = inventoryItems.map(item => ({
            ...item,
            owner: defaultUser._id
        }));
        
        await Item.insertMany(itemsWithOwner);
        console.log("Items Added Successfully with owner 'Sanket'!");
        
        process.exit(0);
    } catch (error) {
        console.error("Error initializing data:", error);
        process.exit(1);
    }
}

AddItemsToInventory();
