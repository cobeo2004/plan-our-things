import app from "@/hono";
import { handle } from "hono/vercel";
import { ServerRuntime } from "next";

export const runtime: ServerRuntime = "edge";

export const GET = handle(app);
export const POST = handle(app);
