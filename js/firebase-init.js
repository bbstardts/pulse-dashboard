
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBN7CJeRUsF85x_QaxQGrsynhapBMnVzuI",
  authDomain: "pulse-dashboard-dc6fd.firebaseapp.com",
  projectId: "pulse-dashboard-dc6fd",
  storageBucket: "pulse-dashboard-dc6fd.firebasestorage.app",
  messagingSenderId: "798934865751",
  appId: "1:798934865751:web:a76b3e386a6fc19dcf1012",
  measurementId: "G-EVZ91EBXX3",
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
