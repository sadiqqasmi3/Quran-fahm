import type { Metadata } from "next";
import { AuthForm } from "@/components/auth-form";

export const metadata: Metadata = { title: "Verify email" };

export default function VerifyEmailPage() {
  return <AuthForm mode="verify" />;
}
