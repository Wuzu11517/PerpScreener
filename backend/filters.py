"""
Filter engine — applies the active filters sent from the frontend to the
merged dataset (exchange data + CoinGecko market data).

Each filter is optional. If a filter is not present in the request, or has
no value, it is completely ignored — the field is still returned in the
results, it just isn't used to exclude any rows.

Filter conditions:
  - "gt" = greater than (used for market cap, volume, price, FDV, supply)
  - "lt" = less than
  - "gt" and "lt" are both available for percentage fields like change_24h
    so you can screen for "up more than 5%" or "down more than 10%"
"""


def apply_filters(rows: list[dict], filters: dict) -> list[dict]:
    """
    rows    — list of merged token dicts (exchange fields + CoinGecko fields)
    filters — dict from the request body, e.g.:
              {
                "market_cap":  {"condition": "gt", "value": 500_000_000},
                "change_24h":  {"condition": "lt", "value": -5},
              }

    Returns only the rows that pass all active filters.
    """
    result = []

    for row in rows:
        if _passes_all(row, filters):
            result.append(row)

    return result


def _passes_all(row: dict, filters: dict) -> bool:
    """Return True if a row satisfies every active filter."""
    for field, rule in filters.items():
        # A filter with no value set is treated as inactive
        if rule is None or rule.get("value") is None:
            continue

        row_value = row.get(field)

        # If the token is missing this data point, exclude it when a filter
        # is active — we can't confirm it passes
        if row_value is None:
            return False

        condition = rule.get("condition", "gt")
        threshold = rule["value"]

        if condition == "gt" and not (row_value > threshold):
            return False
        if condition == "lt" and not (row_value < threshold):
            return False

    return True
