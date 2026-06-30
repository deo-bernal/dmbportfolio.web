import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { ResumeProfileView } from "components/resumeProfile";
import type { ResumeProfile } from "models";
import { EMPTY_RESUME_PROFILE } from "models";
import { resolvePublicApiBaseUrl } from "config";
import api from "services/http.service";
import {
  readPublicResumeCache,
  writePublicResumeCache,
} from "services/publicContentCache";
import { agenticPageSx } from "styles/main_style";

function mapPublicResume(data: any): ResumeProfile {
  return {
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
  };
}

export default function PublicResumePage() {
  const { username = "" } = useParams<{ username: string }>();
  const [resume, setResume] = useState<ResumeProfile>(EMPTY_RESUME_PROFILE);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const hasFetched = useRef(false);

  useEffect(() => {
    hasFetched.current = false;
  }, [username]);

  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;

    const load = async () => {
      const cached = readPublicResumeCache<ResumeProfile>(username);
      if (cached) {
        setResume(cached);
        setIsLoading(false);
      } else {
        setIsLoading(true);
      }
      setError(null);
      try {
        const { data } = await api.get("/publicresume", {
          baseURL: resolvePublicApiBaseUrl(),
          params: { username },
        });
        const nextResume = mapPublicResume(data);
        writePublicResumeCache(username, nextResume);
        setResume(nextResume);
      } catch (err: any) {
        if (!cached) {
          setError(err?.response?.data?.message ?? "Unable to load public resume.");
        }
      } finally {
        setIsLoading(false);
      }
    };

    void load();
  }, [username]);

  if (isLoading && resume === EMPTY_RESUME_PROFILE) {
    return (
      <Container sx={agenticPageSx.container}>
        <Box sx={agenticPageSx.loadingState}>Loading resume...</Box>
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

  const fullName = `${resume.personalInfo.firstName} ${resume.personalInfo.lastName}`.trim() || "Public Resume";

  return (
    <Container sx={agenticPageSx.container}>
      <Stack sx={agenticPageSx.stackSections}>
        <Box sx={agenticPageSx.panelBody}>
          <Box component="header" sx={agenticPageSx.headerRow}>
            <Box sx={agenticPageSx.headerLeft}>
              <Typography component="p" sx={agenticPageSx.pageKindLabel}>
                Public Resume
              </Typography>
              <Typography component="h1" sx={agenticPageSx.profileName}>
                {fullName}
              </Typography>
            </Box>
          </Box>
        </Box>
        <ResumeProfileView profile={resume} />
      </Stack>
    </Container>
  );
}

