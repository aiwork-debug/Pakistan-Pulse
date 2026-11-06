"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { clsx } from "clsx";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { inviteAdminAction, type AdminActionResult } from "@/app/actions/admins";
import { ToastMessage } from "@/components/ui/toast-message";
import { inviteAdminSchema, type InviteAdminValues } from "@/lib/auth-schemas";
import { buttonPrimary, inputBase } from "@/lib/ui";

type InviteAdminFormProps = {
  /** Disables the form when the active admin limit is already reached. */
  limitReached: boolean;
};

const FIELDS: { name: keyof InviteAdminValues; label: string; type: string; autoComplete: string; hint?: string }[] = [
  { name: "email", label: "Email", type: "email", autoComplete: "off" },
  { name: "displayName", label: "Display name", type: "text", autoComplete: "off" },
  { name: "username", label: "Username", type: "text", autoComplete: "off", hint: "3 to 30 lowercase letters, numbers, or hyphens." },
];

/** Invites a new admin by email (Supabase Auth admin API). Writes ADMIN_CREATED to the audit log. */
export function InviteAdminForm({ limitReached }: InviteAdminFormProps) {
  const [result, setResult] = useState<AdminActionResult | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<InviteAdminValues>({
    resolver: zodResolver(inviteAdminSchema),
    defaultValues: { email: "", displayName: "", username: "" },
  });

  async function onSubmit(values: InviteAdminValues) {
    const outcome = await inviteAdminAction(values);
    setResult(outcome);
    if (outcome.ok) reset();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-5 rounded-xl border border-border bg-paper p-6">
      {result ? (
        <ToastMessage tone={result.ok ? "success" : "error"}>{result.ok ? result.message : result.error}</ToastMessage>
      ) : null}
      {limitReached ? (
        <ToastMessage tone="warning">
          The limit of 6 active admins is reached. Suspend or delete an admin before inviting another.
        </ToastMessage>
      ) : null}

      <div className="grid gap-5 md:grid-cols-3">
        {FIELDS.map((field) => {
          const error = errors[field.name];
          const id = `invite-${field.name}`;
          const describedBy = [field.hint ? `${id}-hint` : null, error ? `${id}-error` : null].filter(Boolean).join(" ");
          return (
            <div key={field.name} className="flex flex-col gap-2">
              <label htmlFor={id} className="text-sm font-semibold text-ink">
                {field.label}
              </label>
              <input
                id={id}
                type={field.type}
                autoComplete={field.autoComplete}
                disabled={limitReached}
                aria-invalid={error ? true : undefined}
                aria-describedby={describedBy || undefined}
                className={clsx(inputBase, "h-11", error ? "border-ink" : "border-border")}
                {...register(field.name)}
              />
              {field.hint ? (
                <p id={`${id}-hint`} className="text-sm text-muted">
                  {field.hint}
                </p>
              ) : null}
              {error ? (
                <p id={`${id}-error`} className="border-l-2 border-ink pl-2 text-sm text-ink">
                  {error.message}
                </p>
              ) : null}
            </div>
          );
        })}
      </div>

      <button type="submit" disabled={isSubmitting || limitReached} className={clsx(buttonPrimary, "w-fit")}>
        {isSubmitting ? "Sending invite..." : "Invite admin"}
      </button>
    </form>
  );
}
