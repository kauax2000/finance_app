# O filtro com o ícone do iOS — design curto

**Pedido (15/11/2026):** trocar o ícone do botão de filtro (hoje
`AdjustmentsHorizontalIcon`, controles deslizantes, que leem como "ajustes")
pelo filtro do iPhone, o SF Symbol `line.3.horizontal.decrease`: três linhas
centradas, cada uma mais curta. Comparativo:
https://claude.ai/artifact/RNrzEaZWSnZ69jjDasKNqZ

## Abordagens

- **Funil (`FunnelIcon`)**, dentro da regra "Heroicons, e só".
- **Linhas com seta (`BarsArrowDownIcon`)**, a mais perto do iOS no Heroicons,
  mas lê como "ordenar".
- **Três linhas desenhadas** — **escolhida pelo dono**, com o círculo de fora.
  Fura a regra do conjunto; o precedente é o `SidebarToggleIcon`.

## O que muda

- **Ícone novo** `FilterLinesIcon` em `src/components/icons/filter-lines-icon.tsx`,
  no molde do `SidebarToggleIcon`: grade `16/solid` (viewBox 16, preenchido,
  `currentColor`, `aria-hidden`, `data-slot="icon"`, repassa as props).
- **Exceção nomeada:** `"filter-lines-icon"` em `DRAWN_SVG_FILES`
  (`.claude/skills/design-system-guard/scripts/audit.mjs`), com o motivo.
  `AGENTS.md` (Ícones) e a página `/designsystem/iconography` passam a dizer que
  a lista também leva os pictogramas que o Heroicons não tem, por decisão do
  dono (a barra lateral, o filtro do iOS).
- **Onde veste:** o botão de filtro do cabeçalho (`app-header.tsx`, telefone e
  desktop) e o padrão do `ToolbarFilterButton` (`src/components/ui/toolbar.tsx`,
  autorizado pelo dono). O ponto de ativo continua.
- **Fica:** o "exibir" do `DataTable` (ajuste de colunas, não filtro) e o
  calendário do cabeçalho nas telas de mês.

## Conferir

375px e desktop, com e sem filtro: o ícone novo no cabeçalho e no botão de
filtro da `Toolbar` (catálogo `/designsystem/toolbar`).
