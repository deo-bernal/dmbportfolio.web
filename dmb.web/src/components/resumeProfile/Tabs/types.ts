import type { Dispatch, SetStateAction } from "react";
import type { ResumeProfile } from "models";

export type ResumeTabProps = {
  draft: ResumeProfile;
  setDraft: Dispatch<SetStateAction<ResumeProfile>>;
  onImmediateSave?: (nextDraft: ResumeProfile) => Promise<void>;
};
