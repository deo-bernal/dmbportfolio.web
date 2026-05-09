import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import type { ResumeProfile } from "models";
import { agenticPageSx } from "styles/main_style";
import { isoDateToAu } from "utils/date";

type ResumeProfileViewProps = {
  profile: ResumeProfile;
};

export default function ResumeProfileView({ profile }: ResumeProfileViewProps) {
  return (
    <>
      <Box sx={agenticPageSx.panelBody}>
        <Typography component="h2" sx={agenticPageSx.sectionTitle}>
          Personal Info
        </Typography>
        <Typography component="p" sx={agenticPageSx.contactLine}>
          <strong>Email:</strong> {profile.personalInfo.email || "-"}
        </Typography>
        <Typography component="p" sx={agenticPageSx.contactLine}>
          <strong>Contact No:</strong> {profile.personalInfo.contactNo || "-"}
        </Typography>
        <Typography component="p" sx={agenticPageSx.contactLine}>
          <strong>Address:</strong> {profile.personalInfo.address || "-"}
        </Typography>
        <Typography component="p" sx={agenticPageSx.summary}>
          {profile.personalInfo.summary || "No summary yet."}
        </Typography>
      </Box>

      <Box sx={agenticPageSx.panelBody}>
        <Typography component="h2" sx={agenticPageSx.sectionTitle}>
          Work History
        </Typography>
        {profile.workHistory.length === 0 ? (
          <Typography>No work history added yet.</Typography>
        ) : (
          profile.workHistory.map((item, index) => (
            <Box key={`work-${index}`} sx={{ mb: 2 }}>
              <Typography sx={agenticPageSx.categoryTitle}>
                {item.position} - {item.company}
              </Typography>
              <Typography component="p" sx={agenticPageSx.resumeMuted}>
                {item.fromDate ? isoDateToAu(item.fromDate) : "-"} to {item.toDate ? isoDateToAu(item.toDate) : "Present"}
              </Typography>
              <Typography component="p" sx={agenticPageSx.summary}>
                {item.jobDescription || "-"}
              </Typography>
            </Box>
          ))
        )}
      </Box>

      <Box sx={agenticPageSx.panelBody}>
        <Typography component="h2" sx={agenticPageSx.sectionTitle}>
          Education
        </Typography>
        {profile.education.length === 0 ? (
          <Typography>No education added yet.</Typography>
        ) : (
          profile.education.map((item, index) => (
            <Box key={`education-${index}`} sx={{ mb: 2 }}>
              <Typography sx={agenticPageSx.categoryTitle}>{item.school}</Typography>
              <Typography component="p" sx={agenticPageSx.resumeMuted}>
                {item.startDate ? isoDateToAu(item.startDate) : "-"} to {item.endDate ? isoDateToAu(item.endDate) : "Present"}
              </Typography>
              <Typography component="p" sx={agenticPageSx.contactLine}>
                <strong>Course:</strong> {item.courseTaken || "-"}
              </Typography>
              <Typography component="p" sx={agenticPageSx.contactLine}>
                <strong>Address:</strong> {item.address || "-"}
              </Typography>
            </Box>
          ))
        )}
      </Box>

      <Box sx={agenticPageSx.panelBody}>
        <Typography component="h2" sx={agenticPageSx.sectionTitle}>
          Affiliations
        </Typography>
        {profile.affiliations.length === 0 ? (
          <Typography>No affiliations added yet.</Typography>
        ) : (
          profile.affiliations.map((item, index) => (
            <Box key={`aff-${index}`} sx={{ mb: 2 }}>
              <Typography sx={agenticPageSx.categoryTitle}>
                {item.title} - {item.organization}
              </Typography>
              <Typography component="p" sx={agenticPageSx.resumeMuted}>
                {item.issueDate ? isoDateToAu(item.issueDate) : "-"}
              </Typography>
              <Typography component="p" sx={agenticPageSx.summary}>
                {item.details || "-"}
              </Typography>
            </Box>
          ))
        )}
      </Box>
    </>
  );
}
