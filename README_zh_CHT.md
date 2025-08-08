# SiYuan 的 TiddlyWiki 外掛

TiddlyWiki 是一個擁有二十年歷史的開源筆記軟體，無論是作為速記工具還是用於實踐卡片筆記法都是非常優秀的選擇。因此我開發了這個外掛，讓使用者可以在思源筆記中使用 TiddlyWiki。

## TiddlyWiki

TiddlyWiki 分為兩個版本：單檔案和伺服器。

* 單檔案版本：知識庫中的所有內容都儲存在一個 `.html` 檔案中
* 伺服器版本：使用 `node.js`，每篇筆記儲存為單獨的 `.tiddler` 檔案

該外掛採用**單檔案版本**。

## 已實現的功能

* [X] 桌面端：在頁籤中開啟 TiddlyWiki
* [X] 行動端：以彈窗形式彈出 TiddlyWiki
* [X] 預置空檔案範本
* [X] 接管下載

  * 單檔案版本的 TiddlyWiki 每次儲存時會彈出下載介面（瀏覽器下載檔案對話方塊），然後使用者需要選擇檔案路徑並下載以替換原檔案。
  * 我們的外掛接管了下載事件，在 TiddlyWiki 中點擊儲存後可以自動替換來源檔案。
* [X] 已在華為鴻蒙 4.2 的低版本 WebView 中測試通過

## 如何使用

你可以將 TiddlyWiki.html 匯入為可以開啟和編輯的 TiddlyWiki 檔案。

也可以將 TiddlyWiki.html 匯入為建立新 TiddlyWiki 的範本。

## 未來可能更新的功能

未來可能會完善 TiddlyWiki 和思源筆記的資料同步功能，但這需要進一步了解 TiddlyWiki 的外掛開發方式，以及 TiddlyWiki 對區塊引用的支援情況。

## i18n

使用 Claude Sonnet 4 進行國際化（i18n）工作。
