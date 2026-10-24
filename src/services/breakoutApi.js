const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

export async function fetchBreakouts({ tradeDate, minGain = 1.5, volQuantile = 0.5 } = {}) {
  const params = new URLSearchParams();
  if (tradeDate) params.append("trade_date", tradeDate);
  params.append("min_gain", minGain);
  params.append("vol_quantile", volQuantile);

  const response = await fetch(`${API_BASE_URL}/api/screener/breakouts?${params.toString()}`);
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to fetch breakout stocks");
  }
  return response.json();
}

export async function fetchTrackedPortfolio() {
  const response = await fetch(`${API_BASE_URL}/api/portfolio/track`);
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to evaluate portfolio holdings");
  }
  return response.json();
}

export async function addStockToPortfolio(position) {
  const response = await fetch(`${API_BASE_URL}/api/portfolio/add`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(position),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to add stock to portfolio");
  }
  return response.json();
}

export async function removeStockFromPortfolio(symbol) {
  const response = await fetch(`${API_BASE_URL}/api/portfolio/${encodeURIComponent(symbol)}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to remove stock from portfolio");
  }
  return response.json();
}