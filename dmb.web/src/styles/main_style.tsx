import Box from "@mui/material/Box";
import { alpha, styled } from "@mui/material/styles";
import type { SxProps, Theme } from "@mui/material/styles";

/** Typography stacks (login / agentic UI) */
export const pageFonts = {
  sans: '"IBM Plex Sans", "Segoe UI Variable", system-ui, sans-serif',
  mono: '"IBM Plex Mono", "Cascadia Code", "Fira Code", ui-monospace, monospace',
} as const;

/** Panel surface — same visual language as LoginJWT form */
export const agenticSurfaceSx = {
  panel: {
    fontFamily: pageFonts.sans,
    borderRadius: 2,
    background: `linear-gradient(
          155deg,
          ${alpha("#f8fafc", 1)} 0%,
          ${alpha("#e2e8f0", 0.92)} 42%,
          ${alpha("#cbd5e1", 0.55)} 100%
        )`,
    border: `1px solid ${alpha("#475569", 0.18)}`,
    boxShadow: `
          inset 0 1px 0 ${alpha("#ffffff", 0.85)},
          0 12px 36px ${alpha("#0f172a", 0.07)},
          0 2px 8px ${alpha("#0f172a", 0.04)}
        `,
  } satisfies SxProps<Theme>,
} as const;

/* ——— Auth / Login layout (MUI) ——— */

export const LoginMainContent = styled(Box)(() => ({
  minHeight: "100vh",
  display: "flex",
  flex: 1,
  flexDirection: "column",
}));

export const LoginTopWrapper = styled(Box)(() => ({
  display: "flex",
  width: "100%",
  flex: 1,
  padding: "20px",
  alignItems: "center",
  justifyContent: "center",
}));

export const loginPageSx = {
  card: {
    ...agenticSurfaceSx.panel,
    mt: 3,
    px: 4,
    pt: 5,
    pb: 3,
  } satisfies SxProps<Theme>,
  titleSignIn: {
    mb: 1,
    fontFamily: pageFonts.sans,
    fontWeight: 700,
    letterSpacing: "-0.02em",
    color: "#1e293b",
  } satisfies SxProps<Theme>,
  titleSubtitle: {
    mb: 3,
    fontWeight: "normal",
    fontFamily: pageFonts.sans,
    color: "#475569",
  } satisfies SxProps<Theme>,
} as const;

/* ——— LoginJWT form (MUI sx) ——— */

export const loginJwtSx = {
  textField: {
    mb: 2,
    "& .MuiOutlinedInput-root": {
      fontFamily: pageFonts.mono,
      fontSize: "0.9375rem",
      fontWeight: 500,
      letterSpacing: "-0.01em",
      color: "#1e293b",
      bgcolor: alpha("#ffffff", 0.72),
      backdropFilter: "blur(10px)",
      borderRadius: 1.25,
      transition: "border-color 160ms ease, box-shadow 160ms ease, background 160ms ease",
      "& fieldset": {
        borderColor: alpha("#475569", 0.35),
        borderWidth: 1,
      },
      "&:hover fieldset": {
        borderColor: alpha("#475569", 0.55),
      },
      "&.Mui-focused": {
        bgcolor: alpha("#ffffff", 0.9),
        boxShadow: `0 0 0 3px ${alpha("#64748b", 0.2)}`,
      },
      "&.Mui-focused fieldset": {
        borderColor: "#64748b",
      },
      "&.Mui-error fieldset": {
        borderColor: alpha("#b91c1c", 0.55),
      },
    },
    "& .MuiInputLabel-root": {
      fontFamily: pageFonts.sans,
      fontWeight: 600,
      fontSize: "0.8125rem",
      letterSpacing: "0.04em",
      textTransform: "uppercase",
      color: "#64748b",
      "&.Mui-focused": { color: "#475569" },
      "&.Mui-error": { color: "#b91c1c" },
    },
    "& .MuiFormHelperText-root": {
      fontFamily: pageFonts.mono,
      fontSize: "0.72rem",
      letterSpacing: "0.02em",
      color: "#64748b",
      mx: 0,
    },
  } satisfies SxProps<Theme>,

  form: {
    ...agenticSurfaceSx.panel,
    p: 2.75,
  } satisfies SxProps<Theme>,

  gatewayRow: {
    display: "flex",
    alignItems: "center",
    gap: 1.25,
    mb: 2.5,
    pb: 2,
    borderBottom: `1px solid ${alpha("#64748b", 0.2)}`,
  } satisfies SxProps<Theme>,

  gatewayDot: {
    width: 8,
    height: 8,
    borderRadius: "2px",
    bgcolor: "#64748b",
    boxShadow: `0 0 0 2px ${alpha("#64748b", 0.25)}`,
  } satisfies SxProps<Theme>,

  gatewayCaption: {
    fontFamily: pageFonts.mono,
    fontWeight: 600,
    fontSize: "0.7rem",
    letterSpacing: "0.14em",
    textTransform: "uppercase",
    color: "#475569",
  } satisfies SxProps<Theme>,

  visibilityIconButton: {
    color: "#64748b",
    borderRadius: 1,
    "&:hover": {
      bgcolor: alpha("#64748b", 0.12),
      color: "#334155",
    },
  } satisfies SxProps<Theme>,

  submitButton: {
    mt: 2.5,
    py: 1.35,
    fontFamily: pageFonts.sans,
    fontWeight: 700,
    fontSize: "0.9375rem",
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    borderRadius: 1.25,
    bgcolor: "#475569",
    color: "#f1f5f9",
    border: `1px solid ${alpha("#1e293b", 0.2)}`,
    boxShadow: `
            inset 0 1px 0 ${alpha("#ffffff", 0.12)},
            0 3px 0 ${alpha("#1e293b", 0.35)},
            0 8px 24px ${alpha("#0f172a", 0.12)}
          `,
    transition: "transform 120ms ease, background 160ms ease, box-shadow 160ms ease",
    "&:hover": {
      bgcolor: "#334155",
      boxShadow: `
              inset 0 1px 0 ${alpha("#ffffff", 0.1)},
              0 3px 0 ${alpha("#1e293b", 0.45)},
              0 10px 28px ${alpha("#0f172a", 0.14)}
            `,
    },
    "&:active": {
      transform: "translateY(1px)",
      boxShadow: `0 1px 0 ${alpha("#1e293b", 0.35)}`,
    },
    "&:disabled": {
      bgcolor: alpha("#94a3b8", 0.85),
      color: alpha("#f8fafc", 0.85),
      boxShadow: "none",
      borderColor: "transparent",
    },
  } satisfies SxProps<Theme>,

  submitSpinner: {
    color: "inherit",
  } satisfies SxProps<Theme>,

  rootErrorHelper: {
    mt: 1.5,
    fontFamily: pageFonts.mono,
    fontSize: "0.78rem",
    letterSpacing: "0.02em",
    lineHeight: 1.5,
  } satisfies SxProps<Theme>,
} as const;

/* ——— App shell: sidebar + main (agentic gray) ——— */

export const layoutShellSx = {
  root: {
    display: "flex",
    flexDirection: { xs: "column", sm: "row" },
    minHeight: "100vh",
    fontFamily: pageFonts.sans,
  } satisfies SxProps<Theme>,

  sidebar: {
    width: { xs: "100%", sm: 260 },
    flexShrink: 0,
    py: { xs: 1.5, sm: 3 },
    px: { xs: 1.5, sm: 2.25 },
    background: `linear-gradient(180deg, #334155 0%, #1e293b 72%, #0f172a 100%)`,
    borderRight: { xs: "none", sm: `1px solid ${alpha("#0f172a", 0.35)}` },
    borderBottom: { xs: `1px solid ${alpha("#0f172a", 0.35)}`, sm: "none" },
    boxShadow: {
      xs: `0 4px 18px ${alpha("#0f172a", 0.18)}`,
      sm: `6px 0 32px ${alpha("#0f172a", 0.18)}`,
    },
  } satisfies SxProps<Theme>,

  sidebarBrand: {
    fontFamily: pageFonts.mono,
    fontWeight: 600,
    fontSize: "0.7rem",
    letterSpacing: "0.14em",
    textTransform: "uppercase",
    color: alpha("#e2e8f0", 0.92),
    mb: { xs: 1, sm: 2.5 },
    pb: { xs: 1, sm: 1.75 },
    borderBottom: `1px solid ${alpha("#94a3b8", 0.22)}`,
  } satisfies SxProps<Theme>,

  navStack: {
    display: "flex",
    flexDirection: { xs: "row", sm: "column" },
    flexWrap: "wrap",
    gap: 0.75,
  } satisfies SxProps<Theme>,

  navItem: {
    display: "block",
    px: 1.5,
    py: 1,
    textAlign: "center",
    borderRadius: 1.25,
    fontFamily: pageFonts.sans,
    fontWeight: 500,
    fontSize: "0.875rem",
    letterSpacing: "0.04em",
    textDecoration: "none",
    color: alpha("#e2e8f0", 0.78),
    border: `1px solid transparent`,
    transition: "background 140ms ease, color 140ms ease, border-color 140ms ease, box-shadow 140ms ease",
    "&:hover": {
      color: "#f8fafc",
      bgcolor: alpha("#64748b", 0.22),
      borderColor: alpha("#94a3b8", 0.15),
    },
  } satisfies SxProps<Theme>,

  navItemActive: {
    color: "#f8fafc",
    fontWeight: 700,
    bgcolor: alpha("#475569", 0.55),
    border: `1px solid ${alpha("#94a3b8", 0.25)}`,
    boxShadow: `
      inset 0 1px 0 ${alpha("#ffffff", 0.1)},
      0 2px 8px ${alpha("#0f172a", 0.25)}
    `,
  } satisfies SxProps<Theme>,

  main: {
    flex: 1,
    minWidth: 0,
    py: { xs: 2, sm: 3 },
    px: { xs: 2, sm: 3 },
    background: `linear-gradient(180deg, ${alpha("#f1f5f9", 1)} 0%, ${alpha("#e2e8f0", 0.55)} 48%, ${alpha("#cbd5e1", 0.35)} 100%)`,
  } satisfies SxProps<Theme>,
} as const;

/* ——— Portfolio / Resume content ——— */

export const agenticPageSx = {
  container: {
    maxWidth: "lg",
    mx: "auto",
    px: { xs: 0.5, sm: 0 },
  } satisfies SxProps<Theme>,

  stackSections: {
    gap: 3,
  } satisfies SxProps<Theme>,

  panelBody: {
    ...agenticSurfaceSx.panel,
    p: { xs: 2.5, sm: 3 },
  } satisfies SxProps<Theme>,

  loadingState: {
    fontFamily: pageFonts.mono,
    fontSize: "0.9rem",
    color: "#64748b",
    textAlign: "center",
    py: 6,
  } satisfies SxProps<Theme>,

  headerRow: {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 2,
    mb: 2,
  } satisfies SxProps<Theme>,

  headerLeft: {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 2,
  } satisfies SxProps<Theme>,

  profileName: {
    fontFamily: pageFonts.sans,
    fontWeight: 700,
    fontSize: { xs: "1.35rem", md: "1.6rem" },
    letterSpacing: "-0.02em",
    color: "#1e293b",
    m: 0,
  } satisfies SxProps<Theme>,

  stackLogos: {
    display: "flex",
    alignItems: "center",
    gap: 1,
  } satisfies SxProps<Theme>,

  stackPlus: {
    fontFamily: pageFonts.mono,
    fontWeight: 600,
    fontSize: "0.85rem",
    color: "#64748b",
  } satisfies SxProps<Theme>,

  logoutButton: {
    ...loginJwtSx.submitButton,
    mt: 0,
    py: 1,
    px: 2,
    fontSize: "0.75rem",
    minWidth: "auto",
    width: { xs: "100%", sm: "auto" },
  } satisfies SxProps<Theme>,

  introLink: {
    display: "inline-block",
    mb: 2,
    fontFamily: pageFonts.sans,
    fontWeight: 700,
    fontSize: "1.05rem",
    color: "#475569",
    textDecoration: "none",
    borderBottom: `2px solid ${alpha("#475569", 0.35)}`,
    "&:hover": { color: "#1e293b", borderBottomColor: alpha("#1e293b", 0.45) },
  } satisfies SxProps<Theme>,

  summary: {
    fontFamily: pageFonts.sans,
    fontSize: { xs: "1rem", sm: "1.05rem" },
    color: "#334155",
    lineHeight: 1.65,
    m: 0,
  } satisfies SxProps<Theme>,

  sectionTitle: {
    fontFamily: pageFonts.sans,
    fontWeight: 700,
    fontSize: "0.95rem",
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    color: "#475569",
    m: 0,
    mb: 2,
    pb: 1.25,
    borderBottom: `1px solid ${alpha("#64748b", 0.22)}`,
  } satisfies SxProps<Theme>,

  categoryTitle: {
    fontFamily: pageFonts.sans,
    fontWeight: 600,
    fontSize: "1rem",
    color: "#334155",
    m: 0,
    mb: 1.5,
  } satisfies SxProps<Theme>,

  list: {
    m: 0,
    pl: 2.5,
    fontFamily: pageFonts.sans,
    color: "#334155",
    "& li": { mb: 0.75, overflowWrap: "anywhere" },
  } satisfies SxProps<Theme>,

  listNested: {
    m: 0,
    mt: 1,
    pl: 2.5,
    fontFamily: pageFonts.sans,
    color: "#334155",
    "& li": { mb: 0.75, overflowWrap: "anywhere" },
  } satisfies SxProps<Theme>,

  projectSectionSpaced: {
    mb: 3,
  } satisfies SxProps<Theme>,

  collapsedBlock: {
    mt: 2,
  } satisfies SxProps<Theme>,

  collapsedProjectsBlock: {
    mt: 3,
  } satisfies SxProps<Theme>,

  toggleButton: {
    fontFamily: pageFonts.mono,
    fontSize: "0.72rem",
    fontWeight: 600,
    letterSpacing: "0.1em",
    textTransform: "uppercase",
    color: "#64748b",
    px: 0,
    py: 0.5,
    mt: 1.5,
    minWidth: "auto",
    borderRadius: 1,
    "&:hover": {
      bgcolor: alpha("#64748b", 0.08),
      color: "#334155",
    },
  } satisfies SxProps<Theme>,

  contactLine: {
    fontFamily: pageFonts.sans,
    color: "#334155",
    mb: 1.5,
    "&:last-of-type": { mb: 0 },
    "& a": {
      color: "#475569",
      fontWeight: 600,
      textDecoration: "none",
      overflowWrap: "anywhere",
      borderBottom: `1px solid ${alpha("#475569", 0.35)}`,
      "&:hover": { color: "#1e293b" },
    },
  } satisfies SxProps<Theme>,

  resumeTitle: {
    fontFamily: pageFonts.sans,
    fontWeight: 700,
    fontSize: { xs: "1.5rem", sm: "1.75rem" },
    letterSpacing: "-0.02em",
    color: "#1e293b",
    m: 0,
    mb: 2,
    pb: 1.5,
    borderBottom: `1px solid ${alpha("#64748b", 0.2)}`,
  } satisfies SxProps<Theme>,

  resumeLead: {
    fontFamily: pageFonts.sans,
    fontSize: "1.02rem",
    color: "#334155",
    lineHeight: 1.65,
    mb: 2,
  } satisfies SxProps<Theme>,

  resumeMuted: {
    fontFamily: pageFonts.mono,
    fontSize: "0.85rem",
    color: "#64748b",
    lineHeight: 1.6,
    m: 0,
  } satisfies SxProps<Theme>,
} as const;
