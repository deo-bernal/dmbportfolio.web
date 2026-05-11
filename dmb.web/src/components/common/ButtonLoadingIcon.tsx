import CircularProgress from "@mui/material/CircularProgress";
import { buttonSpinnerSx } from "styles/main_style";

/** Matches EMS.WEB FormUtils: small spinner as Button `startIcon` while async work runs. */
export default function ButtonLoadingIcon() {
  return <CircularProgress size="1rem" sx={buttonSpinnerSx} />;
}
