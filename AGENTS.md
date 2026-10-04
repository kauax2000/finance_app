<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Forms and Enter-to-submit

- Use **`Form`** from `@/components/ui/form` for any user-facing flow where fields are saved or confirmed with a primary action. It normalizes **Enter** to the primary **`Button type="submit"`** (and skips hijacking for textareas, native selects, contenteditable, Radix select triggers, and combobox/listbox roles).
- **As peças são a forma curta**, e cada uma compõe um átomo: `FormInput` /
  `FormTextarea` (sobre `Field` — rótulo, ajuda e erro já ligados),
  `FormSubmit` (sobre `Button` + `Spinner` — `pending` desabilita, marca
  `aria-busy` e troca o rótulo), `FormCancel` (`tertiary` + `type="button"`, a
  tabela do rodapé embutida), `FormActions` (`inline` ou `sticky`, o rodapé de
  folha) e `FormError` (o erro que não é de campo). **`CustomForm` é `Form`
  com `layout="none"`** e continua válido — 26 chamadas em 19 arquivos.
- **Desde a rodada 214** há `FormField` (rótulo, ajuda e erro em volta de
  **qualquer** controle de um nó — em `Select` e `Combobox`, que não têm nó na
  raiz, o `FormControl` vai no gatilho), `FormSwitch` (a linha de preferência,
  inteira clicável) e `FormActions start`. `layout="inline"` empilha no
  telefone. **O `FormSubmit` tira o rótulo de espera do verbo** ("Salvar" →
  "Salvando…"): não escreva `pendingLabel` que diga o mesmo. **Um `onSubmit`
  que devolve `Promise` liga o `pending` sozinho.** **O formulário valida, e
  não o balão**: `required`, `type="email"`, `minLength`… viram a frase em
  português no `FormField`, e o foco vai ao primeiro `aria-invalid` — também
  para quem valida à mão com `noValidate`. Um controle nativo sem `FormField`
  volta ao balão do navegador.
- Use **`type="submit"`** only for that primary action. Use **`type="button"`** for cancel, dismiss, toggles, and auxiliary actions.
- Avoid raw **`<form>`** for submit flows unless there is a documented exception.
- If you add a control that uses **Enter** for its own behavior (e.g. another Radix primitive), either mark it with a stable **`data-slot`** and extend `shouldDeferEnterToWidget` in `form.tsx`, or document the exception.
- **Estar fora do `<form>` no DOM não protege ninguém.** Um popover é
  portalizado para o `body`, mas **eventos de portal do React sobem pela árvore
  do React** — e a raiz do seletor é filha do formulário. Medido: o `Enter` no
  campo de busca do `FormPickerPopover` **salvava a transação**, com o conteúdo
  comprovadamente fora do `<form>` no DOM. A regra de
  `form-picker-popover-search` em `shouldDeferEnterToWidget` é o conserto, e a
  lição é geral: todo campo de texto dentro de um portal precisa da regra, mesmo
  parecendo estar longe do formulário.

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

O design system deste projeto tem três partes, e nenhuma delas se presume de
memória:

- **Componentes** em [`src/components/ui/`](src/components/ui) — 76 hoje.
- **Tokens** em [`src/app/globals.css`](src/app/globals.css).
- **Documentação viva** em `/designsystem`, com uma página por componente e por
  padrão. Sempre disponível em desenvolvimento; em produção, atrás de
  `NEXT_PUBLIC_DS_DOCS`.
- **A taxonomia é atomic design canônico**, e mora no mapa `LAYER` de
  [`registry.ts`](src/app/designsystem/registry.ts): Fundações → Átomos →
  Moléculas → Organismos → **Templates**. Ele é **exaustivo**: um
  componente novo sem camada não compila. A regra de cada nível está escrita no
  topo do arquivo, e [`taxonomy.test.ts`](src/app/designsystem/taxonomy.test.ts)
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
`form`, a paleta de gráfico em `chart` e `cores`, os chips em `badge`, as datas
em `typography`, o toque e a área segura em `touch-safe-area` (Foundation). Ver a
rodada 77.

O catálogo fala inglês na navegação: as seções são **Foundations · Atoms ·
Molecules · Organisms · Templates**, e todo nome e toda URL de página
(`/designsystem/colors`, `/designsystem/touch-safe-area`…) está em inglês, como
os componentes. O conteúdo das páginas continua em português. As menções a
Fundações, Átomos, `cores` ou `mobile-toque` nas rodadas abaixo são histórico.

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
   página em `src/app/designsystem/docs/`. Depois, `npm run ds:docs-map`.

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

`npx shadcn@latest add <x>` reescreve as **dependências** do componente. Numa
instalação real deste projeto ele reescreveu `button.tsx`, `input.tsx`,
`textarea.tsx` e `dialog.tsx`, e nisso apagou o prop `size` do `Input`. Fotografe
`src/components/ui/` antes e devolva ao estado anterior tudo que já existia — o
procedimento está em `.claude/skills/design-system-guard/SKILL.md`.

### Maiúscula inicial do CTA é do sistema

O rótulo de um botão não depende de quem o escreve: `Button` embrulha texto cru
num `<span data-slot="button-label">` e aplica `::first-letter` nele — `salvar`
sai **Salvar**. O embrulho existe porque `::first-letter` **não vale em
`inline-flex`** (medido, não suposto), e o botão precisa ser flex para alinhar
ícone. Com `asChild` o embrulho desce um nível e envolve o texto do filho, para
`<Button asChild><Link>` continuar coberto.

**Quem passa um elemento em vez de texto assume a caixa alta** — é a saída para
o rótulo raro que precisa mesmo de minúscula (`<Button><span>git
push</span></Button>`). O catálogo não usa essa saída: ele escreve os rótulos em
minúscula e deixa a regra agir, porque uma página que demonstra o componente não
pode mostrá-lo fazendo o contrário do que ele faz.

**A garantia é do `Button`, não do `buttonVariants()`.** `buttonVariants()`
existe para o `Button`; quem precisa de um `<a>` ou de uma primitiva com cara de
botão escreve `<Button asChild>`. Dentro de `ui/` não sobrou nenhum uso por fora
— a rodada da composição tirou os dois últimos (`pagination`, `calendar`); no
app resta `not-found-shell.tsx` (dois `<Link>`), que é migração mecânica.

### ButtonGroup cola; trilho segmentado é outra coisa

`ButtonGroup` junta botões numa peça só — uma ação com seu menu, um par de
navegação. Ele achata os cantos internos e sobrepõe as bordas vizinhas em 1px,
então a emenda é um fio, não uma linha dupla. **Não embrulhe um controle
segmentado nele**: um `role="group"` entre um `role="tablist"` e suas
`role="tab"` quebra a posse ARIA, e o leitor de tela deixa de anunciar "aba 1 de
3". O trilho segmentado do app é `transactionSegmentContainerClassName` +
`transactionSegmentTabClassName`, e as abas são filhas diretas do `tablist`.

**Desde a rodada 188 o grupo manda no degrau, na orientação, no texto e no
campo.** `size` desce a todos os botões pelo `ButtonSizeContext` (o do próprio
botão vence); `orientation="vertical"` empilha e deita a emenda;
`ButtonGroupText` é o segmento que não se clica, na altura da fileira (a
paginação da tabela o usou até a rodada 196, quando virou `Pagination`); e um
`Input` colado ocupa a sobra, com o grupo levando os botões aos 40 do dedo.

### Rodapé de diálogo: uma hierarquia só

Todo rodapé de `Dialog` e de `AlertDialog` tem a mesma forma, e ela não se
escolhe por tela:

| Papel | Variant |
| --- | --- |
| Sair sem fazer nada (`AlertDialogCancel`, `DialogClose`) | `tertiary` |
| A ação que o diálogo veio propor | `primary` |
| A mesma ação, quando não tem volta | `destructive` |

Cancelar vem antes da ação, e leva `type="button"`. Dois botões de contorno lado
a lado pesam igual, e o olho tem que ler os dois para descobrir qual é a saída.

No `AlertDialog` a tabela **já vem aplicada**: `AlertDialogCancel` nasce
`tertiary` e `AlertDialogAction` nasce `destructive`, com `type="button"` nos
dois. Só a terceira linha se escreve — `variant="primary"`, para a confirmação
definitiva que não destrói nada. No `Dialog`, `DialogClose` é um passa-tudo e
recebe `asChild` com um `Button variant="tertiary" type="button"` dentro.

### Duas ações lado a lado: a segunda não preenche

A tabela do rodapé de diálogo não é uma regra de diálogo — é a regra de **par
de ações**, e ela vale onde quer que duas apareçam juntas: cabeçalho de página,
barra, cartão, folha.

| Papel | Variant |
| --- | --- |
| A ação que a tela veio propor | `primary` |
| A que a acompanha | **`tertiary`** |

**Dois preenchimentos lado a lado disputam.** O verde da marca e o cinza do
`secondary` são os dois sólidos, e o olho tem de comparar as duas caixas para
descobrir qual é a principal — que é a mesma medição que tirou os dois botões
de contorno do rodapé. `tertiary` não preenche nada: a hierarquia se lê num
relance, e o par para de competir.

`secondary` continua certo **sozinho** — o botão único de uma folha, o
"Entendi" de um aviso —, e continua certo quando o par é de **duas ações do
mesmo peso**, que é outro caso e não tem `primary` nenhum.

E o nome é `tertiary`: `variant="ghost"` saiu do tipo na rodada que nomeou a
escada pelo degrau, e o compilador acusa quem o escrever.

### Par de identidade: sem gap

Nome sobre e-mail, título sobre legenda, rótulo sobre valor — sempre que dois
textos empilhados são **o mesmo dado em duas linhas**, quem os separa é a
entrelinha. Não declare `gap` entre eles, nem `gap-1`. Dois pixels bastam para o
par deixar de ler como uma coisa só. `gap` continua certo entre coisas
**diferentes**: um bloco e o seguinte, um campo e o próximo.

### Tokens e theme

- **Semantic colors** live in [`src/app/globals.css`](src/app/globals.css):
  `success`, `warning`, `info`, `income`, `expense`, e os pares `-muted` de cada
  um. **As seis superfícies `-muted` subiram de croma na rodada 89**, porque a
  paleta lia como apagada: o estado ia de 0,03 a 0,04 e hoje vai de 0,06 a
  0,07; o dinheiro subiu junto, para 0,105–0,11, senão o vermelho de "falhou"
  passaria o de "saiu dinheiro" e a **invariante 3 se inverteria**. Só a
  superfície mudou — nenhuma tinta `-muted-foreground` se mexeu, porque é ela
  que carrega o contraste, e mexer nos dois lados torna a medição ilegível.
  Elas servem `Badge`, `Alert`, `StatCard`, `Timeline`, `EmptyState` e
  `AnnouncementBar`, e quem remexer numa rampa remede em
  `scripts/tone-contrast.mjs` — piso 4,5, pior caso medido **4,67** (o `Alert`
  de `expense` no tema claro, que é a tinta a 85% sobre a superfície mais
  saturada; a folga é fina, e é o que reprova primeiro se alguém subir mais). **A marca é preta e branca, e a única cor dela é o arco-íris.** O
  primário deixou de ser verde: `--primary` é a **tecla preta** no claro e a
  tecla branca no escuro, `--primary-accent` coincide com `--foreground`, e
  `--ring` e os `-muted` são neutros. O acento é o token de degradê
  `--brand-rainbow` (sete matizes em oito paradas, em oklch — teal, azul com duas paradas, violeta, magenta, coral, âmbar, lima —, luminosidade por tema; cada parada é um token `--brand-<cor>`, para a página de cores medir e o `ds:catalog` cobrar par; **o verde da marca não é o verde de estado**: a lima fica em 130 e `success`/`income`/`chart-1` em 152 — ver a rodada 84) com o grão
  `--brand-grain`, e ele mora **só na marca**: o wordmark e o símbolo (prop
  `rainbow` — preenchido e **parado** em todo tamanho), o campo de marca
  e o `Button variant="brand"`, mais o `Badge variant="brand"` desde a rodada 89
  e os **controles de escolha** — `Checkbox variant="brand"`,
  `Radio variant="brand"` e `RadioGroupItem variant="brandCard"`, e desde a
  rodada 118 os dois avisos — `Alert variant="brand"` e
  `AnnouncementBar variant="brand"`. **Há três
  famílias de peça de marca, e elas quebram por motivos diferentes**: a do
  **contorno** (**extinta na rodada 169** — foi o `Checkbox` até a 153, o
  `Button brandOutline` até a 152, e o `Radio` e o `brandCard` até a 168), em
  que o degradê vivia em 1px de `border-box` sobre um miolo chapado; a do
  **preenchimento** (`Progress variant="brand"` e `Slider variant="brand"`), em
  que ele preenche a barra e o que a liberta da invariante 3 é não haver rótulo
  em cima; a do **véu**, na `AnnouncementBar variant="brand"` — o `Banner`
  rainbow do Fumadocs: o arco-íris translúcido **atrás** do texto, mascarado a
  partir do topo central e deslizando num laço de 20s (`@utility brand-flow`),
  **substituindo** o fio do `sticky`; e a do
  **brilho**, no `Alert variant="brand"`, no `Card variant="brand"`, no `Button variant="brand"` (rodada 145)
  e, desde a rodada 144, no `Badge variant="brand"` (chip `muted` em repouso;
  era do contorno), e desde a 155 no `Checkbox variant="brand"`, em que a
  caixa fica neutra em repouso e o arco-íris acende num **arco da borda**
  conforme o ponteiro passa pela tela, com um borrão de 2px. Desde a rodada
  133 ele é primitiva de marca: a pintura é a `@utility brand-glow` e o
  ponteiro é `useBrandGlow` (`hooks/use-brand-glow.ts`). **No `Card` o
  recorte vira `overflow: clip` com `overflow-clip-margin: var(--spacing)`**
  (4px de folga para o anel, que fica 2px por fora, e o borrão): com o
  `overflow-hidden` do casco o anel sumia, e com o anel dentro da borda o
  borrão era cortado pela metade. `var(--spacing)` cru porque o Chrome rejeita
  `calc()` nessa propriedade — medido, computava `0px`.
  `brand-contour.test.ts` tranca as quatro.
  **O brilho não é o giro da rodada 100**, e a diferença é a que a casa já
  usa: lá o degradê rodava sozinho num laço de 12s/6s e o dono o recusou
  inteiro; aqui nada se move sem o ponteiro se mover — a forma que a rodada 98
  sancionou, e a mesma que o commit da 100 preservou ("o botão de marca não
  ficou inerte: o halo continua acendendo no cursor"). A referência é o
  `GlowingEffect` da Aceternity, com os números do dono: blur 2, spread 40,
  proximity 24, borda 2, zona morta 0,01.
  **Quatro medições desenham o brilho, e cada uma muda o código.**
  (1) **As variáveis do brilho são lidas num pseudo-elemento, e por isso não
  podem ser `@property` com `inherits: false`** — medido, a `opacity` ficava em
  0 com a variável valendo 1. Hoje nenhuma é registrada (o ângulo é do tween,
  ver abaixo), e variável não registrada sempre herda; quem registrar uma de
  novo a declara `inherits: true`.
  (2) **`z-index` negativo sem `isolate` desaparece** — o pseudo cai atrás do
  fundo de um ancestral; medido, invisível.
  (3) **Com `isolate` ele passa a pintar por cima do `bg-card`**, pela ordem de
  pintura da raiz de empilhamento, e cobriria o texto com sete matizes. **Desde
  a rodada 156 quem impede é a máscara, que recorta só o anel**, e o meio da
  caixa nunca é pintado. Até a 155 a saída foi um núcleo chapado em
  `padding-box` (`--brand-glow-core`), e ele era o defeito: a janela é uma
  cunha que sai do **centro**, e o núcleo, que nunca batia pixel a pixel com o
  fundo real, aparecia nela como um feixe — com o ponteiro perto, de 297 a
  4.748 pixels do miolo mudavam; no campo de busca do catálogo o núcleo era o
  preto da página sobre um campo mais claro. Depois: **zero** pixel do miolo
  muda, nas seis peças e nos dois temas (os cantos arredondados, por onde o
  anel faz a curva, ficam fora da conta). O degradê nunca fica sob o texto.
  (4) **A cor fica parada e a janela é que anda, e é isso que faz o arco trocar
  de cor conforme viaja** — oliva e âmbar na aresta direita, magenta na
  esquerda. Medido no bundle ao vivo da referência: o `background-image` dela é
  um `repeating-conic-gradient(from 236.84deg …)` de ângulo **fixo**, e quem
  carrega o `--start` é o `mask-image`. **Duas tentativas erraram isto de jeitos
  opostos**: a primeira mascarava o `--brand-rainbow`, que é *linear*, e a
  janela acendia sempre a mesma cor naquela aresta; a segunda girou o cônico
  **junto** com o arco, e ele passou a carregar sempre a mesma sequência e só
  mudar de lugar. `brand-contour.test.ts` tranca as duas, e mutação confirma
  que cada asserção pega o seu erro.
  (5) **A máscara recorta o anel, e a janela é um triângulo puro** — duas
  camadas desde a rodada 182: a janela (`border-box`) **menos** a
  `padding-box` (`subtract`; no prefixado, `source-out`). Eram três (a caixa,
  `exclude` da `padding-box`, `intersect` com a janela), e no Chrome elas
  deixavam o anel inteiro bem fino do lado oposto ao arco — 253 pixels medidos
  na ponta de um `ThemeToggle brand`; a forma de duas mede zero. No Chrome o
  prefixado e o padrão são a mesma propriedade. A janela tem três paradas, opaco no meio,
  fechando em `spread * 2`, como o `transparent, #fff, transparent 80deg` da
  referência; com platô no miolo ela lê como bloco aceso e não como brilho.
  **Compor foi banido por medição até a rodada 156** (uma camada `none` num
  `intersect` apaga a peça), e o risco não se aplica mais: a janela é a única
  camada com variável e lê `var(--brand-glow-start, 0)`, com o fallback no
  próprio `var()`. A lista de paradas se repete na
  utility de propósito (o token é linear, e aqui ela é cônica e repetida
  `--brand-glow-repeat` vezes), em sRGB, porque num fio de 2px já borrado o
  oklch não se vê e o par `@supports` custaria duas listas.
  (6) **A intensidade é um token, `--brand-glow-opacity` (0,5), e o arco tem
  envelope de alfa.** Em opacidade cheia e com as oito paradas chapadas, o
  brilho saía berrante ao lado da referência e as pontas cortavam seco — a
  travessia de `transparent` para o teal acontecia em 12° e lia como aresta,
  não como brilho. Hoje as duas extremidades entram em 20% e 60% antes do
  miolo opaco (a referência faz o mesmo pela máscara, `#00000000 → #fff →
  #00000000`), e o multiplicador baixa a peça inteira. **O volume se mexe no
  multiplicador, nunca nas paradas**: mexer nas paradas muda a *cor* do arco,
  que é o que ele tem de certo.
  **O listener do brilho é o único em `document` do design system**, e a razão
  é o `proximity`: o aviso acende com o mouse **perto, não em cima**, e handler
  no próprio elemento não vê o que acontece fora da caixa. Ele só monta com
  `variant="brand"` e sob `(hover: hover)`, e sai no unmount.
  **A rolagem recalcula o estado, não só a geometria** — e a falta disso era um
  bug medido: rolando 260px com o ponteiro parado, a caixa ia de `top 255` para
  `-5` e o brilho continuava aceso apontando para onde o mouse não estava mais.
  O conserto é o da referência (`handleScroll = () => handleMove()`, com a
  última posição guardada), com **`capture: true`** a mais — `scroll` não
  borbulha mas captura, e sem isso a rolagem **dentro de um container** passa
  despercebida, que é um caso que a própria referência erra.
  **O ângulo tem valor inicial (`--brand-glow-start: 0`) na utility, e a falta
  dele era um bug visível.** A referência declara `"--start": "0"` no style
  inline; aqui a `@property` dava o `initial-value` e, quando ela saiu, nada
  repôs. Sem valor o `calc()` é inválido, **`mask-image` cai para `none`** — ou
  seja, nenhuma máscara — e o que se pinta é o anel **inteiro**: com o
  `--brand-glow-active` subindo de 0 a 1 em 300ms, o anel completo aparecia e
  só colapsava em arco quando o tween escrevia o primeiro número. Com 0
  declarado o arco existe desde o repouso, centrado no topo como na referência,
  e ao aproximar ele **viaja** até o ponteiro. **A falha não derruba nada** — o
  CSS é válido, só o efeito fica errado —, e `brand-contour.test.ts` a tranca.
  **A animação do ângulo é o `animate` do `motion`, portado da referência** —
  não uma transição de CSS. Havia aqui uma `@property --brand-glow-start`
  registrada com `transition: … 2s var(--ease-out)`, defendida por três rodadas
  como equivalente ao tween dela; era **dedução, não medição**, e o dono disse
  três vezes que a animação não era a da referência. Hoje ela é, por
  construção: a propriedade volta a ser **não registrada**, como lá, e quem
  interpola é o tween (`GLOW_DURACAO` 2, `GLOW_EASE` `[0.16, 1, 0.3, 1]`),
  escrevendo a variável no `onUpdate`. **O ângulo atual sai do DOM**
  (`el.style.getPropertyValue`), e não de um acumulador — um acumulador guarda
  o *alvo*, não onde a animação está, que era o defeito da versão anterior.
  Duas divergências deliberadas do fonte dela: o módulo **duplo** no caminho
  curto (o dela devolve valores abaixo de −180 e o arco dá a volta pelo lado
  errado), e **parar o tween anterior** (ela não para, e deixa até ~120 tweens
  vivos escrevendo a mesma variável; a trajetória é a mesma porque cada tween
  novo parte do valor atual do DOM). E **movimento reduzido é perguntado à
  mão**, com `matchMedia`: o bloco global encurta *transição*, e um tween de JS
  escapa dele — o precedente é o `ThemeToggle` ao trocar transição por WAAPI.
  **E o `rAF` daqui coalesce, o que não é o laço que esta casa proíbe**: o
  precedente recusado (no marcador do `Tabs`) é o `rAF` que se **re-agenda**
  para fazer polling; este agenda um quadro por rajada e o cancela. É ele que
  torna barato ler `getBoundingClientRect()` a cada quadro em vez de cachear —
  o cache só se invalidava em `scroll` e `resize`, e a caixa também se move por
  reflow, por acordeão abrindo, por imagem carregando.
  **Os quatro blobos radiais da referência foram portados e saíram, por
  medição**: são círculos no **interior** da caixa (degradê morrendo em 15–20%
  do raio) e o que se vê desta peça é só o anel de 2px na **aresta** — eles
  nunca o alcançam. Vale igual na referência, onde o raio efetivo é ~44px num
  cartão de 374×230 contra um anel de 3px. Eram quatro camadas de
  `background-image` fiéis ao fonte e invisíveis nas duas pontas. Repô-las
  exige raio de 60–80% da caixa para cruzarem a aresta, e aí não é port, é
  desenho nosso.
  **E a largura de faixa é o que importa, não o número de voltas.** A referência
  tem 4 cores × 5 voltas = 20 faixas de 18°, e a janela de 80° mostra 4,4
  delas. Copiar o 5 com as **oito** paradas da marca dava 40 faixas de 9° e 8,9
  na janela — metade da largura e o dobro da contagem, que sob o borrão de 2px
  vira lama em vez de banda. `--brand-glow-repeat` é **2,5**: 8 × 2,5 = 20
  faixas de 18°, a estrutura de banda da referência com a paleta daqui. **No
  telefone não há brilho** — e como ele substituiu a régua do alerta, ali o
  `brand` fica visualmente igual ao `soft` de `tone="default"`. É o custo da
  escolha, e está dito.
  **O véu é a exceção consciente à invariante 3, e a segunda peça que se move
  sozinha** (depois da `brand-lava`), as duas por decisão do dono na rodada
  127. Quem paga o texto por cima é o alfa `--brand-flow-alpha`, **por tema**
  (0,75 no claro, 0,45 no escuro — a 0,6 o escuro reprovava com 3,42 na lima),
  medido em `scripts/tone-contrast.mjs` contra o `--foreground` no alfa
  **máximo** da máscara: pior caso **5,33**. O volume se mexe no alfa, nunca
  nas paradas. O `::before` fica em `-z-1` sob `isolate`, que é o que o mantém
  visível numa barra não `sticky`.
  **A régua (rodada 118 a 126) existia porque contorno degenera numa faixa de
  largura total**, e as medições dela ficam:
  esquerda e direita ficam fora da tela e o topo encosta na borda do viewport,
  sobrando exatamente os dois fios horizontais; e em volta de um parágrafo o
  contorno lê como enfeite. **Ela usa um token só nas duas orientações**, e
  isso foi medido contra a previsão oposta: a linha do degradê é
  `|W·sin θ| + |H·cos θ|`, definida para cobrir a caixa de canto a canto em
  **qualquer** ângulo, então `--brand-rainbow` a 135° serve a vertical e a
  horizontal sem override — as duas "correções" candidatas
  (`background-size: 100% 200%`, com e sem `position: center`) esticam a rampa
  e a cortam em coral e em violeta. Quem for consertar o ângulo, meça primeiro.
  **O recuo vertical da régua vem do raio, e é ele que proíbe o degrau `sm` do
  `Alert`**: num `rounded-xl` de 12px, a 8px do topo a aresta recua 0,69px, mas
  a 4px recua **3,06px** e um fio de 2px em `start-0` ficaria fora da
  superfície pintada. Oito pixels é o piso, e numa caixa `sm` de 34px isso
  deixa 47% de fio — tracinho, não régua. O tipo proíbe o par, porque **não há
  caso**: `sm` fala com um campo, e a marca fala uma vez por tela.
  **Nos dois, `tone` é `never` junto de `brand`** (o precedente do `Progress`),
  e **quem garante que a superfície neutra vence a tonal é o `tailwind-merge`,
  não a cascata**: medido, pondo as duas classes cruas no mesmo `class` sem
  passar pelo `cn`, a faixa de marca sai com o texto **azul**, porque
  `text-foreground` e `text-info-muted-foreground` empatam em (0,1,0) e decide
  a ordem de emissão do Tailwind. O `cn` remove o perdedor; quem montar as
  variantes à mão traz o defeito de volta.
  **O contraste da régua está medido e reportado**: contra `--card`, no escuro
  as oito paradas passam 3:1 (pior caso violeta 5,35); no claro quatro reprovam
  (pior caso lima **1,91**), e contra o `--muted` da faixa são cinco (1,60).
  **Não é um caso de 1.4.11**, e a razão é o papel: quem identifica o aviso é a
  caixa mais o ícone, e a régua é acento — a categoria do halo do `Button` e do
  arco-íris do `Progress`. O caminho de reforço, se ela ler fraca no claro, é o
  que o `Progress` documenta (leito escuro), e lá foi recusado na tela.
  Arco-íris **sob texto** — num gráfico, num fundo de cartão, preenchendo um
  chip — continua sendo a invariante 3 violada com sete cores de uma vez, e
  sete matizes não têm um contraste só. As peças de marca escapam porque
  nelas o degradê **nunca fica sob o rótulo**: ele vive num contorno de 1px
  (`border-box` sobre um `padding-box` chapado) e num halo borrado
  atrás (`::after`), com o miolo preenchido pelo `primary`. Uma por tela.
  **O `Checkbox` marcado floresce** (rodada 154): o preenchimento nasce no
  centro da caixa e se abre na mola (`@utility button-bloom`, a flor do
  `Button`, com `--button-bloom` ligado em `data-[state=checked]` e
  `indeterminate`), e o tique entra crescendo de 50% com a tinta do marcado
  cravada — senão ele nascia escuro antes da flor. **O `Checkbox brand` veste
  o brilho** (rodada 155, a família do `Alert`, do `Card`, do `Badge` e do
  `Button brand`, com `useBrandGlow`): a borda acende perto do ponteiro,
  marcada ou não, e só a borda: a máscara recorta o anel, e o preenchimento,
  a flor e o hover aparecem intactos sob ele. (Na rodada 155 havia um núcleo
  com a flor por cima e um remendo de hover; saíram na 156.) **Desde a rodada
  169 o `Radio brand` e o `RadioGroupItem brandCard` vestem o mesmo brilho**:
  o rádio com intensidade cheia, como a caixa, e o cartão somando o brilho ao
  realce de seleção do `card` (antes o contorno o substituía; o brilho acende
  pelo ponteiro, não pelo estado, e a seleção precisa de sinal próprio).
  Marcado, o anel do `Radio` passa a `--primary-accent` e o ponto nasce na
  mola (`zoom-in-0`).
  **Nos controles de escolha o halo não existe, e o motivo é mecânico**: o
  `::after` dos dois átomos **já é o alvo de toque de 44px** (`after:-inset-3.5`),
  e ele não se move. Sobra a borda — hoje o brilho, que mora no `::before` —,
  e nesta escala é o certo de qualquer forma: um halo a `-inset-1` sangra 4px e
  encosta na linha vizinha de uma lista com `gap-3`. O rádio dentro do
  `brandCard` **não** veste `brand` — dois brilhos aninhados são "dois anéis
  na mesma caixa". `brand-contour.test.ts` impede o contorno de voltar e tranca
  as três peças de escolha no brilho.
  **O campo não veste marca, e isso custou cinco rodadas.** Passaram por ele um
  contorno estático de arco-íris, o `border-beam` do 21st portado em CSS (feixe
  animado), um halo por `box-shadow`, a receita do `Button variant="brand"` com
  `::before`/`::after`, e ela com teto de croma e de luz — e o dono recusou
  todas na tela. **O foco do campo é o anel do sistema** (`--ring`: quase preto
  no claro, quase branco no escuro), que é o que `fieldFocusRingClassName`
  sempre declarou; o que o anulava era o `ring-0` que as peças de marca
  carregavam para não cobrir a cor de 1px.
  `field-control-ladder.test.ts` proíbe a sexta tentativa: nenhum dos oito
  controles pode casar `--brand-`, `field-brand` ou `brand-rainbow`.
  **O anel do campo é `ring-3` de `--ring` a 30% desde a rodada 162, e fora dos
  3:1 por decisão do dono** — ele pediu o foco mais suave, com o custo dito:
  1,99 no claro e 2,53 no escuro, contra as sete superfícies (a versão de 2px
  foi tentada e voltou a 3px na mesma rodada). É a terceira divergência consciente da
  1.4.11, a primeira num indicador de foco; a borda de 1px continua na cor cheia
  de `--ring`, e o caminho de volta é `/45`. Os outros anéis do sistema seguem a
  45%. **A história do número:** ele foi 70% até a
  rodada 101, e o dono o pediu mais suave — no escuro, 3px de quase-branco a
  70% sobre cartão quase preto leem como marca-texto. Medido contra as **sete**
  superfícies (`background`, `card`, `popover`, `muted`, `secondary`, `accent`,
  `sidebar`) nos dois temas, que é a régua certa porque um campo focado pousa em
  qualquer uma delas: 70% dava 6,94 no claro e 7,83 no escuro; 45% dá **3,05 e
  4,12**, e 40% reprova no claro (2,63) contra o piso de 3:1 da WCAG. Medir só
  contra o cartão é medir metade — foi o que fez a primeira leitura desta
  rodada reportar 3,16. **A folga de 0,05 não tem guarda**: não há script de
  contraste para o anel como há para `tone`, `tile` e `identity`, então quem
  mexer em `--secondary` ou `--accent` derruba o foco da norma sem nenhum teste
  cair. O valor vive em **37 grafias** — `field-classes.ts` serve os oito
  controles, e todo o resto escreve à mão, por decisão registrada em
  `radio.tsx` ("importar só o anel esconderia que o resto diverge").
  A largura (`ring-3`), a cor (`--ring`) e a **ausência de transição** não
  mudaram. A última é um teto conhecido: `transition-colors` não cobre
  `box-shadow`, então o anel do campo estala enquanto o do `Button` esmaece.
  Quatro medições daquela série ficam, porque valem fora dela: **`<input>`,
  `<textarea>` e `<select>` não pintam pseudo-elemento** (e `getComputedStyle`
  mente, resolvendo o pseudo mesmo onde ele nunca chega à tela); **`@property`
  novo não registra em aba patchada por HMR**; **uma transição que nasce na
  mesma mudança de estado não dispara** — declarada só dentro da regra de foco,
  o valor salta; e num contexto de empilhamento o fundo pinta antes dos filhos
  de `z` negativo, que é por que o `brand` não tem fundo próprio. As `@utility`
  são `brand-rainbow` (só o degradê; o grão é do campo), `brand-field` e
  `brand-lava`; **todas moram depois de `no-scrollbar`**, pela fatia do
  `glass.test.ts` — a faixa entre `@utility glass` e `no-scrollbar` reprova
  utility nova, e a asserção 8 acusa até a palavra `background` num comentário
  ali dentro. Ver `/designsystem/brand`.
  **O degradê não gira, e o giro não volta.** Da rodada 83 à 99 o ângulo somava
  `--brand-angle` e `brand-rainbow-live` o animava (12s no splash, 6s sob o
  cursor no botão de marca). O dono o recusou inteiro na rodada 100, e saíram
  com ele `--brand-angle`, `@keyframes brand-rotate`, `--brand-spin` e a
  própria `brand-rainbow-live`. **O movimento da marca é a lava**: blobos de
  cor transitando dentro da caixa, a `brand-lava` em escala de região — o raio
  é `%`, o núcleo é opaco até 38% e não há pulso nenhum, quem muda a cor é a
  sobreposição andando. (O hover do primário foi lava até a rodada 146; hoje o
  primário acende um degradê borrado no cursor, ver o `Button`.)
  O degradê interpola **`in oklch shorter hue`**, e isso é o conserto do fio que
  se via cortando o campo: em sRGB a travessia magenta→coral gastava 36,1° de
  matiz a cada 5% da largura contra 9,0° no azul (razão 4,01×), e em oklch o
  pico cai para 26,3°. O espaçamento das paradas **não** era a causa (razão de
  velocidade perceptual 1,29×, pior quebra de derivada 1,37×) e não se mexeu.
  **O sRGB fica declarado antes, e o oklch entra por `@supports`** — não é
  redundância: o valor de uma propriedade personalizada não é validado na
  análise, então um `in oklch` que o navegador não entenda só falha no **uso**,
  e ali o `background-image` cai para `none` em vez de degradar. A marca sumiria
  inteira.
  **Os dois tokens do primário continuam existindo pelo papel**, mesmo
  coincidindo em valor:
  **`--secondary-hover`** existe pela mesma razão que a divisão acima: um alfa
  único não serve os dois temas. `bg-secondary/80` dava 1,03:1 contra a base
  — invisível — e em direções trocadas, clareando no claro e afundando o botão
  na página no escuro. O token puxa a base na direção do próprio texto: escurece
  no claro (1,26:1), clareia no escuro (1,39:1). Sempre na direção do contato.
  **`--primary-hover` segue a mesma regra e por isso escurece nos dois temas**:
  o contato do primário é o rótulo branco, e escurecer é o único sentido que
  sobe o contraste dele (9,01 no claro, 6,21 no escuro). Com ele vêm
  `--primary-edge` e `--primary-highlight`, a aresta e a luz da tecla — ver a
  rodada 78.
  `--primary` **preenche** (botão, checkbox, switch, faixa do slider) e é medido
  contra o texto que fica em cima; `--primary-accent` é **marca sobre o fundo**
  — texto, ícone, e todo traço fino: barra lateral de citação, contorno de chip
  selecionado, anel do thumb. Regra prática: se a cor vai carregar texto claro
  por cima, é `--primary`; se ela mesma precisa ser enxergada contra a página,
  é `--primary-accent`. **Traço com alfa é sempre acento** — `--primary` a 60%
  sobre a página escura cai para 2:1 e some, enquanto `--primary-accent` a 60%
  dá 3,07:1. No tema claro
  os dois são a mesma cor; no escuro nenhum valor único atende os dois — 4,5:1
  contra a página exige subir a cor, e aí o texto branco sobre o preenchimento
  reprova. Por isso **`text-primary` é proibido** — compila, porque
  `--color-primary` existe, e é justamente por isso que a regra é escrita: use
  `text-primary-accent`. Além deles: `--identity-1..6` para distinguir pessoas — seis **cores chapadas**, uma família cada (ember, gold, grove, ocean, iris, bloom), com os matizes de 42° a 100° uns dos outros, e **duas versões desde a rodada 184** (o pastel de 0,85 saiu a pedido do dono): a **viva**, `--identity-N` (0,76, croma 0,17, tinta escura), e a **suave**, `--identity-N-soft` (0,95, croma 0,05) com a letra em `--identity-N-ink` (0,42, croma 0,13). A classe `identity-N` publica as três como variáveis e `AvatarFallback tint` escolhe. Como são cor, entram no `@theme inline` e a tela escreve `bg-identity-N`. **Uma família por pessoa inverte de propósito a regra de que ninguém é dono de uma cor** — ver a rodada 87. **Os valores vêm de um degradê que não existe mais**: por três rodadas a identidade foi uma mancha radial com grão e ponto de luz, e cada cor daqui é a parada do meio daquela mancha. Saíram junto os tokens `--identity-grain*` e `--identity-spec*`, a indireção por `--identity-surface`, a camada `::before` do fallback e o `variant` que fazia as duas superfícies conviverem; as medições daquele tempo ficam na rodada 87. Contraste por `scripts/identity-contrast.mjs`, que mede as duas versões: piso 4,5, viva de 7,44 a 8,95, suave de 6,50 a 7,68. **Girar pelo ângulo do gradiente não funciona**: um `var()` dentro de um token do `:root` é substituído lá, não no elemento que o veste — ver a rodada 86 —,
  `--skeleton`, `--input-fill`, `--overlay`, a rampa `--chart-1..5` mais
  `--chart-income` / `--chart-expense`, a escala `--z-*` e os tokens de movimento
  `--duration-*` / `--ease-*`. Prefira utilitários como `bg-success-muted`,
  `text-expense-muted-foreground`, `z-(--z-sheet)` — **não** adicione classes
  cruas da paleta do Tailwind (`text-green-600`, `bg-rose-100`).
- **O campo de marca**: `@utility brand-field` é o arco-íris ocupando uma
  **região** — hoje, o painel das telas de acesso — com grão pesado e vinheta
  para o preto, e ele é um **cartão**: cantos arredondados, um fio por dentro
  (`box-shadow`), margem dada por quem chama. **Nenhum texto corrido mora
  direto sobre ele**: sete matizes não têm um contraste só, e o que se lê vive
  em `Card`, que segue o tema. A única exceção é o wordmark, branco, que herda
  o `color` do campo por `currentColor`. **A utility não redefine token
  nenhum**, e isso é medido: a versão verde redefinia `--foreground` para os
  filhos, e sobre o arco-íris esse override desceu pelo `Card` hospedado — o
  saldo saiu branco sobre o cartão branco. A posição dela no arquivo é carga
  estrutural: `glass.test.ts` fatia o CSS de `@utility glass-material` até
  `@utility no-scrollbar`, e uma utility nova dentro desse intervalo entra na
  fatia e reprova asserções de outro componente. As medições estão em
  `/designsystem/brand`.
- **A seleção de texto** é tingida em `@layer base`: `--primary-muted` atrás,
  `--primary-muted-foreground` na frente, e o par invertido dentro de
  `.brand-field`. Sem regra, o app inteiro seleciona no azul do sistema
  operacional, que não conhece o tema escuro nem a marca. O preenchimento é o
  par **tingido** e não `--primary` cheio, porque a seleção não pode trocar a
  cor do texto que cobre — um valor em `--expense` continua vermelho por baixo
  dela.
- **Camadas**: `--z-base` 0, `--z-raised` 10, `--z-sticky` 20, `--z-banner` 30,
  `--z-header` 40, `--z-modal` 50, `--z-sheet` 70, `--z-popover` 80, `--z-toast`
  100. Os números são os que o app usa — a rodada 02 corrigiu a escala, que
  descrevia sheet 50 / popover 60 enquanto a produção rodava 70 / 80. **Escalar
  para vencer é sempre sintoma**: se um popover precisa passar de
  `--z-popover`, o que está errado é quem o contém. Empilhamento local (`z-0`,
  `z-10`, `z-[1]` dentro de um componente) não é camada e fica como número cru.
  **Toda superfície ancorada e portalizada vive em `--z-popover`** — `Popover`,
  `DropdownMenu`, `Select`, `Tooltip`, `HoverCard`, `ContextMenu` e `Menubar`.
  O `NavigationMenu` não é portalizado: a raiz dele fica em `--z-raised`, abaixo
  do header sticky (em `--z-popover` o painel pintava por cima do header), e o
  empilhamento interno é `z-10` local. **E superfície não modal fecha ao rolar**
  a página ou um container ancestral (`useCloseOnScroll`); rolar dentro da
  própria lista não fecha. `Tooltip`, `HoverCard`, `ContextMenu`, `Menubar` e
  `NavigationMenu` já estiveram em `--z-modal`, ou seja, **na mesma
  camada do `Dialog`**: um tooltip dentro de um diálogo era decidido por ordem
  de DOM, não pela escala. E o `DatePicker` escalava o próprio popover até
  `--z-toast` para vencer uma disputa que `--z-popover` já ganhava — o sintoma
  de sempre.
- **Shadows**: `shadow-xs` / `shadow-sm` / `shadow-md` / `shadow-lg` /
  `shadow-xl`, todos com valores próprios no tema escuro.
- **Texto**: além da escala do Tailwind, `text-2xs` (0,6875rem, para contagem
  dentro de controle pequeno) e `text-control-sm` (0,8rem, o texto dos controles
  `size="sm"`).
- **Ícones**: **Heroicons, e só** — a regra é fechada, e tem dois guardas.
  **O ESLint é o porteiro**: `no-restricted-imports` reprova `lucide-react`,
  `react-icons`, `@radix-ui/react-icons`, `@tabler`, `phosphor`, `feather`,
  `font-awesome`, `@mui/icons-material` e companhia. Ele nasceu verde — nenhuma
  está instalada —, e existe para o dia em que um `npm i` trouxer a primeira.
  **O auditor é o relatório**: `npm run ds:audit -- --rule G` acha os dois
  furos que dependência nenhuma pega — `<svg>` colado à mão e conjunto errado
  para o tamanho.

  Um conjunto de ícones é uma tipografia: o que faz a interface ler como
  sistema é todos virem do mesmo desenho. Dois conjuntos não empilham — a
  espessura do traço, a grade e o canto são outros, e uma barra com um ícone de
  cada lê como falha de renderização, não como escolha.

  **A exceção não é "ícone bonito de outro lugar", é o que não é ícone:**
  marca (o logo, a marca escrita, as bandeiras de cartão — propriedade de
  outra pessoa, e que não existe em biblioteca de ícone) e primitivo desenhado
  (a roda do `Spinner`, cuja geometria é o comportamento). A lista vive em
  `DRAWN_SVG_FILES`, no auditor, e é curta de propósito: a pergunta para entrar
  nela é se o arquivo desenha uma marca ou um movimento.

  **E o conjunto muda com o tamanho**, porque eles são redesenhos e não
  escalas — o micro tem menos detalhe e traço mais grosso, para sobreviver a
  16px. `size-6`+ usa `@heroicons/react/24/outline`; `size-5`
  usa o mini (`20/solid`); `size-4` e abaixo usam o micro (`16/solid`), o que
  inclui todo ícone sem classe de tamanho, porque o componente que o contém
  aplica `size-4`. Ícone passado como valor (mapa de ícone, config de navegação)
  fica em `24/outline`, já que quem renderiza é que decide o corpo — **e isso
  vale quando quem renderiza não é quem declara**. Com a tabela e o `.map()`
  vizinhos de arquivo, e o corpo cravado no sítio, quem declara **é** quem
  renderiza, e vale a régua do tamanho. A regra G do auditor passou a seguir
  essa indireção, e foi assim que 14 pares errados apareceram de uma vez.
  `components.json` declara `heroicons`.
- **Fonts**: [`src/app/layout.tsx`](src/app/layout.tsx) define `--font-sans`
  (Inter), `--font-display` (Ledger, só em `.page-title` e `.wordmark`),
  `--font-heading` (aponta para a sans), `--font-mono` (Geist Mono).
- **Utilitários**: `.nums` (tabular figures) e `.page-title`.

### Contorno de campo: decisão consciente fora da 1.4.11, pela segunda vez

O fio do campo quase não existe — `--input` é `oklch(0.9)` no claro (1,16:1
contra o fill) e `oklch(0.31)` chapado no escuro (1,12) — e quem identifica o
controle é o **preenchimento**, `bg-input-fill/50` em `field-classes`: 1,13 e
1,16 contra a página. **A WCAG 1.4.11 pede 3:1 para o que identifica uma peça
acionável, e o conjunto não cumpre.** A página `/designsystem/colors` mantém a
régua acesa no ladrilho `--input`, reprovando de propósito.

A decisão é do dono, com a referência na mesa: o `border-beam` do 21st (Jakub
Antalik, MIT), em que o fio contrasta **1,11:1** com o fill e o fill **1,15**
com a página. O campo passou **um dia** dentro da norma (`oklch(0.62)`, 3,49:1)
e voltou a pedido, com o fill subindo de 1,08 para os números acima — que era
o que faltava para ler como a referência. O escuro **não** voltou ao branco
translúcido a 10% de antes: aquele dava 1,02 contra o fill, invisível até para
a referência, e compunha diferente sobre página e cartão.

**Quem quiser voltar à conformidade** troca `--input` para `oklch(0.62 0 0)` no
claro e `oklch(0.55 0 0)` no escuro — uma linha em cada tema —, e mede contra
**três** vizinhos: página, cartão e o próprio fill. Foi medir só contra o cartão
que fez `oklch(0.66)` parecer suficiente por uma temporada (3,11 ali, 2,75 contra
o fill). `--input-fill` não se mexe: serve `Switch`, `Slider`, `Progress` e
`Kbd`, e mexer nos dois lados de uma medição a torna ilegível.

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

### Required primitives for new screens

- **A barra do topo da janela**: [`TopBar`](src/components/ui/top-bar.tsx) —
  a do app e a do catálogo são ela. Não escreva `<header className="sticky …">`
  nem `backdrop-blur` numa barra: `position`, `size`, `surface` e `gutter`
  cobrem as duas contagens, e a altura já contém o fio e a área segura. Ver a
  rodada 80.
- **A barra de baixo do telefone**: [`BottomBar`](src/components/ui/bottom-bar.tsx)
  — a do app é ela. Não escreva `fixed bottom-0` nem uma grade de abas à mão:
  as abas são `BottomBarTab` (com `iconActive` para o par sólido), o gatilho de
  popover é `BottomBarSlot`, e a ação primária veste `bottomBarActionClassName`,
  que lê a altura da barra e **não declara cor**. O realce viaja sozinho, e a
  área segura mora dentro da caixa. Ver a rodada 82.
- **A página que existe fora da casca do app**:
  [`SplitShell`](src/components/ui/split-shell.tsx) — campo de um lado, coluna
  de conteúdo do outro, sem cartão, empilhando abaixo de `lg`. O campo entra por
  **slot**, porque o que ele mostra é conteúdo de produto. Quem amarra os dois
  neste app é o `AuthShell`, em `components/layout/`, e as cinco telas de acesso
  o vestem. Dentro do app, o topo de tela continua sendo o `PageHeader`.
- **Page chrome**: [`PageHeader`](src/components/ui/page-header.tsx) +
  [`PageSection`](src/components/ui/page-section.tsx) +
  [`Container`](src/components/ui/container.tsx). Os três têm `size` (`sm` |
  **`md`** | `lg`) e os dois primeiros têm `variant` — a régua, que no cabeçalho
  é **embaixo** e na seção é **em cima**. O `Container` também tem `full`, e
  **não tem `default`** — a escada dele é 448 · **576** · 672 · 1280 · sem teto,
  e a calha (`gutter`) é **opt-in**, porque quem é dono dela neste app é a casca.
  `PageHeaderTitleRow` recebe `back` e `endAdornment`;
  `PageSectionHeader` recebe `actions` — as três apagam anatomias que o catálogo
  escrevia à mão. Não existe `PageSectionContent`: ver a rodada 15.
- **Cartão e painel**: [`Card`](src/components/ui/card.tsx) e suas peças —
  `CardToolbar`, `CardHeader`, `CardContent`, `CardFooter`, `CardNote`. O
  painel do app é `<Card padding="none">`; nada de `border-b bg-muted/30`
  escrito à mão para fazer uma barra de topo.
- **Typography**: [`H1`…`H4`, `Lead`, `P`, `Muted`, `Small`, `Caption`](src/components/ui/typography.tsx) instead of ad-hoc `text-3xl font-bold` / arbitrary `text-[10px]`.
- **Empty states**: [`EmptyState`](src/components/ui/empty-state.tsx) (+ title / description / actions slots).
- **Money**: [`MoneyDisplay`](src/components/ui/money-display.tsx) e **`<Input money>`** ([`input.tsx`](src/components/ui/input.tsx)), com a forma curta `<FormInput money>`; formatting helpers in [`src/lib/formatters.ts`](src/lib/formatters.ts) (`currencyBRL`, `signedCurrencyBRL`, `percentBR`).
- **Dates**: [`src/lib/transaction-date.ts`](src/lib/transaction-date.ts) — e.g. `formatDatePtBr`, `formatTransactionDmyPtBr`, `formatDateLongPtBr`, `formatRelativeDayPtBr`.
- **Status chips / filters**: as constantes `tagChip*`, exportadas de [`badge.tsx`](src/components/ui/badge.tsx) — a mesma superfície que as tintas `soft` do `Badge` leem.
- **Régua compartilhada em `lib/`**: além de
  [`menu-classes`](src/lib/menu-classes.ts) e
  [`scroll-fade-classes`](src/lib/scroll-fade-classes.ts), agora
  [`field-classes`](src/lib/field-classes.ts) — a superfície de campo que
  `Input`, `Textarea`, `NativeSelect`, `SelectTrigger`, `ComboboxTrigger`,
  `DatePicker`, `FormPickerPopoverTrigger` e, pelas variantes `Group`, o
  `InputGroup` vestem, mais a **altura com o piso de toque** e o **recuo** — e
  [`command-filter`](src/lib/command-filter.ts) — a busca por substring sem
  acento, graduada, que a paleta do catálogo e o `Combobox` dividem —,
  [`search-field-classes`](src/lib/search-field-classes.ts) — a pílula de
  busca que o `SearchInput`, o `CommandInput` e o gatilho do cabeçalho vestem
  (rodada 198) — e
  as **três tintas de vidro**, que moram juntas em
  [`glass-classes`](src/lib/glass-classes.ts) desde a rodada 132, cada uma com o
  nome do papel: a **barra** (`barSurfaceClassName`, `--background` 95/60), a
  **flutuante** (`menuPanelTintClassName`, `--popover` 85, abrindo a 60 só no
  escuro) e a **modal** (`modalSurfaceClassName`, `--background` 85/40: mais
  aberta, porque pousa sobre um véu). **A flutuante é `--popover` por decisão
  do dono, e com o custo dito**: `--popover` e `--card` são a mesma cor, então
  sobre um cartão a placa se confunde com ele e quem a separa é o anel e a
  sombra. A rodada 9f0ba8a a trocou pela tinta da barra para medir delta 24
  contra o cartão, e na tela ela virou uma chapa escura sem vidro — voltou.
  Elas moravam em três arquivos, uma como alias de outra, e foi isso que
  deixou a troca passar sem que ninguém visse as duas lado a lado. A seta do
  `HoverCard` é o **único** espelho manual da receita flutuante (`fill-*` não
  é `background`), e `glass.test.ts` compara os dois.
  **Nada de `cva` nesses arquivos**: a regra A2 do auditor o reprova fora de
  `components/ui/`.
- **Cor escolhida pela pessoa**: [`ColorTile`](src/components/ui/color-tile.tsx) para o ladrilho que carrega `categories.color`, `bills.color` ou a marca de um workspace. Se a cor vem do tema e não do banco, é o componente errado — use `bg-muted` ou um `Badge`. **É a construção do `AvatarFallback`**: superfície chapada com a cor, tinta escura por cima, **um valor só nos dois temas**. O que separa os dois é a forma e quem escolhe — o avatar é redondo e o sistema sorteia uma das seis identidades; o ladrilho é de canto arredondado e quem escolhe é a pessoa. **A claridade e o croma são do sistema; o matiz é da pessoa**, em **duas versões desde a rodada 184** — `tint="vivid"` (o padrão, `@utility tile-vivid`: `oklch(from var(--tile-color) 0.76 clamp(0, (c − 0,02) × 10, 0,2) h)` com a tinta escura) e `tint="soft"` (`tile-soft`: `0.95 min(c, 0.05)` com a tinta em `0.42` no mesmo matiz). As utilities **publicam** `--tile-surface` e `--tile-ink`, e o componente pinta com `bg-(--tile-surface)` — é o que deixa a amostra do `Toggle` vencer o `hover:bg-muted` pelo `tailwind-merge`. O croma do vivo é um degrau e não um multiplicador porque os hex gravados vão de 0,079 a 0,12; cinza continua cinza. Preto, branco e cinza chegam neutros. **A cor não entra crua, e isso é medido**: chapando a parada da marca como ela é, índigo dá 3,55, violeta 3,21 e magenta 4,09 com tinta escura, e âmbar 1,94, lima 1,83, teal 2,23 e azul 2,42 com tinta branca — nenhuma tinta única serve as oito. Sem o teto de croma, o magenta cai a 7,70 e oito ladrilhos deixam de ler como uma família. `scripts/tile-contrast.mjs` é a guarda: 192 células (as duas versões), piso 4,5, viva de **6,66 a 9,44**, suave de **6,48 a 7,64**. **A paleta que a pessoa escolhe é a da marca** — `TILE_PALETTE` em [`lib/tile-palette.ts`](src/lib/tile-palette.ts), os oito matizes do arco-íris na banda da identidade, servindo categoria **e** carteira; eram duas listas de hexadecimais crus do Tailwind (dez e doze). `tileColorFor` dobra na leitura os 22 presets legados, sem escrever no banco, no precedente de `identityToneFor`; o que a pessoa digitou no seletor livre atravessa intacto. **Duas versões e nenhum enfeite**: saíram o verniz, o eixo `glass`, o véu de 12%/18%, o fio e o par por tema; ficaram a viva e a suave, as mesmas do `Avatar` e do `Toggle variant="swatch"`. **A escada fala os nomes do sistema**: `xs` 24 · `md` 32 · `lg` 36 · `xl` 40 · `2xl` 44, e só o `2xl` alcança o alvo de toque; o `xs` (rodada 173) é o de dentro de uma linha — a opção de um `Select` e o gatilho `md`, onde a categoria mostra a cor. **E quem manda no corpo do ícone é o degrau**: `[&>svg]:size-4` é seletor de descendente (0,1,1) e vence qualquer classe no próprio `svg` (0,1,0) — medido, um `size-5` no ícone computa 16px.
- **Alerts / tabs / forms**: [`Alert`](src/components/ui/alert.tsx), [`Tabs`](src/components/ui/tabs.tsx), [`Textarea`](src/components/ui/textarea.tsx), [`ScrollArea`](src/components/ui/scroll-area.tsx), [`Toggle` / `ToggleGroup`](src/components/ui/toggle.tsx), [`Slider`](src/components/ui/slider.tsx), [`Radio` / `RadioGroup`](src/components/ui/radio-group.tsx) (a forma curta é `FormRadioGroup`), [`Pagination`](src/components/ui/pagination.tsx), [`Collapsible`](src/components/ui/collapsible.tsx), [`Breadcrumb`](src/components/ui/breadcrumb.tsx), [`ChartContainer` + chart helpers](src/components/ui/chart.tsx) for Recharts.
- **Campos**: [`Field`](src/components/ui/field.tsx) para rótulo + descrição + erro **já ligados — e agora ligados de verdade**: quem escreve `htmlFor`, `id`, `aria-describedby`, `aria-invalid` e `data-invalid` é o `FieldControl`, não a memória de quem escreve a tela. Esta linha afirmava o mesmo antes de o mecanismo existir; ver a rodada 11. [`FieldRow`](src/components/ui/field.tsx) para a linha de dois campos; [`InputGroup`](src/components/ui/input-group.tsx) para campo com ícone ou botão acoplado; [`Combobox`](src/components/ui/combobox.tsx) quando a pessoa **procura um nome** (categoria, carteira), e não quando a lista cresce — os 31 dias do cartão são `Select`, que salta pela digitação. O `NativeSelect` mora em `select.tsx` desde a rodada 165, e a página dele é a do `Select`.
- **Seletor ancorado num campo**:
  [`FormPickerPopover`](src/components/ui/form.tsx) e as suas
  faixas — `FormPickerPopoverTrigger` (o gatilho **é** o campo: a superfície
  de `field-classes`, `md` na escada, chevron que gira),
  `FormPickerPopoverSearch` (o `SearchInput` na superfície `plate`),
  `FormPickerPopoverList`, `FormPickerPopoverItem` e
  `FormPickerPopoverFooter` + `FormPickerPopoverFooterAction`. São as mesmas
  três faixas do `Card` e do `Dialog`. Escolha-o quando a lista é longa e pede
  busca; `Select` quando é curta, `Combobox` quando cabe numa palavra. **Mora
  no `form.tsx` desde a rodada 215**, e a página dele é a do `Form`; dentro de
  um `FormField`, o `FormControl` vai no gatilho.
- **Tabela de dados**: [`DataTable`](src/components/ui/data-table.tsx) quando
  há **estado** — ordenar, filtrar, marcar, paginar, agrupar, expandir —, e a
  [`Table`](src/components/ui/table.tsx) sozinha para a tabela de leitura.
  **Nenhuma tela escreve** a conta de ordenação, a seleção com indeterminado,
  a barra de seleção, a paginação de uma lista nem o gêmeo do telefone à mão.
- **Listas e detalhe**: [`Item`](src/components/ui/item.tsx) para linha de lista (e para o que a `Table` vira no telefone), [`DescriptionList`](src/components/ui/description-list.tsx) para pares termo/valor, [`Timeline`](src/components/ui/timeline.tsx) para histórico, [`Toolbar`](src/components/ui/toolbar.tsx) para a linha de filtros e ações.
- **Tema**: [`ThemeToggle`](src/components/ui/theme-toggle.tsx) — o trilho de **três** paradas (sistema, claro, escuro), e o único controle de tema. Não escreva outro com `setTheme`. Ele é `radiogroup` e não `switch` desde a rodada 116: três estados não cabem num booleano. Tem `size`: `sm` 28 (rodada 181, barras densas), `md` 32 (o padrão, o do menu da conta) e `lg` 36 (rodada 139, ao lado de um campo `lg`) — trilho = 4 + 3 paradas, a parada é a altura menos 4, e o alvo de toque é 44 nos três. Desde a rodada 181: `labels` (ícone e texto; paradas de largura igual, e o esticão tem os mesmos pixels da versão de ícone), `variant="brand"` (o brilho na borda do trilho) e `reveal` (**ligado por padrão**: a troca abre num círculo a partir da parada tocada, pela View Transitions API, com `flushSync` para o tema trocar dentro do callback; o CSS que tira o esmaecer padrão é escopado por `.theme-reveal` no `<html>`; sem API ou com movimento reduzido, troca na hora). O app roda com `enableSystem` e `defaultTheme="system"`.
- **Carregando**: [`Skeleton`](src/components/ui/skeleton.tsx) para uma tela esperando dado; [`Spinner`](src/components/ui/spinner.tsx) só para ação curta sem fim conhecido. O `Spinner` é uma **roda desenhada**, não o `ArrowPathIcon` — a seta é o "tentar novamente" do app (rodada 178). `size` fala a escada do ícone (`sm` 14 · **`md` 16** · `lg` 20 · `xl` 24 · `2xl` 32), e dentro de um `Button` ele não leva margem: o `gap` já dá o respiro. Sozinho, leva `label`; numa região que espera, é o `SpinnerBlock`, que anuncia e só aparece depois de 300ms (`@starting-style`, sem timer). `variant="brand"` é o anel em arco-íris da tela de abertura — uma por tela.
- **Borda de região rolável**: a dissolução é uma **primitiva do sistema**, não
  um efeito da paleta de comandos. Ela mora em três camadas — as `@utility`
  `scroll-fade-y` / `scroll-fade-x` em [`globals.css`](src/app/globals.css), a
  gramática em [`lib/scroll-fade-classes`](src/lib/scroll-fade-classes.ts) e o
  mecanismo em [`hooks/use-scroll-fade`](src/hooks/use-scroll-fade.ts). O
  [`ScrollArea`](src/components/ui/scroll-area.tsx) a **consome** pelas
  variantes `fade`, `blur` e `material` (o `ScrollFade` era um átomo à parte
  até a rodada 171, e virou essa variante: a máscara mora no viewport do
  Radix, que rola e não pinta), e serve o caso em que ninguém é dono da casca. Quem já tem casca
  própria compõe as classes direto, porque um `<div>` interposto quebraria o
  contexto do Radix ou do cmdk.
- **Busca**: [`Command`](src/components/ui/command.tsx) — a paleta de comandos. O catálogo `/designsystem` é o primeiro consumidor ([`ds-search.tsx`](src/app/designsystem/ds-search.tsx)): gatilho no meio do cabeçalho com o `Kbd` do atalho, `⌘K` e `/` para abrir, e `filter` próprio, porque o padrão do cmdk é difuso e erra em português. Desde a rodada 208 o **app** também tem a sua: [`app-command-palette.tsx`](src/components/layout/app-command-palette.tsx), aberta pela lupa da barra do topo e por ⌘K em qualquer tela, com as telas da navegação, as ações do "+ Adicionar" (os mesmos ganchos) e as sub-páginas de categorias e cartões — mudança de jornada, registrada em `docs/JORNADAS.md` e no Atlas.
  **A paleta do catálogo abre por camadas** (rodada 139): vazia, mostra as
  cinco camadas com ícone (`category-meta.ts`, o mesmo ícone que encima cada
  seção da sidebar) e, abaixo delas, as últimas 5 páginas abertas
  (`recent-pages.ts`, `localStorage`) — uma linha só. Enter numa camada pinta o nome dela na cor da camada — uma parada do
  arco-íris por camada (`tint`), com luz fixa em 0,47 no tema claro —
  no campo (`CommandScope`, no slot `leading` do `CommandInput`, como o
  destinatário de um e-mail) e a busca segue só ali. **Sem ×**: com o campo
  vazio, o primeiro Backspace acende o fundo do escopo e o segundo o tira; **Esc
  sempre fecha**. Sem
  chip, digitar traz camadas (também pelo nome em português, por
  `keywords`), recentes e páginas — e **uma página recente não se repete no
  grupo da camada**, porque duas linhas com o mesmo `value` acendem juntas no
  cmdk. A busca continua casando só o **nome**; a descrição aparece na linha.
  **O movimento é da casca**: o `CommandDialog` abre na mola e declara
  `--command-reveal`, que a `@utility command-reveal` da lista lê para fazer
  cada linha que o cmdk *monta* subir escalonada; `0s` por padrão, então o
  `Combobox` não se mexe. Trocar de vista remonta o miolo por `key`, e um
  evento `input` sintético devolve a paleta ao ocioso — trocar o escopo não
  digita nada. **Campo, placa e legenda são três superfícies** (rodadas 140, 141 e
  143): a **pilha** é a variante `panel` do `Command`, e é ela que o
  `CommandDialog`, o `Combobox` e a paleta solta montam; a raiz é uma coluna
  que não pinta, com a **pílula de busca** em
  cima (o `CommandInput` lê o `CommandDialogContext` e pinta a própria
  superfície), a **placa** da lista no meio (um embrulho do `CommandList`,
  porque a lista é o elemento mascarado; a faixa do topo zera nele) e o
  `dock` — as três **sem sombra própria**, no mesmo plano (e a pílula leva o
  **feixe** da rodada 142: o preset `line` do `border-beam` portado para
  `@utility command-beam`, correndo pela base só com o campo vazio e **só no `CommandDialog`** — exceção
  nomeada ao campo sem marca, que vale para os oito controles de formulário), com **uma sombra só atrás
  do conjunto** (`::before` da coluna; `box-shadow`, nunca `filter`, que seria
  raiz de fundo) — — cápsulas de vidro soltas (`CommandDock`, `CommandDockItem`, o último
  filho da pilha — não há mais prop `dock`), o padrão novo do iOS. Irmãs porque um ancestral com `backdrop-filter` é raiz
  de fundo e o borrão das cápsulas não veria a página. São legendas, não
  botões, e somem no toque. `CommandFooter` e `CommandHint` saíram. Na pilha a linha tem 36 e as peças
  dela são do componente — `CommandItemIcon` (caixa de 24), `CommandItemMeta`
  (o lado direito) e `CommandItemArrow` (a seta de ir) —, junto com o recuo
  de 8 da placa e o respiro dos grupos; a tela não escreve nada disso. **O
  `Combobox` saiu da pilha na rodada 198**: é a placa do popover com a
  pílula (`SearchInput surface="plate"`, pelo `CommandInput surface="plate"`)
  e a lista dentro — pílula de 32 a 8px das bordas, linhas de 32, 8px
  embaixo —, a forma do `SearchInput` num popover, que o dono pediu "exatamente
  a mesma". A `density="menu"` e o `PopoverContent surface="none"` ficaram sem
  consumidor no app. O campo da paleta é `CommandInput size="lg"` (36); `md` (32) continua o padrão, o gatilho do cabeçalho. **E o ponteiro
  conta como navegação** no modo ocioso
  (`onPointerMoveCapture` no hook): sem isso a seleção do hover era tratada
  como auto-seleção e nenhuma linha acendia. `command-reveal.test.ts` tranca.

### Component rules

- **`Badge`**: `variant` (forma) + `tone` (cor) + `size` (`xs` | `sm` | `md`); as classes de chip moram no próprio `badge.tsx` e não se duplicam fora dele. **`variant` tem quatro valores**: `soft`, `outline`, `contrast` (a pílula grave — `primary` no claro, `secondary` no escuro, **sem inverter**; ali o `tone` não pinta superfície, fica só no dot) e `brand` (um chip neutro, `muted`, cuja borda acende em arco-íris conforme o ponteiro se aproxima — a família do brilho, com `useBrandGlow`; uma por tela). **`tone` tem oito** — `info` entrou na rodada 89, e ele já era usado sem existir: duas telas escreviam `tone="neutral"` e anulavam a tinta com `tagChipInfo` por `className`. **O respiro e o corpo do ícone são do componente** (`gap-1` na base, `size-2.5` no `xs` e `size-3` nos outros), porque sete telas os escreviam à mão e uma delas usava `mr-1` por não haver `gap` nenhum; o conjunto é sempre `16/solid`. **`BadgeDot` é o ponto de estado**, com `pulse` para o que acontece agora e sem ele para o que só é relatado — a cor sai de `--badge-dot`, que o `tone` publica. Ele é `animate-ping` e **não** `animate-pulse`, de propósito: o bloco global de `prefers-reduced-motion` isenta `spin` e `pulse` do corte, e um ponto decorativo não tem a desculpa do spinner.
- **`Button` — a hierarquia é uma escada, e ela desce em peso visual**:
  `primary` preenche de preto (branco no escuro), `secondary` preenche de
  cinza, `tertiary` não preenche nada. **O `primary` é o Button Colorful da
  Kokonut UI com a cor guardada para a interação** (rodadas 149 a 151, MIT):
  em repouso, a tecla preta (branca no escuro) **chapada** — a identidade preto
  e branco —; no cursor, no toque e em `aria-expanded`, um degradê de
  cinco paradas da marca (`--brand-teal`, `-blue`, `-violet`, `-magenta`,
  `-coral`) **floresce do centro** até `--button-colorful-opacity` (**0,70 no
  claro, 0,80 no escuro**): nasce comprimido (30% × 60%) e borrado (16px) e se
  abre até as bordas ganhando foco (8px), na mola da casa, e recolhe sem mola
  em `--duration-slow` (rodada 151). A pintura é a `@utility button-colorful`,
  e **um número só anima tudo**: `@property --button-colorful` (0 → 1,
  `inherits: true`, porque quem a lê é o `::after`), da qual escala, borrão e
  opacidade derivam — o `Button` só a liga e enumera na `transition`. A versão da 149 era a referência crua —
  40% sempre aceso, só o roxo indigo→magenta — e saiu porque punha cor de
  marca em toda tela (disputando com as peças `brand`) e o roxo de três
  paradas lia como template, não como o nosso arco-íris. A camada é o **`::after`** —
  `isolate` a põe acima do fundo e abaixo do rótulo, `overflow-hidden` recorta
  o borrão de 8px — porque o `ButtonGroup` usa e esconde o `::before`. **É cor
  sob o rótulo, e é exceção consciente à invariante 3, por decisão do dono**:
  sob o rótulo aceso, o pior ponto mede **5,09** no claro e 7,70 no escuro
  (piso 4,5). O claro fica abaixo dos 0,80 da referência por medição: o rótulo
  é branco, teal e azul são as paradas claras, e a 0,80 o `salvar` media 4,26.
  **O volume se mexe no token, nunca nas paradas.** Da rodada 78 à 97 ele foi tecla, da 98 à 147 lava e
  brilho do Shiny Button, e na 148 cru; `button-primary.test.ts` cobra que
  `primary-wash`, `--button-wash` e companhia não voltem. O fundo continua
  recortado no `padding-box` (a `bg-clip-padding` da base), e não em
  `border-box` como no `secondary`: é o vão de 1px da borda transparente que
  desenha a emenda do primário no `ButtonGroup`. **Os outros pesos com fundo
  no hover florescem do mesmo jeito** (rodada 152): a cor do hover é uma
  elipse no próprio fundo (`@utility button-bloom`, `farthest-corner` a partir
  do centro, com a borda indo de difusa a nítida), na mesma variável e na
  mesma mola. **Não pode ser pseudo-elemento**: o `::after` desses pesos é o
  alvo de toque ampliado do `PageHeader`, do `Breadcrumb`, do × da
  `AnnouncementBar` e das setas do `Carousel`, e o `::before` é o divisor do
  `ButtonGroup`. Cada peso declara só `--button-bloom-fill` (`secondary`
  `--secondary-hover`, `tertiary` e `outline` `muted`, `destructive` 11%),
  com par `dark:` onde o escuro difere, e os alfas são **compostos**
  (`repouso + a·(1 − repouso) = hover`: 11%, 12,5%, 29%). **Quem muda o realce
  de um `Button` por fora muda a cor da flor, não o fundo**: `hover:bg-*` numa
  chamada pinta por baixo da elipse e some — `AlertAction`, a `AnnouncementBar`,
  o `WorkspaceSwitcher` e os chips de filtro declaram `--button-bloom-fill`; o
  link da lateral do catálogo zera a flor e mantém o esmaecer, porque linha de
  lista esmaece (rodada 137). E `transition-colors` numa chamada troca a lista
  e faz a flor estalar. Da rodada 99 à 148 a cor crescia num disco a partir do
  ponteiro (`button-fill`), e `button-touch-response.test.ts` cobra que ele
  não volte. `brand`, `brandOutline` e `link`
  mantêm o hover próprio. **`tertiary` acende no cursor e no toque** — o par
  `active:` entrou na origem na rodada 29b, porque `hover:` compila dentro de
  `@media (hover: hover)` e sem ele o degrau ficava inerte no dedo. Uma tela tem um `primary` só. Fora da escada, de propósito:
  `outline` é a exceção para quando o controle precisa de contorno próprio e
  nenhum degrau serve, `destructive` é o que não tem volta, `link` é ação que se
  comporta como texto — **sublinhada sempre**, e no cursor o traço **troca de
  **traço que entra pela esquerda**: não há sublinhado em repouso — ele é um
  `::after` em `scaleX(0)` com origem à direita, e no cursor a origem troca
  para a esquerda e ele vai a `scaleX(1)`, recolhendo para a direita na saída.
  A mecânica é a do `link-button` do 21st (Hyperiux, MIT), lida do bundle do
  preview, e ela **reverte a regra do sublinhado permanente** — decisão do
  dono, com o custo dito: sem cursor o link depende de `--primary-accent` para
  se distinguir do texto. As rodadas 91 a 93 já tinham varrido e recuado, e a
  94 encerrou pedindo a troca seca; esta é a volta do movimento, agora sem
  traço em repouso. A receita mora em `@utility link-sweep`, e o traço fica no
  `data-slot="button-label"` para ter a largura do **texto** e não a do botão.
  **Continua não sendo `text-decoration`**, e pela mesma emenda medida: o
  `::first-letter` da base cria caixa própria para a primeira letra, e a
  decoração propagada sai em dois segmentos com uma costura visível. Quem
  devolver `underline` traz a emenda junto.
  A âncora é `calc(50% + 0.5lh)` — meia entrelinha abaixo do meio da caixa —, e
  ela cai **no mesmo pixel** em que a decoração caía: a `%` resolve contra
  `(altura − 1px)` e `lh` é a entrelinha do próprio elemento, então a conta
  acompanha o degrau sozinha. Medido no `md`: `underline-offset-4` pintava em
  25,5 e a âncora resolve em 25,5; ≤1px nos cinco degraus. `bg-bottom` punha o
  traço 5,5px abaixo do texto, porque o eixo `size` só declara recuo lateral e
  a caixa de conteúdo tem a altura inteira. `bg-origin-content` é o que mantém
  o traço na largura do **texto** e não do botão. Ver as rodadas 91 a 94.
  E `brand` é, desde a rodada 145, o **CTA neutro com o brilho na borda**:
  superfície do `secondary` com o fio do sistema, e o arco-íris acendendo num
  arco da borda conforme o ponteiro se aproxima (`@utility brand-glow` +
  `useBrandGlow`, a família do `Alert`, do `Card` e do `Badge`). **O fundo não
  muda no cursor, e é mecânico**: com `isolate` o anel pinta por cima do fundo,
  e um hover de fundo sumiria na fatia virada para o ponteiro. Até a 145 ele
  era a tecla do `primary` com contorno de 1px e halo borrado, e esse desenho
  ficou no `brandOutline` até a 152. **Desde a 153 o `brandOutline` é o
  Rainbow Button da Magic UI** (21st, MIT): a tecla preta (branca no escuro)
  com o arco-íris **só na borda de baixo** — a camada do miolo cobre a
  `border-box` até a metade e desbota — e um **brilho borrado embaixo** da
  tecla (60% × 20%, `bottom: -20%`, 0,8rem de borrão), os dois deslizando num
  laço de 2s (`@utility brand-rainbow-button`, `::before` e `::after`, e não
  o fundo do botão, porque a base declara `bg-clip-padding`). A lista de cores
  **fecha no coral**, então o laço não tem a emenda da referência. Sempre
  aceso, para quando a marca não pode depender do ponteiro. Os dois:
  **um por tela**, para o CTA de marca. O `primary` não veste o arco-íris
  inteiro: veste cinco paradas dele, borradas por dentro e só no cursor
  (rodada 150).
  **`shape`** é a forma (`rounded`, o padrão, ou `pill`, 100% arredondado, com
  meio degrau a mais de recuo lateral; nos `icon-*` vira círculo) — rodada 145. **Não existe `variant="default"` nem `variant="ghost"`**
  — viraram `primary` e `tertiary`, para o nome dizer o degrau; os dois saíram
  do tipo, então o compilador acusa quem os escrever. **`success` e `warning`
  também saíram**: nomeavam um estado, não um peso, e nenhuma tela do app
  chegou a usá-los — estado de sucesso e de atenção é trabalho do `Badge` e do
  `Alert`, que mantêm os deles. Ação principal segue `type="submit"` dentro de
  `CustomForm`.
- **`Button iconMotion="spin"`** (rodada 138): o ícone gira meia-volta no
  cursor e no toque, na mola da casa (`--ease-spring`, 500ms), e volta ao
  sair. Ele é o do "tentar novamente": o `ArrowPathIcon` é simétrico a 180°,
  então a meia-volta lê como uma volta inteira. Gira `rotate`, e não
  `transform`, para não disputar com o `translate` do clique.
- **Uma escada de controle, para todos**: `xs` 24, `sm` 28, **`md` 32 (o
  padrão)**, `lg` 36, `xl` 40. Falam-na com os mesmos nomes e o mesmo padrão o
  `TabsList` (pela **bandeja**, ver a rodada 13) e o
  `Button`, o `Input`, o `SelectTrigger`, o `NativeSelect` e o
  `ComboboxTrigger` — então botão ao lado de campo alinha **sem ninguém dizer
  `size`**, e mudar um degrau move os dois pelo mesmo nome. Nem todo controle
  oferece todos os degraus (campo não desce a 24), mas nenhum usa um nome para
  uma altura diferente.
- **No dedo a escada de campo colapsa no piso de 40.** `sm`, `md` e `lg` sobem
  a `pointer-coarse:h-10`; `xl` já é 40. Medido a 375px antes da regra existir:
  `sm` era uma caixa de 28px carregando uma linha de 24, e **três dos quatro
  degraus ficavam abaixo do alvo que o dedo acerta** — no telefone a hierarquia
  de altura não é usável, ela só produz alvos pequenos de tamanhos diferentes.
  O piso é 40 porque é o degrau que a `Toolbar` publica em `--toolbar-control` e
  o `Tabs` aplica; **44 continua sendo o alvo _solto_**, sem linha nem trilha em
  volta (item de menu, `Pagination`). A pergunta é sobre o **apontador** e não
  sobre a largura, pela mesma razão que `hover: hover` é. A escada e o recuo
  moram em `fieldControlHeightClassName` e `fieldControlPaddingClassName`
  (`lib/field-classes`), e `field-control-ladder.test.ts` **proíbe os oito
  controles de reescrever a altura à mão** — ela já esteve em cinco grafias, e
  nenhum teste as via.
- **`Button`** ainda tem a coluna `icon-*`, que espelha a de texto degrau a
  degrau: `icon-xs` 24 … `icon-xl` 40. **Espelha a caixa, não o tipo**: só
  `xs` e `sm` da coluna de texto descem o `font-size`, e nenhum `icon-*` o
  declara. Num botão de ícone isso é invisível; quem põe texto num `icon-*` —
  hoje só a `Pagination` — declara o corpo junto (ver a rodada 71). Botão de ícone ao lado de botão de texto
  usa o par, não o vizinho. `xs` e `icon-xs` são para dentro de outro controle,
  não para uma linha de formulário. A exceção nomeada é a `Pagination`, cujo padrão é `xs` por
  decisão do dono, contra esta régua (rodada 72).
- **Não existe `size="default"`** em `Button`, `Input`, `SelectTrigger` nem
  `NativeSelect`, e não existe `size="icon"` em `Button`. O nome `default` dizia
  *o padrão* e apontava para 36, que deixou de ser o padrão quando `md` assumiu.
  Foram removidos dos tipos, então o compilador acusa quem os escrever — os
  substitutos são `lg` e `icon-lg`.
- **O `Tabs` entrou na escada, e a exceção que ele tinha era uma conta
  errada.** O texto anterior dizia que `TabsList` é contêiner com `p-1` e que
  "a 32 o gatilho interno cairia a 24", logo ficava em 36. A conta faz 36 − 8 =
  28 e para: ela nunca subtraía o `-1px` do `h-[calc(100%-1px)]` que o próprio
  componente escrevia. **O gatilho media 27** — abaixo do piso de 28 —, e a
  altura declarada protegia um piso que ela já violava. A raiz é ancorar a
  escada no **contêiner**, o mesmo defeito que o `Menubar` teve e corrigiu.
  Hoje `size` mede o gatilho (`sm` 28, `md` 32, `lg` 36) e a bandeja deriva
  (`gatilho + 8`); a bandeja padrão passou de 36 para 40, porque `md` é o padrão
  do sistema, e `size="sm"` reproduz os 36 de antes com o gatilho correto.
  [`tabs-size-ladder.test.ts`](src/components/ui/tabs-size-ladder.test.ts) tranca
  isso, e a asserção que vale é a de que **a lista não declara altura nenhuma**.
  `Toggle`, o campo do `Command` e a célula da `Table` já valiam 32 e não se
  mexeram.
- **`Card` tem dois eixos, e eles são independentes**: `variant` decide a
  **superfície** (`outline` chapado — o padrão —, `elevated` levantado, `muted`
  material de segunda ordem, `plain` sem borda nem preenchimento, `brand` o
  `outline` com o brilho de marca na borda — uma por tela); `padding`
  decide o **ritmo interno** (`none` | `sm` | **`md`, o padrão** | `lg`), numa
  medida só que o casco usa para separar os blocos e os slots para recuar.
  **`padding="none"` é o painel** — o corpo sangra até a borda e as tiras
  mantêm os seus 16px —, e é a forma mais comum do app. **Não existe
  `size`**: o `size="sm"` de antes era `gap-0 py-0` com o nome errado, saiu do
  tipo, e o substituto é `padding="none"`.
- **As três tiras do `Card` sangram até a borda, e o casco recolhe o próprio
  respiro daquele lado sozinho**: `CardToolbar` (barra de topo — rótulo à
  esquerda, contagem ou ação à direita), `CardFooter` (ações, mesma tinta da
  barra) e `CardNote` (letra miúda que ninguém clica, mais quieta). Não
  escreva `rounded-t-xl`, `pt-0` nem `border-b bg-muted/30` à mão: as 24
  barras e 18 notas inline do app são o invariante 1 sendo violado 42 vezes.
  `CardHeader` **não** é a barra — ele compartilha a superfície do corpo e vive
  dentro do respiro.
- **Cartão clicável é o link, não um link em volta dele**: `interactive`
  (elevação no cursor, par `active:` para o toque, anel de foco) + `asChild`
  com um `<Link>` dentro. **`Card` não tem `tone` de dinheiro** — o tom de
  entrada e saída de um número é o `StatCard`, e desde a rodada 223 ele não
  tinge a superfície: pinta o ladrilho do ícone, o número e a faísca.
- **O `Card` ganhou as versões que as telas escreviam à mão** (rodada 204).
  **Não há `tone`**: um cartão tingido de estado saiu igual ao `Alert` e foi
  removido a pedido do dono — aviso é `Alert` (as notas da fatura viraram
  `Alert size="sm"`). `inactive` esmaece o
  item pausado (nenhuma tela escreve `opacity-[0.82]`); `selected` é o "este é
  o seu"; `orientation="horizontal"` põe a `CardMedia` ao lado de um
  `CardBody` e empilha no telefone; `variant="dashed"` é o lugar vazio ou o
  "adicionar". `CardHeader media` é o ícone, o ladrilho ou o avatar centrado
  nas duas linhas; `CardTitle size` é `sm` · **`md`** · `lg`, e o `text-base`
  escrito à mão saiu. **`CardLink` é o link esticado**: o título leva o link
  (ou o botão de abrir) e o `::after` cobre o cartão; o casco ergue os outros
  botões a `z-10` e dá a sombra e o anel de foco — é o cartão clicável **com
  ações dentro**, que `interactive asChild` não pode ser (botão não aninha em
  link). `CardField` é o ladrilho rótulo/valor das folhas de detalhe,
  `CardMessage` o erro ou vazio curto (`destructive` é `role="alert"`) e
  `CardSkeleton` o esqueleto da forma do painel. E sob `padding="none"` o
  `CardContent` não precisa de `p-0`: não há recuo para zerar.
  `card-versions.test.ts` tranca as peças e proíbe as três grafias à mão.
- **`Alert` tem três eixos, e o da cor se chama `tone`**: `default` | `info` |
  `success` | `warning` | `destructive`. **Não existe `variant` para a cor** —
  ele saiu do tipo, porque neste projeto as cinco cores semânticas se chamam
  `tone` em `StatCard`, `Progress`, `Timeline` e `AnnouncementBar`, e o `Alert`
  era o único a discordar. `variant` agora é a **forma**, e são **duas**:
  `soft` com moldura — o padrão — e **`brand`**, a caixa neutra com o brilho de
  arco-íris na borda, para quando quem fala é o produto e não o dado da pessoa.
  **Havia um `plain`** (tingido sem borda, para dentro de formulário ou diálogo,
  "onde a moldura já é de outro e mais uma só acrescenta um retângulo"), com 8
  chamadas em 4 telas de acesso, e ele **saiu a pedido do dono**: o custo é que
  esses avisos passaram a desenhar a própria borda dentro do formulário, que é
  o que ele evitava; o caminho de volta é `border-0`. E
  `size` é o **corpo** (`sm` | **`md`**), que encolhe texto, respiro
  e ícone juntos. **`brand` não aceita `tone` nem `size="sm"`** — o primeiro
  por não ter gravidade, o segundo porque `sm` é o aviso que fala com um campo
  e a marca fala uma vez por tela, no corpo inteiro. **A razão do `sm` mudou na
  rodada 119**: na 118 ela era geométrica (a régua precisava de 8px de recuo
  para não encostar no `rounded-xl`, e numa caixa `sm` de 34px sobravam 47% de
  fio), e com a régua substituída pelo brilho essa razão deixou de existir.
  Ficou a semântica, que sempre foi a mais forte.
- **A `AnnouncementBar` ganhou o mesmo eixo** (`variant: "soft" | "brand"`, e o
  `brand` dela é o véu, sem fundo — `bg-transparent`), e os **dois botões
  dela pagaram a rodada 99 com atraso**: herdavam o cinza de `--muted` do
  `tertiary` e o realce pintava duas camadas. No tema claro, onde `--muted` é
  opaco, os quatro tons convergiam no **mesmo** `235,235,235` — o realce
  apagava o tom. **Ninguém viu porque a razão de luminância é 1,007–1,078**: o
  defeito é cromático, e os scripts da casa só medem luminância. Com
  `currentColor` na cor da flor (`--button-bloom-fill` a 15% e 10%, com o par
  `dark:`), 1,16–1,19
  no claro e 1,26–1,30 no escuro, e a assimetria de área (15% no ×, 10% na
  ação) continua.
- **O raio é do componente, e não da variante.** Ele morava dentro do `variant`
  — `soft` trazia `rounded-xl` e `plain` trazia `rounded-lg` —, e o resultado
  era medível: **14px contra 10px**, dois alertas lado a lado com cantos
  diferentes. Canto não é moldura; o que o `variant` decide é ter borda ou não.
  Ele também **não desce com o `size`**, pela mesma razão que o
  `data-[size=sm]:rounded-md` saiu do `NativeSelect`: raio por degrau é desvio,
  e nenhum outro controle do sistema o faz. Medido depois: **um raio só, 14px,
  nos 13 alertas da página**.
- **O deslocamento do ícone é por degrau, e a conta é `(entrelinha − ícone) / 2`.**
  Ele vivia cravado em `translate-y-0.5` na base, o que é certo só no `md`
  (20 − 16) / 2 = 2px. No `sm` a conta dá 1px, e **todo alerta `sm` saía com o
  ícone 1px abaixo do centro da primeira linha** — pouco para nomear a olho,
  suficiente para o olho notar que algo está torto. Medido depois: desalinho
  **zero** nos dois degraus.
- **O tom do `Alert` chega ao texto.** `AlertTitle` e `AlertDescription`
  herdam a tinta do tom — a descrição a 85% —, em vez de carimbar
  `text-foreground` e `text-muted-foreground` por cima. Cinza sobre superfície
  colorida passa na norma (5,1–5,7:1) mas lê como texto que caiu ali por
  acidente; a tinta tonal dá 6,9–10,8:1. O tom `default` é a única exceção, e é
  porque ali a superfície é neutra.
- **A ação do `Alert` é o `AlertAction`, e ele não declara cor.** É um `Button`
  `tertiary` `size="sm"` cuja borda, tinta e realce saem de `currentColor`,
  então a mesma peça serve os cinco tons e o par `active:` vem junto. Escrever
  `border-destructive/40 hover:bg-destructive/10` num botão dentro de um alerta
  é reimportar a paleta para dentro da tela. **`AlertActions` é só a linha** —
  ver a rodada abaixo, e o `dark:hover:` que a peça carrega de propósito.
- **`Dialog` tem dois eixos**: `size` é a largura (`sm` 384 | **`md` 448, o
  padrão** | `lg` 512 | `xl` 576) e `layout` é quem manda na altura — `auto` (o
  conteúdo, com o respiro no casco) ou **`fixed`** (a janela, com o corpo
  rolando em `DialogBody` entre cabeçalho e rodapé parados). `fixed` é a forma
  de 14 dos 18 diálogos do app (contados na rodada 211; eram 13 de 25), e era escrita à mão em cinco classes no casco
  mais três em cada corpo rolável. **Não escreva `min-h-0 flex-1
  overflow-y-auto` à mão**: é `DialogBody`, e o `min-h-0` é o que falha calado —
  sem ele o diálogo cresce até sair da tela em vez de rolar.
- **O `AlertDialog` mede pela régua do `Dialog`** (`dialogContentVariants`), e
  não oferece `layout="fixed"`: uma confirmação que precisa de corpo rolável não
  é uma confirmação.
- **`AlertDialogAction` e `AlertDialogCancel` são `Button` de verdade**, com
  `variant`, `size` e `disabled` — e por isso a maiúscula inicial do CTA
  finalmente os alcança. A ação já vem `destructive` (o `AlertDialog` existe
  para o que não tem volta, e foi o que 8 de 8 confirmações pediram); o cancelar
  já vem `tertiary`. **Nunca passe `className={buttonVariants(...)}` nem pinte o
  botão à mão** — as três telas que escreviam `bg-destructive
  text-destructive-foreground` saíam com um fio verde em volta, porque o
  `border-primary` do `primary` sobrevivia embaixo.
- **O cabeçalho do `Dialog` é alinhado à esquerda nas duas larguras.** O
  `text-center sm:text-left` que vinha do shadcn centralizava o título no
  telefone — e dentro de um `DialogHeaderRow`, que é grade de duas colunas, ele
  centralizava numa coluna que termina a 131px da borda: um eixo que não é o de
  nada.
- **O × não reserva lugar** (é `absolute`), então o título e a coluna do adorno
  desviam do território dele por conta própria — e só quando há um × para
  desviar. Sem isso, um título longo ou um `endAdornment` passa por baixo do
  botão em 16px, medidos.
- **O rodapé sangra por variável** (`--dialog-bleed`), não por número: em `auto`
  ela desconta o recuo do casco, em `fixed` não há o que descontar. O `-mx-4
  -mb-4` anterior pressupunha um `p-4` que a forma dominante do app não usa, e
  era por isso que sete telas o anulavam com `mx-0`. (O fio do cabeçalho também
  sangrava por ela; ele deixou de existir — ver a dissolução, mais abaixo.)
- **Superfície ancorada é uma só, e é o `Sheet`** — conteúdo e navegação,
  formulário e menu. Ele tem `side` (de qual borda entra) e `variant`
  (`floating` com calha de 8px — **o padrão desde a rodada 222** — ou `flush`
  encostado), e **no telefone tudo vira
  gaveta — menos quem pede `surface="panel"`**. Esse eixo fixa o painel em
  qualquer largura, o padrão `auto` é a regra de todas as ~40 folhas do app, e o
  **único** consumidor é a navegação: um menu entra pelo lado, não sobe do
  rodapé com alça para listar seis links. Não há como forçar a gaveta — para
  isso existe o `Drawer`. Na `Sidebar` **não há `side`** desde a rodada 221
  — a navegação mora sempre à esquerda, por decisão do dono (o eixo da rodada
  65, com `order-last` e as margens espelhadas, saiu) —, e o
  `floating` — **o padrão desde a rodada 221** — é uma placa **chapada**
  (`--sidebar`, o anel de 1px e a sombra dos outros flutuantes): o vidro
  pintado saiu, porque ela reserva a própria calha e não há o que borrar
  atrás. Isto **inverte** a rodada que criou o `EdgePanel`: ela separou os
  dois porque a `Sidebar`, pegando a folha emprestada, abria como gaveta de
  baixo com alça de arraste para listar seis links, e a regra passou a ser que
  navegação continua painel em qualquer largura. A rodada 64 aceitou a gaveta de
  volta e dissolveu o componente — sem consumidor que precisasse do painel em
  toda largura, ele era uma segunda API para a mesma moldura.
- **Folha é coisa de desktop; no telefone ela é gaveta.** `Sheet` escolhe a
  superfície sozinho: acima de 768px é o painel do Radix deslizando de uma
  borda; abaixo, é uma gaveta do `vaul`, com arraste de verdade. **Não escreva
  `isMobile` para trocar de componente** — a API é uma só, e `side` simplesmente
  não vale no telefone. O que motivou a regra: o app desenhava a alça de gaveta
  com uma `div` `aria-hidden` e nenhum handler, e a "física" eram dois keyframes
  de CSS. Trinta e sete telas prometiam o arraste sem entregá-lo, enquanto o
  `vaul` estava instalado com zero usos.
- **As três superfícies modais são a mesma primitiva.** `Dialog`, `Sheet` e o
  `vaul` se apoiam todos em `@radix-ui/react-dialog`, e há **uma instância só**
  em `node_modules` — verificado em runtime, com o `aria-labelledby` da gaveta
  apontando para o `id` do `DialogTitle`. É o que faz uma cromagem servir os
  três. **Se as versões divergirem e o npm instalar duas cópias, o título passa
  a lançar dentro da gaveta**: é a premissa a olhar antes de mexer em
  dependência.
- **`Sheet` é só a superfície.** Ele tem `Sheet`, `SheetTrigger`, `SheetClose`,
  `SheetPortal`, `SheetOverlay` e `SheetContent` — e nada mais. **Não existem
  `SheetHeader`, `SheetFooter`, `SheetTitle` nem `SheetDescription`**: a
  cromagem vem do `Dialog` (`DialogHeader`, `DialogHeaderRow`, `DialogTitle`,
  `DialogDescription`, `DialogBody`, `DialogFooter`), e funciona porque as duas
  **são a mesma primitiva do Radix** — `Sheet` é `Dialog.Root`, então
  `DialogTitle` encontra o contexto de que precisa dentro de um `SheetContent`.
  A duplicação não era teórica: 18 dos 31 arquivos que usavam a cromagem da
  folha já importavam a do diálogo no mesmo fonte, porque a mesma tela é
  `Dialog` no desktop e `Sheet` no telefone.
- **`SheetContent` declara o mesmo contrato que `DialogContent`** —
  `--dialog-px`, `--dialog-bleed`, `--dialog-close` e `data-layout` —, e é isso
  que faz a cromagem funcionar nos dois. O recuo da folha é **16**, o do diálogo
  é 24: a folha encosta na borda da tela e o dedo já está ali. Um cabeçalho de
  folha costuma querer `hideSeparator` — ali o fio some, porque a alça e o
  contorno da gaveta já dizem onde ela começa.
- **`Drawer` é a gaveta que não muda com a largura.** `Sheet` **troca de
  superfície** (painel acima de 768px, gaveta abaixo); `Drawer` é gaveta sempre.
  Escolha-o quando o gesto é a afordância, e não uma consequência de a tela ser
  estreita. Até a revisão dele o arquivo era o do shadcn intacto, sem nenhuma
  tela, e repetia o defeito que a rodada do `Sheet` tirou de 37: a alça era uma
  `div` decorativa, sem `data-vaul-handle`, sem área de toque, sem gesto —
  **desenhava a promessa do arraste** enquanto a física ficava na documentação.
  Agora é `DrawerPrimitive.Handle`, com os 44px de alvo que o `vaul` injeta.
  Junto vieram as decisões que a folha já tinha: `--z-sheet` em vez de
  `--z-modal`, `bg-background` em vez de `bg-popover`, `dvh` + área segura em
  vez de `80vh`, e `repositionInputs`.
- **A cromagem do `Drawer` também vem do `Dialog`.** `DrawerHeader`,
  `DrawerTitle`, `DrawerDescription` e `DrawerFooter` **saíram do arquivo**,
  pela mesma razão que a folha nunca os teve — e o daqui divergia, centralizando
  o título contra a decisão de que o cabeçalho é alinhado à esquerda em toda
  largura. `direction` aceita só `bottom` e `top`: o `[data-vaul-handle]` do
  `vaul` declara `touch-action: pan-y`, então a alça só arrasta na vertical, e
  uma gaveta lateral teria a alça de enfeite outra vez. Borda lateral é o ramo
  desktop do `Sheet`. A alça é uma peça só — o `DragHandle`, que mora no
  [`drawer.tsx`](src/components/ui/drawer.tsx) desde a rodada 159, sem arquivo
  nem página próprios, e é documentado na página do `Drawer` —, que a folha e a
  gaveta compõem (o `Sheet` a importa dali, junto com o véu `SHEET_OVERLAY_CLASS`), e todo `!` dela é o que troca o cinza literal
  e as medidas que o `vaul` injeta numa folha de estilo própria.
- **A alça é da superfície.** No telefone o `vaul` a desenha e ela **é** a área
  de arraste; no desktop não há alça, porque a folha lateral não se arrasta.
  Uma tela nunca a escreve — as **31 chamadas em 27 arquivos** que faziam isso
  saíram na rodada 34, junto com o `MobileSheetFormDragStrip`.
- **A folha não injeta o ×, e não existe `showCloseButton` nela.** O botão é
  uma peça: `DialogCloseButton`, composta como último filho do `SheetContent`.
  Ele saía de fábrica e **16 das 36 chamadas o desligavam**, porque um ×
  flutuante passa por cima do conteúdo e some atrás de um cabeçalho fixo assim
  que a pessoa rola — dentro de um cabeçalho, o lugar dele é o `endAdornment` de
  um `DialogHeaderRow`, e ali ele vai com **`placement="inline"`**: o eixo
  nasceu na rodada 60, quando o `MobileSheetFormHeaderCloseButton` (que existia
  só para isso) foi absorvido junto com o resto do chrome de folha. A reserva de
  espaço no título vem de **haver** um ×, detectada por
  `has-[>[data-slot=dialog-close-button]]`, não de um prop. O `DialogContent`
  mantém o `showCloseButton`: lá a conta se inverte (só 1 de 18 o desliga,
  contado na rodada 211; eram 6 de 25),
  porque um diálogo é curto e o conteúdo não rola por baixo do botão.
- **Um `Popover` é um `role="dialog"`, e ele precisa de nome.** O
  `Popover.Content` do Radix carimba o papel e **nunca escreve
  `aria-labelledby`** — um diálogo sem nome é anunciado como "diálogo", e nada
  mais. `PopoverTitle` era uma `<div>` tipada como `h2`, sem `id` e sem ligação
  com o conteúdo; o `MobileAccountMenu` chegou a escrever um
  `<PopoverHeader className="sr-only">` justamente para nomear o popover, e o
  texto não chegava ao papel. Agora `PopoverTitle` e `PopoverDescription` se
  **registram**, e o conteúdo só aponta `aria-labelledby` / `aria-describedby`
  quando eles existem — apontar para um `id` ausente deixa o nome vazio, que era
  o estado anterior. Popover sem rótulo visível leva o par em `sr-only`.
- **O `Popover` ganhou a escada de largura, a seta, o × no cabeçalho, a
  confirmação curta, a mola, a gaveta e o nome num prop** (rodada 220).
  `size` é `auto` · `sm` 224 · **`md` 288** · `lg` 352 · `trigger` — **nenhuma
  tela escreve `w-auto`, `w-max`, `w-[min(…)]` nem
  `w-[var(--radix-popover-trigger-width)]`**. `PopoverArrow` (a segunda cópia
  da tinta da placa, a do `HoverCard` é a primeira) para o gatilho que é um
  entre iguais; `PopoverHeader closeButton`; `PopoverConfirm` é a confirmação
  de baixo risco (`alertdialog`, a `Promise` trava e fecha) — o que não tem
  volta continua `AlertDialog`. A entrada é a mola dos menus. **`mobile="sheet"`
  troca o `modal={isMobile}` à mão** por uma gaveta, onde `PopoverTitle` vira
  `DialogTitle`. `label` é o nome sem título à vista, e em desenvolvimento um
  popover que abre sem nome avisa no console.
- **O teto e a folga do `Popover` vêm de fábrica**:
  `max-h-(--radix-popover-content-available-height)` com `overflow-y-auto`, e
  `collisionPadding` 8. A variável já era calculada pelo Radix e só o
  `FormPickerPopoverContent` a lia — sem ela um popover alto sai da tela, e sem
  a folga ele encosta na borda. Quem gerencia a própria rolagem declara
  `overflow-hidden` e vence. E título sobre descrição é **par de identidade**:
  `PopoverHeader` não tem `gap`.
- **O seletor devolve o foco ao fechar, e não rouba ao abrir.** Os dois
  `AutoFocus` vinham prevenidos. Com o mouse isso não aparece — o foco nunca sai
  do gatilho —, mas o campo de busca vive **dentro** do popover, então o caminho
  de teclado é o caminho normal, e ali fechar deixava o foco no `<body>`:
  medido, tanto ao escolher quanto no Esc. A justificativa (o salto de rolagem)
  vale para **abrir** e não para fechar, porque o Radix já devolve o foco com
  `element.focus({ preventScroll: true })`. Abrir continua sem roubar o foco: lá
  a razão é o teclado do telefone.
- **`type="search"` traz um × que não é seu.** O WebKit desenha o próprio botão
  de limpar (`::-webkit-search-cancel-button`) em azul do sistema, na medida do
  sistema, sem conhecer o tema escuro nem a escada de controles. A semântica
  fica — é ela que dá a tecla "Buscar" no teclado do iOS —, mas o desenho é
  suprimido com `appearance-none` e o botão é nosso — o × redondo da pílula
  de busca, que só aparece quando há texto. Vale para qualquer campo de busca
  do app: é o `SearchInput`.
- **A raiz do seletor é quem sabe do telefone.** `modal={isMobile}` vem de
  fábrica — sem isso, rolar a lista arrasta a folha que a contém, e o dedo não
  distingue as duas. As três telas tomavam essa decisão sozinhas, com a mesma
  resposta.
- **`DropdownMenu`, `ContextMenu` e `Menubar` são a mesma superfície**, e ela
  mora em [`lib/menu-classes`](src/lib/menu-classes.ts) — os três só diferem em
  como são invocados. Antes divergiam em **todas** as medidas: item 32 contra 28,
  raio 8 contra 10, borda contra anel, `bg-muted` contra `bg-border`, e o
  dropdown sem teto de altura nenhum. O `Dropdown` estava em 21 telas e era o
  mais atrasado; o `Context`, em zero, e era o mais moderno — venceu a régua
  dele, que já concordava com `Select`, `Menubar` e `Popover`.
- **A linha de lista acende como o link do catálogo** (rodada 137). A cor de
  fundo esmaece em 300ms de `--ease-emphasized`, na entrada e na saída
  (`menuItemFadeClassName`, em `menu-classes`), nos três menus, no `Select`,
  no `Command`/`Combobox` e no painel do `NavigationMenu`. **Duas tentativas
  foram recusadas pelo dono:** o realce que viajava entre as linhas e o disco
  do `button-fill` crescendo sob o ponteiro. Não volte com elas.
  `menu-fade.test.ts` tranca as duas.
- **A linha do menu cresce no toque, não no telefone.** `pointer-coarse:min-h-11`
  leva o item de 28 para 44px quando o **apontador** é grosso — medido nos dois
  ponteiros. A pergunta é sobre o dispositivo e não sobre a largura, pela mesma
  razão que `hover: hover` é (ver `tailwind-hover-policy.test.ts`): um telefone
  em paisagem continua grosso, um desktop estreito continua fino.
- **Rádio é ponto, caixa é tique.** Os dois menus usavam o mesmo `CheckIcon`
  nos dois indicadores, o que apaga a diferença entre "escolha uma" e "marque
  quantas quiser". O ponto segue a decisão já tomada no `Radio`: um
  círculo não precisa ser SVG, e o Heroicons não traz círculo puro.
- **Variante empilhada é seletor de descendente.** `group-hover/x:group-data-[y]/x:`
  compila para uma **cadeia**, e quando as duas apontam para o mesmo elemento o
  seletor não casa com nada. Quando um valor depende de dois estados ao mesmo
  tempo — no alternador de tema, de que lado está o polegar **e** se há cursor —,
  a saída é inverter quem carrega o quê: **o estado mora em variável na raiz, e
  o hover só troca qual variável o filho lê**. Cada classe fica com um variante
  só. O exemplo era um par `--theme-blob-*` no `AppThemeToggle`, e **os dois
  deixaram de existir** — o blob saiu quando o realce virou tinta, e o
  componente virou `ThemeToggle` na rodada 79. A lição não depende deles: o
  `--disclosure-nudge` da linha de divulgação é a mesma saída, viva.
- **`hover:` e `dark:` empatam em especificidade, e o `dark:` é emitido depois.**
  `&:hover` e `&:is(.dark *)` são ambos 0,2,0, então no tema escuro um
  `dark:bg-*` **anula** o `hover:bg-*` — silenciosamente, e só num tema. Medido no
  alternador de tema (então `AppThemeToggle`), onde o hover estava morto no
  escuro havia tempo. Quem pinta
  fundo diferente no escuro precisa do par `dark:hover:`, como o `Button` já faz
  com `dark:hover:bg-muted/50`.
- **Classe montada em tempo de execução não existe.** O Tailwind varre o código
  como **texto**: `` `max-h-(--radix-${prefix}-content-...)` `` nunca chega ao
  CSS, porque a string não aparece em fonte nenhuma. Medido: a variável do Radix
  valia 318,75px, a classe estava no elemento, e o `max-height` computado era
  `none`. Por isso as duas classes que carregam o nome da primitiva ficam
  escritas por extenso em cada menu, e não na superfície compartilhada.
- **`DropdownMenuContent` tem `size` e `variant`, e os dois saem de contagem.**
  `size` é **largura** (como no `Dialog`): `auto` — o padrão — mais `sm` 176,
  `md` 192, `lg` 208, `xl` 224. Das 25 chamadas do app, **18 declaram só uma
  largura**, e sempre uma dessas quatro: `w-44` (8×), `w-48` (5×), `w-56` (3×),
  `w-52` (2×). O eixo não inventou escala nenhuma — deu nome à que já existia.
  `variant="panel"` é o que o `UserMenu` e o `WorkspaceSwitcher` montavam à mão
  (`rounded-xl p-0` mais sombra e anel próprios): ali dentro não há comandos, e
  sim cabeçalho de conta e blocos. A casca cede o recuo, como o `Card` faz em
  `padding="none"`.
- **O painel tem faixas, e quem chama não as desenha.** `DropdownMenuHeader`
  sangra até a borda; `DropdownMenuSection` devolve o recuo
  onde há comandos. A seção não é enfeite — o `-mx-1` do
  `DropdownMenuSeparator` sangra exatamente aquele `p-1`. Sem ela o painel saía
  com **dois traços horizontais de larguras diferentes** (224px o do cabeçalho,
  216px o do meio), que é o mesmo defeito que o `DialogHeader` já tinha
  corrigido com `--dialog-bleed`. A primeira versão do `panel` tentou
  compensar com `[&_[data-slot=…-separator]]:mx-0 my-0` e piorou: matou também
  o respiro vertical do fio. Compensar geometria por seletor é sintoma de que
  falta uma peça.
- **O fio entre a identidade e os comandos é do slot, não da faixa.** A faixa de
  identidade do painel **não rotula** os comandos abaixo dela — ela é um bloco
  de outra natureza empilhado sobre uma lista, e a fronteira entre os dois é a
  mesma que o painel já marca entre grupos com `DropdownMenuSeparator`. Por
  isso ela mantém o fio, no mesmo peso (`border-border`): é o traço que divide
  **itens**, não superfícies — a categoria que nunca o perdeu. A dissolução do
  viewport não disputa com ele, porque diz outra coisa ("há mais conteúdo
  acima"); e o painel do `UserMenu` **não rola**, então sem o fio a identidade
  ficava sem fronteira nenhuma. Medido: fio, separador e painel todos a 224px,
  na mesma cor.
  **Ele mora no slot `header`, e não em `DropdownMenuHeader`**, porque o
  consumidor real do padrão não usa aquela peça — o `UserMenu` passa um
  `DropdownMenuLabel` com um `AccountMenuUserSummary` dentro. Regra escrita na
  faixa alcançaria o catálogo e deixaria o app de fora, que é exatamente como o
  `border-t` do `DialogFooter` já enganou este projeto uma vez.
- **Os três menus ganharam teto horizontal.** `max-w-(--radix-*-content-available-width)`
  entrou junto do teto vertical, que já existia. Sem ele um menu largo perto da
  borda transbordava na horizontal — o Radix já publicava a variável e ninguém
  a lia.
- **`PopoverContent` tem `padding`.** `default` e `none`, e `none` zera o `gap`
  junto, porque as cinco chamadas que anulavam o recuo escreviam `gap-0 p-0` —
  as duas coisas andam juntas quando o popover hospeda um componente inteiro
  (calendário, `Command`, lista).
- **`DrawerContent` tem `variant` e `size`.** `flush` cola nas bordas e
  arredonda só o lado de dentro; `inset` solta a gaveta com margem e cantos
  completos. `size` é o teto de largura acima de 640px — `full` (o padrão, o
  comportamento do telefone), `md` 32rem e `lg` 42rem, as duas centralizando.
  A razão é o desktop: uma gaveta de baixo numa janela de 1900px vira uma linha
  de leitura de 1900px.
- **`FormPickerPopoverEmpty` existe** porque três telas escreviam a lista vazia
  à mão em duas grafias (`px-1 py-6 text-center` e `py-4 text-center`) — e a
  demonstração do catálogo tinha inventado uma terceira. O texto continua de
  quem chama: "nenhuma categoria encontrada" é busca sem resultado, "nenhum
  cartão cadastrado" é ausência de dado.
- **O `Menubar` tem `variant` e `size`, e o `size` mede o gatilho.** `variant`
  é a superfície da fileira (`outline` se sustenta sozinha **e é a única de
  vidro** — ela veste `barSurfaceClassName`, a mesma receita do cabeçalho fixo;
  `plain` entra num cabeçalho que já tem moldura, e fica transparente porque
  quem tem o vidro ali é o cabeçalho; `solid` é bandeja da mesma **tinta** que a
  do `TabsList`, e não da mesma medida — `p-0.5` mais borda contra `p-1`, porque o
  `p-1` do `Tabs` é o que mantém um anel de 3px dentro de uma trilha que rola, e
  uma barra de menus nunca rola) e desce
  por contexto até o gatilho, porque o realce depende de sobre o que ele
  acende — na bandeja ele **sobe** para `bg-background` em vez de tingir, já que
  `--accent` e `--muted` são a mesma cor no tema escuro.
  **`size` mede o gatilho (28 | 32 | 36), e não a barra.** Ancorar no contêiner
  foi o que produziu o defeito medido — barra `h-8` com 3px de recuo e uma borda
  deixava **24px** para o gatilho, o degrau `xs`, que é para dentro de outro
  controle. O `TabsList` era citado aqui como a exceção legítima, "porque as
  abas dele esticam" — e a premissa era falsa duas vezes: `flex-1` dentro de um
  `w-fit` distribui sobra **zero**, então as abas nunca esticaram, e o `Tabs`
  hoje mede o gatilho como esta barra. Não há mais exceção: os dois ancoram no
  gatilho.
- **A `Table` foi redesenhada e o `DataTable` é o motor** (rodada 225).
  **A escada é a altura da linha, em cinco degraus**: `xs` 32 · `sm` 36 ·
  **`md` 44 (o padrão)** · `lg` 52 · `xl` 64 — o `sm` de 28 virou `xs`, o
  `md` de 36 virou `sm` (o `PropsTable` e o `ChartDataTable` o escrevem) e o
  `lg` de 44 dos painéis virou o padrão; o `TablePanel` publica `md`. Eixos
  novos: `dividers` (`rows` · `none` · `grid`), `striped` (em `:where()`,
  abaixo do realce), `pending` (a recarga, a 60% com `aria-busy`) e
  `fade="none"`. A linha tem `state` (`current` com `aria-current`,
  `pending` apagada) e **`interactive` entra no Tab e abre com Enter**; a
  célula tem `pin` (a coluna fixa, opaca, que lê `--table-pin-bg` da linha, e
  cuja sombra só acende com rolagem para aquele lado); o `aria-sort` vai **só
  na coluna ordenada**, e a seta **gira**. Peças: `TableGroupRow` (o total,
  a caixa com indeterminado, a seta que recolhe), `TableRowDetail` +
  `TableExpandButton`, `TableSkeleton` (`headerLabels`, `group={false}`
  dentro de um esqueleto de página), `TableError`, `TableCellIdentity` e
  `TableCellMoney` (`flash`, `tone="none"` para saldo). A cascata
  (`table-reveal`) e o destaque (`table-flash`) moram em `@utility`.
  **O `DataTable` é a `TanStack Table` v9** (`@tanstack/react-table`, com
  `@tanstack/react-virtual`), por baixo do `TablePanel`: ordenar por várias
  (Shift), a busca sem acento, as facetas com contagem, colunas e densidade
  guardadas, a seleção com faixa, grupo e **a barra flutuante** (no `body`,
  porque o painel recorta com `clip-path`), o grupo de linhas
  **consecutivas** (`groupBy` recebe a ordenação e `null` o desliga), o
  detalhe e as sublinhas, as ações à vista e no ⋯ (folha no telefone), o
  menu de contexto com os alvos do `contextMenuTargets`, o **gêmeo do
  telefone** gerado das colunas (`meta.mobile`), o teclado entre as linhas, a
  URL, a virtualização, o CSV para o Excel em português e a edição na célula
  (a única versão em `role="grid"`). Dados do servidor: `manual`. **Na v9 o
  filtro é `constructFilterFn`** e o `arrIncludesSome` pede que o valor da
  linha já seja lista — a faceta é `arrHas`. Transações e assinaturas usam o
  `DataTable`.
- **O `Stepper` é o estado do fluxo desde a rodada 224.** Com `value` +
  `onValueChange` cada `StepperItem` deriva `complete`/`current`/`upcoming` do
  índice — **nenhuma tela escreve `estadoDe(i, atual)`** —, e `state` no item
  vence (é como uma etapa fica `error`). As concluídas viram botão sozinhas
  (as futuras também, com `linear={false}`); **no modo interativo todo item é
  `button`**, desabilitado quando não clica, porque trocar de `div` para
  `button` ao concluir remontava a subárvore e a trilha nascia cheia. As setas
  andam entre os botões, e uma região viva anuncia "Passo 3 de 4, Categorias".
  O desenho: a **trilha enche na mola** (o conector é o trilho com a trilha por
  cima, `scale` direto), o tique estala, a atual tem um anel; `icon`,
  `description` e `optional` no item; `variant="bar"` são segmentos com "Passo
  N de M · Nome"; `orientation="responsive"` troca a fila, no telefone, pela
  contagem com a barra fina. O fluxo: `StepperContent` (só o atual monta, e
  desliza do lado para onde andou), `StepperActions`, `StepperPrevious` e
  `StepperNext` (Concluir na última; `onNext` pode devolver `Promise`, com a
  roda e a trava, e `false` não avança). A raiz passou de `<ol>` a `<div>` com
  a lista dentro. **O `DialogSteps` continua à parte** por enquanto — o dono
  pediu só o catálogo.
- **O `StatCard` foi redesenhado e ganhou as versões de painel** (rodada
  223). **A anatomia**: `StatCardHeader` com o `StatCardLabel` em sobrancelha
  (caixa alta de 11px, o texto cru truncando) e o `StatCardIcon` num
  **ladrilho tonal** à esquerda, a variação no canto, o número embaixo e a
  `StatCardFooter` no pé. **O tom mora no detalhe**: a superfície é a do
  `Card`, e cada tom publica `--stat-tile`, `--stat-tile-ink`, `--stat-figure`
  e `--stat-chart`. `size` vai até o herói (`sm` · **`md`**, que sobe a 24px a
  partir de `sm:` · `lg`, o saldo) e `layout="horizontal"` é a linha compacta.
  **`StatCardValue value` escreve e conta o número** (`format`: `currency`,
  `number`, `percent`; o HTML do servidor já traz o final, e o zero é escrito
  no efeito de layout); com `children`, um `MoneyDisplay` herda o corpo — não
  escreva `size` nele. **`StatCardDelta current previous better`** calcula a
  porcentagem, a seta e o tom de **estado** (`success`/`destructive`, invariante
  3), o "0%" e o "Sem base" — a regra mora em `statCardDelta()`. Peças:
  `StatCardChart` (a faísca na cor do tom), `StatCardProgress` (a meta com
  `BUDGET_BANDS`), `StatCardRange` (mín – máx), `StatCardSplit` (dois ou três
  valores e a barra da proporção) e **`StatCardGroup`** (`separate` ou
  `joined`, um painel dividido por fios; 2 colunas no telefone, `columns` a
  partir de `lg`; a cascata `stat-card-reveal`). **Nenhuma tela declara
  `KpiCard`, `DeltaBadge` nem a conta de variação**: o dashboard, o resumo da
  categoria e as contas usam as peças.
- **O `Sheet` ganhou o redesenho da casa e as versões que as folhas pediam**
  (rodada 222). **`floating` é o padrão**: raio 18, o anel de 1px das placas e
  a sombra, numa placa **chapada** (`--popover`) — o vidro saiu, porque o véu
  já separa a folha da página. Ela **entra na mola e sai em 200ms**, e o
  conteúdo sobe em cascata (`@utility sheet-reveal`; o × de canto da flutuante é círculo um degrau mais escuro que a placa (o texto a 5% no claro, `--background` a 40% no escuro), sem anel nem sombra, porque já está dentro da placa (a tinta da placa o apagava, e `--muted` era claro demais); com movimento reduzido o
  bloco global corta e ela aparece). **O casco de formulário é o de fábrica**
  (`gap-0`, `overflow-hidden`, sem recuo): nenhuma folha escreve `flex w-full
  flex-col gap-0 overflow-hidden p-0`. `size` é a largura das laterais (`sm`
  384, o padrão · `md` 448 · `lg` 512 · `full`); topo e base recebem `none`.
  Na raiz, **`pending`, `dirty` e `confirmDiscard`** são os do `Dialog`, num
  `pedir` só (a pergunta de descarte é importada do `dialog.tsx` — ciclo
  deliberado, os dois só se usam dentro de funções); `modal={false}` é o
  **painel ao lado** (sem véu, clicar fora não fecha); `snapPoints` são os
  degraus da gaveta no telefone. **Folha sobre folha**: a de baixo recua
  (`data-coberta`, 96% e 24px para o fundo), e na gaveta empilha o `vaul`
  (`NestedRoot`). `SheetContent resizable` põe a costura de largura na aresta
  de dentro, com teclado e — com uma string — guardada; ela segue a regra da
  costura do `Sidebar`. **As 8 folhas do app pedem `variant="flush"`** por
  enquanto, por decisão do dono; o material e a mola valem para elas.
- **O `Sidebar` flutua por padrão desde a rodada 221, sem vidro e numa peça
  só.** `variant="floating"` é a placa solta dos outros flutuantes (o
  `--sidebar` chapado, `ring-1 ring-foreground/10`, `shadow-lg`, raio 18); o
  aro, as nuvens e o reflexo da `@utility glass` saíram dela — a utility
  continua para quem a veste. **A pílula do ativo é o `layoutId` do `motion`**,
  na mola do `Menubar`, nas três variantes e do item ao subitem; a medição à
  mão (`offsetParent` e dois observadores) e as `SIDEBAR_GLASS_*` saíram, e o
  hover continua esmaecendo, sem viajar. **Recolher:** o trilho das placas
  soltas anda na mola (é `fixed`, não reflui nada), e a folga da página, a
  margem do `inset` e a barra rente ficam na curva enfatizada; os rótulos
  somem em 100ms antes de a largura fechar e entram com 120ms de atraso,
  subindo 3px. `peek` abre a barra recolhida por cima do conteúdo com o
  cursor parado 300ms, sem mexer na folga nem no cookie. O `inset` é placa com
  anel e a margem anima; no telefone o `floating` vira `Sheet
  variant="floating"`. **Nenhuma tela escreve** o `h-12` do cabeçalho
  recolhido, o `overflow-y-auto` do conteúdo recolhido nem a espera do botão
  `lg` (é `SidebarMenuSkeleton size="lg"`). Ao lado do `floating` o `TopBar`
  não pinta em repouso (o vidro do `glass` e do `scroll` rolado fica) e o
  `SidebarTrigger` é uma pílula da mesma placa — os dois pelo seletor de
  irmão da raiz da barra, sem prop. **Recolhida em ícone no `floating`, o
  gatilho viaja para dentro da barra**, sob o cabeçalho: o mesmo botão em
  dois lugares, com o mesmo `layoutId` (e por isso a barra **não** usa
  `LayoutGroup id`, que prefixaria o id de dentro dela). A vaga dele no topo
  encolhe e o título desliza. O app continua rente
  (`variant="sidebar"`), por decisão do dono.
- **O `NavigationMenu` foi redesenhado na rodada 219**, com a mesma
  referência de movimento: a **pílula flutuante** e o **realce que viaja**
  (`indicator="highlight"`, que descansa no link da página atual) são o padrão
  — a fileira volta a ser o mesmo objeto do `Menubar`. O painel entra na mola,
  os links sobem em cascata (`@utility navigation-menu-reveal`), e há
  `NavigationMenuPanelHeader` e `NavigationMenuPanelFooter` (o "Ver tudo" e a
  legenda das teclas). **`NavigationMenuGroup` aprofunda no lugar**, com a
  trilha em cima; as setas são do painel, na captura (o Radix só as move entre
  links), e o `Esc` sobe um nível antes de fechar. O gatilho ganha o **ponto**
  quando a página atual está no painel dele, e o painel **abre no nível dela** —
  pelo mesmo índice do `Menubar`. Duas medições: o id do grupo **não é
  `useId`** (índice e painel são instâncias diferentes), e com viewport o Radix
  desenha o conteúdo **fora do item** na árvore do React, então o conteúdo
  reenvia o item. Há a **diagonal segura** (o triângulo até o painel; o Radix
  pula o próprio handler quando o nosso chama `preventDefault`), a
  `NavigationMenuPreview` ao lado, o `badge` do título e `mobile="sheet"`.
- **O `Menubar` foi redesenhado na rodada 218**, com a referência de
  movimento do dono (um seletor em cascata): **o realce é um objeto só** que
  viaja entre os gatilhos na mola dela (`layoutId` do `motion`, 0,28s, 20% de
  quique) — e **só na fileira**: o realce correndo entre as linhas do painel
  continua recusado (rodada 137). Com um menu aberto, passar ao vizinho
  **desliza o painel** (o novo entra de onde o antigo estava, o antigo some);
  o painel entra na mola de 97%, as linhas sobem em cascata (`@utility
  menubar-reveal`), o tique estala, o submenu entra de lado. `variant="floating"`
  — **o padrão, a pedido do dono** — é a pílula com sombra, na tinta
  **flutuante** (a régua de barra continua só na `outline`, que passou a ser
  escolha explícita). O gatilho tem `icon`, `count` (sem ele, conta as caixas
  marcadas), `chevron` e `mnemonic` (Alt + letra, sublinhada com o Alt);
  **F10 foca a barra**. O painel tem `title` e `description` (sem ela, os
  rádios marcados). As linhas têm `icon` (as sem ícone recuam sozinhas),
  `shortcut` — **que funciona com o menu fechado** —, `description`, `confirm`
  e o `onSelect` que devolve `Promise`; a caixa não fecha o menu. `search` é a
  busca de comandos e `mobile="sheet"` a folha no telefone. **Tudo isso lê um
  índice**: cada painel renderiza os filhos também num nó que nunca pinta, onde
  cada linha só se registra — então dentro de um `MenubarContent` só vão peças
  do menu. A barra de contas a pagar o usa (filtrar e ordenar, com a escolha
  marcada).
- **O `Tabs` flutua por padrão desde a rodada 226, sem sombra.**
  `variant="floating"` é a pílula da casa: a placa chapada `--popover`, o anel
  de 1px e **nenhuma sombra atrás** (a pedido do dono — ela fica no plano da
  linha de controles); o marcador é a tecla em relevo (`--muted`, anel e
  `shadow-xs`). Ele mede 32 e estica de fábrica, como o `solid`. **O marcador
  corre como o polegar do `ThemeToggle`**: a receita saiu do alternador para
  `lib/liquid-move` (`viajarLiquido`) — o trajeto com inércia, o esticão em
  fase com a velocidade e preso à borda de trás, o volume que se conserva e um
  mergulho no pouso —, em WAAPI e com o esticão proporcional às abas andadas
  (0,11 por aba, teto 0,22). **O estado mora na raiz**: o `Tabs` sabe o
  sentido da última troca (a ordem do DOM), e o `TabsContent` desliza 12px
  desse lado; `urlParam` (`replaceState`, a aba de fábrica não suja a URL),
  `swipe` (56px, bem mais de lado que de pé), `shortcuts` (**⌥1–9**, e não
  ⌘: o Chrome não deixa cancelar ⌘1–9; lido pelo `code`) e `keepMounted`.
  `TabsTrigger` tem `icon`/`iconActive`, `count` (com o espaço real antes) e
  `onClose` (o × é `aria-hidden` — botão dentro de aba é controle aninhado — e
  Delete fecha, levando o foco à vizinha); `TabsList` tem `end` (fora do
  `tablist`, onde mora o `TabsAdd`) e `overflow="menu"` (o excesso vai para o
  **Mais ▾**, e a ativa nunca sai). **Abas que são rotas são `TabsNav` +
  `TabsNavLink`**, num `<nav>` com `aria-current="page"` e sem `role="tab"`.
- **O `Tabs` tem quatro superfícies, e a moldura não é a fileira.** `variant` é a
  superfície (`floating` a pílula — o padrão —, `solid` bandeja, `underline` um fio sob a fileira com
  o marcador pousando nele, `plain` sem nada); `size` mede o **gatilho**;
  `stretch` divide a linha em partes iguais (ligado só em `solid`, porque uma
  bandeja lê como controle segmentado e uma fileira de abas de página não); e
  `scrollable` faz a fileira rolar dissolvendo nas pontas.
  **Quem pinta é uma moldura `<div>` por fora da `Tabs.List`, e a lista não
  desenha nada** — a dissolução recorta o alfa do elemento inteiro, então uma
  bandeja mascarada sairia com os quatro cantos apagados e os lados opacos. E a
  moldura fica **fora**: um nó entre um `role="tablist"` e as suas `role="tab"`
  mexe na posse ARIA. O `p-1` mora na **lista**, não na moldura: `overflow-x`
  recorta no padding box, e com o recuo na moldura o anel de foco de 3px seria
  cortado nos quatro lados. `underline` sempre ocupa a largura toda, porque o
  fio dele **é** a fronteira com o painel — um fio que para depois da última aba
  lê como sublinhado do grupo. `orientation="vertical"` vale nas três, estilizado
  só por `data-orientation`, que o Radix carimba nos quatro nós (nos dois de
  baixo via `RovingFocusGroup`).
  **`scrollable` é opt-in**, e a razão é medida: `scroll-fade-x` declara 36px de
  `scroll-padding-inline`, e ligá-la sempre mudaria o `scrollIntoView` de toda
  barra de abas do app. Ele vence `stretch`, porque os dois juntos não fazem
  nada — com filhos `flex-1` a trilha nunca transborda, e a prop falharia calada.
  O `pointer-coarse:min-h-11` só entra quando **não** há `stretch`: aba de
  largura total já tem área de alvo grande; aba de largura de rótulo com 28px
  não tem.
- **O marcador do `Tabs` é um objeto só, e ele viaja — menos no `plain`.** O
  realce saiu do gatilho e virou um nó (`tabs-indicator`) absoluto dentro da
  fileira: a trilha publica a caixa da aba ativa em `--tabs-indicator-x/y/w/h` e
  o marcador transiciona para ela em `--duration-base` com `--ease-out`. Antes,
  cada gatilho acendia e apagava o próprio realce, e isso **teleporta** — três
  marcadores piscando não dizem o que um marcador se movendo diz.
  **O `plain` não viaja**, e a razão é o trilho: o marcador corre *ao longo de
  alguma coisa*, e a bandeja do `solid` e o fio do `underline` são essa coisa.
  Sem nenhuma das duas, o mesmo movimento vira um bloco preenchido deslizando
  sozinho sobre o fundo — na variante que existe exatamente para não chamar
  atenção. Ali cada gatilho pinta o próprio realce, e a tinta troca com
  `transition-colors`: mudança de cor, não deslocamento.
  **O nó está fora do fluxo**, então animar `width`/`height` nele não reflui
  irmão nenhum; `scaleX` foi rejeitado porque distorce o raio e a borda de 1px
  do `solid`. A medição são dois observadores (`ResizeObserver` na trilha e nos
  gatilhos, `MutationObserver` em `data-state`) — nada de `requestAnimationFrame`
  em laço —, e ela lê `offsetLeft`/`offsetTop` **relativos à trilha**, não
  `getBoundingClientRect`, senão o marcador escorregaria para fora da aba a cada
  pixel rolado em `scrollable`.
  **Sem JavaScript o gatilho ainda se pinta.** Não há caixa para medir antes da
  hidratação, e um marcador sem posição deixaria a aba ativa sem marca na
  primeira pintura — verificado no HTML do servidor: zero nós de marcador, e os
  onze gatilhos ativos com as classes de realce. A troca é um booleano no
  contexto, e **não** um seletor: `in-*` e `group-*` compilam com `:where()`, que
  não soma especificidade, e este projeto já pagou essa medição duas vezes.
  **Movimento reduzido não precisou de regra própria**: o bloco global encurta
  transições para 0,01ms, o marcador salta e o estado final chega igual.
- **O gatilho do `Combobox` é um campo, não um botão.** Ele era
  `Button variant="outline"` — `border-border` + `bg-background` no tema claro —
  enquanto `Select` e `Input` são `border-input` + `bg-input-fill/30`: os dois só
  convergiam sob `dark:`, e no tema claro um combobox ao lado de um select eram
  **duas superfícies visivelmente diferentes** fazendo o mesmo trabalho. Medido
  depois da troca: zero diferença em altura, borda, preenchimento, raio, corpo e
  recuo, nos dois temas. Ele sai do `Button` e, com isso, da garantia de
  maiúscula do CTA — o que é correto, porque placeholder de campo não é rótulo
  de ação.
  **`multiple` é união discriminada**, e por isso `<Combobox multiple={x}>` com
  um booleano não estreita: precisa de literal. A união **nunca desce pelo
  contexto** — o `ComboboxItem` recebe `isSelected` e `toggle`, e não vê
  genérico nenhum.
  **`ComboboxClear` é irmão do gatilho, não filho**, porque `button` não aninha
  em `button`; ele mora no `ComboboxField`, que é um `PopoverAnchor` — sem ele o
  painel sairia com a largura do gatilho e não a do campo. Quem recua para o ×
  é o **rótulo**, não o gatilho: recuar o gatilho empurra o chevron para dentro e
  o empilha sobre o ×, 25px de sobreposição, medidos.
  **O tique não escreve `aria-selected`**: o cmdk usa esse atributo para a linha
  *realçada* pela seta, e sobrescrevê-lo apagaria o cursor de teclado do leitor
  de tela. Quem diz "este é o escolhido" é um rótulo `sr-only`.
- **O `Command` é a quarta superfície de comandos, e o corpo dela é o mesmo.**
  A geometria vem de `menuItemGeometryClassName`; os **estados** ficam no
  arquivo dele porque o cmdk os escreve diferente — a linha ativa é
  `data-selected` e não `:focus`, e `data-disabled="false"` fica **sempre
  presente** no elemento, então a regra por presença dos menus apagaria toda
  linha. **`variant` é a moldura, e são duas.** `bare` (o padrão) não desenha
  borda **nem canto** — ele herda o raio de quem o contém, e é isso que apagou
  uma terceira variante: havia um `dialog` que existia só para cravar
  `rounded-xl` e bater com o casco, ou seja, um número do **contêiner** copiado
  para dentro do componente. Herdando, a paleta acerta o popover (10px), o
  diálogo (14px) e qualquer superfície futura sem saber de nenhuma. `panel` é o
  oposto — borda e sombra próprias, para a paleta solta numa página. Antes
  disso o eixo se chamava `inline | dialog` e decidia só o arredondamento; o
  buraco aparecia na tela, com as quatro demonstrações do catálogo escrevendo
  `border border-border` à mão.
- **O topo da paleta em diálogo não se mexe.** Um `DialogContent` centraliza
  pela altura **real**, e numa paleta isso faz o campo de busca subir e descer
  sob o cursor a cada tecla. O `CommandDialog` fixa o topo onde a caixa cheia
  começaria (`calc(50% - var(--command-dialog-h) / 2)`, com `translate-y-0`) e
  deixa a borda de baixo encolher. Medido: 89, 8, 3, 1 e zero resultados, topo
  constante em 178px, base de 690 a 340. O `top-1/3` do shadcn resolve o mesmo
  sintoma chutando um terço; a conta acerta o centro de verdade.
- **O teto da lista é declarado pela casca, não pela lista.** Ela só lê
  `--command-list-max-h`. Duas armadilhas medidas no caminho: um seletor
  `in-data-[variant=dialog]` que sobreviveu à remoção da variante `dialog` e
  passou a não casar com nada; e o fato de que o `in-*` do Tailwind compila com
  `:where()`, que **não soma especificidade** — uma classe sob esse variante
  perde para a classe base no mesmo elemento. Variável herda e não disputa.
- **A paleta é uma superfície só, e o que separa as faixas é a dissolução.** A
  cor é declarada **uma vez**, na casca (`bg-popover/85` + `backdrop-blur`).
  Houve uma versão com vidro só nas pontas, usando o `bg-background/85` do
  `<header>`, e ela ficava **mais escura que o meio** — `oklch(0.145)` contra
  `oklch(0.205)` no tema escuro. Tom igual só é garantido quando a cor é
  declarada uma vez. O campo de busca repete as medidas do gatilho do cabeçalho
  (`h-8`, `rounded-lg`, `border-border`, `bg-input-fill/30`), porque quem abre a
  paleta vem de clicar nele. E o vidro impôs a sua condição: `backdrop-filter`
  sobre cor opaca não desenha nada, então o casco do `CommandDialog` ficou
  transparente.
- **As tiras de superfície não têm fio nem tinta.** `CardToolbar`, `CardFooter`,
  `CardNote`, `PopoverHeader`, `PopoverFooter`, `DropdownMenuHeader`, o
  cabeçalho da folha e os dois do `Dialog` — nenhum desenha traço nem pinta
  fundo. (O painel do `DropdownMenu` desenha um fio **no slot** que recebe a
  faixa, e é separador de itens, não emenda de superfície — ver acima.) O que separa a tira do corpo é o respiro que ela traz
  (`--card-strip-py`, 12px) e, onde há rolagem, o conteúdo dissolvendo por
  baixo dela. **Uma tira pintada é uma superfície diferente do corpo**, e o fio
  em cima dela é o segundo sinal para a mesma emenda.
  A troca foi aritmeticamente neutra: `py-2.5` mais `min-h-10` davam 40px, e
  12+16+12 dão os mesmos 40 — nenhuma tira mudou de altura, e é isso que tornou
  a migração de **50 cópias** verificável.
  **`CardToolbar` ganhou `variant: label | title`** porque sem tinta o tipo é o
  componente: das 23 barras escritas à mão, 8 eram título e 7 eram rótulo, e
  cravar um só faria as 8 sobrescreverem por `className` no mesmo dia.
- **O que continua tendo fio, e por quê.** Separador de **itens repetidos** —
  `TableRow`, `AccordionItem`, `SelectSeparator`, `ItemSeparator` —, porque ali
  o fio não divide superfície: é o que torna a lista varrível. **Moldura**
  (`border` completo). E `PageHeader`, `TableHeader` e `TableFooter`, que
  ficaram fora do escopo por decisão — o `H2` estava nesta lista, e perdeu a
  régua na rodada da composição.
- **A regra `J` do auditor é o que impede tudo isso de voltar.** Ela acusa fio
  **mais** tinta na mesma classe de uma tira, ignorando moldura. Ela existe
  porque a lição já custou caro: quando o `border-t` saiu do `DialogFooter`, o
  app **não perdeu o fio** — 24 chamadas o repunham à mão, e a mudança do
  componente nunca chegou à tela. Hoje ela está em **zero no app**, com uma
  exceção nomeada no catálogo: o `PreviewCode` desenha fio **e** tinta porque ali
  eles são a emenda entre **duas superfícies** (`card` para conteúdo, `muted`
  para código), e não uma tira. O número que decidiu: o fio dá 1,345:1 contra o
  cartão e a tinta dá 1,053 — **5,5× o trabalho**, e mesmo a 100% a tinta não
  alcança.
- **Nos dropdowns, a dissolução ganha a seta de "tem mais"** (rodada 172, a
  pedido do dono): `ScrollFadeArrows` (`lib/scroll-fade-arrows`) com
  `useScrollFade({ arrows: true })`, no `Select`, nos três menus e nos
  submenus, na pilha do `Command` (a paleta), no `Combobox` (`CommandList
  arrows`, desde que saiu da pilha), no
  `FormPickerPopoverList`, no `PopoverBody` e no `ScrollArea arrows`. O hook
  marca `data-scroll-more-start`/`-end` no rolável e escreve no pai onde ele
  está (`--scroll-fade-box-top`/`-bottom`); as setas são irmãs logo depois do
  rolável, acendem por `[data-scroll-more-end] ~ &` e pousam na borda da
  **lista** somando as faixas de sangramento — senão, no seletor, a de baixo
  cairia sobre o rodapé. São indicação: sem altura, sem clique, `aria-hidden`.
  Por isso a superfície dos menus e o `PopoverContent` ganharam `relative`.
  A peça mora em `lib/` e não em `ui/` porque o `Select` é átomo e já importa
  o seu único componente (`Caption`).
- **Um dropdown não passa de 288px de altura** (rodada 174, a pedido do dono):
  `--menu-max-h` (`--spacing(72)`, o mesmo teto da lista do `Command`) é
  declarado na superfície flutuante (`menuPanelSurfaceClassName`) e lido no
  `max-h-[min(var(--radix-*-content-available-height),var(--menu-max-h))]`
  do `Select` e dos três menus — o espaço disponível continua valendo quando
  é menor. O `FormPickerPopoverContent`, com busca e rodapé, para em 384px,
  para a lista ficar nos mesmos ~288. O `DropdownMenu variant="panel"` não é
  lista e devolve o teto à altura disponível (`[--menu-max-h:100dvh]`).
- **A opção de ausência de um `Select` é `variant="none"`** (rodada 173):
  "Sem categoria", "Não informado", "Qualquer plano" — esmaecida na lista e
  no gatilho, com o próprio separador, sem travessões. Ela é para quando não
  escolher é uma resposta; campo obrigatório vazio é o `placeholder`, com o
  valor vazio. `SelectItem description` é a linha de explicação, só na
  lista. **A geometria da opção e o respiro da lista são do componente**:
  nenhuma chamada escreve `py-*`/`pl-*`/`pr-*` no `SelectItem` nem `p-1` e
  `min-w-[var(--radix-select-trigger-width)]` no `SelectContent`.
- **Quem recebeu a dissolução, e quem não.** `Command`, `ScrollArea` (as variantes de borda),
  `FormPickerPopover` (com as 3 telas migradas para as peças dele), `Sidebar`,
  `Table` (eixo X) e os viewports de `DropdownMenu` / `ContextMenu` / `Menubar`.
  **E o `Dialog`**: o `DialogBody` dissolve nas duas bordas, e **os fios saíram
  de vez** — o separador do cabeçalho e o `border-t` do rodapé, nos dois
  layouts, no `Dialog` e no `AlertDialog`. Com eles saiu o prop
  `hideSeparator`, que existia para desligar o fio e era usado por 9 chamadas.
  Uma primeira versão manteve o fio em `layout="auto"`, argumentando que ali
  nada rola e o fade nunca apareceria — e isso criava uma costura visível: um
  `fixed` de conteúdo curto também não rola, e ficava **sem** fio nenhum,
  enquanto um `auto` igualmente curto ficava com **dois**. Mesma situação
  visual, dois tratamentos. O diálogo é uma superfície só; o que separa as
  faixas é o respiro, e a dissolução onde há rolagem.
  **E o `Select`, desde a rodada 166**, no viewport do Radix, com as faixas de
  rolagem do Radix fora: o padrão virou `popper`, e ali quem leva o item escolhido à
  vista é o `scrollIntoView`, que respeita o `scroll-padding` da primitiva
  (medido, o 25 reabre a 48px da base, fora dos 44 da zona). O
  `item-aligned` continua abrindo dissolvido, porque escreve `scrollTop` à
  mão, e nenhuma tela o usa. **Fora, por mecanismo:** o
  `DropdownMenu variant="panel"` — o cabeçalho é filho do viewport e a máscara
  o apagaria; e o `PopoverContent`, porque ele é ao mesmo tempo casca e
  rolável, e um viewport interno quebraria o `FormPickerPopoverContent`, que
  conta com os filhos serem itens de flex diretos. Ali a resposta é compor um
  `ScrollArea variant="fade"` dentro, e a página do catálogo demonstra.
- **Três invariantes que a primitiva carrega, e as três vieram de bug medido.**
  `data-scroll-fade` só alimenta o que **não** é layout (alimentar `pb` foi a
  histerese da rodada anterior); **o elemento mascarado não desenha nada**, e é
  por isso que menu e popover precisam de nó interno — a máscara recorta fundo,
  anel e sombra junto, e os `rounded-lg` de 8px caem inteiros na zona, saindo
  com os quatro cantos apagados e os lados opacos; e **todo `-` binário dentro
  de um `calc()` arbitrário se escreve `_-_`** — o Tailwind normaliza espaço em
  torno de `+`, `*` e `/`, mas não pode com `-`, que seria indistinguível de
  `--var`.
- **Nenhuma das três faixas pinta, e quem marca o limite é o conteúdo sumindo.**
  O `CommandFooter` **não pinta fade nenhum** — ele é transparente e só reserva
  altura para a legenda; quem dissolve é uma `mask-image` na própria
  `CommandList`, um gradiente em preto puro usado como estêncil de alfa. A faixa
  de busca passou a ser igual. **Tirar dela só o `border-b` não bastou, e o
  motivo é aritmético**: ela repintava `bg-popover/85` sobre um casco que já é
  `bg-popover/85`, e dois 85% empilhados dão **97,75%**. No escuro `--popover` é
  mais claro que a página, então a faixa era um retângulo *mais claro* com uma
  aresta na base — o mesmo bloco aceso que o rodapé já registrava ao tentar
  pintar um gradiente. O `backdrop-blur` saiu junto: a borda do borrão desenha a
  linha sozinha. **Quem esconde o conteúdo sob o campo é a rampa, não uma
  tinta** — por isso o topo da máscara não pode voltar a ser opaco até a borda
  da faixa, que foi a primeira tentativa e o que produziu o divisor.
- **Cada ponta dá 44px ao conteúdo, com a mesma curva espelhada e o mesmo piso
  (0,06).** Os 44 têm um nome só, `--command-fade-h`, lido pelos dois lados. A
  curva é **sigmoide** de propósito: uma ease-out sai do chapado com inclinação
  máxima, e descontinuidade de derivada contra superfície lisa é o que o olho
  mais detecta — banda de Mach, numa linha que atravessa a paleta inteira. E o
  piso não desce mais: 0,06 foi escolhido contra o caso mais difícil que existe
  ali (texto do mesmo corpo e peso das linhas, atrás do placeholder), e 0,03 é
  perceptualmente zero, que é o `transparent` já registrado como rejeitado.
- **A zona cresce no passo em que a ponta consome o conteúdo** — em cima com o
  `scrollTop`, embaixo com o que falta rolar —, e nunca liga de uma vez. O item
  da ponta nasce a 4px da faixa e mede 28px, então ele cabe inteiro dentro dela:
  um interruptor o levaria de chapado a um degradê de 15%→80% em 1px de rolagem.
  Nos dois extremos não há zona, e o item da ponta fica nítido.
- **`--command-footer-h` mede só a legenda, e depende da presença do rodapé —
  nunca da rolagem.** Ela já embutiu a pista de dissolução (72 = 28 + 44), e era
  isso que deixava **~44px de branco** entre o último item e a legenda sempre
  que se rolava até o fim: ali não há conteúdo para dissolver. A pista virou
  `--command-foot-fade`, que é máscara e não ocupa espaço.
  **A versão condicionada a `data-scrollable` era um laço**, e um dos sorrateiros:
  `pb` é `footer-h + 4`, então declarar "esta lista rola" *acrescentava 36px ao
  próprio conteúdo* e realimentava a condição que produziu a decisão. Uma lista
  que transbordava 20px virava rolável, ganhava `pb` 76, passava a transbordar
  56, e nunca mais era reavaliada — **histerese**, não divergência, e por isso
  ninguém viu. Medido: uma demo do catálogo com 288 de altura e 297 de conteúdo
  estava marcada como rolável quando, com `pb` de 40, ela não rolaria. **O
  `Combobox` pagava o mesmo sem nunca ter rodapé**: 76px de calha vazia no fim de
  cada popover, e uma lista que só rolava por causa do próprio recuo.
- **`scroll-pb` conta a zona inteira (`footer-h + fade-h + 4` = 84), e isso é
  carga estrutural.** Sem ele o `scrollIntoView` do cmdk deposita o item
  selecionado a 40px do fundo enquanto a zona de baixo chega a 80 — item ativo a
  0,05 de alfa na navegação por seta. A margem já existia antes (76 contra 72),
  mas por acidente.
- **`--command-bottom-y` é a guarda de cruzamento.** As duas zonas somam 172, e
  numa lista mais curta que isso elas se cruzam: o *color-stop fixup* arrasta as
  paradas de baixo para junto das de cima e sobra um degrau em poucos pixels,
  sobre conteúdo real. É alcançável — dentro do `CommandDialog` a lista é
  `flex-1` sob `min(60dvh, 24rem)`, e num telefone deitado ela mede ~144px.
  `max(top-h, calc(100% - bottom-h))` faz a rampa de baixo ceder em vez de
  inverter. **E os `_` da classe arbitrária não são cosméticos**: escrita com
  espaços literais, `calc(100% - …)` encerra o token do Tailwind no meio, a
  variável não é declarada, a rampa vira inválida em cascata e `mask-image` cai
  para `none`. Medido, nesta mesma rodada.
- **A rampa é um gradiente só, com os dois lados dentro dele — nunca duas
  máscaras compostas.** `mask-image: none` é definido como *camada preta
  transparente*, então `none` num `mask-composite: intersect` dá alfa zero e
  **apaga a lista**; e `mask-composite` e `-webkit-mask-composite` são
  propriedades distintas, com valores distintos, cuja ordem de emissão o
  Tailwind não deixa o autor controlar. Com um gradiente só, uma variável
  indefinida derruba a propriedade para `none` — **desliga o fade em vez de
  apagar o componente**. E **a ordem das paradas do topo é o mecanismo**: elas
  são ancoradas por deslocamento *negativo a partir do fim da zona*, com um
  `#000` de bookend antes, e é isso que faz o *color-stop fixup* do CSS
  colapsá-las em opaco quando a zona tem largura zero. Ancoradas ao contrário, o
  mesmo fixup deixaria o fade **ligado e gigante**.
- **O grupo da paleta se separa por respiro e por rótulo, nunca por fio.** Duas
  coisas faziam os grupos lerem como uma fileira só: o cabeçalho era `text-xs
  font-medium`, **o mesmo peso das linhas** e só um degrau menor e mais claro —
  a receita de "linha desabilitada", não de rótulo —, e o `py-1` simétrico o
  deixava equidistante dos dois grupos, pertencendo a nenhum. Agora ele é caixa
  alta com `tracking-wider`, a mesma régua do cabeçalho da `Table`, e o respiro
  é assimétrico: 10px de margem acima do grupo contra 2px abaixo do rótulo.
  **A folga é margem no grupo, não recuo no cabeçalho** — duas propriedades
  diferentes não disputam, enquanto um `pt` base mais um `pt` sob variante
  seriam a mesma propriedade duas vezes, decidida por ordem de emissão do
  Tailwind e não pelo que se escreveu. E o primeiro grupo **visível** não
  recebe a folga por `[cmdk-group]:not([hidden])~&`: o cmdk esconde os grupos
  sem resultado com o atributo `hidden` **sem os tirar do DOM**, então eles
  ficam no meio da fileira — medido buscando "card", `Átomos` sai escondido
  entre `Fundações` e `Moléculas`, e um seletor de adjacência (`+`) perderia o
  segundo grupo visível.
- **A paleta tem três faixas, e a casca não tem recuo.** O campo era um
  `InputGroup` flutuando dentro do `p-1` da casca — uma caixa dentro de outra,
  a 8px de distância, com dois raios concêntricos. Numa paleta o campo **é** o
  cabeçalho: largura toda, rente às bordas, como `DialogHeader` e `CardToolbar`
  — mas sem o fio deles, porque aqui quem marca o limite é a dissolução. O
  recuo saiu da casca e foi para o `CommandList`, que é onde há linhas — e com
  isso o `-mx-1` do separador volta a sangrar exatamente ele.
  `CommandFooter` é a terceira faixa, e ela é **legenda de teclado**: uma
  paleta é interface de teclado, e sem a legenda a pessoa descobre `↑↓` e `↵`
  por tentativa. `CommandHint` não embute o `Kbd` de propósito — quem chama
  escolhe entre desenhar a tecla e escrever o nome dela.
- **`CommandDialog` monta o `Command` raiz, e não montava.** Ele entregava
  `children` direto ao `DialogContent`, então quem chamava tinha de lembrar de
  embrulhar tudo — e das duas chamadas do projeto, **uma esquecia**. O diálogo
  abria e estourava com `Cannot read properties of undefined (reading
  'subscribe')`, o store do cmdk sem raiz; o limite de erro engolia e o botão
  parecia inerte. `commandProps` é a saída para o que a raiz precisa receber.
- **O tique do `CommandItem` nunca acendeu.** Ele era revelado por
  `group-data-[checked=true]`, e **o cmdk não emite `data-checked`** — medido
  no DOM: os atributos de um item são `data-slot`, `data-disabled`,
  `data-selected` e `data-value`. No `Combobox`, que desenha o próprio check,
  cada linha saía com **dois ícones**, um permanentemente invisível. Quem marca
  seleção é quem sabe o que está selecionado, e isso não é a paleta.
- **`Accordion` e `Collapsible` são a mesma interação, e agora dividem uma
  régua.** Ela mora em [`lib/disclosure-classes`](src/lib/disclosure-classes.ts)
  — geometria da linha, marcador, realce, alvo de toque e foco —, pelo mesmo
  precedente de `menu-classes` e `field-classes`. Antes eles divergiam em tudo,
  porque **um desenhava a linha e o outro não desenhava nada**: altura `py-2.5`
  sem nome contra o que o consumidor pusesse, dois ícones se revezando contra
  `rotate-180` e `rotate-90` escritos à mão, `hover:underline` contra nada, alvo
  de toque em nenhum dos dois.
- **A divulgação abre numa mola, nos dois** (`@utility disclosure-reveal` e
  `disclosureMotionClassName`, rodadas 128–129): a altura e o conteúdo andam
  em `--ease-spring`/`--duration-spring` — a mola da `Tooltip`
  (`stiffness 300`, `damping 25`) amostrada num `linear()` de CSS, que passa
  3,8% do alvo e assenta em 500ms. Cada filho sobe 6px, 30ms depois do
  anterior, com teto de 120ms. **Fechar é curva, não mola**: uma mola até zero
  passaria por baixo de zero, e a altura seria cortada seca no meio do
  trajeto. A versão com desfoque e `--ease-out` foi recusada por mecânica. A entrada roda na
  **montagem**, não por estado, e o Radix espera só a animação da própria
  `Content`. **Conteúdo só de texto** não tem filho elemento, e aí quem sobe é o
  envelope — nunca a `Content` do `Collapsible`, cuja animação é a que o Radix
  espera para desmontar. A espiada (`peek`) não a veste.
- **A linha de divulgação entrou na escada, e o piso dela é 32.** `md` 32, `lg`
  36, `xl` 40 — os mesmos números que esses nomes têm em `Button`, `Input` e
  `Tabs`. Ela não desce a 28 porque carrega **frase** e não rótulo de botão, e a
  medida é **`min-h`** e nunca `h`: um rótulo que quebra em duas linhas tem que
  fazer a linha crescer, não ser recortado.
  [`disclosure-ladder.test.ts`](src/components/ui/disclosure-ladder.test.ts)
  tranca isso. Era a terceira porta do mesmo defeito — `Menubar` entregou 24px e
  `Tabs` entregou 27, os dois por ancorar a escada no contêiner; aqui a altura
  era um resto de tipografia, que é pior, porque muda sozinha quando o corpo do
  texto muda.
- **Um marcador que gira, e não dois que se revezam.** O `Accordion` trazia um
  `ChevronDown` e um `ChevronUp` alternando por `hidden`/`inline`. É a decisão
  que a rodada do `Tabs` já julgou, e aqui o conserto era de graça: a seta para
  baixo girada em 180° **é** a seta para cima. Atenção ao medir: **o Tailwind v4
  usa a propriedade independente `rotate`**, então `getComputedStyle(x).transform`
  responde `none` mesmo com a rotação ativa — quem responde é `.rotate`. E
  `transition-transform` na v4 já cobre `transform, translate, scale, rotate`.
- **O realce da linha de divulgação não troca a cor de fundo.** Ele chegou a ser
  `hover:bg-accent/60`, a língua do menu e da lateral — e é errado aqui pela
  razão que separa os dois casos: **aqueles sabem sobre o que estão pousados, e
  um acordeão não.** Ele mora dentro de `Card`, de `muted`, de diálogo e direto
  na página; sobre `bg-muted` o `accent` quase some, e sobre `bg-card` num dos
  temas ele é quase o próprio cartão. Realce não pode depender de uma informação
  que o componente não tem. São dois sinais, e nenhum pinta fundo: o **rótulo**
  sublinha e o **marcador** tinge e se desloca.
- **O sublinhado é do rótulo, e nunca da linha.** O `hover:underline` original
  ficava no botão, e `text-decoration` desce para todo descendente em linha — o
  total em dinheiro do slot `trailing` vinha sublinhado junto, e traço sob número
  lê como rasura. Medido depois do conserto: com o cursor na linha, "Mercado" sai
  `underline` e "−R$ 612,40" sai `none`.
- **A seta se desloca no sentido em que o clique vai levar** — 2px para baixo
  quando o bloco vai abrir, 2px para cima quando vai fechar. A direção depende de
  **dois** estados (cursor e aberto), e variante empilhada apontando para o mesmo
  elemento compila uma cadeia de descendente que não casa com nada: é a medição
  do alternador de tema, e a saída é a mesma — `--disclosure-nudge` na linha,
  `data-[state=open]:` invertendo, e o filho lendo a variável sob um variante só.
  No Tailwind v4 `translate` e `rotate` são propriedades independentes e o
  `translate` resolve **antes** do `rotate`, então os 2px descem na tela mesmo com
  a seta de cabeça para baixo. Por isso a transição nomeia
  `[rotate,translate,color]`: o que se move não é `transform`, e
  `transition-transform` deixaria a tinta trocando de estalo.
- **O anel de foco da linha é interno, e é a única divergência consciente do
  `ring-3` do sistema.** A linha sangra até a borda do bloco: um anel externo ou
  é recortado pelo `overflow-hidden` do `variant="contained"` (nos quatro lados
  da primeira e da última linha), ou cavalga o fio da linha vizinha em `plain` e
  vira um traço duplo de 4px. `focus-visible:inset-ring-3` resolve os dois sem
  exceção por variante — e ele **compila** nesta versão do Tailwind (4.2.2),
  verificado, porque `inset-ring-<número>` não é óbvio que exista.
- **`Accordion` tem três eixos.** `variant` é a moldura (`plain` fio entre itens
  — o padrão —, `contained` uma caixa só com os fios por dentro, `separated` cada
  item solto); `size` é o degrau da linha; `markerSide` põe o marcador antes do
  rótulo, para o acordeão de **estrutura**, onde as setas na mesma coluna deixam
  a hierarquia legível numa varredura vertical. **`separated` não entra num
  `Card`** — cartão dentro de cartão é sempre errado, e aqui tem consequência
  prática: a segunda moldura não desenha fronteira nenhuma que a primeira já não
  tenha. O recuo horizontal é variável (`--accordion-px`, 0 em `plain`, 16 nas
  molduradas), como o `--dialog-px` — e não um número repetido em duas peças.
- **`AccordionTrigger` tem `trailing`, e ele é prop porque a alternativa não
  funciona.** A versão componível exigiria duas margens automáticas na mesma
  linha de flex, e **duas `ml-auto` dividem a sobra em partes iguais** em vez de
  empurrar a segunda para a borda: o valor terminaria flutuando no meio da linha.
- **Nenhum envelope declara como altura a medida que ele próprio produz.** O
  `AccordionContent` trazia `h-(--radix-accordion-content-height)` no nó interno
  — a variável que o Radix escreve a partir do `offsetHeight` **desse mesmo nó**.
  Ela congela na primeira medição, e um parágrafo que reflui (janela estreita,
  tradução longa) passa a ser recortado.
- **`peek` é o "mostrar mais" do `Collapsible`, e o fechado deixa de ser altura
  zero.** Três degraus de leitura (`sm` ~3 linhas, `md` ~5, `lg` ~7), com a base
  **dissolvendo** — a primitiva do sistema, e não um véu pintado. A rampa é
  `min(2.5rem, 40%)`: fixa em 40px ela comia dois terços do degrau curto.
  Ele custa três armadilhas, e as três foram medidas:
  **(a)** `forceMount` é consequência de `peek` e não uma segunda decisão, e o
  `hidden` que o Radix escreve é vencido por `data-closed:block` — o texto
  continua na árvore de acessibilidade, verificado;
  **(b)** os keyframes `collapsible-down/up` saem de cena, senão disputam a
  altura com a transição;
  **(c)** **quem mede não pode ser quem é medido.** O Radix calcula
  `--radix-collapsible-content-height` lendo a caixa da própria `Content`, que em
  `peek` é o nó preso à espiada — ele publicava **100px** como "altura do
  conteúdo" contra um `scrollHeight` de 206, e abrir levava de 100 a 100 com o
  texto recortado. A saída é a da casa: um `ResizeObserver` num envelope interno
  livre escreve `--collapsible-full`, como `useScrollFade` e o marcador do `Tabs`
  já fazem.
- **A espiada desliza, e ela abriu de uma vez por cinco rodadas.** O recálculo
  síncrono que o Radix força ao trocar de estado acontece **na mesma passagem**
  em que o `data-state` vira `open`, e com a altura no CSS
  (`has-[…open]:h-(--collapsible-full)`) as duas alturas nunca apareciam em
  recálculos diferentes. Quatro consertos falharam, e o que falhava em todos era
  a caixa mudar **dentro** daquele recálculo. **O conserto (rodada 130) é tirar
  a altura do CSS**: ela é estilo inline, escrito por `useEspiada`. Um
  `data-state` novo não muda estilo inline, então o `MutationObserver` lê a
  altura de antes e anima até o destino com o `animate` do `motion`: abrir na
  `MOLA` (`lib/spring.ts`, a mesma da `Tooltip`), fechar em 200ms `--ease-out`,
  e `auto` ao fim da abertura. Medido: 60 → 165 → 161px, com o gatilho
  descendo junto; fechar leva 160ms. O movimento reduzido é perguntado à mão.
- **`HoverCard` é um popover que abre com o cursor**, e a superfície dele era uma
  cópia **incompleta** da do `PopoverContent`: faltavam o teto
  (`max-h-(--radix-hover-card-content-available-height)`), a rolagem que o teto
  exige, e o `collisionPadding`. Uma prévia alta perto da borda de baixo saía da
  tela, com o Radix já publicando a variável que ninguém lia. Copiar a casca não
  é o defeito — as classes que carregam o nome da primitiva **têm** que ser
  literais em cada arquivo. Ele ganhou `size` (`sm` 224 | **`md` 256** | `lg`
  320, e o teto é de propósito: acima disso a prévia vira a página que ela
  deveria adiar), `padding` (`default` | `none`, o mesmo eixo do `Popover`), as
  tiras `HoverCardHeader` / `Title` / `Description` / `Footer`, e `HoverCardArrow`
  — o único lugar do sistema onde a seta se paga, porque uma prévia dispara sobre
  **uma palavra dentro de um parágrafo**.
- **`HoverCardBody` fecha o vocabulário de faixas, e ele traz o próprio `py`.**
  Com `padding="none"` o casco cede o respiro e **cada faixa passa a ser dona do
  seu** — o meio não era, então a demonstração do catálogo adivinhava
  `<div className="px-3 pb-1">`, dois números soltos onde existe
  `--hover-card-strip-px`. O `py` não é cosmético: sem ele *tudo* fica a 8px e
  identidade, rótulo, número, datas e rodapé leem como cinco linhas soltas.
  Com ele a distância **entre** regiões é 16 e **dentro** do corpo é 8 — a razão
  de 2 para 1 que separa "outro assunto" de "mesmo assunto". **Ele não rola**,
  pela mesma razão que não existe `Close`: uma prévia que precisa rolar ou se
  reter não é prévia, é `Popover`.
- **Um número sem rótulo é ambíguo, e num app de finanças isso custa caro.**
  A prévia de fatura mostrava `−R$ 1.284,60` sozinho no meio do cartão — pode ser
  o total, o mínimo ou o que falta pagar. O par termo/valor do
  `DescriptionList` é o conserto, e ele existe para isto: a documentação dele
  nomeia "a fatura" como caso de uso.
- **Vocabulário e semântica de estado saem do produto, não da demonstração.** A
  página do `HoverCard` escrevia `Em aberto` num `Badge variant="warning"`.
  O app não fala assim: em `credit-card-display.ts` o ciclo aberto se chama
  **`Aberta`** e é **verde** (`tagChipSuccess`), com o âmbar reservado para
  `Fechada` e o vermelho para `Anterior`. Catálogo que inventa palavra e cor
  próprias ensina a divergir do produto.
- **`HoverCardHeader` tem `endAdornment`, com o nome e a forma do
  `DialogHeaderRow`** — grade de duas colunas, `items-start`, para o `Badge` de
  estado no canto superior direito. O `items-start` é o que prende o adorno ao
  **topo** em vez de centralizá-lo quando a descrição quebra em duas linhas, e
  uma prévia de fatura sempre tem duas. A alternativa (um `absolute` no canto,
  escrito pela tela) é pior de dois jeitos: passaria por cima de um título longo,
  e o recuo do canto viraria um número na tela em vez de
  `--hover-card-strip-px`. **Ele diverge do `DialogHeaderRow` num ponto**: não há
  `space-y-1` no par título+descrição, porque ali é o mesmo dado em duas linhas e
  quem separa é a entrelinha — o `space-y-1` de lá continua no backlog.
- **As tiras do `HoverCard` não levam `shrink-0`, e a do `Popover` leva.** Lá a
  faixa é irmã de um `PopoverBody` com `flex-1`, que a espremeria na vertical.
  Aqui não há corpo com `flex-1`, e a faixa é usada **dentro de uma linha**, ao
  lado de um avatar — nesse contexto `shrink-0` impede o encolhimento
  **horizontal**, a descrição para de quebrar, e como `overflow-y: auto` promove
  o eixo X a `auto` junto (regra da spec: um eixo não-`visible` promove o outro),
  o texto sai **recortado**. Medido: "42 transações" saía "42 transaç".
- **`HoverCard` ganhou o avatar no cabeçalho, o gatilho no texto, o link de
  ver mais, o carregando, o grupo, o toque longo e a mola** (rodada 217).
  `HoverCardHeader media` põe o avatar ou o ícone antes do par;
  `HoverCardTrigger variant="inline"` é o nome num parágrafo, pontilhado, e
  sem `asChild` vira `<button>` (o `<a>` sem `href` do Radix não é focável);
  `HoverCardLink` é o caminho do clique no rodapé; `pending` mostra o
  `HoverCardSkeleton` enquanto o `onOpenChange` busca o dado.
  `HoverCardGroup` zera o atraso enquanto uma prévia do grupo está aberta (e
  por 300ms depois) — conta a **transição**, porque o Radix pede `false` de
  novo para uma já fechada. **No toque, segurar 500ms abre**, o clique do
  soltar é engolido (senão o link levaria a prévia embora) e o `contextmenu`
  do toque para no gatilho, para o menu da linha não abrir junto. A entrada é
  a mola da casa; a saída, não. **A lista de lançamentos usa**: o chip de
  fatura e o "Parcelada" abrem a prévia, e o clique no chip continua abrindo
  a linha.
- **Os atrasos do `HoverCard` são decisão, e o padrão do Radix não serve.**
  `openDelay` 400 e `closeDelay` 200. Setecentos milissegundos numa prévia presa
  a um nome em texto corrido lê como componente quebrado; zero dispara em toda
  passagem de cursor. E **o gatilho precisa ser focável** — o Radix abre no foco
  além do cursor, e em volta de um `<span>` a prévia passa a existir só para quem
  tem mouse.
- **`Progress` — a forma normal é entregar os cortes, não o tom.** `bands={[aviso, perigo]}`
  faz o componente derivar a cor, marcar o limiar na trilha e tratar o estouro;
  `tone` (`default` | `success` | `warning` | `destructive` | `income` |
  `expense`) fica para quem mede algo **sem** escada de risco, e `size` é `sm`
  6px ou `md` 8px. **Desde a rodada 167 há quatro versões a mais**: as peças
  `ProgressHeader` / `ProgressLabel` / `ProgressValue` / `ProgressFooter`, pelas
  props `header` e `footer` (o rótulo nomeia a barra por `aria-labelledby`,
  a menos que a chamada traga `aria-label`, e a barra fica entre as duas no
  DOM), `segments` (casas que acendem cobertas inteiras — parcelas, etapas; acima
  de 24 a barra volta a ser contínua),
  `zones` (com `bands`, o trilho pinta a faixa de aviso e a de perigo no lugar
  do traço do corte) e o `ProgressRing`, o anel de um valor só (32 · 64 · 128,
  `tone` e `bands`, sem marca). Passos com nome e data continuam sendo a
  `Timeline`, e um total dividido, o `ChartSplit`. Os três eixos de cor — `tone`, `bands` e `variant="brand"` —
  são **excludentes**, e o tipo cobra: os três respondem à mesma pergunta por
  caminhos diferentes, e aceitar dois juntos é aceitar que um não faz nada.
  Os cortes do app moram em [`lib/budget-bands`](src/lib/budget-bands.ts):
  **orçamento `[85, 100]`**, **limite de cartão `[30, 70]`**. As duas rampas têm
  a mesma forma e respondem a perguntas diferentes — um orçamento é meta que a
  pessoa escolheu gastar, o limite do cartão é margem que ela não quer
  encostar —, e por isso moram no mesmo arquivo: separadas, pareciam a mesma
  regra com números errados de um dos lados.
  **O excesso transborda, e não divide o trilho**: acima do total a barra fica
  cheia e o que passou vira uma pastilha à direita, **fora** do trilho, que
  continua valendo o total sempre — é o que mantém duas categorias comparáveis
  numa grade. Antes desta rodada 104% e 400% desenhavam igual.
  **`variant="brand"` é o arco-íris sobre leito preto** (`@utility brand-well`),
  para progresso **sem limiar**. O degradê é do **trilho** e o preenchimento o
  revela: completar a barra completa a marca. Duas medições o desenharam: o fio
  de 1px do `Button` reprova aqui, porque num trilho de 6px ele é **um terço da
  peça** contra 1/16 num botão de 32; e sobre o trilho claro do sistema **cinco
  das oito paradas reprovam a 1.4.11** (pior caso 1,42), o que sobre um leito
  preto viraria 3,91. É a terceira exceção nomeada à invariante 3, ao lado do
  `Button` e do `Badge` — e a diferença é que aqui não há rótulo por cima.
  **O leito preto foi recusado na tela, nos dois temas**: a barra de marca veste
  o mesmo trilho das outras, porque uma peça que destoa das vizinhas não é o
  desenho. O claro é, portanto, a **segunda divergência consciente da 1.4.11**
  desta casa, ao lado do contorno de campo, e o caminho de volta é uma
  declaração de `background-color` no trilho. Nota de método que ficou da
  medição: **a razão da WCAG é só de luminância**, e um matiz saturado sobre
  cinza neutro tem contraste cromático que a fórmula não vê — o que explica a
  discordância entre o número e o olho, sem anulá-la.
  **O `Slider variant="brand"` é a mesma família e ancora igual — mas por
  medição.** O arco-íris tem a largura do **trilho** e fica atrás; a faixa
  ativa é a janela que o revela, então em 8% vê-se só o teal e a marca só fica
  completa com a barra cheia. **A conta do `Progress`
  (`background-size: 10000 / pct`) continua não transplantando**: ela exige
  saber a porcentagem no render, e um slider costuma ser `defaultValue` — o
  valor congelaria no inicial e erraria no primeiro arraste; a posição da faixa
  também não é legível em CSS, porque o Radix escreve `left`/`right` inline.
  **A saída é medir a caixa renderizada**, o padrão do marcador do `Tabs`: o
  trilho publica `--slider-rainbow-w/h/x/y` (as de posição já negadas), lidas
  por classe, com `ResizeObserver` no trilho e na faixa mais um
  `MutationObserver` em `style` — que é o que pega a faixa **andando sem mudar
  de tamanho** num slider de intervalo. `offsetLeft` relativo ao trilho, nunca
  `getBoundingClientRect`. Os `var()` levam fallback `100%`: antes da primeira
  medição, e sem JS, o degradê preenche a faixa — **degrada** em vez de derrubar
  a declaração. A versão que escalava à faixa foi recusada na tela: com a faixa
  curta, oito paradas em poucos pixels leem como ruído. **Dois desvios ficam, e
  os dois são de ordem de cor e não de ancoragem**: em `vertical` o Radix
  preenche de baixo para cima contra um degradê de 135° fixo, então o valor
  baixo revela a lima; `inverted` e `dir="rtl"` são a mesma classe. O
  trilho é o mesmo `--input-fill` dos dois, e por isso os números do claro
  coincidem — **pior caso 1,42 na lima, cinco paradas abaixo de 3:1**; no
  escuro, trilho compositado em `rgb(58,58,58)`, as oito passam (pior caso
  **3,40** no violeta). **Nota de método que custou uma medição errada:** no
  escuro `--input-fill` é `oklch(1 0 0 / 15%)`, translúcido, e medir contra o
  token cru acusa seis reprovações falsas — ele tem de ser compositado sobre a
  superfície de baixo antes da razão.
  **`income`/`expense` desenham o mesmo pixel que `success`/`destructive`** no
  preenchimento: `--income` é `var(--success)` e `--expense` é
  `var(--destructive)`, e o que separa dinheiro de estado são as superfícies
  `-muted`, que esta barra não consome. A distinção aqui é de vocabulário.
- **`HistogramSlider` — a faixa de valor sobre uma distribuição.** Um
  histograma atrás de um slider de dois punhos, com as colunas **dentro** da
  seleção acesas e as de fora apagadas, e a leitura de mínimo e
  máximo. **O controle é o histograma**: o `Slider` cobre a mesma caixa das
  colunas (que ficam `pointer-events-none` por baixo), então clicar em qualquer
  ponto move um punho, e o trilho e a faixa somem — quem mostra o intervalo são
  as colunas, e pintar uma barra por cima seria o mesmo dado duas vezes. Apagar
  a faixa exige sumir com a **cor e a imagem**: `bg-transparent` sozinho não
  apaga o degradê da variante de marca. **A coluna acende quando cabe inteira entre as
  duas guias** — contenção, e não sobreposição. A versão por sobreposição
  acendia a coluna sob o punho **metade para fora** da linha, e com as guias
  desenhadas o olho lia a borda da seleção num lugar e o corte em outro; com
  elas na tela, elas são a fronteira. O custo é o inverso: a coluna da ponta só
  acende quando o punho a ultrapassa por inteiro. **A âncora do arco-íris é aritmética**: as colunas são
  uma divisão igual conhecida, então `background-size` é `N × 100%` e
  `background-position-x` é `100i/(N−1)` — sem `ResizeObserver`, ao contrário do
  `Slider`, onde a largura da faixa é arbitrária. Medir não é reflexo; é o que
  se usa quando a geometria não se sabe. **As barras não são `ChartSparkline`,
  e é exceção nomeada**: ela é a primitiva de distribuição decorativa da casa,
  mas não expõe `<Cell>`, e "barra fora da seleção apaga" é decisão por barra.
  **A travessia das colunas é opacidade, e não cor.** Cada coluna tem duas
  camadas — a superfície apagada e a tinta acesa por cima, sempre montada,
  indo de `opacity-0` a `opacity-100` em `--duration-base`. A versão com
  `transition-colors` tinha defeito medido: o `transition-property` computado
  traz `background-color` e **não** `background-image`, então na variante de
  marca o degradê estalava enquanto a tinta apagada dissolvia em 150ms. Degradê
  não interpola; e montar e desmontar a camada também não serve, porque não há
  o que esmaecer num nó que acabou de nascer. Sem escalonamento por índice: uma
  onda saindo do punho fica atrasada no arraste.
  **A linha-guia começa na altura do centro do punho, fica na fresta *entre*
  duas colunas, e se ancora na grade — não no punho.** Ela marca a
  **fronteira** da seleção, e com a contenção o corte é a aresta entre a última
  apagada e a primeira acesa; uma linha no eixo de uma coluna diria que o corte
  passa pelo meio dela, que é o que ele não faz. E presa ao punho ela erraria o
  vão: o Radix recua o punho meia-largura nas pontas
  (`left: calc(70% - 2.8px)`), então o centro dele **não** acompanha a grade —
  medido, **1,73px** de desvio numa coluna de 6,02px. A conta é `index / total`,
  com erro máximo de **meio pixel** contra a fresta real (o respiro de 1px
  entra no passo).
  **E o slider é travado na grade**, que é o que centra punho e guia: não há
  `step` — o passo é a largura de uma faixa, então o punho só para em fronteira
  de coluna. Com passo livre isso é impossível: uma linha presa às frestas não
  tem como estar sob um punho contínuo. Junto vai um **recuo de meio punho**
  (`inset-x-1.75`) na régua das colunas, porque o centro do punho viaja de 7px
  a `largura − 7px` e uma grade que encosta nas bordas vive noutro sistema de
  coordenadas. **E o estado nasce na grade**, senão o punho recebe o valor
  encaixado e as guias leem o cru, com meio punho de desvio até o primeiro
  arraste. Medido em seis posições: desvio **0px** em todas. Ela é
  `pointer-events-none`, para não disputar o arraste com o slider que a cobre,
  e a altura sai de `--histogram-h`, publicada pelo invólucro. **Quem a torna visível é `mix-blend-difference`, e
  não um fio em volta**: no escuro `--primary-accent` e `--primary` são a mesma
  cor, então na variante padrão ela sumia dentro da coluna acesa — e um
  `outline` de 1px em volta de um fio de 1px é metade da peça sendo moldura. A
  inversão não escolhe cor nenhuma (escura sobre coluna clara, clara sobre
  superfície escura), e os 70% de alfa a deixam **parcial**, que é o marcar sem
  cortar. Ela não transiciona — é posição, não estado.
  **Toda coluna leva o mesmo tempo entre o neutro e o pintado** (300ms, atraso
  zero), e quem acende antes é aquela por onde o punho passou antes — ordem que
  o arraste produz sozinho, e que não se calcula. Houve um escalonamento por
  distância até a guia e ele **saiu**: calculava uma ordem que já existe. A
  consequência é dita em vez de escondida: num **salto** não há ordem de
  passagem, e a seleção dissolve junta.
  **A leitura é um par termo/valor (`DescriptionList`), e não dois cartões.**
  Os `StatCard` custavam **70px** de moldura e recuo para duas linhas de
  texto; como `<dl>` a mesma informação cabe em **41px**, e a semântica
  fica certa — "Mínimo" é o **termo** de um valor, não o rótulo de um
  cartão. Mínimo à esquerda e máximo à direita, no mesmo recuo da régua,
  para cada valor cair sob a ponta a que pertence.
  O título **não** é da peça (chrome de tela, invariante 1); a leitura é,
  porque é o estado do controle. Os punhos anunciam o valor em reais: o
  `format` do `Slider` escreve o `aria-valuetext` desde a rodada 177, e fechou a
  lacuna do número cru.
  **Desde a rodada 216** ela tem `count` (quanto a faixa pega, somando as
  colunas **acesas** — a mesma contenção), `axis`, `references` (a média, um
  teto, tracejada com o rótulo acima), `editable` (a leitura vira campo de
  dinheiro), `presets` (fichas), `openEnd` (a última coluna é "daí para
  cima", e o fim sai `Infinity` — um filtro que recebesse `max` cortaria o
  gasto grande que a coluna diz conter), `onValueCommit` (uma vez, ao soltar),
  `pending` (esqueleto nas colunas e o controle travado), `format` e `size`
  (40 · 64 · 96). **O `Slider` de dentro é sempre controlado**: com atalho e
  campo o valor muda por fora do arraste, e o `defaultValue` deixava o punho
  parado enquanto as colunas iam — medido. Nenhuma tela a usa ainda.
- **`Slider` tem cabeçalho, marcas, balão e zonas** (rodada 177): `label`
  (nomeia os punhos) com o valor atual à direita, `format` (no cabeçalho, no
  balão e no `aria-valuetext`), `marks` sob o **centro do punho** — que anda
  de 7px a `largura − 7px`, a régua do Radix —, `bubble` no `:active` e no
  foco de teclado, e `bands`, os cortes do `Progress` (zonas no trilho, faixa
  na cor do valor; não com a marca). Sem essas props a peça é a de sempre.
- **`Pagination` troca por estado, gera a fileira, compacta no telefone e
  carrega mais** (rodada 196). Sem `href`, número e extremo são `<button>`
  (o extremo desabilitado é `button disabled`); `page` + `total` com `getHref`
  ou `onPageChange` montam a janela (`janelaDePaginas`: primeira, última,
  atual e vizinhas; reticência só quando esconde mais de uma página). Abaixo
  de `sm` a fileira gerada vira `‹ 2 de 8 ›` — era o defeito aberto do
  transbordo a 375px —, e `variant="compact"` a força. `PaginationMore` é o
  "Mostrar mais" com a contagem. A tabela de transações e o histórico da conta
  o usam; **não escreva paginação com `ButtonGroup`**.
- **A busca é uma pílula só, em três peças** (rodada 198). O `SearchInput`,
  o `CommandInput` (no `CommandDialog`, no `Combobox` e solto) e o gatilho do
  cabeçalho do catálogo vestem [`lib/search-field-classes`](src/lib/search-field-classes.ts):
  a forma (pílula), a escada (28 · 32 · 36 · 40), as duas superfícies —
  `field` (`border-border` + `input-fill/30`, na página) e `plate` (a tinta
  flutuante + anel de 1px, dentro de painel) —, a lupa a 70%, o × redondo e a
  tecla sem pastilha. **O `CommandInput` é o `SearchInput`**: ele o monta com
  o `Command.Input` do cmdk como filho (o `Slot` funde classes e `ref`), então
  o `Combobox` e a paleta têm a mesma pílula, o mesmo × e o mesmo anel —
  menos na paleta, que nasce focada e desliga o anel (`focusRing`) e o piso
  de toque (`touchFloor`). Só o gatilho do cabeçalho, que é um `<button>`,
  veste a receita em vez do componente. `search-field.test.ts` cobra. **Uma constante não se prefixa**: por isso o
  gatilho do cabeçalho são dois botões (ícone abaixo de `lg`, pílula a partir
  dele), e não um que muda por `lg:`. O `SearchInput` deixou de compor o
  `InputGroup` e ganhou `surface="plate"` (o `FormPickerPopoverSearch` e o
  filtro de categoria o vestem), `shortcut` (a tecla à direita e o atalho que
  foca; sem modificadora, não dispara dentro de campo de texto),
  `variant="brand"` (só em `field`) e `pending`. **Nenhuma busca é `<Input
  type="search">` nem pílula escrita à mão.**
- **`Calendar` tem marcadores, agenda, o Hoje e os atalhos de intervalo**
  (rodada 203). `markers` põe pontos por tom sob o número (até três), com a
  legenda e os rótulos no nome do dia; `variant="agenda"` + `renderDay` é a
  visão de mês, com o conteúdo na célula; `showToday` volta ao mês atual;
  `presets` põe atalhos ao lado de um intervalo e dois meses no desktop;
  `stretch` estica a grade. **O dia só é botão com `mode` ou `onDayClick`** —
  sem eles o `react-day-picker` desenha texto, e o miolo (pontos, agenda)
  também entra no dia estático. **O calendário de pagamentos do dashboard é
  o `Calendar`**: as duas grades eram escritas à mão, com os pontos em
  cinco cores cruas e um popover por célula.
- **`Breadcrumb` troca de irmão, volta no telefone, leva ícone e separador por
  nome** (rodada 202). `BreadcrumbSwitcher` é a página atual com um menu dos
  irmãos ("Cartões › Nubank ▾"), sem crescer a linha; `collapse="back"`
  troca a trilha por "‹ Pai" abaixo de `sm` (a classe vai em cada `<li>`, que
  um invólucro deixaria a lista inválida); `BreadcrumbLink icon`, sozinho com
  `aria-label` para a raiz; `separator="chevron" | "slash" | "dot"`; e
  `BreadcrumbPage asChild`, para a página atual ser o `<h1>`. **A barra do
  app é o `Breadcrumb`**: ela escrevia link, chevron e `<h1>` à mão.
- **`AlertDialog` tem o andamento, o ícone, a lista, o erro e o "digite
  para confirmar"** (rodada 201). `pending` na raiz trava a ação (com o
  `Spinner` e o `pendingLabel`) e o Cancelar, marca `aria-busy` e **segura o
  Esc** — dez telas escreviam o "Excluindo…" à mão e o Esc fechava no meio da
  exclusão. **Nenhuma tela escreve `deleting ? "Excluindo…" : …` nem
  `disabled` nos dois botões.** `AlertDialogMedia` é o ícone **na linha do
  título**, na cor dele e sem poço, com a descrição atravessando a largura
  embaixo (a referência do dono; o poço tingido em cima e o de 44 à esquerda
  foram tentados e saíram). A `AlertDialogDescription` é um `<div>` e recebe a
  `AlertDialogList` (as consequências) — nada de `asChild` com `<div>` e
  `<ul list-disc>` à mão —, e `AlertDialogError` é a falha, `role="alert"`.
  `AlertDialogConfirmInput` trava a ação até o texto conferir: a exclusão de
  carteira, que era um `Dialog` (e uma `Sheet` no telefone) com o campo à
  mão e o Cancelar em `outline`, é ele.
- **`Accordion` tem o ⌘F, ícone e descrição no gatilho e o "abrir todos"**
  (rodada 200). `AccordionContent findable` é a mecânica do `Collapsible`,
  que mora desde então em `hooks/use-until-found` e serve os dois.
  `AccordionTrigger` ganhou `icon` (16px, antes do rótulo) e `description`
  (par de identidade, sem `gap`; só o rótulo sublinha). `AccordionToggleAll`
  abre e fecha todos em `type="multiple"`. **O estado mora na raiz** — o ⌘F e
  o "abrir todos" escrevem nele de fora da linha —, com `defaultValue` como
  semente. **O conteúdo alinha com o rótulo**, somando a seta
  (`markerSide="start"`) e o ícone por variáveis (`--accordion-marker-ps`,
  `--accordion-icon-ps`); começava sob a seta. Nenhuma tela usa o
  `Accordion` hoje.
- **`ToggleGroup` tem a bandeja, a ficha, a contagem e as partes iguais**
  (rodada 199). `variant="segmented"` é o trilho `bg-muted` com **um marcador
  só que desliza** até a escolhida — a mecânica e a superfície do `Tabs
  solid`, e a escolhida se pinta sozinha antes da primeira medida; é escolha
  de **valor**, e quando a opção troca o painel continua sendo `Tabs`.
  `variant="chip"` (também no `Toggle`) é a ficha de filtro, classe a classe
  `tagChipNeutral` e `tagChipFilterSelected`. `count` põe a contagem ao lado
  do rótulo, tabular e com um espaço de verdade antes — sem ele o nome
  acessível saía "Transações8". `stretch` divide a largura. **Nenhuma
  escolha única é `Button aria-pressed` escrito à mão**: o seletor de período
  das transações era, nas duas formas.
- **`RadioGroup` tem ficha, nota na linha, valor na ponta e ícone** (rodada
  197). `variant="chip"` é a escolha em pílulas, na superfície dos chips de
  filtro do `Badge` (o rádio fica `sr-only`, e a semântica continua de rádio);
  `deselectable` volta a vazio tocando na escolhida, para a escolha
  **opcional**. **Escolha única não é `role="group"` com `aria-pressed`** — a
  forma de pagamento da transação era assim, e hoje é ficha. `description`
  vale também na linha `plain`; `trailing` é o valor na outra ponta, dentro
  do rótulo (entra no nome); `icon` é desenhado em 16px (quem chama passa
  `16/solid`), e num grupo horizontal de cartões vira ladrilho — ícone em
  cima, rádio no canto.
- **`KbdGroup` diz o gesto** (rodada 195): `mode="sequence"` (passos, o
  leitor de tela ouve "depois"; `separator` põe o › à vista) ou
  `mode="either"` (opções, com / e "ou"). **Duas pastilhas lado a lado sem
  grupo leem como sequência** — a legenda da paleta escrevia ↑ ↓ assim, e hoje
  é `mode="either"`. Um passo pode ser acorde (`["mod+k", "s"]`), resolvido
  pelo `Kbd keys`. `live` acende as pastilhas com o teclado (o progresso da
  sequência, a tecla descida das alternativas) e só escuta o teclado quando
  ligado.
- **`Item` tem a linha rente, a selecionada, a seta e só quebra com faixa**
  (rodada 194). `variant="flush"` é a linha de um `Card padding="none"` (sem
  borda nem canto, recuo de 16px); `selected` é a linha atual, com o contorno
  do cartão de escolha e `aria-current` — **destaque de passagem não é
  seleção**; `ItemChevron` anda 2px só numa linha `interactive`, por variável
  (`--item-nudge`), porque variante empilhada no mesmo ancestral não casa. A
  linha **não quebra** sem `ItemHeader`/`ItemFooter` e alinha à esquerda de
  fábrica: **nenhuma tela escreve `flex-nowrap` nem `text-left` num `Item`**, e
  o teste o cobra. O título quebra, para um `Badge` descer inteiro.
- **`InputGroup` tem a senha que se mostra, o contador, o `pending` e o
  seletor no começo** (rodada 193). `InputGroupPasswordToggle` guarda o estado
  no grupo e o `InputGroupInput type="password"` vira texto sozinho —
  **nenhuma tela escreve `? "text" : "password"`**. `maxLength` no
  `InputGroupTextarea`/`InputGroupInput` põe a contagem num addon (embaixo e
  sempre; na ponta e só perto do teto), porque o contador do `Textarea`
  embrulharia o campo e o grupo perderia o `has-[>textarea]`. A régua do
  contador é `lib/char-count`, uma só para as três peças. `pending` troca o
  addon da ponta pelo `Spinner` sem desmontá-lo. `InputGroupSelect` é nativo e
  também é `input-group-control`, para o foco acender o grupo.
- **`Field` tem cabeçalho, contador, lista de requisitos e linha que não
  empilha** (rodada 192). `FieldHeader` põe o rótulo à esquerda e um link ou
  contador à direita, **fora do `<label>`** (um link dentro dele também
  focaria o campo). `FieldCounter` só aparece nos últimos 10% ou 20
  caracteres, com a régua do contador do `Textarea`. `FieldChecklist` é a
  lista viva de regras, **somada ao `aria-describedby`** do controle — as três
  telas de senha a dividem, e nenhuma tela declara `ReqRow`.
  `FieldRow stack={false}` é para o par curto (MM/AAAA), não para dois
  selects.
- **`EmptyState` manda no degrau das ações, tem `layout="inline"`, o "tudo em
  dia" e o numeral no degrau** (rodada 191). `EmptyStateActions` passa o
  degrau aos botões pelo `ButtonSizeContext` (`sm`/`md` → `sm`, `lg`/`page` →
  `xl`) — **nenhum botão dentro das ações declara `size`**, e o teste o cobra.
  `layout="inline"` é o vazio pequeno de formulário (ícone à esquerda, poço de
  32 com o ícone em 16/solid; o auditor sabe); `EmptyStateIcon variant="done"`
  é a boa notícia, o tique que se desenha por `clip-path` (o fim `inset(0)` é
  declarado, porque `none` não interpola); e `EmptyStateCode` acompanha o
  `size`.
- **`DescriptionList` tem sobrancelha, destaque, nota, colunas e alinhamento**
  (rodada 190). `term="eyebrow"` é o rótulo em caixa alta de 11px —
  **nenhum `DescriptionTerm` escreve `uppercase` à mão**; ele vem da lista por
  um seletor de um nível, sem contexto, porque o painel de acesso é server
  component. `DescriptionDetails size="xl"` é o número da tela;
  `DescriptionHint` é a nota miúda **dentro** do `<dd>`; `columns={2|3}` fixa
  a grade em qualquer largura (nenhuma lista sobrescreve `grid-cols-*`); e
  `DescriptionListItem align="end"` encosta o par à direita.
  `description-list.test.ts` tranca as duas proibições.
- **`Collapsible` tem a linha, o cartão, o ⌘F e o rótulo que troca** (rodada
  189). `CollapsibleRow` é o gatilho desenhado na régua do `Accordion`
  (`md`/`lg`/`xl`, `trailing`, `markerSide`) — **nenhuma tela escreve a linha
  à mão** num `Button` ou num gatilho cru. `variant="card"` é a superfície do
  `Card` escrita no próprio arquivo (molécula não importa organismo), sem fio
  entre linha e conteúdo; o recuo de baixo é `::after`, porque `padding` no nó
  que anima a altura estala no fim. O `Collapsible` guarda o estado e o
  publica: `CollapsibleLabel` troca o texto do gatilho, e `findable` deixa o
  fechado como `hidden="until-found"` — o atributo sai no `setOpen`, **antes**
  de o Radix medir a altura (senão mede 0), e volta no `animationend` do
  próprio nó.
- **`AnnouncementBar` ganhou o ícone do tom, `position`, a entrada e `align`**
  (rodada 187). O ícone tem a API do `Alert` (`icon` troca, `false` tira; o
  offline usa o sinal cortado), e o mesmo teste reprova o `svg` como filho.
  **`sticky` virou `position`** (`static` | `sticky` | `fixed`), e o `fixed`
  traz a camada e o fio que o `OfflineBanner` escrevia à mão — ele fica só
  com o `top`. **O `relative` do véu mora no `static`**: na variante `brand`
  ele vencia o `sticky` no `tailwind-merge`, e a faixa de marca presa nunca
  prendeu. Ao aparecer ela esmaece descendo (a altura inteira presa, 4px no
  fluxo). `align="center"` leva texto e ações ao meio e tira o × do fluxo.
- **`Alert` traz o ícone do tom, dispensa, põe a ação na linha e entra suave**
  (rodada 186). **Nenhuma chamada escreve o `svg` como filho**: cada tom traz
  o seu (`destructive` é o círculo com ×, não o triângulo do `warning`),
  `default` não tem, `icon` troca e `icon={false}` tira — `alert-icon.test.ts`
  reprova. `onDismiss` é o × da `AnnouncementBar` no canto; o alerta não se
  esconde sozinho. `AlertActions placement="inline"` põe a ação à direita
  quando o **alerta** tem 28rem ou mais. **Uma container query não enxerga o
  próprio contêiner**: a grade do alerta não pode perguntar a largura dele, e
  quem decide são os filhos, lendo `--alert-text-col`. Todo alerta entra
  esmaecendo 4px (`starting:`), e o título quebra palavra longa sozinho.
- **`Tooltip` confirma, alcança o desabilitado, mostra atalho e tem contraste**
  (rodada 185). **O Radix fecha a dica no `pointerdown`**, então trocar o
  texto dela no clique ("Copiado") nunca aparece — medido; a confirmação é
  `<Tooltip confirmation={copiado ? "Link copiado" : null}>`, ligada pelo
  **resultado** da ação, com região viva própria. **Um `<button disabled>` não
  abre dica**: o `TooltipTrigger asChild` embrulha sozinho um filho `disabled`
  num `span` focável e leva o `aria-label` junto. `shortcut` (`"mod+b"`, pela
  grafia do `Kbd`) põe a tecla à direita — o `SidebarTrigger` mostra ⌘B.
  `variant="contrast"` é a pílula `--primary` e **não veste a placa por
  baixo** (a tinta de vidro do escuro venceria).
- **`Toggle` tem amostra, pílula, degraus de ícone e ícone que acende**
  (rodada 183), e o `ToggleGroup` herda tudo pelo contexto e pelo item:
  `variant="swatch"` com `color` é a amostra de cor dos seletores — a
  superfície do `ColorTile` (`tileColorFor`, claridade do sistema), contorno de
  `--foreground` e tique na escolhida; **não pinte amostra com
  `style={{ backgroundColor: hex }}`**, que mostra uma cor e o ladrilho outra.
  `shape="pill"` é o eixo do `Button`; `size="icon-sm…icon-xl"` são os
  quadrados de 28 a 40; `icon` + `iconOn` trocam o contorno pelo sólido ao
  ligar. Nenhuma chamada escreve `rounded-full px-*`, `size-*` ou borda de
  seleção num `ToggleGroupItem`. No `type="single"` clicar no ativo **não**
  desmarca: o componente engole a troca para vazio.
- **`Textarea` mede em linhas** (rodada 180): `field-sizing-content`
  **ignora `rows`** (medido: `rows={3}` e `rows={10}` dão a mesma caixa), então
  a altura é `minRows` / `maxRows` (`lh` + recuo + borda); passado o teto ele
  rola. **Solto, o teto não dissolve** — a máscara apagaria a borda e o
  preenchimento que o próprio textarea pinta —, e no `InputGroupTextarea`,
  onde quem pinta é o grupo, dissolve. `maxLength` traz o contador (âmbar e
  anunciado só nos últimos 10% ou 20 caracteres; `showCount={false}` desliga),
  `resize` é `none` (padrão) ou `vertical`, e onde falta `field-sizing` a
  altura segue o `scrollHeight` por script.
- **`Switch` tem escada, `pending`, ícones e marca** (rodada 179): `size`
  mede o trilho (`sm` 14×24 · **`md` 18×32** · `lg` 24×44), e
  `size="default"` saiu do tipo. O alvo é **44 de altura** nos três degraus
  (era 34 no `md`). `pending` põe o `Spinner` no polegar e trava sem apagar
  (`aria-busy`) — não troque o texto de estado por uma roda ao lado; `icons`
  põe tique e ×; `variant="brand"` é o brilho, a família do `Checkbox` e do
  `Radio`. O polegar anda na mola da casa.
- **`Skeleton` tem as formas das peças** (rodada 176): `shape` (`block`,
  `text` — a caixa com a entrelinha do corpo e o osso de 0,8em no meio —,
  `circle` na escada do `Avatar`, `tile` na do `ColorTile`, `pill` na do
  `Badge`, 14/18/22 medidos) e `size`; `SkeletonText lines` para o
  parágrafo. **Um movimento só, o pulso**: houve um `shimmer` na mesma rodada
  e ele saiu a pedido do dono — dois movimentos para o mesmo estado deixam
  cada tela escolher o seu. A exceção é a `wave` do `ChartSkeleton`, que tem
  a forma das barras.
  **O bloco que espera é o `SkeletonGroup`** (`role="status"`, `aria-busy`, o
  `label` lido e os ossos `aria-hidden`), e o `delay` dele esconde o bloco
  nos primeiros 300ms por `@starting-style`, sem timer. Os onze esqueletos
  de página vestem `SkeletonGroup delay`.
- **`Separator` tem dois eixos e duas formas** (rodada 175): `tone` é o peso
  (`default` estrutura, `soft` arruma o interior de uma superfície) e
  `variant` é o desenho (`solid`, `dashed` — antes de um total —, `fade` —
  entre blocos soltos). O peso mora em `--separator-color`, que os três
  desenhos leem. `bleed` atravessa o recuo que a superfície publica
  (`--card-px`, depois `--dialog-px`, ou `--separator-bleed`), e `children`
  é o rótulo do meio, que o `FieldSeparator` compõe. **Nenhuma tela desenha a
  régua à mão** (`<div role="separator">`), pesa por alfa (`bg-border/60`)
  nem sangra com `-mx-*` e `w-[calc(…)]` — `separator.test.ts` tranca.
- **`Resizable` também redimensiona colunas de tabela** (rodada 170):
  `useResizableColumns` + `ResizableColumnHandle`, no mesmo `resizable.tsx`,
  com a costura do `ResizableHandle plain` (nada em repouso, o fio ao pousar
  na célula, o acento ao pousar e arrastar). **O arraste é nosso, e não da
  lib**: os painéis dela são flex, e numa tabela quem manda é a célula da
  primeira linha sob `table-layout: fixed`. Uma coluna fica **sem largura** e
  absorve a sobra — sem ela a costura escorrega do cursor —, e o piso dela
  (`fluidMinWidth`, 192px) entra no `min-width` da tabela. O `TableHead` só
  vira `relative` quando tem uma costura dentro, e **não** trunca (o
  `overflow: hidden` cortaria a metade dela que passa da borda). Alvo de 10px
  no mouse e 24 no dedo, e não 44: numa coluna de 88px o alvo cobriria o
  rótulo e o clique de ordenar arrastaria. `resizable-columns.test.ts` tranca.
- **`Carousel` — uma biblioteca, e um motor só** (rodada 134). Cada versão é
  **prop ou peça do mesmo `Carousel`**, nunca um componente paralelo:
  `effect` (`scale`, `spotlight` — o destaque no centro, que centraliza e liga
  o `loop` —, `parallax` e `curve`, a galeria curva em CSS e não em WebGL),
  `autoplay` (ms), `loop`, `bleed` (de borda a borda, sem dissolução) e
  `layout="accordion"` (itens colapsados que abrem conforme se passa, com o
  embla inativo e o índice no contexto). Peças: `CarouselToolbar` (setas no
  topo, embaixo ou em volta dos pontos), `CarouselCaption`,
  `CarouselPlayPause`, `CarouselSteps`/`CarouselStep` (passos nomeados, em
  pílula ou em lista com trilho) e `CarouselThumbs`/`CarouselThumb`, todas no
  `carousel.tsx` e na mesma página — nenhuma se usa sem o `Carousel`. As setas
  ganharam `placement` (`overlay` | `inline`) e `appearance` (`tertiary` |
  `glass` sobre foto | `solid` numa barra); os pontos, `variant="pill"`,
  `placement="overlay"` e `surface="glass"`. **Os efeitos só leem uma
  variável**: um driver escreve `--carousel-slide-s`/`-d` em cada slide (o
  método de tween do embla, com o desvio do `loop`), e os
  `@utility carousel-effect-*` não transicionam nada. **Autoplay só em
  conteúdo editorial, nunca sobre dado da pessoa**: o hook
  `useCarouselAutoplay` é próprio (sem plugin), pausa no cursor, no foco, com
  a aba escondida e pelo `CarouselPlayPause` (obrigatório, WCAG 2.2.2), e com
  movimento reduzido nasce pausado. O ponto ativo é o temporizador
  (`@utility carousel-timer`), que pausa junto do relógio. **Tinta sobre foto
  é `--scrim-foreground`** (branca nos dois temas), sobre o véu `--scrim`: a
  foto não muda com o tema. A capa é a `CardMedia`, nova no `Card`. Um
  carrossel de um item por vez leva `fade={false}`: a dissolução apagaria o
  próprio item visível.
- **`Carousel` ganhou o que faltava a uma tira de verdade** (rodada 205).
  `until="md" | "lg"` é o **carrossel só no telefone**: o embla desliga por
  breakpoint, o trilho vira grade com a calha do `gap`, e setas, pontos,
  contagem, barra e play somem (`group-data-[until]/carousel`); teclado e roda
  deixam a grade em paz. `snap="free"` é o arraste com inércia, indicado pelo
  `CarouselProgress` (a barra de rolagem: polegar na fração visível; pontos
  mentiriam). **`selectOnClick` e `wheel` vêm ligados**: o item cortado na
  borda, clicado — mesmo no botão —, primeiro vem para a vista (o clique é
  engolido em captura; no `spotlight`/`curve`, a régua é ser o central), e o
  gesto horizontal do trackpad passa **um** item por gesto (ouvinte nativo
  `passive: false`, trava até 160ms de silêncio por causa da inércia).
  `effect="fade"` empilha os itens na origem e os cruza por opacidade, força
  `gap="none"` e é o **único efeito sem bloco de movimento reduzido** — o
  deslocamento dele é o empilhamento. Peças: `CarouselMore` (o último item
  leva à lista, `Card dashed` clicável), `CarouselSkeleton` (fora do
  `Carousel`, com o `basis` real), `CarouselStatus placement="overlay"`,
  `CarouselThumbs orientation="vertical"` (coluna a partir de `md`, altura da
  foto por `contain: size`) e `CarouselFullscreen` (o `Dialog` de tela cheia,
  **opaco** nos dois temas, que abre no item atual e devolve o índice). **Dê
  `aria-label` a todo carrossel**: o padrão "Carrossel" não diz o que há dentro.
  `carousel-versions.test.ts` tranca.
- **`Chart` — nove formas, e a marca não entra no dado** (rodada 135). Além
  de área, linha, barras, rosca e faísca: `ChartSplit` (divisão de um total
  em 2–4 partes, porcentagens pelo maior resto), `ChartRadial` (um anel por
  categoria contra o próprio teto; com `bands` a cor é **estado**, os cortes
  do `Progress`), `ChartHeatmap` (o ritmo por dia; a intensidade é
  **dinheiro**, cinco degraus de `--chart-expense`/`--chart-income` sobre
  `--muted`, misturados em **`oklab`** — em `oklch` o matiz 0 do cinza
  puxava o verde para o marrom) e `ChartRadar` (perfil contra a média, 3–8
  eixos). `ChartBars` tem `shape="pill"` e `track`; linha e área têm
  `marker="last"`, o último ponto **com valor**; o esqueleto tem
  `variant="wave"`. O tooltip veste a placa flutuante.
  **Todo gráfico chega e se ajusta** (rodada 136). Ele tem três fases:
  `pending`, `entering` e `idle`, publicadas em `data-reveal`.
  - **Entrada:** toca uma vez, quando a caixa entra na tela
    (`IntersectionObserver`). Até lá o gráfico já está montado com o dado
    final e invisível, e aparece na impressão.
  - **Troca de dado:** interpola do quadro anterior.
  - **Tempos:** entrada em `--duration-spring`, troca em `--duration-slow`,
    `chart-motion.test.ts` os tranca aos tokens.
  - **A curva é serena no dado:** as marcas usam `--ease-out`, que não passa do
    alvo. A mola fica só no que *aparece* (célula, rótulo, legenda).
  - **Números que contam:** `ChartDonutCenter amount` e os `%` dos anéis e da
    divisão.
  - **Faísca:** não entra, só transita.
  - **Movimento reduzido:** vai direto ao fim. O `'auto'` do Recharts 3.8
    **respeita** a preferência, ao contrário do que a rodada 30 registrou.
  - **Rosca:** começa em `animationBegin: 0`. Os 400ms de fábrica, somados a
    re-renders, eram a rosca vazia da rodada 30.
  - **Impressão:** todo esconder de `pending` mora sob `not-print:`, porque um
    `print:…` perde pela ordem de emissão.
  **Arco-íris sob série continua proibido**: a marca encosta pelo
  `Card variant="brand"`, na borda. O cabeçalho (delta, período, KPIs) é
  composição de `Card`, não peça do `Chart`.
- **`DropdownMenu` vira folha de ações no telefone e ganhou o alvo, a tecla,
  a descrição, a confirmação, a busca, a linha que carrega, a caixa que não
  fecha e a tecla que abre** (rodada 213). **`mobile="sheet"`**: no telefone o
  mesmo menu é a folha do `Drawer`; cada peça lê o contexto e se desenha como
  menu ou como linha (caixa e rádio com a marca, submenu como grupo com
  rótulo, a tecla some). **O `onClick` da tela roda antes do da linha** — com
  ele por último no espalhamento, a linha não fecharia a gaveta. Os menus ⋯
  das telas usam a folha. `DropdownMenuHeader title description` é o alvo
  (nomeia o menu; na folha, sem `id` próprio, porque o `id` apontava o nome da
  gaveta para o vazio — medido). `DropdownMenuItem`: `shortcut` (o `Kbd`),
  `description` (grade, como no `ContextMenu`), `confirm` (o primeiro toque
  só arma, e a ação da tela — `onSelect` **ou** `onClick` — espera) e o
  `onSelect` que devolve `Promise` (a linha carrega, o menu fecha no fim).
  `DropdownMenuContent search` filtra pelo nome; no campo a tecla é texto,
  senão o Radix buscaria por digitação e levaria o foco. **Com busca, o menu mede
  como o `Combobox`** (pílula `md` a 8px, linhas de 32 a 8px), sem ser ele: o
  menu age e o `Combobox` escolhe valor. **A caixa não fecha
  o menu** (`closeOnSelect` volta ao Radix): a página afirmava isso e o Radix
  fechava. `shortcut` na raiz abre pela tecla — a linha com o foco, ou a tela
  sem foco. Ícone de linha não leva `h-4 w-4` nem `mr-2`: a linha dimensiona
  e espaça. `dropdown-menu-versions.test.ts` tranca.
- **`Drawer` ganhou a folha de ações, os degraus, a gaveta sobre gaveta, o
  fundo que encolhe, a trava ao salvar, o modo não-modal, a altura que
  acompanha e o cabeçalho fixo** (rodada 212). `DrawerActions` +
  `DrawerAction` (linhas de 52px, ícone `20/solid`, `variant="destructive"`,
  `asChild` para link; cada uma fecha a gaveta) + `DrawerCancel` é o action
  sheet — **o "+ Adicionar" e o menu da conta do telefone são ele**, e o vidro
  escrito à mão desses dois (`lib/mobile-glass-surface`) saiu; ficou só a
  constante da `BottomBar`. Uma `Drawer` dentro de outra vira `NestedRoot`
  sozinha. `scaleBackground` escala o `[data-vaul-drawer-wrapper]`, que a raiz
  do app (`layout.tsx`) passou a ter. **`pending` desliga o `dismissible` e
  barra o pedido de fechar na raiz** — com `dismissible` falso o vaul fecha no
  toque da alça, então desligar só ele abria um buraco. Com `snapPoints` o
  conteúdo fica alto sozinho; `modal={false}` não monta véu. **A altura anima
  quando o conteúdo muda**, com um observador por gaveta — a primeira versão
  ligava o observador numa `ref` de função, que era refeita a cada render
  (medido: seis observadores ao abrir, três a cada clique, brigando pela
  altura). **Sem `DialogBody`, o filho do meio rola** entre cabeçalho e
  rodapé parados, com a dissolução — as classes estão escritas por extenso,
  porque a primeira versão as montou num template literal e o Tailwind não
  gerou nenhuma. `drawer-versions.test.ts` tranca.
- **`Dialog` vira gaveta no telefone, trava enquanto salva, protege o
  rascunho e ganhou passos, ícone, ação à esquerda e tela cheia** (rodada
  211). **`<Dialog surface="auto">`** é o diálogo no desktop e a gaveta do
  `Sheet` abaixo de 768px, com a mesma API e a mesma cromagem (`fixed` e
  `full` viram a gaveta alta). **Não escreva `if (isMobile)` trocando
  `Dialog` por `Sheet`**: dezessete telas faziam isso, cada uma com as classes
  da folha numa grafia, e migraram. `pending` trava Esc, véu, ×, `DialogClose`
  e o arraste; `dirty` + `confirmDiscard` pergunta "Descartar alterações?"
  (a pergunta usa a primitiva do Radix, porque o `AlertDialog` importa o
  `dialog.tsx`) — fechar por código, depois de salvar, não pergunta. **Todo
  pedido de fechar passa por um só lugar** (`pedir`, na raiz). `DialogSteps`
  (passo N de M, barra segmentada; com ele o `fixed` ocupa o teto e a janela
  não pula), `DialogMedia` (o ícone na linha do título), `DialogFooter start`
  e `size="full"`. **O cabeçalho não tem `gap`**: título sobre descrição é par
  de identidade, e o título passou a `leading-snug`. **No dedo os botões do
  rodapé sobem a 40** (`pointer-coarse:[&_button]:min-h-10`) — as telas o
  escreviam à mão só no ramo do telefone. Os formulários usam `FormCancel`
  (era `outline`) e `FormSubmit pendingLabel`, nunca um ternário "Salvando…".
  O rascunho do lançamento compara só o que se escreve: trocar a aba ou o
  tipo não pergunta. `dialog-versions.test.ts` tranca.
- **`DatePicker` ganhou atalhos, o Hoje, marcadores, o rótulo relativo, o
  campo digitável, o mês, a gaveta e a confirmação** (rodada 210).
  `presets` (dias numa data — o `Calendar` ganhou o atalho de dia —,
  períodos num intervalo; `true` usa os padrões), `showToday` e `markers`
  repassam o `Calendar`. `displayStyle="relative"` diz "Hoje · 1 de outubro
  de 2026" (só ontem, hoje e amanhã ganham a palavra). `variant="input"` é o
  campo digitável — dd/mm/aaaa com máscara, dd/mm no ano corrente, "hoje",
  "ontem", "amanhã"; 31/02 fica no campo, inválido, em vez de virar 3 de março.
  `mode="month"` é a grade de doze meses, e **`MonthGrid` é a grade sozinha**
  para quem tem gatilho próprio: a navegação de mês das categorias a usa, e
  os dois `Select` de mês e ano (`budget-month-selects.tsx`) saíram. **No
  telefone a grade abre numa gaveta** com células `lg` esticadas, e numa
  folha que já é gaveta ela abre por cima e fecha sozinha — medido. `confirm`
  no intervalo guarda as pontas em rascunho até Aplicar; o filtro de período
  das transações o usa, e o `transactions-date-range-form.tsx` saiu.
  **`aria-label` não existia no tipo**, e o JSX aceita atributo com hífen
  sem checar: ele sumia calado. Lançamento, pagamento e assinatura usam o
  rótulo relativo; a data final da conta ganhou o ×. **O calendário brota do
  campo** (`@utility date-picker-bloom`, só no popover): a placa se desdobra
  da aresta que encosta no campo, com a aresta que avança curva (uma elipse de
  2rem que se achata), 6px, 3% de escala e um desfoque que assenta, na mola; as
  semanas chegam em ondas de 25ms; fechar é 150ms sem mola. O recorte termina
  em `inset(-1rem)` com preenchimento `backwards` — `inset(0)` cortaria o anel
  e a sombra, e uma máscara em degradê também, por não sair da caixa.
  `date-picker-versions.test.ts` tranca.
- **`ContextMenu` ganhou o alvo, a largura, a tecla, a descrição, o teclado e
  a seleção, e o app passou a usá-lo** (rodada 209). `ContextMenuContent
  header` + `ContextMenuHeader` dizem sobre o que o menu age, e o título o
  nomeia (`aria-labelledby`); `size` é a escada do `DropdownMenuContent`
  (176–224), e nenhuma chamada escreve `w-52`. `ContextMenuItem shortcut`
  desenha a tecla com o `Kbd` (só a dica — a tecla tem de existir na tela) e
  `description` é a segunda linha; com ela o item vira **grade**, porque
  `flex-wrap` derrubava o rótulo (um nó de texto solto) para baixo do ícone.
  **O gatilho com `asChild` não escreve `data-slot`**: o `Slot` o passava por
  cima do filho, e o `Item` saía `context-menu-trigger` — medido. O alvo
  acende com `data-state=open`, e Shift+F10 e a tecla Menu despacham o
  `contextmenu` no elemento focado (o foco volta a ele). **O toque longo já
  era do Radix** (700ms, balão do iOS desligado), e a página dizia que não
  havia botão direito no toque; medido com toque emulado, o soltar do dedo não
  entrega clique à linha, então não há trava. `contextMenuTargets(id,
  selecionados)` é a regra da seleção: sobre uma linha selecionada, o menu age
  em toda ela. **Ele é sempre atalho**: a linha de transação, os cartões de
  categoria e o de conta pendente o usam repetindo ações que continuam à
  vista — mudança de jornada, no `JORNADAS.md` e no Atlas.
  `context-menu-versions.test.ts` tranca.
- **`Command` ganhou sub-páginas, destaque, pré-visualização, contagem,
  atalhos, recentes, busca no servidor e a gaveta** (rodada 208).
  `CommandPages` + `CommandPage` + `useCommandPages` são as sub-páginas: o
  campo lê a pilha sozinho (a trilha é o `CommandScope`, o texto esvazia a cada
  passo, Backspace com o campo vazio volta **em dois toques**, o gesto do
  escopo). `CommandHighlight` acende o trecho sem acento; `CommandGroup count`
  conta no DOM do grupo, porque o cmdk desmonta o que não casa e não expõe a
  contagem por grupo. `CommandItem shortcut` mostra a tecla e dispara **só com
  o foco na própria paleta** (duas paletas não disputam a tecla); evite
  `mod+n/t/w`, que o Chrome não deixa cancelar. `CommandSplit` +
  `CommandPreview` com `CommandDialog size="lg"`. **No telefone o
  `CommandDialog` é gaveta** (`Drawer`). Os ganchos `useCommandRecents` e
  `useCommandSearch` moram em `hooks/`, e o casar de atalho saiu do
  `SearchInput` para `lib/shortcut` — uma regra para os dois. **O `Combobox`
  não monta mais a pilha** (rodada 198): a página e quatro comentários diziam
  que sim, e `density="menu"` está sem consumidor. `command-versions.test.ts`
  tranca.
- **`Combobox` ganhou o que o filtro de transações escrevia à mão** (rodada
  207). `ComboboxItem` tem `media` (o `ColorTile size="xs"`), `description` e
  `variant="none"` — a ausência, esmaecida e, em `multiple`, **exclusiva** nos
  dois sentidos. O ladrilho do gatilho é `ComboboxValue media`, **prop e não
  filho**: dentro do texto que trunca ele empilhava sobre o rótulo (44px num
  gatilho de 32). `ComboboxChips` (`labelFor`, `mediaFor`, `tone`, `max`) são
  as fichas embaixo do campo — dentro não cabem, o gatilho é `<button>`.
  `ComboboxActions` é "Selecionar tudo"/"os visíveis" e "Limpar"; **o
  `filtered.items` do cmdk é indexado pelo id da linha, não pelo valor**, então
  quem precisa de valores filtra o registro do contexto (`itens`) com o mesmo
  `commandFilter`. Com ações, a faixa de cima soma a linha delas, senão a lista
  (que sobe por trás da faixa) as cobre. `ComboboxCreate` cria pela busca quando
  nada casa, e desconta a si mesma da contagem. `ComboboxGroup recent` some ao
  digitar e dá ao recente um valor de cmdk próprio. `variant="input"` +
  `ComboboxTextField`: o campo **é** a busca, com a raiz do cmdk envolvendo
  campo e painel. **Categoria é `Combobox`, não `Select`** — "Pagar conta" e o
  formulário de conta migraram; o filtro de transações (categorias e cartões)
  é `Combobox multiple` com ações e fichas verdes. `combobox-versions.test.ts`
  tranca.
- **`Chart` ganhou o que o dashboard ainda escrevia à mão** (rodada 206).
  Formas: `ChartWaterfall` (a cascata do saldo — barras de **faixa**
  `[de, até]`, que cruzam o zero sem pilha transparente; `total` é saldo,
  neutro, e sem `value` fecha no acumulado) e `ChartBarList` (o ranking em
  **lista HTML**: `role="figure"` e não `img`, o nome quebra em vez de cortar,
  uma cor só porque a ordem é o ranking). Barras: `signed` (income acima,
  expense abaixo, a linha do zero com `ifOverflow="extendDomain"` — domínio
  `auto`, porque com funções de mínimo e máximo o Recharts não arredonda os
  degraus), `valueLabels` (empilhado, o total) e `selected` + `onSelect`
  (as outras apagam a 0,35; setas e Enter pelo `useActiveTooltipLabel`).
  Rosca: a fatia ativa (tooltip — ponteiro e teclado — ou lista; o miolo passa
  a ser dela), `active`/`onActiveChange` para a tela que tem lista própria,
  `legend="list"` e `bands` no `gauge`. Área e linha: `brush`, `delta` (também
  nas barras) e `config.dashed` (a projeção: traço no gráfico **e** na
  legenda, e sem volume na área). `ChartAnnotation` é o fio com rótulo num
  ponto do tempo. **Gráfico que recebe ação é `role="group"`**, nunca `img`
  (`interactive` no `ChartContainer`). **O ponto da linha tem `fill`**: sem ele
  o Recharts o pintava de branco e ele abria buraco no traço. Nenhuma tela
  monta tooltip de gráfico à mão nem usa `ResponsiveContainer` cru, e
  `ChartTooltipContent` sem `format` escreve número, não dinheiro —
  `chart-versions.test.ts` tranca.
- **`EmptyState` — a forma diz a situação** (rodada 131). Primeiro uso é
  `EmptyStateGhost` (linhas-fantasma neutras da lista que vai existir,
  subindo num laço) **sem arco-íris** — quatro versões dele ali foram
  recusadas na tela: um degradê cortado em linha reta atrás dos fantasmas,
  uma elipse, cinco blobos orbitando e o degradê correndo no contorno das
  linhas; filtro, período
  ou lista vazia é `EmptyStateIcon variant="stack"` (leque de três ladrilhos
  que se abre na `--ease-spring`); não encontrado é `size="page"` +
  `EmptyStateCode` (o numeral na Ledger, preenchido com o arco-íris e
  dissolvendo para baixo); erro de runtime é o mesmo, com "Ops!" no lugar do
  "404" (a marca d'água atrás do título saiu a pedido do dono). **O
  arco-íris do `EmptyState` mora só no numeral**, onde ele *é* o glifo, `aria-hidden`, com o precedente do
  wordmark — é a segunda casa da `--font-display` fora do `.page-title`. As
  props do fantasma são de **forma** (`leading`: tile, card, avatar;
  `trailing`: amount, date, none), porque domínio é conteúdo de tela. Três
  medições ficam: **(1)** no degrau `page` o título **nasce `<h1>`** — um
  server component que passava `<h1>` por `asChild` o entregava ao `Slot` do
  Radix como referência preguiçosa do RSC, e o título sumia sem erro;
  **(2)** as animações moram em `@utility` (`empty-state-drift`,
  `empty-state-sheen`) e não em `animate-[…]`, porque o Tailwind v4 descarta
  `@keyframes` que nenhuma utility referencia — os fantasmas ficavam
  parados com `animation-name` computado e a regra ausente; **(3)** o laço
  não tem emenda porque as linhas são duplicadas e o respiro é margem, não
  `gap`.
- **`Avatar`**: Radix-based with `size`; keep `data-slot` for tests and form deferrals. Duas peças: `AvatarImage` (a foto) ou `AvatarFallback` (iniciais sobre a cor chapada de identidade, com `tint` `vivid` — o padrão — ou `soft`, desde a rodada 184). Sem `variant` de superfície — houve um, enquanto o degradê e o chapado conviveram, e saiu com o degradê. Sem vidro, sem anel, e **uma forma só, o círculo** — `shape="rounded"` saiu na rodada 85, porque canto arredondado é a família do `ColorTile` e da marca de workspace, que identificam coisa e não pessoa. A cor da pessoa vem de `identityToneFor`, nunca de classe montada.
- **Overlays**: `Dialog` / `Sheet` / `AlertDialog` use `bg-overlay` (not hardcoded `bg-black/10`).
- **`DialogFooter` empilha ao contrário** (`flex-col-reverse`), para a ação
  principal ficar em cima no telefone. O antigo `SheetFooter` empilhava na
  ordem do DOM — então os 17 rodapés que vieram da folha declaram `flex-col`
  explicitamente, e é de propósito.


## Histórico e backlog

O diário das rodadas do design system (o que foi medido, errado e decidido por
trás de cada regra acima) e o backlog de migração das telas estão em
[`docs/design/HISTORICO-DESIGN-SYSTEM.md`](docs/design/HISTORICO-DESIGN-SYSTEM.md).
Quando um comentário no código disser que "o `AGENTS.md` registra" algo que não
está aqui, é lá que está. Leia a seção do componente antes de mudá-lo.
