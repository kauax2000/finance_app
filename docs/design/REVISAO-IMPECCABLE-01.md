> **Este relatório descreve o estado ANTES das correções.** Ele foi produzido por
> duas avaliações independentes (revisão de design e medição determinística) e é
> o registro do diagnóstico, não do resultado.
>
> Os dois P0 e os oito P1 listados aqui **foram corrigidos** na mesma mudança que
> versiona este arquivo. O que ficou de fora, e por quê, está no fim do documento.
> As pendências são de severidade P2 e P3.

---
target: design system do Finance App
total_score: 24
max_score: 40
na_heuristics: 
p0_count: 2
p1_count: 8
timestamp: 2026-08-24T21-46-10Z
slug: src-app-designsystem
---
Method: dual-agent (A: revisão de design · B: detector + medição de navegador)

## Design Health Score — 24/40 (Aceitável, 60%)

| # | Heurística | Nota | Achado-chave |
|---|---|---|---|
| 1 | Visibilidade do estado | 3 | Sem breadcrumb, sem anterior/próximo, sem versão nem data — nada diz se o catálogo ainda descreve o código |
| 2 | Correspondência mundo real | 3 | pt-BR fluente, mas inglês vaza na camada acessível (`sheet`, `dialog`, `carousel`, `spinner`, `command`, `sidebar`, `calendar`) |
| 3 | Controle e liberdade | 3 | Busca vazia é beco sem saída; no telefone o Fechar da folha sobrepõe o campo de busca |
| 4 | Consistência e padrões | 2 | Cinco vocabulários de `tone`; Button 32px vs Input 36px com a doc afirmando o contrário; `PropsTable` em 28 de 87 páginas |
| 5 | Prevenção de erro | 3 | `<Usage>` em 87/87 e roteamento explícito entre vizinhos — mas nenhum guarda-corpo impediu a deriva interna |
| 6 | Reconhecer vs. lembrar | 2 | 59 páginas sem tabela de props; amostras sem rótulo exigem trocar para a aba Código |
| 7 | Flexibilidade e eficiência | 1 | 90 paradas de tabulação antes do conteúdo, sem skip link, sem atalho de busca |
| 8 | Estético e minimalista | 3 | Contido nos dois temas; índice são 87 cartões de peso idêntico |
| 9 | Recuperação de erro | 2 | O único estado de erro (busca vazia) desobedece a regra da própria página `/empty-state` |
| 10 | Ajuda e documentação | 2 | Conteúdo excelente, mas a busca não o alcança; sem "comece aqui" |

## Audit Health Score — 12/20 (Acceptable)

| # | Dimensão | Nota | Achado-chave |
|---|---|---|---|
| 1 | Acessibilidade | 2 | Anel de foco 2,67:1 (claro) / 1,57:1 (escuro); `role="alert"` estático em 87 páginas |
| 2 | Performance | 3 | `will-change` disciplinado (3 usos); sem métrica de runtime — dimensão menos sustentada |
| 3 | Theming | 3 | Sistema de tokens coerente, mas 28 falhas de contraste no escuro contra 6 no claro |
| 4 | Responsividade | 2 | 271/411 (65,9%) alvos abaixo de 44×44 em 375px; overflow em 1 de 24 rotas a 320px |
| 5 | Integridade de implementação | 2 | `tailwind-merge` apagava `text-*-foreground` de todo `Button size="sm"` colorido |

## Veredito de especificidade

Conteúdo de nível excelente dentro de uma arquitetura genérica. O caráter do produto vive inteiramente na prosa — `dinheiro` argumenta daltonismo, `cores` separa income de success, `slider` proíbe a si mesmo para valor em reais, os espécimes são "Fatura aberta" e não lorem ipsum. A casca que entrega isso (87 cartões idênticos, 87 links planos, taxonomia atômica de 2013) seria de qualquer catálogo shadcn.

Evidência determinística a favor: o detector mecânico produziu **1 achado em 160 arquivos**, sem waiver inline e sem config de supressão. Isso é forte contra deriva de design system.

## Problemas prioritários

**[P0] `text-control-sm` apagava a cor do texto de todo Button `sm` colorido** — CORRIGIDO nesta sessão. Regressão minha: ao trocar `text-[0.8rem]` por um token nomeado, o `tailwind-merge` passou a classificá-lo como cor. Medido 1,95:1 contra 9,73:1 do mesmo botão em `default`. Atinge 83 arquivos. Corrigido com `extendTailwindMerge`. `src/lib/utils.ts`

**[P0] A busca do catálogo não enxerga o conteúdo das páginas** — casa só `name`/`slug`/`description`. "excluir", "confirmar", "contraste", "acessibilidade", "tabular" retornam zero. Numa superfície de leitura, buscar é a tarefa primária. `src/app/designsystem/ds-shell.tsx:96-100`

**[P1] A doc do Button afirma um alinhamento que o Button não tem** — Button default 32px, Input/SelectTrigger 36px. A página `/toolbar` exibe a falha na composição canônica. `AGENTS.md` repete a afirmação falsa.

**[P1] `tone` significa cinco coisas em cinco componentes** — neutro é `default` em três, `neutral` em um, inexistente no quinto; `Progress` não tem `expense`, então orçamento estourado só pode ser `destructive`, violando a invariante nº 3 por omissão.

**[P1] Contraste do tema escuro** — `--primary` como texto mede 2,32–3,04:1; `--destructive-foreground` sobre `--destructive` mede 2,77:1; anel de foco não chega a 3:1 em nenhuma camada.

**[P1] 65,9% dos alvos de toque abaixo de 44px** — inclusive os 87 links de navegação do próprio catálogo, a 32px, na página que documenta a regra dos 44px.

**[P1] A mitigação de reduced motion do bottom sheet é anulada pela cascata** — o override vive em `@layer utilities` sem `!important` e perde para o kill global em `@layer base` com `!important`. Spinners e skeletons congelam.

**[P1] Páginas narram migrações que não aconteceram** — `/camadas` diz "os números continuam os mesmos, agora têm nome"; medido: `z-10` 28×, `z-50` 19×, escala nova usada 2×, e existe uma terceira escala em produção (70/80/100) que a página não menciona. `/movimento` documenta tokens com zero uso fora do catálogo.

**[P1] O exemplo canônico da Table viola o padrão Dinheiro** — lista mista de receita e despesa sem `signed`, no cenário de daltonismo que o padrão foi escrito para cobrir.

## O que está funcionando

1. `<Usage>` em 87/87 páginas com roteamento explícito entre vizinhos e critério numérico ("a partir de umas dez opções").
2. `/cores` mede o próprio contraste no pixel real em vez de afirmar, e documenta o erro anterior.
3. Responsividade a 320px real: 23 de 24 rotas com zero overflow, incluindo tabela, Recharts, calendário e carousel.
4. Cobertura de foco completa, `:focus-visible` correto em toda parte, nenhuma armadilha de teclado.
5. `AGENTS.md` é honesto sobre a dívida e diz que as telas não foram migradas.

---

## Pendente depois desta rodada

Corrigidos: os dois P0 e os oito P1. Ficaram, todos P2/P3:

- Sobrancelha de categoria acima do título das páginas — banimento do piso de
  qualidade da Impeccable. Corrigir direito é virar breadcrumb em 87 páginas.
- `role="toolbar"` sem nome acessível nem navegação por setas.
- `aria-haspopup="dialog"` no gatilho do Combobox, cujo popup é um `listbox`.
- `Calendar` sem `locale` padrão (o `DatePicker` passa `ptBR`; o Calendar nu não).
- `StepperItem` esconde o rótulo com `hidden` em vez de `sr-only`.
- Sem `next/image`; nove `<img>` crus sem `loading`/`decoding`.
- Estruturais da revisão de design: taxonomia atômica com balde de sobra,
  índice sem hierarquia de leitura, sem anterior/próximo, `PropsTable` ausente em
  59 das 87 páginas.

**Não medido:** rotas autenticadas (exigem sessão), overlays em estado aberto,
métricas de runtime. A varredura amostrou 24 das 87 rotas para overflow e 20 para
alvo de toque — não é censo.
