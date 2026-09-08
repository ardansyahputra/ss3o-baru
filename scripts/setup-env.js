const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const ROOT = path.join(__dirname, "..");
const ENV_PATH = path.join(ROOT, ".env");
const ENV_EXAMPLE_PATH = path.join(ROOT, ".env.example");

function main() {
  if (fs.existsSync(ENV_PATH)) {
    console.log("ℹ️  .env sudah ada, tidak diubah.");
    return;
  }

  const secret = crypto.randomBytes(32).toString("base64");

  let content;
  if (fs.existsSync(ENV_EXAMPLE_PATH)) {
    content = fs.readFileSync(ENV_EXAMPLE_PATH, "utf8");
    content = content.replace(
      /NEXTAUTH_SECRET=.*/,
      `NEXTAUTH_SECRET="${secret}"`
    );
  } else {
    content = `NEXTAUTH_URL="http://localhost:3000"\nNEXTAUTH_SECRET="${secret}"\nUPLOAD_MAX_SIZE_MB=5\nUPLOAD_DIR="./public/uploads"\n`;
  }

  fs.writeFileSync(ENV_PATH, content);
  console.log("✅ .env otomatis dibuat dengan NEXTAUTH_SECRET acak. Tidak perlu edit apa pun.");
}

main();
