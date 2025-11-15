"use client";

import { useSuspenseQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

import { useTRPC } from "@/trpc/client";
import LoadingState from "@/components/loading-state";
import ErrorState from "@/components/error-state";
import { DataTable } from "@/components/data-table";
import { DataPagination } from "@/components/data-pagination";
import { useRoadmapsFilters } from "../../hooks/use-roadmaps-filters";
import { columns } from "../components/columns";

export function RoadmapsView() {
  const trpc = useTRPC();
  const router = useRouter();
  const [filters, setFilters] = useRoadmapsFilters();

  const { data } = useSuspenseQuery(
    trpc.roadmaps.getMany.queryOptions({
      ...filters,
    }),
  );

  return (
    <div className="flex-1 w-full p-4 md:p-8 flex flex-col gap-y-4">
      <DataTable
        columns={columns}
        data={data.items}
        onRowClick={(row) => router.push(`/roadmaps/${row.id}`)}
      />
      <DataPagination
        page={filters.page}
        totalPages={data.totalPages}
        onPageChange={(page) => setFilters({ page })}
      />
    </div>
  );
}

export const RoadmapsViewLoading = () => {
  return (
    <LoadingState
      title="Loading roadmaps"
      description="Please wait while we load your learning roadmaps."
    />
  );
};

export const RoadmapsViewError = () => {
  return (
    <ErrorState
      title="Error loading roadmaps"
      description="Please try again later."
    />
  );
};
