import React, { useState, useEffect } from "react";
import Header from "./components/Header";
import RouteForm from "./components/RouteForm";
import RiskLegend from "./components/RiskLegend";
import RouteCards from "./components/RouteCards";
import ForecastSlider from "./components/ForecastSlider";
import MapView from "./components/MapView";
import CheckpointTable from "./components/CheckpointTable";
import { planWeatherRoute } from "./api";
import "./App.css";

export default function App() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [selectedRouteId, setSelectedRouteId] = useState(null);
  const [currentHour, setCurrentHour] = useState(0);

  // Auto-run default scenario on initial mount
  useEffect(() => {
    handleCalculate({
      origin: "Dallas, TX",
      destination: "Chicago, IL",
      departure_time: new Date().toISOString(),
      load_weight: 42000,
      sample_interval_miles: 25,
    });
  }, []);

  const handleCalculate = async (params) => {
    setLoading(true);
    setError(null);
    try {
      const data = await planWeatherRoute(params);
      setResult(data);
      setSelectedRouteId(data.recommended_route_id);
      setCurrentHour(0);
    } catch (err) {
      setError(err.message || "Failed to analyze weather-aware truck routes.");
    } finally {
      setLoading(false);
    }
  };

  const selectedRoute = result?.routes?.find((r) => r.id === selectedRouteId) || result?.routes?.[0];

  return (
    <div className="app-container">
      <Header />

      <main className="main-content">
        <div className="top-layout-grid">
          {/* Left Column: Form & Legend */}
          <div className="left-panel">
            <RouteForm onCalculate={handleCalculate} loading={loading} />
            <RiskLegend />
          </div>

          {/* Right Column: Interactive Map & 0-48h Forecast Slider */}
          <div className="right-panel">
            {error && (
              <div className="card error-banner">
                <span className="error-icon">⚠️</span>
                <div>
                  <strong>Evaluation Alert:</strong>
                  <p>{error}</p>
                </div>
              </div>
            )}

            {result && (
              <ForecastSlider
                currentHour={currentHour}
                onHourChange={setCurrentHour}
                departureTimeIso={result.query?.departure_time}
              />
            )}

            <MapView
              routes={result?.routes}
              selectedRouteId={selectedRouteId}
              onSelectRoute={setSelectedRouteId}
              origin={result?.origin}
              destination={result?.destination}
              heatmapTimeline={result?.heatmap_timeline}
              currentHour={currentHour}
            />
          </div>
        </div>

        {/* 3 Route Comparison Cards */}
        {result && (
          <RouteCards
            routes={result.routes}
            selectedRouteId={selectedRouteId}
            onSelectRoute={setSelectedRouteId}
          />
        )}

        {/* Checkpoint Audit Table */}
        {selectedRoute && <CheckpointTable route={selectedRoute} />}
      </main>

      <footer className="app-footer">
        <div>
          <span>Spotter Full Stack Developer Assessment • Weather-Aware Truck Routing</span>
        </div>
        <div className="footer-links">
          <span>Engineered with React + Leaflet & Django REST Framework</span>
        </div>
      </footer>
    </div>
  );
}
