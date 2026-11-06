"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { clsx } from "clsx";
import { Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { loginAction } from "@/app/actions/auth";
import { ToastMessage } from "@/components/ui/toast-message";
import { loginSchema, type LoginValues } from "@/lib/auth-schemas";
import { buttonPrimary, focusRing, inputBase, textLink } from "@/lib/ui";

type LoginFormProps = {
  next?: string;
};

export function LoginForm({ next }: LoginFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(values: LoginValues) {
    setServerError(null);
    const result = await loginAction({ ...values, next });
    // On success the action redirects, so a returned value always means failure.
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
        <label htmlFor="login-email" className="text-sm font-semibold text-ink">
          Email
        </label>
        <input
          id="login-email"
          type="email"
          autoComplete="email"
          aria-invalid={errors.email ? true : undefined}
          aria-describedby={errors.email ? "login-email-error" : undefined}
          className={clsx(inputBase, "h-11", errors.email ? "border-ink" : "border-border")}
          {...register("email")}
        />
        {errors.email ? (
          <p id="login-email-error" className="border-l-2 border-ink pl-2 text-sm text-ink">
            {errors.email.message}
          </p>
        ) : null}
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <label htmlFor="login-password" className="text-sm font-semibold text-ink">
            Password
          </label>
          <Link href="/forgot-password" className={clsx(textLink, "text-sm")}>
            Forgot password?
          </Link>
        </div>
        <div className="relative">
          <input
            id="login-password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            aria-invalid={errors.password ? true : undefined}
            aria-describedby={errors.password ? "login-password-error" : undefined}
            className={clsx(inputBase, "h-11 pr-12", errors.password ? "border-ink" : "border-border")}
            {...register("password")}
          />
          <button
            type="button"
            onClick={() => setShowPassword((value) => !value)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            aria-pressed={showPassword}
            className={clsx(
              "absolute top-1/2 right-1 flex size-9 -translate-y-1/2 items-center justify-center rounded-md text-muted hover:text-ink",
              focusRing,
            )}
          >
            {showPassword ? <EyeOff aria-hidden="true" className="size-5" /> : <Eye aria-hidden="true" className="size-5" />}
          </button>
        </div>
        {errors.password ? (
          <p id="login-password-error" className="border-l-2 border-ink pl-2 text-sm text-ink">
            {errors.password.message}
          </p>
        ) : null}
      </div>

      <button type="submit" disabled={isSubmitting} className={buttonPrimary}>
        {isSubmitting ? "Signing in..." : "Sign in"}
      </button>

      <p className="text-center text-sm text-muted">Admin accounts are created by the site team.</p>
    </form>
  );
}
