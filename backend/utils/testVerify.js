/**
 * LoanLedger Backend Automated Verification Script
 */

const mongoose = require('mongoose');
const Borrowing = require('../models/Borrowing');
const { calculateInterest, calculateElapsedTime } = require('./interestCalculator');

async function verify() {
  console.log('================================================================');
  console.log('  LOANLEDGER BACKEND VERIFICATION');
  console.log('================================================================\n');

  // 1. Verify schema definition
  console.log('[Test 1] Checking Mongoose Schema & Collection Name...');
  if (Borrowing.collection.name !== 'borrowings') {
    throw new Error(`Expected collection name 'borrowings', got '${Borrowing.collection.name}'`);
  }
  console.log(`[PASS] Collection is explicitly '${Borrowing.collection.name}'`);

  // 2. Verify Schema Fields
  console.log('[Test 2] Checking Required Fields in Schema...');
  const paths = Object.keys(Borrowing.schema.paths);
  const requiredFields = [
    'surname',
    'name',
    'phone',
    'altName',
    'altPhone',
    'borrowingDate',
    'amount',
    'interestRate',
    'bondPaperImage',
    'recordId',
    'createdAt',
    'updatedAt'
  ];

  for (const field of requiredFields) {
    if (!paths.includes(field)) {
      throw new Error(`Missing expected field '${field}' in Borrowing schema`);
    }
  }
  console.log('[PASS] All required borrowing fields and timestamps present in schema');

  // 3. Verify Interest Calculation Engine
  console.log('[Test 3] Testing Configurable Interest Calculation Engine...');
  const calc1 = calculateInterest(100000, 2.0, '2026-08-04', '2026-11-04');
  if (calc1.elapsedMonths !== 3) {
    throw new Error(`Expected 3 elapsed months, got ${calc1.elapsedMonths}`);
  }
  if (calc1.accumulatedInterest !== 6000) {
    throw new Error(`Expected ₹6,000 accumulated interest, got ₹${calc1.accumulatedInterest}`);
  }
  if (calc1.totalPayable !== 106000) {
    throw new Error(`Expected ₹106,000 total payable, got ₹${calc1.totalPayable}`);
  }
  console.log(`[PASS] Interest calculation accurate: 3 months @ 2% on ₹100,000 = ₹${calc1.accumulatedInterest}, total = ₹${calc1.totalPayable}`);

  // 4. Verify Month Lengths & Leap Year Math
  console.log('[Test 4] Testing Calendar & Leap Year Handling...');
  const nonLeap = calculateElapsedTime('2025-01-31', '2025-02-28');
  if (nonLeap.elapsedMonths !== 1) {
    throw new Error(`Expected 1 month for Jan 31 -> Feb 28, got ${nonLeap.elapsedMonths}`);
  }
  const leap = calculateElapsedTime('2024-01-31', '2024-02-29');
  if (leap.elapsedMonths !== 1) {
    throw new Error(`Expected 1 month for Jan 31 -> Feb 29 (leap year), got ${leap.elapsedMonths}`);
  }
  console.log('[PASS] Leap year and month-end dates handled accurately');

  console.log('\n================================================================');
  console.log('  ALL BACKEND ENGINE CHECKS PASSED');
  console.log('================================================================\n');
}

verify().catch(err => {
  console.error('[FAIL]', err.message);
  process.exit(1);
});

