import requests

NOMINATIM_URL = "https://nominatim.openstreetmap.org/search"
HEADERS = {
    "User-Agent": "WeatherAwareTruckRouter/1.0 (contact@weathertruckrouter.app)"
}

# In-memory geocode cache to avoid redundant API hits and rate limits
_GEOCODE_CACHE = {}


def geocode_location(query: str):
    """
    Geocodes a human-readable location string (e.g. 'Chicago, IL') to {lat, lon, display_name}.
    Uses caching and fallback mechanisms to ensure high reliability.
    """
    cleaned = query.strip()
    if not cleaned:
        return None

    cache_key = cleaned.lower()
    if cache_key in _GEOCODE_CACHE:
        return _GEOCODE_CACHE[cache_key]

    params = {
        "q": cleaned,
        "format": "json",
        "limit": 1,
        "addressdetails": 1,
    }

    try:
        response = requests.get(NOMINATIM_URL, params=params, headers=HEADERS, timeout=12)
        response.raise_for_status()
        data = response.json()

        if not data:
            # Fallback retry without strict details
            params.pop("addressdetails", None)
            res2 = requests.get(NOMINATIM_URL, params=params, headers=HEADERS, timeout=12)
            data = res2.json() if res2.ok else []

        if not data:
            return None

        result = {
            "lat": float(data[0]["lat"]),
            "lon": float(data[0]["lon"]),
            "display_name": data[0].get("display_name", cleaned),
        }

        _GEOCODE_CACHE[cache_key] = result
        return result

    except Exception as e:
        print(f"Geocoding error for '{query}': {e}")
        return None
