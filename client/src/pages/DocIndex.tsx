import { Link } from "wouter";
import { FileText, FolderOpen, Loader2 } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import { getDocTree } from "@/lib/staticContent";
import { buildCanonical, createCollectionPageJsonLd } from "@/lib/seo";

/**
 * DocIndex page - displays all doc categories as overview cards.
 * Route: /docs
 */
export default function DocIndex() {
  const docTree = getDocTree();
  const isLoading = false;

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <SEOHead
        title="文档"
        description="浏览全部技术文档分类与教程内容。"
        pathname="/docs"
        jsonLd={createCollectionPageJsonLd({
          name: "文档中心",
          description: "技术文档分类与教程列表。",
          url: buildCanonical("/docs"),
          totalItems: docTree?.reduce((sum, item) => sum + item.articles.length, 0) || 0,
        })}
      />
      <Navbar />
      <main className="flex-1 pt-16 md:pt-20">
        <div className="container max-w-4xl py-12 px-4">
          {/* Page header */}
          <header className="mb-10">
            <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-4">
              文档
            </h1>
            <p className="text-lg text-muted-foreground">
              浏览所有技术文档分类
            </p>
          </header>

          {/* Loading state */}
          {isLoading && (
            <div className="flex items-center justify-center min-h-[30vh]">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
          )}

          {/* Empty state */}
          {!isLoading && (!docTree || docTree.length === 0) && (
            <div className="text-center py-20">
              <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground text-lg">暂无文档</p>
            </div>
          )}

          {/* Category cards */}
          {!isLoading && docTree && docTree.length > 0 && (
            <div className="grid gap-6 sm:grid-cols-2">
              {docTree.map((tree) => {
                const firstArticle = tree.articles[0];
                const hasArticles = tree.articles.length > 0;

                const CardContent = (
                  <div className="flex items-start gap-3">
                    <FolderOpen className="h-6 w-6 shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <h2 className="text-xl font-bold mb-1 group-hover:underline">
                        {tree.category.name}
                      </h2>
                      {tree.category.description && (
                        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                          {tree.category.description}
                        </p>
                      )}
                      <span className="inline-block text-xs font-bold uppercase tracking-wider px-2 py-1 bg-primary text-primary-foreground">
                        {tree.articles.length} 篇文档
                      </span>
                    </div>
                  </div>
                );

                return hasArticles ? (
                  <Link
                    key={tree.category.id}
                    href={`/docs/${tree.category.slug}/${firstArticle.slug}`}
                    className="group block border-2 border-border p-6 hover:bg-muted transition-colors"
                  >
                    {CardContent}
                  </Link>
                ) : (
                  <div
                    key={tree.category.id}
                    className="block border-2 border-border p-6 opacity-60 cursor-not-allowed"
                  >
                    {CardContent}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
