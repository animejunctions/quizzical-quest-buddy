import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getTestById, getTests, type Attempt, type Test } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { CheckCircle, XCircle, Trophy, ChevronLeft, ChevronRight, Home, BarChart3 } from "lucide-react";

const ViewResult = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [attempt, setAttempt] = useState<Attempt | null>(null);
  const [test, setTest] = useState<Test | null>(null);

  useEffect(() => {
    // Load attempt from localStorage
    const storedResult = localStorage.getItem(`quizlab_result_${slug}`);
    if (storedResult) {
      const parsed = JSON.parse(storedResult);
      setAttempt(parsed);
      
      // Load test data
      const tests = getTests();
      const foundTest = tests.find(t => t.slug === slug || t.id === parsed.testId);
      if (foundTest) {
        setTest(foundTest);
      }
    }
  }, [slug]);

  if (!attempt || !test) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="glass rounded-xl p-8 text-center max-w-sm">
          <p className="text-muted-foreground mb-4">No saved result found for this test.</p>
          <Button variant="outline" onClick={() => navigate("/")}>
            <Home className="w-4 h-4 mr-2" /> Go Home
          </Button>
        </div>
      </div>
    );
  }

  const pct = Math.round((attempt.score / attempt.totalQuestions) * 100);
  const q = test.questions[currentQuestion];
  const userAnswer = attempt.answers[currentQuestion];
  const isCorrect = userAnswer === q.correctAnswer;

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <div className="glass border-b border-border p-4 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-foreground">{test.name}</h1>
            <p className="text-sm text-muted-foreground">Your Result</p>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <div className="text-right">
              <p className={`text-xl font-bold ${pct >= 70 ? "text-success" : pct >= 40 ? "text-warning" : "text-destructive"}`}>
                {attempt.score}/{attempt.totalQuestions}
              </p>
              <p className="text-xs text-muted-foreground">{pct}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Score Summary Card */}
      <div className="p-4 max-w-4xl mx-auto w-full">
        <div className="glass rounded-xl p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`w-14 h-14 rounded-full flex items-center justify-center ${
                pct >= 70 ? "bg-success/20" : pct >= 40 ? "bg-warning/20" : "bg-destructive/20"
              }`}>
                <Trophy className={`w-7 h-7 ${pct >= 70 ? "text-success" : pct >= 40 ? "text-warning" : "text-destructive"}`} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Submitted by</p>
                <p className="font-semibold text-foreground">{attempt.name || "Anonymous"}</p>
                <p className="text-xs text-muted-foreground">@{attempt.telegramUsername}</p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={() => navigate(`/test/${test.id}/leaderboard`)}>
              <BarChart3 className="w-4 h-4 mr-2" /> Leaderboard
            </Button>
          </div>
        </div>
      </div>

      {/* Question Navigation Dots */}
      <div className="px-4 pb-4 max-w-4xl mx-auto w-full">
        <div className="flex flex-wrap gap-2 justify-center">
          {test.questions.map((_, i) => {
            const qUserAnswer = attempt.answers[i];
            const qIsCorrect = qUserAnswer === test.questions[i].correctAnswer;
            return (
              <button
                key={i}
                onClick={() => setCurrentQuestion(i)}
                className={`w-9 h-9 rounded-lg text-xs font-bold transition-all ${
                  i === currentQuestion
                    ? "ring-2 ring-primary ring-offset-2 ring-offset-background"
                    : ""
                } ${
                  qIsCorrect
                    ? "bg-success/20 text-success border border-success/30"
                    : "bg-destructive/20 text-destructive border border-destructive/30"
                }`}
              >
                {i + 1}
              </button>
            );
          })}
        </div>
      </div>

      {/* Question Content */}
      <div className="flex-1 p-4 max-w-4xl mx-auto w-full">
        <div className="glass rounded-xl p-6">
          <div className="flex items-start gap-3 mb-6">
            {isCorrect ? (
              <CheckCircle className="w-6 h-6 text-success shrink-0 mt-0.5" />
            ) : (
              <XCircle className="w-6 h-6 text-destructive shrink-0 mt-0.5" />
            )}
            <div>
              <p className="text-xs text-muted-foreground mb-1">Question {currentQuestion + 1} of {test.questions.length}</p>
              <h2 className="text-lg font-semibold text-foreground leading-relaxed">{q.question}</h2>
            </div>
          </div>

          <div className="space-y-3 mb-6">
            {q.options.map((opt, oIdx) => {
              if (!opt.trim()) return null;
              const isUserChoice = userAnswer === oIdx;
              const isRight = q.correctAnswer === oIdx;
              
              return (
                <div
                  key={oIdx}
                  className={`p-4 rounded-xl border transition-all ${
                    isRight
                      ? "bg-success/10 border-success/30 text-success"
                      : isUserChoice
                      ? "bg-destructive/10 border-destructive/30 text-destructive"
                      : "border-border bg-secondary/50 text-muted-foreground"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`inline-flex items-center justify-center w-8 h-8 rounded-lg text-sm font-bold ${
                      isRight
                        ? "bg-success/20 text-success"
                        : isUserChoice
                        ? "bg-destructive/20 text-destructive"
                        : "bg-muted text-muted-foreground"
                    }`}>
                      {String.fromCharCode(65 + oIdx)}
                    </span>
                    <span className={isRight || isUserChoice ? "font-medium" : ""}>{opt}</span>
                    {isRight && <CheckCircle className="w-4 h-4 ml-auto text-success" />}
                    {isUserChoice && !isRight && <XCircle className="w-4 h-4 ml-auto text-destructive" />}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Explanation */}
          {q.explanation && (
            <div className="p-4 rounded-xl bg-primary/10 border border-primary/20">
              <p className="text-xs font-semibold text-primary mb-1">Explanation</p>
              <p className="text-sm text-foreground">{q.explanation}</p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation Footer */}
      <div className="glass border-t border-border p-4 sticky bottom-0 z-40">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Button
            variant="outline"
            disabled={currentQuestion === 0}
            onClick={() => setCurrentQuestion(c => c - 1)}
          >
            <ChevronLeft className="w-4 h-4 mr-1" /> Previous
          </Button>

          <div className="text-center">
            <p className="text-sm font-medium text-foreground">{currentQuestion + 1} / {test.questions.length}</p>
          </div>

          <Button
            variant="outline"
            disabled={currentQuestion === test.questions.length - 1}
            onClick={() => setCurrentQuestion(c => c + 1)}
          >
            Next <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ViewResult;
