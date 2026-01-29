import { useMemo } from "react";

interface PasswordRequirementsProps {
  password: string;
  show: boolean;
}

interface Requirement {
  label: string;
  met: boolean;
}

export function PasswordRequirements({ password, show }: PasswordRequirementsProps) {
  const requirements = useMemo((): Requirement[] => {
    return [{ label: "Minimum 8 znaków", met: password.length >= 8 }];
  }, [password]);

  if (!show) {
    return null;
  }

  return (
    <ul className="mt-2 space-y-1 text-sm" aria-label="Wymagania hasła">
      {requirements.map((req) => (
        <li
          key={req.label}
          className={`flex items-center gap-2 ${req.met ? "text-green-600" : "text-muted-foreground"}`}
        >
          <span aria-hidden="true">{req.met ? "✓" : "○"}</span>
          <span>
            {req.label}
            <span className="sr-only">{req.met ? " - spełnione" : " - niespełnione"}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}
