import Papa from "papaparse";
import { TokenResult } from "../types";
import { COLUMNS } from "../columns";

/**
 * Export the results array to a CSV file and trigger a browser download.
 * Uses the same column definitions as the table so the export always
 * matches what the user sees on screen.
 */
export function exportToCSV(results: TokenResult[], platform: string) {
  // Build rows using raw values (not formatted) so the CSV is useful for
  // further analysis in Excel/Sheets without needing to strip "$" or "B" etc.
  const rows = results.map((token) => {
    const row: Record<string, string | number | null> = {};
    for (const col of COLUMNS) {
      row[col.label] = token[col.key] as number | null;
    }
    return row;
  });

  const csv = Papa.unparse(rows);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = `perp-screener-${platform}-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();

  URL.revokeObjectURL(url);
}
