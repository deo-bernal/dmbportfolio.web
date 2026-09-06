import { Box, Button, Stack, Typography } from "@mui/material";
import { CAL_BOOKING_URL } from "content/showcase";
import { showcaseSx } from "styles/main_style";

/**
 * Cal.com renders inside an iframe. Some plans and browser settings block
 * framing, so the direct link is always offered alongside it.
 */
export default function BookingEmbed() {
  return (
    <Stack spacing={2}>
      <Box
        component="iframe"
        title="Book a call with Deo Bernal"
        src={`${CAL_BOOKING_URL}?embed=true`}
        loading="lazy"
        sx={showcaseSx.bookingFrame}
      />
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={1.5}
        sx={{ alignItems: { sm: "center" } }}
      >
        <Button
          href={CAL_BOOKING_URL}
          target="_blank"
          rel="noopener noreferrer"
          variant="outlined"
          sx={{ textTransform: "none", fontWeight: 600 }}
        >
          Open the booking page
        </Button>
        <Typography sx={showcaseSx.codeCaption}>
          If the calendar does not load here, the direct link always works.
        </Typography>
      </Stack>
    </Stack>
  );
}
