import {
    Plugin,
    Custom
} from "siyuan";
import { ExtendedPlugin } from "./types";

/**
 * 标签页模块
 * 负责处理自定义标签页的创建和相关功能
 */
export class tab {
    private plugin: ExtendedPlugin;
    private tabType: string;
    private customTab: () => Custom;
    
    constructor(plugin: Plugin, tabType: string) {
        this.plugin = plugin as ExtendedPlugin;
        this.tabType = tabType;
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
                this.element.innerHTML = `<div class="plugin-sample__custom-tab">${this.data.text}</div>`;
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
}
