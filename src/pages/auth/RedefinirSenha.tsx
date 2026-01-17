import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { AuthLayout } from "@/components/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Lock, AlertCircle, CheckCircle } from "lucide-react";
import { z } from "zod";

const passwordSchema = z.object({
  password: z.string().min(8, "Mínimo de 8 caracteres"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "As senhas não coincidem",
  path: ["confirmPassword"],
});

export default function RedefinirSenha() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ password?: string; confirmPassword?: string }>({});
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    // Check if we have access to reset password
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        // User can now reset password
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFieldErrors({});

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

    setLoading(true);

    const { error: updateError } = await supabase.auth.updateUser({
      password,
    });

    if (updateError) {
      setError("Erro ao redefinir senha. Tente novamente.");
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);

    // Redirect after 2 seconds
    setTimeout(() => {
      navigate("/login");
    }, 2000);
  };

  if (success) {
    return (
      <AuthLayout
        title="Senha redefinida!"
        subtitle="Você será redirecionado para o login"
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
      title="Redefinir senha"
      subtitle="Digite sua nova senha"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="space-y-2">
          <label htmlFor="password" className="text-sm font-medium text-foreground">
            Nova senha
          </label>
          <Input
            id="password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            icon={<Lock className="h-4 w-4" />}
            disabled={loading}
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
            disabled={loading}
          />
          {fieldErrors.confirmPassword && (
            <p className="text-xs text-destructive">{fieldErrors.confirmPassword}</p>
          )}
        </div>

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? <LoadingSpinner size="sm" /> : "Redefinir senha"}
        </Button>
      </form>
    </AuthLayout>
  );
}
