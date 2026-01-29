import { useState, useCallback } from "react";
import type { z } from "zod";

interface UseAuthFormOptions<T extends z.ZodType> {
  schema: T;
  submitUrl: string;
  onSuccess: () => void;
}

interface FormErrors {
  [key: string]: string | undefined;
  general?: string;
}

export function useAuthForm<T extends z.ZodType>({ schema, submitUrl, onSuccess }: UseAuthFormOptions<T>) {
  type FormData = z.infer<T>;

  const [formData, setFormData] = useState<FormData>({ email: "", password: "" } as FormData);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = useCallback((field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  }, []);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setErrors({});

      const result = schema.safeParse(formData);
      if (!result.success) {
        const fieldErrors: FormErrors = {};
        result.error.errors.forEach((err) => {
          const field = err.path[0] as string;
          fieldErrors[field] = err.message;
        });
        setErrors(fieldErrors);
        return;
      }

      setIsSubmitting(true);
      try {
        const response = await fetch(submitUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });

        if (!response.ok) {
          const errorData = await response.json();
          const errorMessage = errorData.error || "Wystąpił błąd";

          if (response.status === 409) {
            setErrors({ email: "Ten adres email jest już zarejestrowany" });
          } else if (response.status === 401) {
            setErrors({ general: "Nieprawidłowy email lub hasło" });
          } else {
            setErrors({ general: errorMessage });
          }
          return;
        }

        onSuccess();
      } catch {
        setErrors({ general: "Nie można połączyć z serwerem. Spróbuj ponownie." });
      } finally {
        setIsSubmitting(false);
      }
    },
    [formData, schema, submitUrl, onSuccess]
  );

  return {
    formData,
    errors,
    isSubmitting,
    handleChange,
    handleSubmit,
  };
}
