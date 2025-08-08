import {
    Plugin,
    Menu,
    openTab,
    openWindow,
    openMobileFileById,
    getModelByDockType,
    Files,
    openSetting,
    openAttributePanel,
    lockScreen,
    exitSiYuan,
    saveLayout,
    showMessage,
    platformUtils,
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
        const menu = new Menu("topBarSample", () => {
            console.log(this.plugin.i18n.byeMenu);
        });
        
        // 添加 TiddlyWiki 管理功能（置于最顶部）
        await this.addTiddlyWikiManagement(menu);
        
        // 添加分隔符
        menu.addSeparator();
        
        this.addCommonItems(menu);
        
        if (!this.isMobile) {
            this.addDesktopItems(menu);
        } else {
            this.addMobileItems(menu);
        }
        
        this.addSystemItems(menu);
        this.addEventBusItems(menu);
        
        menu.addSeparator();
        menu.addItem({
            icon: "iconSparkles",
            label: this.plugin.data["menu-config"]?.readonlyText || "Readonly",
            type: "readonly",
        });
        
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
            label: "新建 TiddlyWiki",
            click: () => {
                this.handleCreateTiddlyWiki();
            }
        });

        // 添加刷新文件列表
        menu.addItem({
            icon: "iconRefresh",
            label: "刷新文件列表",
            click: () => {
                showMessage("TiddlyWiki 文件列表已刷新", 2000);
            }
        });

        // 获取 TiddlyWiki 文件列表并添加到菜单
        try {
            const tiddlyWikiFiles = await this.fileManager.getTiddlyWikiList();
            
            if (tiddlyWikiFiles.length > 0) {
                // 创建文件列表子菜单
                const fileListItems: any[] = [];
                
                for (const fileName of tiddlyWikiFiles) {
                    const displayName = fileName.replace('.html', '');
                    
                    // 为每个文件创建子菜单，包含打开、重命名、删除选项
                    const fileSubmenuItems = [
                        {
                            icon: "iconTiddlyWiki",
                            label: "打开",
                            click: () => {
                                this.openTiddlyWiki(fileName);
                            }
                        },
                        {
                            icon: "iconEdit",
                            label: "重命名",
                            click: () => {
                                this.handleRenameTiddlyWiki(fileName);
                            }
                        },
                        {
                            icon: "iconTrashcan",
                            label: "删除",
                            click: () => {
                                this.handleDeleteTiddlyWiki(fileName);
                            }
                        }
                    ];
                    
                    fileListItems.push({
                        icon: "iconTiddlyWiki",
                        label: displayName,
                        type: "submenu",
                        submenu: fileSubmenuItems
                    });
                }
                
                // 添加文件列表主菜单项
                menu.addItem({
                    icon: "iconTiddlyWiki",
                    label: `TiddlyWiki 文件 (${tiddlyWikiFiles.length})`,
                    type: "submenu",
                    submenu: fileListItems
                });
            } else {
                // 没有文件时显示提示
                menu.addItem({
                    icon: "iconTiddlyWiki",
                    label: "暂无 TiddlyWiki 文件",
                    type: "readonly"
                });
            }
        } catch (error) {
            console.error('获取 TiddlyWiki 文件列表失败:', error);
            menu.addItem({
                icon: "iconTiddlyWiki",
                label: "文件列表加载失败",
                type: "readonly"
            });
        }
    }
    
    /**
     * 添加通用菜单项
     * @param menu 菜单实例
     */
    private addCommonItems(menu: Menu) {
        menu.addItem({
            icon: "iconSettings",
            label: "Open Setting",
            click: () => {
                openSetting(this.plugin.app);
            }
        });
        
        menu.addItem({
            icon: "iconDrag",
            label: "Open Attribute Panel",
            click: () => {
                const editor = this.getEditor();
                if (!editor) return;
                
                openAttributePanel({
                    nodeElement: editor.protyle.wysiwyg.element.firstElementChild as HTMLElement,
                    protyle: editor.protyle,
                    focusName: "custom",
                });
            }
        });
        
        menu.addItem({
            icon: "iconInfo",
            label: "Dialog(open doc first)",
            accelerator: this.plugin.commands?.[0]?.customHotkey,
            click: () => {
                this.plugin.dialogModule.showSystemDialog();
            }
        });
        
        menu.addItem({
            icon: "iconFocus",
            label: "Select Opened Doc(open doc first)",
            click: () => {
                const editor = this.getEditor();
                if (!editor) return;
                
                (getModelByDockType("file") as Files).selectItem(editor.protyle.notebookId, editor.protyle.path);
            }
        });
    }
    
    /**
     * 添加桌面端特有菜单项
     * @param menu 菜单实例
     */
    private addDesktopItems(menu: Menu) {
        menu.addItem({
            icon: "iconTiddlyWiki",
            label: "Open Custom Tab",
            click: () => {
                const tab = openTab({
                    app: this.plugin.app,
                    custom: {
                        icon: "iconTiddlyWiki",
                        title: "Custom Tab",
                        data: {
                            text: platformUtils.isHuawei() ? "Hello, Huawei!" : "This is my custom tab",
                        },
                        id: this.plugin.name + "-custom_tab"
                    },
                });
                console.log(tab);
            }
        });
        
        menu.addItem({
            icon: "iconImage",
            label: "Open Asset Tab(First open the Chinese help document)",
            click: () => {
                const tab = openTab({
                    app: this.plugin.app,
                    asset: {
                        path: "assets/paragraph-20210512165953-ag1nib4.svg"
                    }
                });
                console.log(tab);
            }
        });
        
        menu.addItem({
            icon: "iconFile",
            label: "Open Doc Tab(open doc first)",
            click: async () => {
                const editor = this.getEditor();
                if (!editor) return;
                
                const tab = await openTab({
                    app: this.plugin.app,
                    doc: {
                        id: editor.protyle.block.rootID,
                    }
                });
                console.log(tab);
            }
        });
        
        menu.addItem({
            icon: "iconSearch",
            label: "Open Search Tab",
            click: () => {
                const tab = openTab({
                    app: this.plugin.app,
                    search: {
                        k: "SiYuan"
                    }
                });
                console.log(tab);
            }
        });
        
        menu.addItem({
            icon: "iconRiffCard",
            label: "Open Card Tab",
            click: () => {
                const tab = openTab({
                    app: this.plugin.app,
                    card: {
                        type: "all"
                    }
                });
                console.log(tab);
            }
        });
        
        menu.addItem({
            icon: "iconLayout",
            label: "Open Float Layer(open doc first)",
            click: () => {
                const editor = this.getEditor();
                if (!editor) return;
                
                this.plugin.addFloatLayer({
                    refDefs: [{refID: editor.protyle.block.rootID}],
                    x: window.innerWidth - 768 - 120,
                    y: 32,
                    isBacklink: false
                });
            }
        });
        
        menu.addItem({
            icon: "iconOpenWindow",
            label: "Open Doc Window(open doc first)",
            click: () => {
                const editor = this.getEditor();
                if (!editor) return;
                
                openWindow({
                    doc: {id: editor.protyle.block.rootID}
                });
            }
        });
    }
    
    /**
     * 添加移动端特有菜单项
     * @param menu 菜单实例
     */
    private addMobileItems(menu: Menu) {
        menu.addItem({
            icon: "iconFile",
            label: "Open Doc(open doc first)",
            click: () => {
                const editor = this.getEditor();
                if (!editor) return;
                
                openMobileFileById(this.plugin.app, editor.protyle.block.rootID);
            }
        });
    }
    
    /**
     * 添加系统级菜单项
     * @param menu 菜单实例
     */
    private addSystemItems(menu: Menu) {
        menu.addItem({
            icon: "iconLock",
            label: "Lockscreen",
            click: () => {
                lockScreen(this.plugin.app);
            }
        });
        
        menu.addItem({
            icon: "iconQuit",
            label: "Exit Application",
            click: () => {
                exitSiYuan();
            }
        });
        
        menu.addItem({
            icon: "iconDownload",
            label: "Save Layout",
            click: () => {
                saveLayout(() => {
                    showMessage("Layout saved");
                });
            }
        });
    }
    
    /**
     * 添加事件总线相关菜单项
     * @param menu 菜单实例
     */
    private addEventBusItems(menu: Menu) {
        const eventItems = [
            {name: "ws-main", hasIcon: true},
            {name: "click-blockicon", hasIcon: true, useBindThis: true},
            {name: "click-pdf", hasIcon: true},
            {name: "click-editorcontent", hasIcon: true},
            {name: "click-editortitleicon", hasIcon: true},
            {name: "click-flashcard-action", hasIcon: true},
            {name: "open-noneditableblock", hasIcon: true},
            {name: "loaded-protyle-static", hasIcon: true},
            {name: "loaded-protyle-dynamic", hasIcon: true},
            {name: "switch-protyle", hasIcon: true},
            {name: "destroy-protyle", hasIcon: true},
            {name: "open-menu-doctree", hasIcon: true},
            {name: "open-menu-blockref", hasIcon: true},
            {name: "open-menu-fileannotationref", hasIcon: true},
            {name: "open-menu-tag", hasIcon: true},
            {name: "open-menu-link", hasIcon: true},
            {name: "open-menu-image", hasIcon: true},
            {name: "open-menu-av", hasIcon: true},
            {name: "open-menu-content", hasIcon: true},
            {name: "open-menu-breadcrumbmore", hasIcon: true},
            {name: "open-menu-inbox", hasIcon: true},
            {name: "input-search", hasIcon: true},
            {name: "paste", hasIcon: true, usePasteEvent: true},
            {name: "open-siyuan-url-plugin", hasIcon: true},
            {name: "open-siyuan-url-block", hasIcon: true},
            {name: "opened-notebook", hasIcon: true},
            {name: "closed-notebook", hasIcon: true}
        ];
        
        const submenuItems: any[] = [];
        
        eventItems.forEach(item => {
            if (item.hasIcon) {
                // 添加订阅事件
                submenuItems.push({
                    icon: "iconSelect",
                    label: `On ${item.name}`,
                    click: () => {
                        if (item.useBindThis) {
                            this.plugin.eventBus.on(item.name as any, this.plugin.blockIconEventBindThis);
                        } else if (item.usePasteEvent) {
                            this.plugin.eventBus.on(item.name as any, this.plugin.eventBusPaste);
                        } else {
                            this.plugin.eventBus.on(item.name as any, this.plugin.eventBusLog);
                        }
                    }
                });
                
                // 添加取消订阅事件
                submenuItems.push({
                    icon: "iconClose",
                    label: `Off ${item.name}`,
                    click: () => {
                        if (item.useBindThis) {
                            this.plugin.eventBus.off(item.name as any, this.plugin.blockIconEventBindThis);
                        } else if (item.usePasteEvent) {
                            this.plugin.eventBus.off(item.name as any, this.plugin.eventBusPaste);
                        } else {
                            this.plugin.eventBus.off(item.name as any, this.plugin.eventBusLog);
                        }
                    }
                });
            }
        });
        
        menu.addItem({
            icon: "iconScrollHoriz",
            label: "Event Bus",
            type: "submenu",
            submenu: submenuItems
        });
    }
    
    /**
     * 获取编辑器实例
     */
    private getEditor() {
        // 直接调用插件实例上的 getEditor 方法
        return this.plugin.getEditor();
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
                    dialog.destroy();
                    showMessage(`TiddlyWiki "${name}.html" 创建成功`, 3000);
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
     * 打开 TiddlyWiki 文件
     */
    private async openTiddlyWiki(fileName: string) {
        if (this.isMobile) {
            // 移动端暂时使用 showMessage 提示
            showMessage(`移动端打开 ${fileName} 功能正在开发中`, 3000);
        } else {
            // 桌面端使用tab方式
            if (this.plugin.tabModule) {
                this.plugin.tabModule.openTiddlyWikiInTab(fileName);
            } else {
                showMessage("无法打开TiddlyWiki: Tab模块未初始化");
            }
        }
    }

    /**
     * 处理重命名 TiddlyWiki
     */
    private handleRenameTiddlyWiki(fileName: string) {
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
     * 处理删除 TiddlyWiki
     */
    private handleDeleteTiddlyWiki(fileName: string) {
        confirm(
            "删除确认",
            `确定要删除 "${fileName}" 吗？此操作不可恢复。`,
            async () => {
                const success = await this.fileManager.deleteTiddlyWiki(fileName);
                // FileManager 已经显示了成功消息，这里不需要重复显示
            }
        );
    }
}
