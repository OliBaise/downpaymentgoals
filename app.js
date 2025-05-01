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

  const result = document.getElementById("result");
  result.innerHTML = html;
});
