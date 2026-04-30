import { createTheme, ThemeProvider as MuiThemeProvider } from "@mui/material/styles";
import type { ReactNode } from "react";

type AppThemeProviderProps = {
  children: ReactNode;
};

const theme = createTheme();

export default function ThemeProvider({ children }: AppThemeProviderProps) {
  return <MuiThemeProvider theme={theme}>{children}</MuiThemeProvider>;
}
