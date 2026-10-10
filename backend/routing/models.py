from django.db import models


class RouteAuditLog(models.Model):
    """
    Stores an audit trail of requested routes, input parameters,
    and the evaluated risk recommendation for operational logging.
    """
    origin = models.CharField(max_length=255)
    destination = models.CharField(max_length=255)
    departure_time = models.DateTimeField()
    load_weight_lb = models.PositiveIntegerField(help_text="Truck load weight in pounds")
    sample_interval_miles = models.PositiveSmallIntegerField(default=25)
    
    recommended_route_id = models.CharField(max_length=50, blank=True)
    recommended_route_name = models.CharField(max_length=150, blank=True)
    recommended_risk_status = models.CharField(max_length=50, blank=True)
    severe_miles = models.FloatField(default=0.0)
    high_miles = models.FloatField(default=0.0)
    average_risk_score = models.FloatField(default=1.0)
    
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "Route Audit Log"
        verbose_name_plural = "Route Audit Logs"

    def __str__(self):
        return f"{self.origin} -> {self.destination} ({self.load_weight_lb:,} lbs) - {self.created_at.strftime('%Y-%m-%d %H:%M')}"
