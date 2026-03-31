import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Shield, FileText } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="text-center animate-slide-in">
        <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6 glow-primary animate-pulse-glow">
          <FileText className="w-10 h-10 text-primary" />
        </div>
        <h1 className="text-4xl font-extrabold text-foreground mb-2 tracking-tight">QuizLab</h1>
        <p className="text-muted-foreground mb-8 max-w-xs mx-auto">
          Secure online testing platform with anti-cheat protection
        </p>
        <div className="flex flex-col gap-3 max-w-[200px] mx-auto">
          <Button onClick={() => navigate("/admin")} className="w-full">
            <Shield className="w-4 h-4 mr-2" /> Admin Panel
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Index;
