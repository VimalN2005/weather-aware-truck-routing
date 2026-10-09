import React, { useState, useEffect } from "react";

export default function ForecastSlider({ currentHour, onHourChange, departureTimeIso }) {
  const [isPlaying, setIsPlaying] = useState(false);

  // Auto-play loop stepping through 0 to 48 hours
  useEffect(() => {
    let interval = null;
    if (isPlaying) {
      interval = setInterval(() => {
        onHourChange((prev) => {
          if (prev >= 48) {
            return 0; // Loop back
          }
          return prev + 1;
        });
      }, 350); // 350ms per hour step
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlaying, onHourChange]);

  // Compute timestamp for the selected hour offset
  const getForecastTimestamp = (hourOffset) => {
    if (!departureTimeIso) return `+${hourOffset}h`;
    try {
      const dt = new Date(departureTimeIso);
      dt.setHours(dt.getHours() + hourOffset);
      return dt.toLocaleString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "numeric",
      });
    } catch {
      return `+${hourOffset} Hours`;
    }
  };

  return (
    <div className="card forecast-slider-card">
      <div className="slider-top-row">
        <div className="slider-label-wrap">
          <span className="slider-icon">⏱️</span>
          <div>
            <h4 className="slider-title">Trip Corridor Weather Forecast Slider (0–48 Hours)</h4>
            <span className="slider-subtitle">
              Drag slider or press Play to inspect forecasted weather hazards along the corridor over time
            </span>
          </div>
        </div>

        <div className="slider-active-time-badge">
          <span className="hour-pill">Hour +{currentHour}</span>
          <span className="time-text">{getForecastTimestamp(currentHour)}</span>
        </div>
      </div>

      <div className="slider-controls-wrap">
        <button
          type="button"
          className={`play-btn ${isPlaying ? "playing" : ""}`}
          onClick={() => setIsPlaying(!isPlaying)}
          title={isPlaying ? "Pause Radar Loop" : "Play 48h Radar Loop"}
        >
          {isPlaying ? "⏸️ Pause Radar" : "▶️ Play Forecast Loop"}
        </button>

        <div className="slider-input-container">
          <input
            type="range"
            min="0"
            max="48"
            step="1"
            value={currentHour}
            onChange={(e) => {
              setIsPlaying(false);
              onHourChange(Number(e.target.value));
            }}
            className="time-slider"
          />
          <div className="slider-ticks">
            <span>Departure (0h)</span>
            <span>+12h</span>
            <span>+24h (Day 2)</span>
            <span>+36h</span>
            <span>+48h (Day 3)</span>
          </div>
        </div>

        <button
          type="button"
          className="reset-btn"
          onClick={() => {
            setIsPlaying(false);
            onHourChange(0);
          }}
          title="Reset to departure time"
        >
          Reset to 0h
        </button>
      </div>
    </div>
  );
}
