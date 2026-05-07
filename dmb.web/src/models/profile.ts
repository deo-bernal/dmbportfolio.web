// DTO-aligned profile contracts (based on ProfileDetailsController + UserCompleteDetailsDto).

export type ApiUserDetails = {
  userDetailsId: number;
  userId: number;
  description?: string | null;
  skills?: string | null;
  video?: string | null;
  createdAt: string;
};

export type ApiProject = {
  projectId: number;
  userId: number;
  projectTypeId: number;
  name: string;
  projectDetails?: string | null;
  createdAt: string;
  projectType?: {
    projectTypeId: number;
    typeName: string;
    createdAt: string;
  } | null;
};

export type ApiUser = {
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

export type PortfolioPageProps = {
  onLogout: () => void;
};
