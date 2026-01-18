import { ReactNode } from "react";

interface InstallStepProps {
  step: number;
  children: ReactNode;
}

export function InstallStep({ step, children }: InstallStepProps) {
  return (
    <li className="flex items-center gap-3 py-1">
      <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-semibold flex-shrink-0">
        {step}
      </span>
      <span className="text-muted-foreground">{children}</span>
    </li>
  );
}
