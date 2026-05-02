import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { agenticPageSx } from "styles/main_style";

export default function ResumePage() {
  return (
    <Container sx={agenticPageSx.container}>
      <Stack sx={agenticPageSx.stackSections}>
        <Box sx={agenticPageSx.panelBody}>
          <Typography component="h1" sx={agenticPageSx.resumeTitle}>
            Resume
          </Typography>
          <Typography component="p" sx={agenticPageSx.resumeLead}>
            Professional summary, work experience, education, and certifications can be presented
            here.
          </Typography>
          <Typography component="p" sx={agenticPageSx.resumeMuted}>
            This page is ready for your full resume content and downloadable CV link.
          </Typography>
        </Box>
      </Stack>
    </Container>
  );
}
