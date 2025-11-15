"use client";

import { SearchIcon } from "lucide-react";

import { Input } from "@/components/ui/input";
import { useRoadmapsFilters } from "../../hooks/use-roadmaps-filters";

export function RoadmapsSearchFilter() {
  const [filters, setFilters] = useRoadmapsFilters();

  return (
    <div className="relative">
      <Input
        placeholder="Filter by topic"
        value={filters.search}
        onChange={(e) => setFilters({ search: e.target.value })}
        className="h-9 bg-white w-[250px] pl-7"
      />
      <SearchIcon className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4" />
    </div>
  );
}
