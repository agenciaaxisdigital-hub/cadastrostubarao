import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import Login from "./pages/Login";
import TubaraoSocial from "./pages/TubaraoSocial";
import TubaraoSocialForm from "./pages/TubaraoSocialForm";
import TubaraoTime from "./pages/TubaraoTime";
import TubaraoTimeForm from "./pages/TubaraoTimeForm";
import Usuarios from "./pages/Usuarios";
import AppLayout from "./components/AppLayout";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Login />} />
            <Route element={<AppLayout />}>
              <Route path="/social" element={<TubaraoSocial />} />
              <Route path="/social/:id" element={<TubaraoSocialForm />} />
              <Route path="/time" element={<TubaraoTime />} />
              <Route path="/time/:id" element={<TubaraoTimeForm />} />
              <Route path="/usuarios" element={<Usuarios />} />
              {/* Legacy redirects */}
              <Route path="/cadastro" element={<Navigate to="/social/novo" replace />} />
              <Route path="/associados" element={<Navigate to="/social" replace />} />
              <Route path="/dashboard" element={<Navigate to="/social" replace />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
