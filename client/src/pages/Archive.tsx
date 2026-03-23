import SEOHead from "@/components/SEOHead";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { getArchive, getCategoryCounts } from "@/lib/staticContent";
import { Link, useSearch, useLocation } from "wouter";
import { Loader2, Calendar, ChevronDown, ChevronRight, Tag } from "lucide-react";
import { usePageView } from "@/_core/hooks/usePageView";
import { useState, useCallback, useEffect, useMemo } from "react";
import { buildCanonical, createCollectionPageJsonLd } from "@/lib/seo";

type ViewTab = "timeline" | "categories";

type ArchiveItem = ReturnType<typeof getArchive>[number];

export function getDefaultExpandedArchiveState(archiveData: ArchiveItem[]) {
  if (!archiveData || archiveData.length === 0) {
    return {
      expandedYears: new Set<number>(),
      expandedMonths: new Set<string>(),
    };
  }

  const years = archiveData.map(item => item.year);
  const monthKeys = archiveData.map(item => `${item.year}-${item.month}`);

  return {
    expandedYears: new Set<number>(years),
    expandedMonths: new Set<string>(monthKeys),
  };
}

const getMonthName = (month: number) => {
  const months = [
    "一月", "二月", "三月", "四月", "五月", "六月",
    "七月", "八月", "九月", "十月", "十一月", "十二月",
  ];
  return months[month - 1] || "";
};

const formatDate = (date: Date | string | null) => {
  if (!date) return "";
  const d = new Date(date);
  return `${d.getMonth() + 1}月${d.getDate()}日`;
};

export default function Archive() {
  usePageView("/archive");
  const search = useSearch();
  const [, setLocation] = useLocation();
  const params = new URLSearchParams(search);

  // URL-persisted state
  const [activeTab, setActiveTab] = useState<ViewTab>(
    params.get("view") === "categories" ? "categories" : "timeline"
  );

  const archiveData = getArchive();
  const categoryCounts = getCategoryCounts();
  const archiveLoading = false;
  const categoryLoading = false;

  const defaultExpanded = useMemo(
    () => getDefaultExpandedArchiveState(archiveData),
    [archiveData]
  );
  const [expandedYears, setExpandedYears] = useState<Set<number>>(defaultExpanded.expandedYears);
  const [expandedMonths, setExpandedMonths] = useState<Set<string>>(defaultExpanded.expandedMonths);

  // Memoize grouped data to avoid recomputation and unstable references
  const groupedByYear = useMemo(() => {
    return archiveData?.reduce((acc, item) => {
      if (!acc[item.year]) {
        acc[item.year] = [];
      }
      acc[item.year].push(item);
      return acc;
    }, {} as Record<number, typeof archiveData>) || {};
  }, [archiveData]);

  const years = useMemo(
    () => Object.keys(groupedByYear).map(Number).sort((a, b) => b - a),
    [groupedByYear]
  );

  const totalArticles = useMemo(
    () => archiveData?.reduce((sum, m) => sum + m.count, 0) || 0,
    [archiveData]
  );

  // Sync tab to URL
  useEffect(() => {
    const newParams = new URLSearchParams();
    if (activeTab !== "timeline") newParams.set("view", activeTab);
    const qs = newParams.toString();
    setLocation(`/archive${qs ? `?${qs}` : ""}`, { replace: true });
  }, [activeTab, setLocation]);

  const toggleYear = useCallback((year: number) => {
    setExpandedYears(prev => {
      const next = new Set(prev);
      if (next.has(year)) {
        next.delete(year);
      } else {
        next.add(year);
      }
      return next;
    });
  }, []);

  const toggleMonth = useCallback((key: string) => {
    setExpandedMonths(prev => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }, []);

  // Memoize max count for category bar chart
  const maxCategoryCount = useMemo(
    () => (categoryCounts && categoryCounts.length > 0
      ? Math.max(...categoryCounts.map(c => c.count), 1)
      : 1),
    [categoryCounts]
  );

  // Tab keyboard navigation (WAI-ARIA tabs pattern)
  const handleTabKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
      e.preventDefault();
      setActiveTab(prev => prev === "timeline" ? "categories" : "timeline");
    }
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <SEOHead
        title="归档"
        description="按时间线和分类维度浏览全部文章归档。"
        pathname="/archive"
        jsonLd={createCollectionPageJsonLd({
          name: "文章归档",
          description: "按时间线与分类整理的文章归档列表。",
          url: buildCanonical("/archive"),
          totalItems: totalArticles,
        })}
      />
      <Navbar />

      <main className="flex-1 pt-16 md:pt-20">
        {/* Header */}
        <section className="border-b-2 border-border">
          <div className="container py-12 md:py-16">
            <h1 className="text-4xl md:text-5xl lg:text-6xl mb-4">归档</h1>
            <p className="text-muted-foreground text-lg">
              共 {totalArticles} 篇文章
            </p>
          </div>
        </section>

        {/* Tab Navigation */}
        <nav className="border-b-2 border-border" aria-label="归档视图切换">
          <div className="container">
            <div className="flex" role="tablist" aria-label="归档视图">
              <button
                role="tab"
                aria-selected={activeTab === "timeline"}
                aria-controls="panel-timeline"
                id="tab-timeline"
                tabIndex={activeTab === "timeline" ? 0 : -1}
                onClick={() => setActiveTab("timeline")}
                onKeyDown={handleTabKeyDown}
                className={`px-6 py-4 text-sm font-bold uppercase tracking-wider border-b-2 -mb-[2px] transition-colors ${
                  activeTab === "timeline"
                    ? "border-foreground text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <Calendar className="w-4 h-4 inline-block mr-2" aria-hidden="true" />
                时间线
              </button>
              <button
                role="tab"
                aria-selected={activeTab === "categories"}
                aria-controls="panel-categories"
                id="tab-categories"
                tabIndex={activeTab === "categories" ? 0 : -1}
                onClick={() => setActiveTab("categories")}
                onKeyDown={handleTabKeyDown}
                className={`px-6 py-4 text-sm font-bold uppercase tracking-wider border-b-2 -mb-[2px] transition-colors ${
                  activeTab === "categories"
                    ? "border-foreground text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <Tag className="w-4 h-4 inline-block mr-2" aria-hidden="true" />
                分类统计
              </button>
            </div>
          </div>
        </nav>

        {/* Timeline Panel */}
        <div
          id="panel-timeline"
          role="tabpanel"
          aria-labelledby="tab-timeline"
          hidden={activeTab !== "timeline"}
        >
          <div className="container py-12 md:py-16">
            {archiveLoading ? (
              <div className="flex items-center justify-center py-20" role="status">
                <Loader2 className="w-8 h-8 animate-spin" aria-hidden="true" />
                <span className="sr-only">加载中...</span>
              </div>
            ) : years.length > 0 ? (
              <div className="space-y-8">
                {years.map((year) => {
                  const yearExpanded = expandedYears.has(year);
                  const yearArticleCount = groupedByYear[year]?.reduce((s, m) => s + m.count, 0) || 0;

                  return (
                    <section key={year} aria-label={`${year} 年文章`}>
                      {/* Year Header - collapsible */}
                      <button
                        onClick={() => toggleYear(year)}
                        aria-expanded={yearExpanded}
                        aria-controls={`year-${year}-content`}
                        className="w-full flex items-center gap-4 pb-4 mb-4 border-b-2 border-border text-left group hover:bg-muted/50 transition-colors -mx-2 px-2 rounded"
                      >
                        {yearExpanded ? (
                          <ChevronDown className="w-6 h-6 shrink-0" aria-hidden="true" />
                        ) : (
                          <ChevronRight className="w-6 h-6 shrink-0" aria-hidden="true" />
                        )}
                        <h2 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tighter">
                          {year}
                        </h2>
                        <span className="text-muted-foreground text-lg font-normal ml-2">
                          ({yearArticleCount} 篇)
                        </span>
                      </button>

                      {/* Year Content */}
                      {yearExpanded && (
                        <div
                          id={`year-${year}-content`}
                          className="space-y-6 pl-4 md:pl-8 border-l-2 border-border"
                        >
                          {groupedByYear[year]?.map((monthData) => {
                            const monthKey = `${year}-${monthData.month}`;
                            const monthExpanded = expandedMonths.has(monthKey);

                            return (
                              <div key={monthKey} className="relative">
                                {/* Month dot */}
                                <div className="absolute -left-[calc(1rem+5px)] md:-left-[calc(2rem+5px)] top-2 w-2 h-2 bg-foreground" aria-hidden="true" />

                                {/* Month Header - collapsible */}
                                <button
                                  onClick={() => toggleMonth(monthKey)}
                                  aria-expanded={monthExpanded}
                                  aria-controls={`month-${monthKey}-content`}
                                  className="w-full flex items-center gap-2 mb-4 text-left group hover:bg-muted/50 transition-colors -mx-2 px-2 rounded"
                                >
                                  {monthExpanded ? (
                                    <ChevronDown className="w-5 h-5 shrink-0" aria-hidden="true" />
                                  ) : (
                                    <ChevronRight className="w-5 h-5 shrink-0" aria-hidden="true" />
                                  )}
                                  <h3 className="text-xl md:text-2xl font-bold flex items-center gap-3">
                                    <Calendar className="w-5 h-5" aria-hidden="true" />
                                    {getMonthName(monthData.month)}
                                    <span className="text-muted-foreground text-base font-normal">
                                      ({monthData.count} 篇)
                                    </span>
                                  </h3>
                                </button>

                                {/* Articles list */}
                                {monthExpanded && (
                                  <ul
                                    id={`month-${monthKey}-content`}
                                    className="space-y-3 ml-7"
                                    role="list"
                                  >
                                    {monthData.articles.map((article) => (
                                      <li key={article.id}>
                                        <Link
                                          href={`/article/${article.slug}`}
                                          className="group flex items-start gap-4 p-4 border-2 border-border hover:bg-muted transition-colors"
                                        >
                                          <time
                                            className="text-sm text-muted-foreground font-medium whitespace-nowrap pt-0.5"
                                            dateTime={article.publishedAt ? new Date(article.publishedAt).toISOString() : ""}
                                          >
                                            {formatDate(article.publishedAt)}
                                          </time>
                                          <div className="flex-1 min-w-0">
                                            <h4 className="text-lg font-bold group-hover:underline underline-offset-4 decoration-2">
                                              {article.title}
                                            </h4>
                                            {article.categoryName && (
                                              <span className="inline-block text-xs text-muted-foreground mt-1">
                                                {article.categoryName}
                                              </span>
                                            )}
                                          </div>
                                        </Link>
                                      </li>
                                    ))}
                                  </ul>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </section>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-20 border-2 border-dashed border-border">
                <p className="text-muted-foreground text-lg">暂无文章</p>
                <p className="text-sm text-muted-foreground mt-2">
                  文章发布后将在这里按时间线展示
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Categories Panel */}
        <div
          id="panel-categories"
          role="tabpanel"
          aria-labelledby="tab-categories"
          hidden={activeTab !== "categories"}
        >
          <div className="container py-12 md:py-16">
            {categoryLoading ? (
              <div className="flex items-center justify-center py-20" role="status">
                <Loader2 className="w-8 h-8 animate-spin" aria-hidden="true" />
                <span className="sr-only">加载中...</span>
              </div>
            ) : categoryCounts && categoryCounts.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {categoryCounts.map((cat) => (
                  <Link
                    key={cat.categoryId}
                    href={`/articles?category=${cat.categorySlug}`}
                    className="group p-6 border-2 border-border hover:bg-muted transition-colors"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-xl font-bold group-hover:underline underline-offset-4">
                        {cat.categoryName}
                      </h3>
                      <span className="text-3xl font-black text-muted-foreground group-hover:text-foreground transition-colors">
                        {cat.count}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {cat.count} 篇文章
                    </p>
                    {/* Visual bar */}
                    <div className="mt-4 h-1 bg-border overflow-hidden" aria-hidden="true">
                      <div
                        className="h-full bg-foreground transition-all"
                        style={{
                          width: `${Math.min(100, (cat.count / maxCategoryCount) * 100)}%`,
                        }}
                      />
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-20 border-2 border-dashed border-border">
                <p className="text-muted-foreground text-lg">暂无分类</p>
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
