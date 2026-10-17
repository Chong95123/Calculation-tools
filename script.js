// ====================== DATA ======================
const costData = {
  hacking: { name: "Hacking & Disposal", none:[0,0], light:[1800,3500], moderate:[4000,7500], extensive:[8000,15000],
    desc:{none:"", light:"Minor removal of tiles / cabinets / small partitions", moderate:"Kitchen + 1-2 bathrooms + partial flooring", extensive:"Full unit hacking"} },
  masonry: { name: "Masonry / Tiling & Waterproofing", none:[0,0], light:[3500,7000], moderate:[9000,18000], extensive:[20000,35000],
    desc:{none:"", light:"Touch-up or small area tiling", moderate:"Kitchen + bathrooms full tiling + waterproofing", extensive:"Whole house tiling + full waterproofing"} },
  carpentry: { name: "Carpentry (Kitchen + Wardrobes + Storage)", none:[0,0], light:[9000,16000], moderate:[20000,38000], extensive:[40000,65000],
    desc:{none:"", light:"Basic kitchen + 1 wardrobe", moderate:"Full kitchen + 2-3 wardrobes + TV console", extensive:"Full custom carpentry"} },
  electrical: { name: "Electrical & Lighting", none:[0,0], light:[2500,4500], moderate:[5500,10000], extensive:[11000,18000],
    desc:{none:"", light:"Add power points & basic lighting", moderate:"Partial rewiring + new lighting", extensive:"Full rewiring"} },
  plumbing: { name: "Plumbing", none:[0,0], light:[1800,3500], moderate:[4500,8500], extensive:[9000,15000],
    desc:{none:"", light:"Minor pipe changes", moderate:"Kitchen + bathroom overhaul", extensive:"Full unit re-piping"} },
  painting: { name: "Painting", none:[0,0], light:[1800,3200], moderate:[4000,6500], extensive:[7000,11000],
    desc:{none:"", light:"Touch-up or 1-2 rooms", moderate:"Whole house standard paint", extensive:"Whole house + feature walls"} },
  ceiling: { name: "Ceiling / Partition / False Ceiling", none:[0,0], light:[1800,3500], moderate:[4500,9500], extensive:[10000,18000],
    desc:{none:"", light:"Simple cornice or small area", moderate:"False ceiling in living + some rooms", extensive:"Full false ceiling + partitions"} },
  windows: { name: "Windows / Doors / Grilles", none:[0,0], light:[2500,4500], moderate:[6000,11000], extensive:[12000,20000],
    desc:{none:"", light:"Replace 1-2 doors or add grilles", moderate:"New main door + several doors/grilles", extensive:"Full set"} },
  aircon: { name: "Air-Conditioning (Supply + Install)", none:[0,0], light:[3000,6000], moderate:[8000,14000], extensive:[15000,25000],
    desc:{none:"", light:"1–2 units", moderate:"3–4 units", extensive:"Full house / multi-split"} },
  cleaning: { name: "Final Cleaning & Disposal", none:[0,0], light:[500,900], moderate:[1000,2000], extensive:[2200,3500],
    desc:{none:"", light:"Basic post-reno cleaning", moderate:"Standard full cleaning", extensive:"Deep cleaning + extra disposal"} }
};

const propertyMultiplier = { "apartment-new":0.85, "apartment-resale":1.0, "condo-new":0.90, "condo-resale":1.15 };
const materialMultiplier = { budget:0.85, mid:1.0, premium:1.35 };

// ====================== MENU ======================
document.querySelectorAll('.menu-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.menu-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById(btn.dataset.target).classList.add('active');
  });
});

function formatMoney(num) {
  return "RM " + Math.round(num || 0).toLocaleString("en-MY");
}

function getAreaInSqft() {
  let area = parseFloat(document.getElementById("floorArea").value) || 1000;
  if (document.getElementById("areaUnit").value === "sqm") area *= 10.7639;
  return area;
}

// ====================== RENOVATION ======================
function renderCategories() {
  const container = document.getElementById("categories");
  if (!container) return;
  container.innerHTML = "";
  Object.keys(costData).forEach(key => {
    const item = costData[key];
    const div = document.createElement("div");
    div.className = "category-item";
    div.innerHTML = `
      <div class="category-top">
        <div class="category-name">${item.name}</div>
        <select id="${key}">
          <option value="none">None</option>
          <option value="light">Light</option>
          <option value="moderate" selected>Moderate</option>
          <option value="extensive">Extensive</option>
        </select>
      </div>
      <div class="intensity-desc" id="desc-${key}"></div>`;
    container.appendChild(div);
    const select = div.querySelector("select");
    select.addEventListener("change", () => updateDescription(key, select.value));
    updateDescription(key, "moderate");
  });
}

function updateDescription(key, intensity) {
  const el = document.getElementById(`desc-${key}`);
  if (!el) return;
  const text = costData[key].desc[intensity] || "";
  el.textContent = text;
  text ? el.classList.add("show") : el.classList.remove("show");
}

function calculate() {
  const propMult = propertyMultiplier[document.getElementById("propertyType").value] || 1;
  const matMult = materialMultiplier[document.getElementById("materialQuality").value] || 1;
  const contingency = parseFloat(document.getElementById("contingency").value) || 0.15;
  const areaSqft = getAreaInSqft();
  const sizeMult = Math.pow(areaSqft / 1000, 0.85);
  const finalMult = propMult * matMult * sizeMult;

  let totalLow = 0, totalHigh = 0;
  const breakdown = [];
  Object.keys(costData).forEach(key => {
    const intensity = document.getElementById(key).value;
    const costs = costData[key][intensity];
    const low = costs[0] * finalMult;
    const high = costs[1] * finalMult;
    totalLow += low; totalHigh += high;
    if (intensity !== "none") {
      breakdown.push({ name: costData[key].name, intensity: intensity.charAt(0).toUpperCase() + intensity.slice(1), low, high });
    }
  });
  totalLow *= (1 + contingency);
  totalHigh *= (1 + contingency);

  document.getElementById("totalRange").textContent = `${formatMoney(totalLow)} – ${formatMoney(totalHigh)}`;
  document.getElementById("areaInfo").textContent = `${document.getElementById("floorArea").value} ${document.getElementById("areaUnit").value} (${Math.round(areaSqft)} sqft) • ${document.getElementById("bedrooms").value} Bed • ${document.getElementById("bathrooms").value} Bath`;
  document.getElementById("psfInfo").textContent = `≈ ${formatMoney(((totalLow + totalHigh) / 2) / areaSqft)} per sqft`;

  const tbody = document.getElementById("breakdownBody");
  tbody.innerHTML = "";
  breakdown.forEach(item => {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${item.name}</td><td>${item.intensity}</td><td>${formatMoney(item.low)} – ${formatMoney(item.high)}</td>`;
    tbody.appendChild(tr);
  });
  document.getElementById("resultSection").style.display = "block";
}

// ====================== LOAN (Interactive / Live) ======================
let commitments = [
  { id: 1, name: "Car Loan", amount: 0 },
  { id: 2, name: "Personal Loan", amount: 0 },
  { id: 3, name: "PTPTN", amount: 0 }
];

function renderCommitments() {
  const container = document.getElementById("commitmentsList");
  if (!container) return;
  container.innerHTML = "";
  commitments.forEach(c => {
    const row = document.createElement("div");
    row.className = "commitment-row";
    row.innerHTML = `
      <input type="text" value="${c.name}" class="commit-name" data-id="${c.id}">
      <input type="number" value="${c.amount}" class="commit-amount" data-id="${c.id}" min="0">
      <button type="button" class="remove-commit" data-id="${c.id}">×</button>`;
    container.appendChild(row);
  });
  container.querySelectorAll(".commit-name").forEach(inp => {
    inp.addEventListener("change", function() {
      const item = commitments.find(c => c.id === Number(this.dataset.id));
      if (item) item.name = this.value;
      calcLoanLive();
    });
  });
  container.querySelectorAll(".commit-amount").forEach(inp => {
    inp.addEventListener("input", function() {
      const item = commitments.find(c => c.id === Number(this.dataset.id));
      if (item) item.amount = parseFloat(this.value) || 0;
      calcLoanLive();
    });
  });
  container.querySelectorAll(".remove-commit").forEach(btn => {
    btn.addEventListener("click", function() {
      commitments = commitments.filter(c => c.id !== Number(this.dataset.id));
      renderCommitments();
      calcLoanLive();
    });
  });
}

document.getElementById("addCommitBtn")?.addEventListener("click", () => {
  commitments.push({ id: Date.now(), name: "Other Loan", amount: 0 });
  renderCommitments();
});

function calcLoanLive() {
  const salary = parseFloat(document.getElementById("monthlySalary").value) || 0;
  const other = parseFloat(document.getElementById("otherIncome").value) || 0;
  const totalIncome = salary + other;
  const totalCommit = commitments.reduce((s, c) => s + (c.amount || 0), 0);

  const propertyPrice = parseFloat(document.getElementById("simPropertyPrice").value) || 0;
  const ltv = parseFloat(document.getElementById("ltvSelect").value) || 0.90;
  let P = parseFloat(document.getElementById("loanAmount").value) || 0;

  // Auto-suggest loan amount based on LTV (optional helper)
  const maxLoanByLtv = propertyPrice * ltv;
  // Keep the manually entered loan amount, but we use it for calculation

  const annualRate = parseFloat(document.getElementById("interestRate").value) / 100 || 0;
  const years = parseFloat(document.getElementById("loanYears").value) || 30;
  const r = annualRate / 12;
  const n = years * 12;

  let monthly = 0;
  if (r > 0) {
    monthly = P * r * Math.pow(1 + r, n) / (Math.pow(1 + r, n) - 1);
  } else {
    monthly = P / n;
  }

  const totalPay = monthly * n;
  const totalInterest = totalPay - P;
  const dsr = totalIncome > 0 ? ((totalCommit + monthly) / totalIncome) * 100 : 0;

  // Display basic numbers
  document.getElementById("monthlyPayment").textContent = formatMoney(monthly);
  document.getElementById("totalPayment").textContent = formatMoney(totalPay);
  document.getElementById("totalInterest").textContent = formatMoney(totalInterest);

  // ===== DSR Bar & Colour =====
  const dsrValueEl = document.getElementById("dsrValue");
  const dsrBar = document.getElementById("dsrBar");
  const dsrStatus = document.getElementById("dsrStatus");

  dsrValueEl.textContent = dsr.toFixed(1) + "%";
  const barWidth = Math.min(dsr, 100);
  dsrBar.style.width = barWidth + "%";

  if (dsr <= 60) {
    dsrBar.style.background = "#22c55e";
    dsrStatus.textContent = "Excellent";
    dsrStatus.style.color = "#166534";
  } else if (dsr <= 70) {
    dsrBar.style.background = "#eab308";
    dsrStatus.textContent = "Acceptable / Borderline";
    dsrStatus.style.color = "#854d0e";
  } else {
    dsrBar.style.background = "#ef4444";
    dsrStatus.textContent = "High Risk";
    dsrStatus.style.color = "#991b1b";
  }

  // ===== NEW Realistic Formulas =====
  const capability = totalIncome * 85;          // Salary × 85
  const loanLimit = totalIncome * 0.40;         // Salary × 0.40
  const totalLimit = totalIncome * 0.65;        // Salary × 0.65

  // Cash to Prepare based on LTV + ~6% fees
  const downPayment = propertyPrice * (1 - ltv);
  const estimatedFees = propertyPrice * 0.06;
  const cashNeeded = downPayment + estimatedFees;

  document.getElementById("maxHousePrice").textContent = formatMoney(capability);
  document.getElementById("loanLimit").textContent = formatMoney(loanLimit);
  document.getElementById("totalLimit").textContent = formatMoney(totalLimit);
  document.getElementById("cashNeeded").textContent = formatMoney(cashNeeded);

  // ===== Colour the 4 boxes =====
  const boxCap = document.getElementById("boxCapability");
  const boxLoan = document.getElementById("boxLoanLimit");
  const boxTotal = document.getElementById("boxTotalLimit");
  const boxCash = document.getElementById("boxCash");

  [boxCap, boxLoan, boxTotal, boxCash].forEach(b => {
    b.classList.remove("good", "caution", "bad");
  });


  // 1. Capability vs Property Price
  if (propertyPrice <= capability) {
    boxCap.classList.add("good");
    document.getElementById("explainCapability").textContent = "Property price is within comfortable range (Salary × 85)";
  } else if (propertyPrice <= capability * 1.15) {
    boxCap.classList.add("caution");
    document.getElementById("explainCapability").textContent = "Property price is slightly above comfortable limit";
  } else {
    boxCap.classList.add("bad");
    document.getElementById("explainCapability").textContent = "Property price is significantly higher than recommended";
  }

  // 2. Loan Limit vs Monthly Payment
  if (monthly <= loanLimit) {
    boxLoan.classList.add("good");
    document.getElementById("explainLoanLimit").textContent = "Monthly payment is within comfortable limit (Salary × 0.40)";
  } else if (monthly <= loanLimit * 1.15) {
    boxLoan.classList.add("caution");
    document.getElementById("explainLoanLimit").textContent = "Monthly payment is slightly high";
  } else {
    boxLoan.classList.add("bad");
    document.getElementById("explainLoanLimit").textContent = "Monthly payment is too high for this salary";
  }

  // 3. Total Limit vs (Payment + Commitments)
  const totalDebt = monthly + totalCommit;
  if (totalDebt <= totalLimit) {
    boxTotal.classList.add("good");
    document.getElementById("explainTotalLimit").textContent = "Total debts are within bank DSR range (Salary × 0.65)";
  } else if (totalDebt <= totalLimit * 1.1) {
    boxTotal.classList.add("caution");
    document.getElementById("explainTotalLimit").textContent = "Total debts are approaching the upper limit";
  } else {
    boxTotal.classList.add("bad");
    document.getElementById("explainTotalLimit").textContent = "Total debts exceed typical bank DSR limit";
  }

  // 4. Cash box - always neutral / info
  boxCash.classList.add("good");
  document.getElementById("explainCash").textContent = `Down payment (${((1-ltv)*100).toFixed(0)}%) + estimated fees (~6%)`;

  // ===== Overall Advice =====
  const adviceBox = document.getElementById("overallAdvice");
  const adviceTitle = document.getElementById("adviceTitle");
  const adviceDesc = document.getElementById("adviceDesc");

  adviceBox.classList.remove("good", "caution", "bad");

  const badCount = [boxCap, boxLoan, boxTotal].filter(b => b.classList.contains("bad")).length;
  const cautionCount = [boxCap, boxLoan, boxTotal].filter(b => b.classList.contains("caution")).length;

  if (badCount >= 2 || (badCount >= 1 && monthly > loanLimit * 1.3)) {
    adviceBox.classList.add("bad");
    adviceTitle.textContent = "Not Recommended";
    adviceDesc.textContent = "The property price and/or monthly payment are significantly higher than typical bank comfort levels for this salary.";
  } else if (badCount === 1 || cautionCount >= 2) {
    adviceBox.classList.add("caution");
    adviceTitle.textContent = "Caution – Review Carefully";
    adviceDesc.textContent = "Some numbers are above the comfortable range. Discuss with the bank or consider adjusting the loan amount.";
  } else {
    adviceBox.classList.add("good");
    adviceTitle.textContent = "Looks Manageable";
    adviceDesc.textContent = "Based on common Malaysian bank practice, this loan appears to be within a reasonable range for the stated salary.";
  }
}
// ===== ENTRY COST (updated with LTV) =====
document.getElementById("calcEntryBtn")?.addEventListener("click", function() {
  const price = parseFloat(document.getElementById("entryPrice").value) || 0;
  const ltv = parseFloat(document.getElementById("entryLtv").value) || 0.90;
  const loan = parseFloat(document.getElementById("entryLoan").value) || (price * ltv);

  const downPayment = price * (1 - ltv);
  let stampDuty = 0;
  if (price <= 100000) stampDuty = price * 0.01;
  else if (price <= 500000) stampDuty = 1000 + (price - 100000) * 0.02;
  else if (price <= 1000000) stampDuty = 9000 + (price - 500000) * 0.03;
  else stampDuty = 24000 + (price - 1000000) * 0.04;

  const loanStamp = loan * 0.005;
  const legalFee = price * 0.012;
  const valuation = Math.min(Math.max(price * 0.002, 800), 2500);
  const total = downPayment + stampDuty + loanStamp + legalFee + valuation;

  document.getElementById("totalCash").textContent = formatMoney(total);
  document.getElementById("entryBreakdown").innerHTML = `
    <tr><td>Down Payment (${((1-ltv)*100).toFixed(0)}%)</td><td>${formatMoney(downPayment)}</td></tr>
    <tr><td>Stamp Duty (MOT)</td><td>${formatMoney(stampDuty)}</td></tr>
    <tr><td>Loan Stamp Duty (0.5%)</td><td>${formatMoney(loanStamp)}</td></tr>
    <tr><td>Legal Fees (est.)</td><td>${formatMoney(legalFee)}</td></tr>
    <tr><td>Valuation Fee (est.)</td><td>${formatMoney(valuation)}</td></tr>
    <tr style="font-weight:700;"><td>Total Upfront Cash</td><td>${formatMoney(total)}</td></tr>`;
  document.getElementById("entryResult").style.display = "block";
});

// ===== EXIT COST =====
document.getElementById("calcExitBtn")?.addEventListener("click", function() {
  const sell = parseFloat(document.getElementById("exitPrice").value) || 0;
  const purchase = parseFloat(document.getElementById("exitPurchase").value) || 0;
  const outstanding = parseFloat(document.getElementById("exitLoan").value) || 0;
  const years = parseInt(document.getElementById("exitYears").value) || 6;
  const commissionPct = parseFloat(document.getElementById("exitCommission").value) || 2.5;

  const gain = Math.max(sell - purchase, 0);
  let rpgtRate = 0;
  if (years <= 3) rpgtRate = 0.30;
  else if (years <= 4) rpgtRate = 0.20;
  else if (years <= 5) rpgtRate = 0.15;
  else rpgtRate = 0;

  const rpgt = gain * rpgtRate;
  const agentFee = sell * (commissionPct / 100);
  const legalFee = sell * 0.01;
  const totalCost = rpgt + agentFee + legalFee;
  const net = sell - outstanding - totalCost;

  document.getElementById("netProceeds").textContent = formatMoney(net);
  document.getElementById("exitBreakdown").innerHTML = `
    <tr><td>Selling Price</td><td>${formatMoney(sell)}</td></tr>
    <tr><td>Less: Outstanding Loan</td><td>${formatMoney(outstanding)}</td></tr>
    <tr><td>Less: RPGT (est.)</td><td>${formatMoney(rpgt)}</td></tr>
    <tr><td>Less: Agent Commission (${commissionPct}%)</td><td>${formatMoney(agentFee)}</td></tr>
    <tr><td>Less: Legal Fee (est.)</td><td>${formatMoney(legalFee)}</td></tr>
    <tr style="font-weight:700;"><td>Net Cash You Receive</td><td>${formatMoney(net)}</td></tr>`;
  document.getElementById("exitResult").style.display = "block";
});

// ===== FULL REPORT (Improved) =====
document.getElementById("generateReportBtn")?.addEventListener("click", function() {
  const name = document.getElementById("reportName").value || "Property Report";
  const price = parseFloat(document.getElementById("reportPrice").value) || 0;
  const size = parseFloat(document.getElementById("reportSize").value) || 0;

  // Pull latest values from other modules
  const monthlyPayment = document.getElementById("monthlyPayment")?.textContent || "-";
  const totalPayment = document.getElementById("totalPayment")?.textContent || "-";
  const totalInterest = document.getElementById("totalInterest")?.textContent || "-";
  const dsrValue = document.getElementById("dsrValue")?.textContent || "-";
  const dsrStatus = document.getElementById("dsrStatus")?.textContent || "-";
  const totalCash = document.getElementById("totalCash")?.textContent || "-";
  const netYield = document.getElementById("netYield")?.textContent || "-";
  const netCashFlow = document.getElementById("netCashFlow")?.textContent || "-";
  const renoRange = document.getElementById("totalRange")?.textContent || "-";
  const adviceTitle = document.getElementById("adviceTitle")?.textContent || "-";
  const adviceDesc = document.getElementById("adviceDesc")?.textContent || "";

  // Simple overall recommendation logic
  let overallStatus = "Review Required";
  let overallColor = "#eab308";
  let overallComment = "Please review the numbers carefully with the customer.";

  const dsrNum = parseFloat(dsrValue) || 100;
  const yieldNum = parseFloat(netYield) || 0;

  if (dsrNum <= 60 && yieldNum >= 3.5 && adviceTitle.includes("Manageable")) {
    overallStatus = "Healthy to Buy / Invest";
    overallColor = "#16a34a";
    overallComment = "Based on current numbers, this property looks manageable for the stated income and offers a reasonable rental yield.";
  } else if (dsrNum <= 70 && yieldNum >= 3.0) {
    overallStatus = "Okay with Caution";
    overallColor = "#ca8a04";
    overallComment = "Acceptable range, but monitor cash flow and existing commitments carefully.";
  } else {
    overallStatus = "Not Recommended";
    overallColor = "#dc2626";
    overallComment = "The loan burden or yield may not be ideal. Consider adjusting price, loan amount or looking at other units.";
  }

  const html = `
    <div style="line-height:1.7; font-size:15px;">
      <h3 style="margin:0 0 6px 0;">${name}</h3>
      <p style="margin:0 0 4px 0;"><strong>Property Price:</strong> ${formatMoney(price)}</p>
      <p style="margin:0 0 16px 0;"><strong>Size:</strong> ${size} sqft ${size > 0 ? `(${formatMoney(price/size)} / sqft)` : ""}</p>

      <!-- Overall Recommendation -->
      <div style="background:${overallColor}15; border:1px solid ${overallColor}; border-radius:10px; padding:14px 16px; margin-bottom:20px;">
        <div style="font-size:18px; font-weight:700; color:${overallColor}; margin-bottom:4px;">
          ${overallStatus}
        </div>
        <div style="font-size:14px; color:#334155;">
          ${overallComment}
        </div>
      </div>

      <h4 style="margin:18px 0 6px 0; border-bottom:1px solid #e2e8f0; padding-bottom:4px;">1. Renovation Estimate</h4>
      <p style="margin:0;">Estimated Range: <strong>${renoRange}</strong></p>
      <p style="margin:4px 0 0 0; font-size:13px; color:#64748b;">Pre-site visit estimate. Actual quotation may vary ±15–30%.</p>

      <h4 style="margin:18px 0 6px 0; border-bottom:1px solid #e2e8f0; padding-bottom:4px;">2. Loan & DSR</h4>
      <p style="margin:0;">Monthly Payment: <strong>${monthlyPayment}</strong></p>
      <p style="margin:4px 0;">Total Payment: ${totalPayment}</p>
      <p style="margin:4px 0;">Total Interest: ${totalInterest}</p>
      <p style="margin:4px 0;">DSR: <strong>${dsrValue}</strong> <span style="color:#64748b;">(${dsrStatus})</span></p>
      <p style="margin:4px 0 0 0; font-size:13px; color:#64748b;">Loan Advice: ${adviceTitle}</p>

      <h4 style="margin:18px 0 6px 0; border-bottom:1px solid #e2e8f0; padding-bottom:4px;">3. Entry Cost (Cash Needed)</h4>
      <p style="margin:0;"><strong>${totalCash}</strong></p>
      <p style="margin:4px 0 0 0; font-size:13px; color:#64748b;">Includes down payment, stamp duty, legal fees & valuation.</p>

      <h4 style="margin:18px 0 6px 0; border-bottom:1px solid #e2e8f0; padding-bottom:4px;">4. Rental Yield</h4>
      <p style="margin:0;">Net Yield: <strong>${netYield}</strong></p>
      <p style="margin:4px 0;">Net Monthly Cash Flow: ${netCashFlow}</p>
      <p style="margin:4px 0 0 0; font-size:13px; color:#64748b;">Good net yield for condos in Malaysia is generally 3.5% – 5%.</p>

      <hr style="margin:24px 0 12px 0; border:none; border-top:1px solid #e2e8f0;">
      <p style="font-size:12px; color:#64748b; margin:0;">
        This report is a pre-site estimate for discussion purposes only. 
        Actual loan approval, renovation cost and rental income may differ. 
        Please verify with the bank, contractor and property agent.
      </p>
    </div>
  `;

  document.getElementById("reportContent").innerHTML = html;
  document.getElementById("fullReportResult").style.display = "block";
});

// ====================== RENTAL ======================
document.getElementById("calcYieldBtn")?.addEventListener("click", function() {
  const price = parseFloat(document.getElementById("rentalPrice").value) || 0;
  const rent = parseFloat(document.getElementById("monthlyRent").value) || 0;
  const maint = parseFloat(document.getElementById("maintFee").value) || 0;
  const sinking = parseFloat(document.getElementById("sinkingFund").value) || 0;
  const assessment = parseFloat(document.getElementById("assessmentTax").value) || 0;
  const quit = parseFloat(document.getElementById("quitRent").value) || 0;
  const insurance = parseFloat(document.getElementById("insurance").value) || 0;
  const loanInst = parseFloat(document.getElementById("rentalLoan").value) || 0;

  const annualGross = rent * 12;
  const annualExpenses = (maint + sinking) * 12 + assessment + quit + insurance;
  const annualNet = annualGross - annualExpenses;
  const yieldPct = price > 0 ? (annualNet / price) * 100 : 0;
  const netCashFlow = rent - maint - sinking - loanInst;

  document.getElementById("grossRent").textContent = formatMoney(annualGross);
  document.getElementById("annualExpenses").textContent = formatMoney(annualExpenses);
  document.getElementById("netIncome").textContent = formatMoney(annualNet);
  document.getElementById("netYield").textContent = yieldPct.toFixed(2) + "%";
  document.getElementById("netCashFlow").textContent = formatMoney(netCashFlow);
  document.getElementById("yieldResult").style.display = "block";
});

// ====================== COMPARE ======================
function renderCompareInputs() {
  const container = document.getElementById("compareInputs");
  if (!container) return;
  container.innerHTML = "";
  ["A", "B", "C"].forEach(label => {
    const div = document.createElement("div");
    div.className = "compare-card";
    div.innerHTML = `
      <h3>Unit ${label}</h3>
      <div class="form-group"><label>Name / Location</label><input type="text" id="cName${label}" placeholder="e.g. Condo KLCC"></div>
      <div class="form-group"><label>Price (RM)</label><input type="number" id="cPrice${label}" value="${label==='A'?500000:label==='B'?550000:480000}"></div>
      <div class="form-group"><label>Size (sqft)</label><input type="number" id="cSize${label}" value="1000"></div>
      <div class="form-group"><label>Reno Estimate (RM)</label><input type="number" id="cReno${label}" value="80000"></div>
      <div class="form-group"><label>Monthly Rent (RM)</label><input type="number" id="cRent${label}" value="2200"></div>
      <div class="form-group"><label>Monthly Loan (RM)</label><input type="number" id="cLoan${label}" value="1800"></div>`;
    container.appendChild(div);
  });
}

document.getElementById("calcCompareBtn")?.addEventListener("click", function() {
  const rows = [
    ["Name", "cName"],
    ["Price", "cPrice"],
    ["Size (sqft)", "cSize"],
    ["Price per sqft", null],
    ["Reno Estimate", "cReno"],
    ["Total Cost (Price+Reno)", null],
    ["Monthly Rent", "cRent"],
    ["Monthly Loan", "cLoan"],
    ["Net Cash Flow", null],
    ["Gross Yield %", null]
  ];

  const tbody = document.getElementById("compareBody");
  tbody.innerHTML = "";

  rows.forEach(([label, prefix]) => {
    const tr = document.createElement("tr");
    let cells = `<td><strong>${label}</strong></td>`;
    ["A","B","C"].forEach(u => {
      let val = "-";
      if (prefix) {
        const el = document.getElementById(prefix + u);
        val = el ? el.value : "-";
        if (prefix !== "cName" && val !== "") val = formatMoney(parseFloat(val) || 0);
      } else {
        const price = parseFloat(document.getElementById("cPrice"+u).value) || 0;
        const size = parseFloat(document.getElementById("cSize"+u).value) || 1;
        const reno = parseFloat(document.getElementById("cReno"+u).value) || 0;
        const rent = parseFloat(document.getElementById("cRent"+u).value) || 0;
        const loan = parseFloat(document.getElementById("cLoan"+u).value) || 0;
        if (label === "Price per sqft") val = formatMoney(price / size);
        if (label === "Total Cost (Price+Reno)") val = formatMoney(price + reno);
        if (label === "Net Cash Flow") val = formatMoney(rent - loan);
        if (label === "Gross Yield %") val = price > 0 ? ((rent * 12 / price) * 100).toFixed(2) + "%" : "-";
      }
      cells += `<td>${val}</td>`;
    });
    tr.innerHTML = cells;
    tbody.appendChild(tr);
  });
  document.getElementById("compareResult").style.display = "block";
});

// ====================== INIT ======================
document.addEventListener("DOMContentLoaded", () => {
  renderCategories();
  renderCommitments();
  renderCompareInputs();
  document.getElementById("calculateBtn")?.addEventListener("click", calculate);

  // Live update on input (Loan Simulator)
  ["monthlySalary", "otherIncome", "loanAmount", "interestRate", "loanYears", "simPropertyPrice", "ltvSelect"].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener("input", calcLoanLive);
      el.addEventListener("change", calcLoanLive);
    }
  });

  calcLoanLive(); // run once when page loads
});