import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./hooks/useAuth";
import { EmployeeSessionProvider } from "./hooks/useEmployeeSession";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from "./components/AdminRoute";
import EmployeeRoute from "./components/EmployeeRoute";
import Index from "./pages/Index";
import Login from "./pages/Login";
import LoginFuncionario from "./pages/LoginFuncionario";
import Registro from "./pages/Registro";
import Dashboard from "./pages/Dashboard";
import DashboardFuncionario from "./pages/DashboardFuncionario";
import Admin from "./pages/Admin";
import Planos from "./pages/Planos";
import NotFound from "./pages/NotFound";
import PublicBooking from "./pages/PublicBooking";
import BookingConfirmation from "./pages/BookingConfirmation";
import CancelBooking from "./pages/CancelBooking";
import PublicStore from "./pages/PublicStore";
import AjudaPage from "./pages/Ajuda";
import { UpdatePrompt } from "./components/UpdatePrompt";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <EmployeeSessionProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <UpdatePrompt />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<Login />} />
              <Route path="/login-funcionario" element={<LoginFuncionario />} />
              <Route path="/registro" element={<Registro />} />
              {/* Public booking routes */}
              <Route path="/agendar/:slug" element={<PublicBooking />} />
              <Route path="/loja/:slug" element={<PublicStore />} />
              <Route path="/agendamento-confirmado/:token" element={<BookingConfirmation />} />
              <Route path="/cancelar/:token" element={<CancelBooking />} />
              <Route path="/dashboard" element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } />
              <Route path="/dashboard/ajuda" element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } />
              <Route path="/dashboard/*" element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } />
              <Route path="/funcionario" element={
                <EmployeeRoute>
                  <DashboardFuncionario />
                </EmployeeRoute>
              } />
              <Route path="/admin" element={
                <AdminRoute>
                  <Admin />
                </AdminRoute>
              } />
              <Route path="/admin/planos" element={
                <AdminRoute>
                  <Planos />
                </AdminRoute>
              } />
              <Route path="/admin/*" element={
                <AdminRoute>
                  <Admin />
                </AdminRoute>
              } />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </EmployeeSessionProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
