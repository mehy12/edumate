"use client"

import { ColumnDef } from "@tanstack/react-table"
import { AgentGetMany } from "../../types"
import GeneratedAvatar from "@/components/generated-avatar"
import { CornerDownRightIcon, VideoIcon } from "lucide-react"
import { Badge } from "@/components/ui/badge"

// This type is used to define the shape of our data.
// You can use a Zod schema here if you want.


export const columns: ColumnDef<AgentGetMany[number]>[] = [
 
  {
    accessorKey: "name",
    header: "Agent Name",
    cell: ({row}) => {
      return (
        <div className="flex flex-col gap-y-2">
          <div className="flex items-center gap-2">
            <GeneratedAvatar seed={row.original.name} variant="botttsNeutral" className="size-10" />
            <span className=" font-semibold capitalize">{row.original.name}</span>
          </div>
          
          <div className="flex items-center gap-x-1.5">
        <CornerDownRightIcon className="h-4 w-4 text-muted-foreground" />
        <span className="text-xs text-muted-foreground max-w-[200px] truncate">{row.original.instructions}</span>
          </div>
        </div>
      )
    }
  },
  {
    accessorKey: "meetingCount",
    header: "Meetings",
    cell: ({row}) => {
      return (
        <Badge variant="outline" className="flex items-center gap-x-2 [&>svg]:h-4 [&>svg]:w-4">
          <VideoIcon className=" text-blue-700"  />
         {row.original.meetingCount} {row.original.meetingCount === 1 ? "Meeting" : "Meetings"}
        </Badge>
      )
    }
  }
]
