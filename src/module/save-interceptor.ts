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
        console.log(`为文件 ${fileName} 设置保存拦截`);
        
        this.currentFileName = fileName;
        this.currentIframe = iframe;

        // 等待iframe完全加载后再设置拦截
        if (iframe.contentDocument && iframe.contentDocument.readyState === 'complete') {
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
                console.error('无法访问iframe内容，可能是跨域问题');
                return;
            }

            console.log('开始设置拦截器');

            // 1. 拦截 <a> 标签的下载点击
            this.interceptDownloadLinks(iframeDoc);

            // 2. 拦截 URL.createObjectURL 创建的 blob URL
            this.interceptBlobUrls(iframeWindow);

            // 3. 拦截 document.createElement('a') 动态创建的下载链接
            this.interceptDynamicDownloads(iframeWindow);

            // 4. 监听键盘快捷键保存
            this.interceptKeyboardSave(iframeDoc);

            console.log('所有拦截器设置完成');

        } catch (error) {
            console.error('设置拦截器时出错:', error);
        }
    }

    /**
     * 拦截下载链接点击
     */
    private interceptDownloadLinks(doc: Document) {
        console.log('设置下载链接拦截');

        const interceptClick = (event: MouseEvent) => {
            const target = event.target as HTMLElement;
            
            // 检查是否是带download属性的链接
            if (target.tagName === 'A') {
                const link = target as HTMLAnchorElement;
                if (link.hasAttribute('download') && link.href) {
                    console.log('拦截到下载链接点击:', link.href);
                    event.preventDefault();
                    event.stopPropagation();
                    
                    // 处理保存
                    this.handleSave(link.href, link.download || 'tiddlywiki.html');
                    return;
                }
            }

            // 检查父元素是否包含下载链接
            let currentElement = target.parentElement;
            while (currentElement) {
                if (currentElement.tagName === 'A') {
                    const link = currentElement as HTMLAnchorElement;
                    if (link.hasAttribute('download') && link.href) {
                        console.log('拦截到父元素下载链接点击:', link.href);
                        event.preventDefault();
                        event.stopPropagation();
                        
                        // 处理保存
                        this.handleSave(link.href, link.download || 'tiddlywiki.html');
                        return;
                    }
                }
                currentElement = currentElement.parentElement;
            }
        };

        // 添加点击事件监听器
        doc.addEventListener('click', interceptClick, true);
        
        // 保存清理函数
        this.interceptors.push(() => {
            doc.removeEventListener('click', interceptClick, true);
        });
    }

    /**
     * 拦截 Blob URL 创建
     */
    private interceptBlobUrls(win: Window) {
        console.log('设置 Blob URL 拦截');

        // 保存原始方法
        const originalCreateObjectURL = win.URL.createObjectURL;
        const blobCache = new Map<string, Blob>();

        // 重写 createObjectURL 方法
        win.URL.createObjectURL = function(object: Blob | MediaSource) {
            const url = originalCreateObjectURL.call(win.URL, object);
            
            // 如果是 Blob 对象，缓存它
            if (object instanceof Blob) {
                console.log('缓存 Blob URL:', url, 'Type:', object.type);
                blobCache.set(url, object);
            }
            
            return url;
        };

        // 监听所有链接点击，检查是否是 blob URL
        const interceptBlobClick = async (event: MouseEvent) => {
            const target = event.target as HTMLElement;
            let link: HTMLAnchorElement | null = null;

            if (target.tagName === 'A') {
                link = target as HTMLAnchorElement;
            } else {
                // 查找父级链接元素
                let current = target.parentElement;
                while (current && current.tagName !== 'A') {
                    current = current.parentElement;
                }
                if (current && current.tagName === 'A') {
                    link = current as HTMLAnchorElement;
                }
            }

            if (link && link.href.startsWith('blob:') && blobCache.has(link.href)) {
                console.log('拦截到 Blob URL 点击:', link.href);
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
                        console.error('处理 Blob 内容时出错:', error);
                    }
                }
            }
        };

        win.document.addEventListener('click', interceptBlobClick, true);

        // 保存清理函数
        this.interceptors.push(() => {
            win.URL.createObjectURL = originalCreateObjectURL;
            win.document.removeEventListener('click', interceptBlobClick, true);
        });
    }

    /**
     * 拦截动态创建的下载链接
     */
    private interceptDynamicDownloads(win: Window) {
        console.log('设置动态下载拦截');

        const originalCreateElement = win.document.createElement;
        
        win.document.createElement = function(tagName: string, options?: ElementCreationOptions) {
            const element = originalCreateElement.call(win.document, tagName, options);
            
            if (tagName.toLowerCase() === 'a') {
                const link = element as HTMLAnchorElement;
                
                // 重写 click 方法
                const originalClick = link.click;
                link.click = function() {
                    if (this.hasAttribute('download') && this.href) {
                        console.log('拦截到动态创建的下载链接点击:', this.href);
                        
                        // 阻止默认点击行为
                        // 使用保存拦截器处理
                        if (this.href.startsWith('blob:') || this.href.startsWith('data:')) {
                            // 异步处理保存
                            setTimeout(async () => {
                                try {
                                    let content: string;
                                    if (this.href.startsWith('data:')) {
                                        // 处理 data URL
                                        const dataUrl = this.href;
                                        const base64Data = dataUrl.split(',')[1];
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
                                    console.error('处理动态下载失败:', error);
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
        console.log('设置键盘保存拦截');

        const interceptKeydown = (event: KeyboardEvent) => {
            if ((event.ctrlKey || event.metaKey) && event.key === 's') {
                console.log('拦截到 Ctrl+S 保存快捷键');
                event.preventDefault();
                event.stopPropagation();
                
                // 触发 TiddlyWiki 的保存，但会被我们的其他拦截器捕获
                // 这里我们可以直接调用保存逻辑，或者让TiddlyWiki自己处理然后被拦截
                this.triggerTiddlyWikiSave();
            }
        };

        doc.addEventListener('keydown', interceptKeydown, true);
        
        // 保存清理函数
        this.interceptors.push(() => {
            doc.removeEventListener('keydown', interceptKeydown, true);
        });
    }

    /**
     * 触发 TiddlyWiki 的保存操作
     */
    private triggerTiddlyWikiSave() {
        try {
            if (!this.currentIframe || !this.currentIframe.contentWindow) {
                console.error('无法访问 TiddlyWiki iframe');
                return;
            }

            const win = this.currentIframe.contentWindow;
            
            // 尝试触发 TiddlyWiki 的保存
            // 方法1: 寻找保存按钮并点击
            const saveButton = win.document.querySelector('[title*="save"], [aria-label*="save"], .tc-save-wiki, .tc-tiddler-save-button');
            if (saveButton && saveButton instanceof HTMLElement) {
                console.log('找到保存按钮，模拟点击');
                saveButton.click();
                return;
            }

            // 方法2: 尝试调用 TiddlyWiki 的保存 API
            const tw = (win as any).$tw;
            if (tw && tw.wiki && typeof tw.wiki.renderTiddler === 'function') {
                console.log('尝试通过 TiddlyWiki API 触发保存');
                // 这里可能需要根据具体的 TiddlyWiki 版本调整
                try {
                    // 触发保存事件
                    win.document.dispatchEvent(new CustomEvent('tw-save-wiki'));
                } catch (apiError) {
                    console.error('TiddlyWiki API 调用失败:', apiError);
                }
            }

            // 方法3: 如果都不行，我们可以直接获取当前内容并保存
            console.log('无法找到标准保存方法，尝试直接获取内容');
            setTimeout(() => {
                this.saveCurrentContent();
            }, 100);

        } catch (error) {
            console.error('触发保存时出错:', error);
        }
    }

    /**
     * 直接获取当前 TiddlyWiki 内容并保存
     */
    private async saveCurrentContent() {
        try {
            if (!this.currentIframe || !this.currentIframe.contentDocument) {
                console.error('无法访问当前 iframe 内容');
                return;
            }

            console.log('获取当前 TiddlyWiki 页面内容');
            const doc = this.currentIframe.contentDocument;
            
            // 获取完整的 HTML 内容
            let htmlContent = doc.documentElement.outerHTML;
            
            // 确保是完整的 HTML 文档
            if (!htmlContent.toLowerCase().includes('<!doctype')) {
                htmlContent = '<!DOCTYPE html>\n' + htmlContent;
            }

            await this.saveToFile(htmlContent);
            
        } catch (error) {
            console.error('获取当前内容失败:', error);
            showMessage('保存失败：无法获取当前内容');
        }
    }

    /**
     * 处理保存操作（处理 URL）
     */
    private async handleSave(url: string, suggestedFileName?: string) {
        try {
            console.log('处理保存操作:', url);
            
            let content: string;
            
            if (url.startsWith('data:')) {
                // 处理 data URL
                console.log('处理 data URL');
                const dataUrl = url;
                const commaIndex = dataUrl.indexOf(',');
                if (commaIndex === -1) {
                    throw new Error('无效的 data URL');
                }
                
                const mimeType = dataUrl.substring(5, commaIndex);
                const data = dataUrl.substring(commaIndex + 1);
                
                if (mimeType.includes('base64')) {
                    content = atob(data);
                } else {
                    content = decodeURIComponent(data);
                }
            } else if (url.startsWith('blob:')) {
                // 处理 blob URL
                console.log('处理 blob URL');
                const response = await fetch(url);
                if (!response.ok) {
                    throw new Error(`获取 blob 内容失败: ${response.status}`);
                }
                content = await response.text();
            } else {
                throw new Error('不支持的 URL 类型');
            }

            await this.saveToFile(content);
            
        } catch (error) {
            console.error('处理保存时出错:', error);
            showMessage(`保存失败: ${error.message}`);
        }
    }

    /**
     * 保存内容到原文件
     */
    private async saveToFile(content: string) {
        try {
            if (!this.currentFileName) {
                throw new Error('没有指定要保存的文件');
            }

            console.log(`保存内容到文件: ${this.currentFileName}`);
            console.log(`内容长度: ${content.length}`);

            // 移除保存中状态显示，使用思源和TiddlyWiki内置提示

            // 验证内容是否是有效的 HTML
            if (!content.toLowerCase().includes('<html') || !content.toLowerCase().includes('</html>')) {
                console.warn('保存的内容可能不是完整的 HTML 文档');
            }

            // 使用文件管理器保存到原文件
            const success = await this.fileManager.saveTiddlyWiki(this.currentFileName, content);
            if (!success) {
                throw new Error('文件管理器保存失败');
            }

            console.log(`文件已保存: ${this.currentFileName}`);
            
            // 只显示全局消息，移除视觉状态指示器
            showMessage(`已保存到 ${this.currentFileName}`, 3000);

        } catch (error) {
            console.error('保存文件时出错:', error);
            showMessage(`保存失败: ${error.message}`, 5000);
            throw error;
        }
    }

    /**
     * 清理所有拦截器
     */
    cleanup() {
        console.log('清理保存拦截器');
        
        // 执行所有清理函数
        this.interceptors.forEach(cleanup => {
            try {
                cleanup();
            } catch (error) {
                console.error('清理拦截器时出错:', error);
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
        console.log('保存拦截器已销毁');
    }
}