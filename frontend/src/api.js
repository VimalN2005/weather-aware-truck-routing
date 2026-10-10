import { calculateClientWeatherRoute } from "./clientRouter";

export async function planWeatherRoute(params) {
  const isLocal =
    typeof window !== "undefined" &&
    (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");

  // 1. If running locally with Django running, attempt local API
  if (isLocal) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);

      const response = await fetch("http://127.0.0.1:8000/api/route-plan/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(params),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (response.ok) {
        return await response.json();
      }
    } catch {
      // Fall through to resilient high-speed client engine
    }
  }

  // 2. High-Availability Live Engine: calculates directly in-browser using Open-Meteo & OSRM
  return await calculateClientWeatherRoute(params);
}
