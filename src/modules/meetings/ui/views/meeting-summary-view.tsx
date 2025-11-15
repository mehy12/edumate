"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { MeetingSummaryJson } from "@/modules/meetings/types";
import { RoadmapGraph } from "../components/roadmap-graph";

interface MeetingSummaryViewProps {
  meetingId: string;
}

function SummarySkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-80" />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-40" />
          </CardHeader>
          <CardContent className="space-y-3">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-20 w-full" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-48" />
          </CardHeader>
          <CardContent className="space-y-3">
            <Skeleton className="h-4 w-44" />
            <Skeleton className="h-16 w-full" />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-32" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-80 w-full" />
        </CardContent>
      </Card>
    </div>
  );
}

export default function MeetingSummaryView({ meetingId }: MeetingSummaryViewProps) {
  const {
    data,
    isLoading,
    error,
  } = useQuery<MeetingSummaryJson, Error>({
    queryKey: ["meeting-summary", meetingId],
    queryFn: async () => {
      const res = await fetch(`/api/meetings/${meetingId}/summary`);
      const json = await res.json();

      if (!res.ok) {
        const message =
          (json && typeof json.error === "string" && json.error) ||
          "Failed to load session summary";
        throw new Error(message);
      }

      return json as MeetingSummaryJson;
    },
  });

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6 max-w-6xl mx-auto">
      <header className="space-y-1">
        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
          Session Summary
        </h1>
        <p className="text-sm text-muted-foreground">
          Here&apos;s what eduMate learned about you in this session.
        </p>
      </header>

      {isLoading && <SummarySkeleton />}

      {!isLoading && error && (
        <Card>
          <CardHeader>
            <CardTitle>Summary not available yet</CardTitle>
            <CardDescription>{error.message}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Button asChild variant="default">
              <Link href="/meetings">Back to meetings</Link>
            </Button>
            <Button variant="outline" onClick={() => window.location.reload()}>
              Refresh
            </Button>
          </CardContent>
        </Card>
      )}

      {!isLoading && data && (
        <div className="flex flex-col gap-6">
          {/* Student summary */}
          <Card>
            <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <CardTitle>Student profile</CardTitle>
                <CardDescription>
                  A quick overview of your level and how you learned in this session.
                </CardDescription>
              </div>
              <div className="flex flex-wrap gap-2 mt-2 md:mt-0">
                <Badge variant="outline" className="uppercase tracking-wide">
                  Level: {data.student_summary.level}
                </Badge>
                <Badge
                  variant={
                    data.student_summary.fast_or_slow_learner.toLowerCase() === "fast"
                      ? "default"
                      : data.student_summary.fast_or_slow_learner.toLowerCase() === "medium"
                      ? "secondary"
                      : "destructive"
                  }
                  className="uppercase tracking-wide"
                >
                  {data.student_summary.fast_or_slow_learner} learner
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="grid gap-6 md:grid-cols-3">
              <div className="space-y-2 md:col-span-2">
                <h3 className="text-sm font-medium text-foreground">Session summary</h3>
                <p className="text-sm text-muted-foreground whitespace-pre-line">
                  {data.student_summary.call_summary}
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="text-xs font-semibold text-foreground uppercase tracking-wide mb-1">
                    Strengths
                  </h4>
                  <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                    {data.student_summary.strengths.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-foreground uppercase tracking-wide mb-1">
                    Focus areas
                  </h4>
                  <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                    {data.student_summary.weaknesses.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recommended classes */}
          <Card>
            <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <CardTitle>Recommended classes</CardTitle>
                <CardDescription>
                  Tailored follow-up sessions to help you master this topic.
                </CardDescription>
              </div>
              <Badge variant="outline" className="mt-2 md:mt-0">
                Recommended number of future classes: {data.recommended_classes.count}
              </Badge>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {data.recommended_classes.classes.map((cls) => (
                  <Card key={cls.title} className="h-full">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-semibold leading-snug">
                        {cls.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        {cls.description}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Roadmap visualization */}
          <Card>
            <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <CardTitle>Learning roadmap</CardTitle>
                <CardDescription>
                  A concept and class roadmap showing how your next lessons connect.
                </CardDescription>
              </div>
              {data.roadmapId && (
                <Button asChild variant="outline" className="mt-2 md:mt-0">
                  <Link href={`/roadmaps/${data.roadmapId}`}>
                    View roadmap in Roadmaps
                  </Link>
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {data.roadmap.nodes.length && data.roadmap.links.length ? (
                <RoadmapGraph nodes={data.roadmap.nodes} links={data.roadmap.links} />
              ) : (
                <p className="text-sm text-muted-foreground">
                  No roadmap data was generated for this session.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Resources */}
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Recommended articles & websites</CardTitle>
                <CardDescription>
                  Explore these resources to reinforce what you learned.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {data.resources.websites.map((site) => (
                  <div key={site.url} className="space-y-1">
                    <a
                      href={site.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-medium text-primary hover:underline"
                    >
                      {site.title}
                    </a>
                    <p className="text-xs text-muted-foreground">
                      {site.description}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recommended books</CardTitle>
                <CardDescription>
                  Books that go deeper into the concepts from this session.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {data.resources.books.map((book) => (
                  <div key={book.title} className="space-y-1">
                    <p className="text-sm font-medium">
                      {book.title}
                      {book.author && (
                        <span className="text-xs text-muted-foreground ml-1">
                          by {book.author}
                        </span>
                      )}
                    </p>
                    <a
                      href={book.purchase_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-primary hover:underline"
                    >
                      View / buy this book
                    </a>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Next steps */}
          <Card>
            <CardHeader>
              <CardTitle>Next steps</CardTitle>
              <CardDescription>
                Ready for your next class? Use this plan to guide your learning.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-3">
              <Button asChild>
                <Link href="/meetings">Schedule next class</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href={`/call/${meetingId}`}>Start a new live session</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
