import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getTestById, type Attempt } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, Trophy } from "lucide-react";

const ResultPage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();

  const raw = sessionStorage.getItem("quizlab_result");
  const attempt: Attempt | null = raw ? JSON.parse(raw) : null;
  const test = attempt ? getTestById(attempt.testId) : undefined;

  if (!attempt || !test) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="glass rounded-xl p-8 text-center">
          <p className="text-muted-foreground">No result found</p>
          <Button variant="outline" className="mt-4" onClick={() => navigate("/")}>Go Home</Button>
        </div>
      </div>
    );
  }

  const pct = Math.round((attempt.score / attempt.totalQuestions) * 100);

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        {/* Score card */}
        <div className="glass rounded-xl p-8 text-center mb-6 animate-slide-in">
          <Trophy className={`w-12 h-12 mx-auto mb-4 ${pct >= 70 ? "text-success" : pct >= 40 ? "text-warning" : "text-destructive"}`} />
          <h1 className="text-3xl font-bold text-foreground">{attempt.score}/{attempt.totalQuestions}</h1>
          <p className="text-lg text-muted-foreground mt-1">{pct}%</p>
          <p className="text-sm text-muted-foreground mt-2">@{attempt.telegramUsername}</p>
          {attempt.autoSubmitted && <p className="text-xs text-warning mt-2">⚠ Auto-submitted</p>}
          {attempt.warnings > 0 && <p className="text-xs text-destructive mt-1">{attempt.warnings} warning(s) received</p>}
        </div>

        {/* Review */}
        <h2 className="text-lg font-semibold text-foreground mb-4">Review</h2>
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
                  <p className="text-xs text-muted-foreground mt-3 ml-7 italic">💡 {q.explanation}</p>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-6">
          <Button variant="outline" onClick={() => navigate(`/test/${slug}`)} className="w-full">Back to Test Entry</Button>
        </div>
      </div>
    </div>
  );
};

export default ResultPage;
