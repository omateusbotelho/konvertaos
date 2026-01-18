import { ReactNode } from "react";

interface InstallStepProps {
  step: number;
  children: ReactNode;
}

export function InstallStep({ step, children }: InstallStepProps) {
  return (
    <li className="flex items-center gap-2">
      <span className="w-5 h-5 rounded-full bg-muted flex items-center justify-center text-xs">
        {step}
      </span>
      {children}
    </li>
  );
}
