import { fileURLToPath } from "node:url";
import { config as loadEnvironmentFile } from "dotenv";
import { loadConfig } from "./config.js";
import { SmtpAuthMailer } from "./mailer.js";

loadEnvironmentFile({ path: fileURLToPath(new URL("../../../.env", import.meta.url)) });

async function main() {
  console.log("==================================================");
  console.log("Quran Feham · SMTP Configuration & Transport Check");
  console.log("==================================================");

  const config = loadConfig();

  if (!config.smtp) {
    console.warn("⚠️  No SMTP configuration detected in environment.");
    console.log("Required environment variables for live emailing:");
    console.log("  - SMTP_HOST (e.g. smtp.gmail.com, mail.yourdomain.com)");
    console.log("  - SMTP_PORT (e.g. 465 or 587)");
    console.log("  - SMTP_USER (e.g. noreply@fehmequran.org or your email)");
    console.log("  - SMTP_PASS (e.g. your application password)");
    console.log("  - SMTP_FROM (e.g. 'Quran Feham <noreply@fehmequran.org>')");
    console.log("  - SMTP_SECURE (optional, 'true' for port 465)");
    console.log("  - SMTP_SERVICE (optional preset, e.g. 'gmail')");
    process.exit(0);
  }

  console.log(`Connecting to SMTP server...`);
  if (config.smtp.service) {
    console.log(`- Service Preset: ${config.smtp.service}`);
  } else {
    console.log(`- Host: ${config.smtp.host}:${config.smtp.port}`);
  }
  console.log(`- User: ${config.smtp.user}`);
  console.log(`- From: ${config.smtp.from}`);
  console.log(`- Secure (SSL/TLS): ${config.smtp.secure ? "Yes" : "No"}`);

  const mailer = new SmtpAuthMailer(config.smtp);

  try {
    await mailer.verify();
    console.log("✅ SMTP Connection & Authentication Successful!");

    const testRecipient = process.argv[2];
    if (testRecipient && testRecipient.includes("@")) {
      console.log(`\nSending branded test email to: ${testRecipient}...`);
      await mailer.send({
        email: testRecipient,
        code: "948201",
        expiresAt: new Date(Date.now() + 15 * 60 * 1000),
        kind: "verify-email",
        appOrigin: config.smtp.appOrigin,
      });
      console.log("✅ Branded test email delivered successfully!");
    } else {
      console.log("\n💡 Tip: Run with an email argument to send a test message:");
      console.log("   npm --prefix apps/api run verify-smtp your-email@example.com");
    }
  } catch (error) {
    console.error("❌ SMTP Verification Failed:", error);
    process.exit(1);
  } finally {
    mailer.close();
  }
}

main().catch((err) => {
  console.error("Unexpected error:", err);
  process.exit(1);
});
