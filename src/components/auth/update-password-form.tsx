"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { clsx } from "clsx";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { updatePasswordAction } from "@/app/actions/auth";
import { ToastMessage } from "@/components/ui/toast-message";
import { updatePasswordSchema, type UpdatePasswordValues } from "@/lib/auth-schemas";
import { buttonPrimary, inputBase } from "@/lib/ui";

export function UpdatePasswordForm() {
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<UpdatePasswordValues>({
    resolver: zodResolver(updatePasswordSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  async function onSubmit(values: UpdatePasswordValues) {
    setServerError(null);
    const result = await updatePasswordAction(values);
    if (result && !result.ok) setServerError(result.error);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-5">
      {serverError ? (
        <ToastMessage tone="error" role="alert">
          {serverError}
        </ToastMessage>
      ) : null}

      <div className="flex flex-col gap-2">
        <label htmlFor="new-password" className="text-sm font-semibold text-ink">
          New password
        </label>
        <input
          id="new-password"
          type="password"
          autoComplete="new-password"
          aria-invalid={errors.password ? true : undefined}
          aria-describedby={errors.password ? "new-password-hint new-password-error" : "new-password-hint"}
          className={clsx(inputBase, "h-11", errors.password ? "border-ink" : "border-border")}
          {...register("password")}
        />
        <p id="new-password-hint" className="text-sm text-muted">
          At least 10 characters.
        </p>
        {errors.password ? (
          <p id="new-password-error" className="border-l-2 border-ink pl-2 text-sm text-ink">
            {errors.password.message}
          </p>
        ) : null}
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="confirm-password" className="text-sm font-semibold text-ink">
          Confirm new password
        </label>
        <input
          id="confirm-password"
          type="password"
          autoComplete="new-password"
          aria-invalid={errors.confirmPassword ? true : undefined}
          aria-describedby={errors.confirmPassword ? "confirm-password-error" : undefined}
          className={clsx(inputBase, "h-11", errors.confirmPassword ? "border-ink" : "border-border")}
          {...register("confirmPassword")}
        />
        {errors.confirmPassword ? (
          <p id="confirm-password-error" className="border-l-2 border-ink pl-2 text-sm text-ink">
            {errors.confirmPassword.message}
          </p>
        ) : null}
      </div>

      <button type="submit" disabled={isSubmitting} className={buttonPrimary}>
        {isSubmitting ? "Saving..." : "Set password"}
      </button>
    </form>
  );
}
