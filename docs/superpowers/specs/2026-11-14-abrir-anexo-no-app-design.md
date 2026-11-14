# Abrir o anexo dentro do app — design

**Pedido (14/11/2026):** o Abrir do anexo não funciona. Ele tenta uma aba nova
depois de buscar a URL assinada; o navegador barra o popup, aparece o link
"Abrir anexo" embaixo da lista e só esse link abre, em outra aba. O dono quer
que o **primeiro** Abrir mostre o anexo **dentro do app**.

**Por quê:** a pessoa quer conferir o recibo ou o boleto sem sair do detalhe
do lançamento, num toque.

## Abordagens

- **V1 · Visualizador sobre a folha (escolhida pelo dono).** Um `Dialog
  surface="auto"` abre por cima do detalhe: título "Foto"/"PDF", o tamanho e a
  data na descrição, a foto (ou o PDF num leitor embutido) no meio e, no
  rodapé, "Abrir em nova aba" e "Baixar". No telefone vira a gaveta.
- V2 · Tela cheia escura (galeria): mais espaço à imagem, mas seria um
  componente novo no design system.
- V3 · Abre na própria linha: nada cobre o detalhe, mas a foto fica pequena e
  o PDF apertado.

## Objetivos

- O Abrir abre o visualizador no primeiro toque, sem popup.
- Foto: a imagem inteira, contida (`object-contain`). PDF: `<iframe>` com
  título acessível.
- Rodapé: "Abrir em nova aba" (`tertiary`, um `<a target="_blank">` de
  verdade, que o navegador não barra) e "Baixar" (`primary`, a URL assinada
  com `download`). Os dois são `Button asChild`.
- Carregando a URL: esqueleto no lugar do arquivo. Falhou: a mensagem "Não foi
  possível abrir o anexo." dentro do visualizador.
- O link "Abrir anexo" embaixo da lista e o `abrirAnexo` (aba em branco)
  saem.

## Não objetivos

- Zoom, galeria entre anexos, girar a foto.
- Componente novo em `src/components/ui/` (o visualizador é uma composição de
  `Dialog`, `Skeleton` e `Button`, em `src/components/transactions/`).

## Restrições

- Design system: só componentes e tokens existentes; `npm run ds:audit`
  limpo nos arquivos tocados.
- O wireframe de anexos das contas (`src/components/wireframe/anexos-wireframe.tsx`,
  usado no detalhe e no pagar da conta) tem o mesmo defeito e usa
  `abrirAnexo`. Ele não pode vestir o `Dialog` (regra do wireframe): o Abrir
  dele mostra a prévia **na própria linha**, com `<img>`/`<iframe>` nativos e
  o link "Abrir em nova aba". *Decisão minha*, para o conserto valer em todo
  lugar que abre anexo.
- Mudança de jornada (abre um diálogo): `docs/JORNADAS.md` (nó `attachUrl`),
  `docs/atlas/template.html` (item "Anexos" e a data da capa), `build.py` e o
  Atlas republicado.

## Fica para quem constrói

- A altura do leitor de PDF, desde que sem valor arbitrário reprovado pelo
  auditor.
- O `staleTime` das URLs (valem 1 h).
