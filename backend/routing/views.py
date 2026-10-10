from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.generics import ListAPIView

from .models import RouteAuditLog
from .serializers import RoutePlanRequestSerializer, RouteAuditLogSerializer
from .services.geocoding import geocode_location
from .services.routing_service import generate_3_routes, sample_route_checkpoints
from .services.weather_service import (
    attach_weather_to_checkpoints,
    build_corridor_heatmap_timeline,
)
from .services.risk_engine import analyze_and_rank_routes


class HealthCheckView(APIView):
    def get(self, request):
        return Response({
            "status": "healthy",
            "service": "Weather-Aware Truck Router API",
            "version": "1.0.0",
        })


class RouteAuditLogListView(ListAPIView):
    """
    Returns recent route evaluation logs for auditing and analytics.
    """
    queryset = RouteAuditLog.objects.all()[:20]
    serializer_class = RouteAuditLogSerializer


class RoutePlanView(APIView):
    """
    Evaluates 3 alternative truck routes against real-time weather and load weight limits.
    Validates payload using RoutePlanRequestSerializer and archives calculation into RouteAuditLog.
    """

    def post(self, request):
        serializer = RoutePlanRequestSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(
                {"error": "Validation failed", "details": serializer.errors},
                status=status.HTTP_400_BAD_REQUEST,
            )

        validated_data = serializer.validated_data
        origin_str = validated_data["origin"]
        destination_str = validated_data["destination"]
        departure_dt = validated_data["departure_time"]
        load_weight = validated_data["load_weight"]
        sample_interval = validated_data["sample_interval_miles"]

        departure_iso = departure_dt.isoformat()

        # 1. Geocoding
        origin_coords = geocode_location(origin_str)
        if not origin_coords:
            return Response(
                {"error": f"Could not resolve geocoding coordinates for origin: '{origin_str}'."},
                status=status.HTTP_404_NOT_FOUND,
            )

        dest_coords = geocode_location(destination_str)
        if not dest_coords:
            return Response(
                {"error": f"Could not resolve geocoding coordinates for destination: '{destination_str}'."},
                status=status.HTTP_404_NOT_FOUND,
            )

        # 2. Generate 3 routes
        routes = generate_3_routes(origin_coords, dest_coords)
        if not routes:
            return Response(
                {"error": "Failed to calculate road routes between the specified locations."},
                status=status.HTTP_502_BAD_GATEWAY,
            )

        # 3. Sample checkpoints along all 3 routes
        corridor_checkpoints = []
        corridor_forecasts = []

        for idx, route in enumerate(routes):
            cps = sample_route_checkpoints(route, departure_iso, sample_interval)
            enriched_cps, raw_forecasts = attach_weather_to_checkpoints(cps)
            route["checkpoints"] = enriched_cps

            if idx == 0:
                corridor_checkpoints = cps
                corridor_forecasts = raw_forecasts

        # 4. Evaluate weather risk and rank according to strict PDF priority rules
        ranked_routes = analyze_and_rank_routes(routes, load_weight)

        # 5. Build 0-48 Hour Heatmap Frames along the corridor
        heatmap_timeline = build_corridor_heatmap_timeline(
            corridor_checkpoints, corridor_forecasts, departure_iso, max_hours=48
        )

        recommended_route = next((r for r in ranked_routes if r.get("is_recommended")), ranked_routes[0])

        # 6. Persist audit log to database
        try:
            summary = recommended_route.get("summary", {})
            RouteAuditLog.objects.create(
                origin=origin_str,
                destination=destination_str,
                departure_time=departure_dt,
                load_weight_lb=load_weight,
                sample_interval_miles=sample_interval,
                recommended_route_id=recommended_route.get("id", ""),
                recommended_route_name=recommended_route.get("name", ""),
                recommended_risk_status=summary.get("route_status", ""),
                severe_miles=summary.get("severe_miles", 0.0),
                high_miles=summary.get("high_miles", 0.0),
                average_risk_score=summary.get("average_risk_score", 1.0),
            )
        except Exception as e:
            print(f"Warning: Failed to save RouteAuditLog: {e}")

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
