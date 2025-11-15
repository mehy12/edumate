"use client";
import ErrorState from "@/components/error-state";
import LoadingState from "@/components/loading-state";
import { useTRPC } from "@/trpc/client";
import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import React, { useState } from "react";
import MeetingIdViewHeader from "./meeting-id-view-header";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useConfirm } from "@/hooks/use-confirm";
import UpdateMeetingDialog from "../components/update-meeting-dialog";
import UpcomingState from "../components/upcoming-state";
import CancelledState from "../components/cancelled-state";
import ProcessingState from "../components/processing-state";
import CompletedState from "../components/completed-state";
import ActiveState from "../components/active-state";

interface Props {
  meetingId: string;
}

export default function MeetingIdView({ meetingId }: Props) {
  const trpc = useTRPC();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [openUpdateMeetingDialog, setOpenUpdateMeetingDialog] = useState(false);
  const [RemoveConfirmation, confirmRemove] = useConfirm(
    "Remove meeting",
    "Are you sure you want to remove this meeting? This action cannot be undone."
  );

  const { data } = useSuspenseQuery(
    trpc.meetings.getOne.queryOptions({ id: meetingId })
  );
  const removeMeeting = useMutation(
    trpc.meetings.remove.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(trpc.meetings.getMany.queryOptions({}));
        // TODO: invalidate free tier usage
        router.push("/meetings");
      },
      onError: (error) => {
        toast.error(error.message);
      },
    })
  );

  const handleRemoveMeeting = async () => {
    const ok = await confirmRemove();

    if (!ok) return;

    await removeMeeting.mutateAsync({ id: meetingId });
  };

  const isActive = data?.status === "active";
  const isUpcoming = data?.status === "upcoming";
  const isCancelled = data?.status === "cancelled";
  const isCompleted = data?.status === "completed";
  const isProcessing = data?.status === "processing";

  return (
    <>
      <RemoveConfirmation />
      <UpdateMeetingDialog
        open={openUpdateMeetingDialog}
        onOpenChange={setOpenUpdateMeetingDialog}
        initialValues={data}
      />
      <div className="flex-1 p-4 md:px-8 flex flex-col gap-y-4">
        <MeetingIdViewHeader
          meetingId={meetingId}
          meetingName={data?.name}
          onRemove={handleRemoveMeeting}
          onEdit={() => setOpenUpdateMeetingDialog(true)}
        />
        {isCancelled && <CancelledState />}
        {isActive && <ActiveState meetingId={meetingId} />}
        {isCompleted && <CompletedState data={data} />}
        {isProcessing && <ProcessingState />}
        {isUpcoming && (
          <UpcomingState
            meetingId={meetingId}
            onCancelMeeting={() => {}}
            isCancelling={false}
          />
        )}
      </div>
    </>
  );
}

export const MeetingIdViewLoading = () => {
  return (
    <LoadingState
      title="Loading meetings"
      description="Please wait while we load the meetings"
    />
  );
};

export const MeetingIdViewError = () => {
  return (
    <ErrorState
      title="Error loading meetings"
      description="Please try again later"
    />
  );
};
