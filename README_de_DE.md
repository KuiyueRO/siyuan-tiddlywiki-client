# TiddlyWiki Plugin für SiYuan

TiddlyWiki ist eine 20 Jahre alte Open-Source-Notizen-Software, die sowohl als Schnellnotiz-Tool als auch für die Praxis der Karteikarten-Notizmethode eine ausgezeichnete Wahl darstellt. Daher habe ich dieses Plugin entwickelt, um Benutzern die Verwendung von TiddlyWiki innerhalb von SiYuan Notes zu ermöglichen.

## TiddlyWiki

TiddlyWiki gibt es in zwei Versionen: Einzeldatei und Server.

* Einzeldatei-Version: Alle Inhalte einer Wissensbasis werden in einer einzigen `.html`-Datei gespeichert
* Server-Version: Verwendet `node.js`, wobei jede Notiz als separate `.tiddler`-Datei gespeichert wird

Dieses Plugin verwendet die **Einzeldatei-Version**.

## Implementierte Funktionen

* [X] Desktop: TiddlyWiki in Tabs öffnen
* [X] Mobil: TiddlyWiki in einem modalen Dialog anzeigen
* [X] Vorkonfigurierte leere Dateivorlagen
* [X] Download-Abfangung

  * Die Einzeldatei-Version von TiddlyWiki zeigt bei jedem Speichern einen Download-Dialog (Browser-Dateidownload) an, der Benutzer muss einen Dateipfad auswählen und herunterladen, um die ursprüngliche Datei zu ersetzen.
  * Unser Plugin fängt das Download-Ereignis ab und ermöglicht beim Klicken auf Speichern in TiddlyWiki den automatischen Ersatz der Quelldatei.
* [X] Getestet und bestanden auf Huawei HarmonyOS 4.2's niedrigerer WebView-Version

## Verwendung

Sie können TiddlyWiki.html als TiddlyWiki-Datei importieren, die geöffnet und bearbeitet werden kann.

Sie können TiddlyWiki.html auch als Vorlage für die Erstellung neuer TiddlyWiki-Dateien importieren.

## Zukünftige mögliche Updates

In Zukunft könnten wir die Datensynchronisation zwischen TiddlyWiki und SiYuan Notes verbessern, aber dies erfordert ein weiteres Verständnis der TiddlyWiki-Plugin-Entwicklungsmethoden und der Unterstützung von TiddlyWiki für Blockreferenzen.

## i18n

Die Internationalisierung (i18n) wird mit Claude Sonnet 4 durchgeführt.
