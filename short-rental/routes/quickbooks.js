
// ─────────────────────────────────────────────────────
// ONE route: Create a $1,000 payment by customer name
// ─────────────────────────────────────────────────────
//
// HOW TO GET YOUR ACCESS TOKEN (no redirect/callback needed):
//
//   1. Go to: https://developer.intuit.com/router/developer/qbo/docs/develop/authentication-and-authorization/oauth-2.0-playground
//   2. Select your router, select "Accounting" scope
//   3. Click "Get authorization code" → authorize with your sandbox
//   4. Click "Get tokens"
//   5. Copy the "Access Token" and "Realm ID" values
//   6. Paste them below or set as env vars
//
// RUN:
//   node scripts/create-payment.mjs
//
// TEST:
//   curl -X POST http://localhost:3000/create-payment \
//     -H "Content-Type: routerlication/json" \
//     -d '{"customerName": "John Doe"}'
//
// ─────────────────────────────────────────────────────

import express from "express";

const router = express.Router();


// ── Paste your values here (or use env vars) ─────────

const ACCESS_TOKEN = process.env.QUICKBOOKS_ACCESS_TOKEN || "Q6sUxkVirrXKyDIOs9dfzlWLh5hhZXLbtf3ihmcw";
const REALM_ID = process.env.QUICKBOOKS_REALM_ID || "ABAyU8anwqmTAF56oxKLfpu4lhWkgXhSr2EVgqTVDj2PErmUP8";
const ENVIRONMENT = process.env.QUICKBOOKS_ENVIRONMENT || "sandbox";

const API_BASE =
  ENVIRONMENT === "production"
    ? "https://quickbooks.api.intuit.com"
    : "https://sandbox-quickbooks.api.intuit.com";

// ── Helper: call QuickBooks API ──────────────────────

async function qbRequest(method, path, body) {
  const url = `${API_BASE}/v3/company/${REALM_ID}${path}`;

  const options = {
    method,
    headers: {
      Authorization: `Bearer ${ACCESS_TOKEN}`,
      Accept: "routerlication/json",
      "Content-Type": "routerlication/json",
    },
  };

  if (body) options.body = JSON.stringify(body);

  const res = await fetch(url, options);
  const data = await res.json();

  if (!res.ok) {
    throw new Error(`QuickBooks API error (${res.status}): ${JSON.stringify(data)}`);
  }

  return data;
}

// ── Helper: query QuickBooks ─────────────────────────

async function qbQuery(query) {
  const url = `${API_BASE}/v3/company/${REALM_ID}/query?query=${encodeURIComponent(query)}`;

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${ACCESS_TOKEN}`,
      Accept: "routerlication/json",
    },
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(`QuickBooks query error (${res.status}): ${JSON.stringify(data)}`);
  }

  return data;
}

// ── POST /create-payment ─────────────────────────────
//
// Body: { "customerName": "John Doe" }
//
// What it does:
//   1. Looks up the customer by name in QuickBooks
//   2. If not found, creates the customer
//   3. Creates a $1,000 payment for that customer
//

router.post("/create-payment", async (req, res) => {
  try {
    const { customerName } = req.body;

    if (!customerName || typeof customerName !== "string" || !customerName.trim()) {
      return res.status(400).json({
        error: "Missing customerName",
        usage: 'POST /create-payment with body { "customerName": "John Doe" }',
      });
    }

    const name = customerName.trim();

    // Step 1: Find customer by name
    const escaped = name.replace(/'/g, "\\'");
    const queryResult = await qbQuery(
      `SELECT * FROM Customer WHERE DisplayName = '${escaped}'`
    );

    let customerId;
    let displayName;
    let customerCreated = false;

    const customers = queryResult?.QueryResponse?.Customer;

    if (customers && customers.length > 0) {
      customerId = customers[0].Id;
      displayName = customers[0].DisplayName;
    } else {
      // Step 2: Create customer if not found
      const created = await qbRequest("POST", "/customer", {
        DisplayName: name,
      });
      customerId = created.Customer.Id;
      displayName = created.Customer.DisplayName;
      customerCreated = true;
    }

    // Step 3: Create $1,000 payment
    const today = new Date().toISOString().split("T")[0];

    const paymentResult = await qbRequest("POST", "/payment", {
      CustomerRef: {
        value: customerId,
        name: displayName,
      },
      TotalAmt: 1000.0,
      TxnDate: today,
    });

    const payment = paymentResult.Payment;

    res.json({
      success: true,
      message: `Created $1,000 payment for "${displayName}"`,
      customerCreated,
      customer: { id: customerId, name: displayName },
      payment: {
        id: payment.Id,
        amount: payment.TotalAmt,
        date: payment.TxnDate,
      },
    });
  } catch (err) {
    console.error("Error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── Start ────────────────────────────────────────────

export default router;