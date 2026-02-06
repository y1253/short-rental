import express from "express";
const router = express.Router();

// ─── Config ──────────────────────────────────────────────
const TWELVE_DATA_API_KEY = process.env.TWELVE_DATA_API_KEY || "";
const TWELVE_DATA_BASE_URL = "https://api.twelvedata.com";
const MAX_SYMBOLS_PER_REQUEST = 5;

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

function buildTwiml(message) {
  return `<?xml version="1.0" encoding="UTF-8"?><Response><Message>${message}</Message></Response>`;
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
    const res = await fetch(url);
    const data = await res.json();

    if (data.code || data.status === "error") {
      return null;
    }

    const price = parseFloat(data.close);
    const prevClose = parseFloat(data.previous_close);
    const change = price - prevClose;
    const changePercent = prevClose !== 0 ? (change / prevClose) * 100 : 0;

    if (isNaN(price)) return null;

    return { name, price, change, changePercent };
  } catch {
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

// ─── Route ───────────────────────────────────────────────

router.post("/sms", async (req, res) => {
  const body = (req.body.Body || "").trim();
  const from = req.body.From || "unknown";

  console.log(`SMS from ${from}: ${body}`);

  // Empty message
  if (!body) {
    res
      .type("text/xml")
      .send(
        buildTwiml(
          "Please send a ticker symbol (e.g. BTC, AAPL). Text HELP for more info.",
        ),
      );
    return;
  }

  // Help command
  if (body.toUpperCase() === "HELP") {
    res.type("text/xml").send(buildTwiml(getHelpMessage()));
    return;
  }

  // Parse symbols from message
  const tickers = body
    .toUpperCase()
    .split(/[\s,;]+/)
    .filter(Boolean)
    .slice(0, MAX_SYMBOLS_PER_REQUEST);

  // Fetch all prices in parallel
  const results = await Promise.all(
    tickers.map(async (ticker) => {
      const result = await fetchPrice(ticker);
      return { ticker, result };
    }),
  );

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
    message =
      "No valid symbols found. Text HELP for a list of supported tickers.";
  }

  res.type("text/xml").send(buildTwiml(message));
});

export default router;
