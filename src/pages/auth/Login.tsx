import { useState, useCallback, useRef, useEffect } from "react";
import { useNavigate, Navigate, Link } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import { AuthLayout } from "@/components/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Mail, Lock, AlertCircle, WifiOff, Clock } from "lucide-react";
import { z } from "zod";

// Schema de validação robusto
const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "E-mail é obrigatório")
    .max(255, "E-mail deve ter no máximo 255 caracteres")
    .email("Formato de e-mail inválido")
    .refine(
      (val) => !val.includes("<") && !val.includes(">"),
      "E-mail contém caracteres inválidos"
    ),
  password: z
    .string()
    .min(1, "Senha é obrigatória")
    .max(128, "Senha deve ter no máximo 128 caracteres"),
});

type FieldErrors = { email?: string; password?: string };

// Timeout para requisições lentas (15 segundos)
const REQUEST_TIMEOUT = 15000;

// Mensagens de erro amigáveis
const ERROR_MESSAGES: Record<string, { message: string; icon: typeof AlertCircle }> = {
  INVALID_CREDENTIALS: {
    message: "E-mail ou senha incorretos. Verifique seus dados e tente novamente.",
    icon: AlertCircle,
  },
  EMAIL_NOT_CONFIRMED: {
    message: "E-mail não confirmado. Verifique sua caixa de entrada e clique no link de confirmação.",
    icon: Mail,
  },
  TIMEOUT: {
    message: "A conexão está demorando mais que o esperado. Verifique sua internet e tente novamente.",
    icon: Clock,
  },
  NETWORK_ERROR: {
    message: "Sem conexão com a internet. Verifique sua rede e tente novamente.",
    icon: WifiOff,
  },
  RATE_LIMITED: {
    message: "Muitas tentativas de login. Aguarde alguns minutos antes de tentar novamente.",
    icon: Clock,
  },
  GENERIC: {
    message: "Ocorreu um erro inesperado. Tente novamente em alguns instantes.",
    icon: AlertCircle,
  },
};

function getErrorType(error: { message: string } | null): keyof typeof ERROR_MESSAGES {
  if (!error) return "GENERIC";
  const msg = error.message.toLowerCase();
  
  if (msg.includes("invalid login credentials") || msg.includes("invalid_credentials")) {
    return "INVALID_CREDENTIALS";
  }
  if (msg.includes("email not confirmed") || msg.includes("email_not_confirmed")) {
    return "EMAIL_NOT_CONFIRMED";
  }
  if (msg.includes("rate limit") || msg.includes("too many requests")) {
    return "RATE_LIMITED";
  }
  if (msg.includes("timeout") || msg.includes("timed out")) {
    return "TIMEOUT";
  }
  if (msg.includes("network") || msg.includes("fetch") || msg.includes("failed to fetch")) {
    return "NETWORK_ERROR";
  }
  
  return "GENERIC";
}

export default function Login() {
  const { user, loading: authLoading, signIn } = useAuth();
  const navigate = useNavigate();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorType, setErrorType] = useState<keyof typeof ERROR_MESSAGES | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [touched, setTouched] = useState<{ email: boolean; password: boolean }>({ email: false, password: false });
  
  const abortControllerRef = useRef<AbortController | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Sanitiza input removendo espaços extras
  const sanitizeEmail = useCallback((value: string) => {
    return value.trim().toLowerCase();
  }, []);

  // Validação em tempo real (blur)
  const validateField = useCallback((field: "email" | "password", value: string) => {
    const testData = field === "email" 
      ? { email: value, password: "temp" } 
      : { email: "test@test.com", password: value };
    
    const result = loginSchema.safeParse(testData);
    
    if (!result.success) {
      const fieldError = result.error.errors.find((err) => err.path[0] === field);
      return fieldError?.message || null;
    }
    return null;
  }, []);

  const handleBlur = useCallback((field: "email" | "password") => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    
    const value = field === "email" ? email : password;
    if (value) {
      const error = validateField(field, value);
      setFieldErrors((prev) => ({ ...prev, [field]: error || undefined }));
    }
  }, [email, password, validateField]);

  const handleEmailChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEmail(value);
    setErrorType(null);
    
    // Limpa erro do campo se usuário começa a digitar
    if (fieldErrors.email) {
      setFieldErrors((prev) => ({ ...prev, email: undefined }));
    }
  }, [fieldErrors.email]);

  const handlePasswordChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPassword(value);
    setErrorType(null);
    
    if (fieldErrors.password) {
      setFieldErrors((prev) => ({ ...prev, password: undefined }));
    }
  }, [fieldErrors.password]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorType(null);
    setFieldErrors({});

    // Sanitiza email antes de validar
    const sanitizedEmail = sanitizeEmail(email);

    // Validação completa
    const result = loginSchema.safeParse({ email: sanitizedEmail, password });
    if (!result.success) {
      const errors: FieldErrors = {};
      result.error.errors.forEach((err) => {
        const field = err.path[0] as keyof FieldErrors;
        if (!errors[field]) {
          errors[field] = err.message;
        }
      });
      setFieldErrors(errors);
      return;
    }

    // Inicia loading
    setLoading(true);

    // Setup timeout
    abortControllerRef.current = new AbortController();
    
    const timeoutPromise = new Promise<{ error: { message: string } }>((resolve) => {
      timeoutRef.current = setTimeout(() => {
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
        }
        resolve({ error: { message: "timeout" } });
      }, REQUEST_TIMEOUT);
    });

    try {
      // Race entre login e timeout
      const loginPromise = signIn(sanitizedEmail, password);
      const { error: signInError } = await Promise.race([loginPromise, timeoutPromise]);

      // Limpa timeout se login completou primeiro
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      if (signInError) {
        setErrorType(getErrorType(signInError));
        setLoading(false);
        return;
      }

      navigate("/");
    } catch (err) {
      // Erro de rede ou outro erro inesperado
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      if (err instanceof Error && err.name === "AbortError") {
        setErrorType("TIMEOUT");
      } else {
        setErrorType("NETWORK_ERROR");
      }
      setLoading(false);
    }
  };

  // Estado de loading inicial (verificando autenticação)
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <LoadingSpinner size="lg" />
          <p className="text-sm text-muted-foreground animate-pulse">
            Verificando autenticação...
          </p>
        </div>
      </div>
    );
  }

  // Usuário já autenticado
  if (user) {
    return <Navigate to="/" replace />;
  }

  const currentError = errorType ? ERROR_MESSAGES[errorType] : null;
  const ErrorIcon = currentError?.icon || AlertCircle;

  return (
    <AuthLayout
      title="Entrar no KonvertaOS"
      subtitle="Acesse sua conta para continuar"
    >
      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        {/* Mensagem de erro global */}
        {currentError && (
          <div 
            role="alert"
            aria-live="assertive"
            className="flex items-start gap-3 p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive animate-in fade-in slide-in-from-top-2 duration-300"
          >
            <ErrorIcon className="h-5 w-5 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="text-sm font-medium block">{currentError.message}</span>
              {errorType === "INVALID_CREDENTIALS" && (
                <Link 
                  to="/recuperar-senha" 
                  className="text-xs underline underline-offset-2 hover:text-destructive/80 transition-colors"
                >
                  Esqueceu sua senha?
                </Link>
              )}
            </div>
          </div>
        )}

        {/* Campo de E-mail */}
        <div className="space-y-2">
          <label htmlFor="email" className="text-sm font-medium text-foreground">
            E-mail
          </label>
          <Input
            id="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            autoCapitalize="none"
            spellCheck={false}
            placeholder="seu@email.com"
            value={email}
            onChange={handleEmailChange}
            onBlur={() => handleBlur("email")}
            icon={<Mail className="h-4 w-4" />}
            disabled={loading}
            aria-invalid={!!fieldErrors.email}
            aria-describedby={fieldErrors.email ? "email-error" : undefined}
            className={fieldErrors.email ? "border-destructive focus-visible:ring-destructive" : ""}
          />
          {fieldErrors.email && (
            <p id="email-error" role="alert" className="text-xs text-destructive flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              {fieldErrors.email}
            </p>
          )}
        </div>

        {/* Campo de Senha */}
        <div className="space-y-2">
          <label htmlFor="password" className="text-sm font-medium text-foreground">
            Senha
          </label>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            value={password}
            onChange={handlePasswordChange}
            onBlur={() => handleBlur("password")}
            icon={<Lock className="h-4 w-4" />}
            disabled={loading}
            aria-invalid={!!fieldErrors.password}
            aria-describedby={fieldErrors.password ? "password-error" : undefined}
            className={fieldErrors.password ? "border-destructive focus-visible:ring-destructive" : ""}
          />
          {fieldErrors.password && (
            <p id="password-error" role="alert" className="text-xs text-destructive flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              {fieldErrors.password}
            </p>
          )}
        </div>

        {/* Link de recuperação */}
        <div className="flex justify-end">
          <Link
            to="/recuperar-senha"
            className="text-sm text-primary hover:text-primary/90 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded"
          >
            Esqueci minha senha
          </Link>
        </div>

        {/* Botão de submit */}
        <Button 
          type="submit" 
          className="w-full h-11 text-base font-medium transition-all"
          disabled={loading}
          aria-busy={loading}
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <LoadingSpinner size="sm" />
              <span>Entrando...</span>
            </span>
          ) : (
            "Entrar"
          )}
        </Button>

        {/* Indicador de estado de loading longo */}
        {loading && (
          <p className="text-xs text-center text-muted-foreground animate-pulse">
            Conectando ao servidor...
          </p>
        )}
      </form>
    </AuthLayout>
  );
}
