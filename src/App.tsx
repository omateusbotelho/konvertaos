import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute, FinanceiroRoute } from "@/components/auth";

// Lazy loaded pages for code splitting
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Login = lazy(() => import("./pages/auth/Login"));
const RecuperarSenha = lazy(() => import("./pages/auth/RecuperarSenha"));
const RedefinirSenha = lazy(() => import("./pages/auth/RedefinirSenha"));
const AceitarConvite = lazy(() => import("./pages/auth/AceitarConvite"));
const Equipe = lazy(() => import("./pages/Equipe"));
const Perfil = lazy(() => import("./pages/Perfil"));
const PipelineSDR = lazy(() => import("./pages/comercial/PipelineSDR"));
const PipelineCloser = lazy(() => import("./pages/comercial/PipelineCloser"));
const LeadsFrios = lazy(() => import("./pages/comercial/LeadsFrios"));
const Clientes = lazy(() => import("./pages/clientes/Clientes"));
const ClienteDetalhes = lazy(() => import("./pages/clientes/ClienteDetalhes"));
const Tarefas = lazy(() => import("./pages/Tarefas"));
const Projetos = lazy(() => import("./pages/Projetos"));
const ProjetoDetalhes = lazy(() => import("./pages/ProjetoDetalhes"));
const OnboardingConfig = lazy(() => import("./pages/OnboardingConfig"));
const Calendario = lazy(() => import("./pages/Calendario"));
const Ausencias = lazy(() => import("./pages/Ausencias"));
const GerenciarAusencias = lazy(() => import("./pages/configuracoes/GerenciarAusencias"));
const Financeiro = lazy(() => import("./pages/financeiro/Financeiro"));
const Cobrancas = lazy(() => import("./pages/financeiro/Cobrancas"));
const Comissoes = lazy(() => import("./pages/financeiro/Comissoes"));
const Custos = lazy(() => import("./pages/financeiro/Custos"));
const Relatorios = lazy(() => import("./pages/financeiro/Relatorios"));
const MinhasComissoes = lazy(() => import("./pages/MinhasComissoes"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
    },
  },
});

// Loading fallback component
function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <LoadingSpinner size="lg" />
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
          <Suspense fallback={<PageLoader />}>
            <Routes>
              {/* Auth routes (public) */}
              <Route path="/login" element={<Login />} />
              <Route path="/recuperar-senha" element={<RecuperarSenha />} />
              <Route path="/redefinir-senha" element={<RedefinirSenha />} />
              <Route path="/convite/:token" element={<AceitarConvite />} />

              {/* Protected routes */}
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/equipe"
                element={
                  <ProtectedRoute requireAdmin>
                    <Equipe />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/perfil"
                element={
                  <ProtectedRoute>
                    <Perfil />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/comercial/sdr"
                element={
                  <ProtectedRoute>
                    <PipelineSDR />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/comercial/closer"
                element={
                  <ProtectedRoute>
                    <PipelineCloser />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/comercial/leads-frios"
                element={
                  <ProtectedRoute>
                    <LeadsFrios />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/clientes"
                element={
                  <ProtectedRoute>
                    <Clientes />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/clientes/:id"
                element={
                  <ProtectedRoute>
                    <ClienteDetalhes />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/tarefas"
                element={
                  <ProtectedRoute>
                    <Tarefas />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/projetos"
                element={
                  <ProtectedRoute>
                    <Projetos />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/projetos/:id"
                element={
                  <ProtectedRoute>
                    <ProjetoDetalhes />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/configuracoes/onboarding"
                element={
                  <ProtectedRoute requireAdmin>
                    <OnboardingConfig />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/calendario"
                element={
                  <ProtectedRoute>
                    <Calendario />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/ausencias"
                element={
                  <ProtectedRoute>
                    <Ausencias />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/configuracoes/ausencias"
                element={
                  <ProtectedRoute requireAdmin>
                    <GerenciarAusencias />
                  </ProtectedRoute>
                }
              />
              <Route path="/financeiro" element={<FinanceiroRoute><Financeiro /></FinanceiroRoute>} />
              <Route path="/financeiro/cobrancas" element={<FinanceiroRoute><Cobrancas /></FinanceiroRoute>} />
              <Route path="/financeiro/comissoes" element={<FinanceiroRoute><Comissoes /></FinanceiroRoute>} />
              <Route path="/financeiro/custos" element={<FinanceiroRoute><Custos /></FinanceiroRoute>} />
              <Route path="/financeiro/relatorios" element={<FinanceiroRoute><Relatorios /></FinanceiroRoute>} />
              <Route
                path="/minhas-comissoes"
                element={
                  <ProtectedRoute>
                    <MinhasComissoes />
                  </ProtectedRoute>
                }
              />

              {/* Catch-all */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
