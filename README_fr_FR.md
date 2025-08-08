# Plugin TiddlyWiki pour SiYuan

TiddlyWiki est un logiciel de prise de notes open source vieux de 20 ans qui constitue un excellent choix à la fois comme outil de prise de notes rapide et pour pratiquer la méthode de prise de notes par cartes. J'ai donc développé ce plugin pour permettre aux utilisateurs d'utiliser TiddlyWiki dans SiYuan Notes.

## TiddlyWiki

TiddlyWiki existe en deux versions : fichier unique et serveur.

* Version fichier unique : Tout le contenu d'une base de connaissances est stocké dans un seul fichier `.html`
* Version serveur : Utilise `node.js`, chaque note étant stockée comme un fichier `.tiddler` séparé

Ce plugin adopte la **version fichier unique**.

## Fonctionnalités implémentées

* [X] Bureau : Ouvrir TiddlyWiki dans des onglets
* [X] Mobile : Afficher TiddlyWiki dans une boîte de dialogue modale
* [X] Modèles de fichiers vides préconfigurés
* [X] Interception des téléchargements

  * La version fichier unique de TiddlyWiki affiche une boîte de dialogue de téléchargement (téléchargement de fichier du navigateur) à chaque sauvegarde, obligeant l'utilisateur à sélectionner un chemin de fichier et télécharger pour remplacer le fichier original.
  * Notre plugin intercepte l'événement de téléchargement, permettant le remplacement automatique du fichier source lors du clic sur sauvegarder dans TiddlyWiki.
* [X] Testé et validé sur la version WebView inférieure de Huawei HarmonyOS 4.2

## Comment utiliser

Vous pouvez importer TiddlyWiki.html comme un fichier TiddlyWiki qui peut être ouvert et édité.

Vous pouvez également importer TiddlyWiki.html comme modèle pour créer de nouveaux fichiers TiddlyWiki.

## Futures mises à jour possibles

À l'avenir, nous pourrions améliorer la synchronisation des données entre TiddlyWiki et SiYuan Notes, mais cela nécessite une compréhension plus approfondie des méthodes de développement de plugins TiddlyWiki et du support de TiddlyWiki pour les références de blocs.

## i18n

Le travail d'internationalisation (i18n) est effectué avec Claude Sonnet 4.
