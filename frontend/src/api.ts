import { FilterRequest, FilterResponse } from "./types";

// Falls back to localhost in development — set REACT_APP_API_URL in .env for production
const BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

export async function fetchPlatforms(): Promise<string[]> {
  const res = await fetch(`${BASE}/api/platforms`);
  if (!res.ok) throw new Error("Failed to fetch platforms");
  const data = await res.json();
  return data.platforms as string[];
}

export async function fetchFilteredTokens(request: FilterRequest): Promise<FilterResponse> {
  const res = await fetch(`${BASE}/api/filter`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Request failed");
  }

  return res.json() as Promise<FilterResponse>;
}
