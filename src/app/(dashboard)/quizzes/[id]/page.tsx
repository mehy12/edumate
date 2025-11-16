import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { QuizTakeView } from "@/modules/quizzes/ui/views/quiz-take-view";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function QuizTakePage({ params }: Props) {
  const { id } = await params;
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/sign-in");
  }

  return <QuizTakeView quizId={id} />;
}

