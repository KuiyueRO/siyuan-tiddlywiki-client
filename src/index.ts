import {
    Plugin,
    IOperation,
    Custom,
    Protyle,
    showMessage,
    confirm,
    ICard,
    ICardData,
    getFrontend,
    getBackend
} from "siyuan";
import "./index.scss";
import {IMenuItem} from "siyuan/types";
import {dock} from "./module/dock";
import {dialog} from "./module/dialog";
import {tab} from "./module/tab";
import {menu} from "./module/menu";
import {setting} from "./module/setting";

const STORAGE_NAME = "menu-config";
const TAB_TYPE = "custom_tab";
const DOCK_TYPE = "dock_tab";

export default class PluginSample extends Plugin {

    // 公共属性
    private isMobile: boolean;
    
    // 模块实例
    private customTab: () => Custom;
    private tiddlyWikiDock: dock;
    private dialogModule: dialog;
    private tabModule: tab;
    private menuModule: menu;
    private settingModule: setting;
    
    // 事件处理
    private blockIconEventBindThis = this.blockIconEvent.bind(this);

    updateProtyleToolbar(toolbar: Array<string | IMenuItem>) {
        toolbar.push("|");
        toolbar.push({
            name: "insert-smail-emoji",
            icon: "iconEmoji",
            hotkey: "⇧⌘I",
            tipPosition: "n",
            tip: this.i18n.insertEmoji,
            click(protyle: Protyle) {
                protyle.insert("😊");
            }
        });
        return toolbar;
    }

    onload() {
        // 初始化配置数据
        this.data[STORAGE_NAME] = {readonlyText: "Readonly"};

        // 检测前端环境
        const frontEnd = getFrontend();
        this.isMobile = frontEnd === "mobile" || frontEnd === "browser-mobile";
        
        // 添加图标
        this.addIcons(`<symbol id="iconSaving" viewBox="0 0 32 32">
<path d="M20 13.333c0-0.733 0.6-1.333 1.333-1.333s1.333 0.6 1.333 1.333c0 0.733-0.6 1.333-1.333 1.333s-1.333-0.6-1.333-1.333zM10.667 12h6.667v-2.667h-6.667v2.667zM29.333 10v9.293l-3.76 1.253-2.24 7.453h-7.333v-2.667h-2.667v2.667h-7.333c0 0-3.333-11.28-3.333-15.333s3.28-7.333 7.333-7.333h6.667c1.213-1.613 3.147-2.667 5.333-2.667 1.107 0 2 0.893 2 2 0 0.28-0.053 0.533-0.16 0.773-0.187 0.453-0.347 0.973-0.427 1.533l3.027 3.027h2.893zM26.667 12.667h-1.333l-4.667-4.667c0-0.867 0.12-1.72 0.347-2.547-1.293 0.333-2.347 1.293-2.787 2.547h-8.227c-2.573 0-4.667 2.093-4.667 4.667 0 2.507 1.627 8.867 2.68 12.667h2.653v-2.667h8v2.667h2.68l2.067-6.867 3.253-1.093v-4.707z"></path>
</symbol>
<symbol id="iconTiddlyWiki" viewBox="0 0 128 128">
<path d="M64 0l54.56 32v64L64 128 9.44 96V32L64 0zm21.127 95.408c-3.578-.103-5.15-.094-6.974-3.152l-1.42.042c-1.653-.075-.964-.04-2.067-.097-1.844-.07-1.548-1.86-1.873-2.8-.52-3.202.687-6.43.65-9.632-.014-1.14-1.593-5.17-2.157-6.61-1.768.34-3.546.406-5.34.497-4.134-.01-8.24-.527-12.317-1.183-.8 3.35-3.16 8.036-1.21 11.44 2.37 3.52 4.03 4.495 6.61 4.707 2.572.212 3.16 3.18 2.53 4.242-.55.73-1.52.864-2.346 1.04l-1.65.08c-1.296-.046-2.455-.404-3.61-.955-1.93-1.097-3.925-3.383-5.406-5.024.345.658.55 1.938.24 2.53-.878 1.27-4.665 1.26-6.4.47-1.97-.89-6.73-7.162-7.468-11.86 1.96-3.78 4.812-7.07 6.255-11.186-3.146-2.05-4.83-5.384-4.61-9.16l.08-.44c-3.097.59-1.49.37-4.82.628-10.608-.032-19.935-7.37-14.68-18.774.34-.673.664-1.287 1.243-.994.466.237.4 1.18.166 2.227-3.005 13.627 11.67 13.732 20.69 11.21.89-.25 2.67-1.936 3.905-2.495 2.016-.91 4.205-1.282 6.376-1.55 5.4-.63 11.893 2.276 15.19 2.37 3.3.096 7.99-.805 10.87-.615 2.09.098 4.143.483 6.16 1.03 1.306-6.49 1.4-11.27 4.492-12.38 1.814.293 3.213 2.818 4.25 4.167 2.112-.086 4.12.46 6.115 1.066 3.61-.522 6.642-2.593 9.833-4.203-3.234 2.69-3.673 7.075-3.303 11.127.138 2.103-.444 4.386-1.164 6.54-1.348 3.507-3.95 7.204-6.97 7.014-1.14-.036-1.805-.695-2.653-1.4-.164 1.427-.81 2.7-1.434 3.96-1.44 2.797-5.203 4.03-8.687 7.016-3.484 2.985 1.114 13.65 2.23 15.594 1.114 1.94 4.226 2.652 3.02 4.406-.37.58-.936.785-1.54 1.01l-.82.11zm-40.097-8.85l.553.14c.694-.27 2.09.15 2.83.353-1.363-1.31-3.417-3.24-4.897-4.46-.485-1.47-.278-2.96-.174-4.46l.02-.123c-.582 1.205-1.322 2.376-1.72 3.645-.465 1.71 2.07 3.557 3.052 4.615l.336.3z" fill-rule="evenodd"></path>
</symbol>`);

        // 初始化模块
        this.initModules();

        // 添加命令
        this.registerCommands();

        // 添加Protyle相关配置
        this.configureProtyle();

        console.log(this.i18n.helloPlugin);
    }
    
    /**
     * 初始化各个模块
     */
    private initModules() {
        // 初始化对话框模块
        this.dialogModule = new dialog(this);
        
        // 初始化标签页模块
        this.tabModule = new tab(this, TAB_TYPE);
        this.customTab = this.tabModule.initCustomTab();
        
        // 初始化菜单模块
        this.menuModule = new menu(this, this.isMobile);
        
        // 初始化设置模块
        this.settingModule = new setting(this, STORAGE_NAME);
        
        // 初始化 Dock 模块
        this.tiddlyWikiDock = new dock(this, this.isMobile, DOCK_TYPE);
        this.addDock(this.tiddlyWikiDock.createDockConfig());
        
        // 添加顶部栏图标
        this.addTopBarIcon();
        
        // 添加状态栏图标
        this.addStatusBarIcon();
    }
    
    /**
     * 注册命令
     */
    private registerCommands() {
        // 添加显示对话框命令
        this.addCommand({
            langKey: "showDialog",
            hotkey: "⇧⌘O",
            callback: () => {
                this.dialogModule.showSystemDialog();
            },
        });

        // 添加获取标签页命令
        this.addCommand({
            langKey: "getTab",
            hotkey: "⇧⌘M",
            globalCallback: () => {
                console.log(this.getOpenedTab());
            },
        });
    }
    
    /**
     * 配置Protyle相关功能
     */
    private configureProtyle() {
        // 添加斜杠命令
        this.protyleSlash = [{
            filter: ["insert emoji 😊", "插入表情 😊", "crbqwx"],
            html: `<div class="b3-list-item__first"><span class="b3-list-item__text">${this.i18n.insertEmoji}</span><span class="b3-list-item__meta">😊</span></div>`,
            id: "insertEmoji",
            callback(protyle: any) { // 使用any类型暂时解决类型问题
                protyle.insert("😊");
            }
        }];

        // 配置工具栏选项
        this.protyleOptions = {
            toolbar: ["block-ref",
                "a",
                "|",
                "text",
                "strong",
                "em",
                "u",
                "s",
                "mark",
                "sup",
                "sub",
                "clear",
                "|",
                "code",
                "kbd",
                "tag",
                "inline-math",
                "inline-memo",
            ],
        };
    }
    
    /**
     * 添加顶部栏图标
     */
    private addTopBarIcon() {
        const topBarElement = this.addTopBar({
            icon: "iconTiddlyWiki",
            title: this.i18n.addTopBarIcon,
            position: "right",
            callback: () => {
                if (this.isMobile) {
                    this.menuModule.addTopBarMenu();
                } else {
                    let rect = topBarElement.getBoundingClientRect();
                    // 如果被隐藏，则使用更多按钮
                    if (rect.width === 0) {
                        rect = document.querySelector("#barMore").getBoundingClientRect();
                    }
                    if (rect.width === 0) {
                        rect = document.querySelector("#barPlugins").getBoundingClientRect();
                    }
                    this.menuModule.addTopBarMenu(rect);
                }
            }
        });
    }
    
    /**
     * 添加状态栏图标
     */
    private addStatusBarIcon() {
        const statusIconTemp = document.createElement("template");
        statusIconTemp.innerHTML = `<div class="toolbar__item ariaLabel" aria-label="Remove plugin-sample Data">
    <svg>
        <use xlink:href="#iconTrashcan"></use>
    </svg>
</div>`;
        statusIconTemp.content.firstElementChild.addEventListener("click", () => {
            confirm("⚠️", this.i18n.confirmRemove.replace("${name}", this.name), () => {
                this.removeData(STORAGE_NAME).then(() => {
                    this.data[STORAGE_NAME] = {readonlyText: "Readonly"};
                    showMessage(`[${this.name}]: ${this.i18n.removedData}`);
                });
            });
        });

        this.addStatusBar({
            element: statusIconTemp.content.firstElementChild as HTMLElement,
        });
    }

    onLayoutReady() {
        this.loadData(STORAGE_NAME);
        console.log(`frontend: ${getFrontend()}; backend: ${getBackend()}`);
    }

    onunload() {
        console.log(this.i18n.byePlugin);
        
        // 清理各个模块资源
        if (this.tiddlyWikiDock) {
            this.tiddlyWikiDock.destroy();
        }
        
        if (this.dialogModule) {
            this.dialogModule.destroy();
        }
        
        if (this.tabModule) {
            this.tabModule.destroy();
        }
        
        if (this.menuModule) {
            this.menuModule.destroy();
        }
        
        if (this.settingModule) {
            this.settingModule.destroy();
        }
    }

    uninstall() {
        console.log("uninstall");
    }

    async updateCards(options: ICardData) {
        options.cards.sort((a: ICard, b: ICard) => {
            if (a.blockID < b.blockID) {
                return -1;
            }
            if (a.blockID > b.blockID) {
                return 1;
            }
            return 0;
        });
        return options;
    }

    /**
     * 事件处理：粘贴事件
     */
    private eventBusPaste(event: any) {
        // 如果需异步处理请调用 preventDefault， 否则会进行默认处理
        event.preventDefault();
        // 如果使用了 preventDefault，必须调用 resolve，否则程序会卡死
        event.detail.resolve({
            textPlain: event.detail.textPlain.trim(),
        });
    }

    /**
     * 事件处理：日志事件
     */
    private eventBusLog({detail}: any) {
        console.log(detail);
    }

    /**
     * 事件处理：块图标点击事件
     */
    private blockIconEvent({detail}: any) {
        detail.menu.addItem({
            id: "pluginSample_removeSpace",
            iconHTML: "",
            label: this.i18n.removeSpace,
            click: () => {
                const doOperations: IOperation[] = [];
                detail.blockElements.forEach((item: HTMLElement) => {
                    const editElement = item.querySelector('[contenteditable="true"]');
                    if (editElement) {
                        editElement.textContent = editElement.textContent.replace(/ /g, "");
                        doOperations.push({
                            id: item.dataset.nodeId,
                            data: item.outerHTML,
                            action: "update"
                        });
                    }
                });
                detail.protyle.getInstance().transaction(doOperations);
            }
        });
    }
}
