document.getElementById("calculator").addEventListener("submit", function (e) {
  e.preventDefault();

const town = document.getElementById("town").value;
const currentAge = parseInt(document.getElementById("age").value);
const targetAge = parseInt(document.getElementById("targetAge").value);
const depositPercentage = parseFloat(document.getElementById("depositPercentage").value) / 100;
const currentSavings = parseFloat(document.getElementById("savings").value) || 0;
const monthlySaving = parseFloat(document.getElementById("monthlySaving").value) || 0;
const interestRate = (parseFloat(document.getElementById("interestRate").value) / 100) || 0.05;
const mortgageLength = parseInt(document.getElementById("mortgageLength").value) || 30;

const result = document.getElementById("result");
result.innerHTML = "";

// Check town exists
if (!townsdata[town]) {
  result.innerHTML = `<p style="color: red;">⚠️ No data available for town: ${town}.</p>`;
  return;
}

// Calculate current year and target year
const currentYear = new Date().getFullYear();
const targetYear = targetAge ? currentYear + (targetAge - currentAge) : currentYear;

// Get town data
const townYears = townsdata[town];
const townData = townYears[targetYear];

if (!townData) {
  result.innerHTML = `<p style="color: red;">⚠️ No house price data available for the selected year for ${town}.</p>`;
  return;
}

// THEN continue with your calculations!

  const currentYear = new Date().getFullYear();
  const targetYear = targetAge ? currentYear + (targetAge - currentAge) : currentYear;
  const townData = townsdata[town][targetYear];

  if (!townData) {
    result.innerHTML = `<p style="color: red;">⚠️ No house price data available for that year.</p>`;
    return;
  }

  const housePrice = townData.price;
  const depositRequired = housePrice * depositPercentage;
  const depositNeeded = depositRequired - currentSavings;

  if (depositNeeded <= 0) {
    result.innerHTML = `<p>🎉 Congratulations! You already have enough savings for your deposit.</p>`;
    return;
  }

  const numberOfMonths = (targetAge - currentAge) * 12;
  const monthlySavingsNeeded = depositNeeded / numberOfMonths;

  const loanAmount = housePrice - depositRequired;
  const monthlyInterestRate = interestRate / 12;
  const numberOfPayments = mortgageLength * 12;

  const monthlyMortgagePayment = loanAmount * (monthlyInterestRate * Math.pow(1 + monthlyInterestRate, numberOfPayments)) / (Math.pow(1 + monthlyInterestRate, numberOfPayments) - 1);

  const salaryNeeded = (monthlyMortgagePayment * 12) / 0.28; // Based on 28% rule

  let html = `
    <p><strong>Projected house price:</strong> $${housePrice.toLocaleString()}</p>
    <p><strong>Deposit required (${(depositPercentage * 100).toFixed(0)}% of house price):</strong> $${depositRequired.toLocaleString()}</p>
    <p><strong>Deposit needed after current savings:</strong> $${depositNeeded.toLocaleString()}</p>
    <p><strong>Monthly savings needed:</strong> $${monthlySavingsNeeded.toFixed(0)}</p>
    <p><strong>Estimated monthly mortgage repayment:</strong> $${monthlyMortgagePayment.toFixed(0)}</p>
    <p><strong>Salary needed to afford mortgage:</strong> $${salaryNeeded.toLocaleString()}</p>
  `;

  // ✅ ADDITION: if user filled monthly saving, show how many months it would take
  if (monthlySaving) {
    const monthsToSave = Math.ceil(depositNeeded / monthlySaving);
    html += `<p><strong>At $${monthlySaving.toLocaleString()} saved per month, you would need approximately ${monthsToSave} months to save for your deposit.</strong></p>`;
  }

  result.innerHTML = html;
});
