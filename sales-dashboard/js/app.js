// js/app.js
//
// Entry point. Loads reference data once, subscribes to live
// transactions, and re-renders everything whenever the data or the
// filters change.

import { fetchReferenceData, subscribeToTransactions, addRandomSale } from "./data-service.js";
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

  generateSaleBtn.addEventListener("click", async () => {
    generateSaleBtn.disabled = true;
    generateSaleBtn.textContent = "Adding sale…";
    try {
      await addRandomSale(referenceData);
      // No need to manually re-render here — the onSnapshot listener
      // below fires automatically when the new doc lands, which
      // updates allTransactions and calls renderAll().
    } catch (err) {
      console.error("Failed to add sale:", err);
      generateSaleBtn.textContent = "Something went wrong";
      setTimeout(() => {
        generateSaleBtn.textContent = "Add a new sale";
      }, 2000);
      generateSaleBtn.disabled = false;
      return;
    }
    generateSaleBtn.textContent = "Sale added ✓";
    setTimeout(() => {
      generateSaleBtn.textContent = "Add a new sale";
      generateSaleBtn.disabled = false;
    }, 1200);
  });
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
