import type { ResumeProfile } from "models";

export const DEO_PUBLIC_USERNAME = "deobernal@gmail.com";

export function isDeoPublicUsername(username: string): boolean {
  try {
    return decodeURIComponent(username).trim().toLowerCase() === DEO_PUBLIC_USERNAME;
  } catch {
    return username.trim().toLowerCase() === DEO_PUBLIC_USERNAME;
  }
}

/** Mirrors Downloads/Resume/Deo_Bernal_Resume.pdf — do not invent a different resume. */
export const DEO_RESUME: ResumeProfile & { skills: string; title: string } = {
  title: "Full-Stack Web Developer / Software Engineer — AI-Assisted Development",
  personalInfo: {
    firstName: "Deo",
    lastName: "Bernal",
    email: "deobernal@gmail.com",
    contactNo: "+63 925 455 6063",
    address: "142 Camia St. Brgy. Siñura, Porac, Pampanga, Philippines",
    summary:
      "To fully utilize my professional experience as a WEB DEVELOPER/SOFTWARE ENGINEER in an environment where human resource potential is valued and recognized through continuous development and growth.\n\nWith 20 years of experience in developing software in full-stack solutions that include AngularJS, Angular, React, .NET Core C#, SQL and cloud-native technologies. Proven track record of owning features end-to-end — from shaping requirements with stakeholders through to delivery and release. Experienced in AI-assisted development using Claude Code, GitHub Copilot, and Cursor to accelerate delivery without compromising quality.",
  },
  skills:
    "AngularJS, Angular, React, Next.js, TypeScript, .NET Core C#, SQL, PostgreSQL, MongoDB, cloud-native (GCP, Azure, Vercel, Railway), Convex, n8n, Playwright, Claude Code, GitHub Copilot, Cursor",
  workHistory: [
    {
      position: "Software Developer & Systems Integrations Specialist (WFH)",
      company: "HRR",
      fromDate: "2026-05-18",
      toDate: "",
      jobDescription:
        "Owns features end-to-end for a construction & home services client — from requirement shaping with stakeholders through implementation, testing, and deployment — working independently across the full stack (Next.js / React / TypeScript frontend, PostgreSQL backend, Convex BaaS, Railway / Vercel infrastructure). Uses Claude Code as primary AI coding agent to drive delivery velocity: integrates LLMs (Anthropic Claude, Google Gemini) for data extraction, classification, and grounded web lookup; builds end-to-end workflow automation via n8n, Playwright, Drive / Sheets APIs, and cron. Projects: Company website; Xactimate/Estimate Workflow; Referral Partner Database Builder.",
    },
    {
      position: "Senior Software Developer (Hybrid)",
      company: "Ezerec",
      fromDate: "2023-04-01",
      toDate: "2026-03-31",
      jobDescription:
        "Developed and maintained high-performance web applications using React 17.0.2, React Native, .NET Core (C#) MVC and MS SQL, leveraging AI-driven tools (Cursor, GitHub Copilot) to accelerate coding speed and efficiency while maintaining test coverage and code quality. Collaborated directly with product and stakeholders through agile sprints. Project (Travel Industry): Enterprise Management System (ReactJS, .NET Core MVC, MS SQL).",
    },
    {
      position: "Senior Software Engineer (WFH)",
      company: "Cloudstaff",
      fromDate: "2020-11-02",
      toDate: "2023-06-02",
      jobDescription:
        "Conducted technical analysis of proposed solution designs, committed code changes, and adhered to coding standards. Tech stack: Angular 4/9/12/13/14, .NET Core C#, MVC, MS SQL, MongoDB, Docker, RabbitMQ, GCP, HubSpot, PingIdentity. Projects: MortgageChoice; CustomerData.Contact; Tardis Omniverse.",
    },
    {
      position: "Senior Software Developer – Team Lead (On-site)",
      company: "Ezerec",
      fromDate: "2017-02-01",
      toDate: "2020-10-30",
      jobDescription:
        "Led ERP web app team end-to-end: decomposing features into vertical slices, agile sprints, implementation, peer review, and production release. Drove migration of legacy systems to Angular / React / .NET Core / MS SQL. Established coding standards, TDD, and unit testing. Projects: Content Management System; Enterprise Management System.",
    },
    {
      position: "Senior Software Engineer (On-site)",
      company: "Cloudstaff",
      fromDate: "2015-11-01",
      toDate: "2017-01-31",
      jobDescription:
        "Developed internet banking applications using ASP.NET C#, WCF, and MS SQL. Contributed to a credit card management system using REST APIs, WCF, EF6, and IoC/DI. Project: Rubik — Banking Management system.",
    },
    {
      position: "Back/Front-End Web Developer (WFH)",
      company: "Indigo Web",
      fromDate: "2009-06-22",
      toDate: "2015-08-27",
      jobDescription:
        "Developed full-stack CMS, e-commerce, and web applications using ASP.NET C#/VB.NET, MVC, Umbraco, and MS SQL. Managed an internal AngularJS project management app. Implemented basic SEO and responsive Bootstrap UI. Project: Content Management System (Umbraco, C# MVC, MS SQL).",
    },
    {
      position: "Web Applications Developer (WFH)",
      company: "First Call Computing",
      fromDate: "2009-06-16",
      toDate: "2011-07-25",
      jobDescription:
        "Developed web applications using ASP Classic, JavaScript, and MS SQL with stored procedures and Flash integration. Ensured cross-browser compatibility.",
    },
    {
      position: "Web Designer/Developer (WFH)",
      company: "Think Innovations",
      fromDate: "2009-06-22",
      toDate: "2011-04-29",
      jobDescription:
        "Developed web and intranet applications using ASP.NET C#, Telerik controls, ORM, and MS SQL. Built a document management system with structured content, search, PDF export, and user-managed data.",
    },
    {
      position: "Senior Web Developer (Dubai)",
      company: "Team Power International",
      fromDate: "2007-08-31",
      toDate: "2009-04-03",
      jobDescription:
        "Maintained and enhanced an e-commerce website including payment gateway fixes (ASP.NET C#, XML, MS SQL). Developed a chat application and a training management system. Project: eCommerce Software (AspDotNetStorefront).",
    },
    {
      position: "Software Engineer (Bahrain)",
      company: "CompuEx",
      fromDate: "2006-07-11",
      toDate: "2007-06-21",
      jobDescription:
        "Developed and maintained ERP systems (accounting, HR, purchasing) using VB6, Crystal Reports, and MS SQL. Built a database migration tool from SQL, Access, FoxPro, and Excel into MS SQL.",
    },
    {
      position: "Software Programmer (On-site)",
      company: "Amertron Incorporated",
      fromDate: "2006-02-27",
      toDate: "2006-07-10",
      jobDescription:
        "Maintained and enhanced ERP systems including lot tracking, accounting, warehouse, HR, and purchasing. Customized a browser-based lot tracking system using ASP.NET C#.",
    },
    {
      position: "Software Programmer (On-site)",
      company: "Enigma Technologies",
      fromDate: "2005-01-03",
      toDate: "2006-02-21",
      jobDescription:
        "Developed a web-based Locator app and Express Medic (patient records & scheduling) using VB.NET, ASP.NET, and SQL Server. Customized POS software using VB6 and Crystal Reports.",
    },
  ],
  education: [
    {
      school: "Holy Angel University",
      address: "Angeles City, Philippines",
      courseTaken: "Bachelor of Science in Electronics and Communications Engineering. Self-financed 90% of college expenses.",
      startDate: "1993-01-01",
      endDate: "1998-12-31",
    },
  ],
  affiliations: [
    {
      organization: "Professional Regulations Commission (PRC), Manila, Philippines",
      title: "Electronics and Communications Engineer Licensure Examination",
      issueDate: "1998-11-05",
      details: "November 4–5, 1998. License Number: 0017233.",
    },
  ],
};
