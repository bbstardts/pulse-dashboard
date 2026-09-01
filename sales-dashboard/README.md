# Pulse — Live Sales & Revenue Dashboard

A real-time sales and revenue dashboard built with **vanilla JavaScript**
and **Firebase Firestore**. Data updates live — click "Add a new sale"
and watch the charts and KPIs update instantly, no page refresh.

![Stack](https://img.shields.io/badge/stack-JS%20%7C%20Firebase%20%7C%20Chart.js-3ecf8e)

## Features

- Live KPI cards: total revenue, orders, average order value, active customers
- Period-over-period comparison (e.g. "+12% vs. previous period")
- Revenue trend chart (daily, over the selected date range)
- Revenue breakdown by category and by region
- Recent transactions table with status badges
- Filters: date range, region, category — fully reactive
- "Add a new sale" button that writes a live transaction to Firestore
  and updates the whole dashboard in real time
- Dark, glassmorphic UI with a Fraunces/Inter type pairing
- Fully responsive, keyboard-accessible, respects reduced-motion

## Tech stack

- **Frontend**: Vanilla HTML/CSS/JS (ES modules, no build step, no framework)
- **Charts**: Chart.js (via CDN)
- **Backend**: Firebase Firestore (real-time database)
- **Seeding**: Node.js script using the Firebase Admin SDK
- **Hosting**: Firebase Hosting (or any static host — Netlify, Vercel, GitHub Pages)

## Project structure

```
sales-dashboard/
├── index.html              # Main dashboard page
├── css/
│   └── style.css           # All styling (dark glass theme)
├── js/
│   ├── firebase-init.js    # Firebase client config (fill in your keys)
│   ├── data-service.js     # Firestore reads/writes
│   ├── aggregations.js     # Filtering + KPI/chart calculations
│   ├── charts.js           # Chart.js setup and updates
│   ├── ui.js                # DOM rendering (KPIs, table)
│   └── app.js               # Entry point — wires everything together
├── seed/
│   ├── config.js            # Sample products/regions/name pools
│   ├── seed.js               # Populates Firestore with demo data
│   ├── package.json
│   └── README.md
├── firestore.rules          # Security rules (public read, validated create)
├── firebase.json             # Firebase Hosting config
└── .firebaserc                # Firebase project alias (fill in your project ID)
```

## Setup

### 1. Create a Firebase project

Go to the [Firebase Console](https://console.firebase.google.com/),
create a new project, and enable **Firestore Database** (start in
production mode — the included security rules handle access control).

### 2. Get your web app config

In Project Settings → General → "Your apps", add a Web app and copy
the config object into `js/firebase-init.js`, replacing the
placeholder values.

### 3. Seed the database

Follow the instructions in `seed/README.md` — you'll download a
service account key and run `npm install && npm run seed` from the
`seed/` folder. This populates products, regions, customers, and
~800 realistic transactions spread across the last 12 months.

### 4. Deploy the Firestore rules

```bash
npm install -g firebase-tools
firebase login
firebase use --add        # select your project, or edit .firebaserc directly
firebase deploy --only firestore:rules
```

### 5. Run it locally

Since this uses ES modules, you need to serve the files (not just
open `index.html` directly) to avoid CORS issues:

```bash
npx serve .
# or: python3 -m http.server 8000
```

Then visit the printed local URL.

### 6. Deploy to Firebase Hosting

```bash
firebase deploy --only hosting
```

You'll get a live `https://YOUR_PROJECT_ID.web.app` URL — that's your
shareable link for LinkedIn.

**Alternative hosting**: this is a static site, so it also deploys
as-is to **Netlify**, **Vercel**, or **GitHub Pages** — just point
them at the repo root and skip the `firebase deploy` step. The
Firestore backend works the same regardless of where the frontend is
hosted.

## Notes on the security rules

There's no login on this demo, so anyone can click "Add a new sale."
The Firestore rules (`firestore.rules`) allow that, but validate the
shape and bounds of what can be written (amount and quantity capped,
required fields enforced) and block all updates/deletes — so visitors
can add data but can't corrupt or erase the seeded dataset. If you
add Firebase Auth later, tighten the `allow create` rule to require
`request.auth != null`.

## License

Free to use and adapt for your own portfolio.
