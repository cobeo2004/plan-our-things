import { createServerClient } from "@/lib/pocketbase/server";
import { makeQueryClient } from "@/utils/tanstack-query";
import { postFilter } from "@/utils/filters/post";
import { Suspense } from "react";
import { PostList } from "@/app/_components/provider/PostList";

export default async function Home() {
  const qc = makeQueryClient();
  const pocketbase = await createServerClient();

  await qc.prefetchQuery({
    queryKey: ["posts"],
    queryFn: async () => {
      const posts = await pocketbase.collection("posts").getList(1, 10, {
        filter: postFilter(pocketbase),
      });
      return posts.items;
    },
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Posts</h1>
      <Suspense fallback={<div>Loading...</div>}>
        <PostList />
      </Suspense>
    </div>
  );
}
