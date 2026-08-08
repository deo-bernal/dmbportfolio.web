const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const envPath = path.join(root, ".env");
const markerPath = path.join(root, ".deploy-target");

if (fs.existsSync(envPath)) {
  process.exit(0);
}

const defaultTarget = "vercel";
fs.copyFileSync(path.join(root, `.env.${defaultTarget}`), envPath);
fs.copyFileSync(path.join(root, `public/index.html.${defaultTarget}`), path.join(root, "public/index.html"));
fs.copyFileSync(path.join(root, `vercel.json.${defaultTarget}`), path.join(root, "vercel.json"));
fs.writeFileSync(markerPath, defaultTarget, "utf8");
console.log(`Created default ${defaultTarget} deploy files (.env was missing).`);
