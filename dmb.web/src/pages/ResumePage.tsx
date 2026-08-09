import { useEffect, useMemo, useRef, useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { ResumeProfileTabs, ResumeProfileView } from "components/resumeProfile";
import type { ResumeProfile } from "models";
import api from "services/http.service";
import { agenticPageSx, onboardingPageSx } from "styles/main_style";
import { EMPTY_RESUME_PROFILE } from "models";
import MarketingLayout from "components/layout/MarketingLayout";

export default function ResumePage() {
  const [resume, setResume] = useState<ResumeProfile>(EMPTY_RESUME_PROFILE);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const hasFetched = useRef(false);

  useEffect(() => {
    if (hasFetched.current) {
      return;
    }
    hasFetched.current = true;

    const loadResume = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data } = await api.get("/resume");
        setResume({
          personalInfo: {
            firstName: data?.personalInfo?.firstName ?? "",
            lastName: data?.personalInfo?.lastName ?? "",
            contactNo: data?.personalInfo?.contactNo ?? "",
            email: data?.personalInfo?.email ?? "",
            address: data?.personalInfo?.address ?? "",
            summary: data?.personalInfo?.summary ?? "",
          },
          workHistory: (data?.workHistory ?? []).map((item: any) => ({
            company: item.company ?? "",
            position: item.position ?? "",
            fromDate: item.fromDate ? String(item.fromDate).slice(0, 10) : "",
            toDate: item.toDate ? String(item.toDate).slice(0, 10) : "",
            jobDescription: item.jobDescription ?? "",
          })),
          education: (data?.education ?? []).map((item: any) => ({
            school: item.school ?? "",
            address: item.address ?? "",
            courseTaken: item.courseTaken ?? "",
            startDate: item.startDate ? String(item.startDate).slice(0, 10) : "",
            endDate: item.endDate ? String(item.endDate).slice(0, 10) : "",
          })),
          affiliations: (data?.affiliations ?? []).map((item: any) => ({
            organization: item.organization ?? "",
            title: item.title ?? "",
            issueDate: item.issueDate ? String(item.issueDate).slice(0, 10) : "",
            details: item.details ?? "",
          })),
        });
      } catch (err: any) {
        if (err?.response?.status !== 404) {
          setError("Unable to load resume.");
        }
      } finally {
        setLoading(false);
      }
    };

    void loadResume();
  }, []);

  const fullName = useMemo(
    () => `${resume.personalInfo.firstName} ${resume.personalInfo.lastName}`.trim() || "My Resume",
    [resume.personalInfo.firstName, resume.personalInfo.lastName]
  );

  const onSave = async (nextResume: ResumeProfile) => {
    setError(null);
    try {
      await api.put("/resume", {
        personalInfo: {
          firstName: nextResume.personalInfo.firstName,
          lastName: nextResume.personalInfo.lastName,
          contactNo: nextResume.personalInfo.contactNo || null,
          email: nextResume.personalInfo.email,
          address: nextResume.personalInfo.address || null,
          summary: nextResume.personalInfo.summary || null,
        },
        workHistory: nextResume.workHistory.map((item) => ({
          company: item.company,
          position: item.position,
          fromDate: item.fromDate || null,
          toDate: item.toDate || null,
          jobDescription: item.jobDescription || null,
        })),
        education: nextResume.education.map((item) => ({
          school: item.school,
          address: item.address || null,
          courseTaken: item.courseTaken || null,
          startDate: item.startDate || null,
          endDate: item.endDate || null,
        })),
        affiliations: nextResume.affiliations.map((item) => ({
          organization: item.organization,
          title: item.title,
          issueDate: item.issueDate || null,
          details: item.details,
        })),
      });
      setResume(nextResume);
    } catch (saveError: any) {
      throw saveError;
    }
  };

  if (loading) {
    return (
      <Container sx={agenticPageSx.container}>
        <Box sx={agenticPageSx.loadingState}>Loading...</Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container sx={agenticPageSx.container}>
        <Box sx={agenticPageSx.loadingState}>{error}</Box>
      </Container>
    );
  }

  return (
    <MarketingLayout mainSx={onboardingPageSx.container}>
      <Stack sx={agenticPageSx.stackSections}>
        <Box sx={agenticPageSx.panelBody}>
          <Box component="header" sx={agenticPageSx.headerRow}>
            <Box sx={agenticPageSx.headerLeft}>
              <Typography component="p" sx={agenticPageSx.pageKindLabel}>
                Resume
              </Typography>
              <Typography component="h1" sx={agenticPageSx.profileName}>
                {fullName}
              </Typography>
            </Box>
            {!isEditing ? (
              <Button variant="outlined" onClick={() => setIsEditing(true)}>
                EDIT RESUME
              </Button>
            ) : (
              <Button variant="outlined" onClick={() => setIsEditing(false)}>
                BACK TO VIEW
              </Button>
            )}
          </Box>
        </Box>

        {isEditing ? (
          <ResumeProfileTabs profile={resume} onSave={onSave} />
        ) : (
          <ResumeProfileView profile={resume} />
        )}
      </Stack>
    </MarketingLayout>
  );
}
