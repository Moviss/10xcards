import { useId, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthForm } from "@/lib/hooks/useAuthForm";
import { loginSchema } from "@/lib/schemas/auth.schema";

interface LoginFormProps {
  redirectUrl?: string;
}

export function LoginForm({ redirectUrl = "/generator" }: LoginFormProps) {
  const emailId = useId();
  const passwordId = useId();
  const emailErrorId = useId();
  const passwordErrorId = useId();

  const handleSuccess = useCallback(() => {
    window.location.href = redirectUrl;
  }, [redirectUrl]);

  const { formData, errors, isSubmitting, handleChange, handleSubmit } = useAuthForm({
    schema: loginSchema,
    submitUrl: "/api/auth/login",
    onSuccess: handleSuccess,
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
          autoComplete="current-password"
          placeholder="Twoje hasło"
          value={formData.password}
          onChange={(e) => handleChange("password", e.target.value)}
          aria-invalid={!!errors.password}
          aria-describedby={errors.password ? passwordErrorId : undefined}
        />
        {errors.password && (
          <p id={passwordErrorId} className="text-sm text-destructive">
            {errors.password}
          </p>
        )}
      </div>

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Logowanie..." : "Zaloguj się"}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        Nie masz konta?{" "}
        <a href="/register" className="text-primary underline-offset-4 hover:underline">
          Zarejestruj się
        </a>
      </p>
    </form>
  );
}
