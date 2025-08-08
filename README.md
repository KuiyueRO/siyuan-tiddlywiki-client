# TiddlyWiki Plugin for SiYuan

TiddlyWiki is a 20-year-old open-source note-taking software that serves as an excellent choice for both quick note-taking and practicing the card note-taking method. Therefore, I developed this plugin to allow users to use TiddlyWiki within SiYuan Notes.

## TiddlyWiki

TiddlyWiki comes in two versions: single file and server.

* Single file version: All content of a knowledge base is stored in a single `.html` file
* Server version: Uses `node.js`, with each note stored as a separate `.tiddler` file

This plugin adopts the **single file version**.

## Implemented Features

* [X] Desktop: Open TiddlyWiki in tabs
* [X] Mobile: Pop up TiddlyWiki in a modal dialog
* [X] Pre-configured empty file templates
* [X] Download interception

  * The single file version of TiddlyWiki will pop up a download dialog (browser file download) every time you save, requiring users to select a file path and download to replace the original file.
  * Our plugin intercepts the download event, allowing automatic replacement of the source file when clicking save in TiddlyWiki.
* [X] Tested and passed on Huawei HarmonyOS 4.2's lower version WebView

## How to Use

You can import TiddlyWiki.html as a TiddlyWiki file that can be opened and edited.

You can also import TiddlyWiki.html as a template for creating new TiddlyWiki files.

## Future Possible Updates

In the future, we may improve the data synchronization between TiddlyWiki and SiYuan Notes, but this requires further understanding of TiddlyWiki plugin development methods and TiddlyWiki's support for block references.

## i18n

Internationalization (i18n) work is done using Claude Sonnet 4.
