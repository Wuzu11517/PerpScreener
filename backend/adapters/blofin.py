"""
BloFin adapter — fetches all perpetual swap instruments from BloFin's
public API and normalizes them into a common format that the rest of
the app can work with, regardless of which exchange was selected.

Adding a new exchange in the future means creating a new file like this
one and registering it in adapters/__init__.py. Nothing else changes.
"""

import httpx

# BloFin's public REST base URL — no API key needed for market data
BLOFIN_BASE = "https://openapi.blofin.com"


async def fetch_instruments() -> list[dict]:
    """
    Fetch all instruments from BloFin and return only perpetual swaps,
    normalized to:
      {
        "symbol":        str   — base currency, e.g. "BTC"
        "contract_size": float — size of one contract
        "max_leverage":  float — maximum allowed leverage
        "tick_size":     float — minimum price movement
      }
    """
    url = f"{BLOFIN_BASE}/api/v1/market/instruments"

    async with httpx.AsyncClient(timeout=15) as client:
        response = await client.get(url, params={"instType": "swap"})
        response.raise_for_status()
        data = response.json()

    instruments = data.get("data", [])
    normalized = []

    for inst in instruments:
        # instId format is "BTC-USDT" — we only want the base (BTC)
        inst_id: str = inst.get("instId", "")
        parts = inst_id.split("-")
        if len(parts) < 2:
            continue

        base_currency = parts[0].upper()

        normalized.append({
            "symbol":        base_currency,
            "contract_size": _to_float(inst.get("contractSize")),
            "max_leverage":  _to_float(inst.get("maxLeverage")),
            "tick_size":     _to_float(inst.get("tickSize")),
        })

    return normalized


def _to_float(value) -> float | None:
    try:
        return float(value)
    except (TypeError, ValueError):
        return None
