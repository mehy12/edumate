"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { BookOpenIcon, SparklesIcon, LoaderIcon } from "lucide-react";
import { format } from "date-fns";

interface Quiz {
  id: string;
  topic: string;
  difficulty: string;
  sourceType: string;
  createdAt: string;
  lastScore: number | null;
  attemptCount: number;
}

interface Meeting {
  id: string;
  name: string;
  createdAt: string;
}

export function QuizzesView() {
  const router = useRouter();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [selectedMeetingId, setSelectedMeetingId] = useState<string>("");
  const [selectedDifficulty, setSelectedDifficulty] = useState<"easy" | "medium" | "hard">("medium");
  const [isLoadingQuizzes, setIsLoadingQuizzes] = useState(true);
  const [isLoadingMeetings, setIsLoadingMeetings] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // Fetch quizzes
  const fetchQuizzes = async () => {
    try {
      setIsLoadingQuizzes(true);
      const res = await fetch("/api/quizzes");
      if (!res.ok) throw new Error("Failed to fetch quizzes");
      const data = await res.json();
      setQuizzes(data);
    } catch (error) {
      console.error("Error fetching quizzes:", error);
      toast.error("Failed to load quizzes");
    } finally {
      setIsLoadingQuizzes(false);
    }
  };

  // Fetch recent meetings with summaries
  const fetchMeetings = async () => {
    try {
      setIsLoadingMeetings(true);
      // Use the roadmaps API which returns meetings with summaries
      const res = await fetch("/api/roadmaps?pageSize=20");
      if (!res.ok) throw new Error("Failed to fetch meetings");
      const data = await res.json();
      // Map to meeting format
      const meetingsList = (data.items || []).map((item: any) => ({
        id: item.meetingId,
        name: item.topic || "Untitled Meeting",
        createdAt: item.createdAt,
      }));
      setMeetings(meetingsList);
    } catch (error) {
      console.error("Error fetching meetings:", error);
    } finally {
      setIsLoadingMeetings(false);
    }
  };


  useEffect(() => {
    fetchQuizzes();
    fetchMeetings();
  }, []);


  // Generate quiz
  const handleGenerateQuiz = async () => {
    try {
      setIsGenerating(true);
      const res = await fetch("/api/quizzes/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceType: "meeting",
          sourceId: selectedMeetingId || undefined,
          difficulty: selectedDifficulty,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to generate quiz");
      }

      const data = await res.json();
      toast.success("Quiz generated successfully!");
      // Refresh quizzes list
      await fetchQuizzes();
      // Redirect to quiz
      router.push(`/quizzes/${data.quizId}`);
    } catch (error) {
      console.error("Error generating quiz:", error);
      toast.error(error instanceof Error ? error.message : "Failed to generate quiz");
    } finally {
      setIsGenerating(false);
    }
  };


  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "easy":
        return "bg-green-100 text-green-800";
      case "hard":
        return "bg-red-100 text-red-800";
      default:
        return "bg-yellow-100 text-yellow-800";
    }
  };


  return (
    <div className="flex-1 w-full p-4 md:p-6 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">Quizzes</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Test your knowledge from your recent learning sessions.
        </p>
      </div>

      {/* Generate Quiz Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <SparklesIcon className="h-5 w-5" />
            Generate a new quiz
          </CardTitle>
          <CardDescription>
            Create a test from your recent meetings and sessions.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Select meeting (optional)</label>
              <Select
                value={selectedMeetingId}
                onValueChange={setSelectedMeetingId}
                disabled={isLoadingMeetings}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Use latest session" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Use latest session</SelectItem>
                  {meetings.map((meeting) => (
                    <SelectItem key={meeting.id} value={meeting.id}>
                      {meeting.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Difficulty</label>
              <Select
                value={selectedDifficulty}
                onValueChange={(value) =>
                  setSelectedDifficulty(value as "easy" | "medium" | "hard")
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="easy">Easy</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="hard">Hard</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button
            onClick={handleGenerateQuiz}
            disabled={isGenerating}
            className="w-full md:w-auto"
          >
            {isGenerating ? (
              <>
                <LoaderIcon className="h-4 w-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <SparklesIcon className="h-4 w-4 mr-2" />
                Generate Quiz
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Quizzes List */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Your quizzes</h2>
        {isLoadingQuizzes ? (
          <div className="text-sm text-muted-foreground">Loading quizzes...</div>
        ) : quizzes.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <BookOpenIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-sm text-muted-foreground">
                No quizzes yet. Generate your first quiz to get started!
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {quizzes.map((quiz) => (
              <Card
                key={quiz.id}
                className="cursor-pointer hover:bg-accent transition-colors"
                onClick={() => router.push(`/quizzes/${quiz.id}`)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base font-semibold line-clamp-2">
                      {quiz.topic}
                    </CardTitle>
                    <Badge
                      variant="outline"
                      className={`text-xs shrink-0 ${getDifficultyColor(quiz.difficulty)}`}
                    >
                      {quiz.difficulty}
                    </Badge>
                  </div>
                  <CardDescription className="text-xs">
                    {format(new Date(quiz.createdAt), "MMM d, yyyy")}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                      {quiz.attemptCount > 0 ? (
                        <>
                          {quiz.attemptCount} attempt{quiz.attemptCount !== 1 ? "s" : ""}
                          {quiz.lastScore !== null && (
                            <span className="ml-2 font-medium">
                              • Best: {quiz.lastScore}%
                            </span>
                          )}
                        </>
                      ) : (
                        "Not attempted"
                      )}
                    </div>
                    <Button size="sm" variant="outline">
                      {quiz.attemptCount > 0 ? "Review" : "Take quiz"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

