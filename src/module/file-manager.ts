import { Plugin, showMessage, Dialog } from "siyuan";
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
    private isMobile: boolean;

    constructor(plugin: Plugin, isMobile: boolean = false) {
        this.plugin = plugin as ExtendedPlugin;
        // 插件数据存储的根路径，不需要包含插件名称
        this.dataDir = "";
        this.tiddlyWikiDir = "tiddlywiki";
        this.templateDir = "template";
        this.isMobile = isMobile;
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
        try {
            // 使用思源 kernel API 列出模板目录中的文件
            const response = await fetch('/api/file/readDir', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    path: `/data/storage/petal/${this.plugin.name}/${this.templateDir}`
                })
            });
            
            if (response.ok) {
                const data = await response.json();
                if (data.code === 0 && data.data) {
                    // 过滤出 .html 文件
                    const htmlFiles = data.data
                        .filter((item: any) => !item.isDir && item.name.endsWith('.html'))
                        .map((item: any) => item.name)
                        .sort();
                    
                    if (htmlFiles.length > 0) {
                        console.log('动态获取到模板文件:', htmlFiles);
                        return htmlFiles;
                    }
                }
            }
        } catch (error) {
            console.warn('使用 kernel API 获取模板文件失败，回退到固定列表模式:', error);
        }
        
        // 回退到原来的固定列表检查方式
        const knownTemplates = [
            "empty.html", 
            "tiddlywiki.html", 
            "basic.html",
            "tiddlyroam.html",  // 添加已知存在的文件
            "stroll.html",
            "drift.html",
            "notebook.html",
            "wiki.html",
            "journal.html",
            "template.html",
            "default.html",
            "blank.html",
            "custom.html"
        ];
        
        const templates: string[] = [];
        
        for (const templateName of knownTemplates) {
            try {
                const data = await this.plugin.loadData(`${this.templateDir}/${templateName}`);
                if (data) {
                    templates.push(templateName);
                    console.log(`发现模板文件: ${templateName}`);
                }
            } catch {
                continue;
            }
        }
        
        if (templates.length === 0) {
            await this.copyEmptyHtmlTemplate();
            templates.push("empty.html");
        }
        
        return templates.sort();
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
     * 显示导入选择对话框
     */
    async showImportDialog(): Promise<boolean> {
        return new Promise((resolve) => {
            const dialog = new Dialog({
                title: this.plugin.i18n.importFile || 'Import File',
                content: `<div class="b3-dialog__content">
                    <p style="margin-bottom: 16px;">${this.plugin.i18n.selectImportType || 'Please select the import type:'}</p>
                    <div style="margin: 16px 0;">
                        <button class="b3-button b3-button--outline" id="importTiddlyWiki" style="width: 100%; margin-bottom: 8px; padding: 12px; text-align: left;">
                            <div style="display: flex; align-items: center;">
                                <svg style="width: 16px; height: 16px; margin-right: 8px;"><use xlink:href="#iconTiddlyWiki"></use></svg>
                                <div>
                                    <div style="font-weight: 500;">${this.plugin.i18n.importTiddlyWiki || 'Import TiddlyWiki'}</div>
                                    <div style="font-size: 12px; opacity: 0.7; margin-top: 2px;">${this.plugin.i18n.importTiddlyWikiDesc || 'Import as a TiddlyWiki file that can be opened and edited'}</div>
                                </div>
                            </div>
                        </button>
                        <button class="b3-button b3-button--outline" id="importTemplate" style="width: 100%; padding: 12px; text-align: left;">
                            <div style="display: flex; align-items: center;">
                                <svg style="width: 16px; height: 16px; margin-right: 8px;"><use xlink:href="#iconDownload"></use></svg>
                                <div>
                                    <div style="font-weight: 500;">${this.plugin.i18n.importTemplate || 'Import Template'}</div>
                                    <div style="font-size: 12px; opacity: 0.7; margin-top: 2px;">${this.plugin.i18n.importTemplateDesc || 'Import as a template for creating new TiddlyWikis'}</div>
                                </div>
                            </div>
                        </button>
                    </div>
                </div>
                <div class="b3-dialog__action">
                    <button class="b3-button b3-button--cancel" id="cancelBtn">${this.plugin.i18n.cancel || 'Cancel'}</button>
                </div>`,
                width: this.isMobile ? "92vw" : "400px",
                destroyCallback: () => {
                    resolve(false);
                }
            });
            
            // 等待DOM元素创建完成
            setTimeout(() => {
                const importTiddlyWikiBtn = dialog.element.querySelector('#importTiddlyWiki') as HTMLButtonElement;
                const importTemplateBtn = dialog.element.querySelector('#importTemplate') as HTMLButtonElement;
                const cancelBtn = dialog.element.querySelector('#cancelBtn') as HTMLButtonElement;
                
                if (importTiddlyWikiBtn) {
                    importTiddlyWikiBtn.onclick = async () => {
                        dialog.destroy();
                        const success = await this.importTiddlyWikiFile();
                        resolve(success);
                    };
                }
                
                if (importTemplateBtn) {
                    importTemplateBtn.onclick = async () => {
                        dialog.destroy();
                        const success = await this.importTemplate();
                        resolve(success);
                    };
                }
                
                if (cancelBtn) {
                    cancelBtn.onclick = () => {
                        dialog.destroy();
                        resolve(false);
                    };
                }
            }, 100);
        });
    }

    /**
     * 导入TiddlyWiki文件到TiddlyWiki目录
     */
    async importTiddlyWikiFile(): Promise<boolean> {
        try {
            // 创建文件选择器
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.html,.htm';
            input.multiple = false;
            
            return new Promise((resolve) => {
                input.onchange = async (event: Event) => {
                    const target = event.target as HTMLInputElement;
                    const file = target.files?.[0];
                    
                    if (!file) {
                        resolve(false);
                        return;
                    }
                    
                    // 验证文件类型
                    if (!file.name.toLowerCase().endsWith('.html') && !file.name.toLowerCase().endsWith('.htm')) {
                        showMessage(this.plugin.i18n.invalidFileType);
                        resolve(false);
                        return;
                    }
                    
                    // 验证文件大小 (限制在20MB以内)
                    const maxSize = 20 * 1024 * 1024; // 20MB
                    if (file.size > maxSize) {
                        showMessage(this.plugin.i18n.fileTooLarge);
                        resolve(false);
                        return;
                    }
                    
                    try {
                        const fileContent = await this.readFileContent(file);
                        
                        // 验证是否为TiddlyWiki文件
                        if (!this.validateTiddlyWikiTemplate(fileContent)) {
                            showMessage(this.plugin.i18n.invalidTiddlyWikiTemplate);
                            resolve(false);
                            return;
                        }
                        
                        // 生成文件名
                        let fileName = file.name;
                        if (!fileName.endsWith('.html')) {
                            fileName = fileName.replace(/\.(htm)$/i, '.html');
                        }
                        
                        // 检查文件是否已存在
                        const exists = await this.tiddlyWikiExists(fileName);
                        if (exists) {
                            const shouldOverwrite = await this.confirmOverwrite(fileName);
                            if (!shouldOverwrite) {
                                resolve(false);
                                return;
                            }
                        }
                        
                        // 保存到TiddlyWiki目录
                        const filePath = `${this.tiddlyWikiDir}/${fileName}`;
                        await this.plugin.saveData(filePath, fileContent);
                        
                        // 更新文件列表
                        const currentList = await this.getTiddlyWikiList();
                        if (!currentList.includes(fileName)) {
                            currentList.push(fileName);
                            await this.updateFileList(currentList);
                        }
                        
                        showMessage(`${this.plugin.i18n.tiddlyWikiImportSuccess}: ${fileName}`);
                        console.log(`TiddlyWiki文件导入成功: ${fileName}`);
                        resolve(true);
                        
                    } catch (error) {
                        console.error('导入TiddlyWiki文件失败:', error);
                        showMessage(this.plugin.i18n.tiddlyWikiImportFailed);
                        resolve(false);
                    }
                };
                
                input.oncancel = () => {
                    resolve(false);
                };
                
                // 触发文件选择对话框
                input.click();
            });
        } catch (error) {
            console.error('创建文件选择器失败:', error);
            showMessage(this.plugin.i18n.createFilePickerFailed);
            return false;
        }
    }

    /**
     * 导入TiddlyWiki模板文件
     */
    async importTemplate(): Promise<boolean> {
        try {
            // 创建文件选择器
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.html,.htm';
            input.multiple = false;
            
            return new Promise((resolve) => {
                input.onchange = async (event: Event) => {
                    const target = event.target as HTMLInputElement;
                    const file = target.files?.[0];
                    
                    if (!file) {
                        resolve(false);
                        return;
                    }
                    
                    // 验证文件类型
                    if (!file.name.toLowerCase().endsWith('.html') && !file.name.toLowerCase().endsWith('.htm')) {
                        showMessage(this.plugin.i18n.invalidFileType);
                        resolve(false);
                        return;
                    }
                    
                    // 验证文件大小 (限制在20MB以内)
                    const maxSize = 20 * 1024 * 1024; // 20MB
                    if (file.size > maxSize) {
                        showMessage(this.plugin.i18n.fileTooLarge);
                        resolve(false);
                        return;
                    }
                    
                    try {
                        const fileContent = await this.readFileContent(file);
                        
                        // 验证是否为TiddlyWiki文件
                        if (!this.validateTiddlyWikiTemplate(fileContent)) {
                            showMessage(this.plugin.i18n.invalidTiddlyWikiTemplate);
                            resolve(false);
                            return;
                        }
                        
                        // 生成模板文件名
                        let templateName = file.name;
                        if (!templateName.endsWith('.html')) {
                            templateName = templateName.replace(/\.(htm)$/i, '.html');
                        }
                        
                        // 检查文件是否已存在
                        const templatePath = `${this.templateDir}/${templateName}`;
                        const existingTemplate = await this.plugin.loadData(templatePath);
                        
                        if (existingTemplate) {
                            // 文件已存在，询问是否覆盖
                            const shouldOverwrite = await this.confirmOverwrite(templateName);
                            if (!shouldOverwrite) {
                                resolve(false);
                                return;
                            }
                        }
                        
                        // 保存模板文件
                        await this.plugin.saveData(templatePath, fileContent);
                        
                        showMessage(`${this.plugin.i18n.templateImportSuccess}: ${templateName}`);
                        console.log(`模板导入成功: ${templateName}`);
                        resolve(true);
                        
                    } catch (error) {
                        console.error('导入模板失败:', error);
                        showMessage(this.plugin.i18n.templateImportFailed);
                        resolve(false);
                    }
                };
                
                input.oncancel = () => {
                    resolve(false);
                };
                
                // 触发文件选择对话框
                input.click();
            });
        } catch (error) {
            console.error('创建文件选择器失败:', error);
            showMessage(this.plugin.i18n.createFilePickerFailed);
            return false;
        }
    }
    
    /**
     * 读取文件内容
     */
    private async readFileContent(file: File): Promise<string> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (event) => {
                const result = event.target?.result;
                if (typeof result === 'string') {
                    resolve(result);
                } else {
                    reject(new Error('Failed to read file as text'));
                }
            };
            
            reader.onerror = () => {
                reject(new Error('Failed to read file'));
            };
            
            reader.readAsText(file, 'utf-8');
        });
    }
    
    /**
     * 验证是否为有效的TiddlyWiki模板
     */
    private validateTiddlyWikiTemplate(content: string): boolean {
        // 基本的TiddlyWiki验证
        const tiddlyWikiMarkers = [
            'TiddlyWiki',
            'tiddlywiki',
            '<!DOCTYPE html',
            '<html',
            'application/javascript'
        ];
        
        const contentLower = content.toLowerCase();
        
        // 检查是否包含TiddlyWiki的特征标识
        const hasBasicStructure = tiddlyWikiMarkers.some(marker => 
            contentLower.includes(marker.toLowerCase())
        );
        
        // 检查HTML基本结构
        const hasHtmlStructure = contentLower.includes('<html') && 
                                contentLower.includes('<head') && 
                                contentLower.includes('<body');
        
        // 检查文件大小合理性（至少1KB，避免空文件）
        const hasReasonableSize = content.length > 1024;
        
        return hasBasicStructure && hasHtmlStructure && hasReasonableSize;
    }
    
    /**
     * 确认是否覆盖现有模板
     */
    private async confirmOverwrite(templateName: string): Promise<boolean> {
        return new Promise((resolve) => {
            const dialog = document.createElement('div');
            dialog.className = 'b3-dialog';
            dialog.innerHTML = `
                <div class="b3-dialog__container">
                    <div class="b3-dialog__header">
                        ${this.plugin.i18n.confirmOverwrite}
                    </div>
                    <div class="b3-dialog__content">
                        <p>${(this.plugin.i18n.templateAlreadyExists || 'Template \'{templateName}\' already exists.').replace('{templateName}', templateName || 'unknown')}</p>
                        <p>${this.plugin.i18n.overwriteConfirmMessage}</p>
                    </div>
                    <div class="b3-dialog__action">
                        <button class="b3-button b3-button--cancel" id="cancelBtn">${this.plugin.i18n.cancel}</button>
                        <div class="fn__space"></div>
                        <button class="b3-button b3-button--text" id="confirmBtn">${this.plugin.i18n.overwrite}</button>
                    </div>
                </div>
                <div class="b3-dialog__overlay"></div>
            `;
            
            document.body.appendChild(dialog);
            
            const cancelBtn = dialog.querySelector('#cancelBtn') as HTMLButtonElement;
            const confirmBtn = dialog.querySelector('#confirmBtn') as HTMLButtonElement;
            const overlay = dialog.querySelector('.b3-dialog__overlay') as HTMLElement;
            
            const cleanup = () => {
                document.body.removeChild(dialog);
            };
            
            cancelBtn.onclick = () => {
                cleanup();
                resolve(false);
            };
            
            confirmBtn.onclick = () => {
                cleanup();
                resolve(true);
            };
            
            overlay.onclick = () => {
                cleanup();
                resolve(false);
            };
            
            // 按ESC键取消
            const handleKeydown = (event: KeyboardEvent) => {
                if (event.key === 'Escape') {
                    document.removeEventListener('keydown', handleKeydown);
                    cleanup();
                    resolve(false);
                }
            };
            
            document.addEventListener('keydown', handleKeydown);
        });
    }

    /**
     * 销毁文件管理器
     */
    destroy() {
        console.log(this.plugin.i18n.fileManagerDestroyed);
    }
}