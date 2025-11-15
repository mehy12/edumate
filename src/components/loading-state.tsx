import { Loader2Icon } from "lucide-react";

interface LoadingStateProps {
  title?: string;
  description?: string;
}
export default function LoadingState({
  title,
  description,
}: LoadingStateProps) {
  return (
    <div className="py-4 px-8 flex flex-1 items-center justify-center">
      <div className="flex flex-col items-center justify-center gap-y-6 bg-background rounded-lg p-10 shadow-sm">
        <Loader2Icon className="h-10 w-10 text-muted-foreground animate-spin" />
        <div className="flex flex-col gap-y-2 text-center">
          <h3 className="text-lg font-semibold">{title}</h3>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
    </div>
  );
}

export const AgentsViewLoading = () => {
  return (
    <LoadingState
      title="Loading agents"
      description="Please wait while we load the agents"
    />
  );
};
