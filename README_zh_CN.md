TiddlyWiki 是一个拥有二十年历史的开源笔记软件，无论是作为速记工具还是用于实践卡片笔记法都是非常优秀的选择。因此我开发了这个插件，让用户可以在思源笔记中使用 TiddlyWiki。

## TiddlyWiki

TiddlyWiki 分为两个版本：单文件和服务器。

* 单文件版本：知识库中的所有内容都储存在一个 `.html` 文件中
* 服务器版本：使用 `node.js`，每篇笔记储存为单独的 `.tiddler` 文件

该插件采用**单文件版本**。

## 已实现的功能

* [X] 桌面端：在页签中打开 TiddlyWiki
* [X] 移动端：以弹窗形式弹出 TiddlyWiki
* [X] 预置空文件模板
* [X] 接管下载

  * 单文件版本的 TiddlyWiki 每次保存时会弹出下载界面（浏览器下载文件对话框），然后用户需要选择文件路径并下载以替换原文件。
  * 我们的插件接管了下载事件，在 TiddlyWiki 中点击保存后可以自动替换源文件。
* [X] 已在华为鸿蒙 4.2 的低版本 WebView 中测试通过

## 如何使用

你可以将 TiddlyWiki.html 导入为可以打开和编辑的 TiddlyWiki 文件。

也可以将 TiddlyWiki.html 导入为创建新 TiddlyWiki 的模板。

## 未来可能更新的功能

未来可能会完善 TiddlyWiki 和思源笔记的数据同步功能，但这需要进一步了解 TiddlyWiki 的插件开发方式，以及 TiddlyWiki 对块引用的支持情况。

## i18n

使用 Claude Sonnet 3.5 进行国际化（i18n）工作。
