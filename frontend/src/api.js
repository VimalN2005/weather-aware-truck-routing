import { calculateClientWeatherRoute } from "./clientRouter";

const BACKEND_URL =
  window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
    ? "http://127.0.0.1:8000"
    : "https://weather-truck-api-h7gbneffgewcehbt.centralindia-01.azurewebsites.net";

export async function planWeatherRoute(params) {
  // 1. First attempt to call the Django REST Framework backend
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 7000); // 7s timeout for sleeping server

    const response = await fetch(`${BACKEND_URL}/api/route-plan/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(params),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      return data;
    }
  } catch (err) {
    console.warn(
      "Backend server unreachable or waking up. Engaging high-availability client routing engine:",
      err.message
    );
  }

  // 2. High-Availability Resilient Fallback: Real-time client calculations with Open-Meteo & OSRM
  return await calculateClientWeatherRoute(params);
}
