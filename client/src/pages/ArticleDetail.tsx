import SEOHead from "@/components/SEOHead";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { getArticleBySlug, getRelatedArticles } from "@/lib/staticContent";
import { useParams, Link } from "wouter";
import { Calendar, ArrowLeft, Clock } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Streamdown } from "streamdown";
import TableOfContents from "@/components/TableOfContents";
import { usePageView } from "@/_core/hooks/usePageView";
import { useMemo } from "react";
import { estimateReadingTime } from "@/_core/utils/readingTime";
import { formatDate, toISODate } from "@/_core/utils/date";

export default function ArticleDetail() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug || "";

  const article = getArticleBySlug(slug);
  const error = null;

  usePageView(`/article/${slug}`, article?.id, true);

  const readingTime = useMemo(
    () => (article?.content ? estimateReadingTime(article.content) : 0),
    [article?.content]
  );

  // Get related articles
  const relatedArticles = article
    ? getRelatedArticles(article.id, article?.category?.id ?? null, 4)
    : [];

  if (error || !article) {
    return (
      <div className="min-h-screen flex flex-col bg-background text-foreground">
        <Navbar />
        <main className="flex-1 pt-16 md:pt-20">
          <div className="container py-20 text-center">
            <h1 className="text-4xl md:text-5xl mb-4">404</h1>
            <p className="text-muted-foreground text-lg mb-8">文章不存在</p>
            <Link href="/articles" className="brutalist-btn">
              返回文章列表
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <SEOHead
        title={article.title}
        description={article.summary || article.title}
        image={article.coverImage || undefined}
        type="article"
        canonical={`${typeof window !== "undefined" ? window.location.origin : ""}/article/${article.slug}`}
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "BlogPosting",
          headline: article.title,
          description: article.summary || article.title,
          image: article.coverImage || undefined,
          datePublished: article.publishedAt || undefined,
          dateModified: article.updatedAt || article.publishedAt || undefined,
          author: { "@type": "Person", name: article.author.name || "匿名" },
        }}
      />
      <Navbar />

      <main className="flex-1 pt-16 md:pt-20">
        {/* Back Button */}
        <div className="container py-6">
          <Link
            href="/articles"
            className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-wider hover:underline underline-offset-4"
          >
            <ArrowLeft className="w-4 h-4" />
            返回文章列表
          </Link>
        </div>

        {/* Article Header */}
        <header className="border-b-2 border-border">
          <div className="container pb-12 md:pb-16">
            {/* Category */}
            <div className="flex flex-wrap items-center gap-2 mb-6">
              {article.category && (
                <Link
                  href={`/articles?category=${article.category.slug}`}
                  className="text-xs font-bold uppercase tracking-wider px-2 py-1 bg-primary text-primary-foreground hover:bg-primary/80 transition-colors"
                >
                  {article.category.name}
                </Link>
              )}
            </div>

            {/* Title */}
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-tight leading-tight mb-8">
              {article.title}
            </h1>

            {/* Meta */}
            <div className="flex flex-wrap items-center gap-6">
              {/* Author */}
              <div className="flex items-center gap-3">
                <Avatar className="w-10 h-10 border-2 border-border">
                  <AvatarImage src={article.author.avatar || undefined} />
                  <AvatarFallback className="bg-muted font-bold">
                    {article.author.name?.charAt(0).toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <span className="font-medium">{article.author.name || "匿名"}</span>
                </div>
              </div>

              <div className="geo-line-v h-8 hidden sm:block" />

              {/* Date */}
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="w-4 h-4" aria-hidden="true" />
                <time className="text-sm" dateTime={toISODate(article.publishedAt)}>
                  {formatDate(article.publishedAt)}
                </time>
              </div>

              {readingTime > 0 && (
                <>
                  <div className="geo-line-v h-8 hidden sm:block" />
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="w-4 h-4" aria-hidden="true" />
                    <span className="text-sm">约 {readingTime} 分钟阅读</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Cover Image */}
        {article.coverImage && (
          <div className="border-b-2 border-border">
            <div className="container py-8">
              <div className="aspect-video max-w-4xl mx-auto overflow-hidden border-2 border-border">
                <img
                  src={article.coverImage}
                  alt={`${article.title} 封面图`}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        )}

        {/* Article Content */}
        <article className="border-b-2 border-border">
          <div className="container py-12 md:py-16">
            <div className="flex gap-8 justify-center">
              <div className="max-w-3xl w-full prose-brutalist">
                <Streamdown>{article.content}</Streamdown>
              </div>
              <TableOfContents />
            </div>
          </div>
        </article>

        {/* Related Articles */}
        {relatedArticles.length > 0 && (
          <section aria-label="相关文章" className="border-b-2 border-border">
            <div className="container py-12 md:py-16">
              <h2 className="text-2xl md:text-3xl font-black mb-8">相关文章</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {relatedArticles.map((related) => (
                  <Link
                    key={related.id}
                    href={`/article/${related.slug}`}
                    className="group p-6 border-2 border-border hover:bg-muted transition-colors"
                    aria-label={`阅读: ${related.title}`}
                  >
                    {related.category && (
                      <span className="inline-block text-xs font-bold uppercase tracking-wider px-2 py-1 bg-primary text-primary-foreground mb-3">
                        {related.category.name}
                      </span>
                    )}
                    <h3 className="text-xl font-bold mb-2 group-hover:underline underline-offset-4">
                      {related.title}
                    </h3>
                    {related.summary && (
                      <p className="text-muted-foreground text-sm mb-3 line-clamp-2">
                        {related.summary}
                      </p>
                    )}
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Calendar className="w-3 h-3" aria-hidden="true" />
                      <time dateTime={toISODate(related.publishedAt)}>
                        {formatDate(related.publishedAt)}
                      </time>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Navigation */}
        <section className="bg-muted">
          <div className="container py-12 md:py-16">
            <div className="max-w-3xl mx-auto text-center">
              <p className="text-muted-foreground mb-6">感谢阅读</p>
              <div className="flex flex-wrap justify-center gap-4">
                <Link href="/articles" className="brutalist-btn">
                  浏览更多文章
                </Link>
                <Link
                  href="/archive"
                  className="inline-flex items-center justify-center px-6 py-3 border-2 border-border font-bold uppercase tracking-wider transition-all hover:bg-background"
                >
                  查看归档
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
