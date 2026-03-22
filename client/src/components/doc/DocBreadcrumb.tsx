import { Link } from "wouter";
import { ChevronRight } from "lucide-react";

export interface DocBreadcrumbProps {
  categoryName: string;
  categorySlug: string;
  articleTitle: string;
  firstArticleSlug?: string;
}

/**
 * Breadcrumb navigation for documentation pages.
 * Path: 文档 > {Category} > {Article Title}
 */
export function DocBreadcrumb({
  categoryName,
  categorySlug,
  articleTitle,
  firstArticleSlug,
}: DocBreadcrumbProps) {
  const categoryHref = firstArticleSlug
    ? `/docs/${categorySlug}/${firstArticleSlug}`
    : `/docs`;

  return (
    <nav aria-label="Breadcrumb" className="mb-4">
      <ol className="flex items-center gap-1 text-sm text-muted-foreground flex-wrap">
        <li>
          <Link
            href="/docs"
            className="hover:text-foreground transition-colors underline-offset-4 hover:underline"
          >
            文档
          </Link>
        </li>
        <li aria-hidden="true">
          <ChevronRight className="h-3.5 w-3.5" />
        </li>
        <li>
          <Link
            href={categoryHref}
            className="hover:text-foreground transition-colors underline-offset-4 hover:underline"
          >
            {categoryName}
          </Link>
        </li>
        <li aria-hidden="true">
          <ChevronRight className="h-3.5 w-3.5" />
        </li>
        <li>
          <span aria-current="page" className="text-foreground font-medium">
            {articleTitle}
          </span>
        </li>
      </ol>
    </nav>
  );
}

export default DocBreadcrumb;
