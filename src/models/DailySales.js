const mongoose = require('mongoose');

const dailySalesSchema = new mongoose.Schema(
  {
    date: {
      type: Date,
      required: true,
      unique: true,
    },
    cash: {
      type: Number,
      default: 0,
    },
    card: {
      type: Number,
      default: 0,
    },
    transfer: {
      type: Number,
      default: 0,
    },
    credit: {
      type: Number,
      default: 0,
    },
    total: {
      type: Number,
      required: true,
    },
    expenses: {
      type: Number,
      default: 0,
    },
    netProfit: {
      type: Number,
      required: true,
    },
    cafeOwner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    notes: String,
    salesByCategory: [{
      category: String,
      amount: Number,
      itemsSold: Number,
    }],
    topSellingItems: [{
      product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
      },
      quantity: Number,
      revenue: Number,
    }],
  },
  {
    timestamps: true,
  }
);

// Add indexes for faster searches and reporting
dailySalesSchema.index({ cafeOwner: 1, date: -1 });

const DailySales = mongoose.model('DailySales', dailySalesSchema);

module.exports = DailySales; 