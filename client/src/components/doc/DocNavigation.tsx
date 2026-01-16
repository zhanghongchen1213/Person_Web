import { Link } from "wouter";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DocNavItem } from "@/types/doc";

interface DocNavigationProps {
  prev: DocNavItem | null;
  next: DocNavItem | null;
}

/**
 * DocNavigation component for prev/next article navigation
 * Displayed at the bottom of document pages
 */
export function DocNavigation({ prev, next }: DocNavigationProps) {
  if (!prev && !next) {
    return null;
  }

  return (
    <nav
      className="mt-12 border-t-2 border-border pt-8"
      aria-label="Document navigation"
    >
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Previous article */}
        <div className="flex-1">
          {prev && (
            <NavLink
              href={`/docs/${prev.categorySlug}/${prev.slug}`}
              direction="prev"
              title={prev.title}
            />
          )}
        </div>

        {/* Next article */}
        <div className="flex-1">
          {next && (
            <NavLink
              href={`/docs/${next.categorySlug}/${next.slug}`}
              direction="next"
              title={next.title}
            />
          )}
        </div>
      </div>
    </nav>
  );
}

/**
 * Navigation link component
 */
interface NavLinkProps {
  href: string;
  direction: "prev" | "next";
  title: string;
}

function NavLink({ href, direction, title }: NavLinkProps) {
  const isPrev = direction === "prev";

  return (
    <Link
      href={href}
      className={cn(
        "group flex items-center gap-3 p-4",
        "border-2 border-border hover:bg-muted transition-colors",
        isPrev ? "text-left" : "text-right flex-row-reverse"
      )}
    >
      {isPrev ? (
        <ChevronLeft className="h-5 w-5 shrink-0 transition-transform group-hover:-translate-x-1" />
      ) : (
        <ChevronRight className="h-5 w-5 shrink-0 transition-transform group-hover:translate-x-1" />
      )}
      <div className={cn("min-w-0", !isPrev && "text-right")}>
        <span className="block text-xs font-bold uppercase tracking-wider text-muted-foreground">
          {isPrev ? "Previous" : "Next"}
        </span>
        <span className="block truncate font-medium">{title}</span>
      </div>
    </Link>
  );
}

export default DocNavigation;
