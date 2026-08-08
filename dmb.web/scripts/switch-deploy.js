const fs = require("fs");
const path = require("path");

const target = (process.argv[2] || "").toLowerCase();

if (target !== "vercel" && target !== "azure") {
  console.error("Usage: node scripts/switch-deploy.js <vercel|azure>");
  process.exit(1);
}

const root = path.join(__dirname, "..");

function copyTemplate(relativePath) {
  const source = path.join(root, `${relativePath}.${target}`);
  const destination = path.join(root, relativePath);

  if (!fs.existsSync(source)) {
    throw new Error(`Missing template file: ${source}`);
  }

  fs.copyFileSync(source, destination);
  console.log(`  ${relativePath}.${target} -> ${relativePath}`);
}

try {
  console.log(`Switching deploy target to "${target}"...`);
  copyTemplate(".env");
  copyTemplate("public/index.html");

  if (target === "vercel") {
    copyTemplate("vercel.json");
    const staticWebAppConfig = path.join(root, "staticwebapp.config.json");
    if (fs.existsSync(staticWebAppConfig)) {
      fs.unlinkSync(staticWebAppConfig);
      console.log("  removed staticwebapp.config.json");
    }
  } else {
    copyTemplate("staticwebapp.config.json");
    copyTemplate("vercel.json");
  }

  fs.writeFileSync(path.join(root, ".deploy-target"), target, "utf8");
  console.log(`Done. Active deploy target: ${target}`);
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
