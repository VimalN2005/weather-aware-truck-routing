import React, { useState } from "react";

export default function RouteForm({ onCalculate, loading }) {
  // Default departure time to next top of the hour
  const getInitialDateTime = () => {
    const now = new Date();
    now.setMinutes(0, 0, 0);
    now.setHours(now.getHours() + 1);
    const pad = (n) => String(n).padStart(2, "0");
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
  };

  const [form, setForm] = useState({
    origin: "Dallas, TX",
    destination: "Chicago, IL",
    departure_time: getInitialDateTime(),
    load_weight: 42000,
    sample_interval_miles: 25,
  });

  const presets = [
    {
      name: "Dallas → Chicago",
      origin: "Dallas, TX",
      dest: "Chicago, IL",
      weight: 42000,
      note: "Tests High Wind vs >40k lb Load Rule",
    },
    {
      name: "Denver → Salt Lake",
      origin: "Denver, CO",
      dest: "Salt Lake City, UT",
      weight: 35000,
      note: "Mountain Snow & Severe Wind Corridor",
    },
    {
      name: "Atlanta → Miami",
      origin: "Atlanta, GA",
      dest: "Miami, FL",
      weight: 28000,
      note: "Tropical Coastal Rain Corridor",
    },
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.origin.trim() || !form.destination.trim()) return;
    onCalculate(form);
  };

  const applyPreset = (preset) => {
    setForm((prev) => ({
      ...prev,
      origin: preset.origin,
      destination: preset.dest,
      load_weight: preset.weight,
    }));
  };

  return (
    <div className="card route-form-card">
      <div className="card-header">
        <h2 className="card-title">Route & Load Parameters</h2>
        <span className="card-hint">Calculates 3 alternatives & samples weather by ETA</span>
      </div>

      {/* Quick Demo Presets */}
      <div className="presets-bar">
        <span className="presets-label">Quick Scenarios:</span>
        {presets.map((p, idx) => (
          <button
            key={idx}
            type="button"
            className="preset-btn"
            onClick={() => applyPreset(p)}
            title={p.note}
          >
            {p.name} ({p.weight.toLocaleString()} lb)
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="route-form">
        <div className="form-grid">
          {/* Origin */}
          <div className="input-group">
            <label htmlFor="origin">Origin Location</label>
            <div className="input-wrap">
              <span className="input-icon">🟢</span>
              <input
                id="origin"
                type="text"
                placeholder="e.g. Dallas, TX or Zip code"
                value={form.origin}
                onChange={(e) => setForm({ ...form, origin: e.target.value })}
                required
              />
            </div>
          </div>

          {/* Destination */}
          <div className="input-group">
            <label htmlFor="destination">Destination Location</label>
            <div className="input-wrap">
              <span className="input-icon">🏁</span>
              <input
                id="destination"
                type="text"
                placeholder="e.g. Chicago, IL or Zip code"
                value={form.destination}
                onChange={(e) => setForm({ ...form, destination: e.target.value })}
                required
              />
            </div>
          </div>

          {/* Departure Date/Time */}
          <div className="input-group">
            <label htmlFor="departure_time">Departure Date & Time</label>
            <div className="input-wrap">
              <span className="input-icon">🕒</span>
              <input
                id="departure_time"
                type="datetime-local"
                value={form.departure_time}
                onChange={(e) => setForm({ ...form, departure_time: e.target.value })}
                required
              />
            </div>
          </div>

          {/* Load Weight */}
          <div className="input-group">
            <label htmlFor="load_weight">
              Load Weight (lbs)
              <span className="weight-tag">
                {form.load_weight > 40000
                  ? "Heavy (>40k lb)"
                  : form.load_weight > 30000
                  ? "Medium (>30k lb)"
                  : "Light (≤30k lb)"}
              </span>
            </label>
            <div className="input-wrap">
              <span className="input-icon">⚖️</span>
              <input
                id="load_weight"
                type="number"
                min="1000"
                max="80000"
                step="500"
                value={form.load_weight}
                onChange={(e) => setForm({ ...form, load_weight: Number(e.target.value) })}
                required
              />
            </div>
          </div>

          {/* Sampling Interval */}
          <div className="input-group">
            <label htmlFor="sample_interval">Weather Sampling Resolution</label>
            <div className="input-wrap">
              <span className="input-icon">📍</span>
              <select
                id="sample_interval"
                value={form.sample_interval_miles}
                onChange={(e) => setForm({ ...form, sample_interval_miles: Number(e.target.value) })}
              >
                <option value={10}>Every 10 miles (High resolution)</option>
                <option value={25}>Every 25 miles (Standard - Recommended)</option>
                <option value={50}>Every 50 miles (Fast transit)</option>
              </select>
            </div>
          </div>
        </div>

        <button type="submit" className="submit-btn" disabled={loading}>
          {loading ? (
            <>
              <span className="spinner"></span>
              <span>Evaluating 3 Routes & Batch Weather Forecasts...</span>
            </>
          ) : (
            <>
              <span>⚡ Analyze Routes & Weather Risk</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
}
