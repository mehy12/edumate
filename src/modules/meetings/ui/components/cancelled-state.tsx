import EmptyState from "@/components/empty-state";
    
export default function CancelledState() {
    return (
        <div className="bg-white rounded-lg p-4  flex flex-col gap-y-8 items-center justify-center">
            <EmptyState
                title="Meeting is cancelled"
                description="Your meeting is cancelled"
                image="/cancelled.svg"
            />
        </div>
    )
}