const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema(
  {
    date: {
      type: Date,
      required: true,
      default: Date.now,
    },
    description: {
      type: String,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    category: {
      type: String,
      required: true,
      enum: ['rent', 'salary', 'supplies', 'utilities', 'maintenance', 'other'],
    },
    paymentMethod: {
      type: String,
      required: true,
      enum: ['cash', 'card', 'transfer'],
    },
    recurring: {
      type: Boolean,
      default: false,
    },
    frequency: {
      type: String,
      enum: ['daily', 'weekly', 'monthly', 'yearly', 'none'],
      default: 'none',
    },
    nextDueDate: Date,
    attachments: [{
      name: String,
      url: String,
      type: String,
    }],
    cafeOwner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'paid', 'cancelled'],
      default: 'pending',
    },
    notes: String,
  },
  {
    timestamps: true,
  }
);

// Add indexes for faster searches and reporting
expenseSchema.index({ cafeOwner: 1, date: -1 });
expenseSchema.index({ category: 1, date: -1 });
expenseSchema.index({ status: 1 });

const Expense = mongoose.model('Expense', expenseSchema);

module.exports = Expense; 