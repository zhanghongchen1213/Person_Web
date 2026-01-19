import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ArticleCard from "@/components/ArticleCard";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import { ArrowRight, Loader2 } from "lucide-react";

export default function Home() {
  const { data: articlesData, isLoading } = trpc.article.list.useQuery({
    limit: 5,
    status: "published",
  });

  const { data: statsData } = trpc.article.stats.useQuery();

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Navbar />

      <main className="flex-1 pt-16 md:pt-20">
        {/* Hero Section */}
        <section className="border-b-2 border-border">
          <div className="container py-16 md:py-24 lg:py-32">
            <div className="max-w-4xl">
             <h1 className="mb-6 flex flex-col md:flex-row md:items-center gap-2 md:gap-8">
                <span className="brutalist-bracket">思考</span>
                <span className="brutalist-underline">记录</span>
                <span>分享</span>
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mb-6">
                专注于嵌入式系统、机器人技术和深度学习的工程师<br />
                在这里分享项目实践、技术教程和学习笔记。
              </p>

              {/* 技术关键词标签 */}
              <div className="flex flex-wrap gap-2 mb-8">
                <span className="px-3 py-1 text-xs font-bold uppercase tracking-wider border-2 border-border bg-background">
                  嵌入式
                </span>
                <span className="px-3 py-1 text-xs font-bold uppercase tracking-wider border-2 border-border bg-background">
                  ROS开发
                </span>
                <span className="px-3 py-1 text-xs font-bold uppercase tracking-wider border-2 border-border bg-background">
                  深度学习
                </span>
                <span className="px-3 py-1 text-xs font-bold uppercase tracking-wider border-2 border-border bg-background">
                  DIY设计
                </span>
              </div>

              <div className="flex flex-wrap gap-4">
                <Link href="/articles" className="brutalist-btn">
                  浏览文章
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
                <Link
                  href="/about"
                  className="inline-flex items-center justify-center px-6 py-3 border-2 border-border font-bold uppercase tracking-wider transition-all hover:bg-muted"
                >
                  关于我
                </Link>
              </div>
            </div>
          </div>
        </section>


        {/* Latest Articles */}
        <section className="border-b-2 border-border">
          <div className="container py-16 md:py-24">
            <div className="flex items-center justify-between mb-12">
              <h2 className="text-2xl md:text-3xl">最新文章</h2>
              <Link
                href="/articles"
                className="text-sm font-bold uppercase tracking-wider hover:underline underline-offset-4 decoration-2 flex items-center gap-2"
              >
                查看全部
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin" />
              </div>
            ) : articlesData?.articles && articlesData.articles.length > 0 ? (
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
            ) : (
              <div className="text-center py-20 border-2 border-dashed border-border">
                <p className="text-muted-foreground text-lg">暂无文章</p>
                <p className="text-sm text-muted-foreground mt-2">
                  文章发布后将在这里显示
                </p>
              </div>
            )}
          </div>
        </section>

         {/* Stats Section */}
        {statsData && (
          <section className="border-b-2 border-border bg-muted">
            <div className="container py-12 md:py-16">
              <div className="grid grid-cols-2 gap-8 max-w-md mx-auto">
                <div className="text-center">
                  <div className="stat-number">{statsData.articleCount || 0}</div>
                  <div className="text-sm font-bold uppercase tracking-wider text-muted-foreground mt-2">
                    文章
                  </div>
                </div>
                <div className="text-center">
                  <div className="stat-number">{statsData.categoryCount || 0}</div>
                  <div className="text-sm font-bold uppercase tracking-wider text-muted-foreground mt-2">
                    分类
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}


        {/* CTA Section */}
        <section className="bg-primary text-primary-foreground">
          <div className="container py-16 md:py-24">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-3xl md:text-4xl lg:text-5xl mb-6">
                探索更多
              </h2>
              <p className="text-lg opacity-80 mb-8">
                浏览归档页面，按时间线查看所有文章
              </p>
              <Link
                href="/archive"
                className="inline-flex items-center justify-center px-8 py-4 border-2 border-primary-foreground bg-primary-foreground text-primary font-bold uppercase tracking-wider hover:bg-transparent hover:text-primary-foreground transition-colors"
              >
                查看归档
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
