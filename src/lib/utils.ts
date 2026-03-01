import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function slugifyDoi(doi: string): string {
  return doi.replace(/[^a-zA-Z0-9]/g, "-").toLowerCase();
}

export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength - 3) + "...";
}

export function formatAuthors(authors: unknown[]): string {
  if (!Array.isArray(authors) || authors.length === 0) return "Unknown";
  const names = authors.map((a: unknown) => {
    if (typeof a === "string") return a;
    if (typeof a === "object" && a !== null) {
      const obj = a as Record<string, unknown>;
      return (obj.name as string) || (obj.authorId as string) || "Unknown";
    }
    return "Unknown";
  });
  if (names.length <= 3) return names.join(", ");
  return `${names.slice(0, 3).join(", ")} et al.`;
}
