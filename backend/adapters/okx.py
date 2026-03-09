"""
OKX adapter — fetches all perpetual swap instruments from OKX's
public API (v5) and normalizes them into the common format.

OKX instType=SWAP covers all perpetual contracts. instId format is
"BTC-USDT-SWAP" so we strip the base currency from that.
"""

import httpx

OKX_BASE = "https://www.okx.com"


async def fetch_instruments() -> list[dict]:
    """
    Fetch all SWAP instruments from OKX and normalize to:
      {
        "symbol":        str
        "contract_size": float
        "max_leverage":  float
        "tick_size":     float
      }
    """
    url = f"{OKX_BASE}/api/v5/public/instruments"
    normalized = []

    async with httpx.AsyncClient(timeout=15) as client:
        response = await client.get(url, params={"instType": "SWAP"})
        response.raise_for_status()
        data = response.json()

    instruments = data.get("data", [])

    for inst in instruments:
        if inst.get("state") != "live":
            continue

        # instId format: "BTC-USDT-SWAP" — base is first segment
        inst_id: str = inst.get("instId", "")
        parts = inst_id.split("-")
        if len(parts) < 3:
            continue

        base = parts[0].upper()

        normalized.append({
            "symbol":        base,
            "contract_size": _to_float(inst.get("ctVal")),
            "max_leverage":  _to_float(inst.get("lever")),
            "tick_size":     _to_float(inst.get("tickSz")),
        })

    return normalized


def _to_float(value) -> float | None:
    try:
        return float(value)
    except (TypeError, ValueError):
        return None
