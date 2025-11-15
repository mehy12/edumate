import { inferRouterOutputs } from "@trpc/server";

import type { AppRouter } from "@/trpc/routers/_app";

export type MeetingGetOne = inferRouterOutputs<AppRouter>["meetings"]["getOne"];
export type MeetingGetMany = inferRouterOutputs<AppRouter>["meetings"]["getMany"]["items"];
export enum MeetingStatus {
    //  "upcoming","active","processing","completed","cancelled"
    Upcoming = "upcoming",
    Active = "active",
    Processing = "processing",
    Completed = "completed",
    Cancelled = "cancelled"
}

export type StreamTranscriptItem = {
    speaker_id: string,
    text: string,
    type: string,
    start_ts: number,
    stop_ts: number
}

export interface MeetingSummaryJson {
    student_summary: {
        level: string;
        fast_or_slow_learner: string;
        strengths: string[];
        weaknesses: string[];
        call_summary: string;
    };
    recommended_classes: {
        count: number;
        classes: {
            title: string;
            description: string;
        }[];
    };
    roadmap: {
        nodes: {
            id: string;
            label: string;
            type: string; // "concept" | "class"
        }[];
        links: {
            from: string;
            to: string;
        }[];
    };
    resources: {
        websites: {
            title: string;
            description: string;
            url: string;
        }[];
        books: {
            title: string;
            author?: string;
            purchase_url: string;
        }[];
    };
    roadmapId?: string; // ID of the roadmap in meetingSummaries table
}
