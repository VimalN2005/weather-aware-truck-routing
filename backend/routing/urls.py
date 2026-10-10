from django.urls import path
from .views import RoutePlanView, HealthCheckView, RouteAuditLogListView

urlpatterns = [
    path("health/", HealthCheckView.as_view(), name="health-check"),
    path("route-plan/", RoutePlanView.as_view(), name="route-plan"),
    path("history/", RouteAuditLogListView.as_view(), name="route-history"),
]
