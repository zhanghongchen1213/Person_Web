import { useState, useMemo, useCallback } from "react";
import { useParams } from "wouter";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { getDocBySlug, getDocTree } from "@/lib/staticContent";
import {
  DocLayout,
  DocSidebar,
  DocTOC,
  DocNavigation,
  MarkdownRenderer,
  DocBreadcrumb,
} from "@/components/doc";
import { useActiveHeading } from "@/hooks/useActiveHeading";
import { useDocKeyboardNav } from "@/hooks/useDocKeyboardNav";
import type { TocItem, DocNavItem, DocTreeItem } from "@/types/doc";

/**
 * DocReader page component
 * Displays documentation with three-column layout
 */
export default function DocReader() {
  const params = useParams<{ category: string; slug: string }>();
  const articleSlug = params.slug || "";

  // State for TOC headings
  const [headings, setHeadings] = useState<TocItem[]>([]);

  // Track active heading for TOC highlight
  const activeId = useActiveHeading(headings);

  // Fetch article data
  const article = getDocBySlug(articleSlug);
  const articleLoading = false;
  const articleError = null;

  // Fetch document tree for navigation
  const docTree = getDocTree();

  // Handle headings extraction from markdown
  const handleHeadingsExtracted = useCallback((extractedHeadings: TocItem[]) => {
    setHeadings(extractedHeadings);
  }, []);

  // Calculate prev/next navigation
  const navigation = useMemo(() => {
    if (!docTree || !articleSlug) {
      return { prev: null, next: null };
    }
    return calculateNavigation(docTree, articleSlug);
  }, [docTree, articleSlug]);

  // Enable keyboard navigation
  useDocKeyboardNav(navigation.prev, navigation.next);

  // Loading state
  if (articleLoading) {
    return (
      <DocReaderShell>
        <LoadingState />
      </DocReaderShell>
    );
  }

  // Error state
  if (articleError || !article) {
    return (
      <DocReaderShell>
        <ErrorState />
      </DocReaderShell>
    );
  }

  return (
    <DocReaderShell>
      <DocLayout
        sidebar={<DocSidebar currentSlug={articleSlug} />}
        content={
          <DocContent
            article={article}
            navigation={navigation}
            onHeadingsExtracted={handleHeadingsExtracted}
            docTree={docTree}
          />
        }
        toc={<DocTOC headings={headings} activeId={activeId} />}
      />
    </DocReaderShell>
  );
}

/**
 * Shell component with Navbar and Footer
 */
function DocReaderShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Navbar />
      <div className="flex-1 pt-16 md:pt-20">{children}</div>
      <Footer />
    </div>
  );
}

/**
 * Loading state component
 */
function LoadingState() {
  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <p className="text-muted-foreground">加载中...</p>
    </div>
  );
}

/**
 * Error state component
 */
function ErrorState() {
  return (
    <div className="container py-20 text-center">
      <h1 className="text-4xl md:text-5xl font-black mb-4">404</h1>
      <p className="text-muted-foreground text-lg mb-8">文档不存在</p>
      <a href="/docs" className="brutalist-btn">
        返回文档列表
      </a>
    </div>
  );
}

/**
 * Document content component
 */
interface DocContentProps {
  article: {
    id: number;
    title: string;
    content: string;
    updatedAt: Date | string;
    category: { name: string; slug: string } | null;
  };
  navigation: { prev: DocNavItem | null; next: DocNavItem | null };
  onHeadingsExtracted: (headings: TocItem[]) => void;
  docTree?: Array<{
    category: { slug: string };
    articles: Array<{ slug: string }>;
  }>;
}

function DocContent({
  article,
  navigation,
  onHeadingsExtracted,
  docTree,
}: DocContentProps) {
  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleDateString("zh-CN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Find first article slug in current category for breadcrumb
  const firstArticleSlug = docTree
    ?.find((tree) => tree.category.slug === article.category?.slug)
    ?.articles[0]?.slug;

  return (
    <article>
      {/* Breadcrumb */}
      {article.category && (
        <DocBreadcrumb
          categoryName={article.category.name}
          categorySlug={article.category.slug}
          articleTitle={article.title}
          firstArticleSlug={firstArticleSlug}
        />
      )}

      {/* Header */}
      <header className="mb-8 pb-6 border-b-2 border-border">
        {article.category && (
          <span className="inline-block text-xs font-bold uppercase tracking-wider px-2 py-1 bg-primary text-primary-foreground mb-4">
            {article.category.name}
          </span>
        )}
        <h1 className="text-3xl md:text-4xl font-black tracking-tight mb-4">
          {article.title}
        </h1>
        <p className="text-sm text-muted-foreground">
          Last updated: {formatDate(article.updatedAt)}
        </p>
      </header>

      {/* Content */}
      <div className="min-h-[50vh]">
        <MarkdownRenderer
          content={article.content}
          onHeadingsExtracted={onHeadingsExtracted}
        />
      </div>

      {/* Navigation */}
      <DocNavigation prev={navigation.prev} next={navigation.next} />
    </article>
  );
}

/**
 * Calculate prev/next navigation from document tree
 */
function calculateNavigation(
  docTree: DocTreeItem[],
  currentSlug: string
): { prev: DocNavItem | null; next: DocNavItem | null } {
  // Flatten all articles with category info
  const allArticles: DocNavItem[] = [];

  for (const tree of docTree) {
    for (const article of tree.articles) {
      allArticles.push({
        slug: article.slug,
        title: article.title,
        categorySlug: tree.category.slug,
      });
    }
  }

  // Find current article index
  const currentIndex = allArticles.findIndex((a) => a.slug === currentSlug);

  if (currentIndex === -1) {
    return { prev: null, next: null };
  }

  return {
    prev: currentIndex > 0 ? allArticles[currentIndex - 1] : null,
    next:
      currentIndex < allArticles.length - 1
        ? allArticles[currentIndex + 1]
        : null,
  };
}
