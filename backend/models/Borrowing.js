const mongoose = require('mongoose');

const interestHistorySchema = new mongoose.Schema({
  period: {
    type: String, // e.g. "M1", "M2"
    required: true
  },
  calculatedAt: {
    type: Date,
    default: Date.now
  },
  interestAdded: {
    type: Number,
    required: true
  },
  accumulatedInterest: {
    type: Number,
    required: true
  },
  totalPayable: {
    type: Number,
    required: true
  },
  note: {
    type: String,
    default: ''
  }
}, { _id: false });

const borrowingSchema = new mongoose.Schema({
  recordId: {
    type: String,
    required: [true, 'Record ID is required'],
    unique: true,
    trim: true,
    index: true
  },
  // Borrower Information
  surname: {
    type: String,
    required: [true, 'Surname is required'],
    trim: true,
    index: true
  },
  name: {
    type: String,
    required: [true, 'Borrower name is required'],
    trim: true,
    index: true
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true,
    index: true
  },
  altName: {
    type: String,
    trim: true,
    default: ''
  },
  altPhone: {
    type: String,
    trim: true,
    default: ''
  },

  // Borrowing Information
  borrowingDate: {
    type: Date,
    required: [true, 'Borrowing date is required'],
    default: Date.now,
    index: true
  },
  amount: {
    type: Number,
    required: [true, 'Borrowed amount is required'],
    min: [1, 'Borrowed amount must be greater than zero']
  },
  interestRate: {
    type: Number,
    required: [true, 'Interest rate is required'],
    min: [0, 'Interest rate cannot be negative']
  },
  bondPaperName: {
    type: String,
    default: ''
  },
  // Permanent persistent storage of the bond paper image (Base64 data URI)
  bondPaperImage: {
    type: String,
    default: ''
  },

  // Interest Information & Monthly Tracking
  interestInfo: {
    accumulatedInterest: {
      type: Number,
      default: 0
    },
    totalPayable: {
      type: Number,
      default: function () {
        return this.amount || 0;
      }
    },
    elapsedDays: {
      type: Number,
      default: 0
    },
    elapsedMonths: {
      type: Number,
      default: 0
    },
    elapsedYears: {
      type: Number,
      default: 0
    },
    lastCalculatedDate: {
      type: Date,
      default: Date.now
    },
    lastProcessedPeriod: {
      type: String,
      default: ''
    },
    calculationMethod: {
      type: String,
      default: 'CONFIGURABLE_MONTHLY'
    },
    history: [interestHistorySchema]
  }
}, {
  timestamps: true,
  collection: 'borrowings' // Explicitly enforce collection name 'borrowings' in LoanLedger database
});

// Compound index for fast multi-field search
borrowingSchema.index({ surname: 1, name: 1 });

const Borrowing = mongoose.model('Borrowing', borrowingSchema, 'borrowings');

module.exports = Borrowing;

