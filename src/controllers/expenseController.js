const Expense = require('../models/Expense');
const CashRegister = require('../models/CashRegister');
const { validationResult } = require('express-validator');

// Get all expenses
const getAllExpenses = async (req, res) => {
  try {
    const { startDate, endDate, category } = req.query;
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

    const expenses = await Expense.find(query)
      .sort({ date: -1 })
      .populate('createdBy', 'name');

    res.json(expenses);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching expenses', error: error.message });
  }
};

// Get expense statistics
const getExpenseStats = async (req, res) => {
  try {
    const stats = await Expense.aggregate([
      { $match: { cafeOwner: req.user.id } },
      {
        $group: {
          _id: '$category',
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 },
          avgAmount: { $avg: '$amount' },
        },
      },
      {
        $project: {
          category: '$_id',
          totalAmount: 1,
          count: 1,
          avgAmount: { $round: ['$avgAmount', 2] },
        },
      },
    ]);

    const monthlyStats = await Expense.aggregate([
      { $match: { cafeOwner: req.user.id } },
      {
        $group: {
          _id: {
            year: { $year: '$date' },
            month: { $month: '$date' },
          },
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': -1, '_id.month': -1 } },
      { $limit: 12 },
    ]);

    res.json({
      categoryStats: stats,
      monthlyStats,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching expense statistics', error: error.message });
  }
};

// Get expense by ID
const getExpenseById = async (req, res) => {
  try {
    const expense = await Expense.findOne({
      _id: req.params.id,
      cafeOwner: req.user.id,
    }).populate('createdBy', 'name');

    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    res.json(expense);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching expense', error: error.message });
  }
};

// Create new expense
const createExpense = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      date,
      description,
      amount,
      category,
      paymentMethod,
      recurring,
      recurringPeriod,
      attachments,
      notes,
    } = req.body;

    const expense = new Expense({
      date: date || new Date(),
      description,
      amount,
      category,
      paymentMethod,
      recurring,
      recurringPeriod,
      attachments,
      notes,
      cafeOwner: req.user.id,
      createdBy: req.user.id,
    });

    await expense.save();

    // Create cash register entry
    const cashRegister = new CashRegister({
      transactionType: 'withdrawal',
      paymentMethod,
      amount,
      description: `Expense: ${description}`,
      category: 'expense',
      reference: {
        type: 'expense',
        id: expense._id,
      },
      cafeOwner: req.user.id,
      createdBy: req.user.id,
    });

    await cashRegister.save();

    res.status(201).json({ message: 'Expense created successfully', expense });
  } catch (error) {
    res.status(500).json({ message: 'Error creating expense', error: error.message });
  }
};

// Update expense
const updateExpense = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const expense = await Expense.findOne({
      _id: req.params.id,
      cafeOwner: req.user.id,
    });

    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    const {
      date,
      description,
      amount,
      category,
      paymentMethod,
      recurring,
      recurringPeriod,
      attachments,
      notes,
    } = req.body;

    expense.date = date || expense.date;
    expense.description = description;
    expense.amount = amount;
    expense.category = category;
    expense.paymentMethod = paymentMethod;
    expense.recurring = recurring;
    expense.recurringPeriod = recurringPeriod;
    expense.attachments = attachments;
    expense.notes = notes;

    await expense.save();

    // Update cash register entry
    await CashRegister.findOneAndUpdate(
      {
        'reference.type': 'expense',
        'reference.id': expense._id,
      },
      {
        amount,
        paymentMethod,
        description: `Expense: ${description}`,
      }
    );

    res.json({ message: 'Expense updated successfully', expense });
  } catch (error) {
    res.status(500).json({ message: 'Error updating expense', error: error.message });
  }
};

// Delete expense
const deleteExpense = async (req, res) => {
  try {
    const expense = await Expense.findOne({
      _id: req.params.id,
      cafeOwner: req.user.id,
    });

    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    await expense.deleteOne();

    // Delete associated cash register entry
    await CashRegister.deleteOne({
      'reference.type': 'expense',
      'reference.id': expense._id,
    });

    res.json({ message: 'Expense deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting expense', error: error.message });
  }
};

module.exports = {
  getAllExpenses,
  getExpenseById,
  createExpense,
  updateExpense,
  deleteExpense,
  getExpenseStats,
}; 