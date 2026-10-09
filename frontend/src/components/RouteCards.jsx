import React from "react";

export default function RouteCards({ routes, selectedRouteId, onSelectRoute }) {
  if (!routes || routes.length === 0) return null;

  return (
    <div className="routes-comparison-section">
      <div className="section-header">
        <div>
          <h3 className="section-title">3 Alternative Route Options Evaluated</h3>
          <p className="section-subtitle">
            Ranked by: 1. Fewest Severe miles → 2. Fewest High miles → 3. Lowest average risk → 4. Shortest travel time
          </p>
        </div>
      </div>

      <div className="route-cards-grid">
        {routes.map((route) => {
          const isSelected = route.id === selectedRouteId;
          const isRec = route.is_recommended;
          const summary = route.summary;

          return (
            <div
              key={route.id}
              className={`route-card ${isSelected ? "selected" : ""} ${isRec ? "recommended" : ""}`}
              onClick={() => onSelectRoute(route.id)}
            >
              <div className="card-top-badge">
                <span className={`rank-badge rank-${route.recommendation_rank}`}>
                  {route.recommendation_badge}
                </span>
                <span
                  className="status-pill"
                  style={{ backgroundColor: `${summary.route_status_color}22`, color: summary.route_status_color, borderColor: summary.route_status_color }}
                >
                  {summary.route_status}
                </span>
              </div>

              <div className="card-main-title">
                <h4>{route.name}</h4>
              </div>

              <div className="route-metrics-row">
                <div className="metric-item">
                  <span className="metric-label">Total Distance</span>
                  <span className="metric-val">{route.distance_miles.toLocaleString()} mi</span>
                </div>
                <div className="metric-item">
                  <span className="metric-label">Travel Time</span>
                  <span className="metric-val">{route.duration_hours} hrs</span>
                </div>
                <div className="metric-item">
                  <span className="metric-label">Avg Risk Score</span>
                  <span className="metric-val highlight">
                    {summary.average_risk_score} <span className="score-sub">/ 5.0</span>
                  </span>
                </div>
              </div>

              {/* Risk Mileage Progress Bar */}
              <div className="mileage-distribution-wrap">
                <div className="dist-header">
                  <span>Risk Mileage Breakdown</span>
                  <span className="cp-count">{summary.total_checkpoints} checkpoints</span>
                </div>

                <div className="dist-bar">
                  {summary.low_miles > 0 && (
                    <div
                      className="dist-segment seg-low"
                      style={{ width: `${(summary.low_miles / route.distance_miles) * 100}%` }}
                      title={`Low Risk: ${summary.low_miles} mi`}
                    ></div>
                  )}
                  {summary.moderate_miles > 0 && (
                    <div
                      className="dist-segment seg-mod"
                      style={{ width: `${(summary.moderate_miles / route.distance_miles) * 100}%` }}
                      title={`Moderate Risk: ${summary.moderate_miles} mi`}
                    ></div>
                  )}
                  {summary.high_miles > 0 && (
                    <div
                      className="dist-segment seg-high"
                      style={{ width: `${(summary.high_miles / route.distance_miles) * 100}%` }}
                      title={`High Risk: ${summary.high_miles} mi`}
                    ></div>
                  )}
                  {summary.severe_miles > 0 && (
                    <div
                      className="dist-segment seg-severe"
                      style={{ width: `${(summary.severe_miles / route.distance_miles) * 100}%` }}
                      title={`Severe / No Travel: ${summary.severe_miles} mi`}
                    ></div>
                  )}
                </div>

                <div className="dist-legend-row">
                  <span className="dot-label dot-low">Low: {summary.low_miles} mi</span>
                  <span className="dot-label dot-mod">Mod: {summary.moderate_miles} mi</span>
                  <span className="dot-label dot-high">High: {summary.high_miles} mi</span>
                  <span className="dot-label dot-severe">Severe: {summary.severe_miles} mi</span>
                </div>
              </div>

              <div className="card-action">
                <button
                  type="button"
                  className={`select-route-btn ${isSelected ? "active" : ""}`}
                >
                  {isSelected ? "Active on Map ✓" : "View Route on Map"}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
