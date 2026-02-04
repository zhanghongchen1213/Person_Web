import * as cron from "node-cron";
import * as db from "../db";

let scheduledTask: cron.ScheduledTask | null = null;

/**
 * Get cron expression based on backup interval
 */
function getCronExpression(interval: "weekly" | "monthly" | "quarterly"): string {
  switch (interval) {
    case "weekly":
      // Every Sunday at 00:00
      return "0 0 * * 0";
    case "monthly":
      // First day of every month at 00:00
      return "0 0 1 * *";
    case "quarterly":
      // First day of Jan, Apr, Jul, Oct at 00:00
      return "0 0 1 1,4,7,10 *";
    default:
      return "0 0 1 * *";
  }
}

/**
 * Execute backup task
 */
async function executeBackup(): Promise<void> {
  try {
    console.log("[Backup] Starting automatic backup...");
    const { exportData } = await db.exportAllData();
    await db.saveBackupFile(exportData);
    await db.updateLastBackupTime();
    console.log("[Backup] Automatic backup completed successfully");
  } catch (error) {
    console.error("[Backup] Automatic backup failed:", error);
  }
}

/**
 * Start or restart the backup scheduler
 */
export async function restartScheduler(): Promise<void> {
  // Stop existing task
  if (scheduledTask) {
    scheduledTask.stop();
    scheduledTask = null;
  }

  // Get current settings
  const settings = await db.getBackupSettings();

  if (!settings.enabled) {
    console.log("[Backup] Scheduler disabled");
    return;
  }

  const cronExpr = getCronExpression(settings.interval);
  scheduledTask = cron.schedule(cronExpr, executeBackup, {
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  });

  console.log(`[Backup] Scheduler started with interval: ${settings.interval}`);
}

/**
 * Initialize backup scheduler on server startup
 */
export async function initBackupScheduler(): Promise<void> {
  try {
    await db.ensureBackupDir();
    await restartScheduler();
  } catch (error) {
    console.error("[Backup] Failed to initialize scheduler:", error);
  }
}
