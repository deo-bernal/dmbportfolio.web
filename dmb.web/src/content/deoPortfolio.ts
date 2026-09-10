import type { Profile } from "models";
import { DEO_PUBLIC_USERNAME, DEO_RESUME } from "./deoResume";

export { DEO_PUBLIC_USERNAME, isDeoPublicUsername } from "./deoResume";

/** Live public profile snapshot so first paint does not wait on Render. */
export const DEO_PORTFOLIO: Profile = {
  username: DEO_PUBLIC_USERNAME,
  name: "Deo Bernal",
  summary:
    "Seasoned full-stack developer with 20 years of experience delivering end-to-end solutions across web, mobile, and cloud platforms. Expert in Angular, React, .NET Core, and AI-assisted development, I drive rapid delivery while maintaining high code quality. I thrive in collaborative, agile environments, shaping requirements, building scalable systems, and mentoring teams.",
  video: "",
  isViewable: true,
  skills: [
    "Angular",
    "React",
    ".NET Core",
    "SQL",
    "TypeScript",
    "Next.js",
    "Docker",
    "RabbitMQ",
    "AI-assisted development",
    "Cloud-native",
  ],
  projectCategories: [
    {
      title: "Construction & Home Services",
      items: [
        {
          name: "Company Website",
          description:
            "Public marketing site built with React, Next.js, Convex, Clerk, and Google Gemini, fully planned, developed, and deployed without handoff gaps.",
        },
        {
          name: "Xactimate/Estimate Workflow",
          description:
            "Insurance estimate workflow that transformed ambiguous requirements into a clear, testable implementation using React, Next.js, Convex, Clerk, and Railway PostgreSQL.",
        },
        {
          name: "Referral Partner Database Builder",
          description:
            "Internal tool that deduplicates and maintains a contact-ready list, integrating Playwright automation and LLM-powered deduplication logic.",
        },
      ],
    },
    {
      title: "Travel & Finance Industry",
      items: [
        {
          name: "Enterprise Management System",
          description:
            "Travel agent management platform developed with React, .NET Core MVC, and MS SQL, delivering robust business workflows and reporting.",
        },
        {
          name: "Content Management System",
          description:
            "Travel agent CMS built with AngularJS, .NET MVC, and MS SQL, providing content authors with an intuitive editing experience.",
        },
      ],
    },
  ],
  contact: {
    email: DEO_RESUME.personalInfo.email,
    phone: DEO_RESUME.personalInfo.contactNo,
  },
};
