import { Link } from "wouter";
import { Calendar, Folder, ArrowRight } from "lucide-react";
import { formatDate, toISODate } from "@/_core/utils/date";

export interface ArticleCardProps {
  id: number;
  title: string;
  slug: string;
  summary?: string | null;
  coverImage?: string | null;
  author: {
    id: number;
    name: string | null;
    avatar?: string | null;
  };
  category?: {
    id: number;
    name: string;
    slug: string;
  } | null;
  publishedAt: Date | string | null;
}

export default function ArticleCard({
  title,
  slug,
  summary,
  coverImage,
  category,
  publishedAt,
}: ArticleCardProps) {
  return (
    <article className="group border-b-2 border-border pb-8 mb-8">
      {/* Cover Image */}
      {coverImage && (
        <Link href={`/article/${slug}`} className="block mb-4">
          <div className="aspect-video overflow-hidden border-2 border-border">
            <img
              src={coverImage}
              alt={`${title} 封面图`}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          </div>
        </Link>
      )}

      {/* Category Badge */}
      {category && (
        <Link href={`/articles?category=${category.slug}`}>
          <span className="inline-flex items-center gap-1 text-xs font-black uppercase tracking-widest mb-4 hover:underline underline-offset-4">
            <Folder className="w-3 h-3" aria-hidden="true" />
            [{category.name}]
          </span>
        </Link>
      )}

      {/* Title */}
      <Link href={`/article/${slug}`}>
        <h2 className="text-2xl md:text-3xl font-black leading-tight mb-4 group-hover:underline underline-offset-8 decoration-4">
          {title}
        </h2>
      </Link>

      {/* Summary */}
      {summary && (
        <p className="text-muted-foreground text-base md:text-lg leading-relaxed mb-6 line-clamp-2">
          {summary}
        </p>
      )}

      {/* Meta Info */}
      <div className="flex flex-wrap items-center gap-6 text-sm">
        {/* Date */}
        <div className="flex items-center gap-2 text-muted-foreground">
          <Calendar className="w-4 h-4" aria-hidden="true" />
          <time dateTime={toISODate(publishedAt)}>{formatDate(publishedAt)}</time>
        </div>

        {/* Read More Link */}
        <Link href={`/article/${slug}`} aria-label={`阅读全文: ${title}`}>
          <span className="inline-flex items-center gap-1 font-bold hover:underline underline-offset-4 group-hover:gap-2 transition-all">
            阅读全文
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </span>
        </Link>
      </div>
    </article>
  );
}
