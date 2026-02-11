import express from "express";
const router = express.Router();

// ─── Config ──────────────────────────────────────────────
const TWELVE_DATA_API_KEY = process.env.TWELVE_DATA_API_KEY || "66686b5e7605411a8ad929f87700e200";
const TWELVE_DATA_BASE_URL = "https://api.twelvedata.com";
const MAX_SYMBOLS_PER_REQUEST = 5;

// ─── SMS Gateway Config ─────────────────────────────────
// Cloud mode: https://api.sms-gate.app
// Local mode: http://PHONE_IP:8080
const SMS_GATEWAY_URL = process.env.SMS_GATEWAY_URL || "https://api.sms-gate.app";
const SMS_GATEWAY_USERNAME = process.env.SMS_GATEWAY_USERNAME || "";
const SMS_GATEWAY_PASSWORD = process.env.SMS_GATEWAY_PASSWORD || "";

// ─── In-Memory Logs ─────────────────────────────────────
const logs = [];

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

    return { name, price, change, changePercent };
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

// ─── Send SMS via SMS Gateway for Android ────────────────
async function sendSms(to, message) {
  const url = `${SMS_GATEWAY_URL}/3rdparty/v1/messages`;
  const auth = Buffer.from(`${SMS_GATEWAY_USERNAME}:${SMS_GATEWAY_PASSWORD}`).toString("base64");

  addLog("send", `Sending SMS to ${to}: "${message.substring(0, 100)}..."`);

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Basic ${auth}`,
      },
      body: JSON.stringify({
        message: message,
        phoneNumbers: [to],
      }),
    });

    const data = await response.json();
    addLog("send-result", `SMS Gateway response: ${JSON.stringify(data).substring(0, 300)}`);
    return data;
  } catch (err) {
    addLog("send-error", `Failed to send SMS to ${to}: ${err.message}`);
    return null;
  }
}

// ─── Webhook: Receive SMS from phone (SMS Gateway) ──────

router.post("/", async (req, res) => {
  try {
    const { event, payload, deviceId } = req.body;

    addLog("webhook", `Event received: ${event} from device: ${deviceId}`);

    // Only process incoming SMS
    if (event !== "sms:received") {
      addLog("webhook", `Ignoring event: ${event}`);
      res.sendStatus(200);
      return;
    }

    const body = (payload?.message || "").trim();
    const from = payload?.phoneNumber || "unknown";

    addLog("incoming", `SMS from ${from}: "${body}"`);

    // Empty message
    if (!body) {
      addLog("info", "Empty body, sending help prompt");
      await sendSms(from, "Please send a ticker symbol (e.g. BTC, AAPL). Text HELP for more info.");
      res.sendStatus(200);
      return;
    }

    // Help command
    if (body.toUpperCase() === "HELP") {
      addLog("info", "HELP command received");
      await sendSms(from, getHelpMessage());
      res.sendStatus(200);
      return;
    }

    // Parse symbols from message
    const tickers = body
      .toUpperCase()
      .split(/[\s,;]+/)
      .filter(Boolean)
      .slice(0, MAX_SYMBOLS_PER_REQUEST);

    addLog("parse", `Parsed tickers: ${tickers.join(", ")}`);

    // Fetch all prices in parallel
    const results = await Promise.all(
      tickers.map(async (ticker) => {
        const result = await fetchPrice(ticker);
        return { ticker, result };
      })
    );

    addLog("results", results.map(r => `${r.ticker}: ${r.result ? "OK" : "FAIL"}`).join(", "));

    // Build response
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

    // Send reply via SMS Gateway (through the phone)
    await sendSms(from, message);

    addLog("done", `Reply sent to ${from}`);
    res.sendStatus(200);
  } catch (err) {
    addLog("critical", `ERROR: ${err.message} | ${err.stack?.substring(0, 300)}`);
    res.sendStatus(500);
  }
});

// ─── View Logs ───────────────────────────────────────────

router.get("/", (req, res) => {
  res.json(logs);
});

router.delete("/logs", (req, res) => {
  logs.length = 0;
  res.json({ message: "Logs cleared" });
});

// ─── Health Check ────────────────────────────────────────

router.get("/health", (req, res) => {
  res.json({
    status: "running",
    gateway: SMS_GATEWAY_URL,
    apiKeyPresent: !!TWELVE_DATA_API_KEY,
    gatewayCredentials: !!SMS_GATEWAY_USERNAME && !!SMS_GATEWAY_PASSWORD,
    logsCount: logs.length,
  });
});

export default router;
