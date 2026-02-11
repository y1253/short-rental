import express from "express";
import postSms from "../db/smsPOSTnewSms.js";
const router = express.Router();


// ─── Config ──────────────────────────────────────────────
const TWELVE_DATA_API_KEY = process.env.TWELVE_DATA_API_KEY || "";
const TWELVE_DATA_BASE_URL = "https://api.twelvedata.com";
const MAX_SYMBOLS_PER_REQUEST = 5;

// ─── In-Memory Logs ─────────────────────────────────────
const logs = [];

// ─── Price Cache (3 min TTL) ─────────────────────────────
// Key: ticker (e.g. "BTC"), Value: { result, timestamp }
const priceCache = {};
const CACHE_TTL_MS = 5 * 60 * 1000; // 3 minutes

function getCached(ticker) {
  const cached = priceCache[ticker];
  if (!cached) return null;
  const age = Date.now() - cached.timestamp;
  if (age > CACHE_TTL_MS) {
    delete priceCache[ticker];
    addLog("cache", `${ticker} cache expired (${(age / 1000).toFixed(0)}s old)`);
    return null;
  }
  addLog("cache", `${ticker} served from cache (${(age / 1000).toFixed(0)}s old)`);
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

// ─── Symbol Map (friendly name + type) ──────────────────
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

// ─── Helpers ─────────────────────────────────────────────

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
  // Check cache first
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

    // Save to cache
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

// ─── Process SMS text and return reply ───────────────────

async function processMessage(body) {
  const input = (body || "").trim().toUpperCase();

  if (!input) {
    return "Please send a ticker symbol (e.g. BTC, AAPL). Text HELP for more info.";
  }

  if (input === "HELP") {
    return getHelpMessage();
  }

  if(input.length>10){
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
    })
  );

  addLog("results", results.map(r => `${r.ticker}: ${r.result ? "OK" : "FAIL"}`).join(", "));

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
    message = "No valid symbols found. Text HELP for a list of supported tickers.";
  }

  return message;
}

// ─── Macrodroid Webhook: Receive SMS ─────────────────────
// Macrodroid sends a GET or POST with sms_number and sms_message
// Your server processes it and returns the reply text
// Macrodroid then sends that reply as an SMS from your phone

// GET version: Macrodroid calls /sms?number={sms_number}&message={sms_message}
router.get("/sms", async (req, res) => {
  try {
    const from = req.query.number || req.query.from || "unknown";
    const body = req.query.message || req.query.body || "";

    addLog("incoming-get", `SMS from ${from}: "${body}"`);

    const reply = await processMessage(body);

    addLog("reply", `Reply to ${from}: "${reply.substring(0, 100)}..."`);

    // Return plain text -- Macrodroid reads this and sends it as SMS
    res.type("text/plain").send(reply);
  } catch (err) {
    addLog("critical", `GET ERROR: ${err.message}`);
    res.type("text/plain").send("Error fetching price. Try again.");
  }
});

// POST version: Macrodroid sends JSON body { number, message }
router.post("/", async (req, res) => {
  try {
    // Support both JSON body and URL query params
    const from = req.body?.number || req.body?.from || req.query?.number || "unknown";
    const body = req.body?.message || req.body?.body || req.query?.message || "";

    addLog("incoming-post", `SMS from ${from}: "${body}"`);

    const reply = await processMessage(body);

    addLog("reply", `Reply to ${from}: "${reply.substring(0, 100)}..."`);

    // Return plain text -- Macrodroid reads this and sends it as SMS
    res.type("text/plain").send(reply);
    await postSms(req.query[' number'],body);
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
    expiresIn: Math.max(0, Math.round((CACHE_TTL_MS - (now - entry.timestamp)) / 1000)) + "s",
  }));
  res.json(cacheInfo);
});

// ─── Health Check ────────────────────────────────────────

router.get("/health", (req, res) => {
  res.json({
    status: "running",
    apiKeyPresent: !!TWELVE_DATA_API_KEY,
    logsCount: logs.length,
  });
});

export default router;
