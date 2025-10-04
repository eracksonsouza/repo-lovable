import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { FinanceProvider } from "./contexts/FinanceContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import AddEntry from "./pages/AddEntry";
import Categories from "./pages/Categories";
import MonthlyView from "./pages/MonthlyView";
import Installments from "./pages/Installments";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
import Investiments from "./pages/Investiments";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <FinanceProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <ProtectedRoute>
              <Layout>
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/add" element={<AddEntry />} />
                  <Route path="/monthly" element={<MonthlyView />} />
                  <Route path="/installments" element={<Installments />} />
                  <Route path="/investiments" element={<Investiments />} />
                  <Route path="/categories" element={<Categories />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Layout>
            </ProtectedRoute>
          </BrowserRouter>
        </FinanceProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
