"use client"
import { Button } from '@/components/ui/button';
import { PlusIcon, XIcon } from 'lucide-react';
import React, { useState } from 'react';
import NewAgentDialog from './new-agent-dialog';
import { AgentsSearchFilter } from './agents-search-filter';
import { useAgentsFilters } from '../../hooks/use-agents-filters';
import { DEFAULT_PAGE } from '@/constants';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

export function AgentsListHeader() {
    const [filters, setFilters] = useAgentsFilters()
    
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    
    const isAnyFilterModified = !!filters.search
    
    const onClearFilters = () => {
        setFilters({
            search: "",
            page: DEFAULT_PAGE
        })
    }

    return (
        <>
            <NewAgentDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} />
            <div className="flex flex-col gap-y-4 py-4 px-4 md:px-6 lg:px-8">
                <div className='flex items-center justify-between'>
                    <h5 className='text-2xl font-bold'>My Agents</h5>
                    <Button onClick={() => setIsDialogOpen(true)}>
                        <PlusIcon className="mr-2 h-4 w-4" />
                        New agent
                    </Button>
                </div>
                
                {/* Added ScrollArea for horizontal scrolling */}
                <ScrollArea className="w-full">
                    <div className='flex items-center gap-x-2 pb-2'>
                        <AgentsSearchFilter />
                        {isAnyFilterModified && (
                            <Button variant="outline" onClick={onClearFilters} className="shrink-0">
                                <XIcon className="mr-2 h-4 w-4" />
                                Clear
                            </Button>
                        )}
                    </div>
                    <ScrollBar orientation="horizontal" />
                </ScrollArea>
            </div>
        </>
    );
}