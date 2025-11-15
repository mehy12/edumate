import Link from 'next/link';

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'

import {
    Button,
} from '@/components/ui/button'

import {  ChevronRightIcon, TrashIcon, PencilIcon, MoreVerticalIcon } from 'lucide-react';
interface Props {
    agentId: string;
    agentName: string;
    onRemove: () => void;
    onEdit: () => void;
}
export default function AgentIdViewHeader({
    agentId,
    agentName,
    onRemove,
    onEdit
}: Props) {
  return (
    <div className='flex items-center justify-between'>
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild className='text-xl font-medium'>
            <Link href="/agents">My Agents</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator>
          <ChevronRightIcon className="h-4 w-4 text-foreground text-xl font-medium [&>svg]:size-4"/>
          </BreadcrumbSeparator>

          <BreadcrumbItem>
            <BreadcrumbLink asChild className='text-xl font-medium text-foreground'>
            <Link href={`/agents/${agentId}`}>{agentName}</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      {/* without modal false the dialog that this dropdown menu opens causes the website to freeze  or unclickable*/}
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="ml-auto">
            <MoreVerticalIcon className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={onEdit}>
            <PencilIcon className="mr-2 h-4 w-4 text-black" />
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onRemove}>
            <TrashIcon className="mr-2 h-4 w-4 text-black" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
