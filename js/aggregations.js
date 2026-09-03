

export function filterTransactions(transactions, { days, regionId, category }) {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);

  return transactions.filter((t) => {
    if (t.date < cutoff) return false;
    if (regionId !== "all" && t.regionId !== regionId) return false;
    if (category !== "all" && t.category !== category) return false;
    return true;
  });
}


export function filterPreviousPeriod(transactions, { days, regionId, category }) {
  const periodEnd = new Date();
  periodEnd.setDate(periodEnd.getDate() - days);
  const periodStart = new Date();
  periodStart.setDate(periodStart.getDate() - days * 2);

  return transactions.filter((t) => {
    if (t.date < periodStart || t.date >= periodEnd) return false;
    if (regionId !== "all" && t.regionId !== regionId) return false;
    if (category !== "all" && t.category !== category) return false;
    return true;
  });
}

export function computeKPIs(transactions) {
  const completed = transactions.filter((t) => t.status === "completed");

  const totalRevenue = completed.reduce((sum, t) => sum + t.amount, 0);
  const totalOrders = completed.length;
  const avgOrderValue = totalOrders ? totalRevenue / totalOrders : 0;
  const uniqueCustomers = new Set(completed.map((t) => t.customerId)).size;

  return { totalRevenue, totalOrders, avgOrderValue, uniqueCustomers };
}

export function percentChange(current, previous) {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}


export function groupRevenueByDay(transactions) {
  const completed = transactions.filter((t) => t.status === "completed");
  const byDay = new Map();

  completed.forEach((t) => {
    const key = t.date.toISOString().slice(0, 10); // YYYY-MM-DD
    byDay.set(key, (byDay.get(key) || 0) + t.amount);
  });

  const sortedKeys = Array.from(byDay.keys()).sort();

  return sortedKeys.map((key) => {
    const date = new Date(key);
    return {
      label: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      value: Math.round(byDay.get(key) * 100) / 100,
    };
  });
}

// Groups revenue by category -> [{ label: "Electronics", value: 1234.50 }, ...]
export function groupRevenueByCategory(transactions) {
  const completed = transactions.filter((t) => t.status === "completed");
  const byCategory = new Map();

  completed.forEach((t) => {
    byCategory.set(t.category, (byCategory.get(t.category) || 0) + t.amount);
  });

  return Array.from(byCategory.entries())
    .map(([label, value]) => ({ label, value: Math.round(value * 100) / 100 }))
    .sort((a, b) => b.value - a.value);
}

// Groups revenue by region -> [{ label: "Lagos", value: 1234.50 }, ...]
export function groupRevenueByRegion(transactions, regionsById) {
  const completed = transactions.filter((t) => t.status === "completed");
  const byRegion = new Map();

  completed.forEach((t) => {
    byRegion.set(t.regionId, (byRegion.get(t.regionId) || 0) + t.amount);
  });

  return Array.from(byRegion.entries())
    .map(([regionId, value]) => ({
      label: regionsById.get(regionId)?.name || regionId,
      value: Math.round(value * 100) / 100,
    }))
    .sort((a, b) => b.value - a.value);
}

export function formatCurrency(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatNumber(value) {
  return new Intl.NumberFormat("en-US").format(value);
}
