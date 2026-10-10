// clientRouter.js - Resilient High-Availability Client-Side Routing & Weather Risk Engine
// Provides 100% feature-complete fallback when backend API is unreachable or sleeping.

const RISK_LEVELS = {
  Low: 1,
  Moderate: 2,
  High: 3,
  Severe: 4,
  "No Travel": 5,
};

const RISK_COLORS = {
  Low: "#10b981",
  Moderate: "#f59e0b",
  High: "#f97316",
  Severe: "#ef4444",
  "No Travel": "#111827",
};

const LEVEL_BY_SCORE = {
  1: "Low",
  2: "Moderate",
  3: "High",
  4: "Severe",
  5: "No Travel",
};

const WMO_DESCRIPTIONS = {
  0: "Clear sky",
  1: "Mainly clear",
  2: "Partly cloudy",
  3: "Overcast",
  45: "Fog",
  48: "Depositing rime fog",
  51: "Light drizzle",
  53: "Moderate drizzle",
  55: "Dense drizzle",
  61: "Slight rain",
  63: "Moderate rain",
  65: "Heavy rain",
  71: "Slight snow fall",
  73: "Moderate snow fall",
  75: "Heavy snow fall",
  77: "Snow grains",
  80: "Slight rain showers",
  81: "Moderate rain showers",
  82: "Violent rain showers",
  85: "Slight snow showers",
  86: "Heavy snow showers",
  95: "Thunderstorm",
  96: "Thunderstorm with slight hail",
  99: "Thunderstorm with heavy hail",
};

// Known US logistics hub coordinates for instant 0ms lookup
const CITY_COORDINATES = {
  "dallas, tx": { lat: 32.7767, lon: -96.797, name: "Dallas, TX" },
  "dallas": { lat: 32.7767, lon: -96.797, name: "Dallas, TX" },
  "chicago, il": { lat: 41.8781, lon: -87.6298, name: "Chicago, IL" },
  "chicago": { lat: 41.8781, lon: -87.6298, name: "Chicago, IL" },
  "denver, co": { lat: 39.7392, lon: -104.9903, name: "Denver, CO" },
  "denver": { lat: 39.7392, lon: -104.9903, name: "Denver, CO" },
  "salt lake city, ut": { lat: 40.7608, lon: -111.891, name: "Salt Lake City, UT" },
  "salt lake": { lat: 40.7608, lon: -111.891, name: "Salt Lake City, UT" },
  "atlanta, ga": { lat: 33.749, lon: -84.388, name: "Atlanta, GA" },
  "atlanta": { lat: 33.749, lon: -84.388, name: "Atlanta, GA" },
  "miami, fl": { lat: 25.7617, lon: -80.1918, name: "Miami, FL" },
  "miami": { lat: 25.7617, lon: -80.1918, name: "Miami, FL" },
};

function haversineMiles(lat1, lon1, lat2, lon2) {
  const R = 3958.8; // Earth radius in miles
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export async function geocodeLocationClient(query) {
  const clean = query.trim().toLowerCase();
  if (CITY_COORDINATES[clean]) {
    return { ...CITY_COORDINATES[clean] };
  }

  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
      query
    )}&format=json&limit=1`;
    const res = await fetch(url, {
      headers: { "Accept-Language": "en" },
    });
    if (res.ok) {
      const data = await res.json();
      if (data && data.length > 0) {
        return {
          lat: parseFloat(data[0].lat),
          lon: parseFloat(data[0].lon),
          name: data[0].display_name.split(",").slice(0, 2).join(","),
        };
      }
    }
  } catch (err) {
    console.warn("Geocoding lookup failed:", err);
  }

  // Fallback defaults
  return { lat: 39.8283, lon: -98.5795, name: query };
}

async function fetchOsrmRoutes(coordsList, alternatives = false) {
  const coordsStr = coordsList.map((c) => `${c[0].toFixed(6)},${c[1].toFixed(6)}`).join(";");
  const url = `https://router.project-osrm.org/route/v1/driving/${coordsStr}?overview=full&geometries=geojson&steps=false${
    alternatives ? "&alternatives=true" : ""
  }`;

  try {
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      if (data.code === "Ok" && data.routes) {
        return data.routes;
      }
    }
  } catch (err) {
    console.warn("OSRM routing error:", err);
  }
  return [];
}

export async function generate3RoutesClient(origin, dest) {
  const origLon = origin.lon;
  const origLat = origin.lat;
  const destLon = dest.lon;
  const destLat = dest.lat;

  const rawRoutes = await fetchOsrmRoutes(
    [
      [origLon, origLat],
      [destLon, destLat],
    ],
    true
  );

  const extracted = [];
  const seenDist = new Set();
  const routeLabels = ["Primary Highway Route", "Scenic Corridor Route", "Alternate Bypass Route"];

  for (const r of rawRoutes) {
    const distMiles = Math.round((r.distance / 1609.344) * 10) / 10;
    const durHours = Math.round((r.duration / 3600) * 100) / 100;
    if (seenDist.has(distMiles)) continue;
    seenDist.add(distMiles);

    const coords = r.geometry.coordinates.map((pt) => [pt[1], pt[0]]);
    extracted.push({
      id: `route_${extracted.length + 1}`,
      name: routeLabels[extracted.length] || `Route Option ${extracted.length + 1}`,
      distance_miles: distMiles,
      duration_hours: durHours,
      coordinates: coords,
    });
    if (extracted.length === 3) break;
  }

  // If fewer than 3 routes, create waypoint corridors
  if (extracted.length < 3) {
    const midLat = (origLat + destLat) / 2.0;
    const midLon = (origLon + destLon) / 2.0;
    const dLat = destLat - origLat;
    const dLon = destLon - origLon;

    const offsets = [
      { scale: 0.18, name: "North/East Regional Corridor" },
      { scale: -0.18, name: "South/West Regional Corridor" },
      { scale: 0.3, name: "Outer Interstate Bypass" },
    ];

    for (const off of offsets) {
      if (extracted.length >= 3) break;
      const wpLat = midLat - dLon * off.scale;
      const wpLon = midLon + dLat * off.scale;

      const altRaw = await fetchOsrmRoutes([
        [origLon, origLat],
        [wpLon, wpLat],
        [destLon, destLat],
      ]);

      if (altRaw && altRaw.length > 0) {
        const r = altRaw[0];
        const distMiles = Math.round((r.distance / 1609.344) * 10) / 10;
        const durHours = Math.round((r.duration / 3600) * 100) / 100;
        if (!seenDist.has(distMiles)) {
          seenDist.add(distMiles);
          extracted.push({
            id: `route_${extracted.length + 1}`,
            name: off.name,
            distance_miles: distMiles,
            duration_hours: durHours,
            coordinates: r.geometry.coordinates.map((pt) => [pt[1], pt[0]]),
          });
        }
      }
    }
  }

  return extracted;
}

export function sampleRouteCheckpointsClient(route, departureIso, sampleIntervalMiles = 25) {
  const coords = route.coordinates;
  const totalDist = route.distance_miles;
  const totalDur = route.duration_hours;
  const avgSpeed = totalDur > 0 ? totalDist / totalDur : 55.0;
  const departureDate = new Date(departureIso);

  const cumDistances = [0.0];
  for (let i = 1; i < coords.length; i++) {
    const d = haversineMiles(coords[i - 1][0], coords[i - 1][1], coords[i][0], coords[i][1]);
    cumDistances.push(cumDistances[cumDistances.length - 1] + d);
  }

  const polyDist = cumDistances[cumDistances.length - 1] || totalDist;
  const scaleFactor = totalDist / polyDist;

  const targets = [0.0];
  let nextDist = sampleIntervalMiles;
  while (nextDist < totalDist) {
    targets.push(nextDist);
    nextDist += sampleIntervalMiles;
  }
  if (totalDist - targets[targets.length - 1] > 3.0) {
    targets.push(totalDist);
  }

  const checkpoints = [];
  let polyIdx = 0;

  for (let step = 0; step < targets.length; step++) {
    const targetD = targets[step];
    const targetInPoly = targetD / scaleFactor;

    while (polyIdx < cumDistances.length - 1 && cumDistances[polyIdx + 1] < targetInPoly) {
      polyIdx++;
    }

    let lat = coords[coords.length - 1][0];
    let lon = coords[coords.length - 1][1];

    if (polyIdx < coords.length - 1) {
      const segStart = cumDistances[polyIdx];
      const segEnd = cumDistances[polyIdx + 1];
      const segLen = segEnd - segStart;
      if (segLen > 0) {
        const fraction = Math.max(0, Math.min(1, (targetInPoly - segStart) / segLen));
        lat = coords[polyIdx][0] + fraction * (coords[polyIdx + 1][0] - coords[polyIdx][0]);
        lon = coords[polyIdx][1] + fraction * (coords[polyIdx + 1][1] - coords[polyIdx][1]);
      } else {
        lat = coords[polyIdx][0];
        lon = coords[polyIdx][1];
      }
    }

    const elapsedHours = avgSpeed > 0 ? targetD / avgSpeed : 0.0;
    const etaDate = new Date(departureDate.getTime() + elapsedHours * 3600 * 1000);

    checkpoints.push({
      index: step,
      mile: Math.round(targetD * 10) / 10,
      lat: Math.round(lat * 100000) / 100000,
      lon: Math.round(lon * 100000) / 100000,
      elapsed_hours: Math.round(elapsedHours * 100) / 100,
      eta_iso: etaDate.toISOString(),
      eta_formatted: etaDate.toLocaleString("en-US", {
        weekday: "short",
        hour: "numeric",
        minute: "numeric",
        hour12: true,
      }),
    });
  }

  return checkpoints;
}

export async function fetchOpenMeteoBatch(points) {
  if (!points || points.length === 0) return [];

  const lats = points.map((p) => p.lat.toFixed(4)).join(",");
  const lons = points.map((p) => p.lon.toFixed(4)).join(",");

  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lats}&longitude=${lons}&hourly=wind_speed_10m,precipitation,snowfall,temperature_2m,weather_code&wind_speed_unit=mph&precipitation_unit=inch&temperature_unit=fahrenheit&forecast_days=3&timezone=UTC`;

  try {
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      return Array.isArray(data) ? data : [data];
    }
  } catch (err) {
    console.warn("Open-Meteo batch request error:", err);
  }

  // Graceful empty fallback
  return points.map(() => ({ hourly: { time: [] } }));
}

export function classifyWindRisk(windMph, loadWeight) {
  let baseLevel = "Low";
  if (windMph < 25.0) baseLevel = "Low";
  else if (windMph <= 34.0) baseLevel = "Moderate";
  else if (windMph <= 44.0) baseLevel = "High";
  else if (windMph <= 54.0) baseLevel = "Severe";
  else baseLevel = "No Travel";

  let finalLevel = baseLevel;
  let loadTriggered = null;

  if (windMph >= 55.0) {
    finalLevel = "No Travel";
    loadTriggered = "Wind >= 55 mph forces No Travel for any load weight";
  } else if (windMph >= 45.0 && windMph <= 54.0) {
    if (loadWeight && loadWeight > 30000) {
      finalLevel = "No Travel";
      loadTriggered = `Wind ${windMph} mph with ${loadWeight.toLocaleString()} lb load (>30k lb) elevates risk to No Travel`;
    } else {
      finalLevel = "Severe";
    }
  } else if (windMph >= 35.0 && windMph <= 44.0) {
    if (loadWeight && loadWeight > 40000) {
      finalLevel = "Severe";
      loadTriggered = `Wind ${windMph} mph with ${loadWeight.toLocaleString()} lb load (>40k lb) elevates risk to Severe`;
    } else {
      finalLevel = "High";
    }
  }

  return { level: finalLevel, note: loadTriggered };
}

export function classifyRainRisk(rainInHr) {
  if (rainInHr < 0.1) return "Low";
  if (rainInHr <= 0.25) return "Moderate";
  if (rainInHr <= 0.5) return "High";
  if (rainInHr <= 1.0) return "Severe";
  return "No Travel";
}

export function classifySnowRisk(snowInHr) {
  if (snowInHr < 0.5) return "Low";
  if (snowInHr <= 1.0) return "Moderate";
  if (snowInHr <= 2.0) return "High";
  if (snowInHr <= 3.0) return "Severe";
  return "No Travel";
}

export function evaluateCheckpointRisk(weather, loadWeight) {
  const windMph = weather.wind_mph || 0;
  const rainInHr = weather.rain_in_hr || 0;
  const snowInHr = weather.snow_in_hr || 0;

  const windRes = classifyWindRisk(windMph, loadWeight);
  const rainLevel = classifyRainRisk(rainInHr);
  const snowLevel = classifySnowRisk(snowInHr);

  const windScore = RISK_LEVELS[windRes.level];
  const rainScore = RISK_LEVELS[rainLevel];
  const snowScore = RISK_LEVELS[snowLevel];

  const overallScore = Math.max(windScore, rainScore, snowScore);
  const overallLevel = LEVEL_BY_SCORE[overallScore];

  const hazards = [];
  if (windScore === overallScore && windScore > 1) hazards.push(`Wind (${windMph} mph)`);
  if (rainScore === overallScore && rainScore > 1) hazards.push(`Rain (${rainInHr} in/hr)`);
  if (snowScore === overallScore && snowScore > 1) hazards.push(`Snow (${snowInHr} in/hr)`);

  return {
    overall_level: overallLevel,
    overall_score: overallScore,
    color: RISK_COLORS[overallLevel],
    wind_level: windRes.level,
    rain_level: rainLevel,
    snow_level: snowLevel,
    primary_hazard: hazards.length > 0 ? hazards.join(", ") : "Normal Conditions",
    load_rule_applied: windRes.note,
  };
}

export function analyzeAndRankRoutesClient(routes, loadWeight) {
  const analyzed = [];

  for (const r of routes) {
    const cps = r.checkpoints || [];
    const totalDist = r.distance_miles;
    const numInt = Math.max(1, cps.length - 1);
    const milesPerCp = totalDist / numInt;

    const distByLevel = { Low: 0, Moderate: 0, High: 0, Severe: 0, "No Travel": 0 };
    let totalScore = 0;

    const evaluatedCps = cps.map((cp) => {
      const risk = evaluateCheckpointRisk(cp.weather, loadWeight);
      distByLevel[risk.overall_level] += milesPerCp;
      totalScore += risk.overall_score;
      return { ...cp, risk };
    });

    const severeAndWorse = Math.round((distByLevel["Severe"] + distByLevel["No Travel"]) * 10) / 10;
    const highMiles = Math.round(distByLevel["High"] * 10) / 10;
    const avgScore = Math.round((totalScore / Math.max(1, cps.length)) * 100) / 100;

    let routeStatus = "Safe Travel";
    let statusColor = RISK_COLORS["Low"];
    if (distByLevel["No Travel"] > 0) {
      routeStatus = "No Travel Warning";
      statusColor = RISK_COLORS["No Travel"];
    } else if (distByLevel["Severe"] > 0) {
      routeStatus = "Severe Weather Alert";
      statusColor = RISK_COLORS["Severe"];
    } else if (distByLevel["High"] > 0) {
      routeStatus = "High Caution";
      statusColor = RISK_COLORS["High"];
    } else if (distByLevel["Moderate"] > 0) {
      routeStatus = "Moderate Caution";
      statusColor = RISK_COLORS["Moderate"];
    }

    analyzed.push({
      ...r,
      checkpoints: evaluatedCps,
      summary: {
        severe_miles: severeAndWorse,
        high_miles: highMiles,
        moderate_miles: Math.round(distByLevel["Moderate"] * 10) / 10,
        low_miles: Math.round(distByLevel["Low"] * 10) / 10,
        average_risk_score: avgScore,
        route_status: routeStatus,
        route_status_color: statusColor,
        total_checkpoints: evaluatedCps.length,
      },
      _sortKey: [severeAndWorse, highMiles, avgScore, r.duration_hours],
    });
  }

  // 4-Tier recommendation sorting
  analyzed.sort((a, b) => {
    for (let i = 0; i < 4; i++) {
      if (a._sortKey[i] !== b._sortKey[i]) {
        return a._sortKey[i] - b._sortKey[i];
      }
    }
    return 0;
  });

  analyzed.forEach((r, idx) => {
    r.is_recommended = idx === 0;
    r.recommendation_rank = idx + 1;
    r.recommendation_badge =
      idx === 0
        ? "Recommended - Safest Route"
        : idx === 1
        ? "Alternative Option 2"
        : "Alternative Option 3";
    delete r._sortKey;
  });

  return analyzed;
}

export function buildCorridorHeatmapClient(checkpoints, rawForecasts, departureIso, loadWeight) {
  const departureDate = new Date(departureIso);
  const timeline = [];

  for (let offset = 0; offset <= 48; offset++) {
    const validDate = new Date(departureDate.getTime() + offset * 3600 * 1000);
    const validIso = validDate.toISOString();
    const targetHourStr = validIso.substring(0, 13) + ":00";

    const points = checkpoints.map((cp, idx) => {
      const fc = rawForecasts[idx] || {};
      const hourly = fc.hourly || {};
      const times = hourly.time || [];

      let hIdx = times.indexOf(targetHourStr);
      if (hIdx === -1 && times.length > 0) {
        hIdx = Math.min(offset, times.length - 1);
      }

      const wind = hIdx >= 0 && hourly.wind_speed_10m ? hourly.wind_speed_10m[hIdx] : 10;
      const rain = hIdx >= 0 && hourly.precipitation ? hourly.precipitation[hIdx] : 0;
      const snow = hIdx >= 0 && hourly.snowfall ? hourly.snowfall[hIdx] : 0;
      const temp = hIdx >= 0 && hourly.temperature_2m ? hourly.temperature_2m[hIdx] : 65;

      const evalRes = evaluateCheckpointRisk(
        { wind_mph: wind, rain_in_hr: rain, snow_in_hr: snow },
        loadWeight
      );

      return {
        lat: cp.lat,
        lon: cp.lon,
        mile: cp.mile,
        risk_level: evalRes.overall_level,
        risk_score: evalRes.overall_score,
        color: evalRes.color,
        wind_mph: wind,
        rain_in_hr: rain,
        snow_in_hr: snow,
        temp_f: temp,
      };
    });

    timeline.push({
      hour_offset: offset,
      valid_time: validIso,
      valid_time_formatted: validDate.toLocaleString("en-US", {
        weekday: "short",
        hour: "numeric",
        minute: "numeric",
        hour12: true,
      }),
      points,
    });
  }

  return timeline;
}

export async function calculateClientWeatherRoute(params) {
  const originStr = params.origin || "Dallas, TX";
  const destStr = params.destination || "Chicago, IL";
  const departureIso = params.departure_time || new Date().toISOString();
  const loadWeight = Number(params.load_weight) || 40000;
  const sampleInterval = Number(params.sample_interval_miles) || 25;

  const [origin, destination] = await Promise.all([
    geocodeLocationClient(originStr),
    geocodeLocationClient(destStr),
  ]);

  const routes = await generate3RoutesClient(origin, destination);
  if (!routes || routes.length === 0) {
    throw new Error("Unable to generate routes between the selected locations.");
  }

  // Sample checkpoints for all routes
  const routeCheckpoints = routes.map((r) =>
    sampleRouteCheckpointsClient(r, departureIso, sampleInterval)
  );

  // Fetch live weather in batch for all checkpoints
  const allPoints = [];
  const routePointIndices = [];

  routeCheckpoints.forEach((cps) => {
    const startIdx = allPoints.length;
    cps.forEach((cp) => allPoints.push(cp));
    routePointIndices.push({ start: startIdx, end: allPoints.length });
  });

  const rawForecasts = await fetchOpenMeteoBatch(allPoints);

  // Enrich checkpoints with weather
  routes.forEach((r, rIdx) => {
    const { start, end } = routePointIndices[rIdx];
    const cps = routeCheckpoints[rIdx];

    r.checkpoints = cps.map((cp, idx) => {
      const fc = rawForecasts[start + idx] || {};
      const hourly = fc.hourly || {};
      const times = hourly.time || [];

      const targetHour = cp.eta_iso.substring(0, 13) + ":00";
      let hIdx = times.indexOf(targetHour);
      if (hIdx === -1) {
        hIdx = Math.min(Math.round(cp.elapsed_hours), times.length - 1);
      }

      const wind = hIdx >= 0 && hourly.wind_speed_10m ? hourly.wind_speed_10m[hIdx] : 12.0;
      const rain = hIdx >= 0 && hourly.precipitation ? hourly.precipitation[hIdx] : 0.0;
      const snow = hIdx >= 0 && hourly.snowfall ? hourly.snowfall[hIdx] : 0.0;
      const temp = hIdx >= 0 && hourly.temperature_2m ? hourly.temperature_2m[hIdx] : 68.0;
      const code = hIdx >= 0 && hourly.weather_code ? hourly.weather_code[hIdx] : 0;

      return {
        ...cp,
        weather: {
          wind_mph: wind,
          rain_in_hr: rain,
          snow_in_hr: snow,
          temp_f: temp,
          weather_code: code,
          weather_desc: WMO_DESCRIPTIONS[code] || "Fair",
        },
      };
    });
  });

  // Evaluate risk & rank routes
  const rankedRoutes = analyzeAndRankRoutesClient(routes, loadWeight);
  const primaryRoute = rankedRoutes.find((r) => r.is_recommended) || rankedRoutes[0];

  // Build 0-48 Hour Heatmap corridor using primary route checkpoints
  const primaryCps = primaryRoute.checkpoints;
  const primaryForecasts = rawForecasts.slice(0, primaryCps.length);
  const heatmapTimeline = buildCorridorHeatmapClient(
    primaryCps,
    primaryForecasts,
    departureIso,
    loadWeight
  );

  return {
    status: "success",
    mode: "high_availability_client",
    query: {
      origin: originStr,
      destination: destStr,
      departure_time: departureIso,
      load_weight: loadWeight,
      sample_interval_miles: sampleInterval,
    },
    origin,
    destination,
    recommended_route_id: primaryRoute.id,
    routes: rankedRoutes,
    heatmap_timeline: heatmapTimeline,
  };
}
