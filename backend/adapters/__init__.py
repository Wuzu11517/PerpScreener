"""
Adapter registry — maps platform display names to their fetch functions.

To add a new exchange:
  1. Create a new file in this folder (e.g. bybit.py) with a fetch_instruments()
     function that returns the same normalized format as blofin.py
  2. Import it here and add it to ADAPTERS

That's it. The API and frontend pick it up automatically.
"""

from adapters.blofin import fetch_instruments as blofin_fetch
from adapters.bybit import fetch_instruments as bybit_fetch
from adapters.okx import fetch_instruments as okx_fetch
from adapters.mexc import fetch_instruments as mexc_fetch

# Keys here become the options in the frontend platform dropdown
ADAPTERS: dict[str, callable] = {
    "BloFin": blofin_fetch,
    "Bybit":  bybit_fetch,
    "OKX":    okx_fetch,
    "MEXC":   mexc_fetch,
}