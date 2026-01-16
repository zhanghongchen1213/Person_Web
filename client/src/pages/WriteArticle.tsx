import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { useLocation, useParams } from "wouter";
import { useState, useEffect } from "react";
import { Loader2, Save, ArrowLeft, Trash2, Folder, FileText, BookOpen } from "lucide-react";
import { toast } from "sonner";
import { MarkdownEditor } from "@/components/MarkdownEditor";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function WriteArticle() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const params = useParams<{ id?: string }>();
  const articleId = params.id ? parseInt(params.id) : undefined;
  const isEditing = !!articleId;

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [summary, setSummary] = useState("");
  const [content, setContent] = useState("");
  const [coverImage, setCoverImage] = useState("");
  const [categoryId, setCategoryId] = useState<number | undefined>();
  const [status, setStatus] = useState<"draft" | "published">("draft");
  const [articleType, setArticleType] = useState<"blog" | "doc">("blog");
  const [order, setOrder] = useState<number>(0);

  const { data: categories } = trpc.category.list.useQuery();
  const { data: existingArticle, isLoading: articleLoading } = trpc.article.byId.useQuery(
    { id: articleId! },
    { enabled: isEditing }
  );

  const utils = trpc.useUtils();

  const createMutation = trpc.article.create.useMutation({
    onSuccess: (data) => {
      toast.success("文章创建成功");
      utils.article.list.invalidate();
      utils.article.adminList.invalidate();
      setLocation(`/article/${slug}`);
    },
    onError: (error) => {
      toast.error(error.message || "创建失败");
    },
  });

  const updateMutation = trpc.article.update.useMutation({
    onSuccess: () => {
      toast.success("文章更新成功");
      utils.article.list.invalidate();
      utils.article.adminList.invalidate();
      utils.article.byId.invalidate({ id: articleId });
      setLocation(`/article/${slug}`);
    },
    onError: (error) => {
      toast.error(error.message || "更新失败");
    },
  });

  const deleteMutation = trpc.article.delete.useMutation({
    onSuccess: () => {
      toast.success("文章已删除");
      utils.article.list.invalidate();
      utils.article.adminList.invalidate();
      setLocation("/articles");
    },
    onError: (error) => {
      toast.error(error.message || "删除失败");
    },
  });

  // Load existing article data
  useEffect(() => {
    if (existingArticle) {
      setTitle(existingArticle.title);
      setSlug(existingArticle.slug);
      setSummary(existingArticle.summary || "");
      setContent(existingArticle.content);
      setCoverImage(existingArticle.coverImage || "");
      setCategoryId(existingArticle.categoryId || undefined);
      setStatus(existingArticle.status === "published" ? "published" : "draft");
      setArticleType(existingArticle.type || "blog");
      setOrder(existingArticle.order || 0);
    }
  }, [existingArticle]);

  // Auto-generate slug from title
  useEffect(() => {
    if (!isEditing && title) {
      const generatedSlug = title
        .toLowerCase()
        .replace(/[^\w\u4e00-\u9fa5]+/g, "-")
        .replace(/^-+|-+$/g, "");
      setSlug(generatedSlug);
    }
  }, [title, isEditing]);

  const handleSubmit = (publishStatus: "draft" | "published") => {
    if (!title.trim()) {
      toast.error("请输入文章标题");
      return;
    }
    if (!slug.trim()) {
      toast.error("请输入文章 Slug");
      return;
    }
    if (!content.trim()) {
      toast.error("请输入文章内容");
      return;
    }

    if (!categoryId) {
      toast.error("请选择技术分类");
      return;
    }

    const data = {
      title: title.trim(),
      slug: slug.trim(),
      summary: summary.trim() || undefined,
      content: content.trim(),
      coverImage: coverImage.trim() || undefined,
      categoryId: categoryId,
      status: publishStatus,
      type: articleType,
      order: order,
    };

    if (isEditing) {
      updateMutation.mutate({ id: articleId!, ...data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleDelete = () => {
    if (articleId) {
      deleteMutation.mutate({ id: articleId });
    }
  };

  // Auth check
  if (authLoading || (isEditing && articleLoading)) {
    return (
      <div className="min-h-screen flex flex-col bg-background text-foreground">
        <Navbar />
        <main className="flex-1 pt-16 md:pt-20 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin" />
        </main>
        <Footer />
      </div>
    );
  }

  if (!isAuthenticated || user?.role !== "admin") {
    return (
      <div className="min-h-screen flex flex-col bg-background text-foreground">
        <Navbar />
        <main className="flex-1 pt-16 md:pt-20">
          <div className="container py-20 text-center">
            <h1 className="text-4xl md:text-5xl mb-4">无权限</h1>
            <p className="text-muted-foreground text-lg mb-8">
              只有管理员可以创建和编辑文章
            </p>
            <button onClick={() => setLocation("/")} className="brutalist-btn">
              返回首页
            </button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Navbar />

      <main className="flex-1 pt-16 md:pt-20">
        {/* Header */}
        <div className="border-b-2 border-border">
          <div className="container py-6">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setLocation("/articles")}
                className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-wider hover:underline underline-offset-4"
              >
                <ArrowLeft className="w-4 h-4" />
                返回
              </button>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleSubmit("draft")}
                  disabled={isSaving}
                  className="inline-flex items-center gap-2 px-4 py-2 border-2 border-border font-bold uppercase text-sm hover:bg-muted transition-colors disabled:opacity-50"
                >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  保存草稿
                </button>
                <button
                  onClick={() => handleSubmit("published")}
                  disabled={isSaving}
                  className="brutalist-btn text-sm disabled:opacity-50"
                >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  发布
                </button>
                {isEditing && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <button className="inline-flex items-center gap-2 px-4 py-2 border-2 border-destructive text-destructive font-bold uppercase text-sm hover:bg-destructive hover:text-destructive-foreground transition-colors">
                        <Trash2 className="w-4 h-4" />
                        删除
                      </button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="border-2 border-border">
                      <AlertDialogHeader>
                        <AlertDialogTitle>确认删除</AlertDialogTitle>
                        <AlertDialogDescription>
                          此操作无法撤销，文章将被永久删除。
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel className="border-2 border-border">取消</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleDelete}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          删除
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="container py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Editor */}
            <div className="lg:col-span-2 space-y-6">
              {/* Title */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-2">
                  标题 *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="输入文章标题"
                  className="brutalist-input text-2xl font-bold"
                />
              </div>

              {/* Slug */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-2">
                  Slug *
                </label>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="article-url-slug"
                  className="brutalist-input"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  URL 路径: /article/{slug || "your-slug"}
                </p>
              </div>

              {/* Summary */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-2">
                  摘要
                </label>
                <textarea
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  placeholder="文章摘要（可选）"
                  rows={3}
                  className="brutalist-input resize-none"
                />
              </div>

              {/* Content - Split View Markdown Editor */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-2">
                  内容 * (Markdown)
                </label>
                <MarkdownEditor
                  value={content}
                  onChange={setContent}
                  placeholder="使用 Markdown 格式编写文章内容..."
                  minHeight="500px"
                />
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Cover Image */}
              <div className="border-2 border-border p-4">
                <label className="block text-xs font-bold uppercase tracking-wider mb-2">
                  封面图片
                </label>
                <input
                  type="text"
                  value={coverImage}
                  onChange={(e) => setCoverImage(e.target.value)}
                  placeholder="图片 URL"
                  className="brutalist-input text-sm"
                />
                {coverImage && (
                  <div className="mt-4 aspect-video overflow-hidden border border-border">
                    <img
                      src={coverImage}
                      alt="Cover preview"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                  </div>
                )}
              </div>

              {/* Article Type */}
              <div className="border-2 border-border p-4">
                <label className="block text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-2">
                  内容类型
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setArticleType("blog")}
                    className={`flex-1 p-3 border-2 transition-all flex items-center justify-center gap-2 ${
                      articleType === "blog"
                        ? "border-primary bg-primary text-primary-foreground font-bold"
                        : "border-border hover:border-primary/50 hover:bg-muted"
                    }`}
                  >
                    <FileText className="w-4 h-4" />
                    博客
                  </button>
                  <button
                    type="button"
                    onClick={() => setArticleType("doc")}
                    className={`flex-1 p-3 border-2 transition-all flex items-center justify-center gap-2 ${
                      articleType === "doc"
                        ? "border-primary bg-primary text-primary-foreground font-bold"
                        : "border-border hover:border-primary/50 hover:bg-muted"
                    }`}
                  >
                    <BookOpen className="w-4 h-4" />
                    文档
                  </button>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {articleType === "blog" ? "博客文章按时间排序显示" : "文档按排序权重显示在文档中心"}
                </p>
              </div>

              {/* Order (for documentation) */}
              {articleType === "doc" && (
                <div className="border-2 border-border p-4">
                  <label className="block text-xs font-bold uppercase tracking-wider mb-2">
                    排序权重
                  </label>
                  <input
                    type="number"
                    value={order}
                    onChange={(e) => setOrder(parseInt(e.target.value) || 0)}
                    placeholder="0"
                    min={0}
                    className="brutalist-input text-sm"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    数值越小排序越靠前，默认为 0
                  </p>
                </div>
              )}

              {/* Category - Enhanced Button Group */}
              <div className="border-4 border-border p-6 bg-accent/5">
                <label className="block text-sm font-black uppercase tracking-widest mb-4 flex items-center gap-2">
                  <Folder className="w-5 h-5" />
                  技术分类
                  <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {categories?.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setCategoryId(cat.id)}
                      className={`p-4 border-2 transition-all text-left ${
                        categoryId === cat.id
                          ? "border-primary bg-primary text-primary-foreground font-black scale-105"
                          : "border-border hover:border-primary/50 hover:bg-muted"
                      }`}
                    >
                      <div className="font-bold">{cat.name}</div>
                      {cat.description && (
                        <p className="text-xs opacity-80 mt-1">{cat.description}</p>
                      )}
                    </button>
                  ))}
                </div>
                {!categoryId && (
                  <p className="text-xs text-red-500 mt-3 font-medium">
                    请为文章选择一个技术分类
                  </p>
                )}
              </div>

              {/* Status */}
              <div className="border-2 border-border p-4">
                <label className="block text-xs font-bold uppercase tracking-wider mb-2">
                  状态
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="status"
                      checked={status === "draft"}
                      onChange={() => setStatus("draft")}
                      className="w-4 h-4"
                    />
                    <span className="text-sm font-medium">草稿</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="status"
                      checked={status === "published"}
                      onChange={() => setStatus("published")}
                      className="w-4 h-4"
                    />
                    <span className="text-sm font-medium">已发布</span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
