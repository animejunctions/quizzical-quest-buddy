import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getTestById, getAttemptsByTest, type Attempt } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

const AdminResults = () => {
  const { testId } = useParams();
  const navigate = useNavigate();
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [testName, setTestName] = useState("");

  useEffect(() => {
    if (sessionStorage.getItem("quizlab_admin") !== "true") {
      navigate("/admin");
      return;
    }
    if (testId) {
      const test = getTestById(testId);
      if (test) setTestName(test.name);
      setAttempts(getAttemptsByTest(testId));
    }
  }, [testId, navigate]);

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <Button variant="ghost" onClick={() => navigate("/admin/dashboard")} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-1" /> Back
        </Button>

        <h1 className="text-2xl font-bold text-foreground mb-2">Results: {testName}</h1>
        <p className="text-muted-foreground text-sm mb-6">{attempts.length} attempt(s)</p>

        {attempts.length === 0 ? (
          <div className="glass rounded-xl p-8 text-center text-muted-foreground">No attempts yet</div>
        ) : (
          <div className="space-y-2">
            {attempts.map((a) => (
              <div key={a.id} className="glass rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <p className="font-semibold text-foreground">@{a.telegramUsername}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(a.startedAt).toLocaleString()}
                    {a.autoSubmitted && <span className="text-warning ml-2">⚠ Auto-submitted</span>}
                    {a.warnings > 0 && <span className="text-destructive ml-2">{a.warnings} warning(s)</span>}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-primary">{a.score}/{a.totalQuestions}</p>
                  <p className="text-xs text-muted-foreground">{Math.round((a.score / a.totalQuestions) * 100)}%</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminResults;
