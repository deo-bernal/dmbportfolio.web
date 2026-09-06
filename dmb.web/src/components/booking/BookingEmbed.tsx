import { Box, Button, Stack, Typography } from "@mui/material";
import { CONTACT_EMAIL, HAS_BOOKING_PAGE, getBookingHref } from "content/showcase";
import { showcaseSx } from "styles/main_style";

/**
 * Cal.com is only framed when REACT_APP_CAL_BOOKING_URL points at a real page.
 * A placeholder URL used to render Cal.com's 404 inside the funnel.
 */
export default function BookingEmbed() {
  const href = getBookingHref();

  return (
    <Stack spacing={2}>
      {HAS_BOOKING_PAGE ? (
        <Box
          component="iframe"
          title="Book a call with Deo Bernal"
          src={`${href}?embed=true`}
          loading="lazy"
          sx={showcaseSx.bookingFrame}
        />
      ) : (
        <Typography sx={showcaseSx.sectionBody}>
          The calendar is not live yet. Email {CONTACT_EMAIL} and we will pick a
          30-minute slot.
        </Typography>
      )}
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={1.5}
        sx={{ alignItems: { sm: "center" } }}
      >
        <Button
          href={href}
          target={HAS_BOOKING_PAGE ? "_blank" : undefined}
          rel={HAS_BOOKING_PAGE ? "noopener noreferrer" : undefined}
          variant="outlined"
          sx={{ textTransform: "none", fontWeight: 600 }}
        >
          {HAS_BOOKING_PAGE ? "Open the booking page" : "Email to book a time"}
        </Button>
        {HAS_BOOKING_PAGE ? (
          <Typography sx={showcaseSx.codeCaption}>
            If the calendar does not load here, the direct link always works.
          </Typography>
        ) : null}
      </Stack>
    </Stack>
  );
}
