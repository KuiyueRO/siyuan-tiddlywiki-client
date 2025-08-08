# Plugin TiddlyWiki dla SiYuan

TiddlyWiki to 20-letnie oprogramowanie open source do robienia notatek, które służy jako doskonały wybór zarówno jako narzędzie do szybkiego robienia notatek, jak i do praktykowania metody notatek kartkowych. Dlatego opracowałem ten plugin, aby umożliwić użytkownikom korzystanie z TiddlyWiki w SiYuan Notes.

## TiddlyWiki

TiddlyWiki dostępny jest w dwóch wersjach: pojedynczy plik i serwer.

* Wersja pojedynczego pliku: Cała zawartość bazy wiedzy jest przechowywana w jednym pliku `.html`
* Wersja serwera: Używa `node.js`, każda notatka jest przechowywana jako oddzielny plik `.tiddler`

Ten plugin przyjmuje **wersję pojedynczego pliku**.

## Zaimplementowane funkcje

* [X] Pulpit: Otwieranie TiddlyWiki w zakładkach
* [X] Mobile: Wyświetlanie TiddlyWiki w oknie dialogowym modalnym
* [X] Wstępnie skonfigurowane szablony pustych plików
* [X] Przechwytywanie pobierania

  * Wersja pojedynczego pliku TiddlyWiki będzie wyświetlać okno dialogowe pobierania (pobieranie pliku przeglądarki) za każdym razem, gdy zapisujesz, wymagając od użytkownika wyboru ścieżki pliku i pobrania w celu zastąpienia oryginalnego pliku.
  * Nasz plugin przechwytuje zdarzenie pobierania, umożliwiając automatyczne zastąpienie pliku źródłowego po kliknięciu zapisz w TiddlyWiki.
* [X] Przetestowane i zatwierdzone w niższej wersji WebView Huawei HarmonyOS 4.2

## Jak używać

Możesz zaimportować TiddlyWiki.html jako plik TiddlyWiki, który można otwierać i edytować.

Możesz również zaimportować TiddlyWiki.html jako szablon do tworzenia nowych plików TiddlyWiki.

## Możliwe przyszłe aktualizacje

W przyszłości możemy ulepszyć synchronizację danych między TiddlyWiki a SiYuan Notes, ale wymaga to głębszego zrozumienia metod rozwoju pluginów TiddlyWiki i wsparcia TiddlyWiki dla referencji bloków.

## i18n

Praca nad internacjonalizacją (i18n) jest wykonywana przy użyciu Claude Sonnet 4.
