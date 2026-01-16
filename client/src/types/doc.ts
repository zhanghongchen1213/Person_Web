/**
 * Document-related type definitions for the documentation reader
 */

/**
 * Table of contents item extracted from markdown headings
 */
export interface TocItem {
  id: string;
  text: string;
  level: number;
}

/**
 * Document navigation item for prev/next navigation
 */
export interface DocNavItem {
  slug: string;
  title: string;
  categorySlug: string;
}

/**
 * Props for the DocSidebar component
 */
export interface DocSidebarProps {
  currentSlug: string;
  onNavigate?: (slug: string) => void;
}

/**
 * Props for the DocTOC component
 */
export interface DocTOCProps {
  headings: TocItem[];
  activeId: string;
}

/**
 * Props for the MarkdownRenderer component
 */
export interface MarkdownRendererProps {
  content: string;
  onHeadingsExtracted?: (headings: TocItem[]) => void;
}
