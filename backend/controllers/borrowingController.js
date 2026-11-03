const Borrowing = require('../models/Borrowing');
const { calculateInterest } = require('../utils/interestCalculator');
const { processMonthlyInterestUpdates } = require('../utils/scheduler');

function escapeRegex(text) {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
}

/**
 * Create a new borrowing record in MongoDB Atlas
 */
exports.createBorrowing = async (req, res) => {
  try {
    const {
      recordId,
      surname,
      name,
      phone,
      altName,
      altPhone,
      amount,
      interestRate,
      borrowingDate,
      bondPaperName,
      bondPaperImage
    } = req.body;

    if (!surname || !surname.trim()) {
      return res.status(400).json({ success: false, error: 'Surname is required' });
    }
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, error: 'Borrower name is required' });
    }
    if (!phone || !phone.trim()) {
      return res.status(400).json({ success: false, error: 'Phone number is required' });
    }
    const cleanPhone = phone.trim().replace(/\D/g, '');
    if (cleanPhone.length !== 10) {
      return res.status(400).json({ success: false, error: 'Phone number must be a valid 10-digit number' });
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return res.status(400).json({ success: false, error: 'Borrowed amount must be a positive number' });
    }

    const numRate = parseFloat(interestRate);
    if (isNaN(numRate) || numRate < 0) {
      return res.status(400).json({ success: false, error: 'Interest rate cannot be negative' });
    }

    const finalRecordId = recordId && recordId.trim()
      ? recordId.trim()
      : `VB-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const finalBorrowingDate = borrowingDate ? new Date(borrowingDate) : new Date();
    const initialCalc = calculateInterest(numAmount, numRate, finalBorrowingDate, new Date());

    const newBorrowing = new Borrowing({
      recordId: finalRecordId,
      surname: surname.trim(),
      name: name.trim(),
      phone: cleanPhone,
      altName: altName ? altName.trim() : '',
      altPhone: altPhone ? altPhone.trim().replace(/\D/g, '') : '',
      amount: numAmount,
      interestRate: numRate,
      borrowingDate: finalBorrowingDate,
      bondPaperName: bondPaperName || '',
      bondPaperImage: bondPaperImage || '', // Permanent Base64 image data stored in MongoDB Atlas
      interestInfo: {
        accumulatedInterest: initialCalc.accumulatedInterest,
        totalPayable: initialCalc.totalPayable,
        elapsedDays: initialCalc.elapsedDays,
        elapsedMonths: initialCalc.elapsedMonths,
        elapsedYears: initialCalc.elapsedYears,
        lastCalculatedDate: new Date(),
        lastProcessedPeriod: `M${initialCalc.elapsedMonths}`,
        calculationMethod: initialCalc.calculationMethod,
        history: []
      }
    });

    const saved = await newBorrowing.save();

    res.status(201).json({
      success: true,
      message: 'Borrowing record successfully saved to MongoDB Atlas',
      record: saved
    });
  } catch (error) {
    console.error('[Controller] Error creating borrowing:', error);
    if (error.code === 11000) {
      return res.status(409).json({ success: false, error: 'A borrowing record with this ID already exists.' });
    }
    res.status(500).json({ success: false, error: error.message || 'Server error creating record' });
  }
};

/**
 * Search borrowing records by surname, actual name, or mobile number
 * SPEC REQUIREMENT: Returns strictly surname, name, phone
 */
exports.searchBorrowings = async (req, res) => {
  try {
    const rawQuery = (req.query.q || req.query.query || '').trim();
    let filter = {};

    if (rawQuery) {
      const escaped = escapeRegex(rawQuery);
      const nameRegex = new RegExp(escaped, 'i');
      const cleanDigits = rawQuery.replace(/\D/g, '');

      const orConditions = [
        { surname: nameRegex },
        { name: nameRegex }
      ];

      if (cleanDigits.length > 0) {
        orConditions.push({ phone: new RegExp(cleanDigits) });
        orConditions.push({ altPhone: new RegExp(cleanDigits) });
      }

      filter = { $or: orConditions };
    }

    const results = await Borrowing.find(filter)
      .select('recordId surname name phone createdAt')
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      success: true,
      query: rawQuery,
      count: results.length,
      records: results.map(r => ({
        id: r.recordId || r._id,
        recordId: r.recordId,
        surname: r.surname,
        name: r.name,
        phone: r.phone
      }))
    });
  } catch (error) {
    console.error('[Controller] Error searching records:', error);
    res.status(500).json({ success: false, error: 'Failed to search borrowing records' });
  }
};

/**
 * Get individual borrowing record by ID with real-time interest calculation
 */
exports.getBorrowingById = async (req, res) => {
  try {
    const idParam = req.params.id;
    let record = await Borrowing.findOne({ recordId: idParam }).lean();

    if (!record && idParam.match(/^[0-9a-fA-F]{24}$/)) {
      record = await Borrowing.findById(idParam).lean();
    }

    if (!record) {
      return res.status(404).json({
        success: false,
        error: `Borrowing record '${idParam}' was not found in MongoDB Atlas.`
      });
    }

    const now = new Date();
    const liveCalc = calculateInterest(
      record.amount,
      record.interestRate,
      record.borrowingDate,
      now
    );

    const responseData = {
      recordId: record.recordId,
      borrower: {
        surname: record.surname,
        name: record.name,
        phone: record.phone,
        altName: record.altName || '-',
        altPhone: record.altPhone || '-'
      },
      borrowing: {
        originalDate: record.borrowingDate,
        originalAmount: record.amount,
        interestRate: record.interestRate,
        bondPaperName: record.bondPaperName || '',
        bondPaperImage: record.bondPaperImage || ''
      },
      interest: {
        elapsedDays: liveCalc.elapsedDays,
        elapsedMonths: liveCalc.elapsedMonths,
        elapsedYears: liveCalc.elapsedYears,
        accumulatedInterest: liveCalc.accumulatedInterest,
        totalPayable: liveCalc.totalPayable,
        lastCalculatedDate: record.interestInfo?.lastCalculatedDate || now,
        lastProcessedPeriod: record.interestInfo?.lastProcessedPeriod || `M${liveCalc.elapsedMonths}`,
        calculationMethod: liveCalc.calculationMethod,
        history: record.interestInfo?.history || []
      }
    };

    res.json({
      success: true,
      record: responseData
    });
  } catch (error) {
    console.error('[Controller] Error fetching borrowing details:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch borrowing details' });
  }
};

/**
 * Get detailed interest calculation for a record
 */
exports.getBorrowingInterest = async (req, res) => {
  try {
    const idParam = req.params.id;
    let record = await Borrowing.findOne({ recordId: idParam }).lean();
    if (!record && idParam.match(/^[0-9a-fA-F]{24}$/)) {
      record = await Borrowing.findById(idParam).lean();
    }

    if (!record) {
      return res.status(404).json({ success: false, error: 'Record not found' });
    }

    const asOf = req.query.asOf ? new Date(req.query.asOf) : new Date();
    const calc = calculateInterest(record.amount, record.interestRate, record.borrowingDate, asOf);

    res.json({
      success: true,
      recordId: record.recordId,
      asOfDate: asOf,
      calculation: calc,
      storedHistory: record.interestInfo?.history || []
    });
  } catch (error) {
    console.error('[Controller] Error in interest endpoint:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Trigger monthly updates across all records
 */
exports.triggerMonthlyUpdate = async (req, res) => {
  try {
    const asOfDate = req.body.asOfDate ? new Date(req.body.asOfDate) : new Date();
    const result = await processMonthlyInterestUpdates(asOfDate);
    res.json({
      success: true,
      message: 'Monthly update process executed',
      result
    });
  } catch (error) {
    console.error('[Controller] Error in monthly updater:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

