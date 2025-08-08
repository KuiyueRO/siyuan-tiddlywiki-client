# Plugin TiddlyWiki para SiYuan

TiddlyWiki é um software de anotações de código aberto com 20 anos de história que serve como uma excelente escolha tanto para anotações rápidas quanto para praticar o método de anotações em cartões. Portanto, desenvolvi este plugin para permitir que os usuários usem o TiddlyWiki dentro do SiYuan Notes.

## TiddlyWiki

TiddlyWiki vem em duas versões: arquivo único e servidor.

* Versão de arquivo único: Todo o conteúdo de uma base de conhecimento é armazenado em um único arquivo `.html`
* Versão servidor: Usa `node.js`, com cada nota armazenada como um arquivo `.tiddler` separado

Este plugin adota a **versão de arquivo único**.

## Recursos implementados

* [X] Desktop: Abrir TiddlyWiki em abas
* [X] Mobile: Exibir TiddlyWiki em uma caixa de diálogo modal
* [X] Modelos de arquivos vazios pré-configurados
* [X] Interceptação de download

  * A versão de arquivo único do TiddlyWiki exibirá uma caixa de diálogo de download (download de arquivo do navegador) toda vez que você salvar, exigindo que o usuário selecione um caminho de arquivo e baixe para substituir o arquivo original.
  * Nosso plugin intercepta o evento de download, permitindo a substituição automática do arquivo fonte ao clicar em salvar no TiddlyWiki.
* [X] Testado e aprovado na versão WebView inferior do Huawei HarmonyOS 4.2

## Como usar

Você pode importar TiddlyWiki.html como um arquivo TiddlyWiki que pode ser aberto e editado.

Você também pode importar TiddlyWiki.html como um modelo para criar novos arquivos TiddlyWiki.

## Futuras atualizações possíveis

No futuro, podemos melhorar a sincronização de dados entre TiddlyWiki e SiYuan Notes, mas isso requer uma compreensão mais profunda dos métodos de desenvolvimento de plugins do TiddlyWiki e do suporte do TiddlyWiki para referências de blocos.

## i18n

O trabalho de internacionalização (i18n) é feito usando Claude Sonnet 4.
