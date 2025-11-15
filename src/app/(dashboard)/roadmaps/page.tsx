import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { trpc, getQueryClient } from "@/trpc/server";
import { auth } from "@/lib/auth";
import { RoadmapsView, RoadmapsViewError, RoadmapsViewLoading } from "@/modules/roadmaps/ui/views/roadmaps-view";
import { RoadmapsListHeader } from "@/modules/roadmaps/ui/components/roadmaps-list-header";
import { loadSearchParams } from "@/modules/roadmaps/params";
import type { SearchParams } from "nuqs/server";

interface Props {
  searchParams: Promise<SearchParams>;
}

export default async function RoadmapsPage({ searchParams }: Props) {
  const filters = await loadSearchParams(searchParams);

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/sign-in");
  }

  const queryClient = getQueryClient();
  void queryClient.prefetchQuery(
    trpc.roadmaps.getMany.queryOptions({
      ...filters,
    }),
  );

  return (
    <>
      <RoadmapsListHeader />
      <HydrationBoundary state={dehydrate(queryClient)}>
        <Suspense fallback={<RoadmapsViewLoading />}>
          <ErrorBoundary fallback={<RoadmapsViewError />}>
            <RoadmapsView />
          </ErrorBoundary>
        </Suspense>
      </HydrationBoundary>
    </>
  );
}
