import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { saveAttempt, saveAttemptToSupabase, generateId, saveStoredAttempt, type Test } from "@/lib/store";
import { getTestById } from "@/lib/supabase-service";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, AlertTriangle, Clock, Send, Loader2 } from "lucide-react";

const ExamPage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [test, setTest] = useState<Test | null>(null);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [warnings, setWarnings] = useState(0);
  const [showWarning, setShowWarning] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const warningsRef = useRef(0);
  const submittedRef = useRef(false);

  const userName = sessionStorage.getItem("quizlab_user_name");
  const telegramUser = sessionStorage.getItem("quizlab_user");
  const testId = sessionStorage.getItem("quizlab_test_id");
  const testSlug = sessionStorage.getItem("quizlab_test_slug") || slug;
  const deviceFingerprintRef = useRef<string>("");

  // Generate device fingerprint
  useEffect(() => {
    const fp = `${navigator.userAgent}-${navigator.language}-${new Date().getTimezoneOffset()}`;
    deviceFingerprintRef.current = btoa(fp);
  }, []);

  const submitTest = useCallback(() => {
    if (submittedRef.current || !test) return;
    submittedRef.current = true;
    setSubmitted(true);

    let score = 0;
    test.questions.forEach((q, i) => {
      if (answers[i] === q.correctAnswer) score++;
    });

    const attempt = {
      id: generateId(),
      testId: test.id,
      name: userName || "Anonymous",
      telegramUsername: telegramUser || "unknown",
      answers: [...answers],
      score,
      totalQuestions: test.questions.length,
      startedAt: sessionStorage.getItem("quizlab_start") || new Date().toISOString(),
      submittedAt: new Date().toISOString(),
      warnings: warningsRef.current,
      autoSubmitted: warningsRef.current >= 3 || (timeLeft !== null && timeLeft <= 0),
    };

    // Save to localStorage (backup)
    saveAttempt(attempt);

    // Save to browser cache for "already submitted" check
    localStorage.setItem(`quizlab_result_${testSlug}`, JSON.stringify(attempt));
    
    // Save record of submission
    saveStoredAttempt({
      testId: test.id,
      attemptId: attempt.id,
      testSlug: testSlug || "",
    });

    // Save to Supabase
    saveAttemptToSupabase(attempt, deviceFingerprintRef.current).catch(err => {
      console.error("Failed to save to Supabase:", err);
    });

    sessionStorage.setItem("quizlab_result", JSON.stringify(attempt));
    navigate(`/test/${slug}/result`);
  }, [test, answers, userName, telegramUser, timeLeft, slug, testSlug, navigate]);

  useEffect(() => {
    const loadTest = async () => {
      if (!testId || !telegramUser) {
        navigate(`/test/${slug}`);
        return;
      }
      
      try {
        const t = await getTestById(testId);
        if (!t) {
          navigate(`/test/${slug}`);
          return;
        }
        setTest(t);
        setAnswers(new Array(t.questions.length).fill(null));
        if (t.timeLimit > 0) {
          setTimeLeft(t.timeLimit * 60);
        }
        sessionStorage.setItem("quizlab_start", new Date().toISOString());
      } catch (error) {
        console.error("Error loading test:", error);
        navigate(`/test/${slug}`);
      }
    };
    
    loadTest();
  }, [testId, telegramUser, slug, navigate]);

  // Timer
  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0) return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev === null) return null;
        if (prev <= 1) {
          submitTest();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [timeLeft, submitTest]);

  // Anti-cheat: visibility change & blur
  useEffect(() => {
    const handleCheat = () => {
      if (submittedRef.current) return;
      warningsRef.current += 1;
      setWarnings(warningsRef.current);
      if (warningsRef.current >= 3) {
        submitTest();
      } else {
        setShowWarning(true);
        setTimeout(() => setShowWarning(false), 3000);
      }
    };

    const onVisibilityChange = () => {
      if (document.hidden) handleCheat();
    };
    const onBlur = () => handleCheat();

    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("blur", onBlur);

    // Prevent beforeunload
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!submittedRef.current) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", onBeforeUnload);

    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("blur", onBlur);
      window.removeEventListener("beforeunload", onBeforeUnload);
    };
  }, [submitTest]);

  // Prevent right-click and common shortcuts
  useEffect(() => {
    const onContextMenu = (e: Event) => e.preventDefault();
    const onKeyDown = (e: KeyboardEvent) => {
      if (
        (e.ctrlKey && (e.key === "c" || e.key === "u" || e.key === "a")) ||
        e.key === "F12" ||
        (e.ctrlKey && e.shiftKey && e.key === "I")
      ) {
        e.preventDefault();
      }
    };
    document.addEventListener("contextmenu", onContextMenu);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("contextmenu", onContextMenu);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  if (submitted) return null;

  if (!test) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="glass rounded-xl p-8 text-center">
          <Loader2 className="w-10 h-10 text-primary animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading exam...</p>
        </div>
      </div>
    );
  }

  const q = test.questions[current];
  const allAnswered = answers.every((a) => a !== null);
  const formatTime = (s: number) => `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

  return (
    <div className="min-h-screen flex flex-col select-none">
      {/* Warning overlay */}
      {showWarning && (
        <div className="fixed inset-0 bg-destructive/20 backdrop-blur-sm z-50 flex items-center justify-center animate-slide-in">
          <div className="glass rounded-xl p-6 text-center max-w-xs">
            <AlertTriangle className="w-10 h-10 text-warning mx-auto mb-3" />
            <p className="font-bold text-foreground">Warning {warningsRef.current}/3!</p>
            <p className="text-sm text-muted-foreground mt-1">
              {warningsRef.current >= 2
                ? "Next violation will auto-submit your test!"
                : "Do not switch tabs or windows."}
            </p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="glass border-b border-border p-3 flex items-center justify-between sticky top-0 z-40">
        <div className="text-sm font-semibold text-foreground truncate flex-1">{test.name}</div>
        <div className="flex items-center gap-3">
          {warnings > 0 && (
            <span className="text-xs text-warning flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" /> {warnings}/3
            </span>
          )}
          {timeLeft !== null && (
            <span className={`text-sm font-mono font-bold flex items-center gap-1 ${timeLeft < 60 ? "text-destructive animate-pulse" : "text-primary"}`}>
              <Clock className="w-3.5 h-3.5" /> {formatTime(timeLeft)}
            </span>
          )}
        </div>
      </div>

      {/* Question nav dots */}
      <div className="p-3 flex flex-wrap gap-1.5 justify-center border-b border-border">
        {test.questions.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`w-8 h-8 rounded-md text-xs font-bold transition-colors ${
              i === current
                ? "bg-primary text-primary-foreground"
                : answers[i] !== null
                ? "bg-success/20 text-success border border-success/30"
                : "bg-secondary text-muted-foreground"
            }`}
          >
            {i + 1}
          </button>
        ))}
      </div>

      {/* Question */}
      <div className="flex-1 p-4 md:p-8 max-w-2xl mx-auto w-full">
        <div className="animate-slide-in">
          <p className="text-xs text-muted-foreground mb-2">Question {current + 1} of {test.questions.length}</p>
          <h2 className="text-lg font-semibold text-foreground mb-6 leading-relaxed">{q.question}</h2>

          <div className="space-y-3">
            {q.options.map((opt, oIdx) => {
              if (!opt.trim()) return null;
              const selected = answers[current] === oIdx;
              return (
                <button
                  key={oIdx}
                  onClick={() => {
                    const newAnswers = [...answers];
                    newAnswers[current] = oIdx;
                    setAnswers(newAnswers);
                  }}
                  className={`w-full text-left p-4 rounded-xl border transition-all ${
                    selected
                      ? "border-primary bg-primary/10 glow-primary"
                      : "border-border bg-secondary hover:border-primary/50"
                  }`}
                >
                  <span className={`inline-flex items-center justify-center w-7 h-7 rounded-md text-xs font-bold mr-3 ${
                    selected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                  }`}>
                    {String.fromCharCode(65 + oIdx)}
                  </span>
                  <span className="text-foreground">{opt}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Footer nav */}
      <div className="glass border-t border-border p-3 flex items-center justify-between sticky bottom-0 z-40">
        <Button variant="outline" disabled={current === 0} onClick={() => setCurrent((c) => c - 1)}>
          <ChevronLeft className="w-4 h-4 mr-1" /> Back
        </Button>

        {current === test.questions.length - 1 ? (
          <Button onClick={submitTest} disabled={!allAnswered}>
            <Send className="w-4 h-4 mr-1" /> Submit
          </Button>
        ) : (
          <Button onClick={() => setCurrent((c) => c + 1)}>
            Next <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        )}
      </div>
    </div>
  );
};

export default ExamPage;
