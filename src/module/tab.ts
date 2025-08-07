import {
    Plugin,
    Custom
} from "siyuan";
import { ExtendedPlugin } from "./types";
import { FileManager } from "./file-manager";

/**
 * 标签页模块
 * 负责处理自定义标签页的创建和相关功能
 */
export class tab {
    private plugin: ExtendedPlugin;
    private tabType: string;
    private customTab: () => Custom;
    private fileManager: FileManager;
    
    constructor(plugin: Plugin, tabType: string) {
        this.plugin = plugin as ExtendedPlugin;
        this.tabType = tabType;
        this.fileManager = new FileManager(plugin);
    }
    
    /**
     * 销毁模块，释放资源
     */
    destroy() {
        // 清理资源
        console.log("标签页模块已销毁");
    }
    
    /**
     * 初始化自定义标签页
     * @returns 自定义标签页实例
     */
    initCustomTab(): () => Custom {
        this.customTab = this.plugin.addTab({
            type: this.tabType,
            init() {
                // 检查是否有传入的TiddlyWiki文件名
                const fileName = this.data?.fileName;
                if (fileName) {
                    this.renderTiddlyWiki(fileName);
                } else {
                    this.element.innerHTML = `<div class="tiddlywiki-tab-placeholder" style="
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        justify-content: center;
                        height: 100%;
                        color: #999;
                        font-size: 14px;
                    ">
                        <svg style="width: 64px; height: 64px; margin-bottom: 16px; opacity: 0.5;">
                            <use xlink:href="#iconTiddlyWiki"></use>
                        </svg>
                        <div>选择一个TiddlyWiki文件来打开</div>
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
        
        return this.customTab;
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
            const tab = this.customTab();
            const customTabData = {
                fileName: fileName,
                text: `TiddlyWiki: ${fileName}`
            };

            // 设置标签页标题
            const displayName = fileName.replace('.html', '');
            tab.updateTitle(`TW: ${displayName}`);

            // 渲染TiddlyWiki
            await this.renderTiddlyWikiInElement(tab.element, fileName);
            
        } catch (error) {
            console.error('打开TiddlyWiki失败:', error);
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
            const iframe = document.createElement('iframe');
            iframe.style.width = '100%';
            iframe.style.height = '100%';
            iframe.style.border = 'none';
            iframe.style.background = '#fff';

            // 清空容器并添加iframe
            element.innerHTML = '';
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
                    console.error('渲染TiddlyWiki内容失败:', error);
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
            const blob = new Blob([content], { type: 'text/html' });
            const url = URL.createObjectURL(blob);
            iframe.src = url;

            // 清理blob URL
            iframe.onload = () => {
                URL.revokeObjectURL(url);
            };

        } catch (error) {
            console.error('渲染TiddlyWiki失败:', error);
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
