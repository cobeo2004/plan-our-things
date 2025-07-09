import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { Layout } from "../_components/Layout";
import { makeQueryClient } from "@/utils/tanstack-query";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const queryClient = makeQueryClient();
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <Layout>{children}</Layout>
    </HydrationBoundary>
  );
}
