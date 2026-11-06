import { redirect } from "next/navigation";

/**
 * Public registration is closed: readers do not have accounts and admin accounts are
 * created by the site team. The route stays so old links redirect cleanly.
 */
export default function RegisterPage() {
  redirect("/login?notice=admin-only");
}
