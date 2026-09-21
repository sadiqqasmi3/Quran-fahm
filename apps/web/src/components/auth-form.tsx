"use client";

import {
  ForgotPasswordInputSchema,
  LoginInputSchema,
  RegisterInputSchema,
  ResetPasswordInputSchema,
  VerifyEmailInputSchema,
} from "@quran-feham/contracts";
import { CheckCircle2, Eye, EyeOff, LoaderCircle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useEffect, useState } from "react";
import { ApiFailure, apiRequest, login, register } from "@/lib/api";

export type AuthMode = "login" | "register" | "verify" | "forgot" | "reset";

const content: Record<AuthMode, { title: string; description: string; action: string }> = {
  login: {
    title: "Welcome back",
    description: "Continue from the same ayah on every device.",
    action: "Sign in",
  },
  register: {
    title: "Create your account",
    description: "Sync your reading position and preferences without making them public.",
    action: "Create account",
  },
  verify: {
    title: "Verify your email",
    description: "Enter the six-digit code sent to your email address.",
    action: "Verify email",
  },
  forgot: {
    title: "Reset your password",
    description: "We will send a reset code if an account exists for this email.",
    action: "Send reset code",
  },
  reset: {
    title: "Choose a new password",
    description: "Use the reset code from your email and a new, strong password.",
    action: "Save new password",
  },
};

type AuthField = "displayName" | "email" | "code" | "password" | "locale";
type AuthFieldErrors = Partial<Record<AuthField, string[]>>;

const authFieldOrder: AuthField[] = ["displayName", "email", "code", "password", "locale"];

function collectFieldErrors(
  issues: readonly { path: readonly PropertyKey[]; message: string }[],
): AuthFieldErrors {
  const errors: AuthFieldErrors = {};
  for (const issue of issues) {
    const field = String(issue.path[0] ?? "");
    if (!authFieldOrder.includes(field as AuthField)) continue;
    const authField = field as AuthField;
    const message = authField === "code" ? "Enter a valid six-digit code." : issue.message;
    errors[authField] = [...(errors[authField] ?? []), message];
  }
  return errors;
}

function collectApiFieldErrors(errors: Record<string, string[]>): AuthFieldErrors {
  const fieldErrors: AuthFieldErrors = {};
  for (const field of authFieldOrder) {
    if (errors[field]?.length) fieldErrors[field] = errors[field];
  }
  return fieldErrors;
}

function FieldError({ field, errors }: { field: AuthField; errors: string[] | undefined }) {
  if (!errors?.length) return null;
  return (
    <div id={`${field}-error`} className="mt-2 text-sm leading-5 text-danger">
      {errors.length === 1 ? (
        errors[0]
      ) : (
        <ul className="list-disc space-y-1 pl-5">
          {errors.map((error) => (
            <li key={error}>{error}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

function messageFor(error: unknown): string {
  if (error instanceof ApiFailure) return error.message;
  if (error instanceof Error && error.name === "ZodError") {
    return "Check the highlighted information and try again.";
  }
  return "The request could not be completed. Try again.";
}

export function AuthForm({ mode }: { mode: AuthMode }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [emailValue, setEmailValue] = useState("");
  const [codeValue, setCodeValue] = useState("");
  const [nextPath, setNextPath] = useState("/home");
  const [fieldErrors, setFieldErrors] = useState<AuthFieldErrors>({});
  const [resendPending, setResendPending] = useState(false);
  const [resendMessage, setResendMessage] = useState<string | null>(null);

  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    setEmailValue(query.get("email") ?? "");
    setCodeValue(query.get("code") ?? "");
    const next = query.get("next");
    if (next?.startsWith("/") && !next.startsWith("//")) setNextPath(next);
  }, []);

  function clearFieldError(field: AuthField) {
    setFieldErrors((current) => {
      if (!current[field]) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
  }

  function reportFieldErrors(errors: AuthFieldErrors, form: HTMLFormElement) {
    setFieldErrors(errors);
    const firstInvalidField = authFieldOrder.find((field) => errors[field]?.length);
    if (!firstInvalidField) return;
    requestAnimationFrame(() => {
      const control = form.elements.namedItem(firstInvalidField);
      if (control instanceof HTMLElement) control.focus();
      else if (control instanceof RadioNodeList) {
        const firstRadio = Array.from(control).find((item) => item instanceof HTMLElement);
        firstRadio?.focus();
      }
    });
  }

  function controlClass(field: AuthField) {
    return `min-h-12 w-full rounded-xl border bg-surface px-3.5 text-ink placeholder:text-muted/70 focus:border-focus ${
      fieldErrors[field]?.length
        ? "border-danger hover:border-danger"
        : "border-line hover:border-muted"
    }`;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setMessage(null);
    setSuccess(false);
    setFieldErrors({});

    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const email = String(form.get("email") ?? "").trim();
    const password = String(form.get("password") ?? "");
    const code = String(form.get("code") ?? "").trim();

    try {
      if (mode === "login") {
        const parsed = LoginInputSchema.safeParse({ email, password });
        if (!parsed.success) {
          reportFieldErrors(collectFieldErrors(parsed.error.issues), formElement);
          setMessage("Check the highlighted information and try again.");
          return;
        }
        const input = parsed.data;
        const result = await login({ email: input.email, password: input.password });
        if (result.verificationRequired) {
          const query = new URLSearchParams({ email: input.email });
          if (nextPath !== "/home") query.set("next", nextPath);
          router.push(`/verify-email?${query.toString()}`);
          return;
        }
        router.push(nextPath);
        router.refresh();
        return;
      }

      if (mode === "register") {
        const displayName = String(form.get("displayName") ?? "").trim();
        const locale = form.get("locale") === "en" ? "en" : "ur";
        const parsed = RegisterInputSchema.safeParse({
          email,
          password,
          locale,
          ...(displayName ? { displayName } : {}),
        });
        if (!parsed.success) {
          reportFieldErrors(collectFieldErrors(parsed.error.issues), formElement);
          setMessage("Check the highlighted information and try again.");
          return;
        }
        const input = parsed.data;
        const result = await register({
          email: input.email,
          password: input.password,
          locale: input.locale,
          ...(input.displayName ? { displayName: input.displayName } : {}),
        });
        const query = new URLSearchParams({ email: input.email });
        if (nextPath !== "/home") query.set("next", nextPath);
        router.push(`/verify-email?${query.toString()}`);
        return;
      }

      if (mode === "verify") {
        const parsed = VerifyEmailInputSchema.safeParse({ email, code });
        if (!parsed.success) {
          reportFieldErrors(collectFieldErrors(parsed.error.issues), formElement);
          setMessage("Check the highlighted information and try again.");
          return;
        }
        const input = parsed.data;
        await apiRequest("/auth/verify-email", {
          method: "POST",
          body: JSON.stringify(input),
        });
        setSuccess(true);
        setMessage("Email verified! Redirecting to Quran Feham…");
        setTimeout(() => {
          router.push(nextPath);
          router.refresh();
        }, 1000);
        return;
      }

      if (mode === "forgot") {
        const parsed = ForgotPasswordInputSchema.safeParse({ email });
        if (!parsed.success) {
          reportFieldErrors(collectFieldErrors(parsed.error.issues), formElement);
          setMessage("Check the highlighted information and try again.");
          return;
        }
        const input = parsed.data;
        await apiRequest("/auth/forgot-password", {
          method: "POST",
          body: JSON.stringify(input),
        });
        setSuccess(true);
        setMessage("If an account exists, a reset code has been sent.");
        return;
      }

      const parsed = ResetPasswordInputSchema.safeParse({ email, code, password });
      if (!parsed.success) {
        reportFieldErrors(collectFieldErrors(parsed.error.issues), formElement);
        setMessage("Check the highlighted information and try again.");
        return;
      }
      const input = parsed.data;
      await apiRequest("/auth/reset-password", {
        method: "POST",
        body: JSON.stringify(input),
      });
      setSuccess(true);
      setMessage("Password updated. Sign in with your new password.");
    } catch (error) {
      if (
        mode === "login" &&
        error instanceof ApiFailure &&
        error.code === "EMAIL_VERIFICATION_REQUIRED"
      ) {
        const query = new URLSearchParams({ email });
        if (nextPath !== "/home") query.set("next", nextPath);
        router.push(`/verify-email?${query.toString()}`);
        return;
      }
      if (error instanceof ApiFailure && error.fieldErrors) {
        reportFieldErrors(collectApiFieldErrors(error.fieldErrors), formElement);
      } else if (error instanceof ApiFailure && mode === "register" && error.status === 409) {
        reportFieldErrors({ email: [error.message] }, formElement);
      }
      setMessage(messageFor(error));
    } finally {
      setPending(false);
    }
  }

  async function resendVerification() {
    setResendPending(true);
    setResendMessage(null);
    try {
      const parsed = ForgotPasswordInputSchema.safeParse({ email: emailValue });
      if (!parsed.success) {
        setResendMessage("Enter a valid email address before requesting another code.");
        return;
      }
      await apiRequest("/auth/resend-verification", {
        method: "POST",
        body: JSON.stringify(parsed.data),
      });
      setResendMessage("If this email is awaiting verification, a new code has been sent.");
    } catch (error) {
      setResendMessage(messageFor(error));
    } finally {
      setResendPending(false);
    }
  }

  const details = content[mode];
  const asksForPassword = mode === "login" || mode === "register" || mode === "reset";
  const asksForCode = mode === "verify" || mode === "reset";

  return (
    <section aria-labelledby="auth-title" className="w-full max-w-md">
      <h1 id="auth-title" className="text-3xl font-semibold tracking-[-0.035em] text-ink">
        {details.title}
      </h1>
      <p className="mt-3 max-w-sm text-base leading-7 text-muted">{details.description}</p>

      <form className="mt-8 space-y-5" onSubmit={handleSubmit} noValidate>
        {mode === "register" && (
          <div>
            <label className="mb-2 block text-sm font-semibold text-ink" htmlFor="displayName">
              Name <span className="font-normal text-muted">(optional)</span>
            </label>
            <input
              className={controlClass("displayName")}
              id="displayName"
              name="displayName"
              autoComplete="name"
              maxLength={80}
              aria-invalid={fieldErrors.displayName?.length ? true : undefined}
              aria-describedby={fieldErrors.displayName?.length ? "displayName-error" : undefined}
              onChange={() => clearFieldError("displayName")}
            />
            <FieldError field="displayName" errors={fieldErrors.displayName} />
          </div>
        )}

        <div>
          <label className="mb-2 block text-sm font-semibold text-ink" htmlFor="email">
            Email address
          </label>
          <input
            className={controlClass("email")}
            id="email"
            name="email"
            type="email"
            value={emailValue}
            onChange={(event) => {
              setEmailValue(event.target.value);
              clearFieldError("email");
            }}
            autoComplete="email"
            inputMode="email"
            required
            aria-invalid={fieldErrors.email?.length ? true : undefined}
            aria-describedby={fieldErrors.email?.length ? "email-error" : undefined}
          />
          <FieldError field="email" errors={fieldErrors.email} />
        </div>

        {asksForCode && (
          <div>
            <label className="mb-2 block text-sm font-semibold text-ink" htmlFor="code">
              Verification code
            </label>
            <input
              className={`${controlClass("code")} text-center text-xl tracking-[0.25em]`}
              id="code"
              name="code"
              value={codeValue}
              onChange={(event) => {
                setCodeValue(event.target.value.replace(/\D/g, "").slice(0, 6));
                clearFieldError("code");
              }}
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9]{6}"
              maxLength={6}
              required
              aria-invalid={fieldErrors.code?.length ? true : undefined}
              aria-describedby={fieldErrors.code?.length ? "code-help code-error" : "code-help"}
            />
            <p id="code-help" className="mt-2 text-sm leading-5 text-muted">
              Enter the six digits from your email.
            </p>
            <FieldError field="code" errors={fieldErrors.code} />
          </div>
        )}

        {asksForPassword && (
          <div>
            <div className="mb-2 flex items-center justify-between gap-3">
              <label className="text-sm font-semibold text-ink" htmlFor="password">
                {mode === "reset" ? "New password" : "Password"}
              </label>
              {mode === "login" && (
                <Link
                  href="/forgot-password"
                  className="text-sm font-semibold text-accent hover:underline"
                >
                  Forgot password?
                </Link>
              )}
            </div>
            <div className="relative">
              <input
                className={`${controlClass("password")} pr-12`}
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                aria-invalid={fieldErrors.password?.length ? true : undefined}
                aria-describedby={[
                  mode === "register" || mode === "reset" ? "password-help" : null,
                  fieldErrors.password?.length ? "password-error" : null,
                ]
                  .filter(Boolean)
                  .join(" ")}
                onChange={() => clearFieldError("password")}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((visible) => !visible)}
                className="absolute inset-y-0 right-0 grid min-w-12 place-items-center rounded-r-xl text-muted hover:text-ink"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeOff aria-hidden="true" size={20} />
                ) : (
                  <Eye aria-hidden="true" size={20} />
                )}
              </button>
            </div>
            {(mode === "register" || mode === "reset") && (
              <p id="password-help" className="mt-2 text-sm leading-5 text-muted">
                Use 12 or more characters with uppercase, lowercase, and a number.
              </p>
            )}
            <FieldError field="password" errors={fieldErrors.password} />
          </div>
        )}

        {mode === "register" && (
          <fieldset
            aria-invalid={fieldErrors.locale?.length ? true : undefined}
            aria-describedby={fieldErrors.locale?.length ? "locale-error" : undefined}
            onChange={() => clearFieldError("locale")}
          >
            <legend className="mb-2 text-sm font-semibold text-ink">Learning language</legend>
            <div className="grid grid-cols-2 gap-2">
              <label className="flex min-h-12 cursor-pointer items-center gap-2 rounded-xl border border-line bg-surface px-3 has-[:checked]:border-accent has-[:checked]:bg-accent-soft">
                <input type="radio" name="locale" value="ur" defaultChecked />
                اردو
              </label>
              <label className="flex min-h-12 cursor-pointer items-center gap-2 rounded-xl border border-line bg-surface px-3 has-[:checked]:border-accent has-[:checked]:bg-accent-soft">
                <input type="radio" name="locale" value="en" />
                English
              </label>
            </div>
            <FieldError field="locale" errors={fieldErrors.locale} />
          </fieldset>
        )}

        {message && (
          <div
            className={`rounded-xl border px-4 py-3 text-sm leading-6 ${success ? "border-accent/25 bg-accent-soft text-ink" : "border-danger/25 bg-red-50 text-danger"}`}
            role={success ? "status" : "alert"}
          >
            {success && <CheckCircle2 className="mr-2 inline" aria-hidden="true" size={18} />}
            {message}
          </div>
        )}

        <button
          type="submit"
          disabled={pending || success}
          className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-action px-5 font-semibold text-on-action hover:bg-action-hover disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending && <LoaderCircle className="animate-spin" aria-hidden="true" size={19} />}
          {details.action}
        </button>
      </form>

      {success && mode === "verify" && (
        <Link
          href={nextPath}
          className="mt-4 inline-flex min-h-11 w-full items-center justify-center rounded-xl border border-line bg-surface font-semibold text-ink hover:border-accent"
        >
          Continue to Quran Feham
        </Link>
      )}
      {mode === "verify" && !success && (
        <div className="mt-4 text-center text-sm">
          <button
            type="button"
            onClick={resendVerification}
            disabled={resendPending || emailValue.trim().length === 0}
            className="min-h-11 font-semibold text-accent hover:underline disabled:cursor-not-allowed disabled:opacity-60"
          >
            {resendPending ? "Sending a new code…" : "Send a new code"}
          </button>
          {resendMessage && (
            <p className="mt-2 leading-6 text-muted" role="status">
              {resendMessage}
            </p>
          )}
        </div>
      )}
      {success && mode === "forgot" && (
        <Link
          href="/reset-password"
          className="mt-4 inline-flex min-h-11 w-full items-center justify-center rounded-xl border border-line bg-surface font-semibold text-ink hover:border-accent"
        >
          Enter reset code
        </Link>
      )}
      {success && mode === "reset" && (
        <Link
          href="/login"
          className="mt-4 inline-flex min-h-11 w-full items-center justify-center rounded-xl border border-line bg-surface font-semibold text-ink hover:border-accent"
        >
          Return to sign in
        </Link>
      )}

      <div className="mt-7 border-t border-line pt-5 text-center text-sm text-muted">
        {mode === "login" ? (
          <p>
            New to Quran Feham?{" "}
            <Link
              href={
                nextPath === "/home"
                  ? "/register"
                  : `/register?next=${encodeURIComponent(nextPath)}`
              }
              className="font-semibold text-accent hover:underline"
            >
              Create an account
            </Link>
          </p>
        ) : mode === "register" ? (
          <p>
            Already have an account?{" "}
            <Link
              href={nextPath === "/home" ? "/login" : `/login?next=${encodeURIComponent(nextPath)}`}
              className="font-semibold text-accent hover:underline"
            >
              Sign in
            </Link>
          </p>
        ) : (
          <Link href="/login" className="font-semibold text-accent hover:underline">
            Back to sign in
          </Link>
        )}
      </div>
    </section>
  );
}
