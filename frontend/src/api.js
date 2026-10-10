const BACKEND_URL =
  window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
    ? "http://127.0.0.1:8000"
    : "https://weather-truck-api-h7gbneffgewcehbt.centralindia-01.azurewebsites.net";

export async function planWeatherRoute(params) {
  const response = await fetch(`${BACKEND_URL}/api/route-plan/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(params),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || "Failed to calculate weather-aware route plan.");
  }
  return data;
}
