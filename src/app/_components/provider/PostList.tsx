"use client";

import {
  useQuery,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { postFilter } from "@/utils/filters/post";
import { createBrowserClient } from "@/lib/pocketbase";
import { useEffect } from "react";
import { PostsResponse } from "@/types/pocketbase-types";
import { ListResult } from "pocketbase";

export const PostList = () => {
  const pocketbase = createBrowserClient();
  const queryClient = useQueryClient();
  const { data } = useQuery({
    queryKey: ["posts"],
    queryFn: async () => {
      const posts = await pocketbase.collection("posts").getList(1, 10, {
        filter: postFilter(pocketbase),
      });
      return posts.items;
    },
    staleTime: Infinity,
    gcTime: Infinity,
  });

  useEffect(() => {
    pocketbase.collection("posts").subscribe("*", async (e) => {
      queryClient.setQueriesData(
        { queryKey: ["posts"] },
        (oldData: PostsResponse<unknown>[]) => {
          if (!oldData) return oldData;

          if (e.action === "create") {
            // Add new post to the beginning of the list
            return [e.record, ...oldData];
          }

          if (e.action === "update") {
            // Update existing post
            return oldData.map((item) => {
              if (item.id === e.record.id) {
                return e.record;
              }
              return item;
            });
          }

          if (e.action === "delete") {
            // Remove deleted post
            return oldData.filter((item) => item.id !== e.record.id);
          }

          return oldData;
        }
      );
    });
    return () => {
      pocketbase.collection("posts").unsubscribe("*");
    };
  }, [queryClient, pocketbase]);

  return (
    <>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {data &&
          data.map((post: any) => (
            <div
              key={post.id}
              className="border border-gray-200 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow"
            >
              <h2 className="text-xl font-semibold mb-3">{post.title}</h2>
              <p className="text-gray-600 mb-4">{post.description}</p>
              <div className="text-sm text-gray-500">
                <p>Created: {new Date(post.created).toLocaleDateString()}</p>
                {post.updated !== post.created && (
                  <p>Updated: {new Date(post.updated).toLocaleDateString()}</p>
                )}
              </div>
            </div>
          ))}
      </div>
      {data && data.length === 0 && (
        <div className="text-center text-gray-500 mt-8">
          <p>No posts found.</p>
        </div>
      )}
    </>
  );
};
