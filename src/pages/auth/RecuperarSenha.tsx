import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { AuthLayout } from "@/components/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Mail, AlertCircle, CheckCircle, ArrowLeft } from "lucide-react";
import { z } from "zod";

const emailSchema = z.object({
  email: z.string().email("E-mail inválido"),
});

export default function RecuperarSenha() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [fieldError, setFieldError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFieldError(null);

    // Validate
    const result = emailSchema.safeParse({ email });
    if (!result.success) {
      setFieldError(result.error.errors[0].message);
      return;
    }

    setLoading(true);

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/redefinir-senha`,
    });

    if (resetError) {
      setError("Erro ao enviar e-mail. Tente novamente.");
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
  };

  if (success) {
    return (
      <AuthLayout
        title="E-mail enviado!"
        subtitle="Verifique sua caixa de entrada"
      >
        <div className="space-y-6">
          <div className="flex items-center justify-center">
            <div className="p-4 rounded-full bg-success/10">
              <CheckCircle className="h-12 w-12 text-success" />
            </div>
          </div>

          <p className="text-center text-sm text-muted-foreground">
            Enviamos um link de recuperação para{" "}
            <span className="font-medium text-foreground">{email}</span>.
            Clique no link para redefinir sua senha.
          </p>

          <Link to="/login">
            <Button variant="secondary" className="w-full">
              <ArrowLeft className="h-4 w-4" />
              Voltar ao login
            </Button>
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Recuperar senha"
      subtitle="Digite seu e-mail para receber o link de recuperação"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="space-y-2">
          <label htmlFor="email" className="text-sm font-medium text-foreground">
            E-mail
          </label>
          <Input
            id="email"
            type="email"
            placeholder="seu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            icon={<Mail className="h-4 w-4" />}
            disabled={loading}
          />
          {fieldError && (
            <p className="text-xs text-destructive">{fieldError}</p>
          )}
        </div>

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? <LoadingSpinner size="sm" /> : "Enviar link"}
        </Button>

        <Link to="/login" className="block">
          <Button variant="ghost" className="w-full">
            <ArrowLeft className="h-4 w-4" />
            Voltar ao login
          </Button>
        </Link>
      </form>
    </AuthLayout>
  );
}
