import { useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DocLayoutProps {
  sidebar: React.ReactNode;
  content: React.ReactNode;
  toc: React.ReactNode;
}

/**
 * DocLayout component implementing three-column layout
 * Sidebar (left) | Main Content (center) | TOC (right)
 * Responsive: sidebar and TOC collapse on mobile
 */
export function DocLayout({ sidebar, content, toc }: DocLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = useCallback(() => {
    setSidebarOpen((prev) => !prev);
  }, []);

  return (
    <div className="relative min-h-screen">
      {/* Mobile sidebar toggle */}
      <div className="fixed top-16 left-0 z-40 lg:hidden">
        <Button
          variant="outline"
          size="icon"
          onClick={toggleSidebar}
          className="m-2 border-2 border-border"
          aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"}
        >
          {sidebarOpen ? (
            <X className="h-5 w-5" />
          ) : (
            <Menu className="h-5 w-5" />
          )}
        </Button>
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-background/80 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="flex">
        {/* Sidebar */}
        <aside
          className={cn(
            "fixed top-16 left-0 z-40 h-[calc(100vh-4rem)] w-64",
            "border-r-2 border-border bg-background",
            "transition-transform duration-200 ease-in-out",
            "lg:sticky lg:translate-x-0",
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          {sidebar}
        </aside>

        {/* Main content area */}
        <main className="flex-1 min-w-0 lg:ml-0">
          <div className="container max-w-4xl py-8 px-4 lg:px-8">
            {content}
          </div>
        </main>

        {/* TOC sidebar (right) */}
        <aside
          className={cn(
            "hidden xl:block",
            "sticky top-16 h-[calc(100vh-4rem)] w-56",
            "border-l-2 border-border bg-background",
            "shrink-0"
          )}
        >
          {toc}
        </aside>
      </div>
    </div>
  );
}

export default DocLayout;
