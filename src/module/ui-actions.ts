import {
    Dialog,
    confirm,
    showMessage
} from "siyuan";
import { ExtendedPlugin } from "./types";
import { FileManager } from "./file-manager";

/**
 * 共享 UI 操作
 * dock 和 menu 共用的对话框和操作逻辑
 */
export class UIActions {
    /**
     * 显示创建 TiddlyWiki 对话框
     */
    static showCreateDialog(
        plugin: ExtendedPlugin,
        fileManager: FileManager,
        isMobile: boolean,
        onSuccess: () => void
    ) {
        fileManager.getTemplates().then(templates => {
            const templateOptions = templates
                .map((t: string) => `<option value="${t}">${t}</option>`)
                .join("");

            const dialog = new Dialog({
                title: plugin.i18n.createNew,
                content: `<div class="b3-dialog__content">
    <div class="b3-form__row">
        <label class="b3-form__label">${plugin.i18n.name}</label>
        <input class="b3-text-field fn__block" placeholder="${plugin.i18n.enterTiddlyWikiName}" id="tiddlyWikiItemName">
    </div>
    <div class="b3-form__row">
        <label class="b3-form__label">${plugin.i18n.template}</label>
        <select class="b3-select fn__block" id="tiddlyWikiTemplate">${templateOptions}</select>
    </div>
</div>
<div class="b3-dialog__action">
    <button class="b3-button b3-button--cancel">${plugin.i18n.cancel}</button><div class="fn__space"></div>
    <button class="b3-button b3-button--text">${plugin.i18n.create}</button>
</div>`,
                width: isMobile ? "92vw" : "480px",
            });

            const nameInput = dialog.element.querySelector("#tiddlyWikiItemName") as HTMLInputElement;
            const templateSelect = dialog.element.querySelector("#tiddlyWikiTemplate") as HTMLSelectElement;
            const buttons = dialog.element.querySelectorAll(".b3-button");

            setTimeout(() => nameInput.focus(), 100);

            templateSelect.addEventListener("mousedown", e => e.stopPropagation());
            templateSelect.addEventListener("click", e => e.stopPropagation());

            buttons[0].addEventListener("click", () => dialog.destroy());

            const createHandler = async () => {
                const name = nameInput.value.trim();
                if (!name) {
                    showMessage(plugin.i18n.enterTiddlyWikiName);
                    nameInput.focus();
                    return;
                }

                const success = await fileManager.createTiddlyWiki(name, templateSelect.value);
                if (success) {
                    onSuccess();
                    dialog.destroy();
                }
            };

            buttons[1].addEventListener("click", createHandler);
            nameInput.addEventListener("keydown", e => {
                if (e.key === "Enter") createHandler();
            });
        });
    }

    /**
     * 显示重命名对话框
     */
    static showRenameDialog(
        plugin: ExtendedPlugin,
        fileManager: FileManager,
        isMobile: boolean,
        fileName: string,
        onSuccess: () => void
    ) {
        const currentName = fileName.replace(".html", "");

        const dialog = new Dialog({
            title: `${plugin.i18n.rename} ${plugin.i18n.dockTitle}`,
            content: `<div class="b3-dialog__content">
    <div class="b3-form__row">
        <label class="b3-form__label">${plugin.i18n.newName}</label>
        <input class="b3-text-field fn__block" placeholder="${plugin.i18n.enterNewName}" id="newTiddlyWikiName" value="${currentName}">
    </div>
</div>
<div class="b3-dialog__action">
    <button class="b3-button b3-button--cancel">${plugin.i18n.cancel}</button><div class="fn__space"></div>
    <button class="b3-button b3-button--text">${plugin.i18n.rename}</button>
</div>`,
            width: isMobile ? "92vw" : "420px",
        });

        const nameInput = dialog.element.querySelector("#newTiddlyWikiName") as HTMLInputElement;
        const btnsElement = dialog.element.querySelectorAll(".b3-button");

        nameInput.focus();
        nameInput.select();

        btnsElement[0].addEventListener("click", () => dialog.destroy());

        btnsElement[1].addEventListener("click", async () => {
            const newName = nameInput.value.trim();

            if (newName && newName !== currentName) {
                const success = await fileManager.renameTiddlyWiki(fileName, newName);
                if (success) {
                    onSuccess();
                    dialog.destroy();
                }
            } else if (!newName) {
                showMessage(plugin.i18n.enterNewName);
                nameInput.focus();
            } else {
                dialog.destroy();
            }
        });

        nameInput.addEventListener("keydown", (e) => {
            if (e.key === "Enter") {
                (btnsElement[1] as HTMLButtonElement).click();
            }
        });
    }

    /**
     * 确认删除
     */
    static confirmDelete(
        plugin: ExtendedPlugin,
        fileManager: FileManager,
        fileName: string,
        onSuccess: () => void
    ) {
        confirm(
            plugin.i18n.delete,
            plugin.i18n.deleteConfirm.replace("{fileName}", fileName),
            async () => {
                const success = await fileManager.deleteTiddlyWiki(fileName);
                if (success) {
                    onSuccess();
                }
            }
        );
    }

    /**
     * 处理导入
     */
    static handleImport(
        plugin: ExtendedPlugin,
        fileManager: FileManager,
        onSuccess: () => void
    ) {
        fileManager.showImportDialog().then(success => {
            if (success) {
                onSuccess();
            }
        }).catch(error => {
            console.error("导入失败:", error);
            showMessage(plugin.i18n.importFailed || "Import failed");
        });
    }

    /**
     * 打开 TiddlyWiki 文件
     */
    static openTiddlyWiki(
        plugin: ExtendedPlugin,
        isMobile: boolean,
        fileName: string,
        tabModule: any,
        openInPopup: (fileName: string) => void
    ) {
        if (isMobile) {
            openInPopup(fileName);
        } else {
            if (tabModule) {
                tabModule.openTiddlyWikiInTab(fileName);
            } else {
                showMessage(plugin.i18n.cannotOpenTiddlyWiki);
            }
        }
    }
}
