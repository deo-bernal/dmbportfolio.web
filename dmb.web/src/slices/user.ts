import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import type { AppThunk } from "../store";
import api from "../services/http.service";

export type ProjectItem = {
  name: string;
  description: string;
};

export type ProjectCategory = {
  title: string;
  items: ProjectItem[];
};

export type Contact = {
  email: string;
  phone: string;
};

export type Profile = {
  name: string;
  summary: string;
  video: string;
  skills: string[];
  projectCategories: ProjectCategory[];
  contact: Contact;
};

type ApiUser = {
  userId: number;
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  contactNo?: string | null;
  activated: boolean;
  createdAt: string;
  userDetails?: ApiUserDetails | null;
  projects: ApiProject[];
};

type ApiUserDetails = {
  userId: number;
  description?: string | null;
  skills?: string | null;
  video?: string | null;
};

type ApiProject = {
  userId: number;
  name: string;
  type: string;
  projectDetails?: string | null;
};

type UserState = {
  profile: Profile | null;
  isLoading: boolean;
  error: string | null;
};

const initialState: UserState = {
  profile: null,
  isLoading: false,
  error: null,
};

function mapProfileDetailsToProfile(primaryUser: ApiUser): Profile {
  const details = primaryUser.userDetails;
  const parsedSkills = (details?.skills ?? "")
    .split(/[,\n;]+/)
    .map((skill) => skill.trim())
    .filter(Boolean);

  const groupedProjects = (primaryUser.projects ?? []).reduce<ProjectCategory[]>(
    (categories, project) => {
      const categoryTitle = (project.type || "Other").trim() || "Other";
      const existingCategory = categories.find(
        (category) => category.title === categoryTitle
      );

      const item: ProjectItem = {
        name: project.name,
        description: project.projectDetails ?? "",
      };

      if (existingCategory) {
        existingCategory.items.push(item);
        return categories;
      }

      categories.push({ title: categoryTitle, items: [item] });
      return categories;
    },
    []
  );

  return {
    name:
      [primaryUser.firstName, primaryUser.lastName].filter(Boolean).join(" ") ||
      "Profile",
    summary: details?.description ?? "",
    video: details?.video ?? "",
    skills: parsedSkills,
    projectCategories: groupedProjects,
    contact: {
      email: primaryUser.email ?? "",
      phone: primaryUser.contactNo ?? "",
    },
  };
}

const slice = createSlice({
  name: "user",
  initialState,
  reducers: {
    getProfileStart(state) {
      state.isLoading = true;
      state.error = null;
    },
    getProfileSuccess(state, action: PayloadAction<{ profile: Profile }>) {
      state.profile = action.payload.profile;
      state.isLoading = false;
      state.error = null;
    },
    getProfileFailure(state, action: PayloadAction<{ error: string }>) {
      state.isLoading = false;
      state.error = action.payload.error;
    },
    clearProfile(state) {
      state.profile = null;
      state.isLoading = false;
      state.error = null;
    },
  },
});

export const reducer = slice.reducer;

export const getProfile =
  (onUnauthorized?: () => void): AppThunk =>
  async (dispatch): Promise<void> => {
    dispatch(slice.actions.getProfileStart());
    try {
      const res = await api.get<ApiUser>("/profiledetails");
      dispatch(slice.actions.getProfileSuccess({ profile: mapProfileDetailsToProfile(res.data) }));
    } catch (error: any) {
      if (error?.response?.status === 401) {
        if (onUnauthorized) onUnauthorized();
        dispatch(slice.actions.clearProfile());
        return;
      }
      dispatch(slice.actions.getProfileFailure({ error: "Unable to load profile details." }));
    }
  };

export const { clearProfile } = slice.actions;
export default slice;
