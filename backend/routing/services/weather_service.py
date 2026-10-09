from datetime import datetime
import requests

OPEN_METEO_URL = "https://api.open-meteo.com/v1/forecast"

# WMO Weather interpretation codes
WMO_DESCRIPTIONS = {
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
}


def get_weather_description(code):
    return WMO_DESCRIPTIONS.get(int(code), "Overcast")


def fetch_batch_weather(points_lat_lon):
    """
    Fetches hourly weather forecasts in batch from Open-Meteo API.
    points_lat_lon: list of (lat, lon) tuples
    Returns: list of forecast dictionaries, one per input coordinate.
    """
    if not points_lat_lon:
        return []

    # Open-Meteo allows batches of latitudes and longitudes
    # To prevent URL query length limits, batch in chunks of 50 points
    results = []
    chunk_size = 50

    for i in range(0, len(points_lat_lon), chunk_size):
        chunk = points_lat_lon[i : i + chunk_size]
        lats = ",".join(f"{pt[0]:.4f}" for pt in chunk)
        lons = ",".join(f"{pt[1]:.4f}" for pt in chunk)

        params = {
            "latitude": lats,
            "longitude": lons,
            "hourly": "wind_speed_10m,precipitation,snowfall,temperature_2m,weather_code",
            "wind_speed_unit": "mph",
            "precipitation_unit": "inch",
            "temperature_unit": "fahrenheit",
            "forecast_days": 3,  # Covers up to 72 hours
            "timezone": "UTC",
        }

        try:
            response = requests.get(OPEN_METEO_URL, params=params, timeout=25)
            response.raise_for_status()
            data = response.json()

            if isinstance(data, list):
                results.extend(data)
            elif isinstance(data, dict):
                # When 1 point is requested, Open-Meteo returns a single dict instead of a list
                results.append(data)
        except Exception as e:
            print(f"Weather batch fetch error: {e}")
            # In case of network timeout, generate safe default weather structures
            for _ in chunk:
                results.append({"hourly": {"time": []}})

    return results


def attach_weather_to_checkpoints(checkpoints):
    """
    Given a list of checkpoints with lat, lon, and eta_iso,
    queries Open-Meteo and assigns the exact weather expected at each checkpoint's arrival time.
    """
    coords = [(cp["lat"], cp["lon"]) for cp in checkpoints]
    forecasts = fetch_batch_weather(coords)

    enriched_checkpoints = []

    for idx, cp in enumerate(checkpoints):
        fc = forecasts[idx] if idx < len(forecasts) else {}
        hourly = fc.get("hourly", {})
        times = hourly.get("time", [])

        # Parse arrival time and round to nearest UTC hour
        eta_dt = datetime.fromisoformat(cp["eta_iso"].replace("Z", "+00:00"))
        # Format as Open-Meteo time format: "YYYY-MM-DDTHH:00"
        target_hour_str = eta_dt.strftime("%Y-%m-%dT%H:00")

        wind_mph = 10.0
        rain_in_hr = 0.0
        snow_in_hr = 0.0
        temp_f = 65.0
        weather_code = 0

        if times:
            # Find closest matching hour
            hour_idx = 0
            if target_hour_str in times:
                hour_idx = times.index(target_hour_str)
            else:
                # Find minimum time difference
                try:
                    time_objs = [datetime.fromisoformat(t) for t in times]
                    eta_naive = eta_dt.replace(tzinfo=None)
                    hour_idx = min(
                        range(len(time_objs)),
                        key=lambda i: abs(time_objs[i] - eta_naive),
                    )
                except Exception:
                    hour_idx = 0

            winds = hourly.get("wind_speed_10m", [])
            precips = hourly.get("precipitation", [])
            snows = hourly.get("snowfall", [])
            temps = hourly.get("temperature_2m", [])
            codes = hourly.get("weather_code", [])

            if hour_idx < len(winds):
                wind_mph = round(float(winds[hour_idx] or 0.0), 1)
            if hour_idx < len(precips):
                rain_in_hr = round(float(precips[hour_idx] or 0.0), 2)
            if hour_idx < len(snows):
                snow_in_hr = round(float(snows[hour_idx] or 0.0), 2)
            if hour_idx < len(temps):
                temp_f = round(float(temps[hour_idx] or 65.0), 1)
            if hour_idx < len(codes):
                weather_code = int(codes[hour_idx] or 0)

        condition_desc = get_weather_description(weather_code)

        enriched_cp = {
            **cp,
            "weather": {
                "wind_mph": wind_mph,
                "rain_in_hr": rain_in_hr,
                "snow_in_hr": snow_in_hr,
                "temp_f": temp_f,
                "weather_code": weather_code,
                "condition": condition_desc,
            },
        }
        enriched_checkpoints.append(enriched_cp)

    return enriched_checkpoints, forecasts


def build_corridor_heatmap_timeline(corridor_checkpoints, forecasts, departure_iso, max_hours=48):
    """
    Builds pre-computed hourly weather frames (hours 0 to 48) along the trip corridor.
    This enables the frontend forecast slider to update the heatmap at 60fps with zero latency.
    """
    departure_dt = datetime.fromisoformat(departure_iso.replace("Z", "+00:00")).replace(tzinfo=None)
    
    timeline_frames = []

    for hour_offset in range(max_hours + 1):
        target_dt = departure_dt.replace(minute=0, second=0, microsecond=0) + datetime.resolution * 0
        target_hour_str = (departure_dt.replace(minute=0, second=0) + (hour_offset * datetime.resolution * 3600000000 if hasattr(datetime, "resolution") else None) or (datetime.fromtimestamp(departure_dt.timestamp() + hour_offset * 3600))).strftime("%Y-%m-%dT%H:00")

        frame_points = []
        for idx, cp in enumerate(corridor_checkpoints):
            fc = forecasts[idx] if idx < len(forecasts) else {}
            hourly = fc.get("hourly", {})
            times = hourly.get("time", [])

            if target_hour_str in times:
                h_idx = times.index(target_hour_str)
            else:
                h_idx = min(hour_offset, len(times) - 1) if times else 0

            winds = hourly.get("wind_speed_10m", [])
            precips = hourly.get("precipitation", [])
            snows = hourly.get("snowfall", [])

            w_wind = float(winds[h_idx]) if h_idx < len(winds) and winds[h_idx] is not None else 0.0
            w_rain = float(precips[h_idx]) if h_idx < len(precips) and precips[h_idx] is not None else 0.0
            w_snow = float(snows[h_idx]) if h_idx < len(snows) and snows[h_idx] is not None else 0.0

            # Calculate intensity score (0.0 to 1.0) for Leaflet heatmap representation
            # Wind max ~ 60, Rain max ~ 1.5, Snow max ~ 3.5
            intensity = max(
                min(1.0, w_wind / 55.0),
                min(1.0, w_rain / 1.0),
                min(1.0, w_snow / 3.0),
            )

            frame_points.append({
                "lat": cp["lat"],
                "lon": cp["lon"],
                "intensity": round(intensity, 2),
                "wind_mph": round(w_wind, 1),
                "rain_in_hr": round(w_rain, 2),
                "snow_in_hr": round(w_snow, 2),
            })

        timeline_frames.append({
            "hour_offset": hour_offset,
            "forecast_time": target_hour_str,
            "points": frame_points,
        })

    return timeline_frames
