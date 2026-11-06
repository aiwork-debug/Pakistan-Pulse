"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { clsx } from "clsx";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { updateProfileAction, type ProfileResult } from "@/app/actions/profile";
import { ToastMessage } from "@/components/ui/toast-message";
import { profileSchema, type ProfileValues } from "@/lib/auth-schemas";
import { PersonAvatar } from "@/components/ui/person-avatar";
import { avatarPhotoFor } from "@/lib/avatars";
import { buttonPrimary, inputBase } from "@/lib/ui";

type ProfileFormProps = {
  displayName: string;
  username: string;
  bio: string;
  initials: string;
  avatarGradient: string;
};

const BIO_MAX = 1200;

/** Edits the signed-in staff member's display name and bio. Username, role, and status are fixed here. */
export function ProfileForm({ displayName, username, bio, initials, avatarGradient }: ProfileFormProps) {
  const [result, setResult] = useState<ProfileResult | null>(null);
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    mode: "onBlur",
    defaultValues: { displayName, bio },
  });
  const bioLength = watch("bio")?.length ?? 0;

  async function onSubmit(values: ProfileValues) {
    setResult(await updateProfileAction(values));
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      className="flex flex-col gap-6 rounded-xl border border-border bg-paper p-6 lg:p-8"
    >
      <div className="flex items-center gap-4">
        <PersonAvatar
          name={displayName}
          gradient={avatarGradient}
          photoUrl={avatarPhotoFor(username)}
          initials={initials}
          className="size-20 text-2xl"
          sizes="80px"
        />
        <p className="text-sm text-muted">Photo uploads arrive in a later phase.</p>
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="profile-name" className="text-sm font-semibold text-ink">
          Display name
        </label>
        <input
          id="profile-name"
          type="text"
          autoComplete="name"
          aria-invalid={errors.displayName ? true : undefined}
          aria-describedby={errors.displayName ? "profile-name-error" : undefined}
          className={clsx(inputBase, "h-11", errors.displayName ? "border-ink" : "border-border")}
          {...register("displayName")}
        />
        {errors.displayName ? (
          <p id="profile-name-error" className="border-l-2 border-ink pl-2 text-sm text-ink">
            {errors.displayName.message}
          </p>
        ) : null}
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="profile-username" className="text-sm font-semibold text-ink">
          Username
        </label>
        <input
          id="profile-username"
          type="text"
          value={username}
          readOnly
          aria-describedby="profile-username-hint"
          className={clsx(inputBase, "h-11 border-border bg-surface text-muted")}
        />
        <p id="profile-username-hint" className="text-sm text-muted">
          Usernames cannot be changed.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="profile-bio" className="text-sm font-semibold text-ink">
          Bio
        </label>
        <textarea
          id="profile-bio"
          rows={5}
          maxLength={BIO_MAX}
          aria-invalid={errors.bio ? true : undefined}
          aria-describedby={errors.bio ? "profile-bio-count profile-bio-error" : "profile-bio-count"}
          className={clsx(inputBase, "py-2.5 leading-7", errors.bio ? "border-ink" : "border-border")}
          {...register("bio")}
        />
        <p id="profile-bio-count" className="self-end text-sm text-muted">
          {bioLength} / {BIO_MAX} characters
        </p>
        {errors.bio ? (
          <p id="profile-bio-error" className="border-l-2 border-ink pl-2 text-sm text-ink">
            {errors.bio.message}
          </p>
        ) : null}
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <button type="submit" disabled={isSubmitting} className={buttonPrimary}>
          {isSubmitting ? "Saving..." : "Save changes"}
        </button>
        {result ? (
          <ToastMessage tone={result.ok ? "success" : "error"} className="flex-1">
            {result.ok ? result.message : result.error}
          </ToastMessage>
        ) : null}
      </div>
    </form>
  );
}
