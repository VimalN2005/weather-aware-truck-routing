from datetime import datetime, timezone
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from .services.geocoding import geocode_location
from .services.routing_service import generate_3_routes, sample_route_checkpoints
from .services.weather_service import (
    attach_weather_to_checkpoints,
    build_corridor_heatmap_timeline,
)
from .services.risk_engine import analyze_and_rank_routes


class HealthCheckView(APIView):
    def get(self, request):
        return Response({"status": "healthy", "service": "Weather-Aware Truck Router API"})


class RoutePlanView(APIView):
    """
    Core Route Planning & Weather Risk Assessment endpoint.
    Accepts:
    - origin: string (e.g. "Dallas, TX")
    - destination: string (e.g. "Chicago, IL")
    - departure_time: ISO string (e.g. "2026-10-10T08:00")
    - load_weight: int/float (lbs, e.g. 35000)
    - sample_interval_miles: 10, 25, or 50 (default: 25)
    """

    def post(self, request):
        origin_str = request.data.get("origin", "").strip()
        destination_str = request.data.get("destination", "").strip()
        departure_iso = request.data.get("departure_time")
        load_weight_raw = request.data.get("load_weight")
        sample_interval = int(request.data.get("sample_interval_miles", 25))

        # 1. Validation
        if not origin_str or not destination_str:
            return Response(
                {"error": "Both origin and destination locations are required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not departure_iso:
            # Default to current UTC time if omitted
            departure_iso = datetime.now(timezone.utc).isoformat()

        try:
            load_weight = float(load_weight_raw) if load_weight_raw is not None else 35000.0
            if load_weight <= 0:
                load_weight = 35000.0
        except (ValueError, TypeError):
            return Response(
                {"error": "Load weight must be a positive number in lbs."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Enforce allowed sampling intervals from requirements
        if sample_interval not in [10, 25, 50]:
            sample_interval = 25

        # 2. Geocoding
        origin_coords = geocode_location(origin_str)
        if not origin_coords:
            return Response(
                {"error": f"Could not find coordinates for origin: '{origin_str}'."},
                status=status.HTTP_404_NOT_FOUND,
            )

        dest_coords = geocode_location(destination_str)
        if not dest_coords:
            return Response(
                {"error": f"Could not find coordinates for destination: '{destination_str}'."},
                status=status.HTTP_404_NOT_FOUND,
            )

        # 3. Generate 3 routes
        routes = generate_3_routes(origin_coords, dest_coords)
        if not routes:
            return Response(
                {"error": "Failed to calculate road routes between the specified locations."},
                status=status.HTTP_502_BAD_GATEWAY,
            )

        # 4. Sample checkpoints along all 3 routes
        corridor_checkpoints = []
        corridor_forecasts = []

        for idx, route in enumerate(routes):
            cps = sample_route_checkpoints(route, departure_iso, sample_interval)
            # Fetch weather & ETAs for checkpoints
            enriched_cps, raw_forecasts = attach_weather_to_checkpoints(cps)
            route["checkpoints"] = enriched_cps

            if idx == 0:
                # Primary corridor used for heatmap slider
                corridor_checkpoints = cps
                corridor_forecasts = raw_forecasts

        # 5. Evaluate weather risk and rank according to strict PDF priority rules
        ranked_routes = analyze_and_rank_routes(routes, load_weight)

        # 6. Build 0-48 Hour Heatmap Frames along the corridor
        heatmap_timeline = build_corridor_heatmap_timeline(
            corridor_checkpoints, corridor_forecasts, departure_iso, max_hours=48
        )

        recommended_route = next((r for r in ranked_routes if r.get("is_recommended")), ranked_routes[0])

        return Response({
            "status": "success",
            "query": {
                "origin": origin_str,
                "destination": destination_str,
                "departure_time": departure_iso,
                "load_weight": load_weight,
                "sample_interval_miles": sample_interval,
            },
            "origin": origin_coords,
            "destination": dest_coords,
            "recommended_route_id": recommended_route["id"],
            "routes": ranked_routes,
            "heatmap_timeline": heatmap_timeline,
        })
