import {
    Plugin,
    Custom,
    openTab
} from "siyuan";
import { ExtendedPlugin } from "./types";
import { FileManager } from "./file-manager";
import { SaveInterceptor } from "./save-interceptor";

/**
 * 标签页模块
 * 负责处理自定义标签页的创建和相关功能
 */
export class tab {
    private plugin: ExtendedPlugin;
    private tabType: string;
    private customTab: () => Custom;
    private fileManager: FileManager;
    private saveInterceptors: Map<string, SaveInterceptor> = new Map();
    
    constructor(plugin: Plugin, tabType: string) {
        this.plugin = plugin as ExtendedPlugin;
        this.tabType = tabType;
        this.fileManager = new FileManager(plugin);
    }
    
    /**
     * 销毁模块，释放资源
     */
    destroy() {
        console.log("Cleanup all save interceptors");
        this.saveInterceptors.forEach((interceptor, tabId) => {
            try {
                console.log(`Destroying save interceptor: ${tabId}`);
                interceptor.destroy();
            } catch (error) {
                console.error(`Destroy interceptor ${tabId} error:`, error);
            }
        });
        this.saveInterceptors.clear();
        
        console.log("Tab module destroyed");
    }
    
    /**
     * 初始化自定义标签页
     * @returns 自定义标签页实例
     */
    initCustomTab(): () => Custom {
        try {
            this.customTab = this.plugin.addTab({
                type: this.tabType,
                init() {
                    console.log("Initialize TiddlyWiki tab");
                    const fileName = this.data?.fileName;
                    if (fileName) {
                        this.element.innerHTML = `<div class="tiddlywiki-loading">Loading ${fileName}...</div>`;
                    } else {
                        this.element.innerHTML = `<div class="tiddlywiki-tab-placeholder" style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; color: #999; font-size: 14px;">
                            <svg style="width: 64px; height: 64px; margin-bottom: 16px; opacity: 0.5;">
                                <use xlink:href="#iconTiddlyWiki"></use>
                            </svg>
                            <div>Select a TiddlyWiki file to open</div>
                        </div>`;
                    }
                },
                beforeDestroy() {
                    console.log("before destroy tab");
                },
                destroy() {
                    console.log("tab destroyed");
                }
            });
            
            console.log("addTab 执行完成，返回值:", this.customTab);
            return this.customTab;
        } catch (error) {
            console.error("初始化自定义标签页失败:", error);
            return null;
        }
    }
    
    /**
     * 获取自定义标签页实例
     * @returns 自定义标签页实例
     */
    getCustomTab(): () => Custom {
        return this.customTab;
    }

    /**
     * 打开TiddlyWiki文件在新标签页
     */
    async openTiddlyWikiInTab(fileName: string) {
        try {
            console.log("准备打开TiddlyWiki文件:", fileName);
            
            // 读取TiddlyWiki内容
            const content = await this.fileManager.readTiddlyWiki(fileName);
            if (!content) {
                console.error("无法读取TiddlyWiki文件内容");
                return;
            }

            console.log("TiddlyWiki内容已读取，长度:", content.length);

            // 为这个特定的TiddlyWiki文件创建唯一的tab类型
            const tabId = Math.random().toString(36).substring(7);
            const tabType = `tiddlywiki-${tabId}`;
            
            console.log("创建的标签页类型:", tabType);
            
            // 创建标签页初始化函数
            const initTabFunction = this.createTabInitFunction(fileName, content);
            const destroyTabFunction = this.createTabDestroyFunction();

            // 1. 注册标签页类型
            this.plugin.addTab({
                type: tabType,
                init: initTabFunction,
                beforeDestroy: destroyTabFunction,
                destroy() {
                    console.log("TiddlyWiki标签页已销毁");
                }
            });

            console.log("标签页类型已注册:", tabType);

            // 2. 打开标签页 - 按照官方文档的正确方式
            const displayName = fileName.replace(".html", "");
            openTab({
                app: this.plugin.app,
                custom: {
                    title: `TW: ${displayName}`,
                    icon: "iconTiddlyWiki",
                    id: this.plugin.name + tabType,  // 使用正确的ID格式
                    data: {
                        fileName: fileName,
                        content: content
                    }
                }
            });
            
            console.log("TiddlyWiki标签页已打开，ID:", this.plugin.name + tabType);
            
        } catch (error) {
            console.error("打开TiddlyWiki失败:", error);
        }
    }

    /**
     * 创建标签页初始化函数
     */
    private createTabInitFunction(fileName: string, content: string) {
        // 保存当前实例引用，用于访问saveInterceptors
        const saveInterceptors = this.saveInterceptors;
        const plugin = this.plugin;
        
        return function(this: Custom) {
            console.log("=== TiddlyWiki 标签页 init() 开始执行 ===");
            console.log("this:", this);
            console.log("this.element:", this.element);
            console.log("this.data:", this.data);
            
            if (!this.element) {
                console.error("标签页元素为空，无法继续初始化");
                return;
            }
            
            // 设置标签页样式
            (this.element as HTMLElement).style.width = "100%";
            (this.element as HTMLElement).style.height = "100%";
            (this.element as HTMLElement).style.display = "block";
            (this.element as HTMLElement).style.backgroundColor = "#f9f9f9";
            (this.element as HTMLElement).style.overflow = "hidden";
            
            // 先显示加载状态
            this.element.innerHTML = `
                <div style="
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    height: 100%;
                    color: #666;
                    font-size: 14px;
                    background: #f9f9f9;
                ">
                    <div style="text-align: center;">
                        <div style="margin-bottom: 10px;">🔄</div>
                        <div>${plugin.i18n.loadingTiddlyWiki.replace("TiddlyWiki", fileName)}</div>
                    </div>
                </div>
            `;
            
            console.log(plugin.i18n.tabLoadingStateSet);
            
            // 延迟渲染内容，确保标签页完全初始化
            // eslint-disable-next-line @typescript-eslint/no-this-alias
            const customTabElement = this;
            setTimeout(() => {
                console.log("开始延迟渲染TiddlyWiki内容");
                
                try {
                    // 创建iframe来渲染TiddlyWiki
                    const iframe = document.createElement("iframe");
                    iframe.style.width = "100%";
                    iframe.style.height = "100%";
                    iframe.style.border = "none";
                    iframe.style.background = "#fff";
                    iframe.style.display = "block";
                    
                    console.log("iframe已创建，准备设置内容");
                    
                    // 清空并添加iframe
                    customTabElement.element.innerHTML = "";
                    customTabElement.element.appendChild(iframe);
                    
                    // 设置iframe内容
                    const blob = new Blob([content], { type: "text/html" });
                    const url = URL.createObjectURL(blob);
                    
                    iframe.onload = () => {
                        console.log("TiddlyWiki iframe 加载完成");
                        
                        // 设置保存拦截器
                        try {
                            const interceptor = new SaveInterceptor(plugin);
                            interceptor.setupSaveInterception(iframe, fileName);
                            
                            // 存储拦截器以便后续清理
                            const interceptorId = Math.random().toString(36).substring(7);
                            saveInterceptors.set(interceptorId, interceptor);
                            
                            // 在iframe上存储interceptorId以便销毁时清理
                            (iframe as any).__interceptorId = interceptorId;
                            
                            console.log(`保存拦截器已设置，interceptorId: ${interceptorId}`);
                        } catch (interceptorError) {
                            console.error("设置保存拦截器失败:", interceptorError);
                        }
                        
                        // 清理blob URL
                        setTimeout(() => URL.revokeObjectURL(url), 1000);
                    };
                    
                    iframe.onerror = (error) => {
                        console.error("TiddlyWiki iframe 加载错误:", error);
                        customTabElement.element.innerHTML = `
                            <div style="
                                display: flex;
                                align-items: center;
                                justify-content: center;
                                height: 100%;
                                color: #f56c6c;
                                text-align: center;
                            ">
                                <div>
                                    <div>❌ ${plugin.i18n.loadingFailed}</div>
                                    <div style="font-size: 12px; margin-top: 8px;">${plugin.i18n.cannotLoadFile2} ${fileName}</div>
                                </div>
                            </div>
                        `;
                    };
                    
                    iframe.src = url;
                    console.log("iframe src 已设置为 blob URL");
                    
                } catch (error) {
                    console.error("渲染TiddlyWiki失败:", error);
                    customTabElement.element.innerHTML = `
                        <div style="
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            height: 100%;
                            color: #f56c6c;
                            text-align: center;
                        ">
                            <div>
                                <div>❌ ${plugin.i18n.renderFailed}</div>
                                <div style="font-size: 12px; margin-top: 8px;">${error.message}</div>
                            </div>
                        </div>
                    `;
                }
            }, 200);
        };
    }

    /**
     * 创建标签页销毁函数
     */
    private createTabDestroyFunction() {
        // 保存当前实例引用，用于访问saveInterceptors
        const saveInterceptors = this.saveInterceptors;
        
        return function(this: Custom) {
            console.log("TiddlyWiki标签页即将销毁");
            
            // 清理保存拦截器
            try {
                const iframe = this.element.querySelector("iframe") as HTMLIFrameElement;
                if (iframe && (iframe as any).__interceptorId) {
                    const interceptorId = (iframe as any).__interceptorId;
                    const interceptor = saveInterceptors.get(interceptorId);
                    if (interceptor) {
                        console.log(`清理保存拦截器: ${interceptorId}`);
                        interceptor.destroy();
                        saveInterceptors.delete(interceptorId);
                    }
                }
            } catch (cleanupError) {
                console.error("清理保存拦截器时出错:", cleanupError);
            }
        };
    }

    /**
     * 在弹出窗口中显示TiddlyWiki
     */
    private showTiddlyWikiInPopup(fileName: string, content: string) {
        try {
            // 创建弹出窗口容器
            const popup = document.createElement("div");
            popup.className = "tiddlywiki-popup";
            popup.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.5);
                z-index: 9999;
                display: flex;
                align-items: center;
                justify-content: center;
            `;

            // 创建弹出窗口内容
            const popupContent = document.createElement("div");
            popupContent.style.cssText = `
                width: 90%;
                height: 90%;
                background: white;
                border-radius: 8px;
                box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
                display: flex;
                flex-direction: column;
                overflow: hidden;
            `;

            // 创建标题栏
            const titleBar = document.createElement("div");
            const displayName = fileName.replace(".html", "");
            titleBar.innerHTML = `
                <div style="
                    padding: 12px 16px;
                    background: #f5f5f5;
                    border-bottom: 1px solid #e0e0e0;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    font-weight: 500;
                ">
                    <span>TiddlyWiki: ${displayName}</span>
                    <button class="close-btn" style="
                        background: none;
                        border: none;
                        font-size: 18px;
                        cursor: pointer;
                        color: #666;
                        padding: 4px 8px;
                        border-radius: 4px;
                    ">&times;</button>
                </div>
            `;

            // 创建内容区域
            const contentArea = document.createElement("div");
            contentArea.style.cssText = `
                flex: 1;
                overflow: hidden;
                position: relative;
            `;

            // 创建iframe来渲染TiddlyWiki
            const iframe = document.createElement("iframe");
            iframe.style.cssText = `
                width: 100%;
                height: 100%;
                border: none;
                background: white;
            `;

            // 组装弹出窗口
            contentArea.appendChild(iframe);
            popupContent.appendChild(titleBar);
            popupContent.appendChild(contentArea);
            popup.appendChild(popupContent);

            // 添加关闭事件
            const closeBtn = titleBar.querySelector(".close-btn");
            const closePopup = () => {
                if (popup.parentNode) {
                    popup.parentNode.removeChild(popup);
                }
            };

            closeBtn.addEventListener("click", closePopup);
            popup.addEventListener("click", (e) => {
                if (e.target === popup) {
                    closePopup();
                }
            });

            // 添加到页面
            document.body.appendChild(popup);

            // 加载TiddlyWiki内容
            iframe.onload = () => {
                try {
                    if (iframe.contentDocument) {
                        iframe.contentDocument.open();
                        iframe.contentDocument.write(content);
                        iframe.contentDocument.close();
                        console.log("TiddlyWiki内容已在弹出窗口中加载完成");
                    }
                } catch (error) {
                    console.error("在iframe中加载内容失败:", error);
                    contentArea.innerHTML = `
                        <div style="
                            display: flex;
                            flex-direction: column;
                            align-items: center;
                            justify-content: center;
                            height: 100%;
                            color: #f56c6c;
                        ">
                            <div>加载 ${fileName} 失败</div>
                            <div style="font-size: 12px; margin-top: 8px;">可能是安全限制导致的问题</div>
                        </div>
                    `;
                }
            };

            // 使用blob URL方式（更安全）
            const blob = new Blob([content], { type: "text/html" });
            const url = URL.createObjectURL(blob);
            iframe.src = url;

            // 清理blob URL
            iframe.onload = () => {
                URL.revokeObjectURL(url);
            };

        } catch (error) {
            console.error("创建弹出窗口失败:", error);
        }
    }

    /**
     * 在指定元素中渲染TiddlyWiki
     */
    private async renderTiddlyWikiInElement(element: HTMLElement, fileName: string) {
        try {
            // 显示加载状态
            element.innerHTML = `<div class="tiddlywiki-loading" style="
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                height: 100%;
                color: #999;
            ">
                <div style="margin-bottom: 16px;">加载 ${fileName}...</div>
            </div>`;

            // 读取TiddlyWiki内容
            const content = await this.fileManager.readTiddlyWiki(fileName);
            
            if (!content) {
                element.innerHTML = `<div class="tiddlywiki-error" style="
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    height: 100%;
                    color: #f56c6c;
                ">
                    <div>加载 ${fileName} 失败</div>
                    <div style="font-size: 12px; margin-top: 8px;">文件可能已被删除或损坏</div>
                </div>`;
                return;
            }

            // 创建iframe来渲染TiddlyWiki
            const iframe = document.createElement("iframe");
            iframe.style.width = "100%";
            iframe.style.height = "100%";
            iframe.style.border = "none";
            iframe.style.background = "#fff";

            // 清空容器并添加iframe
            element.innerHTML = "";
            element.appendChild(iframe);

            // 等待iframe加载完成后写入内容
            iframe.onload = () => {
                try {
                    if (iframe.contentDocument) {
                        iframe.contentDocument.open();
                        iframe.contentDocument.write(content);
                        iframe.contentDocument.close();
                    }
                } catch (error) {
                    console.error("渲染TiddlyWiki内容失败:", error);
                    element.innerHTML = `<div class="tiddlywiki-error" style="
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        justify-content: center;
                        height: 100%;
                        color: #f56c6c;
                    ">
                        <div>渲染 ${fileName} 失败</div>
                        <div style="font-size: 12px; margin-top: 8px;">可能是安全限制导致的问题</div>
                    </div>`;
                }
            };

            // 设置iframe的src为blob URL（更安全的方式）
            const blob = new Blob([content], { type: "text/html" });
            const url = URL.createObjectURL(blob);
            iframe.src = url;

            // 清理blob URL
            iframe.onload = () => {
                URL.revokeObjectURL(url);
            };

        } catch (error) {
            console.error("渲染TiddlyWiki失败:", error);
            element.innerHTML = `<div class="tiddlywiki-error" style="
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                height: 100%;
                color: #f56c6c;
            ">
                <div>渲染失败</div>
                <div style="font-size: 12px; margin-top: 8px;">${error.message}</div>
            </div>`;
        }
    }
}
