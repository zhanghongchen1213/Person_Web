import { useEffect, useRef } from "react";
import { trpc } from "@/lib/trpc";

/**
 * @param path - page path
 * @param articleId - pass article id for article pages, omit for other pages
 * @param waitForId - set true to delay recording until articleId is available (for async article loads)
 */
export function usePageView(path: string, articleId?: number, waitForId = false) {
  const recordView = trpc.analytics.recordView.useMutation();
  const recorded = useRef(false);

  useEffect(() => {
    if (recorded.current) return;
    if (waitForId && !articleId) return;
    recorded.current = true;
    recordView.mutate({ articleId, path });
  }, [articleId, path]);
}
