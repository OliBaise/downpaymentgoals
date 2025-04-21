// 🧮 Calculator Logic
document.getElementById("calculator").addEventListener("submit", function (e) {
  e.preventDefault();

  const town = document.getElementById("town").value;
  const currentAge = parseInt(document.getElementById("age").value);
  const targetAge = parseInt(document.getElementById("targetAge").value);
  const currentSavings = parseFloat(document.getElementById("savings").value) || 0;
  const depositPercentage = parseFloat(document.getElementById("depositPercentage").value);

  const townData = townsdata[town];

  if (!townData) {
    document.getElementById("result").innerHTML = `<p style="color:red;">No data for town ${town}.</p>`;
    return;
  }

  const currentYear = new Date().getFullYear();
  const targetYear = currentYear + (targetAge - currentAge);

  const housePriceString = townData[targetYear];
  if (!housePriceString) {
    document.getElementById("result").innerHTML = `<p style="color:red;">No house price data for the year ${targetYear}.</p>`;
    return;
  }

  const housePrice = parseFloat(housePriceString.replace(/,/g, ''));
  const downPayment = housePrice * (depositPercentage / 100);
  const monthsToSave = (targetAge - currentAge) * 12;
  const remainingAmount = downPayment - currentSavings;
  const monthlySaving = remainingAmount / monthsToSave;

  document.getElementById("result").innerHTML = `
    <h2>Results</h2>
    <p><strong>Target Year:</strong> ${targetYear}</p>
    <p><strong>Projected starter house price in ${town}:</strong> $${housePrice.toLocaleString()}</p>
    <p><strong>Required Down Payment (${depositPercentage}%):</strong> $${downPayment.toLocaleString(undefined, {maximumFractionDigits: 0})}</p>
    <p><strong>Current Savings:</strong> $${currentSavings.toLocaleString(undefined, {maximumFractionDigits: 0})}</p>
    <p><strong>Remaining Needed:</strong> $${remainingAmount.toLocaleString(undefined, {maximumFractionDigits: 0})}</p>
    <p><strong>Months Until ${targetYear}:</strong> ${monthsToSave}</p>
    <p><strong>Monthly Savings Required:</strong> <strong>$${monthlySaving.toFixed(0)}</strong></p>
  `;
});

// 🔄 Populate Town Dropdown
const townSelect = document.getElementById("town");
const townList = Object.keys(townsdata).sort(); // Sort alphabetically
townList.forEach(town => {
  const option = document.createElement("option");
  option.value = town;
  option.textContent = town;
  townSelect.appendChild(option);
});

// 🔤 Jump To Letter Function
function jumpToLetter(letter) {
  const options = townSelect.options;
  for (let i = 0; i < options.length; i++) {
    const optionText = options[i].textContent.trim().toUpperCase();
    if (optionText.startsWith(letter.toUpperCase())) {
      townSelect.selectedIndex = i;
      townSelect.focus();
      break;
    }
  }
}
