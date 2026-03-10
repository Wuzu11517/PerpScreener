import React, { useState } from "react";
import { TokenResult } from "../types";
import { COLUMNS } from "../columns";
import { ChevronUp, ChevronDown, ChevronsUpDown } from "lucide-react";
import { ChartModal } from "./ChartModal";

interface Props {
  results: TokenResult[];
}

type SortDir = "asc" | "desc" | null;

export function ResultsTable({ results }: Props) {
  const [sortKey, setSortKey] = useState<keyof TokenResult | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>(null);
  const [selectedSymbol, setSelectedSymbol] = useState<string | null>(null);

  // Cycle sort: none → desc → asc → none
  const handleSort = (key: keyof TokenResult) => {
    if (sortKey !== key) {
      setSortKey(key);
      setSortDir("desc");
    } else if (sortDir === "desc") {
      setSortDir("asc");
    } else {
      setSortKey(null);
      setSortDir(null);
    }
  };

  const sorted = [...results].sort((a, b) => {
    if (!sortKey || !sortDir) return 0;
    const av = a[sortKey] ?? -Infinity;
    const bv = b[sortKey] ?? -Infinity;
    if (av < bv) return sortDir === "asc" ? -1 : 1;
    if (av > bv) return sortDir === "asc" ? 1 : -1;
    return 0;
  });

  const SortIcon = ({ col }: { col: keyof TokenResult }) => {
    if (sortKey !== col) return <ChevronsUpDown size={13} className="sort-icon sort-icon--neutral" />;
    if (sortDir === "desc") return <ChevronDown size={13} className="sort-icon sort-icon--active" />;
    return <ChevronUp size={13} className="sort-icon sort-icon--active" />;
  };

  // Determine cell class for change % columns
  const changeClass = (key: keyof TokenResult, value: number | null) => {
    if (key !== "change_24h" && key !== "change_7d") return "";
    if (value == null) return "";
    return value >= 0 ? "cell--positive" : "cell--negative";
  };

  if (results.length === 0) {
    return (
      <div className="table-empty">
        No tokens matched your filters.
      </div>
    );
  }

  return (
    <>
      {selectedSymbol && (
        <ChartModal
          symbol={selectedSymbol}
          onClose={() => setSelectedSymbol(null)}
        />
      )}
      <div className="table-wrapper">
        <table className="results-table">
          <thead>
            <tr>
              {COLUMNS.map((col) => (
                <th
                  key={col.key}
                  className="table-th"
                  onClick={() => handleSort(col.key)}
                >
                  <span className="th-inner">
                    {col.label}
                    <SortIcon col={col.key} />
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((row, i) => (
              <tr
                key={row.symbol + i}
                className="table-row table-row--clickable"
                onClick={() => setSelectedSymbol(row.symbol)}
              >
                {COLUMNS.map((col) => {
                  const raw = row[col.key] as number | null;
                  return (
                    <td
                      key={col.key}
                      className={`table-td ${changeClass(col.key, raw)}`}
                    >
                      {col.key === "symbol" ? (
                        <span className="symbol-cell">{row.symbol}</span>
                      ) : (
                        col.format(raw)
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}