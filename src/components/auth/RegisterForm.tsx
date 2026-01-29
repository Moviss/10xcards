import { useId, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthForm } from "@/lib/hooks/useAuthForm";
import { registerSchema } from "@/lib/schemas/auth.schema";
import { PasswordRequirements } from "./PasswordRequirements";

interface RegisterFormProps {
  redirectUrl?: string;
}

export function RegisterForm({ redirectUrl = "/generator" }: RegisterFormProps) {
  const emailId = useId();
  const passwordId = useId();
  const emailErrorId = useId();
  const passwordErrorId = useId();

  const [showPasswordRequirements, setShowPasswordRequirements] = useState(false);

  const { formData, errors, isSubmitting, handleChange, handleSubmit } = useAuthForm({
    schema: registerSchema,
    submitUrl: "/api/auth/register",
    redirectUrl,
  });

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      {errors.general && (
        <div
          role="alert"
          className="rounded-md border border-destructive bg-destructive/10 p-3 text-sm text-destructive"
        >
          {errors.general}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor={emailId}>Email</Label>
        <Input
          id={emailId}
          type="email"
          autoComplete="email"
          placeholder="twoj@email.com"
          value={formData.email}
          onChange={(e) => handleChange("email", e.target.value)}
          aria-invalid={!!errors.email}
          aria-describedby={errors.email ? emailErrorId : undefined}
        />
        {errors.email && (
          <p id={emailErrorId} className="text-sm text-destructive">
            {errors.email}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor={passwordId}>Hasło</Label>
        <Input
          id={passwordId}
          type="password"
          autoComplete="new-password"
          placeholder="Minimum 8 znaków"
          value={formData.password}
          onChange={(e) => handleChange("password", e.target.value)}
          onFocus={() => setShowPasswordRequirements(true)}
          onBlur={() => setShowPasswordRequirements(false)}
          aria-invalid={!!errors.password}
          aria-describedby={errors.password ? passwordErrorId : undefined}
        />
        <PasswordRequirements
          password={formData.password}
          show={showPasswordRequirements || formData.password.length > 0}
        />
        {errors.password && (
          <p id={passwordErrorId} className="text-sm text-destructive">
            {errors.password}
          </p>
        )}
      </div>

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Rejestracja..." : "Zarejestruj się"}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        Masz już konto?{" "}
        <a href="/login" className="text-primary underline-offset-4 hover:underline">
          Zaloguj się
        </a>
      </p>
    </form>
  );
}
