
import { Loader2Icon, CircleCheckIcon, CircleXIcon, ClockArrowUpIcon, VideoIcon } from "lucide-react"
import { CommandSelect } from "@/components/command-select"
import { MeetingStatus } from "../../types"

import {useMeetingsFilters} from "../../hooks/use-meetings-filters"

const options = [
    {id:MeetingStatus.Upcoming, value:MeetingStatus.Upcoming, children:(
        <div className="flex items-center gap-x-2 capitalize">
            <ClockArrowUpIcon className="h-4 w-4" />
            <span>{MeetingStatus.Upcoming}</span>
        </div>
    )},
    {id:MeetingStatus.Active, value:MeetingStatus.Active, children:(
        <div className="flex items-center gap-x-2 capitalize">
            <VideoIcon className="h-4 w-4" />
            <span>{MeetingStatus.Active}</span>
        </div>
    )},
    {id:MeetingStatus.Processing, value:MeetingStatus.Processing, children:(
        <div className="flex items-center gap-x-2 capitalize">
            <Loader2Icon className="h-4 w-4" />
            <span>{MeetingStatus.Processing}</span>
        </div>
    )},
    {id:MeetingStatus.Completed, value:MeetingStatus.Completed, children:(
        <div className="flex items-center gap-x-2 capitalize">
            <CircleCheckIcon className="h-4 w-4" />
            <span>{MeetingStatus.Completed}</span>
        </div>
    )},
    {id:MeetingStatus.Cancelled, value:MeetingStatus.Cancelled, children:(
        <div className="flex items-center gap-x-2 capitalize">
            <CircleXIcon className="h-4 w-4" />
            <span>{MeetingStatus.Cancelled}</span>
        </div>
    )},
]

export const StatusFilter = () => {
    const [filters, setFilters] = useMeetingsFilters()
    return (
        <CommandSelect
            options={options}
            value={filters.status || undefined}
           placeholder="Filter by status"
            className="h-9 max-w-[200px]"
            onSelect={(value) => setFilters({ status: value as MeetingStatus })}
        />
    )
}