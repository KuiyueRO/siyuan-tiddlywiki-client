import { Plugin, showMessage } from "siyuan";
import { ExtendedPlugin } from "./types";

/**
 * TiddlyWiki 文件管理器
 * 负责TiddlyWiki文件的创建、删除、重命名和模板管理
 */
export class FileManager {
    private plugin: ExtendedPlugin;
    private dataDir: string;
    private tiddlyWikiDir: string;
    private templateDir: string;

    constructor(plugin: Plugin) {
        this.plugin = plugin as ExtendedPlugin;
        // 插件数据存储的根路径，不需要包含插件名称
        this.dataDir = "";
        this.tiddlyWikiDir = "tiddlywiki";
        this.templateDir = "template";
    }

    /**
     * 初始化文件管理器，创建必要的目录结构
     */
    async initialize() {
        await this.ensureDirectoriesExist();
        await this.ensureTemplateExists();
    }

    /**
     * 确保目录结构存在
     */
    private async ensureDirectoriesExist() {
        // 使用思源插件的数据保存API来确保目录存在
        // 先创建一个临时文件来确保目录存在，然后删除它
        try {
            // 创建template目录
            await this.plugin.saveData(`${this.templateDir}/.gitkeep`, "");
            await this.plugin.removeData(`${this.templateDir}/.gitkeep`);
            
            // 创建tiddlywiki目录  
            await this.plugin.saveData(`${this.tiddlyWikiDir}/.gitkeep`, "");
            await this.plugin.removeData(`${this.tiddlyWikiDir}/.gitkeep`);
            
            console.log(this.plugin.i18n.directoryCreated);
        } catch (error) {
            console.error(this.plugin.i18n.createDirectoryError + ":", error);
        }
    }

    /**
     * 确保template目录中有empty.html文件
     */
    private async ensureTemplateExists() {
        try {
            // 检查template目录中是否已存在empty.html
            const emptyHtmlPath = `${this.templateDir}/empty.html`;
            const existingData = await this.plugin.loadData(emptyHtmlPath);

            if (!existingData) {
                // 从插件内置template复制empty.html到数据目录
                await this.copyEmptyHtmlTemplate();
            } else {
                console.log(this.plugin.i18n.emptyTemplateExists);
            }
        } catch (error) {
            console.error(this.plugin.i18n.checkTemplateError + ":", error);
            // 即使检查失败，也尝试复制模板文件
            await this.copyEmptyHtmlTemplate();
        }
    }

    /**
     * 复制内置的empty.html到数据目录的template文件夹
     */
    private async copyEmptyHtmlTemplate() {
        try {
            const possiblePaths = [
                `/plugins/${this.plugin.name}/template/empty.html`,
                `/plugins/${this.plugin.name}/dist/template/empty.html`,
                `${window.location.origin}/plugins/${this.plugin.name}/template/empty.html`
            ];

            for (const path of possiblePaths) {
                try {
                    const response = await fetch(path);
                    if (response.ok) {
                        const htmlContent = await response.text();
                        const templatePath = `${this.templateDir}/empty.html`;
                        await this.plugin.saveData(templatePath, htmlContent);
                        console.log(this.plugin.i18n.emptyTemplateCopied + ":", templatePath);
                        showMessage(this.plugin.i18n.templateInitSuccess);
                        return;
                    }
                } catch (pathError) {
                    continue;
                }
            }

            console.warn(this.plugin.i18n.cannotAccessBuiltinTemplate);
            await this.createBasicTemplate();
        } catch (error) {
            console.error(this.plugin.i18n.copyTemplateError + ":", error);
            // 如果复制失败，尝试创建基础模板
            await this.createBasicTemplate();
        }
    }

    /**
     * 创建基础的TiddlyWiki模板
     */
    private async createBasicTemplate() {
        try {
            // 创建一个更完整的基础TiddlyWiki模板
            const basicTemplate = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="utf-8">
    <title>TiddlyWiki - 基础版</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 20px;
            background: #f8f9fa;
            color: #333;
        }
        .header {
            background: #fff;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            margin-bottom: 20px;
        }
        .content {
            background: #fff;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            line-height: 1.6;
        }
        h1 { color: #2c5282; margin-top: 0; }
        .note { 
            background: #e2e8f0; 
            padding: 15px; 
            border-radius: 4px; 
            margin: 15px 0;
            border-left: 4px solid #4299e1;
        }
        .instructions {
            background: #fef5e7;
            padding: 15px;
            border-radius: 4px;
            border-left: 4px solid #ed8936;
            margin: 15px 0;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>🗒️ TiddlyWiki - 基础模板</h1>
        <p>欢迎使用TiddlyWiki插件！</p>
    </div>
    
    <div class="content">
        <div class="note">
            <strong>注意：</strong> 这是一个基础模板，功能有限。为了获得完整的TiddlyWiki体验，建议进行以下操作：
        </div>
        
        <div class="instructions">
            <h3>📝 如何获得完整的TiddlyWiki：</h3>
            <ol>
                <li>访问 <a href="https://tiddlywiki.com" target="_blank">TiddlyWiki官网</a></li>
                <li>下载最新的空白TiddlyWiki HTML文件</li>
                <li>将文件重命名为 <code>empty.html</code></li>
                <li>通过思源笔记的文件管理功能，将文件放置到插件数据目录的template文件夹中</li>
                <li>重新启动插件或刷新页面</li>
            </ol>
        </div>
        
        <h3>✨ 功能介绍：</h3>
        <ul>
            <li><strong>创建TiddlyWiki：</strong> 在dock面板点击 + 按钮创建新的TiddlyWiki文件</li>
            <li><strong>管理文件：</strong> 重命名、删除TiddlyWiki文件</li>
            <li><strong>在线编辑：</strong> 在标签页中直接编辑TiddlyWiki内容</li>
            <li><strong>模板系统：</strong> 支持多个模板，快速创建不同类型的TiddlyWiki</li>
        </ul>
        
        <div class="note">
            <strong>提示：</strong> 插件会自动保存您的TiddlyWiki文件到思源笔记的数据目录中，确保数据安全。
        </div>
    </div>
</body>
</html>`;

            const templatePath = `${this.templateDir}/empty.html`;
            await this.plugin.saveData(templatePath, basicTemplate);
            
            console.log(this.plugin.i18n.basicTemplateCreated + ":", templatePath);
            showMessage(this.plugin.i18n.basicTemplateCreatedMessage);
        } catch (error) {
            console.error(this.plugin.i18n.createBasicTemplateFailed + ":", error);
            showMessage(this.plugin.i18n.initTemplateError);
        }
    }

    /**
     * 获取所有可用的模板文件
     */
    async getTemplates(): Promise<string[]> {
        const knownTemplates = ["empty.html", "tiddlywiki.html", "basic.html"];
        const templates: string[] = [];
        
        for (const templateName of knownTemplates) {
            try {
                const data = await this.plugin.loadData(`${this.templateDir}/${templateName}`);
                if (data) templates.push(templateName);
            } catch {
                continue;
            }
        }
        
        if (templates.length === 0) {
            await this.copyEmptyHtmlTemplate();
            templates.push("empty.html");
        }
        
        return templates;
    }

    /**
     * 创建新的TiddlyWiki文件
     */
    async createTiddlyWiki(name: string, templateName = "empty.html"): Promise<boolean> {
        try {
            // 确保文件名以.html结尾
            if (!name.endsWith(".html")) {
                name += ".html";
            }

            // 检查文件是否已存在
            const exists = await this.tiddlyWikiExists(name);
            if (exists) {
                showMessage(`${this.plugin.i18n.dockTitle} "${name}" ${this.plugin.i18n.tiddlyWikiExists}`);
                return false;
            }

            // 读取模板内容
            const templateContent = await this.readTemplate(templateName);
            if (!templateContent) {
                showMessage(`${this.plugin.i18n.cannotReadTemplate} "${templateName}"`);  
                return false;
            }

            // 创建新的TiddlyWiki文件
            const filePath = `${this.tiddlyWikiDir}/${name}`;
            await this.plugin.saveData(filePath, templateContent);

            // 更新文件列表
            const currentList = await this.getTiddlyWikiList();
            if (!currentList.includes(name)) {
                currentList.push(name);
                await this.updateFileList(currentList);
            }

            showMessage(`${this.plugin.i18n.dockTitle} "${name}" ${this.plugin.i18n.tiddlyWikiCreated}`);
            return true;
        } catch (error) {
            console.error(this.plugin.i18n.createTiddlyWikiError + ":", error);
            showMessage(this.plugin.i18n.createTiddlyWikiFailed);
            return false;
        }
    }

    /**
     * 检查TiddlyWiki文件是否存在
     */
    async tiddlyWikiExists(name: string): Promise<boolean> {
        try {
            const filePath = `${this.tiddlyWikiDir}/${name}`;
            const data = await this.plugin.loadData(filePath);
            return !!data;
        } catch (error) {
            return false;
        }
    }

    /**
     * 读取模板文件内容
     */
    async readTemplate(templateName: string): Promise<string | null> {
        try {
            const templatePath = `${this.templateDir}/${templateName}`;
            const data = await this.plugin.loadData(templatePath);
            return data || null;
        } catch (error) {
            console.error(this.plugin.i18n.readTemplateError + ":", error);
            return null;
        }
    }

    /**
     * 获取所有TiddlyWiki文件列表
     */
    async getTiddlyWikiList(): Promise<string[]> {
        try {
            const listData = await this.plugin.loadData(`${this.tiddlyWikiDir}/.file-list`);
            if (!listData) return [];
            
            let fileList: string[];
            if (Array.isArray(listData)) {
                fileList = listData;
            } else if (typeof listData === "string") {
                if (!listData.trim()) return [];
                const jsonString = listData.includes("'") ? listData.replace(/'/g, '"') : listData;
                fileList = JSON.parse(jsonString);
            } else {
                fileList = JSON.parse(String(listData).replace(/'/g, '"'));
            }
            
            if (!Array.isArray(fileList)) {
                await this.updateFileList([]);
                return [];
            }
            
            const validFiles = [];
            for (const fileName of fileList) {
                if (typeof fileName === "string" && fileName.trim() && await this.tiddlyWikiExists(fileName)) {
                    validFiles.push(fileName);
                }
            }
            
            if (validFiles.length !== fileList.length) {
                await this.updateFileList(validFiles);
            }
            
            return validFiles;
        } catch (error) {
            console.error(this.plugin.i18n.getTiddlyWikiListError + ":", error);
            return [];
        }
    }

    /**
     * 更新文件列表
     */
    private async updateFileList(fileList: string[]) {
        try {
            await this.plugin.saveData(`${this.tiddlyWikiDir}/.file-list`, fileList);
        } catch (error) {
            console.error(this.plugin.i18n.updateFileListError + ":", error);
        }
    }

    /**
     * 重命名TiddlyWiki文件
     */
    async renameTiddlyWiki(oldName: string, newName: string): Promise<boolean> {
        try {
            // 确保新文件名以.html结尾
            if (!newName.endsWith(".html")) {
                newName += ".html";
            }

            // 检查新文件名是否已存在
            const exists = await this.tiddlyWikiExists(newName);
            if (exists) {
                showMessage(`${this.plugin.i18n.fileExists} "${newName}"`);
                return false;
            }

            // 读取原文件内容
            const content = await this.readTiddlyWiki(oldName);
            if (!content) {
                showMessage(`${this.plugin.i18n.cannotReadOriginalFile} "${oldName}"`);
                return false;
            }

            // 创建新文件
            const newFilePath = `${this.tiddlyWikiDir}/${newName}`;
            await this.plugin.saveData(newFilePath, content);

            // 删除原文件
            const oldFilePath = `${this.tiddlyWikiDir}/${oldName}`;
            await this.plugin.removeData(oldFilePath);

            // 更新文件列表
            const currentList = await this.getTiddlyWikiList();
            const updatedList = currentList.filter(name => name !== oldName);
            if (!updatedList.includes(newName)) {
                updatedList.push(newName);
            }
            await this.updateFileList(updatedList);

            showMessage(`${this.plugin.i18n.fileRenamedTo} "${newName}"`);
            return true;
        } catch (error) {
            console.error(this.plugin.i18n.renameTiddlyWikiError + ":", error);
            showMessage(this.plugin.i18n.renameTiddlyWikiFailed);
            return false;
        }
    }

    /**
     * 删除TiddlyWiki文件
     */
    async deleteTiddlyWiki(name: string): Promise<boolean> {
        try {
            const filePath = `${this.tiddlyWikiDir}/${name}`;
            await this.plugin.removeData(filePath);

            // 更新文件列表
            const currentList = await this.getTiddlyWikiList();
            const updatedList = currentList.filter(fileName => fileName !== name);
            await this.updateFileList(updatedList);

            showMessage(`${this.plugin.i18n.dockTitle} "${name}" ${this.plugin.i18n.tiddlyWikiDeleted}`);
            return true;
        } catch (error) {
            console.error(this.plugin.i18n.deleteTiddlyWikiError + ":", error);
            showMessage(this.plugin.i18n.deleteTiddlyWikiFailed);
            return false;
        }
    }

    /**
     * 读取TiddlyWiki文件内容
     */
    async readTiddlyWiki(name: string): Promise<string | null> {
        try {
            const filePath = `${this.tiddlyWikiDir}/${name}`;
            const data = await this.plugin.loadData(filePath);
            return data || null;
        } catch (error) {
            console.error(this.plugin.i18n.readTiddlyWikiError + ":", error);
            return null;
        }
    }

    /**
     * 保存TiddlyWiki文件内容
     */
    async saveTiddlyWiki(name: string, content: string): Promise<boolean> {
        try {
            const filePath = `${this.tiddlyWikiDir}/${name}`;
            await this.plugin.saveData(filePath, content);
            console.log(`${this.plugin.i18n.tiddlyWikiFileSaved}: ${filePath}`);
            return true;
        } catch (error) {
            console.error(this.plugin.i18n.saveTiddlyWikiError + ":", error);
            return false;
        }
    }

    /**
     * 获取TiddlyWiki文件的完整路径
     */
    getTiddlyWikiPath(name: string): string {
        return `${this.tiddlyWikiDir}/${name}`;
    }

    /**
     * 销毁文件管理器
     */
    destroy() {
        console.log(this.plugin.i18n.fileManagerDestroyed);
    }
}