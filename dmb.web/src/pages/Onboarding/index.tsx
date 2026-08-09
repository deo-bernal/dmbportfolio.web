import { useMemo, useState } from "react";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import CheckCircleOutlinedIcon from "@mui/icons-material/CheckCircleOutlined";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Container,
  Link,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { generateProfileWithAi } from "services/aiProfile.service";
import api from "services/http.service";
import MarketingLayout from "components/layout/MarketingLayout";
import {
  accentRedContainedButtonSx,
  agenticPageSx,
  onboardingPageSx,
} from "styles/main_style";
import type { GeneratedProfile, UpdateProfileRequest } from "models";

type WizardStep = "input" | "generating" | "review" | "success";

const ACCOUNT_USERNAME_KEY = "dmb:account-username";

function getAccountUsername(): string {
  try {
    return sessionStorage.getItem(ACCOUNT_USERNAME_KEY) ?? "";
  } catch {
    return "";
  }
}

function toNullableDate(value: string): string | null {
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function buildProfilePayload(profile: GeneratedProfile, accountEmail: string): UpdateProfileRequest {
  return {
    summary: profile.summary,
    video: "",
    isViewable: true,
    skills: profile.skills,
    contact: {
      email: profile.resume.personalInfo.email || accountEmail,
      phone: profile.contact.phone || profile.resume.personalInfo.contactNo,
    },
    projectCategories:
      profile.projectCategories.length > 0
        ? profile.projectCategories
        : [{ title: "Projects", items: [{ name: "My Work", description: profile.summary }] }],
  };
}

function buildResumePayload(profile: GeneratedProfile, accountEmail: string) {
  const personalInfo = profile.resume.personalInfo;
  return {
    personalInfo: {
      firstName: personalInfo.firstName,
      lastName: personalInfo.lastName,
      contactNo: personalInfo.contactNo || profile.contact.phone || null,
      email: personalInfo.email || accountEmail,
      address: personalInfo.address || profile.contact.address || null,
      summary: personalInfo.summary || profile.summary || null,
    },
    workHistory: profile.resume.workHistory.map((item) => ({
      company: item.company,
      position: item.position,
      fromDate: toNullableDate(item.fromDate),
      toDate: toNullableDate(item.toDate),
      jobDescription: item.jobDescription || null,
    })),
    education: profile.resume.education.map((item) => ({
      school: item.school,
      address: item.address || null,
      courseTaken: item.courseTaken || null,
      startDate: toNullableDate(item.startDate),
      endDate: toNullableDate(item.endDate),
    })),
    affiliations: profile.resume.affiliations.map((item) => ({
      organization: item.organization,
      title: item.title,
      issueDate: toNullableDate(item.issueDate),
      details: item.details || null,
    })),
  };
}

export default function OnboardingPage() {
  const navigate = useNavigate();
  const accountEmail = useMemo(() => getAccountUsername(), []);

  const [step, setStep] = useState<WizardStep>("input");
  const [resumeText, setResumeText] = useState("");
  const [roleGoal, setRoleGoal] = useState("");
  const [yearsExperience, setYearsExperience] = useState("");
  const [topSkills, setTopSkills] = useState("");
  const [achievement, setAchievement] = useState("");
  const [generatedProfile, setGeneratedProfile] = useState<GeneratedProfile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);
  const [publicUrl, setPublicUrl] = useState("");

  const canGenerate =
    resumeText.trim().length > 0 ||
    roleGoal.trim().length > 0 ||
    topSkills.trim().length > 0 ||
    achievement.trim().length > 0;

  const handleGenerate = async () => {
    if (!canGenerate) {
      setError("Paste your resume or answer at least one question.");
      return;
    }

    setError(null);
    setStep("generating");

    try {
      const response = await generateProfileWithAi({
        resumeText,
        roleGoal,
        yearsExperience,
        topSkills,
        achievement,
        accountEmail,
      });
      setGeneratedProfile(response.profile);
      setStep("review");
    } catch (err: unknown) {
      setStep("input");
      if (axiosIsError(err)) {
        setError(err.response?.data?.message ?? "Unable to generate profile with AI.");
      } else {
        setError("Unable to generate profile with AI.");
      }
    }
  };

  const handlePublish = async () => {
    if (!generatedProfile) {
      return;
    }

    setIsPublishing(true);
    setError(null);

    try {
      const profilePayload = buildProfilePayload(generatedProfile, accountEmail);
      const resumePayload = buildResumePayload(generatedProfile, accountEmail);

      try {
        await api.post("/profiledetails", profilePayload);
      } catch (createError: unknown) {
        if (axiosIsError(createError) && createError.response?.status === 409) {
          await api.put("/profiledetails", profilePayload);
        } else {
          throw createError;
        }
      }

      await api.put("/resume", resumePayload);

      const username = accountEmail || profilePayload.contact.email;
      const origin = window.location.origin;
      setPublicUrl(`${origin}/${encodeURIComponent(username)}`);
      setStep("success");
    } catch (err: unknown) {
      if (axiosIsError(err)) {
        setError(err.response?.data?.message ?? "Unable to publish profile.");
      } else {
        setError("Unable to publish profile.");
      }
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <MarketingLayout mainSx={onboardingPageSx.container}>
      <Container maxWidth="md">
        <Box sx={onboardingPageSx.panel}>
          <Stack spacing={3}>
            <Box>
              <Stack direction="row" spacing={1} sx={{ alignItems: "center", mb: 1 }}>
                <AutoAwesomeIcon sx={{ color: "#475569" }} />
                <Typography sx={onboardingPageSx.kicker}>AI Profile Builder</Typography>
              </Stack>
              <Typography component="h1" sx={onboardingPageSx.title}>
                {step === "success" ? "Your profile is live" : "Build your online profile"}
              </Typography>
              <Typography sx={onboardingPageSx.subtitle}>
                {step === "input" &&
                  "Paste your resume or answer a few questions. AI will draft your portfolio and resume."}
                {step === "generating" && "Generating your profile. This usually takes 10–30 seconds."}
                {step === "review" && "Review the AI draft below. You can edit before publishing."}
                {step === "success" && "Share your link anywhere. You can keep editing from your dashboard."}
              </Typography>
            </Box>

            {error ? <Alert severity="error">{error}</Alert> : null}

            {step === "input" ? (
              <Stack spacing={2}>
                <TextField
                  label="Paste resume or background"
                  placeholder="Paste your resume, LinkedIn About section, or describe your experience..."
                  multiline
                  minRows={8}
                  value={resumeText}
                  onChange={(event) => setResumeText(event.target.value)}
                  fullWidth
                />
                <TextField
                  label="Target role (optional)"
                  value={roleGoal}
                  onChange={(event) => setRoleGoal(event.target.value)}
                  fullWidth
                />
                <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                  <TextField
                    label="Years of experience (optional)"
                    value={yearsExperience}
                    onChange={(event) => setYearsExperience(event.target.value)}
                    fullWidth
                  />
                  <TextField
                    label="Top skills (optional)"
                    value={topSkills}
                    onChange={(event) => setTopSkills(event.target.value)}
                    fullWidth
                  />
                </Stack>
                <TextField
                  label="Key achievement (optional)"
                  value={achievement}
                  onChange={(event) => setAchievement(event.target.value)}
                  fullWidth
                />
                <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
                  <Button
                    variant="contained"
                    size="large"
                    disabled={!canGenerate}
                    onClick={() => void handleGenerate()}
                    sx={[onboardingPageSx.primaryButton, accentRedContainedButtonSx]}
                  >
                    Generate with AI
                  </Button>
                  <Button
                    variant="outlined"
                    size="large"
                    onClick={() => navigate("/accent-sidebar/portfolio")}
                    sx={onboardingPageSx.secondaryButton}
                  >
                    Skip — build manually
                  </Button>
                </Stack>
              </Stack>
            ) : null}

            {step === "generating" ? (
              <Stack spacing={2} sx={{ alignItems: "center", py: 4 }}>
                <CircularProgress size={40} />
                <Typography sx={onboardingPageSx.subtitle}>
                  AI is writing your summary, skills, projects, and resume...
                </Typography>
              </Stack>
            ) : null}

            {step === "review" && generatedProfile ? (
              <Stack spacing={2}>
                <TextField
                  label="Portfolio summary"
                  multiline
                  minRows={4}
                  value={generatedProfile.summary}
                  onChange={(event) =>
                    setGeneratedProfile({ ...generatedProfile, summary: event.target.value })
                  }
                  fullWidth
                />
                <TextField
                  label="Skills (comma separated)"
                  value={generatedProfile.skills.join(", ")}
                  onChange={(event) =>
                    setGeneratedProfile({
                      ...generatedProfile,
                      skills: event.target.value
                        .split(/[,\n;]+/)
                        .map((skill) => skill.trim())
                        .filter(Boolean),
                    })
                  }
                  fullWidth
                />
                <TextField
                  label="Projects preview"
                  multiline
                  minRows={6}
                  value={generatedProfile.projectCategories
                    .flatMap((category) =>
                      category.items.map(
                        (item) => `[${category.title}] ${item.name}: ${item.description}`
                      )
                    )
                    .join("\n")}
                  onChange={(event) => {
                    const lines = event.target.value
                      .split("\n")
                      .map((line) => line.trim())
                      .filter(Boolean);
                    const items = lines.map((line) => {
                      const match = line.match(/^\[(.+?)\]\s*(.+?):\s*(.+)$/);
                      if (match) {
                        return {
                          category: match[1],
                          name: match[2],
                          description: match[3],
                        };
                      }
                      return {
                        category: "Projects",
                        name: line,
                        description: "",
                      };
                    });
                    const grouped = items.reduce<GeneratedProfile["projectCategories"]>(
                      (categories, item) => {
                        const existing = categories.find(
                          (category) => category.title === item.category
                        );
                        if (existing) {
                          existing.items.push({
                            name: item.name,
                            description: item.description,
                          });
                          return categories;
                        }
                        categories.push({
                          title: item.category,
                          items: [{ name: item.name, description: item.description }],
                        });
                        return categories;
                      },
                      []
                    );
                    setGeneratedProfile({ ...generatedProfile, projectCategories: grouped });
                  }}
                  helperText="Format: [Category] Project name: description"
                  fullWidth
                />
                <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
                  <Button
                    variant="contained"
                    size="large"
                    disabled={isPublishing}
                    onClick={() => void handlePublish()}
                    sx={[onboardingPageSx.primaryButton, accentRedContainedButtonSx]}
                  >
                    {isPublishing ? "Publishing..." : "Publish profile"}
                  </Button>
                  <Button
                    variant="outlined"
                    size="large"
                    disabled={isPublishing}
                    onClick={() => setStep("input")}
                    sx={onboardingPageSx.secondaryButton}
                  >
                    Back
                  </Button>
                </Stack>
              </Stack>
            ) : null}

            {step === "success" ? (
              <Stack spacing={2}>
                <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                  <CheckCircleOutlinedIcon sx={{ color: "#15803d" }} />
                  <Typography sx={onboardingPageSx.successText}>
                    Your public profile is ready.
                  </Typography>
                </Stack>
                {publicUrl ? (
                  <Box sx={agenticPageSx.loadingState}>
                    <Link href={publicUrl} target="_blank" rel="noopener noreferrer">
                      {publicUrl}
                    </Link>
                  </Box>
                ) : null}
                <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
                  <Button
                    component={RouterLink}
                    to="/accent-sidebar/portfolio"
                    variant="contained"
                    sx={[onboardingPageSx.primaryButton, accentRedContainedButtonSx]}
                  >
                    Open dashboard
                  </Button>
                  {publicUrl ? (
                    <Button
                      component="a"
                      href={publicUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      variant="outlined"
                      sx={onboardingPageSx.secondaryButton}
                    >
                      View public profile
                    </Button>
                  ) : null}
                </Stack>
              </Stack>
            ) : null}
          </Stack>
        </Box>
      </Container>
    </MarketingLayout>
  );
}

function axiosIsError(
  error: unknown
): error is { response?: { data?: { message?: string }; status?: number } } {
  return typeof error === "object" && error !== null && "response" in error;
}
