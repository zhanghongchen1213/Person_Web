import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { useLocation, useSearch } from "wouter";
import { useState, useEffect } from "react";
import {
  Loader2,
  Edit,
  Trash2,
  Calendar,
  FileText,
  BookOpen,
  LayoutList,
  Search,
  X
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from "@/components/ui/pagination";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";

export default function AdminArticles() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const searchParams = useSearch();

  // 从 URL 参数初始化状态
  const urlParams = new URLSearchParams(searchParams);
  const [page, setPage] = useState(parseInt(urlParams.get("page") || "1"));
  const [statusFilter, setStatusFilter] = useState<"draft" | "published" | "archived" | undefined>(
    (urlParams.get("status") as "draft" | "published" | "archived") || undefined
  );
  const [categoryFilter, setCategoryFilter] = useState<string | undefined>(
    urlParams.get("category") || undefined
  );
  const [searchQuery, setSearchQuery] = useState(urlParams.get("search") || "");
  const [searchInput, setSearchInput] = useState(searchQuery);

  // 同步 URL 参数
  useEffect(() => {
    const params = new URLSearchParams();
    if (page > 1) params.set("page", page.toString());
    if (statusFilter) params.set("status", statusFilter);
    if (categoryFilter) params.set("category", categoryFilter);
    if (searchQuery) params.set("search", searchQuery);

    const newSearch = params.toString();
    const currentPath = window.location.pathname;
    const newUrl = newSearch ? `${currentPath}?${newSearch}` : currentPath;
    window.history.replaceState({}, "", newUrl);
  }, [page, statusFilter, categoryFilter, searchQuery]);

  // 获取分类列表
  const { data: categories } = trpc.category.list.useQuery({ type: "blog" });

  // 获取文章列表
  const { data: articlesData, isLoading, refetch } = trpc.article.adminList.useQuery({
    page,
    limit: 20,
    status: statusFilter,
    type: categoryFilter ? undefined : undefined, // 可以根据需要添加类型筛选
  });

  // 删除文章 mutation
  const deleteMutation = trpc.article.delete.useMutation({
    onSuccess: () => {
      toast.success("文章已删除");
      refetch();
    },
    onError: (error) => {
      toast.error(`删除失败: ${error.message}`);
    },
  });

  // 修改发布日期 mutation
  const updatePublishedAtMutation = trpc.article.updatePublishedAt.useMutation({
    onSuccess: () => {
      toast.success("发布日期已更新");
      refetch();
    },
    onError: (error) => {
      toast.error(`更新失败: ${error.message}`);
    },
  });

  // 处理删除
  const handleDelete = (id: number, title: string) => {
    deleteMutation.mutate({ id });
  };

  // 处理编辑
  const handleEdit = (id: number) => {
    setLocation(`/edit/${id}`);
  };

  // 处理修改发布日期
  const handleUpdatePublishedAt = (id: number, date: Date) => {
    updatePublishedAtMutation.mutate({ id, publishedAt: date });
  };

  // 处理搜索
  const handleSearch = () => {
    setSearchQuery(searchInput);
    setPage(1); // 重置到第一页
  };

  // 清除搜索
  const handleClearSearch = () => {
    setSearchInput("");
    setSearchQuery("");
    setPage(1);
  };

  // 处理状态筛选
  const handleStatusFilter = (status: "draft" | "published" | "archived" | undefined) => {
    setStatusFilter(status);
    setPage(1); // 重置到第一页
  };

  // 处理分类筛选
  const handleCategoryFilter = (categoryId: string) => {
    setCategoryFilter(categoryId === "all" ? undefined : categoryId);
    setPage(1); // 重置到第一页
  };

  // 格式化日期
  const formatDate = (date: Date | string | null) => {
    if (!date) return "-";
    const d = new Date(date);
    return new Intl.DateTimeFormat("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(d);
  };

  // 获取状态徽章
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "published":
        return <Badge variant="success">已发布</Badge>;
      case "draft":
        return <Badge variant="warning">草稿</Badge>;
      case "archived":
        return <Badge variant="secondary">已归档</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // 获取类型徽章
  const getTypeBadge = (type: string) => {
    switch (type) {
      case "blog":
        return (
          <Badge variant="outline" className="gap-1">
            <FileText className="w-3 h-3" />
            博客
          </Badge>
        );
      case "doc":
        return (
          <Badge variant="outline" className="gap-1">
            <BookOpen className="w-3 h-3" />
            文档
          </Badge>
        );
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  // 权限检查
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated || user?.role !== "admin") {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">无权限</h1>
            <p className="text-muted-foreground mb-4">
              只有管理员可以访问文章管理页面
            </p>
            <Button onClick={() => setLocation("/")}>返回首页</Button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1 container mx-auto px-4 py-8 max-w-7xl">
        {/* 页面标题 */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <LayoutList className="w-8 h-8" />
            <h1 className="text-3xl font-bold">文章管理</h1>
          </div>
          <p className="text-muted-foreground">
            管理所有文章，包括草稿、已发布和已归档的内容
          </p>
        </div>

        {/* 操作栏 */}
        <div className="mb-6 space-y-4">
          {/* 搜索和分类筛选 */}
          <div className="flex flex-col sm:flex-row gap-4">
            {/* 搜索框 */}
            <div className="flex-1 flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="搜索文章标题..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleSearch();
                    }
                  }}
                  className="pl-9 pr-9"
                />
                {searchInput && (
                  <button
                    onClick={handleClearSearch}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              <Button onClick={handleSearch}>搜索</Button>
            </div>

            {/* 分类筛选 */}
            <Select
              value={categoryFilter || "all"}
              onValueChange={handleCategoryFilter}
            >
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="选择分类" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部分类</SelectItem>
                {categories?.map((category) => (
                  <SelectItem key={category.id} value={category.id.toString()}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 状态筛选 */}
          <div className="flex flex-wrap gap-2 items-center justify-between">
            <div className="flex gap-2">
              <Button
                variant={statusFilter === undefined ? "default" : "outline"}
                onClick={() => handleStatusFilter(undefined)}
              >
                全部
              </Button>
              <Button
                variant={statusFilter === "draft" ? "default" : "outline"}
                onClick={() => handleStatusFilter("draft")}
              >
                草稿
              </Button>
              <Button
                variant={statusFilter === "published" ? "default" : "outline"}
                onClick={() => handleStatusFilter("published")}
              >
                已发布
              </Button>
              <Button
                variant={statusFilter === "archived" ? "default" : "outline"}
                onClick={() => handleStatusFilter("archived")}
              >
                已归档
              </Button>
            </div>

            <Button onClick={() => setLocation("/write")}>
              <FileText className="w-4 h-4" />
              新建文章
            </Button>
          </div>
        </div>

        {/* 文章列表 */}
        <div className="border-2 border-border rounded-lg overflow-hidden">
          {isLoading ? (
            <div className="p-12 flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
          ) : !articlesData?.articles || articlesData.articles.length === 0 ? (
            <div className="p-12 text-center">
              <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">暂无文章</h3>
              <p className="text-muted-foreground mb-4">
                {statusFilter
                  ? `没有找到状态为"${statusFilter === "draft" ? "草稿" : statusFilter === "published" ? "已发布" : "已归档"}"的文章`
                  : "还没有创建任何文章"}
              </p>
              <Button onClick={() => setLocation("/write")}>
                <FileText className="w-4 h-4" />
                创建第一篇文章
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40%]">标题</TableHead>
                  <TableHead>分类</TableHead>
                  <TableHead>类型</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>发布日期</TableHead>
                  <TableHead>创建日期</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {articlesData.articles.map((article) => (
                  <TableRow key={article.id}>
                    <TableCell className="font-medium">
                      <a
                        href={`/article/${article.slug}`}
                        className="hover:underline"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {article.title}
                      </a>
                    </TableCell>
                    <TableCell>
                      {article.category?.name || "-"}
                    </TableCell>
                    <TableCell>{getTypeBadge(article.type)}</TableCell>
                    <TableCell>{getStatusBadge(article.status)}</TableCell>
                    <TableCell className="text-sm">
                      {formatDate(article.publishedAt)}
                    </TableCell>
                    <TableCell className="text-sm">
                      {formatDate(article.createdAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        {/* 编辑按钮 */}
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => handleEdit(article.id)}
                          title="编辑"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>

                        {/* 修改日期按钮 */}
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              title="修改发布日期"
                            >
                              <Calendar className="w-4 h-4" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="end">
                            <CalendarComponent
                              mode="single"
                              selected={article.publishedAt ? new Date(article.publishedAt) : undefined}
                              onSelect={(date) => {
                                if (date) {
                                  handleUpdatePublishedAt(article.id, date);
                                }
                              }}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>

                        {/* 删除按钮 */}
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              title="删除"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>确认删除</AlertDialogTitle>
                              <AlertDialogDescription>
                                确定要删除文章《{article.title}》吗？此操作无法撤销。
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>取消</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(article.id, article.title)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                删除
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>

        {/* 统计信息和分页 */}
        {articlesData && articlesData.total > 0 && (
          <div className="mt-6 space-y-4">
            {/* 统计信息 */}
            <div className="text-sm text-muted-foreground">
              共 {articlesData.total} 篇文章
              {statusFilter && ` (筛选: ${statusFilter === "draft" ? "草稿" : statusFilter === "published" ? "已发布" : "已归档"})`}
              {categoryFilter && categories && ` (分类: ${categories.find(c => c.id.toString() === categoryFilter)?.name})`}
              {searchQuery && ` (搜索: "${searchQuery}")`}
            </div>

            {/* 分页组件 */}
            {articlesData.total > 20 && (() => {
              const totalPages = Math.ceil(articlesData.total / 20);
              return (
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          if (page > 1) setPage(page - 1);
                        }}
                        className={page === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                      />
                    </PaginationItem>

                    <PaginationItem>
                      <PaginationLink
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          setPage(1);
                        }}
                        isActive={page === 1}
                        className="cursor-pointer"
                      >
                        1
                      </PaginationLink>
                    </PaginationItem>

                    {totalPages > 7 && page > 3 && (
                      <PaginationItem>
                        <PaginationEllipsis />
                      </PaginationItem>
                    )}

                    {(() => {
                      const pages = [];
                      const start = Math.max(2, page - 1);
                      const end = Math.min(totalPages - 1, page + 1);
                      for (let i = start; i <= end; i++) {
                        if (totalPages <= 7 || (i >= start && i <= end)) {
                          pages.push(
                            <PaginationItem key={i}>
                              <PaginationLink
                                href="#"
                                onClick={(e) => {
                                  e.preventDefault();
                                  setPage(i);
                                }}
                                isActive={page === i}
                                className="cursor-pointer"
                              >
                                {i}
                              </PaginationLink>
                            </PaginationItem>
                          );
                        }
                      }
                      return pages;
                    })()}

                    {totalPages > 7 && page < totalPages - 2 && (
                      <PaginationItem>
                        <PaginationEllipsis />
                      </PaginationItem>
                    )}

                    {totalPages > 1 && (
                      <PaginationItem>
                        <PaginationLink
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            setPage(totalPages);
                          }}
                          isActive={page === totalPages}
                          className="cursor-pointer"
                        >
                          {totalPages}
                        </PaginationLink>
                      </PaginationItem>
                    )}

                    <PaginationItem>
                      <PaginationNext
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          if (page < totalPages) setPage(page + 1);
                        }}
                        className={page >= totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              );
            })()}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
