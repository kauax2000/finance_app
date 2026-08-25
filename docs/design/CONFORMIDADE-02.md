# Conformidade com o design system — rodada 02

Sucessora de [`CONFORMIDADE-01.md`](CONFORMIDADE-01.md), que era o backlog e
agora é registro histórico. Aqui está o que a rodada 02 migrou, o que ela
descobriu que o backlog descrevia errado, e o que sobrou.

**1.179 → 622 achados. 144 → 132 arquivos.**

| Regra | 01 | 02 | O que é |
|---|---:|---:|---|
| **D2** | 622 | 357 | valor arbitrário |
| **D3** | 286 | **12** | paleta padrão do Tailwind |
| **H** | 87 | 86 | `hover:` sem par de toque |
| **I** | 77 | 77 | `Intl.*` ou `toLocaleString` inline |
| **C** | 51 | 51 | primitivo cru com equivalente |
| **D** | 47 | 30 | cor literal em hex ou `rgb()` |
| **A** | 4 | 4 | componente declarado dentro de `src/app/` |
| **C'** | 4 | 4 | primitivo cru sem equivalente |
| **F** | 1 | 1 | semântica / acessibilidade |

Linha de base **inalterada**: `npx tsc --noEmit` continua com os mesmos 2 erros
pré-existentes em arquivos de teste, `npm run lint` com 0 erros e 85 avisos,
`npm run test:unit` com 189 testes passando.

---

## Onde o backlog da rodada 01 estava errado

### A escala de camadas não descrevia a produção

O backlog mandava trocar `z-[70]` por `--z-sheet`, `z-[80]` por `--z-popover` e
`z-[100]` por `--z-toast`, "preservando a ordem relativa". **Essa troca teria
quebrado o empilhamento**, porque a escala dizia `--z-sheet: 50` e
`--z-popover: 60` enquanto a produção rodava 70 e 80 — e não tinha degrau nenhum
para o 50, onde moram `Dialog`, `AlertDialog`, `Drawer`, `Tooltip`, `HoverCard`,
`Menubar` e `ContextMenu`. Migrar mecanicamente teria colapsado a folha no mesmo
nível do diálogo, e a ordem entre os dois passaria a depender da ordem no DOM.

A escala foi corrigida para valer o que o app já valia, e ganhou o degrau que
faltava:

| Token | Antes | Agora | Quem está lá |
|---|---:|---:|---|
| `--z-banner` | `--z-nav-island` 30 | 30 | a faixa de offline |
| `--z-header` | `--z-overlay` 40 | 40 | o cabeçalho fixo do telefone |
| `--z-modal` | — | **50** | Dialog, AlertDialog, Drawer, Tooltip, HoverCard, Menubar, ContextMenu |
| `--z-sheet` | 50 | **70** | a folha lateral |
| `--z-popover` | 60 | **80** | Popover, DropdownMenu, Select |

Os dois renomeados nomeavam quem não estava lá: não existe camada só de overlay
(escurecimento e conteúdo compartilham o mesmo z em toda camada), e a ilha de
navegação está no 50, não no 30.

**Empilhamento local ficou como estava.** `z-0`, `z-10`, `z-[1]` e `z-[-1]`
dentro de um componente são ordem entre irmãos num contexto de empilhamento, não
decisão que atravessa telas. Forçar token ali só faria o nome mentir.

### Uma cadeia de escalada cobria os toasts do app

`categories-toolbar.tsx` forçava `PopoverContent` a `z-[100]` — o nível do
`Toaster` — e o `Select` dentro dele foi para `z-[220]` só para vencer o popover
que o continha. Efeito colateral: **aquele popover cobria qualquer toast**. Os
dois voltaram para o padrão `--z-popover`; dois portais no mesmo z se resolvem
por ordem no DOM, e o que abre depois entra depois. Verificado no navegador.

### "SVG/Recharts attrs cannot use var()" era falso, e o backlog estava certo

`dashboard-cashflow-chart.tsx` fixava quatro hex sob um comentário afirmando
isso, duas linhas acima de um `color-mix(in oklch, var(--muted) …)` no cursor do
próprio `Tooltip`. `fill` e `stroke` resolvem `var()` — confirmado medindo o
`fill` computado no navegador. O que amarrava tudo ao hex era o helper
`hexToRgba`, substituído por `color-mix`. `credit-cards-history-chart.tsx` tinha
seis hex fazendo o papel da rampa `--chart-1..5`, que existe para isso.

---

## O que a rodada 02 fez

### D3: 286 → 12

O tema escuro era o problema real, não o estilo. As decisões que não eram
mecânicas:

- **Chip de filtro selecionado** usava `Badge variant="success"` **e** por cima
  `bg-emerald-50 … dark:bg-emerald-950`, derrotando a própria variante. Os
  emeralds saíram; a variante já era exatamente aquele visual, e
  `tagChipFilterSelected` já documentava a convenção.
- **Uso de limite do cartão** virou `success`/`warning`/`destructive`: limite
  folgado é "deu certo", não "entrou dinheiro" (invariante 3).
- **Chip Despesa/Receita** virou `expense`/`income`, que é o caso-livro da mesma
  invariante.
- **Fatura maior/menor que a anterior** virou `success`/`warning`, e não
  `income`/`expense`: os dois lados são despesa, e o que muda é o juízo sobre o
  valor. Mesma escolha do diagnóstico de fechamento no painel de análise.
- **Cinco matizes cruas de aviso** (sky, teal, amber, violet, emerald) no painel
  de fatura viraram `info`/`success`/`warning`/neutro, na mesma forma do `Alert`.
  Os dois verdes diziam a mesma coisa e viraram um.

Os 12 restantes são todos `text-white` sobre a cor de avatar vinda do banco, e
estão travados na migração de `profiles.avatar_color` que a rodada 01 já
descreveu.

### D2: 622 → 357

As substituições mecânicas do backlog, mais duas que ele não listou:
`text-[0.6rem]` e `text-[0.65rem]` (9 ocorrências) também viram `text-2xs`.

`text-2xs` define entrelinha, e `text-[11px]` não definia. Dos 214 casos, 42 já
traziam `leading-*` explícito e não mudaram; os outros passaram a ter entrelinha
declarada em vez de herdada, que é o ponto do token.

**Os 357 restantes são majoritariamente legítimos.** `w-[…]` (234) e `h-[…]` (74)
são larguras de esqueleto, e os sete arquivos com mais achados hoje são seis
`*-skeleton.tsx` e uma tabela. Não force token onde não há.

### D: 47 → 30

Três `#EF4444` de cor de fallback de categoria viraram `var(--expense)`. Dez hex
de gráfico viraram tokens. E três `text-[oklch(0.45_0.14_166)]` nos formulários
de autenticação — **cor literal disfarçada de utilitário de texto**, que passava
pelo detector de cor e ficava escura sobre fundo escuro — viraram `text-primary`.

### Componente novo: `ColorTile`

O verniz sobre cor de runtime estava copiado em **oito arquivos**, idêntico até
nos décimos de opacidade — e cada cópia era um achado do auditor que ninguém
sabia justificar. Virou
[`src/components/ui/color-tile.tsx`](../../src/components/ui/color-tile.tsx),
com página em `/designsystem/color-tile`.

É **o único lugar do app onde `white` e `black` crus são a resposta certa**: o
fundo é uma cor arbitrária vinda do banco, e o verniz claro com o fio escuro são
material, não tema — têm que ser iguais nos dois temas, senão o ladrilho muda de
aparência sem que a cor tenha mudado. Só ele está na lista de exceção do
auditor; nenhuma tela está.

O que ele não resolve: contra um amarelo claro escolhido pela pessoa, o ícone
branco some. Medir contraste contra a cor gravada é decisão de produto, porque
muda a aparência de categorias que já existem.

### Acessibilidade e catálogo

- `Calendar` sem `locale` caía no inglês do `react-day-picker`. Agora tem `ptBR`
  por padrão — o `DatePicker` já passava, e um padrão que só vale quando alguém
  lembra não é padrão.
- `StepperItem` escondia o rótulo com `hidden` no telefone, tirando-o da árvore
  de acessibilidade. Virou `sr-only sm:not-sr-only`.
- `ComboboxTrigger` herdava `aria-haspopup="dialog"` do `PopoverTrigger` e abria
  uma listbox. Agora declara `listbox`.
- `Toolbar` **perdeu** `role="toolbar"`. Esse papel é um contrato de teclado —
  uma parada de tabulação para o grupo, setas entre os controles — e nada disso
  existia. Anunciar um widget que não se comporta como tal é pior que não
  anunciar.
- Sete `<img>` de avatar ganharam `decoding="async"`, e os dois que aparecem
  dentro de lista ganharam `loading="lazy"`.
- O catálogo ganhou **breadcrumb** no lugar da sobrancelha de categoria,
  **anterior/próximo** no pé de cada página, **`/` e `⌘K`** para focar a busca, e
  um bloco **"Comece aqui"** no índice com as quatro páginas que mudam o que
  alguém escreve nas outras 84.

---

## O que sobrou, em ordem de razão entre impacto e risco

1. **H — 86 `hover:` sem par de toque.** Concentradas em `page-client.tsx` (19),
   `transactions-table.tsx` (6). A correção é **somar** `active:`, nunca remover
   o `hover:`.
2. **I — 77 formatações fora dos helpers.** `Intl.NumberFormat` e
   `toLocaleDateString` escritos na tela. Destino: `@/lib/formatters` e
   `@/lib/transaction-date`.
3. **C — 51 primitivos crus.** `<button>` é o caso mais comum. Muda tipos de
   props: rode `npx tsc --noEmit` a cada arquivo.
4. **D3 — os 12 últimos.** Bloqueados na migração de `profiles.avatar_color`,
   que é decisão de produto e não de front end.
5. **`PropsTable` ausente em 60 das 88 páginas** do catálogo. Trabalho de
   conteúdo, não de código.
6. **Duas bibliotecas de ícones.** Heroicons em 88 arquivos, Lucide em 40, com
   `components.json` declarando `lucide`. Migração larga e independente de todo
   o resto; até lá, a regra mínima é não misturar dentro de uma mesma tela.

## Como reproduzir

```bash
npm run ds:audit                 # a varredura inteira
npm run ds:audit -- --rule D3    # uma regra
npm run ds:catalog               # o que existe hoje
```
