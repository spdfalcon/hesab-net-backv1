const CashRegister = require('../models/CashRegister');
const { validationResult } = require('express-validator');

// Get all transactions
const getAllTransactions = async (req, res) => {
  try {
    const { startDate, endDate, category, paymentMethod } = req.query;
    const query = { cafeOwner: req.user.id };

    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    if (category) {
      query.category = category;
    }

    if (paymentMethod) {
      query.paymentMethod = paymentMethod;
    }

    const transactions = await CashRegister.find(query)
      .sort({ date: -1 })
      .populate('createdBy', 'name')
      .populate({
        path: 'reference.id',
        select: 'saleNumber total items -_id',
      });

    res.json(transactions);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching transactions', error: error.message });
  }
};

// Get transaction by ID
const getTransactionById = async (req, res) => {
  try {
    const transaction = await CashRegister.findOne({
      _id: req.params.id,
      cafeOwner: req.user.id,
    })
      .populate('createdBy', 'name')
      .populate({
        path: 'reference.id',
        select: 'saleNumber total items -_id',
      });

    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    res.json(transaction);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching transaction', error: error.message });
  }
};

// Create new transaction
const createTransaction = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      transactionType,
      paymentMethod,
      amount,
      description,
      category,
      reference,
      notes,
    } = req.body;

    // Get current balance
    const lastTransaction = await CashRegister.findOne({ cafeOwner: req.user.id })
      .sort({ date: -1 })
      .select('balance');

    const currentBalance = lastTransaction ? lastTransaction.balance : 0;
    const newBalance = transactionType === 'deposit' 
      ? currentBalance + amount 
      : currentBalance - amount;

    if (transactionType === 'withdrawal' && newBalance < 0) {
      return res.status(400).json({ message: 'Insufficient funds for withdrawal' });
    }

    const transaction = new CashRegister({
      transactionType,
      paymentMethod,
      amount,
      balance: newBalance,
      description,
      category,
      reference,
      notes,
      cafeOwner: req.user.id,
      createdBy: req.user.id,
    });

    await transaction.save();
    res.status(201).json({ message: 'Transaction created successfully', transaction });
  } catch (error) {
    res.status(500).json({ message: 'Error creating transaction', error: error.message });
  }
};

// Get cash register summary
const getCashRegisterSummary = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const query = { cafeOwner: req.user.id };

    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    const summary = await CashRegister.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          totalDeposits: {
            $sum: {
              $cond: [{ $eq: ['$transactionType', 'deposit'] }, '$amount', 0],
            },
          },
          totalWithdrawals: {
            $sum: {
              $cond: [{ $eq: ['$transactionType', 'withdrawal'] }, '$amount', 0],
            },
          },
          currentBalance: { $last: '$balance' },
        },
      },
    ]);

    const byCategory = await CashRegister.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$category',
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
    ]);

    const byPaymentMethod = await CashRegister.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$paymentMethod',
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
    ]);

    res.json({
      overall: summary[0] || {
        totalDeposits: 0,
        totalWithdrawals: 0,
        currentBalance: 0,
      },
      byCategory,
      byPaymentMethod,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching cash register summary', error: error.message });
  }
};

module.exports = {
  getAllTransactions,
  getTransactionById,
  createTransaction,
  getCashRegisterSummary,
}; 