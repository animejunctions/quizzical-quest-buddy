import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getTestById, saveTest, generateId, type Test, type Question } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Plus, Trash2, GripVertical } from "lucide-react";
import { toast } from "sonner";

const emptyQuestion = (): Question => ({
  id: generateId(),
  question: "",
  options: ["", "", "", ""],
  correctAnswer: 0,
  explanation: "",
});

const AdminTestEditor = () => {
  const { testId } = useParams();
  const navigate = useNavigate();
  const isNew = testId === "new";

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [secretCode, setSecretCode] = useState("");
  const [timeLimit, setTimeLimit] = useState(0);
  const [questions, setQuestions] = useState<Question[]>([emptyQuestion()]);
  const [bulkText, setBulkText] = useState("");
  const [showBulk, setShowBulk] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem("quizlab_admin") !== "true") {
      navigate("/admin");
      return;
    }
    if (!isNew && testId) {
      const test = getTestById(testId);
      if (test) {
        setName(test.name);
        setSlug(test.slug);
        setSecretCode(test.secretCode);
        setTimeLimit(test.timeLimit);
        setQuestions(test.questions.length > 0 ? test.questions : [emptyQuestion()]);
      }
    }
  }, [testId, isNew, navigate]);

  const parseBulkText = () => {
    if (!bulkText.trim()) return;
    const blocks = bulkText.split(/\n\s*\n/).filter(Boolean);
    const parsed: Question[] = [];

    for (const block of blocks) {
      const lines = block.split("\n").map((l) => l.trim()).filter(Boolean);
      let question = "";
      const options: string[] = [];
      let correctAnswer = 0;
      let explanation = "";

      for (const line of lines) {
        const lower = line.toLowerCase();
        if (lower.startsWith("q.") || lower.startsWith("q ") || lower.startsWith("q:")) {
          question = line.replace(/^q[.:]\s*/i, "");
        } else if (/^[a-d][.)]\s*/i.test(line)) {
          options.push(line.replace(/^[a-d][.)]\s*/i, ""));
        } else if (lower.startsWith("o.") || lower.startsWith("o ") || lower.startsWith("o:")) {
          // Options prefix line, skip
        } else if (lower.startsWith("a.") || lower.startsWith("a:") || lower.startsWith("a ")) {
          const ansText = line.replace(/^a[.:]\s*/i, "").trim().toLowerCase();
          if (["a", "b", "c", "d"].includes(ansText)) {
            correctAnswer = ansText.charCodeAt(0) - 97;
          } else if (!question) {
            // might be option a
            options.push(line.replace(/^a[.)]\s*/i, ""));
          }
        } else if (lower.startsWith("e.") || lower.startsWith("e:") || lower.startsWith("e ")) {
          explanation = line.replace(/^e[.:]\s*/i, "");
        } else if (!question) {
          question = line;
        }
      }

      if (question && options.length >= 2) {
        while (options.length < 4) options.push("");
        parsed.push({ id: generateId(), question, options: options.slice(0, 4), correctAnswer, explanation });
      }
    }

    if (parsed.length > 0) {
      setQuestions((prev) => [...prev.filter((q) => q.question.trim()), ...parsed]);
      setBulkText("");
      setShowBulk(false);
      toast.success(`Parsed ${parsed.length} questions`);
    } else {
      toast.error("Could not parse any questions. Use format: Q. question, a) b) c) d) options, A. answer, E. explanation");
    }
  };

  const updateQuestion = (idx: number, field: keyof Question, value: unknown) => {
    setQuestions((prev) => prev.map((q, i) => (i === idx ? { ...q, [field]: value } : q)));
  };

  const updateOption = (qIdx: number, oIdx: number, value: string) => {
    setQuestions((prev) =>
      prev.map((q, i) =>
        i === qIdx ? { ...q, options: q.options.map((o, j) => (j === oIdx ? value : o)) } : q
      )
    );
  };

  const removeQuestion = (idx: number) => {
    if (questions.length <= 1) return;
    setQuestions((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSave = () => {
    if (!name.trim() || !slug.trim() || !secretCode.trim()) {
      toast.error("Name, slug, and secret code are required");
      return;
    }
    const validQuestions = questions.filter((q) => q.question.trim() && q.options.some((o) => o.trim()));
    if (validQuestions.length === 0) {
      toast.error("Add at least one question");
      return;
    }

    const test: Test = {
      id: isNew ? generateId() : testId!,
      name: name.trim(),
      slug: slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, "-"),
      secretCode: secretCode.trim(),
      timeLimit,
      questions: validQuestions,
      createdAt: isNew ? new Date().toISOString() : getTestById(testId!)?.createdAt || new Date().toISOString(),
      isActive: true,
    };

    saveTest(test);
    toast.success(isNew ? "Test created!" : "Test updated!");
    navigate("/admin/dashboard");
  };

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-3xl mx-auto">
        <Button variant="ghost" onClick={() => navigate("/admin/dashboard")} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-1" /> Back
        </Button>

        <h1 className="text-2xl font-bold text-foreground mb-6">{isNew ? "Create Test" : "Edit Test"}</h1>

        <div className="glass rounded-xl p-6 space-y-4 mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Test Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Math Quiz 1" className="bg-secondary" />
            </div>
            <div className="space-y-2">
              <Label>Slug (URL)</Label>
              <Input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="e.g. math-quiz-1" className="bg-secondary" />
            </div>
            <div className="space-y-2">
              <Label>Secret Code</Label>
              <Input value={secretCode} onChange={(e) => setSecretCode(e.target.value)} placeholder="e.g. abc123" className="bg-secondary" />
            </div>
            <div className="space-y-2">
              <Label>Time Limit (minutes, 0 = no limit)</Label>
              <Input type="number" value={timeLimit} onChange={(e) => setTimeLimit(Number(e.target.value))} min={0} className="bg-secondary" />
            </div>
          </div>
        </div>

        {/* Bulk paste */}
        <div className="mb-6">
          <Button variant="outline" onClick={() => setShowBulk(!showBulk)} className="mb-3">
            {showBulk ? "Hide" : "Bulk Paste Questions"}
          </Button>
          {showBulk && (
            <div className="glass rounded-xl p-4 space-y-3 animate-slide-in">
              <p className="text-xs text-muted-foreground">
                Format: Q. Question / a) b) c) d) Options / A. correct letter / E. explanation. Separate questions with blank lines.
              </p>
              <Textarea
                value={bulkText}
                onChange={(e) => setBulkText(e.target.value)}
                rows={10}
                placeholder={`Q. What is 2+2?\na) 3\nb) 4\nc) 5\nd) 6\nA. b\nE. Basic addition`}
                className="bg-secondary font-mono text-sm"
              />
              <Button onClick={parseBulkText}>Parse & Add</Button>
            </div>
          )}
        </div>

        {/* Questions */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">Questions ({questions.length})</h2>
            <Button size="sm" onClick={() => setQuestions((p) => [...p, emptyQuestion()])}>
              <Plus className="w-4 h-4 mr-1" /> Add
            </Button>
          </div>

          {questions.map((q, qIdx) => (
            <div key={q.id} className="glass rounded-xl p-4 space-y-3 animate-slide-in">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <GripVertical className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-mono text-muted-foreground">Q{qIdx + 1}</span>
                </div>
                <Button size="sm" variant="ghost" onClick={() => removeQuestion(qIdx)} disabled={questions.length <= 1}>
                  <Trash2 className="w-3.5 h-3.5 text-destructive" />
                </Button>
              </div>

              <Textarea
                value={q.question}
                onChange={(e) => updateQuestion(qIdx, "question", e.target.value)}
                placeholder="Question text..."
                className="bg-secondary"
                rows={2}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {q.options.map((opt, oIdx) => (
                  <div key={oIdx} className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => updateQuestion(qIdx, "correctAnswer", oIdx)}
                      className={`w-7 h-7 rounded-md text-xs font-bold shrink-0 transition-colors ${
                        q.correctAnswer === oIdx
                          ? "bg-success text-success-foreground"
                          : "bg-secondary text-muted-foreground hover:bg-secondary/80"
                      }`}
                    >
                      {String.fromCharCode(65 + oIdx)}
                    </button>
                    <Input
                      value={opt}
                      onChange={(e) => updateOption(qIdx, oIdx, e.target.value)}
                      placeholder={`Option ${String.fromCharCode(65 + oIdx)}`}
                      className="bg-secondary"
                    />
                  </div>
                ))}
              </div>

              <Textarea
                value={q.explanation}
                onChange={(e) => updateQuestion(qIdx, "explanation", e.target.value)}
                placeholder="Explanation (optional)"
                className="bg-secondary"
                rows={1}
              />
            </div>
          ))}
        </div>

        <div className="mt-6 flex gap-3">
          <Button onClick={handleSave} className="flex-1">Save Test</Button>
          <Button variant="outline" onClick={() => navigate("/admin/dashboard")}>Cancel</Button>
        </div>
      </div>
    </div>
  );
};

export default AdminTestEditor;
