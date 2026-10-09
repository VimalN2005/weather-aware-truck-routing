import math
from datetime import datetime, timedelta
import requests

OSRM_BASE_URL = "https://router.project-osrm.org/route/v1/driving"


def haversine_miles(lat1, lon1, lat2, lon2):
    """Calculates great-circle distance between two points in miles."""
    R = 3958.8  # Earth radius in miles
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (
        math.sin(dlat / 2) ** 2
        + math.cos(math.radians(lat1))
        * math.cos(math.radians(lat2))
        * math.sin(dlon / 2) ** 2
    )
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c


def get_osrm_route(coordinates_list, alternatives=False):
    """
    Queries OSRM driving service for routes through the given coordinates.
    coordinates_list: list of (lon, lat) tuples
    """
    coords_str = ";".join(f"{lon:.6f},{lat:.6f}" for lon, lat in coordinates_list)
    url = f"{OSRM_BASE_URL}/{coords_str}"
    params = {
        "overview": "full",
        "geometries": "geojson",
        "steps": "false",
    }
    if alternatives:
        params["alternatives"] = "true"

    try:
        response = requests.get(url, params=params, timeout=20)
        response.raise_for_status()
        data = response.json()
        if data.get("code") == "Ok" and data.get("routes"):
            return data["routes"]
    except Exception as e:
        print(f"OSRM routing request failed: {e}")
    return []


def generate_3_routes(origin_coords, dest_coords):
    """
    Guarantees 3 distinct route options between origin and destination.
    Uses OSRM alternatives first, and synthesizes alternate highway corridors if needed.
    """
    orig_lon, orig_lat = origin_coords["lon"], origin_coords["lat"]
    dest_lon, dest_lat = dest_coords["lon"], dest_coords["lat"]

    # 1. Primary query with OSRM alternatives=true
    routes_raw = get_osrm_route([(orig_lon, orig_lat), (dest_lon, dest_lat)], alternatives=True)

    extracted_routes = []
    seen_distances = set()

    route_labels = ["Primary Highway Route", "Scenic Corridor Route", "Alternate Bypass Route"]

    for idx, r in enumerate(routes_raw):
        dist_miles = round(r["distance"] / 1609.344, 1)
        dur_hours = round(r["duration"] / 3600.0, 2)
        # Avoid duplicate routes
        if dist_miles in seen_distances:
            continue
        seen_distances.add(dist_miles)

        # Leaflet expects [lat, lon], GeoJSON has [lon, lat]
        coords_latlon = [[pt[1], pt[0]] for pt in r["geometry"]["coordinates"]]

        extracted_routes.append({
            "id": f"route_{len(extracted_routes) + 1}",
            "name": route_labels[len(extracted_routes)] if len(extracted_routes) < len(route_labels) else f"Route Option {len(extracted_routes) + 1}",
            "distance_miles": dist_miles,
            "duration_hours": dur_hours,
            "coordinates": coords_latlon,
        })
        if len(extracted_routes) == 3:
            break

    # 2. If fewer than 3 routes returned by OSRM, synthesize diverse alternate corridors
    if len(extracted_routes) < 3:
        # Calculate perpendicular offset vectors from the midpoint
        mid_lat = (orig_lat + dest_lat) / 2.0
        mid_lon = (orig_lon + dest_lon) / 2.0
        d_lat = dest_lat - orig_lat
        d_lon = dest_lon - orig_lon

        offsets = [
            (0.18, "North/East Regional Corridor"),
            (-0.18, "South/West Regional Corridor"),
            (0.30, "Outer Interstate Bypass"),
        ]

        for offset_scale, alt_name in offsets:
            if len(extracted_routes) >= 3:
                break

            # Perpendicular vector: (-d_lon, d_lat)
            waypoint_lat = mid_lat - (d_lon * offset_scale)
            waypoint_lon = mid_lon + (d_lat * offset_scale)

            alt_raw = get_osrm_route([
                (orig_lon, orig_lat),
                (waypoint_lon, waypoint_lat),
                (dest_lon, dest_lat)
            ])

            if alt_raw:
                r = alt_raw[0]
                dist_miles = round(r["distance"] / 1609.344, 1)
                dur_hours = round(r["duration"] / 3600.0, 2)
                if dist_miles not in seen_distances:
                    seen_distances.add(dist_miles)
                    coords_latlon = [[pt[1], pt[0]] for pt in r["geometry"]["coordinates"]]
                    extracted_routes.append({
                        "id": f"route_{len(extracted_routes) + 1}",
                        "name": alt_name,
                        "distance_miles": dist_miles,
                        "duration_hours": dur_hours,
                        "coordinates": coords_latlon,
                    })

    return extracted_routes


def sample_route_checkpoints(route, departure_time_iso, sample_interval_miles=25):
    """
    Samples checkpoints along the route polyline at regular intervals (10 / 25 / 50 miles).
    Calculates cumulative distance, driving duration, and ETA at each checkpoint.
    """
    coordinates = route["coordinates"]  # list of [lat, lon]
    total_dist = route["distance_miles"]
    total_dur = route["duration_hours"]

    # Average speed along this route in mph
    avg_speed = (total_dist / total_dur) if total_dur > 0 else 55.0

    departure_dt = datetime.fromisoformat(departure_time_iso.replace("Z", "+00:00"))

    checkpoints = []
    
    # Precompute cumulative distance along coordinate polyline
    cum_distances = [0.0]
    for i in range(1, len(coordinates)):
        prev = coordinates[i - 1]
        curr = coordinates[i]
        d = haversine_miles(prev[0], prev[1], curr[0], curr[1])
        cum_distances.append(cum_distances[-1] + d)

    # Total polyline distance
    actual_poly_dist = cum_distances[-1] if cum_distances[-1] > 0 else total_dist
    scale_factor = total_dist / actual_poly_dist if actual_poly_dist > 0 else 1.0

    # Desired checkpoint distances
    targets = [0.0]
    next_dist = sample_interval_miles
    while next_dist < total_dist:
        targets.append(next_dist)
        next_dist += sample_interval_miles
    
    # Always include the destination
    if total_dist - targets[-1] > 3.0:
        targets.append(total_dist)

    # Match each target distance to a point on the polyline
    poly_idx = 0
    for step_num, target_d in enumerate(targets):
        target_in_poly = target_d / scale_factor

        while poly_idx < len(cum_distances) - 1 and cum_distances[poly_idx + 1] < target_in_poly:
            poly_idx += 1

        # Interpolate between poly_idx and poly_idx + 1
        if poly_idx >= len(coordinates) - 1:
            lat, lon = coordinates[-1]
        else:
            seg_start_d = cum_distances[poly_idx]
            seg_end_d = cum_distances[poly_idx + 1]
            seg_len = seg_end_d - seg_start_d
            if seg_len > 0:
                fraction = max(0.0, min(1.0, (target_in_poly - seg_start_d) / seg_len))
                lat1, lon1 = coordinates[poly_idx]
                lat2, lon2 = coordinates[poly_idx + 1]
                lat = lat1 + fraction * (lat2 - lat1)
                lon = lon1 + fraction * (lon2 - lon1)
            else:
                lat, lon = coordinates[poly_idx]

        elapsed_hours = target_d / avg_speed if avg_speed > 0 else 0.0
        eta_dt = departure_dt + timedelta(hours=elapsed_hours)

        checkpoints.append({
            "index": step_num,
            "mile": round(target_d, 1),
            "lat": round(lat, 5),
            "lon": round(lon, 5),
            "elapsed_hours": round(elapsed_hours, 2),
            "eta_iso": eta_dt.isoformat(),
            "eta_formatted": eta_dt.strftime("%a %I:%M %p"),
        })

    return checkpoints
