RISK_LEVELS = {
    "Low": 1,
    "Moderate": 2,
    "High": 3,
    "Severe": 4,
    "No Travel": 5,
}

RISK_COLORS = {
    "Low": "#10b981",       # Emerald Green
    "Moderate": "#f59e0b",  # Amber Yellow
    "High": "#f97316",      # Orange
    "Severe": "#ef4444",    # Red
    "No Travel": "#111827",  # Black / Charcoal
}

LEVEL_BY_SCORE = {v: k for k, v in RISK_LEVELS.items()}


def classify_wind_risk(wind_mph, load_weight_lb=None):
    """
    Classifies wind risk according to speed and truck load weight:
    - Base wind thresholds:
      <25: Low, 25-34: Moderate, 35-44: High, 45-54: Severe, >=55: No Travel
    - Load rules:
      >=55 mph -> No Travel for any load
      45-54 mph + >30,000 lb -> No Travel
      35-44 mph + >40,000 lb -> Severe
    """
    # 1. Base classification
    if wind_mph < 25.0:
        base_level = "Low"
    elif wind_mph <= 34.0:
        base_level = "Moderate"
    elif wind_mph <= 44.0:
        base_level = "High"
    elif wind_mph <= 54.0:
        base_level = "Severe"
    else:
        base_level = "No Travel"

    # 2. Apply load weight modifications
    final_level = base_level
    load_triggered = None

    if wind_mph >= 55.0:
        final_level = "No Travel"
        load_triggered = "Wind >= 55 mph forces No Travel for any load weight"
    elif 45.0 <= wind_mph <= 54.0:
        if load_weight_lb and load_weight_lb > 30000:
            final_level = "No Travel"
            load_triggered = f"Wind {wind_mph} mph with {load_weight_lb:,} lb load (>30k lb) elevates risk to No Travel"
        else:
            final_level = "Severe"
    elif 35.0 <= wind_mph <= 44.0:
        if load_weight_lb and load_weight_lb > 40000:
            final_level = "Severe"
            load_triggered = f"Wind {wind_mph} mph with {load_weight_lb:,} lb load (>40k lb) elevates risk to Severe"
        else:
            final_level = "High"

    return final_level, load_triggered


def classify_rain_risk(rain_in_hr):
    """
    Rain classification:
    <0.10: Low, 0.10-0.25: Moderate, 0.25-0.50: High, 0.50-1.00: Severe, >1.00: No Travel
    """
    if rain_in_hr < 0.10:
        return "Low"
    elif rain_in_hr <= 0.25:
        return "Moderate"
    elif rain_in_hr <= 0.50:
        return "High"
    elif rain_in_hr <= 1.00:
        return "Severe"
    else:
        return "No Travel"


def classify_snow_risk(snow_in_hr):
    """
    Snow classification:
    <0.5: Low, 0.5-1.0: Moderate, 1.0-2.0: High, 2.0-3.0: Severe, >3.0: No Travel
    """
    if snow_in_hr < 0.5:
        return "Low"
    elif snow_in_hr <= 1.0:
        return "Moderate"
    elif snow_in_hr <= 2.0:
        return "High"
    elif snow_in_hr <= 3.0:
        return "Severe"
    else:
        return "No Travel"


def evaluate_checkpoint_risk(weather_data, load_weight_lb):
    """
    Evaluates weather risk at a single checkpoint combining Wind, Rain, Snow, and Load Weight.
    Overall risk is the maximum severity level among all factors.
    """
    wind_mph = weather_data.get("wind_mph", 0.0)
    rain_in_hr = weather_data.get("rain_in_hr", 0.0)
    snow_in_hr = weather_data.get("snow_in_hr", 0.0)

    wind_level, load_note = classify_wind_risk(wind_mph, load_weight_lb)
    rain_level = classify_rain_risk(rain_in_hr)
    snow_level = classify_snow_risk(snow_in_hr)

    # Convert to numeric scores to find maximum
    wind_score = RISK_LEVELS[wind_level]
    rain_score = RISK_LEVELS[rain_level]
    snow_score = RISK_LEVELS[snow_level]

    overall_score = max(wind_score, rain_score, snow_score)
    overall_level = LEVEL_BY_SCORE[overall_score]

    # Determine primary contributing hazard factor
    hazards = []
    if wind_score == overall_score and wind_score > 1:
        hazards.append(f"Wind ({wind_mph} mph)")
    if rain_score == overall_score and rain_score > 1:
        hazards.append(f"Rain ({rain_in_hr} in/hr)")
    if snow_score == overall_score and snow_score > 1:
        hazards.append(f"Snow ({snow_in_hr} in/hr)")

    primary_hazard = ", ".join(hazards) if hazards else "Normal Conditions"

    return {
        "overall_level": overall_level,
        "overall_score": overall_score,
        "color": RISK_COLORS[overall_level],
        "wind_level": wind_level,
        "rain_level": rain_level,
        "snow_level": snow_level,
        "primary_hazard": primary_hazard,
        "load_rule_applied": load_note,
    }


def analyze_and_rank_routes(routes, load_weight_lb):
    """
    Analyzes risk along each route's checkpoints and ranks them according to the PDF recommendation rules:
    Prefer:
    1. Fewest Severe miles (including No Travel miles)
    2. Fewest High miles
    3. Lowest average risk
    4. Shortest travel times
    """
    analyzed_routes = []

    for route in routes:
        checkpoints = route.get("checkpoints", [])
        total_dist = route.get("distance_miles", 0.0)

        if not checkpoints:
            continue

        num_intervals = max(1, len(checkpoints) - 1)
        miles_per_cp = total_dist / num_intervals

        # Initialize mileage distribution by risk level
        dist_by_level = {level: 0.0 for level in RISK_LEVELS}
        total_score = 0

        evaluated_checkpoints = []
        for cp in checkpoints:
            eval_result = evaluate_checkpoint_risk(cp["weather"], load_weight_lb)
            evaluated_cp = {
                **cp,
                "risk": eval_result,
            }
            evaluated_checkpoints.append(evaluated_cp)

            level = eval_result["overall_level"]
            dist_by_level[level] += miles_per_cp
            total_score += eval_result["overall_score"]

        # Adjust total miles
        for lvl in dist_by_level:
            dist_by_level[lvl] = round(min(total_dist, dist_by_level[lvl]), 1)

        # Severe + No Travel miles
        severe_and_worse_miles = round(dist_by_level["Severe"] + dist_by_level["No Travel"], 1)
        high_miles = round(dist_by_level["High"], 1)
        moderate_miles = round(dist_by_level["Moderate"], 1)
        low_miles = round(dist_by_level["Low"], 1)

        avg_risk_score = round(total_score / len(checkpoints), 2)

        # Dominant overall route risk classification
        if dist_by_level["No Travel"] > 0:
            route_status = "No Travel Warning"
            route_status_color = RISK_COLORS["No Travel"]
        elif dist_by_level["Severe"] > 0:
            route_status = "Severe Weather Alert"
            route_status_color = RISK_COLORS["Severe"]
        elif dist_by_level["High"] > 0:
            route_status = "High Caution"
            route_status_color = RISK_COLORS["High"]
        elif dist_by_level["Moderate"] > 0:
            route_status = "Moderate Caution"
            route_status_color = RISK_COLORS["Moderate"]
        else:
            route_status = "Safe Travel"
            route_status_color = RISK_COLORS["Low"]

        analyzed_route = {
            **route,
            "checkpoints": evaluated_checkpoints,
            "summary": {
                "severe_miles": severe_and_worse_miles,
                "high_miles": high_miles,
                "moderate_miles": moderate_miles,
                "low_miles": low_miles,
                "average_risk_score": avg_risk_score,
                "route_status": route_status,
                "route_status_color": route_status_color,
                "total_checkpoints": len(evaluated_checkpoints),
            },
            # Sort tuple based on the 4 preference criteria
            "_sort_key": (
                severe_and_worse_miles,  # 1. Fewest Severe miles
                high_miles,              # 2. Fewest High miles
                avg_risk_score,          # 3. Lowest average risk
                route["duration_hours"], # 4. Shortest travel times
            ),
        }
        analyzed_routes.append(analyzed_route)

    # Sort routes by the 4-tier recommendation priority
    analyzed_routes.sort(key=lambda r: r["_sort_key"])

    # Assign recommendation labels
    for idx, r in enumerate(analyzed_routes):
        r["is_recommended"] = (idx == 0)
        r["recommendation_rank"] = idx + 1
        if idx == 0:
            r["recommendation_badge"] = "Recommended - Safest Route"
        elif idx == 1:
            r["recommendation_badge"] = "Alternative Option 2"
        else:
            r["recommendation_badge"] = "Alternative Option 3"

        # Remove temporary sorting key
        r.pop("_sort_key", None)

    return analyzed_routes
