import { useState, useEffect } from "react";
import { Link } from "wouter";
import { ChevronRight, ChevronDown, FileText, FolderOpen } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import type { DocSidebarProps } from "@/types/doc";

/**
 * DocSidebar component for documentation navigation
 * Displays a collapsible tree of categories and articles
 */
export function DocSidebar({ currentSlug, onNavigate }: DocSidebarProps) {
  // Fetch document tree from API
  const { data: docTree, isLoading } = trpc.doc.tree.useQuery();

  // Track which categories are expanded
  const [expandedCategories, setExpandedCategories] = useState<Set<number>>(
    new Set()
  );

  // Auto-expand category containing current article
  useEffect(() => {
    if (docTree && currentSlug) {
      const categoryWithCurrentArticle = docTree.find((tree) =>
        tree.articles.some((article) => article.slug === currentSlug)
      );
      if (categoryWithCurrentArticle) {
        setExpandedCategories((prev) => {
          const next = new Set(prev);
          next.add(categoryWithCurrentArticle.category.id);
          return next;
        });
      }
    }
  }, [docTree, currentSlug]);

  const toggleCategory = (categoryId: number) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      return next;
    });
  };

  if (isLoading) {
    return (
      <div className="p-4">
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="h-6 bg-muted rounded w-3/4 mb-2" />
              <div className="ml-4 space-y-2">
                <div className="h-4 bg-muted rounded w-2/3" />
                <div className="h-4 bg-muted rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!docTree || docTree.length === 0) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">暂无文档</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <nav className="p-4" aria-label="Documentation navigation">
        <ul className="space-y-1">
          {docTree.map((tree) => (
            <CategoryItem
              key={tree.category.id}
              category={tree.category}
              articles={tree.articles}
              isExpanded={expandedCategories.has(tree.category.id)}
              onToggle={() => toggleCategory(tree.category.id)}
              currentSlug={currentSlug}
              onNavigate={onNavigate}
            />
          ))}
        </ul>
      </nav>
    </ScrollArea>
  );
}

/**
 * Category item with collapsible article list
 */
interface CategoryItemProps {
  category: {
    id: number;
    name: string;
    slug: string;
    description: string | null;
  };
  articles: Array<{
    id: number;
    title: string;
    slug: string;
    order: number;
  }>;
  isExpanded: boolean;
  onToggle: () => void;
  currentSlug: string;
  onNavigate?: (slug: string) => void;
}

function CategoryItem({
  category,
  articles,
  isExpanded,
  onToggle,
  currentSlug,
  onNavigate,
}: CategoryItemProps) {
  const hasArticles = articles.length > 0;

  return (
    <li>
      <Collapsible open={isExpanded} onOpenChange={onToggle}>
        <CollapsibleTrigger
          className={cn(
            "flex w-full items-center gap-2 rounded-none px-2 py-2",
            "text-sm font-bold uppercase tracking-wider",
            "hover:bg-muted transition-colors",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          )}
          disabled={!hasArticles}
        >
          {hasArticles ? (
            isExpanded ? (
              <ChevronDown className="h-4 w-4 shrink-0" />
            ) : (
              <ChevronRight className="h-4 w-4 shrink-0" />
            )
          ) : (
            <FolderOpen className="h-4 w-4 shrink-0 opacity-50" />
          )}
          <span className="truncate">{category.name}</span>
          {hasArticles && (
            <span className="ml-auto text-xs text-muted-foreground">
              {articles.length}
            </span>
          )}
        </CollapsibleTrigger>

        {hasArticles && (
          <CollapsibleContent>
            <ul className="ml-4 border-l-2 border-border pl-2 py-1 space-y-0.5">
              {articles.map((article) => (
                <ArticleItem
                  key={article.id}
                  article={article}
                  categorySlug={category.slug}
                  isActive={article.slug === currentSlug}
                  onNavigate={onNavigate}
                />
              ))}
            </ul>
          </CollapsibleContent>
        )}
      </Collapsible>
    </li>
  );
}

/**
 * Article item in the sidebar
 */
interface ArticleItemProps {
  article: {
    id: number;
    title: string;
    slug: string;
  };
  categorySlug: string;
  isActive: boolean;
  onNavigate?: (slug: string) => void;
}

function ArticleItem({
  article,
  categorySlug,
  isActive,
  onNavigate,
}: ArticleItemProps) {
  const handleClick = () => {
    if (onNavigate) {
      onNavigate(article.slug);
    }
  };

  return (
    <li>
      <Link
        href={`/docs/${categorySlug}/${article.slug}`}
        onClick={handleClick}
        className={cn(
          "flex items-center gap-2 px-2 py-1.5 text-sm",
          "hover:bg-muted transition-colors rounded-none",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          isActive && "bg-primary text-primary-foreground font-medium"
        )}
      >
        <FileText className="h-3.5 w-3.5 shrink-0" />
        <span className="truncate">{article.title}</span>
      </Link>
    </li>
  );
}

export default DocSidebar;
