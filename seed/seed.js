

const admin = require("firebase-admin");
const config = require("./config");

const serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

// ---------- Helpers ----------

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomChoice(arr) {
  return arr[randomInt(0, arr.length - 1)];
}

function randomFullName() {
  return `${randomChoice(config.FIRST_NAMES)} ${randomChoice(config.LAST_NAMES)}`;
}


function monthWeight(monthIndex, totalMonths, calendarMonth) {
  const trendFactor = 1 + (monthIndex / totalMonths) * 0.8; // up to +80% by the most recent month
  const isHolidaySeason = calendarMonth === 10 || calendarMonth === 11; // Nov (10) / Dec (11), 0-indexed
  const seasonalFactor = isHolidaySeason ? 1.5 : 1;
  return trendFactor * seasonalFactor;
}

// Builds a list of {monthIndex, date-range-start, date-range-end, calendarMonth}
function buildMonthBuckets(monthsOfHistory) {
  const buckets = [];
  const now = new Date();
  for (let i = monthsOfHistory - 1; i >= 0; i--) {
    const bucketDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
    buckets.push({
      monthIndex: monthsOfHistory - 1 - i, // 0 = oldest
      calendarMonth: bucketDate.getMonth(),
      year: bucketDate.getFullYear(),
    });
  }
  return buckets;
}

function randomDateInMonth(year, month) {
  const now = new Date();
  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth();

  
  const maxDay = isCurrentMonth ? now.getDate() : 28;
  const day = randomInt(1, Math.max(1, Math.min(maxDay, 28)));
  const hour = randomInt(8, 22);
  const minute = randomInt(0, 59);

  const candidate = new Date(year, month, day, hour, minute);
  return candidate > now ? now : candidate;
}

// ---------- Clearing (so the script is safely re-runnable) ----------

async function clearCollection(name) {
  const snap = await db.collection(name).get();
  const batchSize = 400;
  let docs = snap.docs;
  while (docs.length) {
    const chunk = docs.splice(0, batchSize);
    const batch = db.batch();
    chunk.forEach((doc) => batch.delete(doc.ref));
    await batch.commit();
  }
  console.log(`Cleared collection: ${name}`);
}

async function clearCollections() {
  await clearCollection("transactions");
  await clearCollection("customers");
  await clearCollection("products");
  await clearCollection("regions");
}

// ---------- Seeding ----------

async function seedProductsAndRegions() {
  const batch = db.batch();
  config.PRODUCTS.forEach((p) => {
    batch.set(db.collection("products").doc(p.id), p);
  });
  config.REGIONS.forEach((r) => {
    batch.set(db.collection("regions").doc(r.id), r);
  });
  await batch.commit();
  console.log(`Seeded ${config.PRODUCTS.length} products and ${config.REGIONS.length} regions.`);
}

async function seedCustomers() {
  const customers = [];
  const batch = db.batch();
  for (let i = 0; i < config.TOTAL_CUSTOMERS; i++) {
    const id = `cust_${String(i + 1).padStart(3, "0")}`;
    const region = randomChoice(config.REGIONS);
    const customer = {
      id,
      name: randomFullName(),
      regionId: region.id,
      joinedAt: admin.firestore.Timestamp.fromDate(
        randomDateInMonth(new Date().getFullYear() - 1, randomInt(0, 11))
      ),
      totalSpent: 0, // will be updated as we generate transactions
    };
    customers.push(customer);
    batch.set(db.collection("customers").doc(id), customer);
  }
  await batch.commit();
  console.log(`Seeded ${customers.length} customers.`);
  return customers;
}

async function seedTransactions(customers) {
  const buckets = buildMonthBuckets(config.MONTHS_OF_HISTORY);

  // Compute relative weight per month so we can distribute TOTAL_TRANSACTIONS
  // proportionally (more transactions in later / holiday months).
  const weights = buckets.map((b) => monthWeight(b.monthIndex, config.MONTHS_OF_HISTORY, b.calendarMonth));
  const totalWeight = weights.reduce((a, b) => a + b, 0);

  const customerSpendTotals = {}; // id -> accumulated spend, written back at the end

  let txnCounter = 1;
  let batch = db.batch();
  let opsInBatch = 0;

  for (let m = 0; m < buckets.length; m++) {
    const bucket = buckets[m];
    const txnCountForMonth = Math.round((weights[m] / totalWeight) * config.TOTAL_TRANSACTIONS);

    for (let t = 0; t < txnCountForMonth; t++) {
      const product = randomChoice(config.PRODUCTS);
      const customer = randomChoice(customers);
      const quantity = randomInt(1, 4);
      const amount = Math.round(product.price * quantity * 100) / 100;
      const profit = Math.round((product.price - product.cost) * quantity * 100) / 100;
      const isRefunded = Math.random() < config.REFUND_RATE;
      const date = randomDateInMonth(bucket.year, bucket.calendarMonth);

      const id = `txn_${String(txnCounter).padStart(4, "0")}`;
      txnCounter++;

      const transaction = {
        id,
        productId: product.id,
        productName: product.name,
        category: product.category,
        customerId: customer.id,
        regionId: customer.regionId,
        quantity,
        amount,
        profit,
        date: admin.firestore.Timestamp.fromDate(date),
        status: isRefunded ? "refunded" : "completed",
      };

      batch.set(db.collection("transactions").doc(id), transaction);
      opsInBatch++;

      if (!isRefunded) {
        customerSpendTotals[customer.id] = (customerSpendTotals[customer.id] || 0) + amount;
      }

      // Firestore batches max out at 500 operations
      if (opsInBatch >= 450) {
        await batch.commit();
        batch = db.batch();
        opsInBatch = 0;
      }
    }
  }

  if (opsInBatch > 0) {
    await batch.commit();
  }
  console.log(`Seeded ${txnCounter - 1} transactions across ${config.MONTHS_OF_HISTORY} months.`);

  // Write back accumulated totalSpent per customer
  let spendBatch = db.batch();
  let spendOps = 0;
  for (const [customerId, total] of Object.entries(customerSpendTotals)) {
    spendBatch.update(db.collection("customers").doc(customerId), {
      totalSpent: Math.round(total * 100) / 100,
    });
    spendOps++;
    if (spendOps >= 450) {
      await spendBatch.commit();
      spendBatch = db.batch();
      spendOps = 0;
    }
  }
  if (spendOps > 0) {
    await spendBatch.commit();
  }
  console.log("Updated customer totalSpent fields.");
}

// ---------- Run ----------

async function main() {
  console.log("Starting seed process...");
  await clearCollections();
  await seedProductsAndRegions();
  const customers = await seedCustomers();
  await seedTransactions(customers);
  console.log("Seeding complete!");
  process.exit(0);
}

main().catch((err) => {
  console.error("Seeding failed:", err);
  process.exit(1);
});
