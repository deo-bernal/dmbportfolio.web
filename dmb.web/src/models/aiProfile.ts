export type GeneratedResumeWorkHistory = {
  company: string;
  position: string;
  fromDate: string;
  toDate: string;
  jobDescription: string;
};

export type GeneratedResumeEducation = {
  school: string;
  address: string;
  courseTaken: string;
  startDate: string;
  endDate: string;
};

export type GeneratedResumeAffiliation = {
  organization: string;
  title: string;
  issueDate: string;
  details: string;
};

export type GeneratedResumePersonalInfo = {
  firstName: string;
  lastName: string;
  email: string;
  contactNo: string;
  address: string;
  summary: string;
};

export type GeneratedResume = {
  personalInfo: GeneratedResumePersonalInfo;
  workHistory: GeneratedResumeWorkHistory[];
  education: GeneratedResumeEducation[];
  affiliations: GeneratedResumeAffiliation[];
};

export type GeneratedProjectCategory = {
  title: string;
  items: Array<{
    name: string;
    description: string;
  }>;
};

export type GeneratedProfile = {
  summary: string;
  skills: string[];
  projectCategories: GeneratedProjectCategory[];
  contact: {
    phone: string;
    address: string;
  };
  resume: GeneratedResume;
};

export type GenerateProfileRequest = {
  resumeText?: string;
  roleGoal?: string;
  yearsExperience?: string;
  topSkills?: string;
  achievement?: string;
  accountEmail?: string;
};

export type GenerateProfileResponse = {
  profile: GeneratedProfile;
};

export const EMPTY_GENERATED_PROFILE: GeneratedProfile = {
  summary: "",
  skills: [],
  projectCategories: [],
  contact: {
    phone: "",
    address: "",
  },
  resume: {
    personalInfo: {
      firstName: "",
      lastName: "",
      email: "",
      contactNo: "",
      address: "",
      summary: "",
    },
    workHistory: [],
    education: [],
    affiliations: [],
  },
};
