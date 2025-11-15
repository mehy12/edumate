"use client"
import {ReactNode, useState} from "react";
import { ChevronsUpDownIcon } from "lucide-react";

import { Button } from "./ui/button";
import {cn} from "@/lib/utils";

import {CommandInput, CommandList, CommandEmpty, CommandItem, CommandResponsiveDialog} from "@/components/ui/command";

interface CommandSelectProps {
options: Array<{id: string, value: string, children: ReactNode}>
onSelect: (id: string) => void
onSearch?: (search: string) => void
value?: string
isSearchable?: boolean
placeholder?: string
className?: string
}

export const CommandSelect = ({
options,
onSelect,
onSearch,
value,
isSearchable,
placeholder,
className,
}: CommandSelectProps) => {
    const [open, setOpen] = useState(false);
    const selectedOption = options.find((option) => option.id === value);
    const handleOpenChange = (value: boolean) => {
        onSearch?.('')
        setOpen(value)
    }
    return(
        <>
        <Button type="button" onClick={() => setOpen(!open)} variant={'outline'} className={cn('h-9 w-full justify-between px-2', !selectedOption && 'text-muted-foreground', className)}>
            <div className="">
                {selectedOption?.children??placeholder}
            </div>
            <ChevronsUpDownIcon />
        </Button>
        <CommandResponsiveDialog open={open} onOpenChange={handleOpenChange} shouldFilter={!onSearch}>
            {isSearchable && <CommandInput placeholder={placeholder} onValueChange={onSearch} />}
            <CommandList>
                <CommandEmpty>
                    <span className="text-muted-foreground text-sm">
                        No results.
                    </span>
                </CommandEmpty>
                {
                    options.map((option) => (
                        <CommandItem 
                            key={option.id} 
                            value={option.value} 
                            onSelect={() => {
                                onSelect(option.value)
                                setOpen(false)
                            }}>
                            {option.children}
                        </CommandItem>
                    ))
                }
            </CommandList>
        </CommandResponsiveDialog>
        </>
    )
}
