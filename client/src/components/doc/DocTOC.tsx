import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { TocItem, DocTOCProps } from "@/types/doc";

/**
 * DocTOC component for page-level table of contents
 * Displays headings extracted from markdown and highlights active section
 */
export function DocTOC({ headings, activeId }: DocTOCProps) {
  if (headings.length === 0) {
    return null;
  }

  // Filter to show only h2 and h3 headings for cleaner TOC
  const filteredHeadings = headings.filter((h) => h.level >= 2 && h.level <= 3);

  if (filteredHeadings.length === 0) {
    return null;
  }

  return (
    <ScrollArea className="h-full">
      <nav className="p-4" aria-label="Table of contents">
        <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">
          On This Page
        </h4>
        <ul className="space-y-1">
          {filteredHeadings.map((heading) => (
            <TocLink
              key={heading.id}
              heading={heading}
              isActive={heading.id === activeId}
            />
          ))}
        </ul>
      </nav>
    </ScrollArea>
  );
}

/**
 * Individual TOC link item
 */
interface TocLinkProps {
  heading: TocItem;
  isActive: boolean;
}

function TocLink({ heading, isActive }: TocLinkProps) {
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const element = document.getElementById(heading.id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
      // Update URL hash without scrolling
      window.history.pushState(null, "", `#${heading.id}`);
    }
  };

  return (
    <li>
      <a
        href={`#${heading.id}`}
        onClick={handleClick}
        className={cn(
          "block py-1 text-sm transition-colors",
          "hover:text-foreground",
          heading.level === 3 && "pl-3",
          isActive
            ? "font-medium text-primary border-l-2 border-primary pl-2"
            : "text-muted-foreground border-l-2 border-transparent pl-2"
        )}
      >
        {heading.text}
      </a>
    </li>
  );
}

export default DocTOC;
