import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { generateId, type Test, type Question } from "@/lib/store";
import { getTestById, saveTest, saveQuestion, deleteQuestion } from "@/lib/supabase-service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ArrowLeft, Plus, Trash2, GripVertical, Loader2 } from "lucide-react";
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
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem("quizlab_admin") !== "true") {
      navigate("/admin");
      return;
    }
    
    const loadTest = async () => {
      if (!isNew && testId) {
        setLoading(true);
        try {
          const test = await getTestById(testId);
          if (test) {
            setName(test.name);
            setSlug(test.slug);
            setSecretCode(test.secretCode);
            setTimeLimit(test.timeLimit);
            setQuestions(test.questions.length > 0 ? test.questions : [emptyQuestion()]);
          }
        } catch (error) {
          console.error("Error loading test:", error);
          toast.error("Failed to load test");
        } finally {
          setLoading(false);
        }
      }
    };
    
    loadTest();
  }, [testId, isNew, navigate]);

  const parseBulkText = () => {
    if (!bulkText.trim()) return;
    
    // Split by "Q." or "Q " at the start of a line to separate questions
    const questionBlocks = bulkText.split(/(?=^Q[.\s])/im).filter(b => b.trim());
    const parsed: Question[] = [];

    for (const block of questionBlocks) {
      const lines = block.split("\n").map((l) => l.trim()).filter(Boolean);
      let question = "";
      // Store options with their original letter positions
      const optionsMap: { [key: string]: string } = {};
      let correctAnswerLetter = "";
      let explanation = "";
      let foundAnswer = false;
      let foundExplanation = false;

      for (const line of lines) {
        // Check for question line (Q. or Q:) - must start with Q followed by . or space
        if (/^Q[.\s:]/i.test(line)) {
          question = line.replace(/^Q[.\s:]\s*/i, "").trim();
        }
        // Check for answer line FIRST - "A." or "Ans" followed by just a single letter (a, b, c, or d)
        // This must be checked BEFORE options to avoid confusion
        else if (/^(A[.\s:]|Ans[.\s:]?)\s*[a-d]\s*$/i.test(line)) {
          const ansMatch = line.match(/[a-d]\s*$/i);
          if (ansMatch) {
            correctAnswerLetter = ansMatch[0].trim().toLowerCase();
            foundAnswer = true;
          }
        }
        // Check for explanation line (E. or E:)
        else if (/^E[.\s:]/i.test(line)) {
          explanation = line.replace(/^E[.\s:]\s*/i, "").trim();
          foundExplanation = true;
        }
        // Check for options a) b) c) d) - lowercase letter followed by ) or . and then actual content (more than 1 char)
        else if (/^[a-d][.)]\s*.{2,}/i.test(line)) {
          const letterMatch = line.match(/^([a-d])[.)]/i);
          if (letterMatch) {
            const letter = letterMatch[1].toLowerCase();
            const optionText = line.replace(/^[a-d][.)]\s*/i, "").trim();
            // Only add if the option text is substantial (not just a single letter)
            if (optionText.length > 1 || !/^[a-d]$/i.test(optionText)) {
              optionsMap[letter] = optionText;
            }
          }
        }
        // If no question yet, this might be the question text without Q. prefix
        else if (!question && !foundAnswer && !foundExplanation && line.length > 5) {
          question = line;
        }
      }

      // Build options array in order (a, b, c, d)
      const options: string[] = [
        optionsMap['a'] || "",
        optionsMap['b'] || "",
        optionsMap['c'] || "",
        optionsMap['d'] || ""
      ];
      
      // Convert correct answer letter to index (a=0, b=1, c=2, d=3)
      const correctAnswer = correctAnswerLetter ? correctAnswerLetter.charCodeAt(0) - 97 : 0;

      // Count non-empty options
      const nonEmptyOptions = options.filter(o => o.trim()).length;

      // Only add if we have a valid question with at least 2 options
      if (question && nonEmptyOptions >= 2) {
        parsed.push({ 
          id: generateId(), 
          question, 
          options, 
          correctAnswer, 
          explanation 
        });
      }
    }

    if (parsed.length > 0) {
      setQuestions((prev) => [...prev.filter((q) => q.question.trim()), ...parsed]);
      setBulkText("");
      setShowBulk(false);
      toast.success(`Parsed ${parsed.length} question${parsed.length > 1 ? 's' : ''}`);
    } else {
      toast.error("Could not parse any questions. Use format: Q. question, a) b) c) d) options, A. answer letter, E. explanation");
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

  const handleSave = async () => {
    if (!name.trim() || !slug.trim() || !secretCode.trim()) {
      toast.error("Name, slug, and secret code are required");
      return;
    }
    const validQuestions = questions.filter((q) => q.question.trim() && q.options.some((o) => o.trim()));
    if (validQuestions.length === 0) {
      toast.error("Add at least one question");
      return;
    }

    setSaving(true);
    
    try {
      const testIdToUse = isNew ? generateId() : testId!;
      
      const test: Test = {
        id: testIdToUse,
        name: name.trim(),
        slug: slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, "-"),
        secretCode: secretCode.trim(),
        timeLimit,
        questions: validQuestions,
        createdAt: new Date().toISOString(),
        isActive: true,
      };

      // Save test to Supabase
      const savedTest = await saveTest(test);
      
      if (savedTest) {
        // Save all questions
        for (let i = 0; i < validQuestions.length; i++) {
          await saveQuestion(testIdToUse, validQuestions[i], i);
        }
        
        toast.success(isNew ? "Test created!" : "Test updated!");
        navigate("/admin/dashboard");
      } else {
        toast.error("Failed to save test");
      }
    } catch (error) {
      console.error("Error saving test:", error);
      toast.error("Failed to save test");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="glass rounded-xl p-8 text-center">
          <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading test...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
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
          <Button onClick={handleSave} className="flex-1" disabled={saving}>
            {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</> : "Save Test"}
          </Button>
          <Button variant="outline" onClick={() => navigate("/admin/dashboard")} disabled={saving}>Cancel</Button>
        </div>
      </div>
    </div>
  );
};

export default AdminTestEditor;
