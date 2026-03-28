import {
    Plugin,
    Menu,
    showMessage,
    Dialog,
    confirm
} from "siyuan";
import { ExtendedPlugin } from "./types";
import { FileManager } from "./file-manager";
import { UIActions } from "./ui-actions";

/**
 * 菜单模块
 * 负责处理顶部菜单的创建和功能
 */
export class menu {
    private plugin: ExtendedPlugin;
    private isMobile: boolean;
    private fileManager: FileManager;
    
    constructor(plugin: Plugin, isMobile: boolean, fileManager: FileManager) {
        this.plugin = plugin as ExtendedPlugin;
        this.isMobile = isMobile;
        this.fileManager = fileManager;
    }
    
    /**
     * 销毁模块，释放资源
     */
    destroy() {
        // 清理文件管理器
        if (this.fileManager) {
            this.fileManager.destroy();
        }
        
        // 清理事件绑定和资源
        console.log(this.plugin.i18n.menuModuleDestroyed);
    }
    
    /**
     * 添加顶部菜单
     * @param rect 菜单位置矩形
     */
    async addTopBarMenu(rect?: DOMRect) {
        const menu = new Menu("tiddlyWikiTopBarMenu", () => {
            console.log(this.plugin.i18n.menuClosed);
        });
        
        // 添加自定义CSS样式来控制tooltip的overflow
        const style = document.createElement("style");
        style.textContent = `
            div[data-name="tiddlyWikiTopBarMenu"] .file-action.b3-tooltips.b3-tooltips__n,
            div[data-name="tiddlyWikiTopBarMenu"] .b3-tooltips:hover,
            div[data-name="tiddlyWikiTopBarMenu"] .b3-tooltips:focus-within {
                overflow: hidden !important;
            }
        `;
        document.head.appendChild(style);
        
        // 添加 TiddlyWiki 管理功能
        await this.addTiddlyWikiManagement(menu);
        
        if (this.isMobile) {
            menu.fullscreen();
        } else if (rect) {
            menu.open({
                x: rect.right,
                y: rect.bottom,
                isLeft: true,
            });
        }
    }
    
    /**
     * 添加 TiddlyWiki 管理功能
     * @param menu 菜单实例
     */
    private async addTiddlyWikiManagement(menu: Menu) {
        // 添加新建 TiddlyWiki
        menu.addItem({
            icon: "iconAdd",
            label: this.plugin.i18n.createNew,
            click: () => {
                UIActions.showCreateDialog(this.plugin, this.fileManager, this.isMobile, () => {
                    showMessage(`${this.plugin.i18n.dockTitle} created successfully`, 3000);
                });
            }
        });

        // 添加导入
        menu.addItem({
            icon: "iconDownload",
            label: this.plugin.i18n.importFile,
            click: () => {
                UIActions.handleImport(this.plugin, this.fileManager, () => {
                    showMessage(this.plugin.i18n.importSuccessMessage);
                });
            }
        });

        // 添加刷新文件列表
        menu.addItem({
            icon: "iconRefresh",
            label: this.plugin.i18n.refreshFileList,
            click: () => {
                showMessage(this.plugin.i18n.fileListRefreshed, 2000);
            }
        });

        // 添加分隔符
        menu.addSeparator();

        // 获取 TiddlyWiki 文件列表并直接添加到主菜单
        try {
            const tiddlyWikiFiles = await this.fileManager.getTiddlyWikiList();
            
            if (tiddlyWikiFiles.length > 0) {
                // 直接为每个文件创建菜单项，包含内置的操作按钮
                for (const fileName of tiddlyWikiFiles) {
                    const displayName = fileName.replace(".html", "");
                    
                    // 为每个文件创建菜单项，在label中包含操作按钮
                    const menuItemElement = menu.addItem({
                        icon: "iconTiddlyWiki",
                        label: displayName,
                        click: () => {
                            UIActions.openTiddlyWiki(this.plugin, this.isMobile, fileName, this.plugin.tabModule, () => {});
                        }
                    });
                    
                    // 在菜单项创建后修改其HTML结构
                    this.enhanceMenuItemWithActions(menuItemElement, displayName, fileName);
                }
            } else {
                // 没有文件时显示提示
                menu.addItem({
                    icon: "iconTiddlyWiki",
                    label: this.plugin.i18n.noTiddlyWikiFiles,
                    type: "readonly"
                });
            }
        } catch (error) {
            console.error("获取 TiddlyWiki 文件列表失败:", error);
            menu.addItem({
                icon: "iconTiddlyWiki",
                label: this.plugin.i18n.fileListLoadFailed,
                type: "readonly"
            });
        }
    }
    
    /**
     * 增强菜单项，添加操作按钮
     */
    private enhanceMenuItemWithActions(menuItemElement: HTMLElement, displayName: string, fileName: string) {
        // 检查menuItemElement是否存在
        if (!menuItemElement) {
            console.warn(this.plugin.i18n.menuItemElementNotFound);
            return;
        }

        // 等待DOM更新后再修改
        setTimeout(() => {
            // 查找实际的菜单项元素
            const actualMenuItem = menuItemElement.closest(".b3-menu__item") || menuItemElement;
            
            if (!actualMenuItem) {
                console.warn(this.plugin.i18n.cannotFindMenuItem);
                return;
            }

            // 修改菜单项的HTML结构
            const labelElement = actualMenuItem.querySelector(".b3-menu__label") as HTMLElement;
            if (labelElement) {
                // 保存原有的文本
                const originalText = labelElement.textContent;
                
                // 重新设计菜单项的内部结构
                labelElement.innerHTML = "";
                labelElement.style.cssText = "flex: 1; display: flex; align-items: center; justify-content: space-between;";
                
                // 创建文件名显示区域
                const nameSpan = document.createElement("span");
                nameSpan.textContent = originalText;
                nameSpan.style.cssText = "flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;";
                nameSpan.title = fileName;
                
                // 创建操作按钮区域
                const actionsDiv = document.createElement("div");
                actionsDiv.className = "file-actions";
                actionsDiv.style.cssText = "display: flex; gap: 4px; margin-left: 8px; flex-shrink: 0; overflow: visible;";
                
                // 重命名按钮
                const renameBtn = this.createActionButton("iconEdit", this.plugin.i18n.rename, () => {
                    UIActions.showRenameDialog(this.plugin, this.fileManager, this.isMobile, fileName, () => {});
                });
                
                // 删除按钮
                const deleteBtn = this.createActionButton("iconTrashcan", this.plugin.i18n.delete, () => {
                    UIActions.confirmDelete(this.plugin, this.fileManager, fileName, () => {});
                });
                
                actionsDiv.appendChild(renameBtn);
                actionsDiv.appendChild(deleteBtn);
                
                labelElement.appendChild(nameSpan);
                labelElement.appendChild(actionsDiv);
                
                // 绑定悬停效果
                this.bindHoverEffects(actualMenuItem as HTMLElement, actionsDiv);
            }
        }, 0);
    }
    
    /**
     * 创建操作按钮
     */
    private createActionButton(iconId: string, tooltip: string, onClick: () => void): HTMLElement {
        const button = document.createElement("span");
        // 使用上方提示
        button.className = "file-action b3-tooltips b3-tooltips__n";
        button.setAttribute("aria-label", tooltip);
        // 设置 tabindex="-1" 防止获得焦点
        button.setAttribute("tabindex", "-1");
        // 明确禁用焦点
        button.setAttribute("focusable", "false");
        button.style.cssText = `
            width: 18px;
            height: 18px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 2px;
            opacity: 0.7;
            transition: opacity 0.2s, background-color 0.2s;
            position: relative;
            outline: none;
            user-select: none;
            pointer-events: auto;
        `;
        
        // 直接创建包含SVG内容的HTML字符串，就像dock.ts中一样
        button.innerHTML = `<svg style="width: 12px; height: 12px; pointer-events: none;"><use xlink:href="#${iconId}"></use></svg>`;
        
        // 绑定点击事件
        button.addEventListener("click", (e) => {
            e.stopPropagation();
            e.preventDefault();
            onClick();
        });
        
        // 阻止焦点事件引起的滚动
        button.addEventListener("focusin", (e) => {
            e.preventDefault();
            e.stopPropagation();
        });
        
        // 阻止键盘导航时的焦点
        button.addEventListener("keydown", (e) => {
            if (e.key === "Tab") {
                e.preventDefault();
                button.blur();
            }
        });
        
        return button;
    }
    
    /**
     * 绑定悬停效果
     */
    private bindHoverEffects(menuItem: HTMLElement, actionsDiv: HTMLElement) {
        menuItem.addEventListener("mouseenter", () => {
            const actions = actionsDiv.querySelectorAll(".file-action") as NodeListOf<HTMLElement>;
            actions.forEach(action => {
                action.style.opacity = "1";
            });
        });

        menuItem.addEventListener("mouseleave", () => {
            const actions = actionsDiv.querySelectorAll(".file-action") as NodeListOf<HTMLElement>;
            actions.forEach(action => {
                action.style.opacity = "0.7";
            });
        });
        
        // 为按钮添加悬停效果
        const actions = actionsDiv.querySelectorAll(".file-action") as NodeListOf<HTMLElement>;
        actions.forEach(action => {
            action.addEventListener("mouseenter", () => {
                action.style.backgroundColor = "var(--b3-theme-background-light)";
            });
            
            action.addEventListener("mouseleave", () => {
                action.style.backgroundColor = "transparent";
            });
        });
    }

}
