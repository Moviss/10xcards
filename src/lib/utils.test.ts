import { describe, it, expect } from "vitest";
import { cn } from "./utils";

describe("cn utility", () => {
  it("should merge class names", () => {
    const result = cn("px-2", "py-1");
    expect(result).toBe("px-2 py-1");
  });

  it("should handle conditional classes", () => {
    const isActive = true;
    const result = cn("base", isActive && "active");
    expect(result).toBe("base active");
  });

  it("should handle falsy values", () => {
    const result = cn("base", false, null, undefined, "end");
    expect(result).toBe("base end");
  });

  it("should merge conflicting tailwind classes", () => {
    const result = cn("px-2", "px-4");
    expect(result).toBe("px-4");
  });

  it("should handle object syntax", () => {
    const result = cn("base", { active: true, disabled: false });
    expect(result).toBe("base active");
  });

  it("should handle array syntax", () => {
    const result = cn(["px-2", "py-1"]);
    expect(result).toBe("px-2 py-1");
  });
});
