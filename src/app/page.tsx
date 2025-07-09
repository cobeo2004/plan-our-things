import { getSession } from "@/actions/auth";
import { redirect } from "next/navigation";

export default async function Home() {
  const user = await getSession();
  if (user === null || user === undefined) {
    redirect("/login");
  }
  user;
  redirect("/dashboard");
}
