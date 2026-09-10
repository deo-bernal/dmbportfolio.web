import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { ResumeProfileView } from "components/resumeProfile";
import { DEO_RESUME } from "content/deoResume";
import { agenticPageSx } from "styles/main_style";

const PDF_HREF = "/files/Deo_Bernal_Resume.pdf?v=source";

export default function PublicResumePdfPage() {
  return (
    <Stack sx={agenticPageSx.stackSections}>
      <Box sx={agenticPageSx.panelBody}>
        <Box component="header" sx={agenticPageSx.headerRow}>
          <Box sx={agenticPageSx.headerLeft}>
            <Typography component="p" sx={agenticPageSx.pageKindLabel}>
              Resume
            </Typography>
            <Typography component="h1" sx={agenticPageSx.profileName}>
              Deo Bernal
            </Typography>
            <Typography component="p" sx={agenticPageSx.contactLine}>
              {DEO_RESUME.title}
            </Typography>
          </Box>
          <Button
            href={PDF_HREF}
            target="_blank"
            rel="noopener noreferrer"
            variant="contained"
            disableElevation
            sx={{ textTransform: "none", bgcolor: "#b91c1c", "&:hover": { bgcolor: "#991b1b" } }}
          >
            Download PDF
          </Button>
        </Box>
      </Box>
      <ResumeProfileView profile={DEO_RESUME} />
    </Stack>
  );
}
