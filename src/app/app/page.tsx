import { redirect } from "next/navigation";

// /app → /app/dashboard
export default function AppIndexPage() {
  redirect("/app/dashboard");
}
