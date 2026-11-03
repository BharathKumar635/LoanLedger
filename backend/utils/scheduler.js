/**
 * LoanLedger - Monthly Interest Scheduler
 * Handles automated monthly interest updates with duplicate prevention and catch-up.
 */

const cron = require('node-cron');
const Borrowing = require('../models/Borrowing');
const { calculateInterest, roundCurrency } = require('./interestCalculator');

async function processMonthlyInterestUpdates(asOfDate = new Date()) {
  console.log(`[Scheduler] Checking monthly interest updates as of ${asOfDate.toISOString()}...`);

  let processedCount = 0;
  let updatedCount = 0;
  let skippedCount = 0;

  try {
    const borrowings = await Borrowing.find({});
    processedCount = borrowings.length;

    for (const record of borrowings) {
      try {
        const calc = calculateInterest(
          record.amount,
          record.interestRate,
          record.borrowingDate,
          asOfDate
        );

        const currentPeriodKey = `M${calc.elapsedMonths}`;
        const lastProcessed = record.interestInfo ? record.interestInfo.lastProcessedPeriod : '';

        if (calc.elapsedMonths === 0) {
          record.interestInfo.elapsedDays = calc.elapsedDays;
          record.interestInfo.lastCalculatedDate = asOfDate;
          record.interestInfo.lastProcessedPeriod = 'M0';
          await record.save();
          skippedCount++;
          continue;
        }

        if (lastProcessed === currentPeriodKey) {
          record.interestInfo.elapsedDays = calc.elapsedDays;
          record.interestInfo.lastCalculatedDate = asOfDate;
          await record.save();
          skippedCount++;
          continue;
        }

        const existingHistory = (record.interestInfo && record.interestInfo.history) ? record.interestInfo.history : [];
        const existingPeriods = new Set(existingHistory.map(h => h.period));
        const monthlyRate = record.interestRate / 100;
        const interestPerMonth = roundCurrency(record.amount * monthlyRate);

        for (let m = 1; m <= calc.elapsedMonths; m++) {
          const pKey = `M${m}`;
          if (!existingPeriods.has(pKey)) {
            const milestoneInterest = roundCurrency(interestPerMonth * m);
            const milestoneTotal = roundCurrency(record.amount + milestoneInterest);
            existingHistory.push({
              period: pKey,
              calculatedAt: asOfDate,
              interestAdded: interestPerMonth,
              accumulatedInterest: milestoneInterest,
              totalPayable: milestoneTotal,
              note: `Monthly interest cycle ${m} on principal ₹${record.amount}`
            });
            existingPeriods.add(pKey);
          }
        }

        record.interestInfo.accumulatedInterest = calc.accumulatedInterest;
        record.interestInfo.totalPayable = calc.totalPayable;
        record.interestInfo.elapsedDays = calc.elapsedDays;
        record.interestInfo.elapsedMonths = calc.elapsedMonths;
        record.interestInfo.elapsedYears = calc.elapsedYears;
        record.interestInfo.lastCalculatedDate = asOfDate;
        record.interestInfo.lastProcessedPeriod = currentPeriodKey;
        record.interestInfo.history = existingHistory;

        await record.save();
        updatedCount++;
      } catch (err) {
        console.error(`[Scheduler] Error on record ${record.recordId}:`, err.message);
      }
    }

    return { success: true, processedCount, updatedCount, skippedCount };
  } catch (err) {
    console.error('[Scheduler] Error in updater:', err.message);
    return { success: false, error: err.message };
  }
}

function initScheduler() {
  processMonthlyInterestUpdates().catch(() => {});
  return cron.schedule('5 0 * * *', async () => {
    try {
      await processMonthlyInterestUpdates();
    } catch (e) {
      console.error('[Scheduler] Cron error:', e.message);
    }
  });
}

module.exports = {
  processMonthlyInterestUpdates,
  initScheduler
};

