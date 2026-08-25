# Conformidade com o design system — rodada 01

> **Registro histórico. O estado atual está em
> [`CONFORMIDADE-02.md`](CONFORMIDADE-02.md).**
>
> A rodada 02 executou a maior parte deste backlog e derrubou os achados de
> 1.179 para 622. Duas prescrições daqui estavam **erradas** e a 02 explica por
> quê: o mapeamento de `z-[70]`/`z-[80]` para a escala de camadas teria quebrado
> o empilhamento, porque era a escala que estava errada, não o código. O resto
> se confirmou, inclusive a premissa falsa sobre `var()` no Recharts.

Gerado por `npm run ds:audit` sobre `src/app` e `src/components`, com a rota
`src/app/designsystem` excluída da varredura.

**1.179 achados em 144 arquivos.**

Este documento é o backlog da próxima rodada. Nada aqui foi migrado: a rodada 01
entregou tokens, componentes, documentação e o auditor. Migrar as telas é uma
decisão separada, com risco de regressão visual que precisa de verificação tela a
tela.

| Regra | Quantidade | O que é |
|---|---:|---|
| **D2** | 622 | valor arbitrário (`text-[11px]`, `z-[100]`, `w-[4.25rem]`) |
| **D3** | 286 | paleta padrão do Tailwind (`text-emerald-600`, `bg-white`) |
| **H** | 87 | `hover:` sem par de toque |
| **I** | 77 | `Intl.*` ou `toLocaleString` inline |
| **C** | 51 | primitivo cru com equivalente no design system |
| **D** | 47 | cor literal em hex ou `rgb()` |
| **A** | 4 | componente declarado dentro de `src/app/` |
| **C'** | 4 | primitivo cru sem equivalente |
| **F** | 1 | semântica / acessibilidade |

Dois achados dentro de `src/components/ui/` foram corrigidos nesta rodada, por
estarem na fronteira que o design system governa: o overlay do `Drawer`, que veio
do registry com `bg-black/10` cru em vez de `bg-overlay`, e o botão de fechar do
`AnnouncementBar`, que tinha `hover:` sem par de toque.

Restam 48 achados em `components/ui/`, quase todos **D2** vindos do registry
(`w-[8rem]`, `rounded-[2px]` dentro de `chart.tsx`). Dois deles são falso
positivo do detector: o `hover:` do polegar do `Slider`, cujo estado de arraste
vem de `data-dragging`, e o `role="group"` do `InputGroupAddon`, que não é
clicável.

---

## Ordem sugerida

A ordem abaixo é por **razão entre impacto e risco**, não por quantidade.

### 1. D2 mecânico — 259 ocorrências, risco quase zero

Duas substituições resolvem 40% de toda a regra D2, e nenhuma delas muda o
desenho de forma perceptível:

| De | Para | Ocorrências |
|---|---|---:|
| `text-[11px]` | `text-2xs` | 145 |
| `text-[10px]` | `text-2xs` | 60 |
| `z-[100]` | `z-(--z-toast)` | 15 |
| `text-[0.8rem]` | `text-control-sm` | 12 |
| `text-[9px]` | `text-2xs` | 8 |
| `z-[70]` | `z-(--z-popover)` | 8 |
| `z-[80]`, `z-[1]` | escala de camadas | 8 |

`--text-2xs` vale 0,6875rem, que é exatamente 11px. As 60 ocorrências de
`text-[10px]` e as 8 de `text-[9px]` sobem um pixel ou dois — o que é uma
melhoria de legibilidade, não um efeito colateral.

**Os 366 D2 restantes são majoritariamente legítimos:** larguras de esqueleto
(`w-[4.25rem]`, `w-[min(100%,14rem)]`) existem para casar com a largura do
conteúdo real. Não force token onde não há.

### 2. D3 — 288 ocorrências, alto impacto no tema escuro

A distribuição por família diz para onde cada uma vai:

| Família | Ocorrências | Destino provável |
|---|---:|---|
| `emerald` + `green` + `teal` | 135 | `income` / `success` — **decidir qual** |
| `white` + `black` | 57 | `card`, `background`, `foreground` |
| `amber` | 38 | `warning` |
| `red` + `rose` | 35 | `expense` / `destructive` — **decidir qual** |
| `sky` + `violet` + `blue` | 17 | `info` |
| `neutral` + `zinc` + `gray` | 6 | `muted-foreground`, `border` |

**A decisão que não é mecânica:** verde de "deu certo" e verde de "entrou
dinheiro" são coisas diferentes neste produto, e os tokens são diferentes.
`text-emerald-600` num badge de "Pago" vira `success`; o mesmo verde num valor de
extrato vira `income`. Uma busca-e-troca cega acerta a cor e erra o significado.

### 3. H — 88 ocorrências

`hover:` sem `active:` ou `group-active:`. No telefone, essas superfícies não dão
resposta nenhuma ao toque. A correção é **somar** o `active:`, nunca remover o
`hover:` — a decisão do projeto é manter hover para iPad com trackpad.

Concentradas em `page-client.tsx` (19), `transactions-filters-panel.tsx` (8) e
`transactions-table.tsx` (6).

### 4. I — 77 ocorrências

`Intl.NumberFormat`, `Intl.DateTimeFormat`, `toLocaleString` e
`toLocaleDateString` escritos na tela. Cada um é livre para divergir em casas
decimais, símbolo e separador, e nenhum aparece quando alguém procura por "como
formatamos dinheiro".

Destino: `@/lib/formatters` (`currencyBRL`, `signedCurrencyBRL`, `percentBR`) e
`@/lib/transaction-date`.

### 5. C — 51 ocorrências

Primitivo cru onde existe componente. `<button>` é o caso mais comum. É correção
direta, mas muda tipos de props: rode `npx tsc --noEmit` a cada arquivo.

### 6. A — 4 ocorrências

Os únicos componentes nascendo dentro de `src/app/`:

| Onde | O quê |
|---|---|
| `src/app/(app)/account/activity/page-client.tsx:157` | `ActivityPageSkeleton` |
| `src/app/(app)/account/sessions/page-client.tsx:28` | `SessionsPageSkeleton` |
| `src/app/(app)/members/page-client.tsx:120` | `MembersSectionSkeleton` |
| `src/app/(app)/subscriptions/page-client.tsx:90` | `SortIndicator` |

Os três esqueletos provavelmente ficam onde estão: o esqueleto tem a forma do
conteúdo daquela tela específica, e a segunda tela que precisaria dele não
existe. `SortIndicator` é o candidato real — ordenação de tabela aparece em mais
de um lugar.

---

## Os dez arquivos com mais achados

| Achados | Arquivo | Distribuição |
|---:|---|---|
| 82 | `src/components/credit-cards/credit-card-invoice-analytics-panel.tsx` | D3 46 · D2 27 · C 4 · C' 2 · I 2 · H 1 |
| 65 | `src/components/transactions/transactions-filters-panel.tsx` | D3 36 · D2 18 · H 8 · C 3 |
| 50 | `src/components/credit-cards/registered-credit-card-face.tsx` | D2 31 · D3 15 · D 4 |
| 31 | `src/components/transactions/transactions-page-skeleton.tsx` | D2 29 · H 2 |
| 28 | `src/app/(app)/subscriptions/page-client.tsx` | I 10 · D2 10 · C 3 · H 3 · A 1 · D3 1 |
| 28 | `src/components/credit-cards/credit-card-detail-skeleton.tsx` | D2 27 · H 1 |
| 28 | `src/components/signup-form.tsx` | D3 16 · D2 5 · D 4 · H 2 · C 1 |
| 28 | `src/components/transactions/transactions-table.tsx` | D2 17 · H 6 · I 3 · C 2 |
| 27 | `src/components/categories/detail/category-detail-hero.tsx` | D3 22 · D2 3 · H 2 |
| 26 | `src/components/dashboard/dashboard-cashflow-chart.tsx` | D2 12 · D3 8 · D 4 · I 2 |

Os arquivos de esqueleto (`*-skeleton.tsx`) inflam a lista com D2 legítimo. Na
prática os alvos reais são o painel de análise de fatura, o painel de filtros e a
capa do cartão.

---

## Exceções legítimas, que não devem ser "corrigidas"

### Cores escolhidas pelo usuário e gravadas no banco

`category-appearance-fields.tsx`, `workspace-appearance-form-fields.tsx` e
`workspace-appearance-edit-dialog.tsx` oferecem uma paleta para a pessoa escolher
a cor de uma categoria ou de um workspace. **Isso é dado de runtime, não decisão
de design.** O auditor já os ignora.

O que pode ser feito sem migração de dados: fazer a paleta *oferecida* derivar
dos tokens. Os valores já gravados continuam válidos.

### `src/lib/avatar.ts` — 17 classes cruas, e uma migração de banco

`AVATAR_COLORS` devolve classes do Tailwind (`bg-sky-500`), e a escolha de cada
pessoa fica gravada em `profiles.avatar_color` **como string de classe**. Pior:
o banco tem o padrão escrito dentro de uma função —
`coalesce(nullif(btrim(p.avatar_color), ''), 'bg-sky-500')` em
`workspace_member_directory`, no baseline.

Trocar pelos tokens `--identity-1..6` exige, na ordem:

1. Um mapa das 17 classes antigas para os 6 tons novos.
2. Migração de dados em `profiles.avatar_color`.
3. Alterar o padrão dentro de `workspace_member_directory`.
4. Só então trocar `avatar.ts` e os 7 consumidores.

Os tokens já existem e estão documentados em `/designsystem/cores`. A migração é
uma decisão de produto, não de front end.

### Logos de marca de cartão

`credit-card-brand-logos.tsx` desenha as marcas de Visa, Mastercard e afins. As
cores são das marcas e não podem seguir o tema. Já ignorado pelo auditor.

---

## Achados que são premissa errada, não estilo

### `dashboard-cashflow-chart.tsx` — "SVG/Recharts attrs cannot use var()"

O arquivo fixa `#10B981` e `#E11D48` com um comentário afirmando que atributos de
SVG não aceitam `var()`. **A premissa está errada:** `fill` e `stroke` resolvem
`var()` em todos os navegadores que o app suporta, e é exatamente o mecanismo que
`ChartContainer` usa — ele emite `--color-<série>` no escopo do gráfico. Trocar
por `var(--color-entradas)` e `var(--color-saidas)` faz o gráfico acompanhar o
tema sem nenhum `useTheme`.

Mesma correção vale para `credit-cards-history-chart.tsx` (6 hex).

### Duas bibliotecas de ícones

Heroicons aparece em **88 arquivos** e Lucide em **40**, enquanto
`components.json` declara `"iconLibrary": "lucide"`. As duas famílias têm
gramática de desenho diferente (espessura de traço, raio de canto, grade), e
misturá-las na mesma tela se nota. Isso inclui `src/components/ui/`:
`page-header.tsx`, `date-picker.tsx` e `mobile-sheet-form-chrome.tsx` usam
Heroicons; os componentes vindos do registry usam Lucide.

Unificar é uma migração grande e independente destas outras. Até lá, a regra
mínima é **não misturar dentro de uma mesma tela**.

---

## Como reproduzir

```bash
npm run ds:audit                 # a varredura inteira
npm run ds:audit -- --rule D3    # uma regra
npm run ds:audit -- --json       # para script
npm run ds:catalog               # o que existe hoje
```

## Base de comparação

Antes de qualquer migração, o projeto está em:

- `npx tsc --noEmit` — **2 erros pré-existentes**, ambos em arquivos de teste
  (`payment-events.test.ts`, `mutation-gateway.test.ts`), sem relação com a UI.
- `npm run lint` — **0 erros, 85 avisos**.
- `npm run test:unit` — ver a saída atual antes de comparar.

Se algum desses números subir durante a migração, foi a migração.
