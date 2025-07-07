import { cookies } from "next/headers";
import PocketBase from "pocketbase";
import "server-only";
import { TypedPocketBase } from "@/types/pocketbase-types";
import { AsyncAuthStore } from "pocketbase";

export const COOKIE_NAME = "pb_auth";

export async function createServerClient() {
  const cookieStore = await cookies();

  const client = new PocketBase(
    process.env.NEXT_PUBLIC_POCKETBASE_API_URL,
    new AsyncAuthStore({
      save: async (serializedPayload) => {
        try {
          console.log("saving auth from server");
          cookieStore.set(COOKIE_NAME, serializedPayload);
        } catch {
          // This method was called from a Server Component.
          // This can be ignored if you have middleware refreshing
          // user sessions.
        }
      },
      clear: async () => {
        try {
          console.log("clearing auth from server");
          cookieStore.delete(COOKIE_NAME);
          console.log("auth cleared from server");
          console.log(cookieStore.get(COOKIE_NAME)?.value);
        } catch {
          // This method was called from a Server Component.
          // This can be ignored if you have middleware refreshing
          // user sessions.
        }
      },
      initial: cookieStore.get(COOKIE_NAME)?.value,
    })
  ) as TypedPocketBase;

  if (process.env.NODE_ENV === "development") {
    client.autoCancellation(false);
  }

  return client;
}
