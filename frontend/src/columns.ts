import { Column } from "./types";

// Formatters — turn raw numbers into readable strings for display

const usd = (v: number | null) =>
  v == null ? "—" : "$" + Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 2 }).format(v);

const pct = (v: number | null) =>
  v == null ? "—" : v.toFixed(2) + "%";

const supply = (v: number | null) =>
  v == null ? "—" : Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 2 }).format(v);

const plain = (v: number | null) =>
  v == null ? "—" : v.toLocaleString();

// COLUMNS defines the display order and formatting for every field.
// This is the single source of truth — the table and CSV export both use this.
export const COLUMNS: Column[] = [
  { key: "symbol",             label: "Symbol",              format: (v) => v == null ? "—" : String(v) },
  { key: "price",              label: "Price (USD)",         format: usd },
  { key: "market_cap",         label: "Market Cap",          format: usd },
  { key: "volume_24h",         label: "24h Volume",          format: usd },
  { key: "change_24h",         label: "24h Change",          format: pct },
  { key: "change_7d",          label: "7d Change",           format: pct },
  { key: "fdv",                label: "FDV",                 format: usd },
  { key: "circulating_supply", label: "Circulating Supply",  format: supply },
  { key: "total_supply",       label: "Total Supply",        format: supply },
  { key: "max_supply",         label: "Max Supply",          format: supply },
  { key: "contract_size",      label: "Contract Size",       format: plain },
  { key: "max_leverage",       label: "Max Leverage",        format: (v) => v == null ? "—" : v + "x" },
  { key: "tick_size",          label: "Tick Size",           format: plain },
];

// All fields support gt/lt conditions
export const FILTERABLE_FIELDS: { key: string; label: string }[] = [
  { key: "market_cap",         label: "Market Cap (USD)"    },
  { key: "volume_24h",         label: "24h Volume (USD)"    },
  { key: "fdv",                label: "FDV (USD)"           },
  { key: "price",              label: "Price (USD)"         },
  { key: "change_24h",         label: "24h Change %"        },
  { key: "change_7d",          label: "7d Change %"         },
  { key: "circulating_supply", label: "Circulating Supply"  },
];