import React, { useState } from "react";

export default function BreakoutTable({ stocks, onAddToPortfolio }) {
  const [quantities, setQuantities] = useState({});
  const [addingSymbol, setAddingSymbol] = useState(null);

  if (!stocks || stocks.length === 0) {
    return <div className="empty-state">No breakout stocks matched the criteria for this date.</div>;
  }

  const handleQtyChange = (symbol, value) => {
    setQuantities((prev) => ({
      ...prev,
      [symbol]: Math.max(1, parseInt(value, 10) || 1),
    }));
  };

  const handleBuyClick = async (stock) => {
    setAddingSymbol(stock.symbol);
    try {
      await onAddToPortfolio({
        symbol: stock.symbol,
        buy_price: stock.close_price,
        quantity: quantities[stock.symbol] || 1,
        target_price: stock.ai_target > 0 ? stock.ai_target : null,
        stop_loss: stock.ai_stop_loss > 0 ? stock.ai_stop_loss : null,
      });
    } finally {
      setAddingSymbol(null);
    }
  };

  const getSignalBadgeClass = (signal = "") => {
    const normalized = signal.toLowerCase();
    if (normalized.includes("buy")) return "badge badge-buy";
    if (normalized.includes("sell")) return "badge badge-sell";
    return "badge badge-hold";
  };

  return (
    <div className="table-responsive">
      <table className="stock-table">
        <thead>
          <tr>
            <th>Symbol</th>
            <th>Close (₹)</th>
            <th>% Gain</th>
            <th>Volume</th>
            <th>AI Signal</th>
            <th>Target (₹)</th>
            <th>Stop-Loss (₹)</th>
            <th>AI Catalyst & Technical Summary</th>
            <th>Track Position</th>
          </tr>
        </thead>
        <tbody>
          {stocks.map((stock) => (
            <tr key={stock.symbol}>
              <td className="symbol-cell">
                <strong>{stock.symbol}</strong>
                <span className="series-tag">{stock.series}</span>
              </td>
              <td>₹{stock.close_price.toFixed(2)}</td>
              <td className="text-positive">+{stock.percentage_change.toFixed(2)}%</td>
              <td>{stock.volume.toLocaleString("en-IN")}</td>
              <td>
                <span className={getSignalBadgeClass(stock.ai_signal)}>
                  {stock.ai_signal}
                </span>
              </td>
              <td>{stock.ai_target ? `₹${stock.ai_target.toFixed(2)}` : "—"}</td>
              <td>{stock.ai_stop_loss ? `₹${stock.ai_stop_loss.toFixed(2)}` : "—"}</td>
              <td className="summary-cell">{stock.ai_summary}</td>
              <td className="action-cell">
                <div className="buy-action-group">
                  <input
                    type="number"
                    min="1"
                    className="qty-input"
                    value={quantities[stock.symbol] || 1}
                    onChange={(e) => handleQtyChange(stock.symbol, e.target.value)}
                    title="Quantity"
                  />
                  <button
                    className="btn-track"
                    disabled={addingSymbol === stock.symbol}
                    onClick={() => handleBuyClick(stock)}
                  >
                    {addingSymbol === stock.symbol ? "Adding..." : "+ Track"}
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}