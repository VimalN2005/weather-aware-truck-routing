import React, { useState } from "react";

export default function CheckpointTable({ route }) {
  const [filterLevel, setFilterLevel] = useState("all");

  if (!route || !route.checkpoints || route.checkpoints.length === 0) {
    return null;
  }

  const checkpoints = route.checkpoints;

  const filtered = checkpoints.filter((cp) => {
    if (filterLevel === "all") return true;
    if (filterLevel === "elevated") {
      return ["High", "Severe", "No Travel"].includes(cp.risk.overall_level);
    }
    return cp.risk.overall_level.toLowerCase() === filterLevel.toLowerCase();
  });

  return (
    <div className="card checkpoint-table-card">
      <div className="cp-table-header">
        <div>
          <h3 className="card-title">Detailed Checkpoint Weather & Risk Audit</h3>
          <span className="card-hint">
            Route: <strong>{route.name}</strong> • {checkpoints.length} Checkpoints Sampled by ETA
          </span>
        </div>

        {/* Filter Tabs */}
        <div className="cp-filter-tabs">
          <button
            type="button"
            className={`filter-tab ${filterLevel === "all" ? "active" : ""}`}
            onClick={() => setFilterLevel("all")}
          >
            All ({checkpoints.length})
          </button>
          <button
            type="button"
            className={`filter-tab filter-warning ${filterLevel === "elevated" ? "active" : ""}`}
            onClick={() => setFilterLevel("elevated")}
          >
            High / Severe Hazards Only
          </button>
        </div>
      </div>

      <div className="table-responsive">
        <table className="audit-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Mile Marker</th>
              <th>Estimated Arrival (ETA)</th>
              <th>Weather Condition</th>
              <th>Wind Speed</th>
              <th>Rainfall</th>
              <th>Snowfall</th>
              <th>Overall Risk</th>
              <th>Load Rule Notes</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((cp) => {
              const r = cp.risk;
              const w = cp.weather;

              return (
                <tr key={cp.index} className={`risk-row-${r.overall_level.toLowerCase().replace(" ", "-")}`}>
                  <td className="cp-idx">#{cp.index + 1}</td>
                  <td className="cp-mile">
                    <strong>{cp.mile} mi</strong>
                  </td>
                  <td className="cp-eta">
                    <span className="eta-badge">{cp.eta_formatted}</span>
                    <span className="elapsed-text">+{cp.elapsed_hours}h</span>
                  </td>
                  <td>
                    <div className="weather-desc">
                      <span>{w.condition}</span>
                      <span className="temp-badge">{w.temp_f}°F</span>
                    </div>
                  </td>
                  <td>
                    <span className={`val-chip risk-${r.wind_level.toLowerCase().replace(" ", "-")}`}>
                      {w.wind_mph} mph ({r.wind_level})
                    </span>
                  </td>
                  <td>
                    <span className={`val-chip risk-${r.rain_level.toLowerCase().replace(" ", "-")}`}>
                      {w.rain_in_hr} in/hr
                    </span>
                  </td>
                  <td>
                    <span className={`val-chip risk-${r.snow_level.toLowerCase().replace(" ", "-")}`}>
                      {w.snow_in_hr} in/hr
                    </span>
                  </td>
                  <td>
                    <span
                      className="risk-pill"
                      style={{ backgroundColor: `${r.color}22`, color: r.color, borderColor: r.color }}
                    >
                      ● {r.overall_level}
                    </span>
                  </td>
                  <td className="load-note-cell">
                    {r.load_rule_applied ? (
                      <span className="load-warning-tag" title={r.load_rule_applied}>
                        ⚠️ {r.load_rule_applied}
                      </span>
                    ) : (
                      <span className="text-muted">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
