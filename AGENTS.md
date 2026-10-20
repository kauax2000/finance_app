<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Forms and Enter-to-submit

- Use **`Form`** from `@/components/ui/form` for any user-facing flow where fields are saved or confirmed with a primary action.
- **O Enter é a submissão implícita do navegador**: ele aciona o primeiro
  `type="submit"` cujo dono é o formulário. Por isso **todo submit pertence a
  um formulário** — dentro do `<form>` ou ligado por `form=` (o `FormSubmit`
  escreve `form={id}` pelo contexto, que atravessa portal; um rodapé em slot
  irmão, como o `footer=` do assistente de categorias, leva `form="um-id"`
  explícito). Com o submit desabilitado, o Enter não faz nada (a regra
  nativa).
- **Um `<button>` sem `type` é de envio** e, vindo antes, roubaria o Enter: o
  `Button` nasce `type="button"`, e todo `<button>` cru declara o seu.
  `form-submit-owner.test.ts` confere no fonte que o arquivo com submit tem um
  `<form>`/`Form` ou um `form=`, e que nenhum `<button>` cru fica sem `type`.
- O `Form` só acrescenta duas coisas: **⌘/Ctrl+Enter envia de um
  `<textarea>`** pelo mesmo botão padrão (o Enter sozinho quebra a linha) e,
  com `labels="hidden"`, o Enter avança ao campo seguinte.
- **As peças são a forma curta**, e cada uma compõe um átomo: `FormInput` /
  `FormTextarea` (sobre `Field` — rótulo, ajuda e erro já ligados),
  `FormSubmit` (sobre `Button` + `Spinner` — `pending` desabilita, marca
  `aria-busy` e troca o rótulo), `FormCancel` (`tertiary` + `type="button"`, a
  tabela do rodapé embutida), `FormActions` (`inline` ou `sticky`, o rodapé de
  folha; `start` para a ação à esquerda) e `FormError` (o erro que não é de
  campo). **`CustomForm` é `Form` com `layout="none"`** e continua válido.
- `FormField` põe rótulo, ajuda e erro em volta de **qualquer** controle de um
  nó — em `Select` e `Combobox`, que não têm nó na raiz, o `FormControl` vai
  no gatilho. `FormSwitch` é a linha de preferência, inteira clicável.
  `layout="inline"` empilha no telefone.
- **O `FormSubmit` tira o rótulo de espera do verbo** ("Salvar" →
  "Salvando…"): não escreva `pendingLabel` que diga o mesmo, nem um ternário
  "Salvando…". **Um `onSubmit` que devolve `Promise` liga o `pending`
  sozinho.**
- **O formulário valida, e não o balão**: `required`, `type="email"`,
  `minLength`… viram a frase em português no `FormField`, e o foco vai ao
  primeiro `aria-invalid` — também para quem valida à mão com `noValidate`. Um
  controle nativo sem `FormField` volta ao balão do navegador.
- **`Form labels`** é `visible` (o padrão) ou `hidden`: com `hidden` o
  placeholder diz o nome, com "(opcional)", o `<label>` fica para o leitor de
  tela, e **o Enter avança** ao campo seguinte e só envia no último, com o
  `enterkeyhint`. `FormInput icon` e `clearable` (o × que limpa e devolve o
  foco) valem nos dois. Nenhuma tela usa ainda.
- Use **`type="submit"`** only for that primary action. Use **`type="button"`** for cancel, dismiss, toggles, and auxiliary actions.
- Avoid raw **`<form>`** for submit flows unless there is a documented exception.
- Um controle com Enter próprio chama `preventDefault` no `keydown` dele (como
  o cmdk e o `Select` do Radix): com o padrão impedido, nada é enviado.
- **Um popover portalizado não envia o formulário**: o navegador decide pelo
  dono do campo **no DOM**, e a busca de um `FormPickerPopover`, de um
  `Combobox` ou dos editores do `FilterBar` mora no `body`, mesmo que o evento
  suba pela árvore do React até o `Form`.

## Jornadas do app

[`docs/JORNADAS.md`](docs/JORNADAS.md) é o mapa das jornadas: um fluxograma
por jornada, as regras técnicas que decidem cada caminho e as lacunas
conhecidas. A página publicada, o **Atlas de Jornadas**
(https://claude.ai/artifact/1N43LFYP1YSVsWaRMaNTRL), é gerada a partir dele.

**Antes de mexer numa jornada, leia a seção dela.** O fluxograma diz de onde a
pessoa chega, para onde ela vai e quais outras jornadas dependem daquele
caminho. Mudar um destino sem olhar o mapa quebra a ponte de outra jornada.

**Uma mudança de jornada inclui atualizar o documento na mesma mudança.**
Conta como mudança de jornada:

- criar, remover ou renomear rota em `src/app/`, ou mudar um redirecionamento
  (`next.config.ts`, `AuthGuard`, `router.push`/`replace`, `next`);
- mudar para onde um botão, link, notificação ou "Ver origem" leva, incluindo
  os caminhos de sucesso, erro e cancelar;
- mudar parâmetros de URL que abrem telas ou aplicam filtros;
- abrir ou tirar um diálogo, folha ou passo de um fluxo (assistente, confirmação);
- trocar a RPC, a Edge Function ou o trigger que um passo chama;
- mudar a navegação global (`src/config/navigation.ts`,
  `src/config/mobile-navigation.ts`, "+ Adicionar").

Estilo, texto e componente que não mudam caminho não contam.

**O que atualizar, nesta ordem:**

1. `docs/JORNADAS.md`: o fluxograma, a tabela de regras técnicas, o mapa geral
   se a ponte entre jornadas mudou, e a seção 11 se uma lacuna foi corrigida ou
   criada.
2. `docs/atlas/template.html`: a explicação da mesma jornada ("Como funciona",
   resumo, pontos de atenção), as lacunas, os apêndices de rotas e backend, e a
   data e as contagens da capa.
3. `python3 docs/atlas/build.py`, que gera `docs/atlas/atlas-jornadas.html`.
4. Republicar esse arquivo no mesmo URL do Atlas com a ferramenta de Artifact.
   Sem a ferramenta, diga no fim da tarefa que o Atlas ficou desatualizado.

Os diagramas seguem a legenda do topo do `JORNADAS.md` e o tema escuro
(`%%{init}%%` em todo bloco). Ids de nó não podem ser palavras reservadas do
Mermaid (`href` já quebrou um diagrama).

## Design system

O porquê de cada regra (medições, tentativas recusadas) está em
`docs/design/HISTORICO-DESIGN-SYSTEM.md`.

O design system deste projeto tem três partes, e nenhuma delas se presume de
memória:

- **Componentes** em [`src/components/ui/`](src/components/ui) — 82 arquivos
  hoje.
- **Tokens** em [`src/app/globals.css`](src/app/globals.css).
- **Documentação viva** em `/designsystem`, com uma página por componente e por
  padrão. Sempre disponível em desenvolvimento; em produção, atrás de
  `NEXT_PUBLIC_DS_DOCS`.
- **A taxonomia é atomic design canônico**, e mora nos blocos `layer()` do
  `REGISTRY` de [`registry.ts`](src/app/designsystem/registry.ts): Fundações →
  Átomos → Moléculas → Organismos → **Templates**. Ela é **exaustiva**: um
  `entry()` fora de um `layer()` não compila. A regra de cada nível está escrita
  no topo do arquivo, e [`taxonomy.test.ts`](src/app/designsystem/taxonomy.test.ts)
  a tranca. **A régua é a hierarquia que cresce**: átomo é indivisível (anatomia
  interna e especialização não contam), molécula é feita de átomos, organismo
  é feito de moléculas — e quem contém organismo é organismo. O teste tranca a
  parte mecânica (um átomo importa no máximo **um** componente de `ui/`, e ele
  é átomo; uma molécula não importa organismo) e a **ordem alfabética pelo
  nome dentro de cada categoria** — a posição no `REGISTRY` não carrega
  decisão.

**Antes de escrever uma tela, saiba o que já existe:**

```bash
npm run ds:catalog                              # componentes, variants e tokens de hoje
npm run ds:audit -- <arquivo-ou-pasta>          # o que a tela violou
```

Rode os scripts em vez de reler os arquivos do design system a olho — eles são
baratos, não cansam e não erram diferente a cada vez. `ds:catalog` também avisa
quando um token existe em `:root` sem par em `.dark`, que é a origem mais comum
de "isso some no tema escuro".

Não há páginas de "padrão": toda decisão que atravessa telas mora na página de
quem a implementa — o dinheiro em `/designsystem/money-display`, o Enter em
`form`, a paleta de gráfico em `chart` e `colors`, os chips em `badge`, as
datas em `typography`, o toque e a área segura em `touch-safe-area`
(Foundation).

O catálogo fala inglês na navegação: as seções são **Foundations · Atoms ·
Molecules · Organisms · Templates**, e todo nome e toda URL de página
(`/designsystem/colors`, `/designsystem/touch-safe-area`…) está em inglês, como
os componentes. O conteúdo das páginas continua em português.

### Invariantes

1. **Componente não nasce em `src/app/`.** Nada de `function StatCard()` nem
   `cva()` dentro de um arquivo de tela — nenhuma outra rota enxerga isso, e a
   próxima tela reescreve o mesmo componente um pouco diferente. Exceção:
   convenção de rota do Next (`loading.tsx`, `error.tsx`). Todo o resto é
   componente do design system — inclusive o que parece "layout exclusivo
   daquela rota": nesse caso, **pergunte** se vira componente antes de deixar
   markup na tela.
2. **Token-first, zero literais.** Nenhum `#hex`, nenhum `rgb()`, nenhum
   `bg-white` ou `text-gray-600`, nenhum `p-[13px]`. Cor escolhida na tela não
   acompanha o tema escuro nem troca de marca.
3. **`success`/`destructive` não são `income`/`expense`.** Verde de "deu certo" e
   verde de "entrou dinheiro" são coisas diferentes, e os tokens de dinheiro são
   mais saturados de propósito.
4. **A rampa de gráficos é neutra quanto a estado.** `--chart-1` a `--chart-5`
   são cinco matizes que só identificam séries. Quando verde e vermelho
   realmente significam entrada e saída, a série usa `--chart-income` e
   `--chart-expense`.
5. **Registry do shadcn antes de código autoral.** `input`, `card`, `dialog`,
   `table`, `select`, `tabs`, `badge` e companhia já existem no estilo do
   projeto, sobre Radix, consumindo estes tokens.
6. **`src/components/ui/` e `src/app/globals.css` exigem autorização humana.**
   Criar componente, mudar variant, adicionar token, rodar
   `npx shadcn@latest add` — tudo isso atinge todas as telas presentes e futuras.
   Apresente a proposta e espere o ok. Dentro do arquivo da tela, corrija direto.
7. **Esperar não é dissolver.** Se um componente já está declarado na tela e a
   extração depende de ok, ele fica onde está (com as cores corrigidas para
   token). Apagar a declaração e espalhar o JSX inline é pior que a violação
   original.
8. **Componente novo entra em três lugares na mesma mudança:** o arquivo em
   `src/components/ui/`, a entrada em `src/app/designsystem/registry.ts` e a
   página em `src/app/designsystem/docs/`. Depois, `npm run ds:docs-map`. E ele
   nasce **completo** — ver "Componente novo nasce completo", abaixo.

### Componente novo nasce completo

Todo componente novo — em qualquer camada — e todo redesenho segue
[`docs/design/COMPONENTE-NOVO.md`](docs/design/COMPONENTE-NOVO.md), que a skill
`design-system-component` aplica:

1. **Levantamento**: o catálogo, o que as telas escrevem à mão no lugar dele, a
   camada, o shadcn, os vizinhos.
2. **As quatro perguntas** ao dono, numa `AskUserQuestion` de múltipla
   escolha: **Redesenho**, **Peças**, **Comportamento** e **App**. O escolhido
   é implementado inteiro.
3. **O checklist da API**: escada, `variant`/`tone`, `data-slot`, os estados
   com `pending`, esqueleto, vazio e erro, telefone (alvo de 44 e o que ele
   vira), área segura por variável, container query, nome acessível, foco,
   movimento visível, tokens com par escuro.
4. **A página na forma fixa**: `Usage` → "Na tela" com `Eixo` e
   `Interruptores` dentro de `Controles` (de `ds-doc.tsx`; nenhuma página os
   redeclara) — **numa linha acima** do mostrador: os eixos do componente em
   pílulas `floating` à esquerda; o cenário e os interruptores (`Toggle`
   fantasmas soltos) à direita, sem o nome da prop à vista → notas → "No
   telefone" no `IphoneFrame` → comportamentos → "Esqueleto" → `PropsTable`s.
   Conteúdo de produto realista, e nenhuma afirmação que não foi medida.
5. **Registro na mesma mudança**: `registry.ts`, `ds:docs-map`, um
   `<comp>-versions.test.ts` novo, o bullet aqui e a rodada no histórico.

`doc-pages.test.ts` tranca a forma das páginas de componente.

### Revisão de tela — o design system é a regra

O design system é a referência máxima na reconstrução das telas. A tela se
adapta ao design system, nunca o contrário: divergência entre os dois, vence o
design system. Tudo na tela é componente dele.

**Ordem fixa em toda revisão de tela:**

1. `npm run ds:catalog` — o que existe hoje, nunca de memória.
2. Mapear cada elemento da tela para um componente do catálogo, antes de
   escrever JSX.
3. `npm run ds:audit -- <arquivo-da-tela>` e corrigir o que for local.
4. `npx tsc --noEmit && npm run lint && npm run test:unit`.

**Parar e perguntar (AskUserQuestion), sem exceção:**

- **Componente novo** — elemento sem correspondência no catálogo. A pergunta
  traz: nome proposto, onde aparece, `shadcn` registry ou autoral, e as variants
  com o uso real que justifica cada uma. Nada de markup solto "por enquanto".
- **Alteração em componente ou token existente** — variant, prop, estilo,
  token. A pergunta traz o impacto: quais telas consomem.

Sem ok, vale a invariante 7: esperar não é dissolver.

**Espaço para criatividade.** A revisão não é só conformidade: sugira
melhorias que fujam do padrão atual — nas telas e no próprio design system —
com a `impeccable` e a `frontend-design`. Três condições:

1. **Perguntar antes**, marcando como **⚠️ Fora do padrão do DS**: o que muda,
   o ganho de UX ou visual, e o que o design system diz hoje.
2. **A mudança mora no design system, nunca na tela.** Aprovada, ela vira
   componente, variant ou token em `src/components/ui/` ou `globals.css`
   (com registry e página de docs, invariante 8), e só então a tela consome.
   Nenhum estilo "especial" escrito direto na tela.
3. **Recusada**, a tela segue o design system como está.

`src/components/ui/`, `src/app/globals.css`, `src/app/designsystem/` e
`npx shadcn` estão em `permissions.ask` de `.claude/settings.local.json`: o
harness pede confirmação mesmo que a pergunta tenha sido esquecida.

### O CLI do shadcn sobrescreve o que já existe

`npx shadcn@latest add <x>` reescreve as **dependências** do componente (já
apagou o prop `size` do `Input`). Fotografe `src/components/ui/` antes e
devolva ao estado anterior tudo que já existia — o procedimento está em
`.claude/skills/design-system-guard/SKILL.md`.

### Maiúscula inicial do CTA é do sistema

- O rótulo de um botão não depende de quem o escreve: `Button` embrulha texto
  cru num `<span data-slot="button-label">` e aplica `::first-letter` nele —
  `salvar` sai **Salvar**. O embrulho existe porque `::first-letter` **não vale
  em `inline-flex`**. Com `asChild` o embrulho desce um nível e envolve o texto
  do filho, para `<Button asChild><Link>` continuar coberto.
- **Quem passa um elemento em vez de texto assume a caixa alta** — a saída para
  o rótulo raro que precisa de minúscula (`<Button><span>git push</span></Button>`).
  O catálogo não usa essa saída: escreve os rótulos em minúscula e deixa a
  regra agir.
- **A garantia é do `Button`, não do `buttonVariants()`.** Quem precisa de um
  `<a>` ou de uma primitiva com cara de botão escreve `<Button asChild>`. No
  app resta `not-found-shell.tsx` (dois `<Link>`), que é migração mecânica.

### ButtonGroup cola; trilho segmentado é outra coisa

- `ButtonGroup` junta botões numa peça só — uma ação com seu menu, um par de
  navegação: cantos internos achatados e bordas vizinhas sobrepostas em 1px.
- **Não embrulhe um controle segmentado nele**: um `role="group"` entre um
  `role="tablist"` e suas `role="tab"` quebra a posse ARIA. O trilho segmentado
  do app é o `Tabs` (o `TransactionTypeSegment` é `Tabs` sem `TabsContent`), e
  as abas são filhas diretas do `tablist`.
- O grupo manda no degrau, na orientação, no texto e no campo: `size` desce a
  todos os botões pelo `ButtonSizeContext` (o do próprio botão vence);
  `orientation="vertical"` empilha e deita a emenda; `ButtonGroupText` é o
  segmento que não se clica, na altura da fileira; um `Input` ocupa a sobra,
  separado dos botões por 8px, sem emenda, e o grupo leva os botões aos 40 do
  dedo.
- **A ação de um campo mora dentro dele**: `InputGroup` com o
  `InputGroupButton` na ponta.

### Rodapé de diálogo: uma hierarquia só

Todo rodapé de `Dialog` e de `AlertDialog` tem a mesma forma, e ela não se
escolhe por tela:

| Papel | Variant |
| --- | --- |
| Sair sem fazer nada (`AlertDialogCancel`, `DialogClose`) | `tertiary` |
| A ação que o diálogo veio propor | `primary` |
| A mesma ação, quando não tem volta | `destructive` |

Cancelar vem antes da ação, e leva `type="button"`.

No `AlertDialog` a tabela **já vem aplicada**: `AlertDialogCancel` nasce
`tertiary` e `AlertDialogAction` nasce `destructive`, com `type="button"` nos
dois. Só a terceira linha se escreve — `variant="primary"`, para a confirmação
definitiva que não destrói nada. No `Dialog`, `DialogClose` é um passa-tudo e
recebe `asChild` com um `Button variant="tertiary" type="button"` dentro.

### Duas ações lado a lado: a segunda não preenche

A tabela do rodapé de diálogo é a regra de **par de ações**, e vale onde quer
que duas apareçam juntas: cabeçalho de página, barra, cartão, folha.

| Papel | Variant |
| --- | --- |
| A ação que a tela veio propor | `primary` |
| A que a acompanha | **`tertiary`** |

**Dois preenchimentos lado a lado disputam.** `secondary` continua certo
**sozinho** — o botão único de uma folha, o "Entendi" de um aviso —, e quando
o par é de **duas ações do mesmo peso**, sem `primary` nenhum. O nome é
`tertiary`: `variant="ghost"` saiu do tipo, e o compilador acusa quem o
escrever.

### Par de identidade: sem gap

Nome sobre e-mail, título sobre legenda, rótulo sobre valor — sempre que dois
textos empilhados são **o mesmo dado em duas linhas**, quem os separa é a
entrelinha. Não declare `gap` entre eles, nem `gap-1`. `gap` continua certo
entre coisas **diferentes**: um bloco e o seguinte, um campo e o próximo.

### Tokens e theme

- **Semantic colors** live in [`src/app/globals.css`](src/app/globals.css):
  `success`, `warning`, `info`, `income`, `expense`, e os pares `-muted` de cada
  um. Elas servem `Badge`, `Alert`, `StatCard`, `Timeline`, `EmptyState` e
  `AnnouncementBar`. O dinheiro `-muted` fica mais saturado que o estado, senão
  a invariante 3 se inverte. **Quem remexer numa rampa remede em
  `scripts/tone-contrast.mjs`** (piso 4,5; a folga do pior caso é fina). Mexa
  na superfície `-muted`, não na tinta `-muted-foreground`: é ela que carrega o
  contraste.
- **A marca é preta e branca, e a única cor dela é o arco-íris.** `--primary`
  é a **tecla preta** no claro e branca no escuro, `--primary-accent` coincide
  com `--foreground`, e `--ring` e os `-muted` são neutros. O acento é o token
  de degradê `--brand-rainbow` (sete matizes em oito paradas, cada uma um
  token `--brand-<cor>`, luminosidade por tema) com o grão `--brand-grain`.
  **O verde da marca não é o verde de estado**: a lima fica em 130 e
  `success`/`income`/`chart-1` em 152.
- **O arco-íris mora só na marca**: o wordmark e o símbolo (prop `rainbow`,
  preenchido e **parado**), o campo de marca, `Button variant="brand"`,
  `brandColorful` e `brandOutline`, `Badge variant="brand"`, os controles de
  escolha (`Checkbox`, `Radio` e `Switch variant="brand"`, `RadioGroupItem
  variant="brandCard"`), `Alert variant="brand"`, `AnnouncementBar
  variant="brand"`, `Card variant="brand"`, `ThemeToggle variant="brand"`,
  `SearchInput variant="brand"`, `Progress`/`Slider variant="brand"`,
  `Spinner variant="brand"`, o numeral do `EmptyStateCode` e o anel do
  `OnboardingTour`. **Uma peça de marca por tela.**
- **Arco-íris sob texto é proibido** — num gráfico, num fundo de cartão,
  preenchendo um chip: é a invariante 3 violada com sete cores, e sete matizes
  não têm um contraste só. As exceções conscientes, todas com o volume num
  token e nunca nas paradas: o véu da `AnnouncementBar brand`
  (`--brand-flow-alpha` por tema, medido em `scripts/tone-contrast.mjs`) e o
  `brandColorful` (`--button-colorful-opacity`).
- **As famílias de peça de marca**:
  - **Brilho** (`Alert`, `Card`, `Button brand`, `Badge`, `Checkbox`,
    `Radio`, `RadioGroupItem brandCard`, `Switch`, `ThemeToggle`,
    `SearchInput`, `TopBarSearch`): neutro em repouso, e o arco-íris acende num **arco da
    borda** conforme o ponteiro se aproxima. A pintura é a `@utility
    brand-glow` e o ponteiro é `useBrandGlow` (`hooks/use-brand-glow.ts`).
  - **Preenchimento** (`Progress` e `Slider variant="brand"`): o degradê é do
    trilho e a faixa o revela; sem rótulo em cima.
  - **Véu** (`AnnouncementBar variant="brand"`): o arco-íris translúcido
    atrás do texto, mascarado do topo central e deslizando num laço
    (`@utility brand-flow`), no lugar do fio do `sticky`.
  - O **contorno** (degradê em 1px de `border-box`) foi extinto, e
    `brand-contour.test.ts` impede que volte.
- **Regras do brilho** (`brand-contour.test.ts` tranca as que dão para trancar):
  as variáveis dele não são `@property` registradas (quem registrar uma a
  declara `inherits: true`); o pseudo fica em `z` negativo **sob `isolate`**, e
  a **máscara recorta só o anel** (a janela `border-box` menos a `padding-box`,
  `subtract`/`source-out`) — o miolo nunca é pintado, e a peça `brand` não tem
  hover de fundo. **A cor fica parada e a janela é que anda**: um cônico de
  ângulo fixo, com o ângulo no `mask-image` — não mascare o `--brand-rainbow`
  linear nem gire o cônico com o arco. A janela lê `var(--brand-glow-start,
  0)`, com valor inicial declarado. **O volume se mexe em
  `--brand-glow-opacity`, nunca nas paradas.** O ângulo anda pelo `animate` do
  `motion` (o atual lido do DOM, o tween anterior parado, movimento reduzido
  perguntado por `matchMedia`). O listener é o único `pointermove` em
  `document` montado em repouso: só com `variant="brand"` e `(hover: hover)`,
  recalcula na rolagem (`capture: true`) e coalesce num `rAF` por rajada —
  nunca `rAF` em laço. **No telefone e na moldura do iPhone não há brilho**
  (`deDedo`). No `Card` o recorte é `overflow: clip` com
  `overflow-clip-margin: var(--spacing)`. Nos controles de escolha não há halo
  (o `::after` é o alvo de 44px), e o rádio dentro do `brandCard` não veste
  `brand`.
- **`tone` é `never` junto de `brand`** no `Alert`, na `AnnouncementBar` e no
  `Progress`, e quem garante que a superfície neutra vence a tonal é o
  `tailwind-merge` (`cn`): não monte as variantes à mão.
- **O campo não veste marca.** O foco do campo é o anel do sistema (`--ring`,
  por `fieldFocusRingClassName`). Os oito controles de campo não casam
  `--brand-`, `field-brand` nem `brand-rainbow` — `brand-contour.test.ts`
  reprova. A exceção nomeada é o feixe da pílula do `CommandDialog`.
- **O anel de foco do campo é `ring-3` de `--ring` a 30%**, fora dos 3:1 por
  decisão do dono; a borda de 1px fica na cor cheia de `--ring`, e o caminho de
  volta é `/45`. Os outros anéis do sistema ficam a 45% — **medidos contra as
  sete superfícies** (`background`, `card`, `popover`, `muted`, `secondary`,
  `accent`, `sidebar`) nos dois temas, nunca só contra o cartão. Não há script
  que guarde esse número: quem mexer em `--secondary` ou `--accent` remede à
  mão. O anel do campo não transiciona.
- **Pegadinhas de CSS que valem fora da marca**: `<input>`, `<textarea>` e
  `<select>` não pintam pseudo-elemento (e `getComputedStyle` mente sobre
  isso); `@property` novo não registra em aba patchada por HMR; uma transição
  que nasce na mesma mudança de estado não dispara; num contexto de
  empilhamento o fundo pinta antes dos filhos de `z` negativo.
- **`@utility` de marca** (`brand-rainbow`, `brand-field`, `brand-lava`) **moram
  depois de `no-scrollbar`**: `glass.test.ts` fatia o CSS de `@utility
  glass-control` até `@utility no-scrollbar` e reprova utility nova nessa
  faixa (até a palavra `background` num comentário ali dentro). Ver
  `/designsystem/brand`.
- **O degradê não gira, e o giro não volta** (`--brand-angle`,
  `brand-rainbow-live` e companhia saíram). O movimento da marca é a lava
  (`brand-lava`: blobos transitando dentro da caixa, sem pulso). O `beam` do
  `OnboardingCard` é a exceção pedida pelo dono: gira a janela do brilho, não
  o degradê.
- O degradê interpola **`in oklch shorter hue`**, com o sRGB declarado antes e
  o oklch por `@supports` — um `in oklch` não entendido derrubaria o
  `background-image` para `none`. Não mexa no espaçamento das paradas.
- **Os dois tokens do primário existem pelo papel**: `--primary` **preenche**
  (botão, checkbox, switch, faixa do slider) e é medido contra o texto em
  cima; `--primary-accent` é **marca sobre o fundo** — texto, ícone e todo
  traço fino (barra de citação, contorno de chip selecionado, anel do thumb).
  Se a cor vai carregar texto claro por cima, é `--primary`; se ela precisa ser
  enxergada contra a página, é `--primary-accent`. **Traço com alfa é sempre
  acento.** **`text-primary` é proibido** (compila, e por isso a regra existe):
  use `text-primary-accent`.
- **`--secondary-hover`** puxa a base na direção do próprio texto (escurece no
  claro, clareia no escuro); não use `bg-secondary/80`. **`--primary-hover`**
  clareia no claro e escurece no escuro.
- **Identidade**: `--identity-1..6` distinguem pessoas — seis cores chapadas,
  uma família cada (ember, gold, grove, ocean, iris, bloom), em duas versões: a
  **viva** `--identity-N` (tinta escura) e a **suave** `--identity-N-soft` com a
  letra em `--identity-N-ink`. A classe `identity-N` publica as três, e
  `AvatarFallback tint` escolhe; a tela escreve `bg-identity-N`. **Uma família
  por pessoa** é a exceção deliberada à regra de que ninguém é dono de uma cor.
  Contraste por `scripts/identity-contrast.mjs` (piso 4,5). Um `var()` dentro
  de um token do `:root` é substituído lá, não no elemento que o veste: não
  gire cor pelo ângulo do gradiente.
- Os demais tokens: `--skeleton`, `--input-fill`, `--overlay`, a rampa
  `--chart-1..5` mais `--chart-income` / `--chart-expense`, a escala `--z-*`, os
  tokens de movimento `--duration-*` / `--ease-*`, `--scrim` e
  `--scrim-foreground`. Prefira utilitários como `bg-success-muted`,
  `text-expense-muted-foreground`, `z-(--z-sheet)` — **não** adicione classes
  cruas da paleta do Tailwind (`text-green-600`, `bg-rose-100`).
- **O campo de marca**: `@utility brand-field` é o arco-íris ocupando uma
  **região** (o painel das telas de acesso), com grão e vinheta, e ele é um
  **cartão**: cantos arredondados, fio por dentro, margem dada por quem chama.
  **Nenhum texto corrido mora direto sobre ele** — o que se lê vive num `Card`,
  que segue o tema; a exceção é o wordmark branco, por `currentColor`, e a
  pílula do `PresenceCursor` (D2, superfície opaca com tinta medida). **A
  utility não redefine token nenhum** (o override desceria pelo `Card`
  hospedado).
- **O escopo opaco** (`[data-opaque]`, que o `ShowcaseStage` declara): dentro
  dele o vidro vira placa. A variante `reduced-transparency:` ganha o ramo
  `&:is([data-opaque][data-opaque] *)` — a cor sólida de quem veste vale ali,
  como se a pessoa tivesse pedido menos transparência — e a `glass-surface`
  perde o `backdrop-filter`. O atributo repetido sobe a especificidade a
  (0,3,0) e vence a tinta translúcida (`supports-backdrop-filter:bg-popover/60`,
  0,1,0) por construção, e não pela ordem de emissão. É o que o vidro faz
  sobre o arco-íris do campo de marca: nada a borrar, e sete matizes vazando.
- **A seleção de texto** é tingida em `@layer base`: `--primary-muted` atrás,
  `--primary-muted-foreground` na frente, e o par invertido dentro de
  `.brand-field`. É o par **tingido**, nunca `--primary` cheio: a seleção não
  troca a cor do texto que cobre.
- **Camadas**: `--z-base` 0, `--z-raised` 10, `--z-sticky` 20, `--z-banner` 30,
  `--z-header` 40, `--z-modal` 50, `--z-sheet` 70, `--z-popover` 80, `--z-toast`
  100.
  - **Escalar para vencer é sempre sintoma**: se um popover precisa passar de
    `--z-popover`, o que está errado é quem o contém. Empilhamento local
    (`z-0`, `z-10`, `z-[1]` dentro de um componente) não é camada e fica como
    número cru. A exceção consciente é o `OnboardingTour` (`--z-popover` + 1, a
    placa + 2).
  - **Toda superfície ancorada e portalizada vive em `--z-popover`** —
    `Popover`, `DropdownMenu`, `Select`, `Tooltip`, `HoverCard`,
    `ContextMenu`, `Menubar`, e o popover do `DatePicker`. O `NavigationMenu`
    não é portalizado: a raiz fica em `--z-raised`, abaixo do header sticky, e
    o empilhamento interno é `z-10` local.
  - **Superfície não modal fecha ao rolar** a página ou um container ancestral
    (`useCloseOnScroll`); rolar dentro da própria lista não fecha.
- **Raio: a escala mora em Shape & Elevation, e o raio se muda lá.** Todo
  componente veste um degrau desta escala, e só dela:
  - **Cápsula** (`rounded-full`): todo controle, em todo degrau e nos dois
    apontadores — `Button` (sem eixo `shape`; `icon-*` é círculo), o campo de
    uma linha (`fieldSurfaceClassName`: `Input`, `SelectTrigger`,
    `ComboboxTrigger`, `DatePicker`, `InputGroup`, as pontas do `InputOTP`),
    busca, `Toggle`, `ToggleGroup`, `Tabs`, `Menubar`, `NavigationMenu`,
    `Badge`, `TopBar floating`.
  - **Superfície** (`rounded-surface`, 22px): o que contém — `Card`,
    `Accordion contained`, toast, `Table`. E **a placa flutuante** (`menuPanelSurfaceClassName`: `Select`, `DropdownMenu`,
    `ContextMenu`, `Menubar`, `Popover`, `Combobox`, `HoverCard`,
    `NavigationMenu`, também o `DropdownMenu variant="panel"`) e a placa da paleta do `Command`: as listas recuam 8
    (`p-2`; o separador é recuado como no iOS, `mx-2`, sem encostar nas bordas) e a linha mede 36 (`py-2`).
  - **Modal** (`rounded-modal`, 28px): `Dialog`, `AlertDialog`, `Sheet`,
    `Drawer`, `Sidebar floating`, `SplitShell`.
  - **Linha** (`rounded-row`, 12px): a linha de lista selecionável (a linha e
    o subitem da `Sidebar`), o `ColorTile` do `md` ao `2xl` e a amostra do
    `Toggle swatch`, o `Item sm`, o
    item do `Accordion separated`, o `Alert sm`, o `Tooltip md`, o seletor de
    mês e de ano do `Calendar`, e as caixas do app que eram `rounded-lg`.
  - **Linha alta** (`rounded-row-lg`, 16px): a linha selecionável de 44, o
    `Textarea` e o `InputGroup` com bloco ou textarea, o `Item md`/`lg`, o
    cartão do `RadioGroup`, o cartão de escolha do `FieldLabel`, a linha do
    `FormPickerPopover`, o `Collapsible card`, o
    `CardField`, o `Alert md`, e as caixas do app que eram `rounded-xl`.
  - **Concêntrico** (`@utility concentric`): o que está dentro — o raio do pai
    menos o recuo, com mínimo de 6px. Quem contém publica `--radius-parent` e
    `--radius-inset` (a placa flutuante, o `Card`, o `DialogContent`, o
    `SheetContent`, o `DrawerContent`); nunca junto de um `rounded-*` na mesma
    classe. **Fora de `ui/` e do catálogo ninguém o usa**: a caixa do app veste
    o degrau.
  - **A escada pequena** (`rounded-xs`…`lg`): a forma fixa — `Kbd`
    (`rounded-md`), `Checkbox`, `ColorTile xs`, miniatura, `Tooltip sm`
    (`rounded-lg`).
  - **Quando o dono pedir outro raio para um componente**, meça o componente
    contra a escala da página `/designsystem/shape-elevation`, mostre como fica
    em cada degrau que serve (lado a lado, medido), e mude **na escala** —
    apontando para outro degrau, ajustando o valor de um degrau (diga quem mais
    o veste) ou propondo um degrau novo. Nunca `rounded-[18px]` nem um token só
    daquele componente. **Sem squircle** (`corner-shape` não existe no
    iPhone).
  - `radius-roles.test.ts` tranca: o bloco `@theme static` tem só `surface`,
    `modal`, `row` e `row-lg`; nenhum arquivo de `ui/` escreve raio em número
    nem `rounded-xl|2xl`; e o `concentric` fica dentro de `ui/` e do catálogo.
  - **O catálogo também veste a escala**: as molduras do `/designsystem`
    (`DocMeta`, `Preview`, `PropsTable`, `Spec`, `SpecimenPanel` e as caixas
    das páginas) compõem o `Card`; o que contém é `rounded-surface`, o que
    representa controle é cápsula. `concentric` só onde a moldura publica o
    próprio raio e recuo, e só perto da borda (a peça a até ~14px da moldura);
    a 17px ou mais fica no próprio degrau. Na escada pequena só o miúdo (chip
    de código, linha de texto falso, miniatura, ladrilho de 36). Nada de
    `rounded-xl` à mão.
- **Shadows**: `shadow-xs` / `shadow-sm` / `shadow-md` / `shadow-lg` /
  `shadow-xl`, todos com valores próprios no tema escuro.
- **Texto**: além da escala do Tailwind, `text-2xs` (0,6875rem, para contagem
  dentro de controle pequeno) e `text-control-sm` (0,8rem, o texto dos controles
  `size="sm"`).
- **Ícones**: **Heroicons, e só.**
  - **O ESLint é o porteiro**: `no-restricted-imports` reprova `lucide-react`,
    `react-icons`, `@radix-ui/react-icons`, `@tabler`, `phosphor`, `feather`,
    `font-awesome`, `@mui/icons-material` e companhia (a lista mora em
    `scripts/lib/forbidden-icon-packages.mjs`, lida pelo ESLint e pela regra
    G). **O auditor é o relatório**: `npm run ds:audit -- --rule G` acha
    `<svg>` colado à mão e conjunto errado para o tamanho.
  - **A exceção é o que não é ícone**: marca (o logo, a marca escrita, as
    bandeiras de cartão) e primitivo desenhado (a roda do `Spinner`). A lista
    vive em `DRAWN_SVG_FILES`, no auditor; para entrar nela, o arquivo desenha
    uma marca ou um movimento.
  - **O conjunto muda com o tamanho**: `size-6`+ usa
    `@heroicons/react/24/outline`; `size-5` usa o mini (`20/solid`); `size-4`
    e abaixo usam o micro (`16/solid`), o que inclui todo ícone sem classe de
    tamanho. Ícone passado como valor (mapa de ícone, config de navegação) fica
    em `24/outline`, porque quem renderiza decide o corpo — mas com a tabela e o
    `.map()` no mesmo arquivo e o corpo cravado ali, vale a régua do tamanho.
    `components.json` declara `heroicons`.
- **Fonts**: [`src/app/layout.tsx`](src/app/layout.tsx) define `--font-sans`
  (Inter), `--font-display` (Ledger, só em `.page-title`, `.wordmark` e no
  numeral do `EmptyStateCode`), `--font-heading` (aponta para a sans),
  `--font-mono` (Geist Mono).
- **Utilitários**: `.nums` (tabular figures) e `.page-title`.

### Contorno de campo: decisão consciente fora da 1.4.11

O fio do campo (`--input`) quase não existe, e quem identifica o controle é o
**preenchimento** (`bg-input-fill/50` em `field-classes`). **A WCAG 1.4.11 pede
3:1 e o conjunto não cumpre, por decisão do dono.** A página
`/designsystem/colors` mantém a régua acesa no ladrilho `--input`, reprovando
de propósito.

**Quem quiser voltar à conformidade** troca `--input` para `oklch(0.62 0 0)` no
claro e `oklch(0.55 0 0)` no escuro, e mede contra **três** vizinhos: página,
cartão e o próprio fill. `--input-fill` não se mexe: serve `Switch`, `Slider`,
`Progress` e `Kbd`.

As outras divergências conscientes da 1.4.11: o anel de foco do campo (30%) e
o `Progress`/`Slider variant="brand"` no tema claro (o caminho de volta é uma
declaração de `background-color` no trilho).

### Touch devices and hover (Tailwind v4)

- Utilitários como `hover:*`, `dark:hover:*` e `group-hover:*` compilam para
  **`@media (hover: hover)`**, então não valem em telefone (`hover: none`). **Não
  remova `hover:` do código para "otimizar para mobile".**
- **Decisão**: manter a variante `hover` **padrão** do Tailwind v4 (e não
  `(pointer: fine)`), para iPad com trackpad continuar tendo hover.
  [`src/lib/tailwind-hover-policy.test.ts`](src/lib/tailwind-hover-policy.test.ts)
  falha se alguém redefinir a variante para `:hover` puro.
- Em superfícies tocáveis, **some** `active:` ou `group-active:` para o toque ter
  a mesma resposta. O auditor sinaliza isso como regra **H**.
- **O que depende de um cursor parado em cima fica desarmado no toque.** Quatro
  mecanismos, cada um com a sua trava (`tailwind-hover-policy.test.ts` tranca
  os quatro):
  - **`:hover` à mão** (`has-[…:hover]`, `[&>a:hover]`, `in-[th:hover]`) não
    ganha a mídia da variante e gruda no toque. Escreva `[&>a]:hover:` quando
    couber, ou o prefixo `[@media(hover:hover)]:`; em CSS, o `:hover` mora
    dentro de `@media (hover: hover)`. Regra **H2** do auditor.
  - **Ouvinte de "passou por cima"** (`onPointerEnter`, `onMouseEnter`,
    `onMouseMove`) pergunta `ehCursor(e)` (`lib/pointer.ts`). Gesto pensado
    para o dedo (o toque do mapa de calor, o do `AvatarGroup`, o toque longo do
    `HoverCard`) pergunta `pointerType` e fica.
  - **Tecla de atalho desenhada** some com `pointer-coarse:hidden` no ponto em
    que a peça a desenha (`menuShortcutClassName`,
    `searchFieldShortcutClassName`, `CommandShortcut`, o `shortcut` dos menus e
    do `Tooltip`), e **não no `Kbd`**: a tecla citada numa frase é conteúdo.
  - **A moldura do iPhone**: `@custom-variant hover` mantém a mídia
    `(hover: hover)` e exclui `[data-pointer="coarse"] *` (`group-hover:` e
    `peer-hover:` compõem com ela); o `Tooltip` não abre por hover lá dentro e
    o brilho de marca não acende (`deDedo`).
- **O anel de foco é do teclado**: `@custom-variant focus-visible` não acende
  sob `[data-modality="pointer"]`, que o `FocusModality` (`app/focus-modality.tsx`,
  no layout raiz) põe no `<html>` no `pointerdown` e tira no `keydown`. O
  Radix devolve o foco ao gatilho ao fechar menu, popover e diálogo, e o
  Chrome herdava o `:focus-visible`: depois de um clique, o gatilho ficava com
  o anel, parecendo ativo. Não troque `focus-visible:` por `focus:` para
  contornar — `tailwind-hover-policy.test.ts` tranca a variante.
- **`pointer-coarse:` também vale abaixo de 48rem de largura** (rodada 335) e
  **sob `[data-pointer="coarse"]`**
  (`@custom-variant` em `globals.css`), para o `IphoneFrame` do catálogo
  mostrar os alvos do aparelho. No app ninguém escreve o atributo. O que
  pergunta ao toque por JavaScript (`matchMedia`) continua lendo o mouse na
  prévia — por isso o JS do toque lê também `deDedo`.
- **Na moldura a gaveta não é modal, mas se comporta como se fosse**: dentro do
  iframe o `Drawer` não é modal (o `RemoveScroll` travaria a página de fora), e
  quando a falta de modal é da moldura — não de um `modal={false}` de quem
  chama — o `DrawerContent` desenha o véu e tocar nele fecha. No app a gaveta
  continua modal.
- **Dentro da moldura, os portais vão ao `body` da janela do
  `ViewportWindowProvider`** (`Popover`, `Tooltip`, `Drawer`, `Sheet`). Um
  clique na página de **fora** da moldura não fecha o que está aberto dentro
  dela. No app nada muda.

### Required primitives for new screens

- **A barra do topo da janela**: [`TopBar`](src/components/ui/top-bar.tsx) —
  a do app e a do catálogo são ela. Não escreva `<header className="sticky …">`
  nem `backdrop-blur` numa barra: `position`, `size`, `surface` e `gutter`
  cobrem as duas contagens, e a altura já contém o fio e a área segura.
- **A base da barra do topo** é `--top-bar-bottom`, declarada pelo
  `globals.css` no `:root` de cada documento (uma regra por degrau da `TopBar`,
  com a área segura; 0 sem barra). O `Toaster`, a `Toolbar sticky` e os
  cabeçalhos presos assentam abaixo dela; o JS a lê com `topBarBottom(doc)`
  (`lib/top-bar-bottom.ts`). Não meça a barra à mão.
- **A barra de baixo do telefone**: [`BottomBar`](src/components/ui/bottom-bar.tsx)
  — a do app é ela. Não escreva `fixed bottom-0` nem uma grade de abas à mão:
  as abas são `BottomBarTab` (com `iconActive` para o par sólido, ou `media`, um
  nó que ocupa o lugar do glifo e não tem versão sólida: a aba ativa é a tecla
  do marcador — `icon` ou `media` é obrigatório, rodada 346), o gatilho de
  popover é `BottomBarSlot`, e a ação primária é o `BottomBarAction` (ou
  `bottomBarActionClassName` num `Button`), que lê a altura da barra e **não
  declara cor**. O realce viaja sozinho, e a área segura mora dentro da caixa.
- **A página que existe fora da casca do app**:
  [`SplitShell`](src/components/ui/split-shell.tsx) — campo de um lado, coluna
  de conteúdo do outro, sem cartão, empilhando abaixo de **48rem do próprio
  casco** (container query). O conteúdo do campo entra por **slot**; a
  geometria dele é o `SplitShellAside`. Neste app o casco é **persistente**: o
  `SplitShellRoot` mora no layout de `(auth)`, montado pelo `AuthFrame`
  (`components/layout/`) com o painel de marca, e o painel é **o mesmo nó**
  entre as cinco rotas — troca de cena, não remonta. Cada tela de acesso
  escreve só a coluna, o `AuthShell` (um `SplitShellMain`).
  - **`AuthShell`** recebe `scene` (o id que o painel desenha, publicado por
    `useAuthScene`) e `icon` (`mail` | `done` | `expired` | `invite`: a tela
    de status, com o ícone acima do título e as ações empilhadas). **Todo
    estado de todo formulário devolve um `AuthShell` no mesmo lugar da
    árvore**, e o `step` leva o foco ao título. O `AuthStatus` foi extinto:
    nenhum arquivo o importa (`auth-shell.test.ts`).
  - **O frame nunca lê a query**: sem cena publicada, `defaultSceneFor(pathname)`
    — nada de `useSearchParams` no layout.
  - **As cenas são uma tabela só**, `components/auth/showcase/scenes.ts`, e a
    família decide a forma do aparelho: login no navegador, convite no tablet,
    cadastro e recuperação no celular. O palco é o `Showcase`; nenhum arquivo
    de `components/auth/` importa `motion`.
- **Page chrome**: [`PageHeader`](src/components/ui/page-header.tsx) +
  [`PageSection`](src/components/ui/page-section.tsx) +
  [`Container`](src/components/ui/container.tsx). Os três têm `size` (`sm` |
  **`md`** | `lg`) e a `PageSection` tem `variant` — a régua, **em cima**. O
  cabeçalho **não tem régua**: quem o separa do conteúdo é o respiro. O
  `Container` também tem `full` e **não tem `default`** — a escada dele é 448 ·
  **576** · 672 · 1280 · sem teto, e a calha (`gutter`) é **opt-in**, porque
  quem é dono dela neste app é a casca. `PageHeaderTitleRow` recebe `back`,
  `media` e `endAdornment`; `PageSectionHeader` recebe `actions`. Não existe
  `PageSectionContent`. Dentro do app nenhuma tela usa o `PageHeader` hoje: o
  título é só o `<h1>` escondido da barra do topo (ela não mostra o nome da tela;
  no telefone o título visível é a carteira, no centro, com o sino à esquerda e
  a lupa à direita, e o voltar no lugar do sino nas subpáginas — inclusive as
  telas que a página `/me` ("Você") lista: Assinaturas, Contas a pagar, Cartões,
  Membros, Minha conta e Configurações voltam a ela, e uma aba que saiu da barra
  não ganha o voltar (`defaultMobileBackHref`, rodada 346); a tela com filtro
  o publica por `usePageChromeFilter` e ele cola na lupa, numa cápsula — rodada
  334; a **rota declara** o filtro (`mobileHeaderFilterFor`, em
  `config/mobile-navigation.ts`; `inerte`, que não abre nada e não esmaece —
  só o `disabled` publicado pela tela esmaece) para o cabeçalho ter a forma certa no clique,
  antes dos ~700ms do `AdiarMontagem`, e **a publicação da página vence**
  (`filtroDoCabecalho`, `usePageChromeFilterFor`), rodada 349), as listas abrem na `Toolbar` e as telas de conta num
  `PageSection`; só o `PageHeaderBack` serve o voltar do telefone. O mês das
  telas que o têm (Painel, Categorias, detalhe da categoria) mora no cabeçalho do
  telefone, o calendário colado à lupa que abre a grade de meses
  (`useMonthInHeader`, rodada 334); no desktop fica na barra da tela. No detalhe
  da categoria o mês leva o cabeçalho, e o filtro dos lançamentos fica na barra
  (`TransactionsToolbar headerFilter={false}`).
- **Cartão e painel**: [`Card`](src/components/ui/card.tsx) e suas peças —
  `CardToolbar`, `CardHeader`, `CardContent`, `CardFooter`, `CardNote`. O
  painel do app é `<Card padding="none">`; nada de `border-b bg-muted/30`
  escrito à mão para fazer uma barra de topo.
- **Typography**: [`H1`…`H4`, `Lead`, `P`, `Muted`, `Small`, `Caption`](src/components/ui/typography.tsx) instead of ad-hoc `text-3xl font-bold` / arbitrary `text-[10px]`.
- **Empty states**: [`EmptyState`](src/components/ui/empty-state.tsx) (+ title / description / actions slots).
- **Money**: [`MoneyDisplay`](src/components/ui/money-display.tsx) e **`<Input money>`** ([`input.tsx`](src/components/ui/input.tsx)), com a forma curta `<FormInput money>`; formatting helpers in [`src/lib/formatters.ts`](src/lib/formatters.ts) (`currencyBRL`, `signedCurrencyBRL`, `percentBR`).
- **Dates**: [`src/lib/transaction-date.ts`](src/lib/transaction-date.ts) — e.g. `formatDatePtBr`, `formatTransactionDmyPtBr`, `formatDateLongPtBr`, `formatRelativeDayPtBr`, e para agrupar por dia **local** `groupByLocalDay` + `formatDayHeadingPtBr`.
- **Status chips / filters**: as constantes `tagChip*`, exportadas de [`badge.tsx`](src/components/ui/badge.tsx) — a mesma superfície que as tintas `soft` do `Badge` leem.
- **Régua compartilhada em `lib/`** (**nada de `cva` nesses arquivos**: a regra
  A2 do auditor o reprova fora de `components/ui/`):
  - [`menu-classes`](src/lib/menu-classes.ts) — a superfície e a linha dos
    menus;
  - [`scroll-fade-classes`](src/lib/scroll-fade-classes.ts) e
    [`scroll-fade-arrows`](src/lib/scroll-fade-arrows.tsx) — a dissolução de
    borda e a seta de "tem mais";
  - [`field-classes`](src/lib/field-classes.ts) — a superfície de campo que
    `Input`, `Textarea`, `NativeSelect`, `SelectTrigger`, `ComboboxTrigger`,
    `DatePicker`, `FormPickerPopoverTrigger` e, pelas variantes `Group`, o
    `InputGroup` vestem, mais a altura com o piso de toque, o recuo e a
    superfície de gatilho (`fieldControlClassName` / `fieldTriggerClassName`);
  - [`disclosure-classes`](src/lib/disclosure-classes.ts) — a linha do
    `Accordion` e do `Collapsible`;
  - [`command-filter`](src/lib/command-filter.ts) — a busca por substring sem
    acento, graduada, da paleta e do `Combobox`;
  - [`search-field-classes`](src/lib/search-field-classes.ts) — a pílula de
    busca;
  - [`glass-classes`](src/lib/glass-classes.ts) — as **três tintas de vidro**,
    cada uma pelo papel: a **barra** (`barSurfaceClassName`), a **flutuante**
    (`menuPanelTintClassName`, `--popover`; sobre um cartão quem a separa é o
    anel e a sombra) e a **modal** (`modalSurfaceClassName`, mais aberta,
    porque pousa sobre um véu). A seta do `HoverCard` é o único espelho manual
    da receita flutuante, e `glass.test.ts` compara os dois;
  - [`liquid-move`](src/lib/liquid-move.ts) (`viajarLiquido`,
    `TRAJETO_MACIO`) com [`marcador`](src/lib/marcador.ts) e
    [`hooks/use-marcador`](src/hooks/use-marcador.ts) — o marcador que viaja do
    `Tabs`, do `ToggleGroup` e da `BottomBar`;
  - [`overflow`](src/lib/overflow.ts) (`quemSai`) e
    [`overflow-menu`](src/lib/overflow-menu.tsx) (`OverflowMenu`) — quem sai
    para o ⋯ quando a fileira não cabe: as abas saem do fim (o ⋯ "Mais abas"),
    as ações do começo; a aba ativa e a última ação ficam;
  - [`hide-on-scroll`](src/lib/hide-on-scroll.ts) (`proximoEscondido`) — o
    "some ao rolar para baixo" da `Toolbar`, da `TopBar` e da `BottomBar`;
  - [`spring`](src/lib/spring.ts) (`MOLA`; e as do palco do `Showcase`:
    `MOLA_PALCO`, mais lenta e sem passar do alvo, para a moldura que muda de
    forma e o raio em px; `MOLA_PALCO_LAYOUT`, a mesma na projeção de layout,
    com repouso aparado para não esperar a cauda subpixel; `SAIDA`, os 150ms
    de `--duration-fast` em `--ease-in-out`), [`pointer`](src/lib/pointer.ts)
    (`ehCursor`, `deDedo`), [`shortcut`](src/lib/shortcut.ts) (o casar de
    atalho), [`char-count`](src/lib/char-count.tsx) (o contador de caracteres e
    a região viva dele), [`budget-bands`](src/lib/budget-bands.ts),
    [`tile-palette`](src/lib/tile-palette.ts) e
    [`top-bar-bottom`](src/lib/top-bar-bottom.ts).
- **Antes de escrever de novo, reuse**: o título que nomeia um menu é
  [`lib/menu-title.tsx`](src/lib/menu-title.tsx); a contagem animada de um
  número é [`hooks/use-count-up.ts`](src/hooks/use-count-up.ts); o pedido de
  fechar com "Descartar alterações?" é o `usePedidoDeFechar` do `dialog.tsx`; o
  véu de `Dialog`, `AlertDialog`, `Sheet` e `Drawer` é o `overlayClassName` do
  `drawer.tsx` (reexportado pelo `dialog.tsx`); o ícone de cada tom é o
  `TONE_ICON` do `alert.tsx`; juntar refs é `composeRefs` / `useComposedRefs` de
  `radix-ui/internal` (nenhum arquivo escreve o seu), e o estado controlado ou
  não é o `useControllableState` de lá; o efeito de layout é
  `React.useLayoutEffect` direto. Nas cascatas do `globals.css`, a escada de
  atrasos é a `@utility stagger-ladder` (`--stagger-base`, `--stagger-step`,
  `--stagger-cap`), e a subida de 4px é o `@keyframes rise`.
- **Num teste**, ler a fonte, tirar comentário e fatiar CSS é
  [`src/test/fonte.ts`](src/test/fonte.ts) (`lerFonte`, `semComentarios`,
  `arquivosTsx`, `blocoCss`), e as regras de escada (distintos, crescente,
  passo de 4px, classe montada) são [`src/test/regras.ts`](src/test/regras.ts).
  Toda escada de tamanho é uma linha de
  [`escadas.test.ts`](src/components/ui/escadas.test.ts); o que é de uma peça
  mora no `<peça>-versions.test.ts` dela. Nos scripts, tirar comentário é
  `scripts/lib/sem-comentarios.mjs` (o `audit.mjs` e o `catalog.mjs` o
  dividem).
- **Exceção legítima do auditor** (geometria real, contexto sem o CSS do
  sistema) entra nomeada, com o motivo, em `RAW_PRIMITIVE_EXCEPTIONS` /
  `ARBITRARY_VALUE_EXCEPTIONS` do `audit.mjs`.
- **Cor escolhida pela pessoa**: [`ColorTile`](src/components/ui/color-tile.tsx)
  para o ladrilho que carrega `categories.color`, `bills.color` ou a marca de um
  workspace. Se a cor vem do tema e não do banco, é o componente errado — use
  `bg-muted` ou um `Badge`.
  - **A claridade e o croma são do sistema; o matiz é da pessoa**: um valor só
    nos dois temas, em duas versões — `tint="vivid"` (o padrão, `@utility
    tile-vivid`, tinta escura) e `tint="soft"` (`tile-soft`). As utilities
    publicam `--tile-surface` e `--tile-ink`, e o componente pinta com
    `bg-(--tile-surface)`. **A cor não entra crua.** `scripts/tile-contrast.mjs`
    é a guarda (piso 4,5).
  - **A paleta que a pessoa escolhe é a da marca** — `TILE_PALETTE` em
    [`lib/tile-palette.ts`](src/lib/tile-palette.ts), servindo categoria **e**
    carteira. `tileColorFor` dobra na leitura os presets legados, sem escrever
    no banco; o que a pessoa digitou no seletor livre atravessa intacto.
  - A escada: `xs` 24 · `md` 32 · `lg` 36 · `xl` 40 · `2xl` 44 (só o `2xl`
    alcança o alvo de toque; `xs` é o de dentro de uma linha). **O degrau manda
    no corpo do ícone** (`[&>svg]:size-4` vence classe no próprio `svg`).
  - Sem verniz, sem `glass`, sem fio: só a viva e a suave, as mesmas do
    `Avatar` e do `Toggle variant="swatch"`.
- **Alerts / tabs / forms**: [`Alert`](src/components/ui/alert.tsx), [`Tabs`](src/components/ui/tabs.tsx), [`Textarea`](src/components/ui/textarea.tsx), [`ScrollArea`](src/components/ui/scroll-area.tsx), [`Toggle` / `ToggleGroup`](src/components/ui/toggle.tsx), [`Slider`](src/components/ui/slider.tsx), [`Radio` / `RadioGroup`](src/components/ui/radio-group.tsx) (a forma curta é `FormRadioGroup`), [`Pagination`](src/components/ui/pagination.tsx), [`Collapsible`](src/components/ui/collapsible.tsx), [`Breadcrumb`](src/components/ui/breadcrumb.tsx), [`ChartContainer` + chart helpers](src/components/ui/chart.tsx) for Recharts.
- **Campos**: [`Field`](src/components/ui/field.tsx) para rótulo + descrição +
  erro **já ligados**: quem escreve `htmlFor`, `id`, `aria-describedby`,
  `aria-invalid` e `data-invalid` é o `FieldControl`, não a tela.
  [`FieldRow`](src/components/ui/field.tsx) para a linha de dois campos;
  [`InputGroup`](src/components/ui/input-group.tsx) para campo com ícone ou
  botão acoplado; [`Combobox`](src/components/ui/combobox.tsx) quando a pessoa
  **procura um nome** (categoria, carteira), e não quando a lista cresce — os
  31 dias do cartão são `Select`, que salta pela digitação. O `NativeSelect`
  mora em `select.tsx`, e a página dele é a do `Select`.
- **Seletor ancorado num campo**: [`FormPickerPopover`](src/components/ui/form.tsx)
  e as suas faixas — `FormPickerPopoverTrigger` (o gatilho **é** o campo: a
  superfície de `field-classes`, `md` na escada, chevron que gira),
  `FormPickerPopoverSearch` (o `SearchInput` na superfície `plate`),
  `FormPickerPopoverList`, `FormPickerPopoverItem`, `FormPickerPopoverEmpty`
  (a lista vazia; o texto é de quem chama) e `FormPickerPopoverFooter` +
  `FormPickerPopoverFooterAction`. Escolha-o quando a lista é longa e pede
  busca; `Select` quando é curta, `Combobox` quando cabe numa palavra. Mora no
  `form.tsx`, e a página dele é a do `Form`; dentro de um `FormField`, o
  `FormControl` vai no gatilho.
- **Tabela de dados**: [`DataTable`](src/components/ui/data-table.tsx) quando
  há **estado** — ordenar, filtrar, marcar, paginar, agrupar, expandir —, e a
  [`Table`](src/components/ui/table.tsx) sozinha para a tabela de leitura.
  **Nenhuma tela escreve** a conta de ordenação, a seleção com indeterminado,
  a barra de seleção, a paginação de uma lista nem o gêmeo do telefone à mão.
- **Listas e detalhe**: [`Item`](src/components/ui/item.tsx) para linha de lista (e para o que a `Table` vira no telefone), [`DescriptionList`](src/components/ui/description-list.tsx) para pares termo/valor (um número sem rótulo é ambíguo: total, mínimo ou o que falta pagar), [`Timeline`](src/components/ui/timeline.tsx) para histórico, [`Toolbar`](src/components/ui/toolbar.tsx) para a linha de filtros e ações.
- **Tema**: [`ThemeToggle`](src/components/ui/theme-toggle.tsx) — o trilho de
  **três** paradas (sistema, claro, escuro), `radiogroup` e não `switch`, e o
  único controle de tema: não escreva outro com `setTheme`. `size`: `sm` 28,
  **`md` 32**, `lg` 36 (trilho = 4 + 3 paradas, alvo de 44 nos três). `labels`
  (ícone e texto, paradas de largura igual), `variant="brand"` (o brilho no
  trilho) e `reveal` (**ligado por padrão**: a troca abre num círculo a partir
  da parada tocada, pela View Transitions API com `flushSync`; o CSS é escopado
  por `.theme-reveal` no `<html>`; sem API ou com movimento reduzido, troca na
  hora). O app roda com `enableSystem` e `defaultTheme="system"`.
- **Carregando**: [`Skeleton`](src/components/ui/skeleton.tsx) para uma tela
  esperando dado; [`Spinner`](src/components/ui/spinner.tsx) só para ação curta
  sem fim conhecido. O `Spinner` é uma **roda desenhada**, não o
  `ArrowPathIcon` (a seta é o "tentar novamente" do app). `size` fala a escada
  do ícone (`sm` 14 · **`md` 16** · `lg` 20 · `xl` 24 · `2xl` 32), e dentro de
  um `Button` ele não leva margem. Sozinho, leva `label`; numa região que
  espera, é o `SpinnerBlock`, que anuncia e só aparece depois de 300ms
  (`@starting-style`, sem timer). `variant="brand"` é o anel em arco-íris da
  tela de abertura — uma por tela.
- **A troca de tela é no clique, e a página carrega depois.** Toda rota do
  app tem um `loading.tsx` com o esqueleto dela (o de `(app)/loading.tsx` é
  vazio, para quem não tem esqueleto), e o `page.tsx` embrulha o cliente em
  `<AdiarMontagem fallback={<Loading />}>` (`components/layout/adiar-montagem`).
  Sem o primeiro, o Next espera o servidor antes de trocar; sem o segundo, o
  React monta a página inteira com os dados do cache antes de trocar (735 ms
  medidos na de transações). A página de uma pasta com subpáginas mora no
  grupo `(raiz)`, para o esqueleto dela não envolver as filhas.
  `adiar-montagem.test.ts` tranca.
- **Borda de região rolável**: a dissolução é uma **primitiva do sistema**, em
  três camadas — as `@utility` `scroll-fade-y` / `scroll-fade-x` em
  [`globals.css`](src/app/globals.css), a gramática em
  [`lib/scroll-fade-classes`](src/lib/scroll-fade-classes.ts) e o mecanismo em
  [`hooks/use-scroll-fade`](src/hooks/use-scroll-fade.ts). O
  [`ScrollArea`](src/components/ui/scroll-area.tsx) a **consome** pelas
  variantes `fade`, `blur` e `material` (a máscara mora no viewport do Radix),
  para o caso em que ninguém é dono da casca. Quem já tem casca própria compõe
  as classes direto, porque um `<div>` interposto quebraria o contexto do Radix
  ou do cmdk. As regras dela estão em "A dissolução", abaixo.
- **Busca**: [`Command`](src/components/ui/command.tsx) — a paleta de comandos.
  A do catálogo ([`ds-search.tsx`](src/app/designsystem/ds-search.tsx)) abre
  pelo gatilho no meio do cabeçalho, por `⌘K` e por `/`, com `filter` próprio
  (o padrão do cmdk é difuso e erra em português). A do **app**
  ([`app-command-palette.tsx`](src/components/layout/app-command-palette.tsx))
  abre pela lupa da barra do topo e por ⌘K em qualquer tela, que acha na raiz
  telas, ações, transações (no banco: descrição, valor, data, categoria e
  cartão), cartões, categorias, parcelas, assinaturas, contas, membros e
  carteiras, com `shouldFilter: false` — cada grupo chega ranqueado por
  `ranquear` (`lib/app-search`) — mudar o que ela abre é mudança de jornada.
  Digitar `/` escolhe onde buscar (`/transacoes`, `/membros`…): o nome entra
  no campo como escopo, só aquele grupo aparece (até 50 linhas; 20
  transações), e dois Backspaces com o campo vazio voltam à busca em tudo.
  - **A paleta do catálogo abre por camadas**: vazia, mostra as cinco camadas
    com ícone (`category-meta.ts`) e, abaixo, as últimas páginas abertas
    (`useCommandRecents("ds:recentes")`). Enter numa camada pinta o nome dela
    na cor da camada no campo (`CommandScope`, no slot `leading` do
    `CommandInput`) e a busca segue só ali. **Sem ×**: com o campo vazio, o
    primeiro Backspace acende o escopo e o segundo o tira; **Esc sempre
    fecha**. **Uma página recente não se repete no grupo da camada** (duas
    linhas com o mesmo `value` acendem juntas no cmdk). A busca casa só o
    **nome**.
  - **O movimento é da casca**: o `CommandDialog` declara `--command-reveal`,
    que a `@utility command-reveal` da lista lê; `0s` por padrão, então o
    `Combobox` não se mexe. Trocar de vista remonta o miolo por `key`, e um
    evento `input` sintético devolve a paleta ao ocioso. **O ponteiro conta
    como navegação** no modo ocioso (`onPointerMoveCapture`).
    `command-reveal.test.ts` tranca.
  - **Campo, placa e legenda são três superfícies**: a pilha é a variante
    `panel` do `Command` (o `CommandDialog` e a paleta solta a montam): a raiz
    não pinta, a **pílula de busca** em cima (o `CommandInput` lê o
    `CommandStackContext`), a **placa** da lista no meio e o **`CommandDock`**
    (`CommandDockItem`), cápsulas de vidro soltas, irmãs da placa — **sem
    sombra própria nem sombra atrás do conjunto**; quem separa a paleta da
    página é o véu com borrão. As legendas do dock somem no toque. Na pilha a
    linha tem 36 e as peças dela são do componente — `CommandItemIcon`,
    `CommandItemMeta` e `CommandItemArrow` —; a tela não escreve nada disso.
  - **O feixe** (`@utility command-beam`) corre pela base da pílula com o
    campo vazio, **só no `CommandDialog`** — a exceção nomeada ao campo sem
    marca.
  - O campo da paleta é `CommandInput size="lg"` (36); `md` (32) é o padrão.

### Component rules

#### Botões e escada de controle

- **`Button` — a hierarquia é uma escada que desce em peso visual**: `primary`
  preenche de preto (branco no escuro), `secondary` de cinza, `tertiary` não
  preenche nada. **Uma tela tem um `primary` só.**
  - O `primary` é a tecla chapada: no cursor, no toque e em `aria-expanded` vai
    a `--primary-hover`, sem cor. **No cursor acende um fio interno branco**
    (`inset-ring-1` em `--primary-hover-ring`: 35% no claro, cheio no escuro),
    que não mexe na caixa; em repouso ele existe, transparente. O fundo é recortado no `padding-box`
    (`bg-clip-padding`), e o vão da borda desenha a emenda no `ButtonGroup`.
  - `secondary`, `tertiary`, `outline`, `floating` e `destructive` pintam o
    hover **chapado por cima do fundo** (`@utility button-hover`, uma camada de
    `background-image` animada pela `@property --button-hover`); cada peso
    declara só `--button-hover-fill`. **Não pode ser pseudo-elemento**: o
    `::after` é o alvo de toque ampliado e o `::before` o divisor do grupo.
  - **Quem muda o realce por fora muda `--button-hover-fill`, não o fundo**
    (`hover:bg-*` pinta por baixo da camada e some). `tertiary` acende no cursor
    e no toque (o par `active:` está na origem).
  - Fora da escada: `outline` (contorno próprio quando nenhum degrau serve),
    `destructive` (o que não tem volta), `floating` (a pílula que paira: placa
    `--popover`, anel de 1px, `shadow-sm`) e `link` — um traço que entra pela
    esquerda (`@utility link-sweep`, um `::after` do `button-label`), **nunca
    `text-decoration`** (o `::first-letter` partiria o sublinhado).
  - Marca, **um por tela**: `brand` (o CTA neutro com o brilho; o fundo não muda
    no cursor), `brandColorful` (a tecla que floresce cinco paradas da marca no
    cursor, `@utility button-colorful` + `@property --button-bloom`; cor sob o
    rótulo, então **o volume se mexe em `--button-colorful-opacity`, nunca nas
    paradas**) e `brandOutline` (o arco-íris só na borda de baixo e um brilho
    embaixo, num laço de 2s, `@utility brand-rainbow-button`; sempre aceso).
  - `button-primary.test.ts` e `button-touch-response.test.ts` cobram que a
    lava, o brilho do primário e o disco do `button-fill` não voltem; a
    `@utility button-bloom` é só do `Checkbox`.
  - **Não há eixo `shape`** (cápsula; os `icon-*` são círculo). **Não existem
    `variant="default"`, `"ghost"`, `"success"` nem `"warning"`**: estado é do
    `Badge` e do `Alert`. `iconMotion="spin"` gira o ícone do "tentar
    novamente" meia-volta, por `rotate`. Ação principal segue `type="submit"`
    dentro de `CustomForm`.
- **Uma escada de controle, para todos**: `xs` 24, `sm` 28, `md` 32, **`lg`
  36 (o padrão no desktop)**, `xl` 40, com os mesmos nomes no `Button`,
  `Input`, `SelectTrigger`, `NativeSelect`, `ComboboxTrigger`, `DatePicker`,
  `SearchInput`, `Toggle`, `Toolbar`, `FilterBar` e `TabsList` — botão ao lado
  de campo alinha sem ninguém dizer `size`. O `ToggleGroup` fica em `md`: o
  item de 32 mais o recuo da moldura dá os mesmos 36. Nenhum controle usa um
  nome para outra altura, e **a escada mede o controle, nunca o contêiner**.
- **No dedo a escada de campo colapsa no piso de 44** (`pointer-coarse:h-11`),
  o alvo de toque do iOS (rodada 332; era 40), e o `Button` `md`/`lg`/`xl` (e
  `icon-md`/`icon-lg`/`icon-xl`) sobe a 44 também, pela variável `--button-h` —
  um `h-*`/`size-*` de quem chama vence nos dois apontadores; `xs` e `sm` moram
  dentro de outro controle e ficam. O `xl` dos campos e da busca também leva o
  piso. **O que mora numa bandeja** (as abas do `Tabs`, os itens segmentados do
  `ToggleGroup`: 36 dentro de uma moldura de 44) alcança os 44 por um `::after`
  de altura fixa (`h-11`), centrado, que cobre o recuo sem mudar o desenho —
  "aba + recuo" dava 42, porque o `::after` mede por dentro da borda. A pergunta é sobre o
  **apontador e a largura**: `pointer-coarse:` vale com o dedo **e abaixo de 48rem**
  (o `md`), com mouse ou sem — a janela do tamanho de um telefone tem os alvos do
  telefone (rodada 335). Acima de 48rem, no mouse, nada muda. Nos botões
  `icon-md`/`icon-lg`/`icon-xl` o ícone sem tamanho vai a 20 no toque (o círculo
  de 44 com o ícone de 20, como o `TopBarAction`). A escada e o recuo moram em
  `fieldControlHeightClassName` e `fieldControlPaddingClassName`;
  `input-versions.test.ts` **proíbe os oito controles de reescrever a altura à
  mão**, e `escadas.test.ts` tranca a escada.
- **A coluna `icon-*`** espelha a caixa da de texto (`icon-xs` 24 … `icon-xl`
  40), não o tipo: quem põe texto num `icon-*` (só a `Pagination`) declara o
  corpo. Botão de ícone ao lado de botão de texto usa o par. `xs` e `icon-xs`
  são para dentro de outro controle; a `Pagination` é a exceção nomeada, com
  `xs` por padrão.
- **Não existe `size="default"`** (`Button`, `Input`, `SelectTrigger`,
  `NativeSelect`, `Switch`) nem `size="icon"`: os substitutos são `lg` e
  `icon-lg`.

#### Cartão, aviso, estado

- **`Badge`**: `variant` (`soft`, `outline`, `contrast` — a pílula grave, o
  `tone` só no ponto —, `brand`, uma por tela) + `tone` (oito, com `info`) +
  `size` (`xs` | `sm` | `md`). As classes de chip moram no `badge.tsx`. **O
  respiro e o corpo do ícone são do componente** (nada de `gap`, `mr-1` ou
  `size-*` no ícone; sempre `16/solid`). `BadgeDot` é o ponto de estado (`pulse`
  para o que acontece agora, cor em `--badge-dot`), `animate-ping` e **não**
  `animate-pulse`.
- **O fio de uma caixa compõe sobre o que está fora, como a barra lateral**
  (rodada 288): toda caixa com `border` e fundo de cartão leva
  `bg-clip-padding`. No escuro o `--border` é branco a 10%, e com o fundo
  pintando por baixo dele o fio somava ao `--card` (~0,28, claro demais); a
  lateral desenha o anel por fora, sobre a página (~0,23). No claro o fio é
  chapado e nada muda. `card-versions.test.ts` reprova `border` + `bg-card` sem
  o recorte em `src/components`. O `Button outline` segue a mesma régua: o fio é o
  `--border` também no escuro (era o `--input`).
- **`Card`**: `variant` é a superfície (`outline` — o padrão —, `elevated`,
  `muted`, `plain`, `dashed` — o vazio ou o "adicionar" —, `brand`, uma por
  tela); `padding` é o ritmo (`none` | `sm` | **`md`** | `lg`). **`padding="none"`
  é o painel** (sob ele o `CardContent` não precisa de `p-0`). **Não existem
  `size` nem `tone`**: aviso é `Alert`, tom de número é `StatCard`.
  - As tiras `CardToolbar` (`variant` `label` | `title`), `CardFooter` e
    `CardNote` sangram até a borda e o casco recolhe o respiro: não escreva
    `rounded-t-xl`, `pt-0` nem `border-b bg-muted/30`. `CardHeader` não é a
    barra.
  - **Cartão clicável é o link**: `interactive` + `asChild` com um `<Link>`.
    Com ações dentro, é `CardLink` (o link esticado; o casco ergue os botões a
    `z-10`).
  - `inactive` (não escreva `opacity-[0.82]`), `selected`,
    `orientation="horizontal"` (`CardMedia` + `CardBody`), `CardHeader media`,
    `CardTitle size` (não escreva `text-base`), `CardField`, `CardMessage`
    (`destructive` é `role="alert"`), `CardSkeleton`. `card-versions.test.ts`
    tranca.
- **`StatCard`**: `StatCardHeader` (`StatCardLabel` em sobrancelha,
  `StatCardIcon` num ladrilho tonal), o número, `StatCardFooter`. **O tom mora
  no detalhe, nunca na superfície** (`--stat-tile`, `--stat-tile-ink`,
  `--stat-figure`, `--stat-chart`). `size` `sm` · **`md`** · `lg`;
  `layout="horizontal"`. **`StatCardValue value`** escreve e conta o número
  (com `children`, o `MoneyDisplay` herda o corpo: não escreva `size` nele);
  **`StatCardDelta current previous better`** calcula variação, seta e tom de
  estado (`statCardDelta()`). Peças: `StatCardChart`, `StatCardProgress`,
  `StatCardRange`, `StatCardSplit`, `StatCardGroup` (`separate` | `joined`).
  **Nenhuma tela declara `KpiCard`, `DeltaBadge` nem a conta de variação.**
- **`Alert`**: `tone` é a cor (`default` | `info` | `success` | `warning` |
  `destructive`) — **não existe `variant` para a cor**; `variant` é a forma
  (`soft`, o padrão, ou `brand`); `size` é o corpo (`sm` | **`md`**). **`brand`
  não aceita `tone` nem `size="sm"`.**
  - O raio desce com o `size` (`md` linha alta, `sm` linha) e o ícone se
    desloca por degrau. **O tom chega ao texto**: não carimbe `text-foreground`
    nem `text-muted-foreground` em `AlertTitle`/`AlertDescription`.
  - **Nenhuma chamada escreve o `svg` como filho**: cada tom traz o seu
    (`TONE_ICON`), `icon` troca e `icon={false}` tira — `alert-icon.test.ts`.
  - **A ação é o `AlertAction`** (tira tinta e realce de `currentColor`): não
    escreva `border-destructive/40 hover:bg-destructive/10`. `AlertActions
    placement="inline"` põe a ação à direita com o alerta a partir de 28rem (os
    filhos leem `--alert-text-col`). `onDismiss` é o ×. Entra esmaecendo.
- **`AnnouncementBar`**: no telefone do app ela não aparece — o aviso de offline
  (`OfflinePill`) é uma pílula de vidro no tom de aviso, no `accessory` da
  `BottomBar` (rodadas 347–348), porque uma faixa presa sob o cabeçalho de borrão
  corta a tela em duas; a faixa (`OfflineBanner`) fica no desktop. `variant` `soft` | `brand` (o véu), `tone` (`never` com
  `brand`), o ícone com a API do `Alert` (sem `svg` filho), `position`
  (`static` | `sticky` | `fixed` — o `fixed` traz camada e fio; o `relative` do
  véu mora no `static`) e `align="center"`. Os botões tiram o realce de
  `currentColor`.
- **`EmptyState` — a forma diz a situação**: primeiro uso é `EmptyStateGhost`
  (fantasmas neutros, **sem arco-íris**, props de **forma**: `leading`,
  `trailing`); filtro ou lista vazia é `EmptyStateIcon variant="stack"`; boa
  notícia é `variant="done"`; não encontrado é `size="page"` + `EmptyStateCode`
  (o numeral na Ledger com o arco-íris, `aria-hidden` — **o arco-íris mora só
  ali**), e o erro é o mesmo com "Ops!". No `page` o título nasce `<h1>` (não o
  passe por `asChild` num server component). `layout="inline"` é o vazio de
  formulário. **`EmptyStateActions` passa o degrau aos botões**: nenhum declara
  `size` (`sm` e `md` passam 32, `lg` e `page` passam 40). Animação em `@utility`, nunca em `animate-[…]`.
- **`Skeleton`**: `shape` (`block`, `text`, `circle`, `tile`, `pill`) e `size`;
  `SkeletonText lines`. **Um movimento só, o pulso** (a `wave` do
  `ChartSkeleton` é a exceção). **O bloco que espera é o `SkeletonGroup`**
  (`role="status"`, `aria-busy`, `label`; `delay` esconde os primeiros 300ms);
  os esqueletos de página o vestem, e o de uma peça dentro deles leva
  `group={false}`.
- **`Separator`**: `tone` (`default` | `soft`), `variant` (`solid`, `dashed`,
  `fade`), `bleed` (atravessa `--card-px`, `--dialog-px` ou
  `--separator-bleed`) e `children` (o rótulo do meio). **Nenhuma tela desenha a
  régua à mão** (`<div role="separator">`), pesa por alfa (`bg-border/60`) nem
  sangra com `-mx-*` e `w-[calc(…)]` — `separator.test.ts`.
- **`Progress` — entregue os cortes, não o tom**: `bands={[aviso, perigo]}`
  deriva a cor e o limiar; `tone` é para o que não tem escada de risco; `size`
  `sm` | `md`. **`tone`, `bands` e `variant="brand"` são excludentes.** Os
  cortes do app moram em [`lib/budget-bands`](src/lib/budget-bands.ts)
  (orçamento `[85, 100]`, limite de cartão `[30, 70]`). **O excesso vira uma
  pastilha fora do trilho**, que vale sempre o total. Peças `ProgressHeader` /
  `ProgressLabel` / `ProgressValue` / `ProgressFooter` (pelas props `header` e
  `footer`), `segments`, `zones`, `ProgressRing`. `brand` é para progresso sem
  limiar (o degradê é do trilho). Passos com data são `Timeline`; um total
  dividido, `ChartSplit`.
- **`Timeline`**: o fim é CSS (`:last-child`; `isLast={false}` é a exceção),
  nada é clonado, **não há vidro**. `state` (`done`, `current`, `upcoming`,
  `skipped`), `layout="split"` + `opposite`, `density="compact"`, `reveal`,
  `live`, `TimelineGroup sticky` (um dia por contêiner; dentro de cartão,
  `[--tl-surface:var(--color-card)]`), `progress="scroll"`, e as peças
  `TimelineHeader`, `TimelineActions`, `TimelineCard`, `TimelineCollapsed`,
  `TimelineDetail`, `TimelineLink`, `TimelineSkeleton`, `TimelineTime`.
  **Nenhuma tela desenha poço, ponto ou fio de histórico à mão.**
- **`Tooltip`**: a confirmação é `confirmation={copiado ? "…" : null}`, ligada
  pelo **resultado** (o Radix fecha a dica no `pointerdown`). Um filho
  `disabled` é embrulhado sozinho num `span` focável. `shortcut`,
  `variant="contrast"`, `size` `sm` (o padrão) | `md`.
- **`Avatar`**: Radix-based with `size`; keep `data-slot` for tests and form
  deferrals. `AvatarImage` ou `AvatarFallback` (`tint` `vivid` | `soft`). Sem
  `variant` de superfície, vidro ou anel, e **só o círculo**. A cor vem de
  `identityToneFor`, nunca de classe montada.
- **`AvatarGroup`**: a escada do `Avatar`, o anel na cor da superfície
  (`--avatar-group-ring`, senão `--avatar-group-surface`), uma dica só que
  viaja (`aria-hidden`). Os filhos são `AvatarGroupItem` — **nenhuma tela monta
  `identityToneFor` + `getInitials` + `AvatarFallback` para uma pilha**. `max`
  (o +N abre a lista), `add`, `summary`, `spread`, `stacking`, `tooltip`,
  `tint`. Uma parada de Tab. `avatar-group-versions.test.ts`.

#### Superfícies modais

- **`Dialog`**: `size` (`sm` 384 | **`md` 448** | `lg` 512 | `xl` 576 |
  `full`) e `layout` (`auto` | `fixed`, com o corpo em `DialogBody`). **Não
  escreva `min-h-0 flex-1 overflow-y-auto` à mão.** A rampa do `DialogBody`
  é `--dialog-body-fade-h` (24px; o painel de notificações declara 48), e a de
  baixo pode ser outra, `--dialog-body-fade-end-h` (por padrão, a mesma).
  - **`<Dialog surface="auto">`** é diálogo no desktop e gaveta abaixo de
    768px. **Não escreva `if (isMobile)` trocando `Dialog` por `Sheet`.**
  - `pending` trava Esc, véu, ×, `DialogClose` e arraste; `dirty` +
    `confirmDiscard` pergunta "Descartar alterações?" (fechar por código não
    pergunta). **Todo pedido de fechar passa por `usePedidoDeFechar`.**
  - **Um link de dentro que abre uma tela fecha antes**: o `DialogContent` e o
    `SheetContent` pegam o clique simples num link interno (também de um
    seletor portalizado dentro deles), fecham o seletor e o diálogo com o
    próprio gesto, passando pelo pedido de fechar (com rascunho, pergunta;
    "Continuar editando" esquece o link), e a tela abre quando o casco sai do
    DOM (`useLinkQueFecha`, `NavegarFechandoContext`; a raiz mais de fora
    responde). Nova aba, modificadoras, `download` e outro domínio seguem o
    navegador. Não escreva `onClick` que fecha o diálogo num link.
  - `DialogSteps`, `DialogMedia`, `DialogFooter start`. Os formulários usam
    `FormCancel` e `FormSubmit`.
  - O cabeçalho é alinhado à esquerda e sem `gap`; o × não reserva lugar (o
    título desvia dele só quando ele existe). O rodapé sangra por
    `--dialog-bleed` e **empilha ao contrário** (`flex-col-reverse`; quem
    declara `flex-col` o faz de propósito); no dedo os botões dele sobem a 44
    sozinhos. `DialogContent` mantém o `showCloseButton`.
  - Abre como a paleta: fade e `zoom-in-95` na mola, fecha curto em
    `--ease-out` (rodada 293); o conteúdo chega aos poucos, peça a peça, do
    desfoque como as linhas da paleta (`dialog-reveal`: cabeçalho, linhas do
    corpo, rodapé).
    Nascer do ponto do clique saiu (aberto pela barra lateral, surgia da
    esquerda de uma placa centralizada).
    **A altura anda na mola**: quando o conteúdo muda (trocar Despesa,
    Parcelada e Receita), a placa vai da altura antiga à nova em
    `--duration-spring`/`--ease-spring`, centrada, recortando o que transborda
    (`useAlturaAnimada`, `hooks/use-altura-animada.ts`; rodada 327). Só no
    desktop; a gaveta é do `vaul`.
    `dialog-versions.test.ts`.
- **`AlertDialog`** mora na camada da folha (`--z-sheet`, véu e placa), para a
  confirmação aberta de dentro de uma folha ficar por cima dela.
- **`AlertDialog`** mede pela régua do `Dialog` e veste a cromagem dele; não
  oferece `layout="fixed"`. `AlertDialogAction` e `AlertDialogCancel` são
  `Button` de verdade: **nunca `className={buttonVariants(...)}` nem botão
  pintado à mão**. `pending` na raiz trava os dois botões, mostra o `Spinner` e
  **segura o Esc** — **nenhuma tela escreve `deleting ? "Excluindo…" : …` nem
  `disabled` nos botões**. `AlertDialogMedia` (o ícone na linha do título),
  `AlertDialogList` (sem `<ul list-disc>` à mão), `AlertDialogError`,
  `AlertDialogConfirmInput`.
- **Superfície ancorada é uma só, e é o `Sheet`**: `side`, `variant`
  (`floating` — o padrão — ou `flush`, que as folhas do app pedem) e `size`
  (`sm` 384 · `md` 448 · `lg` 512 · `full`; topo e base, `none`). O material é
  o vidro modal do `Dialog` (`modalSurfaceClassName`), pela régua — era a placa
  chapada `--popover` até 2026-10-18.
  - **No telefone a folha é o `Drawer`** (a raiz e o `DrawerContent` dele, com
    o `data-slot` `sheet-content`); lá `side`, `variant` e `size` não valem, a
    gaveta alta é `fillMobileViewport` e `snapPoints` são os degraus. A
    superfície é decidida ao abrir. **Não escreva `isMobile` para trocar de
    componente.** `surface="panel"` (o painel sempre) é só da navegação; para
    forçar a gaveta existe o `Drawer`.
  - `pending`, `dirty` e `confirmDiscard` são os do `Dialog`. `modal={false}` é o
    painel ao lado. **Um contexto de aninhamento só**: no desktop a folha de
    baixo recua (`data-coberta`); na gaveta empilha o `vaul`, e `Drawer` e
    `Sheet` se empilham entre si. A cascata `sheet-reveal` é só do painel do
    desktop. `SheetContent resizable` arrasta a largura.
  - **`Sheet` é só a superfície**: não existem `SheetHeader`, `SheetFooter`,
    `SheetTitle` nem `SheetDescription` — a cromagem é a do `Dialog`
    (`Sheet` é `Dialog.Root`), e o `SheetContent` declara o mesmo contrato
    (`--dialog-px` 16, `--dialog-bleed`, `--dialog-close`, `data-layout`).
  - **A folha não injeta o ×** (não há `showCloseButton`): é o
    `DialogCloseButton`, último filho do `SheetContent`, ou `placement="inline"`
    no `endAdornment` de um `DialogHeaderRow`.
  - `Dialog`, `Sheet` e o `vaul` são a mesma primitiva
    (`@radix-ui/react-dialog`), **numa instância só** em `node_modules`: olhe
    isso antes de mexer em dependência.
- **`Drawer`** é a gaveta que não muda com a largura (o gesto é a afordância).
  `direction` só `bottom` | `top`. A superfície é o vidro modal
  (`modalSurfaceClassName`) em `--z-sheet`.
  - **A alça é da superfície** (`DrawerPrimitive.Handle`, o `DragHandle`): uma
    tela nunca a escreve. Não existem `DrawerHeader`, `DrawerTitle`,
    `DrawerDescription` nem `DrawerFooter`.
  - `DrawerContent` `variant` (`flush`, o padrão e **toda gaveta do telefone**;
    `inset`), `size` (`full` | `md` | `lg`) e `fill`.
  - `DrawerActions` + `DrawerAction` + `DrawerCancel` é o action sheet. A conta
    do telefone **não** é gaveta nem menu: a aba "Você" (o avatar no lugar do
    glifo) abre a página `/me`, com as telas da carteira e da conta em dois
    grupos de linhas (o `MobileAccountMenu` e o painel que brotava da aba "Mais"
    saíram na rodada 346); o tema mora em Configurações e o sair em Minha
    conta. O "+ Adicionar" não tem menu: abre
    direto o formulário de lançamento (com Despesa), que no telefone é a
    gaveta.
  - **`pending` desliga o `dismissible` e barra o pedido de fechar.** Sem
    `DialogBody`, o filho do meio rola (`data-drawer-meio`). Gaveta dentro de
    gaveta vira `NestedRoot` sozinha. `drawer-versions.test.ts`.
  - **Gaveta no app sem `scaleBackground`**: ele encolhe a página com uma
    transformação, e a `BottomBar` (`fixed` dentro dela) sai da tela e
    reaparece com atraso quando a gaveta desce.
- **Overlays**: `Dialog` / `Sheet` / `AlertDialog` / `Drawer` use `bg-overlay`
  pelo `overlayClassName` (not hardcoded `bg-black/10`).

#### Superfícies ancoradas

- **`Popover` é um `role="dialog"` e precisa de nome**: `PopoverTitle` e
  `PopoverDescription` se registram, ou o prop `label` (em desenvolvimento,
  sem nome ele avisa no console). `size` `auto` · `sm` 224 · **`md` 288** ·
  `lg` 352 · `trigger` — **nenhuma tela escreve `w-auto`, `w-max`,
  `w-[min(…)]` nem `w-[var(--radix-popover-trigger-width)]`**; `padding`
  `default` | `none`. `PopoverArrow`, `PopoverHeader closeButton` (sem `gap`),
  `PopoverConfirm` (o que não tem volta é `AlertDialog`), `mobile="sheet"` (no
  lugar de `modal={isMobile}` à mão). O teto e o `collisionPadding` vêm de
  fábrica.
- **A casca não rola; quem rola é o viewport** (`popover-viewport`,
  `hover-card-viewport`). A seta do Radix é um `<span>` absoluto fora da caixa,
  contido pela casca (`relative`, e o `backdrop-filter` da placa a faz bloco de
  contenção mesmo estática): com a casca rolando, a seta caía no próprio recorte
  — invisível, e 6px de rolagem em repouso. O viewport **não pode** ganhar
  `relative`, `transform` nem `filter`, senão volta a conter a seta. O recuo é
  dele (`--popover-pad`) e o `gap` ele herda: um `gap-*` no `className`
  continua valendo, mas um `p-*` vai para a casca, fora do rolável — **recuo
  fora da escada se escreve num filho**. Ninguém mais precisa de
  `overflow-visible` para mostrar a seta (o tour escrevia, e perdia o teto).
- **O seletor devolve o foco ao fechar e não rouba ao abrir**; `modal={isMobile}`
  vem de fábrica na raiz dele. Toda busca é o `SearchInput` (o × do WebKit é
  suprimido).
- **`HoverCard`**: teto, rolagem (no viewport, como o `Popover`) e `collisionPadding` de fábrica; `size` `sm` |
  **`md`** | `lg`, `padding`; faixas `HoverCardHeader` (`media`,
  `endAdornment`), `HoverCardTitle`, `HoverCardDescription`, `HoverCardBody`
  (não rola), `HoverCardFooter`, `HoverCardLink`, `HoverCardArrow`. As tiras
  não levam `shrink-0`. `openDelay` 400, `closeDelay` 200; **o gatilho precisa
  ser focável** (`HoverCardTrigger variant="inline"`). `pending`,
  `HoverCardGroup`, e no toque segurar 500ms abre. **O vocabulário de estado sai
  do produto**: ciclo aberto é **`Aberta`**, verde (`tagChipSuccess`);
  `Fechada` âmbar, `Anterior` vermelho.
- **`DropdownMenu`, `ContextMenu` e `Menubar` são a mesma superfície**
  ([`lib/menu-classes`](src/lib/menu-classes.ts)).
  - A linha **acende esmaecendo** (`menuItemFadeClassName`); **o realce que
    viaja entre linhas e o disco do `button-fill` não voltam** —
    `menu-fade.test.ts`. O realce é **o da barra lateral** nos menus,
    `Command`, `Select`, `NavigationMenu`, folha de ações e seletor de mês:
    `bg-sidebar-accent/50` na passagem (foco, cursor, a linha selecionada do
    `Command`) e `bg-sidebar-accent` cheio ao pressionar e com o item aberto
    (rodada 325; era a tinta `bg-foreground/9`). `Item` e `Toggle` seguem
    `bg-muted` — `lib/row-tint.test.ts`.
  - A linha mede 36 e cresce a 44 no **apontador** grosso
    (`pointer-coarse:min-h-11`) — e no toque o texto vai a 16, o ícone a 20, o
    rótulo de seção a 14, o ladrilho da opção com mídia a 32 e o teto a 384
    (a escala nativa do header, rodada 330), e **duas linhas ficam a 4px** (`MENU_ROW_GAP`, no
    viewport do `DropdownMenu`: entre comandos, grupos e a linha `data-menu-row`). **Rádio é ponto, caixa é tique** — a exceção é
    `DropdownMenuRadioItem indicator="media"`, quando a mídia da linha é a
    identidade da opção (o ladrilho da carteira): a escolhida ganha o halo da
    amostra (`Toggle swatch`: contorno de 2px, afastado 2px) na cor da própria
    opção puxada para a tinta (`color-mix` com `--foreground`: 11:1 no escuro,
    5,6:1 no claro) e a linha acende cheia (`bg-sidebar-accent`, como a página
    ativa na barra); a outra em foco mostra a prévia do halo a 45%, e as demais
    esmaecem a tinta. Sem peso nem marcador no fim.
  - Teto vertical
    `max-h-[min(var(--radix-dropdown-menu-content-available-height),var(--menu-max-h))]`
    (288px) e horizontal `max-w-(--radix-dropdown-menu-content-available-width)`, escritos
    por extenso em cada menu. `FormPickerPopoverContent` para em 384px; o
    `panel` devolve o teto (`[--menu-max-h:100dvh]`).
- **`DropdownMenu`**: `size` é largura (`auto`, `sm` 176 … `xl` 224; no toque
  32 a mais em cada degrau, 208 … 256, como o texto que vai a 16 — rodada 345) — não
  escreva `w-44`…`w-56`; `variant="panel"` é o painel de conta.
  `DropdownMenuHeader` sangra e `DropdownMenuSection` devolve o recuo (não
  compense geometria por seletor); o fio entre identidade e comandos é do slot
  `header`. **`mobile="sheet"`** vira a folha do `Drawer`, mas **nenhum ⋯ a usa**: o ⋯
  abre como menu também no telefone, na escala do toque (rodada 336; o chip de status
  da fatura segue como folha), e o **gatilho ⋯ é `icon-md` sem `size-*` nem ícone com
  tamanho** (32 no mouse, 44 com ícone de 20 no toque; as ações da linha do `DataTable`
  também); **o `onClick` da tela
  roda antes do da linha**. Item com `shortcut`, `description`, `confirm` e
  `onSelect` que devolve `Promise`; **a caixa não fecha o menu**; `search`;
  `shortcut` na raiz. Ícone de linha sem `h-4 w-4` nem `mr-2`.
  `dropdown-menu-versions.test.ts`.
- **`ContextMenu`**: `header` + `ContextMenuHeader` nomeiam o menu; `size` como
  o `DropdownMenuContent` (sem `w-52`); `shortcut` (a tecla tem de existir na
  tela) e `description`. Shift+F10 e a tecla Menu abrem.
  `contextMenuTargets(id, selecionados)`: sobre uma linha selecionada, age na
  seleção. **É sempre atalho** de ações que continuam à vista; mudar o que ele
  abre é mudança de jornada. `context-menu-versions.test.ts`.
- **`Menubar`**: `variant` `floating` (o padrão), `outline` (a única de vidro),
  `plain`, `solid`; **`size` mede o gatilho**. O realce viaja **só na fileira**
  (`layoutId`). Gatilho com `icon`, `count`, `chevron`, `mnemonic`; **F10 foca a
  barra**; linhas com `shortcut` (funciona com o menu fechado), `confirm` e
  `Promise`; a caixa não fecha; `search`, `mobile="sheet"`. **Dentro de um
  `MenubarContent` só vão peças do menu** (cada painel monta um índice).
- **`NavigationMenu`**: a pílula e `indicator="highlight"` são o padrão;
  `NavigationMenuPanelHeader`/`Footer`; **`NavigationMenuGroup` aprofunda no
  lugar** (o `Esc` sobe um nível); o ponto no gatilho da página atual; a
  diagonal segura; `NavigationMenuPreview`, `badge`, `mobile="sheet"`. Não é
  portalizado.
- **O movimento do que se sobrepõe é um gesto só**, o do menu da barra de baixo
  (rodada 287): `menu-morph` em 380ms — o menu do iOS 26 medido quadro a quadro,
  nasce a 20% em elipse na origem do Radix, cresce primeiro na altura e passa 8%
  dela — e `menu-unmorph` de volta em 210ms. Vestem `DropdownMenu`, `ContextMenu`,
  `Menubar`, `NavigationMenu`, `Select`, `Combobox`, o seletor do `Form`,
  `Popover`, `HoverCard`, `Tooltip` e `DatePicker`; muda só a origem (o botão,
  o campo, o cursor). **O que é modal e centrado não brota**: a paleta do
  `CommandDialog`, o `Dialog` e o `AlertDialog` abrem na mola (`fade-in-0
  zoom-in-95`, `--duration-spring`) e fecham curto (`--duration-fast`,
  `--ease-out`), a pedido do dono (rodadas 291 e 293). **Na paleta quem se
  move são os vidros** (pílula, placa, cápsulas da legenda), nunca a coluna nem
  a fileira da legenda: transform, opacidade ou `filter` animado num ancestral
  (até o `blur(0)` do `tw-animate`, zerado com `--tw-enter-blur: none`)
  desliga o `backdrop-filter` dos filhos até a animação acabar. A coluna só
  segura o fechamento com `@keyframes presence-hold`, e a pílula entra pela
  primeira animação da lista do feixe (`--command-beam-intro`), porque um
  `animate-in` nela apagava o arco-íris (rodada 323). A pílula, a placa e as
  cápsulas da paleta vestem o fundo do `Dialog` (`modalSurfaceClassName`); a
  paleta solta segue a tinta dos menus (rodada 324). As utilities
  (`menu-sprout`, `context-menu-burst`, `field-bloom`, `popover-sprout`,
  `hover-card-unveil`, `date-picker-bloom`) ficam pelas faixas de dentro de cada
  peça; o raio de chegada é `--morph-radius`. Os keyframes animam `transform`
  (nunca `translate`/`scale` soltos); o estado entra por `&[data-state=…]`; as
  cascatas zeram o atraso com `!important` no movimento reduzido. O `Sheet` e a
  gaveta deslizam da borda. `overlay-motion.test.ts`.

#### Campos e escolha

- **`Select`** (molécula: `SelectSeparator`, a `Caption` na descrição): o
  gatilho não compõe o `Input`; o seletor em que se digita é o `Combobox
  variant="input"`. **A ausência é `variant="none"`** ("Sem categoria"), e campo
  obrigatório vazio é o `placeholder`. **Nenhuma chamada escreve
  `py-*`/`pl-*`/`pr-*` no `SelectItem` nem `p-1` e
  `min-w-[var(--radix-select-trigger-width)]` no `SelectContent`.**
- **`Combobox`**: o gatilho é **um campo, não um botão**. **Categoria é
  `Combobox`, não `Select`.** `multiple` é união discriminada (precisa de
  literal); `ComboboxClear` é irmão do gatilho, no `ComboboxField`; **o tique
  não escreve `aria-selected`**. `ComboboxItem` `media`/`description`/
  `variant="none"`; o ladrilho do gatilho é `ComboboxValue media` (**prop, não
  filho**); `ComboboxChips`, `ComboboxActions` (filtre valores pelo registro do
  contexto com o `commandFilter`), `ComboboxCreate`, `ComboboxGroup recent`,
  `variant="input"` + `ComboboxTextField`. `combobox-versions.test.ts`.
- **A busca é uma pílula só** ([`lib/search-field-classes`](src/lib/search-field-classes.ts)):
  o `SearchInput`, o `CommandInput` (que monta o `SearchInput`) e o gatilho do
  cabeçalho do catálogo. Superfícies `field` | `plate` | `modal` (a do
  `CommandDialog`); `shortcut` (sem
  modificadora, não dispara em campo de texto), `variant="brand"`, `pending`,
  `caret` (o cursor desenhado `type-caret` no lugar do nativo, aceso sem foco:
  o reflexo invisível do `value` e o traço numa célula de grade sobre o campo,
  no mesmo corpo; só para a busca que se digita sozinha numa vitrine).
  **Nenhuma busca é `<Input type="search">` nem pílula escrita à mão.** Uma
  constante não se prefixa (`lg:`). `search-field.test.ts` e
  `search-input-versions.test.ts`.
- **`Command`**: a geometria de `menuItemGeometryClassName`, os estados no
  arquivo dele (a linha ativa é `data-selected`). `variant` `plain` (herda o
  raio) | `panel` (a pilha). O tique é de quem sabe o selecionado. **O
  `CommandDialog` monta o `Command` raiz** (`commandProps`), fixa o topo e
  declara o teto (`--command-list-max-h`); no telefone é a barra: o véu do
  `Dialog`, a pílula de 44 na linha do header com o × à direita (o círculo de 44 no mesmo vidro da pílula) e a
  placa embaixo. **A barra nasce do `origin` e o × se separa do
  `closeOrigin`**: a cápsula `[lupa | filtro]` do header se divide em duas
  bolhas (a da lupa corre até a calha e vira a pílula; a do filtro fica e vira
  o ×, com o ícone dele saindo no desfoque e o X chegando; sem filtro colado, o
  círculo da lupa vira o campo e o × pinga da ponta dele, na mesma mola
  (`quadroDaGota`)). Um progresso só
  (`quadroDasBolhas`, puro; abre na `SEPARACAO` de `lib/spring` de onde o
  gesto estiver, com o relógio esperando os quadros voltarem depois da
  montagem; volta em 320ms na `VOLTA_DA_PILULA`) escreve `transform` e
  `clip-path` nos dois vidros e nos filhos deles, nunca na casca, e zera o raio
  próprio dos dois no voo (o recorte só tira pixels: com o `rounded-full`, a
  emenda reta não aparecia); no fim, nada inline (rodada 338). A placa brota
  com o `menu-morph` (do alto, 60ms atrás), pausada até o vão abrir, e volta
  com o `menu-unmorph` — só ali em 460ms e 260ms (rodada 350), os outros
  menus seguem em 380 e 210; o véu do telefone sai depois das bolhas se
  fundirem, e a casca segura a saída 460ms (`--duration-slow` +
  `--duration-instant` + 60ms). A camada e o teto da placa medem o viewport visual
  (`--command-search-vh`, de `visualViewport`; `100dvh` de reserva): o teclado
  do iOS só encolhe ele, e a placa termina acima do teclado. O foco vai ao
  campo no `onOpenAutoFocus` (o teclado abre no mesmo toque); ao fechar, o foco
  que ficou sem dono vai ao diálogo que a paleta abriu, ou à origem (rodada
  337). O grupo se
  separa por respiro e rótulo, **nunca por fio**. `CommandPages` /
  `useCommandPages`, `CommandHighlight`, `CommandGroup count`, `CommandItem
  shortcut` (só com o foco na paleta; evite `mod+n/t/w`), `CommandSplit` +
  `CommandPreview`, `CommandInput caret` (repassado ao `SearchInput`; segue o
  texto controlado ou não). `command-versions.test.ts`.
- **`Field`**: `FieldHeader` (link ou contador **fora do `<label>`**),
  `FieldCounter`, `FieldChecklist` (somada ao `aria-describedby`; nenhuma tela
  declara `ReqRow`), `FieldRow stack={false}` só para o par curto.
- **`InputGroup`**: `InputGroupPasswordToggle` — **nenhuma tela escreve
  `? "text" : "password"`**; `maxLength` põe a contagem (`lib/char-count`);
  `pending`; `InputGroupSelect` (o `Select` do app colado no começo do campo,
  com `SelectItem`, e não um `<select>` nativo); `InputGroupInput money` (o
  valor com o modo ao lado, como na compra parcelada).
- **`Textarea` mede em linhas** (`minRows` / `maxRows`; `rows` é ignorado);
  solto, o teto não dissolve. `maxLength` + `showCount`; `resize` `none` |
  `vertical`.
- **`Switch`**: `size` mede o trilho (`sm` · **`md`** · `lg`), alvo de 44 nos
  três; `pending` põe o `Spinner` no polegar (não troque o texto de estado por
  uma roda ao lado); `icons`; `variant="brand"`.
- **`Checkbox` e `Radio`** florescem ao marcar e vestem `variant="brand"`; o
  `::after` deles é o alvo de toque de 44px.
- **`RadioGroup`**: `variant="chip"` (o rádio `sr-only`), `deselectable`,
  `description`, `trailing`, `icon` (`16/solid`), cartões `card` | `brandCard`.
  **Escolha única não é `role="group"` com `aria-pressed`.**
- **`Toggle`**: `variant="swatch"` com `color` é a amostra de cor (a superfície
  do `ColorTile`) — **não pinte amostra com `style={{ backgroundColor: hex
  }}`**; `variant="chip"`; `size="icon-sm…icon-xl"`; `icon` + `iconOn`. Nenhuma
  chamada escreve `rounded-full px-*`, `size-*` ou borda de seleção num
  `ToggleGroupItem`.
- **`ToggleGroup`**: `variant="segmented"` (um marcador só que viaja, como o
  `Tabs`) e `floating` (a pele do `Tabs`) — escolha de **valor**; quando a
  opção troca o painel, é `Tabs`. `count`, `stretch`. No `single` clicar no
  ativo não desmarca. **Nenhuma escolha única é `Button aria-pressed` à mão.**
- **`Slider`**: `label`, `format` (também no `aria-valuetext`), `marks`,
  `bubble`, `bands`. No `brand` a caixa da faixa é medida
  (`--slider-rainbow-*`, `offsetLeft` relativo ao trilho, nunca
  `getBoundingClientRect`).
- **`HistogramSlider`**: o histograma é o controle; a coluna acende quando cabe
  **inteira** entre as guias; a guia se ancora na grade e o slider é travado
  nela; a leitura é um `DescriptionList`; **o `Slider` de dentro é sempre
  controlado**; `openEnd` termina em `Infinity`.
- **`DatePicker`**: `presets` (`DATE_RANGE_PRESETS`), `showToday`, `markers`,
  `displayStyle="relative"`, `variant="input"`, `mode="month"` e a **`MonthGrid`**
  sozinha; no telefone a grade abre numa gaveta; `confirm` guarda o intervalo
  até Aplicar; o calendário brota do campo (`date-picker-bloom`).
  `date-picker-versions.test.ts`.
- **`Calendar`**: `markers`, `variant="agenda"` + `renderDay`, `showToday`,
  `presets`, `stretch`. **O dia só é botão com `mode` ou `onDayClick`.** A
  agenda é uma grade de fios com `CalendarEvents` / `CalendarEvent`, e abaixo
  de 40rem da própria largura vira a lista do mês (`listDays`). O dia escolhido
  fica `muted`, nunca a tecla `primary`. **Nenhuma tela escreve as fichas do dia
  à mão nem troca a agenda por `isMobile`** — `calendar-agenda.test.ts`.
- **`KbdGroup` diz o gesto**: `mode="sequence"` | `"either"`. **Duas pastilhas
  lado a lado sem grupo leem como sequência.** `live`. `joined` põe as opções
  numa pastilha só (↑↓, a legenda das paletas), e o leitor ainda ouve "ou".

#### Listas, tabelas e navegação

- **`Item`**: `variant="flush"`, `selected` (`aria-current`; **destaque de
  passagem não é seleção**), `ItemChevron`, `ItemMedia variant="tile" tone tint`
  (o círculo do tom: `soft`, o padrão, na superfície `-muted`; `vivid`, a cor
  cheia com a tinta `-foreground`, como o `ColorTile` e o `Avatar` — as
  notificações), `ItemLink` (a linha clicável com
  ações dentro, como o `CardLink`) e `ItemGroupLabel sticky` (grudado é vidro:
  transparente com o `glass-surface`, tingido por `--item-group-label-surface`
  quando quem chama precisa; sem transparência, `--background`). **Nenhuma tela
  escreve `flex-nowrap` nem `text-left` num `Item`.**
- **`DescriptionList`**: `term="eyebrow"` (**nenhum `DescriptionTerm` escreve
  `uppercase` à mão**), `DescriptionDetails size="xl"`, `DescriptionHint`,
  `columns` (nenhuma lista sobrescreve `grid-cols-*`), `align="end"` —
  `description-list.test.ts`.
- **`Table`**: a escada é a altura da linha (`xs` 32 · `sm` 36 · **`md` 44** ·
  `lg` 52 · `xl` 64); `dividers`, `striped`, `pending`, `fade`; a linha tem
  `state` e `interactive`, a célula `pin`; o `aria-sort` **só na coluna
  ordenada**. Peças `TableGroupRow`, `TableRowDetail`, `TableExpandButton`,
  `TableSkeleton`, `TableError`, `TableCellIdentity`, `TableCellMoney`.
- **`DataTable`** (TanStack Table v9, por baixo do `TablePanel`, que se importa
  de `@/components/ui/data-table`) faz ordenação, busca, facetas (`arrHas`),
  seleção e barra flutuante, grupo, detalhe, ações, menu de contexto, **o gêmeo
  do telefone** (`meta.mobile`), teclado, URL, virtualização, CSV e edição
  (`role="grid"`); dados do servidor, `manual`. A barra e o rodapé ficam **fora**
  da moldura (`toolbar`, `footer`). Peça de lugar certo entra por prop, nunca
  por `child.type === Peca` — `table-versions.test.ts`.
- **`Resizable`** redimensiona colunas (`useResizableColumns` +
  `ResizableColumnHandle`): uma coluna fica sem largura; o `TableHead` não
  trunca. `resizable-columns.test.ts`.
- **`Pagination`**: `page` + `total` com `getHref` ou `onPageChange`; compacta
  abaixo de `sm`; `PaginationMore`. **Não escreva paginação com
  `ButtonGroup`.**
- **`Breadcrumb`**: `BreadcrumbSwitcher`, `collapse="back"`, `BreadcrumbLink
  icon`, `separator`, `BreadcrumbPage asChild`. A barra do app é ele.
- **`Tabs`**: `variant` `floating` (o padrão, sem sombra), `solid`,
  `underline`, `plain`; **`size` mede o gatilho** e a moldura declara a altura
  (`lg`, bandeja de 36, é o padrão nas quatro: `DEFAULT_TABS_SIZE`);
  `stretch` (não na vertical), `scrollable` (opt-in, vence `stretch`).
  - **Quem pinta é a moldura por fora da `Tabs.List`**; nada fica entre o
    `tablist` e as `tab`; o `p-1` mora na lista.
  - **O marcador é um objeto só que viaja** (`useMarcador`), menos no `plain`;
    nunca `rAF` em laço. Sem JS a aba ativa ainda se pinta.
  - `urlParam`, `swipe`, `shortcuts` (**⌥1–9**), `keepMounted`; `TabsTrigger`
    `icon`/`iconActive`/`count`/`onClose`; `TabsList end` e `overflow="menu"`
    (as do fim saem para o ⋯ "Mais abas"; a ativa nunca sai).
  - **Abas que são rotas são `TabsNav` + `TabsNavLink`** (`aria-current`, sem
    `role="tab"`). `tabs-versions.test.ts`.
- **`Toolbar`** (Template): **a altura chega sem `className`** ao `Button`,
  `SelectTrigger`, `ComboboxTrigger` e `SearchInput` **filhos diretos** dela, de
  `ToolbarFilters`/`ToolbarActions`/`ToolbarRow` ou de um `ButtonGroup`
  (`--toolbar-control`); embrulhado num `<div>`, `toolbarControlClassName`.
  `size` (`sm` 28 · `md` 32 · **`lg` 36**, o padrão; 44 no dedo) desce pelo
  `ButtonSizeContext`. `sticky` prende sob `--top-bar-bottom`
  (`"hide"` some ao rolar, nunca com o foco dentro); `keyboard` é o
  `role="toolbar"`. `ToolbarButton collapse` — **nenhuma tela escreve as duas
  árvores** `md:hidden`/`hidden md:flex`; `ToolbarFilterButton`,
  `ToolbarChips`, `ToolbarSearch`, `ToolbarCount`, `ToolbarActions
  overflow="menu"` (as do começo saem). **No grupo da direita o menor fica por
  fora**, pela ordem do código, nunca por `order`.
- **`FilterBar`**: cada filtro é uma cápsula partida (campo · operador · valor ·
  ×) na superfície de campo; `FilterField` declara os campos; **o operador segue
  a contagem**; **um popover para a barra inteira** (`virtualRef`); **um token
  por campo** e **tudo grava ao vivo** (o incompleto nunca é emitido);
  `serializeFilters`/`parseFilters`, `filterPeriodRange`, `FilterBarSkeleton`;
  `match`, `urlParam` (`history.pushState(null, …)`), `mobile="scroll" |
  "stack"` abaixo de 28rem da própria barra. **O Enter de dentro dela e dos
  portais dela para nela** — a exceção documentada do `Form`.
  `filter-bar-versions.test.ts`.
- **`Sidebar`**: sempre à esquerda; `variant` `floating` (o padrão e a do
  app desde a rodada 261, **sem vidro**), `sidebar` (a rente), `inset`,
  `plain` (a do catálogo, com
  `collapsible="none"`). **A pílula do ativo é uma só, no `SidebarContent`, e
  anda no compositor** (`useMarcador`, a viagem líquida do `Tabs`, só
  `translate`/`scale`), **e só dentro de um menu**: de um `SidebarMenu` a outro
  (a navegação e Membros/Configurações) ela aparece no lugar, esmaecendo em
  `--duration-fast` (`mesmaViagem` do `useMarcador`); a pílula parada de cada linha fica para antes da medida e
  fora da lista. O botão não recorta (`overflow-hidden` saiu). O app marca o
  destino no clique. `peek`. **Nenhuma tela
  escreve** o `h-12` do cabeçalho recolhido, o `overflow-y-auto` do conteúdo
  recolhido nem a espera do botão `lg` (`SidebarMenuSkeleton size="lg"`, com `media="avatar"` quando a peça é o `Avatar`: o osso tem a forma da peça).
  Recolhida, o trilho mede 64 (16 + o botão de 32 + 16; o recuo lateral
  cresce a 16 só no modo ícone, e o topo e a base também: 16 nas quatro bordas), e o degrau `lg` (carteira, conta)
  vira uma caixa de 48 — `size-12` com `-m-2`, um realce de 8px em volta da
  mídia de 32, que fica inteira e no mesmo lugar (a 16 das bordas); o de 4px
  (caixa de 40) virava uma fita fina, difícil de ver (rodada 299). A mídia do
  degrau `lg` balança ao recolher e abrir (`@utility sidebar-media-sway`: 3px na
  direção da placa — esquerda ao recolher, direita ao abrir —, ida em curva de
  saída e volta em mola amortecida, 600ms; sem rotação nem vaivém) — e o botão
  de recolher do `header` balança junto (`@utility sidebar-trigger-sway`, que
  pergunta ao invólucro por `:has` se a placa recolheu) —, só
  depois da primeira troca (`data-toggled` no invólucro) e nunca com movimento
  reduzido.
  Na placa flutuante o degrau `lg` é `concentric`: 20 aberta e recolhida (a
  caixa a 8 da borda nos dois; recolhida ela declara o recuo de 8, porque o
  publicado de 16 no modo ícone vale para os itens de 32).
  **O botão de recolher mora num lugar só** (`SidebarProvider toggle`): o do
  componente é `topbar` (no `TopBar`, viajando para a barra recolhida — o
  catálogo o usa); **o app usa `header`** (desde 2026-10-16; antes era `edge`, a
  alça `Button floating icon-xs` na borda direita da placa): a pílula redonda, no
  vidro da busca do cabeçalho, à esquerda do `TopBar`, que **não viaja** nem encosta: no app, 36 como o
  sino e a 16px da placa nos dois estados (a distância do sino até a borda
  direita). O encosto de 8px (`SIDEBAR_TRIGGER_GAP`) é só do `topbar`. No `AppHeader`, do `lg` para cima, a ponta do botão pesa o mesmo
  que a do sino, para a busca seguir no centro. `edge`, `footer` e `footerBar`
  ficam no `/laboratorio/barra`. O gatilho do topo não tem dica;
  dentro da barra recolhida, tem.
  A dica do item e a do gatilho na barra abrem a 6px do botão
  (`SIDEBAR_TOOLTIP_OFFSET`), como qualquer dica — somar o recuo da placa as
  afastava do gatilho; um
  menu ancorado num botão de dentro da placa abre a 4px do botão
  (`sideOffset={4}`) e **sobrepõe a borda da placa** (4px aberta, 12 recolhida,
  contra o recuo de 8 e de 16): encostado e alinhado à borda dela, lia como
  parte do fundo.
  **Ao lado do `floating`, o `TopBar` filho do `SidebarInset` passa por trás
  da placa**: o invólucro publica `--sidebar-gap` (aberta, trilho, espiando,
  offcanvas) e o `SidebarInset` é `isolate`; nenhuma tela escreve a margem nem
  o recuo. Sem fio nos dois modos: rolada, ela se separa do conteúdo só pelo
  vidro. No redimensionável não passa (o painel recorta).
- **`TopBar`**: `variant="floating"`, `titleAlign`, `size` (**`sm`** 56 no telefone —
  a régua nativa: `TopBarAction`, a lupa do `TopBarSearch` e o `PageHeaderBack`
  medem 44 com ícone de 20 abaixo do `md`, e a `--mobile-header-offset` acompanha
  (rodada 328) — e 52 do `md` para cima — 8px em volta dos controles de 36, no
  ritmo da placa da barra lateral —, `md` 56, `lg` 64), área
  segura por `--top-bar-safe-area` — no app instalado no iPhone a barra de
  status é translúcida (`statusBarStyle: "black-translucent"`) e o iOS 26+
  borra o topo da página por cima de tudo, botões inclusive; a barra fica na
  área segura mesmo assim, como a nativa (o vão de 30px da rodada 331 saiu na
  333). **`surface="edge"`** (a do app) é a borda
  do iOS: sem tinta chapada nem fio, três camadas de borrão (4, 12 e 24px)
  que crescem em direção à borda e acabam 24px abaixo da barra; a barra em si
  não pode ter `backdrop-filter` nem fundo translúcido (viraria a raiz do
  borrão das camadas). **`TopBarAction`** (`plate`: o vidro da busca do cabeçalho — a tinta
  flutuante e o anel, como o botão de recolher —, com o realce em
  `--sidebar-accent`, sem sombra, em todo tamanho — no telefone a lupa, o sino e
  o voltar são os mesmos círculos de vidro do desktop, rodada 329; o sino do app a
  veste). **`TopBarActionSwap`** (`swapKey`) é o vidro que fica e o miolo que
  troca: o sino ↔ voltar do telefone afunda na mola e o ícone de antes sai no
  desfoque enquanto o novo entra (`quadroDaTroca`); o vidro é dele (a
  `TopBarAction` de dentro não pinta o seu, e o realce é o do vidro), montar
  não anima, o miolo que saiu fica inerte e entrega o foco, interromper segue
  sem pular, e movimento reduzido troca na hora (rodada 349); no gesto os dois
  miolos estão montados, e um ref passado ao filho tolera duas instâncias (o
  `filtroRef` do cabeçalho é um ref de função que só zera o próprio nó);
  **`TopBarActionGroup`** (ações `plate` numa cápsula: o `ButtonGroup` sem
  divisor, com o anel no grupo; `join` — `always`, `desktop`, `phone` — diz de
  que lado da quebra cola, quando um botão só existe num lado; no telefone a
  lupa e o filtro da tela colam, rodada 334; **`morph`** + `trailingKey` (um ou
  dois filhos, `[lupa | filtro]`, com o `join="always"` padrão) faz o vidro
  esticar da lupa até a cápsula, como os itens da barra do iOS 26 — dois
  vidros cortados numa costura, o anel no `::after` do grupo, o calendário
  acendendo do desfoque — e `trailingKey` troca o miolo com os dois presentes —
  rodadas 349 e 351) — a busca compacta
  do app, quando a pessoa escolhe "Botão" em Configurações › Aparência
  (`useBuscaDoCabecalho`, neste aparelho, como o tema; "Barra", a pílula do
  centro, é o padrão) — **nenhuma tela escreve
  o `span` da contagem nem embrulha um botão da barra num `Tooltip` à mão**;
  `TopBarSearch` (⌘K e `/`; no app, com `glow`, `plate` — o vidro do campo do `CommandDialog`, a superfície `plate` da busca — e `collapse="lg"`, centrada numa coluna `max-w-xs` (320 até 1279px; `xl:max-w-sm`, 384 a partir de 1280) entre pontas de peso igual), `TopBarProgress`, `TopBarSkeleton`. **Uma árvore
  só**: as pontas aceitam `phone` — **nenhuma barra escreve duas árvores com
  `md:hidden` e `hidden md:contents`**. `hideOnScroll`.
- **`BottomBar`**: a forma do `Tabs floating`, no tom próprio (rodada 340): a
  pílula em `--bottom-bar-surface` (a receita translúcida dos menus,
  `bottomBarTintClassName`), um degrau fora do `--card` — o `--popover` empata
  com ele nos dois temas e a barra sumia sobre um cartão —, com o anel a 15% e a
  `shadow-lg` do botão de ação; a tecla em `--bottom-bar-marker`, um degrau além
  na direção do `--muted`, com `shadow-xs`; nome e ícone na tinta cheia
  (`text-foreground`) em todas as abas — a ativa muda só a tecla por trás e o
  ícone sólido (rodada 343); 64 de altura com ou sem
  rótulo e 20 de lateral e de pé, a tab bar do iOS 26 (rodada 341); com `labels` cada aba parte da coluna igual e nunca fica menor que o
  nome; o marcador viaja (`useMarcador`); `labels="active"`;
  `BottomBarAction` (nome obrigatório), `BottomBarSkeleton`,
  `count`/`countLabel`; aba sem `href` é `<button aria-pressed>`; arraste pela
  pílula; `accessory` é o `bottomAccessory` do iOS 26 — centrado a 8px acima da
  barra, some vazio (`empty:hidden`) e afunda junto (rodada 348); tocar na ativa sobe ao topo **só na própria rota** (o `aria-current`
  também é só dela) — ativa numa tela da pilha, o link volta à raiz da aba;
  `hideOnScroll`. **No app instalado do iOS a
  barra se ancora no topo com `100lvh`** (rodada 344): lá o `bottom: 0` de um `fixed`
  segue o documento, e com a página sem rolagem (carregando) caía no pé do `<html>`,
  62pt acima do pé da tela. **A aba que não cabe com
  folga sai para a página Você** (rodada 342, no `MobileBottomNav`): cada aba pede o
  nome + 16 (medido no canvas, nunca guardado do DOM: no app instalado do iOS
  a primeira medida vem antes do CSS), nunca menos de 44; sai do fim pelo `quemSai`, a primeira e a "Você"
  ficam, e quem saiu entra no topo do grupo "Carteira" da página `/me`: a barra
  publica os `href` num armazém de módulo (`layout/abas-fora.ts`,
  `publicarAbasFora` / `useAbasFora` sobre `useSyncExternalStore`; no desktop, com a
  barra em `md:hidden` e largura 0, nada é publicado, e ao desmontar ela publica
  `[]`) e a página os lê. **A quarta aba é `BottomBarTab href="/me"
  label="Você"`** com `media={<VoceAvatar size="xs" />}` (`layout/voce-avatar.tsx`:
  a foto ou as iniciais no tom de `identityToneFor`; com o perfil a caminho, o
  círculo neutro `bg-muted`, **nunca esqueleto**). Ela fica ativa em `/me` e em
  toda tela que a página lista, subrotas incluídas (`isVoceTabActive`, em
  `config/mobile-navigation.ts`, onde também moram `getVoceGroups` e
  `voceBackHref`). **A página `/me`** é a identidade centrada (avatar 56, nome,
  e-mail) e dois `Card padding="none"` de `ItemGroup variant="divided"`, com
  linhas `Item variant="flush" interactive asChild` + `Link` (ícone mini, texto
  16 no toque, `Badge` Beta, `ItemChevron`): **Carteira** (as abas que saíram,
  Assinaturas, Contas a pagar, Cartões, Membros e convidados) e **Conta** (Minha
  conta, Configurações); Planos e o sair ficam dentro de Minha conta. No desktop
  nada muda: `/me` renderiza, mas nada leva a ela.
- **`PageHeader`** (cliente, **sem régua**): no telefone as ações com ícone
  viram quadradas; a linha do título é o eixo. `PageHeaderMedia`,
  `PageHeaderStat` (**nenhuma tela escreve `dt`/`dd` à mão**), `PageHeaderNav`,
  `PageHeaderSkeleton`; `collapse`, `PageHeaderActions overflow="menu"`, o
  voltar pelo histórico (`history={false}`; ligá-lo no `app-header` é mudança
  de jornada), `PageHeaderTitle truncate`. O telefone dele é um primeiro
  desenho.
- **`PageSection`**: **a ação não declara `size`** (nenhuma tela escreve `h-8
  text-xs pointer-coarse:h-10` num botão de seção). `reveal` (desligado por
  padrão), `PageSectionTitle icon count`, `PageSectionLink`,
  `PageSectionMeta`, `PageSectionFooter`, `PageSectionSkeleton`. A seção é uma
  região nomeada pelo título, e **o nível é da profundidade** (sem `asChild`).
  `collapsible`, `sticky` (`useStickyBar`).
- **`SplitShell`**: container query de 48rem (`@3xl/split-shell:`,
  `@max-3xl/split-shell:`); `side`, `ratio`, `back`, `footer`;
  `SplitShellAside` — **nenhuma tela escreve `brand-field rounded-2xl m-4` nem
  o `env(safe-area-inset-top)` do campo**; `SplitShellFooter`,
  `SplitShellBack`, `SplitShellSkeleton`; `asideMobile`, `step`, `media` (o
  ícone de status acima do título). **`SplitShellRoot` + `SplitShellMain`**
  são as duas metades: o Root (contexto, grade, áreas seguras, o campo) mora
  no layout de rota e segura o campo montado (no app, o `AuthFrame` do layout
  de `(auth)`); cada página escreve só a Main (a
  coluna, dona do foco do `step`, que lê o `asideMobile` do Root). O
  `SplitShell` é a Main dentro do Root, com a mesma API.
- **`Stepper`**: com `value` + `onValueChange` o item deriva o estado —
  **nenhuma tela escreve `estadoDe(i, atual)`** —; no modo interativo todo item
  é `button`. `variant="bar"`, `orientation="responsive"`, `StepperContent`,
  `StepperActions`, `StepperPrevious`, `StepperNext` (`onNext` com `Promise`;
  `false` não avança). O `DialogSteps` é à parte.

#### Divulgação

- **`Accordion` e `Collapsible` dividem a régua**
  [`lib/disclosure-classes`](src/lib/disclosure-classes.ts). A linha tem piso 32
  (`md` 32, `lg` 36, `xl` 40) em `min-h`, nunca `h`; **um marcador que gira**;
  **o realce não troca o fundo** — o rótulo sublinha (nunca a linha) e o
  marcador se desloca por `--disclosure-nudge`; o anel de foco é interno
  (`inset-ring-3`). Abre numa mola (`disclosure-reveal`) e **fecha em curva**.
  Nenhum envelope declara como altura a medida que ele produz.
  `accordion-versions.test.ts` e `escadas.test.ts`.
- **`Accordion`**: `variant` `plain` | `contained` | `separated` (**não entra
  num `Card`**), `size`, `markerSide`; `AccordionTrigger` `trailing` (prop),
  `icon`, `description`; `AccordionContent findable`; `AccordionToggleAll`.
- **`Collapsible`**: `CollapsibleRow` — **nenhuma tela escreve a linha à mão**;
  `variant="card"`; `CollapsibleLabel`; `findable`; `peek` (a espiada; a altura
  é inline, por `useEspiada`).

#### A dissolução

- Recebem: `Command`, `ScrollArea`, `FormPickerPopover`, `Sidebar`, `Table`
  (eixo X), os menus, o `Select`, o `DialogBody` e o meio da gaveta. Fora: o
  `DropdownMenu variant="panel"` e o `PopoverContent` (componha um `ScrollArea`
  dentro).
- **As tiras de superfície não têm fio nem tinta** (`CardToolbar`, `CardFooter`,
  `CardNote`, `PopoverHeader`, `PopoverFooter`, `DropdownMenuHeader`, as do
  `Dialog` e da folha); separa o respiro (`--card-strip-py`). Têm fio só os
  separadores de itens repetidos, as molduras, `TableHeader`/`TableFooter` e o
  slot `header` do painel do `DropdownMenu`. **A regra `J` do auditor** acusa fio
  mais tinta numa tira (exceção nomeada: o `PreviewCode`).
- Nos dropdowns, **a seta de "tem mais"** (`ScrollFadeArrows` com
  `useScrollFade({ arrows: true })`): indicação, sem altura nem clique,
  `aria-hidden`.
- **Uma cabeça que gruda dentro do rolável** (`data-scroll-fade-head`; o
  `ItemGroupLabel sticky` a declara) recolhe só a dissolução de cima
  (`--scroll-fade-top-max: 0px`, por `:has`): ela já é a borda, e a máscara a
  apagaria. A de baixo continua. Não é a faixa (`--scroll-fade-band-h`), que mora
  fora do rolável.
- **Invariantes da primitiva**: `data-scroll-fade` não alimenta layout; **o
  elemento mascarado não desenha nada**; **todo `-` binário num `calc()`
  arbitrário se escreve `_-_`**; nenhuma faixa pinta (quem esconde é a rampa);
  `--scroll-fade-h` (44px) por ponta, curva sigmoide, piso 0,06, zona que cresce
  com a rolagem; `--scroll-fade-foot-h` depende da presença da faixa, **nunca da
  rolagem**; o `scroll-pb` conta a zona inteira; `--scroll-fade-bottom-y` guarda
  o cruzamento; **a rampa é um gradiente só, nunca duas máscaras compostas**;
  **um filho de rolável com dissolução não se desloca ao abrir** — transformado,
  ele conta como transbordo (o `rise` de 4px acendia a seta e a dissolução no
  painel da conta, que não rola). Toda faixa que nasce dentro de um rolável
  surge do desfoque no lugar (`menu-content-in`, preenchimento `backwards`): a
  `overlay-cascade`, a `command-reveal`, a `menubar-reveal`, as faixas do
  `popover-sprout` e do `hover-card-unveil` e o rodapé do `DatePicker`. Recuo
  do fim maior que a subida não é garantia: some quando alguém troca o recuo.
  `overlay-motion.test.ts`.

#### Gráficos

- **`Chart` — a marca não entra no dado**: área, linha, barras, rosca, faísca,
  `ChartSplit`, `ChartRadial`, `ChartHeatmap` (intensidade é dinheiro, em
  `oklab`), `ChartRadar`, `ChartWaterfall`, `ChartBarList` (`role="figure"`).
  **Arco-íris sob série é proibido**; a marca encosta pelo `Card
  variant="brand"`. O cabeçalho é composição de `Card`.
- **Gráfico que recebe ação é `role="group"`** (`interactive`), nunca `img`. O
  ponto da linha tem `fill`. **Nenhuma tela monta tooltip à mão nem usa
  `ResponsiveContainer` cru**; `ChartTooltipContent` sem `format` escreve
  número. `chart-versions.test.ts`.
- **O desenho**: a ponta da barra é 8px (`CHART_BAR_TIP`); o hover apaga as
  outras a 45% (`CHART_HOVER_DIM_OPACITY`), sem retângulo atrás.
  `chart-design.test.ts`.
- **O movimento é o do Recharts, ao montar** (`isAnimationActive` `"auto"`) —
  **sem `IntersectionObserver` nem fases**: entrada em `CHART_ENTER_MS`
  (`--duration-spring`), troca em `CHART_UPDATE_MS` (`--duration-slow`), curva
  `--ease-out` no dado. As peças HTML (mapa de calor, listas, divisão) entram
  por `@starting-style`. `chart-motion.test.ts`.
  - **Exceção nomeada: no `Showcase`, o gráfico monta só com o palco visível**
    (`useShowcase().active`), para não nascer com largura 0 no telefone, onde o
    aside é `display: none`; até lá o `ChartSkeleton` parado guarda o lugar. O
    movimento continua o do Recharts.

#### Carrossel e apresentação

- **`Carousel` — um motor só**: cada versão é prop ou peça (`effect`,
  `autoplay`, `loop`, `bleed`, `layout="accordion"`, `until`, `snap="free"`,
  `selectOnClick`, `wheel`, e as peças `CarouselToolbar`, `CarouselCaption`,
  `CarouselPlayPause`, `CarouselSteps`, `CarouselThumbs`, `CarouselMore`,
  `CarouselSkeleton`, `CarouselStatus`, `CarouselFullscreen`). Os efeitos só
  leem variável. **Autoplay só em conteúdo editorial, nunca sobre dado da
  pessoa**, com `CarouselPlayPause` obrigatório. Tinta sobre foto é
  `--scrim-foreground`. **Dê `aria-label` a todo carrossel.**
  `carousel-versions.test.ts`.
- **`Onboarding`**: `OnboardingDialog` (um índice só, o do `Carousel`),
  `OnboardingChecklist` (o `done` é da tela), `OnboardingCard` (`brand` |
  `beam` | `contrast`), `OnboardingTour` (o clique cai no botão real; um passo
  `advanceOn: "target"` **não se pula**; camada `--z-popover` + 1) e
  `OnboardingHotspot`; `storageKey` guarda o progresso.
  `onboarding-versions.test.ts`.
- **`DeviceFrame`** (Átomo, rodada 255): navegador, tablet ou celular
  desenhado só com tokens (`form`), com a mini UI de verdade dentro — sem
  `<img>`. **Uma moldura só, que muda de forma**: a projeção do `motion` anima
  a caixa na `MOLA_PALCO_LAYOUT` (nunca `scale()`), a barra de endereço (`url`, breadcrumb e nunca
  domínio) vira a ilha, o trilho (`nav`) vira a barra de abas e a moldura gira
  0 → ∓6° → 0 numa curva de 0,65s (`turn`; o `motion` 13 recusa mola de três
  quadros). O raio sai de sondas (`rounded-surface`, `rounded-modal`,
  `concentric`) lidas por `getComputedStyle` e vai a `style.borderRadius` em
  px, animado na `MOLA_PALCO` — com o raio só na classe o canto vira elipse no
  voo. Dentro de
  `[data-slot=showcase-hero]` preenche o herói (a `@utility showcase-stage`
  mede); fora, tem caixa própria por forma. `notification` (a ilha vira cartão
  no celular), `onSettled`, `useDeviceFrame()`, `DeviceFrameSkeleton`.
  **Bolinhas neutras** (`bg-foreground/15`), tinta declarada em toda superfície
  (`text-foreground`), `--device-bezel`/`--device-bezel-edge` na moldura,
  `transition-none` nas caixas projetadas (o bloco global de movimento reduzido
  transicionaria o `aspect-ratio`). `device-frame-versions.test.ts`.
- **`PresenceCursor`** (Átomo, rodada 256): o ponteiro de outra pessoa — a
  seta **desenhada** (exceção em `DRAWN_SVG_FILES`, D9: a ponta é a posição)
  e a pílula do nome, `rounded-full rounded-tl-xs`, com o anel
  `ring-1 ring-identity-foreground/15` (a forma no ponto claro do campo, a
  mesma tinta da seta nos dois temas) e o teto
  `max-w-40 truncate`. `tone` 1–6 veste a
  `@utility identity-N` (tabela por extenso): a pílula pinta
  `--identity-surface` com `text-identity-foreground` e a seta, a mesma
  superfície contornada na tinta — **nenhuma cor crua**. `at` é a ponta em px
  no pai posicionado e anda pela projeção (`layout="position"`, `MOLA`);
  `from` entra da borda do pai ao montar (trocá-lo refaz a entrada; `end` e
  `start` são físicos); `pressed` encolhe a 85% e volta na
  mola. `aria-hidden` e `pointer-events-none`: é decorativo, sem esqueleto.
  Movimento reduzido: aparece já pousado e troca de ponto sem deslocamento.
  **Exceção D2: a pílula do `PresenceCursor` pode pousar sobre o
  `brand-field` porque é superfície opaca com tinta medida** (7,44 a 8,95:1,
  `scripts/identity-contrast.mjs`). `presence-cursor-versions.test.ts`.
- **`Showcase`** (Organismo, rodada 258): o palco decorativo onde o app se
  apresenta sozinho. `ShowcaseStage` é **`inert` e `aria-hidden`**, declara
  `data-opaque` (o vidro de dentro vira placa), é o container `showcase`
  (`size`, pela `@utility showcase-stage`), `perspective-distant`, e embrulha
  `MotionConfig reducedMotion="user"` e `LayoutGroup`; `useShowcase()` dá
  `active` (`useInView`: falso com o aside `display: none` no telefone),
  `settled` e `anchorRect(id)`. As peças: `ShowcaseHero form` (o
  `DeviceFrame` a 52% da altura, centrado por layout; com a legenda, no meio da
  faixa entre 14% e 5,75rem do pé, e o celular deslocado à esquerda por
  `margin-inline-end`), `ShowcaseScatter clear`
  + `ShowcaseScatterItem slot itemKey` (os **12 lugares de `SHOWCASE_SLOTS`**,
  com `edge` publicado em `data-edge` e `delay`; **um pouso por forma** (`at`):
  o cartão anda por `left`/`top` até onde a forma deixa espaço, ou sai pela
  borda com `data-away` — a tabela é medida nos campos de 1024×700 a
  1920×1080: nada cobre a legenda nem a zona da marca, cruzamento ≤12%, os de
  perto ≤8% do herói, selo e nome do autor inteiros, legenda a ≥16px; **só a
  borda direita corta um cartão** — no celular a colagem é uma coluna à
  direita; a inclinação e o respiro no de dentro),
  `ShowcaseFloat anchor` (com `hero-top` e `hero-bottom`; um chip nunca pousa
  sobre texto da mini UI),
  `ShowcaseFlight layoutId active` (o fantasma opaco e **sem texto**; o
  conteúdo aparece aos 450ms; ele e o `ShowcasePiece` andam na
  `MOLA_PALCO_LAYOUT`, a da moldura), `ShowcasePiece`, `ShowcaseSwap`,
  `ShowcaseCursor` (mede a âncora pelo lugar de layout, `offsetParent`, depois
  do repouso e a cada `ResizeObserver`; `open` é a presença, sai em 150ms — quem
  o usa não importa `motion`), `ShowcaseDots`, `ShowcaseCaption`
  (`Card elevated` no pé, sans) e `ShowcaseSkeleton`. **Os níveis são do
  palco**: XS < 28rem 3 cartões, S 6, M 9, L ≥ 48rem 12; `showcase-short`
  esconde s5, s6 e s9. **O palco estreito** (< 24rem, as janelas de 768–880px
  com o aside à vista): o navegador vai a 6/5, o tablet a 2/3 (`135cqw`), o
  celular centra (só com 56rem de altura ou mais), e o lugar de borda `start`
  tem piso de 6,5rem à esquerda. **Profundidade é sombra e ordem — nunca
  `blur`, `opacity-` nem `scale-` nos itens.** **A paralaxe (`parallax`) mora só no
  aside**: o ouvinte é do pai não inerte do palco, só `ehCursor` com
  `(hover: hover)`, desligado sob `deDedo`, movimento reduzido ou `active`
  falso, congelado em 0 fora do repouso, sem rAF nem `setState` por evento —
  **um `pointermove` em `document` continua exclusivo do brilho da marca**.
  `showcase-versions.test.ts`.
- **`Toast`**: a placa flutuante; o tipo pinta só o poço do ícone; **sem barra
  de tempo**. **Nenhuma tela importa o `toast` do sonner**: use `@/lib/toast`
  (`description`, `id` como assunto, `action`, `cancel`, `toastPill`,
  `toastProgress`, `toastUndo`). A pilha nasce abaixo de `--top-bar-bottom` +
  12px. JSX em `lib/toast-parts.tsx`; `lib/toast.ts` continua `.ts`.

#### Pegadinhas do Tailwind

- **Variante empilhada é seletor de descendente**: apontando para o mesmo
  elemento não casa. Com dois estados, **o estado mora em variável na raiz e o
  hover troca qual variável o filho lê** (`--disclosure-nudge`,
  `--item-nudge`).
- **`hover:` e `dark:` empatam, e o `dark:` vem depois**: fundo diferente no
  escuro precisa do par `dark:hover:`.
- **Classe montada em tempo de execução não existe** (`esperarSemClasseMontada`
  cobra).
- `in-*` e `group-*` compilam com `:where()` e perdem para a classe base:
  prefira variável.
- **`instanceof` falha atravessando o iframe do catálogo** (`IphoneFrame`): o
  `HTMLElement` é da janela de fora. Use `nodeType`, `elementFromPoint` ou
  duck typing.

## Histórico e backlog

O diário das rodadas do design system (o que foi medido, errado e decidido por
trás de cada regra acima) e o backlog de migração das telas estão em
[`docs/design/HISTORICO-DESIGN-SYSTEM.md`](docs/design/HISTORICO-DESIGN-SYSTEM.md);
o texto completo que este arquivo tinha até a rodada 252 está na seção
"Retirado do AGENTS.md (rodada 252)". Quando um comentário no código disser que
"o `AGENTS.md` registra" algo que não está aqui, é lá que está. Leia a seção do
componente antes de mudá-lo.
