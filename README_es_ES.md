# Plugin TiddlyWiki para SiYuan

TiddlyWiki es un software de toma de notas de código abierto con 20 años de historia que sirve como una excelente opción tanto para la toma de notas rápida como para practicar el método de notas de tarjetas. Por lo tanto, desarrollé este plugin para permitir a los usuarios usar TiddlyWiki dentro de SiYuan Notes.

## TiddlyWiki

TiddlyWiki viene en dos versiones: archivo único y servidor.

* Versión de archivo único: Todo el contenido de una base de conocimientos se almacena en un solo archivo `.html`
* Versión de servidor: Usa `node.js`, con cada nota almacenada como un archivo `.tiddler` separado

Este plugin adopta la **versión de archivo único**.

## Características implementadas

* [X] Escritorio: Abrir TiddlyWiki en pestañas
* [X] Móvil: Mostrar TiddlyWiki en un diálogo modal
* [X] Plantillas de archivos vacíos preconfiguradas
* [X] Interceptación de descargas

  * La versión de archivo único de TiddlyWiki mostrará un diálogo de descarga (descarga de archivo del navegador) cada vez que guardes, requiriendo que el usuario seleccione una ruta de archivo y descargue para reemplazar el archivo original.
  * Nuestro plugin intercepta el evento de descarga, permitiendo el reemplazo automático del archivo fuente al hacer clic en guardar en TiddlyWiki.
* [X] Probado y aprobado en la versión WebView inferior de Huawei HarmonyOS 4.2

## Cómo usar

Puedes importar TiddlyWiki.html como un archivo TiddlyWiki que puede ser abierto y editado.

También puedes importar TiddlyWiki.html como una plantilla para crear nuevos archivos TiddlyWiki.

## Futuras actualizaciones posibles

En el futuro, podríamos mejorar la sincronización de datos entre TiddlyWiki y SiYuan Notes, pero esto requiere una comprensión más profunda de los métodos de desarrollo de plugins de TiddlyWiki y el soporte de TiddlyWiki para referencias de bloques.

## i18n

El trabajo de internacionalización (i18n) se realiza usando Claude Sonnet 4.
