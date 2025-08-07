import {
    Plugin,
    showMessage,
    Dialog,
    Protyle,
    fetchPost,
    Constants
} from "siyuan";
import { ExtendedPlugin } from "./types";

/**
 * 对话框模块
 * 负责处理插件各种对话框的创建和功能
 */
export class dialog {
    private plugin: ExtendedPlugin;
    
    constructor(plugin: Plugin) {
        this.plugin = plugin as ExtendedPlugin;
    }
    
    /**
     * 销毁模块，释放资源
     */
    destroy() {
        // 清理资源
        console.log("对话框模块已销毁");
    }

    /**
     * 显示系统信息对话框
     */
    showSystemDialog() {
        const dialog = new Dialog({
            title: `SiYuan ${Constants.SIYUAN_VERSION}`,
            content: `<div class="b3-dialog__content">
    <div>appId:</div>
    <div class="fn__hr"></div>
    <div class="plugin-sample__time">${this.plugin.app.appId}</div>
    <div class="fn__hr"></div>
    <div class="fn__hr"></div>
    <div>API demo:</div>
    <div class="fn__hr"></div>
    <div class="plugin-sample__time">System current time: <span id="time"></span></div>
    <div class="fn__hr"></div>
    <div class="fn__hr"></div>
    <div>Protyle demo:</div>
    <div class="fn__hr"></div>
    <div id="protyle" style="height: 360px;"></div>
</div>`,
            width: this.plugin.isMobile ? "92vw" : "560px",
            height: "540px",
        });
        
        // 获取编辑器实例
        const editors = this.plugin.getEditor();
        if (!editors) {
            showMessage("请先打开一个文档");
            return;
        }
        
        new Protyle(this.plugin.app, dialog.element.querySelector("#protyle"), {
            blockId: editors.protyle.block.rootID,
        });
        
        fetchPost("/api/system/currentTime", {}, (response) => {
            dialog.element.querySelector("#time").innerHTML = new Date(response.data).toString();
        });
    }

    /**
     * 添加TiddlyWiki项目对话框
     */
    showAddTiddlyWikiItemDialog() {
        const dialog = new Dialog({
            title: "Add TiddlyWiki Item",
            content: `<div class="b3-dialog__content">
    <input class="b3-text-field fn__block" placeholder="Enter item name" id="tiddlyWikiItemName" style="margin-bottom: 10px;">
</div>
<div class="b3-dialog__action">
    <button class="b3-button b3-button--cancel">取消</button><div class="fn__space"></div>
    <button class="b3-button b3-button--text">添加</button>
</div>`,
            width: this.plugin.isMobile ? "92vw" : "520px",
        });
        
        const nameInput = dialog.element.querySelector("#tiddlyWikiItemName") as HTMLInputElement;
        const btnsElement = dialog.element.querySelectorAll(".b3-button");
        
        nameInput.focus();
        
        btnsElement[0].addEventListener("click", () => {
            dialog.destroy();
        });
        
        btnsElement[1].addEventListener("click", () => {
            const name = nameInput.value.trim();
            
            if (name) {
                // 这里可以添加实际的TiddlyWiki项目处理逻辑
                showMessage(`已添加 TiddlyWiki 项目: ${name}`);
                console.log("Added TiddlyWiki item:", { name });
                dialog.destroy();
            } else {
                showMessage("请输入项目名称");
                nameInput.focus();
            }
        });
    }
    
    // 可以根据需要添加更多对话框
}
