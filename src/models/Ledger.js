const mongoose = require('mongoose');

const ledgerSchema = new mongoose.Schema(
  {
    accountCode: {
      type: String,
      required: true,
      unique: true,
    },
    date: {
      type: Date,
      required: true,
      default: Date.now,
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
    },
    productName: {
      type: String,
      required: true,
    },
    paymentMethod: {
      type: String,
      required: true,
      enum: ['cash', 'card', 'credit'],
    },
    quantity: {
      type: Number,
      required: true,
      min: 0,
    },
    unitPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    totalPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    person: {
      type: String,
      required: true,
    },
    description: String,
    invoiceNumber: String,
    type: {
      type: String,
      required: true,
      enum: ['income', 'expense'],
    },
    cafeOwner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Add indexes for faster searches and reporting
ledgerSchema.index({ cafeOwner: 1, date: -1 });
ledgerSchema.index({ accountCode: 1 });
ledgerSchema.index({ type: 1, date: -1 });

const Ledger = mongoose.model('Ledger', ledgerSchema);

module.exports = Ledger; 