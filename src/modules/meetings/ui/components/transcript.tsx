"use client";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { generateAvatarUri } from "@/lib/avatar";
import { useTRPC } from "@/trpc/client";
import { useQuery } from "@tanstack/react-query";
import { SearchIcon } from "lucide-react";
import { useState } from "react";
import Highlighter from "react-highlight-words";

interface TranscriptItem {
  start_ts: number;
  text: string;
  speaker_id: string;
  type: string;
  stop_ts: number;
  user?: {
    name: string;
    image: string;
  };
  speaker?: {
    name: string;
    image: string;
  };
}

interface Props {
  meetingId: string;
}

export const Transcript = ({ meetingId }: Props) => {
  const trpc = useTRPC();
  const { data, isLoading, error } = useQuery(
    trpc.meetings.getTranscript.queryOptions({ id: meetingId })
  );
  const [searchQuery, setSearchQuery] = useState("");

  const isUserItem = (
    item: TranscriptItem
  ): item is TranscriptItem & { user: { name: string; image: string } } => {
    return !!item.user;
  };

  const filteredData = (data ?? []).filter((item) =>
    item.text?.toString().toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Transcript</h2>
        <p className="text-muted-foreground">Loading transcript...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Transcript</h2>
        <p className="text-red-500">Error loading transcript</p>
      </div>
    );
  }


  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Transcript</h2>

      <div className="relative">
        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          className="pl-10"
          placeholder="Search transcript..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <ScrollArea className="h-[300px] border rounded-lg p-2">
        <div className="space-y-4">
          {filteredData.map((item) => {
            const isUser = isUserItem(item);
            const userName = isUser ? item.user.name : "Unknown Speaker";
            const userImage = isUser ? item.user.image : "";

            return (
              <div
                key={item.start_ts}
                className="flex gap-x-3 hover:bg-muted rounded-md p-3 border"
              >
                <Avatar className="size-8 flex-shrink-0">
                  <AvatarImage
                    src={
                      userImage ||
                      generateAvatarUri({
                        seed: userName,
                        variant: "botttsNeutral",
                      })
                    }
                    alt={userName}
                  />
                </Avatar>
                <div className="flex flex-col gap-y-1 min-w-0 flex-1">
                  <span className="text-xs text-muted-foreground font-medium">
                    {userName}
                  </span>
                  <p className="text-sm leading-relaxed">
                    <Highlighter
                      highlightClassName="bg-yellow-200"
                      searchWords={searchQuery ? [searchQuery] : []}
                      autoEscape
                      textToHighlight={item.text || ""}
                    />
                  </p>
                  {item.start_ts && (
                    <span className="text-xs text-muted-foreground">
                      {new Date(item.start_ts * 1000).toLocaleTimeString()}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
};
