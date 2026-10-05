# Componente nasce completo

Da rodada 223 à 235 o design system foi revisto componente por componente, e
toda rodada achou o mesmo tipo de lacuna: a versão que as telas escreviam à mão,
o estado que faltava (esperando, vazio, erro), o telefone que ninguém tinha
desenhado, a página do catálogo que afirmava algo falso ou repetia o mesmo
exemplo para cada variante. **Este guia é a rodada antes do nascimento**: o que
se perguntava ao revisar passa a ser perguntado ao criar, para que nenhum
componente precise de uma rodada de revisão só por ter nascido incompleto.

Vale para **toda camada** — fundação, átomo, molécula, organismo, template — e
para o redesenho de um componente que já existe ("faça a mesma coisa com…").
A skill `design-system-component` aplica este guia; o `AGENTS.md` o torna
obrigatório.

---

## 1. Antes de escrever: o levantamento

Nada se presume de memória. Antes da primeira linha:

1. `npm run ds:catalog` — o que já existe. Se uma peça do catálogo já resolve,
   o componente novo **compõe** ela; não reescreve.
2. **Quem vai usar, e o que essas telas escrevem à mão hoje.** `grep` em
   `src/app/` e `src/components/` pela anatomia (as classes, o markup, a conta)
   que o componente vai substituir. Cada coisa escrita à mão em duas telas é uma
   versão ou uma peça; cada `className` que desmonta o componente para caber é
   uma peça que falta.
3. **A camada**, pela régua do `LAYER` em `registry.ts`: átomo é indivisível,
   molécula é feita de átomos, organismo de moléculas, template dispõe a tela.
   O `taxonomy.test.ts` tranca a parte mecânica.
4. **O registry do shadcn antes de código autoral** (invariante 5), com o
   procedimento de fotografar `ui/` antes do `npx shadcn add`.
5. **A seção do componente vizinho no `AGENTS.md`**: a escada, o vidro, a
   marca, o toque e a dissolução já foram decididos uma vez e não se decidem de
   novo.

## 2. As quatro perguntas — sempre, e numa pergunta só

Um componente novo (ou um redesenho) é proposto ao dono numa `AskUserQuestion`
com **quatro grupos de múltipla escolha**, até quatro opções cada, todas
concretas e com o ganho dito. É o formato que as rodadas 223–235 usaram, e é o
que faz o componente nascer com as versões em vez de ganhá-las uma de cada vez.

| Grupo | A pergunta | De onde saem as opções |
| --- | --- | --- |
| **Redesenho** | Como ele se parece e se dispõe | A escada de tamanho, a superfície (`variant`), o telefone compacto, a cascata de entrada, a referência visual da casa (o `Tabs` padrão, a placa flutuante) |
| **Peças** | Que partes ele oferece | O que as telas escrevem à mão em volta dele: cabeçalho, pé, mídia, contagem, meta, ação, link, **esqueleto** |
| **Comportamento** | O que ele faz sozinho | Teclado e foco, o telefone (gaveta, folha, faixa), estado guardado (URL, `localStorage`), rolagem (presa, some, sobe), passo e transição, a11y automática (nome, nível, região) |
| **App** | Quais telas migram junto | As telas do levantamento, em grupos; "nenhuma tela" é sempre uma opção |

O que foi escolhido é implementado **inteiro** — nada fica "para depois" sem
dizer. O que fica de fora é dito no relatório.

## 3. O checklist da API

Todo componente responde a estas perguntas, e a resposta mora no código, não
na memória de quem escreve a tela.

**Nomes e eixos**
- `size` fala a escada da casa — `xs` 24 · `sm` 28 · **`md` 32** · `lg` 36 ·
  `xl` 40 — e mede o **controle**, nunca o contêiner. Não existe `default`.
- `variant` é a **forma** (superfície), `tone` é a **cor** semântica. Não
  existe `ghost`, nem `variant` para cor.
- Toda peça tem `data-slot`; eixos relevantes viram `data-*` (`data-size`,
  `data-variant`) para as peças vizinhas lerem por seletor.
- Peça que precisa de **lugar certo** entra por **prop** (`footer`, `back`,
  `actions`), nunca por `child.type === Peca` (o Fast Refresh troca a função;
  `table-ladder.test.ts` reprova).

**Estados** — os cinco existem desde o nascimento
- repouso, cursor/toque (`hover:` **com** o par `active:`), foco (`ring-3`
  da casa), desabilitado, e **`pending`** quando houver ação assíncrona
  (`aria-busy`, a roda, a trava).
- **Esqueleto** (`<Comp>Skeleton`, no `SkeletonGroup`, com `group={false}`
  dentro de um esqueleto de página), **vazio** (`EmptyState`) e **erro** quando
  o componente carrega dado.

**Telefone**
- O alvo de toque: 40 numa linha de controles, **44** solto (`pointer-coarse:`).
- O que ele **vira** abaixo de `md`: gaveta (`mobile="sheet"`), versão compacta
  (ícone quadrado com o rótulo como nome), faixa. Decidido e demonstrado num
  `IphoneFrame`.
- **Área segura por variável** (`--<comp>-safe-top: env(safe-area-inset-top)`),
  nunca `env()` direto na classe: o `IphoneFrame` do catálogo é um iframe, onde
  `env()` vale zero, e só uma variável ele consegue emular
  (`IPHONE_AREA_SEGURA` em `ds-frame.tsx`).
- Layout que depende da **própria** largura usa **container query**
  (`@container/<comp>`), não `lg:` da janela — senão ele quebra num painel, numa
  prévia ou numa moldura.

**Acessibilidade**
- Nome acessível sempre (`label`, `aria-label` exigido ou título registrado);
  apontar `aria-labelledby` para um `id` que não existe deixa sem nome.
- Nível de título pela estrutura, não pelo estilo.
- Foco: para onde vai ao abrir, ao fechar e ao trocar de passo — e **nunca
  roubar ao montar** (o `StrictMode` roda efeitos duas vezes; compare com o
  valor anterior, não com um "já montou").

**Movimento**
- Tokens `--duration-*` e `--ease-*`; a mola da casa para o que aparece.
- Animação em `@utility` **depois de `no-scrollbar`** (`glass.test.ts`), com o
  `@keyframes` referenciado (o Tailwind descarta o que nenhuma utility usa) e o
  bloco de `prefers-reduced-motion`.
- **Movimento tem de ser visível**: 3px em 280ms passam despercebidos numa
  seção inteira (rodada 233). Meça no meio da animação.

**Tema e marca**
- Só tokens; todo token novo com par no `.dark` (`ds:catalog` cobra).
- Contraste medido nos dois temas, contra **todas** as superfícies onde ele
  pousa.
- Arco-íris nunca sob texto corrido; a marca é uma por tela.

**Código**
- Classe montada em tempo de execução não chega ao CSS: tabelas de classes
  **por extenso**.
- `in-*` e `group-*` compilam com `:where()`; quem decide especificidade é o
  atributo, e às vezes é preciso `!`.

## 4. A página do catálogo — uma forma só

A página é o contrato do componente. Ela **demonstra** e **não afirma nada que
não foi medido**. Ordem fixa:

1. **`Usage`** — quando usar, quando não usar e **quem usa no app hoje**
   (contado, não suposto).
2. **"Na tela"** — **uma** demonstração com todos os eixos e chaves, pelos
   controles de `ds-doc.tsx`: `Eixo` (o valor de uma prop num trilho
   segmentado, com o nome da prop em mono) e `Interruptor` (liga uma peça ou um
   comportamento). Uma seção por variante é o que as revisões apagaram: cinco
   cópias do mesmo exemplo não ensinam o que um trilho ensina. Se a peça tem
   cascata ou animação de montagem, a demo tem um "tocar de novo".
3. **`DocNote`s** com as decisões e as medições que o código carrega.
4. **"No telefone"** — num `IphoneFrame` (nunca uma `div` de 375px: sem
   viewport própria, `sm:` mente). Se o telefone ainda é proposta, a página diz
   que é um primeiro desenho.
5. **As seções de comportamento** que não cabem num interruptor (presa ao rolar,
   aninhada, o passo) — cada uma demonstrada, não descrita.
6. **"Esqueleto"**.
7. **`PropsTable`s**: os eixos (com tipo e padrão) e as peças.

Regras de conteúdo:
- **Conteúdo de produto realista**, com números autorados (`R$ 1.284,60`, não
  `1.234,56`), nunca "Conteúdo da seção" nem retângulo tracejado.
- Layout de desktop numa **`ViewportFrame`** (a largura dele é a da moldura),
  de telefone num **`IphoneFrame`** — nunca o layout de desktop numa caixa
  qualquer.
- A demo usa só o que o componente oferece: se ela precisa de `className` para
  desmontar o componente, falta uma peça.
- O `code` da seção mostra a forma curta que a tela vai escrever.

## 5. Registro, na mesma mudança

- `src/components/ui/<comp>.tsx` (invariante 6: com o ok do dono).
- `registry.ts`: a camada no `LAYER`, a entrada com a descrição de uma linha
  e **todas** as peças exportadas.
- `src/app/designsystem/docs/<comp>.tsx` e `npm run ds:docs-map`.
- **`src/components/ui/<comp>-versions.test.ts`** novo (confira antes que não
  existe; nunca sobrescreva teste existente — editar uma asserção antiga é
  permitido só quando o desenho mudou, e o mínimo): ele tranca as peças, os
  comportamentos e as **proibições** (a grafia à mão que o componente
  substituiu não pode voltar).
- `AGENTS.md`: o bullet do componente em **Component rules**, com a rodada.
- `docs/design/HISTORICO-DESIGN-SYSTEM.md`: a rodada numerada — o
  levantamento, o que foi escolhido, as medições e o que deu errado no caminho.
- Mudança de caminho (rota, destino de botão, passo de fluxo) segue a regra de
  jornadas: `JORNADAS.md`, o Atlas e a republicação.

## 6. Verificação

1. `npx tsc --noEmit`, `npm run lint` (sem aviso novo), `npx vitest run`.
2. `node .claude/skills/design-system-guard/scripts/audit.mjs <arquivos>` e
   `npm run ds:catalog` (os pares de token).
3. **No navegador**, na página do catálogo: todos os eixos e chaves, os dois
   temas (e de volta a "sistema"), o iPhone, o console limpo. Medir, não olhar:
   `getComputedStyle`, `getBoundingClientRect`, o `activeElement`.
4. As telas do app que migraram são verificadas por tipo e auditoria; as que
   pedem login não são abertas (o banco de desenvolvimento é o de produção).

## 7. Armadilhas já pagas

Cada uma custou uma rodada. Não pague de novo.

| Armadilha | O que acontece | Rodada |
| --- | --- | --- |
| `child.type === Peca` | O Fast Refresh troca a função e a peça deixa de ser achada, calada | 231, 233 |
| Classe em template literal | O Tailwind não a gera; o estilo some sem erro | 212 |
| `env(safe-area-*)` direto | Vale zero no iframe do catálogo; a peça nasce sob a ilha | 234, 235 |
| `lg:` num template | Lê a janela; numa prévia de 810px mostra o desktop errado | 235 |
| Efeito de foco com "já montou" | O `StrictMode` o gasta e o foco é roubado ao abrir | 235 |
| Borda transparente com `bg-clip-padding` | 1px da página entre o fundo e o anel; a aresta lê apagada | 234 |
| Animação de 3px | Invisível numa seção inteira | 233 |
| `.page-title` com `text-wrap: balance` | Religa a quebra de quem pediu `truncate` | 232 |
| Provedor que grava cookie | Um ⌘B no catálogo muda a barra do app | 234 |
| Evento de portal | Sobe pela árvore do React até o `<form>`; Enter salva | — |
| Texto sobre arco-íris | Sete matizes não têm um contraste só | 235 |
| Demo que repete a variante | Página longa que ensina menos que um trilho | 231–235 |
