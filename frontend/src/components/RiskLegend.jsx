import React from "react";
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
  Paper,
  Box,
  Stack,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import RuleIcon from "@mui/icons-material/Rule";

export default function RiskLegend() {
  return (
    <Accordion
      sx={{
        backgroundColor: "#111827",
        border: "1px solid #1f293d",
        borderRadius: "14px !important",
        "&:before": { display: "none" },
      }}
    >
      <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: "#94a3b8" }} />}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <RuleIcon sx={{ color: "#6366f1", fontSize: 22 }} />
          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "#f8fafc" }}>
            Assessment Risk Matrix & Load Rules (Click to View)
          </Typography>
        </Stack>
      </AccordionSummary>

      <AccordionDetails sx={{ pt: 0, px: 2.5, pb: 2.5 }}>
        <TableContainer component={Paper} sx={{ backgroundColor: "#0d1322", border: "1px solid #1f293d", mb: 2 }}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ backgroundColor: "#1e293b" }}>
                <TableCell sx={{ color: "#f8fafc", fontWeight: 700 }}>Condition</TableCell>
                <TableCell align="center" sx={{ color: "#10b981", fontWeight: 700 }}>Low</TableCell>
                <TableCell align="center" sx={{ color: "#f59e0b", fontWeight: 700 }}>Moderate</TableCell>
                <TableCell align="center" sx={{ color: "#f97316", fontWeight: 700 }}>High</TableCell>
                <TableCell align="center" sx={{ color: "#ef4444", fontWeight: 700 }}>Severe</TableCell>
                <TableCell align="center" sx={{ color: "#fca5a5", fontWeight: 700 }}>No Travel</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, color: "#94a3b8" }}>Wind</TableCell>
                <TableCell align="center">&lt; 25 mph</TableCell>
                <TableCell align="center">25 – 34 mph</TableCell>
                <TableCell align="center">35 – 44 mph</TableCell>
                <TableCell align="center">45 – 54 mph</TableCell>
                <TableCell align="center">≥ 55 mph</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, color: "#94a3b8" }}>Rain</TableCell>
                <TableCell align="center">&lt; 0.10 in/hr</TableCell>
                <TableCell align="center">0.10 – 0.25</TableCell>
                <TableCell align="center">0.25 – 0.50</TableCell>
                <TableCell align="center">0.50 – 1.00</TableCell>
                <TableCell align="center">&gt; 1.00 in/hr</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, color: "#94a3b8" }}>Snow</TableCell>
                <TableCell align="center">&lt; 0.5 in/hr</TableCell>
                <TableCell align="center">0.5 – 1.0</TableCell>
                <TableCell align="center">1.0 – 2.0</TableCell>
                <TableCell align="center">2.0 – 3.0</TableCell>
                <TableCell align="center">&gt; 3.0 in/hr</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>

        <Box sx={{ p: 2, borderRadius: 2, backgroundColor: "#0d1322", border: "1px solid #1e293b" }}>
          <Typography variant="caption" sx={{ fontWeight: 700, color: "#38bdf8", display: "block", mb: 0.5 }}>
            ⚖️ LOAD WEIGHT RULES IMPLEMENTED:
          </Typography>
          <Typography variant="body2" sx={{ fontSize: 12, color: "#94a3b8", mb: 0.5 }}>
            • <strong>≥ 55 mph Wind:</strong> Evaluates to <code>No Travel</code> for all truck loads.
          </Typography>
          <Typography variant="body2" sx={{ fontSize: 12, color: "#94a3b8", mb: 0.5 }}>
            • <strong>45–54 mph Wind + &gt;30,000 lb Load:</strong> Elevated to <code>No Travel</code> (blowover risk).
          </Typography>
          <Typography variant="body2" sx={{ fontSize: 12, color: "#94a3b8" }}>
            • <strong>35–44 mph Wind + &gt;40,000 lb Load:</strong> Elevated to <code>Severe</code> (heavy crosswind).
          </Typography>
        </Box>
      </AccordionDetails>
    </Accordion>
  );
}
