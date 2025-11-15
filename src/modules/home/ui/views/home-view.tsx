"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function HomeView() {
  const [topic, setTopic] = useState("");
  const router = useRouter();
  const trpc = useTRPC();

  const startLearning = useMutation(
    trpc.meetings.startLearning.mutationOptions({
      onSuccess: (data) => {
        router.push(`/meetings/${data.meeting.id}`);
      },
      onError: (error) => {
        toast.error(error.message ?? "Something went wrong starting your session.");
      },
    }),
  );

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const value = topic.trim();

    if (!value) {
      toast.error("Please enter what you want to learn.");
      return;
    }

    startLearning.mutate({ topic: value });
  };

  const isPending = startLearning.isPending;

  return (
    <div className="flex-1 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-xl space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-semibold tracking-tight">
            What do you want to learn today?
          </h1>
          <p className="text-sm text-muted-foreground">
            Type a topic and we&apos;ll create a personalized AI tutor and session for you.
          </p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            value={topic}
            onChange={(event) => setTopic(event.target.value)}
            placeholder="What do you want to learn today?"
            disabled={isPending}
            className="h-12 text-base"
          />
          <Button
            type="submit"
            disabled={isPending}
            className="w-full h-12 text-base font-medium"
          >
            {isPending ? "Setting up your session..." : "Start learning"}
          </Button>
        </form>
        {isPending && (
          <p className="text-xs text-muted-foreground text-center">
Creating your personalized AI tutor and setting up your session - this will only take a moment.
          </p>
        )}
      </div>
    </div>
  );
}
