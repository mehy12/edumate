import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { RoadmapDetailView } from "@/modules/roadmaps/ui/views/roadmap-detail-view";

interface Props {
  params: Promise<{ roadmapId: string }>;
}

export default async function RoadmapDetailPage({ params }: Props) {
  const { roadmapId } = await params;

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/sign-in");
  }

  return <RoadmapDetailView roadmapId={roadmapId} />;
}
