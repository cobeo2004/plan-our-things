import { getSession } from "@/actions/auth";
import { MiddlewareHandler } from "hono";
import "server-only";

export const authMiddleware: MiddlewareHandler<{
  Variables: {
    session: Awaited<ReturnType<typeof getSession>>;
  };
}> = async (c, next) => {
  const session = await getSession();
  if (!session) {
    return c.json({ error: "Unauthorized" }, 401);
  }
  c.set("session", session);
  await next();
};
