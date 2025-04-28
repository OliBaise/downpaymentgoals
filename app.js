// Populate the town dropdown when page loads
document.addEventListener("DOMContentLoaded", function () {
  const townSelect = document.getElementById("town");

  if (typeof townsdata === "undefined") {
    console.error("❌ townsdata is not defined. Make sure townsdata.js is loaded first.");
    return;
  }

  const towns = Object.keys(townsdata).sort();
  townSelect.innerHTML = `<option value="">Select your town</option>`;

  towns.forEach(town => {
    const option = document.createElement("option");
    option.value = town;
    option.textContent = town;
    townSelect.appendChild(option);
  });
});

// Handle the calculator form
document.getElementById("calculator").addEventListener("submit", function (e) {
  e.preventDefault();

  const town = document.getElementById("town").value;
  const currentAge = parseInt(document.getElementById("currentAge").value);
  const targetAge = parseInt(document.getElementById("targetAge").value);
  const depositPercentage = parseFloat(document.getElementById("depositPercentage").value) / 100;
  const currentSavings = parseFloat(document.getElementById("currentSavings").value) || 0;
  const interestRate = parseFloat(document.getElementById("interestRate").value) / 100;
  const mortgageLength = parseInt(document.getElementById("mortgageLength").value);

  const result = document.getElementById("result");
  result.innerHTML = "";

  if (!townsdata[town]) {
    result.innerHTML = `<p style="color:red;">No data available for town: ${town}</p>`;
    return;
  }

  const currentYear = 2025;
  const yearsToTarget = targetAge - currentAge;
  const targetYear = currentYear + yearsToTarget;

  const townData = townsdata[town];
  const housePriceString = townData[targetYear];

  if (!housePriceString) {
    result.innerHTML = `<p style="color:red;">No house price projection for year ${targetYear}.</p>`;
    return;
  }

  const projectedHousePrice = parseFloat(housePriceString.replace(/,/g, '')); // remove commas and parse
  const depositNeeded = (depositPercentage * projectedHousePrice) - currentSavings;
  const monthsToSave = yearsToTarget * 12;
  const monthlySavingsNeeded = depositNeeded > 0 ? depositNeeded / monthsToSave : 0;

  const mortgageAmount = projectedHousePrice - (depositPercentage * projectedHousePrice);
  const monthlyInterestRate = interestRate / 12;
  const numberOfPayments = mortgageLength * 12;

  const monthlyMortgageRepayment = 
    (mortgageAmount * monthlyInterestRate) / (1 - Math.pow(1 + monthlyInterestRate, -numberOfPayments));

  const minimumSalaryRequired = (monthlyMortgageRepayment / 0.28) * 12;

  result.innerHTML = `
    <h2>Results</h2>
    <p><strong>Projected House Price (${targetYear}):</strong> £${projectedHousePrice.toLocaleString()}</p>
    <p><strong>Required Deposit:</strong> £${Math.max(depositNeeded, 0).toLocaleString(undefined, {maximumFractionDigits: 2})}</p>
    <p><strong>Monthly Savings Needed:</strong> £${monthlySavingsNeeded.toLocaleString(undefined, {maximumFractionDigits: 2})}</p>
    <p><strong>Estimated Monthly Mortgage Repayments:</strong> £${monthlyMortgageRepayment.toLocaleString(undefined, {maximumFractionDigits: 2})}</p>
    <p><strong>Minimum Salary Needed:</strong> £${minimumSalaryRequired.toLocaleString(undefined, {maximumFractionDigits: 2})} per year</p>
  `;
});
