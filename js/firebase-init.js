// js/firebase-init.js
//
// Client-side Firebase setup. This file is safe to expose publicly —
// Firebase web API keys are not secret; access is controlled by your
// Firestore Security Rules, not by hiding this config.
//
// Replace the values below with your own project's config, which you
// can find in: Firebase Console -> Project Settings -> General ->
// "Your apps" -> Web app -> SDK setup and configuration.

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID",
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
