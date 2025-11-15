import { inferRouterOutputs } from "@trpc/server";

import type { AppRouter } from "@/trpc/routers/_app";

export type RoadmapListItem = inferRouterOutputs<AppRouter>["roadmaps"]["getMany"]["items"][number];
export type RoadmapDetail = inferRouterOutputs<AppRouter>["roadmaps"]["getOne"];

export type RoadmapSummaryJson = RoadmapDetail["summary"];

export type RoadmapNode = RoadmapSummaryJson["roadmap"]["nodes"][number];
export type RoadmapLink = RoadmapSummaryJson["roadmap"]["links"][number];
