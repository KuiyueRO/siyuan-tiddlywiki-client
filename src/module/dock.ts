import {
    Plugin,
    showMessage,
    Dialog,
    adaptHotkey,
    confirm
} from "siyuan";
import { ExtendedPlugin } from "./types";
import { FileManager } from "./file-manager";

/**
 * TiddlyWiki Dock模块
 * 负责处理TiddlyWiki dock栏的创建、事件处理和相关功能
 */
export class dock {
    private plugin: ExtendedPlugin;
    private isMobile: boolean;
    private dockType: string;
    private fileManager: FileManager;
    private dockElement: HTMLElement | null = null;

    constructor(plugin: Plugin, isMobile: boolean, dockType: string) {
        this.plugin = plugin as ExtendedPlugin;
        this.isMobile = isMobile;
        this.dockType = dockType;
        this.fileManager = new FileManager(plugin);
        
        // 初始化文件管理器
        this.fileManager.initialize().catch(console.error);
    }

    /**
     * 创建dock配置
     */
    createDockConfig() {
        return {
            config: {
                position: "LeftBottom" as const,
                size: {width: 200, height: 0},
                icon: "iconTiddlyWiki",
                title: "TiddlyWiki",
                hotkey: "⌥⌘W",
            },
            data: {
                text: "This is my custom dock"
            },
            type: this.dockType,
            resize: () => {
                console.log(this.dockType + " resize");
            },
            update: () => {
                console.log(this.dockType + " update");
            },
            init: (dock: any) => {
                this.initDock(dock);
            },
            destroy: () => {
                console.log("destroy dock:", this.dockType);
            }
        };
    }

    /**
     * 初始化dock界面
     */
    private initDock(dock: any) {
        this.dockElement = dock.element;
        if (this.isMobile) {
            this.createMobileDock(dock);
        } else {
            this.createDesktopDock(dock);
        }
        
        // 初始化后立即加载TiddlyWiki列表
        this.refreshTiddlyWikiList();
    }

    /**
     * 创建移动端dock界面
     */
    private createMobileDock(dock: any) {
        dock.element.innerHTML = `<div class="toolbar toolbar--border toolbar--dark">
    <svg class="toolbar__icon"><use xlink:href="#iconTiddlyWiki"></use></svg>
        <div class="toolbar__text">TiddlyWiki</div>
    </div>
    <div class="fn__flex-1 plugin-sample__custom-dock">
        ${dock.data.text}
    </div>
</div>`;
    }

    /**
     * 创建桌面端dock界面
     */
    private createDesktopDock(dock: any) {
        dock.element.innerHTML = `<div class="fn__flex-1 fn__flex-column">
    <div class="block__icons">
        <div class="block__logo">
            <svg class="block__logoicon"><use xlink:href="#iconTiddlyWiki"></use></svg>TiddlyWiki
        </div>
        <span class="fn__flex-1 fn__space"></span>
        <span data-type="refresh" class="block__icon b3-tooltips b3-tooltips__sw" aria-label="刷新列表"><svg><use xlink:href="#iconRefresh"></use></svg></span>
        <span data-type="add" class="block__icon b3-tooltips b3-tooltips__sw" aria-label="新建TiddlyWiki"><svg><use xlink:href="#iconAdd"></use></svg></span>
        <span data-type="min" class="block__icon b3-tooltips b3-tooltips__sw" aria-label="Min ${adaptHotkey("⌘W")}"><svg><use xlink:href="#iconMin"></use></svg></span>
    </div>
    <div class="fn__flex-1 tiddlywiki-list-container" style="overflow-y: auto; padding: 4px;">
        <div class="tiddlywiki-loading">加载中...</div>
    </div>
</div>`;
        
        this.bindDesktopEvents(dock);
    }

    /**
     * 绑定桌面端事件
     */
    private bindDesktopEvents(dock: any) {
        // 添加刷新按钮事件监听
        const refreshButton = dock.element.querySelector("[data-type=\"refresh\"]");
        if (refreshButton) {
            refreshButton.addEventListener("click", () => {
                this.handleRefreshTiddlyWiki();
            });
        }

        // 添加添加按钮事件监听
        const addButton = dock.element.querySelector("[data-type=\"add\"]");
        if (addButton) {
            addButton.addEventListener("click", () => {
                this.handleAddTiddlyWikiItem();
            });
        }

        // 添加最小化按钮事件监听
        const minButton = dock.element.querySelector("[data-type=\"min\"]");
        if (minButton) {
            minButton.addEventListener("click", () => {
                this.handleMinimizeDock(dock);
            });
        }
    }

    /**
     * 处理添加TiddlyWiki项目
     */
    private async handleAddTiddlyWikiItem() {
        // 获取可用模板列表
        const templates = await this.fileManager.getTemplates();
        const templateOptions = templates.map(template => 
            `<option value="${template}">${template}</option>`
        ).join('');

        const dialog = new Dialog({
            title: "新建 TiddlyWiki",
            content: `<div class="b3-dialog__content">
    <div class="b3-form__row">
        <label class="b3-form__label">名称</label>
        <input class="b3-text-field fn__block" placeholder="输入TiddlyWiki名称" id="tiddlyWikiItemName">
    </div>
    <div class="b3-form__row">
        <label class="b3-form__label">模板</label>
        <select class="b3-select fn__block" id="tiddlyWikiTemplate">
            ${templateOptions}
        </select>
    </div>
</div>
<div class="b3-dialog__action">
    <button class="b3-button b3-button--cancel">取消</button><div class="fn__space"></div>
    <button class="b3-button b3-button--text">创建</button>
</div>`,
            width: this.isMobile ? "92vw" : "480px",
        });
        
        const nameInput = dialog.element.querySelector("#tiddlyWikiItemName") as HTMLInputElement;
        const templateSelect = dialog.element.querySelector("#tiddlyWikiTemplate") as HTMLSelectElement;
        const btnsElement = dialog.element.querySelectorAll(".b3-button");
        
        nameInput.focus();
        
        // 取消按钮
        btnsElement[0].addEventListener("click", () => {
            dialog.destroy();
        });
        
        // 创建按钮
        btnsElement[1].addEventListener("click", async () => {
            const name = nameInput.value.trim();
            const template = templateSelect.value;
            
            if (name) {
                const success = await this.fileManager.createTiddlyWiki(name, template);
                if (success) {
                    this.refreshTiddlyWikiList();
                    dialog.destroy();
                }
            } else {
                showMessage("请输入TiddlyWiki名称");
                nameInput.focus();
            }
        });

        // 回车键确认
        nameInput.addEventListener("keydown", (e) => {
            if (e.key === "Enter") {
                (btnsElement[1] as HTMLButtonElement).click();
            }
        });
    }


    /**
     * 处理刷新TiddlyWiki
     */
    private handleRefreshTiddlyWiki() {
        this.refreshTiddlyWikiList();
    }

    /**
     * 刷新TiddlyWiki文件列表
     */
    private async refreshTiddlyWikiList() {
        if (!this.dockElement) return;

        const container = this.dockElement.querySelector('.tiddlywiki-list-container');
        if (!container) return;

        // 显示加载状态
        container.innerHTML = '<div class="tiddlywiki-loading" style="text-align: center; padding: 20px; color: #999;">加载中...</div>';

        try {
            const tiddlyWikiFiles = await this.fileManager.getTiddlyWikiList();
            
            if (tiddlyWikiFiles.length === 0) {
                container.innerHTML = '<div class="tiddlywiki-empty" style="text-align: center; padding: 20px; color: #999;">暂无TiddlyWiki文件<br><small>点击上方 + 按钮创建</small></div>';
                return;
            }

            // 创建文件列表HTML
            let listHTML = '';
            for (const fileName of tiddlyWikiFiles) {
                listHTML += this.createFileItemHTML(fileName);
            }

            container.innerHTML = `<div class="tiddlywiki-file-list">${listHTML}</div>`;
            
            // 绑定文件项事件
            this.bindFileItemEvents(container);
            
        } catch (error) {
            console.error('刷新TiddlyWiki列表失败:', error);
            container.innerHTML = '<div class="tiddlywiki-error" style="text-align: center; padding: 20px; color: #f56c6c;">加载失败</div>';
        }
    }

    /**
     * 创建文件项HTML
     */
    private createFileItemHTML(fileName: string): string {
        const displayName = fileName.replace('.html', '');
        return `
            <div class="tiddlywiki-file-item" data-filename="${fileName}" style="
                margin: 2px 0;
                padding: 8px;
                border-radius: 4px;
                cursor: pointer;
                border: 1px solid var(--b3-border-color);
                background: var(--b3-theme-background);
                position: relative;
                display: flex;
                align-items: center;
                gap: 8px;
            ">
                <svg style="width: 16px; height: 16px; flex-shrink: 0;"><use xlink:href="#iconTiddlyWiki"></use></svg>
                <span class="file-name" style="flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${fileName}">${displayName}</span>
                <div class="file-actions" style="display: flex; gap: 2px;">
                    <span class="file-action file-rename b3-tooltips b3-tooltips__sw" aria-label="重命名" data-action="rename" style="
                        width: 16px; 
                        height: 16px; 
                        cursor: pointer;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        border-radius: 2px;
                        opacity: 0.7;
                    ">
                        <svg style="width: 12px; height: 12px;"><use xlink:href="#iconEdit"></use></svg>
                    </span>
                    <span class="file-action file-delete b3-tooltips b3-tooltips__sw" aria-label="删除" data-action="delete" style="
                        width: 16px; 
                        height: 16px; 
                        cursor: pointer;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        border-radius: 2px;
                        opacity: 0.7;
                    ">
                        <svg style="width: 12px; height: 12px;"><use xlink:href="#iconTrashcan"></use></svg>
                    </span>
                </div>
            </div>
        `;
    }

    /**
     * 绑定文件项事件
     */
    private bindFileItemEvents(container: Element) {
        const fileItems = container.querySelectorAll('.tiddlywiki-file-item');
        
        fileItems.forEach(item => {
            const fileName = item.getAttribute('data-filename');
            if (!fileName) return;

            // 点击文件名打开文件
            const fileNameSpan = item.querySelector('.file-name');
            if (fileNameSpan) {
                fileNameSpan.addEventListener('click', () => {
                    this.openTiddlyWiki(fileName);
                });
            }

            // 重命名按钮
            const renameBtn = item.querySelector('[data-action="rename"]');
            if (renameBtn) {
                renameBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.renameTiddlyWiki(fileName);
                });
            }

            // 删除按钮
            const deleteBtn = item.querySelector('[data-action="delete"]');
            if (deleteBtn) {
                deleteBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.deleteTiddlyWiki(fileName);
                });
            }

            // 悬停效果
            item.addEventListener('mouseenter', () => {
                (item as HTMLElement).style.background = 'var(--b3-list-hover)';
                const actions = item.querySelectorAll('.file-action') as NodeListOf<HTMLElement>;
                actions.forEach(action => {
                    action.style.opacity = '1';
                });
            });

            item.addEventListener('mouseleave', () => {
                (item as HTMLElement).style.background = 'var(--b3-theme-background)';
                const actions = item.querySelectorAll('.file-action') as NodeListOf<HTMLElement>;
                actions.forEach(action => {
                    action.style.opacity = '0.7';
                });
            });
        });
    }

    /**
     * 打开TiddlyWiki文件
     */
    private openTiddlyWiki(fileName: string) {
        // 通过插件的tab模块打开TiddlyWiki
        if (this.plugin.tabModule) {
            this.plugin.tabModule.openTiddlyWikiInTab(fileName);
        } else {
            showMessage("无法打开TiddlyWiki: Tab模块未初始化");
        }
    }

    /**
     * 重命名TiddlyWiki文件
     */
    private renameTiddlyWiki(fileName: string) {
        const currentName = fileName.replace('.html', '');
        
        const dialog = new Dialog({
            title: "重命名 TiddlyWiki",
            content: `<div class="b3-dialog__content">
    <div class="b3-form__row">
        <label class="b3-form__label">新名称</label>
        <input class="b3-text-field fn__block" placeholder="输入新名称" id="newTiddlyWikiName" value="${currentName}">
    </div>
</div>
<div class="b3-dialog__action">
    <button class="b3-button b3-button--cancel">取消</button><div class="fn__space"></div>
    <button class="b3-button b3-button--text">重命名</button>
</div>`,
            width: this.isMobile ? "92vw" : "420px",
        });
        
        const nameInput = dialog.element.querySelector("#newTiddlyWikiName") as HTMLInputElement;
        const btnsElement = dialog.element.querySelectorAll(".b3-button");
        
        nameInput.focus();
        nameInput.select();
        
        // 取消按钮
        btnsElement[0].addEventListener("click", () => {
            dialog.destroy();
        });
        
        // 重命名按钮
        btnsElement[1].addEventListener("click", async () => {
            const newName = nameInput.value.trim();
            
            if (newName && newName !== currentName) {
                const success = await this.fileManager.renameTiddlyWiki(fileName, newName);
                if (success) {
                    this.refreshTiddlyWikiList();
                    dialog.destroy();
                }
            } else if (!newName) {
                showMessage("请输入新名称");
                nameInput.focus();
            } else {
                dialog.destroy();
            }
        });

        // 回车键确认
        nameInput.addEventListener("keydown", (e) => {
            if (e.key === "Enter") {
                (btnsElement[1] as HTMLButtonElement).click();
            }
        });
    }

    /**
     * 删除TiddlyWiki文件
     */
    private deleteTiddlyWiki(fileName: string) {
        confirm(
            "删除确认",
            `确定要删除 "${fileName}" 吗？此操作不可恢复。`,
            async () => {
                const success = await this.fileManager.deleteTiddlyWiki(fileName);
                if (success) {
                    this.refreshTiddlyWikiList();
                }
            }
        );
    }

    /**
     * 处理最小化dock
     */
    private handleMinimizeDock(dock: any) {
        // 这里可以实现最小化逻辑
        console.log("Minimizing TiddlyWiki dock");
        
        // 如果有dock的hide方法，可以调用
        if (dock.hide) {
            dock.hide();
        }
    }

    /**
     * 获取dock状态信息
     */
    getDockInfo() {
        return {
            type: this.dockType,
            isMobile: this.isMobile,
            title: "TiddlyWiki"
        };
    }

    /**
     * 更新dock数据
     */
    updateDockData(newData: any) {
        // TODO: 实现dock数据更新逻辑
        console.log("Updating dock data:", newData);
    }

    /**
     * 销毁dock相关资源
     */
    destroy() {
        console.log("TiddlyWiki dock destroyed");
        if (this.fileManager) {
            this.fileManager.destroy();
        }
    }
}
