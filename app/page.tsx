import { redirect } from "next/navigation";

// Sign-in-only app: the root has no public landing page.
export default function Home() {
  redirect("/login");
}
