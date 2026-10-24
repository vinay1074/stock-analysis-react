import React from "react";

export default function PortfolioTable({ holdings, onRemoveStock }) {
  if (!holdings || holdings.length === 0) {
    return (
      <div className="empty-state">
        No active holdings in your tracker yet. Click <strong>+ Track</strong> on any screener stock or add a position manually above.
      </div>
    );
  }

  const getExitBadgeClass = (signal = "") => {
    const s = signal.toLowerCase();
    if (s.includes("sell")) return "badge badge-sell";
    if (s.includes("trailing")) return "badge badge-buy";
    return "badge badge-hold";
  };

  return (
    <div className="table-responsive">
      <table className="stock-table">
        <thead>
          <tr>
            <th>Symbol</th>
            <th>Qty</th>
            <th>Buy Price</th>
            <th>Live Price</th>
            <th>P&L</th>
            <th>20-SMA / RSI</th>
            <th>AI Exit Signal</th>
            <th>Target / Trailing SL</th>
            <th>AI Exit Reasoning</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {holdings.map((item) => {
            const isProfit = item.pnl_pct >= 0;
            const belowSma20 = item.sma20 > 0 && item.live_price < item.sma20;

            return (
              <tr key={item.symbol} className={item.ai_signal.toLowerCase().includes("sell") ? "row-sell-alert" : ""}>
                <td className="symbol-cell">
                  <strong>{item.symbol}</strong>
                </td>
                <td>{item.quantity}</td>
                <td>₹{item.buy_price.toFixed(2)}</td>
                <td>
                  <div>₹{item.live_price.toFixed(2)}</div>
                  <small className={item.day_change_pct >= 0 ? "text-positive" : "text-negative"}>
                    ({item.day_change_pct >= 0 ? "+" : ""}{item.day_change_pct.toFixed(2)}% today)
                  </small>
                </td>
                <td className={isProfit ? "text-positive" : "text-negative"}>
                  <strong>{isProfit ? "+" : ""}{item.pnl_pct.toFixed(2)}%</strong>
                  <div>₹{item.pnl_amount.toFixed(2)}</div>
                </td>
                <td>
                  <div className={belowSma20 ? "text-negative" : ""}>
                    20-SMA: ₹{item.sma20.toFixed(2)}
                  </div>
                  <small>RSI(14): {item.rsi.toFixed(1)}</small>
                </td>
                <td>
                  <span className={getExitBadgeClass(item.ai_signal)}>
                    {item.ai_signal}
                  </span>
                </td>
                <td>
                  <div>T: ₹{item.ai_target.toFixed(2)}</div>
                  <small className="text-negative">SL: ₹{item.ai_stop_loss.toFixed(2)}</small>
                </td>
                <td className="summary-cell">{item.ai_summary}</td>
                <td>
                  <button
                    className="btn-remove"
                    onClick={() => onRemoveStock(item.symbol)}
                    title="Mark as Sold & Remove"
                  >
                    Mark Sold
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}