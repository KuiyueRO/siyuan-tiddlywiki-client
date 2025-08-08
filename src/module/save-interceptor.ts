import { Plugin, showMessage } from "siyuan";
import { ExtendedPlugin } from "./types";
import { FileManager } from "./file-manager";

/**
 * TiddlyWiki 保存拦截器
 * 拦截TiddlyWiki的下载操作并自动保存到原文件
 */
export class SaveInterceptor {
    private plugin: ExtendedPlugin;
    private fileManager: FileManager;
    private currentFileName: string | null = null;
    private currentIframe: HTMLIFrameElement | null = null;
    private interceptors: Array<() => void> = [];

    constructor(plugin: Plugin) {
        this.plugin = plugin as ExtendedPlugin;
        this.fileManager = new FileManager(plugin);
    }

    /**
     * 为指定的iframe设置保存拦截
     * @param iframe TiddlyWiki的iframe元素
     * @param fileName 当前编辑的文件名
     */
    setupSaveInterception(iframe: HTMLIFrameElement, fileName: string) {
        console.log(this.plugin.i18n.setupSaveInterception.replace("{fileName}", fileName));
        
        this.currentFileName = fileName;
        this.currentIframe = iframe;

        // 等待iframe完全加载后再设置拦截
        if (iframe.contentDocument && iframe.contentDocument.readyState === "complete") {
            this.setupInterceptors(iframe);
        } else {
            iframe.onload = () => {
                setTimeout(() => {
                    this.setupInterceptors(iframe);
                }, 100); // 短暂延迟确保TiddlyWiki完全初始化
            };
        }
    }

    /**
     * 设置各种拦截器
     */
    private setupInterceptors(iframe: HTMLIFrameElement) {
        try {
            const iframeDoc = iframe.contentDocument;
            const iframeWindow = iframe.contentWindow;
            
            if (!iframeDoc || !iframeWindow) {
                console.error(this.plugin.i18n.cannotAccessIframeContent);
                return;
            }

            console.log(this.plugin.i18n.startSetupInterceptors);

            // 1. 拦截 <a> 标签的下载点击
            this.interceptDownloadLinks(iframeDoc);

            // 2. 拦截 URL.createObjectURL 创建的 blob URL
            this.interceptBlobUrls(iframeWindow);

            // 3. 拦截 document.createElement('a') 动态创建的下载链接
            this.interceptDynamicDownloads(iframeWindow);

            // 4. 监听键盘快捷键保存
            this.interceptKeyboardSave(iframeDoc);

            console.log(this.plugin.i18n.allInterceptorsSetup);

        } catch (error) {
            console.error(this.plugin.i18n.setupInterceptorsError + ":", error);
        }
    }

    /**
     * 拦截下载链接点击
     */
    private interceptDownloadLinks(doc: Document) {
        console.log(this.plugin.i18n.setupDownloadLinkInterception);

        const interceptClick = (event: MouseEvent) => {
            const target = event.target as HTMLElement;
            
            // 检查是否是带download属性的链接
            if (target.tagName === "A") {
                const link = target as HTMLAnchorElement;
                if (link.hasAttribute("download") && link.href) {
                    console.log(this.plugin.i18n.interceptedDownloadLink + ":", link.href);
                    event.preventDefault();
                    event.stopPropagation();
                    
                    // 处理保存
                    this.handleSave(link.href, link.download || "tiddlywiki.html");
                    return;
                }
            }

            // 检查父元素是否包含下载链接
            let currentElement = target.parentElement;
            while (currentElement) {
                if (currentElement.tagName === "A") {
                    const link = currentElement as HTMLAnchorElement;
                    if (link.hasAttribute("download") && link.href) {
                        console.log(this.plugin.i18n.interceptedParentDownloadLink + ":", link.href);
                        event.preventDefault();
                        event.stopPropagation();
                        
                        // 处理保存
                        this.handleSave(link.href, link.download || "tiddlywiki.html");
                        return;
                    }
                }
                currentElement = currentElement.parentElement;
            }
        };

        // 添加点击事件监听器
        doc.addEventListener("click", interceptClick, true);
        
        // 保存清理函数
        this.interceptors.push(() => {
            doc.removeEventListener("click", interceptClick, true);
        });
    }

    /**
     * 拦截 Blob URL 创建
     */
    private interceptBlobUrls(win: Window) {
        console.log(this.plugin.i18n.setupBlobUrlInterception);

        // 保存原始方法
        const originalCreateObjectURL = win.URL.createObjectURL;
        const blobCache = new Map<string, Blob>();
        const plugin = this.plugin; // 保存 plugin 引用

        // 重写 createObjectURL 方法
        win.URL.createObjectURL = function(object: Blob | MediaSource) {
            const url = originalCreateObjectURL.call(win.URL, object);
            
            // 如果是 Blob 对象，缓存它
            if (object instanceof Blob) {
                console.log(plugin.i18n.cacheBlobUrl + ":", url, "Type:", object.type);
                blobCache.set(url, object);
            }
            
            return url;
        };

        // 监听所有链接点击，检查是否是 blob URL
        const interceptBlobClick = async (event: MouseEvent) => {
            const target = event.target as HTMLElement;
            let link: HTMLAnchorElement | null = null;

            if (target.tagName === "A") {
                link = target as HTMLAnchorElement;
            } else {
                // 查找父级链接元素
                let current = target.parentElement;
                while (current && current.tagName !== "A") {
                    current = current.parentElement;
                }
                if (current && current.tagName === "A") {
                    link = current as HTMLAnchorElement;
                }
            }

            if (link && link.href.startsWith("blob:") && blobCache.has(link.href)) {
                console.log(this.plugin.i18n.interceptedBlobUrlClick + ":", link.href);
                event.preventDefault();
                event.stopPropagation();

                const blob = blobCache.get(link.href);
                if (blob) {
                    try {
                        const text = await blob.text();
                        await this.saveToFile(text);
                        
                        // 清理 blob URL
                        win.URL.revokeObjectURL(link.href);
                        blobCache.delete(link.href);
                    } catch (error) {
                        console.error(this.plugin.i18n.processBlobContentError + ":", error);
                    }
                }
            }
        };

        win.document.addEventListener("click", interceptBlobClick, true);

        // 保存清理函数
        this.interceptors.push(() => {
            win.URL.createObjectURL = originalCreateObjectURL;
            win.document.removeEventListener("click", interceptBlobClick, true);
        });
    }

    /**
     * 拦截动态创建的下载链接
     */
    private interceptDynamicDownloads(win: Window) {
        console.log(this.plugin.i18n.setupDynamicDownloadInterception);

        const originalCreateElement = win.document.createElement;
        const plugin = this.plugin; // 保存 plugin 引用
        
        win.document.createElement = function(tagName: string, options?: ElementCreationOptions) {
            const element = originalCreateElement.call(win.document, tagName, options);
            
            if (tagName.toLowerCase() === "a") {
                const link = element as HTMLAnchorElement;
                
                // 重写 click 方法
                const originalClick = link.click;
                link.click = function() {
                    if (this.hasAttribute("download") && this.href) {
                        console.log(plugin.i18n.interceptedDynamicDownloadLink + ":", this.href);
                        
                        // 阻止默认点击行为
                        // 使用保存拦截器处理
                        if (this.href.startsWith("blob:") || this.href.startsWith("data:")) {
                            // 异步处理保存
                            setTimeout(async () => {
                                try {
                                    let content: string;
                                    if (this.href.startsWith("data:")) {
                                        // 处理 data URL
                                        const dataUrl = this.href;
                                        const base64Data = dataUrl.split(",")[1];
                                        content = atob(base64Data);
                                    } else {
                                        // 处理 blob URL
                                        const response = await fetch(this.href);
                                        content = await response.text();
                                    }
                                    
                                    // 保存到文件
                                    const interceptor = (win as any).__saveInterceptor;
                                    if (interceptor) {
                                        await interceptor.saveToFile(content);
                                    }
                                } catch (error) {
                                    console.error(plugin.i18n.processDynamicDownloadFailed + ":", error);
                                }
                            }, 0);
                            
                            return; // 阻止原始点击
                        }
                    }
                    
                    // 对于非下载链接，执行原始点击
                    originalClick.call(this);
                };
            }
            
            return element;
        };

        // 在window对象上存储当前拦截器实例的引用
        (win as any).__saveInterceptor = this;

        // 保存清理函数
        this.interceptors.push(() => {
            win.document.createElement = originalCreateElement;
            delete (win as any).__saveInterceptor;
        });
    }

    /**
     * 拦截键盘快捷键保存（Ctrl+S）
     */
    private interceptKeyboardSave(doc: Document) {
        console.log(this.plugin.i18n.setupKeyboardSaveInterception);

        const interceptKeydown = (event: KeyboardEvent) => {
            if ((event.ctrlKey || event.metaKey) && event.key === "s") {
                console.log(this.plugin.i18n.interceptedCtrlS);
                event.preventDefault();
                event.stopPropagation();
                
                // 触发 TiddlyWiki 的保存，但会被我们的其他拦截器捕获
                // 这里我们可以直接调用保存逻辑，或者让TiddlyWiki自己处理然后被拦截
                this.triggerTiddlyWikiSave();
            }
        };

        doc.addEventListener("keydown", interceptKeydown, true);
        
        // 保存清理函数
        this.interceptors.push(() => {
            doc.removeEventListener("keydown", interceptKeydown, true);
        });
    }

    /**
     * 触发 TiddlyWiki 的保存操作
     */
    private triggerTiddlyWikiSave() {
        try {
            if (!this.currentIframe || !this.currentIframe.contentWindow) {
                console.error(this.plugin.i18n.cannotAccessTiddlyWikiIframe);
                return;
            }

            const win = this.currentIframe.contentWindow;
            
            // 尝试触发 TiddlyWiki 的保存
            // 方法1: 寻找保存按钮并点击
            const saveButton = win.document.querySelector('[title*="save"], [aria-label*="save"], .tc-save-wiki, .tc-tiddler-save-button');
            if (saveButton && saveButton instanceof HTMLElement) {
                console.log(this.plugin.i18n.foundSaveButton);
                saveButton.click();
                return;
            }

            // 方法2: 尝试调用 TiddlyWiki 的保存 API
            const tw = (win as any).$tw;
            if (tw && tw.wiki && typeof tw.wiki.renderTiddler === "function") {
                console.log(this.plugin.i18n.tryTiddlyWikiApi);
                // 这里可能需要根据具体的 TiddlyWiki 版本调整
                try {
                    // 触发保存事件
                    win.document.dispatchEvent(new CustomEvent("tw-save-wiki"));
                } catch (apiError) {
                    console.error(this.plugin.i18n.tiddlyWikiApiCallFailed + ":", apiError);
                }
            }

            // 方法3: 如果都不行，我们可以直接获取当前内容并保存
            console.log(this.plugin.i18n.cannotFindSaveMethod);
            setTimeout(() => {
                this.saveCurrentContent();
            }, 100);

        } catch (error) {
            console.error(this.plugin.i18n.triggerSaveError + ":", error);
        }
    }

    /**
     * 直接获取当前 TiddlyWiki 内容并保存
     */
    private async saveCurrentContent() {
        try {
            if (!this.currentIframe || !this.currentIframe.contentDocument) {
                console.error(this.plugin.i18n.cannotAccessCurrentIframe);
                return;
            }

            console.log(this.plugin.i18n.getCurrentTiddlyWikiContent);
            const doc = this.currentIframe.contentDocument;
            
            // 获取完整的 HTML 内容
            let htmlContent = doc.documentElement.outerHTML;
            
            // 确保是完整的 HTML 文档
            if (!htmlContent.toLowerCase().includes("<!doctype")) {
                htmlContent = "<!DOCTYPE html>\n" + htmlContent;
            }

            await this.saveToFile(htmlContent);
            
        } catch (error) {
            console.error(this.plugin.i18n.getCurrentContentFailed + ":", error);
            showMessage(this.plugin.i18n.saveFailedCannotGetContent);
        }
    }

    /**
     * 处理保存操作（处理 URL）
     */
    private async handleSave(url: string, suggestedFileName?: string) {
        try {
            console.log(this.plugin.i18n.handleSaveOperation + ":", url);
            
            let content: string;
            
            if (url.startsWith("data:")) {
                // 处理 data URL
                console.log(this.plugin.i18n.handleDataUrl);
                const dataUrl = url;
                const commaIndex = dataUrl.indexOf(",");
                if (commaIndex === -1) {
                    throw new Error(this.plugin.i18n.invalidDataUrl);
                }
                
                const mimeType = dataUrl.substring(5, commaIndex);
                const data = dataUrl.substring(commaIndex + 1);
                
                if (mimeType.includes("base64")) {
                    content = atob(data);
                } else {
                    content = decodeURIComponent(data);
                }
            } else if (url.startsWith("blob:")) {
                // 处理 blob URL
                console.log(this.plugin.i18n.handleBlobUrl);
                const response = await fetch(url);
                if (!response.ok) {
                    throw new Error(`${this.plugin.i18n.getBlobContentFailed}: ${response.status}`);
                }
                content = await response.text();
            } else {
                throw new Error(this.plugin.i18n.unsupportedUrlType);
            }

            await this.saveToFile(content);
            
        } catch (error) {
            console.error(this.plugin.i18n.handleSaveError + ":", error);
            showMessage(`${this.plugin.i18n.saveFailed}: ${error.message}`);
        }
    }

    /**
     * 保存内容到原文件
     */
    private async saveToFile(content: string) {
        try {
            if (!this.currentFileName) {
                throw new Error(this.plugin.i18n.noFileSpecified);
            }

            console.log(`${this.plugin.i18n.saveContentToFile}: ${this.currentFileName}`);
            console.log(`${this.plugin.i18n.contentLength}: ${content.length}`);

            // 移除保存中状态显示，使用思源和TiddlyWiki内置提示

            // 验证内容是否是有效的 HTML
            if (!content.toLowerCase().includes("<html") || !content.toLowerCase().includes("</html>")) {
                console.warn(this.plugin.i18n.contentNotCompleteHtml);
            }

            // 使用文件管理器保存到原文件
            const success = await this.fileManager.saveTiddlyWiki(this.currentFileName, content);
            if (!success) {
                throw new Error(this.plugin.i18n.fileManagerSaveFailed);
            }

            console.log(`${this.plugin.i18n.fileSaved}: ${this.currentFileName}`);
            
            // 只显示全局消息，移除视觉状态指示器
            showMessage(`${this.plugin.i18n.savedTo} ${this.currentFileName}`, 3000);

        } catch (error) {
            console.error(this.plugin.i18n.saveFileError + ":", error);
            showMessage(`${this.plugin.i18n.saveFailed}: ${error.message}`, 5000);
            throw error;
        }
    }

    /**
     * 清理所有拦截器
     */
    cleanup() {
        console.log(this.plugin.i18n.cleanupSaveInterceptor);
        
        // 执行所有清理函数
        this.interceptors.forEach(cleanup => {
            try {
                cleanup();
            } catch (error) {
                console.error(this.plugin.i18n.cleanupInterceptorError + ":", error);
            }
        });
        
        // 清空数组
        this.interceptors = [];
        
        // 重置状态
        this.currentFileName = null;
        this.currentIframe = null;
    }

    /**
     * 销毁拦截器
     */
    destroy() {
        this.cleanup();
        console.log(this.plugin.i18n.saveInterceptorDestroyed);
    }
}