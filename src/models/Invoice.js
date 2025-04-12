const mongoose = require('mongoose');

const invoiceItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  productName: {
    type: String,
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
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
  discount: {
    type: Number,
    default: 0,
    min: 0,
  },
});

const invoiceSchema = new mongoose.Schema(
  {
    invoiceNumber: {
      type: String,
      required: true,
      unique: true,
    },
    type: {
      type: String,
      required: true,
      enum: ['purchase', 'sale'],
    },
    date: {
      type: Date,
      required: true,
      default: Date.now,
    },
    dueDate: {
      type: Date,
    },
    party: {
      type: {
        type: String,
        required: true,
        enum: ['customer', 'supplier'],
      },
      name: {
        type: String,
        required: true,
      },
      phone: String,
      address: String,
      email: String,
    },
    items: [invoiceItemSchema],
    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },
    tax: {
      type: Number,
      default: 0,
      min: 0,
    },
    discount: {
      type: Number,
      default: 0,
      min: 0,
    },
    total: {
      type: Number,
      required: true,
      min: 0,
    },
    paymentMethod: {
      type: String,
      required: true,
      enum: ['cash', 'card', 'transfer', 'credit'],
    },
    paymentStatus: {
      type: String,
      enum: ['paid', 'partial', 'unpaid'],
      default: 'unpaid',
    },
    paidAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    remainingAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    status: {
      type: String,
      enum: ['draft', 'confirmed', 'cancelled', 'void'],
      default: 'draft',
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
    terms: String,
    attachments: [{
      name: String,
      url: String,
      type: String,
    }],
  },
  {
    timestamps: true,
  }
);

// Add indexes for faster searches and reporting
invoiceSchema.index({ cafeOwner: 1, date: -1 });
invoiceSchema.index({ cafeOwner: 1, invoiceNumber: 1 });
invoiceSchema.index({ cafeOwner: 1, 'party.name': 1 });
invoiceSchema.index({ status: 1 });
invoiceSchema.index({ paymentStatus: 1 });

const Invoice = mongoose.model('Invoice', invoiceSchema);

module.exports = Invoice; 