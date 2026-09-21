import { describe, expect, it } from "vitest";
import {
  renderKhatmCompletionTemplate,
  renderKhatmReminderTemplate,
  renderResetPasswordTemplate,
  renderVerifyEmailTemplate,
} from "./email-templates.js";

describe("Email Templates (Branded & Responsive)", () => {
  it("renders a luxury branded Verify Email template", () => {
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
    const result = renderVerifyEmailTemplate({
      email: "learner@fehmequran.org",
      code: "749201",
      expiresAt,
      appOrigin: "https://fehmequran.org",
    });

    expect(result.subject).toContain("Verify your Quran Feham email");
    expect(result.subject).toContain("تأكيد البريد الإلكتروني");

    // HTML assertions
    expect(result.html).toContain("بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ");
    expect(result.html).toContain("QURAN FEHAM");
    expect(result.html).toContain("قرآن فہم");
    expect(result.html).toContain("۞"); // Sacred Islamic Rub El Hizb symbol (100% email client safe)
    expect(result.html).not.toContain("<svg"); // No raw SVGs that email clients strip into empty boxes
    expect(result.html).toContain("7 4 9 2 0 1");
    expect(result.html).toContain("learner@fehmequran.org");
    expect(result.html).toContain("Confirm your email address");
    expect(result.html).toContain("Security Notice");

    // Plain red rectangle security notice with crisp white text
    expect(result.html).toContain("background-color: #dc2626; border-radius: 8px;");
    expect(result.html).toContain("color: #ffffff");

    // Strictly no AI-like emojis
    expect(result.html).not.toContain("📖");
    expect(result.html).not.toContain("⏱");
    expect(result.html).not.toContain("🎉");

    // Footer links verification
    expect(result.html).toContain('href="https://fehmequran.org"');
    expect(result.html).toContain('href="https://fehmequran.org/khatm"');
    expect(result.html).toContain('href="https://fehmequran.org/privacy"');

    // Plain text assertions
    expect(result.text).toContain("749201");
    expect(result.text).toContain("learner@fehmequran.org");
    expect(result.text).toContain("QURAN FEHAM");
    expect(result.text).toContain("Open Quran Feham: https://fehmequran.org");
    expect(result.text).toContain("Khatm Rooms: https://fehmequran.org/khatm");
    expect(result.text).toContain("Privacy: https://fehmequran.org/privacy");
  });

  it("sanitizes localhost and 127.0.0.1 appOrigins to canonical https://fehmequran.org", () => {
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
    const result = renderVerifyEmailTemplate({
      email: "learner@fehmequran.org",
      code: "123456",
      expiresAt,
      appOrigin: "http://localhost:3000",
    });

    // Neither HTML nor text should ever leak localhost
    expect(result.html).not.toContain("localhost");
    expect(result.html).not.toContain("127.0.0.1");
    expect(result.text).not.toContain("localhost");
    expect(result.text).not.toContain("127.0.0.1");

    // Should use the canonical production domain
    expect(result.html).toContain('href="https://fehmequran.org"');
    expect(result.html).toContain('href="https://fehmequran.org/khatm"');
    expect(result.html).toContain('href="https://fehmequran.org/privacy"');
    expect(result.text).toContain("Open Quran Feham: https://fehmequran.org");
  });

  it("renders a luxury branded Reset Password template with security notice", () => {
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
    const result = renderResetPasswordTemplate({
      email: "user@fehmequran.org",
      code: "318492",
      expiresAt,
      appOrigin: "https://fehmequran.org",
    });

    expect(result.subject).toContain("Reset your Quran Feham password");
    expect(result.subject).toContain("إعادة تعيين كلمة المرور");

    // HTML checks
    expect(result.html).toContain("3 1 8 4 9 2");
    expect(result.html).toContain("Reset your password");
    expect(result.html).toContain("Did not request a password reset?");
    expect(result.html).toContain("user@fehmequran.org");

    // Plain text checks
    expect(result.text).toContain("318492");
    expect(result.text).toContain("Password Reset");
  });

  it("renders a Khatm Reminder template with Quranic verse and CTA", () => {
    const result = renderKhatmReminderTemplate({
      roomName: "Global Ramadan Khatm",
      message: "Please recite Para 15 before sunset today.",
      daurahNumber: 2,
      intention: "For the health of our elders and community peace",
      roomUrl: "https://fehmequran.org/khatm/global-ramadan",
    });

    expect(result.subject).toContain("Global Ramadan Khatm");
    expect(result.subject).toContain("Daurah #2");
    expect(result.subject).toContain("تذكير الختمة");

    // HTML checks
    expect(result.html).toContain("Global Ramadan Khatm");
    expect(result.html).toContain("Please recite Para 15 before sunset today.");
    expect(result.html).toContain("For the health of our elders");
    expect(result.html).toContain("Open Khatm Room & Continue Reading");
    expect(result.html).toContain("https://fehmequran.org/khatm/global-ramadan");
    expect(result.html).toContain("Surah Fatir 35:29");

    // Text checks
    expect(result.text).toContain("Global Ramadan Khatm");
    expect(result.text).toContain("Please recite Para 15 before sunset today.");
    expect(result.text).toContain("https://fehmequran.org/khatm/global-ramadan");
  });

  it("renders a Khatm Completion celebration template with congratulations", () => {
    const result = renderKhatmCompletionTemplate({
      roomName: "Fajr Circle Khatm",
      daurahNumber: 1,
      totalCompletedParas: 30,
      intention: "Maghfirah for all deceased believers",
      roomUrl: "https://fehmequran.org/khatm/fajr-circle",
    });

    expect(result.subject).toContain("Mabrook!");
    expect(result.subject).toContain("Fajr Circle Khatm");
    expect(result.subject).toContain("Completed");

    // HTML checks
    expect(result.html).toContain("Mabrook on completing the Quran Khatm!");
    expect(result.html).toContain("Fajr Circle Khatm");
    expect(result.html).toContain("Maghfirah for all deceased believers");
    expect(result.html).toContain("View Daurah Record & Begin Next Cycle");
    expect(result.html).toContain("اللَّهُمَّ ارْحَمْنَا بِالقُرْآنِ");

    // Text checks
    expect(result.text).toContain("Mabrook! Fajr Circle Khatm Daurah #1 Completed!");
    expect(result.text).toContain("all 30 Paras of Daurah #1 in \"Fajr Circle Khatm\" have been completed!");
  });
});
