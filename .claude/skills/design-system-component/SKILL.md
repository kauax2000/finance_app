---
name: design-system-component
description: Use SEMPRE que for criar um componente novo do design system (em `src/components/ui/`, em qualquer camada — fundação, átomo, molécula, organismo, template) ou redesenhar um que já existe numa rodada ("faça a mesma coisa com o X", "revise o componente Y", "cria um componente de Z"). Faz o componente nascer completo — as versões perguntadas ao dono nos quatro grupos (Redesenho, Peças, Comportamento, App), o checklist da API (escada, estados, esqueleto, telefone, área segura, a11y, movimento, tema), a página do catálogo na forma fixa (Usage, "Na tela" com Eixo/Interruptor, telefone no IphoneFrame, esqueleto, PropsTable) e o registro na mesma mudança (registry, docs-map, `<comp>-versions.test.ts`, AGENTS, histórico). Não use para revisar uma tela do app (isso é a `design-system-guard`) nem para lógica fora de `ui/`.
---

# Componente nasce completo

O guia inteiro está em [`docs/design/COMPONENTE-NOVO.md`](../../../docs/design/COMPONENTE-NOVO.md).
**Leia-o antes de escrever a primeira linha** — ele é curto, e cada item dele
custou uma rodada de revisão.

## O roteiro

1. **Levantamento** (seção 1 do guia): `npm run ds:catalog`, o que as telas
   escrevem à mão no lugar do componente, a camada pelo `LAYER`, o registry do
   shadcn, a seção dos vizinhos no `AGENTS.md`. Corrija na hora toda afirmação
   falsa que achar no código ou na página.
2. **As quatro perguntas** (seção 2): uma `AskUserQuestion` com quatro grupos
   de múltipla escolha — Redesenho, Peças, Comportamento, App —, até quatro
   opções concretas cada, saídas do levantamento. Implemente **tudo** o que for
   escolhido.
3. **A API** (seção 3): escada da casa, `variant` forma e `tone` cor,
   `data-slot`, os cinco estados mais esqueleto/vazio/erro, telefone (44 de
   alvo, o que ele vira), área segura **por variável**, container query quando
   o layout depende da própria largura, nome acessível, foco sem roubar ao
   montar, movimento visível em `@utility` depois de `no-scrollbar`, tokens com
   par `.dark`, classes por extenso, peça de lugar certo **por prop**.
4. **A página** (seção 4): `Usage` → "Na tela" com `Eixo` e `Interruptor` de
   `ds-doc.tsx` → `DocNote`s → "No telefone" no `IphoneFrame` → comportamentos →
   "Esqueleto" → `PropsTable`s. Conteúdo realista; desktop em `ViewportFrame`.
5. **Registro na mesma mudança** (seção 5): `registry.ts`, `npm run
   ds:docs-map`, `<comp>-versions.test.ts` **novo** (nunca sobrescrever teste
   existente), bullet no `AGENTS.md`, rodada no histórico.
6. **App** (se escolhido): agentes em segundo plano com arquivos disjuntos,
   proibidos de tocar `ui/`, `globals.css` e `designsystem/`, sem `git stash`
   nem commit; mudança de caminho segue a regra de jornadas.
7. **Verificação** (seção 6): `tsc`, lint sem aviso novo, `vitest`, o auditor,
   `ds:catalog`, e o navegador na página do catálogo nos dois temas (de volta a
   "sistema"), medindo em vez de olhar. Telas com login não são abertas.
8. **Relatório em português**, e espere: commit só quando o dono disser
   "commit".

## Fronteiras

- `src/components/ui/` e `globals.css` exigem o ok do dono (invariante 6) — as
  escolhas da `AskUserQuestion` contam como ok.
- A `impeccable` decide o design; esta skill decide o que um componente precisa
  ter para nascer inteiro. A `design-system-guard` audita o resultado.
