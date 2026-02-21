import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { useState, useRef, useEffect } from "react";
import {
  Loader2,
  Database,
  Download,
  Upload,
  AlertTriangle,
  Clock,
  Settings,
} from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export default function AdminDatabase() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [, setLocation] = useLocation();

  // Export state
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [exportStats, setExportStats] = useState<{
    userCount: number;
    articleCount: number;
    categoryCount: number;
  } | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  // Import state
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [importPreview, setImportPreview] = useState<{
    userCount: number;
    articleCount: number;
    categoryCount: number;
    version: string;
    exportedAt: string;
  } | null>(null);
  const [importData, setImportData] = useState<Record<string, unknown>>(null);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto backup state
  const [autoBackupEnabled, setAutoBackupEnabled] = useState(false);
  const [autoBackupInterval, setAutoBackupInterval] = useState<"weekly" | "monthly" | "quarterly">("monthly");
  const [isSavingBackupSettings, setIsSavingBackupSettings] = useState(false);

  // tRPC queries and mutations
  const statsMutation = trpc.database.stats.useQuery(undefined, { enabled: false });
  const exportMutation = trpc.database.export.useQuery(undefined, { enabled: false });
  const backupSettingsQuery = trpc.database.backupSettings.useQuery();
  const updateBackupSettingsMutation = trpc.database.updateBackupSettings.useMutation({
    onSuccess: (result) => {
      toast.success("自动备份设置已保存");
      setAutoBackupEnabled(result.enabled);
      setAutoBackupInterval(result.interval);
      setIsSavingBackupSettings(false);
    },
    onError: (error) => {
      toast.error(`保存失败: ${error.message}`);
      setIsSavingBackupSettings(false);
    },
  });
  const importMutation = trpc.database.import.useMutation({
    onSuccess: (result) => {
      toast.success(`导入成功！用户: ${result.userCount}, 文章: ${result.articleCount}, 分类: ${result.categoryCount}`);
      setShowImportDialog(false);
      setImportPreview(null);
      setImportData(null);
      setIsImporting(false);
    },
    onError: (error) => {
      toast.error(`导入失败: ${error.message}`);
      setIsImporting(false);
    },
  });

  // Sync backup settings from server
  useEffect(() => {
    if (backupSettingsQuery.data) {
      setAutoBackupEnabled(backupSettingsQuery.data.enabled);
      setAutoBackupInterval(backupSettingsQuery.data.interval);
    }
  }, [backupSettingsQuery.data]);

  // Handle export button click
  const handleExportClick = async () => {
    try {
      const result = await statsMutation.refetch();
      if (result.data) {
        setExportStats(result.data);
        setShowExportDialog(true);
      }
    } catch {
      toast.error("获取数据统计失败");
    }
  };

  // Handle export confirm
  const handleExportConfirm = async () => {
    setIsExporting(true);
    try {
      const result = await exportMutation.refetch();
      if (result.data) {
        const { exportData } = result.data;
        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        const now = new Date();
        const timestamp = now.toISOString().replace(/[:.]/g, "-").slice(0, 19);
        a.href = url;
        a.download = `manual-backup-${timestamp}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast.success("数据导出成功！");
      }
    } catch {
      toast.error("导出失败");
    } finally {
      setIsExporting(false);
      setShowExportDialog(false);
    }
  };

  // Handle file selection
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_FILE_SIZE) {
      toast.error("文件过大，请选择小于 10MB 的文件");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        if (!data.version || !data.data) {
          toast.error("无效的备份文件格式");
          return;
        }
        setImportData(data);
        setImportPreview({
          userCount: data.data.users?.length || 0,
          articleCount: data.data.articles?.length || 0,
          categoryCount: data.data.categories?.length || 0,
          version: data.version,
          exportedAt: data.exportedAt,
        });
        setShowImportDialog(true);
      } catch {
        toast.error("JSON 解析失败，请检查文件格式");
      }
    };
    reader.readAsText(file);
    event.target.value = "";
  };

  // Handle import confirm
  const handleImportConfirm = async () => {
    if (!importData) return;

    setIsImporting(true);
    // First backup current data
    try {
      const backupResult = await exportMutation.refetch();
      if (backupResult.data) {
        const { exportData } = backupResult.data;
        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        const now = new Date();
        const timestamp = now.toISOString().replace(/[:.]/g, "-").slice(0, 19);
        a.href = url;
        a.download = `pre-import-backup-${timestamp}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast.info("已自动备份当前数据");
      }
    } catch {
      toast.warning("自动备份失败，继续导入...");
    }

    // Then import
    importMutation.mutate(importData);
  };

  // Handle save backup settings
  const handleSaveBackupSettings = () => {
    setIsSavingBackupSettings(true);
    updateBackupSettingsMutation.mutate({
      enabled: autoBackupEnabled,
      interval: autoBackupInterval,
    });
  };

  // Format date for display
  const formatDateTime = (date: Date | string | null) => {
    if (!date) return "-";
    return new Date(date).toLocaleString("zh-CN");
  };



  // Permission check
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
              只有管理员可以访问数据库管理页面
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

      <main className="flex-1 container mx-auto px-4 py-8 max-w-4xl">
        {/* Page header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Database className="w-8 h-8" />
            <h1 className="text-3xl font-bold">数据库管理</h1>
          </div>
          <p className="text-muted-foreground">
            导出或导入博客数据，用于备份或迁移到其他环境
          </p>
        </div>

        {/* Cards */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Export Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="w-5 h-5" />
                导出数据
              </CardTitle>
              <CardDescription>
                将所有用户、文章、分类数据导出为 JSON 文件
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={handleExportClick} className="w-full">
                <Download className="w-4 h-4 mr-2" />
                导出数据
              </Button>
            </CardContent>
          </Card>

          {/* Import Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="w-5 h-5" />
                导入数据
              </CardTitle>
              <CardDescription>
                从 JSON 备份文件恢复数据（将覆盖现有数据）
              </CardDescription>
            </CardHeader>
            <CardContent>
              <input
                type="file"
                accept=".json"
                ref={fileInputRef}
                onChange={handleFileSelect}
                className="hidden"
              />
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="w-full"
              >
                <Upload className="w-4 h-4 mr-2" />
                选择文件
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Auto Backup Card */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              自动备份
            </CardTitle>
            <CardDescription>
              配置定时自动备份，备份文件保存在服务器 backups/ 目录
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {backupSettingsQuery.isLoading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="auto-backup-switch">启用自动备份</Label>
                    <p className="text-sm text-muted-foreground">
                      开启后系统将按设定间隔自动备份数据
                    </p>
                  </div>
                  <Switch
                    id="auto-backup-switch"
                    checked={autoBackupEnabled}
                    onCheckedChange={setAutoBackupEnabled}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>备份间隔</Label>
                    <p className="text-sm text-muted-foreground">
                      选择自动备份的执行频率
                    </p>
                  </div>
                  <Select
                    value={autoBackupInterval}
                    onValueChange={(v) => setAutoBackupInterval(v as "weekly" | "monthly" | "quarterly")}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="weekly">每周</SelectItem>
                      <SelectItem value="monthly">每月</SelectItem>
                      <SelectItem value="quarterly">每季度</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {backupSettingsQuery.data && (
                  <div className="bg-muted p-4 rounded-lg space-y-2 text-sm">
                    <p>
                      <span className="text-muted-foreground">上次备份：</span>
                      <strong>{formatDateTime(backupSettingsQuery.data.lastBackupAt)}</strong>
                    </p>
                    <p>
                      <span className="text-muted-foreground">下次备份：</span>
                      <strong>{formatDateTime(backupSettingsQuery.data.nextBackupAt)}</strong>
                    </p>
                  </div>
                )}

                <Button
                  onClick={handleSaveBackupSettings}
                  disabled={isSavingBackupSettings}
                  className="w-full"
                >
                  {isSavingBackupSettings && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                  <Settings className="w-4 h-4 mr-2" />
                  保存设置
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        {/* Export Dialog */}
        <AlertDialog open={showExportDialog} onOpenChange={setShowExportDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>确认导出数据</AlertDialogTitle>
              <AlertDialogDescription asChild>
                <div className="space-y-4">
                  <p>即将导出以下数据：</p>
                  <div className="bg-muted p-4 rounded-lg space-y-2">
                    <p>用户: <strong>{exportStats?.userCount || 0}</strong> 个</p>
                    <p>文章: <strong>{exportStats?.articleCount || 0}</strong> 篇</p>
                    <p>分类: <strong>{exportStats?.categoryCount || 0}</strong> 个</p>
                  </div>
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isExporting}>取消</AlertDialogCancel>
              <AlertDialogAction onClick={handleExportConfirm} disabled={isExporting}>
                {isExporting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                确认导出
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Import Dialog */}
        <AlertDialog open={showImportDialog} onOpenChange={setShowImportDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-yellow-500" />
                确认导入数据
              </AlertDialogTitle>
              <AlertDialogDescription asChild>
                <div className="space-y-4">
                  <p>即将导入以下数据：</p>
                  <div className="bg-muted p-4 rounded-lg space-y-2">
                    <p>版本: <strong>{importPreview?.version}</strong></p>
                    <p>导出时间: <strong>{importPreview?.exportedAt ? new Date(importPreview.exportedAt).toLocaleString("zh-CN") : "-"}</strong></p>
                    <p>用户: <strong>{importPreview?.userCount || 0}</strong> 个</p>
                    <p>文章: <strong>{importPreview?.articleCount || 0}</strong> 篇</p>
                    <p>分类: <strong>{importPreview?.categoryCount || 0}</strong> 个</p>
                  </div>
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 p-4 rounded-lg">
                    <p className="text-yellow-800 dark:text-yellow-200 text-sm">
                      <strong>警告：</strong>此操作将覆盖所有现有数据，系统会先自动备份当前数据。
                    </p>
                  </div>
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isImporting}>取消</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleImportConfirm}
                disabled={isImporting}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {isImporting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                确认导入
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </main>

      <Footer />
    </div>
  );
}
