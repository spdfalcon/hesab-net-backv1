const mongoose = require('mongoose');

const workDaySchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true,
  },
  checkIn: Date,
  checkOut: Date,
  leaveHours: {
    type: Number,
    default: 0,
  },
  workHours: {
    type: Number,
    default: 0,
  },
  description: String,
});

const payrollSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    cafeOwner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    month: {
      type: Number,
      required: true,
      min: 1,
      max: 12,
    },
    year: {
      type: Number,
      required: true,
    },
    workDays: [workDaySchema],
    totalWorkHours: {
      type: Number,
      required: true,
      default: 0,
    },
    totalLeaveHours: {
      type: Number,
      required: true,
      default: 0,
    },
    hourlyRate: {
      type: Number,
      required: true,
    },
    baseSalary: {
      type: Number,
      required: true,
    },
    bonus: {
      type: Number,
      default: 0,
    },
    deductions: {
      type: Number,
      default: 0,
    },
    netSalary: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'paid'],
      default: 'pending',
    },
    paymentDate: Date,
    notes: String,
  },
  {
    timestamps: true,
  }
);

// Add indexes for faster searches
payrollSchema.index({ cafeOwner: 1, userId: 1, year: 1, month: 1 });
payrollSchema.index({ userId: 1, year: 1, month: 1 }, { unique: true });

const Payroll = mongoose.model('Payroll', payrollSchema);

module.exports = Payroll; 