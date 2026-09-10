import axios from "axios";
import type { GeneratedProfile } from "models/aiProfile";
import type { UpdateProfileRequest } from "models";
import api from "services/http.service";

type AccountInfo = {
  firstName: string;
  lastName: string;
  contactNo: string;
  email: string;
  address: string;
};

const ACCOUNT_USERNAME_KEY = "dmb:account-username";

function firstFilled(...values: Array<string | null | undefined>): string {
  for (const value of values) {
    const trimmed = String(value ?? "").trim();
    if (trimmed) return trimmed;
  }
  return "";
}

function toNullableDate(value: string): string | null {
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

export function getAccountUsername(): string {
  try {
    return sessionStorage.getItem(ACCOUNT_USERNAME_KEY) ?? "";
  } catch {
    return "";
  }
}

function buildProfilePayload(
  profile: GeneratedProfile,
  accountEmail: string,
  account: AccountInfo
): UpdateProfileRequest {
  return {
    summary: profile.summary,
    video: "",
    isViewable: true,
    skills: profile.skills,
    contact: {
      email: firstFilled(profile.resume.personalInfo.email, account.email, accountEmail),
      phone: firstFilled(
        profile.contact.phone,
        profile.resume.personalInfo.contactNo,
        account.contactNo
      ),
    },
    projectCategories:
      profile.projectCategories.length > 0
        ? profile.projectCategories
        : [{ title: "Projects", items: [{ name: "My Work", description: profile.summary }] }],
  };
}

function buildResumePayload(profile: GeneratedProfile, accountEmail: string, account: AccountInfo) {
  const personalInfo = profile.resume.personalInfo;
  return {
    personalInfo: {
      firstName: firstFilled(personalInfo.firstName, account.firstName),
      lastName: firstFilled(personalInfo.lastName, account.lastName),
      contactNo:
        firstFilled(personalInfo.contactNo, profile.contact.phone, account.contactNo) || null,
      email: firstFilled(personalInfo.email, account.email, accountEmail),
      address: firstFilled(personalInfo.address, profile.contact.address, account.address) || null,
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

async function loadAccountInfo(accountEmail: string): Promise<AccountInfo> {
  try {
    const res = await api.get<{
      personalInfo?: {
        firstName?: string;
        lastName?: string;
        contactNo?: string;
        email?: string;
        address?: string;
      };
    }>("/resume");
    const info = res.data?.personalInfo;
    return {
      firstName: firstFilled(info?.firstName),
      lastName: firstFilled(info?.lastName),
      contactNo: firstFilled(info?.contactNo),
      email: firstFilled(info?.email, accountEmail),
      address: firstFilled(info?.address),
    };
  } catch {
    return {
      firstName: "",
      lastName: "",
      contactNo: "",
      email: accountEmail,
      address: "",
    };
  }
}

function publishError(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    const message = error.response?.data?.message;
    if (typeof message === "string" && message.trim()) return message;
    if (error.code === "ECONNABORTED") return "The profile API timed out. Click Allow again.";
  }
  return fallback;
}

export async function publishGeneratedPortfolio(profile: GeneratedProfile): Promise<string> {
  const accountEmail = getAccountUsername();
  const account = await loadAccountInfo(accountEmail);
  const payload = buildProfilePayload(profile, accountEmail, account);

  try {
    await api.post("/profiledetails", payload);
  } catch (error: unknown) {
    if (axios.isAxiosError(error) && error.response?.status === 409) {
      await api.put("/profiledetails", payload);
    } else if (axios.isAxiosError(error) && error.response?.status === 404) {
      await api.put("/profiledetails", payload);
    } else {
      throw new Error(publishError(error, "Unable to save portfolio."));
    }
  }

  return firstFilled(accountEmail, payload.contact.email);
}

export async function publishGeneratedResume(profile: GeneratedProfile): Promise<string> {
  const accountEmail = getAccountUsername();
  const account = await loadAccountInfo(accountEmail);
  const payload = buildResumePayload(profile, accountEmail, account);
  try {
    await api.put("/resume", payload);
  } catch (error: unknown) {
    throw new Error(publishError(error, "Unable to save resume."));
  }
  return firstFilled(accountEmail, payload.personalInfo.email);
}
