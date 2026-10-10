import React, { useEffect, useRef } from "react";
import L from "leaflet";

// Fix standard Leaflet default marker icons for Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

export default function MapView({
  routes,
  selectedRouteId,
  onSelectRoute,
  origin,
  destination,
  heatmapTimeline,
  currentHour,
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const routesLayerGroupRef = useRef(null);
  const checkpointsLayerGroupRef = useRef(null);
  const heatmapLayerGroupRef = useRef(null);
  const markersLayerGroupRef = useRef(null);

  // 1. Initialize Map once
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [39.8283, -98.5795], // Center of US
      zoom: 4,
      zoomControl: true,
    });

    // Standard OpenStreetMap tile layer (reliable, free, no API key watermark)
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    routesLayerGroupRef.current = L.layerGroup().addTo(map);
    heatmapLayerGroupRef.current = L.layerGroup().addTo(map);
    checkpointsLayerGroupRef.current = L.layerGroup().addTo(map);
    markersLayerGroupRef.current = L.layerGroup().addTo(map);

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // 2. Render Routes & Origin/Destination markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !routes || routes.length === 0) return;

    routesLayerGroupRef.current.clearLayers();
    markersLayerGroupRef.current.clearLayers();

    const allLatLons = [];

    // Distinct route colors
    const routeColors = {
      route_1: "#2563eb", // Vibrant Blue
      route_2: "#059669", // Emerald Green
      route_3: "#7c3aed", // Royal Purple
    };

    routes.forEach((route) => {
      const isSelected = route.id === selectedRouteId;
      const color = routeColors[route.id] || "#3b82f6";
      const coords = route.coordinates; // [[lat, lon], ...]

      if (coords && coords.length > 0) {
        if (isSelected) {
          allLatLons.push(...coords);
        }

        // Draw polyline
        const polyline = L.polyline(coords, {
          color: isSelected ? color : "#94a3b8",
          weight: isSelected ? 6 : 4,
          opacity: isSelected ? 0.95 : 0.45,
          dashArray: isSelected ? null : "6, 8",
          lineJoin: "round",
          lineCap: "round",
        });

        polyline.on("click", () => {
          onSelectRoute(route.id);
        });

        polyline.bindTooltip(
          `<strong>${route.name}</strong><br/>${route.distance_miles} mi • ${route.duration_hours} hrs<br/>Status: ${route.summary.route_status}`,
          { sticky: true }
        );

        polyline.addTo(routesLayerGroupRef.current);
      }
    });

    // Add Start & End Markers
    if (origin && destination) {
      const startIcon = L.divIcon({
        className: "custom-map-icon start-icon",
        html: `<div style="background:#10b981; color:white; width:30px; height:30px; border-radius:50%; display:flex; align-items:center; justify-content:center; border:2px solid white; box-shadow:0 3px 6px rgba(0,0,0,0.3); font-size:14px; font-weight:bold;">A</div>`,
        iconSize: [30, 30],
        iconAnchor: [15, 15],
      });

      const endIcon = L.divIcon({
        className: "custom-map-icon end-icon",
        html: `<div style="background:#ef4444; color:white; width:30px; height:30px; border-radius:50%; display:flex; align-items:center; justify-content:center; border:2px solid white; box-shadow:0 3px 6px rgba(0,0,0,0.3); font-size:14px; font-weight:bold;">B</div>`,
        iconSize: [30, 30],
        iconAnchor: [15, 15],
      });

      L.marker([origin.lat, origin.lon], { icon: startIcon })
        .bindPopup(`<strong>Origin:</strong> ${origin.display_name}`)
        .addTo(markersLayerGroupRef.current);

      L.marker([destination.lat, destination.lon], { icon: endIcon })
        .bindPopup(`<strong>Destination:</strong> ${destination.display_name}`)
        .addTo(markersLayerGroupRef.current);
    }

    // Auto-fit bounds
    if (allLatLons.length > 0) {
      const bounds = L.latLngBounds(allLatLons);
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 12 });
    }
  }, [routes, selectedRouteId, origin, destination, onSelectRoute]);

  // 3. Render Checkpoints on the selected route
  useEffect(() => {
    if (!checkpointsLayerGroupRef.current) return;
    checkpointsLayerGroupRef.current.clearLayers();

    const selectedRoute = routes?.find((r) => r.id === selectedRouteId);
    if (!selectedRoute || !selectedRoute.checkpoints) return;

    selectedRoute.checkpoints.forEach((cp) => {
      const risk = cp.risk;
      const weather = cp.weather;

      const circle = L.circleMarker([cp.lat, cp.lon], {
        radius: risk.overall_level === "No Travel" ? 9 : 7,
        fillColor: risk.color,
        color: "#ffffff",
        weight: 2,
        opacity: 1,
        fillOpacity: 0.95,
      });

      const popupHtml = `
        <div class="checkpoint-popup">
          <div class="cp-popup-header" style="border-bottom: 2px solid ${risk.color}; padding-bottom: 6px; margin-bottom: 6px;">
            <div style="font-weight: 700; font-size: 14px;">Mile ${cp.mile} • Checkpoint #${cp.index + 1}</div>
            <div style="font-size: 12px; color: #64748b;">ETA: ${cp.eta_formatted}</div>
          </div>
          <div style="margin-bottom: 6px;">
            <span style="background: ${risk.color}; color: white; padding: 2px 8px; border-radius: 12px; font-size: 11px; font-weight: 700;">
              ${risk.overall_level.toUpperCase()} RISK
            </span>
          </div>
          <div style="font-size: 12px; line-height: 1.5; color: #334155;">
            <div><strong>Condition:</strong> ${weather.condition} (${weather.temp_f}°F)</div>
            <div><strong>Wind Speed:</strong> ${weather.wind_mph} mph <span style="color:#64748b;">(${risk.wind_level})</span></div>
            <div><strong>Precipitation:</strong> ${weather.rain_in_hr} in/hr <span style="color:#64748b;">(${risk.rain_level})</span></div>
            <div><strong>Snowfall:</strong> ${weather.snow_in_hr} in/hr <span style="color:#64748b;">(${risk.snow_level})</span></div>
          </div>
          ${
            risk.load_rule_applied
              ? `<div style="margin-top: 6px; padding: 6px; background: #fef2f2; border-left: 3px solid #ef4444; font-size: 11px; color: #991b1b;">
                  ⚠️ <strong>Load Rule Applied:</strong> ${risk.load_rule_applied}
                 </div>`
              : ""
          }
        </div>
      `;

      circle.bindPopup(popupHtml, { maxWidth: 280 });
      circle.addTo(checkpointsLayerGroupRef.current);
    });
  }, [routes, selectedRouteId]);

  // 4. Render Weather Heatmap along Corridor for the active Slider Hour (0–48h)
  useEffect(() => {
    if (!heatmapLayerGroupRef.current) return;
    heatmapLayerGroupRef.current.clearLayers();

    if (!heatmapTimeline || heatmapTimeline.length === 0) return;

    // Pick frame corresponding to current hour offset
    const frame = heatmapTimeline.find((f) => f.hour_offset === currentHour) || heatmapTimeline[0];
    if (!frame || !frame.points) return;

    frame.points.forEach((pt) => {
      if (pt.intensity <= 0.05) return; // Skip negligible weather

      // Color based on intensity
      let heatColor = "#38bdf8"; // Light blue (mild)
      if (pt.intensity > 0.75) heatColor = "#ef4444"; // Severe (Red)
      else if (pt.intensity > 0.5) heatColor = "#f97316"; // High (Orange)
      else if (pt.intensity > 0.25) heatColor = "#f59e0b"; // Moderate (Yellow)

      const heatCircle = L.circle([pt.lat, pt.lon], {
        radius: 28000 + pt.intensity * 22000, // 28km to 50km radius
        fillColor: heatColor,
        color: heatColor,
        weight: 1,
        opacity: 0.35,
        fillOpacity: Math.min(0.45, 0.15 + pt.intensity * 0.3),
      });

      heatCircle.bindTooltip(
        `Forecast at +${currentHour}h:<br/>Wind: ${pt.wind_mph} mph<br/>Rain: ${pt.rain_in_hr} in/hr<br/>Snow: ${pt.snow_in_hr} in/hr`,
        { sticky: true }
      );

      heatCircle.addTo(heatmapLayerGroupRef.current);
    });
  }, [heatmapTimeline, currentHour]);

  return (
    <div className="map-view-wrapper card">
      <div className="map-legend-overlay">
        <span className="legend-chip chip-low">● Low</span>
        <span className="legend-chip chip-mod">● Moderate</span>
        <span className="legend-chip chip-high">● High</span>
        <span className="legend-chip chip-severe">● Severe</span>
        <span className="legend-chip chip-notravel">● No Travel</span>
      </div>

      <div ref={mapContainerRef} className="leaflet-map-container" />
    </div>
  );
}
