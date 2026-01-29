import { Button } from "@/components/ui/button";

export function CTAButtons() {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
      <Button asChild size="lg">
        <a href="/login">Zaloguj się</a>
      </Button>
      <Button asChild variant="outline" size="lg">
        <a href="/register">Zarejestruj się</a>
      </Button>
    </div>
  );
}
