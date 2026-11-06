import type { Metadata } from "next";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

export const metadata: Metadata = {
  title: "Reset your password",
  robots: { index: false, follow: false },
};

export default function ForgotPasswordPage() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h1 className="font-serif text-3xl font-bold text-ink">Reset your password</h1>
        <p className="text-sm text-muted">
          Enter the email you sign in with and we&apos;ll send you a reset link.
        </p>
      </div>
      <ForgotPasswordForm />
    </div>
  );
}
