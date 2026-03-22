import { useState, useEffect, useRef } from "react";
import { trpc } from "../lib/trpc";
import { Link } from "wouter";

export function Search() {
  const [keyword, setKeyword] = useState("");
  const [debouncedKeyword, setDebouncedKeyword] = useState("");
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    timerRef.current = setTimeout(() => setDebouncedKeyword(keyword), 300);
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [keyword]);

  const { data, isLoading } = trpc.article.search.useQuery(
    { keyword: debouncedKeyword },
    { enabled: debouncedKeyword.length > 0 }
  );

  return (
    <div className="max-w-2xl mx-auto p-4">
      <label htmlFor="search-input" className="sr-only">
        Search articles
      </label>
      <input
        id="search-input"
        type="search"
        value={keyword}
        onChange={(e) => setKeyword(e.target.value)}
        placeholder="Search articles..."
        className="w-full px-4 py-2 border rounded-lg"
        aria-label="Search articles"
        aria-describedby="search-status"
      />

      <div id="search-status" role="status" aria-live="polite" aria-atomic="true">
        {isLoading && <p className="mt-4 text-gray-500">Searching...</p>}
      </div>

      {data && data.articles.length > 0 && (
        <div className="mt-4 space-y-4" role="list">
          {data.articles.map((article) => (
            <Link
              key={article.id}
              href={`/article/${article.slug}`}
              className="block p-4 border rounded hover:bg-gray-50"
              role="listitem"
            >
              <h3 className="font-semibold">{article.title}</h3>
              {article.summary && (
                <p className="text-sm text-gray-600 mt-1">{article.summary}</p>
              )}
              {article.category && (
                <span className="text-xs text-gray-500 mt-2 inline-block">
                  {article.category.name}
                </span>
              )}
            </Link>
          ))}
        </div>
      )}

      {data && data.articles.length === 0 && debouncedKeyword && (
        <p className="mt-4 text-gray-500">No results found</p>
      )}
    </div>
  );
}
