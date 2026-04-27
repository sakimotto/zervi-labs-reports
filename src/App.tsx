import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Layout } from "@/components/Layout";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import AuthPage from "./pages/AuthPage";
import DashboardPage from "./pages/DashboardPage";
import SamplesPage from "./pages/SamplesPage";
import TestMethodsPage from "./pages/TestMethodsPage";
import TestMethodDetailPage from "./pages/TestMethodDetailPage";
import TestProgramsPage from "./pages/TestProgramsPage";
import SuppliersPage from "./pages/SuppliersPage";
import SupplierDetailPage from "./pages/SupplierDetailPage";
import CustomersPage from "./pages/CustomersPage";
import CustomerDetailPage from "./pages/CustomerDetailPage";
import SOPsPage from "./pages/SOPsPage";
import EquipmentPage from "./pages/EquipmentPage";
import EquipmentDetailPage from "./pages/EquipmentDetailPage";
import MaterialsPage from "./pages/MaterialsPage";
import MaterialDetailPage from "./pages/MaterialDetailPage";
import StandardsPage from "./pages/StandardsPage";
import StandardDetailPage from "./pages/StandardDetailPage";
import CopilotPage from "./pages/CopilotPage";
import TasksPage from "./pages/TasksPage";
import PlanningPage from "./pages/PlanningPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/auth" element={<AuthPage />} />
            <Route
              path="*"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Routes>
                      <Route path="/" element={<DashboardPage />} />
                      <Route path="/tests" element={<SamplesPage />} />
                      <Route path="/tests/:id" element={<SamplesPage />} />
                      <Route path="/test-programs" element={<TestProgramsPage />} />
                      <Route path="/test-methods" element={<TestMethodsPage />} />
                      <Route path="/test-methods/:id" element={<TestMethodDetailPage />} />
                      <Route path="/equipment" element={<EquipmentPage />} />
                      <Route path="/equipment/:id" element={<EquipmentDetailPage />} />
                      <Route path="/materials" element={<MaterialsPage />} />
                      <Route path="/materials/:id" element={<MaterialDetailPage />} />
                      <Route path="/standards" element={<StandardsPage />} />
                      <Route path="/standards/:id" element={<StandardDetailPage />} />
                      <Route path="/suppliers" element={<SuppliersPage />} />
                      <Route path="/suppliers/:id" element={<SupplierDetailPage />} />
                      <Route path="/customers" element={<CustomersPage />} />
                      <Route path="/customers/:id" element={<CustomerDetailPage />} />
                      <Route path="/sops" element={<SOPsPage />} />
                      <Route path="/tasks" element={<TasksPage />} />
                      <Route path="/planning" element={<PlanningPage />} />
                      <Route path="/copilot" element={<CopilotPage />} />
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </Layout>
                </ProtectedRoute>
              }
            />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
