import { redirect } from "next/navigation";

// Stage 4 replaces this with a redirect to the home page of the user's active org type.
export default function RootPage() {
  redirect("/dashboard");
}
