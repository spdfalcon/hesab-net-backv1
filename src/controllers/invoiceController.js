const Invoice = require('../models/Invoice');
const Product = require('../models/Product');
const CashRegister = require('../models/CashRegister');
const { validationResult } = require('express-validator');

// Get all invoices
const getAllInvoices = async (req, res) => {
  try {
    const { startDate, endDate, type, status, paymentStatus } = req.query;
    const query = { cafeOwner: req.user.id };

    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    if (type) {
      query.type = type;
    }

    if (status) {
      query.status = status;
    }

    if (paymentStatus) {
      query.paymentStatus = paymentStatus;
    }

    const invoices = await Invoice.find(query)
      .sort({ date: -1 })
      .populate('createdBy', 'name')
      .populate('items.product', 'name code price');

    res.json(invoices);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching invoices', error: error.message });
  }
};

// Get invoice by ID
const getInvoiceById = async (req, res) => {
  try {
    const invoice = await Invoice.findOne({
      _id: req.params.id,
      cafeOwner: req.user.id,
    })
      .populate('createdBy', 'name')
      .populate('items.product', 'name code price');

    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    res.json(invoice);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching invoice', error: error.message });
  }
};

// Create new invoice
const createInvoice = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      type,
      date,
      dueDate,
      party,
      items,
      tax,
      discount,
      paymentMethod,
      paidAmount,
      notes,
      terms,
      attachments,
    } = req.body;

    // Calculate totals and validate stock
    let subtotal = 0;
    const processedItems = [];

    for (const item of items) {
      const product = await Product.findOne({
        _id: item.product,
        cafeOwner: req.user.id,
      });

      if (!product) {
        return res.status(404).json({ message: `Product not found: ${item.product}` });
      }

      // For sales invoices, check stock
      if (type === 'sale' && product.stockQuantity < item.quantity) {
        return res.status(400).json({
          message: `Insufficient stock for product: ${product.name}`,
        });
      }

      const itemTotal = item.quantity * product.price * (1 - (item.discount || 0) / 100);
      subtotal += itemTotal;

      processedItems.push({
        product: product._id,
        productName: product.name,
        quantity: item.quantity,
        unitPrice: product.price,
        discount: item.discount || 0,
        totalPrice: itemTotal,
      });

      // Update stock
      if (type === 'sale') {
        product.stockQuantity -= item.quantity;
      } else {
        product.stockQuantity += item.quantity;
      }
      await product.save();
    }

    const total = subtotal * (1 - (discount || 0) / 100) + (tax || 0);
    const remainingAmount = total - (paidAmount || 0);
    const paymentStatus = remainingAmount <= 0 ? 'paid' : paidAmount > 0 ? 'partial' : 'unpaid';

    // Generate invoice number (you might want to implement a more sophisticated system)
    const invoiceNumber = `INV-${Date.now()}`;

    const invoice = new Invoice({
      invoiceNumber,
      type,
      date: date || new Date(),
      dueDate,
      party,
      items: processedItems,
      subtotal,
      tax: tax || 0,
      discount: discount || 0,
      total,
      paymentMethod,
      paymentStatus,
      paidAmount: paidAmount || 0,
      remainingAmount,
      status: 'confirmed',
      notes,
      terms,
      attachments,
      cafeOwner: req.user.id,
      createdBy: req.user.id,
    });

    await invoice.save();

    // Create cash register entry if payment is made
    if (paidAmount > 0) {
      const cashRegister = new CashRegister({
        transactionType: type === 'sale' ? 'deposit' : 'withdrawal',
        paymentMethod,
        amount: paidAmount,
        description: `${type === 'sale' ? 'Payment received for' : 'Payment made for'} invoice #${invoiceNumber}`,
        category: type === 'sale' ? 'sale' : 'expense',
        reference: {
          type: 'invoice',
          id: invoice._id,
        },
        cafeOwner: req.user.id,
        createdBy: req.user.id,
      });

      await cashRegister.save();
    }

    res.status(201).json({ message: 'Invoice created successfully', invoice });
  } catch (error) {
    res.status(500).json({ message: 'Error creating invoice', error: error.message });
  }
};

// Update invoice payment
const updateInvoicePayment = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const invoice = await Invoice.findOne({
      _id: req.params.id,
      cafeOwner: req.user.id,
    });

    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    if (invoice.status !== 'confirmed') {
      return res.status(400).json({ message: 'Cannot update payment for non-confirmed invoice' });
    }

    const { paidAmount, paymentMethod } = req.body;
    const additionalPayment = paidAmount - invoice.paidAmount;

    if (additionalPayment <= 0) {
      return res.status(400).json({ message: 'New paid amount must be greater than current paid amount' });
    }

    invoice.paidAmount = paidAmount;
    invoice.remainingAmount = invoice.total - paidAmount;
    invoice.paymentStatus = invoice.remainingAmount <= 0 ? 'paid' : 'partial';
    invoice.paymentMethod = paymentMethod;

    await invoice.save();

    // Create cash register entry for the additional payment
    const cashRegister = new CashRegister({
      transactionType: invoice.type === 'sale' ? 'deposit' : 'withdrawal',
      paymentMethod,
      amount: additionalPayment,
      description: `Additional payment for invoice #${invoice.invoiceNumber}`,
      category: invoice.type === 'sale' ? 'sale' : 'expense',
      reference: {
        type: 'invoice',
        id: invoice._id,
      },
      cafeOwner: req.user.id,
      createdBy: req.user.id,
    });

    await cashRegister.save();

    res.json({ message: 'Invoice payment updated successfully', invoice });
  } catch (error) {
    res.status(500).json({ message: 'Error updating invoice payment', error: error.message });
  }
};

// Cancel invoice
const cancelInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findOne({
      _id: req.params.id,
      cafeOwner: req.user.id,
    });

    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    if (invoice.status !== 'confirmed') {
      return res.status(400).json({ message: 'Only confirmed invoices can be cancelled' });
    }

    // Restore stock
    for (const item of invoice.items) {
      const product = await Product.findById(item.product);
      if (product) {
        if (invoice.type === 'sale') {
          product.stockQuantity += item.quantity;
        } else {
          product.stockQuantity -= item.quantity;
        }
        await product.save();
      }
    }

    invoice.status = 'cancelled';
    await invoice.save();

    res.json({ message: 'Invoice cancelled successfully', invoice });
  } catch (error) {
    res.status(500).json({ message: 'Error cancelling invoice', error: error.message });
  }
};

// Get invoice statistics
const getInvoiceStats = async (req, res) => {
  try {
    const { startDate, endDate, type } = req.query;
    const query = { cafeOwner: req.user.id, status: 'confirmed' };

    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    if (type) {
      query.type = type;
    }

    const stats = await Invoice.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          totalInvoices: { $sum: 1 },
          totalAmount: { $sum: '$total' },
          totalPaid: { $sum: '$paidAmount' },
          totalPending: { $sum: '$remainingAmount' },
          averageAmount: { $avg: '$total' },
        },
      },
    ]);

    const byPaymentMethod = await Invoice.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$paymentMethod',
          count: { $sum: 1 },
          total: { $sum: '$paidAmount' },
        },
      },
    ]);

    const byPaymentStatus = await Invoice.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$paymentStatus',
          count: { $sum: 1 },
          total: { $sum: '$total' },
        },
      },
    ]);

    res.json({
      overall: stats[0] || {
        totalInvoices: 0,
        totalAmount: 0,
        totalPaid: 0,
        totalPending: 0,
        averageAmount: 0,
      },
      byPaymentMethod,
      byPaymentStatus,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching invoice statistics', error: error.message });
  }
};

module.exports = {
  getAllInvoices,
  getInvoiceById,
  createInvoice,
  updateInvoicePayment,
  cancelInvoice,
  getInvoiceStats,
}; 