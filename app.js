const express = require("express");
const app = express();
const mongoose = require("mongoose");
const path = require("path");
const ejsMate = require("ejs-mate");
const session = require("express-session");
const passport = require("passport");
const config = require("./config/config");
const Item = require("./models/item");
const Order = require("./models/order");
const User = require("./models/user");
const { checkUrl } = require("./middlewares/dashboard");
const { isAuthenticated, isAdmin } = require("./middlewares/auth");

// Import passport configuration
require("./config/passport");

app.set("view engine", "ejs");
app.engine("ejs", ejsMate);
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Session configuration
app.use(
  session({
    secret: config.session.secret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false, // Set to true in production with HTTPS
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  })
);

// Initialize passport
app.use(passport.initialize());
app.use(passport.session());

// Make user available to all templates
app.use((req, res, next) => {
  res.locals.user = req.user;
  next();
});

mongoose
  .connect(config.mongodb.uri)
  .then(() => console.log("Connected to MongoDB!"));

// Authentication routes
app.get("/auth/google", (req, res, next) => {
  console.log('🚀 Starting Google OAuth flow...');
  next();
}, passport.authenticate("google"));

app.get(
  "/auth/google/callback",
  (req, res, next) => {
    console.log('🔄 OAuth callback received');
    next();
  },
  passport.authenticate("google", { failureRedirect: "/login" }),
  (req, res) => {
    console.log('✅ Authentication successful, redirecting to dashboard');
    res.redirect("/dashboard");
  }
);

app.get("/logout", (req, res) => {
  console.log('👋 User logging out:', req.user?.displayName);
  req.logout((err) => {
    if (err) {
      console.error("Logout error:", err);
    }
    res.redirect("/");
  });
});

// Debug route to check authentication status
app.get("/auth/status", (req, res) => {
  console.log('🔍 Auth status check - User:', req.user);
  res.json({
    isAuthenticated: req.isAuthenticated(),
    user: req.user ? {
      id: req.user._id,
      displayName: req.user.displayName,
      email: req.user.email,
      lastLogin: req.user.lastLogin
    } : null
  });
});

app.get("/", (req, res) => {
  res.render("home", { user: req.user });
});

//inventory routes
//inventory route
app.get("/inventory", isAuthenticated, async (req, res) => {
  let { search } = req.query || "";
  console.log(search);
  let Items;
  if (search) {
    const regex = new RegExp(search, "i");
    Items = await Item.find({ productName: regex ,owner:req.user._id}).populate("owner");
  } else {
    Items = await Item.find({owner:req.user._id}).populate("owner");
  }
  res.render("inventory/index.ejs", { Items, search });
});

//adding new inventory get route
app.get("/inventory/new", isAuthenticated, async (req, res) => {
  let { name } = req.query || "";
  let item = "";
  if (name) {
    item = await Item.findOne({ productName: name}).populate("owner");
  }
  console.log(item);
  res.render("inventory/new", { item });
});

app.get("/inventory/check", isAuthenticated, async (req, res) => {
  const { name } = req.query;
  if (!name) return res.status(400).json({ error: "Name required" });
  console.log(name);
  const item = await Item.findOne({
    productName: new RegExp("^" + name + "$", "i"),
  });
  console.log(item);
  if (item) {
    res.json({ productId: item.productId, category: item.category, owner:req.user._id });
  } else {
    res.json(null); // No match
  }
});

app.post("/inventory", isAuthenticated, async (req, res) => {
  const { productName, productId, quantity, category } = req.body;

  const items = productName.map((_, i) => ({
    productName: productName[i].trim(),
    productId: productId[i].trim(),
    quantity: parseInt(quantity[i]),
    category: category[i],
    owner: req.user._id, // Set the current user as owner
  }));

  try {
    for (const item of items) {
      const existingItem = await Item.findOne({ productId: item.productId ,owner:req.user._id });

      if (existingItem) {
        // If item exists, increase its quantity
        existingItem.quantity += item.quantity;
        await existingItem.save();
      } else {
        // New item – create with owner
        const newItem = new Item(item);
        await newItem.save();
      }
    }

    res.redirect("/inventory");
  } catch (err) {
    console.error("Inventory update failed:", err);
    res.status(500).send("Something went wrong");
  }
});

//category route
app.get("/inventory/:category", isAuthenticated, async (req, res) => {
  let { category } = req.params;
  let { search } = req.query || "";
  console.log(category);
  let Items;
  if (search) {
    const regex = new RegExp(search, "i");
    const regexCat = new RegExp(category, "i");
    Items = await Item.find({ productName: regex, category: regexCat, owner:req.user._id }).populate("owner");
  } else {
    const regex = new RegExp(category, "i");
    Items = await Item.find({ category: regex ,owner:req.user._id}).populate("owner");
  }
  res.render(`inventory/category.ejs`, { Items, search, category });
});

//dashboard routes
app.get("/dashboard", isAuthenticated, async (req, res) => {
  const Items = await Item.find({ quantity: { $lt: 10 }, owner:req.user._id });
  res.render("dashboard/index.ejs", { Items });
});

// Order routes
app.get("/orders", isAuthenticated, async (req, res) => {
  try {
    let orders;
    
    // If user is admin, show all orders. Otherwise, show only user's orders
    if (req.user.isAdmin) {
      orders = await Order.find({})
        .populate({
          path: "customer",
          model: "User"
        })
        .populate({
          path: "items.item",
          model: "Item"
        })
        .sort({ orderDate: -1 });
    } else {
      orders = await Order.find({ customer: req.user._id })
        .populate({
          path: "customer",
          model: "User"
        })
        .populate({
          path: "items.item",
          model: "Item"
        })
        .sort({ orderDate: -1 });
    }
    
    // Filter out orders with no valid items
    const validOrders = orders.filter(order => 
      order.items.some(item => item.item !== null)
    );
    
    res.render("orders/index.ejs", { orders: validOrders });
  } catch (err) {
    console.error("Error fetching orders:", err);
    res.status(500).send("Something went wrong");
  }
});

app.get("/orders/new", isAuthenticated, async (req, res) => {
  try {
    const items = await Item.find({ quantity: { $gt: 0 } ,owner:req.user._id});
    console.log("Available items for order:", items.length);
    res.render("orders/new.ejs", { items });
  } catch (err) {
    console.error("Error fetching items:", err);
    res.status(500).send("Something went wrong");
  }
});

app.post("/orders", isAuthenticated, async (req, res) => {
  try {
    console.log("Order creation request body:", req.body);
    
    const { items, quantities, prices, shippingAddress, paymentMethod, notes } = req.body;
    
    // Validate required fields
    if (!items || !Array.isArray(items) || items.length === 0) {
      console.error("No items selected for order");
      return res.status(400).send("Please select at least one item");
    }
    
    if (!paymentMethod) {
      console.error("No payment method selected");
      return res.status(400).send("Please select a payment method");
    }
    
    // Process order items
    const orderItems = [];
    let totalAmount = 0;
    
    for (let i = 0; i < items.length; i++) {
      const itemId = items[i];
      const quantity = parseInt(quantities[i]);
      const price = parseFloat(prices[i]);
      
      console.log(`Processing item ${i}:`, { itemId, quantity, price });
      
      if (itemId && quantity && price && quantity > 0 && price > 0) {
        const item = await Item.findById(itemId);
        
        if (item && item.quantity >= quantity) {
          orderItems.push({
            item: itemId,
            quantity: quantity,
            price: price,
          });
          totalAmount += quantity * price;
          
          // Update item quantity
          item.quantity -= quantity;
          await item.save();
          console.log(`Updated item ${item.productName}, new quantity: ${item.quantity}`);
        } else {
          console.error(`Item ${itemId} not found or insufficient quantity`);
          return res.status(400).send(`Item not found or insufficient quantity. Please refresh and try again.`);
        }
      }
    }
    
    if (orderItems.length === 0) {
      console.error("No valid items in order");
      return res.status(400).send("No valid items in order. Please check quantities and prices.");
    }
    
    console.log("Creating order with items:", orderItems);
    console.log("Total amount:", totalAmount);
    
    const order = new Order({
      customer: req.user._id,
      items: orderItems,
      totalAmount,
      shippingAddress: {
        street: shippingAddress.street || "",
        city: shippingAddress.city || "",
        state: shippingAddress.state || "",
        zipCode: shippingAddress.zipCode || "",
        country: shippingAddress.country || "USA",
      },
      paymentMethod,
      notes: notes || "",
    });
    
    await order.save();
    console.log("Order created successfully:", order._id);
    res.redirect("/orders");
  } catch (err) {
    console.error("Error creating order:", err);
    res.status(500).send(`Something went wrong: ${err.message}`);
  }
});

// Debug route to test form data
app.post("/orders/debug", isAuthenticated, (req, res) => {
  console.log("Debug - Form data received:", req.body);
  res.json({
    message: "Form data received",
    body: req.body,
    user: req.user._id
  });
});

// Debug route to check admin status
app.get("/admin/test", isAuthenticated, (req, res) => {
  res.json({
    user: req.user.displayName,
    email: req.user.email,
    isAdmin: req.user.isAdmin,
    userId: req.user._id
  });
});

// Order status update routes (Admin only)
app.put("/orders/:id/status", isAuthenticated, isAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }
    
    // Validate status transition
    const validTransitions = {
      pending: ["confirmed", "cancelled"],
      confirmed: ["shipped", "cancelled"],
      shipped: ["delivered"],
      delivered: [], // Final state
      cancelled: [] // Final state
    };
    
    if (!validTransitions[order.status].includes(status)) {
      return res.status(400).json({ 
        error: `Invalid status transition from ${order.status} to ${status}` 
      });
    }
    
    // Update status and add timestamp
    order.status = status;
    if (status === "delivered") {
      order.deliveryDate = new Date();
    }
    
    await order.save();
    
    res.json({ 
      success: true, 
      message: `Order status updated to ${status}`,
      order: order 
    });
  } catch (err) {
    console.error("Error updating order status:", err);
    res.status(500).json({ error: "Failed to update order status" });
  }
});

// Get order tracking history
app.get("/orders/:id/tracking", isAuthenticated, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate("customer")
      .populate("items.item");
    
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }
    
    // Check if user owns this order OR if user is admin
    if (!req.user.isAdmin && order.customer._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: "Access denied" });
    }
    
    // Generate tracking timeline
    const trackingTimeline = [
      {
        status: "pending",
        title: "Order Placed",
        description: "Your order has been placed and is being processed",
        date: order.orderDate,
        completed: true,
        icon: "📋"
      },
      {
        status: "confirmed",
        title: "Order Confirmed",
        description: "Your order has been confirmed and is being prepared",
        date: order.status === "confirmed" || order.status === "shipped" || order.status === "delivered" ? order.updatedAt : null,
        completed: ["confirmed", "shipped", "delivered"].includes(order.status),
        icon: "✅"
      },
      {
        status: "shipped",
        title: "Order Shipped",
        description: "Your order has been shipped and is on its way",
        date: order.status === "shipped" || order.status === "delivered" ? order.updatedAt : null,
        completed: ["shipped", "delivered"].includes(order.status),
        icon: "🚚"
      },
      {
        status: "delivered",
        title: "Order Delivered",
        description: "Your order has been delivered successfully",
        date: order.deliveryDate,
        completed: order.status === "delivered",
        icon: "📦"
      }
    ];
    
    res.json({ 
      order, 
      trackingTimeline,
      currentStatus: order.status 
    });
  } catch (err) {
    console.error("Error fetching order tracking:", err);
    res.status(500).json({ error: "Failed to fetch tracking information" });
  }
});

// Utility route to clean up orphaned orders (admin only)
// Admin dashboard route
app.get("/admin", isAuthenticated, isAdmin, async (req, res) => {
  try {
    console.log("Loading admin dashboard for user:", req.user.displayName);
    console.log("User isAdmin:", req.user.isAdmin);
    
    // Check if User model is available
    if (!User) {
      throw new Error("User model not available");
    }
    
    const totalOrders = await Order.countDocuments();
    const pendingOrders = await Order.countDocuments({ status: "pending" });
    const totalUsers = await User.countDocuments();
    const totalItems = await Item.countDocuments();
    
    console.log("Statistics loaded:", { totalOrders, pendingOrders, totalUsers, totalItems });
    
    const recentOrders = await Order.find({})
      .populate({
        path: "customer",
        model: "User"
      })
      .populate({
        path: "items.item",
        model: "Item"
      })
      .sort({ orderDate: -1 })
      .limit(10);
    
    // Filter out orders with null customers or items
    const validOrders = recentOrders.filter(order => 
      order.customer && order.items.some(item => item.item !== null)
    );
    
    console.log("Recent orders loaded:", validOrders.length);
    
    res.render("admin/dashboard.ejs", {
      totalOrders,
      pendingOrders,
      totalUsers,
      totalItems,
      recentOrders: validOrders
    });
  } catch (err) {
    console.error("Error loading admin dashboard:", err);
    res.status(500).send(`Something went wrong: ${err.message}`);
  }
});

app.get("/orders/cleanup", isAuthenticated, isAdmin, async (req, res) => {
  try {
    const orders = await Order.find({}).populate("items.item");
    let cleanedCount = 0;
    
    for (const order of orders) {
      const validItems = order.items.filter(item => item.item !== null);
      if (validItems.length === 0) {
        await Order.findByIdAndDelete(order._id);
        cleanedCount++;
      }
    }
    
    res.json({ message: `Cleaned up ${cleanedCount} orphaned orders` });
  } catch (err) {
    console.error("Error cleaning up orders:", err);
    res.status(500).json({ error: "Cleanup failed" });
  }
});

app.get("/orders/:id", isAuthenticated, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate("customer")
      .populate({
        path: "items.item",
        model: "Item"
      });
    
    if (!order) {
      return res.status(404).send("Order not found");
    }
    
    // Check if user owns this order OR if user is admin
    if (!req.user.isAdmin && order.customer._id.toString() !== req.user._id.toString()) {
      return res.status(403).send("Access denied");
    }
    
    // Check if order has any valid items
    const validItems = order.items.filter(item => item.item !== null);
    if (validItems.length === 0) {
      return res.status(404).send("Order has no valid items");
    }
    
    res.render("orders/show.ejs", { order });
  } catch (err) {
    console.error("Error fetching order:", err);
    res.status(500).send("Something went wrong");
  }
});

app.listen(config.port, () => {
  console.log(`App is listening on the port ${config.port}`);
});
