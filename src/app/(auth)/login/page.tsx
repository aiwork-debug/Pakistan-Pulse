import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/auth/login-form";
import { ToastMessage } from "@/components/ui/toast-message";
import { isDemoMode } from "@/lib/demo/mode";
import { DEMO_PASSWORD } from "@/lib/demo/store";
import { safeNext } from "@/lib/safe-next";
import { getSession } from "@/lib/session";

export const metadata: Metadata = {
  title: "Sign in",
  robots: { index: false, follow: false },
};

type LoginPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const session = await getSession();
  if (session) redirect("/");

  const params = await searchParams;
  const next = safeNext(first(params.next), "/");
  const notice = first(params.notice);
  const linkError = first(params.error) === "link";

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h1 className="font-serif text-3xl font-bold text-ink">Sign in</h1>
        <p className="text-sm text-muted">For Pulse newsroom staff. Readers do not need an account.</p>
      </div>

      {notice === "admin-only" ? (
        <ToastMessage tone="warning">
          Public registration is closed. Admin accounts are created by the site team.
        </ToastMessage>
      ) : null}
      {linkError ? (
        <ToastMessage tone="error">That link has expired or was already used. Request a new one.</ToastMessage>
      ) : null}

      {isDemoMode() ? (
        <ToastMessage tone="success" title="Demo accounts">
          <p>
            Admin: <code>admin@example.com</code>
            <br />
            Super admin: <code>super@example.com</code>
            <br />
            Password for both: <code>{DEMO_PASSWORD}</code>
          </p>
        </ToastMessage>
      ) : null}

      <LoginForm next={next} />
    </div>
  );
}
