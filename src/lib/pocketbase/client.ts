import PocketBase from "pocketbase";
import "client-only";
import { TypedPocketBase } from "@/types/pocketbase-types";

export function createBrowserClient() {
  const client = new PocketBase(
    process.env.NEXT_PUBLIC_POCKETBASE_API_URL
  ) as TypedPocketBase;

  if (process.env.NODE_ENV === "development") {
    client.autoCancellation(false);
  }

  if (typeof document !== "undefined") {
    client.authStore.loadFromCookie(document.cookie);
    client.authStore.onChange(() => {
      document.cookie = client.authStore.exportToCookie({ httpOnly: false });
    });
  }

  return client;
}
