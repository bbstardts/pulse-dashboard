

import { db } from "./firebase-init.js";
import {
  collection,
  getDocs,
  onSnapshot,
  addDoc,
  Timestamp,
  query,
  orderBy,
  limit,
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

// ---------- One-time reference data (products, regions, customers) ----------


export async function fetchReferenceData() {
  const [productsSnap, regionsSnap, customersSnap] = await Promise.all([
    getDocs(collection(db, "products")),
    getDocs(collection(db, "regions")),
    getDocs(collection(db, "customers")),
  ]);

  const products = productsSnap.docs.map((d) => d.data());
  const regions = regionsSnap.docs.map((d) => d.data());
  const customers = customersSnap.docs.map((d) => d.data());

  return { products, regions, customers };
}

// ---------- Real-time transactions ----------


export function subscribeToTransactions(onUpdate, onError) {
  const q = query(
    collection(db, "transactions"),
    orderBy("date", "desc"),
    limit(2000)
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const transactions = snapshot.docs.map((d) => {
        const data = d.data();
        return {
          ...data,
          // Normalize Firestore Timestamp -> JS Date for easy use everywhere else
          date: data.date instanceof Timestamp ? data.date.toDate() : data.date,
        };
      });
      onUpdate(transactions);
    },
    (error) => {
      console.error("Transactions listener error:", error);
      if (onError) onError(error);
    }
  );
}

// ---------- Adding a new live sale ----------


function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomChoice(arr) {
  return arr[randomInt(0, arr.length - 1)];
}

export async function addRandomSale({ products, customers }) {
  if (!products.length || !customers.length) {
    throw new Error("Reference data not loaded yet.");
  }

  const product = randomChoice(products);
  const customer = randomChoice(customers);
  const quantity = randomInt(1, 4);
  const amount = Math.round(product.price * quantity * 100) / 100;
  const profit = Math.round((product.price - product.cost) * quantity * 100) / 100;
  // Live-generated sales are always "completed" so the demo feels celebratory
  const status = "completed";

  const transaction = {
    productId: product.id,
    productName: product.name,
    category: product.category,
    customerId: customer.id,
    regionId: customer.regionId,
    quantity,
    amount,
    profit,
    date: Timestamp.now(),
    status,
  };

  await addDoc(collection(db, "transactions"), transaction);
  return transaction;
}

// ---------- Adding a manually-entered sale ----------


export async function addManualSale({ productId, customerId, quantity, status, products, customers }) {
  const product = products.find((p) => p.id === productId);
  const customer = customers.find((c) => c.id === customerId);

  if (!product) throw new Error("Select a valid product.");
  if (!customer) throw new Error("Select a valid customer.");
  if (!quantity || quantity < 1) throw new Error("Quantity must be at least 1.");

  const amount = Math.round(product.price * quantity * 100) / 100;
  const profit = Math.round((product.price - product.cost) * quantity * 100) / 100;

  const transaction = {
    productId: product.id,
    productName: product.name,
    category: product.category,
    customerId: customer.id,
    regionId: customer.regionId,
    quantity,
    amount,
    profit,
    date: Timestamp.now(),
    status: status === "refunded" ? "refunded" : "completed",
  };

  await addDoc(collection(db, "transactions"), transaction);
  return transaction;
}
