"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { toast } from "sonner";
import { CheckCircleIcon, XCircleIcon, LoaderIcon, ArrowLeftIcon } from "lucide-react";

interface Question {
  id: string;
  question: string;
  type: "mcq" | "true_false" | "short_answer";
  options?: string[];
  correct_answer: string;
  explanation: string;
}

interface Quiz {
  id: string;
  title: string;
  description: string;
  difficulty: string;
  questions: Question[];
}

interface QuizResult {
  score: number;
  correctCount: number;
  total: number;
  detailed: {
    questions: Array<{
      id: string;
      question: string;
      userAnswer: string;
      correctAnswer: string;
      isCorrect: boolean;
      explanation: string;
    }>;
  };
}

export function QuizTakeView({ quizId }: { quizId: string }) {
  const router = useRouter();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<QuizResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchQuiz();
  }, [quizId]);

  const fetchQuiz = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/quizzes/${quizId}`);
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to fetch quiz");
      }
      const data = await res.json();
      setQuiz(data);
    } catch (error) {
      console.error("Error fetching quiz:", error);
      toast.error(error instanceof Error ? error.message : "Failed to load quiz");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!quiz) return;

    // Check if all questions are answered
    const unanswered = quiz.questions.filter((q) => !answers[q.id]);
    if (unanswered.length > 0) {
      toast.error(`Please answer all questions. ${unanswered.length} remaining.`);
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await fetch(`/api/quizzes/${quizId}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          answers: Object.entries(answers).map(([questionId, answer]) => ({
            questionId,
            answer,
          })),
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to submit quiz");
      }

      const data = await res.json();
      setResult(data);
      toast.success(`Quiz submitted! Score: ${data.score}%`);
    } catch (error) {
      console.error("Error submitting quiz:", error);
      toast.error(error instanceof Error ? error.message : "Failed to submit quiz");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 w-full p-4 md:p-6 max-w-4xl mx-auto">
        <div className="text-center py-12">
          <LoaderIcon className="h-8 w-8 mx-auto animate-spin text-muted-foreground mb-4" />
          <p className="text-sm text-muted-foreground">Loading quiz...</p>
        </div>
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="flex-1 w-full p-4 md:p-6 max-w-4xl mx-auto">
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-sm text-muted-foreground">Quiz not found</p>
            <Button onClick={() => router.push("/quizzes")} className="mt-4">
              Back to Quizzes
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

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
    <div className="flex-1 w-full p-4 md:p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push("/quizzes")}
        >
          <ArrowLeftIcon className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
            {quiz.title}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">{quiz.description}</p>
        </div>
        <Badge
          variant="outline"
          className={getDifficultyColor(quiz.difficulty)}
        >
          {quiz.difficulty}
        </Badge>
      </div>

      {result ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">
              Quiz Results: {result.score}%
            </CardTitle>
            <CardDescription>
              You got {result.correctCount} out of {result.total} questions correct.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Accordion type="single" collapsible className="w-full">
              {result.detailed.questions.map((item, index) => (
                <AccordionItem key={item.id} value={item.id}>
                  <AccordionTrigger className="text-left">
                    <div className="flex items-center gap-2">
                      {item.isCorrect ? (
                        <CheckCircleIcon className="h-5 w-5 text-green-600" />
                      ) : (
                        <XCircleIcon className="h-5 w-5 text-red-600" />
                      )}
                      <span className="font-medium">
                        Question {index + 1}: {item.question}
                      </span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-2">
                    <div>
                      <p className="text-sm font-medium">Your answer:</p>
                      <p className="text-sm text-muted-foreground">
                        {item.userAnswer || "(No answer)"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Correct answer:</p>
                      <p className="text-sm text-green-600">{item.correctAnswer}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Explanation:</p>
                      <p className="text-sm text-muted-foreground">
                        {item.explanation}
                      </p>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
            <div className="flex gap-2 pt-4">
              <Button onClick={() => router.push("/quizzes")} className="flex-1">
                Back to Quizzes
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setResult(null);
                  setAnswers({});
                }}
              >
                Retake Quiz
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {quiz.questions.map((question, index) => (
            <Card key={question.id}>
              <CardHeader>
                <CardTitle className="text-lg">
                  Question {index + 1}: {question.question}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {question.type === "mcq" && question.options && (
                  <RadioGroup
                    value={answers[question.id] || ""}
                    onValueChange={(value) =>
                      setAnswers({ ...answers, [question.id]: value })
                    }
                  >
                    {question.options.map((option, optIndex) => (
                      <div
                        key={optIndex}
                        className="flex items-center space-x-2 p-2 rounded-md hover:bg-accent"
                      >
                        <RadioGroupItem value={option} id={`${question.id}-${optIndex}`} />
                        <Label
                          htmlFor={`${question.id}-${optIndex}`}
                          className="flex-1 cursor-pointer"
                        >
                          {option}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                )}

                {question.type === "true_false" && (
                  <RadioGroup
                    value={answers[question.id] || ""}
                    onValueChange={(value) =>
                      setAnswers({ ...answers, [question.id]: value })
                    }
                  >
                    <div className="flex items-center space-x-2 p-2 rounded-md hover:bg-accent">
                      <RadioGroupItem value="True" id={`${question.id}-true`} />
                      <Label htmlFor={`${question.id}-true`} className="cursor-pointer">
                        True
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 p-2 rounded-md hover:bg-accent">
                      <RadioGroupItem value="False" id={`${question.id}-false`} />
                      <Label htmlFor={`${question.id}-false`} className="cursor-pointer">
                        False
                      </Label>
                    </div>
                  </RadioGroup>
                )}

                {question.type === "short_answer" && (
                  <Input
                    placeholder="Type your answer..."
                    value={answers[question.id] || ""}
                    onChange={(e) =>
                      setAnswers({ ...answers, [question.id]: e.target.value })
                    }
                  />
                )}
              </CardContent>
            </Card>
          ))}

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => router.push("/quizzes")}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <LoaderIcon className="h-4 w-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit Quiz"
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

