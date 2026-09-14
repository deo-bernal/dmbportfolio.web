import axios from "axios";
import type { GeneratedProfile } from "models/aiProfile";
import type { ApiUser, UpdateProfileRequest } from "models";
import api from "services/http.service";

export type AccountInfo = {
  firstName: string;
  lastName: string;
  contactNo: string;
  email: string;
  address: string;
};

export const ACCOUNT_USERNAME_KEY = "dmb:account-username";
export const PROFILE_SAVED_EVENT = "dmb:profile-saved";

export function firstFilled(...values: Array<string | null | undefined>): string {
  for (const value of values) {
    const trimmed = String(value ?? "").trim();
    if (trimmed) return trimmed;
  }
  return "";
}

function clip(value: string, max: number): string {
  const text = String(value ?? "").trim();
  if (text.length <= max) return text;
  return text.slice(0, max).trim();
}

function sanitizePhone(value: string): string {
  const text = String(value ?? "").trim();
  if (!text) return "";
  if (text.length <= 30) return text;
  const match = text.match(/(\+?\d[\d\s().-]{6,28}\d)/);
  if (match) return clip(match[1].replace(/\s+/g, " "), 30);
  return clip(text, 30);
}

function toNullableDate(value: string): string | null {
  const trimmed = String(value ?? "").trim();
  if (!trimmed) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
  const parsed = Date.parse(trimmed);
  if (Number.isNaN(parsed)) return null;
  return new Date(parsed).toISOString().slice(0, 10);
}

export function persistAccountUsername(username: string): void {
  const trimmed = username.trim();
  if (!trimmed) return;
  try {
    sessionStorage.setItem(ACCOUNT_USERNAME_KEY, trimmed);
  } catch {
    // Ignore quota / private-mode errors.
  }
}

export function getAccountUsername(): string {
  try {
    const stored = sessionStorage.getItem(ACCOUNT_USERNAME_KEY) ?? "";
    if (stored.trim()) return stored.trim();
  } catch {
    // Ignore storage access errors.
  }
  return emailFromJwt();
}

function emailFromJwt(): string {
  try {
    const token = localStorage.getItem("token");
    if (!token) return "";
    const parts = token.split(".");
    if (parts.length < 2) return "";
    const json = atob(parts[1].replace(/-/g, "+").replace(/_/g, "/"));
    const payload = JSON.parse(json) as Record<string, unknown>;
    return firstFilled(
      typeof payload.email === "string" ? payload.email : "",
      typeof payload.unique_name === "string" ? payload.unique_name : "",
      typeof payload["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress"] === "string"
        ? String(payload["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress"])
        : "",
      typeof payload["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name"] === "string"
        ? String(payload["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name"])
        : ""
    ).toLowerCase();
  } catch {
    return "";
  }
}

export function notifyProfileSaved(): void {
  try {
    window.dispatchEvent(new CustomEvent(PROFILE_SAVED_EVENT));
  } catch {
    // Ignore if window is unavailable.
  }
}

function accountEmailForSave(account: AccountInfo, accountEmail: string): string {
  return clip(firstFilled(account.email, accountEmail, emailFromJwt()), 255);
}

export function buildProfilePayload(
  profile: GeneratedProfile,
  accountEmail: string,
  account: AccountInfo
): UpdateProfileRequest {
  return {
    summary: clip(profile.summary, 8000),
    video: "",
    isViewable: true,
    skills: Array.isArray(profile.skills)
      ? profile.skills.map((skill) => clip(String(skill), 80)).filter(Boolean).slice(0, 24)
      : [],
    contact: {
      email: accountEmailForSave(account, accountEmail),
      phone: sanitizePhone(
        firstFilled(
          profile.contact.phone,
          profile.resume.personalInfo.contactNo,
          account.contactNo
        )
      ),
    },
    projectCategories:
      profile.projectCategories.length > 0
        ? profile.projectCategories.slice(0, 8).map((category) => ({
            title: clip(category.title || "Projects", 100) || "Projects",
            items: (category.items || []).slice(0, 8).map((item) => ({
              name: clip(item.name, 200),
              description: clip(item.description || "", 4000),
            })).filter((item) => item.name),
          })).filter((category) => category.items.length > 0)
        : [{ title: "Projects", items: [{ name: "My Work", description: clip(profile.summary || "Professional work.", 4000) }] }],
  };
}

export function buildResumePayload(profile: GeneratedProfile, accountEmail: string, account: AccountInfo) {
  const personalInfo = profile.resume.personalInfo;
  const email = accountEmailForSave(account, accountEmail);
  const localPart = email.split("@")[0] || "Member";
  return {
    personalInfo: {
      firstName: clip(firstFilled(personalInfo.firstName, account.firstName, localPart), 100),
      lastName: clip(firstFilled(personalInfo.lastName, account.lastName), 100),
      contactNo: sanitizePhone(
        firstFilled(personalInfo.contactNo, profile.contact.phone, account.contactNo)
      ) || null,
      email: clip(email, 255),
      address: clip(firstFilled(personalInfo.address, profile.contact.address, account.address), 255) || null,
      summary: personalInfo.summary || profile.summary || null,
    },
    workHistory: (profile.resume.workHistory || []).map((item) => ({
      company: clip(item.company, 200),
      position: clip(item.position, 200),
      fromDate: toNullableDate(item.fromDate),
      toDate: toNullableDate(item.toDate),
      jobDescription: item.jobDescription || null,
    })).filter((item) => item.company && item.position),
    education: (profile.resume.education || []).map((item) => ({
      school: clip(item.school, 200),
      address: clip(item.address || "", 255) || null,
      courseTaken: clip(item.courseTaken || "", 255) || null,
      startDate: toNullableDate(item.startDate),
      endDate: toNullableDate(item.endDate),
    })).filter((item) => item.school),
    affiliations: (profile.resume.affiliations || []).map((item) => ({
      organization: clip(item.organization, 200),
      title: clip(item.title, 200),
      issueDate: toNullableDate(item.issueDate),
      details: item.details || null,
    })).filter((item) => item.organization && item.title),
  };
}

export async function loadAccountInfo(accountEmail: string): Promise<AccountInfo> {
  const jwtEmail = emailFromJwt();
  const [profileResult, resumeResult] = await Promise.allSettled([
    api.get<ApiUser>("/profiledetails"),
    api.get<{
      personalInfo?: {
        firstName?: string;
        lastName?: string;
        contactNo?: string;
        email?: string;
        address?: string;
      };
    }>("/resume"),
  ]);

  const user = profileResult.status === "fulfilled" ? profileResult.value.data : null;
  const info = resumeResult.status === "fulfilled" ? resumeResult.value.data?.personalInfo : null;

  const email = firstFilled(user?.email, user?.username, accountEmail, jwtEmail);
  if (email) persistAccountUsername(email);

  return {
    firstName: firstFilled(info?.firstName, user?.firstName),
    lastName: firstFilled(info?.lastName, user?.lastName),
    contactNo: firstFilled(info?.contactNo, user?.contactNo),
    email,
    address: firstFilled(info?.address),
  };
}

function publishError(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { message?: string; title?: string } | undefined;
    const message = data?.message || data?.title;
    if (typeof message === "string" && message.trim()) return message;
    if (error.code === "ECONNABORTED") return "The profile API timed out. Click Allow again.";
    if (error.response?.status) return `${fallback} (${error.response.status}).`;
  }
  return fallback;
}

export async function publishGeneratedPortfolio(profile: GeneratedProfile): Promise<string> {
  const accountEmail = getAccountUsername();
  const account = await loadAccountInfo(accountEmail);
  const payload = buildProfilePayload(profile, accountEmail, account);

  const timeout = 45000;
  try {
    await api.post("/profiledetails", payload, { timeout });
  } catch (error: unknown) {
    if (axios.isAxiosError(error) && (error.response?.status === 409 || error.response?.status === 404)) {
      await api.put("/profiledetails", payload, { timeout });
    } else {
      try {
        await api.put("/profiledetails", payload, { timeout });
      } catch {
        throw new Error(publishError(error, "Unable to save portfolio."));
      }
    }
  }

  const username = firstFilled(accountEmail, payload.contact.email, account.email);
  persistAccountUsername(username);
  return username;
}

export async function publishGeneratedResume(profile: GeneratedProfile): Promise<string> {
  const accountEmail = getAccountUsername();
  const account = await loadAccountInfo(accountEmail);
  const payload = buildResumePayload(profile, accountEmail, account);
  if (!payload.personalInfo.email) {
    throw new Error("Unable to save resume. Sign in again so we can attach it to your account.");
  }
  try {
    await api.put("/resume", payload, { timeout: 45000 });
  } catch (error: unknown) {
    throw new Error(publishError(error, "Unable to save resume."));
  }
  const username = firstFilled(accountEmail, payload.personalInfo.email, account.email);
  persistAccountUsername(username);
  return username;
}

/** Writes the generated draft to both the portfolio and resume pages. */
export async function publishGeneratedProfile(profile: GeneratedProfile): Promise<string> {
  const username = await publishGeneratedPortfolio(profile);
  await publishGeneratedResume(profile);
  notifyProfileSaved();
  return username;
}
