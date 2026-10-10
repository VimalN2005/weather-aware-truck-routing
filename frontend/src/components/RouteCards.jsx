import React from "react";
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  Button,
  Stack,
  Divider,
} from "@mui/material";
import StarIcon from "@mui/icons-material/Star";
import NavigationIcon from "@mui/icons-material/Navigation";
import SpeedIcon from "@mui/icons-material/Speed";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";

export default function RouteCards({ routes, selectedRouteId, onSelectRoute }) {
  if (!routes || routes.length === 0) return null;

  return (
    <Box sx={{ my: 3 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 800, color: "#f8fafc" }}>
            3 Alternative Route Options Evaluated
          </Typography>
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            Sorted by preference: 1. Fewest Severe miles → 2. Fewest High miles → 3. Lowest avg risk → 4. Shortest travel time
          </Typography>
        </Box>
      </Stack>

      <Grid container spacing={3}>
        {routes.map((route) => {
          const isSelected = route.id === selectedRouteId;
          const isRec = route.is_recommended;
          const summary = route.summary;

          return (
            <Grid item xs={12} md={4} key={route.id}>
              <Card
                onClick={() => onSelectRoute(route.id)}
                sx={{
                  height: "100%",
                  cursor: "pointer",
                  transition: "all 0.25s ease",
                  position: "relative",
                  border: "2px solid",
                  borderColor: isSelected
                    ? isRec
                      ? "#10b981"
                      : "#6366f1"
                    : isRec
                    ? "#065f46"
                    : "#1f293d",
                  backgroundColor: isSelected ? "#111c38" : "#111827",
                  boxShadow: isSelected
                    ? isRec
                      ? "0 0 25px rgba(16, 185, 129, 0.25)"
                      : "0 0 25px rgba(99, 102, 241, 0.25)"
                    : "0 8px 20px rgba(0,0,0,0.3)",
                  "&:hover": {
                    transform: "translateY(-3px)",
                    borderColor: isRec ? "#10b981" : "#4f46e5",
                  },
                }}
              >
                <CardContent sx={{ p: 2.5, display: "flex", flexDirection: "column", height: "100%", gap: 2 }}>
                  {/* Top Badges */}
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Chip
                      size="small"
                      icon={isRec ? <StarIcon sx={{ fontSize: "15px !important", color: "#34d399 !important" }} /> : undefined}
                      label={route.recommendation_badge}
                      sx={{
                        fontWeight: 700,
                        fontSize: 11,
                        backgroundColor: isRec ? "rgba(16, 185, 129, 0.2)" : "#1e293b",
                        color: isRec ? "#34d399" : "#94a3b8",
                        border: "1px solid",
                        borderColor: isRec ? "#10b981" : "#334155",
                      }}
                    />

                    <Chip
                      size="small"
                      label={summary.route_status}
                      sx={{
                        fontWeight: 700,
                        fontSize: 11,
                        backgroundColor: `${summary.route_status_color}22`,
                        color: summary.route_status_color,
                        border: "1px solid",
                        borderColor: summary.route_status_color,
                      }}
                    />
                  </Stack>

                  {/* Route Title */}
                  <Typography variant="h6" sx={{ fontWeight: 700, fontSize: 17, color: "#f8fafc" }}>
                    {route.name}
                  </Typography>

                  {/* Metrics Row */}
                  <Box
                    sx={{
                      display: "grid",
                      gridTemplateColumns: "repeat(3, 1fr)",
                      backgroundColor: "#0d1322",
                      border: "1px solid #1f293d",
                      borderRadius: 2,
                      p: 1.5,
                      textAlign: "center",
                    }}
                  >
                    <Box>
                      <Typography variant="caption" sx={{ color: "text.secondary", display: "block" }}>
                        Distance
                      </Typography>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "#f1f5f9" }}>
                        {route.distance_miles.toLocaleString()} mi
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" sx={{ color: "text.secondary", display: "block" }}>
                        Duration
                      </Typography>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "#f1f5f9" }}>
                        {route.duration_hours} hrs
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" sx={{ color: "text.secondary", display: "block" }}>
                        Avg Risk
                      </Typography>
                      <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "#38bdf8" }}>
                        {summary.average_risk_score} <span style={{ fontSize: 10, color: "#64748b" }}>/ 5.0</span>
                      </Typography>
                    </Box>
                  </Box>

                  {/* Mileage Distribution Bar */}
                  <Box sx={{ mt: "auto" }}>
                    <Stack direction="row" justifyContent="space-between" mb={0.5}>
                      <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 600 }}>
                        Risk Mileage Breakdown
                      </Typography>
                      <Typography variant="caption" sx={{ color: "text.secondary" }}>
                        {summary.total_checkpoints} checkpoints
                      </Typography>
                    </Stack>

                    <Box sx={{ height: 8, width: "100%", borderRadius: 1, backgroundColor: "#1e293b", overflow: "hidden", display: "flex" }}>
                      {summary.low_miles > 0 && (
                        <Box sx={{ height: "100%", backgroundColor: "#10b981", width: `${(summary.low_miles / route.distance_miles) * 100}%` }} />
                      )}
                      {summary.moderate_miles > 0 && (
                        <Box sx={{ height: "100%", backgroundColor: "#f59e0b", width: `${(summary.moderate_miles / route.distance_miles) * 100}%` }} />
                      )}
                      {summary.high_miles > 0 && (
                        <Box sx={{ height: "100%", backgroundColor: "#f97316", width: `${(summary.high_miles / route.distance_miles) * 100}%` }} />
                      )}
                      {summary.severe_miles > 0 && (
                        <Box sx={{ height: "100%", backgroundColor: "#ef4444", width: `${(summary.severe_miles / route.distance_miles) * 100}%` }} />
                      )}
                    </Box>

                    <Stack direction="row" justifyContent="space-between" mt={1}>
                      <Typography variant="caption" sx={{ fontSize: 10, color: "#10b981" }}>Low: {summary.low_miles} mi</Typography>
                      <Typography variant="caption" sx={{ fontSize: 10, color: "#f59e0b" }}>Mod: {summary.moderate_miles} mi</Typography>
                      <Typography variant="caption" sx={{ fontSize: 10, color: "#f97316" }}>High: {summary.high_miles} mi</Typography>
                      <Typography variant="caption" sx={{ fontSize: 10, color: "#ef4444" }}>Sev: {summary.severe_miles} mi</Typography>
                    </Stack>
                  </Box>

                  <Button
                    fullWidth
                    variant={isSelected ? "contained" : "outlined"}
                    color={isRec ? "success" : "primary"}
                    size="small"
                    startIcon={<NavigationIcon sx={{ fontSize: 16 }} />}
                    sx={{ mt: 1, fontWeight: 700 }}
                  >
                    {isSelected ? "Active on Map ✓" : "Inspect Route on Map"}
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>
    </Box>
  );
}
