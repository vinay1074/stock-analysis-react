import React, { useState, useEffect } from "react";
import {
  fetchBreakouts,
  fetchTrackedPortfolio,
  addStockToPortfolio,
  removeStockFromPortfolio,
} from "../services/breakoutApi";
import BreakoutTable from "./BreakoutTable";
import PortfolioTable from "./PortfolioTable";
import "./BreakoutDashboard.css";

export default function BreakoutDashboard() {
  const [activeTab, setActiveTab] = useState("screener");

  // Screener State
  const [tradeDate, setTradeDate] = useState("");
  const [minGain, setMinGain] = useState(1.5);
  const [volQuantile, setVolQuantile] = useState(0.5);
  const [stocks, setStocks] = useState([]);
  const [loadingScreener, setLoadingScreener] = useState(false);

  // Portfolio Tracker State
  const [portfolio, setPortfolio] = useState([]);
  const [loadingPortfolio, setLoadingPortfolio] = useState(false);
  const [manualSymbol, setManualSymbol] = useState("");
  const [manualPrice, setManualPrice] = useState("");
  const [manualQty, setManualQty] = useState(1);

  // Notification / Error Banner
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 4000);
  };

  const loadScreener = async (e) => {
    if (e) e.preventDefault();
    setLoadingScreener(true);
    setError(null);
    try {
      const data = await fetchBreakouts({ tradeDate, minGain, volQuantile });
      setStocks(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingScreener(false);
    }
  };

  const loadPortfolio = async () => {
    setLoadingPortfolio(true);
    setError(null);
    try {
      const data = await fetchTrackedPortfolio();
      setPortfolio(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingPortfolio(false);
    }
  };

  useEffect(() => {
    loadScreener();
  }, []);

  useEffect(() => {
    if (activeTab === "portfolio") {
      loadPortfolio();
    }
  }, [activeTab]);

  const handleAddToPortfolio = async (position) => {
    setError(null);
    try {
      await addStockToPortfolio(position);
      showToast(`Added ${position.symbol} (Buy @ ₹${position.buy_price}) to Portfolio Tracker.`);
      if (activeTab === "portfolio") {
        await loadPortfolio();
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const handleManualAdd = async (e) => {
    e.preventDefault();
    if (!manualSymbol.trim() || !manualPrice) return;
    await handleAddToPortfolio({
      symbol: manualSymbol.toUpperCase().trim(),
      buy_price: parseFloat(manualPrice),
      quantity: parseInt(manualQty, 10) || 1,
    });
    setManualSymbol("");
    setManualPrice("");
    setManualQty(1);
  };

  const handleRemoveFromPortfolio = async (symbol) => {
    setError(null);
    try {
      await removeStockFromPortfolio(symbol);
      setPortfolio((prev) => prev.filter((item) => item.symbol !== symbol));
      showToast(`Removed ${symbol} from active tracker.`);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div>
          <h1>AI Swing Screener & Exit Tracker</h1>
          <p>NSE Bhavcopy Breakout Discovery + Live 20-SMA & AI Profit/Stop-Loss Monitoring</p>
        </div>
        <div className="tab-navigation">
          <button
            className={`tab-btn ${activeTab === "screener" ? "active" : ""}`}
            onClick={() => setActiveTab("screener")}
          >
            1. Breakout Screener (Buy)
          </button>
          <button
            className={`tab-btn ${activeTab === "portfolio" ? "active" : ""}`}
            onClick={() => setActiveTab("portfolio")}
          >
            2. Active Portfolio (When to Sell)
          </button>
        </div>
      </header>

      {toast && <div className="toast-banner">{toast}</div>}
      {error && <div className="error-banner">{error}</div>}

      {activeTab === "screener" ? (
        <section className="dashboard-section">
          <form className="filter-bar" onSubmit={loadScreener}>
            <div className="filter-group">
              <label>Trade Date</label>
              <input
                type="date"
                value={tradeDate}
                onChange={(e) => setTradeDate(e.target.value)}
              />
            </div>
            <div className="filter-group">
              <label>Min Gain (%)</label>
              <input
                type="number"
                step="0.1"
                value={minGain}
                onChange={(e) => setMinGain(parseFloat(e.target.value) || 0)}
              />
            </div>
            <div className="filter-group">
              <label>Volume Quantile (0.1 - 0.95)</label>
              <input
                type="number"
                step="0.05"
                min="0.1"
                max="0.95"
                value={volQuantile}
                onChange={(e) => setVolQuantile(parseFloat(e.target.value) || 0.5)}
              />
            </div>
            <button type="submit" className="btn-primary" disabled={loadingScreener}>
              {loadingScreener ? "Scanning NSE..." : "Run AI Screener"}
            </button>
          </form>

          {loadingScreener ? (
            <div className="loading-state">Analyzing Bhavcopy, 20-SMA, RSI & News via Groq AI...</div>
          ) : (
            <BreakoutTable stocks={stocks} onAddToPortfolio={handleAddToPortfolio} />
          )}
        </section>
      ) : (
        <section className="dashboard-section">
          <div className="portfolio-controls">
            <form className="manual-add-form" onSubmit={handleManualAdd}>
              <input
                type="text"
                placeholder="NSE Symbol (e.g. SBIN)"
                value={manualSymbol}
                onChange={(e) => setManualSymbol(e.target.value)}
                required
              />
              <input
                type="number"
                step="0.05"
                placeholder="Buy Price (₹)"
                value={manualPrice}
                onChange={(e) => setManualPrice(e.target.value)}
                required
              />
              <input
                type="number"
                min="1"
                placeholder="Qty"
                className="qty-input"
                value={manualQty}
                onChange={(e) => setManualQty(e.target.value)}
              />
              <button type="submit" className="btn-primary">
                + Add Holding
              </button>
            </form>

            <button
              className="btn-refresh"
              onClick={loadPortfolio}
              disabled={loadingPortfolio}
            >
              {loadingPortfolio ? "Checking Live Signals..." : "↻ Refresh Exit Signals"}
            </button>
          </div>

          {loadingPortfolio ? (
            <div className="loading-state">
              Fetching live NSE prices, 20-SMA support, and evaluating AI Sell/Hold rules...
            </div>
          ) : (
            <PortfolioTable
              holdings={portfolio}
              onRemoveStock={handleRemoveFromPortfolio}
            />
          )}
        </section>
      )}
    </div>
  );
}