import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getTestBySlug, checkExistingAttemptByUsername, getTests, type Attempt } from "@/lib/store";
import { isSupabaseConfigured } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ThemeToggle } from "@/components/ThemeToggle";
import { FileText, AlertCircle, Loader2, CheckCircle, Trophy, Eye, BarChart3 } from "lucide-react";

const TestEntry = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [telegram, setTelegram] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [test, setTest] = useState<any>(null);
  const [existingAttempt, setExistingAttempt] = useState<Attempt | null>(null);

  useEffect(() => {
    const loadTest = async () => {
      if (slug) {
        setPageLoading(true);
        try {
          // Check for cached result in localStorage first
          const cachedResult = localStorage.getItem(`quizlab_result_${slug}`);
          if (cachedResult) {
            setExistingAttempt(JSON.parse(cachedResult));
          }

          // Try Supabase first if configured, then fallback to localStorage
          if (isSupabaseConfigured) {
            const t = await getTestBySlug(slug);
            if (t) {
              setTest(t);
              setPageLoading(false);
              return;
            }
          }
          
          // Fallback to localStorage
          const localTests = getTests();
          const localTest = localTests.find(t => t.slug === slug);
          if (localTest) {
            setTest(localTest);
          }
        } catch (err) {
          console.error('Error loading test:', err);
          // Fallback to localStorage on error
          const localTests = getTests();
          const localTest = localTests.find(t => t.slug === slug);
          if (localTest) {
            setTest(localTest);
          }
        }
        setPageLoading(false);
      }
    };
    loadTest();
  }, [slug]);

  if (pageLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="absolute top-4 right-4">
          <ThemeToggle />
        </div>
        <div className="glass rounded-xl p-8 text-center">
          <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading test...</p>
        </div>
      </div>
    );
  }

  if (!test) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="absolute top-4 right-4">
          <ThemeToggle />
        </div>
        <div className="glass rounded-xl p-8 text-center">
          <p className="text-destructive font-semibold">Test not found</p>
          <Button variant="outline" className="mt-4" onClick={() => navigate("/")}>Go Home</Button>
        </div>
      </div>
    );
  }

  // Show "already submitted" view if user has a cached result
  if (existingAttempt) {
    const pct = Math.round((existingAttempt.score / existingAttempt.totalQuestions) * 100);
    
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="absolute top-4 right-4">
          <ThemeToggle />
        </div>
        <div className="glass rounded-xl p-8 w-full max-w-sm animate-slide-in">
          <div className="flex flex-col items-center mb-6">
            <div className="w-16 h-16 rounded-full bg-success/20 flex items-center justify-center mb-4">
              <CheckCircle className="w-8 h-8 text-success" />
            </div>
            <h1 className="text-xl font-bold text-foreground">Already Submitted</h1>
            <p className="text-muted-foreground text-sm mt-1 text-center">
              You have already completed this test
            </p>
          </div>

          <div className="glass rounded-xl p-4 mb-6 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Trophy className={`w-5 h-5 ${pct >= 70 ? "text-success" : pct >= 40 ? "text-warning" : "text-destructive"}`} />
              <span className="text-2xl font-bold text-foreground">{existingAttempt.score}/{existingAttempt.totalQuestions}</span>
            </div>
            <p className="text-sm text-muted-foreground">{pct}% Score</p>
            <p className="text-xs text-muted-foreground mt-2">
              Submitted by {existingAttempt.name || existingAttempt.telegramUsername}
            </p>
          </div>

          <div className="space-y-3">
            <Button className="w-full" onClick={() => navigate(`/test/${slug}/view-result`)}>
              <Eye className="w-4 h-4 mr-2" /> View Detailed Results
            </Button>
            <Button variant="outline" className="w-full" onClick={() => navigate(`/test/${test.id}/leaderboard`)}>
              <BarChart3 className="w-4 h-4 mr-2" /> View Leaderboard
            </Button>
            <Button variant="ghost" className="w-full" onClick={() => navigate("/")}>
              Go Home
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const handleEnter = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (!name.trim()) {
        setError("Please enter your name");
        setLoading(false);
        return;
      }
      
      // Clean telegram username - remove @ if present
      const cleanTelegram = telegram.trim().replace(/^@/, '');
      if (!cleanTelegram) {
        setError("Enter your Telegram username");
        setLoading(false);
        return;
      }
      if (code.trim() !== test.secretCode) {
        setError("Invalid secret code");
        setLoading(false);
        return;
      }

      // Check if user has already attempted this test
      const existingAttempt = await checkExistingAttemptByUsername(test.id, cleanTelegram);
      if (existingAttempt) {
        setError("You have already attempted this test. Only one attempt per user is allowed.");
        setLoading(false);
        return;
      }

      // Store in session and navigate
      sessionStorage.setItem("quizlab_user_name", name.trim());
      sessionStorage.setItem("quizlab_user", cleanTelegram);
      sessionStorage.setItem("quizlab_test_id", test.id);
      sessionStorage.setItem("quizlab_test_slug", slug || "");
      navigate(`/test/${slug}/exam`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <div className="glass rounded-xl p-8 w-full max-w-sm animate-slide-in">
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-4 glow-primary">
            <FileText className="w-7 h-7 text-primary" />
          </div>
          <h1 className="text-xl font-bold text-foreground">{test.name}</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {test.questions.length} questions
            {test.timeLimit > 0 && ` • ${test.timeLimit} min`}
          </p>
        </div>

        <form onSubmit={handleEnter} className="space-y-4">
          <div className="space-y-2">
            <Label>Your Name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your full name"
              className="bg-secondary"
            />
          </div>
          <div className="space-y-2">
            <Label>Telegram Username</Label>
            <Input
              value={telegram}
              onChange={(e) => setTelegram(e.target.value)}
              placeholder="username (without @)"
              className="bg-secondary"
            />
            <p className="text-xs text-muted-foreground">Enter without the @ symbol</p>
          </div>
          <div className="space-y-2">
            <Label>Secret Code</Label>
            <Input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Enter test code"
              className="bg-secondary"
            />
          </div>
          {error && (
            <div className="flex gap-2 items-start p-3 bg-destructive/10 rounded-lg border border-destructive/30">
              <AlertCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
              <p className="text-destructive text-sm">{error}</p>
            </div>
          )}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Checking..." : "Start Test"}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default TestEntry;
