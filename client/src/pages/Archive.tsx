import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import { Loader2, Calendar } from "lucide-react";

export default function Archive() {
  const { data: archiveData, isLoading } = trpc.article.archive.useQuery();

  const getMonthName = (month: number) => {
    const months = [
      "一月", "二月", "三月", "四月", "五月", "六月",
      "七月", "八月", "九月", "十月", "十一月", "十二月"
    ];
    return months[month - 1] || "";
  };

  const formatDate = (date: Date | string | null) => {
    if (!date) return "";
    const d = new Date(date);
    return `${d.getMonth() + 1}月${d.getDate()}日`;
  };

  // Group by year
  const groupedByYear = archiveData?.reduce((acc, item) => {
    if (!acc[item.year]) {
      acc[item.year] = [];
    }
    acc[item.year].push(item);
    return acc;
  }, {} as Record<number, typeof archiveData>) || {};

  const years = Object.keys(groupedByYear).map(Number).sort((a, b) => b - a);

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Navbar />

      <main className="flex-1 pt-16 md:pt-20">
        {/* Header */}
        <section className="border-b-2 border-border">
          <div className="container py-12 md:py-16">
            <h1 className="text-4xl md:text-5xl lg:text-6xl mb-4">归档</h1>
            <p className="text-muted-foreground text-lg">
              按时间线浏览所有文章
            </p>
          </div>
        </section>

        {/* Archive Content */}
        <section>
          <div className="container py-12 md:py-16">
            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin" />
              </div>
            ) : years.length > 0 ? (
              <div className="space-y-16">
                {years.map((year) => (
                  <div key={year} className="relative">
                    {/* Year Header */}
                    <div className="sticky top-20 md:top-24 bg-background z-10 pb-4 mb-8 border-b-2 border-border">
                      <h2 className="text-5xl md:text-6xl lg:text-7xl font-black tracking-tighter">
                        {year}
                      </h2>
                    </div>

                    {/* Months */}
                    <div className="space-y-12 pl-4 md:pl-8 border-l-2 border-border">
                      {groupedByYear[year]?.map((monthData) => (
                        <div key={`${year}-${monthData.month}`} className="relative">
                          {/* Month Indicator */}
                          <div className="absolute -left-[calc(1rem+5px)] md:-left-[calc(2rem+5px)] top-0 w-2 h-2 bg-foreground" />
                          
                          {/* Month Header */}
                          <div className="mb-6">
                            <h3 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
                              <Calendar className="w-6 h-6" />
                              {getMonthName(monthData.month)}
                              <span className="text-muted-foreground text-lg font-normal">
                                ({monthData.count} 篇)
                              </span>
                            </h3>
                          </div>

                          {/* Articles */}
                          <div className="space-y-4">
                            {monthData.articles.map((article) => (
                              <Link
                                key={article.id}
                                href={`/article/${article.slug}`}
                                className="block group"
                              >
                                <div className="flex items-start gap-4 p-4 border-2 border-border hover:bg-muted transition-colors">
                                  <span className="text-sm text-muted-foreground font-medium whitespace-nowrap">
                                    {formatDate(article.publishedAt)}
                                  </span>
                                  <h4 className="text-lg font-bold group-hover:underline underline-offset-4 decoration-2">
                                    {article.title}
                                  </h4>
                                </div>
                              </Link>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
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
        </section>
      </main>

      <Footer />
    </div>
  );
}
