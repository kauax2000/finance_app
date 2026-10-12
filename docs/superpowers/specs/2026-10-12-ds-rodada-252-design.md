# Rodada 252 — o resto da auditoria do design system

Data: 2026-10-12. Base: commit `5a9a6f9` (rodada 251).

## Objetivo

Fechar o que sobrou da auditoria de excesso do design system: juntar as cópias
que a rodada 251 deixou separadas por mudarem comportamento (lista 1), fechar
os testes quase duplicados (lista 2) e fazer a parte da lista 3 que não mexe na
API (comentários, `AGENTS.md`, trocas por recurso nativo, limpeza de
relatórios).

## Restrições (do dono)

- **Nada da API sai.** Nenhum componente, peça, variante, prop ou demonstração
  do catálogo é apagado. Os 10 componentes sem uso no app ficam, e as três
  dependências também.
- **Na lista 1, vence a versão do catálogo:** o comportamento que a página do
  catálogo descreve é a regra, e o app se adapta. Onde páginas se
  contradiziam, o dono decidiu (abaixo).
- **Comentários de história:** uma linha de porquê, no máximo; a narrativa sai.
- **`AGENTS.md`:** só regras; a narrativa vai para o HISTORICO. As regras por
  componente ficam.
- **Trocas por nativo aprovadas:** o Enter do `Form`, a entrada dos gráficos e
  o `useTopBarBottom`.
- Nada grava no banco: o dev usa o Supabase de produção. Telas logadas não são
  abertas no navegador; a conferência delas é pelo código.

## Critério de sucesso

Ao fim de cada fase: `npx tsc --noEmit` limpo, `npm run lint` sem erro,
`npx vitest run` passando, `npm run ds:audit -- src/components src/app` sem
achado, e as variantes do `ds:catalog` iguais às do commit anterior (salvo onde
esta spec muda uma variante — nenhuma muda). Toda mudança de comportamento é
conferida no navegador, no catálogo em `localhost:3000`. Cada fase é um commit.

## Fase 1 — testes e limpeza (risco baixo)

1. Os testes #19 e #22 de `sidebar-ladder.test.ts` repetem quase os #1–#4 e #7
   de `glass.test.ts`, sobre um recorte maior. Passam a usar o mesmo helper e o
   mesmo recorte (`blocoCss` da utility), e a cópia sai, com cada asserção
   coberta uma vez.
2. Os 15 `*-ladder.test.ts` viram um `src/components/ui/escadas.test.ts`
   dirigido por tabela (componente → degraus, alturas, passo, regras de
   `src/test/regras.ts`). O que é específico de um componente vai para o
   `<comp>-versions.test.ts` dele. Nenhuma asserção de hoje fica sem cobertura:
   a lista de nomes de teste antes/depois é comparada, e cada asserção removida
   aponta para onde foi.
3. Saem `docs/design/CONFORMIDADE-01.md`, `CONFORMIDADE-02.md`,
   `REVISAO-IMPECCABLE-01.md` e `scripts/brand-grain-ab.mjs`. As referências
   (`docs/README`, skills, comentários em `globals.css` e `docs/brand.tsx`, a
   memória `dev-server-externo`) são atualizadas.

## Fase 2 — a lista 1 (juntar as cópias)

1. **Esconder ao rolar** — um hook para `TopBar hideOnScroll`, `BottomBar
   hideOnScroll` e `Toolbar sticky="hide"`. Regra: some ao descer >4px, volta
   ao subir >4px, nunca some com o foco dentro, volta sempre no topo, só no
   telefone. A rolagem é decidida por evento (a forma da `TopBar`, que funciona
   na moldura do catálogo). O movimento visual de cada barra continua o dela.
   Desligar a prop sempre limpa o estado escondido.
2. **Menu "⋯" de transbordo** — um mecanismo para `Tabs overflow="menu"`,
   `ToolbarActions overflow="menu"` e `PageHeaderActions`. A ponta de onde se
   tira é parâmetro: as abas saem do fim (a ativa nunca sai), as ações do
   começo (a última nunca sai). O gatilho é um só (botão de ícone ⋯ com nome
   acessível) e o menu também. Desligar o transbordo limpa o `hidden` que ele
   pôs.
3. **`AlertDialog` reusa o `Dialog`** — `AlertDialogHeader`,
   `AlertDialogFooter` e `AlertDialogTitle` passam a compor `DialogHeader`,
   `DialogFooter` e `DialogTitle` (sem gap, `leading-snug`, botões a 40 no
   dedo), mantendo os próprios `data-slot` e o `tone` do `AlertDialogMedia`.
   Muda o espaçamento das confirmações do app; a página do `Dialog` passa a
   ser verdade.
4. **O meio da gaveta** — o `acharMeio` marca o nó do meio com um atributo e o
   observa por `MutationObserver`; o CSS o acha pela marca. A cadeia de
   `:not()` repetida e a lista de slots duplicada saem.
5. **`Sheet` no telefone é o `Drawer`** — o ramo móvel do `Sheet` renderiza
   `Drawer`/`DrawerContent`. A superfície passa a ser a do `Drawer` (vidro), a
   altura acompanha o conteúdo, e `Drawer` e `Sheet` se empilham entre si (um
   contexto de aninhamento só). O `data-slot` do conteúdo continua
   `sheet-content` (passado ao `DrawerContent`). `pending` passa a respeitar o
   `dismissible` de quem chama, como no `Drawer`.
6. **Estado do `Collapsible`** — `useControllableState` de `radix-ui/internal`;
   o `onOpenChange` só dispara quando o valor muda. A retirada do `hidden` do
   `findable` antes de abrir continua.
7. **Véus** — uma função `overlayClassName(camada)` para `Dialog`,
   `AlertDialog`, `ConfirmarDescarte` e `Sheet`/`Drawer`. O véu do "Descartar
   alterações?" ganha o borrão e o esmaecer dos outros e fica em `--z-sheet`,
   documentado na página Layers.
8. **Marcador que viaja** — um hook para `Tabs`, `BottomBar` e `ToggleGroup`
   (o que observar e o prefixo das variáveis entram como parâmetro). O
   `ToggleGroup segmented` troca o deslize em CSS pela viagem líquida, como a
   página dele promete.
9. **Removedor de comentários** — um só, que entende strings e preserva
   posições, usado por `audit.mjs` e `catalog.mjs`. A saída dos dois scripts
   continua idêntica.
10. **`Container`** — o `catalog.mjs` aprende a seguir uma variável dentro da
    `cva` (um objeto literal no mesmo arquivo); então a `cva` passa a ler
    `containerSizes`/`Gutters`/`Stacks`. A página e o teste deixam de dar o
    motivo errado para os literais.
11. **Cascatas** — o `menubar-reveal` usa a `stagger-ladder` (40, 70… ms, como
    hoje). Os quatro keyframes de "sobe e aparece" viram um `@keyframes rise`
    com `--rise-distance` e `--rise-blur`; cada uso mantém os números de hoje,
    e o `overlay-rise` passa a animar `translate`.

## Fase 3 — recurso nativo

1. **Enter do `Form`** — saem `ENTER_DEFERRAL_RULES`,
   `shouldDeferEnterToWidget` e o desvio do Enter; vale a submissão implícita
   do navegador. Fica o ⌘/Ctrl+Enter no textarea. Antes, cada formulário do app
   é conferido: o botão `type="submit"` está dentro do `<form>` ou leva
   `form=`; onde não, ganha o `form=`. Testado nas demonstrações do catálogo
   (Enter num campo envia; Enter num campo de busca dentro de um popover não
   envia). A seção "Forms and Enter-to-submit" do `AGENTS.md` é reescrita.
2. **Entrada dos gráficos** — sai o `useChartReveal` (IntersectionObserver e
   fases) e o remount por `key`; o Recharts anima ao montar, com o
   `isAnimationActive` dele (respeita o movimento reduzido). Os números que
   contam (`useCountUp`) começam ao montar. A impressão continua mostrando o
   gráfico.
3. **`useTopBarBottom`** — a posição sob a barra vem de uma variável de CSS
   declarada pela casca (48px + área segura no app, 56px no catálogo). A
   medição por `ResizeObserver` sai; fica só a detecção de "está presa".
   Conferido no app (sem login: tela de login e catálogo) e na moldura do
   iPhone.

## Fase 4 — comentários de história

Em `src/components/ui`, `src/lib`, `src/hooks`, `src/app/globals.css`, nos
testes e no casco do catálogo: cada bloco narrativo ("rodada N", "medido",
"era X", "saiu", "foi recusado", túmulo de código removido) vira no máximo uma
ou duas linhas que dizem o que o código não diz. O texto das páginas do
catálogo (prosa mostrada na tela) não muda. Testes que conferem a redação de um
comentário são ajustados ou saem; os testes de "X não volta" ficam.

## Fase 5 — `AGENTS.md` só com regras

A narrativa sai para `docs/design/HISTORICO-DESIGN-SYSTEM.md`, numa seção
"Retirado do AGENTS.md (rodada 252)", na mesma ordem. Ficam as regras, as
invariantes, os fluxos obrigatórios e as regras por componente, enxutas. Meta:
~1.200–1.500 linhas. Nenhuma regra some: cada regra de hoje está no novo
`AGENTS.md` ou, se era só história, no HISTORICO.

## Fora do escopo

Apagar componentes, variantes, props, páginas ou dependências; os itens que o
dono vetou na rodada 251.

## Registro

A rodada 252 entra no HISTORICO ao fim, com as medições.
