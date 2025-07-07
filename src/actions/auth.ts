"use server";

import { createServerClient } from "@/lib/pocketbase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function getSession() {
  const pocketbase = await createServerClient();
  if (!pocketbase.authStore.isValid) {
    return null;
  }

  return pocketbase.authStore.record;
}

export async function logout() {
  const pocketbase = await createServerClient();
  pocketbase.authStore.clear();
  revalidatePath("/", "layout");
  redirect("/login");
}

export async function login(email: string, password: string) {
  const client = await createServerClient();

  try {
    await client.collection("users").authWithPassword(email, password);
  } catch (e) {
    throw new Error("Invalid email or password");
  }

  revalidatePath("/", "layout");
}

export async function register({
  email,
  username,
  password,
  passwordConfirm,
}: {
  email: string;
  username: string;
  password: string;
  passwordConfirm: string;
}) {
  const client = await createServerClient();

  try {
    await client
      .collection("users")
      .create({ email, username, password, passwordConfirm });
    await client.collection("users").authWithPassword(email, password);
  } catch (e) {
    // TODO: Handle error
    console.error(e);
    return;
  }

  revalidatePath("/", "layout");
}

export async function updateProfile({
  userId,
  name,
}: {
  userId: string;
  name: string;
}) {
  const client = await createServerClient();

  try {
    // Update the user record
    const updatedUser = await client.collection("users").update(userId, {
      name: name.trim(),
    });

    revalidatePath("/", "layout");
    return updatedUser;
  } catch (e: any) {
    throw new Error(e.message || "Failed to update profile");
  }
}
