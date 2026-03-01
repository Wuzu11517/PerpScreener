import React, { useEffect, useState } from "react";
import { FilterPanel } from "./components/FilterPanel";
import { ResultsTable } from "./components/ResultsTable";
import { fetchPlatforms, fetchFilteredTokens } from "./api";
import { exportToCSV } from "./utils/exportCSV";
import { FilterState, FilterResponse } from "./types";
import { Download, Search, ChevronDown } from "lucide-react";
import "./App.css";

export default function App() {
  const [platforms, setPlatforms] = useState<string[]>([]);
  const [platform, setPlatform] = useState<string>("");
  const [filters, setFilters] = useState<FilterState>({});
  const [response, setResponse] = useState<FilterResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPlatforms()
      .then((p) => {
        setPlatforms(p);
        setPlatform(p[0] ?? "");
      })
      .catch(() => setError("Could not connect to backend."));
  }, []);

  const handleRun = async () => {
    setLoading(true);
    setError(null);
    setResponse(null);

    // Build the filters payload — only include enabled filters with a value
    const activeFilters: Record<string, { condition: string; value: number }> = {};
    for (const [key, state] of Object.entries(filters)) {
      if (state.enabled && state.rule.value !== "") {
        activeFilters[key] = {
          condition: state.rule.condition,
          value: parseFloat(state.rule.value),
        };
      }
    }

    try {
      const result = await fetchFilteredTokens({ platform, filters: activeFilters });
      setResponse(result);
    } catch (e: any) {
      setError(e.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app">
      {/* Header */}
      <header className="header">
        <div className="header__inner">
          <div className="header__brand">
            <span className="header__logo">◈</span>
            <span className="header__title">Perp Screener</span>
          </div>
          {response && (
            <div className="header__meta">
              <span className="meta-tag">{response.total_instruments} instruments</span>
              <span className="meta-tag meta-tag--accent">{response.matched} matched</span>
            </div>
          )}
        </div>
      </header>

      <main className="main">
        {/* Sidebar */}
        <aside className="sidebar">
          {/* Platform selector */}
          <div className="sidebar__section">
            <label className="sidebar__label">Platform</label>
            <div className="select-wrapper">
              <select
                className="platform-select"
                value={platform}
                onChange={(e) => setPlatform(e.target.value)}
              >
                {platforms.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
              <ChevronDown size={14} className="select-icon" />
            </div>
          </div>

          {/* Filters */}
          <div className="sidebar__section">
            <FilterPanel filters={filters} onChange={setFilters} />
          </div>

          {/* Run button */}
          <button
            className="run-btn"
            onClick={handleRun}
            disabled={loading || !platform}
          >
            <Search size={15} />
            {loading ? "Scanning..." : "Run Screener"}
          </button>

          {error && <p className="error-msg">{error}</p>}
        </aside>

        {/* Results area */}
        <section className="results">
          {!response && !loading && (
            <div className="results__empty">
              <span className="results__empty-icon">◈</span>
              <p>Select a platform, set your filters, and run the screener.</p>
            </div>
          )}

          {loading && (
            <div className="results__loading">
              <div className="spinner" />
              <p>Fetching instruments and market data…</p>
            </div>
          )}

          {response && (
            <>
              <div className="results__toolbar">
                <p className="results__count">
                  Showing <strong>{response.matched}</strong> of{" "}
                  <strong>{response.total_instruments}</strong> perp instruments on{" "}
                  <strong>{response.platform}</strong>
                </p>
                <button
                  className="export-btn"
                  onClick={() => exportToCSV(response.results, response.platform)}
                  disabled={response.results.length === 0}
                >
                  <Download size={14} />
                  Export CSV
                </button>
              </div>

              <ResultsTable results={response.results} />
            </>
          )}
        </section>
      </main>
    </div>
  );
}
