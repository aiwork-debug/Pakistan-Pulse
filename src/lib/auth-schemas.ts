import { z } from "zod";

const email = z
  .string()
  .trim()
  .min(1, "Enter your email address.")
  .email("Enter a valid email address.");

export const loginSchema = z.object({
  email,
  password: z.string().min(1, "Enter your password."),
});

export type LoginValues = z.infer<typeof loginSchema>;

export const forgotPasswordSchema = z.object({
  email,
});

export type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;

export const updatePasswordSchema = z
  .object({
    password: z.string().min(10, "Password must be at least 10 characters."),
    confirmPassword: z.string().min(1, "Confirm your new password."),
  })
  .refine((values) => values.password === values.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match.",
  });

export type UpdatePasswordValues = z.infer<typeof updatePasswordSchema>;

export const inviteAdminSchema = z.object({
  email,
  displayName: z
    .string()
    .trim()
    .min(2, "Enter a display name (at least 2 characters).")
    .max(80, "Display name must be 80 characters or fewer."),
  username: z
    .string()
    .trim()
    .regex(/^[a-z0-9-]{3,30}$/, "Use 3 to 30 lowercase letters, numbers, or hyphens."),
});

export type InviteAdminValues = z.infer<typeof inviteAdminSchema>;

export const profileSchema = z.object({
  displayName: z
    .string()
    .trim()
    .min(2, "Display name must be at least 2 characters.")
    .max(80, "Display name must be 80 characters or fewer."),
  bio: z.string().trim().max(1200, "Bio must be 1200 characters or fewer."),
});

export type ProfileValues = z.infer<typeof profileSchema>;
