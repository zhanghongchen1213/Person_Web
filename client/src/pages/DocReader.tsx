import { useState, useMemo, useCallback } from "react";
import { useParams } from "wouter";
import { Loader2 } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { trpc } from "@/lib/trpc";
import {
  DocLayout,
  DocSidebar,
  DocTOC,
  DocNavigation,
  MarkdownRenderer,
} from "@/components/doc";
import { useActiveHeading } from "@/hooks/useActiveHeading";
import type { TocItem, DocNavItem } from "@/types/doc";

/**
 * DocReader page component
 * Displays documentation with three-column layout
 */
export default function DocReader() {
  const params = useParams<{ category: string; slug: string }>();
  const categorySlug = params.category || "";
  const articleSlug = params.slug || "";

  // State for TOC headings
  const [headings, setHeadings] = useState<TocItem[]>([]);

  // Track active heading for TOC highlight
  const activeId = useActiveHeading(headings);

  // Fetch article data
  const {
    data: article,
    isLoading: articleLoading,
    error: articleError,
  } = trpc.article.bySlug.useQuery(
    { slug: articleSlug },
    { enabled: !!articleSlug }
  );

  // Fetch document tree for navigation
  const { data: docTree } = trpc.doc.tree.useQuery();

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
      <Loader2 className="w-8 h-8 animate-spin" />
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
    updatedAt: Date;
    category: { name: string; slug: string } | null;
  };
  navigation: { prev: DocNavItem | null; next: DocNavItem | null };
  onHeadingsExtracted: (headings: TocItem[]) => void;
}

function DocContent({
  article,
  navigation,
  onHeadingsExtracted,
}: DocContentProps) {
  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleDateString("zh-CN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <article>
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
interface DocTreeItem {
  category: { id: number; slug: string };
  articles: Array<{ slug: string; title: string }>;
}

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
