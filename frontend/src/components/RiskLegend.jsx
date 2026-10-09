import React, { useState } from "react";

export default function RiskLegend() {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="card legend-card">
      <div className="legend-header" onClick={() => setExpanded(!expanded)}>
        <div className="legend-title-row">
          <span className="legend-badge-icon">📋</span>
          <span className="legend-title">Assessment Risk Thresholds & Load Rules</span>
        </div>
        <button type="button" className="toggle-legend-btn">
          {expanded ? "Hide Matrix ▲" : "View Matrix ▼"}
        </button>
      </div>

      {expanded && (
        <div className="legend-body">
          <div className="matrix-table-wrap">
            <table className="matrix-table">
              <thead>
                <tr>
                  <th>Condition</th>
                  <th className="th-low">Low</th>
                  <th className="th-mod">Moderate</th>
                  <th className="th-high">High</th>
                  <th className="th-severe">Severe</th>
                  <th className="th-notravel">No Travel</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="condition-name">Wind</td>
                  <td>&lt; 25 mph</td>
                  <td>25 – 34 mph</td>
                  <td>35 – 44 mph</td>
                  <td>45 – 54 mph</td>
                  <td>≥ 55 mph</td>
                </tr>
                <tr>
                  <td className="condition-name">Rain</td>
                  <td>&lt; 0.10 in/hr</td>
                  <td>0.10 – 0.25</td>
                  <td>0.25 – 0.50</td>
                  <td>0.50 – 1.00</td>
                  <td>&gt; 1.00 in/hr</td>
                </tr>
                <tr>
                  <td className="condition-name">Snow</td>
                  <td>&lt; 0.5 in/hr</td>
                  <td>0.5 – 1.0</td>
                  <td>1.0 – 2.0</td>
                  <td>2.0 – 3.0</td>
                  <td>&gt; 3.0 in/hr</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="load-rules-box">
            <h4>⚖️ Specific Load Weight Rules Implemented:</h4>
            <ul>
              <li><strong>≥ 55 mph Wind:</strong> <code>No Travel</code> for any truck/load weight.</li>
              <li><strong>45 – 54 mph Wind + &gt; 30,000 lb Load:</strong> Elevates risk to <code>No Travel</code> (blowover prevention).</li>
              <li><strong>35 – 44 mph Wind + &gt; 40,000 lb Load:</strong> Elevates risk to <code>Severe</code> (heavy crosswind destabilization).</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
