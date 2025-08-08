import {
    Plugin,
    Menu,
    showMessage,
    Dialog,
    confirm
} from "siyuan";
import { ExtendedPlugin } from "./types";
import { FileManager } from "./file-manager";

/**
 * 菜单模块
 * 负责处理顶部菜单的创建和功能
 */
export class menu {
    private plugin: ExtendedPlugin;
    private isMobile: boolean;
    private fileManager: FileManager;
    
    constructor(plugin: Plugin, isMobile: boolean) {
        this.plugin = plugin as ExtendedPlugin;
        this.isMobile = isMobile;
        this.fileManager = new FileManager(plugin);
        
        // 初始化文件管理器
        this.fileManager.initialize().catch(console.error);
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
        console.log("菜单模块已销毁");
    }
    
    /**
     * 添加顶部菜单
     * @param rect 菜单位置矩形
     */
    async addTopBarMenu(rect?: DOMRect) {
        const menu = new Menu("tiddlyWikiTopBarMenu", () => {
            console.log(this.plugin.i18n.menuClosed);
        });
        
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
                this.handleCreateTiddlyWiki();
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
                    const displayName = fileName.replace('.html', '');
                    
                    // 为每个文件创建菜单项，在label中包含操作按钮
                    const menuItemElement = menu.addItem({
                        icon: "iconTiddlyWiki",
                        label: displayName,
                        click: () => {
                            this.openTiddlyWiki(fileName);
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
            console.error('获取 TiddlyWiki 文件列表失败:', error);
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
            console.warn('菜单项元素不存在');
            return;
        }

        // 等待DOM更新后再修改
        setTimeout(() => {
            // 查找实际的菜单项元素
            const actualMenuItem = menuItemElement.closest('.b3-menu__item') || menuItemElement;
            
            if (!actualMenuItem) {
                console.warn('无法找到菜单项元素');
                return;
            }

            // 修改菜单项的HTML结构
            const labelElement = actualMenuItem.querySelector('.b3-menu__label');
            if (labelElement) {
                // 保存原有的文本
                const originalText = labelElement.textContent;
                
                // 重新设计菜单项的内部结构
                labelElement.innerHTML = '';
                labelElement.style.cssText = 'flex: 1; display: flex; align-items: center; justify-content: space-between; overflow: hidden;';
                
                // 创建文件名显示区域
                const nameSpan = document.createElement('span');
                nameSpan.textContent = originalText;
                nameSpan.style.cssText = 'flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;';
                nameSpan.title = fileName;
                
                // 创建操作按钮区域
                const actionsDiv = document.createElement('div');
                actionsDiv.className = 'file-actions';
                actionsDiv.style.cssText = 'display: flex; gap: 4px; margin-left: 8px; flex-shrink: 0;';
                
                // 重命名按钮
                const renameBtn = this.createActionButton('iconEdit', this.plugin.i18n.rename, () => {
                    this.handleRenameTiddlyWiki(fileName);
                });
                
                // 删除按钮
                const deleteBtn = this.createActionButton('iconTrashcan', this.plugin.i18n.delete, () => {
                    this.handleDeleteTiddlyWiki(fileName);
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
        const button = document.createElement('span');
        button.className = 'file-action b3-tooltips b3-tooltips__sw';
        button.setAttribute('aria-label', tooltip);
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
        `;
        
        const svg = document.createElement('svg');
        svg.style.cssText = 'width: 12px; height: 12px; pointer-events: none;';
        const use = document.createElement('use');
        use.setAttribute('xlink:href', `#${iconId}`);
        svg.appendChild(use);
        button.appendChild(svg);
        
        // 绑定点击事件
        button.addEventListener('click', (e) => {
            e.stopPropagation();
            e.preventDefault();
            onClick();
        });
        
        return button;
    }
    
    /**
     * 绑定悬停效果
     */
    private bindHoverEffects(menuItem: HTMLElement, actionsDiv: HTMLElement) {
        menuItem.addEventListener('mouseenter', () => {
            const actions = actionsDiv.querySelectorAll('.file-action') as NodeListOf<HTMLElement>;
            actions.forEach(action => {
                action.style.opacity = '1';
            });
        });

        menuItem.addEventListener('mouseleave', () => {
            const actions = actionsDiv.querySelectorAll('.file-action') as NodeListOf<HTMLElement>;
            actions.forEach(action => {
                action.style.opacity = '0.7';
            });
        });
        
        // 为按钮添加悬停效果
        const actions = actionsDiv.querySelectorAll('.file-action') as NodeListOf<HTMLElement>;
        actions.forEach(action => {
            action.addEventListener('mouseenter', () => {
                action.style.backgroundColor = 'var(--b3-theme-background-light)';
            });
            
            action.addEventListener('mouseleave', () => {
                action.style.backgroundColor = 'transparent';
            });
        });
    }

    /**
     * 处理创建新的 TiddlyWiki
     */
    private async handleCreateTiddlyWiki() {
        // 获取可用模板列表
        const templates = await this.fileManager.getTemplates();
        const templateOptions = templates.map(template => 
            `<option value="${template}">${template}</option>`
        ).join('');

        const dialog = new Dialog({
            title: this.plugin.i18n.createNew,
            content: `<div class="b3-dialog__content">
    <div class="b3-form__row">
        <label class="b3-form__label">${this.plugin.i18n.name}</label>
        <input class="b3-text-field fn__block" placeholder="${this.plugin.i18n.enterTiddlyWikiName}" id="tiddlyWikiItemName">
    </div>
    <div class="b3-form__row">
        <label class="b3-form__label">${this.plugin.i18n.template}</label>
        <select class="b3-select fn__block" id="tiddlyWikiTemplate">
            ${templateOptions}
        </select>
    </div>
</div>
<div class="b3-dialog__action">
    <button class="b3-button b3-button--cancel">${this.plugin.i18n.cancel}</button><div class="fn__space"></div>
    <button class="b3-button b3-button--text">${this.plugin.i18n.create}</button>
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
                    dialog.destroy();
                    showMessage(`${this.plugin.i18n.dockTitle} "${name}.html" ${this.plugin.i18n.createdSuccessfully}`, 3000);
                }
            } else {
                showMessage(this.plugin.i18n.enterTiddlyWikiName);
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
     * 打开 TiddlyWiki 文件
     */
    private async openTiddlyWiki(fileName: string) {
        if (this.isMobile) {
            // 移动端暂时使用 showMessage 提示
            showMessage(`${this.plugin.i18n.mobileOpenInDevelopment} ${fileName}`, 3000);
        } else {
            // 桌面端使用tab方式
            if (this.plugin.tabModule) {
                this.plugin.tabModule.openTiddlyWikiInTab(fileName);
            } else {
                showMessage(this.plugin.i18n.cannotOpenTiddlyWiki);
            }
        }
    }

    /**
     * 处理重命名 TiddlyWiki
     */
    private handleRenameTiddlyWiki(fileName: string) {
        const currentName = fileName.replace('.html', '');
        
        const dialog = new Dialog({
            title: `${this.plugin.i18n.rename} ${this.plugin.i18n.dockTitle}`,
            content: `<div class="b3-dialog__content">
    <div class="b3-form__row">
        <label class="b3-form__label">${this.plugin.i18n.newName}</label>
        <input class="b3-text-field fn__block" placeholder="${this.plugin.i18n.enterNewName}" id="newTiddlyWikiName" value="${currentName}">
    </div>
</div>
<div class="b3-dialog__action">
    <button class="b3-button b3-button--cancel">${this.plugin.i18n.cancel}</button><div class="fn__space"></div>
    <button class="b3-button b3-button--text">${this.plugin.i18n.rename}</button>
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
                    dialog.destroy();
                }
            } else if (!newName) {
                showMessage(this.plugin.i18n.enterNewName);
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
     * 处理删除 TiddlyWiki
     */
    private handleDeleteTiddlyWiki(fileName: string) {
        confirm(
            this.plugin.i18n.delete,
            this.plugin.i18n.deleteConfirm.replace('{fileName}', fileName),
            async () => {
                const success = await this.fileManager.deleteTiddlyWiki(fileName);
                // FileManager 已经显示了成功消息，这里不需要重复显示
            }
        );
    }
}
