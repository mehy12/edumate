import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { useTRPC } from "@/trpc/client";
import { CommandSelect } from "@/components/command-select";
import GeneratedAvatar from "@/components/generated-avatar";

import {useMeetingsFilters} from "../../hooks/use-meetings-filters"

export const AgentIdFilter = () => {
    const [filters, setFilters] = useMeetingsFilters()
    const trpc = useTRPC()
    const [agentsSearch, setAgentSearch] = useState("")
    const {data} = useQuery(trpc.agents.getMany.queryOptions({
        search: agentsSearch,
        pageSize:100
    }))
    return (
        <CommandSelect
            options={(data?.items || []).map(agent=>({
                id:agent.id,
                value:agent.id,
                children:(
                    <div className="flex items-center gap-x-2">
                        <GeneratedAvatar seed={agent.name} variant="botttsNeutral" className="size-4"/>
                        <span>{agent.name}</span>
                    </div>
                )
            }))}
            value={filters.agentId}
            placeholder="Filter by agent"
            className="h-9 max-w-[200px]"
            onSearch={setAgentSearch}
            onSelect={(value) => setFilters({ agentId: value })}
        />
    )
}
