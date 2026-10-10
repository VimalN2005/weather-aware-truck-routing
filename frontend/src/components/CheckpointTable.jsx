import React, { useState } from "react";
import {
  Card,
  CardContent,
  Typography,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
  Paper,
  Chip,
  ButtonGroup,
  Button,
  Stack,
  Box,
} from "@mui/material";
import FilterListIcon from "@mui/icons-material/FilterList";
import WarningIcon from "@mui/icons-material/Warning";

export default function CheckpointTable({ route }) {
  const [filterLevel, setFilterLevel] = useState("all");

  if (!route || !route.checkpoints || route.checkpoints.length === 0) {
    return null;
  }

  const checkpoints = route.checkpoints;

  const filtered = checkpoints.filter((cp) => {
    if (filterLevel === "all") return true;
    if (filterLevel === "elevated") {
      return ["High", "Severe", "No Travel"].includes(cp.risk.overall_level);
    }
    return cp.risk.overall_level.toLowerCase() === filterLevel.toLowerCase();
  });

  const elevatedCount = checkpoints.filter((cp) =>
    ["High", "Severe", "No Travel"].includes(cp.risk.overall_level)
  ).length;

  return (
    <Card sx={{ my: 3 }}>
      <CardContent sx={{ p: { xs: 2, md: 3 } }}>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          justifyContent="space-between"
          alignItems={{ xs: "flex-start", sm: "center" }}
          gap={2}
          mb={2.5}
        >
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 800, color: "#f8fafc" }}>
              Detailed Checkpoint Weather & Hazard Audit
            </Typography>
            <Typography variant="body2" sx={{ color: "text.secondary" }}>
              Route: <strong>{route.name}</strong> • {checkpoints.length} Checkpoints Sampled by Arrival ETA
            </Typography>
          </Box>

          <ButtonGroup size="small" variant="outlined">
            <Button
              variant={filterLevel === "all" ? "contained" : "outlined"}
              onClick={() => setFilterLevel("all")}
            >
              All Checkpoints ({checkpoints.length})
            </Button>
            <Button
              color="error"
              variant={filterLevel === "elevated" ? "contained" : "outlined"}
              onClick={() => setFilterLevel("elevated")}
              startIcon={<WarningIcon />}
            >
              High & Severe Only ({elevatedCount})
            </Button>
          </ButtonGroup>
        </Stack>

        <TableContainer component={Paper} sx={{ backgroundColor: "#0d1322", border: "1px solid #1f293d", maxHeight: 520 }}>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ backgroundColor: "#1e293b", fontWeight: 700, color: "#f8fafc" }}>#</TableCell>
                <TableCell sx={{ backgroundColor: "#1e293b", fontWeight: 700, color: "#f8fafc" }}>Mile Marker</TableCell>
                <TableCell sx={{ backgroundColor: "#1e293b", fontWeight: 700, color: "#f8fafc" }}>Estimated Arrival (ETA)</TableCell>
                <TableCell sx={{ backgroundColor: "#1e293b", fontWeight: 700, color: "#f8fafc" }}>Weather Condition</TableCell>
                <TableCell sx={{ backgroundColor: "#1e293b", fontWeight: 700, color: "#f8fafc" }}>Wind Speed</TableCell>
                <TableCell sx={{ backgroundColor: "#1e293b", fontWeight: 700, color: "#f8fafc" }}>Rainfall</TableCell>
                <TableCell sx={{ backgroundColor: "#1e293b", fontWeight: 700, color: "#f8fafc" }}>Snowfall</TableCell>
                <TableCell sx={{ backgroundColor: "#1e293b", fontWeight: 700, color: "#f8fafc" }}>Overall Risk</TableCell>
                <TableCell sx={{ backgroundColor: "#1e293b", fontWeight: 700, color: "#f8fafc" }}>Load Rule Alert</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.map((cp) => {
                const r = cp.risk;
                const w = cp.weather;

                return (
                  <TableRow
                    key={cp.index}
                    hover
                    sx={{
                      backgroundColor:
                        r.overall_level === "No Travel"
                          ? "rgba(17, 24, 39, 0.8)"
                          : r.overall_level === "Severe"
                          ? "rgba(239, 68, 68, 0.08)"
                          : r.overall_level === "High"
                          ? "rgba(249, 115, 22, 0.06)"
                          : "transparent",
                    }}
                  >
                    <TableCell sx={{ color: "#64748b", fontWeight: 700 }}>#{cp.index + 1}</TableCell>
                    <TableCell sx={{ color: "#f1f5f9", fontWeight: 700 }}>{cp.mile} mi</TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: "#e2e8f0", fontSize: 13 }}>
                        {cp.eta_formatted}
                      </Typography>
                      <Typography variant="caption" sx={{ color: "#64748b" }}>
                        +{cp.elapsed_hours}h driving
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Typography variant="body2" sx={{ fontSize: 13, color: "#cbd5e1" }}>
                          {w.condition}
                        </Typography>
                        <Chip size="small" label={`${w.temp_f}°F`} sx={{ height: 20, fontSize: 11, backgroundColor: "#1e293b" }} />
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontSize: 13, fontWeight: 600, color: r.wind_level === "Low" ? "#10b981" : "#f59e0b" }}>
                        {w.wind_mph} mph ({r.wind_level})
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontSize: 13, color: "#94a3b8" }}>
                        {w.rain_in_hr} in/hr
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontSize: 13, color: "#94a3b8" }}>
                        {w.snow_in_hr} in/hr
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={`● ${r.overall_level}`}
                        sx={{
                          fontWeight: 700,
                          fontSize: 11,
                          backgroundColor: `${r.color}22`,
                          color: r.color,
                          border: "1px solid",
                          borderColor: r.color,
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      {r.load_rule_applied ? (
                        <Chip
                          size="small"
                          label={`⚠️ ${r.load_rule_applied}`}
                          color="error"
                          variant="outlined"
                          sx={{ fontWeight: 600, fontSize: 11 }}
                        />
                      ) : (
                        <Typography variant="caption" sx={{ color: "#475569" }}>
                          —
                        </Typography>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
    </Card>
  );
}
