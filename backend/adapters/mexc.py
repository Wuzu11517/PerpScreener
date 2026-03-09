"""
MEXC adapter — fetches all perpetual contract instruments from MEXC's
public futures API and normalizes them into the common format.

MEXC's contract detail list endpoint returns all contracts in one call.
Symbol format is "BTC_USDT" so we split on underscore to get the base.
"""

import httpx

MEXC_BASE = "https://contract.mexc.com"


async def fetch_instruments() -> list[dict]:
    """
    Fetch all perpetual instruments from MEXC and normalize to:
      {
        "symbol":        str
        "contract_size": float
        "max_leverage":  float
        "tick_size":     float
      }
    """
    url = f"{MEXC_BASE}/api/v1/contract/detail"
    normalized = []

    async with httpx.AsyncClient(timeout=15) as client:
        response = await client.get(url)
        response.raise_for_status()
        data = response.json()

    instruments = data.get("data", [])

    for inst in instruments:
        # state 0 = online/active
        if inst.get("state") != 0:
            continue

        # symbol format: "BTC_USDT" — base is everything before the underscore
        symbol: str = inst.get("symbol", "")
        parts = symbol.split("_")
        if len(parts) < 2:
            continue

        base = parts[0].upper()

        normalized.append({
            "symbol":        base,
            "contract_size": _to_float(inst.get("contractSize")),
            "max_leverage":  _to_float(inst.get("maxLeverage")),
            "tick_size":     _to_float(inst.get("priceUnit")),
        })

    return normalized


def _to_float(value) -> float | None:
    try:
        return float(value)
    except (TypeError, ValueError):
        return None
