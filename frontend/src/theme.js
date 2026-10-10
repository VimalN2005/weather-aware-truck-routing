import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    mode: "dark",
    primary: {
      main: "#6366f1", // Indigo
      light: "#818cf8",
      dark: "#4338ca",
      contrastText: "#ffffff",
    },
    secondary: {
      main: "#38bdf8", // Sky blue accent
      light: "#7dd3fc",
      dark: "#0284c7",
    },
    background: {
      default: "#090d16",
      paper: "#111827",
    },
    text: {
      primary: "#f8fafc",
      secondary: "#94a3b8",
    },
    success: {
      main: "#10b981", // Low risk
    },
    warning: {
      main: "#f59e0b", // Moderate / High risk
    },
    error: {
      main: "#ef4444", // Severe risk
    },
    divider: "#1f293d",
  },
  typography: {
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    h1: { fontWeight: 800, letterSpacing: "-0.025em" },
    h2: { fontWeight: 700, letterSpacing: "-0.02em" },
    h3: { fontWeight: 700, letterSpacing: "-0.015em" },
    h4: { fontWeight: 700 },
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600 },
    button: { textTransform: "none", fontWeight: 600 },
  },
  shape: {
    borderRadius: 10,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: "#090d16",
          color: "#f8fafc",
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: "none",
          fontWeight: 600,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: "#111827",
          border: "1px solid #1f293d",
          borderRadius: 14,
          boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.4)",
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          backgroundColor: "#0d1322",
          "& fieldset": {
            borderColor: "#1f293d",
          },
          "&:hover fieldset": {
            borderColor: "#334155",
          },
          "&.Mui-focused fieldset": {
            borderColor: "#6366f1",
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 600,
        },
      },
    },
  },
});

export default theme;
