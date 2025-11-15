import { redirect } from "next/navigation";
import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import { db } from "@/db";
import { user } from "@/db/schema";
import { eq } from "drizzle-orm";

import SignInView from "@/modules/auth/ui/views/sign-in-view";

export default async function SignIn() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!!session) {
    const [dbUser] = await db
      .select()
      .from(user)
      .where(eq(user.id, session.user.id))
      .limit(1);

    if (dbUser?.hasCompletedOnboarding) {
      redirect("/");
    }

    redirect("/onboarding");
  }

  return <SignInView />;
}
