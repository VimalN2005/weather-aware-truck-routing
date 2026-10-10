import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  Typography,
  Slider,
  Button,
  Stack,
  Box,
  Chip,
} from "@mui/material";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import PauseIcon from "@mui/icons-material/Pause";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import AccessTimeIcon from "@mui/icons-material/AccessTime";

export default function ForecastSlider({ currentHour, onHourChange, departureTimeIso }) {
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    let interval = null;
    if (isPlaying) {
      interval = setInterval(() => {
        onHourChange((prev) => (prev >= 48 ? 0 : prev + 1));
      }, 350);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlaying, onHourChange]);

  const getForecastTimestamp = (hourOffset) => {
    if (!departureTimeIso) return `+${hourOffset}h`;
    try {
      const dt = new Date(departureTimeIso);
      dt.setHours(dt.getHours() + hourOffset);
      return dt.toLocaleString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "numeric",
      });
    } catch {
      return `+${hourOffset} Hours`;
    }
  };

  const sliderMarks = [
    { value: 0, label: "0h (Dep)" },
    { value: 12, label: "+12h" },
    { value: 24, label: "+24h (Day 2)" },
    { value: 36, label: "+36h" },
    { value: 48, label: "+48h (Day 3)" },
  ];

  return (
    <Card sx={{ mb: 2.5, backgroundColor: "#0f172a", borderColor: "#334155" }}>
      <CardContent sx={{ p: 2.5, "&:last-child": { pb: 2.5 } }}>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          justifyContent="space-between"
          alignItems={{ xs: "flex-start", sm: "center" }}
          gap={1.5}
          mb={2}
        >
          <Stack direction="row" spacing={1.5} alignItems="center">
            <AccessTimeIcon sx={{ color: "#6366f1", fontSize: 24 }} />
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 800, color: "#f8fafc" }}>
                Trip Corridor Forecast Heatmap Slider (0–48 Hours)
              </Typography>
              <Typography variant="caption" sx={{ color: "text.secondary" }}>
                Scrub through the 48-hour timeline or play radar animation to inspect evolving weather hazards.
              </Typography>
            </Box>
          </Stack>

          <Chip
            label={`Hour +${currentHour} • ${getForecastTimestamp(currentHour)}`}
            color="primary"
            sx={{ fontWeight: 700, fontSize: 12, px: 1 }}
          />
        </Stack>

        <Stack direction={{ xs: "column", sm: "row" }} spacing={3} alignItems="center">
          <Button
            variant="contained"
            size="small"
            color={isPlaying ? "error" : "primary"}
            onClick={() => setIsPlaying(!isPlaying)}
            startIcon={isPlaying ? <PauseIcon /> : <PlayArrowIcon />}
            sx={{ minWidth: 150, fontWeight: 700 }}
          >
            {isPlaying ? "Pause Radar" : "Play Radar Loop"}
          </Button>

          <Box sx={{ flex: 1, width: "100%", px: 2 }}>
            <Slider
              value={currentHour}
              min={0}
              max={48}
              step={1}
              marks={sliderMarks}
              valueLabelDisplay="auto"
              valueLabelFormat={(val) => `+${val}h`}
              onChange={(e, val) => {
                setIsPlaying(false);
                onHourChange(val);
              }}
              sx={{
                color: "#6366f1",
                "& .MuiSlider-thumb": {
                  boxShadow: "0 0 10px rgba(99, 102, 241, 0.6)",
                },
                "& .MuiSlider-markLabel": {
                  fontSize: 11,
                  color: "#64748b",
                },
              }}
            />
          </Box>

          <Button
            variant="outlined"
            size="small"
            onClick={() => {
              setIsPlaying(false);
              onHourChange(0);
            }}
            startIcon={<RestartAltIcon />}
            sx={{ borderColor: "#334155", color: "#94a3b8", whiteSpace: "nowrap" }}
          >
            Reset 0h
          </Button>
        </Stack>
      </CardContent>
    </Card>
  );
}
