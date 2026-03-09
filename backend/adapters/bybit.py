"""
Bybit adapter — fetches all linear perpetual instruments from Bybit's
public API (v5) and normalizes them into the common format.

Bybit's instruments-info endpoint returns 500 entries per page and requires
cursor-based pagination to retrieve all symbols.
"""

import httpx

BYBIT_BASE = "https://api.bybit.com"


async def fetch_instruments() -> list[dict]:
    """
    Fetch all LinearPerpetual instruments from Bybit and normalize to:
      {
        "symbol":        str
        "contract_size": float
        "max_leverage":  float
        "tick_size":     float
      }
    """
    url = f"{BYBIT_BASE}/v5/market/instruments-info"
    normalized = []
    cursor = ""

    headers = {"User-Agent": "Mozilla/5.0"}

    async with httpx.AsyncClient(timeout=15, headers=headers) as client:
        while True:
            params = {"category": "linear", "limit": 500}
            if cursor:
                params["cursor"] = cursor

            response = await client.get(url, params=params)
            response.raise_for_status()
            data = response.json()

            result = data.get("result", {})
            instruments = result.get("list", [])

            for inst in instruments:
                # Only want perpetuals, not quarterly futures
                if inst.get("contractType") != "LinearPerpetual":
                    continue
                if inst.get("status") != "Trading":
                    continue

                # symbol is e.g. "BTCUSDT" — base is everything before "USDT"
                symbol: str = inst.get("symbol", "")
                if symbol.endswith("USDT"):
                    base = symbol[:-4]
                elif symbol.endswith("USDC"):
                    base = symbol[:-4]
                else:
                    continue

                leverage_filter = inst.get("leverageFilter", {})
                price_filter = inst.get("priceFilter", {})
                lot_size_filter = inst.get("lotSizeFilter", {})

                normalized.append({
                    "symbol":        base.upper(),
                    "contract_size": _to_float(lot_size_filter.get("minOrderQty")),
                    "max_leverage":  _to_float(leverage_filter.get("maxLeverage")),
                    "tick_size":     _to_float(price_filter.get("tickSize")),
                })

            cursor = result.get("nextPageCursor", "")
            if not cursor:
                break

    return normalized


def _to_float(value) -> float | None:
    try:
        return float(value)
    except (TypeError, ValueError):
        return None