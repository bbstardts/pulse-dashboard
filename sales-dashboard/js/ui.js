// js/ui.js
//
// DOM rendering only — no Firestore or aggregation logic here.

import { formatCurrency, formatNumber, percentChange } from "./aggregations.js";

export function renderKPIs({ current, previous }) {
  const revenueDelta = percentChange(current.totalRevenue, previous.totalRevenue);
  const ordersDelta = percentChange(current.totalOrders, previous.totalOrders);
  const aovDelta = percentChange(current.avgOrderValue, previous.avgOrderValue);
  const customersDelta = percentChange(current.uniqueCustomers, previous.uniqueCustomers);

  setKPI("kpiRevenue", formatCurrency(current.totalRevenue));
  setDelta("kpiRevenueDelta", revenueDelta);

  setKPI("kpiOrders", formatNumber(current.totalOrders));
  setDelta("kpiOrdersDelta", ordersDelta);

  setKPI("kpiAOV", formatCurrency(current.avgOrderValue));
  setDelta("kpiAOVDelta", aovDelta);

  setKPI("kpiCustomers", formatNumber(current.uniqueCustomers));
  setDelta("kpiCustomersDelta", customersDelta);
}

function setKPI(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

function setDelta(id, deltaPercent) {
  const el = document.getElementById(id);
  if (!el) return;

  const rounded = Math.round(deltaPercent * 10) / 10;
  const sign = rounded >= 0 ? "+" : "";
  el.textContent = `${sign}${rounded}% vs. previous period`;
  el.classList.toggle("positive", rounded >= 0);
  el.classList.toggle("negative", rounded < 0);
}

export function renderTransactionsTable(transactions, { customersById, regionsById }) {
  const tbody = document.getElementById("transactionsBody");
  if (!tbody) return;

  if (!transactions.length) {
    tbody.innerHTML = `<tr class="empty-row"><td colspan="6">No transactions match the current filters.</td></tr>`;
    return;
  }

  const rows = transactions
    .slice(0, 25) // most recent 25 — table is a recent-activity feed, not a full export
    .map((t) => {
      const customerName = customersById.get(t.customerId)?.name || "Unknown customer";
      const regionName = regionsById.get(t.regionId)?.name || t.regionId;
      const dateLabel = t.date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
      const statusClass = t.status === "completed" ? "status-completed" : "status-refunded";

      return `
        <tr>
          <td>${escapeHtml(customerName)}</td>
          <td>${escapeHtml(t.productName || t.productId)}</td>
          <td>${escapeHtml(regionName)}</td>
          <td>${dateLabel}</td>
          <td><span class="status-badge ${statusClass}">${t.status}</span></td>
          <td class="align-right">${formatCurrency(t.amount)}</td>
        </tr>
      `;
    })
    .join("");

  tbody.innerHTML = rows;
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}
