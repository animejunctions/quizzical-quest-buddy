import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getTestById, getAttemptsByTest, type Attempt, type Test } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ArrowLeft, ChevronDown, ChevronUp, Trophy, Users, BarChart3 } from "lucide-react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

const AdminResults = () => {
  const { testId } = useParams();
  const navigate = useNavigate();
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [testName, setTestName] = useState("");
  const [test, setTest] = useState<Test | null>(null);
  const [expandedAttempt, setExpandedAttempt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      if (sessionStorage.getItem("quizlab_admin") !== "true") {
        navigate("/admin");
        return;
      }

      if (testId) {
        try {
          setLoading(true);
          
          // Fetch test details
          const testData = getTestById(testId);
          if (testData) {
            setTest(testData);
            setTestName(testData.name);
          }

          // Try fetching attempts from Supabase first
          if (isSupabaseConfigured) {
            const { data, error } = await supabase
              .from("attempts")
              .select("*")
              .eq("test_id", testId)
              .order("submitted_at", { ascending: false });

            if (!error && data && data.length > 0) {
              const formattedAttempts = data.map((a: any) => ({
                id: a.id,
                testId: a.test_id,
                name: a.name || '',
                telegramUsername: a.telegram_username,
                answers: a.answers || [],
                score: a.score,
                totalQuestions: a.total_questions,
                startedAt: a.started_at,
                submittedAt: a.submitted_at,
                warnings: a.warnings,
                autoSubmitted: a.auto_submitted,
              }));
              setAttempts(formattedAttempts);
            } else {
              // Fallback to localStorage if Supabase returns no data
              const localAttempts = getAttemptsByTest(testId);
              setAttempts(localAttempts);
            }
          } else {
            // Use localStorage if Supabase not configured
            const localAttempts = getAttemptsByTest(testId);
            setAttempts(localAttempts);
          }
        } catch (error) {
          console.error("Error loading results:", error);
          // Fallback to localStorage on error
          const localAttempts = getAttemptsByTest(testId);
          setAttempts(localAttempts);
        } finally {
          setLoading(false);
        }
      }
    };

    loadData();
  }, [testId, navigate]);

  const toggleExpand = (attemptId: string) => {
    setExpandedAttempt(expandedAttempt === attemptId ? null : attemptId);
  };

  if (loading) {
    return (
      <div className="min-h-screen p-4 md:p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
          <p className="text-muted-foreground">Loading results...</p>
        </div>
      </div>
    );
  }

  // Calculate stats
  const avgScore = attempts.length > 0 
    ? attempts.reduce((sum, a) => sum + (a.score / a.totalQuestions) * 100, 0) / attempts.length 
    : 0;
  const highestScore = attempts.length > 0 
    ? Math.max(...attempts.map(a => (a.score / a.totalQuestions) * 100)) 
    : 0;

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <div className="max-w-6xl mx-auto">
        <Button variant="ghost" onClick={() => navigate("/admin/dashboard")} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-1" /> Back
        </Button>

        <h1 className="text-2xl font-bold text-foreground mb-2">Results: {testName}</h1>
        
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="glass rounded-xl p-4">
            <div className="flex items-center gap-3">
              <Users className="w-8 h-8 text-primary" />
              <div>
                <p className="text-2xl font-bold text-foreground">{attempts.length}</p>
                <p className="text-sm text-muted-foreground">Total Attempts</p>
              </div>
            </div>
          </div>
          <div className="glass rounded-xl p-4">
            <div className="flex items-center gap-3">
              <BarChart3 className="w-8 h-8 text-primary" />
              <div>
                <p className="text-2xl font-bold text-foreground">{avgScore.toFixed(1)}%</p>
                <p className="text-sm text-muted-foreground">Average Score</p>
              </div>
            </div>
          </div>
          <div className="glass rounded-xl p-4">
            <div className="flex items-center gap-3">
              <Trophy className="w-8 h-8 text-success" />
              <div>
                <p className="text-2xl font-bold text-foreground">{highestScore.toFixed(1)}%</p>
                <p className="text-sm text-muted-foreground">Highest Score</p>
              </div>
            </div>
          </div>
        </div>

        {attempts.length === 0 ? (
          <div className="glass rounded-xl p-8 text-center text-muted-foreground">No attempts yet</div>
        ) : (
          <div className="space-y-2">
            {attempts.map((attempt) => (
              <div key={attempt.id} className="glass rounded-xl overflow-hidden">
                {/* Summary */}
                <button
                  onClick={() => toggleExpand(attempt.id)}
                  className="w-full p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-secondary/50 transition-colors"
                >
                  <div className="text-left flex-1">
                    <p className="font-semibold text-foreground">{attempt.name || attempt.telegramUsername}</p>
                    <p className="text-xs text-muted-foreground">@{attempt.telegramUsername} &bull; 
                      {new Date(attempt.startedAt).toLocaleString()}
                      {attempt.autoSubmitted && <span className="text-warning ml-2">⚠ Auto-submitted</span>}
                      {attempt.warnings > 0 && <span className="text-destructive ml-2">{attempt.warnings} warning(s)</span>}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-lg font-bold text-primary">{attempt.score}/{attempt.totalQuestions}</p>
                      <p className="text-xs text-muted-foreground">{Math.round((attempt.score / attempt.totalQuestions) * 100)}%</p>
                    </div>
                    {expandedAttempt === attempt.id ? (
                      <ChevronUp className="w-5 h-5 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-muted-foreground" />
                    )}
                  </div>
                </button>

                {/* Detailed answers */}
                {expandedAttempt === attempt.id && test && (
                  <div className="border-t border-border p-4 bg-secondary/20">
                    <h3 className="text-sm font-semibold text-foreground mb-4">Answer Details</h3>
                    <div className="space-y-4">
                      {test.questions.map((q, qIndex) => {
                        const userAnswerIndex = attempt.answers[qIndex];
                        const isCorrect = userAnswerIndex === q.correctAnswer;
                        const userAnswer = userAnswerIndex !== null && userAnswerIndex !== undefined ? q.options[userAnswerIndex] : null;
                        const correctAnswer = q.options[q.correctAnswer];

                        return (
                          <div key={q.id} className="p-3 bg-background rounded-lg border border-border">
                            <div className="flex items-start gap-2 mb-2">
                              <span className={`inline-flex items-center justify-center w-5 h-5 rounded text-xs font-bold shrink-0 mt-0.5 ${
                                isCorrect ? "bg-success/20 text-success" : "bg-destructive/20 text-destructive"
                              }`}>
                                {isCorrect ? "✓" : "✗"}
                              </span>
                              <p className="text-sm font-medium text-foreground flex-1">{q.question}</p>
                            </div>

                            <div className="ml-7 space-y-1.5 text-sm">
                              <div className="p-2 rounded bg-muted/50">
                                <p className="text-xs text-muted-foreground">User's Answer:</p>
                                <p className={`font-medium ${userAnswer ? (isCorrect ? "text-success" : "text-destructive") : "text-muted-foreground"}`}>
                                  {userAnswer ? `${String.fromCharCode(65 + userAnswerIndex)}: ${userAnswer}` : "Not answered"}
                                </p>
                              </div>

                              {!isCorrect && (
                                <div className="p-2 rounded bg-success/10">
                                  <p className="text-xs text-muted-foreground">Correct Answer:</p>
                                  <p className="font-medium text-success">
                                    {String.fromCharCode(65 + q.correctAnswer)}: {correctAnswer}
                                  </p>
                                </div>
                              )}

                              {q.explanation && (
                                <div className="p-2 rounded bg-primary/10 mt-2">
                                  <p className="text-xs text-muted-foreground">Explanation:</p>
                                  <p className="text-sm text-foreground">{q.explanation}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminResults;
