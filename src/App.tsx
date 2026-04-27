import { lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Layout } from "@/components/Layout";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";

// Eagerly loaded — needed for the auth gate / fast first paint
import AuthPage from "./pages/AuthPage";
import DashboardPage from "./pages/DashboardPage";
import NotFound from "./pages/NotFound";

// Lazy-loaded routes (code-split per page)
const SamplesPage = lazy(() => import("./pages/SamplesPage"));
const TestMethodsPage = lazy(() => import("./pages/TestMethodsPage"));
const TestMethodDetailPage = lazy(() => import("./pages/TestMethodDetailPage"));
const TestProgramsPage = lazy(() => import("./pages/TestProgramsPage"));
const TestProgramDetailPage = lazy(() => import("./pages/TestProgramDetailPage"));
const SuppliersPage = lazy(() => import("./pages/SuppliersPage"));
const SupplierDetailPage = lazy(() => import("./pages/SupplierDetailPage"));
const CustomersPage = lazy(() => import("./pages/CustomersPage"));
const CustomerDetailPage = lazy(() => import("./pages/CustomerDetailPage"));
const SOPsPage = lazy(() => import("./pages/SOPsPage"));
const EquipmentPage = lazy(() => import("./pages/EquipmentPage"));
const EquipmentDetailPage = lazy(() => import("./pages/EquipmentDetailPage"));
const MaterialsPage = lazy(() => import("./pages/MaterialsPage"));
const MaterialDetailPage = lazy(() => import("./pages/MaterialDetailPage"));
const StandardsPage = lazy(() => import("./pages/StandardsPage"));
const StandardDetailPage = lazy(() => import("./pages/StandardDetailPage"));
const CopilotPage = lazy(() => import("./pages/CopilotPage"));
const TasksPage = lazy(() => import("./pages/TasksPage"));
const PlanningPage = lazy(() => import("./pages/PlanningPage"));
const RequestTemplatesAdminPage = lazy(() => import("./pages/RequestTemplatesAdminPage"));
const TestRequestsPage = lazy(() => import("./pages/TestRequestsPage"));
const TestRequestDetailPage = lazy(() => import("./pages/TestRequestDetailPage"));

const queryClient = new QueryClient();

function PageLoader() {
  return (
    <div className="flex items-center justify-center h-[60vh]">
      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
    </div>
  );
}

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
                    <Suspense fallback={<PageLoader />}>
                      <Routes>
                        <Route path="/" element={<DashboardPage />} />
                        <Route path="/tests" element={<SamplesPage />} />
                        <Route path="/tests/:id" element={<SamplesPage />} />
                        <Route path="/test-programs" element={<TestProgramsPage />} />
                        <Route path="/test-programs/:id" element={<TestProgramDetailPage />} />
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
                        <Route path="/test-requests" element={<TestRequestsPage />} />
                        <Route path="/test-requests/:id" element={<TestRequestDetailPage />} />
                        <Route path="/sops" element={<SOPsPage />} />
                        <Route path="/tasks" element={<TasksPage />} />
                        <Route path="/planning" element={<PlanningPage />} />
                        <Route path="/copilot" element={<CopilotPage />} />
                        <Route path="/admin/request-templates" element={<RequestTemplatesAdminPage />} />
                        <Route path="*" element={<NotFound />} />
                      </Routes>
                    </Suspense>
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
