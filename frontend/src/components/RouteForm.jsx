import React, { useState } from "react";
import {
  Card,
  CardContent,
  Typography,
  TextField,
  MenuItem,
  Button,
  Stack,
  Box,
  InputAdornment,
  CircularProgress,
  Chip,
  Grid,
} from "@mui/material";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import FlagIcon from "@mui/icons-material/Flag";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import ScaleIcon from "@mui/icons-material/Scale";
import TimelineIcon from "@mui/icons-material/Timeline";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";

export default function RouteForm({ onCalculate, loading }) {
  const getInitialDateTime = () => {
    const now = new Date();
    now.setMinutes(0, 0, 0);
    now.setHours(now.getHours() + 1);
    const pad = (n) => String(n).padStart(2, "0");
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
  };

  const [form, setForm] = useState({
    origin: "Dallas, TX",
    destination: "Chicago, IL",
    departure_time: getInitialDateTime(),
    load_weight: 42000,
    sample_interval_miles: 25,
  });

  const presets = [
    {
      name: "Dallas → Chicago",
      origin: "Dallas, TX",
      dest: "Chicago, IL",
      weight: 42000,
    },
    {
      name: "Denver → Salt Lake",
      origin: "Denver, CO",
      dest: "Salt Lake City, UT",
      weight: 35000,
    },
    {
      name: "Atlanta → Miami",
      origin: "Atlanta, GA",
      dest: "Miami, FL",
      weight: 28000,
    },
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.origin.trim() || !form.destination.trim()) return;
    onCalculate(form);
  };

  const applyPreset = (preset) => {
    setForm((prev) => ({
      ...prev,
      origin: preset.origin,
      destination: preset.dest,
      load_weight: preset.weight,
    }));
  };

  const getWeightCategory = (wt) => {
    if (wt > 40000) return { label: "Heavy (>40k lb)", color: "error" };
    if (wt > 30000) return { label: "Medium (>30k lb)", color: "warning" };
    return { label: "Light (≤30k lb)", color: "success" };
  };

  const wtCategory = getWeightCategory(form.load_weight);

  return (
    <Card sx={{ mb: 3 }}>
      <CardContent sx={{ p: { xs: 2.5, md: 3 } }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1.5}>
          <Typography variant="h6" sx={{ fontWeight: 700, color: "#f8fafc" }}>
            Route & Load Parameters
          </Typography>
          <Chip
            size="small"
            label={wtCategory.label}
            color={wtCategory.color}
            variant="outlined"
            sx={{ fontWeight: 700 }}
          />
        </Stack>
        <Typography variant="body2" sx={{ color: "text.secondary", mb: 2 }}>
          Configure origin, destination, load weight, and departure time for multi-route evaluation.
        </Typography>

        {/* Quick Presets */}
        <Box sx={{ mb: 2.5, pb: 2, borderBottom: "1px solid", borderColor: "divider" }}>
          <Typography variant="caption" sx={{ fontWeight: 700, color: "text.secondary", textTransform: "uppercase", display: "block", mb: 1 }}>
            Quick Test Scenarios:
          </Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            {presets.map((p, idx) => (
              <Button
                key={idx}
                size="small"
                variant="outlined"
                onClick={() => applyPreset(p)}
                sx={{
                  borderColor: "#334155",
                  color: "#cbd5e1",
                  fontSize: 12,
                  "&:hover": { borderColor: "#64748b", backgroundColor: "#1e293b" },
                }}
              >
                {p.name} ({p.weight.toLocaleString()} lb)
              </Button>
            ))}
          </Stack>
        </Box>

        <Box component="form" onSubmit={handleSubmit}>
          <Grid container spacing={2}>
            {/* Origin */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                size="small"
                label="Origin Location"
                value={form.origin}
                onChange={(e) => setForm({ ...form, origin: e.target.value })}
                required
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LocationOnIcon sx={{ color: "#10b981", fontSize: 20 }} />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>

            {/* Destination */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                size="small"
                label="Destination Location"
                value={form.destination}
                onChange={(e) => setForm({ ...form, destination: e.target.value })}
                required
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <FlagIcon sx={{ color: "#ef4444", fontSize: 20 }} />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>

            {/* Departure Time */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                size="small"
                label="Departure Date & Time"
                type="datetime-local"
                value={form.departure_time}
                onChange={(e) => setForm({ ...form, departure_time: e.target.value })}
                required
                InputLabelProps={{ shrink: true }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <AccessTimeIcon sx={{ color: "#6366f1", fontSize: 20 }} />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>

            {/* Load Weight */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                size="small"
                label="Load Weight (lbs)"
                type="number"
                inputProps={{ min: 1000, max: 80000, step: 500 }}
                value={form.load_weight}
                onChange={(e) => setForm({ ...form, load_weight: Number(e.target.value) })}
                required
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <ScaleIcon sx={{ color: "#f59e0b", fontSize: 20 }} />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>

            {/* Sampling Interval */}
            <Grid item xs={12}>
              <TextField
                select
                fullWidth
                size="small"
                label="Weather Sampling Resolution"
                value={form.sample_interval_miles}
                onChange={(e) => setForm({ ...form, sample_interval_miles: Number(e.target.value) })}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <TimelineIcon sx={{ color: "#38bdf8", fontSize: 20 }} />
                    </InputAdornment>
                  ),
                }}
              >
                <MenuItem value={10}>Every 10 miles (High resolution)</MenuItem>
                <MenuItem value={25}>Every 25 miles (Standard - Recommended)</MenuItem>
                <MenuItem value={50}>Every 50 miles (Fast transit)</MenuItem>
              </TextField>
            </Grid>
          </Grid>

          <Button
            type="submit"
            fullWidth
            variant="contained"
            disabled={loading}
            size="large"
            sx={{
              mt: 2.5,
              py: 1.4,
              fontWeight: 700,
              fontSize: 15,
              background: "linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)",
              boxShadow: "0 4px 14px rgba(79, 70, 229, 0.4)",
              "&:hover": {
                background: "linear-gradient(135deg, #4338ca 0%, #4f46e5 100%)",
              },
            }}
            startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <PlayArrowIcon />}
          >
            {loading ? "Evaluating 3 Routes & Weather Forecasters..." : "Analyze Routes & Weather Risk"}
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
}
