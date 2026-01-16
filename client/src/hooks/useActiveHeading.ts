import { useState, useEffect, useCallback } from "react";
import type { TocItem } from "@/types/doc";

/**
 * Hook to track which heading is currently in view
 * Uses Intersection Observer for efficient scroll tracking
 */
export function useActiveHeading(headings: TocItem[]): string {
  const [activeId, setActiveId] = useState<string>("");

  useEffect(() => {
    if (headings.length === 0) return;

    // Set initial active heading from URL hash or first heading
    const hash = window.location.hash.slice(1);
    if (hash && headings.some((h) => h.id === hash)) {
      setActiveId(hash);
    } else if (headings.length > 0) {
      setActiveId(headings[0].id);
    }

    const observer = new IntersectionObserver(
      (entries) => {
        // Find the first visible heading
        const visibleEntries = entries.filter((entry) => entry.isIntersecting);
        if (visibleEntries.length > 0) {
          // Sort by position and get the topmost visible heading
          const topEntry = visibleEntries.reduce((prev, curr) => {
            return prev.boundingClientRect.top < curr.boundingClientRect.top
              ? prev
              : curr;
          });
          setActiveId(topEntry.target.id);
        }
      },
      {
        rootMargin: "-80px 0px -80% 0px",
        threshold: 0,
      }
    );

    // Observe all heading elements
    headings.forEach((heading) => {
      const element = document.getElementById(heading.id);
      if (element) {
        observer.observe(element);
      }
    });

    return () => observer.disconnect();
  }, [headings]);

  return activeId;
}

export default useActiveHeading;
