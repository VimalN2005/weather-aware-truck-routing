from django.test import TestCase
from .services.risk_engine import (
    classify_wind_risk,
    classify_rain_risk,
    classify_snow_risk,
    evaluate_checkpoint_risk,
    analyze_and_rank_routes,
)


class RiskEngineTests(TestCase):
    def test_wind_thresholds_base(self):
        """Tests standard wind thresholds without load weight triggers."""
        # Low < 25
        self.assertEqual(classify_wind_risk(15)[0], "Low")
        self.assertEqual(classify_wind_risk(24.9)[0], "Low")

        # Moderate 25-34
        self.assertEqual(classify_wind_risk(25)[0], "Moderate")
        self.assertEqual(classify_wind_risk(34)[0], "Moderate")

        # High 35-44 (light load <= 40,000 lb)
        self.assertEqual(classify_wind_risk(35, 30000)[0], "High")
        self.assertEqual(classify_wind_risk(44, 39999)[0], "High")

        # Severe 45-54 (light load <= 30,000 lb)
        self.assertEqual(classify_wind_risk(45, 25000)[0], "Severe")
        self.assertEqual(classify_wind_risk(54, 30000)[0], "Severe")

        # No Travel >= 55 (any load)
        self.assertEqual(classify_wind_risk(55, 10000)[0], "No Travel")
        self.assertEqual(classify_wind_risk(65, 50000)[0], "No Travel")

    def test_load_weight_rules(self):
        """
        Tests specific load rules from PDF:
        - >=55 mph -> No Travel for any load
        - 45-54 mph + >30,000 lb -> No Travel
        - 35-44 mph + >40,000 lb -> Severe
        """
        # Rule 1: >=55 mph -> No Travel for any load
        level, note = classify_wind_risk(55, 15000)
        self.assertEqual(level, "No Travel")
        self.assertIsNotNone(note)

        # Rule 2: 45-54 mph + >30,000 lb -> No Travel
        level_heavy, note_heavy = classify_wind_risk(48, 35000)
        self.assertEqual(level_heavy, "No Travel")
        self.assertIn(">30k lb", note_heavy)

        # But 45-54 mph with <=30,000 lb stays Severe
        level_light, note_light = classify_wind_risk(48, 28000)
        self.assertEqual(level_light, "Severe")
        self.assertIsNone(note_light)

        # Rule 3: 35-44 mph + >40,000 lb -> Severe
        level_overweight, note_over = classify_wind_risk(40, 45000)
        self.assertEqual(level_overweight, "Severe")
        self.assertIn(">40k lb", note_over)

        # But 35-44 mph with <=40,000 lb stays High
        level_standard, note_std = classify_wind_risk(40, 38000)
        self.assertEqual(level_standard, "High")
        self.assertIsNone(note_std)

    def test_rain_thresholds(self):
        """Tests rain thresholds: <0.10: Low, 0.10-0.25: Mod, 0.25-0.50: High, 0.50-1.00: Severe, >1.00: No Travel"""
        self.assertEqual(classify_rain_risk(0.05), "Low")
        self.assertEqual(classify_rain_risk(0.15), "Moderate")
        self.assertEqual(classify_rain_risk(0.35), "High")
        self.assertEqual(classify_rain_risk(0.75), "Severe")
        self.assertEqual(classify_rain_risk(1.25), "No Travel")

    def test_snow_thresholds(self):
        """Tests snow thresholds: <0.5: Low, 0.5-1.0: Mod, 1.0-2.0: High, 2.0-3.0: Severe, >3.0: No Travel"""
        self.assertEqual(classify_snow_risk(0.2), "Low")
        self.assertEqual(classify_snow_risk(0.8), "Moderate")
        self.assertEqual(classify_snow_risk(1.5), "High")
        self.assertEqual(classify_snow_risk(2.5), "Severe")
        self.assertEqual(classify_snow_risk(3.5), "No Travel")

    def test_checkpoint_max_risk_aggregation(self):
        """Tests that overall checkpoint risk takes the highest severity across all factors."""
        # Wind Low, Rain High (0.35), Snow Low -> Overall should be High
        weather1 = {"wind_mph": 10, "rain_in_hr": 0.35, "snow_in_hr": 0.1}
        res1 = evaluate_checkpoint_risk(weather1, load_weight_lb=25000)
        self.assertEqual(res1["overall_level"], "High")

        # Wind 48 mph + load 35000 lb -> No Travel, even if rain and snow are 0
        weather2 = {"wind_mph": 48, "rain_in_hr": 0.0, "snow_in_hr": 0.0}
        res2 = evaluate_checkpoint_risk(weather2, load_weight_lb=35000)
        self.assertEqual(res2["overall_level"], "No Travel")

    def test_route_recommendation_priority(self):
        """
        Tests the 4-tier recommendation preference order:
        1. Fewest Severe miles
        2. Fewest High miles
        3. Lowest average risk
        4. Shortest travel times
        """
        # Route A: Has 50 miles of Severe
        route_a = {
            "id": "A",
            "name": "Route A",
            "distance_miles": 100,
            "duration_hours": 2.0,
            "checkpoints": [
                {"lat": 30, "lon": -90, "weather": {"wind_mph": 50, "rain_in_hr": 0, "snow_in_hr": 0}}, # Severe (<=30k lb)
                {"lat": 31, "lon": -91, "weather": {"wind_mph": 10, "rain_in_hr": 0, "snow_in_hr": 0}}, # Low
            ]
        }

        # Route B: Has 0 Severe miles, but 50 miles of High
        route_b = {
            "id": "B",
            "name": "Route B",
            "distance_miles": 110,
            "duration_hours": 2.2,
            "checkpoints": [
                {"lat": 30, "lon": -90, "weather": {"wind_mph": 38, "rain_in_hr": 0, "snow_in_hr": 0}}, # High
                {"lat": 31, "lon": -91, "weather": {"wind_mph": 10, "rain_in_hr": 0, "snow_in_hr": 0}}, # Low
            ]
        }

        # Route B must be preferred over Route A because it has 0 Severe miles
        ranked = analyze_and_rank_routes([route_a, route_b], load_weight_lb=25000)
        self.assertEqual(ranked[0]["id"], "B")
        self.assertTrue(ranked[0]["is_recommended"])
