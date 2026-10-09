from django.urls import path
from .views import RoutePlanView, HealthCheckView

urlpatterns = [
    path("health/", HealthCheckView.as_view(), name="health-check"),
    path("route-plan/", RoutePlanView.as_view(), name="route-plan"),
]
