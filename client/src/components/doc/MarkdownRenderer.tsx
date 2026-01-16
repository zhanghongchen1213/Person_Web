import { useEffect, useMemo } from "react";
import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import rehypeSlug from "rehype-slug";
import type { TocItem, MarkdownRendererProps } from "@/types/doc";
import { cn } from "@/lib/utils";

/**
 * Extract headings from markdown content for TOC generation
 */
function extractHeadings(content: string): TocItem[] {
  const headingRegex = /^(#{1,6})\s+(.+)$/gm;
  const headings: TocItem[] = [];
  let match;

  while ((match = headingRegex.exec(content)) !== null) {
    const level = match[1].length;
    const text = match[2].trim();
    // Generate slug matching rehype-slug behavior
    const id = text
      .toLowerCase()
      .replace(/[^\w\s\u4e00-\u9fa5-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");

    headings.push({ id, text, level });
  }

  return headings;
}

/**
 * MarkdownRenderer component with syntax highlighting and heading anchors
 * Uses react-markdown with rehype-highlight and rehype-slug plugins
 */
export function MarkdownRenderer({
  content,
  onHeadingsExtracted,
}: MarkdownRendererProps) {
  // Extract headings for TOC
  const headings = useMemo(() => extractHeadings(content), [content]);

  // Notify parent of extracted headings
  useEffect(() => {
    if (onHeadingsExtracted) {
      onHeadingsExtracted(headings);
    }
  }, [headings, onHeadingsExtracted]);

  return (
    <div className={cn("prose-brutalist max-w-none")}>
      <ReactMarkdown
        rehypePlugins={[rehypeHighlight, rehypeSlug]}
        components={{
          // Custom heading components with anchor links
          h1: ({ children, id, ...props }) => (
            <h1 id={id} className="group relative" {...props}>
              {children}
              <HeadingAnchor id={id} />
            </h1>
          ),
          h2: ({ children, id, ...props }) => (
            <h2 id={id} className="group relative" {...props}>
              {children}
              <HeadingAnchor id={id} />
            </h2>
          ),
          h3: ({ children, id, ...props }) => (
            <h3 id={id} className="group relative" {...props}>
              {children}
              <HeadingAnchor id={id} />
            </h3>
          ),
          h4: ({ children, id, ...props }) => (
            <h4 id={id} className="group relative" {...props}>
              {children}
              <HeadingAnchor id={id} />
            </h4>
          ),
          // Custom code block styling
          pre: ({ children, ...props }) => (
            <pre
              className="overflow-x-auto rounded-none border-2 border-border bg-muted p-4"
              {...props}
            >
              {children}
            </pre>
          ),
          // Custom inline code styling
          code: ({ className, children, ...props }) => {
            const isInline = !className;
            if (isInline) {
              return (
                <code
                  className="rounded-none bg-muted px-1.5 py-0.5 font-mono text-sm"
                  {...props}
                >
                  {children}
                </code>
              );
            }
            return (
              <code className={className} {...props}>
                {children}
              </code>
            );
          },
          // Custom link styling
          a: ({ href, children, ...props }) => (
            <a
              href={href}
              className="font-medium underline underline-offset-4 hover:text-primary"
              target={href?.startsWith("http") ? "_blank" : undefined}
              rel={href?.startsWith("http") ? "noopener noreferrer" : undefined}
              {...props}
            >
              {children}
            </a>
          ),
          // Custom image styling
          img: ({ src, alt, ...props }) => (
            <img
              src={src}
              alt={alt}
              className="border-2 border-border"
              loading="lazy"
              {...props}
            />
          ),
          // Custom blockquote styling
          blockquote: ({ children, ...props }) => (
            <blockquote
              className="border-l-4 border-primary bg-muted/50 pl-4 italic"
              {...props}
            >
              {children}
            </blockquote>
          ),
          // Custom table styling
          table: ({ children, ...props }) => (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border-2 border-border" {...props}>
                {children}
              </table>
            </div>
          ),
          th: ({ children, ...props }) => (
            <th
              className="border-2 border-border bg-muted px-4 py-2 text-left font-bold"
              {...props}
            >
              {children}
            </th>
          ),
          td: ({ children, ...props }) => (
            <td className="border-2 border-border px-4 py-2" {...props}>
              {children}
            </td>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

/**
 * Anchor link component for headings
 */
function HeadingAnchor({ id }: { id?: string }) {
  if (!id) return null;

  return (
    <a
      href={`#${id}`}
      className="ml-2 opacity-0 transition-opacity group-hover:opacity-100"
      aria-label="Link to this heading"
    >
      #
    </a>
  );
}

export default MarkdownRenderer;
