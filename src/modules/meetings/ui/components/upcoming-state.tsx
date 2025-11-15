import EmptyState from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { BanIcon, VideoIcon } from "lucide-react";
import Link from "next/link";

interface Props {
    meetingId: string;
    onCancelMeeting: () => void;
    isCancelling: boolean;
}

export default function UpcomingState({ meetingId, onCancelMeeting, isCancelling }: Props) {
    return (
        <div className="bg-white rounded-lg p-4  flex flex-col gap-y-8 items-center justify-center">
            <EmptyState
                title="Meeting has not started"
                description="Your meeting has not started yet you will see the summary after the meeting"
                image="/upcoming.svg"
            />
            <div className="flex flex-col-reverse lg:flex-row lg:justify-center items-center gap-2 w-full">
                
                <Button variant={'destructive'} className="w-full lg:w-auto" onClick={onCancelMeeting} disabled={isCancelling}>
                    <BanIcon className="" />
                    Cancel Meeting
                </Button>
                <Button variant={'secondary'} asChild className="w-full lg:w-auto">
                <Link href={`/call/${meetingId}`}>
                    <VideoIcon className="" />
                    Start Meeting
                </Link>
                </Button>
            </div>
        </div>
    )
}