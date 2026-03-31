import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getTestBySlug } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileText } from "lucide-react";

const TestEntry = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [telegram, setTelegram] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");

  const test = slug ? getTestBySlug(slug) : undefined;

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

  const handleEnter = (e: React.FormEvent) => {
    e.preventDefault();
    if (!telegram.trim()) {
      setError("Enter your Telegram username");
      return;
    }
    if (code.trim() !== test.secretCode) {
      setError("Invalid secret code");
      return;
    }
    // Store in session and navigate
    sessionStorage.setItem("quizlab_user", telegram.trim());
    sessionStorage.setItem("quizlab_test_id", test.id);
    navigate(`/test/${slug}/exam`);
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
          {error && <p className="text-destructive text-sm">{error}</p>}
          <Button type="submit" className="w-full">Start Test</Button>
        </form>
      </div>
    </div>
  );
};

export default TestEntry;
