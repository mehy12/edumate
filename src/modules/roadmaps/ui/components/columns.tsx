"use client";

import { ColumnDef } from "@tanstack/react-table";
import { RoadmapListItem } from "../../types";
import { Badge } from "@/components/ui/badge";
import { MapIcon, CalendarIcon, BookOpenIcon } from "lucide-react";
import { format } from "date-fns";

export const columns: ColumnDef<RoadmapListItem>[] = [
  {
    accessorKey: "topic",
    header: "Topic",
    cell: ({ row }) => {
      const topic = row.original.topic ?? "Untitled roadmap";
      return (
        <div className="flex flex-col gap-y-1">
          <div className="flex items-center gap-2">
            <MapIcon className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-semibold truncate max-w-xs">
              {topic}
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <CalendarIcon className="h-3 w-3" />
            <span>
              {row.original.createdAt
                ? format(row.original.createdAt, "MMM d, yyyy")
                : ""}
            </span>
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "level",
    header: "Level",
    cell: ({ row }) => {
      const level = row.original.level;
      if (!level) return <span className="text-xs text-muted-foreground">—</span>;

      return (
        <Badge variant="outline" className="capitalize text-xs">
          {level}
        </Badge>
      );
    },
  },
  {
    accessorKey: "recommendedClassesCount",
    header: "Classes",
    cell: ({ row }) => {
      const count = row.original.recommendedClassesCount;
      if (count == null) {
        return <span className="text-xs text-muted-foreground">—</span>;
      }

      return (
        <Badge
          variant="outline"
          className="flex items-center gap-x-2 [&>svg]:h-4 [&>svg]:w-4 text-xs"
        >
          <BookOpenIcon className="text-emerald-600" />
          {count} {count === 1 ? "class" : "classes"}
        </Badge>
      );
    },
  },
];
