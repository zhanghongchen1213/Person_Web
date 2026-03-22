import { useEffect } from "react";
import { useLocation } from "wouter";
import type { DocNavItem } from "@/types/doc";

/**
 * Hook for keyboard navigation between doc articles.
 * Alt+ArrowLeft → previous article
 * Alt+ArrowRight → next article
 */
export function useDocKeyboardNav(
  prev: DocNavItem | null,
  next: DocNavItem | null
): void {
  const [, navigate] = useLocation();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;

      if (e.key === "ArrowLeft" && prev) {
        e.preventDefault();
        navigate(`/docs/${prev.categorySlug}/${prev.slug}`);
      }
      if (e.key === "ArrowRight" && next) {
        e.preventDefault();
        navigate(`/docs/${next.categorySlug}/${next.slug}`);
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [prev, next, navigate]);
}
