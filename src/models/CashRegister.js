const mongoose = require('mongoose');

const cashRegisterSchema = new mongoose.Schema(
  {
    date: {
      type: Date,
      required: true,
      default: Date.now,
    },
    transactionType: {
      type: String,
      required: true,
      enum: ['deposit', 'withdrawal'],
    },
    paymentMethod: {
      type: String,
      required: true,
      enum: ['cash', 'card', 'transfer'],
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    balance: {
      type: Number,
      required: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      required: true,
      enum: ['sale', 'expense', 'refund', 'other'],
    },
    reference: {
      type: {
        type: String,
        enum: ['sale', 'expense', 'other'],
      },
      id: {
        type: mongoose.Schema.Types.ObjectId,
        refPath: 'reference.type',
      },
    },
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
    notes: String,
  },
  {
    timestamps: true,
  }
);

// Add indexes for faster searches and reporting
cashRegisterSchema.index({ cafeOwner: 1, date: -1 });
cashRegisterSchema.index({ cafeOwner: 1, category: 1 });
cashRegisterSchema.index({ cafeOwner: 1, paymentMethod: 1 });

const CashRegister = mongoose.model('CashRegister', cashRegisterSchema);

module.exports = CashRegister; 