import React from "react";

export default function Header() {
  return (
    <header className="app-header">
      <div className="header-brand">
        <div className="brand-logo">
          <span className="logo-icon">🚛</span>
          <span className="pulse-indicator"></span>
        </div>
        <div>
          <div className="brand-title-wrap">
            <h1 className="brand-title">Weather-Aware Truck Router</h1>
            <span className="badge-tag">Spotter AI Assessment</span>
          </div>
          <p className="brand-subtitle">
            Dynamic 3-Route Optimization • ETA-Based Weather Sampling • Load Weight Risk Engine
          </p>
        </div>
      </div>

      <div className="header-meta">
        <div className="meta-pill">
          <span className="meta-dot online"></span>
          <span>Open-Meteo & OSRM Live</span>
        </div>
        <div className="meta-pill">
          <span>FMCSA & Load Rules Active</span>
        </div>
      </div>
    </header>
  );
}
