import { nanoid } from "nanoid";
import { db } from "@/db";
import { activityEvents } from "@/db/schema";

export async function logUserActivity(userId: string, type: string) {
  try {
    await db.insert(activityEvents).values({
      id: nanoid(),
      userId,
      type,
      createdAt: new Date(),
    });
  } catch (error) {
    console.error("Failed to log user activity", error);
  }
}
