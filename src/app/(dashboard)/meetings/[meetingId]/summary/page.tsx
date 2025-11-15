import { auth } from "@/lib/auth";
import MeetingSummaryView from "@/modules/meetings/ui/views/meeting-summary-view";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

interface Props {
  params: Promise<{ meetingId: string }>;
}

export default async function MeetingSummaryPage({ params }: Props) {
  const { meetingId } = await params;

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/sign-in");
  }

  return <MeetingSummaryView meetingId={meetingId} />;
}
