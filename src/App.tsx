import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { TrafficDataProvider } from "@/contexts/TrafficDataContext";
import { AppLayout } from "@/components/AppLayout";
import DashboardPage from "./pages/DashboardPage";
import MapPage from "./pages/MapPage";
import AIInsightsPage from "./pages/AIInsightsPage";
import MoodIndexPage from "./pages/MoodIndexPage";
import GarbagePage from "./pages/GarbagePage";
import LandslidePage from "./pages/LandslidePage";
import CommutePage from "./pages/CommutePage";
import MyReportsPage from "./pages/MyReportsPage";
import NotFoundPage from "./pages/NotFoundPage";
import AuthCallbackPage from "./pages/AuthCallbackPage";

const queryClient = new QueryClient();

if (!import.meta.env.VITE_SUPABASE_ANON_KEY) {
  console.warn('VITE_SUPABASE_ANON_KEY is undefined on app start!');
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <TrafficDataProvider>
          <Routes>
            <Route element={<AppLayout />}>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/map" element={<MapPage />} />
              <Route path="/ai-insights" element={<AIInsightsPage />} />
              <Route path="/mood-index" element={<MoodIndexPage />} />
              <Route path="/compare" element={<MoodIndexPage />} />
              <Route path="/garbage" element={<GarbagePage />} />
              <Route path="/my-reports" element={<MyReportsPage />} />
              <Route path="/landslide" element={<LandslidePage />} />
              <Route path="/commute" element={<CommutePage />} />
            </Route>
            <Route path="/auth/callback" element={<AuthCallbackPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </TrafficDataProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
