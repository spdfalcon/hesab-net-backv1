const Sale = require('../models/Sale');
const Product = require('../models/Product');
const { validationResult } = require('express-validator');

// Get all sales
const getAllSales = async (req, res) => {
  try {
    const { startDate, endDate, status, paymentStatus } = req.query;
    const query = { cafeOwner: req.user.id };

    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    if (status) {
      query.status = status;
    }

    if (paymentStatus) {
      query.paymentStatus = paymentStatus;
    }

    const sales = await Sale.find(query)
      .sort({ date: -1 })
      .populate('items.product', 'name code price');
    
    res.json(sales);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching sales', error: error.message });
  }
};

// Get sale by ID
const getSaleById = async (req, res) => {
  try {
    const sale = await Sale.findOne({
      _id: req.params.id,
      cafeOwner: req.user.id,
    }).populate('items.product', 'name code price');

    if (!sale) {
      return res.status(404).json({ message: 'Sale not found' });
    }

    res.json(sale);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching sale', error: error.message });
  }
};

// Create new sale
const createSale = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      items,
      tax,
      discount,
      paymentMethod,
      paidAmount,
      customer,
      notes,
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

      if (product.stockQuantity < item.quantity) {
        return res.status(400).json({
          message: `Insufficient stock for product: ${product.name}`,
        });
      }

      const itemTotal = item.quantity * product.price * (1 - (item.discount || 0) / 100);
      subtotal += itemTotal;

      processedItems.push({
        product: product._id,
        quantity: item.quantity,
        unitPrice: product.price,
        discount: item.discount || 0,
        total: itemTotal,
      });

      // Update stock
      product.stockQuantity -= item.quantity;
      await product.save();
    }

    const total = subtotal * (1 - (discount || 0) / 100) + (tax || 0);
    const remainingAmount = total - (paidAmount || 0);
    const paymentStatus = remainingAmount <= 0 ? 'paid' : paidAmount > 0 ? 'partial' : 'unpaid';

    // Generate sale number (you might want to implement a more sophisticated system)
    const saleNumber = `SALE-${Date.now()}`;

    const sale = new Sale({
      saleNumber,
      items: processedItems,
      subtotal,
      tax: tax || 0,
      discount: discount || 0,
      total,
      paymentMethod,
      paymentStatus,
      paidAmount: paidAmount || 0,
      remainingAmount,
      customer,
      notes,
      cafeOwner: req.user.id,
      createdBy: req.user.id,
    });

    await sale.save();
    res.status(201).json({ message: 'Sale created successfully', sale });
  } catch (error) {
    res.status(500).json({ message: 'Error creating sale', error: error.message });
  }
};

// Update sale
const updateSale = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const sale = await Sale.findOne({
      _id: req.params.id,
      cafeOwner: req.user.id,
    });

    if (!sale) {
      return res.status(404).json({ message: 'Sale not found' });
    }

    // Only allow updating payment status, paid amount, and notes
    const { paidAmount, notes } = req.body;

    if (paidAmount !== undefined) {
      sale.paidAmount = paidAmount;
      sale.remainingAmount = sale.total - paidAmount;
      sale.paymentStatus = sale.remainingAmount <= 0 ? 'paid' : paidAmount > 0 ? 'partial' : 'unpaid';
    }

    if (notes !== undefined) {
      sale.notes = notes;
    }

    await sale.save();
    res.json({ message: 'Sale updated successfully', sale });
  } catch (error) {
    res.status(500).json({ message: 'Error updating sale', error: error.message });
  }
};

// Cancel sale
const cancelSale = async (req, res) => {
  try {
    const sale = await Sale.findOne({
      _id: req.params.id,
      cafeOwner: req.user.id,
    });

    if (!sale) {
      return res.status(404).json({ message: 'Sale not found' });
    }

    if (sale.status !== 'completed') {
      return res.status(400).json({ message: 'Sale is already cancelled or refunded' });
    }

    // Restore stock
    for (const item of sale.items) {
      const product = await Product.findById(item.product);
      if (product) {
        product.stockQuantity += item.quantity;
        await product.save();
      }
    }

    sale.status = 'cancelled';
    await sale.save();

    res.json({ message: 'Sale cancelled successfully', sale });
  } catch (error) {
    res.status(500).json({ message: 'Error cancelling sale', error: error.message });
  }
};

// Get sales statistics
const getSalesStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const query = { cafeOwner: req.user.id, status: 'completed' };

    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    const stats = await Sale.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          totalSales: { $sum: 1 },
          totalRevenue: { $sum: '$total' },
          totalPaid: { $sum: '$paidAmount' },
          totalPending: { $sum: '$remainingAmount' },
          averageOrderValue: { $avg: '$total' },
        },
      },
    ]);

    const paymentMethodStats = await Sale.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$paymentMethod',
          count: { $sum: 1 },
          total: { $sum: '$total' },
        },
      },
    ]);

    res.json({
      overall: stats[0] || {
        totalSales: 0,
        totalRevenue: 0,
        totalPaid: 0,
        totalPending: 0,
        averageOrderValue: 0,
      },
      byPaymentMethod: paymentMethodStats,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching sales statistics', error: error.message });
  }
};

module.exports = {
  getAllSales,
  getSaleById,
  createSale,
  updateSale,
  cancelSale,
  getSalesStats,
}; 