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

  const stateAbbr = town.split(", ")[1];
const stateName = stateAbbrMap[stateAbbr];
const stateTaxRate = statePropertyTaxes[stateName] ? statePropertyTaxes[stateName] / 100 : 0.01235; // fallback to 1.235% if missing

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


// 🔵 Handle calculator submission
document.getElementById("calculator").addEventListener("submit", function (e) {
  e.preventDefault();

  const town = document.getElementById("town").value;

  // ✅ Safe: town is now defined and is a string
  const stateAbbr = town.split(", ")[1];
  const stateName = stateAbbrMap[stateAbbr];
  const stateTaxRate = statePropertyTaxes[stateName] ? statePropertyTaxes[stateName] / 100 : 0.01235;

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

  // Validation
  if (targetAge && monthlySaving) {
    result.innerHTML = `<p style="color: red;">⚠️ Please fill in only one: either the "Age you want to buy a home" or the "Monthly amount you can save" — not both.</p>`;
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
    const maxYear = availableYears[availableYears.length - 1];
    if (monthlySaving > 0) {
      result.innerHTML = `<p style="color: red;">⚠️ Saving $${safeCurrency(monthlySaving)} a month is not enough to cover a down payment in ${town} by 2058, the latest year in our projections. Please consider lowering your down payment.</p>`;
    } else {
      result.innerHTML = `<p style="color: red;">⚠️ No house price data available for the selected year for ${town}.</p>`;
    }
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

  // 🔵 PMI Rate Tier
  let pmiRate = 0;
  if (depositPercentage < 0.05) {
    pmiRate = 0.011;
  } else if (depositPercentage < 0.10) {
    pmiRate = 0.009;
  } else if (depositPercentage < 0.15) {
    pmiRate = 0.005;
  } else if (depositPercentage < 0.20) {
    pmiRate = 0.003;
  }

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
    const monthsToSave = (targetAge - currentAge) * 12;
    html += `<p>Monthly savings needed ($${safeCurrency(depositRequired)} - $${safeCurrency(currentSavings)} ÷ ${monthsToSave} months): <strong>$${safeFixed(monthlySavingsNeeded)}</strong></p>`;
  }

  html += `
    <p>Estimated monthly mortgage repayment (principal & interest):<strong>$${safeFixed(monthlyMortgagePayment)}</strong></p>
  `;

  if (pmiMonthly > 0) {
    html += `<p>PMI (Private Mortgage Insurance): <strong>$${safeFixed(pmiMonthly)}</strong> (based on ${(pmiRate * 100).toFixed(2)}% annually — required because deposit is under 20%)</p>`;
  }

 html += `
  p>Estimated monthly property taxes & insurance (based on your state's tax rate): <strong>$${safeFixed(taxesInsuranceMonthly)}</strong> (based on ${ (stateTaxRate * 100).toFixed(3) }% annually for ${stateName})</p>
`;

html += `
  <p>Total estimated monthly payment (${pmiMonthly > 0 ? "PITI + PMI" : "Principal, Interest, Taxes & Insurance"}): <strong>$${safeFixed(totalMonthlyPayment)}</strong></p>
`;

html += `
  <p style="font-size: 0.9em; color: #555;">
  Based on a loan amount of $${safeCurrency(loanAmount)}, a ${numberOfPayments}-month term (${mortgageLength} years), and a monthly interest rate of ${(monthlyInterestRate * 100).toFixed(2)}% (${(interestRate * 100).toFixed(2)}% annually).<br>
  Your monthly payment includes principal and interest ($${safeFixed(monthlyMortgagePayment)}), property taxes and insurance ($${safeFixed(taxesInsuranceMonthly)})${pmiMonthly > 0 ? `, and PMI ($${safeFixed(pmiMonthly)})` : ""}.
</p>
  <p>Salary needed to afford mortgage (so your mortgage repayments do not exceed 28% of your gross salary): <strong>$${safeCurrency(salaryNeeded)}</strong></p>
`;

  if (monthlySaving > 0) {
    const monthsToSave = Math.ceil(depositNeeded / monthlySaving);
    html += `<p style="margin-top:10px;">At <strong>$${safeCurrency(monthlySaving)}</strong> saved per month, you would need approximately <strong>${monthsToSave}</strong> months to save for your deposit.</p>`;
  }

  result.innerHTML = html;
});
