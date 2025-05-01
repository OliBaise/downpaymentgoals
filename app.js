// 🔧 Safe formatting functions
function safeCurrency(n) {
  return isNaN(n) ? "—" : n.toLocaleString(undefined, { maximumFractionDigits: 0 });
}

function safeFixed(n) {
  return isNaN(n) ? "—" : n.toFixed(0);
}

// 🔵 Credit score-based interest and PMI rate mapping
const creditScoreRates = {
  excellent: { interest: 6.5 },
  good: { interest: 6.75 },
  fair: { interest: 7.25 },
  poor: { interest: 8.0 },
  verypoor: { interest: 9.5 }
};

function getDynamicPmiRate(depositPct) {
  const minPct = 0.03;
  const maxPct = 0.19;
  const minRate = 0.0058;
  const maxRate = 0.0186;
  if (depositPct >= maxPct) return 0;
  if (depositPct <= minPct) return maxRate;
  const slope = (minRate - maxRate) / (maxPct - minPct);
  return maxRate + slope * (depositPct - minPct);
}

// 🔵 Populate towns dropdown on page load and handle credit score change

document.addEventListener("DOMContentLoaded", function () {
  const townSelect = document.getElementById("town");
  const creditScoreSelect = document.getElementById("creditScore");
  const interestRateInput = document.getElementById("interestRate");
  const interestRateNote = document.getElementById("interestRateNote");

  try {
    if (typeof townsdata !== "object" || Object.keys(townsdata).length === 0) {
      throw new Error("townsdata is undefined or empty");
    }

    const towns = Object.keys(townsdata).sort();
    townSelect.innerHTML = `<option value="">Select your town or city</option>`;

    towns.forEach(function (town) {
      const option = document.createElement("option");
      option.value = town;
      option.textContent = town;
      townSelect.appendChild(option);
    });

    townSelect.disabled = false;
  } catch (err) {
    console.error("❌ Error loading towns:", err.message);
    townSelect.innerHTML = `<option value="">⚠️ Error loading towns</option>`;
    townSelect.disabled = true;
  }

  creditScoreSelect.addEventListener("change", () => {
    const selected = creditScoreSelect.value;

    if (selected === "custom") {
      interestRateInput.disabled = false;
      interestRateInput.value = "";
      interestRateNote.textContent = "Enter your custom annual interest rate.";
    } else if (creditScoreRates[selected]) {
      const autoRate = creditScoreRates[selected].interest;
      interestRateInput.disabled = true;
      interestRateInput.value = autoRate.toFixed(2);
      interestRateNote.textContent = `Estimated from your credit score: ${selected} = ${autoRate.toFixed(2)}% annual interest.`;
    } else {
      interestRateInput.disabled = true;
      interestRateInput.value = "";
      interestRateNote.textContent = "";
    }
  });
});

// 📘 Methodology
// PMI is calculated dynamically using linear interpolation:
// - 1.86% annual rate at 3% down payment
// - 0.58% annual rate at 19% down payment
// This scale is based on the loan-to-value ratio, reflecting typical ranges found in NerdWallet data.
// If the deposit is 20% or more, PMI is assumed to be zero.

function getLtvAdjustment(depositPct) {
  if (depositPct >= 0.20) return -0.25;
  if (depositPct >= 0.10) return 0.0;
  if (depositPct >= 0.05) return 0.25;
  return 0.50;
}

// 🔵 Handle calculator submission

document.getElementById("calculator").addEventListener("submit", function (e) {
  e.preventDefault();

  const town = document.getElementById("town").value;
  const stateAbbr = town.split(", ")[1];
  const stateName = stateAbbrMap[stateAbbr];
  const stateTaxRate = statePropertyTaxes[stateName] ? statePropertyTaxes[stateName] / 100 : 0.01235;

  const currentAge = parseInt(document.getElementById("age").value);
  const targetAgeInput = document.getElementById("targetAge").value;
  const targetAge = targetAgeInput ? parseInt(targetAgeInput) : null;
  const depositPercentage = parseFloat(document.getElementById("depositPercentage").value) / 100;
  const currentSavings = parseFloat(document.getElementById("savings").value) || 0;
  const monthlySaving = parseFloat(document.getElementById("monthlySaving").value) || 0;
  let interestRate = parseFloat(document.getElementById("interestRate").value) / 100;
  const mortgageLength = parseInt(document.getElementById("mortgageLength").value) || 30;
  const selectedScore = document.getElementById("creditScore").value;

  if (!townsdata[town]) {
    document.getElementById("result").innerHTML = `<p style="color: red;">⚠️ No data available for town: ${town}.</p>`;
    return;
  }

  let pmiRate = getDynamicPmiRate(depositPercentage);
  if (creditScoreRates[selectedScore] && selectedScore !== "custom") {
    const baseRate = creditScoreRates[selectedScore].interest;
    const ltvAdjustment = getLtvAdjustment(depositPercentage);
    interestRate = (baseRate + ltvAdjustment) / 100;
  }

  const result = document.getElementById("result");
  const currentYear = new Date().getFullYear();
  const townYears = townsdata[town];
  const availableYears = Object.keys(townYears).map(y => parseInt(y)).sort((a, b) => a - b);

  let targetYear;
  if (targetAge) {
    targetYear = currentYear + (targetAge - currentAge);
  } else if (monthlySaving > 0) {
    const rawPriceNow = parseFloat(townYears[availableYears[0]].toString().replace(/,/g, ''));
    const depositRequiredNow = rawPriceNow * depositPercentage;
    const depositNeededNow = depositRequiredNow - currentSavings;
    const monthsToSave = Math.ceil(depositNeededNow / monthlySaving);
    const yearsToSave = Math.ceil(monthsToSave / 12);
    targetYear = currentYear + yearsToSave;
    if (!townYears[targetYear]) {
      targetYear = availableYears[availableYears.length - 1];
    }
  } else {
    targetYear = availableYears[0];
  }

  if (!townYears[targetYear]) {
  result.innerHTML = `<p style="color: red;">⚠️ No house price data available for ${targetYear} in ${town}.</p>`;
  return;
}

const rawPrice = townYears[targetYear];
  const housePrice = parseFloat(rawPrice.toString().replace(/,/g, ''));
  const depositRequired = housePrice * depositPercentage;
  const depositNeeded = depositRequired - currentSavings;

  const numberOfMonths = targetAge ? (targetAge - currentAge) * 12 : 12;
  const monthlySavingsNeeded = depositNeeded / numberOfMonths;

  const loanAmount = housePrice - depositRequired;
  const monthlyInterestRate = interestRate / 12;
  const numberOfPayments = mortgageLength * 12;

  const monthlyMortgagePayment = loanAmount *
    (monthlyInterestRate * Math.pow(1 + monthlyInterestRate, numberOfPayments)) /
    (Math.pow(1 + monthlyInterestRate, numberOfPayments) - 1);

  const salaryNeeded = (monthlyMortgagePayment + ((housePrice * stateTaxRate) / 12) + ((loanAmount * pmiRate) / 12)) * 12 / 0.28;

  let html = "";
  html += `<p>Estimated starter home cost in ${town} in ${targetYear}: <strong>$${safeCurrency(housePrice)}</strong></p>`;
  html += `<p>${(depositPercentage * 100).toFixed(0)}% down payment needed: <strong>$${safeCurrency(depositRequired)}</strong></p>`;
  html += `<p>Total amount you need to save (down payment minus current savings): <strong>$${safeCurrency(depositNeeded)}</strong></p>`;

  if (targetAge) {
    html += `<p>What you need to save each month: <strong>$${safeFixed(monthlySavingsNeeded)}</strong></p>`;
  } else if (monthlySaving > 0) {
    const monthsToSave = Math.ceil(depositNeeded / monthlySaving);
    html += `<p>How many months you need to save: <strong>${monthsToSave}</strong> ($${safeFixed(depositNeeded)} ÷ $${safeFixed(monthlySaving)})</p>`;
  }

  const pmiMonthly = (loanAmount * pmiRate) / 12;
  const taxesInsuranceMonthly = (housePrice * stateTaxRate) / 12;
  const totalMonthlyPayment = monthlyMortgagePayment + pmiMonthly + taxesInsuranceMonthly;

  html += `<p>Total monthly mortgage repayment: <strong>$${safeFixed(totalMonthlyPayment)}</strong></p>`;

  html += `
<p style="font-size: 0.9em; color: #555;">
  Based on:
</p>
<p>
  • Loan amount: <strong>$${safeCurrency(loanAmount)}</strong><br>
  • Repayment period: <strong>${numberOfPayments} months</strong> over <strong>${mortgageLength} years</strong><br>
  • Monthly interest rate: <strong>${(monthlyInterestRate * 100).toFixed(2)}%</strong><br>
  • Annual interest rate: <strong>${(interestRate * 100).toFixed(2)}%</strong>
</p>
<p style="font-size: 0.9em; color: #555;">
  Your monthly payment includes:
</p>
<ul style="margin-bottom: 1em;">
  <li>Principal and interest: <strong>$${safeFixed(monthlyMortgagePayment)}</strong></li>
  <li>Property taxes and insurance: <strong>$${safeFixed(taxesInsuranceMonthly)}</strong><br>
      (calculated as ${ (stateTaxRate * 100).toFixed(3) }% of the home price annually in ${stateName}, divided by 12)</li>
  <li>PMI: <strong>$${safeFixed(pmiMonthly)}</strong><br>
      (based on ${(pmiRate * 100).toFixed(2)}% of the loan amount annually, divided by 12)</li>
</ul>`;

  html += `<strong><p>Salary you need to cover this (so your total monthly repayments don't exceed 28% of your gross monthly salary): $${safeCurrency(salaryNeeded)}</strong></p>`;

  result.innerHTML = html;
});
