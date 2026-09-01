// js/app.js
//
// Entry point. Loads reference data once, subscribes to live
// transactions, and re-renders everything whenever the data or the
// filters change.

import { fetchReferenceData, subscribeToTransactions, addManualSale } from "./data-service.js";
import {
  filterTransactions,
  filterPreviousPeriod,
  computeKPIs,
  groupRevenueByDay,
  groupRevenueByCategory,
  groupRevenueByRegion,
} from "./aggregations.js";
import { initCharts, updateRevenueTrendChart, updateCategoryChart, updateRegionChart } from "./charts.js";
import { renderKPIs, renderTransactionsTable } from "./ui.js";

// ---------- State ----------

let allTransactions = [];
let referenceData = { products: [], regions: [], customers: [] };
let customersById = new Map();
let regionsById = new Map();

const filters = {
  days: 365,
  regionId: "all",
  category: "all",
};

// ---------- DOM refs ----------

const dateRangeEl = document.getElementById("dateRange");
const regionFilterEl = document.getElementById("regionFilter");
const categoryFilterEl = document.getElementById("categoryFilter");
const generateSaleBtn = document.getElementById("generateSaleBtn");

const saleModalOverlay = document.getElementById("saleModalOverlay");
const saleModalClose = document.getElementById("saleModalClose");
const saleCancelBtn = document.getElementById("saleCancelBtn");
const saleForm = document.getElementById("saleForm");
const saleProductEl = document.getElementById("saleProduct");
const saleCustomerEl = document.getElementById("saleCustomer");
const saleQuantityEl = document.getElementById("saleQuantity");
const saleStatusEl = document.getElementById("saleStatus");
const saleTotalPreviewEl = document.getElementById("saleTotalPreview");
const saleSubmitBtn = document.getElementById("saleSubmitBtn");

// ---------- Rendering pipeline ----------

let hasRenderedOnce = false;

function renderAll() {
  const current = filterTransactions(allTransactions, filters);
  const previous = filterPreviousPeriod(allTransactions, filters);

  const currentKPIs = computeKPIs(current);
  const previousKPIs = computeKPIs(previous);

  renderKPIs({ current: currentKPIs, previous: previousKPIs });
  updateRevenueTrendChart(groupRevenueByDay(current));
  updateCategoryChart(groupRevenueByCategory(current));
  updateRegionChart(groupRevenueByRegion(current, regionsById));
  renderTransactionsTable(current, { customersById, regionsById });

  if (!hasRenderedOnce) {
    clearLoadingState();
    hasRenderedOnce = true;
  }
}

function clearLoadingState() {
  document.querySelectorAll(".kpi-value.is-loading").forEach((el) => {
    el.classList.remove("is-loading");
  });
  [dateRangeEl, regionFilterEl, categoryFilterEl, generateSaleBtn].forEach((el) => {
    el.disabled = false;
  });
}

// ---------- Event wiring ----------

function wireFilterEvents() {
  dateRangeEl.addEventListener("change", (e) => {
    filters.days = Number(e.target.value);
    renderAll();
  });

  regionFilterEl.addEventListener("change", (e) => {
    filters.regionId = e.target.value;
    renderAll();
  });

  categoryFilterEl.addEventListener("change", (e) => {
    filters.category = e.target.value;
    renderAll();
  });

  generateSaleBtn.addEventListener("click", openSaleModal);
  saleModalClose.addEventListener("click", closeSaleModal);
  saleCancelBtn.addEventListener("click", closeSaleModal);
  saleModalOverlay.addEventListener("click", (e) => {
    if (e.target === saleModalOverlay) closeSaleModal();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !saleModalOverlay.hidden) closeSaleModal();
  });

  saleProductEl.addEventListener("change", updateTotalPreview);
  saleQuantityEl.addEventListener("input", updateTotalPreview);

  saleForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    saleSubmitBtn.disabled = true;
    saleSubmitBtn.textContent = "Adding…";
    try {
      await addManualSale(
        {
          productId: saleProductEl.value,
          customerId: saleCustomerEl.value,
          quantity: saleQuantityEl.value,
          status: saleStatusEl.value,
        },
        referenceData
      );
      // The onSnapshot listener picks up the new doc and calls
      // renderAll() automatically — no manual refresh needed here.
      closeSaleModal();
    } catch (err) {
      console.error("Failed to add sale:", err);
      saleSubmitBtn.textContent = "Something went wrong";
      setTimeout(() => {
        saleSubmitBtn.textContent = "Add sale";
        saleSubmitBtn.disabled = false;
      }, 2000);
      return;
    }
    saleSubmitBtn.textContent = "Add sale";
    saleSubmitBtn.disabled = false;
  });
}

// ---------- Sale modal helpers ----------

function populateSaleFormOptions() {
  saleProductEl.innerHTML = referenceData.products
    .map((p) => `<option value="${p.id}">${p.name} — $${p.price.toFixed(2)}</option>`)
    .join("");

  saleCustomerEl.innerHTML = referenceData.customers
    .map((c) => `<option value="${c.id}">${c.name}</option>`)
    .join("");
}

function updateTotalPreview() {
  const product = referenceData.products.find((p) => p.id === saleProductEl.value);
  const qty = Math.max(1, Math.min(20, Number(saleQuantityEl.value) || 1));
  const total = product ? product.price * qty : 0;
  saleTotalPreviewEl.textContent = `$${total.toFixed(2)}`;
}

function openSaleModal() {
  populateSaleFormOptions();
  saleQuantityEl.value = 1;
  saleStatusEl.value = "completed";
  updateTotalPreview();
  saleModalOverlay.hidden = false;
  saleProductEl.focus();
}

function closeSaleModal() {
  saleModalOverlay.hidden = true;
  saleForm.reset();
}

// ---------- Bootstrap ----------

async function init() {
  initCharts();
  wireFilterEvents();

  try {
    referenceData = await fetchReferenceData();
    customersById = new Map(referenceData.customers.map((c) => [c.id, c]));
    regionsById = new Map(referenceData.regions.map((r) => [r.id, r]));
  } catch (err) {
    console.error("Failed to load reference data:", err);
  }

  subscribeToTransactions(
    (transactions) => {
      allTransactions = transactions;
      renderAll();
    },
    (error) => {
      const tbody = document.getElementById("transactionsBody");
      if (tbody) {
        tbody.innerHTML = `<tr class="empty-row"><td colspan="6">Couldn't load data. Check your Firebase config and security rules.</td></tr>`;
      }
      console.error(error);
    }
  );
}

init();
