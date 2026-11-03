/**
 * LoanLedger - Interest Calculation Engine
 * Keeps financial calculation formulas configurable without hardcoding.
 */

const config = {
  calculationMethod: process.env.INTEREST_CALCULATION_METHOD || 'CONFIGURABLE_MONTHLY_SIMPLE',
  ratePeriod: process.env.INTEREST_RATE_PERIOD || 'MONTHLY',
  decimalPrecision: 2
};

function roundCurrency(val) {
  if (typeof val !== 'number' || isNaN(val)) return 0;
  return Math.round((val + Number.EPSILON) * Math.pow(10, config.decimalPrecision)) / Math.pow(10, config.decimalPrecision);
}

function calculateElapsedTime(startDate, targetDate = new Date()) {
  const dStart = new Date(startDate);
  const dEnd = new Date(targetDate);

  if (isNaN(dStart.getTime()) || isNaN(dEnd.getTime())) {
    throw new Error('Invalid date provided to calculateElapsedTime');
  }

  if (dEnd < dStart) {
    return {
      elapsedDays: 0,
      elapsedMonths: 0,
      elapsedYears: 0,
      startDate: dStart,
      targetDate: dEnd
    };
  }

  // 1. Elapsed Days
  const utcStart = Date.UTC(dStart.getFullYear(), dStart.getMonth(), dStart.getDate());
  const utcEnd = Date.UTC(dEnd.getFullYear(), dEnd.getMonth(), dEnd.getDate());
  const MS_PER_DAY = 1000 * 60 * 60 * 24;
  const elapsedDays = Math.floor((utcEnd - utcStart) / MS_PER_DAY);

  // 2. Elapsed Years
  let elapsedYears = dEnd.getFullYear() - dStart.getFullYear();
  const startMonth = dStart.getMonth();
  const endMonth = dEnd.getMonth();
  const startDay = dStart.getDate();
  const endDay = dEnd.getDate();

  if (endMonth < startMonth || (endMonth === startMonth && endDay < startDay)) {
    elapsedYears--;
  }
  if (elapsedYears < 0) elapsedYears = 0;

  // 3. Elapsed Months
  let elapsedMonths = (dEnd.getFullYear() - dStart.getFullYear()) * 12 + (endMonth - startMonth);
  const lastDayOfEndMonth = new Date(dEnd.getFullYear(), endMonth + 1, 0).getDate();
  const isEndAtMonthEnd = endDay === lastDayOfEndMonth;

  if (endDay < startDay && !isEndAtMonthEnd) {
    elapsedMonths--;
  }
  if (elapsedMonths < 0) elapsedMonths = 0;

  return {
    elapsedDays,
    elapsedMonths,
    elapsedYears,
    startDate: dStart,
    targetDate: dEnd
  };
}

function calculateInterest(principal, interestRate, startDate, targetDate = new Date(), options = {}) {
  const numPrincipal = Number(principal);
  const numRate = Number(interestRate);

  if (isNaN(numPrincipal) || numPrincipal < 0) {
    throw new Error('Invalid principal amount');
  }
  if (isNaN(numRate) || numRate < 0) {
    throw new Error('Invalid interest rate');
  }

  const time = calculateElapsedTime(startDate, targetDate);
  const method = options.method || config.calculationMethod;
  const ratePeriod = options.ratePeriod || config.ratePeriod;

  let accumulatedInterest = 0;
  let calculationDetails = {};

  const monthlyRatePercent = ratePeriod === 'ANNUAL' ? (numRate / 12) : numRate;
  const monthlyRateDecimal = monthlyRatePercent / 100;

  switch (method) {
    case 'CONFIGURABLE_EXACT_DAYS': {
      const dailyRateDecimal = monthlyRateDecimal / 30;
      accumulatedInterest = numPrincipal * dailyRateDecimal * time.elapsedDays;
      calculationDetails = { basis: 'exact_days', days: time.elapsedDays };
      break;
    }
    case 'CONFIGURABLE_COMPOUND_MONTHLY': {
      if (time.elapsedMonths > 0) {
        const factor = Math.pow(1 + monthlyRateDecimal, time.elapsedMonths);
        accumulatedInterest = numPrincipal * (factor - 1);
      } else {
        accumulatedInterest = 0;
      }
      calculationDetails = { basis: 'compound_monthly', months: time.elapsedMonths };
      break;
    }
    case 'CONFIGURABLE_MONTHLY_SIMPLE':
    default: {
      const interestPerMonth = numPrincipal * monthlyRateDecimal;
      accumulatedInterest = interestPerMonth * time.elapsedMonths;
      calculationDetails = {
        basis: 'monthly_simple_on_original_principal',
        interestPerMonth: roundCurrency(interestPerMonth),
        completedMonths: time.elapsedMonths
      };
      break;
    }
  }

  const finalInterest = roundCurrency(accumulatedInterest);
  const totalPayable = roundCurrency(numPrincipal + finalInterest);

  return {
    principal: numPrincipal,
    interestRate: numRate,
    startDate: time.startDate,
    targetDate: time.targetDate,
    elapsedDays: time.elapsedDays,
    elapsedMonths: time.elapsedMonths,
    elapsedYears: time.elapsedYears,
    accumulatedInterest: finalInterest,
    totalPayable: totalPayable,
    calculationMethod: method,
    ratePeriod: ratePeriod,
    details: calculationDetails
  };
}

module.exports = {
  config,
  roundCurrency,
  calculateElapsedTime,
  calculateInterest
};

