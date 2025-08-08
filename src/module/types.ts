/**
 * 扩展 Plugin 类的接口
 * 用于访问 Plugin 实例的自定义属性
 */
import { Plugin } from "siyuan";
import { tab } from "./tab";
import { menu } from "./menu";
import { dock } from "./dock";

export interface ExtendedPlugin extends Plugin {
    i18n: any; // 添加国际化支持
    isMobile: boolean;
    tabModule: tab;
    menuModule: menu;
    tiddlyWikiDock: dock;
    blockIconEventBindThis: any;
    eventBusPaste: any;
    eventBusLog: any;
    getEditor: () => any;
}
