import axios from "axios";
import api from "./http.service";
import type { ApiUser } from "models";

function profileHasContent(user: ApiUser): boolean {
  const details = user.userDetails;
  const hasSummary = Boolean(details?.description?.trim());
  const hasSkills = Boolean(details?.skills?.trim());
  const hasProjects = (user.projects?.length ?? 0) > 0;
  return hasSummary || hasSkills || hasProjects;
}

export async function resolvePostLoginPath(): Promise<string> {
  try {
    const { data } = await api.get<ApiUser>("/profiledetails");
    return profileHasContent(data) ? "/accent-sidebar/portfolio" : "/onboarding";
  } catch (error: unknown) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      return "/onboarding";
    }
    return "/accent-sidebar/portfolio";
  }
}
