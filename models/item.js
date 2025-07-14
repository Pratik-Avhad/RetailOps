const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const itemSchema = new Schema({
  productName: {
    type: String,
    required: true,
  },
  productId: {
    type: String,
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
  },
  category: {
    type: String,
    required: true,
    enum: [
      "Electronics",
      "Apparel",
      "Kitchenware",
      "Stationery",
      "Food & Beverages",
    ],
  },
  owner: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  addedAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Item", itemSchema);
