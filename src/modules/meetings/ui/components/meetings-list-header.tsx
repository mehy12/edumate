"use client"
import { Button } from '@/components/ui/button';
import { PlusIcon, XCircleIcon } from 'lucide-react';
import React, { useState } from 'react';
import NewMeetingDialog from './new-meeting-dialog';
import { MeetingsSearchFilter } from './meetings-search-filter';
import { StatusFilter } from './status-filter';
import { AgentIdFilter } from './agent-id-filter';
import { useMeetingsFilters } from '../../hooks/use-meetings-filters';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { DEFAULT_PAGE } from '@/constants';

export function MeetingsListHeader() {
  const [filters, setFilters] = useMeetingsFilters()
  
  const [isDialogOpen, setIsDialogOpen] = useState(false)
   
  const isAnyFilterModified = 
    !!filters.status || !!filters.agentId || !!filters.search
   
  const onClearFilters = () => {
    setFilters({
      status: null,
      agentId: "",
      search: "",
      page: DEFAULT_PAGE
    })
  }

  return (
    <>
      <NewMeetingDialog open={isDialogOpen} onOpenChange={() => setIsDialogOpen(false)} />
      <div className="flex flex-col gap-y-4 py-4 px-4 md:px-6 lg:px-8">
        <div className='flex items-center justify-between'>
          <h5 className='text-2xl font-bold'>My Meetings</h5>
          <Button onClick={() => { setIsDialogOpen(true) }}>
            <PlusIcon className="mr-2 h-4 w-4" />
            New meeting
          </Button>
        </div>
        
        {/* Fixed ScrollArea with proper width constraint */}
        <ScrollArea className="w-full">
          <div className='flex items-center gap-x-2 pb-2'>
            <MeetingsSearchFilter />
            <StatusFilter />
            <AgentIdFilter />
            {isAnyFilterModified && (
              <Button variant="ghost" onClick={onClearFilters} className="shrink-0">
                <XCircleIcon className="size-4" />
                Clear filters
              </Button>
            )}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>
    </>
  );
}