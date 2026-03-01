import React from "react";
import { FilterState } from "../types";
import { FILTERABLE_FIELDS } from "../columns";

interface Props {
  filters: FilterState;
  onChange: (filters: FilterState) => void;
}

export function FilterPanel({ filters, onChange }: Props) {
  const toggle = (key: string) => {
    const current = filters[key];
    onChange({
      ...filters,
      [key]: {
        ...current,
        enabled: !current?.enabled,
        rule: current?.rule ?? { condition: "gt", value: "" },
      },
    });
  };

  // Update condition (gt/lt) for a filter
  const setCondition = (key: string, condition: "gt" | "lt") => {
    onChange({
      ...filters,
      [key]: { ...filters[key], rule: { ...filters[key].rule, condition } },
    });
  };

  // Update threshold value for a filter
  const setValue = (key: string, value: string) => {
    onChange({
      ...filters,
      [key]: { ...filters[key], rule: { ...filters[key].rule, value } },
    });
  };

  return (
    <div className="filter-panel">
      <h3 className="filter-panel__title">Filters</h3>
      <p className="filter-panel__hint">
        Toggle a filter on to apply it. Leave the value empty to show the column without filtering.
      </p>

      <div className="filter-list">
        {FILTERABLE_FIELDS.map(({ key, label }) => {
          const state = filters[key];
          const enabled = state?.enabled ?? false;

          return (
            <div key={key} className={`filter-row ${enabled ? "filter-row--active" : ""}`}>
              {/* Toggle button */}
              <button
                className={`filter-toggle ${enabled ? "filter-toggle--on" : ""}`}
                onClick={() => toggle(key)}
                aria-pressed={enabled}
              >
                <span className="filter-toggle__track">
                  <span className="filter-toggle__thumb" />
                </span>
                <span className="filter-toggle__label">{label}</span>
              </button>

              {/* Condition + value inputs — only shown when enabled */}
              {enabled && (
                <div className="filter-inputs">
                  <select
                      className="filter-select"
                      value={state.rule.condition}
                      onChange={(e) => setCondition(key, e.target.value as "gt" | "lt")}
                    >
                      <option value="gt">&gt; greater than</option>
                      <option value="lt">&lt; less than</option>
                    </select>
                  <input
                    className="filter-input"
                    type="number"
                    placeholder="Enter value"
                    value={state.rule.value}
                    onChange={(e) => setValue(key, e.target.value)}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}