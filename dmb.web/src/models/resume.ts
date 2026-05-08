export type ResumePersonalInfo = {
  firstName: string;
  lastName: string;
  contactNo: string;
  email: string;
  address: string;
  summary: string;
};

export type WorkHistoryItem = {
  company: string;
  position: string;
  fromDate: string;
  toDate: string;
  jobDescription: string;
};

export type EducationItem = {
  school: string;
  address: string;
  courseTaken: string;
  startDate: string;
  endDate: string;
};

export type ResumeProfile = {
  personalInfo: ResumePersonalInfo;
  workHistory: WorkHistoryItem[];
  education: EducationItem[];
};

export const EMPTY_RESUME_PROFILE: ResumeProfile = {
  personalInfo: {
    firstName: "",
    lastName: "",
    contactNo: "",
    email: "",
    address: "",
    summary: "",
  },
  workHistory: [],
  education: [],
};
