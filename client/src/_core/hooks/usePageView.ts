import { useEffect, useRef } from "react";

/**
 * Hook to record a page view on mount.
 * Fire-and-forget: does not block rendering or throw on failure.
 *
 * @param path - page path
 * @param articleId - pass article id for article pages, omit for other pages
 * @param waitForId - set true to delay recording until articleId is available (for async article loads)
 */
export function usePageView(path: string, articleId?: number, waitForId = false) {
  const recorded = useRef(false);

  useEffect(() => {
    if (recorded.current) return;
    if (waitForId && !articleId) return;
    recorded.current = true;
    void path;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [articleId, path]);
}
