"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { clsx } from "clsx";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { forgotPasswordAction } from "@/app/actions/auth";
import { ToastMessage } from "@/components/ui/toast-message";
import { forgotPasswordSchema, type ForgotPasswordValues } from "@/lib/auth-schemas";
import { buttonPrimary, inputBase, textLink } from "@/lib/ui";

export function ForgotPasswordForm() {
  const [message, setMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  async function onSubmit(values: ForgotPasswordValues) {
    const result = await forgotPasswordAction(values);
    setMessage(result.ok ? result.message : result.error);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-5">
      {message ? (
        <ToastMessage tone="success" role="status">
          {message}
        </ToastMessage>
      ) : null}

      <div className="flex flex-col gap-2">
        <label htmlFor="forgot-email" className="text-sm font-semibold text-ink">
          Email
        </label>
        <input
          id="forgot-email"
          type="email"
          autoComplete="email"
          aria-invalid={errors.email ? true : undefined}
          aria-describedby={errors.email ? "forgot-email-error" : undefined}
          className={clsx(inputBase, "h-11", errors.email ? "border-ink" : "border-border")}
          {...register("email")}
        />
        {errors.email ? (
          <p id="forgot-email-error" className="border-l-2 border-ink pl-2 text-sm text-ink">
            {errors.email.message}
          </p>
        ) : null}
      </div>

      <button type="submit" disabled={isSubmitting} className={buttonPrimary}>
        {isSubmitting ? "Sending..." : "Send reset link"}
      </button>

      <p className="text-center text-sm text-muted">
        Remembered it?{" "}
        <Link href="/login" className={textLink}>
          Back to sign in
        </Link>
      </p>
    </form>
  );
}
