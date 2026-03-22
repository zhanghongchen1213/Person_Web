/**
 * Estimate reading time for an article.
 * Uses ~400 chars/min for CJK text, ~200 words/min for Latin text.
 * Strips Markdown syntax before counting.
 */
export function estimateReadingTime(content: string): number {
  if (!content) return 0;

  // Strip common Markdown syntax
  const stripped = content
    .replace(/```[\s\S]*?```/g, "")        // code blocks
    .replace(/`[^`]*`/g, "")              // inline code
    .replace(/<[^>]+>/g, "")              // HTML tags
    .replace(/!\[.*?\]\(.*?\)/g, "")      // images
    .replace(/\[([^\]]*)\]\(.*?\)/g, "$1") // links → text
    .replace(/#{1,6}\s/g, "")             // headings
    .replace(/(\*{1,3}|_{1,3})(.*?)\1/g, "$2") // bold/italic → inner text
    .replace(/~~(.*?)~~/g, "$1")          // strikethrough → inner text
    .replace(/^>\s?/gm, "")              // blockquotes
    .replace(/^[-*+]\s/gm, "")           // unordered list markers
    .replace(/^\d+\.\s/gm, "")           // ordered list markers
    .replace(/^---+$/gm, "")             // horizontal rules
    .trim();

  // Count CJK characters (Chinese, Japanese, Korean)
  const cjkChars = (stripped.match(/[\u4e00-\u9fff\u3400-\u4dbf\u3040-\u309f\u30a0-\u30ff\uac00-\ud7af]/g) || []).length;

  // Count Latin words (remaining after removing CJK)
  const latinText = stripped.replace(/[\u4e00-\u9fff\u3400-\u4dbf\u3040-\u309f\u30a0-\u30ff\uac00-\ud7af]/g, " ").trim();
  const latinWords = latinText ? latinText.split(/\s+/).filter(Boolean).length : 0;

  // CJK: ~400 chars/min, Latin: ~200 words/min
  const minutes = (cjkChars / 400) + (latinWords / 200);

  return Math.max(1, Math.round(minutes));
}
