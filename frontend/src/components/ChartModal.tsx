import React, { useEffect, useRef, useState } from "react";
import { createChart, IChartApi, CandlestickSeries } from "lightweight-charts";
import { X } from "lucide-react";
import { API_URL } from "../api";

interface Props {
  symbol: string;
  onClose: () => void;
}

const TIMEFRAMES = [
  { label: "1D", days: 1 },
  { label: "1W", days: 7 },
  { label: "1M", days: 30 },
  { label: "3M", days: 90 },
];

export function ChartModal({ symbol, onClose }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const [days, setDays] = useState(7);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Close on Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  useEffect(() => {
    if (!containerRef.current) return;

    // Create chart
    const chart = createChart(containerRef.current, {
      layout: {
        background: { color: "#0f1117" },
        textColor: "#8b8fa8",
      },
      grid: {
        vertLines: { color: "#1e2130" },
        horzLines: { color: "#1e2130" },
      },
      crosshair: { mode: 1 },
      rightPriceScale: { borderColor: "#1e2130" },
      timeScale: { borderColor: "#1e2130", timeVisible: true },
      width: containerRef.current.clientWidth,
      height: 340,
    });

    chartRef.current = chart;

    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: "#00e5a0",
      downColor: "#ff4d6d",
      borderUpColor: "#00e5a0",
      borderDownColor: "#ff4d6d",
      wickUpColor: "#00e5a0",
      wickDownColor: "#ff4d6d",
    });

    // Fetch and render data
    setLoading(true);
    setError(null);

    fetch(`${API_URL}/api/chart/${symbol}?days=${days}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.detail) throw new Error(data.detail);
        candleSeries.setData(data.ohlc);
        chart.timeScale().fitContent();
        setLoading(false);
      })
      .catch((e) => {
        setError(e.message || "Failed to load chart data.");
        setLoading(false);
      });

    // Resize observer
    const observer = new ResizeObserver(() => {
      if (containerRef.current) {
        chart.applyOptions({ width: containerRef.current.clientWidth });
      }
    });
    observer.observe(containerRef.current);

    return () => {
      chart.remove();
      observer.disconnect();
    };
  }, [symbol, days]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal__header">
          <div className="modal__title">
            <span className="symbol-cell">{symbol}</span>
            <span className="modal__subtitle">Price Chart (USD)</span>
          </div>
          <div className="modal__controls">
            {TIMEFRAMES.map((tf) => (
              <button
                key={tf.days}
                className={`tf-btn ${days === tf.days ? "tf-btn--active" : ""}`}
                onClick={() => setDays(tf.days)}
              >
                {tf.label}
              </button>
            ))}
            <button className="modal__close" onClick={onClose}>
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Chart area */}
        <div className="modal__body">
          {loading && (
            <div className="chart-loading">
              <div className="spinner" />
              <p>Loading chart…</p>
            </div>
          )}
          {error && (
            <div className="chart-error">{error}</div>
          )}
          <div
            ref={containerRef}
            className="chart-container"
            style={{ opacity: loading || error ? 0 : 1 }}
          />
        </div>
      </div>
    </div>
  );
}