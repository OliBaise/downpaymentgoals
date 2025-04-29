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
  result.innerHTML = `<p style="color: red;">⚠️ No house price data available for the selected year for ${town}.</p>`;
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

  let html = `
  <p>Estimated starter house price when you can afford your down payment (${targetYear}) : <strong>$${safeCurrency(housePrice)}</strong></p>
  <p>Down payment required (${(depositPercentage * 100).toFixed(0)}% of house price): <strong>$${safeCurrency(depositRequired)}</strong></p>
  <p>Down payment required minus current savings: <strong>$${safeCurrency(depositNeeded)}</strong></p>
`;

if (targetAge) {
  html += `<p>Monthly savings needed: <strong>$${safeFixed(monthlySavingsNeeded)}</strong></p>`;
}

html += `
  <p>Estimated monthly mortgage repayment: <strong>$${safeFixed(monthlyMortgagePayment)}</strong></p>
 <p style="font-size: 0.9em; color: #555;">
  (Based on a loan of $${safeCurrency(loanAmount)}, a monthly interest rate of ${(monthlyInterestRate * 100).toFixed(2)}% — calculated as your ${interestRate * 100}% annual interest rate divided by 12 — and ${numberOfPayments} monthly payments over ${mortgageLength} years.)
</p>
  <p>Salary needed to afford mortgage (so your mortgage repayments do not exceed 28% of your gross salary): <strong>$${safeCurrency(salaryNeeded)}</strong></p>
`;

if (monthlySaving > 0) {
  const monthsToSave = Math.ceil(depositNeeded / monthlySaving);
  html += `<p style="margin-top:10px;"><strong>At $${safeCurrency(monthlySaving)} saved per month, you would need approximately ${monthsToSave} months to save for your deposit.</strong></p>`;
}

result.innerHTML = html;
});
