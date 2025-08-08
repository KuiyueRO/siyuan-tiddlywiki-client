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
        this.dataDir = '';
        this.tiddlyWikiDir = `tiddlywiki`;
        this.templateDir = `template`;
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
            await this.plugin.saveData(`${this.templateDir}/.gitkeep`, '');
            await this.plugin.removeData(`${this.templateDir}/.gitkeep`);
            
            // 创建tiddlywiki目录  
            await this.plugin.saveData(`${this.tiddlyWikiDir}/.gitkeep`, '');
            await this.plugin.removeData(`${this.tiddlyWikiDir}/.gitkeep`);
            
            console.log("目录结构已创建");
        } catch (error) {
            console.error("创建目录结构时出错:", error);
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
                console.log("empty.html模板已存在");
            }
        } catch (error) {
            console.error("检查template文件时出错:", error);
            // 即使检查失败，也尝试复制模板文件
            await this.copyEmptyHtmlTemplate();
        }
    }

    /**
     * 复制内置的empty.html到数据目录的template文件夹
     */
    private async copyEmptyHtmlTemplate() {
        try {
            // 尝试多种可能的路径来访问插件内置的template文件
            // 思源笔记插件的静态资源路径格式
            const possiblePaths = [
                `/plugins/${this.plugin.name}/template/empty.html`,
                `/plugins/${this.plugin.name}/dist/template/empty.html`,
                `/data/plugins/${this.plugin.name}/template/empty.html`,
                `/data/plugins/${this.plugin.name}/dist/template/empty.html`,
                `./plugins/${this.plugin.name}/template/empty.html`,
                `./plugins/${this.plugin.name}/dist/template/empty.html`,
                // 尝试当前域名下的路径
                `${window.location.origin}/plugins/${this.plugin.name}/template/empty.html`,
                `${window.location.origin}/plugins/${this.plugin.name}/dist/template/empty.html`
            ];

            let htmlContent: string | null = null;
            let successPath: string | null = null;

            for (const path of possiblePaths) {
                try {
                    console.log(`尝试路径: ${path}`);
                    const response = await fetch(path);
                    
                    if (response.ok) {
                        htmlContent = await response.text();
                        successPath = path;
                        console.log(`成功从路径获取模板: ${path}`);
                        break;
                    } else {
                        console.log(`路径 ${path} 失败，状态: ${response.status}`);
                    }
                } catch (pathError) {
                    console.log(`路径 ${path} 出错:`, pathError);
                    continue;
                }
            }

            if (htmlContent && successPath) {
                // 使用插件数据API保存到数据目录
                const templatePath = `${this.templateDir}/empty.html`;
                await this.plugin.saveData(templatePath, htmlContent);
                
                console.log("empty.html模板已复制到数据目录:", templatePath);
                showMessage("TiddlyWiki模板初始化成功");
            } else {
                // 如果所有路径都失败，创建一个基础的TiddlyWiki模板
                console.warn("无法访问内置模板，创建基础模板");
                await this.createBasicTemplate();
            }
        } catch (error) {
            console.error("复制empty.html模板时出错:", error);
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
            
            console.log("基础模板已创建:", templatePath);
            showMessage("已创建基础TiddlyWiki模板，建议手动上传完整的TiddlyWiki文件");
        } catch (error) {
            console.error("创建基础模板失败:", error);
            showMessage("初始化TiddlyWiki模板失败");
        }
    }

    /**
     * 获取所有可用的模板文件
     */
    async getTemplates(): Promise<string[]> {
        try {
            // 先确保template目录存在
            await this.ensureTemplateExists();
            
            // 动态读取template目录中的所有.html文件
            const templates: string[] = [];
            
            // 尝试读取template目录
            try {
                // 使用思源API读取目录内容
                const response = await fetch('/api/file/readDir', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        path: this.templateDir
                    })
                });
                
                if (response.ok) {
                    const result = await response.json();
                    if (result.code === 0 && result.data) {
                        // 过滤出.html文件
                        for (const file of result.data) {
                            if (file.name.endsWith('.html')) {
                                templates.push(file.name);
                            }
                        }
                    }
                }
            } catch (apiError) {
                console.warn("API读取目录失败，尝试fallback:", apiError);
            }
            
            // 如果没有找到模板，确保至少有empty.html
            if (templates.length === 0) {
                const emptyHtmlPath = `${this.templateDir}/empty.html`;
                const existingData = await this.plugin.loadData(emptyHtmlPath);
                
                if (existingData) {
                    templates.push('empty.html');
                } else {
                    console.warn("模板文件不存在，尝试重新复制");
                    await this.copyEmptyHtmlTemplate();
                    templates.push('empty.html');
                }
            }
            
            console.log("找到的模板文件:", templates);
            return templates;
            
        } catch (error) {
            console.error("获取模板列表时出错:", error);
            return ['empty.html']; // fallback
        }
    }

    /**
     * 创建新的TiddlyWiki文件
     */
    async createTiddlyWiki(name: string, templateName: string = 'empty.html'): Promise<boolean> {
        try {
            // 确保文件名以.html结尾
            if (!name.endsWith('.html')) {
                name += '.html';
            }

            // 检查文件是否已存在
            const exists = await this.tiddlyWikiExists(name);
            if (exists) {
                showMessage(`TiddlyWiki "${name}" 已存在`);
                return false;
            }

            // 读取模板内容
            const templateContent = await this.readTemplate(templateName);
            if (!templateContent) {
                showMessage(`无法读取模板 "${templateName}"`);
                return false;
            }

            // 创建新的TiddlyWiki文件
            const filePath = `${this.tiddlyWikiDir}/${name}`;
            await this.plugin.saveData(filePath, templateContent);

            // 更新文件列表
            try {
                const currentList = await this.getTiddlyWikiList();
                if (!currentList.includes(name)) {
                    currentList.push(name);
                    await this.updateFileList(currentList);
                }
            } catch (listError) {
                console.error("更新文件列表时出错:", listError);
                // 如果获取列表失败，直接创建新列表
                await this.updateFileList([name]);
            }

            showMessage(`TiddlyWiki "${name}" 创建成功`);
            return true;
        } catch (error) {
            console.error("创建TiddlyWiki时出错:", error);
            showMessage("创建TiddlyWiki失败");
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
            console.error("读取模板时出错:", error);
            return null;
        }
    }

    /**
     * 获取所有TiddlyWiki文件列表
     */
    async getTiddlyWikiList(): Promise<string[]> {
        try {
            // 由于无法直接列目录，我们需要维护一个文件列表
            // 先尝试加载文件列表
            const listPath = `${this.tiddlyWikiDir}/.file-list`;
            const listData = await this.plugin.loadData(listPath);
            
            if (listData) {
                try {
                    console.log("读取到的文件列表数据:", listData, "类型:", typeof listData);
                    
                    let fileList: string[];
                    
                    // 如果数据已经是数组，直接使用
                    if (Array.isArray(listData)) {
                        console.log("数据已经是数组格式，直接使用");
                        fileList = listData;
                    } else if (typeof listData === 'string') {
                        // 如果是字符串，尝试解析JSON
                        if (!listData || listData.trim() === '') {
                            console.log("文件列表数据为空，返回空数组");
                            return [];
                        }
                        
                        // 处理可能的单引号格式（JavaScript数组格式）
                        let jsonString = listData;
                        if (jsonString.includes("'")) {
                            console.log("检测到单引号格式，转换为双引号");
                            jsonString = jsonString.replace(/'/g, '"');
                        }
                        
                        fileList = JSON.parse(jsonString);
                    } else {
                        console.warn("未知的数据格式，尝试转换为字符串");
                        const jsonString = String(listData).replace(/'/g, '"');
                        fileList = JSON.parse(jsonString);
                    }
                    
                    // 确保解析出的是数组
                    if (!Array.isArray(fileList)) {
                        console.warn("解析结果不是数组格式，重置为空数组");
                        await this.updateFileList([]);
                        return [];
                    }
                    
                    // 验证文件是否还存在
                    const validFiles = [];
                    for (const fileName of fileList) {
                        if (typeof fileName === 'string' && fileName.trim()) {
                            const exists = await this.tiddlyWikiExists(fileName);
                            if (exists) {
                                validFiles.push(fileName);
                            }
                        }
                    }
                    
                    console.log("有效文件列表:", validFiles);
                    
                    // 更新文件列表
                    if (validFiles.length !== fileList.length) {
                        await this.updateFileList(validFiles);
                    }
                    
                    return validFiles;
                } catch (parseError) {
                    console.error("解析文件列表失败:", parseError, "数据:", listData);
                    // 重置文件列表
                    await this.updateFileList([]);
                    return [];
                }
            }
            
            return [];
        } catch (error) {
            console.error("获取TiddlyWiki列表时出错:", error);
            return [];
        }
    }

    /**
     * 更新文件列表
     */
    private async updateFileList(fileList: string[]) {
        try {
            const listPath = `${this.tiddlyWikiDir}/.file-list`;
            console.log("保存文件列表:", fileList);
            // 直接保存数组，让思源API处理序列化
            await this.plugin.saveData(listPath, fileList);
        } catch (error) {
            console.error("更新文件列表失败:", error);
        }
    }

    /**
     * 重命名TiddlyWiki文件
     */
    async renameTiddlyWiki(oldName: string, newName: string): Promise<boolean> {
        try {
            // 确保新文件名以.html结尾
            if (!newName.endsWith('.html')) {
                newName += '.html';
            }

            // 检查新文件名是否已存在
            const exists = await this.tiddlyWikiExists(newName);
            if (exists) {
                showMessage(`文件 "${newName}" 已存在`);
                return false;
            }

            // 读取原文件内容
            const content = await this.readTiddlyWiki(oldName);
            if (!content) {
                showMessage(`无法读取原文件 "${oldName}"`);
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

            showMessage(`文件已重命名为 "${newName}"`);
            return true;
        } catch (error) {
            console.error("重命名TiddlyWiki时出错:", error);
            showMessage("重命名失败");
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

            showMessage(`TiddlyWiki "${name}" 已删除`);
            return true;
        } catch (error) {
            console.error("删除TiddlyWiki时出错:", error);
            showMessage("删除失败");
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
            console.error("读取TiddlyWiki时出错:", error);
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
            console.log(`TiddlyWiki文件已保存: ${filePath}`);
            return true;
        } catch (error) {
            console.error("保存TiddlyWiki时出错:", error);
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
        console.log("文件管理器已销毁");
    }
}