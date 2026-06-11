import { describe, it, expect } from "vitest";
import { cn } from "./utils";

describe("utils - cn (className merge)", () => {
  it("should merge simple class names", () => {
    const result = cn("p-1", "p-2");
    // Should use tailwind-merge to prefer the last value, so "p-2" wins
    expect(result).toContain("p-2");
  });

  it("should handle conditional classes", () => {
    const result = cn(
      "px-2",
      "py-1",
      // eslint-disable-next-line no-constant-binary-expression
      true && "text-red-500",
      // eslint-disable-next-line no-constant-binary-expression
      false && "text-blue-500"
    );
    expect(result).toContain("px-2");
    expect(result).toContain("py-1");
    expect(result).toContain("text-red-500");
    expect(result).not.toContain("text-blue-500");
  });

  it("should merge conflicting Tailwind classes (tailwind-merge behavior)", () => {
    const result = cn("px-2", "px-4");
    // tailwind-merge should keep only px-4
    expect(result).toContain("px-4");
    expect(result).not.toContain("px-2");
  });

  it("should merge padding classes", () => {
    const result = cn("p-2", "pt-4");
    // pt-4 is more specific, should be kept along with p-2
    expect(result).toContain("pt-4");
  });

  it("should handle empty strings and null values", () => {
    const result = cn("p-1", "", null, undefined, "m-1");
    expect(result).toContain("p-1");
    expect(result).toContain("m-1");
  });

  it("should handle arrays of classes", () => {
    const result = cn(["p-1", "m-1"], ["text-blue-500", "font-bold"]);
    expect(result).toContain("p-1");
    expect(result).toContain("m-1");
    expect(result).toContain("text-blue-500");
    expect(result).toContain("font-bold");
  });

  it("should handle objects with boolean values", () => {
    const result = cn({
      "p-1": true,
      "m-1": false,
      "text-red-500": true,
    });
    expect(result).toContain("p-1");
    expect(result).toContain("text-red-500");
    expect(result).not.toContain("m-1");
  });

  it("should prioritize later values in conflicts", () => {
    const result = cn("bg-red-500", "bg-blue-500", "bg-green-500");
    // tailwind-merge should keep only the last one
    expect(result).toContain("bg-green-500");
    expect(result).not.toContain("bg-red-500");
    expect(result).not.toContain("bg-blue-500");
  });

  it("should handle complex class scenarios", () => {
    const result = cn(
      "p-2 m-2",
      "flex justify-center",
      { "text-white": true, "text-black": false },
      ["rounded", "shadow"]
    );
    expect(result).toContain("p-2");
    expect(result).toContain("m-2");
    expect(result).toContain("flex");
    expect(result).toContain("justify-center");
    expect(result).toContain("text-white");
    expect(result).toContain("rounded");
    expect(result).toContain("shadow");
  });

  it("should return non-empty string", () => {
    const result = cn("p-1", "m-1");
    expect(typeof result).toBe("string");
    expect(result.length).toBeGreaterThan(0);
  });

  it("should handle no arguments", () => {
    const result = cn();
    expect(typeof result).toBe("string");
  });

  it("should handle single class", () => {
    const result = cn("p-4");
    expect(result).toContain("p-4");
  });

  it("should handle width and height conflicts", () => {
    const result = cn("w-full", "w-1/2");
    // Last value should win
    expect(result).toContain("w-1/2");
  });

  it("should handle display conflicts", () => {
    const result = cn("block", "flex", "inline");
    // Last value should win
    expect(result).toContain("inline");
  });

  it("should combine non-conflicting classes", () => {
    const result = cn("p-2", "text-center", "text-lg");
    expect(result).toContain("p-2");
    expect(result).toContain("text-center");
    expect(result).toContain("text-lg");
  });

  it("should handle opacity classes", () => {
    const result = cn("opacity-50", "opacity-75");
    // Last one should win
    expect(result).toContain("opacity-75");
    expect(result).not.toContain("opacity-50");
  });

  it("should handle transition classes", () => {
    const result = cn("transition", "duration-300", "ease-in");
    expect(result).toContain("transition");
    expect(result).toContain("duration-300");
    expect(result).toContain("ease-in");
  });
});
