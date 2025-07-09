import { getSession } from "@/actions/auth";
import ProfileEditor from "./_components/ProfileEditor";
import { redirect } from "next/navigation";
import { UsersResponse } from "@/types/pocketbase-types";

export default async function Profile() {
  const user = await getSession();

  if (!user) {
    redirect("/login");
  }

  return <ProfileEditor user={user as UsersResponse} />;
}
