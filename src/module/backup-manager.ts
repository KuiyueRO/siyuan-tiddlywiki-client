/**
 * 备份管理器
 * 负责TiddlyWiki文件的备份、恢复和清理
 */
import { Plugin, showMessage } from "siyuan";
import { ExtendedPlugin } from "./types";

export class BackupManager {
    private plugin: ExtendedPlugin;
    private backupDir: string;
    private maxBackups = 10; // 每个文件最多保留10个备份
    private maxBackupAgeDays = 30; // 备份保留30天

    constructor(plugin: Plugin) {
        this.plugin = plugin as ExtendedPlugin;
        this.backupDir = "backups";
    }

    /**
     * 初始化备份目录
     */
    async initialize(): Promise<void> {
        try {
            await this.plugin.saveData(`${this.backupDir}/.gitkeep`, "");
            await this.plugin.removeData(`${this.backupDir}/.gitkeep`);
            console.log("Backup manager initialized");
        } catch (error) {
            console.error("Failed to initialize backup directory:", error);
        }
    }

    /**
     * 创建备份
     * @param originalName 原始文件名（如 "wiki1.html"）
     * @returns 备份文件名，失败返回 null
     */
    async createBackup(originalName: string): Promise<string | null> {
        try {
            // 读取原文件内容
            const originalPath = `tiddlywiki/${originalName}`;
            const content = await this.plugin.loadData(originalPath);

            if (!content) {
                console.log(`Original file not found: ${originalName}`);
                return null;
            }

            // 生成备份文件名
            const backupFileName = this.generateBackupFileName(originalName);
            const backupPath = `${this.backupDir}/${backupFileName}`;

            // 保存备份
            await this.plugin.saveData(backupPath, content);

            console.log(`Backup created: ${backupFileName}`);

            // 清理旧备份
            await this.cleanOldBackups(originalName);

            return backupFileName;
        } catch (error) {
            console.error(`Failed to create backup for ${originalName}:`, error);
            return null;
        }
    }

    /**
     * 生成备份文件名
     * 格式: 原文件名_YYYYMMDDThhmmss_随机7位ID.扩展名
     * 例如: wiki1_20260203T143022_a3b5f9c.html
     */
    private generateBackupFileName(originalName: string): string {
        // 分离文件名和扩展名
        const lastDotIndex = originalName.lastIndexOf(".");
        const baseName = lastDotIndex !== -1 ? originalName.substring(0, lastDotIndex) : originalName;
        const extension = lastDotIndex !== -1 ? originalName.substring(lastDotIndex) : "";

        // 生成时间戳（本地时间）
        const now = new Date();
        const timestamp = now.getFullYear() +
            String(now.getMonth() + 1).padStart(2, "0") +
            String(now.getDate()).padStart(2, "0") +
            "T" +
            String(now.getHours()).padStart(2, "0") +
            String(now.getMinutes()).padStart(2, "0") +
            String(now.getSeconds()).padStart(2, "0");

        // 生成7位随机UID
        const uid = this.generateUid(7);

        return `${baseName}_${timestamp}_${uid}${extension}`;
    }

    /**
     * 生成随机UID
     * @param length 长度
     * @returns 随机字符串
     */
    private generateUid(length: number): string {
        const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
        let result = "";
        for (let i = 0; i < length; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }

    /**
     * 清理旧备份
     * @param originalName 原始文件名
     */
    private async cleanOldBackups(originalName: string): Promise<void> {
        try {
            const backups = await this.getBackupList(originalName);

            // 按时间排序（文件名包含时间戳，可直接字符串排序）
            backups.sort((a, b) => b.localeCompare(a)); // 降序，最新的在前

            // 如果备份数量超过限制，删除旧的
            if (backups.length > this.maxBackups) {
                const toDelete = backups.slice(this.maxBackups);
                for (const backup of toDelete) {
                    await this.plugin.removeData(`${this.backupDir}/${backup}`);
                    console.log(`Deleted old backup: ${backup}`);
                }
            }

            // 删除超过30天的备份
            await this.cleanExpiredBackups(backups);
        } catch (error) {
            console.error("Failed to clean old backups:", error);
        }
    }

    /**
     * 清理过期的备份（超过30天）
     */
    private async cleanExpiredBackups(backups: string[]): Promise<void> {
        const now = Date.now();
        const maxAge = this.maxBackupAgeDays * 24 * 60 * 60 * 1000;

        for (const backup of backups) {
            try {
                const timestamp = this.extractTimestampFromBackupName(backup);
                if (timestamp && (now - timestamp) > maxAge) {
                    await this.plugin.removeData(`${this.backupDir}/${backup}`);
                    console.log(`Deleted expired backup: ${backup}`);
                }
            } catch (error) {
                console.error(`Failed to check expiry for ${backup}:`, error);
            }
        }
    }

    /**
     * 从备份文件名中提取时间戳
     */
    private extractTimestampFromBackupName(backupName: string): number | null {
        // 文件名格式: base_YYYYMMDDThhmmss_uid.ext
        const match = backupName.match(/_(\d{8}T\d{6})_/);
        if (!match) return null;

        const timestampStr = match[1];
        const year = parseInt(timestampStr.substring(0, 4));
        const month = parseInt(timestampStr.substring(4, 6)) - 1;
        const day = parseInt(timestampStr.substring(6, 8));
        const hour = parseInt(timestampStr.substring(9, 11));
        const minute = parseInt(timestampStr.substring(11, 13));
        const second = parseInt(timestampStr.substring(13, 15));

        return new Date(year, month, day, hour, minute, second).getTime();
    }

    /**
     * 获取备份文件的完整路径（公开方法）
     */
    getBackupPath(backupName: string): string {
        return `${this.backupDir}/${backupName}`;
    }

    /**
     * 从备份文件名中提取时间戳（公开方法）
     */
    extractTimestamp(backupName: string): number | null {
        return this.extractTimestampFromBackupName(backupName);
    }

    /**
     * 获取指定文件的所有备份
     */
    async getBackupList(originalName: string): Promise<string[]> {
        try {
            // 使用 kernel API 扫描备份目录
            const response = await fetch("/api/file/readDir", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    path: `/data/storage/petal/${this.plugin.name}/${this.backupDir}`
                })
            });

            if (response.ok) {
                const data = await response.json();
                if (data.code === 0 && data.data) {
                    const baseName = originalName.replace(/\.[^/.]+$/, ""); // 移除扩展名
                    return data.data
                        .filter((item: any) => !item.isDir && item.name.startsWith(`${baseName}_`))
                        .map((item: any) => item.name);
                }
            }
        } catch (error) {
            console.warn("Failed to get backup list from API, trying fallback:", error);
        }

        return [];
    }

    /**
     * 从备份恢复文件
     * @param backupName 备份文件名
     * @returns 原始文件名，失败返回 null
     */
    async restoreFromBackup(backupName: string): Promise<string | null> {
        try {
            // 提取原始文件名
            const originalName = this.extractOriginalName(backupName);
            if (!originalName) {
                throw new Error("Cannot extract original name from backup");
            }

            // 读取备份内容
            const backupPath = `${this.backupDir}/${backupName}`;
            const backupContent = await this.plugin.loadData(backupPath);

            if (!backupContent) {
                throw new Error("Backup content is empty");
            }

            // 先备份当前文件（如果存在）
            await this.createBackup(originalName);

            // 恢复内容
            const originalPath = `tiddlywiki/${originalName}`;
            await this.plugin.saveData(originalPath, backupContent);

            console.log(`Restored from backup: ${backupName} -> ${originalName}`);
            showMessage(this.plugin.i18n.backupRecovered + ": " + originalName);

            return originalName;
        } catch (error) {
            console.error(`Failed to restore from backup ${backupName}:`, error);
            showMessage(this.plugin.i18n.backupRestoreFailed + ": " + error.message, 5000);
            return null;
        }
    }

    /**
     * 从备份文件名中提取原始文件名
     * 例如: wiki1_20260203T143022_a3b5f9c.html -> wiki1.html
     */
    private extractOriginalName(backupName: string): string | null {
        // 文件名格式: base_YYYYMMDDThhmmss_uid.ext
        const match = backupName.match(/^(.+?)_\d{8}T\d{6}_[a-z0-9]{7}(.+)$/);
        if (!match) return null;

        const baseName = match[1];
        const extension = match[2];
        return baseName + extension;
    }

    /**
     * 获取备份目录信息
     */
    async getBackupInfo(): Promise<{
        totalBackups: number;
        totalSize: number;
        files: Array<{ name: string; size: number; date: Date }>;
    }> {
        try {
            const response = await fetch("/api/file/readDir", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    path: `/data/storage/petal/${this.plugin.name}/${this.backupDir}`
                })
            });

            if (response.ok) {
                const data = await response.json();
                if (data.code === 0 && data.data) {
                    const files = data.data
                        .filter((item: any) => !item.isDir && item.name.endsWith(".html"))
                        .map((item: any) => {
                            const timestamp = this.extractTimestampFromBackupName(item.name);
                            return {
                                name: item.name,
                                size: item.size || 0,
                                date: timestamp ? new Date(timestamp) : new Date(item.updated || 0)
                            };
                        });

                    return {
                        totalBackups: files.length,
                        totalSize: files.reduce((sum, f) => sum + f.size, 0),
                        files
                    };
                }
            }
        } catch (error) {
            console.error("Failed to get backup info:", error);
        }

        return { totalBackups: 0, totalSize: 0, files: [] };
    }

    /**
     * 清理所有备份
     */
    async clearAllBackups(): Promise<number> {
        try {
            const info = await this.getBackupInfo();
            let deleted = 0;

            for (const file of info.files) {
                await this.plugin.removeData(`${this.backupDir}/${file.name}`);
                deleted++;
            }

            console.log(`Cleared ${deleted} backups`);
            return deleted;
        } catch (error) {
            console.error("Failed to clear backups:", error);
            return 0;
        }
    }
}
