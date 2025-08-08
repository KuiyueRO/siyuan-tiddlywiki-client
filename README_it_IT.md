# Plugin TiddlyWiki per SiYuan

TiddlyWiki è un software di presa di appunti open source con 20 anni di storia che serve come scelta eccellente sia per la presa di appunti rapida che per praticare il metodo di annotazione a schede. Pertanto, ho sviluppato questo plugin per consentire agli utenti di utilizzare TiddlyWiki all'interno di SiYuan Notes.

## TiddlyWiki

TiddlyWiki viene fornito in due versioni: file singolo e server.

* Versione file singolo: Tutto il contenuto di una base di conoscenza è memorizzato in un singolo file `.html`
* Versione server: Usa `node.js`, con ogni nota memorizzata come file `.tiddler` separato

Questo plugin adotta la **versione file singolo**.

## Funzionalità implementate

* [X] Desktop: Aprire TiddlyWiki in schede
* [X] Mobile: Mostrare TiddlyWiki in una finestra di dialogo modale
* [X] Template di file vuoti preconfigurati
* [X] Intercettazione download

  * La versione file singolo di TiddlyWiki mostrerà una finestra di dialogo di download (download file del browser) ogni volta che salvi, richiedendo all'utente di selezionare un percorso file e scaricare per sostituire il file originale.
  * Il nostro plugin intercetta l'evento di download, consentendo la sostituzione automatica del file sorgente quando si clicca salva in TiddlyWiki.
* [X] Testato e superato sulla versione WebView inferiore di Huawei HarmonyOS 4.2

## Come usare

Puoi importare TiddlyWiki.html come file TiddlyWiki che può essere aperto e modificato.

Puoi anche importare TiddlyWiki.html come template per creare nuovi file TiddlyWiki.

## Futuri possibili aggiornamenti

In futuro, potremmo migliorare la sincronizzazione dei dati tra TiddlyWiki e SiYuan Notes, ma questo richiede una comprensione più approfondita dei metodi di sviluppo plugin di TiddlyWiki e del supporto di TiddlyWiki per i riferimenti a blocchi.

## i18n

Il lavoro di internazionalizzazione (i18n) viene svolto utilizzando Claude Sonnet 4.
