import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Container,
  Box,
  Grid,
  Alert,
  AlertTitle,
  LinearProgress,
  Typography,
  Skeleton,
} from "@mui/material";
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

  const handleCalculate = useCallback(async (params) => {
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
  }, []);

  // Auto-run initial benchmark scenario on mount
  useEffect(() => {
    handleCalculate({
      origin: "Dallas, TX",
      destination: "Chicago, IL",
      departure_time: new Date().toISOString(),
      load_weight: 42000,
      sample_interval_miles: 25,
    });
  }, [handleCalculate]);

  const selectedRoute = useMemo(() => {
    return result?.routes?.find((r) => r.id === selectedRouteId) || result?.routes?.[0];
  }, [result, selectedRouteId]);

  return (
    <Box sx={{ minHeight: "100vh", display: "flex", flexDirection: "column", backgroundColor: "background.default" }}>
      <Header />

      {loading && <LinearProgress color="primary" sx={{ height: 3 }} />}

      <Container maxWidth="xl" sx={{ py: 3, flex: 1 }}>
        <Grid container spacing={3}>
          {/* Left Column: Form & Legend */}
          <Grid item xs={12} md={5}>
            <RouteForm onCalculate={handleCalculate} loading={loading} />
            <RiskLegend />
          </Grid>

          {/* Right Column: 0-48h Slider & Map */}
          <Grid item xs={12} md={7}>
            {error && (
              <Alert severity="error" sx={{ mb: 2.5, backgroundColor: "#1e131d", border: "1px solid #ef4444" }}>
                <AlertTitle sx={{ fontWeight: 700 }}>Route Planning Error</AlertTitle>
                {error}
              </Alert>
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
          </Grid>
        </Grid>

        {/* Loading Skeletons */}
        {loading && !result && (
          <Box sx={{ my: 3 }}>
            <Typography variant="h6" sx={{ color: "text.secondary", mb: 2 }}>
              Evaluating Alternative Routes...
            </Typography>
            <Grid container spacing={3}>
              {[1, 2, 3].map((i) => (
                <Grid item xs={12} md={4} key={i}>
                  <Skeleton variant="rounded" height={260} sx={{ backgroundColor: "#1e293b", borderRadius: 3 }} />
                </Grid>
              ))}
            </Grid>
          </Box>
        )}

        {/* 3 Route Comparison Cards */}
        {result && (
          <RouteCards
            routes={result.routes}
            selectedRouteId={selectedRouteId}
            onSelectRoute={setSelectedRouteId}
          />
        )}

        {/* Checkpoint Table */}
        {selectedRoute && <CheckpointTable route={selectedRoute} />}
      </Container>

      {/* Footer */}
      <Box
        component="footer"
        sx={{
          mt: "auto",
          py: 2.5,
          px: 4,
          borderTop: "1px solid",
          borderColor: "divider",
          backgroundColor: "background.paper",
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          justifyContent: "space-between",
          alignItems: "center",
          gap: 1,
        }}
      >
        <Typography variant="caption" sx={{ color: "text.secondary" }}>
          Spotter Full Stack Developer Assessment • Weather-Aware Truck Routing
        </Typography>
        <Typography variant="caption" sx={{ color: "text.secondary" }}>
          React 19 + Material UI • Django 6 REST Framework • Open-Meteo & OSRM
        </Typography>
      </Box>
    </Box>
  );
}
