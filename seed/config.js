

module.exports = {
  // How many months of historical transactions to generate
  MONTHS_OF_HISTORY: 12,

  // Roughly how many transactions to create in total
  TOTAL_TRANSACTIONS: 800,

  // How many customers to create
  TOTAL_CUSTOMERS: 40,

  // Chance (0-1) that a given transaction ends up "refunded" instead of "completed"
  REFUND_RATE: 0.05,

  PRODUCTS: [
    { id: "prod_001", name: "Wireless Earbuds Pro", category: "Electronics", price: 89.99, cost: 42.0 },
    { id: "prod_002", name: "Smart Fitness Band", category: "Electronics", price: 59.99, cost: 25.0 },
    { id: "prod_003", name: "Classic Denim Jacket", category: "Apparel", price: 74.5, cost: 30.0 },
    { id: "prod_004", name: "Running Sneakers", category: "Sports", price: 120.0, cost: 55.0 },
    { id: "prod_005", name: "Non-Stick Cookware Set", category: "Home & Kitchen", price: 145.0, cost: 68.0 },
    { id: "prod_006", name: "Organic Face Serum", category: "Beauty", price: 34.99, cost: 12.5 },
    { id: "prod_007", name: "Bluetooth Speaker", category: "Electronics", price: 49.99, cost: 20.0 },
    { id: "prod_008", name: "Yoga Mat Premium", category: "Sports", price: 39.99, cost: 15.0 },
  ],

  REGIONS: [
    { id: "region_lagos", name: "Lagos", country: "Nigeria" },
    { id: "region_abuja", name: "Abuja", country: "Nigeria" },
    { id: "region_ph", name: "Port Harcourt", country: "Nigeria" },
    { id: "region_ny", name: "New York", country: "USA" },
    { id: "region_london", name: "London", country: "UK" },
    { id: "region_nairobi", name: "Nairobi", country: "Kenya" },
  ],

  FIRST_NAMES: [
    "Ade", "Chidi", "Femi", "Ngozi", "Tunde", "Amaka", "Sade", "Ifeoma",
    "James", "Emma", "Olivia", "Liam", "Noah", "Ava", "Mia", "Lucas",
    "Wanjiru", "Kwame", "Zainab", "Bola",
  ],

  LAST_NAMES: [
    "Okafor", "Adeyemi", "Balogun", "Eze", "Mohammed", "Johnson", "Smith",
    "Williams", "Brown", "Okoro", "Abiola", "Kamau", "Mensah", "Bello",
  ],
};
