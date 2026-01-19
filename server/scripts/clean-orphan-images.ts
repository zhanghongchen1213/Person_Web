/**
 * 本地图片清理脚本
 * 功能：扫描 /uploads 目录，清理数据库中未引用的孤儿图片
 *
 * 使用方法：
 * - 开发环境：pnpm tsx server/scripts/clean-orphan-images.ts
 * - 生产环境：配置 Cron Job 定期执行
 *
 * 安全策略：
 * - 保留最近 7 天的图片（即使未被引用）
 * - 提供 dry-run 模式，先预览再删除
 */

import "dotenv/config";
import { promises as fs } from "fs";
import * as path from "path";
import { getDb } from "../db";
import { articles } from "../../drizzle/schema";

// 配置项
const UPLOADS_DIR = path.join(process.cwd(), "uploads");
const RETENTION_DAYS = 7; // 保留最近 7 天的图片
const DRY_RUN = process.argv.includes("--dry-run"); // 是否为预览模式

interface CleanupReport {
  totalFiles: number;
  referencedFiles: number;
  orphanFiles: number;
  recentFiles: number;
  deletedFiles: number;
  deletedSize: number;
  errors: string[];
}

/**
 * 检查目录是否存在，不存在则创建
 */
async function ensureUploadsDir(): Promise<boolean> {
  try {
    await fs.access(UPLOADS_DIR);
    return true;
  } catch {
    console.log(`[Info] uploads 目录不存在: ${UPLOADS_DIR}`);
    console.log(`[Info] 创建 uploads 目录...`);
    try {
      await fs.mkdir(UPLOADS_DIR, { recursive: true });
      console.log(`[Success] uploads 目录创建成功`);
      return true;
    } catch (error) {
      console.error(`[Error] 无法创建 uploads 目录:`, error);
      return false;
    }
  }
}

/**
 * 递归扫描目录，获取所有图片文件
 */
async function scanImageFiles(dir: string): Promise<string[]> {
  const imageExtensions = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg"];
  const files: string[] = [];

  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        // 递归扫描子目录
        const subFiles = await scanImageFiles(fullPath);
        files.push(...subFiles);
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name).toLowerCase();
        if (imageExtensions.includes(ext)) {
          files.push(fullPath);
        }
      }
    }
  } catch (error) {
    console.error(`[Error] 扫描目录失败 ${dir}:`, error);
  }

  return files;
}

/**
 * 从数据库获取所有被引用的图片路径
 */
async function getReferencedImages(): Promise<Set<string>> {
  const db = await getDb();
  if (!db) {
    throw new Error("数据库连接失败");
  }

  const referencedImages = new Set<string>();

  try {
    // 查询所有文章
    const allArticles = await db.select().from(articles);

    for (const article of allArticles) {
      // 从 content 字段中提取图片路径
      if (article.content) {
        extractImagePaths(article.content, referencedImages);
      }

      // 从 coverImage 字段中提取图片路径
      if (article.coverImage) {
        extractImagePaths(article.coverImage, referencedImages);
      }
    }

    console.log(`[Info] 从数据库中找到 ${referencedImages.size} 个被引用的图片`);
  } catch (error) {
    console.error(`[Error] 查询数据库失败:`, error);
    throw error;
  }

  return referencedImages;
}

/**
 * 从文本内容中提取图片路径
 * 支持 Markdown 格式: ![alt](path) 和 HTML 格式: <img src="path">
 */
function extractImagePaths(content: string, imageSet: Set<string>): void {
  // 匹配 Markdown 图片语法: ![alt](path)
  const markdownRegex = /!\[.*?\]\((.*?)\)/g;
  let match;
  while ((match = markdownRegex.exec(content)) !== null) {
    const imagePath = match[1];
    if (imagePath && imagePath.includes("/uploads/")) {
      imageSet.add(normalizeImagePath(imagePath));
    }
  }

  // 匹配 HTML img 标签: <img src="path">
  const htmlRegex = /<img[^>]+src=["']([^"']+)["']/g;
  while ((match = htmlRegex.exec(content)) !== null) {
    const imagePath = match[1];
    if (imagePath && imagePath.includes("/uploads/")) {
      imageSet.add(normalizeImagePath(imagePath));
    }
  }

  // 直接匹配 /uploads/ 路径
  const directRegex = /\/uploads\/[^\s"')]+/g;
  while ((match = directRegex.exec(content)) !== null) {
    imageSet.add(normalizeImagePath(match[0]));
  }
}

/**
 * 规范化图片路径，统一格式
 */
function normalizeImagePath(imagePath: string): string {
  // 移除 URL 参数和锚点
  let normalized = imagePath.split("?")[0].split("#")[0];

  // 提取 /uploads/ 之后的路径
  const uploadsIndex = normalized.indexOf("/uploads/");
  if (uploadsIndex !== -1) {
    normalized = normalized.substring(uploadsIndex + "/uploads/".length);
  }

  return normalized;
}

/**
 * 检查文件是否在保留期内（最近 N 天）
 */
async function isRecentFile(filePath: string, retentionDays: number): Promise<boolean> {
  try {
    const stats = await fs.stat(filePath);
    const fileAge = Date.now() - stats.mtimeMs;
    const retentionMs = retentionDays * 24 * 60 * 60 * 1000;
    return fileAge < retentionMs;
  } catch {
    return false;
  }
}

/**
 * 格式化文件大小
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
}

/**
 * 删除孤儿图片
 */
async function deleteOrphanImages(
  allFiles: string[],
  referencedImages: Set<string>
): Promise<CleanupReport> {
  const report: CleanupReport = {
    totalFiles: allFiles.length,
    referencedFiles: 0,
    orphanFiles: 0,
    recentFiles: 0,
    deletedFiles: 0,
    deletedSize: 0,
    errors: [],
  };

  console.log(`\n[Info] 开始分析图片文件...`);

  for (const filePath of allFiles) {
    const relativePath = path.relative(UPLOADS_DIR, filePath);
    const isReferenced = referencedImages.has(relativePath);

    if (isReferenced) {
      report.referencedFiles++;
      continue;
    }

    // 文件未被引用
    report.orphanFiles++;

    // 检查是否在保留期内
    const isRecent = await isRecentFile(filePath, RETENTION_DAYS);
    if (isRecent) {
      report.recentFiles++;
      console.log(`[Skip] 保留最近文件: ${relativePath}`);
      continue;
    }

    // 删除文件
    try {
      const stats = await fs.stat(filePath);
      const fileSize = stats.size;

      if (DRY_RUN) {
        console.log(`[Dry-Run] 将删除: ${relativePath} (${formatBytes(fileSize)})`);
        report.deletedFiles++;
        report.deletedSize += fileSize;
      } else {
        await fs.unlink(filePath);
        console.log(`[Deleted] ${relativePath} (${formatBytes(fileSize)})`);
        report.deletedFiles++;
        report.deletedSize += fileSize;
      }
    } catch (error) {
      const errorMsg = `删除文件失败 ${relativePath}: ${error}`;
      console.error(`[Error] ${errorMsg}`);
      report.errors.push(errorMsg);
    }
  }

  return report;
}

/**
 * 打印清理报告
 */
function printReport(report: CleanupReport): void {
  console.log("\n" + "=".repeat(60));
  console.log("清理报告 (Cleanup Report)");
  console.log("=".repeat(60));
  console.log(`总文件数:           ${report.totalFiles}`);
  console.log(`被引用文件:         ${report.referencedFiles}`);
  console.log(`孤儿文件:           ${report.orphanFiles}`);
  console.log(`保留的最近文件:     ${report.recentFiles}`);
  console.log(`${DRY_RUN ? "将" : "已"}删除文件:       ${report.deletedFiles}`);
  console.log(`${DRY_RUN ? "将" : "已"}释放空间:       ${formatBytes(report.deletedSize)}`);

  if (report.errors.length > 0) {
    console.log(`\n错误数量:           ${report.errors.length}`);
    console.log("\n错误详情:");
    report.errors.forEach((error, index) => {
      console.log(`  ${index + 1}. ${error}`);
    });
  }

  console.log("=".repeat(60));

  if (DRY_RUN) {
    console.log("\n[提示] 这是预览模式，未实际删除文件");
    console.log("[提示] 要执行实际删除，请运行: pnpm tsx server/scripts/clean-orphan-images.ts");
  }
}

/**
 * 主函数
 */
async function main(): Promise<void> {
  console.log("=".repeat(60));
  console.log("本地图片清理脚本 (Orphan Images Cleanup)");
  console.log("=".repeat(60));
  console.log(`模式:               ${DRY_RUN ? "预览模式 (Dry-Run)" : "执行模式"}`);
  console.log(`上传目录:           ${UPLOADS_DIR}`);
  console.log(`保留天数:           ${RETENTION_DAYS} 天`);
  console.log("=".repeat(60));

  try {
    // 1. 检查 uploads 目录
    console.log("\n[Step 1/4] 检查 uploads 目录...");
    const dirExists = await ensureUploadsDir();
    if (!dirExists) {
      console.error("[Error] uploads 目录不可用，退出脚本");
      process.exit(1);
    }

    // 2. 扫描所有图片文件
    console.log("\n[Step 2/4] 扫描图片文件...");
    const allFiles = await scanImageFiles(UPLOADS_DIR);
    console.log(`[Info] 找到 ${allFiles.length} 个图片文件`);

    if (allFiles.length === 0) {
      console.log("\n[Info] 没有找到任何图片文件，无需清理");
      return;
    }

    // 3. 从数据库获取被引用的图片
    console.log("\n[Step 3/4] 查询数据库中被引用的图片...");
    const referencedImages = await getReferencedImages();

    // 4. 删除孤儿图片
    console.log("\n[Step 4/4] 清理孤儿图片...");
    const report = await deleteOrphanImages(allFiles, referencedImages);

    // 5. 打印报告
    printReport(report);

    // 6. 退出
    if (report.errors.length > 0) {
      console.log("\n[Warning] 清理过程中出现错误，请检查日志");
      process.exit(1);
    } else {
      console.log("\n[Success] 清理完成！");
      process.exit(0);
    }
  } catch (error) {
    console.error("\n[Fatal Error] 脚本执行失败:", error);
    process.exit(1);
  }
}

// 执行主函数
main();
