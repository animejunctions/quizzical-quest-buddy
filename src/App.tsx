import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";
import AdminLogin from "./pages/AdminLogin.tsx";
import AdminDashboard from "./pages/AdminDashboard.tsx";
import AdminTestEditor from "./pages/AdminTestEditor.tsx";
import AdminResults from "./pages/AdminResults.tsx";
import TestEntry from "./pages/TestEntry.tsx";
import ExamPage from "./pages/ExamPage.tsx";
import ResultPage from "./pages/ResultPage.tsx";
import Leaderboard from "./pages/Leaderboard.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/admin" element={<AdminLogin />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/test/:testId" element={<AdminTestEditor />} />
          <Route path="/admin/results/:testId" element={<AdminResults />} />
          <Route path="/test/:slug" element={<TestEntry />} />
          <Route path="/test/:slug/exam" element={<ExamPage />} />
          <Route path="/test/:slug/result" element={<ResultPage />} />
          <Route path="/test/:testId/leaderboard" element={<Leaderboard />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
