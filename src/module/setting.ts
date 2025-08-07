import {
    Plugin,
    Setting
} from "siyuan";
import { ExtendedPlugin } from "./types";

/**
 * 设置模块
 * 负责处理设置面板的创建和相关功能
 */
export class setting {
    private plugin: ExtendedPlugin;
    private settingInstance: Setting;
    private storageName: string;
    
    constructor(plugin: Plugin, storageName: string) {
        this.plugin = plugin as ExtendedPlugin;
        this.storageName = storageName;
    }
    
    /**
     * 销毁模块，释放资源
     */
    destroy() {
        // 清理资源
        if (this.settingInstance) {
            // 如果设置实例有销毁方法，调用它
            console.log("设置模块已销毁");
        }
    }
    
    /**
     * 初始化设置面板
     */
    initSettingPanel() {
        // 创建文本区域元素
        const textareaElement = document.createElement("textarea");
        
        // 创建设置实例
        this.settingInstance = new Setting({
            confirmCallback: () => {
                this.plugin.saveData(this.storageName, {
                    readonlyText: textareaElement.value
                });
            }
        });
        
        // 添加只读文本设置项
        this.settingInstance.addItem({
            title: "Readonly text",
            direction: "row",
            description: "Open plugin url in browser",
            createActionElement: () => {
                textareaElement.className = "b3-text-field fn__block";
                textareaElement.placeholder = "Readonly text in the menu";
                textareaElement.value = this.plugin.data[this.storageName]?.readonlyText || "";
                return textareaElement;
            },
        });
        
        // 添加打开链接按钮
        const btnaElement = document.createElement("button");
        btnaElement.className = "b3-button b3-button--outline fn__flex-center fn__size200";
        btnaElement.textContent = "Open";
        btnaElement.addEventListener("click", () => {
            window.open("https://github.com/siyuan-note/plugin-sample");
        });
        
        this.settingInstance.addItem({
            title: "Open plugin url",
            description: "Open plugin url in browser",
            actionElement: btnaElement,
        });
        
        return this.settingInstance;
    }
    
    /**
     * 获取设置实例
     */
    getSetting(): Setting {
        return this.settingInstance;
    }
}
