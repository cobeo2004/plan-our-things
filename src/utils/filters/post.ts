import { Posts } from "@/lib/pocketbase/schema/tsSchema";
import { TypedPocketBase } from "@/types/pocketbase-types";
import { pbQuery } from "@sergio9929/pb-query";

export const postFilter = (pbInstance: TypedPocketBase) =>
  pbQuery<Posts>()
    .between("created", "2025-01-01", "2025-12-31")
    .build(pbInstance.filter);
