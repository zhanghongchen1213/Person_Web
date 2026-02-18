import { useState, useEffect, useRef } from "react";

interface TocItem {
  id: string;
  text: string;
  level: number;
}

export default function TableOfContents() {
  const [headings, setHeadings] = useState<TocItem[]>([]);
  const [activeId, setActiveId] = useState("");
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      const allEls = Array.from(
        document.querySelectorAll(".prose-brutalist h1, .prose-brutalist h2, .prose-brutalist h3")
      ) as HTMLElement[];

      // Skip the first h1 (article title duplicate)
      const els = allEls.length > 0 && allEls[0].tagName === "H1" ? allEls.slice(1) : allEls;

      if (els.length === 0) return;

      const items: TocItem[] = els.map((el, i) => {
        if (!el.id) el.id = `heading-${i}`;
        return { id: el.id, text: el.textContent || "", level: parseInt(el.tagName[1]) };
      });

      setHeadings(items);

      observerRef.current = new IntersectionObserver(
        (entries) => {
          const visible = entries.find((e) => e.isIntersecting);
          if (visible) setActiveId(visible.target.id);
        },
        { rootMargin: "-80px 0px -60% 0px" }
      );

      els.forEach((el) => observerRef.current!.observe(el));
    }, 300);

    return () => {
      clearTimeout(timer);
      observerRef.current?.disconnect();
    };
  }, []);

  if (headings.length === 0) return null;

  return (
    <nav className="hidden lg:block w-64 shrink-0">
      <div className="sticky top-24 border-2 border-border p-4 max-h-[calc(100vh-8rem)] overflow-y-auto">
        <h4 className="text-xs font-bold uppercase tracking-wider mb-3">目录</h4>
        <ul className="space-y-1.5">
          {headings.map((h) => (
            <li key={h.id} style={{ paddingLeft: `${(h.level - headings.reduce((m, x) => Math.min(m, x.level), 9)) * 1}rem` }}>
              <a
                href={`#${h.id}`}
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById(h.id)?.scrollIntoView({ behavior: "smooth" });
                }}
                className={`block text-sm leading-snug transition-colors ${
                  activeId === h.id
                    ? "font-bold text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {h.text}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}
