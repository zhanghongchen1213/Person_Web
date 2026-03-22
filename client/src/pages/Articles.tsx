import SEOHead from "@/components/SEOHead";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ArticleCard from "@/components/ArticleCard";
import { getCategories, getCategoryCounts, listArticles } from "@/lib/staticContent";
import { useLocation, useSearch } from "wouter";
import { Loader2, Filter, X } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { usePageView } from "@/_core/hooks/usePageView";

type ContentType = "blog" | "doc";

const VALID_TYPES: ReadonlySet<string> = new Set(["blog", "doc"]);

function parseContentType(value: string | null): ContentType | "" {
  return value && VALID_TYPES.has(value) ? (value as ContentType) : "";
}

function parsePage(value: string | null): number {
  const n = Number(value);
  return Number.isInteger(n) && n >= 1 ? n : 1;
}

export default function Articles() {
  usePageView("/articles");
  const search = useSearch();
  const [, setLocation] = useLocation();
  const params = new URLSearchParams(search);

  const [selectedCategory, setSelectedCategory] = useState(params.get("category") || "");
  const [selectedType, setSelectedType] = useState<ContentType | "">(
    parseContentType(params.get("type"))
  );
  const [searchInput, setSearchInput] = useState(params.get("search") || "");
  const [searchQuery, setSearchQuery] = useState(params.get("search") || "");
  const [page, setPage] = useState(parsePage(params.get("page")));
  const [showFilters, setShowFilters] = useState(
    !!(params.get("category") || params.get("search") || params.get("type"))
  );

  useEffect(() => {
    const timer = setTimeout(() => setSearchQuery(searchInput), 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const articlesData = listArticles({
    limit: 10,
    page,
    type: selectedType || undefined,
    categorySlug: selectedCategory || undefined,
    search: searchQuery || undefined,
  });

  const categories = getCategories(selectedType || undefined);
  const categoryCounts = getCategoryCounts();
  const isLoading = false;

  // Update URL when filters change
  useEffect(() => {
    const newParams = new URLSearchParams();
    if (selectedCategory) newParams.set("category", selectedCategory);
    if (selectedType) newParams.set("type", selectedType);
    if (searchQuery) newParams.set("search", searchQuery);
    if (page > 1) newParams.set("page", String(page));

    const newSearch = newParams.toString();
    setLocation(`/articles${newSearch ? `?${newSearch}` : ""}`, { replace: true });
  }, [selectedCategory, selectedType, searchQuery, page, setLocation]);

  const clearFilters = useCallback(() => {
    setSelectedCategory("");
    setSelectedType("");
    setSearchInput("");
    setSearchQuery("");
    setPage(1);
  }, []);

  const hasFilters = selectedCategory || searchQuery || selectedType;

  const typeOptions: { value: ContentType | ""; label: string }[] = [
    { value: "", label: "全部类型" },
    { value: "blog", label: "博客" },
    { value: "doc", label: "文档" },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <SEOHead title="文章" description="所有文章" />
      <Navbar />

      <main className="flex-1 pt-16 md:pt-20">
        {/* Header */}
        <section className="border-b-2 border-border">
          <div className="container py-12 md:py-16">
            <h1 className="text-4xl md:text-5xl lg:text-6xl mb-4">文章</h1>
            <p className="text-muted-foreground text-lg" aria-live="polite">
              共 {articlesData?.total || 0} 篇文章
            </p>
          </div>
        </section>

        {/* Filters */}
        <section className="border-b-2 border-border" aria-label="文章筛选">
          <div className="container py-4">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setShowFilters(!showFilters)}
                aria-expanded={showFilters}
                aria-controls="article-filters"
                className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider hover:underline underline-offset-4"
              >
                <Filter className="w-4 h-4" aria-hidden="true" />
                筛选
                {hasFilters && (
                  <span className="w-2 h-2 bg-primary rounded-full" aria-label="已启用筛选" />
                )}
              </button>

              {hasFilters && (
                <button
                  onClick={clearFilters}
                  className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
                >
                  <X className="w-4 h-4" aria-hidden="true" />
                  清除筛选
                </button>
              )}
            </div>

            {showFilters && (
              <div id="article-filters" className="mt-6 pb-4 space-y-6 animate-fade-in" role="search">
                {/* Search */}
                <div>
                  <label htmlFor="article-search" className="block text-xs font-bold uppercase tracking-wider mb-2">
                    搜索
                  </label>
                  <input
                    id="article-search"
                    type="search"
                    value={searchInput}
                    onChange={(e) => {
                      setSearchInput(e.target.value);
                      setPage(1);
                    }}
                    placeholder="搜索文章标题或内容..."
                    className="brutalist-input max-w-md"
                    aria-label="搜索文章"
                  />
                </div>

                {/* Type Filter */}
                <div>
                  <span className="block text-xs font-bold uppercase tracking-wider mb-2">
                    类型
                  </span>
                  <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="内容类型筛选">
                    {typeOptions.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => {
                          setSelectedType(opt.value as ContentType | "");
                          setPage(1);
                        }}
                        role="radio"
                        aria-checked={selectedType === opt.value}
                        className={`px-4 py-2 border-2 border-border text-sm font-bold transition-all ${
                          selectedType === opt.value
                            ? "bg-primary text-primary-foreground"
                            : "hover:bg-muted"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Categories */}
                {categories && categories.length > 0 && (
                  <div>
                    <span className="block text-xs font-bold uppercase tracking-wider mb-2">
                      分类
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3" role="radiogroup" aria-label="分类筛选">
                      <button
                        onClick={() => {
                          setSelectedCategory("");
                          setPage(1);
                        }}
                        role="radio"
                        aria-checked={!selectedCategory}
                        className={`p-4 border-2 border-border transition-all text-left ${
                          !selectedCategory
                            ? "bg-primary text-primary-foreground font-black"
                            : "hover:bg-muted"
                        }`}
                      >
                        <div className="font-bold text-sm">全部</div>
                        <p className="text-xs opacity-80 mt-1">
                          {articlesData?.total || 0} 篇文章
                        </p>
                      </button>
                      {categories.map((cat) => {
                        const count = categoryCounts?.find(c => c.categoryId === cat.id)?.count || 0;
                        return (
                          <button
                            key={cat.id}
                            onClick={() => {
                              setSelectedCategory(cat.slug);
                              setPage(1);
                            }}
                            role="radio"
                            aria-checked={selectedCategory === cat.slug}
                            className={`p-4 border-2 border-border transition-all text-left ${
                              selectedCategory === cat.slug
                                ? "bg-primary text-primary-foreground font-black"
                                : "hover:bg-muted"
                            }`}
                          >
                            <div className="font-bold text-sm">{cat.name}</div>
                            {cat.description && (
                              <p className="text-xs opacity-70 mt-1 line-clamp-1">
                                {cat.description}
                              </p>
                            )}
                            <p className="text-xs opacity-80 mt-1 font-medium">
                              {count} 篇文章
                            </p>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>

        {/* Articles List */}
        <section aria-label="文章列表">
          <div className="container py-12 md:py-16">
            {isLoading ? (
              <div className="flex items-center justify-center py-20" role="status">
                <Loader2 className="w-8 h-8 animate-spin" aria-hidden="true" />
                <span className="sr-only">加载中...</span>
              </div>
            ) : articlesData?.articles && articlesData.articles.length > 0 ? (
              <>
                <div className="space-y-6">
                  {articlesData.articles.map((article) => (
                    <ArticleCard
                      key={article.id}
                      id={article.id}
                      title={article.title}
                      slug={article.slug}
                      summary={article.summary}
                      coverImage={article.coverImage}
                      author={{
                        id: article.author.id,
                        name: article.author.name,
                        avatar: article.author.avatar,
                      }}
                      category={article.category}
                      publishedAt={article.publishedAt}
                    />
                  ))}
                </div>

                {/* Pagination */}
                {articlesData.totalPages > 1 && (
                  <nav aria-label="文章分页" className="flex items-center justify-center gap-2 mt-12">
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                      aria-label="上一页"
                      className="px-4 py-2 border-2 border-border font-bold uppercase text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-muted transition-colors"
                    >
                      上一页
                    </button>
                    <span className="px-4 py-2 text-sm font-medium" aria-current="page">
                      第 {page} 页，共 {articlesData.totalPages} 页
                    </span>
                    <button
                      onClick={() => setPage((p) => Math.min(articlesData.totalPages, p + 1))}
                      disabled={page === articlesData.totalPages}
                      aria-label="下一页"
                      className="px-4 py-2 border-2 border-border font-bold uppercase text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-muted transition-colors"
                    >
                      下一页
                    </button>
                  </nav>
                )}
              </>
            ) : (
              <div className="text-center py-20 border-2 border-dashed border-border">
                <p className="text-muted-foreground text-lg">
                  {hasFilters ? "没有找到匹配的文章" : "暂无文章"}
                </p>
                {hasFilters && (
                  <button
                    onClick={clearFilters}
                    className="mt-4 text-sm font-bold uppercase tracking-wider hover:underline underline-offset-4"
                  >
                    清除筛选条件
                  </button>
                )}
              </div>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
