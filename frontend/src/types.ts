// The shape of one token row returned from the backend
export interface TokenResult {
  symbol: string;
  price: number | null;
  market_cap: number | null;
  volume_24h: number | null;
  change_24h: number | null;
  change_7d: number | null;
  fdv: number | null;
  circulating_supply: number | null;
  total_supply: number | null;
  max_supply: number | null;
  contract_size: number | null;
  max_leverage: number | null;
  tick_size: number | null;
}

// A single filter rule — condition + optional threshold value
export interface FilterRule {
  condition: "gt" | "lt";
  value: string; // kept as string in the form, parsed before sending
}

// The full filter state — keyed by field name
export type FilterState = Record<string, { enabled: boolean; rule: FilterRule }>;

// What we POST to /api/filter
export interface FilterRequest {
  platform: string;
  filters: Record<string, { condition: string; value: number } | null>;
}

// What the backend returns
export interface FilterResponse {
  platform: string;
  total_instruments: number;
  matched: number;
  results: TokenResult[];
}

// Column definition for the results table
export interface Column {
  key: keyof TokenResult;
  label: string;
  format: (v: number | null) => string;
}
