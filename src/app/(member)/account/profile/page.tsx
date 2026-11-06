import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ProfileForm } from "@/components/account/profile-form";
import { getAuthorByUsername } from "@/lib/data";
import { getSession } from "@/lib/session";

export const metadata: Metadata = {
  title: "Profile",
  robots: { index: false, follow: false },
};

export default async function ProfilePage() {
  const session = await getSession();
  if (!session) redirect("/login");
  const profile = await getAuthorByUsername(session.username);

  return (
    <div className="flex max-w-3xl flex-col gap-8">
      <header className="flex flex-col gap-2">
        <h1 className="font-sans text-2xl font-semibold text-ink">Profile</h1>
        <p className="text-sm text-muted">How your name and bio appear on your public author page.</p>
      </header>
      <ProfileForm
        displayName={session.name}
        username={session.username}
        bio={profile?.bio ?? ""}
        initials={session.initials}
        avatarGradient={session.avatarGradient}
      />
    </div>
  );
}
