import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { AcademicOnboardingForm } from "@/modules/onboarding/ui/academic-onboarding-form";
import { db } from "@/db";
import { user } from "@/db/schema";
import { eq } from "drizzle-orm";

export default async function OnboardingPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/sign-in");
  }

  const [dbUser] = await db
    .select()
    .from(user)
    .where(eq(user.id, session.user.id))
    .limit(1);

  if (dbUser?.hasCompletedOnboarding) {
    redirect("/");
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-6">
      <div className="w-full max-w-2xl space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-bold">Onboarding</h1>
          <p className="text-muted-foreground">
            We will add academic details and interests selection here in the next steps.
          </p>
        </div>

        <AcademicOnboardingForm />
      </div>
    </div>
  );
}
