import "server-only";
import { Hono } from "hono";
import { getSession } from "@/actions/auth";
import { authMiddleware } from "./middlewares/auth";

const app = new Hono<{
  Variables: {
    session: Awaited<ReturnType<typeof getSession>>;
  };
}>().basePath("/api/v1");

app.use(authMiddleware);

app.get("/with-pb-auth", async (c) => {
  const session = c.get("session");
  console.log(session);
  return c.json({ message: "Hello, world!" });
});
export default app;
