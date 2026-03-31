import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Shield, FileText, CheckCircle, Clock, BarChart3, Lock } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: Lock,
      title: "Anti-Cheat Protection",
      description: "Advanced tab switching detection and auto-submission on violations"
    },
    {
      icon: Clock,
      title: "Timed Assessments",
      description: "Set time limits with countdown timer and automatic submission"
    },
    {
      icon: BarChart3,
      title: "Real-time Leaderboards",
      description: "Track rankings and compare scores across all participants"
    },
    {
      icon: CheckCircle,
      title: "Instant Results",
      description: "Detailed question-by-question review with explanations"
    }
  ];

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center z-10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <FileText className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="font-bold text-foreground">QuizLab</span>
        </div>
        <ThemeToggle />
      </header>

      {/* Hero Section */}
      <section className="min-h-screen flex items-center justify-center p-4 pt-20">
        <div className="text-center animate-slide-in max-w-2xl mx-auto">
          <div className="w-24 h-24 rounded-3xl bg-primary/10 flex items-center justify-center mx-auto mb-8 glow-primary">
            <FileText className="w-12 h-12 text-primary" />
          </div>
          
          <h1 className="text-5xl md:text-6xl font-extrabold text-foreground mb-4 tracking-tight">
            QuizLab
          </h1>
          
          <p className="text-xl text-muted-foreground mb-8 max-w-md mx-auto leading-relaxed">
            Professional secure online testing platform with anti-cheat protection and real-time analytics
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            <Button onClick={() => navigate("/admin")} size="lg" className="min-w-[180px]">
              <Shield className="w-4 h-4 mr-2" /> Admin Panel
            </Button>
          </div>

          {/* Feature Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-16">
            {features.map((feature, index) => (
              <div 
                key={index}
                className="glass rounded-xl p-6 text-left hover:bg-secondary/50 transition-colors"
              >
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <feature.icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="p-6 text-center border-t border-border">
        <p className="text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} QuizLab. Secure Online Testing Platform.
        </p>
      </footer>
    </div>
  );
};

export default Index;
