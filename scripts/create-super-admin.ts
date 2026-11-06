/**
 * One-time script: creates the first super admin.
 *
 *   npm run create-super-admin -- <email> <password> [username] [display name]
 *
 * Reads NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY from .env.local
 * (the npm script passes --env-file). Uses the service role key, so run it only on a
 * trusted machine. Never ship this key to the browser.
 */
import { createClient } from "@supabase/supabase-js";

async function main() {
  const [email, password, usernameArg, displayNameArg] = process.argv.slice(2);
  if (!email || !password) {
    console.error("Usage: npm run create-super-admin -- <email> <password> [username] [display name]");
    process.exit(1);
  }
  if (password.length < 10) {
    console.error("Password must be at least 10 characters.");
    process.exit(1);
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    console.error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local first.");
    process.exit(1);
  }

  const username = (usernameArg ?? email.split("@")[0])
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 30);
  if (!/^[a-z0-9-]{3,30}$/.test(username)) {
    console.error("Username must be 3 to 30 lowercase letters, numbers, or hyphens.");
    process.exit(1);
  }
  const displayName = displayNameArg ?? username;

  const supabase = createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (error || !data.user) {
    console.error(`Could not create the auth user: ${error?.message ?? "unknown error"}`);
    process.exit(1);
  }

  const { error: profileError } = await supabase.from("profiles").insert({
    id: data.user.id,
    username,
    display_name: displayName,
    role: "SUPER_ADMIN",
    status: "ACTIVE",
  });
  if (profileError) {
    await supabase.auth.admin.deleteUser(data.user.id);
    console.error(`Could not create the profile: ${profileError.message}`);
    process.exit(1);
  }

  console.log(`Super admin created: ${email} (@${username}). Sign in at /login.`);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
