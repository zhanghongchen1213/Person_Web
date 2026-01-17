import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { useState } from "react";
import {
  Loader2,
  Edit,
  Trash2,
  Calendar,
  FileText,
  BookOpen,
  LayoutList
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

export default function AdminArticles() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<"draft" | "published" | "archived" | undefined>();

  // 获取文章列表
  const { data: articlesData, isLoading, refetch } = trpc.article.adminList.useQuery({
    page,
    limit: 20,
    status: statusFilter,
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

  // 处理删除
  const handleDelete = (id: number, title: string) => {
    deleteMutation.mutate({ id });
  };

  // 处理编辑
  const handleEdit = (id: number) => {
    setLocation(`/write/${id}`);
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
        <div className="mb-6 flex flex-wrap gap-4 items-center justify-between">
          <div className="flex gap-2">
            <Button
              variant={statusFilter === undefined ? "default" : "outline"}
              onClick={() => setStatusFilter(undefined)}
            >
              全部
            </Button>
            <Button
              variant={statusFilter === "draft" ? "default" : "outline"}
              onClick={() => setStatusFilter("draft")}
            >
              草稿
            </Button>
            <Button
              variant={statusFilter === "published" ? "default" : "outline"}
              onClick={() => setStatusFilter("published")}
            >
              已发布
            </Button>
            <Button
              variant={statusFilter === "archived" ? "default" : "outline"}
              onClick={() => setStatusFilter("archived")}
            >
              已归档
            </Button>
          </div>

          <Button onClick={() => setLocation("/write")}>
            <FileText className="w-4 h-4" />
            新建文章
          </Button>
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

        {/* 统计信息 */}
        {articlesData && articlesData.total > 0 && (
          <div className="mt-4 text-sm text-muted-foreground">
            共 {articlesData.total} 篇文章
            {statusFilter && ` (筛选: ${statusFilter === "draft" ? "草稿" : statusFilter === "published" ? "已发布" : "已归档"})`}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
