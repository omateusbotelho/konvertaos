import { ReactNode } from "react";
import konvertaLogo from "@/assets/konverta-logo.png";

interface AuthLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
}

export function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-background flex">
      {/* Left side - Form */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <img src={konvertaLogo} alt="Konverta" className="h-8" />
          </div>

          {/* Card */}
          <div className="bg-card border border-border/20 rounded-xl p-8">
            <div className="text-center mb-6">
              <h1 className="text-2xl font-semibold text-foreground">{title}</h1>
              {subtitle && (
                <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>
              )}
            </div>
            {children}
          </div>

          {/* Footer */}
          <p className="mt-8 text-center text-xs text-muted-foreground">
            © {new Date().getFullYear()} Konverta. Todos os direitos reservados.
          </p>
        </div>
      </div>

      {/* Right side - Visual panel (hidden on mobile) */}
      <div className="hidden lg:flex lg:flex-1 relative overflow-hidden">
        {/* Gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-violet via-accent to-lavender" />
        
        {/* Decorative elements */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-white/5 blur-2xl" />
        </div>

        {/* Grid pattern overlay */}
        <div 
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                              linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: '40px 40px'
          }}
        />

        {/* Content */}
        <div className="relative z-10 flex flex-col items-center justify-center p-12 text-white">
          <div className="max-w-md text-center">
            <h2 className="text-4xl font-bold mb-4 leading-tight">
              Gestão completa para sua agência
            </h2>
            <p className="text-lg text-white/80 leading-relaxed">
              Leads, projetos, tarefas e financeiro em um só lugar. 
              Simplifique sua operação e foque no que importa.
            </p>
          </div>

          {/* Stats */}
          <div className="mt-12 flex gap-8">
            <div className="text-center">
              <div className="text-3xl font-bold">+500</div>
              <div className="text-sm text-white/70">Agências</div>
            </div>
            <div className="w-px bg-white/20" />
            <div className="text-center">
              <div className="text-3xl font-bold">10k+</div>
              <div className="text-sm text-white/70">Leads gerenciados</div>
            </div>
            <div className="w-px bg-white/20" />
            <div className="text-center">
              <div className="text-3xl font-bold">99%</div>
              <div className="text-sm text-white/70">Uptime</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
