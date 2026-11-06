"use client";

import { LogOut } from "lucide-react";
import { useFormStatus } from "react-dom";
import { signOutEverywhereAction } from "@/app/actions/profile";
import { buttonSecondary } from "@/lib/ui";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={buttonSecondary}>
      <LogOut aria-hidden="true" className="size-4" />
      {pending ? "Signing out..." : "Sign out on all devices"}
    </button>
  );
}

/** Ends every session for this account (Supabase global sign-out), including this one. */
export function SignOutEverywhere() {
  return (
    <form action={signOutEverywhereAction}>
      <SubmitButton />
    </form>
  );
}
