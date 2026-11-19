# Menu de ordem de Categorias: ordem + sentido (C) — desenho curto

Data: 19/11/2026. Escolha do dono: **C**.

## Por quê

O menu de ordem tem hoje três linhas soltas com um ponto à direita. O dono quer um design melhor e escolheu a versão que também deixa inverter o sentido da ordem.

## O que muda

- **Título** "Ordenar por" no topo (`DropdownMenuLabel`).
- **Três ordens, cada uma com ícone** (Heroicons `16/solid`, numa linha de menu):
  - **Gasto**, ou **Receita** na aba de receitas: ícone de dinheiro (`BanknotesIcon` ou equivalente).
  - **Nome**: ícone de texto ou lista. A escolha fica com quem constrói.
  - **Variação**: `ArrowTrendingUpIcon`.
  - O rótulo da primeira ordem deixa de ser "Maior gasto", porque o sentido agora diz se é maior ou menor primeiro.
- **A escolhida** acende a linha e ganha o **tique ✓** no lugar do ponto. Isso pede uma variante nova no `DropdownMenuRadioItem` (`src/components/ui/dropdown-menu.tsx`): `indicator="check"`, com o tique à direita na tinta do texto e a linha acesa em `bg-foreground/9`. O ponto continua o padrão nos outros menus. **É uma mudança no design system, e a escolha do dono pela C conta como a autorização.** Ela leva registro, página do catálogo e teste (invariante 8, regras do `DropdownMenu`).
- **Sentido**, num trilho no pé do menu (`ToggleGroup variant="segmented"`), separado por respiro e sem fio. Os rótulos mudam com a ordem:
  - **Gasto ou Receita:** "Maior primeiro" | "Menor primeiro".
  - **Nome:** "A → Z" | "Z → A".
  - **Variação:** "Mais subiu" | "Mais caiu".
  - Trocar de ordem volta o sentido ao natural, que é a primeira opção.
  - Se o `ToggleGroup` brigar com o teclado do menu (setas, Tab, Esc), o sentido vira um segundo `DropdownMenuRadioGroup` com o título "Sentido". Quem constrói decide, testando o teclado.
- **Lógica:** `ordenarCategorias(itens, criterio, invertida = false)` e `dividirDoMes(itens, criterio, invertida)`, em `src/lib/categoria-situacao.ts`. Invertida, a ordem é o reverso da natural, e o empate continua estável. A página guarda `invertida` no estado, ao lado de `criterio`.
- **O gatilho:** o ícone ⇅ continua. O `aria-label` diz a ordem e o sentido, por exemplo "Ordenar categorias: gasto, maior primeiro".
- **No telefone,** o mesmo menu.

## O que não muda

Os cartões, a contagem, o mês, o critério que começa em "gasto, maior primeiro", e o fato de que a ordem não é guardada entre visitas.

## Abordagens

1. **A:** título, ícone e tique, sem o sentido.
2. **B:** a A com uma linha de explicação em cada ordem.
3. **C (escolhida):** a A mais o sentido. É uma funcionalidade nova: ver primeiro o que menos gastou, de Z a A, ou o que mais caiu.
4. **D:** só limpar o menu de hoje.
