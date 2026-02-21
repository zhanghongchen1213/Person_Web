import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { useState, useEffect, useCallback } from "react";
import {
  BarChart3,
  Eye,
  Users,
  FileText,
  FolderOpen,
  TrendingUp,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const COLORS = [
  "hsl(221, 83%, 53%)",
  "hsl(262, 83%, 58%)",
  "hsl(330, 81%, 60%)",
  "hsl(24, 94%, 50%)",
  "hsl(142, 71%, 45%)",
  "hsl(47, 96%, 53%)",
];

const DATE_RANGES = [
  { label: "7天", days: 7 },
  { label: "30天", days: 30 },
  { label: "90天", days: 90 },
] as const;

export default function AdminAnalytics() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [days, setDays] = useState(30);
  const [refreshing, setRefreshing] = useState(false);

  const isAdmin = isAuthenticated && user?.role === "admin";

  const { data: overview, isLoading: overviewLoading, refetch: refetchOverview } =
    trpc.analytics.overview.useQuery(undefined, { enabled: isAdmin });

  const { data: viewStats, isLoading: viewStatsLoading, refetch: refetchViewStats } =
    trpc.analytics.pageViewStats.useQuery({ days }, { enabled: isAdmin });

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refetchOverview(), refetchViewStats()]);
    setRefreshing(false);
  }, [refetchOverview, refetchViewStats]);

  // Auto-refresh every 60s
  useEffect(() => {
    if (!isAdmin) return;
    const timer = setInterval(handleRefresh, 60_000);
    return () => clearInterval(timer);
  }, [isAdmin, handleRefresh]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Skeleton className="w-8 h-8 rounded-full" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">无权限</h1>
            <p className="text-muted-foreground mb-4">
              只有管理员可以访问数据分析页面
            </p>
            <Button onClick={() => setLocation("/")}>返回首页</Button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const isLoading = overviewLoading || viewStatsLoading;

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <BarChart3 className="w-8 h-8" />
              <h1 className="text-3xl font-bold">数据分析</h1>
            </div>
            <p className="text-muted-foreground">
              博客访问数据统计与可视化
            </p>
          </div>
          <div className="flex items-center gap-2">
            {DATE_RANGES.map((r) => (
              <button
                key={r.days}
                onClick={() => setDays(r.days)}
                className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider border-2 border-border transition-colors ${
                  days === r.days ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                }`}
              >
                {r.label}
              </button>
            ))}
            <Button
              variant="outline"
              size="icon"
              onClick={handleRefresh}
              disabled={refreshing}
              className="border-2 border-border"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </div>

        {isLoading ? (
          <SkeletonDashboard />
        ) : (
          <div className="space-y-6">
            {/* Stat Cards */}
            <StatCards overview={overview} viewStats={viewStats} />

            {/* Charts Row 1 */}
            <div className="grid gap-6 lg:grid-cols-2">
              <DailyViewsChart data={viewStats?.dailyViews ?? []} days={days} />
              <ArticlesByMonthChart data={overview?.articlesByMonth ?? []} />
            </div>

            {/* Charts Row 2 */}
            <div className="grid gap-6 lg:grid-cols-2">
              <CategoryPieChart data={overview?.articlesByCategory ?? []} />
              <ArticleViewsRanking data={viewStats?.articleViews ?? []} />
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}

/* ---- Skeleton Dashboard ---- */
function SkeletonDashboard() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <Skeleton className="h-4 w-16 mb-3" />
              <Skeleton className="h-8 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <Card key={i}>
            <CardHeader><Skeleton className="h-5 w-32" /></CardHeader>
            <CardContent><Skeleton className="h-[280px] w-full" /></CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
interface OverviewData {
  totalArticles: number;
  publishedArticles: number;
  draftArticles: number;
  totalViews: number;
  totalUsers: number;
  totalCategories: number;
  articlesByCategory: Array<{ name: string; count: number }>;
  articlesByMonth: Array<{ month: string; count: number }>;
  topArticles: Array<{ title: string; slug: string; viewCount: number }>;
}

interface ViewStatsData {
  totalViews: number;
  todayViews: number;
  dailyViews: Array<{ date: string; views: number; uniqueVisitors: number }>;
  articleViews: Array<{ articleId: number; title: string; slug: string; views: number }>;
  topPaths: Array<{ path: string; views: number }>;
}

function StatCards({
  overview,
  viewStats,
}: {
  overview?: OverviewData;
  viewStats?: ViewStatsData;
}) {
  const cards = [
    {
      label: "总浏览量",
      value: viewStats?.totalViews ?? 0,
      icon: Eye,
      color: "text-blue-600",
    },
    {
      label: "今日浏览",
      value: viewStats?.todayViews ?? 0,
      icon: TrendingUp,
      color: "text-green-600",
    },
    {
      label: "文章总数",
      value: overview?.totalArticles ?? 0,
      icon: FileText,
      color: "text-purple-600",
    },
    {
      label: "已发布",
      value: overview?.publishedArticles ?? 0,
      icon: FileText,
      color: "text-orange-600",
    },
    {
      label: "分类数",
      value: overview?.totalCategories ?? 0,
      icon: FolderOpen,
      color: "text-pink-600",
    },
    {
      label: "用户数",
      value: overview?.totalUsers ?? 0,
      icon: Users,
      color: "text-cyan-600",
    },
  ];

  return (
    <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
      {cards.map((c) => (
        <Card key={c.label}>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <c.icon className={`w-4 h-4 ${c.color}`} />
              <span className="text-xs text-muted-foreground">{c.label}</span>
            </div>
            <p className="text-2xl font-bold">{c.value.toLocaleString()}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

/* ---- Daily Views Area Chart ---- */
function DailyViewsChart({
  data,
  days,
}: {
  data: Array<{ date: string; views: number; uniqueVisitors: number }>;
  days: number;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">每日浏览趋势</CardTitle>
        <CardDescription>近{days}天浏览量与独立访客</CardDescription>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="h-[280px] flex items-center justify-center text-muted-foreground text-sm">
            暂无数据
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={data}>
              <defs>
                <linearGradient id="viewsGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(221,83%,53%)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(221,83%,53%)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="uvGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(142,71%,45%)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(142,71%,45%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="date"
                tickFormatter={(v) => v.slice(5)}
                className="text-xs"
              />
              <YAxis className="text-xs" />
              <Tooltip
                labelFormatter={(v) => `日期: ${v}`}
                formatter={(value: number, name: string) => [
                  value,
                  name === "views" ? "浏览量" : "独立访客",
                ]}
              />
              <Area
                type="monotone"
                dataKey="views"
                stroke="hsl(221,83%,53%)"
                fill="url(#viewsGrad)"
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey="uniqueVisitors"
                stroke="hsl(142,71%,45%)"
                fill="url(#uvGrad)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}

/* ---- Articles by Month Bar Chart ---- */
function ArticlesByMonthChart({
  data,
}: {
  data: Array<{ month: string; count: number }>;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">月度发文趋势</CardTitle>
        <CardDescription>近12个月发布文章数</CardDescription>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="h-[280px] flex items-center justify-center text-muted-foreground text-sm">
            暂无数据
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="month"
                tickFormatter={(v) => v.slice(5)}
                className="text-xs"
              />
              <YAxis className="text-xs" allowDecimals={false} />
              <Tooltip
                labelFormatter={(v) => `月份: ${v}`}
                formatter={(value: number) => [value, "文章数"]}
              />
              <Bar
                dataKey="count"
                fill="hsl(262,83%,58%)"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}

/* ---- Category Pie Chart ---- */
function CategoryPieChart({
  data,
}: {
  data: Array<{ name: string; count: number }>;
}) {
  const filtered = data.filter((d) => d.count > 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">分类分布</CardTitle>
        <CardDescription>各分类文章占比</CardDescription>
      </CardHeader>
      <CardContent>
        {filtered.length === 0 ? (
          <div className="h-[280px] flex items-center justify-center text-muted-foreground text-sm">
            暂无数据
          </div>
        ) : (
          <div className="flex items-center gap-4">
            <ResponsiveContainer width="60%" height={280}>
              <PieChart>
                <Pie
                  data={filtered}
                  dataKey="count"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  innerRadius={50}
                  paddingAngle={2}
                >
                  {filtered.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => [value, "文章数"]} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex-1 space-y-2">
              {filtered.map((d, i) => (
                <div key={d.name} className="flex items-center gap-2 text-sm">
                  <div
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: COLORS[i % COLORS.length] }}
                  />
                  <span className="truncate">{d.name}</span>
                  <span className="ml-auto font-medium">{d.count}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/* ---- Article Views Ranking ---- */
function ArticleViewsRanking({
  data,
}: {
  data: Array<{ articleId: number; title: string; slug: string; views: number }>;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">文章浏览排行</CardTitle>
        <CardDescription>浏览量最高的文章</CardDescription>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="h-[280px] flex items-center justify-center text-muted-foreground text-sm">
            暂无数据
          </div>
        ) : (
          <div className="space-y-3 max-h-[280px] overflow-y-auto">
            {data.map((item, i) => {
              const maxViews = data[0]?.views || 1;
              const pct = (item.views / maxViews) * 100;
              return (
                <div key={item.articleId} className="space-y-1">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground w-5 text-right shrink-0">
                      {i + 1}
                    </span>
                    <span className="truncate flex-1">{item.title}</span>
                    <span className="font-medium shrink-0">
                      {item.views}
                    </span>
                  </div>
                  <div className="ml-7 h-1.5 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${pct}%`,
                        backgroundColor: COLORS[i % COLORS.length],
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
