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
  formatCurrency,
} from "./aggregations.js";
import { initCharts, updateRevenueTrendChart, updateCategoryChart, updateRegionChart } from "./charts.js";
import { renderKPIs, renderTransactionsTable } from "./ui.js";

// ---------- State ----------

let allTransactions = [];
let referenceData = { products: [], regions: [], customers: [] };
let customersById = new Map();
let regionsById = new Map();
let productsById = new Map();

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

const addSaleOverlay = document.getElementById("addSaleOverlay");
const addSaleForm = document.getElementById("addSaleForm");
const closeSaleModalBtn = document.getElementById("closeSaleModal");
const cancelSaleBtn = document.getElementById("cancelSaleBtn");
const submitSaleBtn = document.getElementById("submitSaleBtn");
const saleProductEl = document.getElementById("saleProduct");
const saleCustomerEl = document.getElementById("saleCustomer");
const saleQuantityEl = document.getElementById("saleQuantity");
const saleStatusEl = document.getElementById("saleStatus");
const salePreviewEl = document.getElementById("salePreview");

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

// ---------- Add Sale modal ----------

function populateSaleFormOptions() {
  saleProductEl.innerHTML = referenceData.products
    .map((p) => `<option value="${p.id}">${escapeHtml(p.name)} — $${p.price.toFixed(2)}</option>`)
    .join("");

  saleCustomerEl.innerHTML = referenceData.customers
    .map((c) => `<option value="${c.id}">${escapeHtml(c.name)} (${escapeHtml(regionsById.get(c.regionId)?.name || "")})</option>`)
    .join("");
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

function updateSalePreview() {
  const product = productsById.get(saleProductEl.value);
  const quantity = Number(saleQuantityEl.value) || 0;
  const total = product ? product.price * quantity : 0;
  salePreviewEl.textContent = `Total: ${formatCurrency(total)}`;
}

function openSaleModal() {
  populateSaleFormOptions();
  updateSalePreview();
  addSaleOverlay.hidden = false;
  saleProductEl.focus();
}

function closeSaleModal() {
  addSaleOverlay.hidden = true;
  addSaleForm.reset();
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
}

function wireSaleModalEvents() {
  generateSaleBtn.addEventListener("click", openSaleModal);
  closeSaleModalBtn.addEventListener("click", closeSaleModal);
  cancelSaleBtn.addEventListener("click", closeSaleModal);

  addSaleOverlay.addEventListener("click", (e) => {
    if (e.target === addSaleOverlay) closeSaleModal();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !addSaleOverlay.hidden) closeSaleModal();
  });

  saleProductEl.addEventListener("change", updateSalePreview);
  saleQuantityEl.addEventListener("input", updateSalePreview);

  addSaleForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    submitSaleBtn.disabled = true;
    submitSaleBtn.textContent = "Adding…";

    try {
      await addManualSale({
        productId: saleProductEl.value,
        customerId: saleCustomerEl.value,
        quantity: Number(saleQuantityEl.value),
        status: saleStatusEl.value,
        products: referenceData.products,
        customers: referenceData.customers,
      });
      // The onSnapshot listener picks up the new doc automatically and
      // calls renderAll() — no manual re-render needed here.
      closeSaleModal();
    } catch (err) {
      console.error("Failed to add sale:", err);
      submitSaleBtn.textContent = "Something went wrong";
      setTimeout(() => {
        submitSaleBtn.textContent = "Add sale";
      }, 2000);
    } finally {
      submitSaleBtn.disabled = false;
      submitSaleBtn.textContent = "Add sale";
    }
  });
}

// ---------- Bootstrap ----------

async function init() {
  initCharts();
  wireFilterEvents();
  wireSaleModalEvents();

  try {
    referenceData = await fetchReferenceData();
    customersById = new Map(referenceData.customers.map((c) => [c.id, c]));
    regionsById = new Map(referenceData.regions.map((r) => [r.id, r]));
    productsById = new Map(referenceData.products.map((p) => [p.id, p]));
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
