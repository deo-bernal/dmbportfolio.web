import type { Dispatch, SetStateAction } from "react";
import type { Profile } from "models";

export type FormMode = "view" | "edit";

export type TabViewProps = {
  profile: Profile;
  draft: Profile;
  mode: FormMode;
  setDraft: Dispatch<SetStateAction<Profile>>;
  cloneProfile: (profile: Profile) => Profile;
  onImmediatePersist: (nextProfile: Profile, successMessage: string) => Promise<void>;
};
