import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getTests, deleteTest, type Test } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Plus, Trash2, Edit, Users, LogOut, Copy, BarChart3 } from "lucide-react";
import { toast } from "sonner";

const AdminDashboard = () => {
  const [tests, setTests] = useState<Test[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (sessionStorage.getItem("quizlab_admin") !== "true") {
      navigate("/admin");
      return;
    }
    setTests(getTests());
  }, [navigate]);

  const handleDelete = (id: string) => {
    if (confirm("Delete this test?")) {
      deleteTest(id);
      setTests(getTests());
      toast.success("Test deleted");
    }
  };

  const copyLink = (slug: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/test/${slug}`);
    toast.success("Test link copied!");
  };

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Admin Dashboard</h1>
            <p className="text-muted-foreground text-sm">Manage your tests and view results</p>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button onClick={() => navigate("/admin/test/new")}>
              <Plus className="w-4 h-4 mr-1" /> New Test
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                sessionStorage.removeItem("quizlab_admin");
                navigate("/admin");
              }}
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {tests.length === 0 ? (
          <div className="glass rounded-xl p-12 text-center">
            <p className="text-muted-foreground mb-4">No tests created yet</p>
            <Button onClick={() => navigate("/admin/test/new")}>
              <Plus className="w-4 h-4 mr-1" /> Create First Test
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {tests.map((test) => (
              <div key={test.id} className="glass rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-slide-in">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-foreground truncate">{test.name}</h3>
                  <div className="flex flex-wrap gap-3 mt-1 text-xs text-muted-foreground">
                    <span>/{test.slug}</span>
                    <span>{test.questions.length} questions</span>
                    <span>{test.timeLimit > 0 ? `${test.timeLimit} min` : "No limit"}</span>
                    <span className="font-mono">Code: {test.secretCode}</span>
                  </div>
                </div>
                <div className="flex gap-1.5 shrink-0">
                  <Button size="sm" variant="ghost" onClick={() => copyLink(test.slug)} title="Copy link">
                    <Copy className="w-3.5 h-3.5" />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => navigate(`/test/${test.id}/leaderboard`)} title="Leaderboard">
                    <BarChart3 className="w-3.5 h-3.5" />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => navigate(`/admin/results/${test.id}`)} title="View results">
                    <Users className="w-3.5 h-3.5" />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => navigate(`/admin/test/${test.id}`)} title="Edit test">
                    <Edit className="w-3.5 h-3.5" />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => handleDelete(test.id)} title="Delete test">
                    <Trash2 className="w-3.5 h-3.5 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
