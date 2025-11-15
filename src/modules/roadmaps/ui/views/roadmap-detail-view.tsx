"use client";

import { useSuspenseQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import Link from "next/link";

import { useTRPC } from "@/trpc/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RoadmapGraph } from "@/modules/meetings/ui/components/roadmap-graph";
import type { RoadmapSummaryJson } from "../../types";

interface RoadmapDetailViewProps {
  roadmapId: string;
}

export function RoadmapDetailView({ roadmapId }: RoadmapDetailViewProps) {
  const trpc = useTRPC();

  const { data } = useSuspenseQuery(
    trpc.roadmaps.getOne.queryOptions({ id: roadmapId }),
  );

  const summary = data.summary as RoadmapSummaryJson;

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6 max-w-5xl mx-auto">
      <header className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
            Learning roadmap
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Generated from one of your recent sessions.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 mt-3 md:mt-0">
          {data.topic && (
            <Badge variant="outline" className="max-w-xs truncate">
              Topic: {data.topic}
            </Badge>
          )}
          {summary.student_summary.level && (
            <Badge variant="outline" className="capitalize">
              Level: {summary.student_summary.level}
            </Badge>
          )}
          <Badge variant="outline">
            {data.createdAt ? format(data.createdAt, "MMM d, yyyy") : ""}
          </Badge>
        </div>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Overview</CardTitle>
          <CardDescription>
            A quick summary of how this roadmap was tailored for you.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="text-sm font-medium mb-1">Session summary</h3>
            <p className="text-sm text-muted-foreground whitespace-pre-line">
              {summary.student_summary.call_summary}
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wide mb-1">
                Strengths
              </h4>
              <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                {summary.student_summary.strengths.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wide mb-1">
                Focus areas
              </h4>
              <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                {summary.student_summary.weaknesses.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Roadmap graph</CardTitle>
          <CardDescription>
            Concepts and classes connected as an interactive graph.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {summary.roadmap.nodes.length && summary.roadmap.links.length ? (
            <RoadmapGraph
              nodes={summary.roadmap.nodes}
              links={summary.roadmap.links}
            />
          ) : (
            <p className="text-sm text-muted-foreground">
              No roadmap data was generated for this session.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recommended classes</CardTitle>
          <CardDescription>
            Follow-up classes suggested for this topic.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {summary.recommended_classes.classes.map((cls) => (
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

      <div className="flex flex-wrap gap-3">
        <Button asChild variant="outline">
          <Link href="/roadmaps">Back to roadmaps</Link>
        </Button>
        <Button asChild>
          <Link href={`/meetings/${data.meetingId}/summary`}>
            View full session summary
          </Link>
        </Button>
      </div>
    </div>
  );
}
