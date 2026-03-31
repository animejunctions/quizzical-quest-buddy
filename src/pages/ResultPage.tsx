import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { type Attempt, type Test } from "@/lib/store";
import { getTestById } from "@/lib/supabase-service";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { CheckCircle, XCircle, Trophy, ChevronLeft, ChevronRight, Home, BarChart3, Share2, Loader2 } from "lucide-react";
import { toast } from "sonner";

const ResultPage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [showAllQuestions, setShowAllQuestions] = useState(false);
  const [test, setTest] = useState<Test | null>(null);
  const [loading, setLoading] = useState(true);

  const raw = sessionStorage.getItem("quizlab_result");
  const attempt: Attempt | null = raw ? JSON.parse(raw) : null;

  // Save result to localStorage for future viewing
  useEffect(() => {
    if (attempt && slug) {
      localStorage.setItem(`quizlab_result_${slug}`, JSON.stringify(attempt));
    }
  }, [attempt, slug]);

  if (!attempt || !test) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="absolute top-4 right-4">
          <ThemeToggle />
        </div>
        <div className="glass rounded-xl p-8 text-center">
          <p className="text-muted-foreground">No result found</p>
          <Button variant="outline" className="mt-4" onClick={() => navigate("/")}>Go Home</Button>
        </div>
      </div>
    );
  }

  const pct = Math.round((attempt.score / attempt.totalQuestions) * 100);
  const q = test.questions[currentQuestion];
  const userAnswer = attempt.answers[currentQuestion];
  const isCorrect = userAnswer === q.correctAnswer;

  const handleShare = () => {
    const text = `I scored ${attempt.score}/${attempt.totalQuestions} (${pct}%) on ${test.name}!`;
    if (navigator.share) {
      navigator.share({ title: test.name, text });
    } else {
      navigator.clipboard.writeText(text);
      toast.success("Result copied to clipboard!");
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <div className="glass border-b border-border p-4 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-foreground">Test Complete</h1>
            <p className="text-sm text-muted-foreground">{test.name}</p>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button variant="ghost" size="icon" onClick={handleShare}>
              <Share2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Score Summary */}
      <div className="p-4 max-w-4xl mx-auto w-full">
        <div className="glass rounded-xl p-6 mb-6 text-center animate-slide-in">
          <div className={`w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center ${
            pct >= 70 ? "bg-success/20" : pct >= 40 ? "bg-warning/20" : "bg-destructive/20"
          }`}>
            <Trophy className={`w-10 h-10 ${pct >= 70 ? "text-success" : pct >= 40 ? "text-warning" : "text-destructive"}`} />
          </div>
          
          <h2 className="text-4xl font-bold text-foreground mb-1">{attempt.score}/{attempt.totalQuestions}</h2>
          <p className="text-lg text-muted-foreground mb-4">{pct}%</p>
          
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mb-4">
            <span className="font-medium text-foreground">{attempt.name}</span>
            <span>@{attempt.telegramUsername}</span>
          </div>

          {attempt.autoSubmitted && (
            <p className="text-xs text-warning mb-2">Auto-submitted due to violations</p>
          )}
          {attempt.warnings > 0 && (
            <p className="text-xs text-destructive">{attempt.warnings} warning(s) received</p>
          )}

          <div className="flex gap-2 justify-center mt-6">
            <Button variant="outline" size="sm" onClick={() => navigate(`/test/${test.id}/leaderboard`)}>
              <BarChart3 className="w-4 h-4 mr-2" /> Leaderboard
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigate("/")}>
              <Home className="w-4 h-4 mr-2" /> Home
            </Button>
          </div>
        </div>
      </div>

      {/* Toggle View Mode */}
      <div className="px-4 max-w-4xl mx-auto w-full mb-4">
        <div className="flex gap-2">
          <Button
            variant={showAllQuestions ? "outline" : "default"}
            size="sm"
            onClick={() => setShowAllQuestions(false)}
          >
            Page View
          </Button>
          <Button
            variant={showAllQuestions ? "default" : "outline"}
            size="sm"
            onClick={() => setShowAllQuestions(true)}
          >
            All Questions
          </Button>
        </div>
      </div>

      {showAllQuestions ? (
        /* All Questions View */
        <div className="flex-1 p-4 max-w-4xl mx-auto w-full">
          <div className="space-y-4">
            {test.questions.map((q, i) => {
              const userAnswer = attempt.answers[i];
              const isCorrect = userAnswer === q.correctAnswer;
              return (
                <div key={q.id} className="glass rounded-xl p-4 animate-slide-in">
                  <div className="flex items-start gap-2 mb-3">
                    {isCorrect ? (
                      <CheckCircle className="w-5 h-5 text-success shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
                    )}
                    <p className="text-foreground font-medium">{q.question}</p>
                  </div>

                  <div className="space-y-1.5 ml-7">
                    {q.options.map((opt, oIdx) => {
                      if (!opt.trim()) return null;
                      const isUserChoice = userAnswer === oIdx;
                      const isRight = q.correctAnswer === oIdx;
                      return (
                        <div
                          key={oIdx}
                          className={`text-sm px-3 py-2 rounded-lg ${
                            isRight
                              ? "bg-success/10 text-success border border-success/20"
                              : isUserChoice
                              ? "bg-destructive/10 text-destructive border border-destructive/20"
                              : "text-muted-foreground"
                          }`}
                        >
                          <span className="font-bold mr-2">{String.fromCharCode(65 + oIdx)}.</span>
                          {opt}
                        </div>
                      );
                    })}
                  </div>

                  {q.explanation && (
                    <p className="text-xs text-muted-foreground mt-3 ml-7 p-2 bg-primary/10 rounded-lg italic">
                      {q.explanation}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <>
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

          {/* Single Question View */}
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
        </>
      )}
    </div>
  );
};

export default ResultPage;
