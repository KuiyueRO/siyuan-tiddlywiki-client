import {
    Plugin,
    showMessage,
    Dialog,
    adaptHotkey
} from "siyuan";
import { ExtendedPlugin } from "./types";

/**
 * TiddlyWiki Dock模块
 * 负责处理TiddlyWiki dock栏的创建、事件处理和相关功能
 */
export class dock {
    private plugin: ExtendedPlugin;
    private isMobile: boolean;
    private dockType: string;

    constructor(plugin: Plugin, isMobile: boolean, dockType: string) {
        this.plugin = plugin as ExtendedPlugin;
        this.isMobile = isMobile;
        this.dockType = dockType;
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
        if (this.isMobile) {
            this.createMobileDock(dock);
        } else {
            this.createDesktopDock(dock);
        }
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
        <span data-type="refresh" class="block__icon b3-tooltips b3-tooltips__sw" aria-label="Refresh TiddlyWiki"><svg><use xlink:href="#iconRefresh"></use></svg></span>
        <span data-type="add" class="block__icon b3-tooltips b3-tooltips__sw" aria-label="Add TiddlyWiki Item"><svg><use xlink:href="#iconAdd"></use></svg></span>
        <span data-type="min" class="block__icon b3-tooltips b3-tooltips__sw" aria-label="Min ${adaptHotkey("⌘W")}"><svg><use xlink:href="#iconMin"></use></svg></span>
    </div>
    <div class="fn__flex-1 plugin-sample__custom-dock">
        ${dock.data.text}
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
    private handleAddTiddlyWikiItem() {
        const dialog = new Dialog({
            title: "Add TiddlyWiki Item",
            content: `<div class="b3-dialog__content">
    <div class="b3-form__row">
        <label class="b3-form__label">项目名称</label>
        <input class="b3-text-field fn__block" placeholder="输入项目名称" id="tiddlyWikiItemName">
    </div>
    <div class="b3-form__row">
        <label class="b3-form__label">项目描述（可选）</label>
        <textarea class="b3-text-field fn__block" placeholder="输入项目描述" id="tiddlyWikiItemContent" rows="3"></textarea>
    </div>
</div>
<div class="b3-dialog__action">
    <button class="b3-button b3-button--cancel">取消</button><div class="fn__space"></div>
    <button class="b3-button b3-button--text">添加</button>
</div>`,
            width: this.isMobile ? "92vw" : "520px",
        });
        
        const nameInput = dialog.element.querySelector("#tiddlyWikiItemName") as HTMLInputElement;
        const contentInput = dialog.element.querySelector("#tiddlyWikiItemContent") as HTMLTextAreaElement;
        const btnsElement = dialog.element.querySelectorAll(".b3-button");
        
        nameInput.focus();
        
        // 取消按钮
        btnsElement[0].addEventListener("click", () => {
            dialog.destroy();
        });
        
        // 添加按钮
        btnsElement[1].addEventListener("click", () => {
            const name = nameInput.value.trim();
            const content = contentInput.value.trim();
            
            if (name) {
                this.addTiddlyWikiItem(name, content);
                dialog.destroy();
            } else {
                showMessage("请输入项目名称");
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
     * 添加TiddlyWiki项目的实际逻辑
     */
    private addTiddlyWikiItem(name: string, content: string) {
        // 这里可以添加实际的TiddlyWiki项目处理逻辑
        showMessage(`已添加 TiddlyWiki 项目: ${name}`);
        console.log("Added TiddlyWiki item:", { name, content });
        
        // TODO: 实现实际的添加逻辑
        // - 创建TiddlyWiki文件
        // - 保存到存储位置
        // - 更新项目列表
        // - 刷新dock显示
    }

    /**
     * 处理刷新TiddlyWiki
     */
    private handleRefreshTiddlyWiki() {
        showMessage("正在刷新 TiddlyWiki...");
        console.log("Refreshing TiddlyWiki...");
        
        // 模拟刷新操作
        setTimeout(() => {
            showMessage("TiddlyWiki 已刷新");
            console.log("TiddlyWiki refreshed successfully");
            
            // TODO: 实现实际的刷新逻辑
            // - 重新加载TiddlyWiki数据
            // - 更新dock面板内容
            // - 同步数据源等
            this.refreshDockContent();
        }, 1000);
    }

    /**
     * 刷新dock内容
     */
    private refreshDockContent() {
        // TODO: 实现dock内容刷新逻辑
        console.log("Refreshing dock content...");
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
        // TODO: 清理事件监听器和其他资源
    }
}
