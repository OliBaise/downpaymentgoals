// 🔧 Safe formatting functions
function safeCurrency(n) {
  return isNaN(n) ? "—" : n.toLocaleString(undefined, { maximumFractionDigits: 0 });
}

function safeFixed(n) {
  return isNaN(n) ? "—" : n.toFixed(0);
}

// 🔵 Populate towns dropdown on page load
document.addEventListener("DOMContentLoaded", function () {
  const townSelect = document.getElementById("town");

  if (typeof townsdata === "undefined") {
    console.error("❌ townsdata is not defined. Check if townsData.js is loaded correctly.");
    return;
  }

  const towns = Object.keys(townsdata).sort();
  townSelect.innerHTML = `<option value="">Select your town or city</option>`;

  towns.forEach(function (town) {
    const option = document.createElement("option");
    option.value = town;
    option.textContent = town;
    townSelect.appendChild(option);
  });
});

// 🔵 Handle calculator submission
document.getElementById("calculator").addEventListener("submit", function (e) {
  e.preventDefault();

  const town = document.getElementById("town").value;
const currentAge = parseInt(document.getElementById("age").value);
const targetAgeInput = document.getElementById("targetAge").value;
const targetAge = targetAgeInput ? parseInt(targetAgeInput) : null;
const depositPercentage = parseFloat(document.getElementById("depositPercentage").value) / 100;
const currentSavings = parseFloat(document.getElementById("savings").value) || 0;
const monthlySaving = parseFloat(document.getElementById("monthlySaving").value) || 0;
const interestRate = (parseFloat(document.getElementById("interestRate").value) / 100) || 0.05;
const mortgageLength = parseInt(document.getElementById("mortgageLength").value) || 30;

const result = document.getElementById("result");
result.innerHTML = "";

// ✅ NEW CHECK
if (targetAge && monthlySaving) {
  result.innerHTML = `<p style="color: red;">⚠️ Please fill in only one: either the "Age you want to buy a home" or the "Monthly amount you can save" — not both.</p>`;
  return;
}

// ✅ EXISTING CHECK
if (!targetAge && !monthlySaving) {
  result.innerHTML = `<p style="color: red;">⚠️ Please fill in either "Age you want to buy a home" or "Monthly amount you can save".</p>`;
  return;
}


  if (!townsdata[town]) {
    result.innerHTML = `<p style="color: red;">⚠️ No data available for town: ${town}.</p>`;
    return;
  }

  const currentYear = new Date().getFullYear();
  const townYears = townsdata[town];
let targetYear;

const availableYears = Object.keys(townYears).map(y => parseInt(y)).sort((a, b) => a - b);

if (targetAge) {
  targetYear = currentYear + (targetAge - currentAge);
} else if (monthlySaving > 0) {
  const rawPriceNow = parseFloat(townYears[availableYears[0]].toString().replace(/,/g, ''));
  const depositRequiredNow = rawPriceNow * depositPercentage;
  const depositNeededNow = depositRequiredNow - currentSavings;
  const monthsToSave = Math.ceil(depositNeededNow / monthlySaving);
  const yearsToSave = Math.ceil(monthsToSave / 12);
  targetYear = currentYear + yearsToSave;

  // Fallback if targetYear exceeds dataset
  if (!townYears[targetYear]) {
    targetYear = availableYears[availableYears.length - 1];
  }
} else {
  targetYear = availableYears[0];
}

const rawPrice = townYears[targetYear];

if (!rawPrice) {
  const maxYear = availableYears[availableYears.length - 1];
  if (monthlySaving > 0) {
    result.innerHTML = `<p style="color: red;">⚠️ Saving $${safeCurrency(monthlySaving)} a month is not enough to cover a down payment in ${town} by 2058, the latest year in our projections.</p>`;
  } else {
    result.innerHTML = `<p style="color: red;">⚠️ No house price data available for the selected year for ${town}.</p>`;
  }
  return;
}


const housePrice = parseFloat(rawPrice.toString().replace(/,/g, ''));
  const depositRequired = housePrice * depositPercentage;
  const depositNeeded = depositRequired - currentSavings;

  if (depositNeeded <= 0) {
    result.innerHTML = `<p>🎉 Congratulations! You already have enough savings for your deposit.</p>`;
    return;
  }

  const numberOfMonths = targetAge ? (targetAge - currentAge) * 12 : 12;
  const monthlySavingsNeeded = depositNeeded / numberOfMonths;

  const loanAmount = housePrice - depositRequired;
  const monthlyInterestRate = interestRate / 12;
  const numberOfPayments = mortgageLength * 12;

  const monthlyMortgagePayment = loanAmount * 
  (monthlyInterestRate * Math.pow(1 + monthlyInterestRate, numberOfPayments)) /
  (Math.pow(1 + monthlyInterestRate, numberOfPayments) - 1);

  const salaryNeeded = (monthlyMortgagePayment * 12) / 0.28;
 
  // 🔵 ADDITIONAL COSTS
let pmiMonthly = 0;
if (depositPercentage < 0.20) {
  pmiMonthly = (loanAmount * 0.01) / 12; // 1% annually
}

const taxesInsuranceMonthly = (housePrice * 0.01235) / 12;

const totalMonthlyPayment = monthlyMortgagePayment + pmiMonthly + taxesInsuranceMonthly;

  let html = `
  <p>Estimated starter house price when you can afford your down payment (${targetYear}) : <strong>$${safeCurrency(housePrice)}</strong></p>
  <p>Down payment required (${(depositPercentage * 100).toFixed(0)}% of house price): <strong>$${safeCurrency(depositRequired)}</strong></p>
  <p>Down payment required minus current savings: <strong>$${safeCurrency(depositNeeded)}</strong></p>
`;

if (targetAge) {
  const monthsToSave = (targetAge - currentAge) * 12;
  html += `<p>Monthly savings needed ($${safeCurrency(depositRequired)} - $${safeCurrency(currentSavings)} ÷ ${monthsToSave} months): <strong>$${safeFixed(monthlySavingsNeeded)}</strong></p>`;
}

html += `
  <p>Estimated monthly mortgage repayment (principal & interest): <strong>$${safeFixed(monthlyMortgagePayment)}</strong></p>
`;

// 🔵 PMI rate based on deposit tier
// 🔵 PMI rate based on deposit tier
let pmiRate = 0;

if (depositPercentage < 0.05) {
  pmiRate = 0.011; // 1.1%
} else if (depositPercentage < 0.10) {
  pmiRate = 0.009; // 0.9%
} else if (depositPercentage < 0.15) {
  pmiRate = 0.005; // 0.5%
} else if (depositPercentage < 0.20) {
  pmiRate = 0.003; // 0.3%
}

const pmiMonthly = (loanAmount * pmiRate) / 12;
const taxesInsuranceMonthly = (housePrice * 0.01235) / 12;
const totalMonthlyPayment = monthlyMortgagePayment + pmiMonthly + taxesInsuranceMonthly;

html += `
  <p>Estimated monthly mortgage repayment (principal & interest): $<strong>${safeFixed(monthlyMortgagePayment)}</strong></p>
`;

if (pmiMonthly > 0) {
  html += `<p>PMI (Private Mortgage Insurance): $<strong>${safeFixed(pmiMonthly)}</strong> (based on ${(pmiRate * 100).toFixed(2)}% annually — required because deposit is under 20%)</p>`;
}

html += `
  <p>Estimated monthly property taxes & insurance: $<strong>${safeFixed(taxesInsuranceMonthly)}</strong> (based on 1.235% of house price annually)</p>
  <p>Total estimated monthly payment (PITI${pmiMonthly > 0 ? " + PMI" : ""}): $<strong>${safeFixed(totalMonthlyPayment)}</strong></p>
  <p style="font-size: 0.9em; color: #555;">
    (Loan amount: $${safeCurrency(loanAmount)}, monthly interest rate: ${(monthlyInterestRate * 100).toFixed(2)}%, loan term: ${numberOfPayments} payments over ${mortgageLength} years.)
  </p>
  <p>Salary needed to afford mortgage (so your mortgage repayments do not exceed 28% of your gross salary): $<strong>${safeCurrency(salaryNeeded)}</strong></p>
`;


if (monthlySaving > 0) {
  const monthsToSave = Math.ceil(depositNeeded / monthlySaving);
  html += `<p style="margin-top:10px;">At $<strong>${safeCurrency(monthlySaving)}</strong> saved per month, you would need approximately <strong>${monthsToSave}</strong> months to save for your deposit.</p>`;
}

result.innerHTML = html;
});
