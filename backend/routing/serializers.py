from rest_framework import serializers
from django.utils import timezone
from .models import RouteAuditLog


class RoutePlanRequestSerializer(serializers.Serializer):
    """
    Validates user input parameters for calculating weather-aware truck routes.
    Includes strict validation on location strings, departure timestamp, load weight, and sampling intervals.
    """
    origin = serializers.CharField(
        max_length=255,
        required=True,
        error_messages={
            "required": "Origin location is required.",
            "blank": "Origin location cannot be blank.",
        },
    )
    destination = serializers.CharField(
        max_length=255,
        required=True,
        error_messages={
            "required": "Destination location is required.",
            "blank": "Destination location cannot be blank.",
        },
    )
    departure_time = serializers.DateTimeField(
        required=False,
        default=timezone.now,
        error_messages={
            "invalid": "Please provide a valid ISO format date/time string.",
        },
    )
    load_weight = serializers.IntegerField(
        required=False,
        default=35000,
        min_value=1000,
        max_value=80000,
        error_messages={
            "min_value": "Load weight must be at least 1,000 lbs.",
            "max_value": "Load weight cannot exceed the legal federal highway limit of 80,000 lbs.",
        },
    )
    sample_interval_miles = serializers.ChoiceField(
        choices=[10, 25, 50],
        default=25,
        error_messages={
            "invalid_choice": "Sampling interval must be one of: 10, 25, or 50 miles.",
        },
    )

    def validate(self, attrs):
        origin = attrs.get("origin", "").strip()
        destination = attrs.get("destination", "").strip()

        if origin.lower() == destination.lower():
            raise serializers.ValidationError({
                "destination": "Origin and destination locations must be distinct."
            })

        attrs["origin"] = origin
        attrs["destination"] = destination
        return attrs


class RouteAuditLogSerializer(serializers.ModelSerializer):
    """
    Serializes audit logs of previously calculated routes.
    """
    class Meta:
        model = RouteAuditLog
        fields = "__all__"
