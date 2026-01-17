import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { AuthLayout } from "@/components/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Lock, AlertCircle, CheckCircle, XCircle } from "lucide-react";
import { z } from "zod";

const passwordSchema = z.object({
  password: z.string().min(8, "Mínimo de 8 caracteres"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "As senhas não coincidem",
  path: ["confirmPassword"],
});

interface Convite {
  id: string;
  email: string;
  nome: string;
  cargo: string;
  setor: string;
  role: string;
  expires_at: string;
  usado: boolean;
}

export default function AceitarConvite() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ password?: string; confirmPassword?: string }>({});
  const [success, setSuccess] = useState(false);
  const [convite, setConvite] = useState<Convite | null>(null);
  const [invalidToken, setInvalidToken] = useState(false);

  useEffect(() => {
    const checkToken = async () => {
      if (!token) {
        setInvalidToken(true);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("convites")
        .select("*")
        .eq("token", token)
        .maybeSingle();

      if (error || !data) {
        setInvalidToken(true);
        setLoading(false);
        return;
      }

      const conviteData = data as Convite;

      // Check if expired
      if (new Date(conviteData.expires_at) < new Date()) {
        setInvalidToken(true);
        setLoading(false);
        return;
      }

      // Check if already used
      if (conviteData.usado) {
        setInvalidToken(true);
        setLoading(false);
        return;
      }

      setConvite(conviteData);
      setLoading(false);
    };

    checkToken();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFieldErrors({});

    if (!convite) return;

    // Validate
    const result = passwordSchema.safeParse({ password, confirmPassword });
    if (!result.success) {
      const errors: { password?: string; confirmPassword?: string } = {};
      result.error.errors.forEach((err) => {
        if (err.path[0] === "password") errors.password = err.message;
        if (err.path[0] === "confirmPassword") errors.confirmPassword = err.message;
      });
      setFieldErrors(errors);
      return;
    }

    setSubmitting(true);

    // Create user with Supabase Auth
    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email: convite.email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: {
          nome: convite.nome,
        },
      },
    });

    if (signUpError) {
      if (signUpError.message.includes("already registered")) {
        setError("Este e-mail já está cadastrado. Faça login.");
      } else {
        setError("Erro ao criar conta. Tente novamente.");
      }
      setSubmitting(false);
      return;
    }

    if (authData.user) {
      // Update profile with cargo and setor - cast to match enum types
      await supabase
        .from("profiles")
        .update({
          cargo: convite.cargo as "sdr" | "closer" | "gestor_trafego" | "social_media" | "financeiro",
          setor: convite.setor as "comercial" | "trafego" | "social_media" | "financeiro",
        })
        .eq("id", authData.user.id);

      // Update user role if admin
      if (convite.role === "admin") {
        await supabase
          .from("user_roles")
          .update({ role: "admin" })
          .eq("user_id", authData.user.id);
      }

      // Mark invite as used
      await supabase
        .from("convites")
        .update({ usado: true })
        .eq("id", convite.id);
    }

    setSuccess(true);
    setSubmitting(false);

    // Redirect after 2 seconds
    setTimeout(() => {
      navigate("/");
    }, 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (invalidToken) {
    return (
      <AuthLayout
        title="Convite inválido"
        subtitle="Este convite não existe, já foi usado ou expirou"
      >
        <div className="space-y-6">
          <div className="flex items-center justify-center">
            <div className="p-4 rounded-full bg-destructive/10">
              <XCircle className="h-12 w-12 text-destructive" />
            </div>
          </div>

          <p className="text-center text-sm text-muted-foreground">
            Entre em contato com o administrador para solicitar um novo convite.
          </p>

          <Link to="/login">
            <Button variant="secondary" className="w-full">
              Ir para login
            </Button>
          </Link>
        </div>
      </AuthLayout>
    );
  }

  if (success) {
    return (
      <AuthLayout
        title="Conta criada!"
        subtitle="Você será redirecionado para o dashboard"
      >
        <div className="flex items-center justify-center py-8">
          <div className="p-4 rounded-full bg-success/10">
            <CheckCircle className="h-12 w-12 text-success" />
          </div>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Aceitar convite"
      subtitle={`Bem-vindo(a), ${convite?.nome}! Crie sua senha para acessar.`}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="p-3 rounded-lg bg-primary/10 text-sm">
          <p className="text-muted-foreground">
            E-mail: <span className="text-foreground font-medium">{convite?.email}</span>
          </p>
        </div>

        <div className="space-y-2">
          <label htmlFor="password" className="text-sm font-medium text-foreground">
            Criar senha
          </label>
          <Input
            id="password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            icon={<Lock className="h-4 w-4" />}
            disabled={submitting}
          />
          {fieldErrors.password && (
            <p className="text-xs text-destructive">{fieldErrors.password}</p>
          )}
        </div>

        <div className="space-y-2">
          <label htmlFor="confirmPassword" className="text-sm font-medium text-foreground">
            Confirmar senha
          </label>
          <Input
            id="confirmPassword"
            type="password"
            placeholder="••••••••"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            icon={<Lock className="h-4 w-4" />}
            disabled={submitting}
          />
          {fieldErrors.confirmPassword && (
            <p className="text-xs text-destructive">{fieldErrors.confirmPassword}</p>
          )}
        </div>

        <Button type="submit" className="w-full" disabled={submitting}>
          {submitting ? <LoadingSpinner size="sm" /> : "Criar conta"}
        </Button>
      </form>
    </AuthLayout>
  );
}
