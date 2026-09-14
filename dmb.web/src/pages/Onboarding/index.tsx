import { useEffect, useMemo, useRef, useState } from "react";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import CheckCircleOutlinedIcon from "@mui/icons-material/CheckCircleOutlined";
import CloudUploadOutlinedIcon from "@mui/icons-material/CloudUploadOutlined";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
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
import { resumeParserErrorMessage } from "utils/friendlyAiError";
import {
  AI_FREE_TIER_PERFORMANCE,
  AI_FREE_TIER_TRADEOFFS,
} from "content/aiFreeTier";
import MarketingLayout from "components/layout/MarketingLayout";
import {
  accentRedContainedButtonSx,
  agenticPageSx,
  onboardingPageSx,
} from "styles/main_style";
import type { GeneratedProfile } from "models";
import { getProfile } from "slices/user";
import { useDispatch } from "store";
import {
  parseResumeFile,
  resumeAcceptAttribute,
} from "utils/parseResumeFile";
import {
  firstFilled,
  getAccountUsername,
  loadAccountInfo,
  persistAccountUsername,
  publishGeneratedProfile,
  type AccountInfo,
} from "utils/publishGeneratedProfile";
import { DASHBOARD_PATH } from "utils/navigation";

type WizardStep = "input" | "generating" | "review" | "success";

const EMPTY_ACCOUNT_INFO: AccountInfo = {
  firstName: "",
  lastName: "",
  contactNo: "",
  email: "",
  address: "",
};

/**
 * Saving a blank name or phone overwrites what the account already has, so every
 * publish falls back to the AI draft, then the saved account details.
 */
function mergeAccountDefaults(profile: GeneratedProfile, account: AccountInfo): GeneratedProfile {
  const personalInfo = profile.resume.personalInfo;
  return {
    ...profile,
    contact: {
      ...profile.contact,
      phone: firstFilled(profile.contact.phone, personalInfo.contactNo, account.contactNo),
      address: firstFilled(profile.contact.address, personalInfo.address, account.address),
    },
    resume: {
      ...profile.resume,
      personalInfo: {
        ...personalInfo,
        firstName: firstFilled(personalInfo.firstName, account.firstName),
        lastName: firstFilled(personalInfo.lastName, account.lastName),
        contactNo: firstFilled(personalInfo.contactNo, profile.contact.phone, account.contactNo),
        email: firstFilled(personalInfo.email, account.email),
        address: firstFilled(personalInfo.address, profile.contact.address, account.address),
      },
    },
  };
}

export default function OnboardingPage() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const accountEmail = useMemo(() => getAccountUsername(), []);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [step, setStep] = useState<WizardStep>("input");
  const [resumeText, setResumeText] = useState("");
  const [roleGoal, setRoleGoal] = useState("");
  const [yearsExperience, setYearsExperience] = useState("");
  const [topSkills, setTopSkills] = useState("");
  const [achievement, setAchievement] = useState("");
  const [generatedProfile, setGeneratedProfile] = useState<GeneratedProfile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isParsingFile, setIsParsingFile] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const [publicUrl, setPublicUrl] = useState("");
  const accountInfoRef = useRef<AccountInfo>(EMPTY_ACCOUNT_INFO);

  useEffect(() => {
    let cancelled = false;

    const loadSavedAccount = async () => {
      try {
        const info = await loadAccountInfo(accountEmail);
        if (cancelled) return;
        accountInfoRef.current = info;
      } catch {
        // No saved account details yet — the AI draft fields stay as-is.
      }
    };

    void loadSavedAccount();
    return () => {
      cancelled = true;
    };
  }, [accountEmail]);

  const canGenerate =
    resumeText.trim().length > 0 ||
    roleGoal.trim().length > 0 ||
    topSkills.trim().length > 0 ||
    achievement.trim().length > 0;

  const handleResumeFile = async (file: File | undefined | null) => {
    if (!file) return;

    setError(null);
    setIsParsingFile(true);

    try {
      const parsed = await parseResumeFile(file);
      setResumeText(parsed.text);
      setUploadedFileName(parsed.fileName);
    } catch (err: unknown) {
      setUploadedFileName(null);
      setError(err instanceof Error ? err.message : "Unable to read that resume file.");
    } finally {
      setIsParsingFile(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleGenerate = async () => {
    if (!canGenerate) {
      setError("Upload a resume, paste text, or answer at least one question.");
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
      setGeneratedProfile(mergeAccountDefaults(response.profile, accountInfoRef.current));
      setStep("review");
    } catch (err: unknown) {
      setStep("input");
      const raw = axiosIsError(err) ? err.response?.data?.message : undefined;
      setError(resumeParserErrorMessage(typeof raw === "string" ? raw : undefined));
    }
  };

  const handlePublish = async () => {
    if (!generatedProfile) {
      return;
    }

    setIsPublishing(true);
    setError(null);

    try {
      const username = await publishGeneratedProfile(generatedProfile);
      persistAccountUsername(username);
      await dispatch(getProfile() as any);
      const origin = window.location.origin;
      setPublicUrl(`${origin}/${encodeURIComponent(username)}`);
      setStep("success");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unable to publish profile.");
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <MarketingLayout mainSx={onboardingPageSx.container} embedded>
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
                  "Upload a PDF or Word resume, paste text, or answer a few questions. AI will draft your portfolio and resume using free-tier Groq and Gemini APIs, so generation can be slower or unavailable when usage limits are hit."}
                {step === "generating" && "Generating your profile. This usually takes 10–30 seconds."}
                {step === "review" && "Review the AI draft below. You can edit before publishing."}
                {step === "success" && "Share your link anywhere. You can keep editing from your dashboard."}
              </Typography>
            </Box>

            {error ? <Alert severity="error">{error}</Alert> : null}
            {step === "input" && !error ? (
              <Alert severity="info">
                {AI_FREE_TIER_PERFORMANCE} {AI_FREE_TIER_TRADEOFFS}
              </Alert>
            ) : null}

            {step === "input" ? (
              <Stack spacing={2}>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={resumeAcceptAttribute()}
                  hidden
                  onChange={(event) => void handleResumeFile(event.target.files?.[0])}
                />

                <Box
                  role="button"
                  tabIndex={0}
                  aria-label="Upload resume PDF or Word file"
                  onClick={() => !isParsingFile && fileInputRef.current?.click()}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      if (!isParsingFile) fileInputRef.current?.click();
                    }
                  }}
                  onDragEnter={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    setIsDragActive(true);
                  }}
                  onDragOver={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    setIsDragActive(true);
                  }}
                  onDragLeave={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    setIsDragActive(false);
                  }}
                  onDrop={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    setIsDragActive(false);
                    void handleResumeFile(event.dataTransfer.files?.[0]);
                  }}
                  sx={[
                    onboardingPageSx.uploadZone,
                    isDragActive ? onboardingPageSx.uploadZoneActive : null,
                    isParsingFile ? { opacity: 0.75, pointerEvents: "none" } : null,
                  ]}
                >
                  <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
                    {isParsingFile ? (
                      <CircularProgress size={28} />
                    ) : uploadedFileName ? (
                      <DescriptionOutlinedIcon sx={{ color: "#b91c1c", fontSize: 28 }} />
                    ) : (
                      <CloudUploadOutlinedIcon sx={{ color: "#64748b", fontSize: 28 }} />
                    )}
                    <Box sx={{ minWidth: 0 }}>
                      <Typography sx={onboardingPageSx.uploadTitle}>
                        {isParsingFile
                          ? "Reading your resume..."
                          : uploadedFileName
                            ? uploadedFileName
                            : "Upload PDF or Word resume"}
                      </Typography>
                      <Typography sx={onboardingPageSx.uploadHint}>
                        {uploadedFileName
                          ? "Text extracted below — edit if needed, then generate."
                          : "Drag and drop, or click to browse (.pdf, .docx · max 8 MB)"}
                      </Typography>
                    </Box>
                  </Stack>
                </Box>

                <TextField
                  label="Resume or background"
                  placeholder="Paste your resume, LinkedIn About section, or describe your experience..."
                  multiline
                  minRows={8}
                  value={resumeText}
                  onChange={(event) => {
                    setResumeText(event.target.value);
                    if (uploadedFileName) setUploadedFileName(null);
                  }}
                  helperText={
                    uploadedFileName
                      ? "Extracted from your upload. You can edit this before generating."
                      : "Optional if you upload a file or fill the fields below."
                  }
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
                    disabled={!canGenerate || isParsingFile}
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
                <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                  <TextField
                    label="First name"
                    value={generatedProfile.resume.personalInfo.firstName}
                    onChange={(event) =>
                      setGeneratedProfile({
                        ...generatedProfile,
                        resume: {
                          ...generatedProfile.resume,
                          personalInfo: {
                            ...generatedProfile.resume.personalInfo,
                            firstName: event.target.value,
                          },
                        },
                      })
                    }
                    fullWidth
                  />
                  <TextField
                    label="Last name"
                    value={generatedProfile.resume.personalInfo.lastName}
                    onChange={(event) =>
                      setGeneratedProfile({
                        ...generatedProfile,
                        resume: {
                          ...generatedProfile.resume,
                          personalInfo: {
                            ...generatedProfile.resume.personalInfo,
                            lastName: event.target.value,
                          },
                        },
                      })
                    }
                    fullWidth
                  />
                </Stack>
                <TextField
                  label="Phone"
                  value={generatedProfile.contact.phone}
                  onChange={(event) =>
                    setGeneratedProfile({
                      ...generatedProfile,
                      contact: { ...generatedProfile.contact, phone: event.target.value },
                      resume: {
                        ...generatedProfile.resume,
                        personalInfo: {
                          ...generatedProfile.resume.personalInfo,
                          contactNo: event.target.value,
                        },
                      },
                    })
                  }
                  helperText="Shown at the bottom of your public profile."
                  fullWidth
                />
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
                    Portfolio and resume are saved to your account.
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
                    to={DASHBOARD_PATH}
                    variant="contained"
                    sx={[onboardingPageSx.primaryButton, accentRedContainedButtonSx]}
                  >
                    Open portfolio
                  </Button>
                  <Button
                    component={RouterLink}
                    to="/accent-sidebar/resume"
                    variant="outlined"
                    sx={onboardingPageSx.secondaryButton}
                  >
                    Open resume
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
