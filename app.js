document.getElementById("calculator").addEventListener("submit", function (e) {
  e.preventDefault();
  console.log("✅ Submit handler triggered"); // Debugging line

  const town = document.getElementById("town").value;
  const currentAge = parseInt(document.getElementById("age").value);
  const targetAge = parseInt(document.getElementById("targetAge").value);
  const currentSavings = parseFloat(document.getElementById("savings").value) || 0;
  const depositPercentage = parseFloat(document.getElementById("depositPercentage").value);
  const interestRate = parseFloat(document.getElementById("interestRate").value) || 5;
  const mortgageLength = parseInt(document.getElementById("mortgageLength").value) || 30;

  const result = document.getElementById("result");
  result.innerHTML = "";

  if (!townsdata[town]) {
    alert(`⚠️ No data available for town: ${town}.`);
    return;
  }

  const currentYear = 2025;
  const yearsUntilTarget = targetAge - currentAge;
  const targetYear = currentYear + yearsUntilTarget;

const townData = townsdata[town][targetYear];
  
  if (!townData) {
    alert(`⚠️ No projection available for ${town} in year ${targetYear}. Please adjust your target age.`);
    return; // <<< CRITICAL: stops the calculation
  }

  const projectedPrice = townData.price;
  const depositRequired = projectedPrice * (depositPercentage / 100);
  const depositMinusSavings = Math.max(0, depositRequired - currentSavings);
  const monthsUntilTarget = yearsUntilTarget * 12;
  const monthlySavings = monthsUntilTarget > 0 ? depositMinusSavings / monthsUntilTarget : depositMinusSavings;

  // Mortgage calculations
  const loanAmount = projectedPrice - depositRequired;
  const monthlyInterestRate = interestRate / 100 / 12;
  const totalPayments = mortgageLength * 12;

  const monthlyPayment = loanAmount * (monthlyInterestRate * Math.pow(1 + monthlyInterestRate, totalPayments)) / (Math.pow(1 + monthlyInterestRate, totalPayments) - 1);

  const requiredMonthlyIncome = monthlyPayment / 0.28;
  const requiredAnnualIncome = requiredMonthlyIncome * 12;

  result.innerHTML = `
    <h2>Results</h2>
    <p>Projected House Price: £${projectedPrice.toLocaleString()}</p>
    <p>Deposit Needed: £${depositRequired.toLocaleString()}</p>
    <p>Deposit Needed (minus current savings): £${depositMinusSavings.toLocaleString()}</p>
    <p>Monthly Savings Needed: £${monthlySavings.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</p>
    <p><strong>Mortgage Calculation:</strong></p>
    <p>Loan Amount: £${loanAmount.toLocaleString()}</p>
    <p>Estimated Monthly Mortgage Payment: £${monthlyPayment.toFixed(2)}</p>
    <p>Minimum Required Annual Income: £${requiredAnnualIncome.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</p>
  `;
});
