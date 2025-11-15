import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import Markdown from "react-markdown";
import { MeetingGetOne } from "../../types";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  BookOpenTextIcon,
  ClockFadingIcon,
  FileTextIcon,
  FileVideoIcon,
  SparkleIcon,
  SparklesIcon,
} from "lucide-react";
import GeneratedAvatar from "@/components/generated-avatar";
import Link from "next/link";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { formatDuration } from "@/lib/utils";
import { Transcript } from "./transcript";

interface Props {
  data: MeetingGetOne;
}

export default function CompletedState({ data }: Props) {
  return (
    <div className="flex flex-col gap-y-4">
      <Tabs defaultValue="summary">
        <div className="border-b border-gray-200">
          <ScrollArea>
            <TabsList className="h-auto p-0 bg-transparent justify-start w-full">
              <TabsTrigger
                value="summary"
                className="flex items-center gap-2 px-4 py-3 text-sm font-medium text-gray-600 
                          border-b-2 border-transparent hover:text-gray-900 hover:border-gray-300
                          data-[state=active]:text-blue-600 data-[state=active]:border-blue-600 
                          data-[state=active]:bg-transparent rounded-none"
              >
                <BookOpenTextIcon className="h-4 w-4" />
                Summary
              </TabsTrigger>
              <TabsTrigger
                value="transcript"
                className="flex items-center gap-2 px-4 py-3 text-sm font-medium text-gray-600 
                          border-b-2 border-transparent hover:text-gray-900 hover:border-gray-300
                          data-[state=active]:text-blue-600 data-[state=active]:border-blue-600 
                          data-[state=active]:bg-transparent rounded-none"
              >
                <FileTextIcon className="h-4 w-4" />
                Transcript
              </TabsTrigger>
              <TabsTrigger
                value="recording"
                className="flex items-center gap-2 px-4 py-3 text-sm font-medium text-gray-600 
                          border-b-2 border-transparent hover:text-gray-900 hover:border-gray-300
                          data-[state=active]:text-blue-600 data-[state=active]:border-blue-600 
                          data-[state=active]:bg-transparent rounded-none"
              >
                <FileVideoIcon className="h-4 w-4" />
                Recording
              </TabsTrigger>
              <TabsTrigger
                value="chat"
                className="flex items-center gap-2 px-4 py-3 text-sm font-medium text-gray-600 
                          border-b-2 border-transparent hover:text-gray-900 hover:border-gray-300
                          data-[state=active]:text-blue-600 data-[state=active]:border-blue-600 
                          data-[state=active]:bg-transparent rounded-none"
              >
                <SparkleIcon className="h-4 w-4" />
                AI Chat
              </TabsTrigger>
            </TabsList>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </div>

        <TabsContent value="summary">
          <div className="flex flex-col gap-y-4 bg-white rounded-lg p-4">
            <div className="flex flex-col gap-y-6">
              <h2 className="text-2xl font-medium text-gray-900 capitalize">
                {data.name}
              </h2>
            </div>

            <div className="flex flex-col gap-y-2">
              <Link
                href={`/agents/${data.agentId}`}
                className="flex items-center gap-x-3 underline underline-offset-4 capitalize w-fit"
              >
                <GeneratedAvatar
                  variant="botttsNeutral"
                  seed={data.agent.name}
                />
                {data.agent.name}
              </Link>
              <p className="text-sm text-gray-600">
                {data.startedAt ? format(data.startedAt, "PPP") : ""}
              </p>
            </div>

            <div className="flex gap-x-2 items-center">
              <SparklesIcon className="h-4 w-4" />
              <p className="text-sm font-medium">General summary</p>
              <Badge
                variant="outline"
                className="flex items-center gap-x-2 text-muted-foreground"
              >
                <ClockFadingIcon className="h-4 w-4" />
                {data.duration ? formatDuration(data.duration) : ""}
              </Badge>
            </div>

            <div className="prose prose-sm max-w-none">
              <Markdown
                components={{
                  h1: (props) => (
                    <h1 className="text-2xl font-semibold mb-4" {...props} />
                  ),
                  h2: (props) => (
                    <h2 className="text-xl font-semibold mb-3" {...props} />
                  ),
                  h3: (props) => (
                    <h3 className="text-lg font-semibold mb-2" {...props} />
                  ),
                  h4: (props) => (
                    <h4 className="text-base font-semibold mb-2" {...props} />
                  ),
                  p: (props) => (
                    <p
                      className="text-sm text-gray-700 leading-relaxed mb-3"
                      {...props}
                    />
                  ),
                  ul: (props) => (
                    <ul
                      className="text-sm text-gray-700 leading-relaxed mb-3 list-disc pl-6"
                      {...props}
                    />
                  ),
                  ol: (props) => (
                    <ol
                      className="text-sm text-gray-700 leading-relaxed mb-3 list-decimal pl-6"
                      {...props}
                    />
                  ),
                  li: (props) => <li className="mb-1" {...props} />,
                  strong: (props) => (
                    <strong
                      className="font-semibold text-gray-900"
                      {...props}
                    />
                  ),
                  blockquote: (props) => (
                    <blockquote
                      className="text-sm text-gray-600 italic border-l-4 border-blue-200 pl-4 my-4"
                      {...props}
                    />
                  ),
                }}
              >
                {data.summary}
              </Markdown>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="transcript">
          <div className="flex flex-col gap-y-4 bg-white rounded-lg p-4">
            <Transcript meetingId={data.id} />
          </div>
        </TabsContent>

        <TabsContent value="recording">
          <div className="flex flex-col gap-y-4 bg-white rounded-lg p-4">
            {data.recordingUrl ? (
              <video
                src={data.recordingUrl}
                controls
                className="w-full h-auto rounded-lg"
              />
            ) : (
              <p className="text-gray-500">No recording available</p>
            )}
          </div>
        </TabsContent>

        <TabsContent value="chat">
          <div className="flex flex-col gap-y-4 bg-white rounded-lg p-4">
            <p className="text-gray-500">AI Chat content would go here...</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
