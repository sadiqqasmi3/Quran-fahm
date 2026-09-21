/**
 * High-End Luxury Email Templates for Quran Feham (قرآن فہم)
 *
 * Implements bulletproof, responsive HTML + Plain-Text email templates with:
 * - Sacred Islamic aesthetic: Deep Emerald (#064E3B), Luminous Gold (#D97706), Crisp Alabaster (#FFFFFF).
 * - Arabic Calligraphy Bismillah & Quranic Verse reflections.
 * - Monospace letterboxed OTP codes with expiry and security badges.
 * - Daurah Khatm reminder & milestone celebrations with rich CTA buttons.
 * - Full client compatibility (Gmail, Apple Mail, Outlook, Android, iOS).
 */

export interface EmailRenderOutput {
  subject: string;
  html: string;
  text: string;
}

export interface VerifyEmailTemplateParams {
  email: string;
  code: string;
  expiresAt: Date;
  appOrigin?: string | undefined;
}

export interface ResetPasswordTemplateParams {
  email: string;
  code: string;
  expiresAt: Date;
  appOrigin?: string | undefined;
}

export interface KhatmReminderTemplateParams {
  roomName: string;
  message: string;
  email?: string | undefined;
  daurahNumber?: number | undefined;
  intention?: string | null | undefined;
  roomUrl?: string | undefined;
  recipientName?: string | null | undefined;
}

export interface KhatmCompletionTemplateParams {
  roomName: string;
  daurahNumber: number;
  email?: string | undefined;
  totalParas?: number | undefined;
  totalCompletedParas?: number | undefined;
  intention?: string | null | undefined;
  roomUrl?: string | undefined;
  recipientName?: string | null | undefined;
}

export interface KhatmWelcomeTemplateParams {
  roomName: string;
  daurahNumber: number;
  role: "owner" | "member";
  email?: string | undefined;
  intention?: string | null | undefined;
  roomUrl?: string | undefined;
  recipientName?: string | null | undefined;
}

// ---------------------------------------------------------------------------
// Base Layout & Component Builders
// ---------------------------------------------------------------------------

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function sanitizeOrigin(origin?: string): string {
  if (!origin || origin.includes("localhost") || origin.includes("127.0.0.1")) {
    return "https://fehmequran.org";
  }
  return origin.replace(/\/+$/, "");
}

function renderTextFooter(appOrigin?: string): string {
  const cleanAppOrigin = sanitizeOrigin(appOrigin);
  return [
    "=========================================",
    "جَزَاكُمُ ٱللَّهُ خَيْرًا",
    "May Allah grant you steadfast devotion and deep understanding through His Noble Book.",
    "",
    `Open Quran Feham: ${cleanAppOrigin}`,
    `Khatm Rooms: ${cleanAppOrigin}/khatm`,
    `Privacy: ${cleanAppOrigin}/privacy`,
    `© ${new Date().getFullYear()} Quran Feham (قرآن فہم). All rights reserved.`,
  ].join("\n");
}

function renderBaseLayout({
  preheader,
  badgeText,
  title,
  bodyContent,
  appOrigin = "https://fehmequran.org",
}: {
  preheader: string;
  badgeText: string;
  title: string;
  bodyContent: string;
  appOrigin?: string | undefined;
}): string {
  const cleanAppOrigin = sanitizeOrigin(appOrigin);

  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="en">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="color-scheme" content="light dark" />
  <meta name="supported-color-schemes" content="light dark" />
  <title>${escapeHtml(title)}</title>
  <style type="text/css">
    @import url('https://fonts.googleapis.com/css2?family=Amiri:ital@0;1&family=Inter:wght@400;500;600;700&display=swap');
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
    body { height: 100% !important; margin: 0 !important; padding: 0 !important; width: 100% !important; background-color: #f8fafc; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
    @media screen and (max-width: 620px) {
      .email-container { width: 100% !important; max-width: 100% !important; border-radius: 0 !important; }
      .content-padding { padding: 24px 20px !important; }
      .otp-code { font-size: 28px !important; letter-spacing: 6px !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; color: #1e293b;">
  <!-- Preheader Text (invisible preview) -->
  <div style="display: none; max-height: 0px; overflow: hidden; mso-hide: all;">
    ${escapeHtml(preheader)} &zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;
  </div>

  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f8fafc;">
    <tr>
      <td align="center" style="padding: 40px 12px;">
        <!-- Email Card Container -->
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 580px; background-color: #ffffff; border-radius: 18px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 10px 30px rgba(6, 78, 59, 0.05);" class="email-container">
          
          <!-- Header Banner -->
          <tr>
            <td align="center" style="background: linear-gradient(135deg, #064e3b 0%, #043c2e 100%); background-color: #064e3b; padding: 34px 24px 28px; text-align: center;">
              <!-- Bismillah Calligraphy -->
              <div style="font-family: 'Amiri', 'Traditional Arabic', serif; font-size: 24px; line-height: 34px; color: #fbbf24; text-shadow: 0 1px 2px rgba(0,0,0,0.25); margin-bottom: 14px; letter-spacing: 0.5px;">
                بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ
              </div>

              <!-- Brand Lockup with Sacred Islamic Emblem (100% Email-Safe, No Stripped SVGs) -->
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" align="center" style="margin: 0 auto;">
                <tr>
                  <td align="center" valign="middle" style="padding-right: 14px;">
                    <div style="width: 44px; height: 44px; background-color: #022c22; border: 1.5px solid #d97706; border-radius: 12px; font-family: 'Amiri', serif; font-size: 24px; line-height: 44px; color: #fbbf24; text-align: center;">
                      ۞
                    </div>
                  </td>
                  <td align="left" valign="middle">
                    <div style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 21px; font-weight: 800; color: #ffffff; letter-spacing: 3px; text-transform: uppercase; line-height: 26px;">
                      QURAN FEHAM
                    </div>
                    <div style="font-family: 'Amiri', 'Traditional Arabic', serif; font-size: 15px; font-weight: 500; color: #a7f3d0; line-height: 22px; letter-spacing: 0.3px;">
                      قرآن فہم &nbsp;·&nbsp; فہمِ دین و تدبرِ قرآن
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Subtle Gold Geometric Border Line -->
          <tr>
            <td style="height: 3px; background: linear-gradient(90deg, #064e3b 0%, #d97706 50%, #064e3b 100%);"></td>
          </tr>

          <!-- Main Body Content -->
          <tr>
            <td style="padding: 36px 36px 28px;" class="content-padding">
              <!-- Category Badge -->
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="margin-bottom: 20px;">
                <tr>
                  <td style="background-color: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 20px; padding: 4px 14px; font-size: 11px; font-weight: 700; color: #065f46; letter-spacing: 0.8px; text-transform: uppercase;">
                    ${escapeHtml(badgeText)}
                  </td>
                </tr>
              </table>

              <!-- Main Heading -->
              <h1 style="margin: 0 0 16px; font-size: 23px; font-weight: 800; color: #0f172a; line-height: 32px; letter-spacing: -0.3px;">
                ${escapeHtml(title)}
              </h1>

              <!-- Dynamic Body Injection -->
              ${bodyContent}
            </td>
          </tr>

          <!-- High-End Islamic Tech Footer -->
          <tr>
            <td style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 28px 36px; text-align: center;" class="content-padding">
              <!-- Geometric Divider Symbol -->
              <div style="color: #cbd5e1; font-size: 14px; letter-spacing: 4px; margin-bottom: 12px;">
                ✦ ─── ❖ ─── ✦
              </div>

              <div style="font-family: 'Amiri', serif; font-size: 16px; color: #047857; font-weight: 600; margin-bottom: 6px;">
                جَزَاكُمُ ٱللَّهُ خَيْرًا
              </div>
              <div style="font-size: 12px; color: #64748b; line-height: 18px; max-width: 440px; margin: 0 auto 16px;">
                May Allah grant you steadfast devotion and deep understanding through His Noble Book.
              </div>

              <div style="font-size: 12px; color: #94a3b8; line-height: 20px;">
                <a href="${escapeHtml(cleanAppOrigin)}" target="_blank" style="color: #047857; text-decoration: none; font-weight: 600;">Open Quran Feham</a>
                &nbsp;&nbsp;·&nbsp;&nbsp;
                <a href="${escapeHtml(cleanAppOrigin)}/khatm" target="_blank" style="color: #047857; text-decoration: none; font-weight: 600;">Khatm Rooms</a>
                &nbsp;&nbsp;·&nbsp;&nbsp;
                <a href="${escapeHtml(cleanAppOrigin)}/privacy" target="_blank" style="color: #94a3b8; text-decoration: none;">Privacy</a>
              </div>

              <div style="margin-top: 16px; font-size: 11px; color: #cbd5e1;">
                © ${new Date().getFullYear()} Quran Feham (قرآن فہم). All rights reserved.
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ---------------------------------------------------------------------------
// Template 1: Email Verification OTP (تأكيد البريد الإلكتروني)
// ---------------------------------------------------------------------------

export function renderVerifyEmailTemplate(params: VerifyEmailTemplateParams): EmailRenderOutput {
  const subject = "Verify your Quran Feham email · تأكيد البريد الإلكتروني";
  const formattedCode = params.code.split("").join(" ");
  const expiresMinutes = Math.max(
    1,
    Math.round((params.expiresAt.getTime() - Date.now()) / (60 * 1000)),
  );

  const bodyContent = `
    <p style="margin: 0 0 20px; font-size: 15px; line-height: 25px; color: #334155;">
      <strong>Assalamu Alaikum wa Rahmatullah,</strong>
    </p>
    <p style="margin: 0 0 24px; font-size: 14px; line-height: 24px; color: #475569;">
      Welcome to <strong>Quran Feham</strong>. Use the secure single-use verification code below to confirm your email address (<code style="background: #f1f5f9; padding: 2px 6px; border-radius: 4px; font-size: 13px; color: #0f172a;">${escapeHtml(params.email)}</code>) and activate your personal Quranic study workspace and shared Khatm rooms:
    </p>

    <!-- OTP Card -->
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 24px;">
      <tr>
        <td style="background-color: #f0fdf4; border: 2px dashed #10b981; border-radius: 14px; padding: 24px 16px; text-align: center;">
          <div style="font-size: 12px; font-weight: 700; color: #065f46; letter-spacing: 1.5px; text-transform: uppercase; margin-bottom: 10px;">
            Your Verification Code
          </div>
          <div style="font-family: 'SF Mono', Consolas, 'Liberation Mono', Menlo, monospace; font-size: 36px; font-weight: 800; color: #064e3b; letter-spacing: 8px; margin: 0 0 10px;" class="otp-code">
            ${escapeHtml(formattedCode)}
          </div>
          <div style="display: inline-block; background-color: #d1fae5; border-radius: 12px; padding: 4px 14px; font-size: 12px; font-weight: 600; color: #065f46; letter-spacing: 0.3px;">
            Valid for ${expiresMinutes} minutes
          </div>
        </td>
      </tr>
    </table>

    <!-- Security Notice (Plain Red Rectangle, Rounded Corners, White Text) -->
    <div style="background-color: #dc2626; border-radius: 8px; padding: 16px 20px; margin-bottom: 24px;">
      <div style="font-size: 12px; font-weight: 700; color: #ffffff; letter-spacing: 0.8px; text-transform: uppercase; margin-bottom: 6px;">
        Security Notice
      </div>
      <div style="font-size: 13px; line-height: 20px; color: #ffffff;">
        Never share this code with anyone. Quran Feham will never ask for your verification code. If you did not request this registration, no further action is required and your email remains safe.
      </div>
    </div>
  `;

  const html = renderBaseLayout({
    preheader: `Your Quran Feham verification code is ${params.code}. Valid for ${expiresMinutes} minutes.`,
    badgeText: "Account Verification · تأكيد الحساب",
    title: "Confirm your email address",
    bodyContent,
    appOrigin: params.appOrigin,
  });

  const text = [
    "بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ",
    "QURAN FEHAM (قرآن فہم)",
    "=========================================",
    "Account Verification · تأكيد البريد الإلكتروني",
    "",
    "Assalamu Alaikum wa Rahmatullah,",
    "",
    `Welcome to Quran Feham. Use the verification code below to confirm your email address (${params.email}):`,
    "",
    `  >>>  ${params.code}  <<<`,
    "",
    `Valid for: ${expiresMinutes} minutes (expires at ${params.expiresAt.toISOString()})`,
    "",
    "Security Reminder:",
    "Never share this code with anyone. If you did not request this, you can safely ignore this email.",
    "",
    renderTextFooter(params.appOrigin),
  ].join("\n");

  return { subject, html, text };
}

// ---------------------------------------------------------------------------
// Template 2: Password Reset OTP (إعادة تعيين كلمة المرور)
// ---------------------------------------------------------------------------

export function renderResetPasswordTemplate(params: ResetPasswordTemplateParams): EmailRenderOutput {
  const subject = "Reset your Quran Feham password · إعادة تعيين كلمة المرور";
  const formattedCode = params.code.split("").join(" ");
  const expiresMinutes = Math.max(
    1,
    Math.round((params.expiresAt.getTime() - Date.now()) / (60 * 1000)),
  );

  const bodyContent = `
    <p style="margin: 0 0 20px; font-size: 15px; line-height: 25px; color: #334155;">
      <strong>Assalamu Alaikum,</strong>
    </p>
    <p style="margin: 0 0 24px; font-size: 14px; line-height: 24px; color: #475569;">
      We received a request to reset the password for your <strong>Quran Feham</strong> account (<code style="background: #f1f5f9; padding: 2px 6px; border-radius: 4px; font-size: 13px; color: #0f172a;">${escapeHtml(params.email)}</code>). Enter the authorization code below on the password reset page:
    </p>

    <!-- OTP Card -->
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 24px;">
      <tr>
        <td style="background-color: #fffbeb; border: 2px dashed #f59e0b; border-radius: 14px; padding: 24px 16px; text-align: center;">
          <div style="font-size: 12px; font-weight: 700; color: #92400e; letter-spacing: 1.5px; text-transform: uppercase; margin-bottom: 10px;">
            Password Reset Code
          </div>
          <div style="font-family: 'SF Mono', Consolas, 'Liberation Mono', Menlo, monospace; font-size: 36px; font-weight: 800; color: #78350f; letter-spacing: 8px; margin: 0 0 10px;" class="otp-code">
            ${escapeHtml(formattedCode)}
          </div>
          <div style="display: inline-block; background-color: #fef3c7; border-radius: 12px; padding: 4px 14px; font-size: 12px; font-weight: 600; color: #92400e; letter-spacing: 0.3px;">
            Valid for ${expiresMinutes} minutes
          </div>
        </td>
      </tr>
    </table>

    <!-- Security Notice (Plain Red Rectangle, Rounded Corners, White Text) -->
    <div style="background-color: #dc2626; border-radius: 8px; padding: 16px 20px; margin-bottom: 24px;">
      <div style="font-size: 12px; font-weight: 700; color: #ffffff; letter-spacing: 0.8px; text-transform: uppercase; margin-bottom: 6px;">
        Security Notice
      </div>
      <div style="font-size: 13px; line-height: 20px; color: #ffffff;">
        Did not request a password reset? Please disregard this email. Your current password remains unchanged and secure.
      </div>
    </div>
  `;

  const html = renderBaseLayout({
    preheader: `Your Quran Feham password reset code is ${params.code}. Valid for ${expiresMinutes} minutes.`,
    badgeText: "Security & Access · استعادة كلمة المرور",
    title: "Reset your password",
    bodyContent,
    appOrigin: params.appOrigin,
  });

  const text = [
    "بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ",
    "QURAN FEHAM (قرآن فہم)",
    "=========================================",
    "Password Reset · إعادة تعيين كلمة المرور",
    "",
    "Assalamu Alaikum,",
    "",
    "We received a request to reset your password. Use this code to complete the reset:",
    "",
    `  >>>  ${params.code}  <<<`,
    "",
    `Valid for: ${expiresMinutes} minutes (expires at ${params.expiresAt.toISOString()})`,
    "",
    "If you did not make this request, your account is safe and you can ignore this email.",
    "",
    renderTextFooter(params.appOrigin),
  ].join("\n");

  return { subject, html, text };
}

// ---------------------------------------------------------------------------
// Template 3: Daurah Khatm Reminder (تذكير الختمة والدورة)
// ---------------------------------------------------------------------------

export function renderKhatmReminderTemplate(params: KhatmReminderTemplateParams): EmailRenderOutput {
  const daurahLabel = params.daurahNumber ? `Daurah #${params.daurahNumber}` : "Daurah";
  const subject = `Reminder: ${params.roomName} · ${daurahLabel} (تذكير الختمة)`;
  const targetUrl = params.roomUrl || "https://fehmequran.org/khatm";

  const bodyContent = `
    <p style="margin: 0 0 18px; font-size: 15px; line-height: 25px; color: #334155;">
      <strong>Assalamu Alaikum wa Rahmatullah,</strong>
    </p>
    <p style="margin: 0 0 20px; font-size: 14px; line-height: 24px; color: #475569;">
      This is a scheduled reminder for your collective Khatm room:
    </p>

    <!-- Room Card -->
    <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 14px; padding: 20px; margin-bottom: 24px;">
      <div style="font-size: 18px; font-weight: 800; color: #064e3b; margin-bottom: 6px;">
        ${escapeHtml(params.roomName)}
      </div>
      ${
        params.intention
          ? `<div style="font-size: 13px; line-height: 20px; color: #047857; font-style: italic;">
              <span style="font-weight: 700; font-style: normal;">Intention / Isal-e-Sawab:</span> &ldquo;${escapeHtml(params.intention)}&rdquo;
            </div>`
          : ""
      }
    </div>

    <!-- Scheduled Message Quote -->
    <div style="background-color: #fffbeb; border-left: 4px solid #d97706; border-radius: 8px; padding: 18px 20px; margin-bottom: 28px;">
      <div style="font-size: 11px; font-weight: 700; color: #92400e; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 6px;">
        Message from Room Schedule
      </div>
      <div style="font-size: 15px; line-height: 24px; color: #78350f; font-weight: 500;">
        &ldquo;${escapeHtml(params.message)}&rdquo;
      </div>
    </div>

    <!-- Primary CTA Button -->
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="margin: 0 auto 28px;">
      <tr>
        <td align="center" style="background-color: #047857; border-radius: 12px; box-shadow: 0 4px 12px rgba(4, 120, 87, 0.25);">
          <a href="${escapeHtml(targetUrl)}" target="_blank" style="font-size: 15px; font-weight: 700; color: #ffffff; text-decoration: none; padding: 14px 32px; display: inline-block; border-radius: 12px; letter-spacing: 0.3px;">
            Open Khatm Room & Continue Reading &rarr;
          </a>
        </td>
      </tr>
    </table>

    <!-- Quranic Verse Inspiration -->
    <div style="border-top: 1px solid #e2e8f0; padding-top: 20px; margin-top: 20px; text-align: center;">
      <div style="font-family: 'Amiri', serif; font-size: 16px; line-height: 26px; color: #047857; margin-bottom: 6px;">
        إِنَّ ٱلَّذِينَ يَتْلُونَ كِتَٰبَ ٱللَّهِ وَأَقَامُوا۟ ٱلصَّلَوٰةَ... يَرْجُونَ تِجَٰرَةًۭ لَّن تَبُورَ
      </div>
      <div style="font-size: 12px; color: #64748b; font-style: italic;">
        &ldquo;Indeed, those who recite the Book of Allah, establish prayer... look forward to a commerce that will never perish.&rdquo; (Surah Fatir 35:29)
      </div>
    </div>
  `;

  const html = renderBaseLayout({
    preheader: `Reminder for ${params.roomName}: "${params.message}"`,
    badgeText: "Daurah Reminder · تذكير الختمة",
    title: "Continue your Quran recitation",
    bodyContent,
  });

  const text = [
    "بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ",
    "QURAN FEHAM (قرآن فہم)",
    "=========================================",
    `Reminder: ${params.roomName} (${daurahLabel})`,
    "",
    "Assalamu Alaikum wa Rahmatullah,",
    "",
    "This is your scheduled reminder for your Khatm room:",
    `"${params.message}"`,
    "",
    ...(params.intention ? [`Intention / Isal-e-Sawab: "${params.intention}"`, ""] : []),
    `Open your room and continue reading: ${targetUrl}`,
    "",
    "May Allah accept your Quran recitation.",
    "",
    renderTextFooter(params.roomUrl ? new URL(params.roomUrl).origin : undefined),
  ].join("\n");

  return { subject, html, text };
}

// ---------------------------------------------------------------------------
// Template 4: Daurah Completion Celebration (تم بحمد الله ختم القرآن الكريم)
// ---------------------------------------------------------------------------

export function renderKhatmCompletionTemplate(params: KhatmCompletionTemplateParams): EmailRenderOutput {
  const subject = `Mabrook! ${params.roomName} Daurah #${params.daurahNumber} Completed · ختم القرآن`;
  const targetUrl = params.roomUrl || "https://fehmequran.org/khatm";

  const bodyContent = `
    <!-- Celebration Emblem (100% Email-Safe, No Stripped SVGs) -->
    <div style="text-align: center; margin-bottom: 24px;">
      <table role="presentation" border="0" cellpadding="0" cellspacing="0" align="center" style="margin: 0 auto 12px;">
        <tr>
          <td align="center" style="width: 52px; height: 52px; background-color: #ecfdf5; border: 1.5px solid #10b981; border-radius: 14px; font-size: 24px; line-height: 52px; color: #059669; text-align: center;">
            ✦
          </td>
        </tr>
      </table>
      <div style="font-family: 'Amiri', serif; font-size: 22px; font-weight: 700; color: #047857;">
        مُبَارَك! تَمَّ بِحَمْدِ ٱللَّهِ خَتْمُ ٱلْقُرْآنِ ٱلْكَرِيمِ
      </div>
    </div>

    <p style="margin: 0 0 18px; font-size: 15px; line-height: 25px; color: #334155;">
      <strong>Assalamu Alaikum wa Rahmatullah,</strong>
    </p>
    <p style="margin: 0 0 20px; font-size: 14px; line-height: 24px; color: #475569;">
      Praise be to Allah! All 30 Paras of <strong>Daurah #${params.daurahNumber}</strong> in <strong>${escapeHtml(params.roomName)}</strong> have been successfully recited and completed by your group.
    </p>

    <!-- Completed Record Card -->
    <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 14px; padding: 20px; margin-bottom: 24px;">
      <div style="font-size: 14px; font-weight: 700; color: #065f46; margin-bottom: 8px;">
        Daurah #${params.daurahNumber} Summary
      </div>
      <div style="font-size: 13px; color: #047857; line-height: 20px;">
        ✓ Total Paras Completed: <strong>${params.totalParas ?? 30} of 30</strong><br />
        ${params.intention ? `✓ Intention: <em>&ldquo;${escapeHtml(params.intention)}&rdquo;</em>` : ""}
      </div>
    </div>

    <!-- Dua Block -->
    <div style="background-color: #fffbeb; border: 1px solid #fde68a; border-radius: 12px; padding: 18px 20px; text-align: center; margin-bottom: 28px;">
      <div style="font-family: 'Amiri', serif; font-size: 17px; line-height: 28px; color: #92400e; font-weight: 600; margin-bottom: 8px;">
        اللَّهُمَّ ارْحَمْنَا بِالقُرْآنِ، وَاجْعَلْهُ لَنَا إِمَاماً وَنُوراً وَهُدًى وَرَحْمَةً
      </div>
      <div style="font-size: 12px; color: #78350f; font-style: italic;">
        &ldquo;O Allah, have mercy upon us through the Quran, and make it for us a guide, a light, guidance and mercy.&rdquo;
      </div>
    </div>

    <!-- CTA Button -->
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="margin: 0 auto 24px;">
      <tr>
        <td align="center" style="background-color: #047857; border-radius: 12px;">
          <a href="${escapeHtml(targetUrl)}" target="_blank" style="font-size: 15px; font-weight: 700; color: #ffffff; text-decoration: none; padding: 14px 32px; display: inline-block; border-radius: 12px;">
            View Daurah Record & Begin Next Cycle &rarr;
          </a>
        </td>
      </tr>
    </table>
  `;

  const html = renderBaseLayout({
    preheader: `Alhamdulillah! All 30 Paras completed for ${params.roomName} Daurah #${params.daurahNumber}.`,
    badgeText: "Khatm Completed · ختم القرآن",
    title: "Mabrook on completing the Quran Khatm!",
    bodyContent,
  });

  const text = [
    "بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ",
    "QURAN FEHAM (قرآن فہم)",
    "=========================================",
    `Mabrook! ${params.roomName} Daurah #${params.daurahNumber} Completed!`,
    "",
    "Assalamu Alaikum wa Rahmatullah,",
    "",
    `Alhamdulillah, all 30 Paras of Daurah #${params.daurahNumber} in "${params.roomName}" have been completed!`,
    "",
    ...(params.intention ? [`Intention / Isal-e-Sawab: "${params.intention}"`, ""] : []),
    "اللَّهُمَّ ارْحَمْنَا بِالقُرْآنِ، وَاجْعَلْهُ لَنَا إِمَاماً وَنُوراً وَهُدًى وَرَحْمَةً",
    "O Allah, have mercy upon us through the Quran, and make it for us a guide, a light, guidance and mercy.",
    "",
    `View the completed room record and start the next Daurah: ${targetUrl}`,
    "",
    "May Allah accept this Khatm from all readers.",
    "",
    renderTextFooter(params.roomUrl ? new URL(params.roomUrl).origin : undefined),
  ].join("\n");

  return { subject, html, text };
}
