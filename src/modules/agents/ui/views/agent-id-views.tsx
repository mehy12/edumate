"use client";

import ErrorState from "@/components/error-state";
import LoadingState from "@/components/loading-state";
import { useTRPC } from "@/trpc/client";
import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { useState } from "react";
import AgentIdViewHeader from "./agent-id-view-header";
import GeneratedAvatar from "@/components/generated-avatar";
import { Badge } from "@/components/ui/badge";
import { VideoIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useConfirm } from "@/hooks/use-confirm";
import UpdateAgentDialog from "../components/update-agent-dialog";

interface Props {
  agentId: string;
}

export default function AgentIdViews({ agentId }: Props) {
  const trpc = useTRPC();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [updateAgentDialogOpen, setUpdateAgentDialogOpen] = useState(false);

  const { data: agent } = useSuspenseQuery(
    trpc.agents.getOne.queryOptions({
      id: agentId,
    })
  );

  const removeAgent = useMutation(
    trpc.agents.remove.mutationOptions({
      /**
       * Invalidate the `getMany` query and redirect to the agents page after a successful removal.
       * TODO: Invalidate free tier agent usage
       */

      onSuccess: async () => {
        await queryClient.invalidateQueries(
          trpc.agents.getMany.queryOptions({})
        );
        // TODO: Invalidate free tier agent usage
        router.push("/agents");
      },
      onError: (error) => {
        toast.error(error.message);
      },
    })
  );

  const [RemoveConfirmation, confirmRemove] = useConfirm(
    "Are you sure you want to remove this agent?",
    `The following agent will be removed: ${agent.name} and associated meetings will be deleted`
  );
  const handleRemoveAgent = async () => {
    const ok = await confirmRemove();

    if (ok) {
      removeAgent.mutate({ id: agentId });
    }
    await removeAgent.mutateAsync({
      id: agentId,
    });
  };
  return (
    <>
      <RemoveConfirmation />
      <UpdateAgentDialog
        initialValues={agent}
        open={updateAgentDialogOpen}
        onOpenChange={setUpdateAgentDialogOpen}
      />
      <div className="flex-1 w-full p-4 md:px-8 flex flex-col gap-y-4">
        <AgentIdViewHeader
          agentId={agentId}
          agentName={agent.name}
          onEdit={() => setUpdateAgentDialogOpen(true)}
          onRemove={handleRemoveAgent}
        />
        <div className="bg-white  rounded-lg border">
          <div className="flex flex-col col-span-5 p-4 gap-y-5 ">
            <div className="flex items-center gap-x-3">
              <GeneratedAvatar
                variant="botttsNeutral"
                seed={agent.name}
                className="size-10"
              />
              <h2 className="text-lg font-medium">{agent.name}</h2>
            </div>
            <Badge variant="outline" className="flex items-center gap-x-2">
              <VideoIcon className="mr-2 h-4 w-4 text-blue-700" />
              {agent.meetingCount}{" "}
              {agent.meetingCount === 1 ? "Meeting" : "Meetings"}
            </Badge>
            <div className="flex flex-col gap-y-4">
              <p className="text-lg font-medium">Instructions</p>
              <p className="text-neutral-800">{agent.instructions}</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export const AgentIdViewLoading = () => {
  return (
    <LoadingState
      title="Loading agent"
      description="Please wait while we load the agent"
    />
  );
};

export const AgentIdViewError = () => {
  return (
    <ErrorState
      title="Error loading agent"
      description="Please try again later"
    />
  );
};
