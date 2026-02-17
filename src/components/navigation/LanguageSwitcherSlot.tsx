interface LanguageSwitcherSlotProps {
  isI18nMvpEnabled: boolean;
  placement: "desktop" | "mobile";
}

export function LanguageSwitcherSlot({ isI18nMvpEnabled, placement }: LanguageSwitcherSlotProps) {
  if (!isI18nMvpEnabled) {
    return null;
  }

  return (
    <div
      data-testid={`language-switcher-slot-${placement}`}
      data-slot="language-switcher"
      aria-hidden="true"
      className="h-8 min-w-24 rounded-md border border-dashed border-border px-2"
    />
  );
}
