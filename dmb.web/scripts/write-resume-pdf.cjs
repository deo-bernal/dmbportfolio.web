const { PDFDocument, StandardFonts, rgb } = require("pdf-lib");
const fs = require("fs");
const path = require("path");

const jobs = [
  ["Senior Software Developer (Hybrid)", "Ezerec", "Apr 2023 – Mar 2026", "Built high-performance web apps with React, React Native, .NET Core (C#) MVC and MS SQL. Used Cursor and GitHub Copilot to speed delivery. Travel industry Enterprise Management System."],
  ["Senior Software Engineer (WFH)", "Cloudstaff", "Nov 2020 – Jun 2023", "Technical analysis, enhancements, and coding standards. Angular 4–14, .NET Core C#, MVC, MS SQL, MongoDB, Docker, RabbitMQ, GCP, HubSpot, PingIdentity. MortgageChoice, CustomerData.Contact, Tardis Omniverse."],
  ["Senior Software Developer - TL (On-site)", "Ezerec", "Feb 2017 – Oct 2020", "Led ERP web team through development, testing, and support. Migrated legacy systems to Angular / React / .NET Core / MS SQL. Agile delivery, standards, and coaching. CMS and Enterprise Management System."],
  ["Senior Software Engineer (On-site)", "Cloudstaff", "Nov 2015 – Jan 2017", "Internet banking with ASP.NET C#, WCF, and MS SQL. Credit card management with REST APIs, WCF, EF6, and IoC/DI. Project: Rubik."],
  ["Back / Front-End Web Developer (WFH)", "Indigo Web", "Jun 2009 – Aug 2015", "CMS, e-commerce, and web apps with ASP.NET C# / VB.NET, MVC, Umbraco, and MS SQL. Internal AngularJS project management app, system and database design, basic SEO and responsive UI."],
  ["Senior Web Developer (Dubai)", "Team Power International", "Aug 2007 – Apr 2009", "E-commerce and payment gateway with ASP.NET C#, XML, and MS SQL. Chat app (AJAX) and a training management system."],
  ["Software Engineer (Bahrain)", "CompuEx", "Jul 2006 – Jun 2007", "ERP systems (accounting, HR, purchasing) with VB6, Crystal Reports, and MS SQL. Database migration tools and POS maintenance."],
  ["Software Programmer (On-site)", "Amertron Incorporated", "Feb 2006 – Jul 2006", "ERP lot tracking, accounting, warehouse, HR, and purchasing. Custom lot tracking modules in ASP.NET C#."],
  ["Software Programmer (On-site)", "Enigma Technologies", "Jan 2005 – Feb 2006", "Web apps including Locator (weekly schedule) and Express Medic (patient records and appointments) with VB.NET / ASP.NET and SQL Server. POS work in VB6 and Crystal Reports."],
];

async function main() {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const pageSize = [612, 792];
  const margin = 48;
  const width = pageSize[0] - margin * 2;
  const navy = rgb(0.09, 0.16, 0.29);
  const muted = rgb(0.29, 0.33, 0.39);
  const body = rgb(0.12, 0.16, 0.23);
  const rule = rgb(0.73, 0.11, 0.11);

  let page = doc.addPage(pageSize);
  let y = 744;

  const ensure = (need) => {
    if (y - need < 48) {
      page = doc.addPage(pageSize);
      y = 744;
    }
  };

  const wrap = (text, size, face, max = width) => {
    const words = text.split(/\s+/);
    const lines = [];
    let line = "";
    for (const word of words) {
      const next = line ? `${line} ${word}` : word;
      if (face.widthOfTextAtSize(next, size) > max && line) {
        lines.push(line);
        line = word;
      } else {
        line = next;
      }
    }
    if (line) lines.push(line);
    return lines;
  };

  const text = (value, size, face, color, x = margin) => {
    page.drawText(value, { x, y, size, font: face, color });
  };

  text("DEO BERNAL", 22, bold, navy);
  y -= 18;
  text("Senior Full-Stack Developer", 11, font, muted);
  y -= 16;
  text("deobernal@gmail.com  ·  +63 925 455 6063  ·  Porac, Pampanga, Philippines", 9, font, muted);
  y -= 12;
  text("PRC ECE License 0017233  ·  www.dmbwebsolutions.com/deobernal@gmail.com", 9, font, muted);
  y -= 10;
  page.drawRectangle({ x: margin, y, width, height: 2, color: rule });
  y -= 22;

  const section = (title) => {
    ensure(28);
    text(title.toUpperCase(), 11, bold, navy);
    y -= 6;
    page.drawRectangle({ x: margin, y, width, height: 0.8, color: rgb(0.82, 0.84, 0.86) });
    y -= 16;
  };

  section("Summary");
  const summary =
    "Seasoned full-stack developer with 20 years of experience delivering end-to-end solutions across web, mobile, and cloud. Expert in Angular, React, .NET Core, and AI-assisted development. Drives rapid delivery while keeping high code quality. Thrives in collaborative agile teams: shaping requirements, building scalable systems, and mentoring.";
  for (const line of wrap(summary, 10, font)) {
    ensure(14);
    text(line, 10, font, body);
    y -= 13;
  }
  y -= 8;

  section("Skills");
  const skills =
    "C#, .NET Core, ASP.NET MVC, React, React Native, Angular, SQL Server, MongoDB, REST APIs, Azure, GCP, Docker, RabbitMQ, HubSpot, WCF, EF6, Umbraco, Bootstrap, Cursor, GitHub Copilot";
  for (const line of wrap(skills, 10, font)) {
    ensure(14);
    text(line, 10, font, body);
    y -= 13;
  }
  y -= 8;

  section("Work History");
  for (const [role, company, dates, detail] of jobs) {
    const detailLines = wrap(detail, 9.5, font);
    ensure(36 + detailLines.length * 12);
    text(`${role} — ${company}`, 10.5, bold, navy);
    y -= 13;
    text(dates, 9, font, muted);
    y -= 13;
    for (const line of detailLines) {
      text(line, 9.5, font, body);
      y -= 12;
    }
    y -= 8;
  }

  section("Education");
  text("Bachelor of Science in Electronics and Communications Engineering", 10.5, bold, navy);
  y -= 13;
  text("Holy Angel University  ·  Angeles City, Philippines  ·  1993 – 1998", 9, font, muted);
  y -= 20;

  section("Licensure");
  text("Electronics and Communications Engineer — PRC License 0017233", 10.5, bold, navy);
  y -= 13;
  text("Electronics and Communications Engineer Licensure Examination, 4–5 Nov 1998, Manila.", 9.5, font, body);

  const out = path.join(__dirname, "..", "public", "files", "Deo_Bernal_Resume.pdf");
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, await doc.save());
  console.log(out);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
