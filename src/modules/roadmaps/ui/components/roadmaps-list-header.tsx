"use client";

import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { XIcon } from "lucide-react";
import { RoadmapsSearchFilter } from "./roadmaps-search-filter";
import { useRoadmapsFilters } from "../../hooks/use-roadmaps-filters";
import { DEFAULT_PAGE } from "@/constants";

export function RoadmapsListHeader() {
  const [filters, setFilters] = useRoadmapsFilters();

  const isAnyFilterModified = !!filters.search;

  const onClearFilters = () => {
    setFilters({
      search: "",
      page: DEFAULT_PAGE,
    });
  };

  return (
    <div className="flex flex-col gap-y-4 py-4 px-4 md:px-6 lg:px-8">
      <div className="flex flex-col gap-y-1">
        <h5 className="text-2xl font-bold">My Roadmaps</h5>
        <p className="text-sm text-muted-foreground">
          Browse personalized learning roadmaps generated from your sessions.
        </p>
      </div>

      <ScrollArea className="w-full">
        <div className="flex items-center gap-x-2 pb-2">
          <RoadmapsSearchFilter />
          {isAnyFilterModified && (
            <Button
              variant="ghost"
              onClick={onClearFilters}
              className="shrink-0"
            >
              <XIcon className="h-4 w-4 mr-1" />
              Clear
            </Button>
          )}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
}
