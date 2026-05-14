import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Auth from "./pages/Auth";
import Landing from "./pages/Landing";
import Dashboard from "./pages/Dashboard";
import Documents from "./pages/Documents";
import Traceability from "./pages/Traceability";
import Research from "./pages/Research";
import Gates from "./pages/Gates";
import Changes from "./pages/Changes";
import Knowledge from "./pages/Knowledge";
import Projects from "./pages/Projects";
import ProjectHub from "./pages/ProjectHub";
import Workflow from "./pages/Workflow";
import BomIntel from "./pages/BomIntel";
import BomDetail from "./pages/BomDetail";
import SupplyIntel from "./pages/SupplyIntel";
import SupplierDetail from "./pages/SupplierDetail";
import ProcureIntel from "./pages/ProcureIntel";
import PrDetail from "./pages/PrDetail";
import SpendAnalytics from "./pages/SpendAnalytics";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/documents" element={<ProtectedRoute><Documents /></ProtectedRoute>} />
            <Route path="/traceability" element={<ProtectedRoute><Traceability /></ProtectedRoute>} />
            <Route path="/research" element={<ProtectedRoute><Research /></ProtectedRoute>} />
            <Route path="/knowledge" element={<ProtectedRoute><Knowledge /></ProtectedRoute>} />
            <Route path="/projects" element={<ProtectedRoute><Projects /></ProtectedRoute>} />
            <Route path="/projects/:projectId" element={<ProtectedRoute><ProjectHub /></ProtectedRoute>} />
            <Route path="/workflow/:projectId" element={<ProtectedRoute><Workflow /></ProtectedRoute>} />
            <Route path="/changes" element={<ProtectedRoute><Changes /></ProtectedRoute>} />
            <Route path="/gates" element={<ProtectedRoute><Gates /></ProtectedRoute>} />
            <Route path="/bom" element={<ProtectedRoute><BomIntel /></ProtectedRoute>} />
            <Route path="/bom/:bomId" element={<ProtectedRoute><BomDetail /></ProtectedRoute>} />
            <Route path="/supply" element={<ProtectedRoute><SupplyIntel /></ProtectedRoute>} />
            <Route path="/supply/:supplierId" element={<ProtectedRoute><SupplierDetail /></ProtectedRoute>} />
            <Route path="/procurement" element={<ProtectedRoute><ProcureIntel /></ProtectedRoute>} />
            <Route path="/procurement/spend" element={<ProtectedRoute><SpendAnalytics /></ProtectedRoute>} />
            <Route path="/procurement/pr/new" element={<ProtectedRoute><PrDetail /></ProtectedRoute>} />
            <Route path="/procurement/pr/:prId" element={<ProtectedRoute><PrDetail /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
