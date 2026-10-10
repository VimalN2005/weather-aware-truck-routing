import React from "react";
import { Box, Typography, Chip, Stack } from "@mui/material";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import CloudIcon from "@mui/icons-material/Cloud";
import VerifiedIcon from "@mui/icons-material/Verified";

export default function Header() {
  return (
    <Box
      component="header"
      sx={{
        py: 2,
        px: { xs: 2, md: 4 },
        backgroundColor: "rgba(17, 24, 39, 0.9)",
        backdropFilter: "blur(12px)",
        borderBottom: "1px solid",
        borderColor: "divider",
        position: "sticky",
        top: 0,
        zIndex: 1100,
        display: "flex",
        flexDirection: { xs: "column", sm: "row" },
        justifyContent: "space-between",
        alignItems: { xs: "flex-start", sm: "center" },
        gap: 2,
      }}
    >
      <Stack direction="row" spacing={2} alignItems="center">
        <Box
          sx={{
            width: 48,
            height: 48,
            borderRadius: 2.5,
            background: "linear-gradient(135deg, #312e81 0%, #4338ca 100%)",
            border: "1px solid #6366f1",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 0 16px rgba(99, 102, 241, 0.35)",
          }}
        >
          <LocalShippingIcon sx={{ color: "#ffffff", fontSize: 26 }} />
        </Box>

        <Box>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Typography variant="h6" sx={{ fontWeight: 800, color: "#f8fafc" }}>
              Weather-Aware Truck Router
            </Typography>
            <Chip
              label="Spotter Assessment"
              size="small"
              sx={{
                height: 22,
                fontSize: 10,
                fontWeight: 700,
                backgroundColor: "rgba(99, 102, 241, 0.15)",
                color: "#a5b4fc",
                border: "1px solid #6366f1",
              }}
            />
          </Stack>
          <Typography variant="caption" sx={{ color: "text.secondary", display: "block" }}>
            3-Route Multi-Criteria Evaluation • ETA Checkpoint Weather • FMCSA Load Weight Compliance
          </Typography>
        </Box>
      </Stack>

      <Stack direction="row" spacing={1.5} alignItems="center">
        <Chip
          icon={<CloudIcon sx={{ fontSize: "16px !important", color: "#10b981 !important" }} />}
          label="Open-Meteo & OSRM Live"
          variant="outlined"
          size="small"
          sx={{ borderColor: "#1f293d", color: "#94a3b8", fontSize: 12 }}
        />
        <Chip
          icon={<VerifiedIcon sx={{ fontSize: "16px !important", color: "#38bdf8 !important" }} />}
          label="Risk Engine Active"
          variant="outlined"
          size="small"
          sx={{ borderColor: "#1f293d", color: "#94a3b8", fontSize: 12 }}
        />
      </Stack>
    </Box>
  );
}
