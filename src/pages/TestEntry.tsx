import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getTestBySlug, checkExistingAttemptByUsername } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileText, AlertCircle } from "lucide-react";

const TestEntry = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [telegram, setTelegram] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [test, setTest] = useState<any>(null);

  useEffect(() => {
    const loadTest = async () => {
      if (slug) {
        const t = await getTestBySlug(slug);
        setTest(t);
      }
    };
    loadTest();
  }, [slug]);

  if (!test) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="glass rounded-xl p-8 text-center">
          <p className="text-destructive font-semibold">Test not found</p>
          <Button variant="outline" className="mt-4" onClick={() => navigate("/")}>Go Home</Button>
        </div>
      </div>
    );
  }

  const handleEnter = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (!telegram.trim()) {
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
      const existingAttempt = await checkExistingAttemptByUsername(test.id, telegram.trim());
      if (existingAttempt) {
        setError("You have already attempted this test. Only one attempt per user is allowed.");
        setLoading(false);
        return;
      }

      // Store in session and navigate
      sessionStorage.setItem("quizlab_user", telegram.trim());
      sessionStorage.setItem("quizlab_test_id", test.id);
      navigate(`/test/${slug}/exam`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
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
            <Label>Telegram Username</Label>
            <Input
              value={telegram}
              onChange={(e) => setTelegram(e.target.value)}
              placeholder="@username"
              className="bg-secondary"
            />
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
