// js/charts.js
//
// Creates and updates the three Chart.js instances. Colors are hardcoded
// here (matching css/style.css's design tokens) since Chart.js can't
// read CSS custom properties directly on canvas.

const COLORS = {
  accent: "#3ecf8e",
  accentSoft: "rgba(62, 207, 142, 0.12)",
  secondary: "#8b7cf6",
  negative: "#f2707a",
  textSecondary: "#9aa4b2",
  textTertiary: "#64707e",
  gridLine: "rgba(255, 255, 255, 0.06)",
};

const PALETTE = ["#3ecf8e", "#8b7cf6", "#f2c94c", "#f2707a", "#56ccf2", "#bb86fc"];

Chart.defaults.font.family = "'Inter', sans-serif";
Chart.defaults.color = COLORS.textSecondary;

let revenueTrendChart = null;
let categoryChart = null;
let regionChart = null;

export function initCharts() {
  const revenueCtx = document.getElementById("revenueTrendChart");
  revenueTrendChart = new Chart(revenueCtx, {
    type: "line",
    data: {
      labels: [],
      datasets: [
        {
          label: "Revenue",
          data: [],
          borderColor: COLORS.accent,
          backgroundColor: COLORS.accentSoft,
          fill: true,
          tension: 0.35,
          pointRadius: 0,
          pointHoverRadius: 5,
          pointHoverBackgroundColor: COLORS.accent,
          borderWidth: 2,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: "index", intersect: false },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: "#141a22",
          borderColor: "rgba(255,255,255,0.1)",
          borderWidth: 1,
          padding: 10,
          titleFont: { size: 12 },
          bodyFont: { size: 13 },
          callbacks: {
            label: (ctx) => `$${ctx.parsed.y.toLocaleString()}`,
          },
        },
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { maxTicksLimit: 8, color: COLORS.textTertiary },
        },
        y: {
          grid: { color: COLORS.gridLine },
          ticks: {
            color: COLORS.textTertiary,
            callback: (value) => `$${value.toLocaleString()}`,
          },
        },
      },
    },
  });

  const categoryCtx = document.getElementById("categoryChart");
  categoryChart = new Chart(categoryCtx, {
    type: "doughnut",
    data: {
      labels: [],
      datasets: [
        {
          data: [],
          backgroundColor: PALETTE,
          borderColor: "#0a0e13",
          borderWidth: 3,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: "68%",
      plugins: {
        legend: {
          position: "right",
          labels: {
            boxWidth: 10,
            boxHeight: 10,
            usePointStyle: true,
            pointStyle: "circle",
            padding: 14,
            font: { size: 12 },
          },
        },
        tooltip: {
          backgroundColor: "#141a22",
          borderColor: "rgba(255,255,255,0.1)",
          borderWidth: 1,
          callbacks: {
            label: (ctx) => `${ctx.label}: $${ctx.parsed.toLocaleString()}`,
          },
        },
      },
    },
  });

  const regionCtx = document.getElementById("regionChart");
  regionChart = new Chart(regionCtx, {
    type: "bar",
    data: {
      labels: [],
      datasets: [
        {
          data: [],
          backgroundColor: COLORS.secondary,
          borderRadius: 6,
          maxBarThickness: 34,
        },
      ],
    },
    options: {
      indexAxis: "y",
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: "#141a22",
          borderColor: "rgba(255,255,255,0.1)",
          borderWidth: 1,
          callbacks: {
            label: (ctx) => `$${ctx.parsed.x.toLocaleString()}`,
          },
        },
      },
      scales: {
        x: {
          grid: { color: COLORS.gridLine },
          ticks: {
            color: COLORS.textTertiary,
            callback: (value) => `$${value.toLocaleString()}`,
          },
        },
        y: {
          grid: { display: false },
          ticks: { color: COLORS.textSecondary },
        },
      },
    },
  });
}

export function updateRevenueTrendChart(dailyData) {
  revenueTrendChart.data.labels = dailyData.map((d) => d.label);
  revenueTrendChart.data.datasets[0].data = dailyData.map((d) => d.value);
  revenueTrendChart.update();
}

export function updateCategoryChart(categoryData) {
  categoryChart.data.labels = categoryData.map((d) => d.label);
  categoryChart.data.datasets[0].data = categoryData.map((d) => d.value);
  categoryChart.update();
}

export function updateRegionChart(regionData) {
  regionChart.data.labels = regionData.map((d) => d.label);
  regionChart.data.datasets[0].data = regionData.map((d) => d.value);
  regionChart.update();
}
