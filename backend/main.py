"""
Main FastAPI application — single endpoint that orchestrates the full pipeline:
  1. Validate the requested platform exists
  2. Fetch perp instruments from the exchange adapter
  3. Fetch market data from CoinGecko directly by symbol
  4. Merge exchange data + market data per symbol
  5. Apply active filters
  6. Return the filtered results

Running locally:
  uvicorn main:app --reload --port 8000

Environment variables (see .env.example):
  COINGECKO_API_KEY — your CoinGecko demo API key
"""

import os
from contextlib import asynccontextmanager

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from adapters import ADAPTERS
from coingecko import fetch_market_data
from filters import apply_filters

load_dotenv()

@asynccontextmanager
async def lifespan(app: FastAPI):
    yield

app = FastAPI(title="Perp Screener API", lifespan=lifespan)

# Allow the React frontend to call this API.
# In production, replace "*" with your Vercel domain.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

class FilterRule(BaseModel):
    condition: str = "gt"   # "gt" or "lt"
    value: float | None = None


class FilterRequest(BaseModel):
    platform: str
    filters: dict[str, FilterRule] = {}

@app.get("/api/platforms")
async def get_platforms():
    """Return the list of supported platforms for the frontend dropdown."""
    return {"platforms": list(ADAPTERS.keys())}


@app.post("/api/filter")
async def filter_tokens(request: FilterRequest):
    """
    Main pipeline endpoint. Accepts a platform name and a set of active
    filters, returns the filtered token list with all market data columns.
    """
    adapter = ADAPTERS.get(request.platform)
    if adapter is None:
        raise HTTPException(
            status_code=400,
            detail=f"Unknown platform '{request.platform}'. "
                   f"Available: {list(ADAPTERS.keys())}"
        )

    instruments = await adapter()

    if not instruments:
        raise HTTPException(status_code=502, detail="No instruments returned from exchange.")

    # Deduplicate — BloFin can have multiple contracts per token (e.g. BTC-USDT, BTC-USDC)
    symbols = list(dict.fromkeys(inst["symbol"] for inst in instruments))
    market_data = await fetch_market_data(symbols)

    merged = []
    for inst in instruments:
        symbol = inst["symbol"]
        cg = market_data.get(symbol)
        if cg is None:
            # Token not found on CoinGecko, or ambiguous symbol — skip it
            continue

        merged.append({
            # Exchange fields
            "symbol":        symbol,
            "contract_size": inst.get("contract_size"),
            "max_leverage":  inst.get("max_leverage"),
            "tick_size":     inst.get("tick_size"),
            **cg,
        })

    filters_dict = {k: v.model_dump() for k, v in request.filters.items()}
    filtered = apply_filters(merged, filters_dict)

    return {
        "platform": request.platform,
        "total_instruments": len(instruments),
        "matched": len(filtered),
        "results": filtered,
    }