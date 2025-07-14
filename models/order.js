const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const orderSchema = new Schema({
  customer: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  items: [
    {
      item: {
        type: Schema.Types.ObjectId,
        ref: "Item",
        required: true,
      },
      quantity: {
        type: Number,
        required: true,
        min: 1,
      },
      price: {
        type: Number,
        required: true,
        min: 0,
      },
    },
  ],
  totalAmount: {
    type: Number,
    required: true,
    min: 0,
  },
  status: {
    type: String,
    enum: ["pending", "confirmed", "shipped", "delivered", "cancelled"],
    default: "pending",
  },
  shippingAddress: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String,
  },
  paymentMethod: {
    type: String,
    enum: ["credit_card", "debit_card", "paypal", "cash_on_delivery"],
    required: true,
  },
  orderDate: {
    type: Date,
    default: Date.now,
  },
  deliveryDate: {
    type: Date,
  },
  notes: {
    type: String,
  },
  statusHistory: [
    {
      status: {
        type: String,
        enum: ["pending", "confirmed", "shipped", "delivered", "cancelled"],
      },
      timestamp: {
        type: Date,
        default: Date.now,
      },
      updatedBy: {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    },
  ],
});

// Calculate total amount before saving
orderSchema.pre("save", function (next) {
  if (this.items && this.items.length > 0) {
    this.totalAmount = this.items.reduce((total, item) => {
      return total + (item.price * item.quantity);
    }, 0);
  }
  next();
});

// Add status to history when status changes
orderSchema.pre("save", function (next) {
  if (this.isModified("status")) {
    if (!this.statusHistory) {
      this.statusHistory = [];
    }
    
    // Add initial status if history is empty
    if (this.statusHistory.length === 0) {
      this.statusHistory.push({
        status: "pending",
        timestamp: this.orderDate,
        updatedBy: this.customer,
      });
    }
    
    // Add new status to history
    this.statusHistory.push({
      status: this.status,
      timestamp: new Date(),
      updatedBy: this.customer, // In a real app, this would be the admin/staff updating
    });
  }
  next();
});

module.exports = mongoose.model("Order", orderSchema); 