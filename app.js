// 🔧 Safe formatting functions
function safeCurrency(n) {
  return isNaN(n) ? "—" : n.toLocaleString(undefined, { maximumFractionDigits: 0 });
}

function safeFixed(n) {
  return isNaN(n) ? "—" : n.toFixed(0);
}

// 🔵 Credit score-based interest and PMI rate mapping
const creditScoreRates = {
  excellent: { interest: 6.5, pmi: 0.003 },
  good: { interest: 6.75, pmi: 0.005 },
  fair: { interest: 7.25, pmi: 0.007 },
  poor: { interest: 8.0, pmi: 0.009 },
  verypoor: { interest: 9.5, pmi: 0.011 }
};

function getDynamicPmiRate(depositPct) {
  // Linearly interpolate between 1.86% at 3% down and 0.58% at 19% down
  const minPct = 0.03;
  const maxPct = 0.19;
  const minRate = 0.0058; // 0.58%
  const maxRate = 0.0186; // 1.86%
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

  townSelect.addEventListener("change", function () {
    const selectedTown = townSelect.value;
    const stateAbbr = selectedTown.split(", ")[1];
    const stateName = stateAbbrMap[stateAbbr];
    const display = document.getElementById("stateDisplay");

    if (stateName) {
      display.textContent = `State selected: ${stateName}`;
    } else {
      display.textContent = "";
    }
  });

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

// 🔵 Handle calculator submission

document.getElementById("calculator").addEventListener("submit", function (e) {
  e.preventDefault();

  const result = document.getElementById("result");
  result.innerHTML = "";

  const selectedScore = document.getElementById("creditScore").value;
  if (!selectedScore) {
    result.innerHTML = `<p style="color: red;">⚠️ Please select your credit score range or choose \"Custom\" to enter your own interest rate.</p>`;
    return;
  }

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

  let pmiRate = getDynamicPmiRate(depositPercentage);
  if (creditScoreRates[selectedScore] && selectedScore !== "custom") {
    interestRate = creditScoreRates[selectedScore].interest / 100;
  }

  if (targetAge && monthlySaving) {
    result.innerHTML = `<p style="color: red;">⚠️ Please fill in only one: either the \"Age you want to buy a home\" or the \"Monthly amount you can save\" — not both.</p>`;
    return;
  }

  if (!targetAge && !monthlySaving) {
    result.innerHTML = `<p style="color: red;">⚠️ Please fill in either \"Age you want to buy a home\" or \"Monthly amount you can save\".</p>`;
    return;
  }

  if (!townsdata[town]) {
    result.innerHTML = `<p style="color: red;">⚠️ No data available for town: ${town}.</p>`;
    return;
  }

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

  const rawPrice = townYears[targetYear];
  if (!rawPrice) {
    result.innerHTML = `<p style="color: red;">⚠️ No house price data available for ${targetYear} in ${town}.</p>`;
    return;
  }

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

  const salaryNeeded = (monthlyMortgagePayment * 12) / 0.28;

  const pmiMonthly = (loanAmount * pmiRate) / 12;
  const taxesInsuranceMonthly = (housePrice * stateTaxRate) / 12;
  const totalMonthlyPayment = monthlyMortgagePayment + pmiMonthly + taxesInsuranceMonthly;

  let html = "";

  if (depositNeeded <= 0) {
    html += `<p>🎉 Congratulations! You already have enough savings for your deposit.</p>`;
  }

  html += `
    <p>Estimated starter house price when you can afford your down payment (${targetYear}): <br> <strong>$${safeCurrency(housePrice)}</strong></p>
    <p>Down payment required (${(depositPercentage * 100).toFixed(0)}% of house price): <strong>$${safeCurrency(depositRequired)}</strong></p>
    <p>Down payment required minus current savings: <strong>$${safeCurrency(depositNeeded)}</strong></p>
  `;

  if (targetAge) {
    html += `<p>Monthly savings needed: <strong>$${safeFixed(monthlySavingsNeeded)}</strong> ($${safeCurrency(depositRequired)} - $${safeCurrency(currentSavings)} ÷ ${numberOfMonths} months)</p>`;
  }

  html += `<p>Estimated monthly mortgage repayment (before insurance and taxes): <strong>$${safeFixed(monthlyMortgagePayment)}</strong></p>`;

  if (pmiMonthly > 0) {
    html += `<p>PMI (Private Mortgage Insurance): <strong>$${safeFixed(pmiMonthly)} per month</strong> (based on ${(pmiRate * 100).toFixed(2)}% annually of the loan amount)</p>`;
  }

  html += `<p>Estimated monthly property taxes & insurance: <strong>$${safeFixed(taxesInsuranceMonthly)}</strong> (at ${(stateTaxRate * 100).toFixed(3)}% annually for ${stateName})</p>`;
  html += `<strong><p>Total estimated monthly payment: $${safeFixed(totalMonthlyPayment)}</strong></p>`;
  html += `
    <p style="font-size: 0.9em; color: #555;">
      Based on a loan amount of $${safeCurrency(loanAmount)}, ${numberOfPayments} monthly payments over ${mortgageLength} years,
      and a monthly interest rate of ${(monthlyInterestRate * 100).toFixed(2)}% (${(interestRate * 100).toFixed(2)}% annually).<br>
      Your monthly payment includes principal and interest ($${safeFixed(monthlyMortgagePayment)}),
      property taxes and insurance ($${safeFixed(taxesInsuranceMonthly)})${pmiMonthly > 0 ? `, and PMI ($${safeFixed(pmiMonthly)})` : ""}.
    </p>
   <strong><p>Salary needed (so your total monthly repayments don't exceed 28% of your gross monthly salary): $${safeCurrency(salaryNeeded)}</strong></p>
  `;

  if (monthlySaving > 0) {
    const monthsToSave = Math.ceil(depositNeeded / monthlySaving);
    html += `<p style="margin-top:10px;">At <strong>$${safeCurrency(monthlySaving)}</strong> saved per month, you'd need approx. <strong>${monthsToSave}</strong> months to save your deposit.</p>`;
  }

  result.innerHTML = html;
});
