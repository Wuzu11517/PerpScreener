"""
CoinGecko service — fetches market data for a list of symbols directly
using the /coins/markets endpoint with the `symbols` query param.

No coin list prefetch needed — CoinGecko accepts symbols directly and
returns matched coins. We pass include_tokens=all so we get every coin
matching a given symbol back, then we check: if more than one coin came
back for the same symbol, we skip it entirely. We can't be confident
which one is correct, so it won't appear in results.
"""

import os
import httpx

COINGECKO_BASE = "https://api.coingecko.com/api/v3"


def _headers() -> dict:
    key = os.getenv("COINGECKO_API_KEY", "")
    return {"x-cg-demo-api-key": key} if key else {}


async def fetch_market_data(symbols: list[str]) -> dict[str, dict]:
    """
    Given a list of symbols (e.g. ["BTC", "ETH"]), fetch CoinGecko market
    data and return a dict keyed by uppercase symbol:
      {
        "BTC": {
          "price": 65000.0,
          "market_cap": 1_200_000_000_000,
          "volume_24h": 30_000_000_000,
          "change_24h": 1.5,
          "change_7d": -2.3,
          "fdv": 1_300_000_000_000,
          "circulating_supply": 19_700_000,
          "total_supply": 21_000_000,
          "max_supply": 21_000_000,
        }
      }

    Symbols that match more than one coin on CoinGecko are excluded —
    we can't be confident which coin is the right one.
    """
    all_market_data: dict[str, dict] = {}

    # CoinGecko limits symbols lookup with include_tokens=all to 50 per request
    for batch in _batch(symbols, 50):
        rows = await _fetch_markets_page(batch)

        # Count how many rows came back per symbol.
        # include_tokens=all means CoinGecko returns every coin that matches
        # the symbol, so more than one row for the same symbol = ambiguous.
        symbol_counts: dict[str, int] = {}
        for row in rows:
            sym = row["symbol"].upper()
            symbol_counts[sym] = symbol_counts.get(sym, 0) + 1

        for row in rows:
            sym = row["symbol"].upper()
            if symbol_counts[sym] == 1:
                # Exactly one coin matched this symbol — safe to use
                all_market_data[sym] = _extract(row)
            # More than one match → skip silently

    return all_market_data


async def _fetch_markets_page(symbols: list[str]) -> list[dict]:
    """Fetch one page of /coins/markets for the given symbols."""
    if not symbols:
        return []

    url = f"{COINGECKO_BASE}/coins/markets"
    params = {
        "vs_currency": "usd",
        "symbols": ",".join(s.lower() for s in symbols),
        "include_tokens": "all",   # return all matches so we can detect ambiguity
        "price_change_percentage": "24h,7d",
        "per_page": 50,
        "page": 1,
    }

    async with httpx.AsyncClient(timeout=30) as client:
        response = await client.get(url, headers=_headers(), params=params)
        response.raise_for_status()
        return response.json()


def _extract(row: dict) -> dict:
    """Pull only the fields we care about from a CoinGecko market row."""
    return {
        "price":               row.get("current_price"),
        "market_cap":          row.get("market_cap"),
        "volume_24h":          row.get("total_volume"),
        "change_24h":          row.get("price_change_percentage_24h"),
        "change_7d":           row.get("price_change_percentage_7d_in_currency"),
        "fdv":                 row.get("fully_diluted_valuation"),
        "circulating_supply":  row.get("circulating_supply"),
        "total_supply":        row.get("total_supply"),
        "max_supply":          row.get("max_supply"),
    }


def _batch(items: list, size: int):
    """Split a list into chunks of at most `size` items."""
    for i in range(0, len(items), size):
        yield items[i : i + size]