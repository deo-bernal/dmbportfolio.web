import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import type { AppThunk } from "../store";
import { resolvePublicApiBaseUrl } from "../config";
import api from "../services/http.service";
import {
  readPublicProfileCache,
  writePublicProfileCache,
} from "../services/publicContentCache";
import {
  firstNameFromFullName,
  persistAccountFirstName,
  readAccountFirstName,
} from "../utils/accountGreeting";
import type { ApiUser, Profile, ProjectCategory, ProjectItem } from "models";

type UserState = {
  profile: Profile | null;
  accountFirstName: string;
  isLoading: boolean;
  error: string | null;
};

const initialState: UserState = {
  profile: null,
  accountFirstName: readAccountFirstName(),
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
      const categoryTitle = (project.projectType?.typeName || "Other").trim() || "Other";
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
    username: primaryUser.username ?? "",
    name:
      [primaryUser.firstName, primaryUser.lastName].filter(Boolean).join(" ") ||
      "Profile",
    summary: details?.description ?? "",
    video: details?.video ?? "",
    isViewable: primaryUser.isViewable ?? false,
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
    getProfileSuccess(state, action: PayloadAction<{ profile: Profile; accountFirstName?: string }>) {
      state.profile = action.payload.profile;
      if (action.payload.accountFirstName) {
        state.accountFirstName = action.payload.accountFirstName;
      }
      state.isLoading = false;
      state.error = null;
    },
    getProfileFailure(state, action: PayloadAction<{ error: string }>) {
      state.isLoading = false;
      state.error = action.payload.error;
    },
    clearProfile(state) {
      state.profile = null;
      state.accountFirstName = "";
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
      const profile = mapProfileDetailsToProfile(res.data);
      const firstName = res.data.firstName || firstNameFromFullName(profile.name);
      persistAccountFirstName(firstName);
      dispatch(slice.actions.getProfileSuccess({ profile, accountFirstName: firstName }));
    } catch (error: any) {
      if (error?.response?.status === 401) {
        if (onUnauthorized) onUnauthorized();
        dispatch(slice.actions.clearProfile());
        return;
      }
      if (error?.response?.status === 404) {
        dispatch(slice.actions.clearProfile());
        return;
      }
      dispatch(slice.actions.getProfileFailure({ error: "Unable to load profile details." }));
    }
  };

export const getPublicProfile = (username: string): AppThunk => async (dispatch): Promise<void> => {
  const cachedApiUser = readPublicProfileCache<ApiUser>(username);
  const cachedProfile = cachedApiUser ? mapProfileDetailsToProfile(cachedApiUser) : null;

  if (cachedProfile) {
    dispatch(slice.actions.getProfileSuccess({ profile: cachedProfile }));
  } else {
    dispatch(slice.actions.getProfileStart());
  }

  try {
    const res = await api.get<ApiUser>("/publicprofile", {
      baseURL: resolvePublicApiBaseUrl(),
      params: { username },
    });
    writePublicProfileCache(username, res.data);
    dispatch(slice.actions.getProfileSuccess({ profile: mapProfileDetailsToProfile(res.data) }));
  } catch (error: any) {
    if (cachedProfile) {
      return;
    }
    if (error?.response?.status === 404) {
      dispatch(slice.actions.getProfileFailure({ error: "This portfolio is not publicly viewable." }));
      return;
    }
    dispatch(slice.actions.getProfileFailure({ error: "Unable to load profile details." }));
  }
};

export const { clearProfile } = slice.actions;
export default slice;
