import EmptyState from "@/components/empty-state";

    export default function ProcessingState() {
    return (
        <div className="bg-white rounded-lg p-4  flex flex-col gap-y-8 items-center justify-center">
            <EmptyState
                title="Meeting is completed"
                description="This meeting was completed, a summary will be available soon"
                image="/processing.svg"
            />
        </div>
    )   
}