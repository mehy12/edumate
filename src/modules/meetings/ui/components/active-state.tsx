import EmptyState from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import {  VideoIcon } from "lucide-react";
import Link from "next/link";

interface Props {
    meetingId: string;
}

export default function ActiveState({ meetingId }: Props) {
    return (
        <div className="bg-white rounded-lg p-4  flex flex-col gap-y-8 items-center justify-center">
            <EmptyState
                title="Meeting is active"
                description="Your meeting will end once all participants leave"
                image="/upcoming.svg"
            />
            <div className="flex flex-col-reverse lg:flex-row lg:justify-center items-center gap-2 w-full">
                
               
                <Button  asChild className="w-full lg:w-auto">
                <Link href={`/call/${meetingId}`}>
                    <VideoIcon className="" />
                    Join Meeting
                </Link>
                </Button>
            </div>
        </div>
    )
}