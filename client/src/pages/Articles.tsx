import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ArticleCard from "@/components/ArticleCard";
import { trpc } from "@/lib/trpc";
import { useLocation, useSearch } from "wouter";
import { Loader2, Filter, X } from "lucide-react";
import { useState, useEffect } from "react";

export default function Articles() {
  const search = useSearch();
  const [, setLocation] = useLocation();
  const params = new URLSearchParams(search);
  
  const [selectedCategory, setSelectedCategory] = useState(params.get("category") || "");
  const [searchQuery, setSearchQuery] = useState(params.get("search") || "");
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  const { data: articlesData, isLoading } = trpc.article.list.useQuery({
    limit: 10,
    page,
    status: "published",
    categorySlug: selectedCategory || undefined,
    search: searchQuery || undefined,
  });

  const { data: categories } = trpc.category.list.useQuery();
  const { data: categoryCounts } = trpc.article.countByCategory.useQuery();

  // Update URL when filters change
  useEffect(() => {
    const newParams = new URLSearchParams();
    if (selectedCategory) newParams.set("category", selectedCategory);
    if (searchQuery) newParams.set("search", searchQuery);

    const newSearch = newParams.toString();
    setLocation(`/articles${newSearch ? `?${newSearch}` : ""}`, { replace: true });
  }, [selectedCategory, searchQuery, setLocation]);

  const clearFilters = () => {
    setSelectedCategory("");
    setSearchQuery("");
    setPage(1);
  };

  const hasFilters = selectedCategory || searchQuery;

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Navbar />

      <main className="flex-1 pt-16 md:pt-20">
        {/* Header */}
        <section className="border-b-2 border-border">
          <div className="container py-12 md:py-16">
            <h1 className="text-4xl md:text-5xl lg:text-6xl mb-4">文章</h1>
            <p className="text-muted-foreground text-lg">
              共 {articlesData?.total || 0} 篇文章
            </p>
          </div>
        </section>

        {/* Filters */}
        <section className="border-b-2 border-border">
          <div className="container py-4">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider hover:underline underline-offset-4"
              >
                <Filter className="w-4 h-4" />
                筛选
                {hasFilters && (
                  <span className="w-2 h-2 bg-primary rounded-full" />
                )}
              </button>
              
              {hasFilters && (
                <button
                  onClick={clearFilters}
                  className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
                >
                  <X className="w-4 h-4" />
                  清除筛选
                </button>
              )}
            </div>

            {showFilters && (
              <div className="mt-6 pb-4 space-y-6 animate-fade-in">
                {/* Search */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-2">
                    搜索
                  </label>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setPage(1);
                    }}
                    placeholder="搜索文章标题或内容..."
                    className="brutalist-input max-w-md"
                  />
                </div>

                {/* Categories */}
                {categories && categories.length > 0 && (
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider mb-2">
                      分类
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      <button
                        onClick={() => {
                          setSelectedCategory("");
                          setPage(1);
                        }}
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
        <section>
          <div className="container py-12 md:py-16">
            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin" />
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
                  <div className="flex items-center justify-center gap-2 mt-12">
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="px-4 py-2 border-2 border-border font-bold uppercase text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-muted transition-colors"
                    >
                      上一页
                    </button>
                    <span className="px-4 py-2 text-sm font-medium">
                      {page} / {articlesData.totalPages}
                    </span>
                    <button
                      onClick={() => setPage((p) => Math.min(articlesData.totalPages, p + 1))}
                      disabled={page === articlesData.totalPages}
                      className="px-4 py-2 border-2 border-border font-bold uppercase text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-muted transition-colors"
                    >
                      下一页
                    </button>
                  </div>
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
