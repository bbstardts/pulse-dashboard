# Seed Script

Populates Firestore with realistic sales data for the dashboard:
products, regions, customers, and transactions with a visible growth
trend and a Nov/Dec seasonal spike.

## Setup

1. In the Firebase Console → Project Settings → Service Accounts,
   click **Generate new private key**.
2. Save the downloaded JSON file as `serviceAccountKey.json` in this
   `seed/` folder. (It's git-ignored — never commit this file.)
3. Install dependencies:
   ```
   npm install
   ```
4. Run the seed:
   ```
   npm run seed
   ```

## What it creates

- `products` — 8 sample products across 5 categories
- `regions` — 6 regions (Nigeria + a few international)
- `customers` — 40 customers with random names/regions
- `transactions` — ~800 transactions spread across the last 12
  months, weighted so recent months and Nov/Dec show more volume
  (simulates growth + seasonality)

## Re-running

The script clears `transactions`, `customers`, `products`, and
`regions` before reseeding, so it's safe to run multiple times while
you're tuning the numbers in `config.js`.

## Tuning the data

Edit `config.js` to change:
- How many months of history / total transactions
- The refund rate
- The product catalog, prices, and categories
- The regions used
