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
    platformUtils
} from "siyuan";
import { ExtendedPlugin } from "./types";

/**
 * 菜单模块
 * 负责处理顶部菜单的创建和功能
 */
export class menu {
    private plugin: ExtendedPlugin;
    private isMobile: boolean;
    
    constructor(plugin: Plugin, isMobile: boolean) {
        this.plugin = plugin as ExtendedPlugin;
        this.isMobile = isMobile;
    }
    
    /**
     * 销毁模块，释放资源
     */
    destroy() {
        // 清理事件绑定和资源
        console.log("菜单模块已销毁");
    }
    
    /**
     * 添加顶部菜单
     * @param rect 菜单位置矩形
     */
    addTopBarMenu(rect?: DOMRect) {
        const menu = new Menu("topBarSample", () => {
            console.log(this.plugin.i18n.byeMenu);
        });
        
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
}
