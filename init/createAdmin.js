const mongoose = require("mongoose");
const User = require("../models/user");
const config = require("../config/config");

mongoose.connect(config.mongodb.uri)
  .then(() => console.log('Connected to MongoDB!'));

const createAdminUser = async() => {
    try {
        // Check if admin user already exists
        let adminUser = await User.findOne({ email: "sanketlaptop3004@gmail.com" });
        
        if (adminUser) {
            // Update existing user to admin
            adminUser.isAdmin = true;
            adminUser.displayName = "Sanket Zilpe";
            await adminUser.save();
            console.log("✅ Existing user 'Sanket Zilpe' updated to admin!");
        } else {
            // Create new admin user
            adminUser = new User({
                googleId: "admin_sanket_zilpe",
                displayName: "Sanket Zilpe",
                email: "sanketlaptop3004@gmail.com",
                profilePicture: null,
                isAdmin: true,
            });
            await adminUser.save();
            console.log("✅ Admin user 'Sanket Zilpe' created successfully!");
        }
        
        console.log("Admin user details:");
        console.log("- Name:", adminUser.displayName);
        console.log("- Email:", adminUser.email);
        console.log("- Admin:", adminUser.isAdmin);
        console.log("- ID:", adminUser._id);
        
        process.exit(0);
    } catch (error) {
        console.error("❌ Error creating admin user:", error);
        process.exit(1);
    }
}

createAdminUser(); 