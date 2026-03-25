import "dotenv/config";

import express from "express";
import { google } from "googleapis";
import { PubSub } from "@google-cloud/pubsub";
import postSms from "../db/smsPOSTnewSms.js";
import getUniqeSms from "../db/smsGETuniqe.js";

const router = express.Router();

// ─── Pub/Sub Config ──────────────────────────────────────
const GOOGLE_PROJECT_ID = process.env.GOOGLE_PROJECT_ID || "";
const GOOGLE_SERVICE_ACCOUNT = process.env.GOOGLE_SERVICE_ACCOUNT || ""; // JSON string
const PUBSUB_TOPIC = "gmail-push";
const PUBSUB_SUBSCRIPTION = "gmail-push-sub";
const WEBHOOK_URL = "https://ygbackend.com/short_rental/gmail/gmail-webhook";

// Parse service account credentials
function getCredentials() {
  if (GOOGLE_SERVICE_ACCOUNT) {
    try {
      return JSON.parse(GOOGLE_SERVICE_ACCOUNT);
    } catch (err) {
      console.error("[pubsub] Failed to parse GOOGLE_SERVICE_ACCOUNT JSON");
      return null;
    }
  }
  return null;
}

// ─── Setup Pub/Sub (run once) ────────────────────────────
async function setupPubSub() {
  try {
    const credentials = getCredentials();
    if (!credentials) {
      throw new Error(
        "GOOGLE_SERVICE_ACCOUNT env variable not set or invalid JSON",
      );
    }

    // Create auth client from service account credentials
    const { JWT } = await import("google-auth-library");
    const authClient = new JWT({
      email: credentials.client_email,
      key: credentials.private_key,
      scopes: ["https://www.googleapis.com/auth/pubsub"],
    });

    const pubsub = new PubSub({
      projectId: GOOGLE_PROJECT_ID,
      authClient: authClient,
    });

    // 1. Create topic (or get existing)
    let topic;
    try {
      [topic] = await pubsub.createTopic(PUBSUB_TOPIC);
      console.log(`[pubsub] Created topic: ${PUBSUB_TOPIC}`);
    } catch (err) {
      if (err.code === 6) {
        // Already exists
        topic = pubsub.topic(PUBSUB_TOPIC);
        console.log(`[pubsub] Topic already exists: ${PUBSUB_TOPIC}`);
      } else {
        throw err;
      }
    }

    // 2. Grant Gmail permission to publish
    const [policy] = await topic.iam.getPolicy();
    const binding = {
      role: "roles/pubsub.publisher",
      members: ["serviceAccount:gmail-api-push@system.gserviceaccount.com"],
    };

    const existingBinding = policy.bindings?.find(
      (b) => b.role === binding.role,
    );
    if (
      !existingBinding ||
      !existingBinding.members.includes(binding.members[0])
    ) {
      policy.bindings = policy.bindings || [];
      policy.bindings.push(binding);
      await topic.iam.setPolicy(policy);
      console.log(`[pubsub] Granted Gmail publish permission`);
    }

    // 3. Create push subscription (or update existing)
    try {
      await topic.createSubscription(PUBSUB_SUBSCRIPTION, {
        pushConfig: {
          pushEndpoint: WEBHOOK_URL,
        },
      });
      console.log(
        `[pubsub] Created subscription: ${PUBSUB_SUBSCRIPTION} -> ${WEBHOOK_URL}`,
      );
    } catch (err) {
      if (err.code === 6) {
        // Already exists - update endpoint
        const subscription = pubsub.subscription(PUBSUB_SUBSCRIPTION);
        await subscription.modifyPushConfig({
          pushEndpoint: WEBHOOK_URL,
        });
        console.log(`[pubsub] Updated subscription endpoint: ${WEBHOOK_URL}`);
      } else {
        throw err;
      }
    }

    console.log(`[pubsub] Setup complete`);
    return true;
  } catch (err) {
    console.error(`[pubsub] Setup error: ${err.message}`);
    return false;
  }
}

// ─── Setup Gmail Watch (run once, renew every 7 days) ────
async function setupGmailWatch() {
  try {
    const response = await gmail.users.watch({
      userId: "me",
      requestBody: {
        topicName: `projects/${GOOGLE_PROJECT_ID}/topics/${PUBSUB_TOPIC}`,
        labelIds: ["INBOX"],
      },
    });
    console.log(`[gmail] Watch setup, expires: ${response.data.expiration}`);
    return response.data;
  } catch (err) {
    console.error(`[gmail] Watch setup error: ${err.message}`);
    return null;
  }
}

// ─── Gmail Config ────────────────────────────────────────
const GMAIL_CLIENT_ID = process.env.GMAIL_CLIENT_ID || "";
const GMAIL_CLIENT_SECRET = process.env.GMAIL_CLIENT_SECRET || "";
const GMAIL_REFRESH_TOKEN = process.env.GMAIL_REFRESH_TOKEN || "";

const oauth2Client = new google.auth.OAuth2(
  GMAIL_CLIENT_ID,
  GMAIL_CLIENT_SECRET,
);
oauth2Client.setCredentials({ refresh_token: GMAIL_REFRESH_TOKEN });

const gmail = google.gmail({ version: "v1", auth: oauth2Client });

// ─── Price API Config ────────────────────────────────────
const TWELVE_DATA_API_KEY = process.env.TWELVE_DATA_API_KEY || "";
const TWELVE_DATA_BASE_URL = "https://api.twelvedata.com";
const MAX_SYMBOLS_PER_REQUEST = 5;

// ─── In-Memory Logs ─────────────────────────────────────
const logs = [];

// ─── Price Cache (5 min TTL) ─────────────────────────────
const priceCache = {};
const CACHE_TTL_MS = 5 * 60 * 1000;

function getCached(ticker) {
  const cached = priceCache[ticker];
  if (!cached) return null;
  const age = Date.now() - cached.timestamp;
  if (age > CACHE_TTL_MS) {
    delete priceCache[ticker];
    addLog(
      "cache",
      `${ticker} cache expired (${(age / 1000).toFixed(0)}s old)`,
    );
    return null;
  }
  addLog(
    "cache",
    `${ticker} served from cache (${(age / 1000).toFixed(0)}s old)`,
  );
  return cached.result;
}

function setCache(ticker, result) {
  priceCache[ticker] = { result, timestamp: Date.now() };
  addLog("cache", `${ticker} cached at ${new Date().toISOString()}`);
}

function addLog(type, message) {
  logs.push({ time: new Date().toISOString(), type, message });
  if (logs.length > 500) logs.shift();
  console.log(`[${type}] ${message}`);
}

// ─── Symbol Map ──────────────────────────────────────────
const SYMBOL_MAP = {
  // Crypto
  BTC: { symbol: "BTC/USD", name: "Bitcoin", type: "crypto" },
  ETH: { symbol: "ETH/USD", name: "Ethereum", type: "crypto" },
  SOL: { symbol: "SOL/USD", name: "Solana", type: "crypto" },
  XRP: { symbol: "XRP/USD", name: "Ripple", type: "crypto" },
  DOGE: { symbol: "DOGE/USD", name: "Dogecoin", type: "crypto" },
  ADA: { symbol: "ADA/USD", name: "Cardano", type: "crypto" },
  DOT: { symbol: "DOT/USD", name: "Polkadot", type: "crypto" },
  AVAX: { symbol: "AVAX/USD", name: "Avalanche", type: "crypto" },
  MATIC: { symbol: "MATIC/USD", name: "Polygon", type: "crypto" },
  LINK: { symbol: "LINK/USD", name: "Chainlink", type: "crypto" },
  LTC: { symbol: "LTC/USD", name: "Litecoin", type: "crypto" },
  UNI: { symbol: "UNI/USD", name: "Uniswap", type: "crypto" },
  SHIB: { symbol: "SHIB/USD", name: "Shiba Inu", type: "crypto" },
  // Stocks
  AAPL: { symbol: "AAPL", name: "Apple", type: "stock" },
  TSLA: { symbol: "TSLA", name: "Tesla", type: "stock" },
  GOOGL: { symbol: "GOOGL", name: "Google", type: "stock" },
  AMZN: { symbol: "AMZN", name: "Amazon", type: "stock" },
  MSFT: { symbol: "MSFT", name: "Microsoft", type: "stock" },
  META: { symbol: "META", name: "Meta", type: "stock" },
  NVDA: { symbol: "NVDA", name: "NVIDIA", type: "stock" },
  NFLX: { symbol: "NFLX", name: "Netflix", type: "stock" },
  AMD: { symbol: "AMD", name: "AMD", type: "stock" },
  DIS: { symbol: "DIS", name: "Disney", type: "stock" },
  BA: { symbol: "BA", name: "Boeing", type: "stock" },
  JPM: { symbol: "JPM", name: "JPMorgan", type: "stock" },
  V: { symbol: "V", name: "Visa", type: "stock" },
};

// ─── Gmail Functions ─────────────────────────────────────

// Extract phone number from email (everything before @)
function extractPhoneFromEmail(email) {
  const match = email.match(/<?([^@<]+)@/);
  return match ? match[1].replace(/\D/g, "") : null;
}

// Extract carrier domain from email
function extractCarrierFromEmail(email) {
  const match = email.match(/@([^>]+)>?/);
  return match ? match[1] : null;
}

// Get latest unread email
async function getLatestEmail() {
  try {
    const response = await gmail.users.messages.list({
      userId: "me",
      maxResults: 1,
      q: "is:unread in:inbox",
    });

    if (!response.data.messages || response.data.messages.length === 0) {
      return null;
    }

    const messageId = response.data.messages[0].id;
    const message = await gmail.users.messages.get({
      userId: "me",
      id: messageId,
      format: "full",
    });

    const headers = message.data.payload.headers;
    const from = headers.find((h) => h.name === "From")?.value || "";
    const subject = headers.find((h) => h.name === "Subject")?.value || "";

    // Get body
    let body = "";
    if (message.data.payload.body?.data) {
      body = Buffer.from(message.data.payload.body.data, "base64").toString(
        "utf-8",
      );
    } else if (message.data.payload.parts) {
      const textPart = message.data.payload.parts.find(
        (p) => p.mimeType === "text/plain",
      );
      if (textPart?.body?.data) {
        body = Buffer.from(textPart.body.data, "base64").toString("utf-8");
      }
    }

    return {
      id: messageId,
      from,
      subject,
      body: body.trim(),
      phone: extractPhoneFromEmail(from),
      carrier: extractCarrierFromEmail(from),
    };
  } catch (err) {
    addLog("gmail-error", `Failed to get email: ${err.message}`);
    return null;
  }
}

// Mark email as read
async function markAsRead(messageId) {
  try {
    await gmail.users.messages.modify({
      userId: "me",
      id: messageId,
      requestBody: {
        removeLabelIds: ["UNREAD"],
      },
    });
    addLog("gmail", `Marked ${messageId} as read`);
  } catch (err) {
    addLog("gmail-error", `Failed to mark as read: ${err.message}`);
  }
}

// Send email reply
async function sendEmail(to, body, subject = "") {
  try {
    const message = [
      `To: ${to}`,
      `Subject: ${subject}`,
      "Content-Type: text/plain; charset=utf-8",
      "",
      body,
    ].join("\n");

    const encodedMessage = Buffer.from(message)
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");

    await gmail.users.messages.send({
      userId: "me",
      requestBody: {
        raw: encodedMessage,
      },
    });

    addLog("gmail", `Sent reply to ${to}`);
    return true;
  } catch (err) {
    addLog("gmail-error", `Failed to send: ${err.message}`);
    return false;
  }
}

// ─── Price Helpers ───────────────────────────────────────

function formatUSD(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: value < 1 ? 6 : 2,
  }).format(value);
}

function getHelpMessage() {
  const cryptoKeys = Object.entries(SYMBOL_MAP)
    .filter(([, v]) => v.type === "crypto")
    .map(([k]) => k)
    .slice(0, 6)
    .join(", ");

  const stockKeys = Object.entries(SYMBOL_MAP)
    .filter(([, v]) => v.type === "stock")
    .map(([k]) => k)
    .slice(0, 6)
    .join(", ");

  return [
    "Price Checker - Help",
    "",
    "Text a ticker symbol to get the live price.",
    "",
    `Crypto: ${cryptoKeys}...`,
    `Stocks: ${stockKeys}...`,
    "",
    "Send up to 5 symbols at once:",
    "Example: BTC ETH AAPL",
  ].join("\n");
}

async function fetchPrice(ticker) {
  const cached = getCached(ticker);
  if (cached) return cached;

  const entry = SYMBOL_MAP[ticker];
  const symbol = entry ? entry.symbol : ticker;
  const name = entry ? entry.name : ticker;

  try {
    const url = `${TWELVE_DATA_BASE_URL}/quote?symbol=${encodeURIComponent(symbol)}&apikey=${TWELVE_DATA_API_KEY}`;
    addLog("fetch", `Fetching ${ticker} -> ${symbol}`);
    const response = await fetch(url);
    const data = await response.json();
    addLog("response", `${ticker}: ${JSON.stringify(data).substring(0, 200)}`);

    if (data.code || data.status === "error") {
      addLog("error", `API error for ${ticker}: ${data.message || data.code}`);
      return null;
    }

    const price = parseFloat(data.close);
    const prevClose = parseFloat(data.previous_close);
    const change = price - prevClose;
    const changePercent = prevClose !== 0 ? (change / prevClose) * 100 : 0;

    addLog("success", `${ticker}: $${price} prev: $${prevClose}`);

    if (isNaN(price)) {
      addLog("error", `Price is NaN for ${ticker}`);
      return null;
    }

    const result = { name, price, change, changePercent };
    setCache(ticker, result);
    return result;
  } catch (err) {
    addLog("error", `Fetch error for ${ticker}: ${err.message}`);
    return null;
  }
}

function formatResult(result, ticker) {
  const arrow = result.change >= 0 ? "+" : "";
  const direction = result.change >= 0 ? "^" : "v";

  return [
    `${result.name} (${ticker})`,
    `${formatUSD(result.price)}`,
    `${direction} ${formatUSD(Math.abs(result.change))} (${arrow}${result.changePercent.toFixed(2)}%)`,
  ].join("\n");
}

// ─── Process Message ─────────────────────────────────────

async function processMessage(body) {
  const input = (body || "").trim().toUpperCase();

  if (!input) {
    return "Please send a ticker symbol (e.g. BTC, AAPL). Text HELP for more info.";
  }

  if (input === "HELP") {
    return getHelpMessage();
  }

  if (input === "ADMINNEW") {
    const resp = await getUniqeSms();
    console.log(resp);
    return resp[0]["count( distinct phone)"].toString();
  }

  if (input.length > 10) {
    return "Please send a ticker symbol (e.g. BTC, AAPL). Text HELP for more info.";
  }

  const tickers = input
    .split(/[\s,;]+/)
    .filter(Boolean)
    .slice(0, MAX_SYMBOLS_PER_REQUEST);

  addLog("parse", `Parsed tickers: ${tickers.join(", ")}`);

  const results = await Promise.all(
    tickers.map(async (ticker) => {
      const result = await fetchPrice(ticker);
      return { ticker, result };
    }),
  );

  addLog(
    "results",
    results.map((r) => `${r.ticker}: ${r.result ? "OK" : "FAIL"}`).join(", "),
  );

  const lines = [];
  const errors = [];

  for (const { ticker, result } of results) {
    if (result) {
      lines.push(formatResult(result, ticker));
    } else {
      errors.push(ticker);
    }
  }

  let message = lines.join("\n\n");

  if (errors.length > 0) {
    message += message ? "\n\n" : "";
    message += `Symbol not found: ${errors.join(", ")}`;
  }

  if (!message) {
    message =
      "No valid symbols found. Text HELP for a list of supported tickers.";
  }

  return message;
}

// ─── Gmail Pub/Sub Webhook ───────────────────────────────
// Google Pub/Sub sends notification when new email arrives

router.post("/gmail-webhook", async (req, res) => {
  try {
    // Acknowledge immediately (Google requires fast response)
    res.status(200).send("OK");

    // Decode Pub/Sub message
    const pubsubMessage = req.body?.message?.data;
    if (pubsubMessage) {
      const decoded = Buffer.from(pubsubMessage, "base64").toString("utf-8");
      addLog("pubsub", `Notification: ${decoded}`);
    }

    // Get latest unread email
    const email = await getLatestEmail();
    if (!email) {
      addLog("gmail", "No unread emails found");
      return;
    }

    addLog("gmail", `New email from: ${email.from}`);
    addLog("gmail", `Phone: ${email.phone}, Carrier: ${email.carrier}`);
    addLog("gmail", `Body: ${email.body.substring(0, 100)}`);

    // Save phone to database
    if (email.phone) {
      await postSms(email.phone, email.body);
      addLog("db", `Saved phone: ${email.phone}`);
    }

    // Process the message (get price, etc.)
    const reply = await processMessage(email.body || email.subject);

    // Send reply back via Gmail (goes to carrier as SMS)
    const replyTo = `${email.phone}@${email.carrier}`;
    await sendEmail(replyTo, reply);

    // Mark original email as read
    await markAsRead(email.id);

    addLog("complete", `Processed and replied to ${email.phone}`);
  } catch (err) {
    addLog("critical", `Gmail webhook error: ${err.message}`);
  }
});

// ─── Test Endpoint (Manual Trigger) ──────────────────────

router.post("/test-email", async (req, res) => {
  try {
    const email = await getLatestEmail();
    if (!email) {
      return res.json({ error: "No unread emails found" });
    }

    // Save phone
    if (email.phone) {
      await postSms(email.phone, email.body);
    }

    // Process
    const reply = await processMessage(email.body || email.subject);

    // Send reply
    const replyTo = `${email.phone}@${email.carrier}`;
    const sent = await sendEmail(replyTo, reply);

    // Mark as read
    await markAsRead(email.id);

    res.json({
      email,
      reply,
      sent,
      replyTo,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Original POST Endpoint ──────────────────────────────

router.post("/", async (req, res) => {
  try {
    const from =
      req.body?.number || req.body?.from || req.query?.number || "unknown";
    const body =
      req.body?.message || req.body?.body || req.query?.message || "";

    addLog("incoming-post", `SMS from ${from}: "${body}"`);

    const reply = await processMessage(body);

    addLog("reply", `Reply to ${from}: "${reply.substring(0, 100)}..."`);

    await postSms(req.query[" number"], body);
    res.type("text/plain").send(reply);
  } catch (err) {
    addLog("critical", `POST ERROR: ${err.message}`);
    res.type("text/plain").send("Error fetching price. Try again.");
  }
});

// ─── View Logs ───────────────────────────────────────────

router.get("/logs", (req, res) => {
  res.json(logs);
});

router.delete("/logs", (req, res) => {
  logs.length = 0;
  res.json({ message: "Logs cleared" });
});

// ─── View Cache ──────────────────────────────────────────

router.get("/cache", (req, res) => {
  const now = Date.now();
  const cacheInfo = Object.entries(priceCache).map(([ticker, entry]) => ({
    ticker,
    price: entry.result.price,
    cachedAt: new Date(entry.timestamp).toISOString(),
    ageSeconds: Math.round((now - entry.timestamp) / 1000),
    expiresIn:
      Math.max(0, Math.round((CACHE_TTL_MS - (now - entry.timestamp)) / 1000)) +
      "s",
  }));
  res.json(cacheInfo);
});

// ─── Health Check ────────────────────────────────────────

router.get("/health", (req, res) => {
  res.json({
    status: "running",
    apiKeyPresent: !!TWELVE_DATA_API_KEY,
    gmailConfigured: !!(
      GMAIL_CLIENT_ID &&
      GMAIL_CLIENT_SECRET &&
      GMAIL_REFRESH_TOKEN
    ),
    projectId: GOOGLE_PROJECT_ID,
    webhookUrl: WEBHOOK_URL,
    logsCount: logs.length,
  });
});

// ─── Setup Endpoints (run once) ──────────────────────────

// Step 1: Setup Pub/Sub topic and subscription
router.post("/setup-pubsub", async (req, res) => {
  const result = await setupPubSub();
  res.json({
    success: result,
    message: result ? "Pub/Sub configured" : "Setup failed, check logs",
  });
});

// Step 2: Setup Gmail watch
router.post("/setup-gmail-watch", async (req, res) => {
  const result = await setupGmailWatch();
  res.json({
    success: !!result,
    data: result,
    message: result ? "Gmail watch active" : "Setup failed, check logs",
  });
});

// Run both setup steps
router.post("/setup-all", async (req, res) => {
  const pubsubResult = await setupPubSub();
  const watchResult = await setupGmailWatch();
  res.json({
    pubsub: pubsubResult,
    gmailWatch: !!watchResult,
    watchExpiration: watchResult?.expiration,
    message:
      pubsubResult && watchResult ? "All setup complete" : "Some steps failed",
  });
});

export default router;
