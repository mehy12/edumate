"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

const BANGALORE_COLLEGES = [
  "R.V. College of Engineering",
  "BMS College of Engineering",
  "PES University",
  "M S Ramaiah Institute of Technology",
  "Dayananda Sagar College of Engineering",
  "Sir M Visvesvaraya Institute of Technology",
  "New Horizon College of Engineering",
  "CMR Institute of Technology",
  "Nitte Meenakshi Institute of Technology",
  "RNS Institute of Technology",
  "BMS Institute of Technology and Management",
  "Acharya Institute of Technology",
  "Christ (Deemed to be University)",
  "Jain (Deemed-to-be University)",
  "Alliance University",
  "Reva University",
  "East Point College of Engineering and Technology",
  "Global Academy of Technology",
  "Dr. Ambedkar Institute of Technology",
];

const BRANCHES = [
  "Computer Science and Engineering",
  "Information Science and Engineering",
  "Electronics and Communication Engineering",
  "Electrical and Electronics Engineering",
  "Mechanical Engineering",
  "Civil Engineering",
  "Artificial Intelligence and Machine Learning",
  "Data Science",
  "Electronics and Instrumentation Engineering",
  "Biotechnology",
  "Industrial Engineering and Management",
  "Other",
];

const YEAR_OPTIONS = [
  { value: "1", label: "1st year" },
  { value: "2", label: "2nd year" },
  { value: "3", label: "3rd year" },
  { value: "4", label: "4th year" },
  { value: "5", label: "5th year / Others" },
];

const INTEREST_CATEGORIES: Record<string, string[]> = {
  Python: [
    "Python Basics",
    "Object-Oriented Python",
    "Data Structures in Python",
    "Scripting & Automation",
    "Flask/Django",
  ],
  "Software Development": [
    "Clean Code",
    "Design Patterns",
    "Version Control (Git)",
    "Testing & TDD",
    "Agile Practices",
  ],
  "Web Development": [
    "HTML & CSS",
    "JavaScript",
    "React",
    "Backend APIs",
    "Authentication & Security",
  ],
  "Data Structures & Algorithms": [
    "Arrays & Strings",
    "Linked Lists",
    "Trees & Graphs",
    "Dynamic Programming",
    "Problem-Solving Patterns",
  ],
  "Machine Learning": [
    "Supervised Learning",
    "Unsupervised Learning",
    "Neural Networks",
    "MLOps Basics",
    "Applied ML Projects",
  ],
};

export function AcademicOnboardingForm() {
  const router = useRouter();

  const [collegeName, setCollegeName] = useState("");
  const [isCollegeFocused, setIsCollegeFocused] = useState(false);
  const [yearOfStudy, setYearOfStudy] = useState("");
  const [branch, setBranch] = useState("");
  const [otherBranch, setOtherBranch] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);

  const effectiveBranch = branch === "Other" ? otherBranch : branch;

  const filteredColleges = useMemo(() => {
    const query = collegeName.trim().toLowerCase();
    if (!query) return [];
    return BANGALORE_COLLEGES.filter((c) =>
      c.toLowerCase().includes(query)
    ).slice(0, 8);
  }, [collegeName]);

  const isContinueDisabled =
    !collegeName.trim() ||
    !yearOfStudy ||
    !effectiveBranch.trim() ||
    selectedInterests.length < 5 ||
    isSubmitting;

  function toggleInterest(interest: string) {
    setSelectedInterests((prev) => {
      if (prev.includes(interest)) {
        return prev.filter((i) => i !== interest);
      }
      return [...prev, interest];
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const trimmedCollege = collegeName.trim();
    const trimmedBranch = effectiveBranch.trim();

    if (!trimmedCollege || !yearOfStudy || !trimmedBranch) {
      setError("Please fill in all academic details before continuing.");
      return;
    }

    if (selectedInterests.length < 5) {
      setError("Select at least 5 interests to continue.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/user/onboarding", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          collegeName: trimmedCollege,
          yearOfStudy,
          branch: trimmedBranch,
          interests: selectedInterests,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        const message = data?.error ?? "Failed to complete onboarding.";
        setError(message);
        toast.error(message);
        return;
      }

      toast.success("Onboarding completed. Welcome to eduMate!");
      router.push("/");
    } catch (err) {
      console.error(err);
      setError("Something went wrong. Please try again.");
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 rounded-lg border bg-card p-6 shadow-sm">
      <div className="space-y-1">
        <h2 className="text-xl font-semibold">Tell us about your college</h2>
        <p className="text-sm text-muted-foreground">
          This helps us personalize your experience based on your academic background.
        </p>
      </div>

      <div className="space-y-4">
        {/* College name combobox */}
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="collegeName">
            College name
          </label>
          <div className="relative">
            <Input
              id="collegeName"
              placeholder="Start typing your college name"
              value={collegeName}
              onChange={(e) => setCollegeName(e.target.value)}
              onFocus={() => setIsCollegeFocused(true)}
              onBlur={() => {
                // Delay hiding suggestions slightly so click events can register
                setTimeout(() => setIsCollegeFocused(false), 100);
              }}
              autoComplete="off"
            />
            {isCollegeFocused && filteredColleges.length > 0 && (
              <div className="absolute inset-x-0 z-20 mt-1 max-h-56 overflow-y-auto rounded-md border bg-popover text-sm shadow-md">
                {filteredColleges.map((name) => (
                  <button
                    type="button"
                    key={name}
                    className="flex w-full cursor-pointer items-center px-3 py-2 text-left hover:bg-accent hover:text-accent-foreground"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      setCollegeName(name);
                    }}
                  >
                    {name}
                  </button>
                ))}
              </div>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            Choose from popular Bangalore colleges or enter your own.
          </p>
        </div>

        {/* Year of study */}
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="yearOfStudy">
            Year of study
          </label>
          <Select
            value={yearOfStudy}
            onValueChange={(value) => setYearOfStudy(value)}
          >
            <SelectTrigger className="w-full" id="yearOfStudy">
              <SelectValue placeholder="Select your current year" />
            </SelectTrigger>
            <SelectContent>
              {YEAR_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Branch of study */}
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="branch">
            Branch of study
          </label>
          <Select
            value={branch}
            onValueChange={(value) => {
              setBranch(value);
              if (value !== "Other") {
                setOtherBranch("");
              }
            }}
          >
            <SelectTrigger className="w-full" id="branch">
              <SelectValue placeholder="Select your branch" />
            </SelectTrigger>
            <SelectContent>
              {BRANCHES.map((b) => (
                <SelectItem key={b} value={b}>
                  {b}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {branch === "Other" && (
            <div className="mt-2 space-y-1">
              <Input
                placeholder="Please specify your branch"
                value={otherBranch}
                onChange={(e) => setOtherBranch(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Tell us the name of your branch so we can better tailor your experience.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Interests section */}
      <div className="space-y-3">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold">What are you interested in?</h2>
          <p className="text-sm text-muted-foreground">
            Select at least 5 topics so eduMate can personalize your learning.
          </p>
        </div>

        <div className="space-y-4">
          {Object.entries(INTEREST_CATEGORIES).map(([category, topics]) => (
            <div key={category} className="space-y-2">
              <h3 className="text-sm font-semibold text-muted-foreground">
                {category}
              </h3>
              <div className="flex flex-wrap gap-2">
                {topics.map((topic) => {
                  const isSelected = selectedInterests.includes(topic);
                  return (
                    <button
                      key={topic}
                      type="button"
                      onClick={() => toggleInterest(topic)}
                      className={"rounded-full border px-3 py-1 text-xs font-medium transition-colors " +
                        (isSelected
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border bg-background hover:bg-accent hover:text-accent-foreground")}
                    >
                      {topic}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <p className="text-xs text-muted-foreground">
          Selected: {selectedInterests.length} / 5 required
        </p>
      </div>

      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}

      <div className="flex justify-end">
        <Button type="submit" disabled={isContinueDisabled}>
          {isSubmitting ? "Saving..." : "Continue"}
        </Button>
      </div>
    </form>
  );
}
