import type { Metadata } from "next";
import { UpdatePasswordForm } from "@/components/auth/update-password-form";

export const metadata: Metadata = {
  title: "Set a new password",
  robots: { index: false, follow: false },
};

/** Reached from a password-reset or admin-invite email, via /auth/confirm. */
export default function UpdatePasswordPage() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h1 className="font-serif text-3xl font-bold text-ink">Set a new password</h1>
        <p className="text-sm text-muted">Choose a password you have not used before.</p>
      </div>
      <UpdatePasswordForm />
    </div>
  );
}
