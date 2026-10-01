# Histórico do design system

Diário das rodadas do design system e o backlog de migração das telas. Saiu do
[`AGENTS.md`](../../AGENTS.md), que ficou só com as regras. Aqui está o **porquê**
de cada regra: o que foi medido, o que deu errado e o que foi decidido. Consulte
antes de mudar um componente de `src/components/ui/`.

### A trilha dobra o miolo, e nunca quebra a linha

O `Breadcrumb` era o shadcn intacto, com `flex-wrap`. **Medido a 375px, com
293px disponíveis: uma trilha de quatro níveis saía com 46px de altura, em duas
linhas**, logo acima do título — e a página do catálogo *documentava* isso em
vez de resolvê-lo.

**A `BreadcrumbList` passou a ser dona dos separadores**, e é isso que torna o
colapso possível: não se dobra um miolo que não se possui. Enquanto o
`<BreadcrumbSeparator />` era escrito à mão n−1 vezes, a lista não sabia quais
filhos eram degraus e quais eram enfeite. Hoje ela recebe só `BreadcrumbItem`,
insere os separadores, e `maxItems` (padrão 4, piso 3) mantém a raiz e os dois
últimos.

São **duas defesas, para casos diferentes**. `maxItems` cobre a trilha
profunda; `truncate` nos ancestrais cobre o rótulo único e longo, que contagem
nenhuma resolve. A página atual é `shrink-0` e só cede depois de todos os
outros: **quem cede é o caminho, e nunca o destino** — medido numa caixa de
240px, o ancestral encolhe de 123 para 52px enquanto "Nubank Ultravioleta"
mantém os 132 dele.

**As reticências não são um beco.** `BreadcrumbMenu` abre um `DropdownMenu` com
os degraus dobrados, e a lista o monta sozinha. O que entra ali é o **link**, e
não o `<li>` que o embrulha na trilha: passar o `BreadcrumbItem` inteiro para o
`DropdownMenuItem asChild` produzia `role="menuitem"` num `<li>` sem `href`,
com a âncora aninhada dentro — medido. Junto vem `BreadcrumbLink
variant="menu"`, que tira do link a apresentação da trilha, porque ali a
geometria é do item de menu.

Três correções que não são de layout:

- **`BreadcrumbPage` deixou de ser um link.** `role="link"` mais
  `aria-disabled="true"` é como o shadcn a entrega: um papel de link num
  elemento que não navega faz o leitor anunciar um link e convidar à ativação.
  `aria-current="page"` num `span` é o que a APG prescreve.
- **O `sr-only` dentro do `aria-hidden` saiu.** `BreadcrumbEllipsis` embrulhava
  um `<span class="sr-only">Mais</span>` num elemento `aria-hidden="true"` —
  texto morto, que nunca chegou à árvore de acessibilidade. Um marcador visual
  não precisa de nome; precisa é de não mentir. `PaginationEllipsis` tinha o
  mesmo, e saiu junto.
- **A caixa das reticências era `size-8`.** Numa linha de texto de 20px isso
  fazia a trilha inteira medir 32 — 60% mais alta por causa do marcador.

E o alvo de dedo cresce por **pseudo-elemento**, não por altura: 12px na
vertical (20 + 24 = 44, medido), onde não há nada, e 4px na horizontal, que é
metade do `gap` — dois ancestrais vizinhos encostam sem se sobrepor.

### Paginação é uma posição e dois movimentos

Não é uma fileira de números. Numa lista de transações, "1–20 de 342" responde
a pergunta que a pessoa tem; um link para a página 7 quase nunca. Por isso
**`PaginationStatus` existe como peça** — a documentação antiga já citava esse
texto sem entregá-lo, e toda tela o escreveria à mão. E por isso `align`
(`center` | `between` | `end`) substituiu o `mx-auto … justify-center` cravado,
que impedia a forma mais comum: contagem à esquerda, controles à direita.

**A página atual preenche.** Ela era `variant="outline"`: medido no tema claro,
`oklch(0.985)` de preenchimento contra uma página de `oklch(1)` — 1,03:1, um
contorno de 1px numa fileira de links transparentes. Hoje é `secondary`, que é
a língua de "selecionado" que `Button`, `Toggle` e a bandeja do `Tabs` já
falam.

**`disabled` precisa ser prop porque um `<a>` não desabilita**, e nas duas
pontas da lista os dois extremos precisam disso. Com ele sai um `<span>` sem
`href`, com `aria-disabled` e a opacidade do `Button`.

**Os extremos ficam quadrados no telefone.** Medido antes: com o rótulo
escondido abaixo de `sm`, `PaginationPrevious` saía **40×32**, com 10px de
recuo à esquerda e 12 à direita, ao lado de números de 32×32 — um retângulo
torto numa fileira de quadrados. Depois, a 375px, todos os controles medem
44×44.

E `.nums` em todo link e no status: sem figuras tabulares, 1, 10 e 100 têm
larguras diferentes, e a fileira inteira se reacomoda ao virar a página.

### A escada do `Item`, e o `gap` que a documentação já negava

`size` tinha `default` e `sm` com **a mesma string** (`gap-2.5 px-3 py-2.5`) —
dois nomes, uma medida. É o terceiro parente do mesmo defeito: `Menubar`
entregou 24px e `Tabs` entregou 27, os dois por ancorar a escada no contêiner;
aqui a âncora estava certa e o degrau é que não existia.
[`item-size-ladder.test.ts`](../../src/components/ui/item-size-ladder.test.ts) tranca
isso, e a asserção que vale é a de que **nenhum par de degraus produz a mesma
string**. `default` e `xs` saíram do tipo; `xs` porque a única coisa que o
distinguia era `in-data-[slot=dropdown-menu-content]:p-0`, um componente
conhecendo o contêiner de outro.

**A escada mede recuo, `gap` e a mídia — nunca altura.** `Button` e `Input`
medem altura porque são controles: a caixa é conhecida antes do conteúdo. Uma
linha de lista cresce com o que carrega.

**`ItemContent` declarava `gap-1`, e a página do catálogo já dizia o
contrário** — "`ItemContent` já entrega a entrelinha". Medidos 4px entre o
título e a descrição, que é exatamente o que o par de identidade proíbe. A
documentação estava certa; o código é que discordava.

**`interactive` substituiu o `[a]:hover:bg-muted` implícito.** Aquilo só valia
quando o próprio `Item` fosse um `<a>`, e não tinha par `active:` — o realce
compila dentro de `@media (hover: hover)`, verificado no CSS emitido, então no
telefone não existia em caso nenhum. Agora é explícito, como o `interactive` do
`Card`, com o par de toque, o anel de foco e `pointer-coarse:min-h-11`.

**`ItemGroup variant="divided"` não usa `divide-y`, e a razão foi medida.**
`divide-*` compila com `:where(& > :not(:last-child))`, que não soma
especificidade, enquanto o `Item` traz `border-transparent` **no próprio
elemento** — a primeira versão saía com os fios transparentes, a lista dividida
sem nenhuma divisão, calada. O seletor
`[&>[data-slot=item]:not(:last-child)]:border-b-border` tem classe + atributo +
pseudo-classe e ganha. **No `DescriptionList` o mesmo `divided` usa `divide-y` e
funciona**, porque lá o item não declara borda nenhuma para disputar: é o par
que mostra que a armadilha não é da utility, e sim da colisão.

**E em `divided` o raio sai.** O fio é a borda de baixo do próprio `Item`, que
traz `rounded-lg` — uma borda de baixo num elemento arredondado curva nas duas
pontas (10px neste tema, medidos), e o traço saía arqueado no meio da lista. A
causa não é o fio: é que **uma linha de lista dividida não é um cartão**, e
cartão é a única coisa que tem canto. `TableRow` desenha `border-b` e o arquivo
inteiro não tem um `rounded`; `AccordionItem` desenha `not-last:border-b` e o
raio mora no contêiner. Em `spaced` o raio fica, porque ali a linha **é** um
cartão. O segundo ganho não é o traço: com `interactive`, o realce de uma linha
dividida vira faixa de largura inteira em vez de pílula flutuando na lista. E o
raio das pontas continua sendo de quem contém — cravar `first:rounded-t-lg`
copiaria para dentro do componente um número do contêiner, que é o defeito que
a variante `bare` do `Command` enterrou.

**Ordem importa no arquivo:** `npm run ds:catalog` lê o **primeiro** `variants:`
de cada fonte. Com `itemGroupVariants` declarado antes, o catálogo reportava
`spaced | divided` como se fossem os eixos do `Item`. `itemVariants` vai no
topo.

### O layout do `DescriptionList` se declara uma vez

Ele precisava ser passado **duas** vezes — na lista e em cada item —, e a
página do catálogo documentava isso como se fosse regra. Não era:
`<DescriptionList layout="inline">` sozinho não fazia nada, calado. Hoje o item
lê o do pai por `in-data-[layout=…]`, e o prop local vira o que devia ser: uma
sobrescrita para a linha que foge do padrão.

**A armadilha que isso custa está escrita no arquivo.** `in-*` compila com
`:where()` e não soma especificidade — funciona aqui porque a base do item é
`min-w-0` e mais nada. Quem acrescentar uma base que colida (um `flex-col`
fixo, um `text-*`) reabre o problema, que é exatamente o que aconteceu com o
`divide-y` do `ItemGroup` nesta mesma rodada.

Três eixos novos, e cada um saiu de um caso do produto: **`layout="grid"`**
(duas colunas a partir de `sm`, para o detalhe de cartão com seis campos, que
empilhado é uma coluna alta com a metade direita vazia); **`divided`** (o fio
entre pares, que é o desenho de extrato e de fatura); e **`DescriptionDetails
size="lg"`** para a linha do total. O eixo do peso mora no `<dd>` e não no
item porque **só o valor pesa — o rótulo do total continua quieto** —, e
porque prop no próprio elemento escapa da armadilha de especificidade acima.

E **`.nums` sai de fábrica** em todo `DescriptionDetails`: dígito em lista de
detalhe é sempre dado, e a própria página do catálogo escrevia
`className="nums"` à mão em três linhas seguidas.

### O campo de data era o quarto gatilho fora da régua

O backlog da rodada do `Tabs` dizia "três gatilhos de campo em duas aparências…
vale reabrir a decisão agora que os outros dois convergiram". **A conta era
quatro.** `Select` e `Combobox` vestiam `field-classes`; `DatePicker` e
`FormPickerPopoverTrigger` continuavam sendo `Button variant="outline"`.

Medido no tema claro, lado a lado com o `Input`: o gatilho do `DatePicker` saía
**32px contra 36**, com preenchimento `oklch(0.985)` **opaco** contra
`oklab(0.9 0 0 / 0.3)` translúcido. Um campo de data ao lado de um campo de
texto era mais baixo e de outra superfície — e a nota do
`FormPickerPopoverTrigger` afirmava que ele "parece um campo e não um botão",
o que só era verdade sob `dark:`, onde `outline` recebe `dark:border-input
dark:bg-input-fill/30`.

Os dois convergiram. Depois: **36px, `oklch(0.9)`, `oklab(0.9 0 0 / 0.3)`** —
idênticos ao `Input`, medidos. O `DatePicker` passa a `lg` (a altura do campo);
o `FormPickerPopover` mantém `xl` (40), porque a conversão ali é de superfície e
não de medida.

**A escada de altura entrou em `field-classes`**, como
`fieldTriggerSizeClassName`. O arquivo argumentava — com razão na época — que
ela não podia entrar porque os três consumidores a aplicavam por três mecânicas
diferentes. O que mudou foi a contagem: com os dois gatilhos novos resolvendo
por `data-size` como o `ComboboxTrigger`, são três escrevendo a mesma linha.
`Input` e `SelectTrigger` seguem de fora, e o argumento original continua valendo
para eles.

Sair do `Button` também tira os dois da garantia de maiúscula inicial do CTA, e
isso é correto: `Selecione a data` é placeholder de campo, não rótulo de ação.

### Três defeitos do `DatePicker` que não se viam

- **O foco ficava no `<body>` ao fechar.** Havia um `onCloseAutoFocus` prevenido
  — exatamente o bug que o `FormPickerPopover` já tinha registrado e consertado.
  A justificativa (o salto de rolagem) vale para **abrir** e não para fechar,
  porque o Radix devolve o foco com `preventScroll`. Medido depois: `Esc` põe o
  foco de volta no gatilho.
- **`modal={false}` cravado.** Sem `modal` no telefone, rolar a grade arrasta a
  folha que contém o formulário. Agora é `modal={isMobile}`, como o
  `FormPickerPopover`.
- **Dois `toLocaleDateString` inline**, a regra **I** do auditor com
  `@/lib/transaction-date` ao lado. O `Calendar` tinha mais dois. Os quatro
  saíram; `formatMonthShortPtBr` entrou no helper para o seletor de mês.

E o ícone media `size-3.5` com um `mr-2` empilhado sobre o `gap-1.5` do próprio
`Button` — 14px de distância e um ícone fora da regra `size-4`. Hoje o `gap` do
campo é o único que decide.

**`mode` é união discriminada**, como o `multiple` do `Combobox`: `<DatePicker
mode={x}>` com uma variável não estreita, e o estreitamento tem de ser por
literal em **cada** ponto de uso — um `const isRange = props.mode === "range"`
não faz nada pelo tipo. O intervalo não é luxo:
`transactions-date-range-form.tsx` monta um período com dois `DatePicker`
independentes, que não sabem um do outro.

**O seletor de ano precisou de limite.** Ligar `captionLayout="dropdown"` sem
`startMonth`/`endMonth` faz o `react-day-picker` oferecer **±100 anos** —
medido: 101 opções começando em 1926. O padrão passou a ser cinco anos para cada
lado, que cobre lançamento retroativo e conta agendada.

### A célula do `Calendar` entra na escada, e o `p-0` é o que a faz valer

O botão de dia declarava `size="icon-lg"` — 36 pela escada — e **media 28**,
porque o `className` do próprio componente o sobrescrevia com `size-auto w-full
min-w-(--cell-size)`. É a terceira porta do mesmo defeito: `Menubar` entregou 24,
`Tabs` entregou 27.

Trocar por `md` só mudaria a mentira de 36 para 32, então o botão deixou de
carimbar `data-size` — **um atributo que não corresponde à caixa é pior que
atributo nenhum**. Quem nomeia a medida é o `size` do `Calendar` (`sm` 28, `md`
32, `lg` 36), e ele é **piso**: a grade é elástica, e em ponteiro grosso a célula
sobe para 44 em qualquer degrau.

**E o `p-0` no dia é carga estrutural, não cosmética.** A raiz é `w-fit`, então a
largura da grade sai do `max-content` das células. Enquanto o botão trouxesse o
`px-3` do degrau `md` do `Button`, era esse recuo que dimensionava a coluna:
medido, **39px em todos os três degraus**, com o `min-w-(--cell-size)` nunca
chegando a valer e o `size` sem efeito nenhum. Foi um defeito **introduzido**
nesta rodada ao remover o `size="icon-lg"`, e só apareceu porque a inspeção mediu
os três degraus em vez de um. Com o recuo em zero: 28 / 32 / 36, medidos.

**A ponte do intervalo passou a derivar da célula.** Era `after:w-4` — 16px fixos
contra uma célula que vai a 44 no toque. Hoje é `calc(var(--cell-size)/2)`:
medido, 16px a 32 e **22px a 44**. E a declaração dupla de `rounded-*` em
`range-start` / `range-end` saiu — a mesma propriedade duas vezes na mesma
string, decidida por ordem de emissão.

### O seletor de mês do calendário é o do sistema, e os rótulos falam português

O `react-day-picker` desenha o salto de mês com um `<select>` **nativo** em
`absolute inset-0 opacity-0` por cima de um rótulo falso — é como o shadcn
entrega. Funciona, e o painel que abre é o do sistema operacional: fonte,
medida, cantos e realce fora do tema, sem tema escuro, e sem nenhuma das
decisões que este projeto tomou sobre superfície de comando. O componente
`Dropdown` passou a ser o `Select` do design system.

**A ponte precisa ficar escrita.** O `onChange` do `react-day-picker` é um
`ChangeEventHandler<HTMLSelectElement>`, e o handler interno lê **só
`e.target.value`** (`DayPicker.js`: `Number(e.target.value)`). O Radix entrega
`onValueChange(valor: string)`, então o adaptador é um objeto com a única
propriedade que o outro lado consulta, com um `as` sobre um evento incompleto —
incompletude **medida**, não esquecida. Verificado ponta a ponta: escolher "dez"
levou a grade de `2026-03-01` para `2026-11-29`.

Com o nativo fora, `dropdown` deixou de receber classe, e `caption_label` perdeu
o ramo que desenhava o rótulo falso.

**Mas o `relative` do `dropdown_root` não era resto, e tirá-lo custou um bug.**
A `nav` do `react-day-picker` é `absolute inset-x-0 w-full` com um botão em cada
ponta — ela cobre **também o meio do cabeçalho**, que é onde vivem os seletores.
Enquanto o `dropdown_root` era posicionado, ele pintava por cima; estático, caiu
para trás da faixa e os seletores pararam de responder ao clique. Medido com
`elementFromPoint` no centro do gatilho: quem respondia era o `<nav>`.

O conserto é de raiz — a faixa recebe `pointer-events-none` e os dois botões
`pointer-events-auto`, porque um contêiner de largura total que só tem conteúdo
nas pontas não deve capturar o vão entre elas — e o `relative z-10` volta ao
`dropdown_root` com o motivo certo escrito.

**E a lição de método é maior que o conserto.** O bug atravessou uma inspeção
inteira porque a verificação usava `dispatchEvent` direto no elemento, e **evento
sintético pula o hit-testing**: o painel abria no teste e não abria para uma
pessoa. Quem foi medir foi o usuário. Empilhamento e área de clique só se
verificam com `elementFromPoint` ou com clique de verdade — nunca com
`dispatchEvent`.

**E o gatilho é compacto de propósito.** A fileira vive num `month_caption` que
já reserva `--cell-size` de cada lado para as setas, e como a raiz é `w-fit`, um
`SelectTrigger` com recuo padrão faria **a grade inteira crescer para caber a
legenda** — o calendário passaria a ser dimensionado pelo cabeçalho. Medido
depois: as três larguras seguem 214 / 242 / 270.

**Os rótulos de acessibilidade estavam todos em inglês.** O `locale` do
`date-fns` traduz **nomes** — meses, dias da semana — e nada mais; as frases
conectivas são strings cravadas no pacote: `"Go to the Previous Month"`,
`"Choose the Month"`, `"Choose the Year"`, e o `"Today, … , selected"` que o
leitor de tela anuncia em **cada uma das 42 células**. A grade parecia traduzida
e a camada de acessibilidade nunca esteve. `ROTULOS_PT_BR` conserta isso pela
mesma razão que o `locale` tem padrão neste arquivo: um idioma que só vale
quando alguém lembra de passar não é o idioma do app. Verificado na árvore de
acessibilidade: `"1 de março de 2026"`, `"Ir para o mês anterior"`.

### O `StatCard` compõe, e o par de identidade voltou a ser um

A superfície era montada à mão: `rounded-xl border border-border/80 bg-card p-4
shadow-xs ring-1 ring-foreground/5`. Cada pedaço é um eixo que o `Card` já
governa — e o `border-border/80` era um **quarto peso de borda** no app, que é
exatamente o que o `tone` do `Separator` existe para não deixar acontecer. Hoje
ele é um `Card padding="none"`, e o que fica sendo dele é o **tom de dinheiro**,
que é justamente o que o `Card` não tem.

**O rótulo e o valor levavam `gap-2`** — 8px medidos. É o par de identidade que
este arquivo nomeia com estas palavras ("rótulo sobre valor"), e o invariante diz
"nem `gap-1`". Mesmo defeito que o `ItemContent` teve na rodada 08. A base virou
`gap-0`, e **o respiro voltou a existir só entre o par e a variação** — declarado
pelo contêiner (`[&>[data-slot=stat-card-delta]]:mt-2`), não carregado pela
variação. Não é compensar geometria por seletor: é o contêiner dizendo qual dos
filhos abre um bloco novo, como o `ItemGroup variant="divided"` faz.

**`StatCardValue` reimplementava `MoneyDisplay size="2xl"`** e divergia num
ponto: `letter-spacing` **−0,6px contra `normal`**, medidos. A face mono está
certa e é decisão registrada do `MoneyDisplay` para figura-herói; o que não podia
era duas definições da mesma figura diferirem por um `tracking-tight`. Ele saiu,
e o corpo passou a vir de `--stat-card-value`, que o `size` declara.

**`StatCardDelta` chamava o neutro de `neutral` enquanto o `StatCard` chamava de
`default`** — e o comentário no topo do mesmo arquivo dizia que renomear tinha
sido feito justamente porque "trocar de componente exigia reabrir o fonte para
lembrar qual das duas palavras valia". O arquivo contradizia o próprio
comentário. Zero telas usavam o delta, então corrigir custou nada.

**`direction` desenha a seta, e não decide o tom.** Em finanças subir não é boa
notícia por si só: despesa caindo é bom, entrada caindo é ruim. Um componente que
pintasse de verde tudo que sobe mentiria em metade dos cartões deste app.

### O respiro do `EmptyState` é do pai

As quatro peças carregavam `mb-4`, `mb-2` e `mb-6`, e o contêiner ficava em
`gap: normal` — medido. O layout era decidido **de baixo para cima**: tirar a
descrição mudava sozinho o respiro entre o ícone e o título, e a última peça da
pilha deixava 24px de margem contra a borda de baixo do bloco. Agora o `gap` é do
`EmptyState` e nenhum filho declara margem — medido, zero `margin-bottom` nos
quatro.

**O título deixou de ser um `<h2>` cravado.** Ele punha um `h2` na página toda
vez que um bloco vazio aparecia, inclusive dentro de seção que já tinha o seu —
o caso de duas das quatro telas. O padrão é um `<p>`; quem precisa de cabeçalho
usa `asChild` com o nível certo.

**`variant` existe porque duas telas já a escreviam.** `not-found-shell` e
`route-error-fallback` abrem com a **mesma string** — `className="w-full
border-border/80 bg-card/40 py-10"`. Duas cópias idênticas de uma sobrescrita são
uma variante faltando. `plain` fecha o terceiro caso: dentro de um `Card`, que já
tem moldura própria.

E `EmptyStateIcon` ganhou `tone`, que é o `bg-destructive-muted
text-destructive-muted-foreground` que o `route-error-fallback` pintava à mão.

### O toast estava na fonte do sistema operacional

As cores dele vieram para os tokens numa rodada anterior — o bloco por tipo em
`globals.css`, com a nota "as únicas cores do produto que não vinham daqui".
**O trabalho parou nas cores.** Medido no toast renderizado:

| | toast | o resto do app |
| --- | --- | --- |
| tipografia | `ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto…` | `Inter` |
| corpo | 13px | 12 ou 14 |
| raio | 8px | 10 |
| sombra | `0 4px 12px oklch(0 0 0 / .1)`, sem par no escuro | `--shadow-md`, com valor por tema |
| fechar | 20×20 | 44 em ponteiro grosso |

A primeira linha é a que decide: **o toast era a única superfície do app que
trocava de tipografia com o sistema operacional** — SF Pro no Mac, Segoe no
Windows, Roboto no Android —, e são **222 chamadas**.

**Empatar a especificidade não bastou, e a razão vale para qualquer biblioteca
que injete folha própria.** O sonner declara raio e sombra em
`[data-sonner-toast][data-styled=true]` (0,2,0) e injeta o CSS **em tempo de
execução**, ou seja depois da folha do app: com a mesma especificidade, quem vem
depois ganha. Medido duas vezes — com um atributo só, a fonte entrou e o raio
ficou em 8px; com 0,2,0 dos dois lados, o raio **continuou** em 8px. O seletor
daqui é descendente (0,3,0), o mínimo para vencer sem `!important`. (A
tipografia foi a exceção e por um motivo próprio: o sonner a declara no
**contêiner**, então declará-la no próprio toast já ganha — propriedade posta no
elemento vence a que ele herdaria, qualquer que seja a especificidade.)

**Os ícones não eram Heroicons**, e é o único lugar onde a regra **G** vazava
sem nenhum guarda pegar: o ESLint olha imports, o auditor olha o repositório, e
esses SVGs moram em `node_modules`. Medido no DOM: `viewBox="0 0 20 20"` sem
`data-slot` no ícone de tipo, `0 0 24 24` no ×. Hoje entram pelo prop `icons`.

**E as cores só ficaram certas na rodada seguinte.** O bloco afirmava
"espelhando as variantes do `Alert`" e **não espelhava**: o Alert usa o token
`bg-{tom}-muted`, e ali havia `color-mix(--{tom} 10%, --popover)` — segunda
receita para a mesma superfície. Medido no claro, o mesmo aviso em dois cremes:
`255,243,216` no Alert contra `252,243,230` no toast, distância RGB **14** (os
outros três, entre 6 e 9). Nenhum reprovava em contraste, então nunca foi
acessibilidade: era uma medida escrita à mão ao lado de outra que precisava
concordar com ela. Hoje os dois leem os mesmos tokens — **distância 0** nos
quatro tons, nos dois temas.

Junto vieram três superfícies que nunca tinham saído da paleta da biblioteca:

- **O toast sem tipo, e o `loading` do `toastPromise`, estavam em preto puro.**
  Medido no escuro: fundo `0,0,0` contra os `23,23,23` do `--popover`, borda
  `51,51,51` contra `25,26,26`. **Preto puro é uma cor que este design system
  não usa em superfície nenhuma** — a página é `37,37,37`. No claro passou
  batido porque o branco do sonner e o `--popover` coincidem, e é exatamente
  assim que um defeito de tema escuro sobrevive.
- **A descrição saía em cinza** (`rgb(63,63,63)`) sobre a superfície colorida —
  a decisão que o `Alert` documenta e reverteu. Hoje é `currentColor` a 85%.
- **O × e o botão de ação não vestiam o tom**: borda cinza e tinta quase preta
  sobre um toast verde, e o "Desfazer" como preenchido invertido. Hoje são
  contorno e `currentColor`, como o `AlertActions` — **mas o fundo dos dois é
  diferente**, e tratá-los como a mesma peça custou um bug. O botão de ação vive
  *dentro* do toast, então fantasma é o certo; o × é `position: absolute` e
  **cavalga a borda** (medido: 6px para fora em cima e à esquerda), então
  transparente ele lia como um furo no canto, mostrando a página. Ele leva a
  superfície do próprio toast.

  A quebra veio junto com o conserto: os dois estavam numa regra só com
  `background: transparent`, e o × só começou a vazar quando a especificidade
  subiu para 0,4,0 **para consertar o preenchimento do "Desfazer"**. A medição
  de verificação foi feita antes de a mudança valer no ×, e por isso passou.

  E **a borda do botão de ação só apareceu quando ganhou largura**: havia só
  `border-color`, a cor era aplicada e a borda nunca desenhava, porque o sonner
  deixa `border-style: none`. O "Desfazer" era texto pelado. Com os três, ele
  fica **idêntico ao botão da `AnnouncementBar`** em sete medidas — 24 de
  altura, `0 8px`, raio 10, corpo 12, peso 500, `1px solid`, `currentColor/25` —,
  que é o `Button variant="tertiary" size="xs"` que ela usa. Ali não dá para
  usar o componente (quem renderiza é o sonner), dá para chegar na mesma caixa.

  **E chegar na mesma caixa foi mais do que a borda.** Um diff dos 693
  computados contra o botão da barra acusava **14 diferenças** depois dela, e as
  que importavam eram de estado: **nenhum anel de foco** — medido, `box-shadow:
  none` e `outline: none` num controle alcançável por teclado —, sem o
  `active:translate-y-px` que todo botão do app tem, e o realce em **400ms com a
  curva do navegador** contra os 150ms e a curva do Tailwind. Mais
  `white-space: wrap` com `overflow-wrap: anywhere` herdados do sonner, que
  deixam um rótulo de duas palavras quebrar no meio de uma delas.

  A última a cair foi a **entrelinha**: 18px contra os 16 do `text-xs`, porque
  eu tinha declarado `font-size` sem `line-height` — o mesmo erro da borda sem
  largura, um passo adiante. Num botão de 24px isso desloca o centro óptico do
  rótulo. Hoje o diff dá **zero**.

  A lição de método: **um diff de todos os computados acha o que a conferência
  propriedade a propriedade não acha.** Eu tinha conferido sete medidas à mão e
  declarado paridade; faltavam nove.

  **E o realce dos três se alinhou em `current/10`.** O `AlertActions` sempre
  disse "borda, tinta e realce saem de `currentColor`"; a `AnnouncementBar`
  tinha nascido com `foreground/10` — quase igual no escuro, visivelmente
  diferente no claro —, e o toast herdaria a divergência ao copiar dela.

E a exceção do ícone âmbar **saiu**: ela existia para compensar o mix de 15% que
lavava o amarelo, e com `--warning-muted` de verdade a causa desapareceu.
Medido depois: 7,81 no claro e 10,8 no escuro, bem acima dos 3:1 que um ícone
pede.

**A cascata cobrou de novo, e num lugar diferente.** As regras de tipo precisam
ficar acima da base (senão a base apaga as tonais), e os **controles** precisam
de `[data-styled]` no seletor: o sonner os declara em 0,3,0, e com o empate a
cor e a borda pegavam mas o **preenchimento não** — o "Desfazer" continuava um
bloco invertido, medido. Com `[data-styled]` são 0,4,0.

**E a física continua sendo do sonner, de propósito**: empilhamento, arraste,
`promise`, deduplicação por `id` e a largura de 356px. É o mesmo julgamento da
rodada do `vaul` — pega-se o mecanismo emprestado e veste-se a cromagem própria.

`lib/toast.ts` ganhou `toastInfo` (o tipo já estava estilizado no CSS e não
tinha helper), `toastUndo` e `toastPromise`. **O desfazer é o que permite
excluir sem diálogo**: ele troca um clique de confirmação cobrado de todo mundo
por uma janela de arrependimento que só quem errou usa. Por isso a duração dele
é a mais longa da casa (8s) — quem apagou por engano leva alguns segundos para
perceber, e um desfazer que expira antes disso não existe. Ele **não** substitui
o `AlertDialog` no que não tem volta.

### O `Stepper` sabia menos que a lista que o contém

`StepperItem` recebia `step` e `isLast` como props, com `Omit<…, "children">` —
os dois são exatamente o que o **pai** sabe e o filho não. Quem chamava escrevia
`isLast={i === ETAPAS.length - 1}` toda vez, e errar isso desenhava um conector
para lugar nenhum. É a mesma correção que a `BreadcrumbList` recebeu na rodada
08 ao assumir os separadores: o contêiner deriva do índice, e o item volta a
aceitar `children`.

**A trilha parava a 78% da largura.** Todos os itens eram `flex-1`, inclusive o
último — que não desenha conector. Medido: quatro itens de 218px, com o último
ocupando os mesmos 218 para mostrar um marcador de 24, e **~192px de vão morto**
depois dele. Com `flex-none` no último: 278/278/278/**37**, e 13px até a borda.

**O estado existia só em cor e ícone.** `data-state` não é lido por tecnologia
assistiva e o tique é `aria-hidden`, então uma etapa concluída e uma futura
soavam idênticas. Cada item carrega "concluída" / "etapa atual" / "não iniciada"
em `sr-only` — **depois** do rótulo, para o anúncio sair "Conta, concluída".

**E o rótulo não estava centrado no marcador.** O `<span>` era `sm:block` e
ocupava a **célula inteira** — 278px medidos — com o texto rente à esquerda:
flush com a borda do marcador, mas com o centro da caixa a **127px** do centro
dele. O olho lia a palavra pendurada no círculo em vez de presa a ele. Hoje o
rótulo é `w-max` deslocado por meia largura do marcador (que virou variável, para
não ser um número repetido em dois lugares que precisam concordar). Medido
depois: desalinhamento **0** nos degraus 2, 3 e 4.

**A primeira é a exceção, e é geometria e não gosto:** o marcador dela encosta na
borda esquerda da trilha, então centrar a palavra a faria sair para fora — 5px
com "Conta", e proporcional ao comprimento do nome. A última não precisa da
exceção porque a trilha deixa 13px de folga ali, contra os ~6 que ela pede. E a
condição é `step === 1`, **não `first:`**: o rótulo não é o primeiro filho do
corpo — o marcador é —, então o variante não casaria com nada.

**A vertical tinha o mesmo defeito nos dois eixos dela.** O rótulo fica ao lado
do marcador com `items-start`, e o marcador (24) é mais alto que a caixa de uma
linha de texto (20): os topos coincidiam e os **centros ficavam a 2px** um do
outro — igual nos quatro degraus, que é a assinatura de desalinhamento
sistemático e não de acaso. E o conector vertical usava `ms-2.5`/`ms-3`, meia
largura do marcador escrita à mão por degrau, sem descontar a espessura do
próprio fio: o traço de 1px caía com o centro **1px à direita**. Hoje o rótulo
tem `min-h` do marcador com `items-center`, e o conector recua
`calc((var(--stepper-marker) - 1px) / 2)`. Medido depois: **0 e 0**, nos quatro.

**E `asChild` custou dois consertos medidos.** O `Slot` do Radix exige um filho
único, e a linha da etapa tem três nós: a primeira versão lançava
`React.Children.only expected to receive a single React element child` e a
página inteira caía no limite de erro. A saída é a do `Button`: clona-se o
elemento de quem chama e injeta-se o corpo como filhos **dele**. Depois disso,
medido de novo, o nome acessível do botão saía **"concluída"** — porque o rótulo
ainda vivia fora do corpo clicável. O corpo passou a ser tudo: hoje o alvo é
278×46 e o nome é "Conta, concluída".

### A faixa dizia a gravidade só com cor

A `AnnouncementBar` não tinha ícone em **nenhum** dos cinco tons — medido. É
exatamente o que o `Alert` resolve com um, e a mecânica adotada é a de lá: o
ícone entra como filho direto e é medido por variável, com o espaço se
adaptando por `has-[…]`.

**`role="status"` era cravado, inclusive em `destructive`** — um erro bloqueante
anunciado com polidez. Hoje o papel segue o tom: `alert` no destrutivo, `status`
nos outros quatro, e `role` explícito ainda sobrescreve.

**A altura dependia do botão de fechar**: 40px sem, **44px com**, medidos — o
`Button size="xs"` (24) é mais alto que a linha de texto, então era ele quem
mandava, e uma barra que ganha o × ao mudar de estado saltava 4px. A linha passa
a declarar `min-h`, e o alvo do × cresce por **pseudo-elemento** e não por
medida — crescer de verdade devolveria o salto. Medido depois: 44 constante, com
e sem o botão, e alvo efetivo de 44 no telefone.

Ganhou `AnnouncementBarActions` (o caso canônico "você está offline — tentar de
novo" não tinha lugar), `size` e `sticky`, que aplica a camada `--z-banner` que
a escala reservava para isto.

**E o consumidor apareceu.** `offline-banner.tsx` era um `Alert` desfazendo a
própria forma em cinco classes, com `AlertDescription` sem `AlertTitle` — o que
a documentação do `Alert` proíbe. Ele passou a ser uma `AnnouncementBar`, e o
tom deixou de ser `default`: cinza neutro para um estado que é, por definição,
degradado. **O posicionamento continuou `fixed`**, e isso é uma decisão
explícita — a variante `sticky` seria melhor ali, mas a tela exige sessão
autenticada e a troca **não deu para verificar**. Trocar layout sem medir é o
que produziu o bug do calendário nesta mesma série.

### O `Field` prometia uma ligação que não existia

Três lugares afirmavam que ele entregava `htmlFor`, `aria-describedby` e
`aria-invalid` "já ligados": esta linha, o índice de busca do catálogo e a
página do componente. Um quarto — `lib/field-classes.ts` — dizia o contrário, e
era o que estava certo: **não havia `useId`, nem contexto, nem
`aria-describedby` em `field.tsx`**.

A prova mais dura estava na própria página que fazia a promessa: **19 `htmlFor`
escritos à mão, 4 `aria-invalid` e 1 `aria-describedby`** em 313 linhas. No app,
**24 `aria-invalid` contra 5 `aria-describedby`** — campos marcados como
inválidos cujo texto de erro nunca chegava ao leitor de tela. E **zero
consumidores**: nenhum arquivo fora de `src/app/designsystem/` importava o
componente, enquanto 27 arquivos montavam **104 campos à mão** em **5 dialetos
de espaçamento** (`space-y-2` 39, `space-y-1.5` 27, `grid gap-2` 18,
`flex flex-col gap-2` 12, `flex flex-col gap-1.5` 5).

O mecanismo agora é o do `Popover`: `FieldDescription` e `FieldError` **se
registram**, e o `aria-describedby` só é escrito quando existe alvo — apontar
para um `id` ausente deixa a descrição vazia. Renderizar um `FieldError` é o que
torna o campo inválido, então o fato deixa de ser escrito duas vezes.

**`FieldControl` é embrulho explícito, e não um hook dentro do `Input`.** Um
`Field` pode conter mais de um controle — o app tem 8 linhas de dois campos lado
a lado —, e um hook faria os dois reivindicarem o mesmo `id`, com a
reivindicação sendo estado durante o render. **E não é um `Slot`**: o `Slot` do
Radix resolve conflito com `{...slotProps, ...childProps}`, o filho vence, e
para `aria-describedby` isso perderia calado o id da descrição e o do erro. Aqui
os três são compostos.

**Cinco seletores mortos saíram**, todos da família "sobreviveu à remoção":
`data-[invalid=true]` e `group-data-[disabled=true]/field` (ninguém escrevia
nenhum dos dois atributos — agora o componente os carimba),
`has-[>[data-slot=checkbox-group]]` e `data-[slot=checkbox-group]` (não existe
`data-slot="checkbox-group"` neste projeto, e o segundo ainda testava o slot do
**próprio** elemento), e `group-data-[variant=outline]/field-group`
(`FieldGroup` nunca teve prop `variant`).

**`orientation="responsive"` nunca tinha funcionado.** Ela lê
`@md/field-group:`, e o contêiner só existe dentro de `FieldGroup` — que tinha
**zero** usos, inclusive no catálogo, onde só `horizontal` era demonstrada.
Um contêiner **não consulta a si mesmo**: uma *container query* vale para os
descendentes, e a direção do flex é declarada no próprio `Field`, então declarar
`@container/field` ali não resolveria. `FieldSet` e `FieldRow` passaram a
declarar o contêiner também, e a página demonstra a virada. Medido: coluna a
384px, linha a 600, coluna de novo a 380 — **por contêiner, com o viewport
parado**.

**`size` deu nome a um degrau que já existia**: 29 `<Label className="text-xs">`
e 73 textos de ajuda em `text-xs`/`text-2xs` contra um `FieldDescription` que
era `text-sm`. Ele desce **por contexto React**, e não por `data-*` com `in-*` —
esse variante compila com `:where()`, que não soma especificidade. E **ele não
decide a altura do controle**: ancorar a escada no contêiner é o defeito
cometido quatro vezes nesta base, e um `Field` não sabe que controle carrega.
Medido: rótulo e ajuda a 14px com controle de 32 em `md`, 12px com 28 em `sm`.

**O contorno do cartão de escolha estava errado nas duas metades.** Era
`border-primary/30`. No tema claro `--primary` e `--primary-accent` são a mesma
cor; no escuro divergem, e a 30% davam **1,32:1** contra **1,64:1** — os dois
invisíveis. Varrendo os degraus contra o fundo real do cartão, **60% é o
primeiro que alcança 3:1** — 3,01 no claro e 2,99 no escuro, contra 1,35 e 1,32
do não selecionado. E o realce ganhou par `active:`, verificado no CSS emitido:
a regra de `:hover` aninha `@media (hover: hover)` e a de `:active` não tem
media nenhuma.

Mais: `FieldLabel` e `FieldTitle` emitiam **o mesmo `data-slot`**, e nenhum
seletor os distinguia; `FieldContent` separava título e descrição com `gap-0.5`,
que é o par de identidade sendo violado pela terceira vez (depois de
`ItemContent` e `StatCard`); `FieldDescription` compensava geometria de outra
peça com duas margens negativas; e `role="group"` era carimbado em **todo**
campo, **sem nome** — a mesma medição do `Popover`, um papel sem nome é
anunciado como o papel e nada mais. Hoje o papel é opt-in e sai com
`aria-labelledby`.

**`FieldRow` é a única peça nova**, e sai de contagem: 8 linhas de dois campos em
4 grafias, cinco delas **sem empilhar no telefone**. Não entrou um
`FormSection` — as ~50 grafias de cabeçalho de seção já têm peça (`FieldSet` +
`FieldLegend`), que tinha zero usos porque era `text-base`/`text-sm` enquanto o
app escreve `text-xs font-medium`; com o eixo `size` ela passa a servir. Nem um
marcador de obrigatório: existem **zero** no app, e a convenção é **invertida**
— marca-se o opcional, que é o que `FieldLabel optional` codifica.

### O `CustomForm` está pronto, e as três lacunas eram de uma linha

**38 consumidores, 2 `<form>` crus** — os dois dentro do próprio componente.
*(Recontado na rodada em que ele virou molécula: **54 chamadas em 29 arquivos**,
e **um** `<form>` cru, o do próprio componente.)* A
mecânica do Enter está correta, inclusive a parte difícil: o `form.id` para o
botão portalizado num `DialogFooter`, e a regra do
`form-picker-popover-search`. Nada disso mudou, e o layout também não: os 38
consumidores trazem o próprio `gap`.

O que entrou: **guarda de `isComposing`** — a string não aparecia em lugar
nenhum do repositório, e o Enter durante a composição de um acento enviava o
formulário no meio da palavra —, **`⌘/Ctrl+Enter`** para enviar de dentro de um
controle que fica com a tecla, e `data-slot="form"`. Verificado no componente
real: Enter no textarea não envia, `⌘+Enter` envia, `Ctrl+Enter` envia,
`isComposing` **não** envia nem com `⌘`, e Shift+Enter nunca envia.

**A lista de regras virou fonte.** A página `formularios` a redigitava, e já
tinha divergido: mostrava **6** regras enquanto o código checava **7**, e a que
faltava era justamente a do seletor ancorado. Hoje é `ENTER_DEFERRAL_RULES`, e a
página a importa. `shouldDeferEnterToWidget` passou a ser exportada — enquanto
era privada, as sete regras eram promessa sem asserção, e não existia
`form.test.ts`.

### A tese do `Toolbar` era contradita pelas seis barras que ele deveria descrever

Ele dizia "no telefone os itens quebram em linhas em vez de encolher", e a
página repetia. **Nenhuma das 6 barras reais faz isso**: todas renderizam duas
árvores e **trocam o conteúdo** — um botão só de ícone no telefone, o mesmo
comando rotulado no desktop. Ele tinha **zero consumidores** enquanto existiam
`transactions-toolbar` (378 linhas), `bills-toolbar` (412),
`categories-toolbar` (395), `subscriptions-toolbar` (160) e
`dashboard-toolbar` (27), mais **um clone de cada num arquivo de esqueleto**,
com as strings copiadas.

**Ele não ganhou eixo nenhum, e isso é a leitura honesta das contagens.** Não há
`cva` no arquivo, como em `Container` e `PageSection`. `sticky` foi reprovado
(zero barras fixas no app; `--z-sticky` tem um consumidor no projeto inteiro);
`align` foi reprovado porque as 4 grafias (`justify-between`,
`md:justify-between`, `ml-auto`, `md:justify-end`) querem a mesma coisa; e
empilhar no telefone parecia 2 de 6 e é **1**, porque o `flex-col` de
`subscriptions-toolbar` é vestigial — na largura de telefone a raiz tem um filho
visível.

**O que substitui as 4 grafias é uma `ms-auto` em `ToolbarActions`**, e não
`justify-between` na raiz. As duas empatam com dois grupos, e só a margem acerta
os outros dois casos: com **um** grupo, `justify-between` renderiza
`flex-start`; com **três**, o `transactions-toolbar` chega a alternar
`md:justify-between` ↔ `md:justify-end` em tempo de execução. Ela é a **única**
margem automática do arquivo, e o teste tranca a contagem — duas dividem a sobra
em partes iguais.

**A densidade virou variável, e não eixo.** A raiz publica
`--toolbar-control`; `toolbarControlClassName` e `toolbarIconControlClassName`
a leem. Ela chega por `className` e não por seletor descendente porque `in-*` e
`group-*` compilam com `:where()` e empatariam com o `h-8` do próprio `Button`,
perdendo por ordem de emissão; por `className` quem decide é o `twMerge`, que
**remove** o degrau conflitante. Medido no navegador: com a régua, 40px e 56px
quando a variável muda; sem ela, 32px fixos do degrau do `Button`; e o `h-8` de
fato **sai** da lista de classes.

**E a pergunta é o dedo, não a largura.** As 6 barras escrevem `md:h-8` — 19
vezes, mais 6 esqueletos, mais quatro constantes `monthNavDense*` cujo ramo
`false` é código morto. Com `md:`, um desktop de 700px recebe 40px que ninguém
pede e um tablet em paisagem recebe 32px que o dedo não acerta. A regra já
estava escrita no item de menu, e o `Calendar` já a aplica: aqui é
`pointer-coarse:`. Não custou migração nenhuma — o componente não tinha
consumidor. Medido: 32px com ponteiro fino, **40px com ponteiro grosso**, com os
botões sem régua ficando em 32 e mostrando exatamente a lacuna que ela fecha.

`ToolbarSearch` virou **`ToolbarFilters`**: nenhuma barra do app tem campo de
busca — a de transações mora dentro da folha de filtros —, e o que o grupo da
esquerda carrega em 5 das 6 é um trilho segmentado. O nome descrevia a única
demonstração da página, que por sua vez não descrevia tela nenhuma. Entraram
**`ToolbarRow`** (a linha do telefone que se dissolve no `md` — `md:contents`
aparece 5× no app, escrita à mão; medido: `flex` a 375px, `contents` a 1443) e
**`ToolbarFilterIndicator`** (o ponto de filtro ativo, hoje em **4 grafias**;
ficou a que três das quatro compartilham, e a que saiu era a que sangrava para
fora da caixa do botão).

**A decisão de não carimbar `role="toolbar"` fica, e ganhou o contraexemplo**: o
app o escreve à mão em 4 barras de seleção, nenhuma com foco itinerante, e duas
delas são cópia literal das outras duas.

**E o embrulho vai no controle, nunca no invólucro.** Medido nas próprias
demonstrações do catálogo, depois de escritas: `<FieldControl><Select>…` clona
a raiz do Radix, que **não renderiza nó nenhum** — o `id` não chega a lugar
algum e o rótulo aponta para o vazio. E `<FieldControl><InputGroup>…` põe o
`id` na `div` do grupo: o alvo existe, não é rotulável, e o `<label for>` deixa
de fazer qualquer coisa. Os dois são o defeito que esta rodada existe para
eliminar, reproduzido por quem acabara de consertá-lo. A forma certa põe o
embrulho no `SelectTrigger` e no `InputGroupInput`, e a varredura que fecha o
assunto é dura: **todo `[data-slot=field-label][for]` da página tem de apontar
para um elemento que existe e é rotulável** — 16 de 16 na página do `Field`.

### Duas lições de método desta rodada

**`getComputedStyle` pode devolver valor velho no mesmo passo.** A primeira
medição da régua de densidade disse que ela **não governava** — a variável
mudava e a altura não. O componente estava certo; o instrumento não. Lendo dois
quadros depois, a altura acompanha. A prova de que o erro era meu: um
`height: 48px !important` inline também "não valia", o que é impossível.
**Medição de layout se lê depois de um quadro, nunca no mesmo passo da
mutação.**

**Classe montada em tempo de execução não existe — inclusive na sonda.** Ao
varrer os degraus de alfa do contorno, `/70` e `/80` deram contraste *menor* que
`/60`. Não era inversão: essas classes não aparecem em fonte nenhuma, o Tailwind
nunca as emitiu, e a borda caía para o valor padrão. A regra que este arquivo já
registra pegou a própria ferramenta de medição.

### A revisão da barra, e três coisas que ela achou

A rodada 11 entregou a `Toolbar` e a página dela. A revisão apontou três
problemas, e nos três a medição mudou o tamanho do achado.

**A busca tinha sido removida por um argumento meio certo.** Ela saiu porque
nenhuma tela do app tem busca na barra, e a demonstração era a única da página —
ensinar uma forma inexistente é pior que não ensinar. Mas a conclusão estava
errada: o conserto era **somar** as formas reais, não apagar a busca. Este
catálogo nunca foi só espelho do app — `Drawer`, `ContextMenu`, `Menubar`,
`HoverCard` e `Stepper` foram todos documentados sem consumidor, de propósito —
e o `ToolbarFilters` é `min-w-0 flex-1`: ele tem a geometria de um campo que
cresce, e nada usava isso.

**O trilho estava com o componente semanticamente defensável e a aparência
errada.** As seis barras do app desenham um *segmented control* — bandeja
`bg-muted` com realce —, que neste sistema é `Tabs variant="solid"`. A
demonstração usava `ToggleGroup variant="outline"`, uma fileira de botões
contornados: quem copiasse do catálogo construiria algo que não se parece com o
produto. Trocar o componente certo pela aparência errada é o defeito menos
visível de uma página de catálogo, porque ela continua "correta".

### O inventário dos trilhos: não são seis, são onze, e em três grupos

| Grupo | Quantos | O que decide |
| --- | --- | --- |
| **Aba** | 4 | faturas `Contas/Pendentes` troca o card **e reseta o eixo de ordenação**; cartões `Cartões/Histórico` troca uma grade por um gráfico de 12 meses |
| **Filtro** | 3 | transações vira `qb.eq("type", …)` na **mesma** tabela montada; assinaturas é `rows.filter(...)`; histórico de fatura ainda reseta a paginação |
| **Controle de formulário** | 4 | o valor é a coluna que vai ser gravada, ou a pergunta que decide qual grupo de campos aparece |

Dois achados valem mais que a contagem. **`TransactionTypeSegment` é aba numa
tela e filtro na outra**: em `transactions-toolbar` ele filtra a tabela; em
`categories-toolbar` ele troca `IncomeCategoryCard` pela grade de despesa e
esconde o navegador de mês. Mesmo componente, semânticas opostas. E **quatro
`role="tablist"` estão dentro de formulários**, um deles debaixo de um
`<Label>Como informar os valores?</Label>` — rádio vestido de aba, e o pior dos
onze.

Os dez anunciam o padrão ARIA de abas com **zero `tabpanel`**, zero
`aria-controls` e zero foco itinerante.

### `Tabs` para o trilho, e o `ToggleGroup` que não segura o invariante

A escolha foi `Tabs variant="solid"`, e ela custa uma dívida registrada: os 3
filtros ficam com `role="tab"` sem painel. O destino deles é `ToggleGroup`, que
hoje não serve — **medido: clicar no item já ativo de um `type="single"`
desmarca tudo**, os três vão para `off`, zero selecionados. Num filtro que já
tem "Todas" como neutro, isso é um quarto estado que ninguém pediu. Ele ainda
emite `role="radio"` dentro de `role="group"`, e não de `radiogroup`. Tem zero
consumidores, então o conserto é grátis — e é ele que destrava a saída.

**A bandeja é 8px mais alta que o gatilho, e isso é certo.** A régua da barra
mede **controle**, e uma bandeja não é um controle: é o contêiner que segura um.
`Tabs size="md"` põe o gatilho em **32** — exatamente o degrau de ponteiro fino
da barra, medido — e a bandeja em 40. Forçar a bandeja a 32 exigiria um gatilho
de 24, que é o degrau `xs`, reservado para dentro de outro controle. Ancorar
escada em contêiner é o defeito que esta base já cometeu quatro vezes.

### A vertical carregava a altura da bandeja, e isso quebrava três coisas de uma vez

Medido: a moldura vertical saía com **36px para 108px de conteúdo**. Uma causa,
três sintomas — e os três foram relatados como problemas separados:

1. **Dois dos três gatilhos ficavam fora da moldura.** Eles ainda pintavam
   (`overflow: visible`), então o defeito lia como "a lista não está toda
   visível" em vez de "a caixa está errada".
2. **O `border-e` — o fio — percorria só os 36 primeiros pixels.** Ele aparecia
   como um traço parado ao lado da primeira aba que **não se movia** ao trocar
   de aba, e por isso era natural confundi-lo com o marcador. Não era: o
   marcador estava correto o tempo todo, em `y: 74px`, do lado de fora da caixa.
3. A altura declarada não tinha significado nenhum ali.

**Na vertical `size` não nomeia altura.** Ali o eixo cruzado é a **largura**, e
a altura é a soma das linhas. A classe passou a ser escopada —
`data-[orientation=horizontal]:h-9` —, e o teste de régua agora exige as duas
coisas: que a altura exista **e** que ela nunca apareça solta.

**E os rótulos estavam centrados.** Com `justify-center` nas duas orientações,
numa coluna de 105px os três textos começavam a **35, 24 e 10px** — 25px de
borda serrilhada, porque cada aba centrava o próprio rótulo numa largura comum.
Uma coluna de navegação se lê pela margem esquerda:
`data-[orientation=vertical]:justify-start`. Medido depois: 10, 10 e 10, com a
horizontal seguindo centrada.

### As três variantes do `Tabs` eram a mesma coisa pintada de três jeitos

Medido, com as três lado a lado e nenhum `size` declarado: **moldura 32, gatilho
28 e fonte 12,8px nas três**. Elas diferiam só no que a moldura pintava —
bandeja, fio ou nada — e em mais nada. Isso está errado porque elas não são a
mesma coisa:

- **`solid`** é um controle segmentado, e vive numa **linha de controles**: a
  bandeja tem de medir 32 para ficar rente ao `Button` ao lado.
- **`underline` e `ghost`** são **abas de página**. Não dividem linha com
  controle nenhum; dividem a página com título e texto corrido.

Hoje `size` tem padrão **por variante** — `md` no `solid`, `lg` nas outras duas.
E o ganho não é só de altura: **`lg` é o degrau em que o rótulo volta ao corpo
de texto da página**, porque só `sm` e `md` carregam `text-control-sm`. Uma aba
de página em 12,8px era o defeito. Medido depois: `solid` 32/28/**12,8px**,
`underline` e `ghost` 36/32/**14px**.

A forma tem precedente no próprio arquivo — `stretch` resolve assim desde a
rodada do `Tabs` (`stretch ?? variant === "solid"`). Esta é a segunda prop a
usá-la, e é o que faz as três serem três **tipos** em vez de três pinturas. O
padrão mora em `defaultTabsSize(variant)`, exportado, para ser inspecionável em
vez de enterrado numa expressão.

**A regressão que importava não aconteceu**: as 5 `TabsList` da `Toolbar` são
`solid`, e continuam com bandeja 32 rente aos controles. E no ponteiro grosso as
três convergem para 40/36, com o marcador acompanhando.

A página do catálogo passou a ser dividida **pelos três tipos**, com o que é de
cada um dentro dele — a nota de que o `ghost` não viaja agora fica ao lado da
demonstração que ela explica, em vez de vinte seções abaixo. As seções que de
fato atravessam os três (altura, distribuição, excesso horizontal, vertical)
ficaram depois. E saíram os botões de comparação que eu tinha posto ao lado de
cada bandeja: a equivalência com o `Button` já está escrita na dica de cada
degrau, e eles poluíam uma seção que é sobre a escada.

### `--primary-muted`: a marca não tinha tinta suave, e o `Badge` mentia

O `Badge` tem oito variantes e todas são tintas `-muted`. **Nenhuma era a
marca** — e `variant="primary"` renderizava `--info-muted`, ou seja **azul**
(medido: 4/44/67 em RGB), num sistema em que `primary` é o verde em todo o
resto. Havia um consumidor vivo da mentira: o "Beta" de
`bills-toolbar.tsx:189`, que saía azul sem ninguém ter pedido azul.

O par `--primary-muted` / `--primary-muted-foreground` entrou nos dois temas,
com a mesma receita de `success` e `info` no matiz da marca (166): `0.96 0.03` /
`0.32 0.1` no claro, `0.27 0.06` / `0.88 0.06` no escuro.

**O que motivou**: a contagem de filtros na barra. O app já fala verde para
"filtro ativo" — as três grafias da bolinha usam `bg-primary` —, e trocar o
ponto por um badge cinza mantinha a informação e perdia o sinal.

**E a medição corrigiu a minha própria leitura.** A primeira conta olhou a
pílula contra o botão e deu **1,06** no claro, pior que os 1,19 do cinza — o que
parecia reprovar o token. Calibrando contra a família, a pílula é invisível no
claro em **todas** as variantes tonais (`success` 1,06, `warning` 1,06): ali
quem sinaliza é a **tinta**, e nela o verde dá **11,26** contra os **5,76** do
cinza. No escuro a conta se inverte e é a pílula que carrega (14,71). Medir o
componente errado quase enterrou a decisão certa.

### `size` no `Tabs` passa a nomear a bandeja — e a rodada anterior parou no meio

O eixo `padding` da rodada 12 tornou o alinhamento **possível**, mas por opt-in,
e o padrão continuou entregando 40 numa linha de 32. A prova de que o padrão
estava errado é a própria migração: **6 de 6** chamadas pediam `tight`, nenhuma
usava o padrão. Padrão que ninguém escolhe não é padrão.

E o problema era maior que o recuo. A frase **"alinha sem ninguém dizer
`size`"** é a promessa desta casa — está nas páginas do `button`, do `input` e
do `toggle`, e nas três é verdadeira porque ali `size` nomeia **a altura do
elemento que se posiciona** (`h-7 / h-8 / h-9 / h-10`, medido em `Button`,
`Toggle`, `Select` e `NativeSelect`). **O `Tabs` era o único do sistema em que
`size` nomeava uma peça interna**, e herdou a frase sem herdar o comportamento.

Hoje `size` nomeia a bandeja, o gatilho deriva, e o eixo `padding` saiu:

| `size` | bandeja | gatilho |
| --- | --- | --- |
| `sm` | 28 | 24 |
| **`md`** | **32** | 28 |
| `lg` | 36 | 32 |
| `xl` | 40 | 36 |

Os oito números são degraus da escada. Medido nos quatro: **a bandeja é idêntica
ao `Button` de mesmo nome**, com o gatilho em bandeja − 4.

**Isto não repete o defeito das rodadas do `Menubar` e do `Tabs`.** Lá o
`TabsList` era `h-9` com `p-1` e o gatilho saía `h-[calc(100%-1px)]` = **27** —
número que não existe na escada, enquanto a documentação dizia 32. O defeito era
a **mentira**, não o modelo. Aqui os dois números são reais e os dois estão
escritos. O gatilho de `sm` cai a 24, e isso é correto: `xs` é o degrau que a
escada reserva para "dentro de outro controle", e é onde ele está.

**Fechou o defeito do ponteiro grosso** que a rodada 12 deixou aberto (bandeja
48 contra controles de 40): quem cresce no toque passou a ser a bandeja, com
piso de 40 — o mesmo degrau que a `Toolbar` publica —, e o gatilho vai a 36.
Medido a 375px: 40/36, **exatamente a geometria que o app já renderiza no
telefone** (`h-10 … p-0.5 items-stretch`). O `pointer-coarse:min-h-11` saiu do
gatilho: era ele que empurrava a bandeja para 48.

O recuo virou 2px fixo. O custo é medido e aceito: sob `scrollable` o anel de
foco perde **1px** nas pontas, e este arquivo já aceita uma troca maior — em
`underline` ele perde **3px** na base.

### A armadilha que esta rodada pagou: classe montada em runtime

As alturas foram escritas primeiro como template literal
(`` `${ALTURA_CLASS[...]} pointer-coarse:${ALTURA_CLASS[...]}` ``). Medido no CSS
emitido: **`pointer-coarse:h-9` estava no elemento e não existia na folha** — o
gatilho ficou em 28 dentro de uma bandeja de 40, com 6px de faixa morta. A
altura base funcionava, e `pointer-coarse:h-10` funcionava por coincidência
(existe literal em outro arquivo), o que deixou o defeito parcial e mais difícil
de ver.

É a regra que este arquivo já registra — *o Tailwind varre o código como
texto* —, e ela pegou a mesma pessoa que a escreveu. As classes voltaram a ser
literais, e o teste passou a provar que os literais não divergem da tabela.

### O `Tabs` ganhou `padding`, porque quem fica na linha é a bandeja

*(Superada pela seção "`size` no `Tabs` passa a nomear a bandeja", acima: o eixo `padding` saiu. Fica como registro.)*

A revisão apontou o defeito e ele é real: `size="md"` dava **gatilho 32 e
bandeja 40**, e numa barra de controles de 32 o componente inteiro saía 8px mais
alto. Eu tinha defendido isso com um argumento de nomenclatura — "a régua mede
controle, e bandeja não é controle" —, e a nomenclatura estava certa enquanto o
resultado estava errado: **quem fica lado a lado com um `Button` não é o
gatilho, é a bandeja.**

O recuo saiu do `variant` e virou eixo próprio. A bandeja é `gatilho + 2×recuo`:

| `size` | gatilho | `default` | `tight` |
| --- | --- | --- | --- |
| `sm` | 28 | 36 | **32** |
| `md` | 32 | 40 | **36** |
| `lg` | 36 | 44 | **40** |

Com `tight` as três caem nos degraus da escada de controles, e o trilho de uma
barra vira `size="sm" padding="tight"` — 28 dentro de 32. **É a receita que o
app já escreve à mão**: `transaction-type-segment.tsx` usa `p-0.5` com
`md:h-8`. E `size` continua nomeando a caixa real do gatilho, que é a correção
que consertou o `Menubar` (entregava 24) e o próprio `Tabs` (entregava 27) —
o defeito daquelas rodadas era a **mentira**, não o modelo.

`default` segue padrão porque o `p-1` é carga estrutural sob `scrollable`:
`overflow-x` recorta no padding box e o anel de foco de 3px precisa dos 4px.
Por isso `scrollable` **força** `default`, com a mesma precedência explícita com
que já vence `stretch`.

**E não dava para consertar de fora**: o `className` do `TabsList` cai na
moldura (recuo 0), enquanto o `p-1` mora na trilha, sem prop que a alcançasse.

### O que não fechou, e por quê

*(Fechado pela mesma seção: a bandeja passou a ser a medida, e no toque ela fica rente aos controles.)*

No ponteiro grosso a bandeja **ainda não fica rente**: medido a 375px, 48 contra
controles de 40. O `stretch={false}` liga `pointer-coarse:min-h-11` (44) no
gatilho, e 44 + 4 dá 48.

E não há combinação que feche, porque **uma bandeja com recuo nunca iguala o
gatilho**. Ficar rente exige que a **bandeja** seja a coisa dimensionada e o
gatilho derive — que é exatamente o que o app faz (`h-10 md:h-8` com
`items-stretch`). O `Tabs` dimensiona o gatilho, e o `h-7` do degrau vence
qualquer `items-stretch`: medido, uma moldura forçada a 40 deixa o gatilho em 28
e sobra uma faixa morta de 6px em cima e embaixo.

Fechar isso é trocar o `h-*` do degrau por `min-h-*` e dar altura à bandeja —
mudança de semântica do `size`, e decisão de uma próxima rodada. Fica registrado
com o número em vez de silenciado.

### `SearchInput`: a regra existia e não tinha casa

O `AGENTS.md` registra desde a rodada do seletor ancorado que `type="search"`
traz um × desenhado pelo WebKit — azul do sistema, fora do tema e fora da
escada — e que ele deve ser suprimido e substituído por um botão nosso, e diz
que *"vale para qualquer campo de busca do app"*. Medido: o
`FormPickerPopoverSearch` acerta sozinho, e as **três** buscas de
`transactions-filters-panel.tsx` (418, 538, 772) são `<Input type="search">`
cru. **Quatro usos, três violações.** Foi a contagem que transformou a regra em
peça; a semântica fica (é ela que dá a tecla "Buscar" no iOS), só o desenho sai.

**E ele custou um defeito de API, achado ao medir.** Na primeira versão o
`className` ia para o `<input>`: um `max-w-xs` encolhia a área de digitação e
deixava a **moldura com a largura toda**, com o botão de limpar **354px** à
direita do texto. `className` passou a dimensionar a superfície — que é quem
desenha a borda e ancora os addons —, e o caso raro virou `inputClassName`.
Medido depois: superfície 320, botão a 5px da borda.

### O indicador: contagem no rótulo, ponto só no ícone

Num botão com rótulo a marca é a **contagem**, num `Badge` dentro do fluxo do
flex: ela diz *quantos* filtros há em vez de só que há, e não sobrepõe nada.
Medido antes: a bolinha absoluta encostava no "s" de "Filtros" em 2px, nos dois
eixos. Depois: **6px de folga**.

**A âncora do ponto passou de `top-1.5` para `top-1`**, e os números são
medidos: a 1.5 ele invadia a caixa do ícone em **3px**; a 1 invade **1**, e a
folga até a curva do canto continua **4,59px** — a mesma, porque a distância ao
centro do arco é simétrica em torno dele. Descer a `top-0.5` zera a invasão do
ícone mas derruba a folga da curva para 1,76, e aí o ponto passa mesmo a ler
como estando na borda. A aritmética está trancada em
[`toolbar-density-ladder.test.ts`](../../src/components/ui/toolbar-density-ladder.test.ts).

### Duas lições de método, e uma delas é um erro meu

**Confundi folga com sobreposição, e reportei o defeito errado.** A primeira
medição do ponto calculou a distância do vértice ao centro do arco (4,24 contra
raio 10) e eu li aquilo como "5,76px dentro da curva", concluindo que o ponto
cavalgava a borda. **Era o contrário**: a folga entre a borda do ponto e a curva
é de **4,59px** — ele está confortavelmente dentro. O defeito real era o texto,
2px, que a mesma medição já mostrava. Uma métrica cujo *sinal* não é óbvio
precisa ser nomeada pelo que ela mede (`folgaAteACurva`), não pelo que se espera
encontrar.

**E de novo: medição de layout se lê depois de um quadro.** Um botão de 40px
mediu 34,2 logo após um `resize_window`, e daí saiu uma "sobreposição" de 5,89px
que não existia. Com o layout assentado: 40, e 3px. É a terceira vez nesta série
— e na quarta, a leitura estática dos `tabIndex` do `Tabs` (todos `-1`) quase
virou um defeito de acessibilidade inexistente, até um `Tab` de verdade mostrar
o foco entrando na lista e o gatilho ativo virando `0`.

### O cabeçalho de página era uma linha de flex, e a trilha caía dentro dela

`PageHeader`, `PageSection` e `Container` são as três peças que este arquivo
declara **obrigatórias para toda tela nova**. Medido: os três tinham **zero
consumidores no app** — e estavam sendo reescritos à mão dentro do próprio
catálogo, em cinco lugares e em quatro gramáticas.

| Onde | O que era | Contagem |
| --- | --- | --- |
| `DocSection` (`ds-doc.tsx`) | cabeçalho de seção: `border-t pt-8` + `font-heading text-lg font-semibold tracking-tight` | **247 usos** |
| `Group` (`ds-kit.tsx`) | **a mesma string**, no outro arquivo | **22 usos** |
| `PropsTable` (`ds-doc.tsx`) | a mesma string, uma terceira vez | 90 páginas |
| `DocPage` | cabeçalho de página com adorno em `items-baseline justify-between` | 88 páginas |
| índice `/designsystem` | outro cabeçalho, um degrau maior, com sobrancelha e faixa de fatos | 1 |
| `ds-shell.tsx` (×2) | `mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8` — o `Container size="lg"` | 2 |

**O defeito de maior consequência estava na demonstração principal.** Medido a
1280px, na seção "Completo" da própria página do componente: `sm:flex-row` sem
`flex-wrap` punha `PageHeaderBreadcrumb` (618px) **à esquerda** do título, o
`PageHeaderTitleRow` saía com **largura 0** e 362px de altura — a descrição
quebrando uma palavra por linha — e o título passava por baixo do botão de ação.

E o `sm:col-span-full` que a trilha carregava não era classe morta por acaso:
**era o fóssil da implementação correta**, escrita para uma grade que nunca
existiu. Hoje o cabeçalho é grade, e a classe finalmente significa alguma coisa.

### As duas escadas saíram de contagem, e descem por variável

`PageHeaderTitle` oferecia **um** corpo (`text-2xl sm:text-3xl`) enquanto o
catálogo renderizava **dois** — `md` na página de componente e `lg` no índice.
O terceiro degrau, `sm`, é a tela de detalhe, que a própria página demonstrava
sem ter como declarar. O mesmo no `PageSection`: `text-base` no componente
contra `text-lg` nas 269 seções.

| | `sm` | `md` | `lg` |
| --- | --- | --- | --- |
| `PageHeader` (título) | 20 → 24 | **24 → 30** | 30 → 36 |
| `PageSection` (título / respiro) | 14/20 · gap 12 | **16/24 · gap 16** | 18/28 · gap 16 |

**A escada desce por variável CSS, e não por contexto React.** Contexto exigiria
`"use client"`, e `PageHeader` é um dos poucos componentes de `ui/` que ainda é
servidor; `in-*` e `group-*` compilam com `:where()`, que não soma
especificidade e perderia para a classe base no mesmo elemento. É o mecanismo de
`--toolbar-control` e `--command-list-max-h`: variável herda e não disputa.

A entrelinha do título de página **não** entra na variável, porque `.page-title`
declara `1.25` e vence — ela está **fora de qualquer `@layer`**
(`globals.css:518`, depois do `@layer base` que fecha em 496), e CSS sem camada
vence CSS em camada. Verificado no navegador: o `font-heading` que três arquivos
escreviam ao lado dela nunca decidiu nada, e a família resolvida é Ledger. No
`PageSection` a entrelinha **é** uma segunda variável, porque ali não há classe
equivalente e `text-(length:…)` declara só o tamanho.

### Peças novas, e cada uma tem a cópia que a prova

- **`PageHeaderEyebrow`** — a sobrancelha em versalete existia em **duas cópias
  da mesma string**. A régua mora agora em `pageEyebrowClassName`, e `ds-doc`
  importa. Ela **não é enfeite acima de todo título**: só se paga quando há um
  pai de verdade a nomear.
- **`PageHeaderMeta`** — a faixa de fatos que o índice escrevia à mão. Ela traz
  8px do próprio respiro em cima porque o espaço **acima** de uma régua tem que
  ser maior que o de baixo (24 contra 16, com o `gap` da grade contando junto).
  `asChild` porque o elemento certo depende do conteúdo: um `<dl>` quando são
  pares termo/valor, que é o caso comum num app de finanças.
- **`endAdornment` em `PageHeaderTitleRow`** — o mesmo nome e a mesma forma que
  `DialogHeaderRow` e `HoverCardHeader` já usam, e é o link de categoria do
  `DocPage`.
- **`back` em `PageHeaderTitleRow`** — apaga o `<div className="flex
  items-center gap-1">` que a demonstração inventava.
- **`actions` em `PageSectionHeader`** — apaga o `<PageSectionHeader
  className="flex-row items-center justify-between">` que a demonstração
  inventava. É o precedente de `FormPickerPopoverEmpty` e `HoverCardBody`:
  quando o catálogo escreve a anatomia, falta uma peça.

**O voltar e o adorno se alinham por mecânicas diferentes, e é de propósito.**
O adorno é texto, e alinha pela linha de base — é o que o prende à primeira
linha do título quando o nome quebra em duas. O voltar é um controle **sem
texto**: numa caixa de `items-baseline` a linha de base dele seria sintetizada
na borda de baixo e a fileira inteira afundaria. Ele sai do alinhamento com
`self-start` e se centra dentro de uma caixa de exatamente uma linha de título
(`--page-title-line`), sem número mágico e acompanhando o degrau. Medido: centro
do botão e centro da primeira linha do título em **439px os dois**, diferença
zero.

O `-me-2` do voltar não é compensação de gosto: o `gap` é a distância mínima
entre **caixas**, e a caixa do botão é 10px mais larga que o glifo desse lado.
Devolvendo 8 deles, a distância seta→título cai nos **18px** que o cabeçalho do
app renderiza — medidos, 18.

### O par de identidade, pela quarta vez

`PageHeaderTitleRow` e `PageSectionHeader` declaravam `gap-1`, e a página do
`PageHeader` **já dizia o contrário**: "Título e descrição não levam gap —
`PageHeaderTitleRow` já entrega a entrelinha certa". Documentação certa, código
discordando: é exatamente como `ItemContent` (rodada 08), `StatCard` (10) e
`FieldContent` (11) foram achados.

O respiro voltou a existir só onde há mudança de assunto, e quem o declara é o
contêiner: `[&>[data-slot=page-header-eyebrow]]:mb-3` diz qual filho abre um
bloco, como o `StatCard` faz com a variação.

Consequência visível: o índice do catálogo **perdeu os 16px** que separavam o
título da frase de abertura. Ele era o único cabeçalho do catálogo com essa
folga; os outros 89 já tinham zero.

### `PageSectionContent` foi apagado pela própria medição

Ele era um `<div>` com string de classe vazia. A primeira versão desta rodada
tentou salvá-lo dando-lhe `min-w-0`, com a justificativa de que "uma tabela
larga estoura a página em vez de rolar" — a mesma família do `min-h-0` do
`DialogBody`.

**Medido, isso é falso.** O tamanho mínimo automático de um item de flex vale no
**eixo principal**, e numa coluna o eixo principal é o vertical: `min-width:
auto` já resolve para zero ali. Com e sem `min-w-0` no conteúdo, os mesmos
400px.

O defeito real está um nível acima: uma seção usada como item de uma **linha**
de flex estoura para o próprio min-content — **5241px dentro de um pai de 400**
—, e leva a rolagem interna junto. Com `min-w-0` na seção: 400px, e a região de
dentro volta a rolar. O `min-w-0` mudou de lugar, e a peça sem trabalho foi
apagada em vez de ganhar uma justificativa inventada.

### A régua da seção é em cima, e a do cabeçalho continua embaixo

`PageSection variant="ruled"` é `border-t pt-8` — é onde as 269 seções do
catálogo já a punham. Um fio em cima diz "começa outro bloco"; um fio embaixo
diz "este bloco tem um rodapé". `PageHeader variant="ruled"` segue **padrão**,
porque um cabeçalho de página é a única fronteira da tela que não tem nada
acima para marcá-la; `plain` é o opt-in, e é o que o `DocPage` usa, porque ali
quem fecha o cabeçalho é o campo de import logo abaixo.

### `Container`: `default` virou `md`, e os degraus viraram `cva`

Pela mesma razão que esse nome saiu de `Button`, `Input`, `SelectTrigger` e
`NativeSelect`: ele dizia *o padrão* em vez de dizer a medida. Saiu do tipo, e o
compilador acusa quem o escrever — eram 3 chamadas, todas no catálogo.

E os três componentes desta rodada saíam com **`—`** na coluna de variantes do
`npm run ds:catalog`, como se não tivessem decisão nenhuma a tomar. A tabela
`containerSizes` continua exportada ao lado do `cva` para as duas páginas que
desenham a régua poderem iterá-la, e
[`page-chrome-ladder.test.ts`](../../src/components/ui/page-chrome-ladder.test.ts)
falha se as duas divergirem — o Tailwind varre o código como texto, então os
literais têm que ficar no `cva`.

O teste tranca também a asserção que pegou o `Item` na rodada 08: **nenhum par
de degraus pode produzir a mesma string**.

### O alvo do voltar cresce por pseudo-elemento

36 é a medida do controle e 44 é a do dedo. Crescer de verdade mudaria a caixa
que `--page-title-line` centraliza, então o alvo cresce com
`pointer-coarse:after:-inset-1` — a mesma saída do × da `AnnouncementBar` e dos
degraus do `Breadcrumb`. E a pergunta é o **apontador**, não a largura.

O `PageHeaderBack` também era a segunda cópia de um controle que o app já tem:
`MobileHeaderBack` em `app-header.tsx` renderiza `icon-lg` (36) com `-ml-1`, e
este renderizava `icon-md` (32) com `-ml-2`. Ficou a medida do app. Ele ainda
carregava um `group-active:bg-accent` sem `group` ancestral nenhum, e cravava o
`aria-label`.

### O `Container` descrevia um app genérico, e este não é ele

A rodada anterior mexeu nele de raspão: renomeou `default` → `md` e transformou
os degraus em `cva`. **Consertou o nome e deixou o número sem examinar** — o
nome ficou certo apontando para uma largura que nenhuma tela pediu.

**A calha lateral era o que tornava o componente inadotável.** A casca do app
(`sidebar-app-shell.tsx:39`) já é dona dela — `px-4 … md:p-6` —, e uma tela que
somasse a do `Container` a **dobrava**:

| | sem `Container` | com o `Container` de antes |
| --- | --- | --- |
| 375px | 343px de conteúdo | **311px** (−9,3%) |
| 1280px | 1232px | **960px** (56px de calha por lado) |

Era palavra por palavra o defeito que a documentação dele descrevia — *"uma
tela que soma o próprio recuo horizontal acaba com o dobro no telefone, que é
justamente onde cada pixel de largura conta"* — enquanto ele o cometia. E é por
isso que ele passou tanto tempo com zero consumidores: **das nove cascas de
página escritas à mão no app, nenhuma declara calha horizontal.** A única que
tenta escreve `px-1 sm:px-0`, quatro pixels que somem em 640.

Hoje a calha é eixo, e é opt-in:

| `gutter` | classes | quem pediu |
| --- | --- | --- |
| **`none`** | — | **9 de 9 cascas do app** |
| `page` | `px-4 md:px-6` | a casca do catálogo |

`page` fala a gramática que o app **renderiza** — um degrau, quebrando em 768 —
e não a que este arquivo inventava, com dois degraus quebrando em 640 e 1024.
Duas gramáticas para a mesma calha, e a do app é a que 100% das telas mostram.

Medido depois: um `Container` com o padrão de hoje, dentro da casca do app, dá
**343px** — exatamente o mesmo que não ter contêiner nenhum.

### A escada foi recortada por contagem, e 1024 saiu

Ela oferecia 672 / **1024 (o padrão)** / 1280 / none. Contado nas nove cascas
reais: **576px em seis**, 448 em duas, 672 em uma — e **1024 em nenhuma, no
repositório inteiro**. É a lição "padrão que ninguém escolhe não é padrão",
reintroduzida um round depois de ela ter sido registrada.

| `size` | largura | quem pediu |
| --- | --- | --- |
| `sm` | 448 | as duas cascas de erro |
| **`md`** | **576** | **6 usos — o padrão** |
| `lg` | 672 | o detalhe de cartão |
| `xl` | 1280 | a casca do catálogo |
| `full` | sem teto | quem já tem largura de fora |

`max-w-5xl` **saiu**. Devolver um degrau no dia em que uma tela pedir é uma
linha; mantê-lo era manter a ficção. O teste tranca que ele não volte pela
porta dos fundos — a mesma família do `in-data-[variant=dialog]` que sobreviveu
à remoção da variante do `Command` e passou a não casar com nada.

### O primeiro consumidor de produto

`account`, `settings`, `plans` e `members` declaravam **a mesma string** —
`mx-auto w-full min-w-0 max-w-xl` — em quatro `layout.tsx` de dez linhas. Hoje
são `<Container>`.

Elas perderam junto o `min-w-0`, que **não fazia nada**: medido, 400px e a
região de dentro rolando, com e sem. Num flex de **coluna** o tamanho mínimo
automático vale no eixo vertical — a mesma medição que apagou o
`PageSectionContent` na rodada 15. Quatro cópias de uma classe inerte, e outras
quatro cascas que já a omitiam.

### Dois defeitos meus da rodada anterior

- **`Omit<VariantProps<typeof containerVariants>, "size">` era tipo morto.** Com
  uma variante só, omiti-la deixa `{}` — verificado com sonda de tipo, `keyof`
  resolve para `never`. Ele não acrescentava nem restringia nada no tipo das
  props. É o equivalente em tipo da classe morta que esta base já documenta
  três vezes.
- **O padrão estava escrito duas vezes**, na desestruturação e em
  `defaultVariants`. Hoje é uma, e `DEFAULT_CONTAINER_SIZE` existe só para o
  `data-size` não o adivinhar — com o teste impedindo que os dois se separem.

### O que não entrou, e a contagem que decide

- **`asChild`** — zero demanda. As nove cascas são `<div>`, e o `<main>` da
  tela já é o `SidebarInset`. Entra no dia em que uma tela pedir `<section>`.
- **Área segura horizontal.** `env(safe-area-inset-left/right)` não aparece
  **nenhuma vez** no repositório — só a vertical. É lacuna real para um PWA em
  paisagem num telefone com entalhe, mas o dono da calha é a casca do app, e
  somá-la aqui não consertaria tela nenhuma.

### A única mudança visível: o catálogo passou de 32 para 24px de calha

`ds-shell` foi de `size="lg"` para `size="xl" gutter="page"`, e com isso perdeu
o terceiro degrau (`lg:px-8`) que só ele tinha. A alternativa era devolvê-lo por
`className` nas duas chamadas — o que reintroduziria à mão exatamente o número
que esta rodada tirou.

Ficou sem. Vinte e quatro é a margem que o app inteiro usa no desktop, e uma
página de documentação respirar na mesma medida do produto que ela documenta é
resposta melhor que um degrau próprio.

### O catálogo dizia ser atomic design, e 43% dele estava na camada errada

A categoria de cada peça saía de **dois `Set` escritos à mão** no `registry.ts`,
e o que não estivesse em nenhum dos dois caía em **"Organismos" por
*fall-through* silencioso**. Medido: **32 dos 75 componentes na camada errada**.

Foi assim que `Typography` — nove componentes de texto independentes, que não
compõem nada — apareceu ao lado da `Sidebar`; e `Container`, uma `div` com
largura, ao lado do `Dialog`. Na direção oposta, `Field`, `InputGroup` e
`SearchInput` se declaravam **átomos** importando outros componentes (2, 3 e 1).
*(Esta frase listava `Select` também, e estava errada: `select.tsx` importava
zero de `ui/`; ele saiu de Átomos pelos dez exports, e voltou na rodada da
hierarquia.)*

O comentário que vivia no arquivo já previa a falha — *"com 80 itens, a
repetição é onde a lista começa a mentir"* — e a saída que ele propunha (derivar
do slug) **foi o que produziu a mentira**.

Hoje é um mapa explícito, exaustivo por tipo: **um componente novo sem camada
não compila**. E a regra é a canônica, escrita no topo do arquivo:

| Camada | O teste |
| --- | --- |
| Fundações | é decisão em `globals.css`, não componente |
| Átomos | não compõe componente do sistema, e é **um** elemento |
| Moléculas | várias peças que só existem juntas, compondo no máximo átomos |
| Organismos | compõe duas ou mais moléculas, ou compõe molécula **e** tem estado próprio |
| Templates | o que estrutura a página, e não o que ela contém |
| Padrões | não é componente |

**`Templates` é o nível que faltava.** O modelo original tem cinco, e este
catálogo tinha quatro mais duas de casa. `PageHeader` e `PageSection` dispõem
conteúdo numa página — é a definição do nível. `Container` **não** foi com eles:
pelo teste canônico ele é indivisível, e é átomo.

[`taxonomy.test.ts`](../../src/app/designsystem/taxonomy.test.ts) tranca isso, e a
asserção que vale é a **2** — *nenhum átomo compõe outro componente*. Ela teria
pego os quatro. E pegou dois erros meus nesta mesma rodada: `sheet-drag-handle`
(que consome o contexto do `Sheet`) e `kbd-shortcut` (que compõe o `Kbd`), os
dois classificados como átomo por engano.

**A marca "movido" é temporária.** Trinta e quatro entradas trocaram de lugar de
uma vez, e quem tem o mapa antigo na cabeça procuraria `Table` em Organismos.
Ela sai de `MOVED_FROM` no registry — a frase no índice, um ponto na lateral — e
**desaparece quando aquele campo for apagado. A próxima rodada que tocar o
registry apaga.** Duas marcas nasceram mentindo, apontando para a camada em que
a peça já estava; a asserção 5 do teste é o que as pegou.

### O `Container` absorveu "Espaçamento e largura" — no código

Havia uma Fundação com esse nome cuja **fonte declarada era
`src/components/ui/container.tsx`**. Ela documentava as duas coisas, e o
componente entregava só uma: os três blocos dela eram o `Container`, e a tabela
de props dela era o `size` dele.

A fusão não foi de texto. O componente ganhou o eixo **`stack`**, que declara o
ritmo do que ele contém — o que era escrito à mão em toda chamada:
`flex flex-col gap-8` quatro vezes nas páginas, `flex gap-8` no casco do
catálogo, `flex min-w-0 flex-1 flex-col gap-4` na casca do app.

E entraram quatro tokens semânticos, cada um com consumidor contado:

| Token | Valor | O que nomeia |
| --- | --- | --- |
| `--space-identity` | 0 | o par de identidade — 5 componentes já o aplicam |
| `--space-inline` | 8px | dentro de um bloco |
| `--space-block` | 16px | entre blocos — o `gap` do `PageSection` |
| `--space-section` | 32px | entre seções — o `stack` do `Container` |

**Eles não são a escala.** Redeclarar 4/8/12/16 seria copiar o Tailwind para
dentro de casa; estes nomeiam as quatro distâncias que o sistema já decidiu. A
razão de 2 para 1 entre `inline` e `block` é o que separa "mesmo assunto" de
"outro assunto" — medido na rodada do `HoverCardBody`.

E eles **são consumidos**: `PageSection` e `Container` leem os tokens em vez de
cravar `gap-4`/`gap-8`. Token que ninguém lê nasce morto.

### O verificador de tema escuro não distinguia cor de distância

Ao entrar, os quatro `--space-*` apareceram no aviso *"declarados em `:root` e
ausentes em `.dark`"* — junto de `--scroll-fade-h`, `--scroll-fade-x-h` e
`--scroll-fade-floor`, que **já estavam lá como falso positivo**.

A causa era uma lista de prefixos escrita à mão (`radius|z-|duration|ease|
mobile-|text-`), com o mesmo defeito de toda lista escrita à mão: ela não previu
os tokens que vieram depois. A decisão passou a ser **pelo valor** — função de
cor ou hexadecimal precisam de par; medida não precisa. Um aviso com falso
positivo conhecido é um aviso que as pessoas param de ler.

Custou uma segunda medição: a primeira versão aceitava `var(` como sinal de cor,
e acusou `--mobile-bottom-pad`, que é `calc(var(a) + var(b) + env(c))` — uma
conta de distância. Só o **apelido puro** (`--x: var(--y)`) entra.

### Três palavras para "não desenha nada"

Medido: **`plain` em 5 componentes, `ghost` em 4, `bare` em 1** — um conceito,
três palavras, dez arquivos. Ficou `plain`, que já era maioria.

O `Toggle` tinha uma nota defendendo o nome `ghost`, e ela continua correta no
que dizia: ele não se chama `tertiary` porque não tem escada de três degraus. Só
que a nota defendia `ghost` contra `tertiary` — **não contra `plain`**.

Junto saíram os `default` sobreviventes: `size="default"` do `Badge` e do
`SidebarMenuButton`, e `variant="default"` do `Item`, do `ItemMedia` e do
`SidebarMenuButton`. É o nome que já saiu de `Button`, `Input`,
`SelectTrigger`, `NativeSelect` e `Container` por dizer *o padrão* em vez de
dizer a medida.

### O `Badge` misturava três eixos num nome só

`variant` carregava **peso** (`primary`, `secondary`), **forma** (`outline`) e
**tom** (`success`, `warning`, `income`, `expense`). Tom é o que `Alert`,
`StatCard`, `Timeline`, `Progress`, `Separator` e `AnnouncementBar` chamam de
`tone` — o `Badge` era o único a discordar, que é palavra por palavra a correção
que a rodada do `Alert` fez quando **ele** era o único.

Hoje são dois eixos: `variant` (`soft` | `outline`) e `tone` (sete cores). O
cruzamento criou uma combinação que não existia — **contorno na cor do tom**;
antes o `outline` só sabia ser cinza.

**Foram 71 chamadas reescritas por codemod, e o compilador isolou as que
sobraram.** Elas eram todas do mesmo tipo: ternários que misturavam os dois
eixos, como `variant={bill.is_active ? "success" : "outline"}` — "ativa" é cor e
"inativa" era forma. Um codemod não sabe disso; cada uma virou duas props
explícitas. Mais quatro modelos a montante (`momentumTone`, `statusTone`, o
delta do KPI e o da fatura) que carregavam o nome `variant` para um dado que
sempre foi tom.

### `KbdShortcut` existia sem página e sem entrada

Ele estava em `src/components/ui/` desde a rodada da paleta, **usado pela busca
do próprio catálogo**, e não aparecia nem no registry nem em `docs/`. É o
invariante 8 — *"componente novo entra em três lugares na mesma mudança"* —
violado pelo próprio design system. Ganhou os dois.

**E depois deixou de existir.** O `Kbd` absorveu o acorde em `keys`, e a página
que esta rodada criou virou a do `KbdGroup`. A história fica porque o defeito
que ela mede — o invariante 8 violado pelo próprio design system — não depende
de o arquivo continuar existindo.

### As duas páginas de texto eram uma, e a Fundação absorveu os nove componentes

O catálogo tinha **duas páginas para texto**, e as duas declaravam o **mesmo
`source`** — `src/components/ui/typography.tsx`. A Fundação `tipografia` e o
Átomo `typography` importavam os mesmos nove componentes e os renderizavam com
as **mesmas strings** (`<H1>Suas finanças</H1>`, `<H2>Este mês</H2>`,
`<Muted>Parcelas futuras não entram neste total.</Muted>`), e cada uma tinha a
própria cópia da `PropsTable title="Componentes"`, com as mesmas seis linhas.

**As duas cópias já tinham divergido**, que é o que sempre acontece: a de
`tipografia` tipava a linha "H1 … H4" como `ComponentProps<'h1'>` — afirmando
que `H4` aceita props de `h1` — e as **seis** descrições eram diferentes nas
duas. Não havia mecanismo que as reconciliasse.

**A direção é a inversa da rodada 17, e o critério não é volume.** Lá o
`Container` absorveu a Fundação "Espaçamento e largura", porque a Fundação
**era** o componente e não sobrava nada depois de subtraí-lo. Aqui, subtraindo
os nove componentes, sobram três famílias, oito degraus `--text-*`, `.nums`,
`.page-title`, `.wordmark` e quatro notas — e **tipo é um dos cinco pilares que
a própria régua das Fundações nomeia** (`registry.ts`: "os átomos abstratos:
cor, tipo, forma, movimento, camada"). O critério é qual dos dois nomes é o
assunto.

**Nenhuma das duas estava na camada errada**, e é isso que tornava a confusão
difícil de nomear: os nove componentes são átomos pelo teste do arquivo (nenhum
compõe outro), e as famílias são Fundação pelo teste dela. O defeito não era a
taxonomia — era duas páginas ensinarem a mesma coisa.

**O slug é `typography` e o nome é "Tipografia", e a assimetria é forçada por
mecanismo.** A asserção 1 do `taxonomy.test.ts` exige que todo `.tsx` de `ui/`
tenha entrada com o slug do arquivo. É a primeira Fundação com slug em inglês, e
é o preço de a taxonomia ser trancada por teste em vez de combinada. A posição
no `REGISTRY` não carrega decisão: dentro de cada categoria a ordem é
alfabética pelo nome, trancada pela asserção 7.

**`entry()` não servia, e não por gosto.** `Layer = Exclude<Category,
"Fundações" | "Padrões">`, então a chave não compila em `LAYER`; e sem a chave,
`categoryForSlug` **lança** e derruba todas as rotas `/designsystem/*` no import
do módulo. A entrada voltou a ser literal, como `marca` e `iconografia` — as
outras duas Fundações que apontam para código.

**O que não mudou, e por decisão.** Zero linhas em `src/components/ui/` e zero
em `globals.css`. A sobreposição `H1`↔`PageHeaderTitle` e
`H2`/`H3`↔`PageSectionTitle` continuou no código nesta rodada e passou a ser
**documentada** — a rodada da composição, mais abaixo, a resolveu:
duas notas dizem qual usar e por quê. Consertar significa escolher um dono por
nível de título e apagar o perdedor, e isso é rodada própria — com o candidato
já contado abaixo.

**As medidas que a página passou a carregar**, e que não existiam em lugar
nenhum do catálogo: `.page-title` é aplicada em **exatamente dois lugares**
(`typography.tsx:10` e `page-header.tsx:222`); `.wordmark` como classe, em
**um** (o espécime de Marca — o app escreve o nome com o SVG); `font-heading`
aparece **32 vezes e nenhuma delas muda um pixel**, porque `--font-heading` é
apelido de `--font-sans` — não é token morto, é o gancho para o dia em que os
títulos deixarem de ser Inter, e trocar custa uma linha em vez de 32; e **2 dos
9** componentes têm consumidor no app.

**O teste não pegou nada, e é o achado de método.** Nenhuma das sete asserções
quebrou com esta mudança: `taxonomy.test.ts` tranca a **taxonomia**, não a
duplicação — duas páginas para o mesmo arquivo sempre foram legais. A que
faltava entrou como a **6**: *nenhum arquivo de `ui/` é fonte de duas entradas
fora de Padrões*. Verificado contra o commit anterior, ela falha lá
(`["tipografia","typography"]`) e passa aqui. `Padrões` fica de fora porque
`formularios`, `vazio-carregando` e `graficos` apontam de propósito para
`form.tsx`, `empty-state.tsx` e `chart.tsx`: um Padrão é uma decisão que
atravessa telas cuja casa por acaso é um componente.

**O `MOVED_FROM` saiu inteiro**, cumprindo o prazo que a rodada 17 escreveu
aqui. A marca de `typography` passaria a mentir num segundo eixo — diria "veio
de Organismos" quando a peça agora vem de Átomos —, e a asserção 5 não pegava
isso, porque ela só comparava com a camada atual. Foram seis remoções em quatro
arquivos (`registry.ts`, `ds-shell.tsx`, `page.tsx`, `taxonomy.test.ts`), e com
elas saíram as asserções 5 e 6 antigas.

**A tabela de tamanhos estava quebrada, e ninguém tinha medido.** Ela veio
literal da página antiga: três colunas, duas com largura fixa, dentro de uma
célula de um terço do `Group layout="grid"`. Medido, sobravam **46px** para a
coluna de uso, e "título de tela no desktop" saía em **seis linhas de uma
palavra**. Hoje a tabela ocupa a linha inteira no `md` e dois terços no `xl`
(218px de uso, uma linha), e abaixo de `sm` o uso desce para a própria linha em
vez de espremer — 311px, uma linha, medido a 375px.

**O que ficou de fora, e é dito em vez de silenciado.** As dez contagens
escritas à mão nos comentários de `page.tsx` e `ds-shell.tsx` envelheceram de 90
para 89 páginas — mas elas já divergiam entre si antes desta rodada (87, 88, 89
e 90 para o mesmo número), então o defeito é *contagem à mão em comentário*, e
corrigir dez números o reproduz. E não há redirect de `/designsystem/tipografia`:
são zero links internos no repositório, e a rota é de desenvolvimento.

### A taxonomia media o embrulho, e a régua passou a ser a hierarquia que cresce

A rodada 17 tirou 32 componentes do lugar errado e deixou uma régua escrita:
átomo é o que *"não compõe componente do sistema e é **um** elemento"*. Lida
na prática — importa zero de `ui/`, exporta um —, ela media a **API do
embrulho**, e não a peça. A medição que a derrubou:

| | camada | exports | importa de `ui/` | primitivas Radix por dentro |
| --- | --- | --- | --- | --- |
| `Slider` | Átomo | 1 | 0 | **4** — root, track, range, thumb |
| `Select` | Molécula | 10 | 0 | as mesmas peças, expostas |

A diferença era só onde a composição mora — dentro do arquivo ou na API. Uma
refatoração de assinatura (`<Select options={…} />`) mudaria a camada sem mudar
um pixel. E a cláusula não distinguia nada: **21 dos 21 átomos importavam
zero** — inclusive o `Input`, que importa exatamente o que o `select.tsx`
importa (as réguas de `field-classes`, e nenhum componente). Do outro lado, **26
das 38 moléculas também importavam zero**, então a definição *"grupos de
átomos"* não descrevia dois terços delas.

**A régua nova é a do modelo, nas palavras do dono**: *"os átomos são
indivisíveis, as moléculas são feitas de átomos, os organismos são feitos de
moléculas e os templates são feitos de organismos"*. Três cláusulas fecham as
bordas: **anatomia interna não é composição** (trigger/content/item,
track/thumb, `<option>`); **especializar um átomo sobre outro continua átomo**
(os dois exemplos que ela teve — `KbdShortcut` sobre `Kbd`, `MoneyInput` sobre
`Input` — foram **absorvidos como `prop`** pelas rodadas seguintes, e entre os
átomos ela ficou com **zero** casos; segue valendo uma camada acima, em
`StatCard` sobre `Card`); e
**quem contém organismo é organismo** (`Breadcrumb` carrega um `DropdownMenu`).
`Container` fica átomo — indivisível, uma `div` com largura —, por decisão.

**22 mudaram de camada; 54 ficaram.**

| sobem para Átomos | por quê |
| --- | --- |
| `select`, `native-select` | um controle; `NativeSelect` renderiza **um** `<select>` |
| `radio-group` (hoje cindido: o átomo é o `radio`, e o grupo virou Molécula), `input-otp` | um campo, um valor |
| `avatar`, `tooltip` | um objeto (imagem e fallback são estados); um rótulo que aparece |
| `money-input`, `kbd-shortcut` (os dois hoje absorvidos como `prop` — `money` no `Input`, `keys` no `Kbd`) | especialização |

| sobem para Organismos | por quê |
| --- | --- |
| `card`, `popover`, `hover-card`, `edge-panel` | superfície com **faixas** — a anatomia do `Dialog` |
| `stat-card` | especializa o `Card` |
| `dropdown-menu`, `context-menu`, `menubar`, `navigation-menu` | grupos, separadores, submenus |
| `table`, `accordion`, `tabs`, `timeline`, `stepper` | a **unidade** é uma molécula (linha, `Collapsible`, gatilhos + painel) |
| `chart`, `carousel`, `sonner` | contêiner + legenda + tooltip; trilho + setas; pilha de toasts |

Contagens: **7 · 29 · 13 · 31 · 2 · 7**. Moléculas encolheu para 13 e são
exatamente as que o Frost nomeia — rótulo + campo + erro, campo + botão,
ícone + título + texto + ações, mídia + texto + ações.

**O que o teste tranca, e o que não.** A asserção 2 relaxou para *"um átomo
importa no máximo um componente de `ui/`, e ele é átomo"* — continua barrando
`Field` (2), `InputGroup` (3) e `SearchInput` (molécula), e passa a aceitar a
especialização. A 3 ganhou uma linha: molécula não importa organismo. A **7**
entrou: dentro de cada categoria o `REGISTRY` está em ordem alfabética pelo
`name` exibido (`sonner` é "Toast"), com `localeCompare("pt-BR")` fixo no teste
porque o app não ordena em runtime. Ela reprovava nos seis grupos antes do
reorder. O que o grafo **não** alcança — a anatomia de um `Select`, a diferença
entre especializar e compor — é decisão, e mora nos comentários do `LAYER`.

**Duas inversões da rodada 17, registradas como inversão e não apagadas.** Ela
dizia que a asserção 2 tinha pego `kbd-shortcut` "classificado como átomo por
engano"; ele volta a átomo, porque especializar o `Kbd` não é compor. *(E na
rodada seguinte deixou de ser questão: o `Kbd` absorveu o acorde, e a
especialização que era o exemplo virou a própria peça.)* E dizia
que quem tem o mapa antigo "procuraria `Table` em Organismos"; ele volta para
lá. A história fica; o que mudou foi a régua.

**A ordem alfabética tem um custo, dito.** A primeira página do catálogo passa
a ser **Camadas (z-index)**, e a ordem pedagógica das Fundações (cor → tipo →
forma → movimento → camada) que a rodada da Tipografia acabou de registrar
deixa de existir. O ponto de entrada sobrevive: "Comece aqui" resolve `cores`
por `getEntry`, não por posição. E os comentários `// ── Átomos ──` do array
estavam **desalinhados** — o bloco "Átomos" tinha doze moléculas, o
"Organismos" não tinha organismo nenhum —, porque a categoria vem do `LAYER` e
a posição no array era só a ordem em que cada `entry()` foi escrita.

**O que não foi feito.** 22 páginas trocam de grupo sem marca de "movido" — o
`MOVED_FROM` saiu nesta mesma série, e a busca cobre. As contagens à mão em
comentários de `page.tsx` e `ds-shell.tsx` continuam sem caça, pela decisão
anterior. E a asserção 2 tem um buraco semântico conhecido: um átomo que
importa **um** átomo para compor, e não para especializar, passa — o teste
tranca a mecânica, e a régua escrita tranca o resto.

### Um componente não reimplementa a camada de baixo

A pergunta "o `Form` não devia ser molécula, já que tem input e botão?" tinha
uma resposta curta — o `CustomForm` é só o `<form>` com a política do Enter,
nenhum input, nenhum botão — e uma consequência longa: **o design system
reimplementava a si mesmo por dentro**, e o auditor não via, porque a regra C
tem `if (!isUi)` de propósito (é onde os átomos nascem). Medido nos 76 arquivos:

| O que | Quantos | Exemplo |
| --- | --- | --- |
| `<button>`/`<a>` crus onde `Button` existe | 8 | `pagination.tsx` — `<a className={buttonVariants(…)}>`, o anti-padrão que a rodada do `AlertDialog` documentou ter consertado |
| tipografia à mão | 22 | `page-section.tsx` — `<h2 className="font-heading … font-semibold tracking-tight">`; **nenhum arquivo de `ui/` importava `typography.tsx`** |
| superfície de campo copiada | 5 | `textarea.tsx` — `border border-input bg-input-fill/30` enquanto `Input` veste `field-classes` |
| valores literais em átomos | 13 | `switch.tsx` — `h-[18.4px] w-[32px]` |
| ícone do conjunto errado | 2 | `mobile-sheet-form-chrome.tsx` — renderizava 16px com o glifo de 20 |

**A regra, decidida pelo dono**: cada camada compõe a de baixo — átomo usa
fundação, molécula usa átomo, organismo usa molécula — lida como *"onde existe
a peça de baixo, ela é obrigatória"*. Onde a estrutura é interna (um
`DropdownMenu` é 15 primitivas Radix, não há molécula do sistema dentro dele)
não há o que compor. **O teste que decide cada caso**: a peça de baixo é a
peça de baixo quando dá pelo menos duas das declarações do componente e o que
sobra é adição (`text-pretty`, `max-w-*`, `nums`); quando três de quatro são
anuladas por `className`, vestir é reimplementar ao contrário, e fica cru com
o motivo escrito. **27 mudaram, 49 são conformes.**

**A tipografia virou a base que o sistema veste.** Os nove átomos ganharam
`asChild` (o `Slot` do `Button`) e o `H2` perdeu a régua — `border-b
border-border pb-2`, herança do shadcn, zero consumidores, e o `PageSectionTitle`
é um `<h2>` **sem** régua: um átomo que o template precisa desfazer para vestir
não é a peça de baixo. Dezessete arquivos passaram a importá-lo:
`PageHeaderTitle` sobre `H1` e `PageSectionTitle` sobre `H2` trocam só o corpo
por `className` (verificado: `cn("text-3xl text-(length:--page-title)")` devolve
só a variável), `EmptyStateTitle` sobre `H4`, os títulos de vazio de `Command` e
`Timeline` sobre `P`, e `Muted`/`Caption` em toda descrição, legenda e rótulo —
`Card`, `Dialog`, `AlertDialog`, `Popover`, `HoverCard`, `Field`, `Item`,
`Table`, `Select`, `DescriptionList`, `Pagination`, `FormPickerPopover`. Os
títulos de superfície (`CardTitle`, `PopoverTitle`, `AlertTitle`, os dois
`DialogTitle`) **ficaram**: `H4` daria tamanho, peso e tracking que os quatro
anulam, e o `AlertTitle` ainda perderia a tinta do tom.

**Dois fatos do `twMerge` que a medição corrigiu.** O primeiro estava previsto:
tamanho contra tamanho e entrelinha contra entrelinha se resolvem, então não
houve eixo novo. O segundo não: **`text-*` derruba `leading-*` quando vem
depois**, porque o utilitário de tamanho também escreve `line-height` — e por
isso a sobrancelha (`Caption` + `text-2xs`) e o `TimelineTime` saíram com
**zero** delta, 16px como antes, em vez dos 15,1 que o plano previa. Os deltas
reais, medidos: os títulos de vazio de `Command` e `Timeline` foram de 20 para
**22,75px** de entrelinha (`P` traz `leading-relaxed`), e as legendas `text-xs`
de 16 para **16,5** (`Caption` traz `leading-snug`). Regra escrita no arquivo:
**com `asChild`, a sobrescrita vai no `className` do átomo, nunca no filho** —
o `Slot` concatena sem `twMerge`.

**`Button` onde havia botão cru.** `PaginationLink` e `PaginationEdge` viraram
`<Button asChild><a/></Button>` (o `isActive && "font-medium"` saiu: já era a
base); medido, 32×32 com a ativa `secondary`, o número embrulhado em
`button-label` e `tabular-nums`. O `FormPickerPopoverItem` virou `Button
variant="tertiary"` com `h-auto min-h-11` e **um `<span>` de conteúdo como único
filho direto** — é o que impede a maiúscula inicial do CTA de alcançar "iFood"
—, e sem `data-size`, porque 44 não é degrau. O gatilho do `BreadcrumbMenu`
virou `Button icon-xs` (24×24, medido). As setas do `Calendar` deixaram
`buttonVariants` nas `classNames` e viraram `components.PreviousMonthButton /
NextMonthButton` renderizando `Button` — o `react-day-picker` entrega `type`,
`className`, `tabIndex`, `aria-disabled`, `aria-label`, `onClick` e o `Chevron`
como filho, e **não** entrega `disabled`, por isso o `aria-disabled:opacity-50`
fica. Junto, o objeto `components` entrou num `useMemo`: eram arrows inline
recriadas a cada render, e o React remontava a subárvore. Medido: depois de
clicar "próximo mês", o foco continua na seta, **e é o mesmo nó**.

**A superfície de campo tem uma régua, e agora sete a vestem.** `Textarea`,
`NativeSelect` e `InputGroup` entraram. Medido contra o `Input`: borda, fundo e
raio idênticos nos três. O `NativeSelect` perdeu os dois desvios que o backlog
já nomeava (`data-[size=sm]:rounded-md` e o `dark:hover:` sem par), ganhou `lg`
e `xl` pela `fieldTriggerSizeClassName`, e a rampa de 16px do telefone; a
opacidade do desabilitado saiu da casca (se somaria à do controle) e foi para o
chevron. O `InputGroup` é uma **moldura**, e lê os estados pelo controle de
dentro — por isso entraram três variantes `fieldGroup*ClassName` escritas por
extenso sob `has-…` (classe montada em runtime não existe), com
`field-classes.test.ts` derrubando cada token da régua ao prefixo da moldura;
ele já tinha divergido, faltava o `dark:…border-destructive/50`. O
`InputGroupAddon` virou `Label`: seis das oito classes do átomo já estavam
escritas à mão ali; o que ele acrescenta é `leading-none`, medido em 14px nos
quatro alinhamentos, e ficou. O `InputOTPSlot` **não** veste — é célula de
superfície segmentada, não campo — e a tabela do cabeçalho de `field-classes`
diz isso.

**Os literais.** `Switch` de `h-[18.4px] w-[32px]` para `h-4.5 w-8` (18×32
medidos, polegar centrado com delta 0). O gráfico ganhou `rounded-xs` — e o
token `--radius-xs: calc(var(--radius) * 0.2)` entrou em `globals.css`, porque
sem ele `rounded-xs` caía no 0,125rem do tema padrão do Tailwind; medido, 2px.
`item.value.toLocaleString()` era **sem locale** — formatava na língua do
navegador — e virou `numberBR()` em `formatters.ts`. A sobrancelha ganhou
`--tracking-eyebrow: 0.18em` (1,98px a 11px, medido). `w-[2px]` → `w-0.5`,
`top-[60%]` → `top-3/5`, o `XMarkIcon` do chrome de folha para o conjunto 16
(o `Button icon-sm` já força 16px). O auditor passou a aceitar `inherit` e as
cores de sistema `Canvas`/`CanvasText`, e a pular o conjunto do Heroicons nos
`DRAWN_SVG_FILES` (o `Spinner` gira o mesmo desenho de 16 a 32). **`ds:audit
-- src/components/ui`: 16 → 0.**

**As exceções, e por quê.** `sidebar`: vestir `Button tertiary` no
`sidebarMenuButtonVariants` exigiria sete contra-classes (`justify-start`,
`font-normal`, `border-0`, `focus-visible:ring-sidebar-ring`,
`dark:hover:bg-sidebar-accent`, os `aria-expanded:*`, o `translate-y`) — o cva
é a régua de baixo daquele chrome, e o arquivo já distingue: `SidebarTrigger`,
que é ação, **é** `Button`; `MenuAction` tem 20px de caixa (o menor `Button` é
24); `Rail` é alça com `tabIndex={-1}`. `ComboboxTrigger`: é campo, veste
`field-classes`, e `Button` daria a superfície de que ele saiu. O campo da
paleta (`command.tsx`): imita o gatilho do cabeçalho, decisão anterior. Os
cinco estão escritos nos arquivos.

**A taxonomia precisou de uma linha.** `select.tsx` (Átomo) passou a importar
`typography` (Fundação), e a asserção 2 reprovaria. `camadaNoGrafo` trata
`typography` como Átomo nas asserções 2 e 3: os nove são átomos pelo teste do
arquivo; a **página** é a Fundação de tipo. Vestir a Fundação de tipo não é
compor.

**O que ficou de fora, com nome.** Um `SurfaceTitle` (ou
`surfaceTitleClassName`) para os seis títulos `font-heading font-medium
text-balance`. `Muted` sem a entrelinha de `P` — cinco call sites compensam com
`leading-relaxed`/`leading-normal` à mão, e a doc diz que `Muted` "é o mesmo
corpo de `P`". `Switch` ainda diz `size="default"` — o `SidebarMenuSubButton`
foi o último de `ui/` a perdê-lo, na rodada 35.
O `FieldLabel` de cartão de escolha escreve uma sexta grafia do anel. O
`border-[1.5px]` do gráfico não tem token. O `Button tertiary` continua sem
par `active:` — o item do seletor o traz por `className`, mais um consumidor
pedindo o conserto no `Button`. E o **app** não foi tocado: os 51 primitivos
crus das telas são a rodada seguinte, com a regra já escrita.

### O `Form` virou molécula, e a inversão fica registrada

A seção acima respondeu "o `Form` não devia ser molécula, já que tem input e
botão?" com um fato: ele **não** tinha — era o `<form>` e a política do Enter,
mais nada. A resposta certa não era manter a classificação; era **fazer o
componente ser o que o nome promete**. A régua não mudou: um componente compõe a
camada de baixo. O que mudou foi que agora há o que compor.

**O que cada peça fecha, com a contagem que a pediu:**

| Peça | Compõe | A contagem |
| --- | --- | --- |
| `FormInput` / `FormTextarea` | `Field` + `Input`/`Textarea` | **104 campos à mão** em 27 arquivos, 5 dialetos de espaçamento — e `Field` com **zero** consumidores fora do catálogo |
| `FormSubmit` | `Button` + `Spinner` | **46 botões de enviar** escritos à mão; o *pending* em **76 strings**, com três grafias de reticência |
| `FormCancel` | `Button` | **173 `variant="outline"`** contra a tabela do rodapé, que diz `tertiary` |
| `FormActions variant="sticky"` | — | o `MobileSheetFormFooter` que faltava: **5 arquivos** derivavam a classe do rodapé à mão, com três `!important` |
| `FormError` | `P` | **3 contratos de acessibilidade** para a mesma frase |

**O `id`, e até onde o contexto chega.** `Form` gera um `id` com `useId` e o
publica em contexto; `FormSubmit` escreve `form={id}` **sempre**. Dentro do
`<form>` é inócuo — o `submitFrom` acha o botão na primeira busca. Fora dele é o
que faz o Enter funcionar, e **contexto do React atravessa portal**: medido no
catálogo, o Enter num campo do `DialogBody` aciona o botão do `DialogFooter`, com
`form` e `id` iguais. O que ele **não** atravessa é *slot irmão*: quando outro
componente renderiza o rodapé ao lado do formulário — o `footer=` do assistente
de categorias —, não há contexto a herdar, e ali `form="um-id"` explícito
continua sendo a resposta. As quatro constantes de string daquele arquivo ficam.

**`role="alert"` e nada mais.** O papel já implica `aria-live="assertive"`, e um
`aria-live="polite"` explícito **vence** o implícito — `role="alert"
aria-live="polite"`, que o `login-form` escreve, é uma região polida chamada de
alerta. Não é redundância, é contradição. E `FormError` não compõe `Alert`:
seria molécula dentro de molécula, que a asserção 3 reprova — quem quer a caixa
escreve `<Alert tone="destructive" variant="plain">` na tela.

**Dois eixos de tamanho, e é de propósito.** `size` vai ao `Input` (a escada de
altura); `fieldSize` é o degrau do andaime — rótulo, ajuda, erro — e herda do
`FieldGroup`. `field.tsx` proíbe ancorar um no outro, porque um `Field` não sabe
que controle carrega.

**O que a mecânica exigiu, medido.** `FieldDescription` se registra **mesmo
vazia**, então ela é renderizada condicionalmente — senão o `aria-describedby`
apontaria para um parágrafo vazio; `FieldError` devolve `null` e desregistra, e
pode ir incondicional. Em `FormSubmit`, `type` e `variant` vêm **antes** do
espalhamento (uma exclusão pode pedir `destructive`) e `disabled`/`aria-busy`
vêm **depois** (o estado de envio não pode ser sobrescrito). O `sticky` **não**
traz área segura: ela é da superfície, e o casco da folha já a carrega — somar
dobraria; e não desenha fio nem tinta, que é a regra J.

**Um achado do navegador:** dentro de `<DialogClose asChild>`, o `data-slot` do
`FormCancel` vira `dialog-close` — o `Slot` do Radix resolve o atributo a favor
do pai. O que importa sobrevive (`variant="tertiary"`, `type="button"`), e o
nome que fica é o certo: naquele rodapé, aquele botão **é** o fechar do diálogo.
Quem escrever seletor para o cancelar de um diálogo procura `dialog-close`.

**A página ganhou as cinco formas que o app tem**: empilhado (auth e
configurações), em linha (busca), em diálogo (com o botão portalizado), em folha
no telefone (cabeçalho fixo, corpo rolável, rodapé `sticky`) e com estado
(`pending` ligado, `FormError` com causa real). A demonstração da folha passa
`children` ao `MobileSheetFormStickyHeader` em vez de `title`: com `title` a peça
renderiza um `DialogTitle`, que **lança** fora do contexto do `Dialog` — medido,
e é como a página do chrome já fazia.

**O que não migrou.** As 29 telas: `CustomForm` é alias e elas compilam sem
mudar. Trocar o nome sem trocar os campos e os botões seria diff sem ganho — elas
migram quando migrarem o conteúdo, e aí os 104 campos, os 46 botões e as 11
telas que escrevem a área segura à mão saem juntos.

### O `Kbd` absorveu o acorde, e o `KbdGroup` saiu para Moléculas

Eram três peças em dois arquivos, e a pergunta "por que existem `kbd` e
`kbd-shortcut`?" tinha uma resposta boa — uma tecla, um acorde e uma sequência
são **gestos** diferentes — e uma consequência ruim: **duas entradas e duas
páginas para um tópico só**, com duas `PropsTable` da mesma prop `keys` que já
tinham divergido. Uma enumerava o que a prop aceita, a outra explicava o `mod`,
e nenhuma continha a outra. É o defeito que a rodada da Tipografia pagou, na
escala de um componente.

**O `Kbd` ficou com as duas formas**: `<Kbd>Esc</Kbd>` é a tecla,
`<Kbd keys="mod+k" />` é o acorde. O tipo é uma união — `children` e `keys` não
convivem —, porque duas fontes para o mesmo conteúdo deixam uma em silêncio e
quem escreveu não descobre qual. O `KbdShortcut` foi apagado sem alias: tinha
**um** consumidor real, o gatilho da busca do catálogo.

**A guarda que essa fusão exigiu, e o que ela protege.** O `KbdShortcut`
devolvia `null` até montar, porque a escolha entre `⌘` e `Ctrl` depende do
`navigator`. Subir isso para o `Kbd` sem condição faria **toda** tecla da tela
esperar por uma plataforma que não muda nada — e a legenda do rodapé da paleta
são quatro `Kbd` sem acorde (`↑ ↓ ↵ esc`), que pintariam em branco por um
quadro. `useApplePlatform(ativo)` recebe `keys != null` e sai cedo. Medido no
HTML do servidor da página do `Kbd`: **7 pastilhas**, exatamente as sete teclas
soltas; os acordes não emitem nada e entram depois da hidratação.

**O `KbdGroup` virou molécula, e o `keys` é o que torna isso verdade.** A
decisão do dono foi "ele é a junção dos átomos" — e a medição mostrava o
contrário: ele importava **zero** componentes, porque os `<Kbd>` vinham de quem
chamava. Era mais uma das 26 de 38 moléculas que não compunham nada. Agora
`<KbdGroup keys={["g","h"]} />` renderiza um `Kbd` por tecla, e o átomo é
importado de fato. `children` continua para o que a tabela de nomes não escreve.

**Um `"use client"` que não é pelo hook.** `kbd-group.tsx` não tem hook nenhum,
e precisa da diretiva assim mesmo: `kbd.tsx` passou a ser módulo cliente, e
**todo export de um módulo cliente vira *client reference*** quando um componente
de servidor o importa — inclusive o que não é componente. Sem a diretiva, o
`formatKey()` seria chamado no servidor e estouraria. Hoje nenhum consumidor é
servidor, então é prevenção; e custa zero, porque o `Kbd` que ele renderiza já
arrasta o limite.

**Um defeito achado no caminho.** `docs/command.tsx` desenhava o `⌘K` dela como
`<KbdGroup><Kbd>⌘</Kbd><Kbd>K</Kbd></KbdGroup>` — um acorde escrito como
sequência, exatamente o que a nota "Acorde e sequência não são a mesma coisa"
chama de errado e afirmava que **só** a página do `kbd` fazia. Ela mentia por
omissão. E carregava um segundo defeito que a nota não cobre: o `⌘` era literal,
então em Windows a demonstração ensinava a tecla errada — na página do
componente que abre com aquele atalho, cujo `useEffect` aceita
`metaKey || ctrlKey`.

**A taxonomia: cinco asserções mudam de entrada, nenhuma muda de resultado.**
Três coisas que isso expôs:

- **A asserção 6 aponta para o mesmo lugar que a decisão do dono.** Manter o
  `KbdGroup` dentro de `kbd.tsx` e dar página a ele produziria duas entradas com
  o mesmo `source`, e ela reprovaria. Decisão e mecanismo concordaram.
- **A asserção 2 não defende a classificação.** `kbd-group` com uma dep átomo
  passaria como Átomo também; quem defende "Molécula" é só o comentário do
  `LAYER` — que é o que o JSDoc dela já avisa.
- **A asserção 1 é unidirecional** (arquivo → entrada). Uma entrada cujo `.tsx`
  sumiu não é pega por nenhuma das sete; o que salva é `categoryForSlug`, que
  **lança no import** e derruba `/designsystem/*`. Por isso `LAYER` e `REGISTRY`
  mudam na mesma edição.

Contagem viva das camadas: **7 · 28 · 15 · 30 · 2 · 7**. O número da seção da
rodada 17 (`29 · 13`) já estava velho antes desta rodada — o `form` virou
molécula no caminho —, e a decisão de não caçar contagem à mão continua valendo:
o número datado fica onde está, e o vivo fica aqui.

E uma nota honesta sobre a lista dos sem-consumidor: **`kbd` nunca esteve nela**,
apesar de nenhum arquivo de produto o importar — porque `kbd-shortcut.tsx` o
importava, e o medidor conta isso como "consumidor fora do catálogo". Depois
desta rodada quem faz esse papel é `kbd-group.tsx`. É consumo **dentro do
sistema**, e a medida por arquivo o esconde — do mesmo jeito que esconde os sete
de nove exports de `typography` sem uso.

### As duas setas do paginador, e a pasta que o auditor nunca olhou

O dono selecionou a navegação "Anterior/Próximo" do catálogo e perguntou por que
os ícones estavam diferentes. Estavam: a seta da esquerda vinha de
`24/outline` (`stroke-width="1.5"`, `fill:none`) e a da direita de `16/solid`
(`fill`), **no mesmo `size-4`**, decididas pela mesma linha —
`const Chevron = isNext ? ChevronRightIcon : ChevronLeftIcon`.

**Por que sobreviveu: o auditor era cego duas vezes.** `designsystem` estava no
`SKIP_DIRS` **sem uma linha de justificativa**, numa lista que de resto só tinha
`node_modules`, `.next` e `.git`. E mesmo apontado para a pasta ele não pegaria:
a regra G resolve o conjunto pelo `import` e casa `<NomeImportado>` no JSX —
**não seguia indireção**. Medido antes: rodando a pasta explicitamente, G
devolvia 2 achados, os dois falsos positivos, e **nenhum dos reais**. Consertar
uma das duas cegueiras não bastaria; foi preciso as duas.

**O corte passou a ser por regra, não por pasta.** `isCatalog` — irmão do
`isUi` — cala **A, D, D2, D3, H e I**, que são exatamente as seis que uma página
de catálogo **precisa** violar para documentar: `docs/camadas.tsx` escreve
`z-[1]` porque é a escala que ela ensina, `docs/typography.tsx` cita
`text-[10px]` porque foi o que os tokens substituíram, `docs/code.tsx` cita
`text-green-600` como o exemplo que o auditor reprova, e cada peça do catálogo
nasce em `app/` de propósito, porque é demonstração e não tela. Todas as outras
regras passaram a valer. **195 → 4**, e os 4 restantes são falsos positivos
conhecidos.

Duas limpezas entraram junto, e valem para o repositório inteiro: **arquivo
gerado sai da varredura** (o que abre com `// GERADO POR` — eram 14 achados, todos
de `search-index.ts`, texto de espécime concatenado pelo gerador), e
**comentário não é código**. A segunda o arquivo já prometia e não cumpria: o
JSDoc de `lineOf` dizia "remove comentários" e a função só contava linhas.

**A regra G passou a seguir indireção**, nos três padrões reais — `const X =
cond ? A : B`, `{ Icon: Foo }` e `{ icon: Foo }` + `<item.icon>`. Ela **erra para
menos**: se qualquer sítio indireto tiver o corpo ilegível (`${…}` sem `size-`
literal), o arquivo inteiro se cala — é o que mantém `docs/iconografia.tsx`, que
escolhe o conjunto por px, fora do relatório.

**Ela achou 14 pares errados, e 6 estavam fora do catálogo.** No catálogo:
`ds-doc.tsx` (a seta), `page.tsx` (os 4 de "Comece aqui" — no mesmo cartão onde o
`ArrowRightIcon` de 16/solid já estava certo, o mesmo desencontro do paginador) e
`docs/sidebar.tsx` (3 de 24/outline misturados com 1 de 16/solid na mesma barra).
No app, que nenhuma regra alcançava: `dashboard-kpi-cards.tsx` (4×, em `size-3` e
`size-3.5`) e `category-detail-summary-section.tsx` (2×, em `size-3`). Os 14
viraram `16/solid`.

**Uma exceção nomeada, com o motivo:** `app-theme-toggle` faz um crossfade
`outline` ↔ `solid` a 16px, e **o Heroicons não tem `16/outline`** — os conjuntos
micro e mini são só sólidos. Mesma classe de lacuna do círculo do `Spinner`, e a
saída é a mesma: `HEROICON_SET_EXCEPTIONS`.

**As três receitas de botão viraram `Button asChild` — e duas delas contra a
medição.** Eu apresentei o custo e o dono reafirmou; o número de cada uma ficou
escrito no arquivo, que é como este projeto registra decisão tomada contra
medida:

| | contra-classes | o que elas desfazem |
| --- | --- | --- |
| `DocPagerLink` | **2** | `shrink` e `dark:hover:bg-accent`. `className` de 23 para 14 tokens — **vale** |
| `DsNavLink` | **7** | `justify-start`, `font-normal`, `min-w-0` + `truncate` no filho, `dark:hover:`, e 3 para neutralizar o hover do `tertiary` no item ativo. É o mesmo 7 que fez o `sidebarMenuButtonVariants` ficar cru |
| linha de sumário | **3** | `h-auto`, `font-normal`, `bg-clip-border`. `className` de 14 para 13 tokens |

Três fatos do `twMerge` que a conversão obrigou a medir: **`shrink-0` não é
derrubado por `min-w-0`** — sem a contra-classe `shrink` o par não encolhe no
`justify-between` e o `truncate` **nunca dispara** (medido a 320px: com ela, as
duas reticenciam e a página não rola na horizontal); **`dark:hover:bg-muted/50`
não é derrubado por `hover:bg-accent`**, porque são variantes diferentes e no
escuro `&:is(.dark *)` vence; e **`group` convive com `group/button`** — são
classes distintas, e `group-hover:` compila para `:is(:where(.group):hover *)`,
que precisa da literal. Sem essa terceira, as setas parariam de animar.

**A regra J acendeu uma vez, e virou exceção nomeada.** Ver a nota dela acima: o
`PreviewCode` não é uma tira, é a segunda superfície — e o fio faz 5,5× o
trabalho da tinta, medido.

**O que ficou fora, e é o próximo buraco.** As regras **H** e **J** só enxergam
`className="literal"`: o regex não casa `className={cn(…)}`. Medido: **694 de
5.753 sítios usam `cn()` — 12% de ponto cego**. É por isso que a H nunca viu o
`DocPagerLink`, que tinha `hover:` e `active:` dentro de um `cn()`. E os 4 falsos
positivos que sobram no catálogo têm duas causas: a heurística "sem classe de
tamanho = `size-4`" da regra G não enxerga o pai (`ColorTile size="lg"` aplica
`size-5`), e `description=`/`title=` ainda não são tratados como espécime.

### O `MoneyInput` virou `<Input money>`, e o defeito estava nas chamadas

A pergunta que abriu a rodada foi se o `MoneyInput` não devia ser Molécula, "já
que é feito de input, rótulo e texto de ajuda". **Ele não era.** Medido: 80
linhas, **um** import de `ui/` (o `Input`), um `<Input>` no `return`, e zero
rótulo, zero ajuda, zero erro, zero prefixo "R$". O tipo era literalmente
`Omit<ComponentProps<typeof Input>, "type"|"value"|"defaultValue"|"onChange">`.

**Mas a intuição apontava para um defeito real, e ele estava um nível fora.** O
rótulo, a ajuda e o erro que a pergunta imaginava dentro do componente estavam
espalhados pelas **17 chamadas**, em 11 arquivos: `<Label htmlFor>` escrito à
mão nas 17, três dialetos de espaçamento (`space-y-1.5`, `space-y-2`,
`grid gap-2`), dois de rótulo, e **zero `aria-invalid`, zero
`aria-describedby`** — um campo de dinheiro inválido não era anunciado por
leitor de tela em lugar nenhum do app.

**A resposta não foi reclassificar; foi fazer o componente ser o que o nome
promete** — a mesma inversão que o `Form` registrou. Só que o nome que promete
não era `MoneyInput`: era o `Input`. Ele absorveu o modo, como o `Kbd` absorveu
o acorde em `keys`.

**A união é discriminada, e os dois ramos declaram as mesmas chaves.** O ramo
base fecha `onValueChange` e `mono` com `?: never`; o de dinheiro fecha `type`,
`defaultValue` e `onChange`. É o idioma do `Kbd`, e a razão é mecânica: com as
chaves presentes dos dois lados, um `const { onValueChange, ...rest }` compila em
qualquer ramo e o `rest` não perde nada calado — com `Omit` puro, `onValueChange`
sumiria do `rest` sem aviso. **E é o que dispensa o estreitamento dentro do
componente**: `onValueChange` colapsa para `Fn | undefined`, então o corpo o
chama com `?.()` e nunca pergunta em que ramo está. Um `<input>` só, com o ramo
no corpo — dois componentes internos desmontariam o nó se `money` alternasse, e o
campo perderia o foco.

**O colapso do rest é real, e foi medido nos quatro consumidores de
`ComponentProps<typeof Input>`.** `FormFieldOwnProps & ComponentProps<typeof
Input>` é uma **interseção com a união aninhada**, e desestruturar o rest dela
colapsa os ramos num objeto com `money?: boolean`, que não é atribuível a
nenhum: `Type 'true' is not assignable to type 'false'`. Em `FormInput` a saída
foi **distribuir a interseção à mão**, pondo a união no topo — e ela compilou de
primeira, sem ternário de estreitamento e **sem nenhum cast**. `InputGroupInput`
e `SidebarInput` foram **fixados no ramo base** (`InputBaseProps`): ali o
colapso ainda comeria `onChange`, `type` e `defaultValue`, e não há dinheiro numa
busca de lateral nem dentro de uma moldura de addon — o que a página do
`InputGroup` já dizia. `SearchInput` e `FormPickerPopoverSearch` derivam do
primeiro e ficaram limpos de graça.

**`data-slot` virou `input`, com `data-money` ao lado.** `data-slot="money-input"`
tinha **zero** consumidores — nada em `globals.css`, no auditor, em `lib/`, em
teste, nem em `ENTER_DEFERRAL_RULES`. E `data-money` sobrevive quando o
`FormInput` sobrescreve o `data-slot` com `form-input`, coisa que `money-input`
não fazia: naquele componente o `data-slot` sempre foi nome de encaixe, não
rótulo de tipo.

**Doze das dezessete chamadas viraram `FormInput`; cinco ficaram cruas, e o
motivo de cada uma está escrito no sítio.** Duas são estruturais —
`credit-card-category-alerts` tem rótulo e controle como **células
independentes** de um `grid` com `sm:contents`, e o `flex-col *:w-full` do
`Field` as colapsaria; o orçamento por linha do `categories-onboarding-wizard`
tem rótulo `sr-only` num controle de largura fixa (`w-[6.75rem] shrink-0`) numa
fileira flex. As outras três são de aparência: os dois campos de valor do
`transactions-filters-panel` têm rótulo `text-2xs text-muted-foreground`, e
`fieldSize` só tem `sm` (`text-xs`) e `md` — eles são **2 de 9 rótulos irmãos**
na mesma grafia, e migrar só os dois deixaria dois rótulos de outro corpo e
outra cor no meio do painel. Migrar o painel inteiro é rodada própria.
*(Foi, na N7: o painel inteiro migrou, com a mesma grafia de rótulo por
`className` no `FieldLabel`, e o orçamento `sr-only` do assistente num `Field`
horizontal, que não estica o campo de largura fixa.)*

**Um conserto que veio junto, e não estava no plano.** Seis dos sítios
escreviam `className="text-sm"` no campo de dinheiro. A superfície é
`text-base md:text-sm`, e essa rampa existe para **impedir o zoom automático do
iOS** em campo com fonte abaixo de 16px — o `text-sm` a anulava, e os seis
campos davam zoom no telefone. Com a migração ele saiu: 16px no telefone, 14
no desktop, que é o que o componente sempre prometeu.

**O catálogo perdeu uma página** (89 → 88): a de dinheiro fundiu na do `Input`,
com as três notas movidas literais e uma nova explicando por que virou modo. A
demonstração passou a usar `<FormInput money>` — uma página que ensina o campo
tem de mostrar a forma que a rodada impôs às telas. Mais cinco menções textuais
em `field`, `input-group`, `slider`, `dinheiro` e `typography`.

**E a cláusula "especializar continua átomo" ficou com zero casos.** Ela tinha
dois exemplos, e os dois morreram pelo mesmo motivo: o especializador importava
**um** componente e renderizava **um** elemento — era o átomo com outro nome,
cobrando do catálogo uma segunda página. É o resultado que se devia esperar, e o
comentário da asserção 2 passou a registrá-lo com a pergunta que sobra: **isto é
um componente ou um modo?** A régua segue válida uma camada acima, onde a
especialização é real (`StatCard` sobre `Card`).

### O rádio não tinha átomo, e o `Form` já não era molécula

A pergunta foi pôr o `RadioGroup` em Moléculas e criar um componente de rádio.
Medido, o componente dava razão a ela: 49 linhas, **zero** imports de `ui/`, e o
`RadioGroupItem` era **o círculo cru** — quem usava escrevia o `<div
className="flex items-center gap-2">`, o `<Label htmlFor>` e o `id` à mão, uma
vez por opção. As duas demonstrações do catálogo faziam isso, em duas grafias, e
o catálogo escrever a anatomia é o sinal que esta casa já nomeia: **falta uma
peça**. "Molécula feita de átomos" seria mentira enquanto o rótulo ficasse do
lado de fora.

**`Radio` é o átomo, e ele não renderiza sozinho.** O Radix **não exporta** rádio
independente — só o `Item`, que chama `useRadioGroupContext` e lança fora do
`Root`. É o primeiro átomo do sistema que exige contexto entre arquivos, e o
custo foi aceito com o motivo escrito: reimplementar o `role="radio"`, o foco
itinerante e o `<input>` espelho à mão para ganhar independência seria trocar uma
primitiva testada por uma cópia pior. Contexto de primitiva não é composição —
a mesma conta que faz o `Slider` átomo com quatro peças Radix por dentro.

**Ele não especializa nada**, e por isso não reabre a cláusula que as duas
rodadas anteriores fecharam: `KbdShortcut` e `MoneyInput` foram absorvidos porque
eram *o átomo com outro nome*; aqui é o inverso — a unidade estava dentro e saiu.
É o par `kbd` / `kbd-group` outra vez.

**Duas correções de conteúdo, com número.** O ponto passou de `bg-primary` para
`bg-current`, o que dá trabalho ao `text-primary-accent` do anel — que era
**declaração morta**, porque nada lia a cor do texto. Medido contra a página: no
claro os dois tokens dão 7,34:1 (ali são a mesma cor); no escuro `--primary` dá
**3,64:1** e `--primary-accent` dá **6,78:1**. Nenhum reprova os 3:1 de traço
não-textual, e é por isso que quem decide é a régua e não a norma: o ponto não
carrega texto por cima, ele é marca sobre o fundo. E o `aria-invalid` ganhou
`ring-3`: ele escrevia a **cor** do anel sem a largura dele, então o estado
inválido trocava só a borda — a família do "Desfazer" do toast, que tinha
`border-color` e nenhum `border-style`.

**O `<label>` embrulha o rádio, e o cartão exige isso.** Não há `useId` nem
`htmlFor`: a associação implícita resolve, e o controle rotulado é o `<button
role="radio">`, que **é** elemento rotulável. O `variant="card"` não teria como
funcionar de outro jeito — a caixa que acende é a mesma que precisa *conter* o
rádio para ler o estado dele com `:has()`. E a `description` vive dentro do
rótulo, entrando no **nome acessível** em vez de num `aria-describedby` que faria
o leitor dizer o texto duas vezes.

**`FormRadioGroup` precisou de um irmão do `FormField`, e o motivo é mecânico.**
`RadioGroupPrimitive.Root` renderiza uma `<div role="radiogroup">`, e `<label
for>` exige um elemento **rotulável** — o navegador ignora sem avisar. O
`FormFieldGroup` rotula por `aria-labelledby` apontando para um `FieldTitle`, que
é a peça que `field.tsx` já reservava para *"o que rotula um grupo, e não um
controle"*. O `Field` fica **sem `role`**: um segundo `radiogroup` em volta
poria um nó entre o grupo e os `role="radio"` dele, que é a regra que este
arquivo já escreve para o `ButtonGroup` em volta de um `tablist`. O
`FieldControl` continua servindo — a raiz é uma `div` de verdade, e os três
atributos que ele injeta são os que um grupo quer.

**Os 4 rádios vestidos de aba voltaram a ser rádio.** Eles anunciavam o padrão
ARIA de abas com zero `tabpanel`, zero `aria-controls` e zero foco itinerante,
para escolher o valor que ia ser gravado. O pior tinha `<Label>Como informar os
valores?</Label>` **solto** — sem `htmlFor`, sem `aria-labelledby` — e o nome
acessível vinha de um `aria-label` que dizia uma terceira coisa. Os
`role="tablist"` do app foram de **10 para 6**, e os 6 que ficam são filtro ou
aba de página, com a chapa (`transactionSegmentContainerClassName`) intacta
porque 8 arquivos ainda a importam.

**E `fullWidth` saiu do `TransactionFormTypeSegment` de propósito.** Dentro de um
`Field` o `fieldVariants` já dá `*:w-full`, então o prop virava no-op — e prop
que não faz nada é a classe morta desta base em forma de API. Removê-lo fez o
compilador apontar os **7** sítios que embrulhavam o componente em `<div
className="space-y-2"><Label>Tipo</Label>`: sete rótulos órfãos que deixaram de
existir, e um oitavo sítio que não tinha rótulo nenhum e passou a ter.

### O `Form` virou organismo, e o teste é que descobriu

Nem eu nem o plano previram: `form.tsx` já importava `field` (Molécula) e passou
a importar `radio-group`, que acabara de virar Molécula. **Duas moléculas**, e a
asserção 3 reprovou.

O achado é maior que o conserto. Pela régua escrita, organismo é quem *"compõe
duas ou mais moléculas, ou compõe molécula **e** tem estado próprio"* — e o
`Form` já satisfazia a segunda cláusula antes desta rodada: ele compunha `field`
e tinha a política do Enter e o `id` em contexto. **Ele estava classificado
errado, e o limiar mecânico da asserção 3 é que expôs.** É a terceira inversão
que este arquivo registra para o mesmo componente: átomo → molécula quando ganhou
as peças, molécula → organismo quando as peças passaram a ser moléculas.

### Três lições de método, e as três são erros meus

**Um agente reportou dois seletores mortos, e os dois estavam vivos.** A
afirmação era que `has-data-checked:` em `field.tsx` nunca acendeu o cartão de
escolha, e que o `Switch` não pintava pelo mesmo motivo. Medido no navegador: o
cartão marcado sai com `oklab(0.66 … / 0.6)` na borda e `oklab(0.5 … / 0.1)` no
fundo; o `Switch` marcado sai `oklch(0.5 0.125 166)`. O Radix de fato **não**
emite `data-checked` — mas o variante do Tailwind 4.2.2 cobre
`[data-state=checked]` também. A "correção" teria mexido em `ui/` sobre premissa
falsa. **Relatório de agente não é medição.**

**Li o DOM no mesmo tique do `.click()`, e "descobri" um defeito que não
existia.** Quatro grupos pareceram não selecionar; com uma espera de quadro, os
quatro selecionam. É a lição que este arquivo já registra três vezes, agora pela
quarta — e desta vez o próprio dado denunciava o erro: a leitura seguinte já
mostrava o estado trocado pelo clique anterior.

**E gastei quatro medições acusando o teclado antes de testar o instrumento.**
As setas não moviam o foco. Instalei um ouvinte de `keydown` e pressionei uma
tecla: **zero eventos recebidos**. O painel do navegador não entrega teclas neste
ambiente, com ele oculto ou à frente. A navegação por setas vem do
`RovingFocusGroup` do Radix e **não foi verificada** — está dito assim, em vez de
afirmada.

**O que ficou medido, e o que não.** Verificados: os quatro grupos selecionam; o
cartão acende nos dois estados; `role="radiogroup"` com `aria-labelledby`
apontando para um `field-title` que existe, e `aria-describedby` para a
descrição. **Não verificados**: as setas (acima) e as telas do app migradas, que
exigem sessão autenticada.

**Uma medida que a previsão errou.** O plano dizia que o cartão horizontal ficaria
em 44px nos dois tamanhos. Medido: **44 no desktop** (220px de largura, uma
linha) e **61 no telefone** a 375px (143px de largura, rótulo em duas linhas),
contra os 40 do trilho que ele substitui. O ganho de acessibilidade é real; o
custo de altura no telefone é maior do que eu previ, e fica escrito.

### A ação do alerta era um pedido, e virou peça — e a da barra também

A pergunta foi se `Alert` e `AnnouncementBar` não deveriam ser átomos. Medido:
`alert.tsx` importava **zero** componentes e as quatro peças eram quatro `<div>`
— a posição exata em que o `Select` estava quando a rodada da taxonomia o
devolveu a Átomos. `announcement-bar.tsx`, ao contrário, importa e renderiza um
`Button` de verdade (o × de dispensar), e por isso é molécula com motivo.

**A leitura melhor foi do dono, e ela inverte a conclusão**: o `Alert` não
compõe nada porque *está errado*, não porque é átomo. A regra da rodada da
composição é *"onde existe a peça de baixo, ela é obrigatória"* — e ela existia.

**O sintoma estava escrito no código.** `AlertActions` alcançava o botão por
**seletor descendente**, cinco regras `[&_[data-slot=button]]:`, e o JSDoc
*pedia* que quem chamasse escrevesse `variant="tertiary"`. Pedir não é garantir,
e este arquivo já registra que *"compensar geometria por seletor é sintoma de
que falta uma peça"*. A contagem confirmou: **6 de 6 chamadas** escreviam a mesma
string — `type="button" variant="tertiary" size="sm"` —, nas três demonstrações
do catálogo, na página da folha e no dashboard.

`AlertAction` é a peça. Com ela, `alert.tsx` passa a importar o átomo e a
classificação de Molécula **deixa de ser herdada** — é a mesma inversão que o
`Form` registrou: a resposta não era mudar a etiqueta, era fazer o componente ser
o que o nome promete.

**O ganho que não estava previsto é do `twMerge`.** Compondo o `Button`, o
`dark:hover:bg-muted/50` do `tertiary` é **removido** da lista de classes —
medido no DOM: sobram `hover:bg-current/10` e `dark:hover:bg-current/10`, e
nenhum `dark:hover:bg-muted`. A versão por seletor tinha de **vencer** aquela
classe por especificidade (0,3,0 contra 0,2,0), deixando a declaração perdedora
no CSS. É a mesma lição que a régua de densidade da `Toolbar` já registra: por
`className` quem decide é o `twMerge`, que remove o degrau conflitante.

**E o `dark:hover:` é obrigatório na peça, não redundante.** `&:hover` e
`&:is(.dark *)` empatam em especificidade e o `dark:` é emitido depois; sem essa
linha, o realce cinza do `tertiary` venceria o tonal no tema escuro — calado, e
só num tema. É a armadilha que o `AppThemeToggle` pagou uma vez.

**A irmã veio na sequência, e trouxe um defeito de tema escuro.**
`AnnouncementBarActions` tinha o mesmo desenho — quatro regras
`[&_[data-slot=button]]:` e um JSDoc descrevendo um botão que ela não renderiza
—, e virou `AnnouncementBarAction`: `Button` `tertiary` `size="xs"`, um degrau
abaixo do alerta porque a barra atravessa o topo e não pode empurrar o conteúdo.

**E medindo as classes apareceu o que o seletor escondia.** O × de dispensar
carregava `hover:bg-current/15` **e** `dark:hover:bg-muted/50`, e a aritmética
que este arquivo já registra decide: `.cls:hover:is(.dark *)` é **(0,3,0)**
contra os **(0,2,0)** de `.cls:hover`. **Os 15% medidos com tanto cuidado nunca
valeram no tema escuro** — o × ficava cinza, calado, e só num tema. O botão de
ação estava um degrau pior: a classe tonal nem existia na lista dele, vinha do
seletor descendente, que empata em (0,3,0) com o `dark:` e era decidido por
ordem de emissão.

Compondo os dois, o `twMerge` **remove** o `dark:hover:bg-muted/50` em vez de
disputar com ele — medido no DOM: sobram `hover:bg-current/15` e
`dark:hover:bg-current/15` no ×, `/10` nos dois na ação, e nenhum `bg-muted`.
A assimetria de 15 contra 10 fica, e o motivo continua sendo **área**: um ícone
de 12px numa caixa de 24 sem contorno tem um quarto da superfície de um botão de
texto.

### A costura era uma borda, e o auditor não tinha como ver

`resizable.tsx` era o único arquivo de `src/components/ui/` fora de toda régua
da casa — e passava **limpo** no `ds:audit`. Não por sorte: `isUi` desliga A2, C
e C', e ele não tinha cor literal, valor arbitrário, `<svg>`, `hover:` sem par
nem `Intl`. Uma pasta calada não é uma pasta conforme, e um arquivo aprovado
também não.

O defeito de fundo cabe numa frase: **a costura era indistinguível de uma
borda.** Mesmo token, mesma espessura, mesma cor, nenhum estado — o desenho de
um `Separator` parado, na única peça do app cujo trabalho inteiro é dizer que
aquela linha se move. E a pega do `withHandle` era **também** `bg-border`: uma
pastilha da cor exata do fio em que ela se apoia. Medido, **1,35 no claro e 1,33
no escuro**, o mesmo número que o contorno de campo tem fora da 1.4.11.

**A `react-resizable-panels` 4.12.3 publicava três mecanismos, e o arquivo lia
zero.** `data-separator` vale `inactive | hover | active | focus | disabled`; a
lib liga `keydown` em cada costura (setas, `Home`, `End`); e o duplo-clique
devolve o painel ao `defaultSize`, ligado de fábrica. Nada disso aparecia na
documentação, e uma afordância que existe e ninguém vê é igual a nenhuma.

**A `className` do grupo era inteiramente inerte.** O `Group` declara `display`,
`flex-direction`, `flex-wrap`, `overflow`, `height` e `width` por **estilo
inline** — o `.d.ts` avisa que as quatro primeiras não podem ser sobrescritas —,
e inline vence classe, então `flex h-full w-full` não fazia nada. Junto ia um
`aria-[orientation=vertical]:flex-col` apontando para um atributo que o grupo
**não emite**: o nó dele carrega `data-group`, `data-testid` e `id`, e mais
nada. Consequência para quem escreve tela: **a caixa do grupo vem do pai**.

Mais duas declarações que não desenhavam nada: `ring-offset-background` sem
nenhuma classe de largura de offset — a família do "Desfazer" do toast, que
tinha `border-color` e nenhum `border-style` —, e `rounded-lg` (10px) numa pega
de 4px, que o navegador clampa para 2.

E o `role="separator"` estava **sem nome acessível**. É a medição do `Popover`
outra vez, e aqui era pior: o teclado funciona, então existia um controle
operável e sem nome. Hoje o `aria-label` tem padrão em pt-BR, pela mesma razão
que o `locale` do `Calendar` tem — verificado na árvore de acessibilidade, as
oito costuras da página saem nomeadas.

**A nota de toque da documentação estava factualmente errada.** Ela dizia que a
alça tinha 4px e era "impossível com o dedo", descrevendo uma versão que não
está instalada: desde a v4 a lib faz o próprio hit-testing, expandindo a
`DOMRect` por `resizeTargetMinimumSize`, cujo padrão é `{ coarse: 20, fine: 10 }`
e é escolhido por `isCoarsePointer()`. O `after:` de 4px não era o alvo de nada
havia uma versão inteira. O que restava de verdadeiro é que **20 é menos que os
44 do sistema**, e a prop que fecha isso nunca tinha sido plugada.

**O realce é pintado fora do fluxo, e é a razão de o `after:` ter virado
`before:`.** Engrossar a alça reflui os dois painéis a cada passagem do cursor;
o acento é um `::before` absoluto de 2px sobre a costura, e só a **cor**
transiciona. Medido: as larguras dos dois painéis idênticas até a terceira casa
decimal com e sem cursor — `303,602 / 455,398` nas duas leituras. `::before` e
não `::after` porque o `after` é o último filho e pintaria por cima da pega, o
que exigiria um `z-index` só para desfazer.

**Três eixos onde havia um booleano.** `variant` é `line | grip | plain`, e ele
decide o que a costura desenha **em repouso** — nunca o que ela faz: as três
acendem igual. `plain` existe para painéis que já têm moldura própria, onde um
fio na calha seria a terceira borda em 8px. O catálogo saiu de `—` na coluna de
variantes.

**A orientação vem do contexto, e não do `aria-orientation`.** O `Separator`
emite esse atributo **invertido** em relação ao grupo, e o arquivo antigo
dependia da inversão sem registrá-la — a armadilha exata que faz a próxima
pessoa "corrigir" para o lado errado. A geometria saiu para uma condicional
sobre o contexto, como o `separator.tsx` já fazia, e com ela sumiram os sete
seletores de atributo.

**Um split é móvel de desktop.** Abaixo de 768px o grupo horizontal vira fluxo
empilhado: os painéis soltam as proporções, e a costura perde o arraste, o papel
e o foco, virando um fio estático `aria-hidden` — duas regiões empilhadas sem
nada entre elas leem como um bloco só. É o par que o `Sheet` já faz entre painel
e gaveta, com o mesmo hook e o mesmo número, e a mesma regra: **nenhuma tela
escreve `isMobile`**. A documentação anterior empurrava esse layout para toda
tela futura em prosa. O padrão é `orientation === "horizontal"`, na forma
`stack ?? …` que o `Tabs` já usa — um grupo vertical num telefone já é uma
coluna. Medido a 375px: **7 dos 8 grupos empilham**, e o único que não é o
vertical, que mantém `role="separator"` e o foco.

**A pega usa a tinta de arraste da folha e da gaveta, num alfa próprio, e a
diferença é área.** A alça da gaveta é 48×6 numa superfície que a pessoa acabou
de abrir; esta pega é 4×32 entre dois painéis de conteúdo — é a medição da
`AnnouncementBar`, onde um ícone de 12px precisou de mais tinta que um botão de
texto pelo mesmo motivo. Varridos os degraus sobre o fundo real, **70% é o
primeiro que alcança 3:1 nos dois temas**: 3,16 no claro e 4,05 no escuro,
contra 1,66 e 1,92 a 35%. O acento dá **3,01 nos dois temas** ao pousar e 7,66 /
6,14 ao arrastar, e a costura em repouso fica em 1,35 / 1,33 — o fio quieto, de
propósito. Ela não importa a régua do `DragHandle` — a tinta é escrita literal
aqui —, e a rodada 34 mediu o outro lado: a alça, com 2,25× a área desta pega,
reprova no **mesmo** degrau. Área muda como a cor lê, não o que a 1.4.11 exige,
e os dois arraste do sistema estão em 70%.

**O colapsar não pode morar na alça, e não é escolha de desenho.** A lib liga
`pointerdown`, `dblclick`, `contextmenu` e `pointerup` **no documento, em fase
de captura**, e decide por hit-testing de ponto. Um botão dentro da alça é
impossível: a captura do documento dispara antes do handler dele, e
`stopPropagation` de dentro não alcança um ancestral que já correu. Pior,
qualquer controle a menos de **metade da região de arraste** (22px) tem o
próprio clique engolido. Por isso são `useResizablePanel` + um
`ResizableCollapseTrigger` que mora no cabeçalho do painel vizinho — e a
demonstração do catálogo violou a própria regra na primeira escrita, com o
gatilho a **8px** da costura.

O primeiro conserto errou para o outro lado, e quem viu foi o dono: cravar 24px
deixava o recuo esquerdo **3× maior que os outros três lados**, à vista. A folga
é do **dedo**, não do cursor — a zona é `{ coarse: 44, fine: 10 }`, logo 22px no
toque e **5 no mouse** —, e um grupo horizontal só chega a ponteiro grosso acima
de 768px, porque abaixo disso ele empilha. Hoje é `p-2 pointer-coarse:ps-6`: 8px
simétricos no mouse, 24 só onde o dedo precisa. É a mesma pergunta que o item de
menu e o `Calendar` já fazem.

**Proporção guardada e SSR não convivem sozinhos.** A lib passa **a mesma
função** como `getSnapshot` e como `getServerSnapshot` do `useSyncExternalStore`,
então na hidratação o cliente lê o `localStorage` e discorda do HTML que o
servidor mandou — medido, um diff inteiro de `flexGrow` no console. Nenhuma
guarda de `typeof window` pega isso: na hidratação o `window` existe. **E adiar
sozinho não resolve**: com o `defaultLayout` chegando depois, o grupo o
**ignora** — 25/75 guardado, 40/60 na tela —, porque ele é lido na montagem e só
nela. A saída é o `groupKey`, que troca uma vez e remonta o grupo já com a
proporção certa; ele fica **fora** de `groupProps` porque é `key` e não prop, e
no espalhamento virava atributo desconhecido no DOM. Medido depois: zero erros
de console e a proporção restaurando em 25/75.

**O componente virou Átomo.** `Group`, `Panel` e `Separator` são a anatomia de
uma coisa só — o argumento literal que devolveu o `Select` a Átomos. Ele era a
única entrada do bloco de Moléculas **sem comentário justificando a camada**, e
a justificativa que faltava era fraca: a régua diz "feita de átomos" e ele não
compunha nenhum. A linha de import do registry também omitia `ResizableHandle`,
então quem copiasse do catálogo não montava o exemplo que a página mostra logo
abaixo.

**Fora, de propósito:** um eixo `size` na alça (nenhuma contagem o pede — o
precedente é a `Toolbar`) e um `variant` de moldura no grupo (a moldura que a
doc escreve à mão é um caso só; volta quando forem dois).

### O colapso ganhou movimento, e ele some no gesto

Colapsar era um salto: 238 para 0 num quadro. `flex-grow` transiciona — é um
`<number>`, e é ele que a lib escreve na **raiz** de cada painel —, mas ligar a
transição sem condição estraga as duas outras formas de redimensionar: no
arraste o painel passa a perseguir o cursor com 200ms de sobra, e no teclado
cada seta vira uma interpolação que a repetição de tecla empilha.

Os dois estados já vinham no `data-separator`, e o grupo lê os dois para zerar a
duração. Medido: **0,2s em repouso, 0s arrastando, 0s no teclado**, e
`transitionend` a 0,196s **nos dois painéis** — os dois transicionam juntos, que
é o que faz a razão entre eles interpolar em vez de um saltar enquanto o outro
desliza.

**A régua mora no grupo, e não no painel**, porque a `className` do
`ResizablePanel` cai num `div` **interno** — o `.d.ts` da lib diz isso com todas
as letras. Quem carrega o `flex-grow` é a raiz, e ela só se alcança por seletor
de filho a partir do único nó com `className` na mesma árvore.

**E a duração desce por `--resizable-anim`**, não por um `transition-none`
empilhado sobre a classe base: as duas escreveriam a mesma propriedade no mesmo
elemento, e quem venceria seria a ordem de emissão do Tailwind e não o que se
escreveu. Variável herda e não disputa — é o mecanismo de `--toolbar-control` e
de `--disclosure-nudge`.

O custo fica dito: animar `flex-grow` reflui o conteúdo dos painéis a cada
quadro, e num painel com tabela longa isso é caro. É a razão de o movimento
ficar restrito ao comando em vez de valer para toda mudança de tamanho.
`prefers-reduced-motion` não precisou de regra própria — o bloco global encurta
transições para 0,01ms.

**Uma terceira lição de instrumento, na mesma família das duas abaixo.** Medindo
se o texto vazava do painel durante o encolhimento, `range.getBoundingClientRect()`
acusou 15px de sangria para cada lado. Não havia sangria nenhuma: aquele método
devolve a **caixa de layout** do texto, e não a região pintada — o `div` interno
da lib é `overflow: auto` e clipa (`scrollWidth` 57 contra `clientWidth` 42).
Quem decidiu foi a captura de tela em câmera lenta, com a duração forçada a 8s.

### Duas lições de método, e as duas são erros de instrumento

**Coordenada de painel não é pixel de CSS, e o `hover` e o `left_click_drag` não
usam a mesma escala.** Quatro tentativas de arrastar a costura "falharam" com o
componente correto: o `pointerdown` caía a 260px do alvo. A sonda que resolveu
foi ler `event.defaultPrevented` num ouvinte registrado **depois** do da lib, na
mesma fase — ela chama `preventDefault()` exatamente quando acha região de
acerto, então o booleano diz se o ponto acertou. Com a escala corrigida:
`inactive → active → focus`, larguras 189,8/569,3 → 338,8/420,3, `aria-valuenow`
de 25 para 44,6.

**Medir alfa exige subir a partir do pai.** No tema claro a própria costura é
opaca (`bg-border`), então o compositor que subia a árvore a partir dela
devolvia **a costura como fundo** e reportava 2,67 onde o número é 3,16. É o
parente da lição da `AnnouncementBar` — lá o erro era compor sobre preto, aqui é
compor sobre o próprio elemento.

E uma correção de registro: o painel do navegador **entregou teclas** nesta
sessão, ao contrário da rodada do `Radio`, onde um ouvinte de `keydown` recebeu
zero eventos. `Tab`, `shift+Tab` e as setas chegaram; foi assim que o
`:focus-visible` e o `ring-3` foram verificados de verdade.

### Rodada 29 — o carrossel pedia a sala emprestada

`carousel.tsx` era o shadcn intacto, com zero consumidores, passando **limpo** no
`ds:audit` e saindo com **`—`** na coluna de variantes do `ds:catalog` — os dois
sinais que a rodada do `resizable` nomeou.

**As setas moravam fora da caixa.** `-left-12` e `-right-12` são 48px **para
fora** da região: o componente não se dimensionava, ele exigia que o pai lhe
cedesse sala. Medido na página do catálogo, num contêiner de 958px — recorte de
297 a 1255, seta anterior de **289 a 317**, seguinte de **1235 a 1263**, 8px
fora de cada lado; `scrollWidth` do pai **966 contra 958** de `clientWidth`, ou
seja o carrossel dava ao contêiner uma barra de rolagem horizontal fantasma; e
`elementsFromPoint` a 90% da largura da seta seguinte devolvia uma `div`, **não
o botão**. Um pedaço da seta não era clicável.

Hoje `controls` é eixo: `inside` (o padrão) pousa a seta sobre a borda do
viewport, e **`outside` reserva a própria calha** — `px-12` na raiz, seta em
`left-0`, mesma distância visual de antes. Nenhuma coordenada é negativa em
nenhum modo, e a asserção 4 do teste é o que impede a volta. Medido depois:
**zero** setas fora da raiz nos 15 carrosséis da página, e **zero** de transbordo
horizontal, contra os 8px de antes.

**A documentação afirmava um comportamento que o código nunca teve.** A página
dizia que *"as setas não existem no telefone"*; medido a 375px, `display: flex`
nas duas, **28×28**, sobre o conteúdo. Mesmo achado da rodada do `resizable`. E
a conclusão inverteu: sumir com elas **violaria a WCAG 2.5.7**, que exige
alternativa sem arraste. Elas ficam, e crescem no toque.

**A lib publicava treze mecanismos e o arquivo lia quatro.** `scrollProgress`,
`scrollSnapList`, `selectedScrollSnap`, `scrollTo`, `slidesInView` e os eventos
`scroll`, `settle`, `slidesInView`, `slideFocus`, `slidesChanged` estavam todos
lá; o arquivo lia `canScrollPrev/Next` e `select`/`reInit`. Daí saíram
`CarouselDots` (`dot | bar`) e `CarouselStatus`.

**Dois papéis sem nome**, a medição que o `Popover` e o `resizable` já pagaram:
`role="region"` sem `aria-label` (medido, `hasAccessibleName: false`) e cada item
`role="group" aria-roledescription="slide"` **sem rótulo** — quatro grupos
anônimos. A posição passou a vir do **contêiner**, como na `BreadcrumbList` e no
`Stepper`. Mais três defeitos reais: o teclado tratava só as setas horizontais
inclusive na vertical, a limpeza não desinscrevia `reInit`, e o
`orientation || (opts?.axis === "y" …)` era inalcançável.

#### Seis coisas que só apareceram medindo

- **A seta se centra no viewport, e não na raiz.** `top-1/2` parece a resposta e
  não é: a raiz também carrega os pontos e a contagem. Medido, com um
  `CarouselDots` no telefone — raiz 131, viewport 75, seta **28px abaixo** do
  centro e com a borda de baixo **fora** do trilho. A âncora virou
  `--carousel-control-y`, com `50%` declarado no `cva` para não haver salto
  antes da medição.
- **E `offsetTop`, não metade da altura.** O bloco que contém um absoluto é a
  **caixa de padding** da raiz — desconta a borda, **não** o recuo. Com o `p-3`
  de `card` e `inset`, a seta saía **11px acima** do centro. `offsetTop` é medido
  a partir dessa mesma caixa; é a escolha que o marcador do `Tabs` registra.
  Medido depois: desalinho **≤1px** nas 14 setas da página.
- **O alvo de dedo por pseudo-elemento não dá 44 — dá 42.** Pela mesma razão: a
  base é a caixa de padding, então um `icon-sm` de 28 com 1px de borda entra na
  conta como **26**, e `-inset-2` fecha em 42. Medido, `::after` reportava
  `42px`. O degrau daqui é `2.5` (26 + 20 = **46**, e 44 é piso). **As três
  ocorrências que a casa já tinha carregam o mesmo desconto e afirmam 44 nos
  comentários** — `PageHeaderBack`, o × da `AnnouncementBar` e os degraus do
  `Breadcrumb`, todos 42. Está no backlog.
- **O ponto apagado reprovava a 1.4.11.** `bg-foreground/25` dava **1,78 no claro
  e 2,22 no escuro**. Varridos os degraus contra o fundo real, **45% é o primeiro
  que passa nos dois** — 3,15 e 4,36. O ativo é `--primary-accent`: 7,66 e 6,14.
- **A seta desabilitada tapava o conteúdo.** Em `inside` ela pousa sobre o
  trilho, e no início a seta anterior ficava por cima do **primeiro item**, que é
  o único inteiro na tela — medido, cobrindo o "R$" de um valor. Ela passou a ser
  `disabled:invisible`, e **só em `inside`**: em `outside` há calha reservada, e
  um botão sumindo faria a moldura piscar a cada ponta.
- **O trilho vertical precisa de `h-full`, e isso é carga estrutural.** O embla
  mede o **contêiner**, não o viewport: com a altura só no viewport o trilho
  crescia até o conteúdo — medido, viewport **160** contra trilho **362** —, o
  embla concluía que tudo cabia e **desabilitava as duas setas** com o conteúdo
  transbordando calado. Com `h-full`, `basis-1/2` também volta a significar
  metade do que se vê.

**A dissolução reusa a rampa e traz motor próprio.** `useScrollFade` **não pode**
dirigi-la: o embla translada o trilho, e medido o viewport fica com
`scrollLeft: 0` enquanto o `scrollWidth` é 1476 contra 730 de `clientWidth` — o
hook reportaria início 0 e fim 746 para sempre, e a ponta esquerda nunca
acenderia. A rampa continua sendo `scroll-fade-x`; só o motor é daqui,
publicando `--scroll-fade-start/end` a partir de `api.scrollProgress()`. As
invariantes valem: a máscara vai no viewport, que não desenha nada, e quem pinta
é a raiz — as setas são **irmãs** do viewport, então a máscara não as alcança.

**O `variant` de superfície entrou contra a contagem.** Nenhuma tela pede uma
superfície para o carrossel, e a régua da casa é que eixo sem contagem é ficção —
o precedente é a `Toolbar`. Ele existe por decisão explícita do dono, tomada com
esse custo na mesa, e fica registrado assim em vez de ser apresentado como se a
medida o tivesse pedido. `card` e `inset` **forçam `controls="inside"`**, com a
precedência que `scrollable` usa sobre `stretch` no `Tabs`, e **nenhuma das duas
declara `overflow-hidden`** — ela cortaria o anel de foco de 3px das setas.

**Sem autoplay, e é decisão.** Nenhum plugin do embla está instalado; todos são
dependência nova. E num app de finanças conteúdo que se move sozinho enquanto a
pessoa lê um valor é hostil, e exigiria pausa no cursor, no foco e em
`prefers-reduced-motion` para não virar defeito de acessibilidade.

**Duas armadilhas conhecidas cobraram de novo, e uma pegou a sonda.** Varrer os
degraus de alfa com `` `bg-foreground/${p}` `` devolveu razão **1 em todos** —
nenhuma daquelas classes existe na folha, porque o Tailwind varre o código como
texto. É a mesma medição que a rodada 16 registra, e desta vez o instrumento é
que estava errado; a sonda passou a usar `color-mix` inline. E medir alfa exige
**compor sobre o fundo real**: a primeira tentativa leu `oklch`/`oklab` com uma
regex de `rgb()` e reportou 1,55 e 1,00 onde os números são 7,66 e 1,78. Quem
converte é o navegador — um pixel num `canvas`.

**E a página do catálogo contradizia a própria nota.** A demonstração de
`variant="card"` renderizava `Card` dentro de `Card`, três centímetros acima da
nota que diz que cartão dentro de cartão é sempre errado. Quem mudou foi a
demonstração, não a nota.

### Rodada 29b — a seta viajava, e ancorar em variável foi o que a fez viajar

A rodada 29 pôs as setas dentro da caixa e ancorou-as no centro do trilho por
`--carousel-control-y`. A geometria ficou certa — desalinho ≤1px nas 14 setas — e
nasceu um defeito de **movimento**, que medir posição não pega. O relato foi *"o
travel da seta está muito alto; eu clico e ela desce lá embaixo"*.

**Duas causas somadas.** `top` passou a sair de uma variável escrita por JS, e a
base do `Button` declara `transition-all`: toda remedição virava **animação** da
seta atravessando o cartão. Prova direta — trocando a variável, a seta ainda
estava na origem um quadro depois e só assentava 300ms adiante. E o `cva` declara
`50%` como palpite pré-medição, mas `top: 50%` resolve contra a **raiz**, que
inclui pontos e contagem: medido, raiz **111px** dá 55 contra os **37,5** do
centro do trilho — **17,5px** percorridos animadamente na primeira pintura.

São **dois consertos independentes**, e nenhum sozinho fecha o caso: o **layout
effect** mata a viagem da primeira pintura (o cliente nunca pinta o palpite), e
`transition-colors` mata a das remedições posteriores, que efeito nenhum alcança.
`transition-colors` e `transition-all` são o mesmo grupo no `twMerge`, então a
classe do controle **substitui** a da base em vez de disputar — o mecanismo da
régua de densidade da `Toolbar`. Medido depois: **12 quadros consecutivos com um
valor só**, contra 420→462 antes.

**A seta perdeu o fundo e o círculo, e isso é convergência.** `tertiary` nos dois
modos, `rounded-lg` pelo próprio `Button`. Das três famílias de seta da casa, o
`Calendar` e a `Pagination` já eram assim; esta era **a única `rounded-full` do
repositório e a única com fundo em repouso**. Com um peso só,
`defaultControlVariant` deixou de existir — uma função que escolhe entre dois
pesos, com um peso, é constante disfarçada —, e `controls` voltou a decidir só a
posição. Medido depois: **um raio só (10px) e um fundo só (transparente)** nas 14
setas.

**`fade` virou padrão**, e as duas mudanças se sustentam: sem preenchimento o
glifo pousa direto sobre o conteúdo, e a rampa é o chão dele. Medido, o glifo sem
fundo dá **18,97 sobre a página e 17,18 sobre o cartão** no escuro, 18,97 e 19,8
no claro — o `foreground` é contraste máximo por definição, então tirar a
pastilha não custou legibilidade. Dissolução ligada em **15 de 15** carrosséis.

**O par `active:` entrou na origem, e o backlog contava menos do que havia.** A
regra é mecânica: `hover:` compila dentro de `@media (hover: hover)`, e está
verificado no CSS emitido — `.hover\:bg-muted` sai **dentro** da media query e
`.active\:bg-muted` **fora** dela. O `AGENTS.md` registrava o defeito só no
`tertiary`; medindo as cinco variantes que pintam fundo, **quatro** estavam
inertes ao toque. Foi consertado o `tertiary` (o que a seta veste, e o que estava
autorizado), e as outras três ficaram numa lista explícita em
`button-touch-response.test.ts` — que **falha se a lista crescer**, em vez de o
teste ser afrouxado para caber no estado atual.

#### O nudge de press roubava a centragem, e a colisão era de propriedade

Restava um terceiro movimento, e ele não era o mesmo defeito: ao **apertar**, a
seta caía 15px. No Tailwind v4 `translate` é propriedade independente, e
`-translate-y-1/2` e o `active:translate-y-px` da base do `Button` escrevem a
**mesma** custom property. Verificado no CSS emitido:

```
.-translate-y-1\/2      { --tw-translate-y: calc(calc(1 / 2 * 100%) * -1) }
.active\:translate-y-px { &:active { --tw-translate-y: 1px } }
```

`.classe:active` é (0,2,0) contra os (0,1,0) da centragem, e vence sempre: no
press a seta ia de **−14px para +1px**, perdendo a centragem inteira. **Um nudge
de press por `translate` é estruturalmente incompatível com centragem por
`translate`** — vale para qualquer controle absoluto centrado assim, não só para
este.

A saída **não é remover o afundamento** — a primeira tentativa fez isso, e o
resultado foi um botão sem resposta de clique. É somar os dois na **mesma
declaração**: `active:translate-y-[calc(-50%_+_1px)]`. O `-50%` é a centragem, o
`1px` é o mesmo degrau do `Button`, e eles compõem em vez de um apagar o outro.

A entrega é pelo **`twMerge`, e não por especificidade**: mesma família de
utilitário sob o mesmo variante, então a classe do controle **remove**
`active:translate-y-px` da lista em vez de disputar com ela por ordem de
emissão — verificado no DOM, a da base não está mais lá. Na vertical a centragem
é em X, o nudge em Y não colide, e ele fica cru.

**E a transição precisou ser enumerada, não escolhida entre dois atalhos.**
`transition-all` traz `top` junto, e é ele que faz a seta viajar a cada
remedição; `transition-colors` não alcança `translate`, e mata o press. A lista é
`[color,background-color,border-color,translate]` — o mesmo idioma de
`transition-[rotate,translate,color]` em `disclosure-classes`. **A âncora medida
salta; o press desliza.**

Medido com press real mantido, amostrando por quadro: repouso **24**, durante
`:active` **25**, e 24 de volta ao soltar — **1px**, contra os 15 de antes.

#### A dissolução vertical dissolvia os lados

O viewport carregava `scroll-fade-x` **cravado**, em qualquer orientação. Num
carrossel vertical isso dissolvia as bordas **laterais** — que não se movem —
enquanto o conteúdo entrava e saía por cima e por baixo, nítido. Achado pelo
dono, olhando a demonstração.

O que torna esse defeito difícil de ver por medição: as duas utilities leem as
**mesmas** `--scroll-fade-start/end`, e o motor já calculava o eixo certo
(`scrollHeight - clientHeight` na vertical). Então `data-scroll-fade` ligava, a
máscara existia, as variáveis se moviam ao arrastar — tudo o que uma sonda
costuma perguntar respondia "certo". A única diferença é o eixo do gradiente, e
isso só o olho pega. Mudou uma linha; o driver não precisou de nada.

**E o teste que devia pegar tinha o mesmo ponto cego.** Ele casava a string
literal da chamada, com o nome da constante horizontal dentro — passava por
acidente, e teria quebrado em qualquer refatoração inocente. Foi reescrito para
olhar o que importa (as classes proibidas no nó mascarado, e a escolha do eixo
ser condicional), e **verificado reintroduzindo o defeito**: reprova.

Fica a régua: *asserção que casa a forma da chamada não testa o comportamento —
ela testa a digitação.*

#### A calha do `outside` era um número herdado, e ela descolava a seta

Fechado o movimento, sobrou o espaçamento. `outside` declarava `px-12` (48),
medida que veio do `-left-12` do shadcn e que eu preservei por fidelidade à
distância antiga — argumentando, na própria rodada 29, que a distância visual era
"a mesma de antes". Preservar o número certo pelo motivo errado: aquele 48 nunca
foi decidido, era o que o shadcn tinha.

Medido: botão de 0 a 28, conteúdo começando em 48 — **20px de fundo puro** entre
os dois. E como a dissolução mora na borda do viewport, ela nascia *depois* desse
vão: a seta lia como solta, e não como parte da tira que ela controla. Em
`inside` o mesmo par se sobrepõe, e é por isso que aquele modo sempre pareceu
melhor.

A calha passou a ser **a seta mais um respiro**: 36 = 28 do botão + 8, que é
`--space-inline`, a distância que esta casa usa *dentro* de um bloco — e a seta e
o trilho são o mesmo bloco. Medido depois: vão de **8px, simétrico nos dois
lados**, com a dissolução encostando na seta.

De brinde, o modo ficou menos caro no telefone: a calha total caiu de 96 para 72,
de **32,8% para 24,6%** da largura útil. Continua caro, e continua sendo a razão
de `inside` ser o padrão.

#### Três leituras erradas do instrumento, e as três são erros meus

A primeira "reprodução" mediu `scrollY` caindo 155 → 137 num quadro, com a seta
descendo 18px na tela — número que batia com o sintoma relatado. **Era a minha
ferramenta.** O registrador mostrou o `scroll` em `t=150632` e o `pointerdown` em
`t=150644`: a página rolou **12ms antes de o clique começar**, porque clicar por
referência rola o alvo para a vista primeiro.

É a parente da lição do calendário — *evento sintético pula o hit-testing* — com
o sinal invertido: ali o instrumento **escondeu** o defeito, aqui ele o
**produziu**. A confirmação real veio de `transitionProperty` e da prova de
animação, que não dependem de clique nenhum. **Corolário para quem vier medir
esta peça: leia a posição da seta relativa à raiz, nunca absoluta na tela.**

Mais duas, no mesmo dia. **Medir `:active` no `pointerdown` lê o início da
transição, não o fim** — com o press animado, o valor computado ali ainda é o de
repouso, e eu quase concluí que o afundamento não existia. Press se mede
**mantido**, amostrando por quadro. E **um regex sobre o CSS emitido precisa
escapar como o Tailwind escapa**: procurando `translate-y-\[calc(` eu li "regra
não emitida" sobre uma regra que estava lá, porque o nome real é
`.active\:translate-y-\[calc\(-50\%_\+_1px\)\]` — com `\%` e `\+`. Duas
vezes seguidas o instrumento inventou o defeito; a régua é sempre a mesma:
**quando a medição contraria o mecanismo, desconfie da medição primeiro.**

### Rodada 30 — o gráfico prometia um sistema e entregava encanamento de cor

`chart.tsx` era o fork do shadcn quase intacto: 363 linhas que faziam **uma**
coisa — ler `config` e emitir `--color-<chave>` num `<style>` escopado por
`[data-chart]`. O resultado é medível: **1 consumidor em 8**. Sete telas
escreviam tudo à mão — 4 tooltips (a mesma casca `rounded-lg border-border/80
bg-popover`, quatro vezes), 3 legendas, 4 `Intl.NumberFormat` redeclarados com
`currencyBRL` ao lado, 4 `tickFormatter` compactos inline e **nenhum** chamando
`currencyCompactBRL`, que é a regra que `/designsystem/graficos` manda seguir.

A raiz do abandono cabia numa linha: o tooltip formatava com `numberBR`, então
**uma série em reais saía `8.432`, sem `R$`**. Quem precisava de dinheiro não
tinha como pedir. É a inversão que `Form`, `MoneyInput` e `Alert` já
registraram — a resposta não é reclassificar, é fazer o componente ser o que o
nome promete.

**Duas camadas.** A anatomia (`ChartContainer`, `ChartGrid`, `ChartXAxis`,
`ChartYAxis`, `ChartTooltip`, `ChartLegend`, `ChartReferenceLine`) é a régua e
continua livre — quem monta um `ComposedChart` compõe ela. As cinco formas
(`ChartArea`, `ChartLine`, `ChartBars`, `ChartDonut`, `ChartSparkline`) são a
forma curta sobre a anatomia, como `FormInput` é sobre `Field` + `Input`, e
**elas cobram `label`**: a forma curta pode cobrar o nome acessível, a
composição livre não pode. Mais `ChartEmpty` / `ChartSkeleton` / `ChartError`
(nenhum dos oito gráficos tinha estado vazio) e `ChartDataTable`, a alternativa
não-visual que não existia em lugar nenhum do app.

#### A rampa reprovava, e o comentário dela afirmava o contrário

`globals.css` dizia "cinco matizes a ~60° de distância". Medidos, os intervalos
entre os matizes ordenados eram **111 · 39 · 57 · 68 · 85** — `--chart-1` e
`--chart-2` estavam a 39°. Por um validador de paleta (ΔE em OKLab ×100, todos
os pares), a rampa antiga reprovava duas vezes em cada tema:

| | claro | escuro |
| --- | --- | --- |
| CVD, todos os pares | **4,9** protanopia (`chart-4 ↔ chart-1`), piso 8 | **2,8** deuteranopia |
| visão normal | **14,6** (`chart-2 ↔ chart-1`), piso 15 | **11,9** |

Numa rosca de cinco fatias, quem não separa vermelho de verde via a série 1 e a
4 **como a mesma cor**. E o diagnóstico estava errado junto com o número: matiz
sozinho nunca separou esta rampa — quem separa é matiz **e** claridade, e é por
isso que o re-passo move as duas. Depois: **8,8 protanopia · 16,8 visão normal**
no claro, com os cinco mantendo ≥3:1 contra `--card`.

**No escuro, a faixa de claridade perde para a separação, e é decisão.** A
faixa que o validador pede (L 0,48–0,67) e a separação CVD brigam sobre
superfície escura: comprimir a claridade tira justamente o canal que separa
magenta de ciano para quem não distingue vermelho de verde. Três candidatos
dentro da faixa foram medidos e os três reprovam em CVD (**4,6 · 3,1 · 2,3**).
A rampa escura fica acima da faixa e passa no resto — 10,6 CVD · 17,1 visão
normal · ≥3:1 —, como o `--input` fora da 1.4.11. A faixa é heurística sobre uma
superfície de referência; a separação é um leitor que não consegue ler o
gráfico.

**Não entrou `--chart-6.`** Uma sexta série não é um matiz novo: ela vira
"Outros", e quem agrega é quem tem os dados. O que o componente garante é não
mentir — `chartSeriesColor` devolve `--muted-foreground` do sexto em diante, em
vez de repetir `--chart-1` como o `BAR_COLORS[idx % 5]` de
`credit-cards-history-chart` faz hoje.

#### O anel de foco estava apagado, e apagá-lo custava o teclado

A versão anterior escrevia `outline-hidden` em `.recharts-layer`,
`.recharts-sector` e `.recharts-surface`. O que isso apagava era o foco de
teclado que o `accessibilityLayer` do Recharts desenha — e a versão instalada é
a **3.8.0**, onde ele vem ligado de fábrica; `bill-history-analytics.tsx:148`
chegava a passar `accessibilityLayer={false}`, o único do repositório.

**Duas armadilhas, as duas medidas com `Tab` de verdade.** `outline-none` e
`outline-2` escrevem **propriedades diferentes** (`outline-style` e
`outline-width`): com a supressão em `:focus` e o anel em `:focus-visible`, os
dois seletores empatam em (0,2,0), as duas declarações valem, e o anel saía com
largura 2px e estilo `none` — invisível. Por isso a supressão é a base **sem
pseudo** e o anel é `:focus-visible`, que vence sempre, com `outline-solid`
escrito. E **foco por script não liga `:focus-visible`**: verificar isto com
`element.focus()` reporta "sem anel" numa implementação correta. Medido depois,
com `Tab`: `solid 2px oklch(0.72 0.13 166)`, offset 2, e o cursor de teclado
abrindo o tooltip.

#### Quatro medidas que só apareceram no navegador

- **O miolo da rosca saía 118px à direita do centro do anel.** Ele era irmão do
  `ChartContainer` dentro de um envelope `relative`, e `inset-0` mede o
  envelope — que estica na coluna enquanto o container tem 176px. Ele passou a
  ser o `overlay` do próprio container, que é **a caixa que tem tamanho**.
  Medido depois: 0 e 0.
- **A escada de corpo do miolo mentia de dois jeitos.** Por não conhecer a
  caixa (`R$ 3.510,00` cabe folgado numa rosca de 300px e transborda numa de
  176) e por supor que o texto quebra: o `Intl` separa `R$` do número com
  espaço **inseparável**, então `text-balance` e `max-width` não faziam nada —
  145px de texto numa linha só dentro de um furo de 109. Hoje é conta:
  `88 / n` por cento da caixa, em `style` e não em classe, porque classe
  montada em tempo de execução não existe.
- **O eixo Y comia o cifrão no telefone.** `width={56}` servia no desktop; a
  375px, `R$ 22 mil` e `R$ 5,5 mil` saíam `$ 22 mil` e `$ 5,5 mil`. Hoje é
  `width="auto"`, que o Recharts 3 calcula a partir dos rótulos. Medido: zero
  rótulos cortados e zero rolagem horizontal.
- **`nameKey` estava servindo de chave do React na legenda.** Ela diz *em que
  campo do payload está o nome*, então as cinco fatias saíam com
  `key="nome"` — React reclamando de chave duplicada, e a identidade dos itens
  perdida entre renders. São duas chaves, e confundi-las é bug.

#### O medidor tinha geometria de rosca, e as duas coisas que isso quebrava

Ele nasceu como um `Pie` de meio arco com o anel e a caixa da rosca, e as duas
heranças cobraram:

- **O arco era grosso demais para o número.** Com o raio interno da rosca (62%
  do máximo), a corda interna **na altura do topo do texto** media 42px — e
  `76%` já ocupava 43. Ele encostava no arco desde o primeiro dia, e `100%`
  invadiria. Um medidor é convencionalmente um arco fino: o miolo dele é o
  número, não uma reserva. Com a espessura própria e o raio a 130% do máximo
  (o Recharts aceita acima de 100), a corda vai a **103px**: `76%` fica com 30
  de folga por lado, `100%` com 22, e `1.284%` ainda cabe.
- **A caixa era quase metade vazia, e era isso que afastava a legenda.** O
  Recharts centraliza o círculo inteiro, então um meio-arco num quadrado
  deixava **68px mortos embaixo** — não era um `gap` grande, era vazio dentro
  do SVG. `cy` a 86% e proporção `standard` por padrão encostam o arco na base:
  o vão até a legenda caiu de 68 para **25px, o mesmo das outras duas formas**,
  medido lado a lado.

O rótulo deixou de se apoiar no centro da caixa e passou a se apoiar na origem
do arco, por `bottom` em porcentagem — que resolve contra a **altura**, e é o
que faz a âncora não depender da proporção. Quem chama escreve
`<ChartDonutCenter value="76%" />` sem saber disso: a variante é do
`ChartDonut`, então é ele que injeta `align="gauge"` por clone, como o `Button`
e o `Stepper` já fazem com `asChild`.

#### E o anel saía 102px fora do centro da própria legenda

O envelope da rosca era `flex w-fit flex-col`, e o alinhamento padrão de uma
coluna flex é `stretch`. Como o `ChartContainer` tem largura própria, ele não
esticava — encostava na esquerda de uma caixa cuja largura quem definia era a
legenda: medido, 208px de anel num envelope de 412. O medidor escondia o
defeito, porque a legenda de dois itens é mais estreita que o anel. `items-center`
resolve, e o `w-fit` fica: ele é `fit-content`, que respeita o espaço
disponível, então a legenda continua quebrando em duas linhas a 375px em vez de
esticar o envelope — trocá-lo por `w-full` teria consertado o centro e
estourado o telefone.

#### A página prometia "sem animação de entrada", e o Recharts animava

A nota de fechamento do catálogo dizia que num app de finanças um valor que se
move enquanto a pessoa o lê é hostil. O componente não fazia isso: o Recharts
anima de fábrica, e **não olha `prefers-reduced-motion`**. É a classe de defeito
que esta base já achou várias vezes — a documentação afirmando o que o código
não faz.

E ela tinha um sintoma que eu tinha classificado como "o Recharts renderiza
tarde": medido na carga da página, 77 barras, 5 áreas e 6 linhas desenhavam, e
**os setores das roscas eram zero** até a pessoa rolar até elas — porque a
animação do `Pie` só começa quando o setor entra em cena. Um gráfico que não
existe até ser olhado não é uma transição, é uma ausência. Com
`isAnimationActive={CHART_ANIMATION}` nas sete marcas: 12 setores presentes sem
rolagem nenhuma.

#### Duas decisões de forma, e o que o eixo comprime

**A ponta da barra arredonda e a base não** (`[4, 4, 0, 0]`, nunca `radius={4}`):
arredondar os quatro cantos levanta a barra da linha do zero, que é onde um
gráfico de barras diz a magnitude. **Os 2px entre segmentos empilhados e entre
fatias são pintados**, com `stroke` em `var(--chart-surface)` — a variável que o
container declara e todo mundo herda; com `transparent` o vão mostraria o
segmento de trás. **A legenda liga sozinha na segunda série e some na primeira**
(`legend ?? series.length >= 2`): com uma série o título já a nomeia.

**O eixo comprime e o tooltip não.** `format="currency"` escreve
`R$ 1.234.567,00` no tooltip e `R$ 1,23 mi` no eixo, porque um rótulo de eixo
precisa caber numa calha e um tooltip precisa dizer o centavo. E `compact` larga
os centavos abaixo de mil — sem isso a base do eixo saía `R$ 0,00`. Nenhum dos
dois caminhos tem `Intl` neste arquivo: os sete formatos resolvem em
`lib/formatters` e `lib/transaction-date`, e a regra **I** do auditor tranca.

#### Duas lições de método, e as duas são erros meus

**A minha sonda de medição inventou uma constante 20% errada.** Ao calcular o
avanço da fonte mono, clonei o `<span>` para fora do contexto de *container
query*: ali `cqw` é inválido, a sonda mediu a fonte herdada e reportou 0,75em
onde o valor é 0,6. O número da rosca encolheu à vista antes de eu desconfiar
do instrumento. Quando a medida contraria o mecanismo, o instrumento é o
primeiro suspeito — é a terceira vez que esta base registra isso.

**Asserção que casa o texto do fonte testa o comentário, não o código.** Duas
asserções do teste novo reprovaram na primeira execução porque o cabeçalho do
componente cita de propósito o que ele deixou de fazer (`outline-hidden`,
`Intl.NumberFormat`). O teste passou a ler o fonte **sem comentários**, que é o
conserto que o auditor já tinha feito em `lineOf`. E ele foi verificado
reintroduzindo os defeitos: com `outline-hidden` de volta e `% 5` no resolvedor
de cor, as asserções 3 e 5 reprovam.

### Rodada 31 — a demo dizia "no telefone" e renderizava o desktop

A seção "Em folha no telefone" enquadrava o chrome de folha numa `<div>` de
384px e o chamava de telefone. **Nenhuma medida de telefone estava ativa.** Os
componentes usam breakpoints de *viewport* (`sm:`, `md:`), não container
queries, e o viewport do catálogo é o da janela — a 1443px, as seis declarações
do chrome resolviam todas no ramo desktop:

| | telefone | o que a demo renderizava |
| --- | --- | --- |
| corpo, recuo lateral | `px-4` = 16px | **20px** (`sm:px-5`) |
| cabeçalho, topo | `pt-2` = 8px | **12px** (`md:pt-3`) |
| rodapé | `flex-col-reverse` | **`row` + `justify-end`** |

Era por isso que o botão saía `justify-end` **e** `w-full` ao mesmo tempo —
duas coisas que nunca acontecem juntas num telefone.

**A saída é um `<iframe>` de 375px**, em `src/app/designsystem/ds-phone.tsx`.
Ele tem viewport próprio, então `@media (min-width: 40rem)` volta a significar
o que diz. Medido depois, com as mesmas classes dentro e fora: **16px, 8px e
`column-reverse`** — os três no ramo certo. Não é `scale()`: escalar daria a
aparência de um telefone com o viewport do desktop, que é o defeito que a peça
existe para não repetir.

A peça mora no catálogo e não em `ui/` — lá cobraria entrada no `registry`,
página própria e o `taxonomy.test.ts`, para um primitivo que só a documentação
usa. É o argumento que o `ds-doc.tsx` escreve sobre si, e o nome segue o `ds-*`
dos vizinhos.

#### A mecânica, e as três coisas que precisaram ser medidas

O CSS do app é **um único `<link>`** mais três `<style>` do dev do Next; os
quatro nós são clonados para o `<head>` do iframe, com um `<base>` antes deles
porque um `about:blank` não tem URL de base e um `url(...)` relativo de
`@font-face` não resolveria. A classe do `<html>` é copiada inteira: ela carrega
as três variáveis de fonte **e** o tema — verificado, a fonte resolve
`Inter, "Inter Fallback"` lá dentro. E `createPortal` mantém **uma árvore React
só**, então contexto, estado e HMR atravessam.

**O tema é espelhado por `MutationObserver`, e não por `useTheme()`**:
`resolvedTheme` é `undefined` até o `next-themes` montar, e o que interessa é a
string inteira do `className`. O observador do `<head>` é o que mantém o HMR
vivo lá dentro — sem ele o iframe congela no CSS de quando montou, justo na
peça que existe para se iterar cromagem de telefone.

#### Três erros meus, os três consertados por medição

**A tela vazia com véu era ficção, e ela custou o contraste.** A primeira versão
reservava 96px acima da folha "para deixar ver a tela atrás". Medido: a folha
`bg-background` sobre o fundo velado dava **1,04:1** no tema escuro —
invisível, um retângulo preto. A causa é que `fillMobileViewport` é
`h-(--sheet-drawer-h)`, ou seja `calc(100dvh - max(0.5rem, env(safe-area-inset-top)))`:
**a folha de formulário do app ocupa quase o viewport inteiro**, e oito
arquivos a abrem assim. O véu tem 8px, não 96. Com a folha preenchendo a tela,
o contraste que importa é contra o `Preview`, e não contra o que está atrás.

**Sem aresta, o telefone não lê como objeto.** A tela é `bg-background` dentro
de um `Preview` `bg-card`: medido, **1,1:1** no escuro. Eu tinha escrito "sem
borda, porque cartão dentro de cartão é errado" — e estava certo sobre o
cartão e errado sobre a aresta. Entrou `ring-1 ring-border`: é a borda do
aparelho, e é `ring` e não `border` porque box-shadow não entra no recorte,
então o raio continua aparando a folha por dentro.

**Eu copiei a área segura em vez de vestir a régua.** A folha escrevia
`pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))]` à mão — a segunda cópia da
mesma string. Ela veste `mobileFormSheetContentClassName`, que é o casco que um
`SheetContent` real usa, e é dali que vêm os 24px.

**E eu refazia o `<head>` do iframe inteiro a cada mutação.** O `next-themes`
roda com `disableTransitionOnChange`, que injeta e remove uma `<style>` a
**cada troca de tema** — então trocar o tema derrubava todo o CSS do iframe por
um quadro. O sintoma não foi cosmético: sem estilo o conteúdo colapsa, o
`useScrollFade` mede a folha sem transbordo, e a dissolução ficava **`off` com
50px de rolagem**. A sincronia passou a ser incremental, com um mapa de nó de
origem para clone. Medido através da troca, a 150ms e depois: `fade` em `on`,
transbordo em 50, recuo em 16px e **cinco folhas de estilo o tempo todo**.

#### E os seis defeitos que a mesma demo carregava

- **O botão "Salvar" estava colado na borda de baixo.** `FormActions
  variant="sticky"` não traz `pb` de propósito — o recuo é da superfície. Na
  moldura à mão ninguém o fornecia: `padding-bottom: 0`, medido. Agora 24px.
- **`MobileSheetFormDragStrip` desenhava o vazio.** Ele devolvia um componente
  que **retornava `null` sempre**. Saiu das duas demos — e da base inteira, na
  rodada 34.
- **O `code` divergia da demo em seis pontos**, e um era armadilha: ele mostrava
  `<MobileSheetFormStickyHeader title="…" />`, e `title` renderiza um
  `DialogTitle` que **lança fora de um `Sheet`**. Hoje o `code` mostra o casco
  inteiro, com o `SheetContent`.
- **A folha era `bg-card`, e a real é `bg-background` com `border-t`**
  (`edge-panel.tsx:31,50`). Ela usava `bg-card` porque o `Preview` também é, e
  ali `bg-background` não se separava de nada.
- **A página do chrome desenhava o corpo à mão** — `min-h-0 flex-1
  overflow-y-auto px-4`, a string exata que `MobileSheetFormBody` existe para
  eliminar. Sem ela não havia dissolução nem `overscroll-contain`: rolar a
  folha até o fim rolava a página atrás. Medido depois: `overscroll: contain`.
- **As duas páginas ensinavam o oposto uma da outra sobre o mesmo rodapé.** A do
  chrome desenhava `border-t`; a do `Form` afirmava a regra J. Hoje as duas são
  `FormActions variant="sticky"`, e o fio é `0px`.

**A demo do `Form` passou de três campos para sete.** Não é enfeite: um
formulário curto não precisaria de cabeçalho fixo nem de rodapé fixo — o padrão
que a seção documenta só existe porque o corpo não cabe. Com três, ele
transbordava **17px**, menos que os 44 da rampa de dissolução, e não havia o
que demonstrar. Hoje rola 126 na página do chrome, com `data-scroll-fade="on"`.

#### O que a moldura não conserta, e está escrito na página

Ela troca o viewport do **CSS**, e nada mais. `useIsMobile` lê o `matchMedia`
da janela de fora; os portais do Radix vão para o `body` do documento pai e
escapam do telefone; e `env(safe-area-inset-bottom)` vale zero, porque não há
aparelho — os 24px que se vê são a base, sem os 34 do iPhone. Nenhuma das duas
demonstrações depende dos três, e quem depender precisa saber antes.

### Rodada 32 — o Navigation Menu falava a gramática de outra biblioteca

`navigation-menu.tsx` era o shadcn quase intacto, e trazia os **três sinais** que
as rodadas do `resizable` e do `carousel` já nomearam, os três ao mesmo tempo:
zero consumidores fora do catálogo, **`—`** na coluna de variantes do
`ds:catalog`, e **"Nenhum achado" no `ds:audit`**. Uma pasta calada não é uma
pasta conforme, e um arquivo aprovado também não — as regras que o silenciam
(`A2`, `C`, `C'` sob `isUi`) não olham para nada do que estava errado aqui.

**Metade das declarações era de outra biblioteca.** `data-popup-open:` é
vocabulário do **Base UI**; o Radix escreve `data-state="open"`. Ele aparecia
**quatro vezes** — três no gatilho, uma no chevron —, sempre emparelhado com a
versão que de fato casa, o que tornava o defeito invisível: a interface
funcionava, e metade do CSS emitido não casava com elemento nenhum.

**E o anel de foco era apagado justo onde o teclado é o caminho.** O conteúdo
trazia `**:data-[slot=navigation-menu-link]:focus:ring-0` mais
`focus:outline-none` — um seletor de descendente que removia o anel de **todo**
link dentro do painel. Com o mouse ninguém nota, porque o foco nunca entra ali;
com o `Tab`, a pessoa percorria a lista sem saber em que linha estava.

#### `data-open:` tem especificidade zero, e o realce de aberto perdia para o cursor

O achado que decidiu o desenho. No Tailwind 4.2.2, `data-open:` compila para
`:where([data-open]:not([data-open=false])), :where([data-state=open])` —
**medido no CSS emitido**. Isso é **0,1,0** contra os **0,2,0** de `hover:`, no
mesmo elemento.

O arquivo antigo escondia a consequência escrevendo `data-open:hover:` ao lado
de cada `data-open:`, ou seja compensando por duplicação. Com um `variant`
`solid` — em que aberto é `bg-background` e o realce é `bg-background/60` — a
compensação não bastaria: passar o cursor sobre um gatilho **aberto** o
derrubaria para 60%, apagando o realce exatamente quando a pessoa aponta para
ele.

O gatilho passou a usar **`aria-expanded:`**, que é seletor de atributo de
verdade (0,2,0) — a mesma saída que o `Menubar` já usava, e o Radix carimba o
atributo (verificado em `node_modules`). Pela mesma aritmética, o realce de rota
atual do link é **`aria-[current=page]:`** e não `data-active:`: o Radix escreve
os dois atributos juntos quando o link recebe `active`, e só um deles pontua.
`data-open:` fica onde não há disputa — nas animações da superfície.

#### O marcador já viajava; faltava uma classe

O `Indicator` do Radix se posiciona sozinho a partir de `offsetLeft`/`offsetWidth`
do gatilho ativo, com `ResizeObserver` próprio, e já entende a vertical: **o
mecanismo que a rodada do `Tabs` construiu à mão já estava pago aqui.** O que
faltava era a transição — sem ela, um marcador só pisca de um gatilho para o
outro, que é o mesmo nada que três marcadores acendendo e apagando.

Medido depois, com o menu aberto: `transform, width, height @ 0.2s /
cubic-bezier(0.16, 1, 0.3, 1)` — `--duration-base` e `--ease-out` —, e a caixa
do marcador em **102px contra 102px** de gatilho. Ele deixou de ser peça que o
consumidor lembra de escrever e virou eixo: a fileira o monta quando
`indicator !== "none"`.

**A seta é a ponta do painel, e o defeito antigo não era contraste.** Eu enquadrei
errado na primeira passagem, e a medição me corrigiu: reportei "1,35:1 contra a
página" como o problema, copiando o número que o `resizable` mediu para uma
costura. Mas a seta **não deve** se destacar da página — ela é o bico de um
balão. O número certo é contra o **painel**: o quadrado `bg-border` antigo dava
**1,23:1** ali (pouco para ler como peça, suficiente para ler como emenda) e
ainda lançava um `shadow-md` próprio sobre a sombra que o painel já tem. Hoje é
`bg-popover` com o mesmo `ring-foreground/10`: **1,00**, nenhuma diferença, que é
o número certo para um bico. Quem quer um sinal alto de qual gatilho está aberto
usa `indicator="underline"` — **6,78:1** contra a página.

O recorte tem **2px a mais que a calha**, e isso é estrutural: a base do bico
passa por baixo do painel (que vive em `--z-popover`, acima da fileira) em vez de
encostar nele. Sem isso o `ring` do painel desenharia um fio reto atravessando a
base do bico, e as duas peças voltariam a ler como duas. Medido: sobreposição de
**2,0px**, bico visível de **5,7px**, calha de 8.

#### A escada, e a quinta porta do mesmo defeito

O gatilho era `h-8` cravado — um número sem nome, que nenhuma tela podia pedir
diferente. Entrou a escada da casa: **28 · 32 · 36**, os mesmos nomes e números
do `Button`, do `Input`, do `Tabs` e do `Menubar`, com `pointer-coarse` levando a
40. A fileira **não declara altura**: ela cresce em volta.

É a quinta porta — `Menubar` entregou 24, `Tabs` entregou 27, `Item` teve dois
degraus com a mesma string, `Calendar` entregou 28 onde dizia 36. Medido nos três
degraus: **28/28, 32/32, 36/36**, com a fileira em 34/38/42 (gatilho + 2×2 de
recuo + 2×1 de borda).

**E o link do topo veste a régua do gatilho.** Numa fileira real "Preços" é um
link e "Produto" é um gatilho com painel, e os dois têm de medir igual. Ele
compõe `navigationMenuTriggerVariants` em vez de repetir a escada, então não têm
como divergir no dia em que um degrau mudar — medido, `toplink === trigger` nos
três degraus. Dentro do painel a conta é outra, e ali o link volta a ser linha de
menu.

#### A superfície estava escrita quatro vezes, e uma delas divergia

`rounded-lg bg-popover text-popover-foreground shadow-md ring-1
ring-foreground/10` aparecia em `menu-classes`, em `popover.tsx`, em `select.tsx`
e — **duas vezes dentro do mesmo arquivo** — aqui, com `shadow` no lugar de
`shadow-md`. Saiu **`menuPanelSurfaceClassName`** em
[`lib/menu-classes`](../../src/lib/menu-classes.ts), e o `menuSurfaceClassName` passou
a compô-la: **a saída dos três menus é byte a byte a mesma**, é extração e não
mudança.

O `navigation-menu` **não** veste a casca inteira, e é decisão: ela traz
`min-w-36`, `flex-col` e as animações por `data-[side=…]`, que aqui não existem.
Vestir para desfazer três quartos por `className` é reimplementar ao contrário.

#### As peças que a tela escrevia à mão

O consumidor escrevia `<ul className="grid w-64 gap-1 p-2">` e **re-estilizava
cada link por dentro** com `block rounded-md p-2 hover:bg-accent`, uma receita
que discordava da do componente em quatro declarações — e quem escrevia isso era
a página deste catálogo. Catálogo escrevendo a anatomia é o sinal de que falta
peça, e o precedente é `FormPickerPopoverEmpty`, `HoverCardBody` e o `actions` do
`PageSectionHeader`.

- **`NavigationMenuPanel`** (`columns: 1 | 2 | 3`) — a grade, o recuo, **o teto e
  a rolagem**. Medido: 274px numa coluna, 570 em duas, dissolução `on` com 126px
  de transbordo.
- **`NavigationMenuLink variant="card"`** mais `LinkTitle` / `LinkDescription` —
  ícone, título e uma linha do que aquilo é. Ele existe sobretudo para **trancar
  o par de identidade**: `gap-y-0`, medido em **0px** entre título e descrição.
  É a quinta vez que esta base persegue o mesmo defeito (`ItemContent`,
  `StatCard`, `FieldContent`, `PageHeaderTitleRow`) e a primeira em que o
  componente o torna impossível de escrever errado.
- **`NavigationMenuSectionLabel`** — `menuLabelClassName` mais `col-span-full`.

**O teto mora no painel, e não no viewport.** O Radix expõe **duas** variáveis
aqui — `--radix-navigation-menu-viewport-height` e `-width` — e nenhuma
`available-height`. Mas ele calcula a primeira a partir do `offsetHeight` do
conteúdo: capar o **conteúdo** devolve a altura já capada, e o viewport anima
para o número certo sem `max-h` nenhum. De brinde, isso satisfaz de graça a
invariante 2 do `scroll-fade` — **o elemento mascarado não desenha nada** —,
porque quem desenha raio, fio e sombra é o viewport.

#### Mais o que estava morto, e o que entrou junto

O `justify-center` do wrapper do viewport era **inerte** (caixa absoluta sem
largura já encolhe até o conteúdo), e o `cn()` dele tinha **um argumento só** e
descartava `className`. Alinhar exige mexer na âncora, e é o que `align` faz — a
tabela é **JavaScript e não seletor**, porque `in-*` compila com `:where()` e o
override da vertical empataria com o `left-1/2` do alinhamento, decidido por
ordem de emissão. Entrou também `orientation="vertical"`, que o Radix já
suportava e o arquivo ignorava por completo (`top-full` e `h-1.5` cravados na
horizontal), mais o par `active:` em tudo que tinha `hover:`, o
`pointer-coarse:min-h-11` no link do painel, o chevron na régua (`size-4` em vez
de `size-3` com `top-px` de calço), `gap-1.5` no lugar do `{" "}` literal, e a
transição enumerada no lugar de `transition-all`.

**Três exports saíram, e os três tinham zero chamadores.**
`navigationMenuTriggerStyle` era um `cva` **sem nenhuma variante** — uma string
só, com um nome que prometia eixos; é a mesma constante disfarçada que
`defaultControlVariant` era antes de sair na 29b. `NavigationMenuIndicator` e
`NavigationMenuViewport` passaram a ser montados pela raiz, como a alça é da
superfície e não de quem abre a gaveta.

#### Três lições de método, e as três são erros de instrumento

**Li a caixa no mesmo quadro da montagem, e "descobri" dois defeitos que não
existiam.** O viewport apareceu 0×0 e o marcador apareceu ausente logo depois de
um `hover` — e a conclusão foi que a abertura por cursor estava quebrada.
Relendo depois de o layout assentar: viewport **288×112** com as duas variáveis
do Radix escritas, marcador presente com `width: 102px`. É a quinta vez que esta
base registra que **medição de layout se lê depois de um quadro**, e a primeira
em que ela quase produziu um conserto para um bug inexistente.

**Coordenada de painel não é pixel de CSS.** Com o viewport emulado em 1440×900,
o quadro de coordenadas do `computer` era **800×553** — hovers no ponto certo do
DOM caíam a centenas de pixels do alvo, e o menu que abria não era o que eu
estava medindo. A saída é hover por `ref`, nunca por coordenada calculada a
partir do `getBoundingClientRect`.

**Evento sintético não abre um Radix.** `dispatchEvent(new PointerEvent(...))`
sobre o gatilho não abriu nada — a mesma lição do calendário, com o sinal
invertido: lá o instrumento escondeu o defeito, aqui ele fabricou um.

#### O que não foi feito, e é dito em vez de silenciado

- **Não há teste de escada** (`navigation-menu-ladder.test.ts`). Foi decisão do
  dono nesta rodada. O que ele trancaria: os degraus serem degraus, nenhum par
  produzir a mesma string, a fileira não declarar altura, zero `data-popup-open`
  no fonte, nenhum `focus:ring-0` apagando anel, e a duração vir de token.
- **`defaultValue` com `viewport` não pinta na primeira montagem.** O Radix mede
  o conteúdo por `ResizeObserver` e, no caminho de `defaultValue`, a medida não
  chega antes da primeira pintura — o painel sai dentro de um viewport de altura
  zero. As três demonstrações que precisam nascer abertas usam
  `viewport={false}`, onde o conteúdo **é** a superfície e não há medida a
  esperar. Não foi investigado a fundo, e não foi contornado no componente.
- **`NavigationMenuSub` continua sem embrulho.** Zero contagem.
- **O app continua sem consumidor**, e isso segue correto: a navegação do produto
  é a `Sidebar` mais a ilha, e o lugar deste componente é a superfície pública
  que o produto ainda não tem. O que mudou é que, no dia em que ela existir, não
  vai precisar inventar a fileira, o painel, o marcador nem o cartão.

#### Rodada 32b — o painel não seguia o gatilho, e a seta nunca saiu do lugar

Relatado pelo dono, olhando a página: *"toda vez que eu clico no segundo
gatilho, ele abre como se fosse do primeiro"*. Eram **dois** defeitos, da mesma
família, e o segundo só apareceu porque o primeiro foi medido.

**O painel ancorava na fileira, não no gatilho.** Com viewport há *um* painel
para a fileira inteira, e o Radix não o desloca — ele nasce onde a casca o
ancorar. Ancorado na fileira, abrir o segundo gatilho punha o painel exatamente
onde o primeiro o pusera. Com `indicator="arrow"` ficava pior: a seta sobre o
gatilho certo e o painel em outro lugar, as duas peças apontando para direções
diferentes.

Entrou **`align="trigger"`**, e ele é o padrão: um `ResizeObserver` na raiz e nos
gatilhos mais um `MutationObserver` em `data-state` — o mecanismo do marcador do
`Tabs` — medem o gatilho aberto e publicam o **centro** dele em
`--navigation-menu-anchor-cx`. Medido depois, nos dois gatilhos: **54,1 e 54,1**,
depois **152,8 e 152,8**, desalinho zero.

**A leitura é por `getBoundingClientRect` e não por `offsetLeft`, e é decisão.**
O `Tabs` faz o contrário, e o comentário dele explica por quê: a trilha dele
rola, e coordenada de tela escorregaria a cada pixel rolado. Esta raiz não rola
por dentro, e aqui `offsetLeft` é que seria errado — pelo motivo do parágrafo
seguinte.

**E a seta nunca tinha saído do lugar.** O `Indicator` do Radix se posiciona com
`translateX(activeTrigger.offsetLeft)`, e `offsetLeft` é medido contra o
**`offsetParent`**. Enquanto o `NavigationMenuItem` era `relative` — herança do
arquivo antigo, que a rodada 32 preservou sem questionar —, esse ancestral era o
próprio `<li>`, e **`offsetLeft` valia 0 para todo gatilho**.

Medido com o segundo gatilho aberto: seta em **45,5**, gatilho em **152,8** —
**107,3px** de desalinho, e a largura travada em 102, a do primeiro. **O
primeiro gatilho acertava por acidente**, porque ali zero é o valor certo, e é
exatamente isso que fez o defeito atravessar a inspeção inteira da rodada 32: eu
medi `translateX(0px)` com `width: 102px` no primeiro gatilho, vi a largura
bater, e declarei o marcador correto. **Uma peça que se move só se verifica em
duas posições.**

O conserto é tirar `relative` do item (e da fileira, que eu tinha acrescentado):
o `offsetParent` volta a ser o `<div style="position:relative">` que o Radix põe
em volta da fileira, que é o mesmo bloco contentor do marcador **e** do painel —
um posicionamento só para as três peças. Medido depois: desalinho **0,1** e
**0,3** (o arredondamento inteiro do `offsetLeft`), com a largura da seta
acompanhando o gatilho, **102 e 91**.

Como o item deixou de ser `relative`, o modo `viewport={false}` passou a usar a
mesma variável medida — antes ele ancorava no `<li>`, o que dava o resultado
certo por outro caminho. Hoje os dois modos falam a mesma âncora.

**E a âncora corre num trilho.** Centrar no gatilho tem um custo que a medição
mostrou: um painel de 600px preso a um gatilho de 91 abre **259px para fora da
raiz**, e num cabeçalho real isso é metade do painel fora da tela. O `medir()`
limita o centro à janela com a mesma folga de 8px do `collisionPadding` do
`Popover`; quando o painel é mais largo que a janela inteira o trilho se inverte,
e aí a conta é descartada em vez de espremer. O painel entra no `ResizeObserver`
na primeira vez que aparece — o Radix o dimensiona **depois** de montá-lo, então
sem isso o clamp rodaria uma vez só, com largura zero. Medido a 700px de janela:
nada para fora em nenhum dos três painéis abertos, com o mais largo deslocado
**22,8px** do centro do gatilho.

### Rodada 34 — a alça era um `null` com 31 chamadas

`sheet-drag-handle.tsx` era, no fonte inteiro, `useSheetSurface(); return null` —
uma chamada de hook cujo valor era descartado, na frente de um `return null`. A
rodada do `Sheet` esvaziou o componente com razão (ele desenhava a promessa do
arraste sem entregá-la) e parou ali. O que ficou tinha cinco defeitos, e os cinco
foram medidos antes de qualquer edição.

**A alça de verdade estava escrita duas vezes, e as cópias já divergiam.**
`sheet.tsx` e `drawer.tsx` escreviam o mesmo `DrawerPrimitive.Handle` mais uma
constante importada de um para o outro, com **dois `data-slot` para o mesmo
elemento** — `sheet-drag-handle` contra `drawer-handle`. Régua compartilhada
morando dentro de um componente é a forma que produziu `menu-classes`,
`field-classes` e `disclosure-classes`; a diferença é que aqui não é só classe —
é elemento, classe e slot —, e nesta casa isso é **peça**.

**E o número do backlog estava errado.** Este arquivo dizia "16 telas ainda o
escrevem", em três lugares. Eram **31 sítios em 27 arquivos** (11
`<SheetDragHandle>` mais 20 `<MobileSheetFormDragStrip>`, que era um embrulho de
uma linha em volta do mesmo `null`), com **11 guardas `{isMobile ? … : null}`**
escolhendo entre dois nadas.

#### A tinta reprovava, e o repositório já tinha o número na mesa

`bg-muted-foreground/35` **por cima da `opacity: .7`** que o vaul declara —
ninguém a desfazia, então o alfa efetivo era **24,5%**, e não 35. Medido contra
`--background`, composto sobre o fundo real: **1,41:1 no claro e 1,46 no
escuro**, contra os 3:1 que a 1.4.11 pede de um componente não-textual. O `/35`
sozinho já daria só 1,64 e 1,85 — números que a rodada do `resizable` **tinha
escrito**, ao rejeitar aquele degrau para a pega dela.

Varridos os degraus, **70% é o primeiro que passa nos dois temas: 3,06 e 4,24**.
É exatamente o degrau a que a pega chegou, por varredura independente e contra
outra superfície — então a tinta de arraste deste sistema tem **um número só**. E
isso derruba o argumento que ficava lá, de que a área explicaria alças mais
claras: a alça tem **2,25× a superfície** da pega e reprova no mesmo degrau. Área
muda como a cor **lê**; não muda o que a norma **exige**. O par de cursor e toque
vai a 90% — **4,61 e 6,36** —, e é um par, porque `hover:` compila dentro de
`@media (hover: hover)` e a superfície que esta peça serve só existe no dedo.

#### O achado que vale mais que o conserto: não é especificidade, é camada

O JSDoc anterior explicava o `!` dizendo que a folha do vaul "entra depois e
empata em especificidade". **A explicação estava errada**, e a rodada só
descobriu porque um conserto falhou.

A regra nova de área de acerto era emitida (verificada na folha), o `matchMedia`
casava, o seletor tinha (0,2,0) contra os (0,1,0) do vaul — e a altura computada
não mudava. A causa: **as utilities do Tailwind v4 vivem em `@layer utilities` e
a folha do vaul é sem camada**, e a cascata resolve a camada **antes** da
especificidade, dando a declaração normal sem camada como vencedora sempre. Quem
inverte isso é `!important`: entre declarações importantes a ordem das camadas se
inverte.

Ou seja: contra uma biblioteca que injeta CSS sem camada, **especificidade não
compra nada** — só `!`. Vale para qualquer dependência que faça isso, e é por isso
que a asserção 1 do teste é uma tabela das propriedades que o vaul declara.

Foi assim que se soube que `rounded-full` estava **sem** `!` e perdia calado:
medido no navegador, o `border-radius` computado da alça era **16px**, o do vaul.
Três classes venciam, a quarta não, e nada apontava a diferença.

#### O alvo, e um bug do vaul que fica documentado em vez de escondido

O vaul quis encolher a área de acerto no ponteiro fino e **errou o seletor**:
`@media (pointer:fine){[data-vaul-handle-hitarea]:{…}}`, com um `:` sobrando
depois do seletor de atributo. A regra é inválida e nunca vale, então os 44px
persistiam no mouse — medido, `document.elementFromPoint` no topo do cabeçalho
devolvia **HITAREA**, com **9px** em que o clique era do arraste.

`pointer-fine:` faz o que a biblioteca pretendia, com um número em vez de `100%`:
**20px**, o dobro dos 10 que o `resizable` reserva para o mouse, e que cabem
inteiros na caixa de margem da alça (6 + 2×10 = 26). Medido depois: **48×20 no
ponteiro fino, com 3px de folga** até o cabeçalho, e **48×44 no grosso**, com os
9px de volta — que ali são corretos, porque não há controle naquela faixa e o
dedo agradece. É por isso que o `my-2.5` da alça é carga estrutural.

#### Duas afirmações falsas, e uma página que demonstrava nada

`drawer.tsx` dizia "o clique nela fecha". O `handleCycleSnapPoints` do vaul só
chama `closeDrawer()` quando `dismissible` é **falso** (`if (!dismissible)`), e
sem `snapPoints` não há o que ciclar — em nenhuma gaveta deste app o clique
fecha. Ela se arrasta, e isso agora está escrito.

E a página do catálogo ensinava um componente que desenha: o `Usage` afirmava
"é a convenção de iOS e Android que diz isto se arrasta", uma `DocNote` atribuía
ao componente um `aria-hidden` que ele não emitia, e a preview renderizava
`<SheetDragHandle />` dentro de um card — **desenhando o vazio**, um
`rounded-t-2xl` de 0px sobre um `border-t`. Ela tinha até uma **exceção nominal**
em `ds-phone.test.ts` para poder continuar assim; a exceção saiu junto, e a
asserção 3 daquele teste ficou mais estrita.

A página nova demonstra o gesto em **gavetas de verdade**, arrastáveis na própria
página (o precedente é `docs/drawer.tsx`), e uma delas desenha o contorno da área
de acerto por seletor local, para o invisível aparecer.

#### A camada mudou porque a implementação mudou

Ela era **Organismo**, justificada por "consome o contexto do `Sheet`". Parou de
consumir quando voltou a desenhar, e virou **Átomo**: indivisível, um elemento,
zero imports de `ui/`. O `<span data-vaul-handle-hitarea>` é anatomia interna do
vaul, não composição — a mesma régua que faz o `Slider` átomo com quatro
primitivas Radix por dentro. É a terceira vez que este arquivo registra a
etiqueta seguindo a implementação, e não o contrário.

**Sem eixo, e a contagem é a razão:** uma geometria, duas superfícies, nenhuma
tela pedindo outra. O `ds:catalog` sai `—` na coluna de variantes, e isso é
sinal para olhar, não mandato para inventar — foi olhando que os cinco defeitos
acima apareceram. O que existe é o `showHandle` do `DrawerContent`, e ele é da
superfície porque a pergunta que responde ("esta gaveta se arrasta?") é dela.

#### Três lições de instrumento, e uma delas é um erro meu

**`git checkout` como desfazer reverte o arquivo inteiro.** Ao testar se o teste
novo pegava o defeito, acrescentei uma linha a `bills-toolbar.tsx` e a desfiz com
`git checkout` — que devolveu o arquivo ao `HEAD` e **apagou a migração que eu já
tinha feito nele**. Só apareceu porque a varredura seguinte contou as
referências. Desfazer edição de teste com `git` num arquivo já editado é apagar
trabalho; a varredura de confirmação é o que salva.

**Ponteiro não persiste entre chamadas do harness.** Medir `:hover` numa chamada
separada da que move o cursor devolve `false` — e quase produziu a conclusão de
que o realce não funcionava. Com o `hover` e a leitura na **mesma** chamada, o
alfa sai em 0,858 no meio da transição de 150ms, e assenta em 0,902.

**E a medição contradizendo o mecanismo é sinal de que o mecanismo está mal
entendido, não de que a medição está errada.** Foi o caso das camadas de cascata:
o instinto foi desconfiar da sonda, e desta vez a sonda estava certa.

#### O que não foi feito, com o motivo

- **O `isMobile && "pt-1"` de `transactions-toolbar.tsx` ficou.** O plano previa
  removê-lo, alegando que ele compensava uma margem fora do fluxo. **A alegação
  era falsa**: a alça é irmã daquela caixa e a margem de 10px é real. Removê-lo
  mudaria o espaçamento daquela folha sem número que peça.
- **O caminho do `Sheet` no telefone não foi visto aberto.** A página do catálogo
  esconde os espécimes abaixo de 768px por decisão própria, e as telas do app
  exigem sessão. O que prova a composição é o `tsc`, a asserção 4 do teste (zero
  `DrawerPrimitive.Handle` fora da peça) e as gavetas reais da página nova, que
  exercitam o mesmo `<DragHandle />`.
- **`Drawer` continua sem consumidor no app.** A gaveta chega às telas por dentro
  do `Sheet`, e isto não mudou.

### Rodada 35 — a barra prometia redimensionar, falava inglês, e o badge caía uma linha

A `Sidebar` é a navegação primária do produto — 763 linhas, 24 exports, montada
sob todas as rotas autenticadas — e chegou nesta rodada com os **três silêncios**
ao mesmo tempo: `ds:audit` dizendo "Nenhum achado", `ds:catalog` mostrando eixos,
e **zero testes** num arquivo com escada de tamanho. Os três eram sinal para
olhar, e nenhum era certificado.

#### O defeito que estava em produção, e visível

`SidebarMenuAction` e `SidebarMenuBadge` liam
`peer-data-[size=default]/menu-button:top-1.5`. O `cva` do botão foi renomeado
para `md | sm | lg` numa rodada anterior, e os dois seletores ficaram apontando
para um degrau que ele **não emite mais**. Nenhuma regra casava, o badge é
`absolute` sem `top` de base, e ele caía para a posição estática.

Medido antes, na própria página do catálogo: **`top: 32px`** — exatamente a
altura do botão —, centro **26px** fora do centro da linha, e **20px de
transbordo** para fora do item, ou seja o badge inteiro renderizando **sobre a
linha seguinte**. Na demonstração, o "42" de Transações aparecia ao lado de
Carteiras e o "3" de Cartões ao lado de Conta. Depois: `top: 6px`, desalinho
**zero**, e 6px de folga dentro do item.

É a família "sobreviveu à remoção" que esta base já registrou quatro vezes — e a
primeira em que ela custou pixel numa tela de produto.

#### O trilho prometia redimensionar, e a quarta mentira da mesma família

`SidebarRail` declarava `cursor-w-resize` / `cursor-e-resize` e desenhava um fio
de 2px que acende no cursor — a gramática inteira de uma costura de arraste —
enquanto o `onClick` só alternava, com `tabIndex={-1}` e um `title="Toggle
Sidebar"` em inglês ao lado de um `aria-label` em português.

Depois do `SheetDragHandle`, da alça do `Drawer` e da do `vaul`, é a quarta
ocorrência; e é a pior, porque **quem mentia era o cursor do sistema
operacional**, que é a promessa mais forte que uma interface consegue fazer.
Hoje ele alterna e diz que alterna. Quem redimensiona é o átomo.

#### A camada de acessibilidade nunca tinha sido traduzida

No ramo do telefone, o nome acessível do menu era `<DialogTitle>Sidebar</DialogTitle>`
— a palavra inglesa — e a descrição era `Displays the mobile sidebar`, uma frase
de desenvolvedor lida por leitor de tela. É exatamente o achado do `Calendar`
("a grade parecia traduzida e a camada de acessibilidade nunca esteve"), agora
na navegação primária. Verificado no navegador depois: o painel abre com o nome
**"Navegação"**.

#### O catálogo reportava os eixos do botão como se fossem os da barra

O `ds:catalog` lê o **primeiro** `cva` do arquivo, e o único era
`sidebarMenuButtonVariants`. Resultado: a linha da `sidebar` mostrava
`variant: plain | outline` e `size: md | sm | lg`, enquanto `side`, `variant` e
`collapsible` — os eixos que alguém de fato escolhe — não apareciam em lugar
nenhum. É o defeito que o `Item` já registrou com `itemGroupVariants`.

`sidebarVariants` entrou **antes**, e não é cerimônia: `variant` decidia a
geometria por ternário em dois lugares, e decisão escrita duas vezes diverge —
foi assim que `floating` ficou com `rounded-lg` e `inset` com `rounded-xl`, dois
raios para a mesma ideia de cartão solto. Medido depois: o catálogo reporta
`side · variant · collapsible`.

#### A moldura de telefone virou moldura de viewport, e duas limitações fecharam

`ds-phone.tsx` virou **`ds-frame.tsx`**: `ViewportFrame` é a primitiva,
`PhoneFrame` um preset de 375×667. O nome antigo passaria a mentir num arquivo
que hospeda uma moldura de desktop.

A página nunca tinha mostrado a barra ligada. Para caber no palco ela
neutralizava três coisas — `collapsible="none"` (um *early return* que devolve
uma `div` comum, e não o caminho do app), `min-h-0` e `w-full` — e o que sobrava
era uma lista de links. Dentro da moldura, medido: viewport de **778px**,
`position: fixed` **relativo ao iframe**, `md` casando, e a barra com os seus
**256px = 32,9%** — a proporção que uma navegação tem numa janela estreita de
laptop.

E as duas limitações que a moldura declarava desde a rodada 31 fecharam, porque
sem elas esta peça não é demonstrável:

- **`useIsMobile` lê a janela da moldura.** Um contexto opcional em
  `use-mobile.tsx`, com `null` por padrão e *fallback* para o `window` real — o
  app não muda. Sem ele, na moldura de 375 a barra tomaria o ramo de desktop
  enquanto o CSS a esconde com `md:`, e não renderizaria **nada**.
- **O portal do `EdgePanel` cai dentro da moldura**, porque ele lê a mesma
  janela e entrega `container` ao `Portal` do Radix — sem prop nova. Medido: o
  painel do telefone abre com 288px (76,8% dos 375) **dentro** do iframe, e não
  vaza para o pai.

A terceira fica: `env(safe-area-inset-*)` vale zero, porque não há aparelho.

E o `⌘B` passou a escutar `ownerDocument.defaultView` em vez de `window` — dentro
de um iframe, `window` é o de fora, e a tecla digitada lá dentro nunca chegaria.

#### O redimensionar é o átomo, e a `react-resizable-panels` mede em pixel

A régua da casa é que um componente não reimplementa a camada de baixo. O
arraste já existia medido no `Resizable` (Átomo, rodada 28), e `Sidebar` é
Organismo — compor um átomo é livre.

**O encaixe é melhor do que eu previa.** A v4.12.3 lê número como **pixel** e
string como porcentagem, e é isso que torna o modo possível: um trilho de
navegação **não pode** variar de largura com a janela, porque ícone, rótulo e
badge têm medida fixa. Com o modo pixel, os `collapsible` viram configuração do
átomo — o modo ícone é literalmente `collapsedSize={48}`, e o offcanvas é zero.

`SidebarProvider resizable` troca a linha de flex por um `ResizablePanelGroup`,
a barra vira o primeiro painel, a costura vira o `ResizableHandle` e o
`SidebarInset` vira o segundo. Medido: `flex-grow` 32,905 para a barra e 67,095
para o conteúdo, `role="separator"` na costura, e um arraste de 82px levando a
barra de **255,7 para 337,7px** — os 82, exatos.

**É opt-in, e o produto não liga.** O `PanelGroup` declara `display`,
`flex-direction`, `overflow` e as medidas por estilo **inline** — o `.d.ts` avisa
que as quatro não se sobrescrevem —, e `useResizableLayout` custa uma remontagem
por carregamento, que é justamente o que o cookie da barra existe para evitar. O
padrão continua sendo o trilho `fixed` com a folga no fluxo.

#### Tokens mortos, uma classe que não existia, e uma cópia que já divergira

- **`--sidebar-primary` e `--sidebar-primary-foreground`** estavam definidos nos
  dois temas, expostos no `@theme` e com **zero** usos. Saíram.
- **`no-scrollbar` era escrita em quatro superfícies e não estava definida em
  lugar nenhum** — nem aqui, nem no `tw-animate-css`. As quatro achavam que
  escondiam a barra e nenhuma escondia; o `tabs.tsx` chegou a escrever
  `[scrollbar-width:none]` por extenso enquanto isso não se decidia. Agora é
  `@utility`, e medido: `scrollbar-width: none` nas três superfícies da página,
  contra `auto` antes. Onde ela vale, quem indica que há mais conteúdo é a
  dissolução da borda — que é a decisão deste sistema, e a razão de as quatro a
  pedirem.
- **`sidebar-user-profile.tsx` copiava o `cva` do botão à mão**, e a cópia já
  tinha divergido: `group-data-[collapsible=icon]:p-0!`, que é a regra do degrau
  `lg`, sobre a geometria do degrau padrão. Hoje ela compõe
  `SidebarMenuButton size="lg"`.
- **`sidebar-logo.tsx` foi apagado** — zero consumidores, e o `AppSidebar` usa o
  `WorkspaceSwitcher`.
- **`setOpen` gravava o cookie mesmo em modo controlado**, sobrescrevendo pelas
  costas a preferência de quem controla.

#### A página, e o que ela passou a ensinar

Reescrita, com quatro molduras: a tela de desktop com colapso pelos três
caminhos; um seletor dos três eixos sobre uma moldura só, porque **combinar** é o
que uma tabela de variantes não mostra; a barra redimensionável; e o telefone com
o painel de borda abrindo dentro do iframe. Mais os tipos de item — badge, ação
no cursor, submenu sobre `Collapsible`, esqueleto, busca, separador — e a escada
do botão, esses dois num palco comum e **em `collapsible="none"`**, porque
demonstrar conteúdo não precisa de moldura e demonstrar comportamento precisa.
A página passou de 9 exports documentados para os 24, com três `PropsTable`.

#### A lista se encostava, e a navegação do produto desfazia isso à mão

`SidebarMenu` declarava **`gap-0`** — as linhas coladas —, e isso não era
decisão: era o padrão do shadcn. A prova é que a navegação do produto o desfazia
escrevendo `className="gap-2"` nos **dois** menus que têm mais de um item; os
outros três do app carregam um item só, onde o `gap` não decide nada. **2 de 2**,
unânime. Padrão que ninguém escolhe não é padrão — é a régua que o `Container`
já aplicou ao devolver `md` como padrão de largura.

**Mas o degrau não é o que a tela pedia.** A primeira versão levou os 8px do
`app-sidebar` para o componente, e o dono olhou e mandou diminuir — com razão: o
realce de um item é a **caixa inteira da linha**, 32px de altura com canto
arredondado, e a 8px de folga as linhas começam a ler como cartões soltos. Uma
navegação é uma lista. Ficaram **4px**, que é o suficiente para dois realces
vizinhos não se tocarem, que era o problema real do `gap-0`.

A hierarquia continua dita, e não pelo respiro: medidos depois, o grupo separa
o conteúdo em **16** (o `p-2` de cada lado), **quatro vezes** o item; e o
submenu fica nos mesmos 4, porque quem diz o aninhamento ali é o recuo e o fio à
esquerda — um segundo sinal seria redundante. As duas compensações à mão saíram
de `app-sidebar.tsx`, e a asserção 11 do teste falha se alguma tela reescrever o
ritmo de novo.

A lição de leitura: **a contagem diz que o padrão estava errado, não qual é o
certo.** Duas telas escreverem `gap-2` provou que `gap-0` não era decisão; o
número final saiu de olhar o realce, que nenhuma contagem mostra.

#### Recolhida, os avatares não estavam no meio

Apontado pelo dono, selecionando os dois botões `size="lg"` — o seletor de
workspace no topo e a conta no rodapé. Medido no modo ícone: caixa de 32, filho
de 24, **0 de folga à esquerda e 8 à direita** — 4px fora do centro, numa coluna
em que todo o resto está no meio.

A causa não é o alinhamento: é que **a centragem era acidente do recuo**. A
conta é `(32 − filho) / 2`, e o degrau padrão calha de acertá-la — ícone de 16,
`p-2!`, 8 de cada lado. O `lg` carrega um avatar de 24 e escrevia `p-0!`, porque
com 8 ele não caberia. Ninguém fez a conta para o outro filho.

**E `justify-center` não conserta — piorou, medido.** Em modo ícone o rótulo
continua no fluxo (o que o esconde é o `overflow-hidden`, não `display`), então
a linha de flex **transborda** a caixa de 32; e centrar uma linha que transborda
empurra o conteúdo para fora nos dois lados. Os degraus que estavam certos foram
de 0 para **−4**. Com o rótulo ocupando espaço, o recuo é a única alavanca que
centra.

`p-1!` no `lg` fecha a conta: 4 + 24 + 4. Medido depois: **desalinho zero nos
oito botões**, nos dois degraus. A asserção 12 tranca a tabela e proíbe as duas
saídas erradas — o `p-0!` e o `justify-center`.

#### A dica do modo ícone era montada sempre, e descrevia o botão com o próprio rótulo

`SidebarMenuButton` passava `hidden={state !== "collapsed" || isMobile}` ao
`TooltipContent`. **`hidden` esconde pixel, e mais nada**: o Radix continua
abrindo a dica, contando os atrasos e — o que importa — ligando o
`aria-describedby` do botão a ela.

Medido com a barra **expandida**, que é o estado padrão do app: passar o cursor
em "Início" montava uma dica invisível escrita "Início", e o botão saía
`aria-describedby` apontando para ela. Quem usa leitor de tela ouvia o rótulo e
depois a descrição, idênticos, **em cada item do menu**. A dica existe para
quando o rótulo *não* está na tela; ela estava lá justamente quando ele está.

O conserto é não montar: a guarda foi para o retorno curto, ao lado da que já
existia para `!tooltip`. Medido depois — expandida: **nada monta, e
`aria-describedby` é `null`**; recolhida: dica presente, à direita, `sideOffset`
de 6 e desalinho vertical **zero**.

E o `TooltipContent` passou a portalizar para a janela ativa, como o
`EdgePanel` — sem isso a dica saía da moldura do catálogo e era desenhada sobre
a página. É a terceira peça a ler o contexto de viewport, e as três pelo mesmo
motivo.

#### E a dica travava entre um ícone e o vizinho — o polígono de graça

Relatado pelo dono: *"o tooltip fica um tempão ali e eu não consigo mover para
outro e fazer o tooltip aparecer."* Não era atraso — o `delayDuration` do
provedor já é **0**.

É a **área de graça** do Radix: ele mantém o conteúdo aberto enquanto o ponteiro
se move dentro de um polígono entre o gatilho e a caixa, para dar tempo de
alcançá-la. Isso serve a conteúdo que se aponta. **Uma dica não é isso** — ela é
um rótulo, e quem tem conteúdo alcançável neste sistema é o `HoverCard`.

No trilho recolhido o custo é estrutural: os ícones ficam a **36px** um do outro
e a dica abre à direita, então o polígono cobre os vizinhos. Medido — passando
por "Início" e indo até "Carteiras", a dica continuava escrita **"Início"** e o
`aria-describedby` continuava no **primeiro** botão. Depois de
`disableHoverableContent` na raiz do `Tooltip`: a dica é a do botão sob o
cursor, uma só aberta, e o `aria-describedby` acompanha.

Continua sendo prop, para quem tiver um caso de dica alcançável — mas o padrão
passou a ser o que a definição do componente já dizia.

#### O espécime ganhou cor, e a peça óbvia era a errada

O workspace e a conta da demonstração eram dois `<div>` desenhados à mão em
`bg-sidebar-accent` — cinza, iguais entre si, e anatomia escrita pelo catálogo,
que é o sinal de que falta peça. Viraram `Avatar size="xs"` (os mesmos 24px, então
a centragem acima continua valendo) com a ficha `--identity-*`: ladrilho de canto
para o espaço, círculo para a pessoa.

**`ColorTile` seria a escolha óbvia e é a errada**, e a régua deste arquivo é que
diz por quê: ele carrega a cor que a pessoa escolheu e que veio do banco. Aqui a
cor vem do tema, e o caso é o da ficha de identidade.

E a primeira versão usou `identityToneFor`, que é o que o app usa — **as duas
sementes caíram no mesmo tom**, medido: `oklch(0.78 0.09 320)` nos dois. O hash
distribui, não garante distinção entre duas strings quaisquer; numa demonstração
o assunto é justamente que duas identidades leiam como diferentes, então os
índices são explícitos. Medido depois: matiz 140 e 20, com a tinta a **6,37 e
6,07** no escuro e **6,73 e 7,33** no claro.

#### Uma lição de instrumento, e ela é um erro meu

Ao verificar o painel do telefone, a sonda procurou
`[data-slot=edge-panel-content]` e voltou vazia três vezes seguidas — o que me
levou a suspeitar de delegação de eventos do React através de portal para outro
documento, que é uma hipótese cara e plausível. **Era a sonda.** O ramo mobile
da `Sidebar` passa `data-slot="sidebar"` ao `EdgePanelContent`, sobrescrevendo o
slot do componente de baixo: o painel estava lá o tempo todo, com véu, título e
botão de fechar. O que resolveu foi parar de procurar um seletor e **listar
todos os `data-slot` antes e depois do clique**.

A régua: **num sistema onde o consumidor pode carimbar o próprio `data-slot`,
uma sonda que procura o slot do componente de baixo mede a chamada, não o
resultado.** É a parente da lição do `resizable` ("coordenada de painel não é
pixel de CSS") e do carrossel ("classe montada em runtime não existe na folha").

#### O que não foi feito, com o motivo

- **`AppSidebar` não adota `resizable` nem `variant="inset"`.** As duas são
  decisão de produto. Fica o registro de que o `peer-data-[variant=inset]:*` do
  `SidebarInset` é **código inalcançável** hoje: a casca usa a variante padrão.
- ~~**O `md:z-10` cru do `AppHeader` fica.**~~ Pago na rodada 80: o `TopBar`
  grudado mora em `--z-sticky`, e a barra lateral e o cabeçalho empatam em 20 —
  decidido pela ordem no DOM, onde o cabeçalho vem depois. A barra entrou na escala
  (`--z-sticky`), e o cabeçalho é `layout/`, fora do que esta rodada abriu. Hoje
  os dois não se sobrepõem; no dia em que se sobrepuserem, quem ganha é a barra.
- **`Dialog` e `Popover` não leem a janela da moldura** — só o `EdgePanel`, que é
  o que a `Sidebar` usa. Os outros entram quando uma página precisar.
- **A casca do app não foi vista logada.** As telas exigem sessão; o que prova a
  migração é o `tsc`, os 371 testes e as quatro molduras da página. Os dois
  seletores mortos e o `p-0!` da cópia **mudam pixel** na navegação de produção,
  e é o único lugar da rodada onde isso acontece.

### Rodada 36 — vidro não tem borda; tem aresta

Pedido: *"deixe as bordas do floating sidebar com efeito de glass"*. Duas
medições mudaram o que a frase podia significar, e uma delas corrigiu um número
que eu tinha apresentado errado.

**Não há nada atrás da placa para borrar.** Medido com `elementsFromPoint` no
meio do painel: a pilha sob ele é `sidebar` (transparente) → `sidebar-wrapper`
(transparente) → a tela → `body`. O `floating` reserva a folga no fluxo, então o
conteúdo **não passa por baixo**. Um `backdrop-blur` ali borraria cor chapada e
não desenharia nada — a lei que a paleta de comandos escreveu e que nunca tinha
saído da narrativa dela. Vidro aqui não podia ser borrão.

**E o defeito não era o que eu disse.** Afirmei que o anel dava "1,32 no escuro
e 1,01 no claro"; o 1,01 era um **branco hipotético** no claro, não o token. O
anel real é `--sidebar-border`, que já vira de direção sozinho por tema
(`oklch(1 0 0 / 10%)` no escuro, `oklch(0.9)` opaco no claro), e mede **1,32 e
1,23** — consistente e deliberado.

O defeito é de material: **o anel é uniforme**. Um fio de 1px igual nos quatro
lados é uma **borda**. Vidro não tem borda; tem **aresta**, e ela varia ao redor
da placa — pega luz em cima e escurece embaixo. É isso que separa uma placa de
vidro de um retângulo pintado.

#### O par de tokens, e por que ele é par

Varrido sobre `--sidebar`: branco a 20% dá **1,87** no escuro e **1,02** no
claro; preto a 20% dá **1,60** no claro e **1,04** no escuro. Sobre uma placa
quase branca a luz não aparece; sobre uma placa escura a sombra não aparece. É a
mesma aritmética que obrigou `--secondary-hover` a existir.

`--sidebar-rim` e `--sidebar-rim-shade`, nos dois temas. Em cada um **exatamente
um dos dois carrega**, e o outro fica no zero perceptual — o que é a física, e
não desperdício: o topo de uma placa branca não tem como pegar luz visível.
Medido depois: **1,76 pelo topo no escuro, 1,69 pela base no claro** — peso
equivalente —, com 1,06 e 1,03 do lado que não lê. Os dois são declarados para a
geometria ser a mesma nos dois temas, em vez de um `dark:` dentro do componente.

**O anel fica, e é exceção consciente.** A página de elevação enuncia que "a
sombra não se acumula com a borda", e aqui elas se acumulam. O número que força:
a placa e a página estão a **1,04** uma da outra no tema claro — praticamente a
mesma cor —, e uma sombra de `0 1px 2px` a 6% não define uma placa de 240px. Sem
o anel ela deixa de existir como objeto.

#### O fio do cabeçalho nascia no ar

Apontado pelo dono. Medido com `floating` ligado: a placa termina em **x=248** e
o fio do cabeçalho vai de **x=256 a 778** — uma régua de 522px que começa a 8px
de nada. Em `variant="sidebar"` ela encosta no `border-r` da barra (folga
medida: **1px**) e as duas leem como uma cromagem só; o `floating` tira esse
`border-r` e o fio fica pendurado.

A regra que resolve já estava escrita para as tiras de superfície: elas não têm
fio nem tinta, e quem marca o limite é o respiro — mais a dissolução onde há
rolagem, que no `AppHeader` é o vidro que ele acende ao rolar.

**O mecanismo é variável publicada, e não seletor de grupo.**
`--sidebar-inset-rule` nasce no `SidebarInset`, que é **peer** da barra — a mesma
relação que a variante `inset` já usa —, e vale `1px` por padrão e `0px` sob
`floating`. Quem desenha o cabeçalho lê `var(--sidebar-inset-rule,1px)`. É o
mecanismo de `--dialog-px`, `--dialog-bleed` e `--toolbar-control`, e a razão é a
de sempre: `in-*` e `group-*` compilam com `:where()`, que não soma
especificidade; variável herda e não disputa. A alternativa —
`[&>header]:border-b-0` no `SidebarInset` — seria compensar geometria por
seletor, que esta casa nomeia como sintoma de peça faltando.

Medido nas três variantes: fio de **1px** em `sidebar` e `inset`, **0px** em
`floating`. O `inset` mantém o dele com razão: ali o cabeçalho vive *dentro* do
cartão, que tem canto próprio, e o fio não sobra para lugar nenhum.

#### O que eu olhei e decidi não mexer

- **O desalinho de topo de 8px** entre a placa (`y=8`) e o cabeçalho (`y=0`).
  Dar a mesma margem ao conteúdo é literalmente o que a variante `inset` faz, e
  faria as duas colapsarem numa só. No `floating` **só a barra flutua**.
- **O `SidebarRail` na calha de 8px** — continua sendo o alvo de alternar e não
  colide com nada.
- **A calha esquerda do cabeçalho.** São duas colunas diferentes; forçá-las a
  concordar amarraria o recuo do conteúdo ao da barra.

#### O que a rodada achou e não consertou

- **O sistema já tem um vidro inteiro, e ele não está documentado.**
  `.mobile-glass-surface` em `globals.css`, com tokens `--mobile-glass-*` nos
  dois temas, `blur(24px) saturate(1.5)`, três consumidores no telefone e — o
  único do repositório — um fallback de `prefers-reduced-transparency`. Zero
  linhas aqui e zero páginas no catálogo.
- **`--mobile-glass-border` é branco nos dois temas** (10% claro, 5% escuro).
  Pela varredura acima, branco sobre superfície clara é invisível; é candidato a
  declaração morta no tema claro, e merece a própria medição.
- **`registered-credit-card-face.tsx` mantém as quatro camadas de vidro** que o
  `ColorTile` documentadamente removeu de si — borda clara, anel, sombra e blur,
  mais um degradê e um `shadow-inner`. É a contradição mais visível do
  vocabulário de vidro do repositório.
- **Duas sintaxes de suporte a blur** (`supports-backdrop-filter:` nos três
  overlays contra `supports-[backdrop-filter]:` no `app-header`) e **duas de
  anel interno** (`inset-ring-3` contra `ring-1 ring-inset`, em quatro arquivos).

#### Uma lição de instrumento

A asserção da aresta cortava o fonte entre `const miolo` e `if (resizable)` — e
falhou devolvendo **string vazia**, porque `if (resizable)` também aparece no
`SidebarProvider`, que vem antes no arquivo. Um `indexOf` solto pegava aquele. O
detalhe que importa: a fatia vazia **passava** na primeira asserção do bloco e só
caía na segunda. **Corte por `indexOf` sem posição inicial é uma asserção que
pode acertar por vazio.**

### Rodada 37 — reflexo é gradiente, e a luz vem de cima

A rodada 36 trocou a borda uniforme da placa flutuante por duas arestas internas
de alfa **constante**. Media bem — 1,76 no escuro, 1,69 no claro — e, ao lado de
três referências de vidro, ainda lia como borda: **num reflexo o brilho varia ao
longo do perímetro**.

O vocabulário já existia aqui, num arquivo só. `registered-credit-card-face.tsx`
tem florão de canto, brilho diagonal em `soft-light` e dois aros em gradiente com
`maskComposite` — oito camadas. É o arquivo que este documento chama de *"o único
vidro fora do sistema"*; com a ilha do telefone eram **três vidros e nenhum
vocabulário comum**. Esta rodada não inventou o quarto: promoveu a `@utility`.

#### Duas camadas de fundo, e nenhuma máscara

`background-clip: padding-box` para a superfície e `border-box` para o aro, com a
borda transparente. Verificado: o raio de 14px sobrevive e **nenhuma máscara
entra** — a armadilha registrada aqui (`mask-image: none` num composite apaga o
elemento; a ordem de emissão de `mask-composite` e `-webkit-mask-composite` não
se controla pelo Tailwind) fica de fora por construção. A face do cartão usa a
versão com máscara e consegue porque escreve inline, em objeto de estilo.

#### A luz é vertical, e isso levou três tentativas

O aro nasceu em **158°**, um eixo diagonal, com o pico no canto superior-esquerdo.
Fisicamente defensável e errado aqui: numa coluna alta e estreita a luz que
convence vem de **cima**, reta. Em `180deg` o topo pega o pico, os dois lados
pegam o vale no mesmo ponto do gradiente, e a base recebe o vestígio.

Antes disso, uma versão pior: com o **mesmo** token em 0% e 100%, a projeção na
caixa real (240×424) dava **19% no topo e 19% na base** — variava, e tinha dois
picos. Luz vem de uma direção só. O canto oposto virou
`color-mix(… 45%, transparent)` em vez de um sexto token, porque ele não tem luz
própria: tem menos da mesma.

Os números finais:

| | aro no topo | aro nos lados | queda de luz |
| --- | --- | --- | --- |
| escuro | **2,36** | 1,27 | **1,13** |
| claro | **2,24** | 1,25 | 1,09 |

#### Três camadas, e não quatro

Houve um **brilho diagonal** em `soft-light`, atravessando a placa. Ele saiu ao
ver: numa superfície de navegação a faixa cruza a lista de links e compete com
ela. Vidro aqui é aro mais volume, e não cenografia. Com ele saiu o
`background-blend-mode`, que existia só para essa camada.

#### O florão perdeu a cor, e a medição não bastou para decidir

Ele nasceu no matiz da barra a 14%, e eu tinha levantado a ressalva de que
**verde neste app significa "entrou dinheiro"**. A medição parecia liberar:
`--income` é hue 152, o florão composto ficava a **ΔE 43** dele e clareava o
painel 2,7×; não são cores confundíveis.

**E ainda assim estava errado.** ΔE mede confusão entre duas amostras lado a
lado; não mede que uma navegação esverdeada compete com o significado que a cor
carrega na interface inteira. Hoje o florão é **branco a 7%** — leva o canto de
`rgb(28,28,28)` a `rgb(44,44,44)`, 1,57×, com R=G=B. **No tema claro ele não
existe** (`transparent`), pela mesma física do aro: sobre `oklch(0.97)` não há
para onde clarear, e um florão escuro é mancha, não florão.

#### Um critério meu que a primeira medida não passou

O anel uniforme saiu, e o plano dizia que o vale do aro precisava segurar os
lados. Medido no claro: **1,16**, contra os **1,23** do anel — regressão pequena
e real. O vale subiu de 5% para 10% e bateu 1,25. Foi o **critério escrito no
plano** que pegou isso, e não a captura.

#### A régua que sobrou

**Contraste diz se aparece; não diz se convence** — e nesta rodada isso apareceu
quatro vezes. No florão verde (ΔE bom, leitura errada), no eixo do aro (158°
defensável, 180° certo), na faixa diagonal (bonita isolada, ruidosa sobre uma
lista) e numa reversão inteira que precisou ser desfeita: a rodada chegou a
voltar ao estado da 36 antes de o ponto certo aparecer, **entre** os dois.
Nenhuma dessas quatro saiu de um número. Todas saíram de olhar.

### Rodada 38 — o realce pintava cor fixa sobre uma superfície que virou degradê

A rodada 37 deu volume à placa: a superfície corre de `oklch(0.242)` no topo a
`oklch(0.192)` na base. **O realce dos itens não acompanhou** — ele continuou
pintando `--sidebar-accent`, um valor opaco. Um retângulo de cor fixa em cima
de um degradê faz duas coisas erradas de uma vez: apaga o degradê dentro do
próprio realce, e muda de força conforme a altura do item.

E a geometria agrava. O botão do workspace fica a **8%** da altura do painel e
o da conta a **92%** — os dois extremos da rampa —, e a assimetria **inverte**
entre os temas:

| | workspace (8%) | conta (92%) |
| --- | --- | --- |
| hover opaco, escuro | **1,09** | 1,21 |
| hover opaco, claro | 1,20 | **1,11** |

O pior caso é justamente o que o dono apontou: **1,09 no escuro**, porque o
workspace fica onde a superfície é mais clara e o opaco quase empata com ela.

**A tinta certa já existia neste sistema, e não é `white/N`:** é
`bg-current/N`, que `AlertAction` e `AnnouncementBarAction` usam para "ação
dentro de superfície tingida, quando o componente não sabe o tom". Dentro do
painel `currentColor` é `--sidebar-foreground` — quase-branco no escuro,
quase-preto no claro. **A tinta vira de direção sozinha, sem token novo e sem
par `dark:`.** Medido: `[250,250,250]` no escuro contra `[10,10,10]` no claro.

Os três estados eram **o mesmo** `--sidebar-accent`, com só o `font-medium`
separando o ativo. Viraram escada:

| Estado | Tinta | escuro | claro |
| --- | --- | --- | --- |
| hover | `bg-current/6` | 1,18 | 1,14 |
| pressionado | `bg-current/9` | 1,30 | 1,21 |
| ativo | `bg-current/12` | 1,43 | 1,30 |

**O critério de aceite não era o valor absoluto, era a constância.** Variação
entre os dois extremos do painel: **0,040 no escuro e 0,003 no claro**, contra
os 0,12 do opaco. E os degraus se distinguem entre si por 0,116 / 0,134 no
escuro e 0,077 / 0,085 no claro.

**O escopo é `floating`, por decisão do dono**, e a dívida fica: o mesmo
`SidebarMenuButton` passa a ter duas gramáticas de realce conforme a variante.
O argumento sistêmico para unificar — a régua do `Accordion`, *"um realce não
pode depender de uma informação que o componente não tem"* — continua de pé.

**Um acoplamento que fica escrito porque quebra calado:**
`hover:text-sidebar-accent-foreground` mexeria em `currentColor`, e portanto na
própria tinta. Verificado que nos dois temas `--sidebar-accent-foreground`
**iguala** `--sidebar-foreground`, então a tinta não se move. No dia em que um
dos dois mudar, a escada muda junto sem ninguém pedir.

#### O degradê: mesma amplitude, distribuição eased

"Mais suave" aqui não era menos delta — o dono acabara de pedir mais volume. A
rampa era linear de duas paradas: 32→20 de canal em 424px, um passo a cada
~35px, que é onde a banda de Mach aparece. Ela passou a ter cinco paradas
derivadas em `color-mix`, sem token novo, com as pontas achatadas e a mudança
no meio. Medido no computado: `0,242 → 0,237 → 0,217 → 0,197 → 0,192`, ou seja
**0,005 / 0,020 / 0,020 / 0,005** por quarto, contra os 0,0125 uniformes de uma
rampa linear. É o mesmo raciocínio que a dissolução do `Command` registrou —
*"uma ease-out sai do chapado com inclinação máxima, e descontinuidade de
derivada contra superfície lisa é o que o olho mais detecta"*.

#### O aro: mais alto e mais curto

Brilho polido é especular, não lavado. O pico subiu de 26% para **34%** e a
queda ao vale encurtou de 42% para **16%** do eixo — medido no computado:
`0,34 (0%) → 0,08 (16%) → 0,08 (80%) → 0,153 (100%)`, uma razão de **4,25×**
entre pico e vale. O vestígio da base continua sendo `color-mix(… 45%,
transparent)`, e não o token puro: com o mesmo valor nas duas pontas o aro
saía com **dois picos**, que é a costura da rodada 37.

#### Três defeitos achados no caminho

- **`SidebarMenuSkeleton` sorteava a largura com `Math.random()`** dentro de um
  `useState`. É o original do shadcn, e produzia **dez erros de hidratação numa
  página só** — o único erro de console de `/designsystem/sidebar`. A largura
  passou a sair de um hash do `useId`, que é estável entre servidor e cliente
  por contrato do React. Medido depois: duas requisições ao servidor devolvem
  `62%` e `80%`, o DOM do cliente devolve os mesmos dois, e eles continuam
  diferentes entre si — a variedade existia para a pilha não ler como tabela, e
  ela ficou.
- **A variante `outline` acendia a sombra só no cursor.** Ela tem
  `hover:shadow-[0_0_0_1px_var(--sidebar-accent)]` e nenhum par `active:`; o
  fundo estava coberto pela base do `cva`, o anel não. Quarto lugar do mesmo
  defeito nesta rodada.
- **`SidebarGroupAction` e `SidebarMenuAction` não tinham par nenhum.** Sete
  `hover:bg-sidebar-accent` contra dois `active:` no arquivo. Isto **é conserto,
  não desenho**: vale em todas as variantes, e é o único ponto da rodada que
  muda pixel em produção.

#### O ladrilho morto da página de Cores

Ela desenhava `<TokenTile token="--sidebar-primary">`, e esse token **não existe
mais** — eu o removi na rodada 35 por ter zero usos e não conferi quem o
referenciava. Regressão minha. **E ele já mentia antes disso:** nenhum
componente jamais usou `--sidebar-primary`; quem marca o item ativo sempre foi
`--sidebar-accent`, que é o ladrilho ao lado. A página mostrava dois ladrilhos
para dois estados e um deles apontava para o vazio. Ele saiu, e o vizinho passou
a dizer o que faz.

#### As duas asserções novas, e por que a 20 precisou existir

**20 — nenhum realce acende no cursor e fica inerte no dedo.** A regra **H** do
auditor varre `className="…"` e não alcança este arquivo, onde tudo mora em
`cva()` e `cn()`. É o ponto cego que o `AGENTS.md` já registra três vezes, e foi
ele que deixou a `outline` passar. A asserção varre cada string de classe e
exige o par por família (`bg` e `shadow`).

**21 — sob `floating` o realce é alfa, e não token.** Os três degraus existem,
são diferentes entre si, sobem em ordem, nenhum é `--sidebar-accent`, e todos
são escopados na variante que tem degradê.

As duas foram verificadas reintroduzindo o defeito: sem o `active:shadow-` a 20
reprova nomeando a string; com um degrau de volta a `bg-sidebar-accent` a 21
reprova. `SIDEBAR_GLASS_STATES` deixou de ser um array com `.join(" ")` e virou
uma literal única — não por gosto: a asserção 20 checa **por string de classe**,
e três literais separadas fariam cada degrau parecer um `hover:` órfão.

#### Duas lições de instrumento, e as duas são erros meus

**Meu regex de split quebrou dentro dos parênteses.** Separando as camadas do
`background-image` com `/,(?![^()]*\))/`, as vírgulas de dentro de `color-mix()`
e `radial-gradient()` caíram como separadores, e a "camada 1" virou um fragmento
do florão — reportando zero paradas numa rampa que tinha cinco. Quem separa
camadas de CSS é um contador de parênteses, nunca um regex.

**E li `oklch(0.985 0 0)` como se fosse rgb.** `getComputedStyle(...).color`
devolve a função autorada, e o meu `match(/[\d.]+/g)` transformou o quase-branco
num vermelho quase-preto — a escada inteira saiu com contraste 1,01. **Quem
converte cor é o navegador**, e a sonda passou a pintar num `<canvas>` de 1px e
ler o pixel. É a mesma correção que a rodada 29 já tinha feito para o mesmo
erro, com a mesma regex.

**E a escada não foi medida com cursor, de propósito.** O quadro de coordenadas
do painel era 800×612 contra um viewport CSS de 1132×396 — a armadilha que a
rodada 32 registra —, e a moldura de 440px não cabia na janela. O contraste de
um alfa sobre um degradê conhecido é conta, não observação: composição inline
sobre o fundo verdadeiro, que é o que o `AGENTS.md` já prescreve.

### Rodada 39 — nuvem atrás de uma frente preta

O pedido foi que a luz parecesse vir **de trás**, com a referência sendo o
cabeçalho do app — *"transparente, e só parece transparente quando há algo
passando atrás"* — e a lâmina puxando mais para o preto.

**A referência é subtrativa, e a placa era aditiva.** O cabeçalho é
`md:bg-background/60 md:backdrop-blur` (`app-header.tsx:110`): ele não pinta
nada, ele **deixa passar menos**. A placa fazia o contrário:

| | página | placa (topo → base) |
| --- | --- | --- |
| escuro | `oklch(0.145)` = rgb 10 | `0.242 → 0.192` = rgb **32 → 20** |
| claro | `oklch(0.985)` = rgb 250 | `0.978 → 0.948` = rgb 248 → 238 |

No escuro ela era **mais clara que a página em toda a extensão**. Isso é o
desenho de uma superfície levantada e iluminada de frente.

#### A primeira tentativa estava errada, e fica registrada

Eu troquei a rampa por um **radial de altura inteira** vindo de cima, chegando a
**rgb 62** no topo, e baixei o aro de 34% para 18% argumentando que "contraluz
não tem especular". As duas decisões foram reprovadas na tela, e as duas por
bons motivos:

- **A queda de altura inteira é uma lavagem.** Forte demais, branca demais, com
  o eixo à vista — lê como degradê de fundo dos anos 2000. Trocar linear por
  radial não resolve nada se o radial cobre a placa toda: o que importa não é a
  família da curva, é a **escala**. Luz que ocupa a peça inteira é fundo, não é
  luz.
- **O brilho da borda não descreve de onde vem a luz do corpo.** Ele é a aresta
  da lâmina pegando luz, e é o que faz a peça ler como **vidro** em vez de
  retângulo escuro. Baixá-lo por coerência com uma teoria sobre o corpo foi
  aplicar um raciocínio ao componente errado.

#### O modelo certo: nuvem atrás, frente preta

A frente é escura e chapada, como o cabeçalho, e o que existe são **focos de luz
difusos atrás dela**.

**A ordem das camadas é o mecanismo, e não um detalhe.** A lâmina é pintada *por
cima* das nuvens, então elas chegam ao olho filtradas por 55% de preto: 30% de
branco sobre a página dá rgb 84, e a lâmina o leva a **37** contra um corpo de
**5**. Pintadas por cima, as mesmas nuvens dariam 84 e leriam como manchas **na**
placa. **Alfa alto, resultado baixo: é a atenuação que constrói o "atrás".**

Medido na placa inteira, no escuro:

| | valor |
| --- | --- |
| corpo (mínimo · médio · máximo) | **2 · 4 · 23** |
| página | 10 |
| picos das duas nuvens | 23 (canto superior-esquerdo) · 23 (inferior-direito) |
| razão corpo↔página | 1,049 — de um teto absoluto de **1,061** |

#### "Meio cinza" não era a lâmina; era a página

O corpo esteve em 55% de preto, o que dá **rgb 5**, e ainda assim lia como
cinza. A causa não é a lâmina ser clara: **a página atrás é rgb 10**, e 5 contra
10 é imperceptível — a placa herdava a leitura de "cinza escuro" do próprio
fundo.

Isso foi verificado **empiricamente e não por conta**, porque a aritmética já
dizia rgb 5 e contradizia o que se via. Amostras de valor conhecido sobrepostas
à placa: a 55%, **0, 3, 5 e 8 somem dentro dela** e só a partir de 12 se
distingue; a 82%, **0 e 2 somem** e 5, 8 e 12 aparecem visivelmente mais claras.
A inversão de quem some é a medida.

A 82% o corpo vai a **rgb 2** — o mais escuro possível sem ser preto —, e o
limite é duro: preto puro daria 0, com a razão contra a página indo de 1,03 para
1,05 num teto de **1,061**. Não há mais para onde ir, e é exatamente por isso
que a peça é definida pelo aro e pela nuvem, e não pelo corpo.

**E o alfa da nuvem sobe junto, que não é ajuste fino.** A lâmina está *em
cima*, então escurecê-la apaga a nuvem na mesma proporção: 17% de branco atrás
de 55% de preto e 48% atrás de 82% rendem **o mesmo pico de 23**, medido. Os dois
números andam juntos, e quem mexer num sem o outro apaga a luz sem perceber.

O corpo é **mais escuro que a página na média**, que é o "puxando para o preto"
do pedido, e a luz é local em vez de ser um banho.

**São dois focos, nos cantos opostos da diagonal.** O centro de cada um fica
**no canto**, então só um quarto da elipse entra na placa, e é isso que os faz
ler como fontes que estão atrás *e fora* em vez de focos pousados sobre a
superfície. O teste proíbe centro em `50%`, porque um foco no eixo voltaria a
desenhar a rampa.

#### O foco do topo saiu e voltou, e a medição é que reenquadrou a pergunta

Ele foi removido com a régua *luz vai onde não há conteúdo* — o topo da barra é
onde vivem o seletor de workspace e o primeiro grupo de links. Com um foco só, a
base passou a ler como mais forte que o topo, e a pergunta virou "qual dos dois
igualar".

**A medição mostrou que elas já eram iguais em luz, e diferiam em tipo:**

| | pico | área | luz total |
| --- | --- | --- | --- |
| aro, canto superior-esquerdo | **94** | 1.324px² | 35,7 |
| nuvem, canto inferior-direito | 23 | **14.188px²** | 31,6 |

Razão de luz **0,9**; razão de área **10,7×**. O aro concentra a luz num fio de
1px; a nuvem espalha a mesma luz por dez vezes a área com um quarto do pico. Uma
massa difusa lê como **fonte**, um fio lê como **aresta** — e era essa diferença
de categoria, não de intensidade, que fazia a base parecer mais pesada.

Com isso na mesa, a decisão do dono foi **dar massa ao topo também**, e o custo
foi aceito explicitamente: o topo da placa deixa de ser preto plano (o corpo vai
de médio 2 para médio 4, com 23 nos dois cantos), e a luz volta a dividir espaço
com o seletor de workspace. Fica registrado como decisão tomada contra a régua,
não como a régua tendo mudado.

**Um ganho que não estava previsto:** a variação do realce ao longo do painel
voltou a **0** nos dois estados. Os dois botões medidos ficam em posições
espelhadas (7,8% e 92,2% da altura) e as nuvens são reflexo por ponto, então a
placa sob cada um mede exatamente o mesmo — 9.

**A pegada dele é o espelho por ponto da do aro**, e os dois números saem de
medir a caixa real (240×424), não de estimativa. O aro corre em 165° e chega ao
vale em 16% de um eixo de **471,7px**, ou seja 75,5px — com isso a zona clara
dele cobre **a largura toda do topo** (o canto superior-direito ainda está a
13,2%, dentro do vale) e desce **78,1px, 18,4% da altura**, pela borda esquerda.
Refletido pelo centro: a largura toda de baixo, subindo 18,4% pela borda direita.
Daí `100% 18%`, medido depois em **240×76px** contra os 240×78 do aro.

**O que não dá para espelhar é a inclinação.** `radial-gradient` **não rotaciona
os eixos da elipse** em CSS — não há sintaxe para isso. O que se iguala é a
pegada; o tombo de 15° fica só no aro, e é ele que carrega a direção da peça.

**Ele foi a três e a dois antes de ser um, e os dois cortes têm a mesma razão.**
A versão de três tinha um foco no meio da borda direita, e ele disputava com a
lista de links. A de dois era um par na diagonal, e o do canto superior-esquerdo
disputava com o seletor de workspace e o primeiro grupo de links. A régua que
sobra é **luz vai onde não há conteúdo** — a mesma que tirou a faixa diagonal na
rodada 37 —, e o canto inferior-direito é o único vão real da placa.

A cada corte o corpo ficou mais preto: máximo **36** com três focos, **33** com
dois, e agora **23** apenas no canto, com o resto plano em 5 contra uma página
de 10.

**E o alfa voltou para o token.** Enquanto eram duas, a de baixo era derivada em
`color-mix(… 55%)` para o par ler como principal + eco. Com uma só, essa conta
seria uma derivação cujo motivo não existe mais — a família "sobreviveu à
remoção" que este projeto já pagou cinco vezes. Ela foi dobrada no valor do
token (30% → 17%), e a troca é **neutra na tela**: medido, o pico continua em
23.

**Alargar produz névoa, não nuvem.** A primeira versão dos focos tinha raios de
`58%`/`66%` e virava uma neblina uniforme sem forma. Apertar o raio e subir o
alfa (22% → 30%) é o que dá contorno a cada um — e é o oposto de alargar a
lavagem, apesar de o alfa subir.

#### A lâmina puxa para o chão do **próprio tema**, e não para o preto

A leitura ingênua de "puxando mais para o preto" — preto com alfa nos dois temas
— introduziria no claro um cinza que ele **não tem em lugar nenhum**. Medido: o
tema claro é inteiramente acromático (croma 0 em `--background`, `--card`,
`--muted`, `--border`, `--sidebar`) e a página é `oklch(0.985)`, com o branco de
verdade morando no `--card` e no `--popover`.

A regra: **a lâmina afunda um passo além da página, na direção do chão daquele
tema.** No escuro esse chão é o preto; no claro é a família neutra própria dele.
É a mecânica de `--secondary-hover`, que puxa a base na direção do próprio
contato em vez de usar um alfa único para os dois.

#### O eixo do aro voltou a se inclinar, e isso reverte a rodada 37

Ela tirou o aro de **158°** e o pôs em **180°**, com o argumento — registrado
aqui — de que *"numa coluna alta e estreita a luz que convence vem de cima,
reta"*. Hoje ele está em **165° no escuro**, e a reversão é legítima porque **a
peça mudou**, não o gosto.

Na rodada 37 o corpo era uma superfície iluminada de frente, com uma **rampa
vertical** descendo a placa inteira. Um aro diagonal brigava com esse eixo, e
tirá-lo foi certo. Hoje o corpo é preto plano e a única luz mora num canto: não
há eixo vertical com que concordar, e o aro reto passou a ser a única coisa
simétrica numa peça que não é.

**A conta na caixa real** (240×424): a 165° o eixo tomba 15° da vertical, e a
projeção horizontal é **13,2% do comprimento do gradiente**. Como o vale do aro
começa em 16%, na aresta de cima a esquerda fica no **pico (0%)** e a direita já
chega a 13,2% — quase no vale. O brilho se concentra no canto superior-esquerdo
em vez de correr a largura toda.

**E o ângulo é um token, porque vale só no escuro.** `--sidebar-rim-angle` é
165° no `.dark` e 180° no `:root` — inclinar concentra brilho, e no tema claro
não há brilho para concentrar (o aro ali é sombra, a 12%). É o mecanismo de
`--toolbar-control` e `--command-list-max-h`: variável herda e não disputa, e um
número na receita não teria como diferir por tema sem um `dark:` dentro do
componente.

As duas asserções que trancavam o eixo reto mudaram junto, e é o tipo de coisa
que precisa ser dita: **elas codificavam a decisão da rodada 37, não uma
invariante do sistema.** Hoje a 19 exige que o eixo venha de token (nenhum
`deg` literal na receita), que o claro seja 180 e que o escuro tombe sem virar
diagonal de 45°; e o guarda da 22 contra a lavagem deixou de contar `180deg` e
passou a exigir que **um único** gradiente carregue eixo, e que ele feche em
`border-box` — ou seja, que a direção viva no fio de 1px e não no corpo.

#### O claro passou a ser a mesma especificação do escuro, com a polaridade virada

O pedido foi *"use as mesmas especificações do dark no light, porém tentando
deixá-lo mais claro"*, com dois pontos: **a barra não pode ficar mais escura** e
o brilho tem de ser maior.

**Copiar as cores não é traduzir; copiar a estrutura é.** O que o escuro faz:

| | escuro | claro, traduzido |
| --- | --- | --- |
| lâmina | preto 82% → rgb **2**, razão 1,049 da página | branco 92% → rgb **255**, razão **1,040** |
| direção | afasta-se da página **para baixo** | afasta-se **para cima** |
| eixo do aro | 165° | **345°** — o mesmo eixo, girado 180° |
| pico do aro | luz, no canto superior-esquerdo | sombra, no canto **oposto** |

A mesma distância da página, no único sentido que cada tema tem. A versão
anterior punha a lâmina em 244, **abaixo** da página, e isso fazia a navegação
recuar num tema em que ela deve avançar. Hoje ela é o branco de verdade — o
mesmo `oklch(1 0 0)` do `--card` —, então a barra flutuante lê como cartão, que
é como este sistema já apresenta superfície elevada no claro.

**O eixo é um só, e o teste tranca isso.** 345° é 165° pela outra ponta: a
geometria é idêntica e só a polaridade inverte, porque sombra de uma placa acesa
por cima-à-esquerda mora no canto oposto ao brilho. A asserção deixou de fixar
`180` no claro e passou a exigir `claro === (escuro + 180) % 360` — com dois
valores soltos, os dois biséis podiam apontar para direções diferentes sem
ninguém perceber. Medido: sombra de **1,51** no canto inferior-direito,
dissolvendo para 1,22 no superior-esquerdo.

**E o "shine maior" tem um teto que não é do desenho.** A página clara é rgb
**250 de 255**, e a lâmina já a levou a 255: não sobra **nenhuma** unidade acima
do corpo. Um realce precisa de espaço acima, e o corpo não pode descer — descer
é justamente o que este tema não deve fazer. As nuvens ficam declaradas em
branco opaco e não registram, e isso está escrito no token com a saída: **quem
quiser luz de verdade no claro precisa baixar `--background`** (de `oklch(0.985)`
para algo como `0.96`), o que é decisão de sistema porque atinge toda tela.

#### O tema claro é quieto, e o erro nele era de magnitude

A gramática se inverte — no escuro o aro é brilho branco, no claro é sombra —, e
isso é a física que as rodadas 36 e 37 já mediram: sobre uma página quase branca
não há para onde clarear. **O que estava errado não era a direção, era a
magnitude.** O aro claro estava em 40% de preto, que compõe para rgb 150 contra
uma página de 250 e dá razão **2,84**: um traço duro, não a aresta de uma placa
de vidro — e lia como "luz escura" ao lado do brilho do tema escuro.

| | antes | depois | referência |
| --- | --- | --- | --- |
| aro claro | 40% → rgb 150 → **2,84** | 12% → rgb 220 → **1,32** | `--sidebar-border` = 1,29 |
| corpo claro | 242, razão 1,075 | 244, razão **1,05** | — |

Ele agora tem praticamente o peso da própria borda do sistema, que é o que uma
placa deve ter num tema em que ela não pode brilhar.

**E as nuvens não registram no claro — por aritmética, não por timidez.** A
página é rgb **250 de 255**: existem cinco unidades entre ela e o branco puro, e
a lâmina por cima consome parte disso. Medido com a nuvem em branco **opaco**, o
teto é ~2 unidades. "Luzes brancas atrás" é um efeito que só o tema escuro
comporta, e ele fica declarado do mesmo jeito para a receita ser uma só — quem
define a placa no claro é o corpo (1,05) com o aro (1,32).

#### O par de identidade sumia no claro, e agora ele inverte

Os avatares do workspace e da conta, medidos sobre a placa flutuante:

| | superfície | tinta sobre superfície | **superfície sobre a placa** |
| --- | --- | --- | --- |
| escuro | `[46,55,45]` | 6,37 | **1,65** |
| claro, antes | `[230,235,229]` | 6,73 | **1,10** |
| claro, depois | `[68,120,56]` | 5,14 | **4,79** |

No claro a pastilha **sumia**: sobrava a letra escura flutuando sozinha, sem
chip. A causa é que `--identity-N-surface` era `color-mix(… 12%, var(--card))`,
calibrado contra `--card` (255) — sobre a placa flutuante (244) ele perde metade
da separação.

**A saída foi inverter o par no tema claro**: a superfície passa a ser a cor e a
tinta passa a ser quase branca, que é como um avatar preenchido se comporta em
toda interface clara. O escuro fica como estava. `--identity-N` é a tinta e
`--identity-N-surface` é a pastilha **nos dois temas** — os nomes já descreviam
o papel, e é o papel que se inverte, não o nome.

A alternativa era só empurrar a mistura (12% → ~28%), e ela foi medida: dá
**1,28** contra a placa. Melhor que 1,10 e ainda tímido, além de caminhar para
um cinza sujo.

**E a inversão tem um custo, que fica dito.** Não existe mais um token único que
seja "o matiz" nos dois temas: no escuro ele é `--identity-N`, no claro é
`--identity-N-surface`. A página de Cores tinha uma rampa **"Os matizes"**
apontando para o primeiro, e ela passou a sair como **seis barras brancas** no
claro. Um espécime que só funciona num tema é pior que espécime nenhum, então
ela saiu — os discos acima dela já mostram as seis identidades como elas de fato
renderizam.

**O `ColorTile` divergiu de propósito.** O comentário dele afirmava ter "as
mesmas proporções de `--identity-N-surface`", e isso deixou de ser verdade. A
divergência é correta pela régua que o próprio arquivo escreve: o ladrilho
carrega uma cor **de runtime**, escolhida pela pessoa e vinda do banco, e não
pode virar uma pastilha preenchida numa cor que ninguém calibrou. O avatar
carrega uma das seis identidades do sistema.

Blast radius: **9 arquivos de produção**, todos avatar. Verificado antes de
mexer que `text-identity-N` nunca aparece fora do par com
`bg-identity-N-surface`, e que `--identity-N` só é referenciado no `@theme` e na
própria mistura — o que torna a troca de papéis segura.

#### A escada de realce voltou sozinha para dentro do critério

`bg-current/6·9·12` não mudou. O que mudou foi a superfície: com a lavagem, a
placa ia de rgb 47 a rgb 7 e a variação do realce ao longo do painel era
**0,09 / 0,12 / 0,15** — fora do teto de 0,05 que a rodada 38 fixou. Com o corpo
uniforme e a luz **nos cantos**, ela é **0** — os botões vivem no eixo central,
e nuvem de canto não o alcança. No claro também é 0.

O ponto fraco continua sendo medido de duas formas, porque uma engana:

| | placa | razão WCAG | salto de luminância |
| --- | --- | --- | --- |
| workspace | 5 | 1,102 | **4,84×** |
| conta | 5 | 1,102 | **4,84×** |

**Perto do preto a razão WCAG comprime**, porque o `+0,05` do denominador
domina. O defeito que a rodada 38 consertou era 1,09 com salto de **1,4×** —
quase invisível. Aqui 1,10 é um salto de 4,84×.

#### Duas lições de instrumento, e as duas são erros meus

**O preâmbulo de geometria de um radial não é uma parada de cor.**
`radial-gradient(140% 105% at 50% -8%, …)` termina o primeiro token em `-8%`, e
o regex `/([\d.]+)%\s*$/` casou nele — a sonda tratou a geometria como "uma cor
na posição 8%", e **o radial contribuía zero em todas as medições**. O sintoma
foi uma queda de 30 pontos de canal num quarto de painel que a captura não
mostrava; a captura estava certa e a sonda não.

**E uma camada `border-box` não pinta o corpo.** Medindo a placa em 2D, eu
compus o aro — 34% de branco — sobre a área inteira, e o corpo saiu com mínimo
15 onde ele é 5. Quem diz qual camada é qual é `background-clip`, que o
computado publica por camada e que a sonda ignorava.

São a terceira e a quarta leitura errada desta série pelo mesmo motivo — antes
foram as vírgulas dentro de `color-mix()` e o `oklch()` lido como `rgb()`. A
regra que as quatro desenham: **um regex não parseia CSS.** Quem separa camadas
é um contador de parênteses, quem converte cor é o navegador, quem diz onde uma
camada pinta é o `background-clip`, e um preâmbulo de função precisa ser
reconhecido antes de qualquer coisa ser lida como valor.

E o que salva é sempre a mesma coisa: **um ponto de controle previsível** — a
sonda calcula a placa onde as camadas de luz são transparentes e compara com
lâmina-sobre-página, que se computa sem gradiente nenhum.

#### As duas asserções

**18 ganhou um piso, e ele nasceu invertido.** A primeira versão desta rodada
escreveu um **teto** de 20% no aro, codificando a inferência errada de que
contraluz não tem especular. Hoje é um **piso de 28%**: sem o brilho a peça vira
um retângulo escuro.

**22 tranca o modelo:** no escuro a lâmina é preto com alfa, no claro a
claridade dela é > 0,8 (o guarda é o valor, não a ausência do literal); as
nuvens são brancas nos dois; **a lâmina é declarada antes delas**, que é o que
as põe atrás; há pelo menos dois focos e **nenhum com centro em 50%**; existe um
único gradiente com ângulo e ele é o aro, no `border-box`; e os quatro tokens de
desenhos anteriores — `--sidebar-surface-top`, `-bottom`, `--sidebar-bloom`,
`--sidebar-backlight` — não voltaram pela porta dos fundos.

Verificadas reintroduzindo três defeitos: o aro sem brilho, a lâmina indo para
baixo das nuvens, e a lavagem vertical de volta.

`variant="sidebar"` e `variant="inset"` seguem em `oklch(0.205)` chapado, sem
gradiente — a `@utility` é escopada em `floating`, que **nenhuma tela do app
usa**, então esta rodada não muda pixel em produção.

### Rodada 40 — o vidro sai da barra

As rodadas 36 a 39 construíram uma superfície de vidro **dentro** da barra
lateral: a receita numa `@utility sidebar-glass`, cinco tokens `--sidebar-*`, e a
geometria calibrada contra uma caixa de 240×424. Ela virou peça.

**O achado que enquadrou a rodada: já existiam dois vidros, e nenhum sabia do
outro.**

| | `.mobile-glass-surface` | o pintado (agora `glass`) |
| --- | --- | --- |
| técnica | `backdrop-filter: blur(24px) saturate(1.5)` | pintado, sem blur |
| premissa | **há** conteúdo passando por baixo | **não há** nada atrás |
| fallback | `prefers-reduced-transparency` — o único do repo | não se aplica |
| consumidores | 4, todos no telefone | 1 |

A régua de escolha passou a estar escrita nos dois lugares, e é pela premissa:
borrar cor chapada não desenha nada, e pintar luz onde há conteúdo real atrás
seria inventar o que já existe. A fusão fica no backlog.

#### Três camadas, e o componente é a de cima

É o modelo que o `scroll-fade` registra — *"ele é conveniência, não a
primitiva"*:

| Camada | Onde | Dona de |
| --- | --- | --- |
| CSS | `@utility glass` + `glass-control` | a matemática das quatro camadas e o contrato de variáveis |
| Gramática | [`lib/glass-classes.ts`](../../src/lib/glass-classes.ts) | as composições nomeadas e as três armadilhas |
| Componente | [`ui/glass.tsx`](../../src/components/ui/glass.tsx) | `asChild` para vestir uma peça, ou uma casca quando ninguém é dono dela |

Sem hook: ao contrário do `scroll-fade`, o vidro não mede nada em runtime.

**Os cinco tokens foram renomeados** de `--sidebar-*` para `--glass-*`. Manter os
dois nomes seria a mesma *"duas receitas para a mesma borda"* que a rodada 36
removeu. Custo: 14 referências em `sidebar-ladder.test.ts`, nas asserções 18, 19
e 22.

**A extração é renomeação, e foi medida como tal.** Depois: corpo **2**, pico da
nuvem **23**, pico do aro **94**, ângulo **165deg**, quatro gradientes — os
mesmos números de antes, na mesma caixa de 240×424.

#### As três armadilhas de vestir vidro numa peça existente

As três foram medidas, e as três estão escritas na régua porque quem vestir a
peça vai bater nelas:

1. **O shorthand `background` apaga o `background-color`.** Medido: o
   `bg-sidebar` que continuava na string do miolo resolve `rgba(0,0,0,0)` sob a
   utility. Vestir vidro **substitui** o preenchimento; não soma.
2. **`border: 1px solid transparent` toma a borda**, porque o aro é pintado no
   `border-box`. Com `box-sizing: border-box` a caixa não cresce — o conteúdo
   encolhe 2px, e num controle com filho absoluto calibrado isso desloca 1px.
3. **O raio é herdado, e é isso que torna a peça portátil.** A utility não
   declara `border-radius`. Medido nos espécimes: 14px num `rounded-xl` e o
   valor de `rounded-full` num controle, sem eixo nenhum.

#### O eixo `size`, e a única razão de ele existir

**Porcentagem escala; percepção não.** A nuvem é `100% 18%` — numa placa de
424px são 76px de luz difusa, e num controle de 32px são **5,7px**, que lê como
aresta dura. A fração óptica é idêntica e o resultado não é.

O preset move **só a variável**, e nunca a propriedade: `glass` lê
`var(--glass-cloud-ry, 18%)` e não a declara em lugar nenhum; `glass-control`
declara. Duas utilities escrevendo `background` seriam decididas por ordem de
emissão do Tailwind e não pelo que se escreveu.

#### `asChild` só funciona se o filho repassar props, e o defeito é calado

O `Slot` entrega `className`; quem a aplica no elemento certo é o filho. Um
componente que aceita só `children` recebe a classe e a descarta — **nada
quebra, a peça simplesmente sai sem vidro**. Aconteceu na primeira escrita da
página do catálogo: quatro espécimes declarados, três com vidro, e a sonda que
contou `[data-slot=glass]` foi o que pegou.

Verificado que o `AppThemeToggle` repassa nos dois ramos, então
`<Glass asChild><AppThemeToggle /></Glass>` funciona. E o `data-slot` do filho
**vence** o da peça — dentro do `Glass` o toggle continua se anunciando como
`app-theme-toggle`, que é o nome certo: ali aquilo é um toggle que por acaso está
de vidro.

#### Dois erros meus, os dois pegos pela verificação seguinte

**Escrevi a classe montada em runtime.** `` `group-data-[variant=floating]:${glassSurfaceClassName}` ``
— o Tailwind varre o código como **texto**, e um nome interpolado nunca chega ao
CSS. É a regra que este arquivo já registra três vezes, e ela pegou a mesma
pessoa que a escreveu, pela quarta. A classe é literal, e a asserção 10 do teste
novo tranca que a régua não interpole.

**Deixei um export morto com um consumidor inventado.** `GLASS_SURFACES` era um
mapa `{ panel, control }` com um comentário dizendo que o catálogo iterava a
régua com ele — e o catálogo não iterava. Ele saiu; o eixo mora no `cva` de
`glass.tsx`, que é onde `cva` pode morar (a regra A2 do auditor o reprova fora
de `components/ui/`), e é o que faz o `ds:catalog` reportar
`size: panel | control` em vez de `—`.

#### O tema claro não tinha lado aceso, e isso era o defeito

Relatado como *"o glass no light mode não está com shiny"*, e a medição nomeou a
causa: **os quatro cantos do aro saíam abaixo da placa** — 210, 232, 232 e 235
contra 255. Um contorno, não um bisel.

A raiz é que o extremo `100%` do aro era **derivado do pico**:
`color-mix(--glass-rim 45%, transparent)`. Isso vale enquanto os dois extremos
são da mesma natureza — e no escuro são, os dois são luz. **No claro não são**:
ali o pico é sombra, e derivado o outro extremo só podia ser uma sombra mais
fraca. Não havia como o aro passar acima da placa.

`--glass-rim-far` virou token próprio, e a lâmina clara cedeu três unidades:

| | antes | depois |
| --- | --- | --- |
| lâmina | 255 (o teto) | **252** — ainda acima da página, em 250 |
| canto superior-esquerdo | 235, abaixo da placa | **255, acima dela** |
| canto inferior-direito | 210 | 205 |
| amplitude do bisel | 25 | **50** |
| realce ↔ sombra | — | **1,591** |

**O realce sozinho é fraco (1,027 contra a placa), e não é ele que lê — é o
par.** Num tema em que a página é rgb 250 de 255, cada lado do bisel mal se
separa da placa; o que o olho usa é a amplitude entre eles.

No escuro nada mudou: `oklch(1 0 0 / 15%)` reproduz os 45% de 34% que o derivado
valia, e a medição depois devolveu corpo **2**, aro **94**, vestígio **47**.

**A lição de forma:** derivar um extremo do outro é correto quando os dois são a
mesma coisa em intensidades diferentes, e vira armadilha quando eles trocam de
natureza entre temas. É a mesma família do `--secondary-hover` — um valor único
não serve os dois lados quando a direção que lê se inverte.

#### A peça é Átomo, e a página é o inventário

`glass.tsx` importa zero componentes de `ui/` e renderiza um elemento — o mesmo
caso do `scroll-fade`. As quatro camadas de `background` são anatomia interna,
não peças que alguém compõe de fora.

`/designsystem/glass` é onde o histórico desta série virou documentação: a ordem
das camadas e por que ela é o mecanismo, a inversão de polaridade entre os temas
com as duas razões (1,049 e 1,040), o eixo do aro girado 180°, a pegada das
nuvens espelhada da do aro, as três armadilhas, e **as versões rejeitadas** — a
lavagem de altura inteira, o aro sem brilho, os três focos, a placa clara em 244.

### Rodada 41 — as versões de vidro, e o que a cor custa

Quatro peças novas — `GlassButton`, `GlassBadge`, `GlassAvatar`,
`GlassCheckbox` —, cada uma em arquivo próprio.

**O que as define não é a superfície, é a tradução de cor.** O vidro apaga o
`background-color` de quem o veste (armadilha nº 1 da régua), e isso colide com
o eixo de cor dos quatro: um botão `primary` perderia o verde, um badge perderia
os sete tons, um checkbox marcado ficaria igual ao desmarcado. A saída é o tom
migrar para **`--glass-tone`**, uma camada nova acima da lâmina.

É o mecanismo do `ColorTile`, que já deriva superfície e tinta de uma cor com
percentual por tema — não foi preciso inventar nada. E a cor vem dos pares
`-muted` que já existem: `bg-{tom}-muted` com `text-{tom}-muted-foreground` é o
que o `Badge soft` usa, e o par já é calibrado nos dois temas.

#### O achado que obrigou uma segunda camada: `hover:bg-*` falha calado sobre vidro

As classes de estado declaram **só `background-color`**, então o shorthand da
utility **não as apaga** — elas passam a pintar *atrás* das quatro camadas de
gradiente, e com a lâmina a 82% o realce simplesmente não aparece. Nada quebra,
nada avisa.

Daí `--glass-sheen`, a camada mais de cima. Ela é **branca neutra e não o tom**,
e é isso que faz **uma** variável servir os sete tons e os dois temas: realce
sobre vidro é o material pegando mais luz, não mudando de cor. As `hover:bg-*`
das bases são anuladas com `hover:bg-transparent` — escrito como classe para o
`twMerge` **remover**, e não para disputar por ordem de emissão.

#### As quatro, e o que cada uma custou

| | o problema | a saída |
| --- | --- | --- |
| **Button** | a hierarquia é preenchimento | vira tom; texto **5,24 a 13,14** nos dois temas |
| **Badge** | 14–22px de altura | a nuvem não cabe; **quem carrega é o aro** |
| **Avatar** | o vidro não tinha onde morar | a identidade vira tom, o fallback fica transparente |
| **Checkbox** | 16px, e o marcado pinta em três propriedades | tom + contorno; o vidro quase não lê |

**Um botão de vidro `primary` não é um botão verde.** É uma lâmina verde
translúcida com tinta verde — escura no claro, clara no escuro; mais perto de um
`Badge soft` que de um `Button primary`. Isso é consequência e não escolha:
sobre lâmina translúcida não há preenchimento para o texto branco parear. **Vidro
é um peso próprio**, e uma tela continua tendo um `primary` só.

**O `Avatar` era o caso sem saída, e os dois caminhos óbvios falham.** Medido: a
raiz não pinta fundo nenhum e o `AvatarFallback` é `h-full w-full` **opaco**.
Vidro na raiz fica escondido; vidro no fallback apaga a identidade. O terceiro
caminho — superfície de identidade translúcida — está **rejeitado por escrito**
no sistema, porque avatares empilhados mostrariam o de baixo. A tradução resolve,
e a objeção não se aplica **porque a peça é separada**: o `GlassAvatar` é opt-in
e o `Avatar` segue opaco. Custo medido: a foto encolhe 2px, que é onde o aro mora.

**O `Checkbox` é a que menos se paga, e o número está na página.** A nuvem do
preset `control` dá 11px numa caixa de 16, e a zona clara do aro, 3px. Medido:
`placaVsPagina` **1,02** na desmarcada — o vidro em si quase não existe nessa
escala, e quem torna o estado legível é o contorno (7,34 contra a página) com o
tique (10,63 sobre a lâmina).

#### A tensão da forma fica registrada

Cada uma importa **um** componente de `ui/` e renderiza **um** elemento — a
mesma estrutura de `MoneyInput` e `KbdShortcut`, que este projeto **absorveu
como `prop`** por serem *o átomo com outro nome, cobrando do catálogo uma
segunda página*. O que as mantém do lado certo é a tradução de cor, que é
anatomia. **A asserção 13 tranca exatamente isso**: se alguma virar só
`<Glass asChild><Base /></Glass>`, o teste reprova — e a pergunta certa volta a
ser "componente ou modo?".

São **Átomos** pela régua ("especializar um átomo continua átomo"), e o
`ds:catalog` reporta `—` na coluna de variantes das quatro: o eixo delas é
`tone`, que é `prop` e não `cva`.

#### Três erros meus, e os três pegos pelos próprios testes

**A asserção 10 pegou um helper que eu escrevi.** Pus em `glass-classes.ts` um
`tomEm(cor, claro, escuro)` que montava a string por interpolação, com um
comentário dizendo que era "só documentação da forma". O teste reprovou, e com
razão: um helper desses é um convite a alguém usá-lo, e aí as classes somem do
CSS sem nada quebrar. **Quinta vez** que este projeto paga essa medição.

**A asserção 13 testou o comentário, não o código** — na primeira escrita. Com a
tradução removida do `GlassButton` ela **passava**, porque o doc-comment da peça
cita `--glass-tone` por extenso. É a mesma lição que a rodada 40 já tinha
registrado, uma rodada depois.

**E medi o tema claro em estado misto.** Trocar a classe do `<html>` à mão não
segura: o `next-themes` reverte, e a leitura saiu com a página já clara e os
tokens do botão ainda escuros — texto a **1,17**, que eu quase reportei como
reprovação. Fixando o tema no `localStorage` e recarregando: **5,24 a 11,04**.
Tema se troca pelo mecanismo do app, nunca pela classe.

### Rodada 42 — a primeira cor de runtime

As quatro peças de vidro da rodada 41 traduzem **token**: o tom de cada uma é
uma linha de `GLASS_TONES` ou de `GLASS_IDENTITY_TONES`, escrita por extenso na
régua. O `ColorTile` é o próximo caso e o primeiro em que **a cor vem do banco**
— `categories.color`, `bills.color`, a marca de um workspace —, então não há
tabela que a preveja. `GlassColorTile` lê a `--tile-color` que o próprio
`ColorTile` já publica no `style`.

A forma é a da `GlassCheckbox` — duas classes **literais** com `--glass-tone`
dentro —, e o motivo é o mesmo de sempre: o Tailwind varre o código como texto,
e um percentual interpolado num `color-mix` nunca chegaria ao CSS.

#### As três camadas do ladrilho se comportam de três jeitos

O `ColorTile` deriva véu, tinta e fio da mesma variável. Sob o vidro:

| camada | o que acontece | o que se escreve |
| --- | --- | --- |
| véu (`bg-[color-mix…]`) | o shorthand `background` da utility o apagaria calado | `bg-transparent dark:bg-transparent` |
| tinta (`oklch(from … 0.42 c h)`) | **atravessa intacta** | nada |
| fio (`ring-1` na cor) | vira a segunda aresta ao lado do aro | `ring-0 ring-transparent dark:ring-transparent` |

**A tinta atravessar é o que faz a peça ser um embrulho de 20 linhas em vez de
uma reescrita.** Ela fixa a claridade e deixa só matiz e croma virem da pessoa;
a lâmina clara é quase branca (rgb 252 sobre o cartão) e a escura quase preta
(rgb 4), então 0,42 e 0,78 continuam do lado certo dos dois.

**O fio custa três classes, e a contagem foi medida no `twMerge`.** `ring-0`
derruba só a **largura**: sem `ring-transparent dark:ring-transparent`, as duas
classes de **cor** ficam na lista sem pintar nada — a classe morta que este
projeto caça. Verificado no DOM depois: `background-color` transparente, `border`
1px transparente (onde o aro mora) e `box-shadow` com as cinco entradas em
largura zero.

E ele sai por **doutrina**, não por gosto: a régua diz que **o tom não tinge o
aro** — um aro colorido faz a peça ler como plástico pintado — e um `ring`
colorido ao lado do aro é a segunda receita para a mesma borda, que a rodada 36
removeu da barra.

#### Os dois percentuais, e o critério que os escolheu

O véu chapado é 12% no claro e 18% no escuro, **opaco sobre `--card`**. Aqui o
tom é translúcido sobre a lâmina, e a lâmina escura (`oklch(0 0 0 / 82%)`) é bem
mais escura que o cartão — com um percentual só, o ladrilho sairia mais apagado
num tema que no outro.

Varredura com os **dez presets** de `CATEGORY_COLORS` mais os três extremos da
paleta livre, compondo tom sobre lâmina sobre cartão num `canvas` de 1px. O que
se minimiza **não é o contraste**, é o **desvio contra o véu do ladrilho
chapado** — os dois precisam ler como a mesma família:

| | escolhido | desvio médio | tinta, pior caso |
| --- | --- | --- | --- |
| claro | **10%** | 0,011 (12% dá 0,033) | 6,48 — chapado 6,55 |
| escuro | **26%** | 0,086 (18% dá 0,146) | 4,78 — chapado 5,09 |

Os dois ficam bem acima dos 3:1 da WCAG 1.4.11, que é a norma de que este
componente já saiu reprovando em 4 dos 10 presets. No escuro o teto é a tinta:
35% ainda dá 3,33 e **40% reprova, com 2,78**.

**E um caso o vidro conserta.** Um `#111827` quase preto no tema escuro dá
**1,00** contra o cartão no ladrilho chapado — véu perfeitamente invisível, e só
o fio o salvava. Sob vidro ele dá 1,12, porque a lâmina afunda a base antes de o
tom entrar. É a única das treze cores em que as duas superfícies discordam a
favor desta.

#### O que a asserção 13 passou a exigir

Ela ganhou o quinto nome e uma cláusula própria: o fonte do `GlassColorTile`
precisa conter `bg-transparent dark:bg-transparent` **e** `ring-0
ring-transparent dark:ring-transparent`. Nenhum dos dois quebra nada visível de
imediato — o véu morto e o fio duplo são exatamente o perfil de defeito calado
que aquele arquivo existe para pegar.

#### Isto não é o verniz que o ladrilho perdeu

A página do `ColorTile` registra que ele **já teve** degradê branco na diagonal,
borda clara, sombra e um `backdrop-blur`, e que os quatro saíram porque *o resto
do sistema preenche chapado*. O argumento continua válido, e é ele que mantém o
`ColorTile` como o padrão.

O que mudou não foi o gosto: **o sistema passou a ter uma receita de vidro só**,
medida e trancada por teste. Aquilo eram quatro camadas escritas à mão num
arquivo; isto é a mesma `@utility glass` que a barra flutuante e as outras
quatro peças vestem.

#### O que não foi feito, com o motivo

- **Nenhuma das 8 chamadas do app migrou**, por decisão. Zero pixel alterado em
  produção, como as outras quatro peças de vidro nasceram. O candidato mais
  honesto é `category-detail-hero.tsx`, que tem dois ladrilhos `sm` no topo de
  uma tela e nenhuma lista em volta para desalinhar.
- **A regra G acusa a página**, e é o falso positivo já nomeado: a heurística
  "sem classe de tamanho = `size-4`" não enxerga que `size="lg"` aplica
  `size-5`. A página do `ColorTile` carrega os mesmos dois achados, e o par
  `20/solid` a 20px está certo.
- **Sem eixo novo.** `size` e `color` passam direto, e o raio é herdado — a
  utility não declara `border-radius`, que é o que torna a peça portátil. O
  `ds:catalog` reporta `—` na coluna de variantes, como nas outras quatro.


### Rodada 43 — o vidro vira modo, e a rodada 41 se inverte

A 41 criou quatro peças de vidro e a 42 acrescentou a quinta. A pergunta que as
julgava estava escrita no `registry.ts` desde o primeiro dia: *"no dia em que
virarem só uma classe a mais, a pergunta certa é «componente ou modo?»"*. A
resposta chegou — **as cinco viraram o eixo `glass` dos próprios átomos**, e os
cinco arquivos, as cinco entradas e as cinco páginas saíram.

É a terceira absorção desta base, pelo mesmo motivo das duas anteriores
(`MoneyInput` → `<Input money>`, `KbdShortcut` → `<Kbd keys>`): **um
especializador que importa um componente e renderiza um elemento é o átomo com
outro nome**, cobrando do catálogo uma segunda página.

**A régua que sobra**, e que é a correção da tese da 41: o que decide
"componente ou modo?" **não é haver tradução de cor** — a 41 argumentou que a
tradução era anatomia, e ela é. É a tradução **precisar de uma peça para
existir**. Aqui ela cabia num eixo.

#### E como eixo ela ficou melhor — três defeitos que a forma antiga escondia

Não é arrumação. Um embrulho empilha classes por fora e conta com o `twMerge`
para apagar o que a base emitiu; isso funciona quando a base emite uma utility
**conflitante**, e falha calado quando não emite.

- **O `GlassBadge` deixava uma classe morta viva.** Ele renderizava um `Badge`
  com o `variant` padrão, cuja linha de `compoundVariants` traz
  `bg-primary-muted text-primary-muted-foreground hover:bg-primary-muted/80`, e
  anulava **só o `hover:`**. O `bg-primary-muted` continuava na lista e perdia
  calado para o shorthand `background` da utility — a armadilha 1 da régua,
  dentro da peça de vidro. Medido no DOM depois: as classes de um
  `<Badge glass>` são a base, a superfície, o degrau, o tom e a tinta, e mais
  nada.
- **O `GlassButton` podia ser quebrado por quem o chamasse.** O
  `variant="tertiary"` vinha escrito **antes** do espalhamento, então um
  `variant="primary"` do consumidor desfazia a tradução sem aviso. Hoje
  `variant?: never` fecha a porta no tipo.
- **O `GlassAvatar` prometia o que não entregava.** O JSDoc dizia que `seed` era
  *"o mesmo argumento de `identityToneFor`"*, e não era: aquela função recebe
  duas **strings** e faz hash, enquanto ali era um `number` com módulo. As duas
  não davam a mesma cor para a mesma pessoa. O prop virou `identity`, e o nome
  passou a dizer o que ele é — o índice de `IDENTITY_TONES`.

#### A régua da absorção: o que o vidro apagaria não é anulado, é não escrito

O eixo entra no `cva` como variante booleana, e **o que a superfície de vidro
precisaria desfazer passa a ser condicional a ele**. Medido no DOM das quatro
páginas:

| | como fica condicional | neutralizadores |
| --- | --- | --- |
| `Badge` | as 14 linhas de tom ganham `glass: false`; 7 novas com `glass: true` | **0** |
| `ColorTile` | véu e fio saem da base do `cva` para o ramo `glass: false` | **0** |
| `Checkbox` | os dois ramos são exclusivos (não há `cva` no arquivo) | **0** |
| `Avatar` | contexto, para o `AvatarFallback` | **0** |
| `Button` | eixo `tone` novo + compostos sob `glass: true` | **7** |

**O `Button` é a exceção, e o motivo é honesto**: por dentro o modo apoia-se em
`tertiary`, que é base de verdade, e o realce cinza dele precisa sair para o
`--glass-sheen` entrar. Sete classes, removidas da lista pelo `twMerge` e não
disputadas por ordem de emissão.

**O `Avatar` precisou de contexto, e não de seletor.** A superfície opaca mora
no `AvatarFallback`, não na raiz, e um `in-data-glass:bg-transparent` compila
com `:where()` — que **não soma especificidade** — e perderia para o `bg-muted`
declarado no próprio elemento. É a armadilha que o `DescriptionList` já pagou. O
mecanismo é o do `Field`/`FieldControl`, e sai de graça porque o `Avatar` já é
módulo cliente.

#### A união colapsa nos wrappers, e o `FormInput` já tinha escrito isso

Fechar `variant` no ramo de vidro do `Button` torna as props uma união
discriminada — e **11 wrappers de `ui/` quebraram de uma vez**
(`AlertAction`, `AlertDialogAction`, `AnnouncementBarAction`, `DialogClose`, o
gatilho do `Combobox`, a seta do `Carousel`, o `SidebarTrigger` e outros), todos
com a mesma mensagem: `Type '"tertiary"' is not assignable to type 'undefined'`.

A causa está escrita em `form.tsx` desde a rodada do dinheiro: desestruturar o
rest de uma **interseção com união aninhada** colapsa os ramos num objeto
atribuível a nenhum. A saída é a de lá — **fixar o wrapper num ramo**, como
`InputGroupInput` e `SidebarInput` fazem com `InputBaseProps`. Os 11 passaram a
usar `ButtonSolidProps`, e nenhum deles quer vidro.

#### Duas limpezas que apareceram no caminho

- **`soft: "border-transparent"` no `Badge` era a mesma classe duas vezes** — a
  base do `cva` já declara `border border-transparent`. E ela vazava para o
  modo de vidro, porque `defaultVariants` aplica `soft` sempre que `variant`
  chega `undefined`, o que no ramo de vidro é sempre.
- **O `aria-expanded:bg-muted` do `tertiary` sobrevivia no botão de vidro**, e é
  exatamente a dead class que esta rodada tirou do `Badge`: num gatilho de menu
  aberto ele pintaria atrás das camadas e morreria calado. Medido depois: zero
  `bg-muted` nos sete botões de vidro da página.
- **A `PropsTable` do `Badge` documentava o eixo antigo** — `variant` com os sete
  tons dentro e um `size="default"` que já tinha saído do tipo. Estava assim
  desde a rodada que separou `variant` de `tone`.

#### O catálogo, e o que o teste passou a trancar

Cinco páginas saíram e o conteúdo delas dobrou nas páginas-base, que é o
precedente de `dinheiro` → `input` e `tipografia` → `typography`. **95 → 90
páginas.** O gerador lê o diretório `docs/` e não o registry, então
`npm run ds:docs-map` resolve os dois arquivos gerados sozinho — e como o índice
de busca é extraído do fonte das páginas, a prosa movida continua encontrável.

A asserção 13 lia `glass-${nome}.tsx` por string montada: com os arquivos
apagados ela **lançava ENOENT** em vez de reprovar. Reescrita contra os cinco
átomos, ela exige a tradução, que o eixo seja eixo (a palavra como prop, não só
a classe), e — a cláusula que importa — **que não sobre neutralizador onde o
eixo o dispensa**. Ela distingue o neutralizador da superfície legítima pelo
prefixo: um `bg-transparent` cru é o que o `outline` do `Badge` declara; um com
variante (`hover:`, `data-[state=checked]:`) ou com par `dark:` só existe para
desfazer o que outra regra emitiu. Mais um guarda de que **nenhum
`glass-*.tsx` além de `glass.tsx`** volta para `ui/`.

Verificada reintroduzindo três defeitos: um `hover:bg-transparent` no `Badge`,
a tradução removida do `ColorTile`, e uma peça separada recriada. Os três
reprovam.

**E o `taxonomy.test.ts` melhorou sozinho.** As cinco peças eram exatamente os
casos-limite da asserção 2 — "um átomo importa no máximo um átomo" —, e sem elas
a cláusula volta a ter **zero** casos entre os átomos, que é o que o comentário
dela já dizia que se devia esperar. Os "dois exemplos mortos" que ele nomeava
passaram a ser sete.

#### O que não foi feito

- **Nenhuma tela de produto mudou**, porque nenhuma usava as cinco peças —
  verificado por grep antes de começar. O modo continua opt-in, e o `ColorTile`
  chapado segue sendo o que as oito chamadas do app renderizam.
- **As rotas antigas dão 404**, e isso só se descobre em runtime: entry sem
  página cai em `notFound()` sem `tsc` nem teste acusarem, apesar de o
  comentário em `[slug]/page.tsx` prometer erro de build. Conferido à mão.
  Chave órfã em `LAYER` também não é coberta por teste nenhum — as duas
  lacunas ficam registradas.
- **As seções 41 e 42 ficam como estão.** Este projeto registra inversão; não
  reescreve o passado.


### Rodada 44 — o vidro puxa a cor da peça, e o "plástico" era o alfa

O aro e as nuvens eram brancos em toda peça, qualquer que fosse a cor dela. A
régua proibia mudar isso: *"o tom não tinge o aro nem as nuvens — um aro verde
faria a peça ler como plástico pintado"*.

**A objeção estava certa sobre a mistura ingênua e errada sobre o tingimento.**
Medido, misturando verde num aro de `oklch(1 0 0 / 34%)`:

| a 45% | cor | alfa |
| --- | --- | --- |
| mistura crua | 83,159,131 | **0,635** |
| com o alfa preso | 147,193,173 | **0,341** |

Misturar uma tinta **opaca** sobe o alfa junto com o matiz — a 45% a aresta fica
86% mais presente. **É isso que lê como plástico: não a cor, a peça ficar mais
pesada.** A régua nova: *tingir vidro é mover matiz; mover o alfa é engrossar o
vidro.*

#### E a versão "correta" foi medida, e reprovou

Prender o alfa (`oklch(from var(--glass-ink) l c h / var(--glass-rim-a))`) é a
resposta defensável no papel, e foi implementada primeiro. Medida, ela quase não
entrega: o aro composto sobre a página ia de `94,94,94` para no máximo
`94,84,94` — **10 unidades** de espalhamento, num traço de 1px, mesmo forçando
claridade 1 e triplicando o croma. Num painel de 180×240 as quatro doses eram
indistinguíveis a olho.

A causa é estrutural, e ficou escrita: **as nuvens são pintadas atrás da
lâmina**, que é 82% preta, então elas chegam ao olho com ~18% da força — é a
atenuação que a rodada 39 criou de propósito para elas lerem como luz *por
trás*. Quem pode carregar cor é o aro, e ele tem 1px.

Com o alfa livre a 20%: espalhamento **16,5** e alfa 0,471.

#### E 16,5 ainda era pouco — o que faltava era croma, não dose

Duas vezes seguidas a leitura foi "as bordas continuam brancas", e o número dava
razão a ela: `--identity-N` tem croma **0,09**, e 20% de uma cor quase cinza
misturados em branco continuam brancos.

A varredura separou as duas alavancas, e elas não custam a mesma coisa:

| | alfa | espalhamento |
| --- | --- | --- |
| croma 1×, 20% | 0,471 | 16,5 |
| croma **4×**, 20% | **0,471** | **56,7** |
| croma 1×, 55% | 0,702 | ~48 |

**O alfa depende só da quantidade** (`p × 1 + (1−p) × 0,341`); **o matiz depende
só do croma**. Subir o croma dá 3,4× a cor **de graça** — a aresta não fica mais
presente —, enquanto chegar ao mesmo lugar pela dose custaria alfa 0,702, ou
seja o dobro da presença do neutro.

Daí `--glass-ink-boost: 4`, aplicado **na receita** e não nas peças. Ele
multiplica em vez de fixar um alvo porque **0 × 4 continua 0**: o fallback de
cada camada é o próprio neutro, que é croma 0, e é isso que mantém o no-op
intacto. Fixar `oklch(from … l 0.2 h)` tingiria o vidro sem cor.

Acima do gamute o navegador limita, e o limite é o resultado desejado: a versão
mais saturada daquele matiz naquela claridade. É o que faz um tom já vivo
(`--destructive`, croma 0,245) e um discreto (`--identity-N`, 0,09) chegarem ao
aro com a mesma presença.

Medido depois, no escuro: alfa **constante em 0,471** nas seis identidades,
espalhamento médio **56,8**, e os picos do aro em `125,90,91` (rosa),
`125,105,48` (âmbar), `84,122,76` (verde), `15,125,125` (ciano), `82,111,125`
(azul), `125,95,125` (violeta). No claro os dois extremos do bisel tingem, com
espalhamento de 50 a 98.

#### E o corpo continuava preto — o tom era translúcido sobre uma lâmina preta

A leitura seguinte foi outra: *"por que o fundo das versões glass está em preto e
o das outras em cinza?"*. Medido, procedente — o avatar de vidro saía **20% mais
escuro** que o opaco da mesma identidade:

| identidade | opaco | vidro | queda |
| --- | --- | --- | --- |
| verde | `46,55,45` | `37,44,36` | −9,7 |
| ciano | `38,55,56` | `30,44,45` | −10,0 |
| rosa | `61,48,48` | `49,38,38` | −10,7 |

A causa: o tom era **80% opaco** (75%/65% nos semânticos) e fica *acima* da
lâmina, que compõe para **rgb 2** sobre a página. Os 20% que atravessavam eram
preto puro. **A mesma pessoa lia com duas cores conforme o material.**

**Clarear a lâmina não resolvia**, e a medição descartou a saída óbvia: de 82%
para 20% de preto o corpo só ia de 41,2 para 42,4, porque a página atrás já é
`rgb 10`. A alavanca era o alfa do tom — 88% dá 45,3, 92% dá 47,6, e **100% dá
51,3, que é exatamente o opaco**.

Com o tom opaco, o corpo das duas versões é **idêntico nas seis identidades**,
medido no elemento renderizado. Só o material muda; a cor nunca.

**O que se perde é a translucidez do corpo, e ela não valia nada**: o que
deixava passar era a lâmina preta. E isto expôs um fato que reenquadra a rodada
inteira — **numa peça com tom as nuvens já chegavam a 3,6%**. Os "pontos de luz"
vivem no vidro *sem* cor, como a barra lateral; numa peça tingida, quem faz o
material é o aro, sozinho.

De brinde, o par `dark:` do tom sumiu das treze entradas: `-muted` e `-surface`
já são cientes de tema, e sem o `color-mix` sobra uma declaração só.

**O `ColorTile` é a exceção, e o motivo é que ali o percentual não é alfa.** Nas
outras a fonte é um token já na cor certa; nele a fonte é o **hex cru do banco**,
e os 12%/18% são a receita que vira véu. O tom dele passou a ser literalmente o
véu do chapado, opaco — um `100%` pintaria a cor cheia, que é o desenho que
reprovava em 4 dos 10 presets.

#### E a caixa do catálogo era mais escura que o resto dele

A última leitura foi sobre o **fundo do preview**, não sobre a peça: as oito
seções de vidro que escrevi passavam `previewClassName="bg-background p-6"`, ou
seja `rgb 10` dentro de uma moldura que é `bg-card`, `rgb 23`. Ao lado de
qualquer outra seção da mesma página aquilo lia como um buraco preto.

Duas coisas na correção. O `p-6` era **redundante** — já é o padrão do
`Preview` —, então a linha inteira só acrescentava o fundo; e o `bg-background`
tinha vindo por herança das páginas de vidro apagadas na rodada 43, sem motivo
próprio. Removidos — os oito, mais os **três** da página do
`Glass` —, as caixas medem `23,23,23`, a mesma superfície das outras.

**Sobra uma exceção, e ela tem motivo próprio:** `docs/card.tsx`, onde cartão
dentro de cartão não desenha fronteira nenhuma. A página do `Glass` chegou a ser
defendida com o argumento de que o consumidor do degrau `panel` é a placa
flutuante, que mora sobre a página — mas o palco do catálogo não é a tela do
app, e uma superfície escura demonstra melhor sobre o cartão, onde a lâmina
(`rgb 4`) tem mais distância do fundo do que teria sobre a página (`rgb 10`).

#### E o `Badge` perdeu o modo

Decisão do dono, no fim da rodada: **o `Badge` não tem mais `glass`**. Saíram o
eixo do `cva`, as sete linhas de `compoundVariants`, a união que fechava
`variant`, o `data-glass` e as duas seções do catálogo. As catorze linhas de tom
voltaram a não ter porta (`{ glass: false, variant: … }` → `{ variant: … }`), e
`BadgeProps` voltou a ser a interface simples.

Ficam **quatro** peças com o modo — `Button`, `Avatar`, `Checkbox`, `ColorTile`
—, e `GLASS_TONES` / `GLASS_TONE_INKS` continuam vivos porque o `Button` os usa.

Duas coisas **não** saíram junto, e é de propósito. O `soft: ""` do `cva`
continua vazio: ele era a mesma classe que a base já declara, e essa razão não
tinha nada a ver com vidro — só a segunda metade do comentário (o vazamento
para o ramo de vidro) deixou de existir. E a `PropsTable` da página segue
corrigida: ela documentava o eixo `variant` antigo, com os sete tons dentro e um
`size="default"` que já tinha saído do tipo.

**A lição de método:** eu tratei "quanto de cor" como um eixo só e ofereci doses.
São dois eixos com preços diferentes, e a pergunta certa — *o que custa alfa e o
que não custa?* — só apareceu depois de a terceira leitura a olho continuar
dizendo branco. **Quando a percepção discorda do número duas vezes, o errado é o
modelo, não o olho.**

**E fica registrado um erro meu de método.** A amostra em que baseei a pergunta
sobre intensidade tinha o alfa em **0,471**, não 0,341 — era a mistura crua. Ou
seja: apresentei uma opção descrevendo um resultado que a regra que eu propunha
no mesmo texto tornava inalcançável. A medição pegou; a pergunta teve de ser
refeita com os números certos. **Amostra usada para escolher uma dose tem de
sair da mesma fórmula que vai ser implementada.**

#### O no-op é estrutural, e isso custou duas tentativas

`--glass-ink` **não é declarada em tema nenhum**. Cada camada a lê com o próprio
neutro como fallback — `var(--glass-ink, var(--glass-rim))` —, então sem tinta a
mistura é o neutro consigo mesmo, que é o neutro em **qualquer** quantidade.

A primeira versão declarava `--glass-ink: oklch(1 0 0)` no `:root` e apoiava o
no-op em croma 0 mais `--glass-ink-amount: 0%`. Funcionava, e o `ds:catalog`
acusou com razão: **uma cor sem par no `.dark`**. Silenciar teria custado uma
linha redundante; tirar o token custou nada e deixou a garantia mais forte — de
"o padrão é uma cor que não tinge" para "sem tinta não há mistura".

**A prova é a barra lateral**, o único consumidor de produto da utility e o que
não tem cor de elemento. Extraídas as 14 cores da receita e comparadas **uma a
uma como cor** (não como string — `oklab(1 0 0 / 0.34)` e `oklch(1 0 0 / 0.34)`
são a mesma cor em notações diferentes, e essa comparação me enganou uma vez
hoje): **idênticas nos dois temas**, antes e depois.

#### Por que `--glass-ink` e não `--glass-tone`

São coisas diferentes: o **tom** é uma camada com alfa próprio que pinta o
**corpo**; a **tinta** é só um matiz de onde o aro e as nuvens puxam. Manter as
duas separadas é o que deixa a asserção **12** — *o aro e as nuvens não leem
`--glass-tone`* — continuar verdadeira **e** continuar certa. A separação entre
corpo e material não mudou; o que mudou foi o material passar a ter cor.

#### As fontes de matiz, e o tom que não precisou de exceção

| peça | fonte | nota |
| --- | --- | --- |
| `Badge` / `Button` | `var(--{tom})` | **um valor, sem `dark:`** — o matiz é idêntico nos dois temas (166, 152, 78, 27) |
| `Avatar` | `-surface` no claro, `--identity-N` no escuro | é o par que inverte, e o saturado é o outro em cada tema |
| `ColorTile` | `var(--tile-color)` | a cor crua do banco |
| `Checkbox` | `var(--primary)`, só marcado | uma caixa vazia é vidro sem cor |

**`neutral` não precisou de exceção**: `--muted` é croma **0** nos dois temas, e
misturar cinza num branco não move matiz nenhum. Ele sai neutro por construção,
e não por um `if`.

**E o tema claro saiu melhor do que a previsão.** Eu esperava que tingir o aro
lá — onde ele é **sombra**, não luz — o lavasse. Medido, o contrário: a fonte
ali é o `-surface`, que no claro é o saturado **escuro**, então a sombra
escurece e ganha cor (contraste de 1,53 para ~2,03 contra o cartão), e o lado
aceso vai de branco puro a um branco tingido visível. O bisel das peças
coloridas fica mais presente no claro — consequência do alfa livre, e dita em
vez de descoberta depois.

#### O escopo, e o que ficou de fora

Tingem: os **dois extremos do aro** e as **duas nuvens**. Não tingem:

- **`--glass-rim-shade`**, o vale do bisel — a 5% e 10% de alfa não carrega
  matiz que se enxergue.
- **`--glass-sheen`**, o realce de cursor — realce é a cor da **fonte de luz**,
  não do material.

A asserção **15** tranca as duas listas, para a decisão ficar escrita em vez de
combinada.

#### Um guarda que passava por sorte

A asserção **11** proibia `color-mix` tocando `--glass-rim`, com
`not.toMatch(/color-mix[^)]*--glass-rim/)` sobre a receita. Com o tingimento ela
continuou **verde** — e não por estar certa: o `[^)]*` não atravessa o `)` de
`var(--glass-ink)`. O que ela quer proibir é **derivar um extremo do bisel do
outro na declaração do token**, que é onde o defeito da rodada 40 morava; ela
passou a olhar os blocos de tema, e verificada reintroduzindo a derivação,
reprova.


### Rodada 45 — o vidro do botão vira acabamento, e não paleta

O modo de vidro do `Button` nasceu como **peso próprio**: fechava `variant`,
abria um eixo `tone` de sete cores e pintava com os pares `-muted`. A leitura do
dono foi direta — *"as cores estão diferentes, a forma de aplicá-las está
diferente, e deixou o botão mais apagado"* —, e a medição no escuro deu razão:

| | corpo | tinta | contraste |
| --- | --- | --- | --- |
| `variant="primary"` | `0,121,82` | branco `250,250,250` | 5,22 |
| `glass tone="primary"` | `0,47,32` | verde pálido `179,229,206` | 10,52 |

**2,6× mais escuro** no canal principal, com a tinta trocada. A página do
catálogo documentava isso como decisão — *"um botão de vidro primary não é um
botão verde"* —, e essa nota cai.

**A régua nova: o vidro é acabamento sobre a cor da peça, e não uma paleta
paralela.** O corpo vai para `--glass-tone` com a cor do próprio variant, opaco;
a tinta e o anel de foco do variant sobrevivem; o vidro acrescenta aresta, halo
e aro aceso.

Medido depois, corpo do vidro contra corpo do chapado:

| | escuro | claro |
| --- | --- | --- |
| `primary` | Δ **0** (`0,121,82`) | Δ **0** (`0,96,61`) |
| `secondary` | Δ **0** | Δ **0** |
| `destructive` | Δ1 | Δ2,4 |

E o contraste do texto volta ao do botão padrão: **5,22** no `primary` escuro,
7,34 no claro — contra os 10,52 de antes, que eram texto pálido sobre corpo
escuro.

#### Não foi preciso forçar `tertiary`, e é o que salva a tinta

A versão anterior cravava `variantEfetivo = "tertiary"` por dentro e reconstruía
tudo por `tone`. Mantendo o **variant real**, o que precisa sair é só o que a
`@utility` apagaria de qualquer jeito, e em três famílias:

- **o preenchimento**, que o shorthand `background` apaga calado (armadilha 1);
- **a borda**, porque a utility declara `border: 1px solid transparent` e é ali
  que o aro mora;
- **o recorte**, e este é o sorrateiro: o `secondary` traz `bg-clip-border`, e
  `background-clip` é uma propriedade **só** — ela sobrescreveria o recorte das
  **cinco camadas** de uma vez, levando as de `padding-box` para fora da borda.

O que **não** sai é a tinta nem o `focus-visible:ring-destructive/20`. É isso
que faz "as mesmas cores" ser verdade em vez de aproximação.

#### O `destructive` é a exceção, e ela foi medida

Ele é o único dos três que **não preenche**: o botão padrão é um véu
(`bg-destructive/10` no claro, `/20` no escuro). Como `--glass-tone` tem de ser
opaco — senão a lâmina quase preta atravessa, que é o defeito da rodada 44 —,
foi preciso achar o opaco equivalente:

| candidato | Δ contra o véu |
| --- | --- |
| `color-mix(--destructive 20%, --card)` | **0** sobre a página, **1** sobre o cartão |
| `--destructive-muted` | **21** |

O óbvio errava por 21. A referência é `--card` porque é onde um botão mora, e
**é a única das três que não acompanha o fundo** — o preço de o tom ser opaco,
dito em vez de descoberto.

#### O glow: halo por fora, aro aceso por dentro

Nada no repositório se chamava glow, e **nenhum `box-shadow` do sistema tinha
cor semântica** — os cinco `--shadow-*` são preto puro nos dois temas. O idioma
mais próximo era o `slider.tsx`, com `hover:ring-4 ring-primary-accent/15`.

- **Halo**: `shadow-[0_0_16px_-4px_var(--glass-glow)]`, com `--glass-glow`
  declarado por variant. **Verificado que ele não come o anel de foco**: medido,
  `shadow-md ring-1` emite as duas na mesma cadeia, porque no Tailwind v4
  `--tw-shadow` e `--tw-ring-shadow` são variáveis distintas somadas em
  `box-shadow`.
- **Aro aceso**: `--glass-ink-amount` sobe de 20% para **45%** na linha do
  variant. É variável, então não custou uma linha na `@utility`.

**`secondary` não tinge, e está certo** — `--secondary` é croma 0 nos dois
temas, e multiplicar zero pelo `--glass-ink-boost` continua zero. Sai neutro por
construção, e não por exceção.

#### A limpeza que a mudança obrigou

Com o `Button` fora do eixo de sete tons — e o `Badge` já sem o modo —,
`GLASS_TONES`, `GLASS_TONE_INKS` e o tipo `GlassTone` ficaram com **zero
consumidores**. Os três saíram de `glass-classes.ts`, e no lugar ficou a nota
que explica por quê. `glassInteractiveClassName` fica: o `Checkbox` o usa.

#### E o modo saiu do `Button`

Vista na tela, a peça foi reprovada pelo dono — *"ficou péssimo"* —, e o modo
foi **removido inteiro**. Saíram o eixo do `cva`, as três linhas de
`compoundVariants`, a união de props, o `data-glass` e a seção do catálogo com
as duas notas.

**A união levou junto uma dívida que ela mesma tinha criado.** Fechar `variant`
no ramo de vidro obrigou 11 wrappers de `ui/` a se fixarem em
`ButtonSolidProps`, porque desestruturar o rest de uma interseção com união
aninhada colapsa os ramos. Sem a união, os 11 voltaram a
`React.ComponentProps<typeof Button>` — que é o que tinham antes, e é mais
simples.

Ficam **três** peças com o modo: `Avatar`, `Checkbox` e `ColorTile`.
`glassInteractiveClassName` sobrevive com um consumidor só, o `Checkbox`.

**O que esta rodada deixa de saldo, mesmo tendo sido revertida na peça:** os
números que explicam por que a versão anterior estava errada (2,6× mais escura,
tinta pálida), a medição do `destructive` (o `-muted` erra por Δ21 contra o véu
que o botão pinta), e o fato de que `background-clip` é uma propriedade só —
ela sobrescreveria o recorte das cinco camadas de uma vez. Os três continuam
valendo para qualquer peça que venha a vestir vidro.

#### E o `Checkbox` saiu junto

Removido logo depois, pela mesma decisão. Saíram o prop, os dois ramos do
ternário e a seção do catálogo com as duas notas — a caixa voltou a ser a lista
de classes chapada que era antes.

**Com ele foi-se o último consumidor de `glassInteractiveClassName`**, que
publicava `--glass-sheen` no `hover` e no `active`. O export saiu; **a camada
fica na `@utility`**, lida com fallback `transparent`. Ela é ponto de contrato e
não código morto: hoje não há produtor, e a primeira peça de vidro **clicável**
volta a precisar dela.

Sobram **duas** peças com o modo — `Avatar` e `ColorTile` —, e as duas têm em
comum não serem clicáveis. É o resumo honesto de onde o vidro se paga neste
sistema: superfícies de **identidade**, não controles.

#### Uma lição de instrumento, e é a terceira desta série

Ao conferir o halo, a sonda cortava `boxShadow` em 80 caracteres e devolvia
`rgba(0, 0, 0, 0) 0px 0px 0px 0px` três vezes — e eu quase reportei que o glow
não estava aplicando. **As entradas zeradas são o começo da cadeia composta do
Tailwind**; a camada real era a última. Truncar um valor composto esconde
justamente a parte que interessa.


### Rodada 46 — o borrão não cabe no elemento mascarado

O pedido foi uma versão do `ScrollFade` que, além do fade, borrasse levemente a
borda — vidro. **Ela não cabe no nó que já existe, e não é questão de gosto.** A
invariante 2 diz que o rolável não desenha nada, e um `backdrop-filter` nele
seria recortado **pela própria rampa**: forte onde a máscara é opaca, ausente
justo na ponta. Exatamente ao contrário do que se quer, e filho dele herdaria o
mesmo recorte.

As camadas são **irmãs** do rolável, e a casca hospeda as duas coisas.

**E a escolha do mecanismo já estava escrita.** A régua dos dois vidros, em
`globals.css`: *há algo passando por baixo* → `backdrop-filter`; *não há* → a
`@utility glass`, que é luz pintada porque borrar cor chapada não desenha nada.
Numa borda de rolagem há conteúdo passando por baixo — é o lado do
`backdrop-filter`, e com ele veio o `prefers-reduced-transparency` que um blur
de verdade obriga. É o segundo consumidor dele no repositório.

#### Irmão não lê custom property de irmão

O `useScrollFade` escreve `--scroll-fade-start` / `--scroll-fade-end` **no
próprio rolável**, com `el.style.setProperty`. Custom property herda para
descendente, nunca para o lado — as camadas não enxergariam nada.

A casca é o host certo, e já era: é ela que publica `--scroll-fade-band-h` /
`--scroll-fade-foot-h`, justamente por ser *"o único elemento que enxerga as
faixas como irmãs do rolável"*. Publicando ali, as duas variáveis descem por
herança para o rolável **e** para as camadas, e o recuo das faixas fixas sai de
graça. Medido: `--scroll-fade-start: 152px` e `--scroll-fade-end: 252px`,
idênticos nos dois nós.

A opção `shell` é **opt-in**, e é o que mantém os **13 consumidores** de hoje
sem uma linha de diferença — nenhuma casca do Radix ou do cmdk recebe mutação de
atributo que não pediu.

#### Uma camada é crossfade; três são um gradiente

Com uma só, o raio é **constante** e só a opacidade varia — nítido dissolvendo
em borrado, não borrão que cresce. São três, e cada uma borra o que a de baixo
já compôs, então a variância soma. O índice faz duas coisas ao mesmo tempo:
multiplica o raio **e** encurta a extensão para `100% / i`, então a que mais
borra é a que menos avança para dentro. Medido: `blur(2px)`, `blur(4px)`,
`blur(6px)`, ~7px de raio efetivo na ponta.

A rampa de cada camada leva degrau intermediário pela razão da rampa principal:
queda linear sai do chapado com inclinação máxima, e descontinuidade de derivada
contra superfície lisa é banda de Mach — aqui, numa linha que atravessa a caixa
inteira.

#### O que foi medido

| | resultado |
| --- | --- |
| altura da faixa, rolando 0 → 20 → 201 → fim | **0 · 20 · 44 · 0** — cresce no mesmo passo da dissolução, e não existe nos extremos |
| eixo X | **32px**, que é `--scroll-fade-x-h`, e não os 44 do Y |
| `data-scroll-fade="off"` | `display: none` — nenhuma camada de composição parada |
| o clique | `elementFromPoint` na camada devolve **o conteúdo**, não ela |
| guardas no CSS emitido | os quatro, **duas vezes** (uma por eixo) |
| `mask-composite` no CSS emitido | **0** — a invariante 3 de pé |
| popover assentado | `transform: none`, e a camada com `blur(8px)` na geometria certa |

**O risco que a inspeção fechou:** um ancestral com `transform` / `opacity` /
`will-change` troca a raiz de backdrop, e é o que o Radix faz ao abrir. Medido,
o popover **assentado** não tem transform nenhum — a exposição fica restrita aos
~150ms da animação de abertura.

#### `sem eixo de intensidade`, e o que mais não entrou

Quem quiser mais ou menos vidro sobrescreve `--scroll-fade-blur-r` no próprio
elemento: variável herda, e eixo sem caso medido é ficção — este projeto já
removeu dois. **Nenhum dos 13 consumidores migrou**, por decisão: a utility fica
disponível para `Command`, `Sidebar`, `Table` e os menus, e ligá-la em qualquer
um é decisão de produto. **Zero pixel alterado em produção.**

#### O `scroll-fade` ganhou o teste que nunca teve

As quatro invariantes dele só eram cobradas de raspão por
`carousel-ladder.test.ts`, contra **um** consumidor.
[`scroll-fade.test.ts`](../../src/components/ui/scroll-fade.test.ts) tranca as nove:
o borrão irmão e nunca o próprio, um gradiente por elemento, o empilhamento, os
quatro guardas, o clique, a faixa não poder divergir da que dissolve, a régua
não montar classe em runtime, o espelho ser opt-in e limpar o que escreveu — e
a **invariante 2 aplicada ao próprio componente**, que era a lacuna antiga.

Quatro delas foram verificadas **reintroduzindo o defeito**, e as quatro
reprovam.

#### Rodada 46b — o material do iOS, e o `blur` booleano durou uma hora

A pergunta foi se aquilo parecia iOS. **O mecanismo era; a aparência não** — e a
medição nomeou as quatro lacunas: raio de 7px contra os ~24 de lá, `saturate`
nenhum, tinta nenhuma, e — a que decide — o conteúdo **dissolvendo até 6% de
alfa** enquanto um material do iOS borra e não apaga.

O dono escolheu o material de verdade. Ele **contraria a regra que enterrou o
`ScrollFade` de gradiente pintado** (*dissolver, e não pintar um véu*), a
contradição foi apresentada antes, e ele reafirmou.

**O eixo passou a ser `edge`, e os três valores não são graus do mesmo efeito.**
`fade` é só a máscara, `blur` soma borrão a ela, e `material` **substitui**: ali
`--scroll-fade-mask` sai e o conteúdo passa por baixo nítido. O `blur` booleano
que a rodada anterior entregou durou uma hora e tinha **zero consumidores** —
trocá-lo custou nada, e um booleano nunca ia expressar "substitui" ao lado de
"soma".

#### A tinta é `transparent` de fábrica, e o número é que decidiu

O caminho óbvio era herdar `--mobile-glass-bg`, que é o material do telefone.
Medido, ele **não serve**:

| | `--mobile-glass-bg` | o que ele iguala |
| --- | --- | --- |
| claro | `oklch(0.985 / 55%)` | **`--background`** (0.985) |
| escuro | `oklch(0.205 / 45%)` | **`--card`** (0.205) — a página é 0.145 |

Ele segue **superfícies diferentes em cada tema**, porque é calibrado para uma
folha sobre a página. Uma faixa de borda vive sobre card, popover, página ou
`muted` — herdá-lo seria cravar a cor de novo, que é literalmente o defeito que
matou a versão pintada (`from-card` dentro de um popover pintava faixa clara).

A tinta nasce `transparent` e é opt-in por `--scroll-fade-blur-tint`. É o
mecanismo do `--glass-tone`, que também nasce transparente e por isso é no-op.

**O que foi herdado são o raio e a vibrância:** `saturate(1.5)` é o número de
`.mobile-glass-surface`, para a casa ter **uma** vibrância — e o teste falha se
os dois divergirem. As três camadas somam para ~26px efetivos contra os 24 de
lá. Não é um terceiro vidro: é a mesma receita, numa faixa em vez de numa
superfície.

#### Preset de variável, e nunca uma segunda propriedade

`scroll-fade-material` declara **duas variáveis e mais nada**. A tinta e a
vibrância entraram nas camadas como no-op (`transparent` e `1`), então o modo
`blur` não mudou um pixel. É o precedente do `glass-control`: *sobrescrever a
variável, nunca a propriedade* — duas utilities escrevendo `backdrop-filter`
seriam decididas pela ordem de emissão do Tailwind, e não pelo que se escreveu.

**A máscara sai por uma regra que empata em especificidade e vem depois.**
`&[data-scroll-fade-mode="material"]` fica logo abaixo de `&[data-scroll-fade="on"]`
dentro da mesma utility; as duas são (0,2,0) e ali quem decide é a ordem. A
folga de rolagem **fica** — medido, 48px nos três modos —, senão um
`scrollIntoView` depositaria o item ativo debaixo da faixa.

#### O que foi medido

| | resultado |
| --- | --- |
| `fade` | máscara **rampa**, 0 camadas |
| `blur` | máscara **rampa**, 6 camadas |
| `material` | máscara **nenhuma**, 6 camadas, `blur(7/14/21px) saturate(1.5)` |
| folga de rolagem | **48px nos três** |
| os dois temas | o conteúdo sob o material continua legível; sob `fade` e `blur`, não |

**A lição de instrumento:** as três primeiras capturas do material pareciam
"pouco borradas", e não estavam — o painel entregava 800px para um viewport de
1443, e o downscale de 0,55 apaga justamente o detalhe que se está medindo.
Com `resize_window` a 800 e captura 1:1, a diferença entre os três modos fica
óbvia. **Captura escalada não serve para julgar nitidez.**

#### Rodada 46c — a camada era um retângulo reto dentro de uma casca curva

Relatado pelo dono, com o canto superior-direito circulado na captura: *"as
bordas dos fades estão quebrando"*. Medido: a casca tem **raio 10px e
`overflow: visible`**, e cada camada de borrão é `border-radius: 0` preenchendo
o padding box inteiro (`top: 1`, `left: 1`, largura 290,7 contra 292,7 da
casca — os 2px das bordas).

**A camada é filha, então ela pinta depois da borda da casca.** De canto reto
ela avança sobre a curva, cobre o fio nos quatro cantos, e — o que se vê — o
`backdrop-filter` espalha o conteúdo de dentro para fora do arredondamento. O
sintoma some no modo `fade`, que não tem camada nenhuma, e é mais forte no
`material`, que não tem máscara para atenuá-lo.

**O conserto é a camada herdar o raio, e não a casca recortar.** `overflow-hidden`
na casca seria exato e resolveria só o componente: o eixo escolhido na 46 foi
*utility + régua para qualquer casca*, e uma utility que depende de o consumidor
lembrar de recortar não serve. Herdando, ela é auto-contida.

**E só os dois cantos que encostam.** `border-radius: inherit` arredondaria os
quatro, e a aresta de dentro da faixa corre no **meio** da caixa — ali não há
canto a acompanhar. Por ponta:

| eixo | ponta `start` | ponta `end` |
| --- | --- | --- |
| Y | os dois de **cima** | os dois de **baixo** |
| X | os dois do lado de **início** | os dois do lado de **fim** |

Medido depois: `10px 10px 0 0` e `0 0 10px 10px` no eixo Y; `10px 0 0 10px` e
`0 10px 10px 0` no X.

**O que sobra, e é dito:** herdar dá o raio do *border box* aplicado ao *padding
box*, ou seja **1px de sobra** onde a casca tem borda — o raio interno correto
seria `10 − 1`. Não há como ler a borda do pai em CSS, e a 1px o resto é o
borrão passando de leve sobre o fio em vez de um canto reto inteiro. Quem
precisar de exatidão põe `overflow-hidden` na própria casca.

A asserção 10 tranca as duas metades — que os cantos da ponta herdem, que os
outros **não** herdem, e que ninguém use o atalho `border-radius`. Verificada
reintroduzindo três defeitos: o canto reto (o relatado), os quatro cantos de
uma vez, e o eixo X pegando o lado errado. Os três reprovam.

#### Rodada 46d — o material vira superfície, e o cabeçalho do catálogo veste

Pedido: *"aplique esse mesmo estilo no header para que o fundo fique mais
glass"*, com o esclarecimento de que **não é o fade** — é o material como fundo.

Medido, o cabeçalho tinha três lacunas contra a receita da casa:

| | cabeçalho do catálogo | `.mobile-glass-surface` |
| --- | --- | --- |
| raio | **`blur(8px)`** | `blur(24px)` |
| vibrância | **nenhuma** | `saturate(1.5)` |
| tinta | `bg-background/85` | 45%/55% |

Mais uma quarta, que só aparece lendo: ele tinha `backdrop-filter` **sem o
`prefers-reduced-transparency`** que o próprio `globals.css` diz que um blur de
verdade obriga.

**Escrever os números no `className` seria a terceira cópia da mesma receita**,
e a casa já reclama de ter dois vidros. Em vez disso o mecanismo saiu para uma
`@utility glass-surface`, e `.mobile-glass-surface` passou a **consumi-la** com
`@apply` em vez de repeti-la — extração, não mudança. Medido antes e depois na
folha do telefone: `blur(24px) saturate(1.5)`, `oklch(0.205 0 0 / 0.45)`,
borda `oklch(1 0 0 / 0.05)` — **idênticos**.

**Ela declara o material e nunca a cor.** A tinta depende da superfície, e
cravá-la aqui é o defeito que enterrou o `ScrollFade` pintado. Quem veste traz
o próprio `bg-*`; os dois números são variáveis, pelo mecanismo do
`glass-control`.

**O par opaco/translúcido é de quem veste, e não da utility.**
`bg-background/95 supports-backdrop-filter:bg-background/60` — sem borrão, os
60% deixariam o conteúdo passar por trás do título. É o que `app-header.tsx` já
escrevia, e agora as duas cascas concordam.

Medido depois, nos dois temas: `blur(24px) saturate(1.5)`, fundo a 60%, e o
guarda de transparência reduzida emitido **duas vezes** no CSS — uma pela
utility, outra pela folha que a herda.

**A asserção 9 media a coisa certa por acidente, e isso só apareceu agora.** Ela
lia a vibrância a partir de `indexOf(".mobile-glass-surface")` — e a **primeira**
ocorrência dessa string no arquivo é um comentário, quarenta linhas acima do
bloco. Com a receita extraída, o número que ela achava passou a vir da utility
nova; ela continuou verde sem estar certa. Hoje lê da `@utility glass-surface`
e tranca que a folha **herde** em vez de declarar os próprios números.
Verificada reintroduzindo os dois defeitos: a vibrância divergindo e a folha
repetindo a receita. Os dois reprovam.

É a segunda vez que este arquivo registra a mesma família: *corte por `indexOf`
sem posição inicial é uma asserção que pode acertar por vazio* — e agora também
**por comentário**.

#### Três lições de instrumento, e as três são erros meus

**`requestAnimationFrame` não dispara com o painel oculto.** Um `await` de dois
quadros dentro da sonda pendurou a chamada por 45s, e o diagnóstico natural
seria "a página travou". A leitura de layout continua tendo de ser um quadro
depois da mutação — mas o quadro tem de vir de **outra chamada**, e não de um
`await` dentro da mesma.

**A minha varredura do CSSOM reportou zero guardas** enquanto o `getComputedStyle`
já tinha mostrado `display: none` funcionando. Ela descia para os filhos de cada
regra **antes** de testar o texto do pai, e com CSS aninhado os guardas moram
lá. É a quarta vez que este arquivo registra a mesma régua: **quando a medição
contraria o mecanismo, desconfie da medição primeiro.**

**E um efeito sutil e correto é indistinguível de um quebrado.** A 2px o
`backdrop-filter` computava certo e a captura não provava nada. O que resolveu
foi **amplificar o token** para 8px: aí o borrão fica inegável, e só então baixá-lo
de volta. Verificar "leve" exige medir o mesmo mecanismo em intensidade alta.

### Rodada 47 — o vidro ganha o modo material, e um guarda meu tinha caído

O pedido foi o vidro no estilo iOS, como o `scroll-fade`. É o item que a 46d
deixou escrito: *"unificar é decidir se a premissa vira eixo ou se os dois nomes
ficam."* Decisões do dono: **eixo**, **escada de espessura** — contra a minha
recomendação de um material só, e fica registrado que ela nasce sem caso
medido — e **zero pixel em produção**.

#### O item zero: uma regressão minha, achada pela exploração

A 46d fez `.mobile-glass-surface` consumir a `@utility glass-surface` com
`@apply`. Medido no CSSOM, o emitido era:

```css
.mobile-glass-surface {
  backdrop-filter: …;
  @media (prefers-reduced-transparency: reduce) { background-color: …; }
  background-color: var(--mobile-glass-bg);   /* ← depois, e vence */
}
```

**O `@apply` insere as declarações no lugar da diretiva**, então o guarda ficava
*antes* das cores e a declaração literal seguinte vencia: sob `reduce` a folha
ficava **translúcida sem blur** — o pior dos dois estados, e o que a própria doc
da utility diz que não pode acontecer. Ela está viva em toda tela do telefone.

**A asserção que escrevi provou a forma e não o resultado.** Ela exigia `@apply
glass-surface` e a ausência de números repetidos, e passava com o guarda
perdendo. Família da 29b: *asserção que casa a forma da chamada testa a
digitação.*

**O conserto não foi mover a linha.** Uma utility não pode ser dona de
`background-color` se quem a veste também é: contra `@apply` ela perde por
ordem de inserção, e contra classes utilitárias perde por ordem de emissão do
Tailwind. Hoje ela é dona de **uma** propriedade — `backdrop-filter` —, e a cor
sólida do guarda voltou para quem veste, escrevível por um
`@custom-variant reduced-transparency` novo. O cabeçalho do catálogo diz as
duas cores no mesmo lugar: `bg-background/95`,
`supports-backdrop-filter:bg-background/60` e `reduced-transparency:bg-background`.

#### Não dava para "só acrescentar blur"

A lâmina é quase opaca de propósito — 82% no escuro, que compõe para **rgb 2**
sobre a página. Um `backdrop-filter` atrás dela é invisível, que é o defeito que
a rodada 44 mediu quando o tom opaco a tapava. **O modo abre a lâmina, e é essa
abertura que é o material.**

**E as nuvens saem.** Elas existem para simular luz atrás de uma placa que não
tem nada atrás; com conteúdo real e borrado ali, o simulacro disputa com a
coisa. É a mesma conclusão a que a rodada 44 chegou por outro caminho — *"numa
peça com tom as nuvens já chegavam a 3,6%: quem faz o material é o aro"*. O aro
fica, e medido ele não se move: **34% nos quatro** espécimes.

#### A mecânica: só uma utility declara a lâmina

Os degraus movem `--glass-material-step`, uma intermediária; **nenhum deles
toca `--glass-tint`**. Se cada um a escrevesse direto, quem venceria seria a
ordem de emissão do Tailwind — e os dois guardas, que moram na regra do meio,
perderiam para o degrau. É o mecanismo do `glass-control`.

Os guardas restauram com **`inherit`**, que numa custom property devolve o valor
computado do pai — o token do tema, que é exatamente o pintado. Sem alias e sem
token novo.

A intermediária chegou a se chamar `--glass-material-tint`, ao lado de
`--glass-material-thin`: uma letra de diferença entre duas variáveis vizinhas é
um erro de leitura esperando acontecer, e ela virou `-step`.

#### O que foi medido, e o número que decide a régua de uso

Contraste do texto do sistema sobre a placa, composto sobre o fundo real:

| | alfa (escuro) | pior caso | sobre a página |
| --- | --- | --- | --- |
| pintado | 82% | 13,03 | 19,90 |
| `thick` | 70% | 8,16 | 19,76 |
| `regular` | 55% | **4,56** | 19,58 |
| `thin` | 40% | **2,73** | 19,41 |

**`thin` reprova os 4,5:1 sobre conteúdo claro, e isso não é conserto — é o que
um material fino é.** Fechá-lo até passar exigiria ~54%, praticamente o
`regular`, e a escada colapsaria. A régua que sai daí: **onde há texto sobre o
material, o piso é `regular`**; `thin` é para superfície sem texto crítico ou
sobre conteúdo escuro. É por isso que o iOS tem os degraus.

**No claro os três passam** (6,79 · 9,70 · 13,31), e a assimetria tem causa: lá
a lâmina é branca e o texto é escuro, então abrir a lâmina sobre conteúdo escuro
ainda deixa a superfície clara. No escuro os dois vão em direções opostas.

E o teto do claro que a rodada 40 mediu continua valendo: sobre a página os
quatro degraus compõem **251/252 contra 250** — indistinguíveis. Eles se separam
sobre **conteúdo**, que é onde o modo material vive.

#### A asserção 7 tinha duas armadilhas, e as duas eram minhas

Ela varria `RECEITA` — o texto **cru, com comentários** —, então um comentário
que apenas *mencionasse* `backdrop-filter` já a reprovava, sem mudança nenhuma
de código. Passava só porque a seção que fala disso está acima da linha
`@utility glass {`. E a fatia ia até `@utility glass-control`, **engolindo o
doc-comment inteiro do vizinho** — 17 linhas de prosa varridas como se fossem
código.

Hoje ela varre `RECEITA_CODIGO`, o corte para no próximo doc-comment de topo, e
ela diz as duas metades: **a receita base nunca borra; o material sempre**.

Quatro asserções novas (16 a 19), e **seis sabotagens verificadas**. Duas delas
acharam buracos no próprio teste antes de passarem: a 17 aceitava quem cravasse
o raio no `backdrop-filter` e deixasse o par `-webkit-` com a variável — ela
passou a exigir **duas** ocorrências —, e depois acusou a si mesma, porque a
condição `@supports not (backdrop-filter: blur(1px))` carrega de propósito a
string que a asserção proíbe. A condição sai antes da varredura.

**A régua de método que sobra:** uma asserção que varre um bloco de CSS precisa
saber onde o bloco acaba **e** que a condição de um `@supports` não é código.

#### O que não entrou

Nenhum consumidor. O modo é opt-in, e `Avatar` / `ColorTile` seguem pintados —
os dois são superfícies de identidade sem nada atrás, que é a premissa do
pintado. **Zero pixel alterado em produção**, verificado por `git diff`.

### Rodada 48 — o avatar de vidro era um disco chapado, e as duas causas eram da receita

O pedido foi o `<Avatar glass>` no estilo iOS. Ampliado 6×, ele era um disco
fosco quase indistinguível do opaco ao lado. **Nenhuma das duas causas estava no
`avatar.tsx`.**

#### 1. Quatro das seis camadas não pintavam nada

O tom é a **camada 0** — acima da lâmina e das nuvens — e a rodada 44 o tornou
**opaco** por uma razão medida (translúcido, o avatar saía 20% mais escuro que o
opaco da mesma identidade). Ela anotou o efeito colateral pela metade: *"as
nuvens já chegavam a 3,6%"*. Com alfa 1 elas chegam a **zero**.

| camada | no avatar |
| --- | --- |
| −1 realce | `transparent`, sem produtor |
| 0 **tom** | **opaco — cobre tudo abaixo** |
| 1 lâmina · 2–3 nuvens | invisíveis |
| 4 aro | 1px |

#### 2. O pico do aro caía fora do círculo

O aro é `linear-gradient(165deg, …)`, calibrado numa placa de 240×424. Numa
caixa de 40×40 o eixo dele mede **49px**: as duas pontas — o pico e o extremo
aceso — caem nos **cantos** do quadrado, e num círculo os cantos não existem.

Amostrando 720 pontos do perímetro: **0%** via o pico de 34%, **0%** via o
extremo aceso, **57,5%** via só o vale de 10%. **O avatar de vidro nunca teve
brilho** — tinha uma borda cinza quase uniforme.

#### O conserto: duas camadas viram contrato, e um preset por forma

O aro e o realce passaram a ser `var(--glass-rim-image | --glass-sheen-image,
<o valor de hoje>)`. Provado que é extração e não mudança: o painel e o
`ColorTile` saem **byte a byte iguais** — hash `5347fc9d` e `387df95d`, 581
caracteres, antes e depois.

`@utility glass-round` troca o aro por um **`conic-gradient`**: num cônico cada
ponto do perímetro mapeia para um ângulo, e não há canto a perder. Medido
depois: **14%** do perímetro no pico contra os 0% de antes, e o vale de 57,5%
para 8,5%.

**Ele não entra no `glass-control`**, e o motivo é o `ColorTile`: aquele preset
serve as duas peças pequenas, e o ladrilho é `rounded-md` — um bisel polar num
quadrado arredondado põe as transições nos cantos errados. O `Avatar` o veste
por **forma**, e em `shape="rounded"` o linear continua certo.

O especular entra por `--glass-sheen-image`, a camada mais de cima — **a única
que sobrevive a um tom opaco**. Ela estava sem produtor desde que `Button` e
`Checkbox` perderam o modo de vidro, e era exatamente o encaixe que faltava.

#### Os números, e o que cada um decidiu

| | escuro | claro |
| --- | --- | --- |
| abertura do tom | **92%** | **98%** |
| contraste onde há letra | 5,93 – 6,34 | 4,61 – 5,14 |
| desvio contra o opaco | 4,5 | 4,9 |

**A abertura é diferente por tema porque a lâmina troca de polaridade.** No
escuro ela é preta e o corpo afunda; no claro é branca e ele **sobe**, empurrando
as iniciais para o piso — a 92% dois tons reprovavam (4,48 e **4,37**), e 98% é a
abertura máxima que passa. No claro ela quase não se paga, e isso fica dito.

#### A medição do especular quase produziu o conserto errado

A sonda acusou o reflexo derrubando o contraste para **3,36** em todos os seis
tons. O número estava certo e a **pergunta** estava errada: ele media a letra sob
o **pico** do reflexo, e o pico fica a 16% da altura enquanto a letra começa a
37%. No centro da caixa o gradiente já resolveu para `transparent`; no ponto onde
a letra de fato está ele vale **16,7%** do pico.

O especular ficou em **14%** e não em 20 por robustez — a geometria é estável nos
cinco degraus (topo da letra a 37,4% no `md` e 38,4% no `xl`, porque caixa e
fonte escalam juntas), mas uma inicial só ou uma fonte maior aproximam o texto
do pico.

#### Um erro meu de instrumento, e ele invalidou uma rodada de medições

A sonda de cor pintava `#000` **antes** da cor, então todo alfa lido voltava
**1** e a lâmina branca do tema claro era medida já composta sobre preto. Ela
reportou `alfa: 1` para um tom que o CSS declarava a 97% — a contradição entre a
medição e o mecanismo é que denunciou.

Com ela corrigida (`clearRect` e nada de preto), as conclusões do tema claro
mudaram e a abertura teve de ser remedida do zero. **Quatro erros de instrumento
nesta série, todos meus, e a régua é sempre a mesma:** quando a medição contraria
o mecanismo, o instrumento é o primeiro suspeito.

#### Três asserções novas, e a sexta sabotagem achou um buraco

As 20, 21 e 22 trancam: as duas camadas serem contrato com fallback e nenhum tema
as declarar; o preset ser de imagem e o cônico **não** vazar para o
`glass-control`; e as paradas serem angulares e fecharem o ciclo — um `%` num
cônico mede o **raio**, não o arco, e o bisel deixaria de acompanhar a borda.

As três falharam na primeira escrita, e as três por erro do instrumento:
`ESCURO` vai de `.dark {` até o **fim do arquivo** e engolia as utilities; a
fatia do `glass-control` atravessava o `glass-round`, que mora entre ele e o
vizinho seguinte; e o regex das paradas capturava o `45` de `from -45deg`.

E a sabotagem que **passou** achou o buraco real: nada garantia que o preset
chegasse à peça. Tirar `glass-round` da régua devolvia o avatar ao aro linear em
silêncio. Hoje a 22 exige que a régua o contenha e que o `Avatar` o vista por
forma.

#### Zero pixel em produção

Os dois consumidores reais — `sidebar-user-profile.tsx` e
`members/page-client.tsx` — passam só `size`, `shape` e `className`. Nenhum usa
`glass`, e o modo segue sem consumidor de produto.

### Rodada 49 — o vidro volta ao botão primário, e o número explica a reprovação

O pedido foi trazer o vidro do iOS ao `Button variant="primary"` **sem tirar a
cor primary**. Isto reabre a rodada 45, em que este mesmo botão ganhou vidro,
foi visto na tela e reprovado — *"ficou péssimo"*.

**A medição desta rodada explica por quê, e o número é duro:**

| | |
| --- | --- |
| contraste do rótulo hoje (branco sobre o verde), escuro | **5,22** |
| margem até o piso de 4,5 | **0,72** |
| véu branco a 8% sobre o corpo | **4,49 — reprova** |
| os 14% que o `glass-round` usa | **4,01 — reprova** |

**Um botão preenchido com texto branco quase não tem margem para brilho
branco.** A versão de quatro rodadas atrás punha o brilho no corpo inteiro:
ou reprovava o contraste, ou era fraca demais para se ver. Não havia saída —
o vocabulário que a permite (`--glass-sheen-image` e `--glass-rim-image` como
contrato) só nasceu nas rodadas 47 e 48.

#### A faixa livre é o que torna isto possível

Medida a caixa do glifo nos cinco degraus, o texto **nunca começa antes de 32%**
da altura:

| degrau | altura | topo do glifo | livre |
| --- | --- | --- | --- |
| `xs` | 24 | **32,0%** | 7,7px |
| `md` | 32 | 34,2% | 11,0px |
| `xl` | 40 | 37,4% | 15,0px |

O gloss se esvai em **28%** e não alcança o rótulo em degrau nenhum — medido, o
alfa dele na altura do glifo é **0%**. Fora da caixa do texto o alfa deixa de ser
refém do contraste, e é isso que permite um brilho que se vê.

Medido depois: **5,22 com e sem vidro** no escuro e **7,34** nos dois no claro.
O contraste do rótulo não se mexeu um centésimo.

#### A cor é de quem veste, e o preset não a conhece

`--glass-fill-tone` é publicado pelo **compound do variant**, não pelo preset.
Cravar `var(--primary)` na utility faria toda peça de vidro ser verde — e o
shorthand `background` da receita já apaga o `bg-*` do consumidor, que é a
armadilha nº 1 da régua. Medido: o tom resolve para `oklch(0.5 0.125 166)`, que
é o `--primary` byte a byte.

#### O estado move variável, e é isso que conserta o defeito calado

**`hover:bg-*` morre sob vidro.** Ele declara só `background-color`, e o
shorthand o apaga — foi assim que o `hover:bg-primary/90` do variant sumiu na
primeira versão. Aqui o par move `--glass-gloss` (16% → 24% no cursor, 8% no
toque), e o botão **acende** ao apontar em vez de escurecer, que é o
comportamento do iOS.

**De brinde, o botão de vidro responde ao toque.** Verificado no CSS emitido: o
`hover:` compila dentro de `@media (hover: hover)` e o `active:` **fora** dela.
O `primary` sem vidro segue na lista de inertes do
`button-touch-response.test.ts` — o de vidro não está.

#### Sem união de props, e é o que evita a dívida da 45

O vidro **soma** à cor do variant em vez de substituí-la, então `variant` não é
fechado e não há união discriminada. A rodada 45 fechou, e 11 wrappers de `ui/`
quebraram de uma vez — desestruturar o rest de uma interseção com união aninhada
colapsa os ramos. Nenhum wrapper se mexe aqui.

**E os 70 botões primários de produção não mudam**: o eixo é opt-in, e a
asserção 26 tranca a string do variant literal — se ela ganhar um caractere, o
teste cai.

#### O corte largo cobrou pela terceira vez

A asserção 8 fatiava de `@utility glass-control` até `@utility no-scrollbar`, e
entre os dois moram hoje **três** presets. O comentário do `glass-fill` cita o
shorthand `background` por extenso, e ela acusou a **prosa**. É o mesmo defeito
que a 7 tinha (varrer texto cru) e que a 21 já havia consertado no próprio corte.
Hoje ela corta no fechamento da utility e remove comentários.

**A régua que sobra:** uma fatia de CSS que termina no *vizinho seguinte*
envelhece toda vez que alguém escreve uma utility no meio. Ela precisa terminar
no próprio `}`.

#### O que não entrou

`secondary` e `destructive` seguem sem vidro: cada preenchido tem margem de
contraste própria, e o `destructive` é um **véu** no tema claro em vez de um
preenchimento. Cada um entra quando for medido. E nenhuma tela adota o modo —
**zero pixel em produção**.

### Rodada 50 — o vidro do botão, segunda passagem: a luz sai do corpo

A 49 foi vista e reprovada — *"ficou muito feio"*. A direção que veio junto era
precisa: **sem degradê dentro**, luz **só na borda**, a borda **interna**, e na
**própria cor primary**, mais clara ou mais escura.

O que a 49 tinha de errado não era o mecanismo — era o desenho: gloss branco no
terço superior mais um bisel branco/preto. Ficaram de pé o eixo opt-in, o
compound do primary, a cor em `--glass-tone` (verde byte a byte), o estado por
variável e a asserção 26 que tranca os 70 botões de produção. Saíram inteiros o
gloss e o bisel.

#### A aresta é a própria cor, e o deslocamento saiu de medição

Varrido o `--primary` por *relative color* (`oklch(from … calc(l + ΔL) c h)`),
compondo sobre o fundo real:

| ΔL | escuro: vs corpo / vs página | claro: vs corpo / vs página |
| --- | --- | --- |
| −0.12 | 1,64 / 2,21 | 1,60 / 11,77 |
| **+0.12** | **1,58 / 5,76** | **1,63 / 4,51** |
| +0.20 | 2,16 / 7,87 | 2,24 / 3,27 |

**+0.12**: a aresta se separa do corpo em ~1,6 nos dois temas — o peso dos aros
da casa (1,29 a 1,76) — e no claro ainda dá 4,51 contra a página branca, ou seja
continua parte do botão. A +0.20 cai para 3,27 e começa a se soltar como halo.

**Clarear nos dois temas, contra a polaridade da casa.** A régua do `glass`
inverte o aro por tema (luz no escuro, sombra no claro), e −0.12 mede igual
(1,60). Mas o pedido é *shiny*, e uma aresta mais escura lê como recesso — afunda
o botão em vez de acendê-lo. Fica dito que o recesso mede igual e que quem
decidiu foi a tela.

**O aro do `glass` já era a borda interna.** `border: 1px solid transparent`
pintado no `border-box` é exatamente o anel que o pedido descreve — nada de
`inset-ring` nem `box-shadow`, e o `focus-visible:ring-3` da base não é tocado.

#### O preset não conhece a cor, só a desloca

`--glass-tone` e `--glass-rim-image` derivam de `--glass-fill-tone` por relative
color, que o `ColorTile` já usa. O estado move `--glass-fill-shift` (−0.03 no
cursor, −0.05 no toque) — escurece como o `bg-primary/90` do primário sem vidro,
sem nunca escrever `bg-*`, que morre calado sob o shorthand.

Medido depois: corpo idêntico ao `--primary`; rótulo em **5,22 / 7,34** com e
sem vidro; sheen e nuvens em `transparent`; três tons de estado distintos
(121 → 112 → 106 no canal verde).

#### Uma sonda minha acusou o aro transparente — e era o regex

A leitura do aro voltou `[0,0,0,0]`. O CSS estava certo: o regex
`oklch\([^)]*\)` parava no primeiro `)` — o de `var(--glass-fill-tone, …)` — e
recortava uma cor inválida. O computado de uma custom property é o texto **não
substituído**, então o `var()` ainda estava lá. A leitura certa é dar a um
**filho** do botão `background-color` com a mesma expressão e ler o resultado: o
navegador resolve com as variáveis herdadas. *Um regex não parseia CSS* — quinta
ocorrência nesta série.

#### As asserções 23–25 mudaram de assunto

A 23 passou a proibir `--glass-sheen-image` no preset (o gloss não volta pela
porta dos fundos); a 24 exige que o aro derive da cor da peça, com deslocamento
**positivo e ≤ 0.16** e uniforme (duas paradas, 0% e 100% — um gradiente de
direção seria o degradê que saiu); a 25 troca `--glass-gloss` por
`--glass-fill-shift`. Quatro sabotagens, quatro reprovações — incluindo a aresta
escurecida e a forte demais.

**Zero pixel em produção**, e nenhuma tela adota o modo.

#### Rodada 50b — o anel estava na borda errada, e o botão inteiro lia mais claro

Relatado com o botão original selecionado: *"a cor do glass está mais clara do
que o button original"*. O corpo era idêntico — medido, `[0,121,82]` nos dois —
e ainda assim ele tinha razão.

A 50 pintou o anel claro **no aro**, que é o `border-box`: a borda **externa** de
1px. A silhueta inteira do botão ficava um pixel mais clara, e o olho não separa
"o contorno clareou" de "o botão clareou". A frase da 50 — *"o aro do `glass` já
era a borda interna, nada de `inset-ring`"* — estava **errada**: o aro é a borda
externa. "Borda interna" é um pixel para dentro dela.

**Conserto:** o aro volta a ser o próprio tom (silhueta byte a byte igual à do
botão sem vidro — medido, borda `[0,121,82]` nos dois), e o anel claro vai para
dentro por `inset-ring-1 inset-ring-(--glass-fill-edge-color)`. A cor é
publicada pela utility como variável e **não** como `box-shadow`: os dois vivem
na mesma propriedade, e só o utilitário do Tailwind compõe com o
`focus-visible:ring-3` da base — verificado no emitido, `--tw-inset-ring-shadow`
e `--tw-ring-shadow` são entradas distintas da cadeia.

A asserção 24 passou a exigir que o aro seja `var(--glass-tone)` sem
deslocamento, que o deslocamento viva em `--glass-fill-edge-color`, e que o
botão o vista por `inset-ring`. Três sabotagens — o anel de volta à borda
externa, o botão sem anel, o anel escurecido — reprovam.

**A lição:** "interno" e "externo" numa borda de 1px são um pixel de diferença e
uma leitura inteira de diferença. Eu medi o corpo e declarei igual; o que
mudava era a **silhueta**, e silhueta se mede na borda, não no centro.

#### Rodada 50c — o vidro sai do botão, pela segunda vez

Removido inteiro por decisão do dono. Saíram o eixo `glass` do `cva`, o
compound do primary, a prop, o `data-glass`, a `@utility glass-fill`,
`glassFillSurfaceClassName`, as quatro asserções (23–26) e a seção do catálogo
com as duas notas. **`git diff` de `button.tsx` está vazio** — o arquivo voltou
byte a byte ao que era antes da 49.

Foram **três desenhos em três rodadas**, e os três reprovados na tela: gloss
branco no corpo (49), anel claro na borda externa (50), anel um pixel para
dentro (50b). Nenhum caiu por número — os números fechavam nos três.

**O que a medição deixa registrado, e é o que a próxima tentativa herda:**

- um botão preenchido com rótulo branco tem **0,72** de margem sobre o piso de
  4,5, então brilho branco no corpo reprova a partir de **8%**;
- a luz cabe na faixa acima da linha do texto, que nunca começa antes de **32%**
  da altura nos cinco degraus;
- a aresta na própria cor a **+0.12** de L mede ~1,6 contra o corpo nos dois
  temas — o peso dos aros da casa;
- pintá-la na borda **externa** deixa a silhueta 1px mais clara, e isso se lê
  como o botão inteiro mais claro. *Silhueta se mede na borda, não no centro.*

É a **segunda** vez que o vidro sai deste botão — a primeira foi na 45, quando
ele era peso próprio com eixo de sete tons. As duas terminaram na tela.

**O que fica de saldo para o resto do sistema:** a `@utility glass-fill` era o
único consumidor de `--glass-sheen-image` como produtor, e ela sai; a camada
volta a ser contrato sem produtor, como era. `glass-round` e `glass-material`
não são tocados, e `Avatar` e `ColorTile` seguem com o modo.

### Rodada 51 — as superfícies flutuantes ganham o material do cabeçalho

O pedido foi o dropdown do `Select` com o fundo do cabeçalho — borrão de
verdade — mas na cor **cinza** (`--popover`) e não no preto da página. Decidido
junto: vale para **todas** as superfícies flutuantes, e a paleta se alinha.

#### O risco técnico morreu na medição

O `SelectContent` é posicionado por um wrapper com `transform` **permanente** e
`will-change: transform`, e carrega `translate-*` estáticos no próprio nó. Pela
spec, `transform` cria um *backdrop root* e o borrão não veria a página.

**Medido, funciona.** Com `blur(16px)` injetado e uma grade de quadrados
coloridos atrás, os de dentro do dropdown saem borrados e os de fora nítidos. A
teoria dizia que não; a tela disse que sim. **Quando as duas discordam sobre o
que se vê, quem decide é a tela.**

#### O alfa é diferente por tema, e o número é o contraste

O texto que aperta não é o do item (`--popover-foreground`, folgado em qualquer
alfa) e sim o **`--muted-foreground`**, dos rótulos de grupo e atalhos. Composto
sobre o que de fato **preenche área** atrás de um menu:

| | escuro | claro |
| --- | --- | --- |
| pior fundo | `primary` | `primary` |
| 60% | **4,64 — passa** | 3,00 — reprova |
| 85% | — | **4,72 — passa** |

No claro o `--popover` é **branco** e o pior fundo é o verde escuro do
`primary`: um branco a 60% sobre ele vira cinza-esverdeado e o texto secundário
morre. Daí a base ser 85% — que serve o claro **e** é o fallback de quem não tem
`backdrop-filter` — e o escuro abrir para 60% só sob `supports-backdrop-filter:`.

Repete o teto que a 47 já mediu: **no claro o vidro quase não se paga.** Sobre a
página o contraste é o mesmo em qualquer alfa (5,91 a 6,01); o que a
translucidez custa só aparece sobre cor cheia.

#### Dois erros meus de sonda, e os dois inflavam o pior caso

Incluí `--foreground` e `--destructive` no conjunto de fundos. O primeiro é cor
de **texto** — glifos finos sob blur de 24px se diluem, não formam bloco; o
segundo é um **véu** no tema claro (`bg-destructive/10`), nunca um
preenchimento. Com eles, nenhum alfa até 95% passava.

**A régua: o pior caso de um fundo é o que preenche área, não o que tem a cor
mais forte.**

#### A receita estava em quatro lugares, e agora é uma

O doc de `menu-classes` afirmava ter extraído as quatro cópias — e três tinham
ficado: `Select`, `Popover` e `HoverCard` carregavam a string à mão. A paleta
tinha uma **quarta receita de vidro** (`bg-popover/85` com `backdrop-blur` de
8px, contra os 24 e o `saturate(1.5)` do material). Os quatro passaram a vestir
`menuPanelSurfaceClassName`, que alcança **11 superfícies**.

**Os dois `ScrollButton` do `Select` repintavam `bg-popover` opaco.** Com a
casca translúcida eles viravam duas faixas sólidas no topo e na base — o tipo de
defeito que só aparece com o menu rolando. Foram a transparente.

#### O primeiro teste sobre `menu-classes`

Não havia nenhum. As asserções 23–25 trancam: a régua veste `glass-surface` e
não escreve borrão próprio; o guarda de transparência reduzida existe; o escuro
abre mais que o claro e só sob `supports-`; e as quatro cópias não voltam — nem
a superfície à mão, nem o repinte nos botões de rolagem. Cinco sabotagens, cinco
reprovações.

**Uma armadilha de regex, a sétima desta série:** proibir `/backdrop-filter/` na
régua acusa a **própria receita**, porque o variante `supports-backdrop-filter:`
contém a string. A asserção ancora em `\bbackdrop-blur`, que é a classe.

#### O vidro é invisível sobre um card, e o número explica

Visto na tela, o dropdown continuava lendo como opaco. **O CSS estava certo** —
medido: `blur(24px) saturate(1.5)` e fundo em `oklab(0.205 0 0 / 0.6)`. O que
falta não é o material.

`--popover` e `--card` são **exatamente a mesma cor** nos dois temas
(`oklch(0.205)` no escuro). Um popover translúcido sobre um card é
aritmeticamente idêntico a um opaco:

| o que está atrás | delta RGB com o vidro |
| --- | --- |
| **card** | **0** |
| página | 5 |
| muted | 6 |
| algo colorido | 79 |

As superfícies do app vivem entre rgb 10 e 38 — misturar duas delas devolve
deltas de 0 a 6. É a mesma lei que a `@utility glass` já escreve: **borrar cor
chapada não desenha nada.** O vidro aparece quando há conteúdo com contraste por
baixo, e some quando não há.

O dono viu o diagnóstico e decidiu **não mexer**: as saídas eram uma aresta
luminosa (independente do fundo, como o avatar e o botão usam) ou separar
`--popover` de `--card`, que é decisão de sistema. Fica registrado para quem
vier — o defeito não é o material, é a distância entre as superfícies.

#### O que muda em produção

Diferente das rodadas de vidro anteriores, **esta não é zero-pixel**: 11
superfícies mudam de aparência, e `DropdownMenu`, `Popover` e `Select` estão em
telas do app. Foi pedido.

**E o `app-header` fica como a única superfície de vidro fora da receita** — 8px
de borrão cru, só quando rolado, na outra grafia de `supports-` e sem guarda de
transparência reduzida.

#### Rodada 51b — o tooltip era a quinta cópia, e ela divergia

A rodada 51 disse que a receita estava escrita em **quatro** lugares. Eram
cinco: o `Tooltip` também a escrevia por extenso, e era o único que **divergia
da régua** em vez de repeti-la:

| | a régua | o tooltip |
| --- | --- | --- |
| raio | `rounded-lg` (10px) | `rounded-md` (8px) |
| moldura | `ring-1 ring-foreground/10` | `border border-border` |

Ele já falava a língua certa — `--popover`, o conserto da rodada em que a
superfície dele era emprestada da `Sidebar` — e por isso passou por conforme.
**Falar a língua não é vestir a régua**, e a cópia divergente é exatamente a que
o teste da 51 existia para pegar: ela só não entrou na lista.

Vestindo `menuPanelSurfaceClassName` ele ganha o material do cabeçalho, e as
duas divergências caem junto. **Isso é mudança visível e deliberada**, dita em
vez de passada de contrabando dentro do pedido de vidro.

**O alfa da régua serviu sem revisão, e o motivo é a tinta.** Os 60%/85% foram
calibrados contra o `--muted-foreground` dos rótulos de grupo, que é o texto que
mais aperta numa superfície de menu; o tooltip é inteiro `--popover-foreground`,
a tinta cheia. Medido sobre o pior fundo real (o preenchimento do `primary`):
**11,5 no escuro e 15,54 no claro**.

Verificado com a grade de quadrados atrás: `backdrop-filter: blur(24px)
saturate(1.5)` computado, `oklab(0.205 0 0 / 0.6)` no escuro e
`oklab(1 0 0 / 0.85)` no claro, raio 10, borda 0 — e o xadrez dissolvido dentro
da caixa enquanto continua nítido em volta.

A asserção 25 do `glass.test.ts` passou a iterar **cinco** arquivos, e foi
sabotada: com a cópia de volta, ela reprova nomeando o tooltip.

#### Rodada 51c — o vidro chega ao diálogo, e o véu é o teto dele

O pedido foi o material do cabeçalho nos diálogos. A primeira leitura foi que
quem devia borrar era o **véu** — e ela foi recusada pelo dono, com a frase que
define o escopo: *"eu não queria que mexesse no que está atrás do dialog, e sim
no dialog"*. O `--overlay` fica como estava, e a placa é que veste.

**A placa recebe a mesma receita das 11 superfícies flutuantes** —
`bg-background/85 glass-surface`, abrindo para 60% sob
`supports-backdrop-filter:dark:` e caindo para o opaco sob
`reduced-transparency:`. Uma receita só na casa, e o `AlertDialog` vem junto
porque mede pelo `dialogContentVariants`.

**E o teto está medido, porque ele não é o material.** Entre a placa e o
conteúdo há um véu de 60% de preto, e borrar cor chapada não desenha nada — a
lei que a rodada 51 já tinha escrito para o dropdown sobre um card, aqui
agravada, porque o véu **destrói** o contraste que o borrão precisaria ver:

| atrás | placa a 60%, escuro | delta vs. opaco |
| --- | --- | --- |
| card | 10 | **0** |
| página | 8 | 2 |
| muted | 12 | 2 |
| botão `primary` | 6,25,19 | **15** |

No tema escuro o vidro só aparece quando há **cor cheia** atrás. Verificado na
tela com uma grade de quadrados coloridos entre o conteúdo e o véu: o xadrez sai
dissolvido dentro da caixa e continua legível fora dela.

**No claro ele se paga, e é lá que o alfa aperta.** A placa desce de 250 para
**236** sobre um card, com o `--muted-foreground` em 5,09 — e 4,38 sobre o pior
fundo real, o preenchimento do `primary`. É por isso que o alfa aberto ficou
escopado no escuro: a 60% no claro o mesmo texto cai a **4,09** e reprova.
Medido depois: `blur(24px) saturate(1.5)` nos dois temas, com
`oklab(0.145 0 0 / 0.6)` no escuro e `oklab(0.985 0 0 / 0.85)` no claro.

#### O casco da paleta precisou de dois neutralizadores, e o `twMerge` explica

`CommandDialog` passa `bg-transparent` ao `DialogContent` de propósito — quem
pinta é o `Command` de dentro, e dois 85% empilhados dariam 97,75%, que é o
bloco aceso que este arquivo já registra. **O `twMerge` derruba a `bg-*` base e
não as que vivem sob variante**: sem `supports-backdrop-filter:dark:bg-transparent`
e `reduced-transparency:bg-transparent`, a paleta sairia com duas superfícies
empilhadas no tema escuro. Medido depois: casco em `rgba(0,0,0,0)` e o `Command`
em `oklab(0.205 0 0 / 0.6)` — uma superfície só.

#### O que não muda, e por quê

O véu segue em `blur(4px)` sem `saturate` e **sem o guarda de transparência
reduzida** — a sexta grafia de vidro do repositório, escrita à mão em três
arquivos (`dialog.tsx`, `alert-dialog.tsx` e o `EDGE_PANEL_OVERLAY_CLASS`, que
serve `Sheet`, `Drawer` e o painel da `Sidebar`). Foi decisão explícita não
tocá-lo. Fica no backlog, com o número que o justifica: **é ele que limita o
efeito no tema escuro**, e quem quiser o vidro visível ali mexe no `--overlay`,
não na placa.

E `Sheet`, `Drawer` e `EdgePanel` ficaram com placa opaca **nesta rodada** —
a rodada 53 os vestiu, junto com a extração da receita para `lib/`.

#### Um erro meu que quase custou uma rodada inteira

Ao desfazer a primeira direção, rodei **`git checkout` no arquivo de teste** —
e ele **não** estava limpo: as rodadas 46 a 51 tinham +335 linhas ali sem
commit. Dez asserções (16 a 25), a reescrita da 7 e três constantes de fatia
foram apagadas de uma vez.

É literalmente a lição que a rodada 34 registrou — *desfazer edição de teste com
`git` num arquivo já editado é apagar trabalho* —, e eu andei direto nela um mês
depois de escrevê-la. **A régua ganha um corolário: antes de `git checkout`,
`git diff --stat` no arquivo.** Um `M` no `git status` do início da sessão não
diz de quem é a modificação.

A recuperação foi pelo **transcrito da sessão**: os `python3 - <<'PY'` que
escreveram cada asserção estão lá, e replayá-los na ordem contra o arquivo do
`HEAD` reconstruiu os 25 testes. Restam ~21 linhas de prosa de comentário que
não bateram exatamente com o estado anterior; o comportamento é idêntico e está
provado pela suíte e pelas sabotagens.

**E o mesmo dia teve o parente do defeito:** um corte `s[:i] + novo + s[j:]`
entre duas âncoras `indexOf`, supondo que a numeração das asserções seguia a
ordem do arquivo. Não seguia — a 10 mora no fim —, e a fatia comeu dez blocos
que viviam no meio. **Fatia entre duas âncoras apaga o que estiver entre elas**,
e a forma segura é ancorar no fechamento do bloco que se quer suceder.

### Rodada 52 — a zona do carrossel é o triplo, porque o item tem borda

Relatado com o print anotado: *"o fade está fraco — aparece a borda do lado
direito desse segundo card"*. Antes de mexer, a conferência que a rodada
anterior transformou em régua: `carousel.tsx` estava byte a byte no `HEAD` e o
`git diff` do `globals.css` **não toca a rampa** — só acrescenta o modo material
e as utilities de borrão. Nada tinha regredido; o que existia era o número.

**`--scroll-fade-x-h` vale 2rem, e ele foi calibrado para glifo.** Uma trilha de
abas, uma célula de tabela: ali a rampa só precisa apagar letra. Um `Card` tem
**borda**, e um fio de 1px é o que mais resiste — ele corre a altura toda e não
tem contrafundo que o dissolva. Medido o alfa desse fio a 15px da ponta:

| zona | alfa do fio |
| --- | --- |
| 2rem (o sistema) | **31%** — legível, e é o "fade fraco" |
| 4rem | 13% |
| **6rem** (o carrossel) | **9,5%** |

**O piso não é a alavanca, e isso foi medido ao vivo.** `--scroll-fade-floor` é
0,06 de propósito, para a ponta dizer que há mais e não que acabou. Baixá-lo a
zero num A/B na página é **indistinguível**: 6% de uma borda de 1px dá ~1
unidade de RGB. Quem decide é a **largura** da zona.

E é variável e não propriedade: ela herda para a rampa sem disputar com nada, e
os outros consumidores da dissolução horizontal ficam nos 2rem.

#### A asserção reprovou código correto por sete caracteres

A 10 do `carousel-ladder.test.ts` — *quem carrega a máscara não desenha nada* —
fatiava os últimos **900** caracteres antes do `data-slot="carousel-content"`.
Bastou o viewport ganhar uma classe com um comentário de uma linha para o
`overflow-hidden` sair da janela por **7 caracteres** e o teste cair.

Novecentos é um número mágico. O corte passou a ser pelo `className={cn(`, que é
o bloco de verdade — **mais estrito, e não mais frouxo**, e não envelhece a cada
linha que alguém escreve ali. Sabotada: com um `bg-card rounded-lg` no viewport,
reprova. É parente da lição que o `glass.test.ts` já registra duas vezes: *corte
por âncora larga é asserção que erra sozinha.*

#### Duas tentativas que a tela reprovou, e ficam registradas

**O material do iOS no carrossel** (`edge="material"`: máscara fora, borrão de
7/14/21px no lugar) foi implementado e reprovado a olho. O que ele deixou
medido, para quem tentar de novo:

- **O viewport não é bloco de contenção.** As camadas absolutas escapavam para a
  raiz — 111px de altura contra os 75 do viewport, cobrindo os pontos —, e um
  absoluto cujo bloco de contenção está acima **não** é recortado pelo
  `overflow-hidden` de quem está no meio. Sem `relative` no viewport, não há
  material no carrossel.
- **Ali a camada pode ser filha do rolável**, ao contrário do `ScrollFade`. A
  invariante existe por causa da máscara; em `material` não há máscara, e ser
  filha resolve a herança das variáveis — irmão não lê custom property de irmão.
- **A raiz não serve de casca**: ela carrega as setas, os pontos e a contagem.

### Rodada 52b — a página do `Command` abria no meio, e quem rolava era o cmdk

Relatado como *"por que essa página vem por padrão no meio?"*. Medido ao entrar
em `/designsystem/command`: `scrollY` **1754** numa janela de 998.

**Não é a coluna da esquerda.** Ela já rola só o próprio contêiner — o
`revelarAtivo` de `ds-shell.tsx` escreve `scrollTo` no elemento e o comentário
dele registra por quê: *"`scrollIntoView` rola todos os ancestrais roláveis, e
levaria a janela junto"*.

**É o cmdk, e pelo mesmo mecanismo.** Ele marca a primeira linha assim que os
itens se registram e chama `scrollIntoView({block:"nearest"})` nela
(`node_modules/cmdk/dist/index.mjs`), e isso rola **todos** os ancestrais —
inclusive o documento. A página monta **cinco** `Command` inline; três ficavam
com item selecionado, e o último estava em `topoNaPagina: 2528`:

| item selecionado | topo na página |
| --- | --- |
| Carteiras (Inline) | 565 |
| Nova transação | 1210 |
| **Carteiras (As três faixas)** | **2528** — o que puxou |

**O componente não tem defeito nos usos reais**, e é por isso que o conserto é
no catálogo: a paleta vive num `CommandDialog` (que já liga
`autoSelectFirst={false}`) e o `Combobox` num popover — nos dois a página não
rola por baixo. O catálogo é o **único** lugar que monta `Command` inline no
fluxo da página, e cinco vezes.

As três demos com itens passaram a `autoSelectFirst={false}` — o prop que o
próprio componente já expõe e que aquela página documenta. Medido depois:
`scrollY` **0**, zero itens selecionados, os cinco `Command` intactos.

**E `value` controlado não seria saída**: o `ne()` do cmdk roda a cada mudança
de seleção, não só no registro. Verificado no fonte antes de escolher o
caminho — a alternativa que eu tinha oferecido estava errada.

### Rodada 52c — o véu clareia no escuro, e é o que faz o vidro dos modais existir

As rodadas 51c e 51d puseram o material na placa do `Dialog` e deixaram o
diagnóstico escrito: **o teto não é o material, é o véu.** Um `backdrop-filter`
atrás de 60% de preto borra cor chapada, e borrar cor chapada não desenha nada.
Com a paleta a pergunta voltou — *"mude o fundo desse Command para o
transparente com blur"* —, e ela **já estava** com a receita desde a rodada 51.
O que faltava era o que ela tinha para mostrar.

`--overlay` do `.dark` vai de `oklch(0 0 0 / 0.6)` para **`/ 0.4`**. Medido:

| | 0.6 | **0.4** |
| --- | --- | --- |
| estrutura card↔página (o que o borrão mostra) | 9 | **14** |
| estrutura primary↔card | 47 | **70** |
| paleta sobre o `primary` | 14,33,27 | **14,43,33** |
| placa do diálogo vs. card velado | 1,006 | **1,026** |
| texto fraco na paleta | 6,49 | **5,86** |

**Clarear não custou separação — melhorou.** Varridos os alfas, a placa de um
diálogo contra o fundo velado mede 1,01 a 1,08 em **toda** a faixa: o véu nunca
separou um diálogo no escuro, e quem separa é o `shadow-lg` com o `ring-1
ring-foreground/10`. E o texto secundário da paleta continua em 5,86, acima dos
4,5 da norma.

**No claro ele não desce, e isso é medido, não simetria.** Ali o véu **é** a
única coisa que separa uma placa branca de uma página branca: 0.4 dá 2,60 contra
o card velado, 0.3 dá 1,94 e 0.2 dá 1,51. E clarear não compraria estrutura,
porque as superfícies do tema claro já são todas quase-brancas — não é o véu que
as achata. Os dois temas passam a dizer 0.4 por caminhos opostos.

**O que muda em produção:** todo modal do app. O conteúdo atrás passa a ler como
forma borrada em vez de mingau preto, que era o ponto do pedido — e é a primeira
coisa que se nota ao abrir um diálogo.

**E o véu segue em `blur(4px)` sem `saturate` e sem guarda de transparência
reduzida**, escrito à mão em três arquivos (`dialog.tsx`, `alert-dialog.tsx` e o
`EDGE_PANEL_OVERLAY_CLASS`, que serve `Sheet`, `Drawer` e o painel da
`Sidebar`). Continua sendo a única superfície de vidro do repositório fora da
receita, junto do `app-header`. Fica no backlog.

### Rodada 52d — o material do iOS nas duas pontas da paleta, somado à rampa

O pedido foi o efeito do iOS no topo e no fim do `Command`. A rodada 46b já
tinha construído as peças — `scroll-fade-blur-y` e o preset
`scroll-fade-material` —, e a paleta era um consumidor natural que ficou de
fora.

**Mas aqui o material `soma`, e não substitui**, ao contrário do que o
`edge="material"` do `ScrollFade` faz. A razão é estrutural e já estava
escrita: **as três faixas desta paleta não pintam nada**, então é a rampa quem
esconde o conteúdo sob o campo de busca. Desligar `--scroll-fade-mask` — que é
o que o modo material faz — deixaria o texto aparecer atrás do input. O que
entra do material é só o **borrão**: `scroll-fade-material` é preset de
variável e move o raio (7px × índice) e a vibrância (1,5), os mesmos números de
`.mobile-glass-surface`.

Três coisas que a composição exigiu, e as três são mecânicas:

- **`useScrollFade({ shell: true })`.** As camadas são **irmãs** da lista, e
  irmão não lê custom property de irmão. Com `shell` as duas variáveis também
  vão para a casca, de onde descem por herança para os dois lados. Medido:
  `--scroll-fade-start: 140px` na casca **e** na lista.
- **`relative` na casca.** Sem bloco de contenção o absoluto resolve contra um
  ancestral qualquer — é o defeito que o `Carousel` mediu nesta mesma série
  (111px de camada contra 75 de viewport, cobrindo os pontos).
- **A geometria saiu de graça.** A camada é ancorada em `--scroll-fade-band-h`
  / `--scroll-fade-foot-h`, que esta casca já publicava desde a rodada das três
  faixas, e a altura é a mesma zona que a rampa dissolve. Medido com a lista
  rolada em 140: **44px nas duas pontas**, `blur(7/14/21px) saturate(1.5)`, e a
  máscara da lista intacta.

A asserção **14** de `scroll-fade.test.ts` tranca as cinco: o borrão entra, a
máscara **não** sai (`data-scroll-fade-mode` proibido no arquivo), a camada é
declarada entre a casca e a lista (irmã, nunca filha do mascarado), o `shell` e
o `relative`. Sabotada duas vezes — tirando o `shell` e ligando o modo material.

**Uma nota de instrumento:** o `CommandDialog` fecha entre chamadas do harness,
então a verificação visual foi feita numa demo inline com o teto forçado a
200px. A instrumentada — alturas, raio, vibrância, máscara — vale para os dois,
porque o nó é o mesmo.

### Rodada 52e — a camada cobria depois da faixa, e a rampa cobria atrás dela

A rodada 52d entregou o material nas duas pontas da paleta e deixou uma costura
que o dono circulou: o conteúdo atrás do campo de busca aparecia **fantasma e
nítido**, com o borrão começando só abaixo dele.

**Medido, com a lista rolada:**

| | posição relativa à casca |
| --- | --- |
| campo de busca | 1 → **49** |
| camada de borrão, antes | **49** → 77 |
| camada de borrão, agora | **1** → 77 |

**A causa é que rampa e camada tinham geometrias opostas para a mesma
variável.** A rampa **soma** a faixa na origem — `--scroll-fade-top-h` é
`band-h + clamp(…)` — e por isso a região atrás do campo já sai dissolvida no
piso. A camada **subtraía**: `top: var(--scroll-fade-band-h)` deslocava a caixa
para depois da faixa. Mesma variável, semânticas opostas, e o preço estava na
tela: a 6% de alfa o texto ainda lê (canal 29 contra 15, ~1,3:1), então o olho
via um fantasma legível colado a um borrão, com uma aresta entre os dois.

Hoje as quatro pontas ancoram em `0` e **somam** a faixa à medida — a mesma
conta da rampa. O comentário do CSS que dizia *"o borrão começa **depois** dela,
como a rampa"* saiu: **a rampa nunca começou depois da faixa.**

**A faixa não é borrada**, e isso foi verificado por hit-testing e não por
leitura de `z-index`: `elementFromPoint` no centro do campo devolve o `input`.
Ele é `relative z-10` e a camada é `absolute` sem `z-index`.

**E é no-op para quem não tem faixa.** `scrollFadeBandsClassName` declara as
duas em `0px`, então `calc(0px + clamp(…))` é a geometria de sempre. Medido no
`ScrollFade`: camada de 44px na mesma posição de antes. `Carousel` idem.

#### O efeito colateral, com os números

`--scroll-fade-blur-e` é `calc(100% / i)` — relativo à caixa da própria camada.
Com a caixa crescendo em `band-h`, a extensão de cada índice cresce junto:

| índice | raio | antes | agora |
| --- | --- | --- | --- |
| 1 | 7px | 44px | 92px |
| 2 | 14px | 22px | 46px |
| 3 | 21px | 15px | **31px** |

O borrão mais forte passa a viver **atrás da faixa**, e a zona da rampa recebe
os dois mais leves — que é o material do iOS lido certo: o pico do desfoque
encostado no cabeçalho, caindo para dentro do conteúdo. Se um dia ficar forte
demais ali, a manopla é prender a extensão à zona
(`calc((100% - var(--scroll-fade-band-h,0px)) / i)`) em vez de à caixa.

#### A asserção passou sozinha, e isso era o defeito dela

A **6** — *"a faixa do borrão não pode divergir da faixa que dissolve"* — era
por substring: exigia que `var(--scroll-fade-band-h, 0px)` **aparecesse**, não
**onde**. Ela passava com a camada deslocada e passava com ela somada; ou seja,
não provava nada. Terceira vez que este projeto registra a mesma lição —
*asserção que casa a forma do texto testa a digitação*.

Hoje ela exige a estrutura, nas quatro pontas dos dois eixos: âncora em `0`,
proibição explícita de ancorar na faixa, e a medida como
`calc(var(--faixa, 0px) + clamp(…))` — com o fallback `, 0px`, que é o que
mantém o no-op. Sabotada de três jeitos (âncora de volta, soma numa ponta só,
fallback removido), e os três reprovam.

### Rodada 53 — o vidro chega às três de borda, e a receita sai para `lib/`

Pedido: dar às superfícies de borda o material que o `Dialog` ganhou na 51c.
**E o argumento que eu tinha dado contra a gaveta estava errado** — eu disse que
sobraria pouca coisa para borrar porque ela ocupa quase a tela. O borrão não vê
o que sobra **à volta** dela; vê a página que está **atrás**, e essa está
inteira ali.

Medido, com o véu já em 40% (placa a 60% no escuro, 85% no claro):

| atrás da placa | escuro | claro a 85% |
| --- | --- | --- |
| página | 3 | 24 |
| muted | 9 | 28 |
| botão `primary` | **30** | 56 |

É ~2× o que o `Dialog` consegue nos mesmos fundos (0 · 2 · 2 · 15), porque a
placa aqui é `--background` — mais escura que o fundo velado, então o composto
anda na direção do conteúdo em vez de empatar.

**A receita saiu para [`lib/modal-classes`](../../src/lib/modal-classes.ts).** Somando
as três, ela ficaria escrita em quatro arquivos — a trajetória que levou a
superfície flutuante a cinco cópias antes da 51. As cinco peças modais vestem
`modalSurfaceClassName`, e para o `Dialog` isso é **extração**: o computado sai
byte a byte igual.

#### A alça da gaveta reprovava, e o defeito era do método antigo

`!bg-muted-foreground/70` é tinta com alfa, então ela se compõe sobre o fundo da
gaveta — e os **3,06 (claro) / 4,24 (escuro)** que a justificavam foram medidos
contra `--background` **opaco**. Com a placa de vidro:

| | placa opaca | placa de vidro |
| --- | --- | --- |
| escuro | 4,24 | 4,22 |
| **claro** | 3,06 | **2,85 — reprova** |

A folga sempre foi de 0,06 sobre o piso de 3:1, e o vidro a consumiu. Varridos
os degraus, **75% é o primeiro que passa: 3,12 e 4,73**. O `resizable` fica em
70 e está certo — a pega dele vive entre dois painéis **opacos**. A régua que
sobra: **alfa medido contra um fundo não sobrevive à troca do fundo.**

#### O arrasto foi medido, e não custou

A gaveta é a única das três que se arrasta, e um `backdrop-filter` sobre 85dvh
sendo transformado a cada quadro era o risco declarado. Dirigindo o `transform`
num laço de `requestAnimationFrame` (evento sintético não dirige o vaul), com a
gaveta forçada a **848px (85dvh)**:

| | mediana | p95 | quadros > 16,7ms |
| --- | --- | --- | --- |
| com `backdrop-filter` | **13,3ms** | 13,9 | 0 |
| sem | **13,3ms** | 13,9 | 0 |

Idênticos. **A ressalva fica dita: isto é a máquina de desenvolvimento, não um
aparelho.** O que a medição descarta é um custo grosseiro; ela não prova o
telefone.

#### Os fades internos viraram o material do iOS, e a camada virou peça

*(Superado: o borrão saiu do `DialogBody` — virava retângulo de tom, ver a invariante 6 de `lib/scroll-fade-classes`. Fica a rampa.)*

`DialogBody` e `MobileSheetFormBody` ganharam o borrão das duas pontas, com a
rampa **mantida** — mesma decisão da paleta: sem a máscara o conteúdo passaria
nítido pela borda. Os dois eram um elemento só, e passaram a ser casca
`relative` + rolável, que é a forma do `ScrollFade`; o `className` de quem chama
continua indo para o rolável, porque as chamadas passam ritmo de conteúdo e não
layout.

Com isso o bloco de JSX das camadas estaria em **três** lugares, e virou
`ScrollFadeBlurLayers`, exportado de `scroll-fade.tsx`. Ela nasce `material`,
que é o raio e a vibrância do iOS, e carrega no doc as três exigências
mecânicas: irmã do rolável, casca `relative`, e `shell: true` no hook.

#### O que ficou de fora, com o motivo

**Oito telas pintam uma tira opaca dentro da folha** — `border-t border-border
bg-background` em 14 sítios, e os gêmeos `dialogFooterClass` já estão hoje
opacos sobre a placa translúcida do `Dialog`. É o defeito dos `ScrollButton` do
`Select`, na escala do app.

**Tirar a tinta agora seria pior**: esses arquivos escrevem o corpo rolável à
mão e **não têm fade** — verificado, zero `DialogBody` / `scrollFade` neles —,
então o conteúdo correria por baixo dos botões sem nada que o escondesse. O
conserto é a migração que o backlog já nomeia (os 32 corpos à mão viram
`DialogBody`), e ela agora compra o material do iOS de brinde. Fica anotado
abaixo.

**E o `bg-clip-padding` do `edge-panel` fica sob suspeita.** Ele é herança do
shadcn, sem decisão registrada; com placa opaca era inerte, e com placa
translúcida ele recorta o fundo no *padding box* e pode reabrir a fresta de 1px
que o catálogo descreve. Não foi medido nesta rodada.

### Rodada 59 — o material do iOS chega à fileira do `Menubar`

Metade do pedido já estava feita e a outra metade nunca esteve. Medido na página
do catálogo: o `MenubarContent` veste `menuSurfaceClassName` e sai com
`blur(24px) saturate(1.5)` sobre `oklab(0.205 0 0 / 0.6)` desde a rodada 51; a
**fileira** saía com `backdrop-filter: none` nas oito barras da página, com a
tinta escrita à mão no `cva`. O painel era vidro e a barra que o abre era chapa.

**A receita não é nova — ela estava escrita à mão no cabeçalho do catálogo.**
`bg-background/95 glass-surface supports-backdrop-filter:bg-background/60
reduced-transparency:bg-background` saiu para
[`lib/bar-classes`](../../src/lib/bar-classes.ts), e o `ds-shell` passou a vesti-la.
É extração e não mudança, e isso foi provado em vez de suposto: o `className`
do `<header>` sai **byte a byte igual** (`h.className === a string de antes`,
verificado no navegador), com o mesmo `blur(24px) saturate(1.5)` e o mesmo
`oklab(0.145 0 0 / 0.6)`.

**Ela é a terceira régua, e diverge das outras duas em três pontos, cada um com
motivo:**

| | flutuante | modal | **barra** |
| --- | --- | --- | --- |
| token | `--popover` | `--background` | `--background` |
| base | 85% | 85% | **95%** |
| abre em | `dark:` a 60% | `dark:` a 40% | **nos dois temas**, a 60% |

`--background` e não `--popover` porque no escuro `--popover` e `--card` são a
mesma cor (`oklch(0.205)`): uma barra `--popover` pousada num cartão sumiria —
quem define uma barra é o contraste contra a superfície em que ela pousa. 95 de
base porque sem `backdrop-filter` os 60% deixariam o conteúdo passar por trás do
rótulo. E sem `dark:` porque uma barra tem conteúdo real por baixo nos dois
temas, ainda que no claro o efeito seja quase nulo (250 sobre 255 dá Δ2).

**Só a `outline`, e as outras duas ficam com o número escrito.** `solid` é
bandeja: medida a 60% no escuro ela cai de rgb **38 para 27** sobre a página —
enfraquece, deixa de ler como bandeja e divergiria da `TabsList solid`, com quem
é idêntica hoje. `plain` mora dentro de um cabeçalho que **já é** o vidro, e uma
segunda placa sobre a primeira empilha borrão sem desenhar nada. Na `outline`,
sobre o cartão, o composto vai de rgb 10 para 15, com o texto em 18,36 e o
secundário em 7,42 — folgado.

**A demonstração é parte do conserto, não enfeite.** `backdrop-filter` sobre cor
chapada não desenha nada, e as oito fileiras da página pousam num `Preview`
liso: ali o material sai idêntico ao opaco, e a mudança seria inverificável. A
seção nova gruda a fileira no topo de um rolável e passa texto por baixo — a
forma do cabeçalho fixo, e a única em que há o que borrar. **O `sticky` é da
demonstração, e não um eixo**: o da `Toolbar` já foi reprovado por contagem
zero, e o `Menubar` tem zero consumidores.

**Zero pixel em produção**, pelo mesmo motivo: o componente só existe no
catálogo. Quem de fato renderiza a receita em tela é o cabeçalho do catálogo — e
ele não mudou, porque a extração é byte a byte.

A asserção **27** de `glass.test.ts` tranca as duas metades: a régua (material,
os dois alfas com o de baixo menor, o guarda, o token certo, e **sem** `dark:` —
é o que a separa da 23) e a fileira (a `outline` veste, `barSurfaceClassName`
aparece **uma vez só** no `cva`, `solid` continua `bg-muted`, `plain` continua
transparente, e o cabeçalho não volta a escrever a cópia). Dez sabotagens, dez
reprovações.

Uma correção de deriva veio junto: este arquivo dizia que o eixo do `Menubar`
era `outline | ghost | solid`. O código diz `plain` desde a rodada que unificou
as três palavras para "não desenha nada", e o bullet nunca foi corrigido.

### Rodada 60 — o quarto chrome morre, e a área segura volta a ser da superfície

O pedido foi apagar o `MobileSheetFormChrome`. Ele **não** estava sem uso: 26
telas de produto o importavam. Posto o número, a direção veio em três
respostas — *"migrar quem usa para drawer"*, *"folha no desktop e gaveta no
telefone, e isso é regra de todo o app"*, *"o que for dialog mantém dialog por
enquanto"* —, e juntas elas desenharam uma rodada menor do que parecia.

**A regra já estava implementada, e é o `Sheet`.** Medido em `sheet.tsx`: ele
monta `DrawerPrimitive.Root` do `vaul` abaixo de 768px e o painel de borda
acima, propagando a escolha por contexto. As telas que escrevem `<Sheet>` **já
renderizavam a gaveta no telefone** — não havia o que migrar na camada de
superfície, e nenhuma virou `<Drawer>`. O trabalho real era o do pedido
original: matar o quarto chrome.

**Três medições mudaram o desenho.** `MobileSheetFormBody` tinha **zero**
consumidores de produto (as 26 telas escrevem o corpo à mão, 38 ocorrências);
`FormActions variant="sticky"` também; e `mobileFormSheetContentClassName` era
quase todo inerte — `w-full`, `rounded-t-2xl`, `flex flex-col` e `gap-0` o
`SheetContent` já dava, e `px-0 pt-0` não anulava nada. O que sobrava de real
eram **duas** coisas: `overflow-hidden` e a **área segura**.

Essa era o nó. O `DrawerContent` carregava a área segura e o ramo gaveta do
`SheetContent` **não** — era por isso que a classe existia, e por isso 19
folhas a tinham e 7 não, com o botão de salvar sob a barra de gestos do iPhone
nessas 7. As duas foram para a superfície, com os 24px preservados:
`pb-(--sheet-drawer-safe)` e a fórmula do `env()` na variável.

**A cromagem passou a ser uma só.** `MobileSheetFormStickyHeader` virou
`DialogHeader` (+ `DialogHeaderRow` quando há adorno), o corpo virou
`DialogBody`, e `mobileSheetChromeBelowHeaderClassName` — que era a string
`"mb-3"` com nome de sistema — virou o literal onde ele de fato era usado, uma
margem num divisor. É a regra que este arquivo já escrevia ("a cromagem da
folha vem do `Dialog`"), e o chrome era o quarto, anterior a ela.

**O × ganhou lugar em vez de peça.** `DialogCloseButton` passou a ter
`placement`: `floating` (o padrão, o canto da superfície) e `inline` (dentro do
cabeçalho). Ele absorveu o `MobileSheetFormHeaderCloseButton` (5 chamadas) e as
4 que montavam `Close` + `Button` + ícone à mão — inclusive uma que renderizava
um glifo do conjunto 20 em 16px, que o auditor acusava.

**Os deltas de métrica, ditos:** a cromagem do `Dialog` não tem a mesma medida
do chrome — **+8px acima do título** (`pt-4` contra `pt-2`), **−8px abaixo do
cabeçalho** (`pb-4` contra `pb-3` + `mb-3`) e **−4px de recuo lateral acima de
640px** (o `sm:px-5` do chrome não existe no `--dialog-px`). É o preço de a
folha usar o cabeçalho do sistema, e é ajustável numa linha, porque
`--dialog-px` é variável.

**Verificação, e o seu limite.** `tsc` limpo, 441 testes, auditor sem achado
novo, catálogo de 90 para **89** páginas. No navegador, o espécime da página do
`Form`: casco com `padding-bottom: 24px` e `overflow: hidden`, cabeçalho em
16/16/16, o × com `position: static` e `margin-right: -4px`, corpo dissolvendo
nas duas pontas. **Nenhuma das 26 telas de produto foi vista logada** — o que
prova a migração é o compilador, a suíte e esse espécime, e está dito.

O que ficou de fora, com o número: os **38** corpos roláveis à mão não viraram
`DialogBody` (eles não passavam pelo chrome, e trocá-los acrescentaria a
dissolução em 19 telas que hoje não a têm), o `FormActions variant="sticky"`
segue sem consumidor, e as 16 telas que mostram `Dialog` no desktop ficaram
como estão, por decisão explícita.

### Rodada 61 — o bico do `NavigationMenu` sai, e ele estava certo pelos números

O pedido foi remover a "perna" do dropdown: o `indicator="arrow"`, um `<span>`
de 8px rotacionado 45° na calha entre a fileira e o painel, ligado **sozinho**
sempre que havia viewport.

**Ele não caiu por contraste, e é isso que torna a decisão registrável.** A
rodada 32 mediu e acertou: `bg-popover` com o mesmo `ring-foreground/10` do
painel dá **1,00 contra ele**, que é o valor exato de uma ponta de balão, e o
recorte de 2px a mais que a calha existe para o `ring` do painel não desenhar um
fio atravessando a base do bico. Os números continuam certos. O que a rodada 32
não perguntou é se a peça se paga: **1,10 contra a página** é um objeto que
ocupa a calha e não diz nada que a posição do painel já não diga — e quem liga o
painel ao gatilho é a âncora (`align="trigger"`), não um desenho. Vista na tela,
foi reprovada.

Custo zero de migração: o componente tem **zero consumidores no app**, e o
`mt-2` da folga é do viewport, não do bico. Medido depois, o painel continua a
**8px** exatos da fileira.

**A derivação saiu junto, e não por arrumação.**
`defaultNavigationMenuIndicator(viewport)` existia para escolher entre `arrow` e
`none`; sem o `arrow` ela devolve `none` nos dois ramos, ou seja uma função que
escolhe entre dois valores, com um valor. É a **constante disfarçada** que a
rodada 29b já enterrou em `defaultControlVariant`. O padrão passou a ser `none`
cravado, e `indicator` ficou `"none" | "underline"` — quem quer sinal alto de
qual gatilho está aberto usa o traço, que dá **6,78:1** contra a página.

**O `group/navigation-menu-indicator` foi embora com ele**: o único leitor
daquele `group` era o `<span>` do bico, e um `group` sem leitor é a família
"sobreviveu à remoção" que esta base já pagou cinco vezes.

**O teste é o `tsc`, e ele já existe.** Com `arrow` fora do tipo, qualquer sobra
deixa de compilar — foi assim que a linha 271 do catálogo apareceu. Não entrou
`navigation-menu-ladder.test.ts`: a ausência dele é decisão registrada da rodada
32, e uma asserção que varresse a string `arrow` no fonte testaria a digitação, e
não o comportamento.

#### O que esta rodada tornou invisível, e por isso está escrito no componente

O bico era o **sinal visual mais alto** de que `align="trigger"` funcionava. Foi
um marcador desalinhado que denunciou o defeito da 32b — o `relative` no item
zerando o `offsetLeft` de todo gatilho, com o primeiro acertando por acidente
porque ali zero é o valor certo. Sem ele, esse defeito voltaria calado.

Por isso a verificação ficou escrita no doc-comment do `align`, e foi feita nas
**duas** posições:

| gatilho | `--navigation-menu-anchor-cx` | centro do gatilho | centro do painel |
| --- | --- | --- | --- |
| Finanças | 54,14 | 54,14 | 54,14 |
| Análise | **152,84** | **152,84** | 152,83 |

Desalinho **−0,01px** no segundo, que é o único que prova alguma coisa. *Uma
peça que se move só se verifica em duas posições.*

E o `underline` continua viajando: com Finanças aberto ele mede 101,7 contra um
gatilho de 102,3; com Análise, **91,0 contra 91,1**, deslocado para 509,5 contra
509,8. Ele acompanha e redimensiona.

#### Duas lições de instrumento, e as duas já estavam escritas aqui

**O ponteiro não persiste entre chamadas do harness** — a rodada 34 registrou
isso, e eu andei nela de novo: medir o marcador numa chamada separada da que
move o cursor devolveu `aberto: null`, e por um momento pareceu que o `underline`
não montava. Hover e medição têm de ir no mesmo lote.

**E coordenada de painel não é pixel de CSS.** O quadro era 800×553 contra um
viewport de 1443 — a armadilha da rodada 32. Três hovers por `ref` caíram todos
no mesmo menu errado antes de a escala aparecer; o que resolveu foi rolar o alvo
para o centro, tirar uma captura e usar as coordenadas **dela**.

### Rodada 62 — o painel abria com a curva do navegador, e a troca era um whoosh

O pedido foi uma animação melhor para os dropdowns do `NavigationMenu` — ao
aparecer e ao trocar de um gatilho para outro. Medido no catálogo com o menu
aberto, antes de mexer:

| | antes |
| --- | --- |
| abrir | `animation: enter 0.1s ease` + `zoom-95` |
| trocar | o conteúdo novo nascia a **208px** (`slide-in-from-right-52`) e atravessava em 100ms |
| morph | `transition: all 0.1s ease` |

**A curva da casa nunca chegava a esta superfície.** O `animate-in` do
tw-animate-css é `enter var(--tw-duration, .15s) var(--tw-ease, ease)`, e quem
escreve `--tw-ease` é a classe `ease-*` do Tailwind — o viewport não tinha
nenhuma, e `--tw-ease` estava **vazio**. Medido no chevron do mesmo componente,
que tem `ease-(--ease-out)`: `cubic-bezier(0.16, 1, 0.3, 1)`. Dois nós do mesmo
arquivo, um com a curva do projeto e outro com a do navegador.

**E o morph já existia, escondido num defeito.** O viewport tinha
`duration-(--duration-instant)` sem nenhum `transition-*`, e um `duration-*`
sozinho deixa `transition-property: all` — largura e altura transicionavam, a
100ms, com `ease`. Tremor, não trajeto. É uma armadilha geral: **`duration-*`
sem `transition-*` transiciona tudo a essa duração**, calado.

#### O que mudou, e a forma que não mudou

A decisão foi delegada ("a mais bonita e que combina com o design system"), e a
resposta veio da contagem: a **forma** da abertura é a de toda superfície
ancorada da casa — fade, 8px de subida e `zoom-95` —, e um desdobrar (a altura
crescendo da fileira) seria o único mecanismo do tipo no app, com `@keyframes`
em `globals.css`. A forma ficou; mudaram o tempo e a curva:

- **abrir**: `--duration-base` com `ease-(--ease-out)` — e o `ease-*` é o que
  faz `--tw-ease` chegar ao `animate-in`;
- **fechar**: só fade, em `--duration-instant`. Saída não se move, e um menu
  que fecha ao tirar o cursor não pode demorar 200ms;
- **morph**: `transition-[width,height]` explícito, base, curva da casa. O
  Radix já escreve a caixa do conteúdo ativo nas duas variáveis; a `transition`
  é o que transforma o salto em trajeto;
- **trocar**: o drift caiu de 208 para **16px** (`-4`) e passou a seguir a
  `orientation` — num menu vertical os painéis trocam de cima para baixo, e o
  deslize era horizontal.

**A primeira abertura não cresce do zero, e isso é mecanismo e não sorte.** As
variáveis do Radix nascem indefinidas (`size: null`), a altura computa `auto`,
e `auto → px` não interpola. Na troca é `px → px`, e aí interpola.

#### Medido depois

| | resultado |
| --- | --- |
| abrir | `enter 0.2s cubic-bezier(0.16, 1, 0.3, 1)`; `transition: width, height 0.2s` na mesma curva; `--tw-ease` preenchido |
| trocar (Finanças → Tudo) | conteúdo novo nasce em **x16**; viewport 224 → 450 → 542 → 577 → 592 → **600** em 184ms; o que sai vai a −16 e some aos ~200ms |
| trocar (Tudo → Finanças) | 600×296 → 464 → 373 → … → 224×96 — o morph nos dois sentidos |
| vertical | conteúdo novo nasce em **y16**, o velho vai a y−13 — eixo certo |
| fechar (Escape) | `exit 0.1s`, `--tw-exit-scale: 1`, translate 0; opacidade 0,02 aos 85ms; desmontado aos 205ms |

**A demo "Padrão" tinha os dois painéis em 224×96** — um morph entre iguais não
tem o que mostrar. Entrou "A troca é um morph": Finanças (uma coluna, 224) contra
Tudo (`columns={2}` com cartões, 600×296).

#### Duas lições de instrumento

**Ponteiro parado não gera `pointerenter`.** Depois de um `navigate`, o hover na
mesma coordenada em que o cursor já estava não abriu nada — o Radix precisa de
movimento. Afastar antes resolve. É a parente da lição "o ponteiro não persiste
entre chamadas" da rodada 34.

**E afastar o cursor dentro de um lote não fecha o menu** — nem antes nem depois
da mudança —, enquanto entre chamadas ele fecha sozinho. É o ponteiro do painel,
não o componente; fechar para medir a saída é `Escape`, que o `DismissableLayer`
trata na hora.

### Rodada 63 — a mesma animação no `Popover`, e a saída dele nunca tinha rodado

O pedido foi levar ao `Popover` a animação da rodada 62. Duas das quatro peças
de lá não têm equivalente aqui — não há viewport compartilhado, então não há
morph, e não há troca de painel —, e o que se transportava era a entrada e a
saída. **A saída não existia.**

#### O que a medição achou

A entrada tinha o defeito idêntico: `animation: enter 0.1s ease`, com
`--tw-ease` **vazio**, e `transition-property: all` com `0.1s` — o mesmo
`transition: all` implícito que um `duration-*` sem `transition-*` deixa.

A saída era pior que curta: **ela não rodava**. Um `MutationObserver` lendo
`getComputedStyle` de forma síncrona no instante do `data-state="closed"`
devolveu **vazio** em `animationName`, `animationDuration` e `opacity` — e
estilo computado vazio é o que se obtém de um nó **já destacado do documento**.
Nenhum `animationstart` de `exit` disparava. As três classes `data-closed:*`
eram código morto desde sempre.

#### A causa, isolada por comparação

O `Portal` do Radix é `<Presence>` em volta de um `PortalPrimitive asChild`, e
o `Presence` decide se espera a animação lendo `getComputedStyle` do **ref do
filho** (`getAnimationName(styles)`, com `styles?.animationName || "none"`).

Havia um `PopoverLabelContext.Provider` **entre o Portal e o Content**. O `Slot`
do `asChild` tenta pôr o ref num context provider — que não é elemento —, o ref
se perde, a leitura devolve `"none"`, e o Radix manda `UNMOUNT` no mesmo commit
em que escreve `data-state="closed"`.

**Não é da portalização, e foi o `DropdownMenu` que provou.** Ele é portalizado
igual e tem `Portal → Content` direto: medido, `state=closed name=exit @17ms`,
`animationstart exit @18ms`, nó ainda no DOM. Um par onde só um lado falha é o
que transforma suspeita em causa.

Uma previsão testável fechou o caso: se o `Slot` estava largando as props no
Provider, então o `data-slot="popover-portal"` do arquivo também não existia.
Medido com um popover aberto: `[data-slot=popover-portal]` **não casava nada**.
Ele saiu junto.

#### O conserto, e o que ele custou

O Provider foi para **fora** do Portal — o contexto continua alcançando o título
e a descrição, porque ele está acima na árvore do React e contexto atravessa
portal. Verificado: `aria-labelledby` e `aria-describedby` apontam para
elementos que existem, com o nome acessível certo.

| | antes | depois |
| --- | --- | --- |
| entrada | `enter 0.1s ease` | `enter 0.2s cubic-bezier(0.16, 1, 0.3, 1)` |
| `--tw-ease` | **vazio** | preenchido |
| transição | `all 0.1s` | `0s` |
| saída | não rodava | `animationstart exit @21ms`, `animationend @116ms`, desmonta limpo |

**`animation-duration-*` e não `duration-*`.** O segundo escreve
`transition-duration` junto, e numa superfície que só anima isso é o
`transition: all` de novo. A rodada 62 resolveu o mesmo problema no
`NavigationMenu` declarando `transition-[width,height]`, porque lá havia um
morph a declarar; aqui não há transição nenhuma a querer, e o utilitário que
mexe só na animação é o certo. Medido: `--tw-animation-duration: 200ms` e
`transition-duration: 0s`.

**Isto não é zero-pixel.** `PopoverContent` está em **7 telas de produção**
(`transactions-filters-panel`, `transaction-form-fields`,
`transactions-active-filters-chips`, `categories-toolbar`,
`subscription-form-pickers`, `dashboard-payments-calendar`,
`mobile-account-menu`) e é vestido por `Combobox`, `DatePicker` e
`FormPickerPopover`. Onde o popover sumia, ele agora esmaece em 100ms.
Verificado no `Combobox`, o consumidor mais complexo: `enter 0.2s` na curva da
casa, 8 itens, 224px, e a saída rodando.

**O `HoverCard` ficou de fora, e por dois motivos.** Ele tem `Portal → Content`
direto, então a saída dele sempre funcionou; e ele abre **por cursor**, que é
exatamente o caso que a nota do `--duration-instant` em `globals.css` protege.
`DropdownMenu`, `Select`, `Menubar`, `ContextMenu` e `Tooltip` seguem com
`--tw-ease` vazio — a curva da casa não chega a nenhum deles, e é a mesma
correção de uma linha. Fica no backlog.

#### Duas lições de instrumento, e as duas são erros meus

**Medir uma saída com `sleep` entre o `Escape` e a leitura não mede nada.** A
latência do harness entre as duas ações já passa dos 100ms da animação, e a
primeira leitura disse "desmontou aos 20ms" sobre algo que eu não tinha como
observar. O que serve é **instalar o ouvinte antes** e ler o registro depois —
e foi o registro que mostrou os três eventos na ordem certa.

**E a sonda procurou o `data-slot` do componente de baixo.** O `ComboboxContent`
carimba `combobox-content` por cima do `popover-content`, e a busca voltou vazia
com o componente funcionando. É literalmente a lição que a rodada 35 registrou
com estas palavras — *uma sonda que procura o slot do componente de baixo mede a
chamada, não o resultado* —, e eu andei nela um arquivo depois de escrevê-la.

### Rodada 64 — o `EdgePanel` dissolve no `Sheet`, e a inversão fica escrita

Pedido: juntar os dois, e a navegação também virar gaveta no telefone. **Isto
reverte uma decisão registrada**, e a ressalva foi apresentada antes: o
`EdgePanel` nasceu para consertar exatamente isto — a `Sidebar` pegava a folha
emprestada e abria como gaveta de baixo, com alça de arraste e canto
arredondado no topo, para listar seis links. A decisão nova é que **a superfície
do telefone é uma só**, e ela vale para navegação também.

**O que sustentava a separação deixou de existir.** O `EdgePanel` tinha três
consumidores, e num deles ele já *era* o `Sheet`: o ramo desktop do
`SheetContent` renderizava `EdgePanelContent`, e o `SheetContent` já expunha os
dois eixos por `VariantProps<typeof edgePanelContentVariants>`. Os outros dois
— a `Sidebar` e a navegação do catálogo — são justamente os que passaram a ser
gaveta. Sem ninguém que precisasse do painel em toda largura, o arquivo era uma
segunda API para a mesma moldura.

O `cva` mudou de casa e de nome (`sheetContentVariants`, com `--edge-panel-gap*`
→ `--sheet-gap*`) sem mudar por dentro: os dois eixos, as quatro
`compoundVariants` do gume e a área segura das verticais vieram inteiros. O véu
virou `SHEET_OVERLAY_CLASS`, e o `Drawer` o importa daqui. **Sem alias**: três
consumidores, todos migrados na mesma mudança, e alias seria a porta dos fundos
que o `tsc` existe para fechar.

#### O `p-0` que teria matado a área segura

A chamada da `Sidebar` passava `p-0` ao painel. Ali era **no-op** — a base do
`cva` não declara recuo nenhum. Na gaveta ele deixa de ser: o `twMerge` o faria
derrubar o `pb-(--sheet-drawer-safe)`, e o rodapé de conta cairia sob o
indicador de home do iPhone. É a mesma família do `mobileFormSheetContentClassName`
da rodada 60 — uma classe que não fazia nada num ramo e fazia estrago no outro.
Medido depois, na moldura de 375px: rodapé terminando a **24px** da base da
gaveta.

Saiu junto o `SIDEBAR_WIDTH_MOBILE` (18rem), que ficou órfão: no telefone a
gaveta é a largura da tela.

**E eu introduzi o mesmo defeito no catálogo, com outra classe.** A navegação
dele passava `w-72`, que no painel é a largura certa e na gaveta briga com o
`inset-x-0`: com `left`, `right` e `width` declarados, a largura vence e a
gaveta sairia com 288px ancorada à esquerda. Virou `md:w-72` — o mesmo 768 de
`useIsMobile`, então a largura só existe onde existe o painel.

#### Medido depois

| | resultado |
| --- | --- |
| `flush left` (desktop) | `l0 t0 w384`, raio 0, **só** `border-right` — o gume de dentro |
| `floating bottom` | 8px nos quatro lados, raio 14px, as quatro bordas, `blur(24px) saturate(1.5)` |
| `Sidebar` a 375px | gaveta do `vaul` **dentro do iframe**, `data-surface="drawer"`, alça com `data-vaul-handle-hitarea`, raio `18px 18px 0 0`, `padding-bottom` 24px, nome acessível **"Navegação"** |
| catálogo a 375px | gaveta de largura 375, 89 links rolando no `div` de dentro, × a 13px do topo |
| catálogo a 800px | painel `l0 t0 w288 h812`, `border-right`, raio 0, **sem alça** |

A cromagem do `Dialog` atravessa a gaveta como sempre atravessou — o
`DialogHeader sr-only` da `Sidebar` continua nomeando o painel, porque `vaul` e
Radix são a mesma primitiva.

#### O que o teste ganhou de graça

`edge-panel.test.ts` virou `sheet.test.ts`. A asserção **8** — *o `cva` é único
no arquivo, e o `ds:catalog` lê este* — era verdadeira num arquivo que só tinha
aquele `cva`; agora ela vale sobre o `sheet.tsx`, e com isso o catálogo **passou
a reportar os eixos da folha**: `side · variant` onde antes saía `—`. A asserção
**7** foi reescrita: já não há delegação a verificar, e o que ela tranca é que
`side` e `variant` são destruturados, não chegam ao ramo gaveta, e chegam ao
`sheetContentVariants({ side, variant })` do ramo painel.

Sai a linha `edge-panel` da lista de portais em `ds-frame.test.ts` e da lista de
superfícies modais em `glass.test.ts` (que passa de quatro nomes para três).

#### Uma lição de instrumento, e é um erro meu

**A guarda que eu escrevi contra sobras reprovou o registro que eu queria
manter.** O script assertava que a string `EdgePanel` não sobrasse no
`sheet.tsx` — e o doc-comment novo diz, de propósito, *"Ele nasceu `EdgePanel`"*.
A guarda passou a ignorar comentário, como os testes da casa já fazem com
`semComentarios`. Numa base que registra inversão em vez de apagar o passado,
uma varredura de sobra **tem** que distinguir código de prosa.

### Rodada 65 — o `side` não reordenava, e a placa flutuante passou a falar iOS

Dois pedidos: o `variant="floating"` da `Sidebar` parecer mais com os efeitos
iOS que o app já usa, e consertar o `side`, que "quebra o layout". Os dois foram
medidos no seletor de três eixos do catálogo, a 926px.

#### O bug é do `right`, e o `left` só parecia certo porque zero é o valor dele

Com `side="right"` o trilho `fixed` ia para `l670 r926` — e a folga que reserva
o lugar dele **ficava onde estava**, em `l0 r256`. Resultado: **256px vazios** à
esquerda e a placa cobrindo **240px do conteúdo** à direita (255 em `sidebar`).
Nada no wrapper reordenava pelo eixo. O `inset` agravava: a margem que o
conteúdo perde do lado da barra existia **só para a esquerda**, e com a barra à
direita ele saía `m:0px/8px`.

O conserto é `data-[side=right]:order-last` na raiz. **A ordem no DOM não muda**,
e é ela que mantém válidos os `peer-*` do `SidebarInset`; quem inverte é a ordem
visual do flex. As margens de `inset` viraram par espelhado. Saiu junto o
`group-data-[side=right]:rotate-180` da folga — herança do shadcn sobre uma
`div` vazia e transparente, inerte desde sempre.

Medido depois, nas três variantes: sobreposição **zero**, e o cabeçalho
começando em `x=0` com a barra à direita.

#### O vidro fica pintado, e o que mudou foi tudo em volta

A rodada 36 mediu que o `floating` **reserva a própria calha no fluxo** — nada
passa por trás dele, borrar cor chapada não desenha nada, e a asserção 15 tranca
`backdrop-filter` fora do arquivo. Isso não mudou, e foi reafirmado com o motivo
na mesa. O que separava a placa da língua iOS do app era o resto:

| | antes | depois |
| --- | --- | --- |
| curva do recolher | `ease-linear` em **quatro** nós | `--ease-emphasized`, 300ms, nos quatro |
| item ativo | fundo que acende e apaga | pílula que **viaja** |
| raio | 14 (`rounded-xl`) | **18** (`rounded-2xl`), o das placas modais |
| elevação | `shadow-sm` | `shadow-lg` — `oklch(0 0 0 / 0.6)` no escuro, `/ 0.1` no claro |

Os quatro nós da curva são a folga, o trilho, o rótulo de grupo e **a altura do
cabeçalho** (`app-header.tsx`, a única linha tocada fora de `ui/`): ele encolhe
*porque* a barra recolheu, e duas curvas no mesmo gesto leem como duas animações
que por acaso começaram juntas.

**O reflexo da placa virou repouso.** O `--glass-sheen` é a camada mais de cima
do vidro e nunca tinha tido produtor; a primeira versão o acendia **sob o
cursor**, e o defeito era de alvo, não de medida: a superfície é do tamanho da
coluna, então apontar para **um item** acendia a barra **inteira**. A decisão do
dono foi levar o valor do hover ao repouso — a placa fica permanentemente no tom
que só tinha ao ser apontada, e não reage a nada. Estático, então o `@property`
que eu tinha registrado para o interpolar saiu: sem transição, é peso morto. Só
no escuro, pelo teto que a rodada 40 mediu no claro. **Quem responde ao cursor é
o item**, e a escada de três alfas dele ficou intacta — depois de eu tê-la
mexido duas vezes por ler o pedido como se fosse sobre os itens, e não sobre a
placa.

O item ativo **não** ganhou um segundo sinal. O ícone chegou a tingir de
`--primary-accent` — medido em **7,11:1** no escuro e **7,46:1** no claro contra
a placa, números que passam com folga — e foi reprovado na tela: numa coluna de
navegação o verde puxa o olho para um item que a pílula já marcou, e o mesmo
verde significa "entrou dinheiro" no resto do app. Quem marca o ativo é a pílula
mais o `font-medium`. **Contraste diz se aparece; não diz se convence** — é a
régua que a rodada 37 escreveu, e ela decidiu de novo aqui.

#### A pílula, e a armadilha do `offsetParent`

É o mecanismo do marcador do `Tabs`: `ResizeObserver` na trilha e nos botões,
`MutationObserver` em `data-active`, zero laço por quadro, leitura em coordenada
de **conteúdo** — o `SidebarContent` rola, e uma caixa de viewport faria a pílula
escorregar a cada pixel.

**Mas a leitura não pode ser um `offsetTop` só.** O `<li>` do menu é `relative`,
então ele — e não a trilha — é o `offsetParent` do botão: lido direto,
`offsetLeft` valeria zero para todos, e o primeiro item acertaria por acidente.
É exatamente o defeito da rodada 32b, e a razão de `caixaRelativa` somar a
cadeia inteira e devolver `null` quando ela não chega ao alvo. Verificado no
**quarto** item: desalinho zero nos quatro eixos.

#### Três defeitos que eu mesmo introduzi, e como cada um apareceu

**A variante era lida uma vez, na montagem.** O efeito tinha deps `[]` e um
retorno cedo se `data-variant !== "floating"`; indo de `sidebar` para `floating`
no seletor, o marcador ficava desligado para sempre. E o `MutationObserver`
vigiava a **subárvore da trilha**, enquanto `data-variant` mora num **ancestral**
— ele nunca a veria mudar. Hoje a variante é lida a cada medição, e a raiz tem
observador próprio.

**Ceder o fundo é apagá-lo, não deixar de declará-lo.** Ao mover o alfa do ativo
para o marcador, o botão caiu na classe **base** do `cva` —
`data-active:bg-sidebar-accent`, o token **opaco**, que não é escopado por
variante. Medido: `oklch(0.269 0 0)` pintando um retângulo por baixo da pílula.
`twMerge` não resolve, porque as duas moram sob variantes diferentes e as duas
sobrevivem à mesclagem.

**O `-z-10` do marcador teria feito o oposto do que parece.** `relative` com
`z-index: auto` **não** cria contexto de empilhamento, então o marcador escaparia
para trás da própria placa. Quem o põe atrás dos itens é a ordem no documento:
ele é o primeiro filho, e todos são posicionados com `z-index: auto`.

#### Duas lições de instrumento, e as duas são erros meus

**Li a transição e chamei de atraso.** O marcador parecia estar sempre um passo
atrás — item 1 mostrando a posição do item 0. As variáveis na trilha estavam
**sempre certas**; o que eu media era o `translate` a meio caminho dos 200ms.
Com a troca numa chamada do harness e a leitura na seguinte, em repouso:
desalinho zero. *Valor em transição não é valor final* — é a parente da lição do
press da rodada 29b.

**E truncar um valor composto esconde a parte que interessa.** Cortei
`boxShadow` em 60 caracteres e reportei que a sombra era transparente; as
entradas zeradas são o começo da cadeia do Tailwind, e a camada real era a
última. A rodada 45 registrou isto com estas palavras, e eu andei nela de novo.

Fica anotado que `useIsomorphicLayoutEffect` está agora em **quatro** cópias
(`tabs`, `navigation-menu`, `carousel`, `sidebar`) — o arquivo seguiu o padrão
local do vizinho, e extrair alcançaria três arquivos fora do escopo.

### Rodada 66 — a navegação volta a ser painel no telefone, e só ela

Pedido: no telefone a barra sai como folha lateral esquerda, **sem mexer na
regra** de que toda outra folha vira gaveta.

Isto é uma **meia-volta na rodada 64**, e o argumento dela continua de pé. Ela
dissolveu o `EdgePanel` no `Sheet` dizendo que, *sem um consumidor que
precisasse do painel em toda largura, o componente separado era uma segunda API
para a mesma moldura*. O que mudou não foi o argumento: foi que o consumidor
voltou — e um consumidor pede **uma prop**, não um arquivo. O `EdgePanel` não
volta; o comportamento dele volta como eixo.

Medido antes, na moldura de 375px: a navegação abria `data-surface="drawer"`,
`data-side="bottom"`, `l0 t8 w375 h659`, com `[data-vaul-handle]`.

#### O eixo, e o que ele não faz

`Sheet` ganhou `surface: "auto" | "panel"`, padrão **`auto`** — a regra de hoje,
e o que mantém as ~40 folhas do app inalteradas. `panel` fixa o painel em
qualquer largura. **Não existe forçar a gaveta**: uma superfície que é gaveta em
toda largura já tem nome e arquivo, e é o `Drawer`.

O valor interno do painel se chamava `"sheet"` — circular dentro de um
componente chamado `Sheet`, e impossível de usar como valor de prop. Virou
`"panel"`, no tipo e no `data-surface`. A troca é contida: `useSheetSurface` é
exportado e tem **zero** consumidores fora do arquivo, e o único leitor de
`data-surface` no repositório testa **existência**, não valor
(`ds-shell.tsx:331`). O `tsc` achou a única sobra — um `surface === "sheet"` no
`SheetOverlay`.

#### O × estava escondido, e num painel isso deixa de passar

`[&>button]:hidden` na chamada da `Sidebar` é herança do shadcn, de quando o
`SheetContent` injetava o próprio ×. Desde a rodada 60 ele não injeta, então a
classe só escondia **o nosso** — medido, `display: none`. Na gaveta passava:
fecha-se arrastando ou tocando o véu. **Num painel não há arraste**, e o × passa
a ser a única afordância visível de fechar. Saiu.

Saiu junto o `fillMobileViewport`, que é a altura **da gaveta** — no painel ela
vem do par `top`/`bottom` do `cva`, e passá-lo seria prop inerte. E voltou o
`SIDEBAR_WIDTH_MOBILE` (18rem), que a 64 tinha removido porque "no telefone a
gaveta é a tela".

#### Medido depois

| | resultado |
| --- | --- |
| navegação a 375px | `panel` / `left`, `l0 t0 w288 h667` — altura cheia, **zero** alça, × em `display: flex`, nome "Navegação" |
| **folha comum a 375px** | segue `drawer`: `l0 t8 w375 h659`, alça presente, raio `18px 18px 0 0` |
| desktop a 926px | as três variantes com sobreposição **zero**, `inset · right` em `m:8px/0px` — a rodada 65 não regrediu |

A segunda linha é o guarda do pedido, e é a que prova que a regra global não
mudou.

Duas asserções novas, e as **sete** sabotagens reprovam: o padrão do eixo virando
`panel`, o eixo passando a aceitar `"drawer"`, a derivação deixando de olhar a
largura, a barra voltando a ser gaveta, o painel deixando de seguir o `side`, o
`fillMobileViewport` de volta, e a classe que escondia o ×.

### Rodada 67 — o `Table` ganha eixos, e o painel de tabela vira Template

`table.tsx` era o shadcn quase intacto: zero `cva`, `—` na coluna de variantes
do `ds:catalog`, uma página sem `PropsTable`. Medido nos 9 consumidores do
app: 7 painéis escreviam a mesma moldura à mão em quatro grafias de
arredondar canto (`Card gap-0 overflow-hidden … py-0 shadow-none ring-0` +
`CardContent relative flex flex-col p-0`), 3 folhas de detalhe (parcelas,
faturas, eventos de pagamento) escreviam
`mt-3 overflow-x-auto rounded-lg border border-border/50 bg-background/40`
byte a byte, 5 arquivos escreviam `h-11 px-4 py-0` no cabeçalho e 3 escreviam
`h-8 px-2`, 4 painéis tingiam e grudavam o cabeçalho à mão, e 6 telas
escreviam `<td colSpan className="h-10 px-2 text-center …">` para o estado
vazio. **Zero** usos de `TableFooter`.

**`Table` ganhou dois eixos**, num `cva` no topo do arquivo — `variant`
(`plain`, o padrão, sem moldura; `outline`, que monta a própria caixa,
`data-slot="table-frame"`, **fora** do viewport que a dissolução mascara,
porque a invariante 2 proíbe pintar o nó que carrega `scroll-fade-x`) e
`size` (`sm`/`md`/`lg`, medidos contra as densidades acima — `lg` usa o
mesmo `px` de 16 que `--card-strip-px`, e é por isso que `TablePanel` herda
`lg`). As variáveis (`--table-px`, `--table-py`, `--table-head-h`,
`--table-head-fs`) vão na `<table>` e descem por herança CSS até `<th>`/`<td>`.

**`TableHeader`** ganhou `variant` (`plain`/`muted`, a tinta que 4 painéis já
escreviam), `labels` (`text`/`caps` — a régua versalete, caixa alta e
`tracking-wider`, que 3 mini-tabelas de folha já escreviam à mão, e que o
comentário de `command.tsx` afirmava — erradamente, até esta rodada — já ser
a régua desta tabela) e `sticky` (gruda no topo; como o viewport rola nos
dois eixos, só cola com um teto — `viewportClassName="max-h-*"` no `Table`
pai, verificado no navegador: o `<thead>` fica no mesmo `y` antes e depois de
rolar 200px). O fio **e** a tinta continuam na mesma tira — decisão
registrada, a mesma isenção que `PageHeader` e `TableFooter` já tinham.

**`TableRow`** teve o hover **desligado por padrão**. Ele vinha sempre ligado,
e `PropsTable` já desligava por `className` com o comentário certo: "nada
acontece ao clicar — a linha acender é promessa falsa". `interactive` é
agora opt-in; `data-state="selected"` fica sempre, porque é estado e não
resposta ao cursor. `variant="group"` é a faixa de mês que
`transactions-table.tsx` pinta à mão (`bg-muted/30` + célula versalete em
`colSpan`), formalizada.

**`TableHead`/`TableCell`** ganharam `numeric` (`text-right` + `.nums`, a
régua de [Dinheiro](/designsystem/dinheiro) que todo painel escrevia como
`tabular-nums` à mão) e `selection` (a coluna de checkbox, `w-10 px-2
md:w-11 md:px-3`). Medido: `align-middle` sozinho deixa o `Checkbox`
(`size-4`) **2px acima** do centro da célula — o nudge do shadcn original era
real, e voltou, escopado à coluna via `[&_[role=checkbox]]:translate-y-0.5`
em vez de um heurístico `:has([role=checkbox])` solto. `TableHead` também
ganhou `sort`/`onSort`: presente, troca o rótulo por um `Button
variant="tertiary" size="xs"` com a seta (Heroicons 16/solid) e escreve
`aria-sort` no próprio `<th>`.

**`TableBody`** deixou de soltar o fio da última linha sempre.
`ds-doc.tsx`'s `PropsTable` já registrava o defeito no próprio comentário:
"o `Table` remove o fio da última linha, o que é certo quando existe borda
externa fechando embaixo e errado quando não existe — a última linha se
dissolvia na página". Hoje o fio só sai quando `variant="outline"` — lido de
um `TableFramedContext` que `Table` publica, não por seletor CSS de
ancestral (a rota mais simples, e a que evita a armadilha de especificidade
que `in-*`/`:where()` já custou caro nesta base outras vezes).

**`TableEmpty`** é peça nova — a linha "sem resultados" que 6 telas
escreviam à mão. Aceita texto (vira `Muted`) ou um `EmptyState variant="plain"`
inteiro.

### `TablePanel`, o primeiro Template que não é casco de página

`Card padding="none" variant="outline"` publicando `lg` em
`TableSizeContext` — nenhuma tela dentro dele escreve `size`.
`TablePanelToolbar` é `CardToolbar` com o nome do painel;
`TablePanelFooter` é `CardNote` com o ritmo responsivo
(`flex-col … sm:flex-row sm:justify-between`) que 5 arquivos escreviam à mão
com o arredondamento repetido porque a moldura não existia. **Sem eixo de
superfície**: as 7 chamadas do app são a mesma variante do `Card`, sem uma
segunda evidência — eixo sem contagem é ficção, a régua que este sistema já
aplicou ao cortar outros dois.

Ele entra em **Templates**, e não em Organismos: compõe `Card`, `Table` e
(no uso real) `Pagination` — dois ou mais organismos, dispostos num layout —,
que é a definição de Frost que o comentário do `LAYER` já cita ("os
templates são feitos de organismos"). A asserção 5 do `taxonomy.test.ts`,
que trancava Templates em `["page-header", "page-section"]`, passou a
`["page-header", "page-section", "table-panel"]`.

### O teste novo, e as sabotagens que ele pegou

[`table-ladder.test.ts`](../../src/components/ui/table-ladder.test.ts) tranca a
escada (nenhum par de degraus produz a mesma string, as medidas sobem de
verdade, nada montado em tempo de execução), a invariante 2 (o
`table-viewport` não desenha `bg-`/`border-`/`rounded-`/`shadow-`), a moldura
como nó próprio, o par hover/active de `interactive`, a regra J em
`TableHeader`, e que `table-panel.tsx` não escreve `role="toolbar"`
(`toolbar.tsx` já documenta por que — o app escreve esse papel à mão em 4
lugares sem foco itinerante, e `Toolbar` se recusa a repetir).

Três sabotagens, três reprovações: `bg-card` no viewport (invariante 2),
`hover:` sem o par `active:` na linha interativa, e fio+tinta juntos numa
string sem seletor de proteção (regra J) — a primeira tentativa de sabotar a
regra J usou `[&_tr]:border-b bg-muted/50`, que **não** deveria disparar (o
prefixo de seletor já protege, igual ao código real) e de fato não disparou;
a segunda, com `"border-b bg-muted/50"` solto, disparou. A primeira versão do
teste também caiu na própria armadilha que esta base já nomeou duas vezes —
"comentário não é código": os `it()` liam o arquivo cru, e a prosa dos
comentários (que cita `bg-`, `border` e `role="toolbar"` para explicar o que
evitar) derrubava os testes sozinha. Corrigido com um `semComentarios()`
antes de cada busca estrutural.

### O que mudou em produção: nada

**Zero telas migraram**, por decisão. O único pixel que teria mudado em
qualquer consumidor real é o hover das 3 mini-tabelas de folha — e elas
continuam com a moldura escrita à mão, então nem isso. `ds-doc.tsx`'s
`PropsTable` foi o único consumidor real editado: a moldura `bg-card` ficou
(segunda superfície nomeada), e os dois neutralizadores de hover viraram
`TableHeader variant="muted"` mais a ausência de `interactive` — nada a
desligar, porque não há mais nada ligado por padrão.

### O que ficou para depois, com o número

- **7 painéis** (`transactions-table.tsx`, `subscriptions/page-client.tsx`, o
  dashboard de recentes, o embutido de categoria, e 3 esqueletos) continuam
  escrevendo a moldura à mão em quatro grafias. Migram para `TablePanel`.
- **3 folhas** (`transaction-detail-sheet.tsx`,
  `subscription-detail-sheet.tsx`, `dashboard-payment-event-preview-sheet.tsx`)
  continuam com `mt-3 overflow-x-auto rounded-lg border border-border/50
  bg-background/40` byte a byte. Migram para `Table variant="outline" size="sm"`.
- **4 `role="toolbar"`** de seleção em massa (`transactions-table.tsx:264,320`,
  `subscriptions/page-client.tsx:545,608`) continuam sem foco itinerante.
- **`credit-card-detail-skeleton.tsx`** promete uma tabela
  (`min-w-[640px] … md:min-w-[700px]`) que a tela real não renderiza —
  `credit-card-detail-view.tsx` não importa nenhum primitivo de `Table`.
- **O `sticky` dos 4 painéis tingidos** nunca foi medido em produção: hoje o
  viewport deles não tem teto de altura, então `sticky` (que agora existe
  como prop) não colaria se ligado como está. Fica para quem migrar.

### Rodada 68 — o marcador do `Tabs` vira a peça de vidro

O pedido foi o efeito de vidro do iOS no `Tabs`. As duas primeiras respostas
óbvias já estavam medidas e reprovadas, e a saída foi uma terceira.

**O material (`backdrop-filter`) está descartado por premissa, não por gosto.**
`Tabs` tem **zero** consumidores no app; os 10 trilhos reais são
`role="tablist"` à mão, e **nenhum** é `sticky` ou `fixed` — não há conteúdo
passando por baixo de uma fileira de abas. Borrar cor chapada não desenha nada.

**E a bandeja com vidro já tinha sido medida, numa fileira idêntica a esta.** A
rodada 59 recusou o material no `Menubar solid` com o número e com o nome:
*"medida a 60% no escuro ela cai de rgb **38 para 27** sobre a página —
enfraquece, deixa de ler como bandeja e divergiria da `TabsList solid`, com quem
é idêntica hoje."*

Sobra o vidro **pintado**, e a peça certa é a que se move: o marcador. É o que um
controle segmentado do iOS de fato faz — o *thumb* é o vidro —, e é o único
encaixe que não quebra nada.

#### Por que o marcador cabe onde a bandeja não cabia

| | marcador | bandeja |
| --- | --- | --- |
| borda para o aro morar | **já tem** (`border-border/80`) | não tem — o aro custaria 2px do conteúdo |
| a conta, em `md` | caixa inalterada | 32 − 2 − 4 = **26 para um gatilho de 28** |
| raio | já tem `rounded-md`, e a utility não declara nenhum | idem |
| margem de contraste do texto | **18,97** | — |
| clicável? | **não** — quem recebe o clique é o gatilho | — |

A última linha é a régua que sobrou de quatro reprovações no `Button`: *"`Avatar`
e `ColorTile` não são clicáveis e não carregam texto sobre a superfície — o botão
faz as duas coisas, e é aí que a margem some."* Lá o rótulo branco sobre o verde
tinha **0,72** de folga sobre o piso de 4,5, e qualquer brilho branco a partir de
8% reprovava. Aqui a folga é a distância inteira entre `--background` e
`--foreground`.

#### O corpo não se move, e isso é construção e não sorte

`--glass-tone` é **`--background` opaco** — exatamente a cor que o marcador
chapado já pintava. Medido nos dois temas, o corpo do marcador de vidro contra o
do chapado:

| | corpo | delta |
| --- | --- | --- |
| escuro | rgb 10 | — |
| claro | rgb 250 | **[0, 0, 0]** |

O que entra é a **aresta**, e é ela sozinha que faz o material — a conclusão que
a rodada 44 já tinha alcançado por outro caminho ("numa peça com tom as nuvens
já chegavam a 3,6%"). Medido o aro contra o corpo:

| | pico | vale | vestígio |
| --- | --- | --- | --- |
| escuro (165°) | **3,01** | 1,26 | 1,48 |
| claro (345°) | **1,52** | 1,12 | 1,04 |

O pico escuro compõe para rgb **93**, praticamente o mesmo **94** que a placa
flutuante da barra lateral mede: o aro desenha aqui com a força que desenha lá.
O claro é mais fraco, e é o teto já registrado — sobre uma página de 250 o vidro
quase não se paga.

#### O realce voltou a ter produtor, depois de 23 rodadas

`--glass-sheen` é a camada mais de cima da receita, e está sem produtor desde a
rodada 45, com a nota de que *"a primeira peça de vidro **clicável** volta a
precisar dela"*. O marcador não é clicável, mas o gatilho que ele cobre é — e é
essa a peça.

**Quem publica é a trilha, e não o gatilho.** Custom property não atravessa para
irmão: o marcador é irmão do gatilho e filho da trilha, então a variável é dela,
lida por `:has()`. É a mesma razão pela qual o `useScrollFade` tem a opção
`shell`.

**O par `:active` é obrigatório, e não é simetria.** Um `:hover` dentro de um
seletor arbitrário não ganha o `@media (hover: hover)` que a variante do Tailwind
traz — mas também não existe no dedo. Sem ele o controle fica inerte no telefone,
que é a regra H; e o auditor não a alcança dentro de um `cva`.

**E o realce vira de direção com o tema**, pela régua do `--secondary-hover`: a
lâmina clara é 92% branca, e um realce branco ali não desenha nada. Ele puxa
sempre na direção do contato — preto no claro, branco no escuro.

Medido com ponteiro real: sobre a aba **ativa**, `--glass-sheen` vira
`oklch(1 0 0 / 7%)` e a camada de topo passa a pintar; sobre uma aba **inativa**,
ela continua `transparent`. O guarda importa — um realce que seguisse o cursor
por abas inativas acenderia o marcador que está noutro lugar.

#### O que foi verificado, e como

- **O marcador viaja, medido em duas posições.** `x: 68 → 144`, `w: 75 → 57`, com
  desalinho de **0,49** e **−0,38** px. Uma posição só não prova nada: foi
  exatamente assim que o defeito da rodada 32b atravessou uma inspeção inteira,
  porque o primeiro gatilho acerta por acidente quando o valor certo é zero.
- **A 375px**: bandeja 40, gatilho 36 — a geometria de ponteiro grosso intacta,
  com o vidro sobrevivendo (tom opaco, `--glass-cloud-ry: 70%` do preset
  `glass-control`).
- **Na tela, ampliado**: o chapado tem contorno uniforme; o de vidro tem a aresta
  com gradiente, clara no alto-esquerdo e escurecendo na diagonal. É a diferença
  entre um retângulo com borda e uma peça de vidro.

#### O eixo entra sem neutralizador, e é isso que o torna eixo

A superfície do `solid` saiu do `variant` e virou `compoundVariants` — a forma do
`ColorTile`. O ramo de vidro **não escreve** o que a utility apagaria, em vez de
escrever e desfazer: um `bg-background` que sobrevivesse ao lado morreria calado
sob o shorthand `background`, e um `bg-transparent` para consertá-lo é
exatamente o que a asserção 13 de `glass.test.ts` proíbe.

`ATOMOS` virou `COM_MODO` e ganhou `tabs`. O nome antigo passaria a mentir — o
`Tabs` é Organismo —, e o que os três têm em comum não é a camada: é não serem
clicáveis.

#### Os testes, e as três sabotagens

`tabs-size-ladder.test.ts` ganhou cinco asserções, e as 22 antigas passaram **sem
edição** — a prova de que o ramo chapado não se moveu. Sabotadas três, todas
reprovando na asserção certa: `bg-background` de volta no ramo de vidro; o realce
sem o par `:active`; e o `glass` vazando para o `underline`.

Uma lição de instrumento, e é erro meu: a primeira escrita da asserção do realce
usava regex com **espaço literal** (`oklch(1 0 0`) e com `[^\]]*`. Dentro de uma
classe arbitrária o Tailwind exige `_` no lugar do espaço, e o seletor tem
colchetes **aninhados** — o regex parava no primeiro `]`. Ela reprovava código
correto duas vezes seguidas. A versão que ficou separa os tokens e classifica,
em vez de casar a string inteira.

#### Zero pixel em produção, e um conserto documental

O modo é opt-in e `Tabs` não tem consumidor no app. Nada muda em produção, e no
catálogo só entra a seção nova.

De passagem: a `DocSection` intitulada **"Ghost"** demonstrava
`variant="plain"` — a API nunca teve `ghost`, que é palavra que só sobreviveu na
prosa. O título passou a dizer o nome que o código usa.

#### O que fica para depois

- **Os 10 `role="tablist"` à mão** e as duas strings de
  `transaction-type-segment.tsx` continuam onde estão. A migração é o backlog já
  escrito, e não esta rodada.
- **O eixo nasce sem consumidor de produto**, e isso é dito em vez de escondido.
  A régua desta casa é que eixo sem contagem é ficção; aqui ele existe porque o
  dono o pediu com o custo na mesa, como o `variant` de superfície do carrossel e
  a escada de espessura do material.
- **`npm run ds:catalog` não mostra o `glass`**: o script lê só o **primeiro**
  `variants:` do arquivo, que é o da moldura. Quem documenta o prop é a
  `PropsTable`.

### Rodada 69 — a Timeline não sabia o que a lista sabe, e o ponto nunca esteve no centro

`timeline.tsx` chegou com os três silêncios que esta base já nomeou: `ds:audit`
respondendo **"Nenhum achado"**, o `ds:catalog` reportando variante, e nenhum
teste de escada. Os três são sinal para olhar — `isUi` cala A2, C e C′, e a
regra **H** não enxerga dentro de `cva`.

**A premissa do docblock era falsa.** Ele dizia que a atividade do workspace e o
histórico de fatura *"hoje desenham a linha à mão"*. Varrido `src/` inteiro:
fora de `ui/` não existe **um** conector vertical — nem `w-px`, nem `border-l`
de trilho, nem ponto com anel. As duas telas são listas `divide-y`, e sempre
foram. É a família "a documentação afirma o que o código não faz", desta vez
justificando a existência do componente — e explicando os zero consumidores.

#### O ponto estava 4,4px acima do centro, e a conta já tinha nome

`mt-0.5` mais metade de `size-2.5` põe o centro a **7px** do topo.
`TimelineTitle` é `P`, que traz `leading-relaxed`, então a primeira linha mede
**22,75px** e o centro dela está em 11,375.

A conta é a que o `Alert` registrou — `(entrelinha − marcador) / 2` —, e ela dá
6,375 onde o código cravava 2. O defeito é **o dobro** do que o `Stepper` chamou
de "assinatura de desalinhamento sistemático". Medido depois: **desalinho 0,00**
nos dois marcadores de ponto da página.

**O `max(0px, …)` não é defensivo.** Quando o marcador é maior que uma linha —
o poço de 32 contra uma caixa de 22,75 — a conta fica negativa, e obedecê-la
puxaria o poço para fora do topo do bloco. Zerar ali é o que faz o poço alinhar
pelo topo e o ponto pelo centro, **com uma fórmula só**. Medido: topo do poço a
**0,00** do topo do conteúdo, nos três degraus.

#### O anel não tinha trabalho, e pintava a cor errada

`ring-4 ring-background` existe para furar um conector que passa **atrás** do
ponto. Aqui ele nunca passou: o conector é irmão, e nasce abaixo. O anel só
sobrepunha 4px do fio com `--background` — um entalhe em qualquer superfície
`--card`. É a régua do `Accordion`: **um componente não sabe sobre que
superfície está**, e não pode pintar a suposição. Medido depois: o fio sai
`oklch(0.9 0 0)`, 1px, com `box-shadow: none`.

#### O poço tingido é um movimento e dois defeitos

`--income` é declarado como `var(--success)` e `--expense` como
`var(--destructive)`: no ponto, que usa a cor cheia, os dois pares saem
**idênticos** — é o colapso que o catálogo documentava. Na família `-muted` eles
**divergem**, e o comentário do próprio `globals.css` chama essa família, com
estas palavras, de *"chips, badges, **icon wells**"*.

O marcador que faltava era exatamente um poço tingido, e é o desenho que
`account/activity` já escreve à mão em `h-8 w-8` — que é o `md` daqui, âncora
real e não escala inventada. Medido, no claro: poço de `income` `198,246,209`
contra `228,248,232` do `success`; no ponto, byte a byte iguais. **Sete tons
rendem cinco cores no ponto e sete no poço**, com a tinta entre **5,04 e 10,83**
nos dois temas.

O tom publica **três variáveis** e não pinta nada — cor cheia, superfície do
poço, tinta de dentro —, e é a forma do marcador que escolhe qual usar. É o que
evita 14 `compoundVariants` de tom × forma.

#### A lista assume o que é dela, pela terceira vez nesta base

`isLast` era prop de quem chamava — **e a página do catálogo afirmava o
contrário**, dizendo que *"o conector é responsabilidade do item, não do
consumidor"* três centímetros abaixo de uma demonstração que escrevia
`isLast={i === EVENTOS.length - 1}`. Hoje a lista deriva do índice e injeta por
clone, como `Stepper` e `BreadcrumbList`. O mesmo clone leva o `marker`: **uma
trilha tem uma calha só**, e é ela que faz a faixa de data alinhar — medido,
calha do evento e calha da faixa em **32 e 32**, com o rótulo a **0** de
desalinho.

#### Servidor, e é por isso que tudo desce por variável

O arquivo **não tem `"use client"`**, e não é acidente: um feed de histórico é a
coisa que mais quer ser renderizada no servidor com dado já buscado. Por isso o
degrau, a orientação e a calha viajam em variável CSS. A primeira escrita usou
`in-data-[orientation=…]`, e ele **compila com `:where()`** — que não soma
especificidade e perderia para a classe base no mesmo elemento, que é o defeito
do `DescriptionList`. Zero `in-*` no arquivo hoje, e o teste o tranca.

#### Dois eixos entram sem contagem, e isso fica escrito

`TimelineSeparator` (faixa de data) e `orientation="horizontal"` têm **contagem
zero** — nenhuma das oito listas de eventos do app agrupa por data, e não há
histórico deitado em tela nenhuma. Entram por decisão do dono, com o custo na
mesa, e ficam registrados assim em vez de apresentados como resposta a uma
medida. É o precedente do `variant` de superfície do `Carousel`.

Na horizontal o último item é `flex-none` de saída, preventivamente: com todos
esticando, o `Stepper` mediu *"~192px de vão morto"* e a trilha parando a 78% da
largura. Medido aqui: **vão morto 0,0px** em 768.

#### Três defeitos que eu mesmo introduzi, e como cada um apareceu

**O comentário dizia "este é o primeiro `cva` de propósito" acima do `cva`
errado.** O `ds:catalog` lê só o primeiro `variants:` de cada fonte — a lição do
`Item` —, e eu escrevi a explicação e pus o de tom na frente. O catálogo saiu
reportando `tone` e escondendo os três eixos da raiz. **Escrever a regra não é
cumpri-la**, e agora a asserção 11 a tranca.

**`text-(length:…)` derrubou o `leading-relaxed` do `P`.** O utilitário de
tamanho escreve `line-height` junto, e posto depois ele vence — a armadilha que
este arquivo registra na rodada da composição. A caixa saiu com **21px** onde a
fórmula supunha 22,75, e o ponto caiu **0,88px** fora do centro com o código
"certo". O conserto é fonte única: `--tl-lead` é publicada pelo degrau, e as
duas pontas a leem — o título como `line-height`, a fórmula como entrelinha.
Duas fontes divergem caladas; uma não tem como.

**`isLast` e `marker` vazaram para o DOM da faixa.** A `Timeline` clona **todos**
os filhos, e o separador não os desestruturava — `React does not recognize the
\`isLast\` prop`, três vezes na mesma página.

#### Uma lição de instrumento, e é a sexta desta série

Medi o horizontal logo depois de um `location.reload()` e li **largura 0** com
**−58,3px** de vão morto. Não havia defeito: o layout não tinha assentado. Na
leitura seguinte, 768 e vão zero. *Medição de layout se lê depois de um
quadro* — e depois de um recarregamento, depois que ele termina.

E o parente dela: **o buffer do console sobrevive à navegação.** Depois do
conserto do vazamento, `read_console_messages` continuava devolvendo os três
avisos antigos. Quem prova é o DOM — zero atributos vazados em
`[data-slot="timeline"] > *` —, nunca o histórico do console.

#### O que foi considerado e não entra

**Rótulo `sr-only` de tom**, como o `ESTADO_EM_PALAVRAS` do `Stepper`. Lá os
estados são um conjunto fechado com significado fixo; aqui `tone` é um papel de
cor escolhido por quem chama, e o título costuma carregar o sentido — o anúncio
sairia *"Fatura paga, deu certo"*. Fica registrado como rejeitado, com o motivo.

#### O teste, e as onze sabotagens

[`timeline-ladder.test.ts`](../../src/components/ui/timeline-ladder.test.ts) tem 11
asserções, e **cada uma foi verificada reintroduzindo o defeito** — as onze
reprovam. Ele lê o fonte **sem comentários**, porque a prosa do arquivo cita de
propósito o que o componente deixou de fazer, e uma varredura ingênua se
acusaria sozinha.

**Zero pixel em produção**: o componente segue sem consumidor, e `git diff` fora
de `ui/`, `designsystem/` e `AGENTS.md` sai vazio.

### Rodada 70 — o marcador veste vidro, e a uniformidade é mecânica

O pedido foi uma versão de vidro dos ícones da `Timeline`, no estilo do
`Avatar glass`. **O encaixe dispensou tabela nova**: a receita precisa de duas
coisas de quem a veste, e a peça já publicava as duas.

| a `@utility glass` quer | a `Timeline` já tinha |
| --- | --- |
| `--glass-tone` — o corpo, e **tem de ser opaco** | `--tl-well` (`--{tom}-muted`) |
| `--glass-ink` — a fonte de matiz do aro e das nuvens | `--tl-ink` (`--{tom}-muted-foreground`) |

Verificado: os oito tokens `-muted` são `oklch(l c h)` **sem alfa** nos dois
temas, então a regra da rodada 44 — *"tom translúcido deixa a lâmina quase preta
atravessar, e a peça sai 20% mais escura"* — é satisfeita sem adaptação. Não
entrou `GLASS_TONES`, que é o que a régua manda: *"quem veste vidro declara
`--glass-tone` e `--glass-ink` com a cor que já tem"*.

E a forma também: o marcador é `rounded-full`, que é a premissa do
`glass-round` — o preset que existe porque o aro linear põe o pico **nos cantos
da caixa**, e num círculo eles não existem (0% do perímetro, medido no `Avatar`).

#### A uniformidade não é combinada, é impossível de violar

A primeira versão do plano escopava o vidro ao poço de ícone, e o dono a
reprovou com a razão certa: **`marker` é sobrescrevível por item**, então uma
lista `marker="icon" glass` com um item em `marker="avatar"` renderizaria um
poço de vidro ao lado de um avatar chapado. Dois acabamentos na mesma trilha.

Hoje o vidro alcança **toda forma que pinta superfície** — `dot`, `icon`,
`avatar` —, e o eixo é da **raiz**. A diferença que importa está no clone:
`marker` é preenchido com `??` (o item pode fugir da forma), e **`glass` é
atribuído direto** (o item não pode fugir do acabamento). Não há como escrever
a lista inconsistente. Medido no DOM da lista mista: ícone, avatar e ponto, os
três com o aro cônico.

#### A tinta foi medida contra a alternativa, e a régua escrita perdeu

O candidato óbvio era `--tl-fill`, a cor cheia — a régua do vidro diz que a
fonte de matiz é `--{tom}`, porque o matiz é idêntico nos dois temas e basta um
valor sem par `dark:`. Só que a receita faz `oklch(from ink l calc(c * 4) h)`:
ela toma o **`l`** da tinta também, e `--tl-fill` tem claridade fixa (~0,5), que
não conversa com um aro cujos tokens invertem por tema (`oklch(0 0 0 / 18%)` no
claro, `oklch(1 0 0 / 34%)` no escuro).

Medido, o aro contra o corpo:

| | `--tl-fill` | `--tl-ink` |
| --- | --- | --- |
| escuro (média) | 3,15 | **3,66** |
| claro (média) | 1,77 | **2,07** |
| pior caso (`default` escuro) | **2,60** | **3,48** |

`--tl-ink` ganha nos dois temas, e o pior caso é o que decide: `default` é o tom
mais usado e era exatamente onde o aro sumia. O par `dark:` que a régua queria
evitar **não foi preciso** — o token já inverte sozinho, como
`--identity-N-surface` faz no `Avatar`.

**A lição de forma:** uma régua escrita para uma peça não é lei para a
seguinte. `--{tom}` é a fonte certa quando a peça não tem um token que
acompanha o tema; esta tinha.

#### As duas previsões, confirmadas

Com um tom **opaco** a lâmina e as duas nuvens ficam por baixo dele e não pintam
nada — o que sobra é o corpo, o aro cônico e o especular. Daí duas previsões
falsificáveis, e as duas passaram nos dois temas:

1. **O corpo do marcador de vidro é byte a byte o do chapado** — `0,48,6` contra
   `0,48,6` no `income`, e assim nos demais.
2. **O contraste da tinta não se move** — 5,86 / 7,75 / 10,8, exatamente os
   números da rodada 69.

**Zero deslocamento**, que era o critério da armadilha nº 2 (`border: 1px solid
transparent` encolhe o conteúdo em 2px): caixa e calha idênticas com e sem
vidro — 10/10 e 32/32 —, e o ícone parado em 16.

#### O avatar precisava de moldura, e o recuo é o que a cria

Ele quase ficou de fora: `[&>*]:size-full` faz a foto cobrir a casca inteira, e
o vidro ficaria invisível. Sob vidro a casca ganha `p-0.5`, e com
`box-sizing: border-box` os 32 viram 26 de caixa de conteúdo — o `size-full`
encolhe o filho para ela, e sobram **3px de bisel de vidro em volta da foto**.
Medido: casca 32, borda 1, recuo 2, foto **26**.

**E o bisel é o único sem tom, de propósito**: a cor daquele marcador é a
identidade da pessoa, e ela mora dentro do avatar. Tingir a moldura por cima
competiria com ela. Sem `--glass-tone` a lâmina e as nuvens voltam a pintar, e é
isso que dá corpo de vidro à moldura em vez de deixá-la um recuo vazio.

**Uma correção ao meu próprio plano:** ele previa tirar o `[&>*]:size-full` do
ramo de vidro, alegando que era ele que escondia a casca. Estava errado — quem
cria o bisel é o **recuo**, e sem o `size-full` um avatar de 32 ficaria dentro
de uma casca de 26, recortado pelo `overflow-hidden`. A asserção 16 tranca os
dois juntos.

#### O ponto entrou, e o critério dele era a tela

A 8–12px o aro cônico de 1px é ~10% do diâmetro, e nenhum número diz se aquilo
lê como conta de vidro ou como sujeira. Ele entrou porque a uniformidade o
exige, foi medido (aro contra corpo de 1,97 a 3,48) e visto ampliado. Se um dia
reprovar na tela, **a saída não é excluí-lo em silêncio** — é tornar `glass`
inválido com `marker="dot"` no tipo, para a uniformidade continuar mecânica.

#### O teste, e as sete sabotagens

Cinco asserções novas em
[`timeline-ladder.test.ts`](../../src/components/ui/timeline-ladder.test.ts) — a
uniformidade em todas as formas, a ausência de neutralizador, o tom saindo da
própria peça, o clone sobrescrevendo em vez de preencher, e o bisel. Mais
`"timeline"` em `COM_MODO` no `glass.test.ts`, o que submete o arquivo às três
regras de lá.

**Sete sabotagens, sete reprovações** — inclusive a que importa: o item voltando
a poder sobrescrever o `glass`, que é o buraco que o pedido do dono fechou.

**Zero pixel em produção**: o modo é opt-in, o padrão é chapado, e `git status`
não mostra nada fora de `ui/`, `designsystem/` e este arquivo.

#### Dois desalinhamentos que só a tela achou, e os dois eram meus

O dono circulou o primeiro evento e riscou o último: **o marcador da última
linha não estava no topo.** Medido, **23,44px** abaixo do centro do título,
contra **0** nos outros três.

A causa é um `justify-center` que **eu** pus na calha na rodada 69, para o ramo
horizontal. O conector é `flex-1`: com ele não sobra espaço livre e
`justify-content` não decide nada — por isso os três primeiros itens estavam
certos e o defeito parecia não existir. **Sem** conector, no último item, o
marcador sozinho se centrava na altura inteira da calha. Um `justify` que só
age quando falta um irmão sobrescrevia a fórmula de `MARCADOR_OFFSET` pelas
costas, e só na última linha de cada trilha.

**A varredura do conserto achou o segundo**, que a anotação não pedia e que eu
não teria visto olhando só o caso relatado: um **ponto sobrescrito dentro de
uma trilha de poço** saía **6,38px acima** do centro.

Ali a causa é conceitual, e vinha da rodada 70. `--tl-marker` fazia dois
trabalhos: a largura da **calha** — que tem de ser uniforme, senão a faixa de
data não tem com o que se alinhar — e a medida do **marcador**, que o
deslocamento usa para centrar. As duas coincidem enquanto o item não foge da
forma da lista; no item que foge, o ponto de 10px lia a medida de 32. Hoje cada
forma republica `--tl-marker` com a própria medida no elemento do marcador, e a
raiz segue publicando a dela para a calha.

Medido depois, nos **41 marcadores** da página: desalinho de ponto **0**, topo
de poço **0**, e a calha do ponto sobrescrito ainda em 32 — igual à da faixa de
data.

**A lição de método:** o primeiro defeito vivia numa linha só de cada lista, e
a rodada 69 mediu *o primeiro item* de cada trilha. **Um defeito que depende da
posição não se acha medindo uma posição** — é a mesma família do marcador do
`NavigationMenu`, que acertava no primeiro gatilho porque ali o valor certo é
zero. A varredura que fecha o assunto percorre todos os itens, e foi ela que
entregou o segundo de graça.

#### O texto da horizontal estava pendurado na trilha

Terceiro alinhamento da série, e o dono selecionou o item para apontá-lo. Rente
à esquerda, o centro da caixa de texto ficava a **161,4px** do centro do
marcador — mais que os 127px que o `Stepper` mediu para o defeito idêntico.

A receita é a de lá: caixa em `max-content` deslocada meia medida do marcador.
Medido depois: **desalinho 0** nos três.

**Mas a exceção de borda foi invertida, e é decisão do dono com o custo na
mesa.** O `Stepper` deixa o **primeiro** rótulo rente à esquerda, porque
centrá-lo o levaria 5px para fora da trilha. Aqui os três se centram: o texto do
primeiro passa **6,62px** da borda esquerda da lista, e nenhum contêiner com
respiro recorta — medido no catálogo, sobram 18,4px dos 25, com `recorta:
false`. Uma trilha rente à borda cortaria ~7px, e isso está escrito na página.

A **última** não precisava de exceção em nenhuma das duas leituras: centrada ela
ultrapassa a borda direita em 0,8px, contra os 4px que a versão rente à esquerda
já ultrapassava. Centrar melhorou os dois lados.

#### A medida do marcador subiu para o item, e o motivo é parentesco

`--tl-marker` fazia dois trabalhos, e o conserto anterior o resolveu só pela
metade: declarada no **marcador**, a medida serve o deslocamento vertical e
**não** serve a centragem horizontal, porque o conteúdo é **irmão** do marcador
e custom property não atravessa para o lado.

Hoje ela mora no `<li>` (`MEDIDA_DO_MARCADOR`), de onde desce para os dois. A
calha não se mexe: `--tl-rail-w` é computada na raiz e herda já resolvida, então
ela continua com a medida da lista — que é o que faz a faixa de data alinhar.

**Duas substituições minhas falharam caladas nesta rodada.** Eu tinha targetado
a forma de três linhas de um ternário que uma edição anterior já havia
colapsado numa linha, e `str.replace` não avisa quando não acha. O sintoma foi
o oposto do esperado — o alinhamento vertical *regrediu* — e quem achou foi a
varredura, não o `tsc`: as classes simplesmente não estavam no `<li>`. **Toda
substituição em lote leva `assert`**, e as que eu não assertei foram exatamente
as que falharam.

#### O trilho da `Toolbar` passou a demonstrar o vidro

Os **três** trilhos da página da barra — mais os dois blocos de `code`, para a
demonstração e o trecho não divergirem — viraram `<TabsList glass>`. É o
primeiro consumidor do modo fora da própria página do `Tabs`, e ele confirma a
previsão que a rodada 68 registrou, agora medida noutro componente:

- **o corpo não se move.** `--glass-tone` resolve para `--background` byte a
  byte nos dois temas (`250,250,250` no claro, `10,10,10` no escuro) — que é a
  cor que o marcador chapado já pintava;
- **a geometria não anda**: marcador colado ao gatilho ativo (`dx`/`dy` **0**,
  o resto sub-pixel de métrica de texto) e o gatilho parado em **28**, com a
  régua de densidade da barra intacta.

O aro é **linear e não cônico**, e está certo: o marcador é `rounded-md`, e o
`glass-round` é opt-in por forma — um bisel polar num retângulo arredondado
põe o pico no meio de uma aresta reta. A prosa da página fala da **bandeja**, e
o vidro não a toca: ele desenha só o marcador que viaja.

#### Uma lição de instrumento

Para julgar o ponto ampliado, montei uma sonda que **clonava só o `<span>` do
marcador** para fora da lista. Ela saiu vazia nas colunas chapadas, e a causa é
óbvia depois de vista: `--tl-dot`, `--tl-fill` e `--tl-well` são publicados pela
**raiz** e pelo **item**, e um marcador arrancado dali não tem variável nenhuma
para ler. Quem quiser ampliar uma peça deste sistema clona o contêiner que
publica as variáveis, nunca o nó que as consome.

### Rodada 71 — a paginação estava no corpo de um parágrafo

O dono selecionou a fileira no rodapé do `TablePanel` e pediu o componente
**menor e mais compacto**: os botões talvez estivessem certos, os números não.
Medido antes: número, extremo e status em **14px** — o corpo do texto da página
—, caixas em 32, e a reticência em **16px herdado** porque não declarava
`text-*`. O rodapé de paginação real do app, escrito à mão em
`transactions-table.tsx`, já rodava em 12px.

**Encolher a caixa sozinha não resolveria, e a razão é do `Button`.** Os degraus
`icon-*` nunca declaram `font-size`; só `xs` e `sm` da coluna de texto o fazem.
A coluna de ícone espelha a de texto na **caixa**, não no **tipo** — e esta
peça é a única do sistema que põe texto num `icon-*`. `icon-sm` sozinho daria um
dígito de 14px numa caixa de 28. A frase deste arquivo que dizia o contrário foi
corrigida junto.

#### A escada, com o tipo descendo junto com a caixa

| `size` | caixa | corpo | `gap` da raiz |
| --- | --- | --- | --- |
| **`sm`** (padrão) | 28 | 12,8px | 8 |
| `md` | 32 | 12,8px | 12 |
| `lg` | 36 | 14px | 16 |

É a lição que o `Tabs` trancou: `sm` e `md` levam `text-control-sm`, `lg` volta
ao corpo da página. **`md` não reproduz a geometria antiga, de propósito** — ela
era caixa 32 com tipo 14, que é o defeito relatado; `md` mantém a caixa e desce
o tipo. `xl` ficou fora pela régua da escada; o `xs` também ficou, e entrou na rodada 72 por decisão do dono. O `gap` de `lg` saiu 16 e
não os 12 do plano: com 12, `md` e `lg` produziam a mesma string na raiz — o
defeito do `Item` que a asserção 1 existe para barrar.

Medido depois, nos dois temas: as quatro peças — número, extremo, reticência e
status — no **mesmo corpo dentro de cada degrau**, e a caixa da reticência
acompanhando (28/32/36). Os controles da demonstração "Padrão" foram de 384px
(somando as peças medidas antes) para **334,9** — 13% mais estreitos. O status
**manteve a cor**: `twMerge` só troca o tamanho porque `text-control-sm` está no
grupo `font-size` em `utils.ts` — sem isso ele viraria cor e apagaria o
`text-muted-foreground`, o bug que aquele arquivo registra.

#### Uma fonte para o tamanho, e o custo dela

O tamanho morava em quatro lugares que não se conheciam: o extremo em `md`, o
número em `icon-md`, a reticência em **`size-8` cravado** e o quadrado do
telefone em `max-sm:size-8`, escrito à mão *"na medida dos números ao lado"*.
Hoje os quatro saem de `paginationSteps` e a raiz publica o degrau por
contexto; `size` numa peça sobrescreve só ela.

**Contexto, e não clone, e isso custou `"use client"`.** As peças são **netas**
da raiz (`Pagination > Content > Item > Link`), e o `cloneElement` que a
`Timeline` usa só alcança filho direto. O arquivo era componente de servidor.

**O status do rodapé de tabela vive fora da raiz** — é irmão da `Pagination`, à
esquerda —, e fora da raiz não há contexto. Ele nasce no mesmo padrão (`sm`) e
aceita `size` próprio. Medido no `TablePanel`: fora da raiz, e em 12,8px.

O `ds:catalog` saiu de **`—`** para `align · size`: não havia `cva` no arquivo.

#### Duas afirmações falsas no catálogo, e uma delas é maior que a rodada

A tabela de peças dizia que `isActive` **"preenche e engrossa"**. Não engrossa:
o próprio componente registra que o `font-medium` extra do ativo saiu, porque
já é a base.

A outra: a nota *"No telefone, só anterior e próximo"* dizia que **a numeração
some abaixo de `sm`**. Medido a 375px, **ela não some** — nenhuma peça esconde o
número —, e no toque cada controle cresce a 44, então a fileira de sete peças
**transborda** em quatro das cinco demonstrações. É anterior a esta rodada, e
consertar é mudança de comportamento no telefone, fora do que foi pedido: a nota
passou a dizer a verdade, e o conserto está no backlog.

#### A lição de instrumento, e é minha

A sabotagem 5 — o número usando o degrau vizinho — **passou**. Não era buraco
do teste: o `replace` troca a primeira ocorrência, e a primeira ocorrência de
`numero: "icon-sm"` no arquivo é o **tipo** `PaginationStep`, não a tabela. O
vitest não checa tipo, então a mutação não mudou nada em runtime. Mirando a
tabela, três asserções reprovaram (2, 4 e 5). **Uma sabotagem que passa é
suspeita do instrumento antes de ser do teste** — e ela precisa mirar o valor
que roda, não a declaração que o descreve.

### Rodada 72 — a paginação ganha o `xs`, e ele vira o padrão

O dono perguntou se o rodapé do `TablePanel` era a menor versão da
`Pagination`. Era: `sm`, 28px com 12,8px. Explicado que o `xs` tinha ficado fora
pela régua da escada — *"`xs` e `icon-xs` são para dentro de outro controle"* —,
ele pediu uma versão ainda menor, e que ela fosse o **padrão**. É inversão da
régua com o custo na mesa, registrada como decisão dele e nomeada na própria
régua do `xs` como exceção.

| `size` | caixa | corpo | `gap` da raiz |
| --- | --- | --- | --- |
| **`xs`** (padrão) | 24 | 12px | 6 |
| `sm` | 28 | 12,8px | 8 |
| `md` | 32 | 12,8px | 12 |
| `lg` | 36 | 14px | 16 |

**O `xs` não inventou nada**: o extremo é `Button size="xs"`, o número é o par
`icon-xs`, e o corpo é o `text-xs` que o próprio `Button xs` usa — o mesmo 12px
do rodapé real de `transactions-table.tsx`. `icon-xs` também não declara tipo (o
buraco da rodada 71), e a tabela o declara por construção. `text-xs` é tamanho
padrão do Tailwind, então o `twMerge` o reconhece sem tocar em `utils.ts`.

Medido depois, nos dois temas:

- **`xs`: 24px e 12px nas quatro peças** — número, extremo, reticência e status.
- **Os três degraus antigos idênticos à rodada 71, ao décimo**: controles em
  334,9 / 374,9 / 404,1.
- **O rodapé do `TablePanel` foi de 206,9 para 188,7px**, e a demonstração
  principal de 334,9 para **300,7** — 22% abaixo dos 384 de antes da rodada 71.
  As duas estimativas do plano (~189 e ~301) acertaram.

**O padrão mora em três lugares que precisam concordar**: o `size` da raiz, o
`defaultVariants` e o **valor padrão do contexto**. O terceiro é o que ninguém
lembraria: ele decide o status que vive **fora** da raiz — no rodapé do
`TablePanel` ele é irmão da `Pagination` e não herda nada. Esquecido em `"sm"`,
a fileira sairia em 12px e o status ao lado em 12,8, calado. Medido: status de
fora da raiz em **12px**, com `text-muted-foreground` intacto nos dois temas.
**Seis sabotagens, seis reprovações** — uma para cada um dos três lugares.

Três textos passariam a mentir e foram corrigidos: o doc-comment da tabela, a
frase da rodada 71 e a descrição da escada no catálogo diziam que o `xs` "fica
fora pela régua".

**O transbordo a 375px continua.** O `xs` só encolhe o mouse: no toque todo
controle cresce a 44 de qualquer jeito. Foi decidido não mexer nisso nesta
rodada, e o item segue no backlog.

### Rodada 73 — o painel de tabela ganha ações por linha e rolagem com cabeçalho fixo

Pedido: duas versões novas do `TablePanel` — **ações na última coluna** e
**rolagem com cabeçalho fixo** —, e no telefone as duas usam o padrão "A mesma
tabela no telefone": dois gêmeos trocados por CSS (`hidden md:block` /
`md:hidden`), cada linha virando um `Item`. Nunca um hook de largura.

Contado antes de desenhar: as **2 de 2** tabelas reais com coluna de ações
(`transactions-table.tsx:802`, `subscriptions/page-client.tsx:924`) escrevem o
par lápis + lixeira à mão, **sem `aria-label`** — quatro botões por linha sem
nome acessível —, e com a lixeira em `text-destructive`, vermelha, repetida em
toda linha **ao lado de valores de saída em vermelho**. É a mistura que o
invariante 3 proíbe. A `Table` tinha `selection` para a primeira coluna e nada
para a última.

#### `actions`, o espelho de `selection`

`TableHead actions` e `TableCell actions`: a coluna encolhe até o conteúdo
(`w-px whitespace-nowrap`), alinha à direita, e a célula monta a fileira
(`data-slot="table-actions"`, `flex justify-end gap-1`) que as duas telas
escrevem à mão. O recuo **continua vindo de `--table-px`** — ao contrário da
coluna de seleção, que crava o próprio e ignora a densidade. A célula é `py-0`,
porque o botão já tem altura.

Medido no desktop: linha de **45px com e sem ações** (a previsão do `py-0`),
coluna de **92px** e **16px** de folga até a borda — o `--table-px` do `lg`.
**O cabeçalho não mostra rótulo**, por decisão do dono: os ícones já dizem o
que fazem, e o nome "Ações" fica em `sr-only`, porque um `<th>` vazio é
anunciado como coluna sem nome. Botões de 28×28, cada um com o **objeto** no nome:
`Editar Mercado`, `Excluir Mercado`. A lixeira é neutra: `250,250,250` contra os
`255,100,103` de `--destructive`, nos dois temas. E o `stopPropagation` segura:
clicar no botão registra "Editar Mercado"; clicar na célula ao lado, "Abrir
Salário". No toque os botões crescem a 44, e nada na coluna depende de `hover`.

#### O cabeçalho fixo perdia a tinta, e as telas o pintam translúcido

`sticky` sobrescrevia o `muted` com `bg-card`: opaco, que é o certo, mas sem o
tom — o painel rolável sairia com um cabeçalho diferente do painel padrão. As
telas reais resolvem ao contrário, com `sticky … bg-muted/50`, e isso deixa as
linhas passarem por baixo.

Sob `sticky` + `muted` o fundo passou a ser a **composição opaca**:
`color-mix(in srgb, muted 50%, card)`. `srgb` porque é nele que o navegador
compõe alfa — e a previsão de que isso bate byte a byte com o cabeçalho parado
foi medida: **31,31,31 no escuro e 245,245,245 no claro, idênticos, alfa 1**.
A dedução sobre as telas também: reproduzido o `bg-muted/50` no catálogo, alfa
**0,502**, com duas linhas visíveis por baixo ao rolar. Viewport de 288 e o
`<thead>` parado depois de 200px de rolagem.

#### O telefone, e a primeira versão quebrava de dois jeitos

Os gêmeos são `ItemGroup variant="divided"` — **linhas, não cartões**, porque
dentro do `TablePanel` um cartão com contorno seria cartão dentro de cartão —,
com item `lg` (os 16px das tiras do painel). A versão rolável **não** tem teto
no telefone: lá quem rola é a página, e rolagem aninhada no toque é pior que
nenhuma.

Medido a 375px, a primeira versão punha valor e botões do mesmo lado, e a mesma
lista saía com **dois layouts**: "Mercado" e "Streaming" jogavam as ações para
uma segunda linha, "Salário" não — e espremia o conteúdo a **48px**. Com
botões, o valor passou a ter linha própria dentro do conteúdo. Depois: conteúdo
em **149px e altura 90 nos três**, botões 44×44, página sem transbordo. Sem
botões nada muda: o valor fica à direita.

**E o rodapé da rolável transbordava**, pelo item de backlog da paginação: seis
controles a 44 pediam 284px para 259 disponíveis. A demonstração caiu para duas
páginas (1–12 de 24) e o rodapé cabe — **291 contra 291**. O componente não
mudou; o defeito continua onde estava, no backlog.

#### O teste, e a asserção que acusava o próprio código

Cinco asserções novas em `table-ladder.test.ts` (10 a 14): a coluna encolhe,
alinha e monta a fileira; nenhum `px-*` cravado; alvo de dedo e nada atrás do
cursor; `sticky` + `muted` opaco em `srgb` e nunca translúcido; `sticky` sem
`muted` segue `bg-card`. **Oito sabotagens, oito reprovações** — incluindo a
mistura em `oklab`, que não bate com a composição.

A 13 reprovou código correto na primeira escrita: procurando `bg-muted/50` ao
lado de `sticky &&`, ela casava `!sticky &&`, que é justamente o ramo **não**
fixo, onde o translúcido é certo. Hoje ela ancora com `(?<!!)`. É a família de
sempre — *uma varredura de texto precisa saber o que a condição diz*.

#### Duas lições de instrumento, e as duas já estavam escritas aqui

**Li o estado do clique no mesmo passo do `.click()`**, e o registro parecia
atrasado um clique. Lido na chamada seguinte, os dois casos acertam. Sexta vez.

**E a métrica de quebra deu falso positivo.** Comparar topos acusava quebra num
item `items-center` em que as ações só estavam centradas mais abaixo. O que diz
se a linha quebrou é a **horizontal**: `ações.left < conteúdo.right − 1`.

**Zero pixel em produção**: as duas colunas reais continuam à mão.

#### O realce da linha desceu para `bg-muted/30`, com o custo na mesa

Pedido do dono: um hover mais suave. Medido contra o card, `muted/50` dava
**1,08 no escuro e 1,09 no claro**; `muted/30` dá **1,04 e 1,05** — o tom mais
leve que o sistema já usa. Os dois custos foram apresentados antes: no escuro o
realce fica a 4 unidades de brilho do card (27 contra 23), e ele é **o mesmo
tom da faixa de mês** (`variant="group"`), então uma linha apontada passa a
ler igual a um cabeçalho de grupo. O selecionado segue em `bg-muted` cheio.

E o nome da linha passou a sublinhar junto: `TableCell primary`. É a régua do
rótulo do `Accordion` — o traço mora **no nome**, nunca na linha, porque
`text-decoration` desce para todo descendente e um valor sublinhado lê como
rasura. Ele só acende sob `interactive` **por construção**: o `group/table-row`
existe só no ramo interativo do `TableRow`, então numa linha de referência o
`group-hover` não tem ancestral a casar. Com o realce de fundo tão leve no
escuro, é o traço que carrega o sinal.

**As ações ganharam tooltip, e a célula o monta sozinha.** Todo botão da coluna
com `aria-label` sai embrulhado num `Tooltip` com o mesmo texto — as ações são
sempre botões só de ícone, e o nome que o leitor de tela ouve é o que o olho
precisa ler. O `Tooltip` não tinha degrau nenhum, e entrou `size` (`sm` 12px
com recuo menor, `md` o de sempre): na coluna de ações a caixa de 14px saía
maior que o botão de 28 que ela nomeia.

**E o embrulho quebrava o alvo de dedo, calado.** O `Button` espalha as props
depois do próprio `data-slot`, então o `TooltipTrigger asChild` o troca por
`tooltip-trigger` — e a fileira dava 44px no toque por
`[&>[data-slot=button]]`. Hoje o seletor é `[&>button]`, que ainda vence o
`size-7` do botão em especificidade (0,1,1 contra 0,1,0). A asserção 16 tranca
os dois.

**E a primeira versão não embrulhava nada na demo.** O helper de ações do
catálogo devolve `<>…</>`, e o `Children.map` via um filho só, sem
`aria-label` — medido, tooltip nenhum e o botão ainda com
`data-slot="button"`. A tela real de transações também passa as ações dentro de
um condicional. A célula abre os fragmentos, recursivamente, antes de embrulhar.

**O realce do botão sumia sobre a linha acesa.** O botão só recebe o cursor com
a linha já em `bg-muted/30`, e o hover do `tertiary` — `bg-muted/50` no escuro —
dava **1,06** contra ela (32 contra 27). A célula acrescenta
`bg-current/15` a cada ação: **1,54 no escuro e 1,39 no claro**, o degrau do ×
da `AnnouncementBar` pela mesma razão de área. Entra por `className`, para o
`twMerge` remover o do `tertiary` em vez de disputar, e com o par `dark:`, que
senão perderia para o `dark:hover` do botão. **Depois o dono o desceu dois
degraus**, passando por `/12` (1,40 e 1,32) até `bg-current/10` — o do
`AlertAction`: 1,32 no escuro e 1,25 no claro, ainda longe dos 1,06 que
sumiam.

**E a lixeira vira o botão destrutivo no cursor.** Quem escreve
`variant="destructive"` numa ação da coluna declara a intenção, e a célula a
troca por `tertiary` com o realce `TABLE_ACTION_DESTRUCTIVE_CLASS`: neutra em
repouso — a regra do invariante 3 continua valendo em toda linha —, e no
cursor e no toque a superfície de repouso do próprio `Button destructive`
(`bg-destructive/10`, `/20` no escuro, tinta `destructive-muted-foreground`).
O vermelho chega na hora da decisão. No gêmeo do telefone não há célula, e ali
a lixeira fica `tertiary`. A asserção 21 tranca as seis classes, a ausência de
vermelho em repouso e a troca de variante.

**O divisor do cabeçalho fixo subia com a primeira linha.** Apontado pelo
dono. Com `border-collapse` — o padrão do preflight — o fio entre o cabeçalho e
o corpo pertence à **grade** da tabela, e não à célula `sticky`: o cabeçalho
ficava parado e o fio rolava junto com o corpo. Sob `sticky` o fio passou a ser
uma sombra interna de 1px em cada `<th>`, que é parte da célula e viaja com
ela, e a borda da linha sai para não sobrar um segundo fio rolando. O cabeçalho
parado segue com o `border-b` de sempre. A asserção 22 tranca isso.

**E as páginas da paginação passaram a ter a mesma caixa.** Apontado pelo
dono: a atual e as outras "estavam diferentes". Medido, em repouso elas
diferiam em `background-color` — o estado — e em `background-clip`: o
`secondary` pinta até a borda e o `tertiary` só até dentro dela, então o
quadrado da atual saía com 24px e o realce das outras com 22. O
`PaginationLink` fixa `bg-clip-border` nos dois, e o `twMerge` tira o
`bg-clip-padding` da base. A asserção 8 de `pagination-ladder.test.ts` tranca.
Os extremos ficaram de fora dessa primeira passagem, e o realce de
"Anterior"/"Próxima" continuava 1px menor de cada lado que o das páginas —
mesmo `tertiary`, outro recorte. Hoje `PaginationEdge` fixa o mesmo
`bg-clip-border`, e a asserção 8 cobre os dois.

**A última linha do painel não soma fio com a moldura.** Apontado pelo dono no
painel sem rodapé: o divisor da última linha encostava na borda de baixo do
`Card`, dois fios empilhados. O `TableBody` já tirava esse fio em
`variant="outline"`, mas o painel usa tabela `plain` dentro de um `Card` com
borda — a moldura que fecha embaixo era outra peça. O `TablePanel` tira o fio
da última linha **menos quando o corpo rola na vertical**
(`[data-fade=bottom][data-scroll-fade=on]`), onde ela passa por trás do rodapé
como uma linha qualquer. A condição lê `data-fade` porque, no modo `sides`,
`data-scroll-fade` responde à rolagem **horizontal**. A asserção 23 tranca.

**E depois a condição passou a ser o rodapé, e não a rolagem.** Apontado pelo
dono no painel "Padrão": ele tem rodapé e não rola, e a regra tirava o fio da
última linha — ela colava no rodapé sem nada entre os dois. Hoje o fio sai
**só quando o painel não tem rodapé**
(`:not(:has(>[data-slot=table-panel-footer]))`). A rolagem deixou de importar:
com rodapé o fio separa as linhas dele de qualquer jeito, e sem rodapé a
última linha encosta na moldura também quando o corpo rola até o fim.

**E o rodapé passou a medir uma linha.** Apontado pelo dono: ele saía 48px sob
linhas de 44 (12 + 20 + 12 no `lg`, que é o degrau do painel) — o recuo das
tiras (12) mais o botão `xs` da paginação (24). Com `py-2.5` fecha em 44, e a
faixa que o rodapé publica para a dissolução acompanha sozinha, porque é medida.
No toque o botão cresce a 44 e o rodapé junto; as linhas não. A asserção 24
tranca.

### Rodada 74 — o corpo rolável dissolve no rodapé do painel

O dono selecionou o rodapé do painel rolável e pediu um fundo "fade", como o do
Command. A leitura mudou o que isso quer dizer: **o rodapé do Command não tem
fundo** — `CommandFooter` é "fade, e não vidro", e quem some é a lista. A
decisão foi a mesma: as linhas dissolvem sob o rodapé, só onde há rolagem, e o
rodapé continua sem pintura.

**O precedente certo é o `DialogBody`**, e não o Command: corpo rolável
dissolvendo para um rodapé parado, com `scroll-fade-y`, piso zero e **sem
borrão** — três tentativas de borrão ali viraram retângulo de tom (invariante 6
de `lib/scroll-fade-classes`).

**A trava era o eixo.** O viewport da `Table` já carrega `scroll-fade-x`, é um
gradiente por elemento, e o hook escreve as mesmas `--scroll-fade-start/end`
nos dois eixos. `Table fade="bottom"` **troca** a dissolução lateral pela de
baixo; a rolagem horizontal continua, com a barra. O padrão `sides` é o de
sempre, byte a byte. Só a ponta de baixo dissolve (`sides: "end"`): o cabeçalho
`sticky` mora dentro do mesmo viewport mascarado e sairia apagado.

Medido no painel rolável, nos dois temas: no topo da rolagem a dissolução liga
com `--scroll-fade-end` em 296 (zona limitada à rampa, que aqui é de **16px** e não os 44 da casa — o dono pediu o fade mais baixo, e 44 apagava quase uma linha inteira), a ponta de cima
nunca é escrita, o cabeçalho fica colado em 0 e nítido, e o rodapé segue
`transparent`; rolado até o fim, `--scroll-fade-end` vai a 0 e a última linha
fica nítida. Os outros quatro viewports da página seguem com `scroll-fade-x`.
A asserção 18 tranca um eixo só, a ponta única, o piso zero e a ausência de
borrão — quatro sabotagens, quatro reprovações. **Zero pixel em produção**: é
opt-in, e só a demo usa.

#### E o fade desceu para trás do rodapé, que é o que o Command faz

O dono pediu o fade mais baixo, duas vezes, e a segunda disse o alvo: "parecido
com o Command". Medido lá, a lista **passa por baixo do rodapé** — sangra os
36px da faixa (`-mb`/`pb`), o rodapé é `transparent`, e sob ele as linhas ficam
no piso da casa, 0,06. O "fundo fade" que se vê no Command é esse fantasma, e
não uma tinta. Aqui a rampa parava na borda de cima do rodapé, e abaixo dela
não havia nada.

A primeira descida só encurtou a zona de 44 para **28px** (e depois, a pedido, para **16px** — 28 ainda lia alto) — ela encosta no
rodapé e 44 apagava quase uma linha inteira (~45px no `lg`). A segunda copiou
a geometria: `TablePanelFooter` mede a própria altura com um `ResizeObserver` e
a publica no painel (`--table-panel-foot-h`), e o viewport em `fade="bottom"` a
usa como faixa de baixo e sangra por baixo dela. **O piso voltou a 0,06** — o
zero era a razão do `DialogBody`, onde o texto era recortado na borda do corpo;
aqui não há borda a recortar, porque o conteúdo continua sob o rodapé.

**Medida, e não cravada**, porque o rodapé empilha no telefone e cresce no
toque: uma faixa errada deixaria linha nítida sob o texto ou vão vazio. Medido
no painel: rodapé de **48px**, viewport sangrando **48** por baixo dele, o
rodapé `relative` pintando por cima e o clique em "Próxima" chegando ao rodapé
(`elementFromPoint`); no fim da rolagem a última linha termina em 903 com o
rodapé começando em 904. Fora de um `TablePanel` a faixa vale zero e nada
sangra. A asserção 19 tranca a medida, a limpeza e o `relative` — três
sabotagens, três reprovações.

O custo fica dito: a roda do mouse sobre o rodapé rola a página, e não a
tabela — o rodapé é irmão do viewport, não filho.

### Rodada 75 — a barra do painel sai da moldura

O dono selecionou o "3 transações" e pediu a parte "levemente destacada, acima
da tabela e sem bordas" — e, ao escolher, disse o escopo: **a parte superior
inteira, com as ações de excluir, fora da moldura**. Medido antes: a barra era
transparente, sem fio, 12px cinza, 40px de altura, **dentro** da borda de 1px e
raio 14 do painel.

**O painel separa a barra sozinho.** `TablePanel` divide os filhos pelo tipo:
as `TablePanelToolbar` saem acima da moldura, o resto fica dentro, na ordem em
que vieram. Um envelope (`table-panel-group`, `gap` de `--space-inline`) segura
os dois; `className` vai a ele, e o resto das props segue na moldura, que
mantém `data-slot="table-panel"`, o `TableSizeContext` e a altura que o rodapé
publica. Barra dentro de um fragmento não é reconhecida e fica dentro — dito no
componente.

**E a separação por tipo foi invertida, porque quebrava no HMR.** Apontado
pelo dono: a barra "voltou para dentro da moldura". Medido: as quatro barras do
catálogo estavam dentro, e numa navegação limpa saíam fora, no servidor e no
cliente. A cada edição de `table-panel.tsx` o Fast Refresh troca a função
`TablePanelToolbar`; a página segue criando o elemento com a antiga e o
`TablePanel` novo compara com a nova — `c.type === TablePanelToolbar` deixa de
bater, calado. É o mecanismo que o `DropdownMenu` já tinha rejeitado para
`header`/`footer`. Hoje a barra é **prop** (`<TablePanel toolbar={…}>`),
renderizada antes da moldura: não é procurada, então não depende de identidade,
de fragmento nem de embrulho. Duas guardas impedem a volta: a
`TablePanelToolbar` passada como **filho** avisa no console (um contexto diz
que ela está dentro da moldura), e a asserção 26 reprova qualquer peça de
`ui/` que compare `.type` com um componente — só `React.Fragment` é estável. A
25 renderiza o painel de verdade (`react-dom/server`) e prova as três pontas.

**O envelope declara as variáveis de tira**, e isso é carga estrutural:
`--card-strip-px` e `--card-strip-py` moram no `Card`, e fora dele o recuo da
barra cairia a zero calado.

**O destaque é o tom do cabeçalho da tabela**, `bg-muted/50`, com `rounded-lg`
e sem borda visível. Fora do `Card` ela deixa de ser **tira** — a regra de que
tiras não pintam é sobre faixas de uma superfície — e vira uma barra própria;
a regra J não acende, porque há tinta e nenhum fio. **O fio transparente nas
laterais é carga estrutural**: a moldura tem 1px de borda, e sem ele o texto da
barra cairia 1px à esquerda da coluna das células. Só nas laterais, para a
altura seguir em 40 — com fio em volta ela iria a 42.

Medido nos quatro painéis: barra **fora** da moldura com **8px** de vão, 40 de
altura (48 com o botão "Excluir" da seleção), recuo 12/16, cantos de 10px,
borda transparente, e o texto **na mesma coluna** do cabeçalho da tabela —
desalinho 0. O fundo composto dá **1,075 no escuro** (30 sobre 23) e **1,09 no
claro** (245 sobre 255): "levemente", como pedido. O rodapé segue publicando
48px e a tabela rolável segue sangrando por baixo dele. A asserção 20 tranca a
separação, a ordem, as variáveis e a ausência de fio — três sabotagens, três
reprovações. **Zero pixel em produção**: `TablePanel` não tem consumidor de
produto.

**E o fundo saiu logo depois**, por pedido do dono: a barra ficou sem tinta,
e com ela saiu o `rounded-lg`, que sem fundo nem borda não desenhava nada. O
fio transparente das laterais fica, porque é ele que alinha o texto com a
coluna das células. A asserção 20 passou a proibir `bg-` na barra.

**E o recuo vertical saiu.** Fora da moldura quem separa a barra da tabela é o
vão de 8px do envelope, e os 12px de cima e de baixo sobravam. A barra ficou
`py-0` com `min-h-6` — a altura de um botão `xs` —, e com isso a contagem e a
seleção com "Excluir" passaram a medir o mesmo: antes a barra ia de 40 a 48 ao
marcar uma linha. O recuo horizontal ficou, porque é o que alinha o texto com
as células. **Depois o "Excluir" passou a `sm`**, e a altura mínima acompanhou
para `min-h-7` (28px): a regra é "a altura do botão de ação", e com o botão
maior a barra voltaria a pular 4px ao marcar uma linha.

### Rodada 76 — o cabeçalho fixo vira vidro, e a máscara desce para as linhas

Pedido: com a tabela rolando, o corpo passa **por trás** do cabeçalho de
rótulos, com o borrão do cabeçalho do catálogo. **Isto inverte a rodada 73**,
que fez o `sticky` opaco "para as linhas não passarem por baixo".

**O primeiro obstáculo era a própria dissolução, e só a medição o mostrou.**
Testado com estilo inline, a 1:1:

| Teste | Resultado |
| --- | --- |
| `blur(24px)` no `<thead>`, com a máscara do viewport | não borra — "Mercado" nítido atrás dos rótulos |
| o mesmo em cada `<th>` | não borra |
| `<div>` fixa, irmã da `<table>`, com a máscara | não borra |
| `<thead>` com a máscara do viewport desligada | **borra** |
| máscara no `<tbody>` + `<thead>` com borrão | **borra, e a linha sob o rodapé segue dissolvendo** |

Neste Chromium, **qualquer `backdrop-filter` dentro de um elemento com
`mask-image` deixa de borrar**, e `fade="bottom"` mascarava o próprio viewport.
As peças de tabela não eram o problema.

**A saída foi descer a máscara para o `<tbody>`**, que contém as linhas e não
contém o cabeçalho. Entrou a `@utility scroll-fade-y-content`: ela vai no
rolável, **não o mascara**, e só publica a rampa em
`--scroll-fade-content-mask`, que o `TableBody` veste (`scrollFadeContentClassName`).
As `var()` resolvem no rolável e o `100%` no conteúdo; com a sangria sob o
rodapé, o topo dele fica em `100% − end` no referencial do `<tbody>`. É a mesma
curva, com o mesmo piso e um gradiente só. A conta supõe que o corpo é a última
caixa da tabela, e isso está escrito no `TableBody`.

**A tinta é a do cabeçalho parado, e deixa passar 20%.** Sob `fade="bottom"`
o `sticky` veste `glass-surface` com uma tinta translúcida só sob
`supports-backdrop-filter:`. A primeira versão era `bg-muted/50`, e o contraste
a reprovou: com o texto claro de uma linha cobrindo 35% da área atrás do
rótulo, os 12px de `--muted-foreground` caíam a **3,64 no escuro e 3,67 no
claro**. Varridos os alfas, **0,8 é o primeiro que passa nos dois: 5,23 e
4,72** (0,6, o do cabeçalho do catálogo, dá 4,12 e 4,00). A cor é `muted` a
62,5% sobre o card com alfa 80%, que sobre o card compõe exatamente a mistura
opaca da rodada 73 — em repouso nada muda de cor. O `plain` usa `bg-card/80`. A base e o
`reduced-transparency:` seguem opacos. **Com `fade="sides"` o cabeçalho fixo
continua opaco**: ali o viewport se mascara e mataria o borrão, e uma tinta de
50% sem borrão mostraria as linhas nítidas — o defeito da 73.

As asserções 13, 14 e 18 foram reescritas, e a 27 tranca que o rolável de um
cabeçalho de vidro não se mascara. **Não verificado: Safari/WebKit.** O borrão
num `<thead>` fixo e a máscara num `<tbody>` foram medidos só no Chromium; se o
WebKit anunciar o filtro sem borrar ali, a tinta de 50% mostraria as linhas
nítidas.

**Dois defeitos depois, apontados pelo dono.** *As linhas passavam por cima do
fade do rodapé*: eram os **fios**, e não o texto. A rampa no `<tbody>` estava no
lugar certo — medida, começando 18px acima do topo do rodapé e chegando ao piso
nele —, mas com `border-collapse` quem pinta a borda da `<tr>` é a `<table>`, e a
máscara do `<tbody>` não a alcança: o fio atravessava o rodapé com força cheia.
Em `fade="bottom"` ele virou **sombra interna do `<td>`**, pintada com a célula
e mascarada junto — o truque do fio do cabeçalho fixo. *As bordas do borrão
vazavam da moldura*: borrão e máscara viram camadas próprias, e no Chrome
acelerado elas escapam do recorte arredondado de um `overflow-hidden`. As duas
molduras (`TablePanel` e a `outline` da `Table`) ganharam `clip-path` no raio
que já desenham. **Honesto sobre o segundo**: com o cabeçalho pintado de
vermelho, o vazamento não apareceu no painel do navegador daqui, com ou sem o
conserto — o `clip-path` é a garantia para o motor acelerado, e a confirmação
é da tela do dono.

**E a máscara no `<tbody>` caiu, por medição.** O dono achou o fade do rodapé
"estranho", e ele estava: um `<tbody>` com máscara **100% transparente**
continuava mostrando todas as linhas. Neste Chromium a máscara de uma seção de
tabela não é redesenhada quando muda — ela ficava presa ao primeiro desenho, que
por acaso parecia certo na verificação, e não acompanhava a rolagem. Mascarar
peça interna de tabela não é confiável, e a máscara saiu dali.

**A borda de baixo virou véu, e é a exceção pintada da dissolução.** A área
que rola não se mascara (o borrão do cabeçalho exige), e um nó irmão —
`@utility scroll-fade-veil-y` — pinta a cor da superfície por cima das linhas e
por baixo do rodapé, com a mesma curva e o mesmo piso da rampa. Sobre
superfície lisa, véu de 94% e máscara de 6% dão **a mesma cor**, byte a byte;
o que a paleta de comandos rejeitou foi pintar a cor **errada**, e aqui ela é
variável (`--scroll-fade-surface`, o card por padrão). O véu lê a rolagem pela
casca (`useScrollFade` com `shell`), e some quando não há o que rolar. Com ele
cobrindo também os fios, a volta do fio como sombra da célula saiu — a linha
voltou a 45px —, e a `scroll-fade-y-content` foi apagada.

**E a rampa do véu deixou de terminar no topo do rodapé.** O dono achou que o
fade "marcava muito", e aceitou o conteúdo mais visível no começo do rodapé em
troca de uma transição sem marca. Eram 16px com uma curva que arrancava forte e
assentava no piso exatamente na borda da faixa — uma linha. Hoje ela começa na
mesma zona acima do rodapé e só chega ao piso a **3/4 da faixa** (~49px no
painel), numa curva *smootherstep*, de derivada zero nas duas pontas. Depois,
a pedido, a zona acima do rodapé subiu de 16 para **32px**
(`--scroll-fade-h` na casca) — ~65px de rampa no total.

**E os cantos do véu passaram a herdar o raio.** Apontado pelo dono: o fade do
rodapé "sobre a borda de baixo da moldura". Aqui ele não se reproduziu — num
A/B a 800px, com o card em meio pixel como no desktop, a borda sai igual com e
sem o véu. Mas o véu é um retângulo encostado nos dois cantos arredondados, e
só o recorte do `overflow` o impede de pintar sobre o arco da borda; o
`clip-path` da moldura recorta pelo raio **de fora**, e não protege o arco. É o
defeito da rodada 46c, e o conserto é o dela, com uma diferença medida: lá a
camada herdava o raio, e aqui `inherit` voltou **0px** — entre a moldura e o
véu há o embrulho do gêmeo de desktop (`hidden md:block`), sem raio. O raio
chega por variável: a moldura publica o de dentro dela
(`--scroll-fade-veil-r`, o de fora menos a borda) e o véu o lê nos dois cantos
de baixo. A asserção 28 tranca.

**E o que o dono via era outra coisa: o conteúdo encostando na borda.** A
segunda captura mostrou a causa — no piso de 6% a linha seguinte ainda aparece
atrás do rodapé e **é cortada pela borda de baixo**, e conteúdo que continua
até o último pixel lê como moldura sem borda. O véu passou a fechar opaco nos
10px de baixo (o recuo do próprio rodapé): o fantasma segue atrás do texto, e a
borda assenta sobre superfície limpa. A asserção 27 tranca o fecho — e a
primeira sabotagem dela **passou**, porque o meu `replace` não achou o trecho
(havia um comentário no meio) e eu não o tinha assertado. Refeita com `assert`,
ela reprova.

### Rodada 77 — a sexta gaveta sai, e cada decisão volta para o dono

O catálogo tinha **Padrões**: sete páginas que "não são componente", e a régua
do `registry.ts` as descrevia assim mesmo — *decisões que atravessam telas*.
Medido, quase todo o conteúdo delas **já estava** nas páginas de camada, e as
cópias divergiam: as notas da rampa em `graficos` e em `cores`, os três vazios
em `vazio-carregando` e em `empty-state`, o "hook que pisca" em `mobile-toque`
e em `table`. A categoria não guardava decisão sem dono; guardava a segunda
cópia dela.

| Era | Foi para | Camada |
| --- | --- | --- |
| `dinheiro` | `money-display` — as funções de `lib/formatters`, a regra do sinal | Átomo |
| `datas` | `typography` — os sete formatos, o fuso, o travessão | Fundação |
| `chips-status` | `badge` — e o **código** também, abaixo | Átomo |
| `formularios` | `form` — as regras do Enter, lidas da fonte | Organismo |
| `graficos` | `chart` (a cor da série, as regras) e `cores` (a rampa medida) | Organismo + Fundação |
| `vazio-carregando` | `empty-state` (os quatro estados) e `announcement-bar` (o offline) | Molécula |
| `mobile-toque` | fica, como **Fundação** "Toque e área segura" | Fundação |

`mobile-toque` não se dissolveu porque o conteúdo dele **é** Fundação: os
`--mobile-*` da área segura e a política do `@custom-variant` moram em
`globals.css`. O slug ficou — quatro comentários de `ui/` apontam para ele.

**As classes de chip foram morar no `Badge`, e não só a página.**
`lib/tag-chip-classes.ts` e as tintas `soft` do `Badge` eram duas cópias das
mesmas sete strings, e já divergiam: o `Badge` não tinha o par `dark:hover:`.
Hoje as constantes são exportadas de `badge.tsx` com os mesmos nomes, o `cva`
as lê, e os 20 importadores mudaram só o caminho — zero pixel nas telas. A
única mudança visível é a do próprio `Badge`: no tema escuro o hover dele passa
a `/60`, como o dos chips sempre foi. Sem alias para o arquivo antigo, pelo
precedente do `EdgePanel`.

**A asserção 6 do `taxonomy.test.ts` perdeu a exceção.** Ela pulava Padrões
para `form.tsx`, `chart.tsx` e `empty-state.tsx` terem duas páginas; hoje vale
para todo arquivo de `ui/`. E o tipo `Category` sem a sexta chave é o que
impede a volta: o `tsc` acusa quem a escrever.

As URLs antigas dão 404, sem redirect — o precedente de `/tipografia`: rota de
desenvolvimento e zero links internos. Ficam de fora o `text-[10px]` da pílula
de linha (`transactionRowChipShell`), que não é degrau do `Badge` e mudaria
pixel em cinco telas, e os apelidos `tagChipViolet`/`tagChipSky`.

### Rodada 78 — o primário vira tecla

Pedido: o `Button variant="primary"` acompanhar o resto do design system, na
direção **elevado e elegante**, com uma referência de botão tátil — corpo
chapado, contorno mais escuro, plinto grosso na base e um fio de luz fino no
topo. Medido antes, ele era o peso mais atrasado da casa:

| Defeito | Número |
| --- | --- |
| hover por alfa (`bg-primary/90`) trocava de direção por tema | clareava no claro (rótulo 7,31 → **5,81**), escurecia no escuro |
| a força do hover dependia da superfície embaixo | 1,113 sobre `muted` contra 1,158 sobre a página, no escuro |
| inerte ao toque | estava em `PENDENTES` |
| sem `aria-expanded:` | os outros três pesos têm |
| `transition-all` com a curva do navegador | `--tw-ease` vazio, o defeito das rodadas 62/63 |
| `[a]:hover:bg-primary/90` | a mesma classe duas vezes |
| enviando lia como desabilitado | o `FormSubmit` desabilita, e o primário ia a `opacity-50` |

**O realce virou token, e escurece nos dois temas.** `--primary-hover` é
opaco: rótulo em **9,01** no claro e **6,21** no escuro, passo contra a base
1,23 e 1,19. É a regra do `--secondary-hover` — puxar na direção do contato —,
e o contato do primário é o rótulo branco nos dois temas; clarear no escuro
gastaria a margem de 0,72. O custo fica dito: no escuro o hover dá **2,76**
contra `--card`, e quem identifica o controle nesse estado é o rótulo.

**A tecla.** `--primary-edge` é o contorno e o plinto (1px de sombra interna
na base, somado ao 1px de borda); `--primary-highlight` é o fio de luz de 1px
no topo, por dentro. Medido: aresta contra corpo **1,53** no claro e **1,86**
no escuro, fio de luz contra corpo 1,53 e 1,51. O plinto é interno, então a
caixa mantém o degrau — 24/28/32/36/40, medidos — e segue alinhada ao `Input`.
Ao apertar, o plinto, a luz e a sombra de fora somem e entra uma sombra interna
no topo; enviando, a tecla fica afundada com **opacidade 1**.

**Não é vidro, e a diferença é a direção da luz.** As quatro reprovações deste
botão (a lápide em `lib/glass-classes.ts`) acenderam o corpo ou a borda, e a
leitura foi "botão mais claro". Aqui a elevação é **escura** — aresta e plinto
abaixo do corpo, sombra preta —, e a única luz é 1px acima da faixa do texto.
Visto ampliado 3× nos dois temas, ele lê como tecla, e a chave de desligar a luz
(`--primary-highlight: transparent`) não foi usada.

**A armadilha que custou uma medição: `inset-shadow-(--x)` prefixa `inset`.**
Com o `inset` que o token já traz, o emitido virou `inset inset …`, inválido —
e uma camada inválida derruba a cadeia inteira de `box-shadow`: a sombra de
fora e **o anel de foco** junto. Medido: `box-shadow: none`, com a classe no
elemento e a regra na folha. A saída é um token só (`--primary-shadow-value`,
as duas internas mais a `--shadow-xs-value`) lido por `shadow-(…)`, que não
prefixa nada. Depois, com Tab de verdade: anel de 3px em `--ring` compondo com
as três sombras da tecla.

**E a leitura do anel no mesmo passo do Tab mentiu de novo.** A primeira veio
com a borda ainda na cor da aresta e a cadeia a meio caminho — a transição de
150ms estava rodando. Meio segundo depois, certa. É a lição de sempre: valor em
transição não é valor final.

**Enviando precisou de dois variantes juntos.** `aria-busy:` e `disabled:`
empatam em especificidade, e quem decidiria seria a ordem de emissão; os estados
de envio vão sob `aria-busy:disabled:`, que vence.

**A transição da base passou a ser enumerada**, para todos os pesos:
`[color,background-color,border-color,box-shadow,opacity,translate]` com
`--duration-fast` e `--ease-out`. O carrossel passa a própria lista, e o
`twMerge` a mantém.

**As telas.** Os 5 `hover:bg-primary/90` dos formulários de autenticação
saíram, e não era cosmético: o `twMerge` deixaria o `className` vencer, e esses
botões seguiriam com o hover de alfa. **13** `className="h-10 w-full"` viraram
`size="xl" className="w-full"`; os **4** que já traziam `size="sm"` ficaram,
porque trocar mudaria o corpo do rótulo. `not-found-shell.tsx` trocou
`buttonVariants()` num `<Link>` por `<Button asChild>`.

**O `ButtonGroup` desliga o divisor no primário.** O filete `bg-current/20`
existe para marcar a emenda de botões cheios sem borda visível; sobre o
primário ele saía branco, por cima do fio escuro que o contorno em
`--primary-edge` já desenha com a sobreposição de 1px — dois traços para a
mesma emenda. `[&>[data-variant=primary]]:before:hidden` o tira dali, e a mesma
linha vale para o `outline`, cuja borda também é a emenda. O `secondary`, que
não tem borda, também perdeu o filete — recuado nas pontas, ele lia como risco
no meio de um bloco — e ganhou uma emenda de cima a baixo como a do primário:
os botões deixam de se sobrepor e ficam a 1px um do outro
(`[&>[data-variant=secondary]:not(:first-child)]:ml-px`, que vence o `-ml-px`
por especificidade). O vão é **transparente**, então mostra a superfície de trás
sem o grupo precisar saber qual é.

**Uma correção ao plano.** Ele contava o dia selecionado do `Calendar` entre os
consumidores de `hover:bg-primary/90`; não era — as duas ocorrências que a
varredura achou em `ui/` eram as duas classes da própria linha do `Button`.

**O teste.**
[`button-primary.test.ts`](../../src/components/ui/button-primary.test.ts) tem 8
asserções — o realce sem alfa, zero cor literal, a tecla num token e nunca por
`inset-shadow-`, o toque, o envio, a transição, os tokens nos dois temas com
**aresta < hover < corpo** (a elevação é escura, por construção) e nenhuma tela
remendando o hover. Oito sabotagens, oito reprovações. `primary` saiu de
`PENDENTES` em `button-touch-response.test.ts`.

**O que ficou de fora.** `secondary`, `outline` e `destructive` não viraram
tecla, embora a referência mostre os três assim; o `destructive` é véu no tema
claro e pede medição própria. O toque **mantido** não foi amostrado por quadro —
o painel do navegador não segura o clique —, e o que o prova são as regras
`:active` e `[aria-busy]:disabled` lidas no CSS emitido. O desvio de centragem
do rótulo é de **0,5px** em todos os degraus (a borda do topo contra borda mais
plinto na base), e ficou sem compensação.

### Rodada 79 — o alternador de tema entra no design system

O `AppThemeToggle` já era o controle certo — `Switch` do Radix com as duas
faces, gate de montagem com `Skeleton`, deslize adiado dois quadros por causa do
`disableTransitionOnChange` —, mas morava em `src/components/settings/`, fora do
registry e sem página. O catálogo o usava no próprio topo e o citava em quatro
notas sem nunca documentá-lo.

Ele foi **promovido sem mudar um pixel**: `src/components/ui/theme-toggle.tsx`,
export `ThemeToggle`, `data-slot="theme-toggle"`. Sem alias — são três
consumidores (`user-menu`, `mobile-account-menu`, `ds-shell`), migrados na mesma
mudança. Camada **Átomo**: um controle, com trilho, polegar e faces como anatomia
do `Switch`, e o único import de `ui/` é o `Skeleton`. A exceção do auditor para
os dois conjuntos de ícone passou a nomear o caminho inteiro
(`components/ui/theme-toggle`), para a página de docs não herdá-la.

`AppAppearanceSettings` saiu junto: um segundo controle de tema, com zero
importadores, que o backlog já mandava remover. Fica **um** alternador no app.

### Rodada 80 — a barra do topo vira peça: `TopBar`

O design system tinha o topo **de dentro** da tela (`PageHeader`) e o de cada
superfície (`DialogHeader`, `CardHeader`…), e não tinha a barra do topo da
**janela**. Mapeado o repositório inteiro, ela existia escrita à mão **duas
vezes**, e as duas já divergiam:

| Onde | Desktop | Telefone | Altura | Superfície |
| --- | --- | --- | --- | --- |
| `AppHeader` (`layout/app-header.tsx`) | `md:sticky md:z-10` (cru) | `fixed z-(--z-header)` + área segura | 64 + fio · 48 recolhida · 56 + fio | opaca; vidro **à mão** só rolado e só no desktop |
| `DsTopBar` (`designsystem/ds-shell.tsx`) | `sticky z-(--z-sticky)` | a mesma | 56 com o fio dentro | `barSurfaceClassName` |

Mais nada no app é barra de topo: as quatro telas de entrada, o 404, o erro e
o bootstrap mostram a marca acima do conteúdo, e a ilha do telefone é a barra
de **baixo**. O `AppHeader` divergia em quatro pontos, todos medidos: borrão de
8px sem `saturate` e sem guarda de transparência reduzida (a única superfície de
vidro do repositório fora da receita); `md:z-10` cru; o fio **por fora** da
altura, então o telefone media 57 + área segura contra os 56 + área segura de
`--mobile-header-offset` — o conteúdo começava 1px debaixo da barra; e um
`MobileHeaderBack` que era a segunda cópia do `PageHeaderBack`.

**O nome é `TopBar`**, decisão do dono: `Header` sozinho disputaria a leitura
com `PageHeader`, `DialogHeader`, `CardHeader` e `HoverCardHeader`, que são
outra coisa. É **Template** — dispõe onde o voltar, o título e as ações vão, e
não mostra conteúdo nenhum por si.

**Quatro eixos, e cada um tem as duas barras como contagem.** `size` (`sm` 48 ·
`md` 56 · **`sm` é o padrão: 48 no telefone e no desktop**, um tamanho só com a
`Sidebar` aberta ou recolhida — decisão do dono, depois de o telefone passar
por 56 e por 44; o degrau `auto` saiu, porque passaria a ser a mesma string do
`sm`, e o `lg` 64 saiu por decisão do dono, sem consumidor);
`position` (`static` · **`sticky`** · `fixed` · `auto`, que é `fixed` no
telefone e `sticky` acima, a forma do app); `surface` (**`solid`** · `glass` ·
`scroll`, que é `solid` até o conteúdo passar por baixo e `glass` depois);
`gutter` (**`bar`** · `none`, para quem traz o próprio `Container`). As peças
são `TopBarStart`, `TopBarTitle` (um `<h1>` truncado, com `asChild`),
`TopBarContent` e `TopBarActions`. **Não há voltar novo**: é o
`PageHeaderBack`, que já tinha a medida do app.

**A altura é do `<header>`, com o fio e a área segura dentro.** O degrau
publica `--top-bar-h`, `fixed` publica `--top-bar-safe`, e a caixa é a soma em
`border-box` — o total no telefone **é** `--mobile-header-offset`, por
construção, e a asserção 4 do teste compara o degrau `md` com o token.

**`sticky` fica em `--z-sticky`, e não em `--z-header`.** A faixa de sem
conexão é `fixed md:top-0` em `--z-banner` (30) e cobre a barra do desktop de
propósito; a 40 a barra a esconderia. `fixed` é o telefone, onde a faixa desce
para `top-(--mobile-header-offset)`, e ali a barra vai a 40.

**`scroll` acende pelo primeiro ancestral que rola, e não pela janela.** É ele
que faz o conteúdo passar por baixo de uma barra `sticky`. No app não há
nenhum, e a resposta continua sendo a janela; dentro de uma região rolável —
e é o caso de toda moldura do catálogo, cujo `<body>` é `overflow: hidden` — é a
região. Escutar só a janela deixaria o modo indemonstrável. A escuta é em
**captura** na janela, e o alvo é decidido a cada evento — a janela ou um
ancestral da barra; uma lista rolando dentro da tela não acende nada. **A
primeira versão resolvia o ancestral uma vez, na montagem, e falhou medida**:
dentro da moldura o CSS chega depois do efeito, o `overflow` ainda lia
`visible`, e a barra ficava escutando a janela para sempre — `data-scrolled`
parado em `false` com 184px rolados. A escolha é entre
duas strings inteiras do `cva` (`rolou ? "glass" : "solid"`), nunca uma classe
montada.

**As duas barras migraram.** O `DsTopBar` sai idêntico — 56, `z-20`,
`blur(24px) saturate(1.5)`, medidos antes e depois. O `AppHeader` vira
`<TopBar position="auto" surface="scroll">` com as duas árvores em
`contents md:hidden` / `hidden md:contents`, para as peças continuarem filhas
diretas da linha. **Isto muda pixel em produção**, e é dito: o vidro rolado
passa de 8px para 24px com `saturate(1.5)` e ganha o guarda; **o telefone
também acende ao rolar** (era sempre opaco); o desktop vai de `z-10` a `z-20`;
no desktop a barra fica em **48 fixo** (era 64, e 48 só com a lateral
recolhida); no telefone ela vai de 56 + fio para **48**, o mesmo do desktop, com o fio e a área segura dentro — e
`--mobile-header-offset` (`globals.css`) e o recuo do toast no telefone
(`sonner.tsx`, 48 + 16) descem junto; o título passa a `text-sm font-medium`,
a receita da barra de exemplo da página da Sidebar, que agora é o `TopBar`; a transição do fundo passa de
`duration-200` com a curva do navegador para a da barra lateral; e a seta de
voltar do telefone alinha à calha de 16px (`-ms-2.5` no lugar de `-ml-1`).

**O sino de notificações desceu para `icon-md` (32) e virou outline**, por
decisão do dono: ele era `icon-lg` (36), fora do padrão da escada, e sólido ao
lado do sol outline do `ThemeToggle`. Como não existe `16/outline`, é o
`24/outline` a 16px — contra a regra G, e por isso a segunda exceção nomeada em
`HEROICON_SET_EXCEPTIONS`, junto com a página do `TopBar`, que o reproduz. O
sino fica 4px menor na barra do app, nos dois ramos. **E o divisor vertical
entre o gatilho da barra lateral e o título saiu** — no app e na página —, para
a barra ficar igual à de exemplo da página da Sidebar, que nunca o teve.

**Todo botão da barra fica no degrau padrão, `md` (32)** — decisão do dono.
Isso tocou quem mora nela: o `SidebarTrigger` (padrão de `icon-sm` para
`icon-md`, e o único lugar dele é a barra), o `PageHeaderBack` (`icon-md` no `TopBar` e
no `PageHeader`, sem prop de tamanho, com recuo `-ms-2` e alvo de toque
`-inset-2` = 46), o seletor de carteira do telefone (`icon-xl` com `h-9`
cravado para `icon-md`), o filtro de faturas e o `MonthNav` que as páginas
publicam como `dateFilter` (prop `inBar`: 32 em qualquer largura, onde o
`dense` dá 40 no telefone para casar com o trilho segmentado das barras de
filtro). O gatilho da lateral e o voltar passaram a `-ml-2`/`-ms-2`, para o
glifo alinhar com a calha de 16px.

**O borrão só respeita o raio da própria barra.** Nas molduras do catálogo a
barra de vidro rolada saía com os cantos de cima quadrados. O primeiro conserto
— `clip-path` no raio da moldura — não resolveu, e a medição explicou: o
`backdrop-filter` ignora o recorte de **todo** ancestral no Chromium
(`overflow-hidden`, `clip-path` fora e dentro do iframe, máscara, `contain:
paint`, os quatro testados), e só respeita o `border-radius` do elemento que
borra. Hoje o `TopBar` arredonda os cantos de cima por `--top-bar-r` (0 por
padrão), e a moldura publica o raio dela na tela. O `clip-path` saiu. É a
mesma família da rodada 76, que só não apareceu naquele painel.

**O gatilho da lateral tem ícone próprio.** O `SidebarTrigger` trocou o
`Bars3Icon` por um desenho do dono — um painel com a coluna da esquerda
separada —, em [`components/icons/sidebar-toggle-icon.tsx`](../../src/components/icons/sidebar-toggle-icon.tsx),
na grade do `16/solid` e com `currentColor`. É o mesmo ícone para abrir e para
fechar (passou antes por duas setas do Heroicons, uma por estado); quem diz o
que o clique faz é o `aria-label` — "Recolher barra lateral" / "Abrir barra
lateral", e no telefone quem decide é o painel (`openMobile`). **É a primeira
exceção à regra G que não é marca nem movimento**, e ela está nomeada em
`DRAWN_SVG_FILES`, restrita a esse arquivo.

`sidebar-ladder` #17 e #24 e `glass` #27 passaram a ler `top-bar.tsx`, e a #27
agora exige que as duas cascas vistam o `TopBar` sem escrever borrão.
[`top-bar-ladder.test.ts`](../../src/components/ui/top-bar-ladder.test.ts) tranca
os degraus, o `auto`, a altura contra o token, as camadas, o vidro, o fio e a
curva.

### Rodada 81 — o vidro vai para o polegar do alternador

Pedido: uma versão de vidro do `ThemeToggle`, igual à do `Tabs`. O encaixe já
estava escrito no cabeçalho do componente — ele e uma fileira `solid` são **a
mesma anatomia**, uma bandeja com um polegar que desliza —, e o polegar já
vestia as três classes do `tabs-indicator` (`bg-background`, `border-border/80`,
`shadow-xs`).

**A bandeja não entra, e o número é da rodada 59**: o `Menubar solid` já foi
medido a 60% e cai de rgb **38 para 27** sobre a página, deixando de ler como
bandeja. Quem veste é a peça que se move — e ela passa na régua que manteve
`Avatar` e `ColorTile` depois de o `Button` reprovar quatro vezes: **o polegar
não é clicável** (o clique é da raiz) e não carrega texto por cima.

**`glass-round`, porque a peça é redonda.** O aro linear põe o pico nos *cantos*
da caixa, e um círculo não os tem — medido no `Avatar`, 0% do perímetro via o
pico contra 14% com o cônico.

**O corpo não se move, e é construção e não sorte.** `--glass-tone` é
`--background` opaco, que é o que o ramo chapado pinta. Medido nos dois temas,
com os dois polegares lado a lado:

| | tom do vidro | fundo do chapado | caixa | borda |
| --- | --- | --- | --- | --- |
| escuro | `oklch(0.145 0 0)` | `oklch(0.145 0 0)` | 34×28 | 1px |
| claro | `oklch(0.985 0 0)` | `oklch(0.985 0 0)` | 34×28 | 1px |

Zero deslocamento: a armadilha nº 2 da régua (`border: 1px solid transparent`
encolhe o conteúdo em 2px) não morde porque a borda de 1px **já estava lá**. O
que entra são as camadas — 6 gradientes contra 0 no chapado —, e o aro sozinho é
que faz o material, como a rodada 44 mediu.

**O realce voltou a ter produtor, e quem publica é a raiz.** `--glass-sheen`
precisa **herdar** até o polegar, e é a mesma razão pela qual no `Tabs` quem
publica é a trilha e não o gatilho. São os quatro degraus de lá — medidos no
polegar, com ponteiro real: `oklch(1 0 0 / 7%)` no escuro e `oklch(0 0 0 / 5%)`
no claro. O par `active:` é obrigatório e não é simetria: `hover:` compila
dentro de `@media (hover: hover)` e não existe no dedo.

**O eixo entra sem neutralizador**, em dois ramos exclusivos — um
`bg-background` deixado na base morreria calado sob o shorthand `background`. O
arquivo entrou em `COM_MODO` no `glass.test.ts`, e as duas sabotagens reprovam:
um `dark:bg-transparent` no ramo de vidro e a tradução removida.

**O primeiro consumidor é o catálogo.** Por decisão do dono, os dois
alternadores do `ds-shell` — o do cabeçalho e o da folha de navegação —
passaram a `<ThemeToggle glass />`. Medido no cabeçalho: `data-glass`, tom
`oklch(0.145 0 0)` (o `--background`), 6 camadas de gradiente contra 0 no
chapado da página, e a mesma caixa de 34×28 com 1px de borda. **Em produção
nada muda**: `UserMenu` e `MobileAccountMenu` seguem chapados.

**O que não foi verificado:** o aro não foi visto **ampliado** — o recorte de
zoom não é suportado no painel do navegador deste ambiente. O que prova a
superfície é o computado (as 6 camadas, o tom e o realce acima) e as asserções.

### Rodada 82 — a barra de baixo vira peça: `BottomBar`

A barra do **topo** virou peça na rodada 80. A de **baixo** estava onde o
`AppHeader` estava antes dela, e pior: **seis arquivos** em
`src/components/layout/` — a casca, a aba, três funções de classe, o material e
o quadrado do FAB —, com os três silêncios que esta casa trata como sinal para
olhar: `ds:audit` reportando **um** achado no subsistema inteiro (a regra H não
enxerga dentro de `cn()` nem de função, e era ali que tudo morava), nenhuma
entrada no catálogo, e **zero testes**.

Hoje é [`BottomBar`](../../src/components/ui/bottom-bar.tsx), **Template**, e o
`MobileBottomNav` ficou só com a fiação — `useAuth`, `usePathname`, os quatro
estados do slot da conta —, como o `AppHeader` faz com o `TopBar`. Saíram
`mobile-nav-island.tsx`, `mobile-nav-tab.tsx`, `mobile-nav-tab-classes.ts` e
`mobile-fab-button-classes.ts`, **sem alias**.

#### As peças, e o que cada uma apagou

| Peça | O que ela apaga |
| --- | --- |
| `BottomBar` | o `<nav>` fixo, `pointer-events-none` — a faixa invisível de largura total não pode engolir o toque na base da tela |
| `BottomBarRow` | a linha que recebe os eventos |
| `BottomBarTabs` | a pílula de vidro **e** o `grid-cols-4` cravado no consumidor — as colunas agora derivam de `Children.toArray(children).length` |
| `BottomBarTab` | a aba e as três funções de classe |
| `BottomBarSlot` | o `<button>` cru do slot da conta (o único achado do auditor) |
| `bottomBarActionClassName` | a string de 56px com **seis `!important`** |

Eixos: `labels` (56 → 64, padrão desligado) e `shape` (`island`, um valor só,
de propósito: é ele que dá dono ao `--bottom-bar-margin`; `flush` entra no dia
em que houver caso).

#### O token de margem não tinha leitor

`--mobile-nav-island-margin: 1rem` estava declarado, documentado na Fundação
`mobile-toque` como "a folga entre a ilha e a borda", e **nenhum componente o
lia**: a ilha escrevia `mx-4` nos lados e `0.5rem` embaixo, literais. E a reserva
de conteúdo contava a margem **uma vez**, quando a barra tem folga em cima e
embaixo.

Os tokens viraram `--bottom-bar-margin` e `--bottom-bar-pad` (altura **+ 2×
margem** + área segura), e a **altura deixou de ser token**: ela é o degrau do
eixo `labels`, publicado em `--bottom-bar-h`, pela mecânica do `--top-bar-h`. Uma
altura que depende de eixo não pode morar em `globals.css` — seriam duas
declarações precisando concordar. Medido: margem **16 nos quatro lados**, contra
8 embaixo antes.

#### O FAB era um quadrado verde inerte

Os seis `!important` (`hover:!bg-primary`, `hover:!border-primary` e os pares
`dark:`) anulavam a tecla que o primário virou na rodada 78. A ação agora lê
`--bottom-bar-h` — **56 não é degrau do `Button`**, que termina em 40 — e não
declara cor nenhuma. Medido: aresta `oklch(0.36 0.09 166)`, plinto e fio de luz
de volta, e o cursor escurecendo até `--primary-hover` (rgb 0,108,72). O
`active:scale-95` saiu junto: a base já afunda, e dois afundamentos são um a
mais.

#### `motion` saiu, e era dependência inteira para um crossfade

Verificado em `src/`, `e2e/` e `scripts/`: **um** consumidor, os 220ms de troca
do slot da conta — arrastando `framer-motion` (3,2M) como transitiva. Hoje é a
receita do `Avatar` e do `Popover`: a `key` remonta o nó e `animate-in` roda na
entrada, com `animation-duration-*` (e não `duration-*`, que escreveria
`transition-duration` morto). **A troca é só de entrada, e é decisão**: sem
`AnimatePresence` o que sai teria de ficar na árvore um ciclo, e a troca acontece
em carregamento e login — não é gesto que alguém acompanha.

#### O vidro é o da folha, e não o da barra

A pílula **não** veste `barSurfaceClassName` (`--background` a 95/60): aquela
serve barra **rente** à borda. A ilha flutua com margem sobre a lista, e
`--mobile-glass-bg` (55/45) é calibrado para uma folha sobre a página — a
própria nota de `scroll-fade-material` o descreve assim ao rejeitá-lo para uma
faixa de borda. Trocar deixaria a pílula quase opaca e mataria o que justifica o
borrão.

**E o anel fica — o plano mandava tirar, e a medição reverteu.** O argumento era
"três separadores para a mesma emenda". Medido: `--mobile-glass-border` é
**branco** e dá **1,007** contra a pílula no tema claro — branco no branco, não
existe; ali quem desenha a aresta é o `ring-1 ring-border/20`. No escuro a conta
se inverte (borda 1,117, anel 1,042). É a física do `--secondary-hover`: um valor
único não serve os dois temas quando a direção que lê se inverte.

#### A pílula e o realce são `rounded-full`, e isso é concentricidade de graça

Com raio fixo seriam **28 por fora e 25 por dentro** (56 − 1 de borda − 2 de
recuo) — dois números que param de concordar no dia em que o recuo mudar. Com
`rounded-full` a conta é a própria definição da forma: medido 28/25 no padrão e
32/29 com `labels`, sem ninguém recalcular. A ação é **redonda** junto: ao lado
de uma pílula, um quadrado de cantos moles lê como a forma que não decidiu.

#### A aba ativa preenche, e isso não é a regra G ao contrário

`iconActive` troca o glifo pelo par sólido quando a aba é a página. É **prop e
não derivação**: a peça não tem como saber o sólido de um ícone qualquer, e
adivinhar por nome quebraria no build de produção, onde o nome da função é
mangled. O mapa mora em `solidIconFor`, em `config/mobile-navigation.ts`, e é
**chaveado pelo componente, não pela rota** — uma tabela por `href` seria uma
segunda lista de rotas para sair de sincronia, e keyed pelo ícone ela serve as
abas **e** o slot com uma consulta só (nove pares).

A regra G existe porque 24, 20 e 16 são **redesenhos** para tamanhos diferentes;
aqui a grade é 24 dos dois lados e muda só o preenchimento. O auditor concorda
por construção — ele compara o número do conjunto, não o traço —, e não houve
exceção nomeada. Medido: ativa ⇔ sólida em **12 de 12** abas.

#### O realce viaja

Cada item pintava o próprio fundo, e isso **teleporta**. Hoje é um marcador só,
com o mecanismo do `Tabs` e da `Sidebar floating`: a pílula publica a caixa do
item ativo em `--bottom-bar-marker-x/y/w/h`, e ele transiciona em
`--duration-base` com `--ease-out` — a curva de objeto que viaja num trilho.

**A tinta, e não o vidro do `Tabs`.** O precedente idêntico é a `Sidebar
floating`, marcador dentro de placa de vidro. E o número decidiu: o
`--glass-tone` do `Tabs` (`--background`) é rgb **10**, a pílula compõe em **16**
e o realce de hoje em **44** — vestir aquela receita inverteria o realce de claro
para escuro. **Sem esticão de lente**: o repositório tem zero vocabulário de mola,
e `scaleX` está rejeitado por escrito em três lugares.

Três coisas que a peça exigiu, e as três falhariam caladas:

- **`offsetLeft` direto, e não a cadeia da `Sidebar`**: lá o `<li>` é `relative` e
  vira o `offsetParent`; aqui a aba e o slot são filhos diretos da pílula.
  `:scope > [data-active]` cobre os dois com um seletor só.
- **Os itens não eram `relative`.** Elemento estático pinta antes de posicionado,
  e o marcador cobriria o ícone. Medido: `elementFromPoint` no centro do ativo
  devolve o ícone, nos dois temas. E **sem `-z-10`**, pela razão que a `Sidebar`
  registra.
- **Antes de medir, o próprio item pinta o realce**, no mesmo alfa, por contexto.
  Aqui ceder **não** precisa apagar: na `Sidebar` a base do `cva` pintava o ativo
  incondicionalmente; aqui a string é inteira da peça.

Medido: trajeto de 2 a 140px com **oito amostras intermediárias**, quatro cliques
alternados sem erro, o marcador na 4ª coluna com o slot, e acompanhando a altura
com `labels` (58 = 58). O desalinho de ¼–½px é o arredondamento inteiro de
`offset*` contra colunas fracionárias (66,75) — o mesmo do `Tabs`.

#### O rótulo cabe dentro do realce, e não dentro do item

Com `labels`, "Transações" vazava pela curva: a caixa tinha a largura do item
(64,75px), mas o rótulo mora no arco de baixo, onde a pílula mede **~51px**. O
`px-2` corta a caixa para dentro da corda e o `truncate` põe as reticências ali.
Medido pela forma, com os quatro cantos da caixa de texto testados contra o
contorno: 48,8px dentro de 64,8 com quatro abas, e **35,4 dentro de 51,4** num
estresse de cinco colunas com "Contas a pagar". "Categorias" também trunca, de
propósito: qualquer aba pode virar ativa.

#### O catálogo seleciona em vez de navegar

Os espécimes vivem num `PhoneFrame`, e `BottomBarTab` é `<Link>` — que é o certo
no app. Clicar navegava a moldura e levava a demonstração embora. Cada palco tem
estado próprio, e o `onClick` faz `preventDefault()` **mantendo o `href`**, que é
o que o trecho de código ensina. **A peça não foi tocada** por isso.

#### O que o navegador achou e os testes não

- **`BottomBarTabs` contava os filhos e não os renderizava.** Destruturava
  `children` para `Children.toArray` e fechava a `<div />`: a grade saía com as
  quatro colunas certas e **vazia**, com o `tsc` e as catorze asserções passando
  nos dois estados. Entrou a asserção 15.
- **Uma asserção certificava algo falso.** `not.toMatch(/ring-1\s+ring-border/)`
  passava porque o anel mora na constante importada, e ela lia o arquivo da peça
  — media a chamada, e não o resultado. Saiu.
- **O `curl` do SSR não provava nada**: os espécimes entram por um portal que só
  existe no cliente, e vinham zero marcadores *e* zero abas. A prova veio de
  `renderToStaticMarkup` num script: zero marcadores, e o fallback nos três itens.

O teste de escada tem **19 asserções**, e cada uma que trata desta rodada foi
verificada reintroduzindo o defeito. Duas foram consertadas por serem
instrumento errado: a 12 proibia qualquer template literal, e os `setProperty` do
marcador são valor de variável, não classe; a 19 cortava 600 caracteres e entrava
no fallback, que carrega a classe de propósito.

#### Lições de instrumento

- **`\bease-out\b` casa dentro de `--ease-out`.** O `-` é fronteira de palavra; a
  asserção acusava o próprio conserto até ganhar `(?<![-(])`.
- **`oklab` e `oklch` são a mesma cor em notações diferentes** — e ler o cursor no
  mesmo passo pegou o início da transição. As duas coisas juntas pareceram "o
  hover não muda nada".
- **Um `git stash push` num arquivo não rastreado não faz nada**, calado.
- **Um servidor de desenvolvimento órfão** (13h35m no ar) segurava a porta 3000 e
  impedia o harness de subir o seu.
- **Um clique no slot não selecionou**, uma vez, e não reproduziu em cinco
  seguintes. Registrado sem causa, porque os dados não a mostram.

#### O que muda em produção

Não é zero-pixel: a folga de baixo vai de 8 a 16px, o FAB ganha a tecla e fica
redondo, a barra vira pílula, as abas respondem ao cursor e têm anel de foco, o
ícone ativo preenche, o realce viaja, e as transições entram na escala. A troca
de `--primary-foreground` para `--foreground` na tinta do ativo, que o plano
listava como mudança, **não muda pixel**: no escuro as duas são rgb 250.

**Nenhuma tela foi vista logada** — o app exige sessão. O que prova a migração é
o `tsc`, a suíte, o auditor e os espécimes, que exercitam as mesmas peças.

### Backlog de migração

A rodada 01 entregou tokens, componentes, documentação e o auditor, sem migrar
as telas. A rodada 02 migrou o que quebrava o tema escuro e corrigiu a escala de
camadas, que descrevia números que a produção não usava. O estado atual está em
[`docs/design/CONFORMIDADE-02.md`](CONFORMIDADE-02.md): **1.179 →
622 achados**, com ordem sugerida por razão entre impacto e risco. As rodadas
do `Card`, do `Alert` e dos diálogos levaram a **600**, ao migrar as telas que
os eixos renomeados obrigaram a tocar.
[`CONFORMIDADE-01.md`](CONFORMIDADE-01.md) virou registro histórico —
duas das correções que ele prescrevia estavam erradas, e a 02 diz quais.

O que sobra, do mais barato ao mais caro:

- ~~**84 `hover:` sem par de toque**~~ — **pago na migração do backlog**: a
  regra **H** está em **0**, em quatro tratamentos (variante destrutiva, par
  `active:`, realce removido onde nada clica, e a classe morta do `TableRow`).
- ~~**77 formatações fora dos helpers**~~ — **pago**: a regra **I** está em
  **0**, e dois helpers novos nasceram de contagem
  (`formatDateTimeShortPtBr`, `formatMonthLongPtBr`).
- **41 primitivos crus** com equivalente no design system (eram 51), quase
  todos `<button>`. Muda tipos de props: `npx tsc --noEmit` a cada arquivo.
- **306 valores arbitrários**, hoje majoritariamente legítimos: `w-[…]` e `h-[…]`
  de esqueleto, que existem para casar com a largura do conteúdo real.

E o que a rodada do `Card` deixou de propósito para uma próxima, porque a
decisão foi mexer só no design system:

- ~~**46 telas abrem com a mesma string**~~ — **pago**: eram **61 cartões em
  30 arquivos**, e hoje são `padding="none"`. O app tem zero.
- **24 barras de topo e 18 faixas de pé feitas à mão**, em cinco e nove
  grafias. Destino: `CardToolbar` e `CardNote`.
- **`AppAppearanceSettings`** (`src/components/settings/app-appearance-settings.tsx`)
  não é renderizado por nenhuma rota. Foi migrado junto porque o tipo mudou,
  mas o que ele pede é remoção.

E o que a rodada do `Alert` deixou, pela mesma razão:

- ~~**11 avisos tonais feitos à mão**~~ — **pago**: eram **18 em 9 arquivos**,
  e hoje são `Alert`. O que segue abaixo é o registro do que eles eram —
  `flex items-start gap-2 rounded-lg border border-X/30 bg-X-muted …` em
  `invites/accept`, `ChangePasswordDialog`, `edit-profile-dialog` e
  `credit-card-category-alerts`; e `bg-X-muted p-3 rounded-md` sem borda em
  `signup-form`, `forgot-password-form` (duas vezes) e `reset-password-form`.
  Destino: `<Alert tone size>` e `<Alert variant="plain">`.
- **`offline-banner.tsx` é um `Alert` fingindo de `AnnouncementBar`**:
  `rounded-none border-x-0 border-t-0` fixado no topo da janela, com
  `AlertDescription` sem `AlertTitle` — o que a própria documentação do `Alert`
  proíbe. O componente certo já existe e tem `onDismiss`.

E o que a rodada do `Dialog` deixou:

- ~~**32 corpos roláveis** (`min-h-0 flex-1 overflow-y-auto`)~~ — **pago**: os
  **28** que existiam viraram `DialogBody`, e com eles os **30** `DialogFooter`
  que escreviam recuo, sangria e — em sete — a tinta e o canto que a regra
  **J** proíbe. Os cabeçalhos com `shrink-0 px-6 …` continuam à mão.
- **Os 6 diálogos sem `className`** ficaram 64px mais largos (`sm` → `md`) e com
  24px de recuo em vez de 16 — consequência direta de o padrão passar a
  descrever o app. Vale conferir tela a tela se algum queria mesmo ser `sm`.

Os 16 `DialogContent` que montavam a forma à mão (`flex flex-col gap-0
overflow-hidden p-0 sm:max-w-md` mais o teto de altura) **foram migrados** para
`layout="fixed"`. Não foi cosmética: o fio do cabeçalho passou a sangrar por
`--dialog-bleed`, e a variável descrevia o recuo que a **variante** declara —
não o que a tela sobrescrevia. Com `p-0` na tela e `bleed: 24px` no componente,
o fio saía 24px para fora de cada lado (496px num diálogo de 448), salvo só
pelo `overflow-hidden` que aquelas telas por acaso tinham. Um mecanismo que
depende de coincidência não é mecanismo.

E o que a rodada do `Drawer` e do `Popover` deixou:

- ~~**11 telas escrevem a área segura do rodapé à mão**~~ — **pago na rodada
  60**, do lado que importava: o ramo gaveta do `SheetContent` passou a
  declarar `pb-(--sheet-drawer-safe)`, e a classe que 19 telas importavam do
  chrome de folha para receber o `env()` deixou de existir junto com ele. O que
  fica são as superfícies que **não** são folha e escrevem o próprio recuo —
  `mobile-account-menu`, `install-pwa-sheet` e `notifications-sheet` —, e um
  caso solto: `bills-toolbar.tsx`, que reescrevia a classe inteira à mão em vez
  de importá-la. (A `mobile-nav-island` estava nesta lista e foi paga na rodada
  82: a `BottomBar` soma `env(safe-area-inset-bottom)` dentro da própria caixa.)
- **`DialogHeaderRow` ainda separa título e descrição com `space-y-1`.** É o
  mesmo par de identidade que saiu do `PopoverHeader` nesta rodada. Um
  `gap-0.5` a menos, e o par volta a ler como uma coisa só.
- **`Drawer` continua sem consumidor.** Ele agora está correto e documentado,
  mas quem prova um componente é uma tela. O primeiro candidato honesto é um
  descarte casual com o polegar — filtros curtos, uma escolha rápida — que hoje
  abre `Sheet` e paga o painel de desktop sem precisar dele.

E o que a rodada do `FormPickerPopover` deixou, porque a decisão foi mexer só
no design system:

- **As 3 telas continuam escrevendo a anatomia à mão** —
  `transaction-form-fields` (duas vezes) e `subscription-form-pickers`. O
  rodapé `shrink-0 border-t border-border/50 bg-muted/25 p-2` aparece 3×
  idêntico, a faixa de busca 2×, o gatilho `Button outline xl w-full
  justify-between px-3 …` 3×, e `modal={isMobile}` 3×. Destino: as faixas.
- **`formPickerListScrollClassName` sobrevive** só porque essas 3 telas a
  importam. Ela não consegue carregar o `onWheel` que cada uma escreve ao lado
  dela, que é justamente o que `FormPickerPopoverList` traz junto.
- **4 achados C do auditor** — os `<button>` crus de `CategoryRows`,
  `CreditCardRows` e o "Nenhuma" do seletor de assinatura, todos com `hover:`
  sem par `active:` numa superfície de toque. Destino:
  `FormPickerPopoverItem`, que já existe com os 44px de alvo e o par completo.

E o que a **regra G** (ícone fora do Heroicons) revelou no dia em que entrou —
60 achados, nenhum deles conserto desta rodada:

- **24 `<svg>` colados à mão**, e não são marca: 20 glifos do **Lucide** (a
  assinatura é `viewBox="0 0 24 24"` com `stroke-width="2"` e cantos redondos)
  em `signup-form` (15), `forgot-password-form` (4) e `login-form` (3) — olho
  aberto/fechado da senha e os check/x dos requisitos —, mais **2 do Radix
  Icons** (`viewBox="0 0 15 15"`) nos indicadores do `dropdown-menu`, que vieram
  de fábrica com o shadcn. Nenhum tem import: entraram por cópia, que é
  exatamente o furo que checar `package.json` não pega.
- **36 usos com o conjunto errado para o tamanho** — em 26 arquivos, quase todos
  um ícone de `20/solid` ou `24/outline` renderizado em `size-4`. Campeão:
  `DeleteAccountDialog` (5). Até `spinner.tsx` e `mobile-sheet-form-chrome.tsx`
  estão na lista. Nada enforçava esse par antes; a regra escrita existia desde a
  rodada 03 e ninguém tinha como medi-la.
- **0 imports de outra biblioteca.** É por isso que o porteiro do ESLint pôde
  entrar como `error` sem quebrar nada.

E o que a rodada dos menus deixou:

- **14 `DropdownMenuItem` escrevem `text-destructive focus:text-destructive` à
  mão**, em 12 arquivos e numa grafia só, enquanto `variant="destructive"`
  existe e só a página do catálogo a usa. A grafia manual é a pior das duas:
  não traz o `focus:bg-destructive/10` nem o par escuro. É uma substituição
  mecânica de uma linha por arquivo.
- **O `ContextMenu` continua sem consumidor.** Ele virou a régua dos dois
  menus, mas quem prova um componente é uma tela — clique-direito numa linha de
  transação é o candidato óbvio.
- **As 18 chamadas de largura do `DropdownMenuContent`** continuam escrevendo
  `w-44` / `w-48` / `w-52` / `w-56` em vez de `size`, e as 2 de painel
  continuam montando `rounded-xl p-0 shadow-lg ring-1 ring-border/10` à mão
  (`user-menu`, `workspace-switcher`). Substituição mecânica de uma classe por
  um prop.
- **Os 3 estados vazios do `FormPickerPopover`** e os `p-0` do `PopoverContent`
  seguem à mão, pelos mesmos motivos.
- **O `Menubar` também não tem, e a conta explica por quê.** A superfície mais
  densa do app tem **4 comandos**; são 47 no total em 18 arquivos, e nenhum
  agrupado por assunto — são ações de um objeto, que é o caso do
  `DropdownMenu`. Uma barra de menus se paga por volta de três grupos e uma
  dúzia de comandos. Medido, não estimado: `grep -c '<DropdownMenuItem'`.

E o que a rodada do `Tabs` e do `Combobox` deixou:

- **10 `role="tablist"` escritos à mão, em 7 arquivos** (hoje **6**: os 4 de
  formulário viraram `FormRadioGroup`), **com 43 referências às
  duas strings de `transaction-type-segment.tsx`** — uma pasta de *feature*
  fazendo o trabalho do design system, que é o invariante 1 no nível do sistema.
  Nenhum deles tem foco itinerante, setas, `aria-controls` ou `role="tabpanel"`:
  eles **anunciam** o padrão ARIA de abas e entregam botões soltos. Destino: seis
  são `Tabs variant="solid" stretch`, e **quatro são filtros e querem
  `ToggleGroup`** — `bills-toolbar`, `subscriptions-toolbar`,
  `bill-detail-history-list` e o `TransactionTypeSegment` de filtro. A página do
  próprio `Tabs` já ensinava essa regra enquanto o app a quebrava quatro vezes.
  *(Pago no PR #7: as duas abas de verdade viraram `Tabs` na M6, e os quatro
  filtros também — decisão do dono na N3, no lugar do `ToggleGroup`, que não tem
  a bandeja. Zero `role="tablist"` à mão.)*
- ~~**`transactionSegmentTabClassName` tem uma sombra literal**~~ —
  `dark:shadow-[0_1px_2px_0_rgb(0_0_0/0.35)]` — e um `z-[1]`. *(Pagos na N3: as
  duas constantes saíram com as 24 referências.)*
- **`input-group.tsx:69` reimplementa a superfície de campo em forma `has-[…]`**
  — a quarta ocorrência, e a prova de que a régua era real. Não dá para consumir
  `field-classes` direto porque ali as classes vivem sob `has-`; o destino é uma
  variante do arquivo, não uma cópia.
- **`Input` e `SelectTrigger` discordam em `disabled:pointer-events-none`**: o
  primeiro o tem, o segundo não. Ficou fora de `fieldDisabledClassName` de
  propósito — igualá-los é conserto de comportamento, não extração. O `Input` é
  o que está fora do padrão.
- **Três gatilhos de campo em duas aparências.** `SelectTrigger` e
  `ComboboxTrigger` vestem `field-classes`; `FormPickerPopoverTrigger` continua
  `Button variant="outline" size="xl"` por decisão registrada. Vale reabrir a
  decisão agora que os outros dois convergiram.
- **`Drawer`, `ContextMenu` e `Menubar` continuam sem consumidor**, e agora o
  `Tabs` e o `Combobox` também — a diferença é que estes dois têm um consumidor
  **nomeado** e contado acima.
- **Dois cadáveres de seletor, da família "sobreviveu à remoção" que este
  arquivo já documenta.** Um foi apagado nesta rodada:
  `in-data-[slot=combobox-content]:focus-within:*` em `input-group.tsx`, que só
  casava quando `ComboboxInput` renderizava um `InputGroup` — e hoje o
  `CommandInput` desenha a própria casca. O outro **fica**: **`no-scrollbar` é
  usada em quatro arquivos (`ds-shell` ×2, `command.tsx`, `sidebar.tsx`) e não
  estava definida em lugar nenhum** *(paga na rodada 35: virou `@utility`)* — nem em `globals.css`, nem em `tw-animate-css`.
  Defini-la faria quatro superfícies não relacionadas passarem a esconder a barra
  de rolagem em Windows e Linux, o que é mudança de comportamento fora do escopo
  de uma rodada de componente. O `Tabs` escreve
  `[scrollbar-width:none] [&::-webkit-scrollbar]:hidden` por extenso enquanto
  isso não se decide.

E o que a rodada da divulgação e da prévia deixou:

- **Animar a espiada.** Ela abre de uma vez hoje, pelo limite medido acima. É a
  única promessa desta rodada que não foi entregue, e o caminho está escrito.
- **O `peek` não tem consumidor no app.** Ele está correto, medido e
  documentado, mas quem prova um componente é uma tela. Os candidatos honestos
  são a descrição longa de uma assinatura e o texto de ajuda de fatura em
  `credit-card-form-fields`, que hoje abre de altura zero e some inteiro.
- **`markerSide="start"` também não tem.** O caso é o agrupamento de categorias
  por seção, que hoje não existe como acordeão.
- **O `HoverCard` continua com um consumidor só, e é a página do catálogo.** As
  tiras, a seta e os três degraus foram desenhados contra casos reais do app
  (membro de workspace, fatura), mas nenhuma tela os usa ainda — o par
  identidade + saldo numa lista de membros é o primeiro.
- **`separated` e `contained` do `Accordion` também nascem sem tela.** O app tem
  **zero** usos do `Accordion` hoje; o único consumidor de qualquer um dos três
  é o `Collapsible`, em duas telas.
- **`SheetDragHandle` e companhia continuam onde estavam.** Nada nesta rodada
  tocou a limpeza mecânica pendente das outras. *(Paga na rodada 34: as 31
  chamadas saíram e o componente virou o `DragHandle`.)*

**A `AnnouncementBar` passou pela mesma régua, e quase toda ela já estava
certa.** Medida a cor resolvida dos cinco tons, `info`, `success`, `warning` e
`destructive` batem com o `Alert` em **distância 0** nos dois temas — ela sempre
leu os tokens `-muted`, ao contrário do toast. Dois pontos saíram:

- **O texto do tom neutro era o mais fraco de todos.** Com
  `text-muted-foreground`, 5,04 no claro e 5,86 no escuro, contra 6,9–10,8 dos
  quatro tonais. O `Alert default` usa o foreground **cheio**
  (`text-card-foreground`), e a barra não seguia: justamente o tom que não tem
  cor para ajudar a ler tinha o texto mais fraco. Depois: **16,61** e **14,50**.
- **O fio do `sticky` era `border-border/50`** — cinza sobre superfície
  colorida, a mesma família do texto cinza que o `Alert` reverteu. Virou
  `current/20`, uma linha para os cinco tons.

**E o realce do × ficou mais forte que o do botão de ação, de propósito.** A
primeira leitura foi que o hover estava fraco; a medição disse outra coisa:
`current/10` dava 1,28–1,35 no escuro, enquanto o hover do `Button tertiary` do
app dá **1,11** e o do menu **1,14** — o delta já era maior que o da casa. O que
faltava era **área**: um ícone de 12px numa caixa de 24 sem contorno tem um
quarto da superfície de um botão de texto, e a mesma diferença de cor lê como
menos. Por isso duas alavancas em vez de uma: 15% de preenchimento **e** o
contorno aparecendo, que é o que delimita o alvo. O botão de ação fica em 10%,
porque ele já tem borda e rótulo.

**E o instrumento de medição errou antes do código.** A primeira leitura do
hover deu contraste 18,78 e um botão "preto" sobre a barra verde — o medidor
compunha a cor sobre `#000`, e `bg-current/15` **tem alfa**. Cor com alfa
precisa ser composta sobre o fundo real, não sobre preto. As medições anteriores
desta série usavam `color-mix(…, bg)` — sem alfa — e por isso estavam certas; a
primeira com `/15` não estava. Vale a regra: **medir alfa exige pintar o fundo
verdadeiro por baixo.**

**O fundo do `default` continua divergindo do `Alert`, e é decisão.** O Alert
fica dentro do conteúdo, onde `--card` já o separa da página; esta faixa
atravessa o topo, e ali `--card` seria quase invisível — medido no escuro, 23 de
distância da página contra os 48 do `--muted`. Uma faixa que não se separa do
fundo não é faixa.

E o que a rodada do toast, do passo e da faixa deixou:

- **`offline-banner.tsx` ainda posiciona à mão.** Ele usa a `AnnouncementBar`,
  mas com `fixed` e o `--mobile-header-offset` no `className`, porque a troca
  para `sticky` não pôde ser verificada sem sessão. Quem abrir o app logado
  fecha isso em duas linhas — e ganha de brinde a barra deixando de cobrir a
  primeira linha do conteúdo.
- **`export { toast } from "sonner"` continua em `lib/toast.ts`**, e é a porta
  que deixa qualquer tela pular os helpers e, com eles, as durações. Hoje só o
  `sync-engine` a usa; fechá-la é decidir se aquele caso vira helper.
- **`Stepper` e `AnnouncementBar` seguem sem consumidor** além do
  `offline-banner`. O candidato honesto do `Stepper` é o onboarding de conta
  nova, que hoje não existe como fluxo numerado.
- **`toastUndo` e `toastPromise` nascem sem tela.** O primeiro cabe na exclusão
  de transação (que hoje abre `AlertDialog`), o segundo na sincronização
  manual — os dois estão nomeados aqui para não virarem código morto.

E o que a rodada do campo de data e dos dois cartões deixou:

- **A aparência de 8 telas mudou sem que nenhuma fosse editada** — 5 do
  `DatePicker` e 3 do `FormPickerPopover`. É o efeito pretendido da convergência
  de superfície, e vale conferir tela a tela se algum campo ficou apertado com os
  4px a mais de altura.
- **As sobrescritas que agora têm variante** continuam à mão: as duas strings
  idênticas do `EmptyState` (`not-found-shell`, `route-error-fallback`), o
  `bg-destructive-muted` do ícone de erro, e os `displayStyle="numeric"` que hoje
  podem vir acompanhados de `size`.
- **`transactions-date-range-form.tsx` reimplementa `parseYmdLocal` e
  `localYmdFromDate`** como `ymdToLocalDate` / `localDateToYmd`, e monta o
  período com dois seletores. Agora ele cabe num `DatePicker mode="range"` só.
- **`StatCardDelta`, `StatCardIcon`, `StatCardValueSkeleton` e o `size` do
  `Calendar` nascem sem tela.** As duas telas de `StatCard` usam rótulo e valor e
  mais nada.
- ~~**`Button variant="tertiary"` não tem par `active:`**~~ — **pago na rodada
  29b**, na origem. E a contagem estava errada para menos: medindo as cinco
  variantes que pintam fundo, **quatro** ficavam inertes ao toque, não uma.
  `secondary`, `outline` e `destructive` continuam pendentes (o `primary` foi
  pago na rodada 78), e
  agora com mecanismo: a lista vive em
  [`button-touch-response.test.ts`](../../src/components/ui/button-touch-response.test.ts),
  que **falha se ela crescer**.

E o que a rodada da trilha, da paginação e das duas listas deixou:

- **Os quatro continuam sem consumidor no app**, e agora com os candidatos
  nomeados: linha de transação → `Item variant="divided"`; detalhe de fatura e
  de cartão → `DescriptionList` (`divided` para o extrato, `grid` para os seis
  campos, `size="lg"` na linha do total); as telas de três níveis
  (`/credit-cards/[cardId]`, `/categories/[categoryId]`) → `Breadcrumb` dentro de
  `PageHeaderBreadcrumb`; a lista de transações → `Pagination align="between"`
  com `PaginationStatus`.
- **A regra H do auditor não enxerga `cva()` nem `cn()`.** Ela varre
  `className="…"`, e os dois `hover:` sem par de toque desta rodada estavam
  dentro das duas — por isso os quatro arquivos saíam "conformes" com o defeito
  dentro. Ampliar o alcance da regra é conserto do auditor, e ficou de fora.
- **`Breadcrumb` virou módulo de cliente.** O `size` desce por contexto até o
  separador e as reticências, o que exige `createContext`. Custou pouco (o
  módulo é pequeno, e quase todo `src/components/ui/` já é `"use client"`), mas
  `PageHeader`, que é servidor, agora atravessa uma fronteira ao renderizá-lo.
- **`BreadcrumbEllipsis` sobrevive sem chamador.** Com `maxItems`, a lista monta
  `BreadcrumbMenu` sozinha, e o marcador estático só serve a quem colapsa à
  mão. Fica exportado porque é o degrau de saída, não porque alguém o use.

E o que a rodada do campo, do formulário e da barra deixou:

- **104 campos à mão**, em 27 arquivos e 5 dialetos de espaçamento. Destino:
  `Field` + `FieldControl`. É a migração mais cara e a de maior retorno — ela é
  que transforma os 24 `aria-invalid` órfãos em campos que o leitor de tela
  explica. Os 2 achados **C'** de `<fieldset>` cru em
  `workspace-appearance-form-fields.tsx` são o auditor apontando a mesma lacuna.
- **A escada dos controles de campo está incompleta**, e é o que obriga os 15
  `h-9` / `className="text-sm"` escritos à mão nos três formulários maiores:
  `Input` e `SelectTrigger` têm `sm md lg xl`; **`NativeSelect` só tinha `sm md`**
  (fechado na rodada da composição), **o campo de dinheiro não tinha nenhum** —
  fechado na rodada do `<Input money>`, que o faz herdar a escada inteira —, e
  **`Textarea` continua sem**. Ficou o `Textarea`, que é conserto de um
  componente que aquela rodada não abriu.
- **`NativeSelect` é a quinta cópia da superfície de campo** — escreve
  `rounded-lg border border-input bg-input-fill/30 … aria-invalid:…` inline em
  vez de consumir `field-classes`. O backlog já chamava `input-group.tsx:69` de
  "a quarta ocorrência". Junto vêm dois desvios só dele:
  `data-[size=sm]:rounded-md` (raio diferente num degrau, que nenhum outro
  controle faz) e `dark:hover:bg-input-fill/50`, um `hover:` sem par `active:` e
  só no tema escuro. *(Pago na rodada da composição: veste `field-classes`, os
  dois desvios saíram, e ganhou `lg` e `xl`.)*
- **6 barras de filtro à mão** (1.372 linhas) mais **6 clones em esqueleto** com
  as strings copiadas, mais `monthNavDense*` (4 constantes, ramo `false` morto),
  `transactionSegment*` e o booleano `dense` costurado por três componentes.
  Destino: `Toolbar` + `ToolbarRow` + as duas réguas. São 19 `md:h-8` em 14
  arquivos. *(Pago: as barras na M7, e os 14 `md:h-8` que sobraram fora delas
  na N1 — `toolbarControlClassName` dentro de uma `Toolbar`, `h-8
  pointer-coarse:h-10` fora. Zero `md:h-8`.)*
- **4 barras de seleção com `role="toolbar"` escrito à mão**, nenhuma com foco
  itinerante — e `transactions-table.tsx:260,318` está copiado verbatim em
  `subscriptions/page-client.tsx:545,607`.
- **`bills/page-client.tsx:196`** renderiza o gatilho de filtro em `size-9`
  (**36**) enquanto `bills-toolbar.tsx:211` renderiza o mesmo controle em
  `size-10` (**40**). Um terceiro valor, na mesma tela.
- **3 dialetos de erro de campo** — `text-sm font-normal` (`FieldError`),
  `text-control-sm font-medium` (login, signup, forgot, reset) e
  `text-sm font-medium` (workspace-appearance) — e **4 resumos de erro no topo
  do formulário com 3 contratos de acessibilidade diferentes**: um com
  `role="alert" aria-live="polite"`, um só com `role="alert"`, um sem nada.
  Destino: `FieldError` e `Alert tone="destructive" variant="plain"`.
- **7 alternadores de senha** em 4 arquivos, com dois conjuntos de ícone — e os
  de `login-form.tsx` são `<svg>` do Lucide colados à mão (regra G).
  `InputGroup` cobre.
- **`<select>` cru com 350 caracteres de classe** em
  `wallets/page-client.tsx:277`, com tokens obsoletos (`h-10`, `rounded-md`,
  `focus-visible:ring-2`, `ring-offset-background`). `NativeSelect` existe.
- **`ChangePasswordDialog.tsx:32-36`** deriva à mão a classe do rodapé do
  diálogo **e** a da folha, com três `!important` brigando com as margens do
  `DialogFooter`. *(O rodapé foi pago: é `FormActions variant="sticky"`.)* E
  faltava um `MobileSheetFormFooter`: o chrome cobria cabeçalho e
  corpo, não o rodapé.
- **4 `maxLength` silenciosos**, um deles em 120 caracteres, sem contador. Quatro
  é pouco para uma peça, mas truncar sem avisar é defeito.
- **`field-classes.ts` não está no catálogo.** É régua compartilhada como
  `formatters` (Padrão *dinheiro*) e `transaction-date` (Padrão *datas*), e as
  duas têm página. Ela não.
- **A regra H do auditor não enxerga `cn()` nem `cva()`** — já registrado na
  rodada 08, e continua valendo: o par `active:` do cartão de escolha teve de ser
  verificado no CSS emitido, porque o auditor não o alcança.
- **Uma regra de auditor nova, se alguém quiser fechar a porta**: um campo
  montado à mão (`<Label>` seguido de controle, sem `Field` em volta) é medível,
  e é o que impediria as 104 de voltarem. Foi assim que a regra J nasceu.

E o que a revisão da barra deixou:

- **`ToggleGroup type="single"` desmarca tudo** ao clicar no item ativo, e emite
  `role="radio"` dentro de `role="group"`. **Zero consumidores**, então o
  conserto é grátis — e é ele que tira os 3 filtros de `role="tab"`. Sem isso,
  cada tela migrada precisaria do próprio guarda
  (`onValueChange={(v) => v && setX(v)}`): 6 grafias duplicadas.
- ~~4 `role="tablist"` dentro de formulários~~ — **pagos** na rodada do `Radio`.
  Restam os **6** que são filtro ou aba de página, e esses continuam sendo
  trilho segmentado.
- ~~**`TransactionTypeSegment` é aba numa tela e filtro na outra.**~~ *(Pago na
  N3: é `Tabs` nas duas, e o componente ficou só como invólucro do filtro.)*
- ~~**A cromagem de seis telas mora numa pasta de *feature*.**~~ *(Paga na N3.)*
  `transactionSegmentContainerClassName` e `transactionSegmentTabClassName` são
  exportados de `components/transactions/` e importados por faturas, cartões,
  assinaturas e categorias — o invariante 1 no nível do sistema. Levam junto a
  sombra literal `dark:shadow-[0_1px_2px_0_rgb(0_0_0/0.35)]` e um `z-[1]`.
- **3 `<Input type="search">` sem a supressão do ×** em
  `transactions-filters-panel.tsx` (418, 538, 772), e o
  `FormPickerPopoverSearch`, que hoje reimplementa o que o `SearchInput` faz.
  Destino: os quatro passam a consumir a peça. *(Os 3 do painel pagos na N1,
  com `onClear`; o `FormPickerPopoverSearch` continua à parte.)*
- **A busca não existe na barra em nenhuma tela.** O catálogo agora mostra a
  forma e diz que o app não a tem; tomar a decisão é trabalho de produto.

E o que a rodada do chrome de página deixou:

- **Os três continuam sem consumidor no app**, e agora com os candidatos
  contados: `wallets/page-client.tsx:243` escreve `font-heading text-3xl
  font-bold tracking-tight` num `<h1>` à mão, e `credit-cards/page-client.tsx`
  e `settings/credit-cards/page-client.tsx` escrevem `text-lg font-semibold
  tracking-tight` em mais três — quatro `<h1>` de tela em três grafias, nenhuma
  igual ao `PageHeaderTitle`. O consumidor de verdade do `PageSection` são os
  **108 cabeçalhos de bloco** escritos à mão em 5 grafias (`text-base
  font-semibold tracking-tight` ×18, mais `text-sm font-semibold`, `text-2xs
  font-medium uppercase` e companhia).
- **`MobileHeaderBack` em `app-header.tsx:69` é a terceira cópia do voltar.**
  Ela ficou porque mexer no chrome do app é fora do escopo de uma rodada de
  design system, mas agora `PageHeaderBack` tem a mesma medida dela — a troca é
  de uma linha.
- **`H2` de `typography.tsx` e `PageSectionTitle` descrevem a mesma coisa
  diferente**: `text-2xl font-semibold` com `border-b` contra `text-base`
  (agora `sm|md|lg`) sem fio. O `H2` é o cabeçalho de prosa e o outro é o de
  tela, mas nada no sistema diz isso. Resolver é escolher um dono para
  "cabeçalho de segundo nível". *(Resolvido na rodada da composição:
  `PageSectionTitle` **é** `H2` por `asChild`, e `H2` perdeu a régua.)*
- **`Container` não tem eixo de calha.** `px-4 sm:px-6 lg:px-8` é fixo, e não há
  divergência medida no app para justificar um eixo — a nota fica para o dia em
  que houver.
- **O índice do catálogo perdeu 16px** entre o título e a frase de abertura,
  por aplicação do par de identidade. Foi a única mudança visível da migração;
  as outras 89 páginas saíram idênticas, verificado por captura.

E o que a rodada do `Container` deixou:

- **As outras 5 cascas de página continuam à mão.** `invites/accept` (×2, sem o
  `min-w-0` que as outras tinham), `credit-cards/[cardId]` (com um
  `px-1 sm:px-0` a decidir — quatro pixels que somem em 640), e os dois shells
  de erro (`not-found-shell`, `route-error-fallback`, os dois em `max-w-md`,
  que é o degrau `sm`). São 5 substituições mecânicas.
- **A área segura horizontal não existe no repositório.**
  `env(safe-area-inset-left/right)` não aparece nenhuma vez; só a vertical. Num
  telefone com entalhe em paisagem, o `px-4` da casca do app deixa o conteúdo
  passar por baixo do entalhe. O dono do conserto é
  `sidebar-app-shell.tsx:39`, não o `Container`.
- **A casca do app declara `md:p-6` e o `Container` declara `md:px-6`.** São a
  mesma calha horizontal, escrita em dois lugares. No dia em que a casca
  consumir o `Container`, uma das duas some — e é a da casca, porque ela também
  carrega o recuo vertical e a área segura.
- **`Container` ainda não tem `asChild`.** Zero demanda hoje: as nove cascas são
  `<div>`. A nota fica para quando uma tela pedir `<section>`.

E o que a rodada da taxonomia deixou:

- **30 componentes seguem sem consumidor fora do catálogo**: `accordion`,
  `breadcrumb`, `button-group`, `carousel`, `code`, `combobox`, `context-menu`,
  `description-list`, `field`, `hover-card`, `input-otp`, `item`,
  `kbd-group`, `menubar`, `native-select`, `navigation-menu`, `page-header`,
  `page-section`, `pagination`, `resizable`, `scroll-area`,
  `scroll-fade`, `search-input`, `slider`, `stepper`, `tabs`, `timeline`,
  `toggle-group`, `toolbar`. Cada um pede a tela que o prove, e isso é trabalho
  de produto — mas a contagem é a medida honesta de quanto do sistema ainda é
  promessa. E ela é por **arquivo**, o que esconde: `typography` conta como
  consumido, e são **2 dos 9** exports — `Muted` (9 usos) e `P` (6), em 6
  arquivos. Os outros sete têm zero no app — mas seis dos nove passaram a ter
  consumidor **dentro do sistema** na rodada da composição.
E o que a rodada do `<Input money>` deixou:

- **Os dois campos de valor do `transactions-filters-panel` continuam crus**, e
  com eles os outros **7 rótulos `text-2xs text-muted-foreground`** do mesmo
  painel. O que destrava é migrar o painel inteiro de uma vez — ou um degrau
  `xs` em `fieldSize`, que hoje não existe e que 9 rótulos pediriam.
- **`credit-card-category-alerts` é uma barra em `grid` com `sm:contents`**, e é
  a única forma do app que o `Field` não veste. Redesenhá-la é o que a tira de
  cru.
- **O orçamento por linha do `categories-onboarding-wizard`** tem rótulo
  `sr-only` num controle de 6,75rem. Um `FormInput` com rótulo invisível é a
  peça que falta — ou a linha vira `Item`, que é onde ela deveria estar.
- **`Textarea` continua sem escada de altura.** Era o par do campo de dinheiro
  na frase do backlog; o dinheiro herdou a do `Input`, e ele ficou sozinho.
- **A regra de auditor que mediria isto ainda não existe**: um campo montado à
  mão (`<Label>` seguido de controle, sem `Field` em volta) é medível, e é o que
  impediria as 17 de voltarem. Os números desta rodada — 12 migrados, 5 crus —
  saíram de leitura, não do auditor, que reportou **os mesmos achados antes e
  depois** nos 11 arquivos.

E o que a rodada do `Radio` deixou:

- **As setas do `radiogroup` não foram verificadas.** O painel do navegador não
  entrega teclas neste ambiente — medido com um ouvinte de `keydown` que recebeu
  zero eventos. Quem tiver teclado de verdade fecha isso em trinta segundos:
  Tab entra no grupo, seta move o foco **e** seleciona.
- **As 4 telas migradas não foram vistas logadas.** `transaction-form-fields` e
  os 7 sítios do `TransactionFormTypeSegment` compilam e o `<div
  className="space-y-2">` que saía carregava o respiro entre o campo de nome e o
  de tipo — o `gap-2` do `Field` **deve** deixar neutro, e "deve" é previsão.
- **No telefone o cartão horizontal mede 61px**, contra os 40 do trilho que ele
  substituiu: a 375px o rótulo quebra em duas linhas. No desktop são 44 contra
  32. Se isso incomodar, a saída é um degrau de corpo menor no item — e é
  decisão de produto, não conserto.
- **O app fala duas línguas de escolha até a próxima rodada.** Os 4 que migraram
  são cartão com contorno de marca; os **6** que ficam (filtro e aba de página)
  seguem com a pastilha levantada sobre bandeja. É temporário por construção,
  mas é real.
- **`ToggleGroup type="single"` continua desmarcando tudo** ao clicar no item
  ativo, e emitindo `role="radio"` dentro de `role="group"`. Zero consumidores;
  o conserto continua grátis, e é ele que destrava os 3 filtros que hoje são
  `role="tab"`.
- **O `Radio` nasce sem consumidor fora do `RadioGroup` e da página do `Field`.**
  O caso que o justifica sozinho é o cartão com conteúdo próprio — uma opção que
  carrega um valor em dinheiro, por exemplo.

- **O vocabulário de superfície ainda tem 14 palavras.** Depois de unificar
  `plain`, sobram `outline`, `solid`, `elevated`, `muted`, `soft`, `panel`,
  `underline`, `dashed`, `card`, `flush`, `inset`, `contained`, `separated` e
  `ruled` espalhadas pelos eixos `variant`. Algumas são genuinamente diferentes;
  outras são a mesma coisa com dois nomes. É uma rodada própria, e a medida para
  começar é cruzar cada palavra com o que ela desenha.

E o que a rodada do `resizable` deixou:

- **Ele continua sem consumidor**, e agora com o candidato nomeado:
  `/transactions` como lista mais detalhe no desktop. A proporção certa entre a
  lista e o detalhe depende de a pessoa estar varrendo ou conferindo, que é
  exatamente quando um split se paga — e, com o empilhamento embutido, a tela
  não precisa escrever nada para o telefone.
- **`resizeTargetMinimumSize` está em 44 no ponteiro grosso, e isso não foi
  medido contra conteúdo real.** São 22px de cada lado da costura em que um
  toque destinado ao painel vizinho é engolido pelo arraste. Na página do
  catálogo os painéis estão vazios; a primeira tela com conteúdo colado à
  costura é que vai dizer se o número desce.
- **O anel de foco da costura é recortado pelo `overflow: hidden` do grupo**,
  que a lib declara inline e não deixa sobrescrever. Ele corre a altura toda, e
  o recorte fica nas pontas — verificado que existe, não julgado como defeito.
  Se incomodar, a saída é o `inset-ring-3` do `disclosure-classes`.
- **`useResizableLayout` custa uma remontagem por carregamento.** Quem não
  quiser pagar guarda a proporção em cookie e a entrega pelo servidor, que é o
  caminho que a própria documentação da lib sugere.
- **A demonstração do modo empilhado não empilha no desktop**, porque
  `useIsMobile` lê o viewport e não o contêiner. A página diz para estreitar a
  janela. Uma *container query* resolveria, e mudaria a semântica de `stack`
  para todo mundo — é decisão de outra rodada.

E o que a rodada do `carousel` deixou (com o que a **29b** já fechou marcado):

- **A seta não viaja mais, e o padrão mudou de aparência.** `tertiary` sem fundo,
  `rounded-lg`, `fade` ligado por padrão. Quem tinha o mapa antigo na cabeça
  procura uma pastilha preenchida e circular; ela não existe mais.
- **Três variantes do `Button` seguem inertes ao toque** — `primary`,
  `secondary`, `outline` e `destructive` — com a lista trancada por teste. É
  conserto de uma linha em cada, e vale para o app inteiro.

- **Os três alvos de dedo por pseudo-elemento da casa medem 42, e dizem 44.**
  `PageHeaderBack` (36, **pago**: hoje 32 com `-inset-2` = 46), o × da
  `AnnouncementBar` (24) e os degraus do
  `Breadcrumb` (20) — os três somam o `inset` à caixa de **borda** na conta do
  comentário, quando o bloco que contém um absoluto é a caixa de **padding**, e
  os três controles têm 1px de borda. Medido no `::after` do carrossel antes do
  conserto: `42px`. É uma linha em cada um (subir um degrau de `inset`), e o
  número certo no comentário — mas mexe em três componentes com consumidor, e
  por isso não entrou aqui.
- **O carrossel continua sem tela**, e agora com os candidatos contados:
  `dashboard-kpi-cards.tsx:139` (`grid grid-cols-2 gap-2 lg:grid-cols-4` — quatro
  KPIs que viram 2×2 no telefone) e `credit-cards/page-client.tsx:337`
  (`grid grid-cols-1 gap-3 md:grid-cols-2`). Nos dois o carrossel só se paga
  **abaixo de 768px**; acima, a grade mostra tudo de uma vez e é melhor.
- **Autoplay é dependência nova.** `embla-carousel-autoplay` não está instalado,
  como nenhum outro plugin. Se um dia entrar, entra com pausa no cursor, no foco
  e em `prefers-reduced-motion` — e a pergunta anterior é se um app de finanças
  deve mover conteúdo sozinho.
- **`gap` não aparece no `ds:catalog`.** O script lê o **primeiro** `variants:`
  do fonte, e as classes de calha vivem numa tabela literal fora do `cva` —
  elas vão para o trilho e para o item, não para a raiz. Os outros três eixos
  aparecem. Ou o catálogo passa a ler mais de uma fonte de eixos, ou o eixo
  continua documentado só na `PropsTable`.
- **`slidesInView` e `slideFocus` seguem sem leitor**, e o custo disso é medido:
  o último item da demonstração fica em `x: 1472` com o viewport terminando em
  **1083** — inteiramente fora de vista —, e um botão injetado dentro dele
  **recebe foco**, sem `inert` e sem `aria-hidden`. É o defeito de
  acessibilidade clássico de carrossel: quem navega por `Tab` entra em conteúdo
  que não está na tela. `slidesInView` é exatamente o mecanismo que resolve, com
  `inert` no que saiu. Ficou de fora porque `inert` muda o comportamento de foco
  de toda tela que use a peça, e merece a própria medição — as demonstrações de
  hoje não têm conteúdo focável dentro dos itens, então o defeito não é
  alcançável pelo catálogo.

E o que a rodada do gráfico deixou — as sete telas que não migraram, contadas:

- **4 tooltips escritas à mão**, todas repetindo `min-w-[10rem] rounded-lg
  border-border/80 bg-popover px-3 py-2 text-xs shadow-md`
  (`dashboard-cashflow-chart`, `dashboard-expense-categories`,
  `credit-cards-history-chart`, `credit-card-invoice-category-spend-section`).
  Destino: `ChartTooltipContent format="currency"`.
- **2 telas usam o `<Tooltip>` cru do Recharts**, que renderiza **sem tema
  nenhum** (`dashboard-installments-projection`, `category-detail-trends`).
- **3 legendas à mão**, com `LegendStrip` sendo a mesma peça em 2 arquivos.
  *(O `LegendStrip` — que era um arquivo só — pago na N2: é `ChartLegendContent`
  solto no cabeçalho do histórico de cartões.)*
  Destino: `ChartLegendContent`, e a de `dashboard-expense-categories` é
  `interactive`.
- **4 `new Intl.NumberFormat(… "BRL")` redeclarados** nos gráficos (10 no resto
  do app) e **4 `tickFormatter` compactos inline**, nenhum chamando
  `currencyCompactBRL`. Destino: `format` no eixo e no tooltip.
- **2 `chartReady` + `ResizeObserver`** duplicados (30 linhas cada), **2 escadas
  de corpo do centro da rosca** e **2 cópias de `alpha(color, pct)`**.
- **Cores fora do sistema**: `#1f6a59` em
  `dashboard-installments-projection.tsx:27` sob o comentário falso *"Bar fill
  cannot use var() in SVG"* — a página `/graficos` agora aponta para o arquivo
  certo, porque o que ela nomeava (`dashboard-cashflow-chart`) já foi
  consertado; dois `oklch()` literais e **sem par no escuro** em
  `credit-card-invoice-analytics-panel.tsx:256`; e cinco `oklch()` crus como
  `FALLBACK_FILLS` em `dashboard-expense-categories.tsx:31`, para o mesmo
  trabalho que o arquivo vizinho faz com `var(--chart-N)`.
- **3 alturas em pixel** (`height={300}` ×2, `240`, `200`) contra o eixo
  `aspect`, e **1 `accessibilityLayer={false}`**.
- **`credit-cards-history-chart` repete a rampa** com `BAR_COLORS[idx % 5]`:
  seis cartões dão duas barras da mesma cor.

E o que a rodada do `NavigationMenu` deixou:

- **Ele continua sem tela**, e o candidato tem nome: a superfície pública
  (landing, preços, institucional) que o produto ainda não tem. As peças estão
  medidas para o dia em que ela existir.
- **Sem teste de escada.** Foi decisão desta rodada, e o que ele trancaria está
  escrito acima. É o único componente com cinco eixos e nenhuma asserção — e a
  32b mostrou o preço: o `relative` do item zerava o `offsetLeft` de todo
  gatilho, e nenhuma asserção olhava para isso. O que pegaria é uma que proíba
  `relative` no item e na fileira, com o motivo escrito.
- **`defaultValue` com `viewport` nasce dentro de um viewport de altura zero** —
  o Radix mede o conteúdo por `ResizeObserver` e a medida não chega à primeira
  pintura. Contornado nas demonstrações com `viewport={false}`; não investigado
  no componente.
- **`NavigationMenuSub` segue sem embrulho** (zero contagem), e o `Menubar`
  continua a única fileira de menus com submenu.
- **A regra H do auditor não alcança `cva()`.** Ela varre `className="…"`, e
  todo `hover:` deste componente mora dentro de um `cva` — foi por isso que o
  arquivo antigo saía "conforme" com `hover:` sem par de toque em duas peças. É
  o mesmo ponto cego que as rodadas 08 e 11 registraram, e continua aberto.
- **`popover.tsx` e `select.tsx` ainda escrevem a superfície à mão.** O
  `menuPanelSurfaceClassName` existe agora; são duas substituições mecânicas, e
  ficaram de fora porque a rodada não abriu aqueles arquivos.

E o que a rodada 40 deixou, ao extrair o vidro:

- **Os dois vidros viraram um, com dois modos** (rodada 47): a `@utility glass`
  ganhou `glass-material`, e a premissa passou a ser eixo em vez de nome. O que
  sobra é adoção — **nenhum consumidor usa o modo**, e o candidato honesto é uma
  superfície com conteúdo rolando por baixo, que o pintado nunca serviu.
- ~~**`app-header.tsx` ainda escreve o material à mão**~~ — **pago na rodada
  80**: ele é o `TopBar`, que veste `barSurfaceClassName`. O registro antigo, em
  `blur(8px)` sem
  vibrância, sem vestir `glass-surface` e sem o `reduced-transparency:` que o
  cabeçalho do catálogo passou a ter. Depois da rodada 51 ele é a **única**
  superfície de vidro do repositório fora da receita — as outras 11 e a folha do
  telefone já a vestem. **E agora o destino tem nome**: `barSurfaceClassName`,
  em `lib/bar-classes` (rodada 59), que é exatamente a receita que ele tenta
  escrever. Ele ficou de fora por decisão: é `layout/`, tem consumidores reais,
  e o vidro dele só existe rolado — é medição própria.
- **`thin` reprova o contraste de texto sobre conteúdo claro no escuro** (2,73
  contra os 4,5 da norma). É a natureza de um material fino e está documentado,
  mas não há guarda mecânico: uma tela pode pôr texto ali sem nada avisar.
- **O `ColorTile` de vidro ainda tem as quatro camadas apagadas.** A rodada 48
  consertou a causa para peças **redondas**; o ladrilho é `rounded-md`, então ele
  fica com o aro linear (onde os cantos existem e ele está certo) mas continua
  com lâmina e nuvens cobertas pelo tom. O que falta ali é decidir se ele também
  ganha um especular.
- **O `Button` não tem vidro, e não é por falta de tentativa** — três desenhos,
  três reprovações na tela (rodadas 49, 50, 50b), mais a da 45. Os números que
  qualquer nova tentativa herda estão na lápide de `lib/glass-classes.ts`. Se
  voltar, a régua é a mesma das duas peças que ficaram: `Avatar` e `ColorTile`
  não são clicáveis e não carregam texto sobre a superfície — o botão faz as
  duas coisas, e é aí que a margem some.
- **O especular não sobrevive a uma foto.** `AvatarImage` é `h-full w-full
  object-cover` e cobre as camadas de fundo inteiras: num avatar com foto sobra
  só o aro, que é `border-box`. Se o reflexo tiver de valer sobre a foto, ele
  precisa sair do `background` e virar pseudo-elemento.
- **`registered-credit-card-face.tsx` segue fora dos dois.** Oito camadas com
  `mix-blend-mode` e `mask-composite` — as duas técnicas que `glass.test.ts` e
  `scroll-fade-classes.ts` proíbem no resto da casa. É o arquivo que mais
  ganharia com a fusão, e o mais caro de tocar.
- **O `Glass` nasce com o degrau `control` sem consumidor de produto.** O toggle
  de tema foi verificado como vestível (`<Glass asChild>` funciona, o `className`
  é repassado nos dois ramos) e **não** foi migrado — decisão do dono. O
  catálogo o demonstra em espécime.

E o que a rodada 53 deixou, ao dar vidro às superfícies de borda:

- **8 telas pintam uma tira opaca dentro da folha** — `border-t border-border
  bg-background` em 14 sítios (`workspace-delete-dialog`,
  `workspace-appearance-edit-dialog`, `ChangePasswordDialog`,
  `DeleteAccountDialog`, `project-form-dialog`, `edit-profile-dialog`,
  `bill-detail-sheet`, `transactions-toolbar`), mais os gêmeos
  `dialogFooterClass`, que **já estão hoje opacos** sobre a placa translúcida do
  `Dialog`. É o defeito dos `ScrollButton` do `Select` na escala do app.
  **Tirar a tinta sozinha piora**: esses arquivos escrevem o corpo rolável à mão
  e não têm fade — verificado, zero `DialogBody` / `scrollFade` neles —, então o
  conteúdo correria por baixo dos botões. O conserto é a migração dos 32 corpos
  à mão para `DialogBody`, que agora traz a rampa **e** o material do iOS; a
  tinta sai junto, e a regra J deixa de acender ali.
- **O `bg-clip-padding` do `edge-panel.tsx:32` nunca foi decidido.** É herança do
  shadcn (rastreado até o commit de baseline), sem comentário e sem registro.
  Com placa opaca era inerte; com placa translúcida ele recorta o fundo no
  *padding box* e pode reabrir a fresta de 1px que `designsystem/page.tsx`
  descreve. Merece uma medição própria.
- **O custo do vidro na gaveta não foi medido num aparelho.** Na máquina de
  desenvolvimento o arrasto sai idêntico com e sem o filtro (mediana 13,3ms, p95
  13,9, zero quadros perdidos, a 848px de altura). Isso descarta um custo
  grosseiro, não prova o telefone.

E o que a rodada da `Timeline` deixou:

- **Os dois candidatos, contados, e a anatomia de cada um.**
  `account/activity/page-client.tsx:296` é o encaixe limpo — ícone em círculo
  tingido (`h-8 w-8`, que é o poço `md`), sem dinheiro e sem controle na linha.
  `bills/bill-detail-history-list.tsx:165` é o caro: `MoneyDisplay` na coluna
  direita, chip de cinco estados **e botões `Pagar`/`Ignorar` dentro da linha**
  — a `Timeline` não tem slot para os dois últimos, e abrir um é rodada própria.
  Ele já tem o mapa de cor do ponto (`instanceDotClass`), que é um `tone` de
  facto: `paid → success`, `overdue → destructive`, `today → warning`.
- **`Stepper` e `Timeline` são a mesma anatomia, e os dois têm zero
  consumidores.** Ponto, conector, rótulo, escada, orientação, e agora os dois
  derivando o índice por clone. Vale medir se são um componente com dois modos
  ou dois de verdade — é a pergunta *"componente ou modo?"* que esta base já
  respondeu três vezes por absorção. O que os separa hoje é semântica
  (progresso contra histórico) e o marcador numerado.
- **Três das oito listas de eventos são `<Table>`** — `subscription-detail`,
  `transaction-detail` e `dashboard-payment-event-preview`, com as duas últimas
  quase cópia literal uma da outra. Elas **não** são candidatas a `Timeline`;
  são candidatas a `TablePanel`.
- **A faixa de data e a horizontal nascem sem tela**, e é dito na seção da
  rodada. A primeira só se paga num feed longo — o candidato é a atividade do
  workspace, que hoje mostra o dia em cada linha em vez de agrupar.
- **O vidro da `Timeline` nasce sem consumidor**, como os outros três modos. Os
  candidatos são os mesmos dois da rodada 69 — e a atividade do workspace é o
  encaixe natural, porque o poço tingido que ela desenha à mão é literalmente a
  peça que o modo veste.
- **O ponto de vidro é a decisão que pode voltar.** Ele mede 1,97–3,48 de aro
  contra corpo e está uniforme com o resto por construção; se reprovar na tela,
  o conserto é `glass` inválido com `marker="dot"` **no tipo**, e não uma
  exclusão silenciosa que reabriria o buraco da uniformidade.
- **`--tl-icon` decide o corpo do glifo (14/16/20), e o conjunto é de quem
  chama.** Pela regra G, `sm` e `md` pedem Heroicons `16/solid` e `lg` pede
  `20/solid`. O auditor **não pega isso**: a heurística dele é "sem classe de
  tamanho = `size-4`", e aqui o tamanho vem de variável. Está na `PropsTable`, e
  é a única parte do contrato que depende de quem escreve lembrar.

E o que a rodada da `Pagination` deixou:

- **A numeração não some no telefone, e a nota do catálogo dizia que sumia.**
  Medido a 375px: com os controles em 44 no toque, a fileira de sete peças
  transborda em quatro das cinco demonstrações. O desenho documentado —
  `max-sm:hidden` nos números, com o `PaginationStatus` orientando — é uma
  linha, mas esconde também o indicador da página atual, e é decisão de
  produto.
- **O rodapé real do app continua à mão.** `transactions-table.tsx:849-905`
  escreve `text-xs`, `tabular-nums` cru e dois `icon-lg` forçados a 32 por
  `className`. Com o `xs` — o padrão desde a rodada 72 — a peça entrega
  12px, o mesmo corpo que ele desenha à mão, e a migração ficou barata pela
  primeira vez.
- **`icon-*` segue sem tipo.** A frase do `Button` foi corrigida, mas o degrau
  não: o próximo componente que puser texto num botão de ícone vai reencontrar
  o buraco. Declarar o corpo na coluna `icon-*` é mudança no `Button`, que
  alcança as ~30 chamadas de `icon-sm` do app, e merece a própria medição.

E o que a rodada das ações por linha deixou:

- **As duas colunas de ações reais** (`transactions-table.tsx:802`,
  `subscriptions/page-client.tsx:924`) migram para `actions`, ganham
  `aria-label` com o objeto e perdem o vermelho da lixeira. É mecânico, e é
  pixel em produção.
- **O cabeçalho fixo translúcido** das duas telas (`sticky top-0 z-10
  bg-muted/50`) vira `TableHeader variant="muted" sticky` — hoje as linhas
  passam por baixo dele, medido no catálogo.
- **A coluna de seleção crava o próprio recuo** (`px-2 md:px-3`) e ignora a
  densidade: sob `lg` as outras células têm 16px e ela não. `actions` já lê
  `--table-px`; `selection` é a mesma troca.
- **A coluna fixa à direita ficou fora.** A dissolução da borda direita
  apagaria a própria coluna fixa. No telefone o problema some com o gêmeo; num
  tablet ele volta, e merece a própria medição.
- **"O valor desce quando há botões" mora na demonstração.** Se as telas
  adotarem o gêmeo, é a primeira coisa que elas vão reescrever — e aí a linha
  do telefone vira candidata a peça.

E o que a rodada do `TopBar` deixou:

- **O título do desktop tem 5 grafias do mesmo `<h1>`** —
  `truncate text-base font-medium leading-none` em `page-title.tsx` (2×),
  `breadcrumb.tsx` (2×) e `dashboard-category-subroute-title.tsx`, que é quase
  uma cópia do `AppBreadcrumbNav`. O `TopBarTitle` do telefone é
  `font-semibold leading-tight`. As duas medidas continuam valendo, cada uma no
  seu ramo; decidir uma é decisão de produto.
- **Os 56px da barra ainda estão cravados em dois lugares fora dela**:
  `sonner.tsx:63` (área segura + `4.5rem`) e o `top-14` /
  `h-[calc(100dvh-3.5rem)]` da coluna do catálogo em `ds-shell.tsx`.
- **A barra do app mora dentro do `<main>`** (o `SidebarInset`), então não é o
  landmark `banner`. Tirá-la de lá é mudança de estrutura da casca.
- **As quatro telas de entrada** repetem o mesmo invólucro (`flex min-h-svh
  flex-col items-center justify-center gap-6 bg-muted p-6 md:p-10` + a coluna
  `max-w-sm` + a marca). A versão "Marca" do `TopBar` é a forma delas se um dia
  precisarem de barra; hoje o que falta é um invólucro, não uma barra.
- **O `Safari` não foi medido.** O vidro rolado e a escuta em captura foram
  verificados no Chromium do painel.

E o que a rodada da `BottomBar` deixou:

- **Não verificado logado**: a barra real do app, o empate do `Dialog` com a
  barra em `--z-modal` (50, decisão registrada; hoje o diálogo vence por ordem de
  DOM) e o crossfade do slot da conta.
- **Os itens do popover da conta medem 40px** (`h-10` em
  `mobile-glass-surface.ts`), abaixo dos 44 da Fundação `mobile-toque`. O menu do
  FAB acerta com `h-11`.
- **`useMatchMedia` local** em `mobile-account-menu.tsx`, duplicando o
  `useIsMobile` de `hooks/use-mobile.tsx`.
- **Duas noções de "ativo"** para a mesma lista: a `Sidebar` em igualdade
  (`isExactPath`), o telefone em prefixo. Em `/categories/abc` a aba acende e o
  item da barra lateral não.
- **Cinco cópias de `useIsomorphicLayoutEffect`** (`tabs`, `carousel`,
  `navigation-menu`, `sidebar`, `bottom-bar`).
- **Seis bases somadas a `safe-area-inset-bottom`** pelo app, e nenhuma lê
  `--bottom-bar-pad`.
- **`lib/glass-classes.ts` afirma que `--glass-sheen` não tem produtor**; tem três
  (`tabs`, `theme-toggle`, `sidebar`).
- **O avatar do slot da conta é `<img>` cru** com `eslint-disable`, e o `Avatar`
  existe.
- **`ACCOUNT_MENU_WORKSPACE_LINK_ITEMS` repete `MEMBERS_NAV_ITEM` e
  `SETTINGS_NAV_ITEM`** com outro formato de tipo, e `/wallets` tem página e título
  mas não está em `ROUTES` nem em navegação nenhuma.
- **`src/components/ui/empty.tsx`, não rastreado, reprova a asserção 1 do
  `taxonomy.test.ts`** — trabalho em andamento de outra frente.

### A migração do backlog, e o que ela deixou (PR #7)

As fases M1 a M10 do plano 3 correram sobre este backlog. O auditor foi de
**540 para 354 achados**, e cinco regras zeraram: **A**, **D**, **D3**, **H** e
**I**. O que sobra é **C** 41 · **C'** 5 · **D2** 306 · **G** 2 — e os dois
últimos do **G** são o falso positivo já registrado aqui (o `ColorTile
size="lg"` aplica `size-5`, e o `size` daquele sítio é decidido em tempo de
execução).

**O que zerou, em contagem:** a string do painel nos cartões (61), as larguras
cruas do `DropdownMenuContent` (19), os itens destrutivos à mão (13), os avisos
tonais à mão (18), a formatação fora dos helpers (41), os `hover:` sem par
(66), os ícones no conjunto errado (42 dos 44), as cores literais (14), os
componentes nascendo em `src/app/` (4), os corpos roláveis à mão (28), os
`dialogFooterClass` (14), as faixas opacas `border-t bg-background` (12), os
`role="toolbar"` sem foco itinerante (4) e o último `toast` cru do sonner.

**O que a segunda passada pagou (PR #7, N1 a N10).** Os itens que a primeira
passada deixou abertos foram todos atacados, e desta vez **logado**: o dono
entrou no painel do navegador contra o Supabase local, e cada fase mediu as
telas que tocou, antes e depois, a 1280px e a 375px — quando não dava para ter
o antes na mesma sessão, pelo `git stash`. O auditor foi de **354 para 312**; C'
zerou; C foi de 41 para **9, todos com o motivo escrito no sítio**.

- ~~54 `<Label htmlFor>` à mão~~ → **0** (N7). Sobram 3 `FieldLabel htmlFor`, de
  propósito: gatilhos com `id` fixo que o componente não repassa
  (`subscription-category-picker`, `tx-category`, `tx-credit-card`). Todo `id`
  que existia continua — a lição do `37543c1`, em que a primeira passada
  apagou os `id` dos formulários de entrada e só a E2E pegou.
- ~~41 primitivos crus~~ → **9** (N9). Os que ficam: as áreas clicáveis dos
  cartões de conta e da notificação (o cartão ou a linha tem ações irmãs, e
  botão dentro de botão é inválido), as células do calendário (são a grade),
  as linhas do seletor de carteira (itens de menu fora de um `Menu`), o
  `global-error` (substitui o layout raiz) e o `input type="color"` nativo.
- ~~5 C'~~ → **0**: `fieldset` → `FieldSet`, `details` → `Collapsible`, e o
  auditor passou a tratar os dois como primitivo **com** peça.
- ~~4 `role="tablist"` à mão~~ → **0** (N3), como `Tabs` — decisão do dono.
  A bandeja de atalhos de período fica à mão, com motivo: é grupo de
  alternância com `aria-pressed`, não escolha entre visões.
- ~~42 blocos `muted`~~ → **14: 8 à mão com o motivo escrito e 6 cópias em
  esqueleto** (N8), cada um no
  componente da forma que tinha: `Alert`, `EmptyState`, `Card variant="muted"`,
  `FieldSet`, `DescriptionList` (rótulo + valor dentro de cartão — a moldura
  interna sai), `Item` e descrição de campo. Ficam os poços de rolagem (o
  `overflow-hidden` do `Card` recorta a rolagem), a face do cartão de crédito,
  o aviso que ocupa o lugar do seletor de data e a linha de preferência de
  notificação (é um `Field`, e a caixa é a linha dele).
- ~~16 cabeçalhos de diálogo~~ → **0** (N5). Medido: em nove diálogos o recuo
  à mão já era **morto** — o `DialogHeader` aplica o seu por
  `group-data-[layout=fixed]`, mais específico. Mudaram de verdade a conta a
  pagar (título 18 → 16px) e a folha de filtros das contas, que tinha o dobro
  do recuo (32px) por um `px-4` somado ao da peça.
- ~~14 `md:h-8`~~ → **0** (N1).
- ~~Seletor de período com dois `DatePicker`~~ → `DatePicker mode="range"` (N4).
  Medir o calendário achou um defeito anterior: a folha de filtros não avisava
  o pai quando abria pelo botão, e a cada duas datas escolhidas uma era
  apagada logo depois do `onChange`.
- **Sobras que não estavam registradas**, pagas: 22 seções em `PageSection`
  (N6 — o título passou a 16px semibold, por decisão, e o `PageSectionHeader`
  virou grade para reservar a altura da ação, que vazava 8px no telefone); 2
  tabelas em `TablePanel` (N10 — a barra de seleção sai de dentro da moldura
  para cima dela); 3 buscas em `SearchInput` (N1); o `LegendStrip` (N2).

**O auditor aprendeu três coisas nesta passada**, e cada uma foi medida contra
um caso que ela errava: o filho direto de um componente com `asChild` não é
cru (exceto sob `*Trigger`, `*Close` e `*Anchor`, que só repassam
comportamento — sem essa ressalva a célula do calendário sumia da contagem);
`fieldset`/`details`/`summary` têm peça; e no catálogo a prosa das props
`description` e `title` é citação, como o `code={…}`.

**O que continua aberto, com o número de hoje:**

- **D2 (301 valores arbitrários) segue fora por decisão** — quase todos são
  largura de esqueleto casando com o conteúdo real.
- **G 2** — o falso positivo já registrado (`ColorTile size="lg"`).
- **Três `<img>` crus**, com o motivo escrito (16px e 80px fora da escada do
  `Avatar`).
- **O `FormPickerPopoverSearch`** ainda reimplementa o que o `SearchInput` faz.
- **Não medido logado, por ambiente e não por escolha:** o assistente de
  categorias (só aparece sem categorias), os avisos de membros e de carteira
  (só sem permissão ou sem carteira), os vazios de cartão (só sem cartão), a
  lista de sessões (a edge `sessions` não está servida localmente e responde
  503), a pílula do menu da fatura e o "Tentar novamente" do seletor de
  carteira (só em erro). Nesses sítios o que sustenta a troca é o compilador,
  os 604 testes e a mesma receita dos sítios medidos.

Reproduza a qualquer momento com `npm run ds:audit`.

### Rodada 83 — a marca vira preta, e a cor vira arco-íris

**O pedido.** Trocar o branding sem trocar componentes nem fontes: marca
preta (branca no escuro), e um arco-íris neon com grão pesado como acento —
referências ClickUp Brain, Neon Rainbow Button, AIG e uma imagem de campo
granulado com pilha de cartões escuros à frente. Decisões fechadas com o
dono antes de escrever: o verde sai de **tudo**; o wordmark é preenchido
pelo arco-íris em todo tamanho (o halo borrado atrás da letra sólida nos
degraus pequenos foi tentado duas vezes e rejeitado pelo dono na tela: lia
como desregistro de cor); o degradê respira só nos momentos grandes; o campo de marca vira um cartão com os mockups do produto na frente;
o botão ganha `variant="brand"` opt-in; o `link` sublinha sempre e o traço
vira arco-íris no cursor. A paleta começou com sete paradas do espectro
inteiro e o dono a devolveu na tela: "bandeira". Ficou a do ClickUp — azul,
violeta, magenta, âmbar — com o coral no meio e sem verde, cinco matizes;
depois, "o azul mais presente": duas paradas de azul e um quarto da rampa.
E "remova o grain da logo": `brand-rainbow` ficou só com o degradê — num
traço de poucos pixels o grão lia como sujeira —, e o grão é só do campo.

**A página de cores e o catálogo vieram depois, e revelaram um buraco.** O
`ds:catalog` não tinha balde para `--brand-*`: o degradê sumia do relatório
e ninguém cobraria par. As seis paradas viraram tokens (`--brand-blue` …
`--brand-amber`) que o degradê lê, porque a página só mede o que é cor
resolvida e o catálogo só cobra par do que é cor — um degradê não é nem uma
coisa nem outra. A página ganhou o grupo "Marca" (faixa, campo com grão,
rampa e os seis ladrilhos), a nota do primário parou de dizer que "no escuro
nenhum valor atende os dois", e `--chart-1` saiu do verde 166 da marca antiga
para o matiz 152 de `success`, por decisão do dono — a nota da rampa registra
a exceção.

**O avatar fala a língua da marca.** As seis identidades eram matizes a 60°
escolhidos para caber abaixo do croma do verde; viraram os seis matizes das
paradas do arco-íris, em ordem de matiz (coral, âmbar, azul, índigo, violeta,
magenta) para a dobra proporcional de `identityToneFor` continuar fazendo
sentido. **Só o matiz vem da parada**: luminosidade 0,52 no claro (a que já
mediu 5,14:1 com a tinta) e croma 0,14, no piso de `success` e longe do 0,245
de `destructive` — coral e âmbar se separam dos status vizinhos pelo croma e
pela luz. Medido nas seis: tinta 4,89–5,72 (claro) e 6,33–6,78 (escuro),
pastilha contra a placa flutuante 4,61–5,44 no claro. O par invertido, a
superfície opaca e o vidro ficaram como estavam;
`GLASS_IDENTITY_TONES` lê os tokens e acompanhou. E o `Avatar` ganhou
`brand`: 2px de arco-íris **por dentro** da caixa (a escala de 8 em 8 não
muda, o `overflow-hidden` não recorta um `inset-0`), na receita do
`::before` do botão, só para a pessoa logada — barra lateral, menu de conta
e barra de baixo. Ignorado em `glass`, que já tem aro. Os dois espécimes do
catálogo que escreviam `bg-identity-N-surface` à mão (avatar, hover-card)
passaram a `IDENTITY_TONES[i]`, que é o que a própria página manda.

**E então o dono simplificou: duas versões só.** Foto, ou iniciais brancas
sobre um **degradê de marca** — seis degradês (pares de paradas do arco-íris,
interpolados em oklch para o meio não cair no cinza do sRGB). A primeira
versão era saturada (0,5 de luminosidade) com letra branca, e o dono a
devolveu na tela: "feio". A referência é um chip pastel difuso com grão e
texto escuro sobre preto — as pontas subiram para 0,82 e 0,11 de croma, a
tinta virou escura, entrou um grão fino próprio (`--identity-grain`, 35%,
em `overlay` por um `::before`), e o valor é um só nos dois temas. Depois,
"mais cores num avatar só": os pares viraram misturas de três e quatro
paradas, cada identidade com a sua ordem e o seu ângulo (135°, 45°, 160°,
20°, 110°, 200°) — as mesmas cores, misturadas diferente, é o que distingue
seis pessoas sem dar a nenhuma "uma cor". Os dois `bg-size-[…]` que o
auditor acusou viraram tokens (`--identity-drift-size`,
`--identity-grain-size`). Saíram o
modo `glass` (e `GLASS_IDENTITY_TONES`), o `identity` numérico, o anel
`brand` da rodada anterior e o par invertido entre temas: uma receita só, nos
dois. O degradê é pintado a 160% da caixa e desliza no cursor e no toque
(`background-position`, com o par `active:` da regra H). Os consumidores
não mudaram: `IDENTITY_TONES[i]` continua `{ surface, ink }`, e o fallback
veste a primeira identidade por padrão para nunca haver iniciais sobre cinza.

**Os tokens.** `--primary` é a tecla preta (`0.205`) no claro e a tecla branca
(`0.985`) no escuro, com o rótulo invertendo junto. A mecânica da rodada 78
ficou: `hover` puxa na direção do rótulo nos dois temas, `edge` abaixo do
`hover`, e `button-primary.test.ts` continuou verde sem uma linha mudada. O
fio de luz do topo é `transparent` no escuro — luz branca sobre tecla branca
não desenha nada, e o comentário da 78 já autorizava. `--primary-accent`,
`--ring`, `--sidebar-ring` e os `-muted` viraram neutros; `--chart-1` ficou no
matiz 166 por ser cor de série, não de marca (invariante 4).

**O arco-íris é um token de degradê**, `--brand-rainbow`, com as mesmas cinco
matizes nos dois temas e luminosidade por tema, e um `@property --brand-angle`
— o primeiro do arquivo — porque só variável tipada interpola. **Cônico foi
rejeitado na tela**: a partir do centro ele lê como roda de cores, um gráfico
de pizza; o linear a 135° mais o ângulo é o que as referências chamam de neon.
A parada de fecho repete a primeira para o giro não ter emenda.

**O campo de marca não redefine token nenhum, e isso custou uma medição.** A
primeira versão herdou do campo verde o `--foreground` redefinido no
contêiner, e o saldo dentro do `Card` hospedado saiu **branco sobre o cartão
branco** — `MoneyDisplay` é `text-foreground`, e o override desceu pelo
cartão. A utility declara só `color`, que o wordmark herda por `currentColor`
(a classe de cor saiu do `AppWordmark` e do `AppLogo` por isso: a marca é
tinta), e o fio é `box-shadow` interno para não chegar à borda dos cartões.
`--brand-field-muted-foreground` deixou de existir: nenhum texto corrido mora
sobre sete matizes.

**O grão não existia, e o σ provou.** Escrito como `vinheta, arco-íris, grão`,
o grão era a camada de baixo — `overlay` sobre a cor preta é preto, e o
arco-íris opaco pintava por cima. O método antigo (σ da luminância crua) não
teria visto: o degradê varia ~15 unidades ao longo do retalho e deu **15,26
com e sem grão**. O método novo é o σ da **diferença entre pixels vizinhos**
(`scripts/brand-grain-ab.mjs`, que substitui o `grain-ab.mjs` solto na raiz):
sem grão 0,64; com a ordem corrigida e o token final (`baseFrequency` 0,75,
`slope` 1, alfa 0,85/0,75) **6,94 no claro e 8,70 no escuro** sobre a paleta
de cinco paradas; alfa 1 deu 11,28/9,21 sobre a de sete e foi rejeitado por
ler como ruído de sinal.

**O botão `brand` não pinta o próprio fundo.** Numa raiz de empilhamento o
fundo do elemento pinta antes dos filhos de `z` negativo, então um
`bg-primary` no botão cobriria o contorno. O preenchimento **e** o contorno
vivem no `::before` (preto em `padding-box` sobre o arco-íris em `border-box`,
com 1px de borda transparente entre os dois), o halo no `::after`, e o hover
troca a variável que o pseudo lê. O `link` ganhou sublinhado fixo, e o traço
do cursor é um `background` de 1px recortado à caixa de conteúdo — decoração
não aceita degradê —, com o par `active:` que a regra H cobra.

**Fallout:** `button-touch-response.test.ts` (o teste 4 descrevia o `link`
antigo), assertiva 9 nova em `button-primary.test.ts`, as páginas `brand`,
`button` e `colors` do catálogo, o `AGENTS.md` e o contrato de direção das
telas de acesso. Nenhuma rota, nenhuma jornada.

### Rodada 84 — o verde volta ao arco-íris, nas duas pontas

**O pedido.** "Uma ou duas cores a mais no degradê, por exemplo verde." A
rodada 83 tinha fechado o contrário — o verde saía de tudo, e a versão de
sete paradas com lima e ciano-verde foi devolvida como "bandeira" —, então a
primeira coisa foi dizer isso ao dono e perguntar. Três decisões antes de
tocar em token: **ver antes de escolher o matiz**, porque `success`,
`income` e `chart-1` são verdes de estado (152) e o risco real era a marca
virar a cor de um chip; **duas paradas, uma em cada ponta** — teal antes do
azul e verde depois do âmbar; e **as misturas de identidade entram junto**.

**O comparativo não foi no catálogo.** A faixa da página `colors` gira e mede
poucos pixels, e o dono devolveu a primeira captura: "num objeto pequeno não
consigo ter noção". O que decidiu foi uma página descartável no scratchpad
com as três candidatas em faixas de largura cheia, o campo com grão ao lado,
os chips `Pago`/`Aberta`/`+ R$` de estado à direita e as três misturas de
avatar que mudam embaixo, nos dois temas — rasterizada com o Playwright que o
projeto já tem, porque o painel do app não renderiza `file://` (o `<script>`
não roda, e o `url("data:…")` do grão dentro de `style="…"` quebra o atributo
até virar `&quot;`). As candidatas: **A** menta 165 (afastada do estado),
**B** o próprio 152, **C** lima 130. O dono escolheu a **lima**, e manteve o
verde como acento de ponta (âmbar 82% → lima 100%) em vez de um quarto da
rampa.

**Os tokens.** `--brand-teal` (0,72/0,13/195 no claro, 0,82/0,12/195 no
escuro) e `--brand-green` (0,78/0,18/130 e 0,88/0,18/130), nos dois temas,
seguindo a régua das vizinhas: claro um degrau abaixo, escuro um acima. A
rampa passou a oito paradas — teal 0, azul 14, índigo 32, violeta 46, magenta
58, coral 70, âmbar 82, lima 100 — e a família do azul ficou com o primeiro
terço, que era o "azul mais presente" da 83. O `ds:catalog` agrupa por
prefixo e cobra par por valor, então as duas entraram no grupo **marca** sem
uma linha de script. **A regra escrita mudou**: "sem verde" virou "o verde
da marca não é o verde de estado" — a lima está 22° acima do 152, mais
clara e mais saturada, e um chip `Pago` ao lado da faixa não lê como a mesma
cor.

**Três misturas trocaram de família.** `identity-3` virou âmbar→lima→teal
(160°), `identity-5` teal→azul→índigo→magenta (110°) e `identity-6`
coral→âmbar→lima→azul (200°); 1, 2 e 4 ficaram. Mesma receita (0,82 de
luminosidade, 0,11 de croma, `in oklch`, arcos curtos crescentes). O pastel
verde fica perto de `--income-muted` e foi olhado ao lado do chip de entrada
no comparativo — distingue, porque o avatar é degradê e o chip é chapado.
`IDENTITY_TONES` e `identityToneFor` não mudaram: seis entradas, dobra pelo
comprimento.

**O grão remedido.** `scripts/brand-grain-ab.mjs` sobre a paleta de oito
paradas: **9,58 no claro e 9,82 no escuro** (eram 6,94 e 8,70 sobre cinco).
O token do grão não mudou; a lima e o teal são as paradas mais claras e o
`overlay` rende mais sobre elas. Sem grão, 0,63/0,61.

**Fallout:** `colors`, `brand` e `avatar` do catálogo (rampa, ladrilhos e a
prosa das misturas), o `AGENTS.md`, os comentários do `globals.css`. Nenhum
componente, nenhum teste, nenhuma rota — `button-primary.test.ts` e
`button-touch-response.test.ts` afirmam o nome `--brand-rainbow`, não os
valores, e continuaram verdes.

### Rodada 85 — o avatar mostrava duas cores prometendo quatro, e o quadrado saiu

**O pedido.** "No avatar os degradês devem ter entre 3 a 4 cores, e remova a
versão quadrada."

**A primeira metade parecia já estar feita, e não estava.** As seis misturas
declaravam três ou quatro paradas — a documentação dizia isso, o token dizia
isso. Na tela, não. **O que a medição achou foi o recorte**: o fallback pinta
o degradê a `--identity-drift-size` (160% da caixa) ancorado no canto de
cima, então no repouso o avatar mostra 1/1,6 do degradê — e como a rampa é
diagonal, os extremos caem nos cantos, que quase não têm área. Medido com o
Playwright, amostrando os pixels do próprio elemento e contando o span de
matiz visível contra o declarado:

    identity-1   45° de 110       identity-4   93° de 183
    identity-2   31° de 110       identity-5   **20° de 140**
    identity-3   45° de 110       identity-6   47° de 190

Uma varredura de recortes (160 · 140 · 125 · 110 · 100%) mostrou onde a curva
vira: **125%** recupera a maior parte da cor e ainda deixa um quarto da caixa
de deslocamento no cursor — 10px num avatar de 40, que era o ponto do
movimento. A 110% o degradê aparece quase inteiro e o deslize vira 4px, que
não se vê.

**A segunda causa era a distância entre as paradas.** As misturas da rodada 84
encadeavam vizinhas do arco-íris — `identity-5` era teal→azul→índigo→magenta,
e teal, azul e índigo são três azuis a 30° um do outro. Duas paradas a 30° não
leem como duas cores; leem como um degradê de uma. As seis foram redesenhadas
com **quatro paradas e saltos em torno de 90°**: coral→lima→azul→violeta
(135°), âmbar→teal→índigo→magenta (45°), lima→azul→magenta→coral (160°),
teal→violeta→coral→âmbar (20°), azul→magenta→âmbar→lima (110°),
índigo→coral→lima→teal (200°). Cada matiz aparece em duas das seis, então
ninguém é dono de uma cor — a regra da 83 continua valendo. Todas as pernas
andam menos de 180°, que é o que mantém o `shorter hue` do `in oklch` indo na
direção pretendida.

Remedido depois das duas mudanças: **66° a 173° de span visível**, contra os
20° a 47° de antes.

**O quadrado saiu.** `shape="rounded"` existia porque o produto desenhava
avatar de canto arredondado e o catálogo desenhava círculo, e o prop foi a
maneira de dizer a divergência em vez de bifurcá-la. O dono resolveu a
divergência: retrato é redondo. O canto arredondado fica com o `ColorTile` e
a marca de workspace, que identificam **coisa** e não pessoa — e era
justamente o avatar compartilhando a progressão de raio do `ColorTile` que
apagava a diferença entre as duas numa lista. Saíram a variante, os cinco
compostos de raio, o `data-shape` e as sete chamadas com `shape="rounded"`
(conta, membros, barra de baixo, menu de conta, lateral, e as páginas
`sidebar` e `top-bar` do catálogo); `rounded-full` subiu para a base do `cva`.

**Fallout:** `avatar.tsx`, `globals.css`, a página `avatar` do catálogo (a
seção "Forma" e a nota do raio saíram, a fileira das seis deixou de varrer
duas formas), a prosa do `color-tile` e do `timeline` que citavam o prop, e o
`AGENTS.md`. Nenhum teste mudou — nenhum afirmava `shape`. Nenhuma rota,
nenhuma jornada.

### Rodada 86 — o degradê do avatar gira, e o `var()` no `:root` não obedece ao elemento

**O pedido.** "A animação do hover: mantenha as mesmas cores, porém movimente
elas, para que a animação seja as cores se movimentando internamente, não
trocando totalmente o degradê." E: tire o cursor de texto de cima das
iniciais.

**A primeira tentativa foi a óbvia, e ela falhou calada.** O arco-íris já tem
o mecanismo: `@property --brand-angle` somado ao ângulo do `linear-gradient()`.
Copiei isso para a identidade — `@property --identity-angle`, cada mistura
virando `calc(var(--identity-angle) + 160deg) in oklch`, e o fallback
transicionando a variável no `hover:`. A variável interpolou perfeitamente
(medido: 0 → 94,8 → 115,8 → 120°), e **o degradê não se mexeu um pixel**:
`backgroundImage` computado seguia em `160deg`, e o diff das capturas deu
**zero pixels diferentes**.

**A causa é do CSS, e vale para todo token deste projeto.** Um `var()` dentro
de um custom property é substituído **onde o property é declarado**, não onde
é usado. `--identity-3` mora no `:root`, então `var(--identity-angle)` resolve
contra o `:root` — que tem o valor inicial, 0deg — e o resultado já vai
substituído para quem herda. Mexer na variável no elemento não desfaz a
substituição. Testado nos dois modos de registro, `inherits: true` e `false`:
mesmo resultado.

**E isso expôs um bug antigo: a rotação do arco-íris da marca nunca
funcionou.** `--brand-rainbow` é declarado no `:root` e lê `var(--brand-angle)`
— exatamente o mesmo arranjo. Medido na página `/designsystem/brand`, no
elemento com `brand-rainbow-live`: `--brand-angle` andando de 53,76° para
129,05° enquanto o `background-image` computado ficava cravado em
`linear-gradient(135deg`. A animação de 12 s roda desde a rodada 83 sem
desenhar nada. **Fica registrado e não foi consertado nesta rodada** — é outro
componente e outro pedido. O conserto é o mesmo daqui: o `linear-gradient()`
tem de ser declarado no elemento (uma `@utility`), não num token do `:root`.

**O conserto: quem gira é a camada, não o ângulo.** O degradê saiu do
`background` do fallback e foi para um `::before` de `inset-0`, que roda **meia
volta** no `hover:` e no `active:`; o grão desceu para o `::after`. Girar o fundo do
próprio fallback levaria as iniciais junto, e por isso a camada é separada.
Numa caixa redonda isso nunca descobre canto: o círculo inscrito num quadrado
continua coberto em qualquer ângulo — e o avatar é redondo sempre desde a
rodada 85. Medido depois: **o conjunto de matizes é idêntico** no repouso e no
cursor, e **71,4% dos pixels mudam de lugar**. As mesmas cores, se movendo.

**`IDENTITY_TONES[i].surface` passou a declarar uma variável** —
`[--identity-surface:var(--identity-N)]` em vez de `bg-(image:--identity-N)` —,
porque quem pinta agora é o pseudo-elemento. As 12 chamadas do projeto
continuam iguais: o par sempre foi usado em `AvatarFallback` e em nenhum outro
lugar. `IdentityDiscs`, no catálogo, pinta `var(--identity-N)` por estilo
inline e não mudou — os tokens continuam degradês fixos e pintáveis.

**O cursor de texto.** As iniciais são texto, então `cursor: auto` resolvia
para `text` em cima delas. O conserto é `select-none` na raiz do `Avatar`:
pela CSS UI 4, `auto` só vira `text` onde a seleção é permitida. Não declarar
`cursor` é o que importa — um `cursor: default` ali quebraria o ponteiro do
avatar dentro de um botão. Verificado: o fallback computa `cursor: auto`
sozinho e `pointer` dentro de um pai clicável. As duas chamadas que escreviam
`select-none` à mão (lateral e membros) perderam a razão e saíram.

**Também saiu `--identity-drift-size`.** Ele existia para o degradê ser maior
que a caixa e poder deslizar; sem deslize, o degradê cabe na caixa inteira,
que é o que mostra a faixa de matiz mais larga.

**A curva enfática estava errada aqui, e o dono viu antes de mim.** A primeira
versão do giro usava `--ease-out` — `cubic-bezier(0.16, 1, 0.3, 1)` —, e ele
devolveu: "a transição deve ser linear, não instantânea; se o azul está num
canto, ele deve se mover para o outro canto". Medido na camada: a curva cobria
**69% do giro nos primeiros 50ms** dos 300, ou seja, um salto seguido de uma
acomodação que ninguém vê. Com `linear` os quadros ficam iguais — 0, 30, 65,
95, 130, 160, 180 —, e o giro subiu de 120° para meia volta, para a cor
chegar de fato ao canto oposto. **A régua que fica: a curva enfática é para o
que *chega* (uma folha abrindo, um diálogo entrando), e não para o que
*percorre*.** Onde o movimento é o conteúdo da animação, velocidade constante.

**Fallout:** `avatar.tsx`, `lib/avatar.ts`, `globals.css`, a página `avatar` do
catálogo e o `AGENTS.md`. Nenhum teste mudou, nenhuma rota, nenhuma jornada.

### Rodada 87 — o avatar vira esfera, e a luz é que viaja

**O pedido, em três mensagens.** Uma referência: três círculos que leem como
esferas — menta→verde→azul, pêssego→laranja→vermelho,
quase-branco→periwinkle→violeta —, "mais circulares, com sombras e efeito
levemente 3D". Depois: "pode mudar para cores do mesmo tom para fazer os
degradês" e "cria os degradês muito parecidos com essa referência". Por fim:
"talvez para animação você possa fazer com que o ponto de luz que tem dentro
se mova no hover".

**Isso inverte duas decisões, e a inversão foi posta na mesa antes.** A rodada
85 espaçou os matizes a ~90° porque vizinhas a 30° leem como uma cor só; a
rodada 83 fechou que ninguém é dono de uma cor. A referência faz o oposto nas
duas: **a riqueza vem da rampa de luz, não do salto de matiz**, e cada círculo
é uma família só. Perguntado com o custo escrito, o dono escolheu a
referência. Também escolheu que **só a luz se move** (a tinta fica parada) e
que **não há sombra externa** — o 3D vem da rampa e do brilho.

**Duas versões erradas antes da certa, e as duas pelo mesmo motivo.** A
primeira saiu com o núcleo claro a 0,95 no meio, a ponta a 0,57 na borda e um
especular duro: "as esferas estão bem distantes da referência, elas estão
muito efeito 3D". **Bola de bilhar tem duas assinaturas — limbo escuro e
ponto de luz pequeno e forte —, e eram exatamente as duas.** A segunda
achatou a rampa para 0,92 → 0,73 e alargou a luz, e ainda estava errada:
"ficou horrível". **O erro comum às duas era de topologia, não de grau** —
as duas punham o claro no **meio** e o escuro na **borda**, e a referência faz
o contrário. Ela é uma mancha de cor borrada dentro de um círculo que desbota
para quase branco na ponta mais distante dela: *"deixe exatamente igual à
referência, com a claridade maior nas bordas e só um ponto de luz nas cores"*.
A rampa foi invertida — 0,68–0,76 no ponto de cor, 0,95 na borda —, a âncora
foi para 58% 66% e a luz virou um ponto pequeno outra vez (44% da caixa, pico
0,55), agora sobre uma base que não tem limbo escuro para ele denunciar.

**As seis manchas.** Cada `--identity-N` é um `radial-gradient` de três
paradas ancorado em 58% 66%, em `farthest-side` — sem ele a última parada
cairia fora do disco e a borda clara nunca pintaria; com ele a borda longe da
mancha fecha no quase-branco e a borda perto dela continua colorida, que é o
que a referência mostra. As famílias são ember, gold, grove, ocean, iris e
bloom; quem identifica a pessoa é o **ponto de cor** (35, 82, 200, 255, 295,
340), de 40° a 118° um do outro, e cada família anda 25° a 50° dali até a
borda. **Nenhuma parada encosta na parede do sRGB** — medido repintando cada
uma com croma ×1,08. Um detalhe do método que custou uma medição: gamut por
`getComputedStyle` **não funciona**, porque ele devolve `oklch()` de volta e a
comparação vira entrada contra entrada — a primeira leitura acusou 18 de 18
clipando, o que é absurdo. Só rasterizar por canvas responde, que é a mesma
lição do `createColorCompositor()`.

**O grão nasceu, engordou e morreu na mesma rodada.** Ele era fino (0,9 de
frequência, 35%) e quase invisível; o dono pediu "grãos bem grandes, efeito
mais de pintura", e um A/B na tela varreu 0,9, 0,5, 0,3, 0,18 e 0,1 mais o
número de oitavas, fechando em 0,22 · 2 oitavas · 60% — em `feTurbulence` a
frequência é o inverso do tamanho do grão, uma oitava só dá mancha lisa e três
voltam a parecer ruído de sensor. Na mesma rodada, junto com a inversão da
rampa, o dono pediu para tirar. Saíram `--identity-grain`,
`--identity-grain-size` e a camada `::after` do fallback. **Fica registrado
porque o A/B é reaproveitável**: quem for repor grão aqui já tem a escada
medida.

**O mecanismo do ponto de luz.** O `::before` empilha `--identity-spec` (um
ponto branco a 44% da caixa) sobre a mancha em `cover`, com um
`background-position` só para as duas. **Só o ponto obedece**, e isso é
aritmética: uma camada em `cover` ocupa exatamente a área de posicionamento,
então `(área − imagem) × porcentagem = 0`. Medido em Chromium, amostrando
pixel. **Vale só para porcentagem** — um offset em `px` moveria a camada
`cover` junto.

**O movimento no cursor existiu e saiu.** O ponto viajava de `0% 0%` a
`100% 100%` em curva `linear` — o `--ease-out` da casa cobria 69% do percurso
nos primeiros 50ms dos 300 e lia como salto, que é a medição da rodada 86 se
repetindo. O dono pediu para remover, e com o movimento saíram o par
`hover:`/`active:` e o `transition-[background-position]`. **Essa classe era
carga estrutural**, e fica registrada para quem for repor: o projeto
sobrescreve a lista padrão de transição do Tailwind e `background-position` não
está nela, então sem ela o ponto salta. Vale registrar também por que aquele
deslocamento era legítimo, já que a rodada 86 rejeitara a jogada — lá quem se
deslocava era a camada **colorida**, e o que entrava na tela era outra fatia de
cor; aqui era a **branca**, que não tira nem põe cor nenhuma.

**Parado, a posição virou uma decisão própria.** `0% 0%` deixa o ponto sobre a
borda clara, onde ele some; de `36% 40%` em diante ele começa a lavar as
letras. Comparadas as quatro na tela, ficou **`25% 28%`**: o ponto sobre a cor,
acima e à esquerda da mancha. **Só o
brilho viaja**, e isso é aritmética: uma camada em `cover` ocupa exatamente a
área de posicionamento, então `(área − imagem) × porcentagem = 0` para
qualquer porcentagem. Medido em Chromium, amostrando pixel — a camada `cover` a
0% e a 100% devolve a mesma imagem, e no meio da transição a lista computada é
`56,1% 56,7%, 50% 50%`: a primeira anda, a segunda fica. **Duas ressalvas:**
vale só para porcentagem (um offset em `px` move a camada `cover` também), e
a rodada 86 rejeitou exatamente esta jogada — com uma diferença que é tudo,
**lá quem se deslocava era a camada colorida, aqui é a branca**. Mover o
degradê traz outra fatia de cor para a tela; mover a luz por cima dele não
tira nem põe cor nenhuma.

**O contraste virou script.** `scripts/identity-contrast.mjs`, no molde do
`brand-grain-ab.mjs`: clona o avatar real para cada família × tamanho, esconde
o texto, captura em repouso e sob o cursor, e pega o **pixel mais escuro** da
caixa onde as letras pousam. Amostra pixel em vez de compor analiticamente
porque `mix-blend-overlay` não é uma pilha `source-over` — o
`createColorCompositor()` da página de cores não modela o grão. Resultado nos
dois temas, 36 células: **pior caso 5,71:1** contra o piso AA de 4,5. Com a
rampa invertida a borda é a parte clara, então a restrição que a versão 3D
criou — não desenhar nada perto da borda do disco, onde a ponta escura dava
2,6:1 — deixou de existir.

**Duas armadilhas medidas no caminho.** `before:bg-size-[52%_52%,cover]`
reprova na regra D2 do auditor — o `\b` da regex casa `size-[` mesmo dentro de
`bg-size-[` —, e a forma com `var(--identity-spec-size)` passa limpa; é a mesma
razão de `--identity-grain-size` existir. E `transition-[background-position]`
é carga estrutural: o projeto sobrescreve a lista padrão de transição do
Tailwind, e `background-position` não está nela.

**O que ficou sem verificar:** o Safari do iOS. A conta do `cover` é
respaldada pela especificação e confirmada em Chromium, mas o app é PWA e essa
é a engine que não dá para errar. O simulador desta máquina não subiu — o
Xcode está instalado sem ter concluído a configuração inicial, o que exige
abrir o Xcode uma vez. Se lá a camada `cover` se mover, a esfera desliza sob o
brilho e o mecanismo falha visivelmente.

**E no fim o degradê foi apagado.** Antes disso houve um passo intermediário:
`AvatarFallback` ganhou `variant`, com `gradient` e `solid` convivendo, e o
valor do chapado saiu da **parada do meio** de cada mancha — a cor que ela
mostrava em maior área, e a luminosidade que já carregava a tinta escura sem
folga. O ponto de cor daria um disco visivelmente mais escuro que o degradê ao
lado; a borda daria seis discos quase brancos, indistinguíveis. Visto o par na
tela, o dono pediu para apagar o degradê.

**O que a remoção arrastou.** Os seis `--identity-N` deixaram de ser
`radial-gradient` e passaram a ser a cor do chapado; `--identity-spec` e
`--identity-spec-size` saíram, e com eles o `::before`, o `variant` e o `cva`
do fallback. **A indireção por `--identity-surface` saiu junto, e a razão é
bonita:** ela existia porque um degradê não cabe no `@theme inline` — sendo
cor, os tokens entram lá como `--color-identity-N` e a tela volta a escrever
`bg-identity-N`, que é a língua do resto do projeto. `IdentityDiscs`, no
catálogo, trocou `backgroundImage` por `backgroundColor` pela mesma razão.
`IDENTITY_TONES` continua com seis entradas e a forma `{ surface, ink }`; só o
conteúdo de `surface` encolheu.

O script de contraste voltou a uma superfície só: **36 células**, pior caso
**10,17:1** — o chapado é bem mais folgado que o degradê, que ficava em 5,71.

**Fica o registro de três medições que a remoção tornou inúteis hoje e úteis
amanhã**, todas nesta rodada: o A/B de grão (0,9 a 0,1 de frequência, e por que
duas oitavas), a conta de que uma camada em `background-size: cover` não se
desloca por porcentagem (o que permitia mover a luz sem mover a tinta), e a
razão de a claridade ter de ficar na borda e não no meio.

**Fallout:** `globals.css` (os seis tokens nos dois temas, mais
`--identity-spec`, `--identity-spec-size` e os seis `--identity-solid-N`, e o
bloco de comentário reescrito), `avatar.tsx`, `lib/avatar.ts`, as páginas
`avatar` e `colors` do catálogo, o `AGENTS.md` e o script novo. Nenhum teste mudou — nada no `src/`
afirma `--identity` ou `IDENTITY_TONES`. Nenhuma rota, nenhuma jornada.



### Rodada 88 — o arco-íris da marca gira de verdade, e o degradê desce do `:root`

**O pedido.** Consertar o que a rodada 86 registrou e deixou de pé:
`brand-rainbow-live` animava `--brand-angle` de 0 a 360° em 12s e o degradê
pintado nunca se mexia.

**A medição, refeita antes de tocar em nada.** Em
`/designsystem/colors`, no elemento com `brand-rainbow-live`: `--brand-angle`
andando de 0 a 212° enquanto `getComputedStyle(el).backgroundImage` ficava
cravado em `linear-gradient(135deg …)`. A animação rodava desde a rodada 83
sem desenhar nada: uma animação composta a cada frame para girar uma
variável que a pintura não lia.

**A causa é a da rodada 86, palavra por palavra.** Um `var()` dentro de uma
propriedade personalizada é substituído **onde ela é declarada**, e não onde
é usada. `--brand-rainbow` morava no `:root` e lia `var(--brand-angle)`: a
substituição acontecia no `:root`, contra o valor inicial de 0deg, e o que os
descendentes herdavam já era a string pronta. Animar a variável num
descendente não desfaz isso, com `inherits` em qualquer um dos dois valores.

**O conserto é o que a rodada 86 prescreveu: o `linear-gradient()` desce para
o elemento.** Ele mora agora em `@utility brand-rainbow-image`, que **só
declara a variável**, e quem pinta a veste. Escolhida contra a alternativa de
inliná-lo só na `brand-rainbow`, que consertaria o lockup e deixaria o campo
e o botão presos ao `:root` para sempre — e custaria uma terceira cópia da
lista de oito paradas.

**Quatro consumidores, e só um deles era óbvio.** `brand-rainbow` (fundo
próprio: lockup, símbolo, faixa do catálogo), `brand-field` (uma camada de
três) e o `Button` nas variantes `brand` **e** `link` — a segunda pinta um
sublinhado de 1px com o mesmo degradê, e passaria despercebida numa busca por
"brand". As duas do botão ganharam a classe no próprio elemento: um
pseudo-elemento herda o valor **já substituído** de quem o originou, então a
conta acontece no botão e o `::before` e o `::after` recebem o resultado. É por
isso que a classe **não é redundante** e não se apaga — o comentário em
`button.tsx` diz isso, porque ela parece sobrando.

**Saldo de linhas: negativo.** O degradê era escrito duas vezes, idêntico,
em `:root` e em `.dark` — a estrutura (ângulo e porcentagens) nunca variou
entre os temas, só as paradas, e elas já eram tokens por tema. As duas cópias
saíram e sobrou uma.

**O campo de marca fica parado, por decisão.** Desde que a composição desceu
para o elemento ele *pode* girar, e o dono escolheu deixá-lo quieto. O
comentário de `globals.css` prometia o contrário havia cinco rodadas — "a
marca respira nos momentos grandes (splash, campo de marca)" — enquanto
`brand-field` nunca declarou a animação. O texto foi corrigido em vez de a
promessa ser cumprida: **documentação que descreve o que o código faria é a
mesma dívida que o código que promete o que não faz.**

**Uma armadilha de medição, para quem for conferir.** O painel do navegador
estava escondido, e **documento escondido congela animação CSS**: a primeira
conferência na página `brand` saiu com `--brand-angle` em 0deg e
`animationPlayState` em `running`, que lia como regressão e não era. A prova
que não depende de visibilidade é dirigir o relógio: `el.getAnimations()[0]`
e `currentTime` em pontos escolhidos. Medido assim, `pintado = ângulo + 135deg`
em todos: 0→135, 90→225, 180→315, 270→405. Cuidado com um detalhe de
serialização: a 45° a soma dá exatamente 180deg, a direção padrão, e o CSS
**omite o ângulo** — o valor chegou, a string é que não o mostra.

**Fallout:** `globals.css` (as duas declarações removidas, a `@utility`
`brand-rainbow-image` nova, `@apply` em `brand-rainbow` e `brand-field`, e o
bloco de comentário reescrito), `button.tsx` (as variantes `brand` e `link`),
`avatar.tsx` (o comentário da rodada 86, que apontava o defeito como aberto),
e as páginas `brand` e `colors` do catálogo, que chamavam `--brand-rainbow` de
token do `:root`. **Nenhum teste mudou**: `button-primary.test.ts` e
`button-touch-response.test.ts` afirmam as strings `--brand-rainbow` e
`(image:--brand-rainbow)` nas variantes, e elas continuam lá — o que mudou foi
onde a variável é declarada, não como é lida. `glass.test.ts` fatia de
`@utility glass-material` até `no-scrollbar`, e a marca continua morando
depois. 617 testes, `tsc`, `lint` e `ds:catalog` verdes; o catálogo deixou de
listar `--brand-rainbow` entre os tokens de marca, que é o correto — ele não
é mais um.

### Rodada 89 — os chips acendem, ganham ícone e um ponto que pulsa

O dono revisou o `Badge` contra a marca nova e pediu cinco coisas de uma vez:
uma paleta menos apagada, ícones, uma versão com o arco-íris e o halo do
`Button`, a pílula escura com ponto de uma referência que ele enviou, e o ponto
em duas formas — pulsando e parado.

**A causa da paleta apagada estava escrita no próprio arquivo, três anos de
decisões atrás.** O comentário de `globals.css`, sobre os tokens de dinheiro:

> `/* Finance-only: stronger than generic success-muted (chips, badges, icon wells). */`

O projeto já tinha concluído que **chip pede tinta mais forte** — e aplicou a
conclusão só ao dinheiro, deixando estado para trás. O resultado, medido em
croma de superfície no tema claro: `income`/`expense` em 0,07 e 0,055,
`warning`/`destructive` em 0,04, `success`/`info` em 0,03, e `primary` — o tom
**padrão** do componente — em **0,00**, cinza puro. Para comparação, as cores de
identidade aprovadas na rodada 87 vivem em 0,10–0,12. Os chips de estado tinham
um terço da cor.

**Três colunas foram montadas e vistas antes de escolher.** HOJE · B · C, os
dois temas empilhados, com um `Alert` de cada tom ao lado do chip — porque é ele
o consumidor exposto: carrega parágrafo, e a tinta dele herda o tom a 85%.
**B venceu**: estado a 0,06–0,07, dinheiro a 0,105–0,11. O C, no nível da
identidade, ficou para o dia em que a marca pedir mais. O método é o da rodada
84 e está em [[comparativo-visual-por-playwright]]: HTML estático gerado por
Node, rasterizado pelo Playwright, faixas de largura cheia.

**O dinheiro subiu junto, e isso foi obrigação e não gosto.** Com
`destructive-muted` indo a 0,065 e `expense-muted` parado nos 0,055, o vermelho
de "falhou" passaria o vermelho de "saiu dinheiro" e a **invariante 3 se
inverteria**. A folga entre as duas famílias foi de ~0,03 para ~0,045 de croma,
mais um degrau de luminosidade: a distinção ficou mais legível, não menos.

**Só a superfície mudou.** Nenhuma tinta `-muted-foreground` se mexeu, porque é
ela que carrega o contraste — mexer nos dois lados ao mesmo tempo torna a
medição ilegível. `scripts/tone-contrast.mjs` é novo e mede as 24 células (6
tons × 2 temas × 2 usos). Todas passam; **o pior caso é 4,67:1**, o `Alert` de
`expense` no claro, com 0,17 de folga sobre o piso AA. É fina de propósito, e é
o que reprova primeiro se alguém subir mais — está escrito no `AGENTS.md`.

O método do script merece nota: ele mede **um retângulo sólido por célula, e o
pixel do centro dele**, em vez de amostrar a letra. Num bloco chapado não há
antisserrilhado, então o valor lido é a cor composta exata; os pixels de borda
de um glifo são a mistura dos dois e **superestimariam** o contraste. As cores
saem por canvas de 1×1, pela razão de sempre — `getComputedStyle` devolve
`oklch(...)`, e parsear aqueles números como RGB foi o que fez toda razão marcar
1,0 na primeira versão da página de cores.

**O ícone não era uma feature nova; era a invariante 1 violada sete vezes.**
`dashboard-kpi-cards` (2×), `category-detail-summary-section` (3×), o painel de
fatura e o `sync-status-chip` já desenhavam glifo dentro do chip à mão, cada um
com o seu `gap` e o seu corpo. A oitava, `bill-pending-card`, escrevia
`mr-1 inline` — **porque o `Badge` não declarava `gap` nenhum**, que é o sintoma
na forma mais crua: a tela inventando o respiro que o componente devia dar.
Hoje o `gap-1` e o corpo por degrau (`size-2.5` no `xs`, `size-3` nos outros)
moram na base, com o `:not([class*='size-'])` que `Button`, `Select`, `Tabs` e
`Menubar` já usam. O conjunto é **sempre `16/solid`**: 10 a 12px cai em `size-4`
ou menos, e a regra G do auditor não tem exceção para o `badge`.

**O tom `info` já era usado sem existir.** A constante `tagChipInfo` estava em
`badge.tsx` desde sempre, mas não havia tom para ela — então `plans` e `members`
escreviam `tone="neutral"` e anulavam a tinta por `className`. Declarar um tom e
sobrescrevê-lo é o buraco pedindo a peça.

**Cada tom passou a publicar `--badge-dot`**, e é a única coisa que ele faz
sozinho — a tinta continua saindo do cruzamento com a `variant`. A indireção é a
de `--brand-fill` no `Button` e `--tl-ink` no `Timeline`, e ela **atravessa a
variant**: por isso o ponto funciona igual nas quatro, inclusive na `contrast`,
onde o tom não pinta superfície nenhuma.

**A pílula grave não precisou de token novo.** Os dois valores que a referência
pede já existiam: no claro `--primary` é `oklch(0.205 0 0)`, a tecla preta; no
escuro a tecla fica branca, então ela troca para `--secondary`,
`oklch(0.269 0 0)` — o mesmo cinza de `--muted` e `--accent`. Escura nos dois
temas, por decisão do dono, e não invertendo com o tema. Um par `--badge-*` daria
os mesmos dois números e **não cairia em grupo nenhum do `ds:catalog`**, cujos
predicados são fechados por prefixo.

**O ponto é `animate-ping`, e não `animate-pulse` — a razão é acessibilidade.**
O bloco de `prefers-reduced-motion` isenta `.animate-spin` e `.animate-pulse` do
corte, porque um spinner parado é um componente quebrado e um esqueleto parado
não diz que está carregando. Um ponto decorativo não tem essa desculpa.
`animate-ping` cai no seletor, então ele para sozinho — **sem nenhum
`motion-reduce:` escrito à mão** — e o que fica é o núcleo sólido, que é o estado
certo. O padrão do anel sobre o núcleo veio de `plans/page-client.tsx:108`, onde
estava à mão dentro de uma rota; o `ring-2 ring-background` de lá **não** veio
junto, porque ali ele separava o ponto do ícone atrás e num chip não há o que
separar. Aquele uso ficou onde está: é adorno no canto de um ladrilho de 64px,
não cabe num `Badge`.

**O arco-íris no chip é a proibição do `AGENTS.md` com uma exceção nomeada.** A
regra continua valendo para degradê **sob texto** — sete matizes não têm um
contraste só. Aqui ele nunca fica sob o rótulo: vive num contorno de 1px
(`::before`, `border-box` sobre `padding-box` chapado) e num halo borrado atrás
(`::after`), com o miolo preenchido pelo `primary`. O rótulo tem exatamente o
contraste do botão primário. Três diferenças para o `Button`, todas de escala:
halo a `-inset-0.5` em vez de `-inset-1`, `blur-sm` em vez de `blur-md`, e
**nenhum estado de cursor** — um badge descreve, não age, então a regra H do
auditor nem é acionada.

**O risco que não se confirmou:** oito paradas num chip de 48×22 podiam colapsar
numa cor só. Medido a 4× de escala nos dois temas: o eixo do degradê a 135° mede
~50px na caixa, e o contorno atravessa teal, azul, índigo, violeta, magenta,
coral e âmbar visivelmente. A peça lê como arco-íris.

**A dependência que quebra calada:** a variant de marca veste
`brand-rainbow-image`, e **não** apenas lê `var(--brand-rainbow)`. O degradê
desceu do `:root` na rodada 88; sem a classe, a variável não existe no elemento
e nada pinta.

**Fallout:** `globals.css` (12 tokens e dois blocos de comentário), `badge.tsx`
(base, os dois eixos, duas variants novas e o `BadgeDot`), `docs/badge.tsx`
(quatro seções novas, a grade de 2×7 para 3×8, e o bloco `code=` que ainda
mostrava `<Badge>default</Badge>` — um `size` que não existe desde a rodada que
o removeu), `registry.ts` (a `entry` anunciava só `Badge`), `AGENTS.md` (três
parágrafos), sete telas perdendo `gap-*`/`size-3`/`mr-1`, e duas trocando o tom
falsificado pelo real. 617 testes, `tsc` e `ds:catalog` verdes; `lint` com 0
erros e os 65 avisos anteriores. O auditor acusa 9 achados nos arquivos
tocados, e **os 9 existiam no HEAD** — conferidos um a um contra `git show`.

### Rodada 90 — o primário com arco-íris foi medido e recusado, e nada foi para o código

O dono mandou a referência
[button-colorful](https://21st.dev/@kokonutd/components/button-colorful) e pediu o
`primary` baseado nela: arco-íris no fundo, acendendo no cursor. Pediu também para
**montar os candidatos separados antes de eu tocar no componente**. Olhou, e ficou com
a tecla chapada que já existia. **Esta rodada não mudou nenhum componente** — o que
fica dela é a medição, que é cara de refazer e cujo resultado é um "não".

**A referência foi medida, não deduzida.** O preview do 21st.dev é um iframe
cross-origin, mas o bundle (`cdn.21st.dev/bundled/3.html`) abre same-origin: dali
saíram o DOM e os estilos computados. É um botão `relative overflow-hidden` com uma
`div` `absolute inset-0` carregando `linear-gradient(to right, #6366f1, #a855f7,
#ec4899)` a `opacity-40`, `blur(8px)`, subindo para `0.8` no cursor em 500 ms.

**A peça decisiva é o `overflow-hidden`**, e é o que separa a referência do que este
projeto já tinha: ela recorta o borrão **para dentro**, e o `variant="brand"` daqui
borra o mesmo degradê **para fora**, a `-inset-1`, sem recortar nada. São a mesma
ideia apontada em direções contrárias.

**A referência também tem um defeito, e ele foi medido.** Ela inverte o botão com o
tema, e no escuro o arco-íris a 40% sobre um botão claro vira um pastel lavado. Como
`--primary` inverte igual, isso seria herdado — e foi o que motivou os três
candidatos.

#### A grade, e os números

Cinco espécimes ao vivo em `/designsystem/button` (o efeito é de **cursor**; um PNG
mostraria metade da coisa), no molde do `PalcoDeMaterial` de `docs/glass.tsx`, que é o
"A vs B" mais próximo que o repo tem. Sem comparação claro-contra-escuro lado a lado:
`ds-kit.tsx` registra que o `SpecimenPanel` já fez isso e **foi removido de propósito**.

Contraste do rótulo, pior pixel, piso AA 4,5:

| candidato | claro, cursor | escuro, cursor |
| --- | --- | --- |
| hoje · primary | 18,97 | 15,57 |
| A · escuro nos dois temas | 4,88 | **3,22 ✗** |
| B · inverte, compensado | 4,88 | 6,79 |
| C · inverte, fiel à referência | 4,86 | 7,73 |

**A reprovação do A não é um número mal escolhido; é uma contradição.** As paradas da
marca **sobem de luminosidade no tema escuro** (índigo 0,56 → 0,66, magenta 0,62 →
0,72) porque esperam pousar sobre fundo claro. O A inverte a superfície e **não**
inverte o arco-íris, então põe texto branco sobre as paradas mais claras do sistema.
A varredura mostrou que ele só passa com a opacidade do cursor em 0,55 ou menos
(4,97:1) — e aí o acender vai de 0,40 a 0,55 e o efeito quase some. Quem quiser
retomar o A precisa fazer o **arco-íris** parar de inverter também, e isso é decisão
de token.

**Um número que vale para os três:** no tema claro todos caem a ~4,87 no cursor, com
0,37 de folga sobre o piso. É lá que o texto branco encontra as paradas mais claras, e
é o teto de quanto a lavagem pode subir.

**Verificado de passagem:** o anel de foco **sobrevive ao `overflow-hidden`**
(alcançado por teclado, com `:focus-visible` confirmado) — `overflow` recorta
descendentes, não o `box-shadow` do próprio elemento.

#### O `brand` não mudou, e isso custou uma volta

O pedido de fechamento foi *"o primary com o branco e o brand com contorno e o fundo
colorido"*. **"Fundo" ali é o halo atrás**, o `::after` — a frase descrevia o `brand`
como ele **já era**. Eu li como preenchimento e pus um véu translúcido sobre o
arco-íris, fazendo cor aparecer dentro da tecla; o dono corrigiu (*"ele não tinha cor
no botão só nas bordas e fundo"*) e a mudança foi desfeita inteira.

Fica escrito para ninguém "consertar" o `brand` outra vez achando que falta cor no
miolo: **ele é tecla chapada, contorno de 1px e halo atrás, e é assim de propósito.**
O mecanismo do véu funcionava e media 6,65:1 — a camada do arco-íris do `::before` é
recortada em `border-box` e já pinta sob a caixa inteira, então basta o preenchimento
ganhar alfa para o degradê atravessar o miolo. Não foi rejeitado por defeito; foi
rejeitado por não ser o desenho.

### Rodada 91 — o arco-íris do `brand` gira sob o cursor, e o sublinhado do `link` para de saltar

Três pedidos do dono, e o terceiro era um defeito que ninguém tinha nomeado.

#### O sublinhado do `link` estava 5,5px fora, e isso foi medido

O dono escreveu: *"o underline está distante, quebrando"*. Medido no DOM com
`emHover: true` confirmado, e a linha de base lida por canvas a partir das métricas da
fonte:

| ponto | y, dentro do botão de 32px |
| --- | --- |
| linha de base do texto | 21,5 |
| onde `underline-offset-4` pinta | **25,5** |
| onde o arco-íris caía | **31** |
| erro | **5,5px** |

**A causa é que o eixo `size` só declara recuo lateral.** O `md` é `h-8 px-3`, sem
`py`, então a caixa de conteúdo tem os 32px inteiros e `bg-bottom` resolve para o pé do
**botão**, não o pé do texto. No cursor a decoração some (`hover:no-underline`) e o
traço reaparecia 5,5px abaixo: o salto que o dono viu como quebra.

**O conserto é uma âncora, não um número cravado:** `calc(50% + 0.5lh)`. A `%` do
`background-position` resolve contra `(altura − 1px)` e `lh` é a entrelinha do próprio
elemento, então a conta acompanha o degrau sozinha. Medido nos cinco: **erro 0 em
`md`, `lg` e `xl`; 1px em `xs` e `sm`**, onde a relação entre entrelinha e métrica da
fonte muda. A fórmula é exata quando `entrelinha = ascent − descent + 9`.

#### A varredura, e a armadilha que ela carrega

O traço agora entra da esquerda para a direita: a posição horizontal é ancorada em
`0%` e a largura vai de `bg-[length:0%_1px]` a `100%`.

**A armadilha é que `background-size` não está na lista de transição da base**, que
enumera `[color,background-color,border-color,box-shadow,opacity,translate]`. Sem
redeclarar a lista inteira na variante, com ela dentro, o traço aparece pronto em vez
de varrer — é a mesma pedra que o `avatar.tsx` registrou com `background-position` na
rodada 87. Medido depois do conserto: **30% → 79% → 98% → 100% em ~140ms**.

**A saída não varre de volta, e é consciente.** `background-image` é propriedade
discreta: ela some no instante em que o cursor sai. Declarar a imagem também em repouso
daria o recuo animado, ao custo de a classe do `hover:` virar redundância. Como a
decoração volta no mesmo pixel, o que se vê é o traço trocando de cor de volta.

**`bg-origin-content` ficou**, e é ele que mantém o traço na largura do texto e não do
botão: o `px-*` do degrau vira recuo. Só o eixo vertical estava errado.

#### O giro do `brand` pausa, em vez de desligar

O pedido foi que as cores girassem em volta do botão **enquanto** o cursor estivesse
em cima, em velocidade moderada.

**Pausar é o que evita o salto.** `brand-rainbow-live` fica aplicada sempre, com
`animation-play-state: paused`, e o cursor a põe em `running`. Ligar a animação só
dentro do `hover:` faria o ângulo voltar a 0° na saída. Medido: **119,5° ao sair, e
119,5° um segundo depois** — congela onde estava e retoma dali.

A utility ganhou um botão de velocidade em vez de um valor novo:
`animation: brand-rotate var(--brand-spin, 12s) linear infinite`. O botão passa
`[--brand-spin:6s]`; o único consumidor anterior (`docs/colors.tsx`) não passa nada e
continua nos 12s. **Nenhuma `@utility` nova** — e se houvesse, teria de nascer depois
de `@utility no-scrollbar`, porque `glass.test.ts` recorta o CSS de `glass-material`
até ali e qualquer coisa com a palavra `background` nessa janela reprova.

**O giro chega ao contorno e ao halo sem camada nova**, e a medição que prova isso é a
mesma que expôs o giro morto na rodada 88: com o cursor em cima, `--brand-angle` foi de
0° a 124° a 239°, e o `linear-gradient` **computado** do `::before` e do `::after`
acompanhou — 135° → 259° → 374°. Um ângulo que anda com a pintura congelada é
exatamente o defeito que aquela rodada consertou.

**Movimento reduzido já estava coberto**, sem regra nova: o bloco global isenta só
`.animate-spin` e `.animate-pulse`, então `brand-rotate` é cortada a 0,01ms com uma
iteração e o botão não gira.

#### Dois ajustes na volta, e um deles custou uma investigação

**"O hover do link tem um fundo branco."** A varredura em si estava limpa — verificado
com hover real em câmera lenta (a transição alargada para 3s) a 50% do percurso:
`textDecorationLine: none`, e na captura só a meia linha de arco-íris. O branco era o
**sublinhado de repouso**, que herdava `currentColor` e portanto era branco no tema
escuro. Ao lado de uma varredura colorida, isso lia como "o branco vem antes e a cor
cresce por cima".

**E eu li errado, duas vezes.** Primeiro apaguei o traço parado
(`decoration-muted-foreground`, medido em 5,76:1 no claro e 7,66:1 no escuro); o dono
devolveu a frase que fechava a questão: *"eu quero que o underline branco fique quando
não tem hover, e quando eu colocar o mouse em cima ele remove o underline branco e faz
a animação da esquerda para a direita para criar esse segundo underline rainbow."*

**O branco não era o defeito; era metade do efeito.** O que se quer ver é a **troca**:
o traço herdado sai e um segundo, de arco-íris, entra varrendo — dois traços diferentes,
e não um que muda de tinta. Apagar o primeiro tirava o branco e tirava junto o contraste
entre os dois estados. O `decoration-muted-foreground` foi desfeito e o traço voltou a
herdar `currentColor`.

Fica registrado porque a leitura errada é fácil de repetir: "tem branco no hover" soa
como defeito de pintura, e era descrição de um estado que existe de propósito. A
pergunta que teria evitado as duas voltas não é "qual tom o traço parado deve ter", mas
"o branco deve sair no cursor ou nunca aparecer".

**"Deixe a animação um pouco mais lenta."** A varredura herdava os 150ms do
`--duration-fast` da base. Subir para `--duration-slow` **não resolveu**, e a medição
mostrou por quê: com a curva enfática da casa (`--ease-out`,
`cubic-bezier(0.16, 1, 0.3, 1)`) o traço cobria **60% do percurso nos primeiros 46ms**
e gastava os 200ms restantes nos últimos 12%. Era o mesmo estalo com uma cauda longa.

**Movimento que percorre uma distância pede velocidade constante.** A curva enfática é
para o que **aparece** — um painel, um realce —, não para o que **anda**. É a mesma
conclusão que a rodada 86 registrou no avatar, e a saída é a mesma: `ease-linear`.
Medido depois, a cada 45ms: 13% → 31% → 45% → 62% → 76% → 93% → 100%, uniforme, em
321ms. O `link` é a única variante que sobrescreve duração **e** curva da base.

**A asserção 6 não conseguia pegar isso, e foi por isso que ela mudou.** Ela lia a
saída crua do `cva`, onde a classe da base sobrevive na string mesmo quando a variante
a vence no `tailwind-merge` — então `duration-(--duration-fast)` aparecia sempre e o
teste **não podia falhar**. Era uma asserção decorativa, e eu tinha registrado essa
brecha no plano desta rodada prometendo não explorá-la. Hoje ela resolve o `cn()` antes
de afirmar, guarda duração **e** curva, e carrega um mapa de exceções nomeadas com a
razão escrita — quem não é exceção não pode carregar outro ritmo.

**`brandOutline`**, a segunda versão do botão de marca: o mesmo contorno de 1px e o
mesmo giro, **sem o halo**. A razão é geométrica — o `::after` do `brand` sangra 4px
para fora da caixa (`-inset-1`), e num vizinho próximo isso encosta. Ele não é um
degrau a menos na escada: continua fora dela e continua um por tela; o que muda é
quanto espaço ele pede em volta. A variante nasceu derivada da string do `brand` com o
bloco do halo removido, então as duas não podem divergir por descuido.

**Fallout:** `globals.css` (uma linha), `button.tsx` (as variantes `link` e `brand`,
a `brandOutline` nova e os comentários), `AGENTS.md`, `docs/button.tsx` (quatro notas
novas) e `docs/brand.tsx`. 617 testes, `tsc`, `lint` e auditor verdes, **sem mudar teste
nenhum** — as asserções 4 (o `link` sublinha sempre, com par de toque) e 9 (o `brand`
não pinta fundo próprio) foram conferidas contra o desenho antes de escrever. Nenhuma
rota e nenhuma jornada mudaram.

### Rodada 92 — o sublinhado do link deixa de ser decoração, e a emenda tinha nome

Três ajustes, e o terceiro era um defeito que ninguém tinha nomeado: *"parece que o
underline branco está com um divisor em um ponto dele."*

#### A emenda: `::first-letter` partindo a decoração

O `::first-letter` que a base do `Button` usa para a maiúscula inicial do CTA cria uma
**caixa separada para a primeira letra**, e o `text-decoration` propagado é pintado em
**dois segmentos** com uma costura entre eles. Diagnosticado num clone a 22× de
ampliação: removida a classe de `::first-letter`, a linha sai contínua; com ela, sai
partida logo depois do "L".

Quatro consertos foram testados na mesma montagem, e três falharam:

| candidato | resultado |
| --- | --- |
| sublinhar também o `::first-letter` | emenda, no mesmo lugar |
| `text-decoration-skip-ink: none` | emenda |
| decoração no `<span>` em vez do botão | emenda |
| **linha como camada de `background`** | **contínua** |

A classe de `::first-letter` não podia sair — ela é a garantia do sistema. Então **a
linha de repouso deixou de ser `text-decoration`**: um fundo é uma pintura só, e não
tem como partir.

#### Duas linhas, dois elementos — e isso é o mecanismo

O dono escolheu a saída em que **o arco-íris recua deixando o espaço vazio, e o branco
só volta quando o recuo termina**. Eu tinha orçado isso como caro: exigiria registrar a
tinta com `@property` para poder atrasá-la, a mecânica do `--brand-angle`. **Não
exigiu.** Basta a linha parada morar no `<span data-slot="button-label">` e o arco-íris
no botão: elementos diferentes têm `transition` própria, e o atraso de um não segura o
outro.

**O atraso que vale numa troca de estado é o declarado no destino.** Entrando no
cursor vale `delay-0` — o branco some na hora. Saindo vale
`delay-[var(--duration-base)]` — ele volta só quando o recuo acaba. `duration-0` faz as
duas pontas instantâneas: o branco **some** e **volta**, nunca encolhe.

Medido, amostrando as duas camadas na mesma passagem do Playwright (o painel do
navegador não serve: a latência entre mover o ponteiro e rodar o script engole a
transição inteira):

| saída | 0ms | 65 | 131 | 196 | **231** |
| --- | --- | --- | --- | --- | --- |
| arco-íris | 100% | 67% | 33% | 4% | 0% |
| branca | 0% | 0% | 0% | 0% | **100%** |

**As duas caem no mesmo pixel, e não por número cravado.** `calc(50% + 0.5lh)` é meia
entrelinha abaixo do meio da caixa: a `%` resolve contra `(altura − 1px)` e `lh` é a
entrelinha do próprio elemento. No botão (32 de altura) dá 25,5; no rótulo (20 de
altura, topo em 6) dá 19,5 + 6 = os mesmos 25,5. Divergência medida: **≤0,01px nos
cinco degraus, nos dois temas**.

#### O ritmo, pela terceira vez

150ms piscava, 300ms arrastava; ficou em `--duration-base`. `ease-linear` continua da
rodada 91, e a razão também: com a curva enfática da casa o traço cobria 60% do
percurso nos primeiros 46ms.

#### Os dois testes mudaram, e por quê

**`button-touch-response.test.ts`, asserção 4** exigia `" underline "` e
`(image:--brand-rainbow)` como alvo do `hover:bg-`. As duas deixaram de valer: não há
decoração, e o que o cursor troca é a **largura**. A intenção sobreviveu — há linha
parada, há traço de cursor arco-íris, e ele tem par de toque — e o comentário da
asserção passou a registrar **por que** deixou de ser decoração, senão a próxima
rodada "conserta" de volta e a emenda vem junto.

**`button-primary.test.ts`, asserção 6**: o mapa de exceções do `link` trocou
`--duration-slow` por `--duration-base`.

**Fallout:** `button.tsx` (só a variante `link` e o comentário dela, reescrito porque
acumulara afirmações que deixaram de ser verdade), os dois testes, `AGENTS.md`,
`docs/button.tsx`. 617 testes, `tsc`, `lint` e auditor verdes. Nenhuma rota, nenhuma
jornada.

**O que fica em aberto:** a linha parada não é mais `text-decoration`, então ela não
acompanha quebra de linha — um `link` que quebrasse em duas linhas ganharia o traço só
na primeira. Os quatro usos do app são rótulos curtos e nenhum quebra.

### Rodada 93 — uma das linhas tinha metade da espessura, e ninguém tinha medido

Dois pedidos, e os dois eram consequência de uma decisão minha na rodada 92: para dar
ao branco um atraso próprio, eu o pus no `<span data-slot="button-label">` e deixei o
arco-íris no botão.

#### Meia espessura, e a caixa é a culpada

| | caixa | topo da linha | sobra abaixo | **espessura visível** |
| --- | --- | --- | --- | --- |
| arco-íris (botão) | 32px | 25,5 | 6,5px | **1px** |
| branca (rótulo) | 20px | 19,5 | 0,5px | **0,5px** |

A caixa do rótulo **é** a caixa de linha. Com a âncora em `calc(50% + 0.5lh)`, a linha
de 1px começa meio pixel antes do fim dela — e fundo é recortado pela caixa, então
**metade foi jogada fora**. O dono viu como "espessuras diferentes"; era exatamente
isso, e o fator era dois.

**O conserto é `- 0.5px` na âncora, nas duas camadas.** Ele encosta a linha na borda de
baixo em vez de atravessá-la, mantém as duas alinhadas, e de quebra as põe em **pixel
inteiro** — nítidas em vez de antisserrilhadas. Medido depois, contando linhas de pixel
a DPR 8: as duas ocupam **exatamente as mesmas 8 linhas de dispositivo**. A diferença
de brilho que resta (250 contra 165) é a cor, não a geometria.

**E a conta é geral.** No rótulo, cuja altura é a entrelinha, a fórmula dá `LH − 1`; no
botão dá `(H + LH)/2 − 1`, que é o mesmo valor somado ao topo do rótulo, `(H − LH)/2`.
Coincidem em qualquer degrau — verificado nos cinco.

**O que fica frágil, e vai escrito:** a linha do rótulo agora é **rente** à borda da
caixa dele. Qualquer `padding` ou `border` naquele span a recorta outra vez, e o
sintoma é meia espessura, que é silencioso. É o preço de as duas linhas morarem em
elementos diferentes — e elas precisam morar, porque é isso que lhes dá transição
independente.

#### O branco volta desenhando, não saltando

A rodada 92 entregou o branco **saltando** para a largura cheia depois do recuo. O dono
recusou — *"não gostei do underline branco reaparecer do nada"* — e pediu que a volta
fosse **a mesma animação da entrada do arco-íris**, em sequência.

O conserto foi trocar **onde o `duration-0` mora**: ele saiu da base e foi para o
cursor. Como o que vale numa troca de estado é o declarado no **destino**, a entrada
passou a ser instantânea e a saída passou a animar, com a mesma duração e a mesma
curva `linear`. Medido:

| fase | ms | arco-íris | branca |
| --- | --- | --- | --- |
| 1 · recua | 0 → 194 | 100 → 4% | 0% |
| 2 · desenha | 232 → 429 | 0% | 17 → 100% |

A saída passou a levar ~400ms no total, por ser sequencial.

#### O teste guarda os dois

A asserção 4 ganhou duas travas, e ambas foram **verificadas contra a regressão**:
devolvendo a âncora antiga só no rótulo, o teste falha; restaurando, passa. Ela afirma
agora que **as duas camadas declaram a mesma espessura e a mesma âncora** (com o
`- 0.5px` nomeado) e que o rótulo tem duração, atraso e curva próprios. O comentário
registra o defeito de meia espessura, para ninguém "simplificar" as duas de volta para
o mesmo elemento sem saber o que se perde.

**Fallout:** `button.tsx` (a variante `link` e o comentário), o teste, `AGENTS.md`,
`docs/button.tsx`. 617 testes, `tsc`, `lint` e auditor verdes. Nenhuma rota, nenhuma
jornada.

### Rodada 94 — a animação do sublinhado sai inteira, e o que sobra são dez classes

*"Pensando melhor, remova a animação do underline. Só quando eu estiver no hover, deixe
o underline de branco para arco-íris, sem animação nenhuma."*

Três rodadas construíram aquele movimento — a varredura da esquerda para a direita (91),
o recuo na saída com o branco voltando depois (92), a volta desenhando em duas fases
(93) — e esta apagou todas. Fica registrado porque o caminho custou medição, e porque
a conclusão é sobre **quando não animar**.

**O que saiu:** a lista de transição própria com `background-size` dentro, a duração
`--duration-base`, a curva `ease-linear`, o atraso, o `duration-0`, a segunda camada no
`<span data-slot="button-label">` e os onze utilitários com seletor de filho que ela
exigia. **A variante foi de 27 classes para 10.**

**O que sobrou é uma camada só cuja imagem troca.** `background-image` é propriedade
discreta: a troca de `linear-gradient(currentColor, currentColor)` para
`var(--brand-rainbow)` é instantânea **de graça**, sem transição, sem atraso, sem
segunda camada. Não há o que desalinhar nem o que recortar — os dois defeitos da
rodada 93 deixaram de ser possíveis, em vez de serem consertados.

**A âncora voltou para `calc(50% + 0.5lh)`.** O `- 0.5px` existia só para a linha do
rótulo caber na caixa de linha dele, e com uma camada só, no botão, não há caixa
apertada. O traço volta a cair **exatamente** onde o `underline-offset-4` pintava —
25,5 no `md`, erro zero.

**O que continua valendo, e é a única coisa que sobrevive das quatro rodadas:** o
traço **não** é `text-decoration`, porque o `::first-letter` da base parte a decoração
em dois segmentos. Essa medição da rodada 92 é a razão de haver `background` aqui, e
está escrita no componente e no teste — quem devolver `underline` traz a emenda junto.

**Verificado depois:** 1px exato nos dois estados e nos dois temas, contando linhas de
pixel a DPR 8 (pela mediana da fatia, porque no tema claro a linha é escura e o fundo
claro — tomar o mínimo como fundo inverte a conta e foi o que fez a primeira medição
reportar 5px). A transição do botão voltou a ser a da base, 0,15s, sem
`background-size`.

**Os dois testes encolheram junto.** A asserção 4 voltou a afirmar o que sempre quis —
há traço parado, ele vira arco-íris no cursor, e o toque acompanha — mais duas travas
novas: **nada de `background-size` na transição e nada de `delay-`**, para a animação
não voltar por descuido. E o mapa de exceções de ritmo da asserção 6 ficou **vazio**: o
`link` era o único membro, e saiu.

**Fallout:** `button.tsx` (a variante e o comentário, reescritos), os dois testes,
`AGENTS.md`, `docs/button.tsx` (duas notas no lugar de duas). 617 testes, `tsc`, `lint`
e auditor verdes. Nenhuma rota, nenhuma jornada.

### Rodada 95 — o ladrilho larga o vidro, e o "sem cor" tinha virado a tecla da marca

**O pedido.** "Revisar o `ColorTile` para adequar melhor ao novo branding do
Rainbow, usando como base o avatar que já mexemos."

**O modelo é o arco do `Avatar`, e não o arco-íris.** A revisão dele (rodadas 85
a 87) foi uma subtração em série: saíram o modo de vidro, o anel de arco-íris da
pessoa logada, o degradê, o grão, o ponto de luz, o movimento no cursor e a
forma quadrada, e sobrou cor chapada com um script de contraste guardando o
resultado. Adequar o ladrilho ao branding novo é fazer a mesma coisa — e
**não** pôr arco-íris nele. A rodada 90 já mediu e recusou arco-íris em
preenchimento, e o anel do avatar saiu a pedido do dono na 83; sob um ícone,
oito paradas não têm um contraste só. O acento continua morando no wordmark, no
campo de acesso e nas variantes `brand` do `Button` e do `Badge`.

#### O vidro saiu, e a contagem decidiu

O eixo `glass` (rodadas 43 a 45) tinha **zero** telas do produto. Os dois únicos
espécimes eram as duas seções da página do catálogo, escritas para demonstrar um
modo que ninguém vestia — e o `AGENTS.md` já afirmava, errado, que "o ladrilho é
chapado", texto que sobrou da primeira vez que o verniz saiu. Um modo sem
consumidor é uma linha a manter, não uma opção a oferecer.

Com ele saíram o import de `glass-classes`, o `data-glass`, as duas seções e as
duas notas do catálogo, a linha da `PropsTable`, e `color-tile` da lista
`COM_MODO` da asserção 13 de `glass.test.ts`. **Nenhuma asserção mudou de
forma.** A 21 — o bisel cônico não vaza para o `glass-control` — era ancorada
no ladrilho ("ele é `rounded-md`"), e foi reancorada no marcador do `Tabs` e no
`Glass size="control"`, que sobraram com a mesma forma; a regra continua valendo
pelo mesmo motivo. Verificado na tela: `/designsystem/glass` e
`/designsystem/tabs` não se mexeram.

#### O "sem cor" tinha mudado de significado sem ninguém tocar no arquivo

O padrão era `var(--primary)`, escrito quando o primário era o verde da marca.
A rodada 83 tornou `--primary` a **tecla preta** — `oklch(0.205 0 0)` no claro e
`oklch(0.985 0 0)` no escuro, **croma 0**. O ladrilho continuou fazendo a conta
certa sobre um insumo que virou outra coisa: véu de 12% de preto sobre o cartão,
tinta em cinza 0,42. Uma categoria recém-criada passou a ler como **desativada**,
e ninguém tinha mexido no componente.

É a forma mais cara de dívida que este projeto encontra: **o token muda de
significado e o consumidor não sabe.** Não há teste que pegue isso — a conta
continua correta, e é o insumo que deixou de querer dizer o que dizia.

O padrão é `var(--muted-foreground)`, croma 0 nos dois temas de propósito. A
receita não muda em nada: ausência de cor lê como ausência de cor, e não como a
marca esmaecida.

**E isso matou dois ladrilhos desenhados à mão** (invariante 1). `bill-pending-card`
e `bill-detail-sheet` desenhavam cada um uma `div` de 44px com `bg-muted` e
`border-border`, com o comentário de que *"fatura de cartão não tem cor escolhida
por ninguém: o ladrilho é de tema, e o verniz do `ColorTile` não teria sobre o
que brilhar"*. Era verdade quando o padrão era o verde. Medido depois da troca,
rasterizando as duas superfícies no mesmo canvas: **236 contra 235 em 255** — o
corpo é o mesmo cinza. O que muda é a aresta, que deixa de ser `border-border`
sólido e passa a ser o fio normalizado a 0,25 de alfa, igual ao das linhas
vizinhas. Que é o ponto.

#### A escada ganha os nomes do sistema

Ela era 32 · 36 · 44 sob `sm` · `md` · `lg`, enquanto no sistema 32 é `md` e 36 é
`lg`. É a terceira vez que este defeito aparece — o `Menubar` entregava 24 sob um
nome de 28, o `Tabs` entregava 27 —, e a assinatura dele é sempre a mesma: **uma
tela contornando o eixo**. `credit-card-invoice-category-spend-section` escrevia
`sm:h-9 sm:w-9` para promover um `sm` aos 36 do `md` à mão.

| era | é | px | raio | ícone |
| --- | --- | --- | --- | --- |
| `sm` | **`md`** (padrão) | 32 | 8px | 16/solid |
| `md` (padrão) | **`lg`** | 36 | 8px | 16/solid |
| — | **`xl`** | 40 | 10px | 20/solid |
| `lg` | **`2xl`** | 44 | 10px | 20/solid |

`2xl` vem do `MoneyDisplay`, e é o único degrau que alcança os 44px de alvo de
toque. `xl` (40) fecha a escada no teto do sistema e ainda não tem consumidor —
dito na página, para não parecer esquecimento.

A migração é pixel a pixel idêntica, e o padrão mudou de 36 para 32: os três
sítios que omitiam passaram a declarar `lg`, os seis `sm` passaram a omitir, e os
três `lg` viraram `2xl`. Medido na tela: 32/8/16 · 36/8/16 · 40/10/20 ·
44/10/20.

#### Duas medições de passagem

**O `iconClassName` do `WorkspaceBrandMark` nunca funcionou.** Ele passava
`size-3.5` — 14px, fora da régua de Iconografia —, e **isso nunca desenhou
nada**: `[&>svg]:size-4` do degrau é um seletor de descendente (0,1,1) e a classe
no próprio `svg` é 0,1,0. Medido no navegador, injetando `size-5` e `size-3` num
ícone do catálogo: **16px nos três casos**. A consequência é maior que a linha
apagada — **cinco telas** passam um tamanho por esse prop (`size-5`, `size-4`,
`size-3`) e nenhuma o obtém, enquanto o `className` da caixa (`size-12`,
`size-6`, `size-10`) funciona normalmente, porque ali é o mesmo elemento e o
`tailwind-merge` resolve. Uma marca de workspace de 48px desenha um ícone de 16.
**Fica registrado e não foi consertado aqui**: o conserto é a forma que o `Badge`
já usa, `[&>svg:not([class*='size-'])]:size-4`, e ele **muda a aparência de cinco
telas** — é decisão do dono, e é de outro componente.

**A regra G do auditor não enxerga o `[&>svg]`.** Os dois ícones `20/solid` da
página são acusados de estar em `size-4`, porque o auditor lê "sem classe de
tamanho" como 16. É falso positivo, é **anterior a esta rodada** (verificado
rodando o auditor contra a versão em `HEAD`), e a saída correta não é escrever
uma classe morta no espécime para calar o relatório.

#### A guarda

`scripts/tile-contrast.mjs`, no molde do `identity-contrast.mjs`: clona o
ladrilho real, esconde o glifo, captura e pega o pior par da caixa central,
com a tinta saindo de `getComputedStyle().color` por um canvas de 1×1 — o
navegador devolve `oklch()`, e parsear aqueles números como RGB é o erro que a
página de cores já cometeu.

A grade são as 10 cores de `CATEGORY_COLORS`, os 3 extremos da paleta livre e o
caso sem cor, × 4 degraus × 2 temas: **112 células**. O piso é **3:1** e não 4,5
— o ícone é gráfico e não texto, então quem manda é a WCAG 1.4.11. Resultado:
**pior caso 5,09** (branco, tema escuro); no claro, 6,55 (esmeralda). Os números
que o componente afirmava em prosa eram 6,48 e 4,78, medidos à mão numa varredura
que incluía o modo de vidro.

**Sem entrada no `package.json`**, como os outros dois scripts de contraste: eles
rodam por `node scripts/…`, e uma terceira convenção seria pior que nenhuma.

#### Fallout

`color-tile.tsx`, `glass.test.ts`, `globals.css` e `glass-classes.ts` (as três
âncoras de comentário), a página `color-tile` do catálogo, o `AGENTS.md`, o
script novo, e 11 sítios de uso em 9 arquivos. 617 testes, `tsc`, `lint`,
`ds:audit` e `ds:catalog` verdes — o catálogo passou a listar `color-tile` com
**um** eixo. Nenhuma rota, nenhuma jornada, nenhum passo de fluxo: `JORNADAS.md`
e o Atlas não foram tocados.

**O que ficou sem verificar:** as telas de contas a pagar no app rodando. O
painel do navegador não está autenticado, e entrar não é coisa que eu faça. A
troca das duas `div` foi verificada por medição das duas superfícies lado a lado
(236 contra 235), não por captura da tela real.

### Rodada 96 — a cor da pessoa vira marca, e o ladrilho vira o avatar

**O pedido, em duas mensagens.** A primeira foi uma correção minha: entregue a
rodada 95, o dono perguntou *"por que você não mexeu nas cores? Eles não
deveriam usar cores do arco-íris assim como os avatares?"*. A segunda, já com a
paleta trocada: *"ajuste para que a forma de aplicação das cores seja igual do
avatar, sólida de fundo, e remova qualquer outra versão que não seja isso."*

**A premissa da pergunta estava meio errada, e o alvo dela inteiro certo.** O
avatar **não** usa as cores do arco-íris: ele usa `--identity-1..6`, seis cores
chapadas próprias, cujos matizes (58 · 100 · 175 · 230 · 275 · 318) deixaram de
vir das paradas da marca na rodada 87. Mas o buraco existia, e a rodada 95 passou
ao lado dele: **o ladrilho não tem cor própria para revisar — ele recebe um
hexadecimal do banco.** Quem tem cor são as duas paletas que o alimentam, e eu
tinha revisado o componente sem olhar para elas.

#### As duas listas, e a prova de que ninguém as revisitara

`CATEGORY_COLORS` eram dez Tailwind 500; `WORKSPACE_ACCENT_PALETTE`, doze
Tailwind 600. Nenhuma relação com o produto, e as duas carregando a própria
data de validade:

- A de carteira ainda se descrevia como *"Saturated backgrounds; white glyphs
  read clearly on top"* — **glifo branco sobre preenchimento saturado é
  exatamente o desenho que o ladrilho abandonou**, por reprovar nos 3:1 da WCAG
  1.4.11 em 4 dos 10 presets.
- A de categoria trazia `#6366F6`. O indigo-500 do Tailwind é `#6366F1`. Um
  dígito trocado que ninguém viu, porque o ladrilho normalizava a claridade e o
  erro sumia.

Bills não têm paleta: `bill.color` é a cor da categoria. Então são duas listas
para três lugares, e viraram uma: `TILE_PALETTE`, em `lib/tile-palette.ts`.

#### Chapar a parada da marca reprova, e a medição é o argumento inteiro

O pedido de "sólida de fundo, igual ao avatar" foi medido antes de escrito. Com
as oito paradas da marca chapadas **como elas são no token**:

| parada | tinta escura (0,22) | tinta branca |
| --- | --- | --- |
| teal | 7,40 | **2,23** |
| azul | 6,83 | **2,42** |
| índigo | **3,55** | 4,65 |
| violeta | **3,21** | 5,15 |
| magenta | **4,09** | 4,04 |
| coral | 5,07 | **3,25** |
| âmbar | 8,50 | **1,94** |
| lima | 9,02 | **1,83** |

**Nenhuma tinta única serve as oito** — três reprovam com a escura, quatro com a
branca. É, literalmente, o desenho que esta peça já teve e abandonou, voltando
pela porta da frente. E é a mesma lição da rodada 83 no avatar, onde as
identidades pegaram das paradas **só o matiz**, com luminosidade e croma
próprios.

Clareadas para a banda da identidade — `oklch(0.86 0.12 h)`, mesmos matizes —,
as oito entregam **10,28 a 11,76** com a tinta escura, a mesma faixa que as seis
identidades entregam hoje (10,17 a 12,12). Nenhuma encosta na parede do sRGB,
verificado repintando cada uma com croma ×1,08. São os valores da paleta nova.

#### A superfície normaliza de novo, e não é redundância

O ladrilho pinta `oklch(from var(--tile-color) 0.86 min(c, 0.12) h)`. Uma cor da
paleta atravessa sem mudar; o que essa fórmula cobre é o **seletor livre da
carteira**, um `<input type="color">` onde cabe qualquer hexadecimal — inclusive
o branco e o preto, que chapados matariam o ícone ou o ladrilho.

Medido em dez cores, entre paradas e extremos: **10,63 a 11,74**, e preto, branco
e cinza chegando neutros a 11,2. É o mesmo princípio que a peça já tinha ("a
claridade é do sistema; o matiz é da pessoa"), movido do véu para o
preenchimento.

**O teto de croma não é cosmético.** Sem ele o magenta cai a **7,70** e o croma
das peças varia de 0,12 a 0,28 — oito ladrilhos numa lista deixam de ler como uma
família. Com `min(c, 0.12)` todos ficam na banda.

#### O que a mudança arrastou

Saíram, do componente, o véu de 12%/18%, o fio normalizado a 0,25 de alfa, a
tinta `oklch(from … 0.42/0.78 c h)` e **os pares por tema**: como a identidade, é
um valor só nos dois. Sobraram uma superfície e uma tinta. Com a rodada 95, o
ladrilho perdeu em duas rodadas o eixo `glass`, o véu, o fio e a divisão por
tema — o mesmo arco do avatar, que largou o vidro, o anel de arco-íris, o
degradê, o grão e o ponto de luz. **Hoje os dois são a mesma construção**,
separados pela forma e por quem escolhe a cor.

`tileColorFor` dobra na leitura os 22 presets legados, **sem escrever no banco**,
no precedente de `identityToneFor`: cada um vai para o matiz mais próximo, com
desvio medido de 0,9° a 32,5°. Duas decisões dentro dela:

- **O que a pessoa digitou no seletor livre atravessa intacto.** Só os presets
  que o produto ofereceu são dobrados — quem escolheu o próprio azul continua
  com ele. É onde esta dobra difere da do avatar, cujo valor gravado nunca foi
  escolha de ninguém.
- **`#6B7280` vira o neutro, e não um azul.** É o cinza da lista antiga, croma
  0,023: o matiz de 264° ali é ruído de arredondamento, e a régua de matiz
  transformaria um cinza deliberado numa cor.

**Um índice carregava semântica, e a lista mudou de ordem embaixo dele.**
`CATEGORY_COLORS[0]` era esmeralda (receita) e `[3]` era vermelho (despesa), em
15 sítios. Com a lista nova eles passariam a teal e **violeta**, calados.
Viraram `TILE_INCOME_DEFAULT` e `TILE_EXPENSE_DEFAULT` nos seis sítios em que o
índice queria dizer alguma coisa; nos outros nove ele quer dizer "a primeira
amostra", e ficou. A intenção fica dentro da família — lima e coral —, e **não é
a invariante 3 sendo violada**: quem diz "entrou" e "saiu" continua sendo
`--income` e `--expense`, e a lima da marca está 22° acima do verde de estado
justamente para não ser lida como ele.

**A dobra é idempotente, e isso é carga estrutural.** Ela roda no `ColorTile` —
onde alcança os onze sítios de uma vez e não dá para esquecer — **e** em
`accentColor`, na tela de detalhe da categoria, porque lá a mesma cor tem um
segundo consumidor: o gráfico de tendências, que a lê crua por `hexToRgba`. Sem
a segunda chamada, uma categoria com cor legada sairia com o ladrilho na família
da marca e a área do gráfico na cor antiga, lado a lado.

#### A guarda

`scripts/tile-contrast.mjs` foi refeito para a construção nova: 8 cores da
paleta + 3 extremos do seletor livre + o caso sem cor, × 4 degraus × 2 temas =
**96 células**. O piso subiu de 3 para **4,5** — o ícone é gráfico e bastariam 3,
mas a peça agora mede pela régua do `AvatarFallback`, e medir a mais custa nada.
Pior caso **10,64** (coral), **idêntico nos dois temas**, que é a prova de que o
valor é um só. Ele também passou a imprimir o pior caso por tema.

`lib/tile-palette.test.ts` tranca o resto: a dobra é idempotente, os 22 legados
caem na paleta ou no neutro, o seletor livre atravessa, e os oito matizes não
têm vizinhos a menos de **28°** — que é o vão real entre índigo e violeta, e
vem da rampa da marca, não deste arquivo. A primeira versão do teste cobrava 30°
porque eu chutei a régua; o valor medido a corrigiu.

#### Fallout

`lib/tile-palette.ts` e o teste (novos), `color-tile.tsx`, `category-appearance-fields.tsx`,
`workspace-icons.ts`, o `accentColor` da tela de detalhe, os seis sítios de
padrão semântico, os cinco `#2563EB` escritos por extenso (a parada de índigo
está a 0,9° dele), a página `color-tile` do catálogo, o `AGENTS.md` e o script.
A amostra de cor também parou de soletrar hexadecimal no leitor de tela: a
paleta tem nome, então o `aria-label` diz "Cor teal".

624 testes, `tsc`, `lint`, `ds:audit` e `ds:catalog` verdes. Nenhuma rota,
nenhuma jornada.

**O que ficou sem verificar:** as telas do app rodando — o painel do navegador
não está autenticado. O seletor de amostras de categoria e de carteira foi
verificado por tipo e por teste, não por captura.

### Rodada 97 — a tecla do primário ganha o molde do Polaris

**O pedido.** "Revisão no `Button variant="primary"` para ele ficar com as mesmas
especificações de estilo dos botões da Shopify, igual o botão continuar do meio
dessa tela, mantendo os tamanhos e as bordas arredondadas que temos hoje, e as
cores atuais também", com o link de `accounts.shopify.com/lookup`.

**A referência foi medida, não deduzida — e ela tinha duas receitas.** O CSS é
cross-origin, então `cssRules` não abre; o `fetch` do bundle
(`shopify-assets.shopifycdn.com/…/merchant-public-….css`, 534KB) abre, e dali
saíram as 470 regras de `.ui-button`. O que elas mostram:

- **A tela do link roda a versão achatada.** `body.has-dark-background` zera as
  sombras internas do `::before`, e sobra `--p-shadow-200`
  (`0 3px 1px -1px rgba(26,26,26,.07)`) mais um véu
  `linear-gradient(180deg, rgba(255,255,255,.07) 80%, rgba(255,255,255,.15) 100%)`.
  As cores ali são `#0B1314`, hover `#283133`, active `#545D5E`, texto `#FAFCFC`.
  No cursor ela acende um aro interno de 1px — `#ebebeb` em cima e nas laterais,
  `#cccccc` embaixo —, medido ao vivo com um `hover` de verdade.
- **O Polaris canônico é a tecla moldada.** `--p-shadow-button-primary` é
  `inset 0 2px 0 0 rgba(255,255,255,.2)`, `inset ±2px 0 0 0` iguais,
  `inset 0 -1px 0 1px #000` e `inset 0 1px 0 0 #000`. Apertado:
  `inset 0 3px 0 0 #000`, o véu inverte para
  `rgba(255,255,255,.1) 0% → transparent` e o rótulo desce 1px.

Posta a diferença na mesa, o dono escolheu **o canônico** — que é o que de fato
nos faltava: tínhamos luz só no topo, 1px a 14%, e nenhuma nas laterais.

#### O que entrou

A luz engrossou e passou a **cercar**: `--primary-highlight` foi de 14% a 20%, em
três camadas (`inset 0 2px`, `inset 2px 0`, `inset -2px 0`). Nasceram
`--primary-sheen` (o véu) e `--primary-shadow-drop` (`0 3px 1px -1px` a 7%). O
plinto ganhou o espalhamento do Polaris (`inset 0 -1px 0 1px`), e o afundar virou
**duro**: `inset 0 3px 0 0`, sem raio de borrão, contra o `inset 0 1px 2px 0` de
antes.

**A sombra de fora é da tecla, e não a do sistema.** A do Polaris é mais baixa e
mais espalhada que a nossa `--shadow-xs-value` (`0 1px 1px 0` a 4%), e mudar o
token compartilhado por causa de um botão alcançaria todo componente que o veste.

**A linha escura acima da luz não foi escrita.** O Polaris a desenha com
`inset 0 1px 0 0 #000` porque o botão dele **não tem borda**; o nosso tem
`border-primary-edge`, que já contorna os quatro lados. As duas juntas dariam 2px
de escuro no topo.

#### O que não mudou, por decisão

Cores, escada (24 · 28 · 32 · 36 · 40), raio (10px) e anel de foco. E o **ritmo**:
o Polaris anima em 75ms com `cubic-bezier(0.19, 0.91, 0.38, 1)`, e nós ficamos em
`--duration-fast` com `--ease-out`. A asserção 6 cobra a mesma curva em **todos**
os pesos, e um `primary` respondendo diferente do `secondary` ao lado é o defeito
que ela existe para impedir. O desenho veio inteiro; o tempo continua nosso.

O rótulo também não ganhou deslocamento próprio: a base já tem
`active:translate-y-px` no botão inteiro, e dois afundamentos seriam um a mais —
a mesma correção que a rodada 82 fez no FAB.

#### O véu não pode ser pseudo-elemento, e isso foi verificado no DOM

`ButtonGroup` escreve `[&>[data-variant=primary]]:before:hidden`
(`button-group.tsx:50`) para desligar o próprio divisor sobre o primário. Um
`::before` na variante **sumiria calado dentro de um grupo** — e o catálogo não
mostra o botão agrupado, então a regressão não apareceria. O véu foi como
`background-image`; medido em `/designsystem/button-group`: ali o pseudo do
primário é `display: none` e o véu segue pintando.

Antes de escrever, medi o `tailwind-merge`: `bg-primary` (cor) e
`bg-(image:--primary-sheen)` (imagem) sobrevivem juntas, com `hover:bg-primary-hover`
junto. Se não sobrevivessem, a saída era a propriedade arbitrária.

#### No tema escuro a luz inverte, e o escuro estava sem molde havia quatro rodadas

A receita do Polaris é luz branca mais aresta preta, e isso pressupõe tecla
escura. A nossa inverte para branca, onde luz branca não desenha nada — foi por
isso que a rodada 83 pôs `--primary-highlight: transparent` ali. O que a medição
mostrou é que aquilo deixou o escuro **sem molde nenhum**: só a aresta. Agora quem
cerca é o escuro (`oklch(0 0 0 / 10%)`), e a aresta continua mais clara que o
corpo — a mesma peça, moldada pelo lado oposto.

#### Os números, e uma correção ao histórico

| | aresta / corpo | luz / corpo, antes | luz / corpo, agora | rótulo |
| --- | --- | --- | --- | --- |
| claro | 1,15 | 1,52 | **1,88** | 17,18 |
| escuro | 1,51 | **invisível** | **1,26** | 18,97 |

**A rodada 78 registrou "aresta contra corpo 1,53 no claro e 1,86 no escuro, fio
de luz contra corpo 1,53 e 1,51", e esses números estão mortos desde a rodada
83.** Nenhum dos dois tokens mudou *nesta* rodada, e mesmo assim a aresta mede
1,15 no claro: os valores da 78 são da era do primário **verde**, e a 83 trocou a
tecla por preta dizendo que "`button-primary.test.ts` continuou verde sem uma
linha mudada" — o teste continuou, os números não. O caso do escuro é pior: a 78
anotou 1,51 para um fio de luz que a 83 tornou `transparent`, e a linha
sobreviveu no documento descrevendo uma luz que não existia.

É o mesmo defeito que a rodada 95 nomeou no `ColorTile`: **o token muda de
significado e o consumidor não sabe** — aqui, o consumidor era a documentação.

Fica dito o que a medição também mostrou e não foi consertado: no tema claro a
aresta é fraca (1,15) perto da luz (1,88), então quem molda ali é a luz. Aprofundar
a aresta é mexer numa cor, e as cores ficaram de fora do pedido.

#### O teste

Quatro asserções novas em `button-primary.test.ts`, que passou de 9 para 13: a luz
**cerca** (três camadas de `var(--primary-highlight)` no `--primary-shadow-value`,
nos dois blocos de tema, com as duas laterais nomeadas); o véu é token, está nos
dois temas e **sobrevive ao merge** (o resolvido por `cn()` tem `bg-primary` *e*
`bg-(image:--primary-sheen)`); o véu **não** é pseudo-elemento, e a asserção lê o
`button-group.tsx` para que a razão fique junto da regra; e o afundar é duro (o
terceiro valor do `pressed` é `0`). Duas sabotagens, duas reprovações.

#### Fallout

`globals.css` (os tokens nos dois temas), `button.tsx` (uma classe e os
doc-comments), `button-primary.test.ts`, a página `button` do catálogo (a seção da
tecla e três notas, uma delas substituindo a "Elevação escura, não luz", que dizia
"a única luz é o fio de 1px no topo") e o `AGENTS.md`. 628 testes, `tsc`, `lint`,
`ds:audit` e `ds:catalog` verdes. Nenhuma rota, nenhuma jornada.

**O que ficou sem verificar:** o `active` mantido não foi amostrado por quadro — o
painel do navegador não segura o clique, que é a mesma limitação que a rodada 78
registrou; o que o prova é a regra `:active` lida no CSS emitido. E as telas do
app, que seguem atrás de autenticação.

### Rodada 98 — o primário vira chapado, e acende em lava sob o cursor

**O pedido, em três mensagens.** A primeira desfez a rodada 97: "não gostei do
resultado; quero mudar completamente o `primary` — branco chapado, sem efeito,
3D, profundidade, nada disso. No hover, a tintura de fundo é o arco-íris,
levemente alguns blobs como um lava-lamp passando atrás do botão, focando sempre
na ponta do mouse; nas laterais um branco mais aparente e no centro cada vez mais
forte." A segunda corrigiu a minha leitura: **não há animação de clique** — o
clique só afunda, como `secondary` e `tertiary`; a animação é a das cores de
fundo, referenciada à ponta do mouse. A terceira deu a chave: "a coloração não
precisa estar 100%, pode estar meio opaca, como se tivesse um vidro branco na
frente — mas aparente, para ficar bonito."

**Isto inverte a rodada 90, e foi dito antes de fazer.** A 90 montou três
primários com arco-íris no cursor e o dono os recusou; o `AGENTS.md` escrevia "o
arco-íris não entra no `primary`" e contava arco-íris sob texto como a invariante
3 violada. O desenho de agora é outro — botão chapado, texto na cor do sistema, a
cor **atrás** de um vidro com teto medido — e a decisão é do dono. A 90 continua
verdadeira sobre o que mediu: texto branco sobre cor cheia, 4,87:1.

Três decisões fechadas com ele antes de escrever: **chapado mantendo a inversão**
da marca (preto no claro, branco no escuro — o vidro é da cor do botão, então é
branco no escuro e preto no claro); **a tinta tem teto e é medida**; e o clique
afunda 1px pela base, mais nada.

#### O desenho

Lava sob vidro fosco, que segue o dedo — cinco camadas de `background-image` no
próprio botão, em `@utility primary-wash`:

1. **O vidro**, por cima: um `radial-gradient` de `--primary` em `color-mix`,
   centrado no ponteiro, fino no centro (`--button-glass-min`, 36%) e grosso na
   borda (`--button-glass-max`, 76%). É a peça que faz as duas coisas do pedido
   de uma vez — "mais forte perto do mouse, mais branco nas laterais" **e** o
   teto de contraste do rótulo.
2–9. **Oito blobs, uma parada da marca cada** — teal a lima —, elipses macias
   que caem a transparente aos 70% do raio, cada um centrado no ponteiro mais um
   deslocamento **orbital** com raio (24–38px), fase (i/8) e sentido próprios.
   Nasceram quatro, de matizes afastados; o dono pediu "todas as cores do
   arco-íris", e com oito a lava lê como o degradê da marca, não como manchas. Uma volta em 8s: a cor respira em vez de girar. Cursor parado,
   a lava anda; cursor andando, ela vai junto.

**Quem liga é `--button-wash`**, uma `@property` tipada de 0 a 1, no cursor, no
toque (regra H) e com o popover aberto. Ela multiplica a transparência do vidro:
em 0 o vidro é 100% opaco e o botão é chapado; em 1 ele afina até o teto. Não é
`opacity` — apagaria o rótulo junto — e não é `hover:bg-*`: o fundo não muda de
cor. Registrada pela razão do `--brand-angle`: só variável tipada interpola, e é
isso que dá entrada e saída suaves com a transição da casa. **Os blobs são sempre
pintados**; é o vidro que os mostra ou esconde.

**A órbita pausa em vez de desligar** (`animation-play-state`), a decisão do
`brand`: ligar só dentro do `hover:` faria a lava saltar ao ponto zero a cada
entrada. Medido: `paused` a 0ms em repouso, `running` a 1016ms um segundo depois
de o cursor entrar.

**A posição do ponteiro** chega em `--button-mx`/`--button-my`, em px relativos à
caixa, escritas por `onPointerMove`/`onPointerDown` no `Button` por
`setProperty` — sem estado, sem re-render, o precedente do marcador do `Tabs`. Os
handlers compõem com os de quem chama; com `asChild` o `Slot` os funde no filho.
`pointerdown` escreve também, para o toque acender onde o dedo pousou. Sem
ponteiro (teclado), o padrão é o centro, e o foco **não** acende o wash — foco
não é intenção de clicar. O `button.tsx` ganhou `"use client"` por isso.
`sin()`/`cos()` são o primeiro uso de trigonometria em CSS do projeto.

#### Por que nada é pseudo-elemento

`ButtonGroup` escreve `[&>[data-variant=primary]]:before:hidden` — um `::before`
sumiria calado dentro de um grupo (medido na 97). E um `::after` em `z` negativo
fica atrás do próprio `background` (a medição do `brand`, rodada 83). Camadas de
`background-image` não disputam empilhamento com nada, e o `bg-clip-padding` da
base já as recorta. Chapado e sem borda, o primário caiu na emenda do
`secondary` no `ButtonGroup`: o vão transparente de 1px.

#### O que saiu

A tecla inteira — `--primary-edge`, `--primary-highlight`, `--primary-sheen`,
`--primary-shadow-drop`, `--primary-shadow-value`, `--primary-shadow-pressed-value`,
nos dois temas, e `--color-primary-edge` do `@theme`. Da variante: o contorno, os
dois `shadow-(…)`, `hover:`/`active:bg-primary-hover`, `disabled:shadow-none`.
`--primary-hover` fica: o `brand` o lê como `--brand-fill`. O ladrilho da aresta
saiu de `/designsystem/colors`.

#### Calibração e medição

A primeira versão dos blobs (elipses de 55–60% da largura, órbitas de 18–30px,
vidro a 92% na borda) cobria uns 60% do botão; o pedido é "quase todo, com as
laterais mais brancas". Os blobs foram a 75–85% da largura, as órbitas a 24–36px
e o vidro na borda a 76%. Visto ampliado 2,4× nos dois temas, com o ponteiro na
esquerda, no centro e na direita: a cor segue o ponteiro e a borda longe fica
na cor do botão.

`scripts/primary-wash-contrast.mjs` é a guarda: força `--button-wash: 1`, varre
8 fases da órbita × 5 posições do ponteiro (centro do rótulo e quatro pontas) × 2
temas, esconde o texto e amostra o pior pixel na caixa do rótulo. **80 células,
piso 4,5, pior caso 5,54** (claro, fase 0, ponteiro no centro); no escuro, 8,81.
O vidro nasceu a 45%/84% (pior caso 5,94) e o dono pediu as cores mais vivas: a
32% o rótulo caiu a **4,49** e reprovou por um centésimo; 36% passou a 4,86 com
quatro blobs, caiu a 4,63 com oito empilhados na ordem do arco-íris, e voltou
a **4,86** com a pilha intercalada — 0,36 de folga, e é o teto de quanto a lava
pode subir sem trocar a tinta do rótulo.

**A ordem da pilha é desenho, e foi medida na tela.** A primeira camada de
`background-image` pinta por cima; com as oito na ordem do degradê, os três
azuis vizinhos (teal, azul, índigo) ficavam no topo e a lava saía **ciano** —
coral, âmbar e magenta existiam e não apareciam. Intercalar frio e quente (teal,
coral, índigo, âmbar, magenta, lima, violeta, azul) é o que faz as oito lerem.

**Mais vivo, e uma névoa nas bordas.** O terceiro pedido foi "um frosty feel
nas bordas, já que o centro vai ficar mais vivo, e as cores do arco-íris mais
vivas no fundo". Vivacidade sem tocar no contraste é **croma**: os blobs passaram
a `oklch(from var(--brand-x) l calc(c * 1.3) h)` — claridade intacta, que é o
que o contraste do rótulo mede — e a queda foi de 70% para 80% do raio. A névoa
é um `box-shadow` **interno** borrado da cor do botão (`inset 0 0 18px 3px` mais
um fio de 1px), ligado pelo `--button-wash`: em repouso é transparente e o botão
continua chapado; mora na utility e não numa classe `shadow-*`, que a asserção 3
proíbe. Com a névoa branqueando a borda, o vidro na borda afinou de 76% para
70%. Remedido: **4,99** no claro, 11,23 no escuro — subiu, porque a névoa cobre
a ponta do rótulo perto da borda.

**"Ainda mais vivas e aparentes."** Croma dos blobs de ×1,3 para **×1,7**, queda
de 80% para **90%** do raio, vidro na borda de 70% para **58%**. O vidro no
ponteiro foi testado a 28% (**3,95**, reprova), 33% (4,37), 35% (4,49 — um
centésimo) e ficou em **36%**: 4,61 no claro, 9,72 no escuro. É a régua desta
peça: a vivacidade sobe pelo croma, pela queda e pela borda; sob o rótulo, o
vidro não passa de 36% sem trocar a tinta do texto.

**"Ainda mais vivas" — e o teto se mexeu, porque a claridade estava errada.**
Com o vidro no limite, o teal continuava dominando: no tema escuro as paradas
mais claras (teal 0,82, âmbar e lima 0,88) atravessam o vidro branco saturadas
e as escuras (índigo e violeta, 0,66) viram pastel cinza. Igualar a claridade
das oito é o que faz todas aparecerem — e claridade fixa e única (0,78) reprovou
a **3,95**, porque no tema claro o vidro é preto e o rótulo é branco: clarear o
blob come o contraste dele. A claridade virou token **por tema**,
`--button-lava-l` (0,56 no claro, 0,8 no escuro), e com ela o rótulo subiu a
6,92. Essa folga é vivacidade não usada: o vidro desceu a 28%/50% (6,10) e a
**22%/44%**, onde ficou — **5,54** no claro, 8,81 no escuro. O vidro no
ponteiro saiu de 36% para 22% sem perder o piso, porque o que limitava não era o
vidro, era a claridade dos blobs.

Uma armadilha de método no caminho: um laço `for par in "28 50"` com
`set -- $par` **não divide palavras no zsh**, e o `sed` gravou `28 50%` como
valor. O CSS ficou inválido, o wash caiu, e o script mediu **17,18** — o número
do rótulo sobre o botão chapado. Um resultado bom demais é sintoma.

**"Sempre começar com uma cor diferente do arco-íris."** A causa era a pilha,
não a fase: os blobs são elipses de 75–85% da largura e **todos** cobrem o
ponteiro, então quem lê no ponto de entrada é a camada de cima — fixa no CSS,
sempre o teal. Girar a órbita não muda isso. A cor de cada camada virou
variável (`--button-blob-1..8`, padrão intercalado na utility), e o `Button`
gira a atribuição a cada `pointerenter`: as mesmas oito paradas exatas, em
outra ordem — e **nunca a mesma ordem duas vezes seguidas**, porque um sorteio
puro repetia a anterior 1 vez em 8 (medido na tela: lima, lima). O passo é
sorteado entre 1 e 7 sobre a rotação anterior, guardada em `data-lava-r`.

**"Deixou de mudar as cores" — a lava respira.** Com o giro na entrada, ficou
evidente que **durante** o hover a cor sob o cursor não mudava. Medido nas quatro
fases da órbita com o ponteiro fixo: a camada de cima ficava sempre a 25–28px do
ponteiro — num raio de ~205px, quase opaca —, e a órbita só a deslocava sem
tirá-la de cima. Lava-lamp não é só mancha que anda; é mancha que incha e apaga.
Cada blob ganhou opacidade pulsante sobre `--button-lava`, com a fase da própria
órbita: quando o do topo está no vale, os de baixo aparecem, e a cor sob o cursor
atravessa a pilha numa volta.

**A forma do pulso foi medida por pixel**, com um script descartável que clona o
botão em oito fases, ponteiro fixo no centro, e lê o pixel sob ele (tema escuro,
rotação 0). Seno puro de 0,3 a 1: os oito blobs ficavam todos a meia opacidade ao
mesmo tempo, e o pixel virava uma **média cinzenta** — matiz preso entre 131° e
179° (a família do topo) e saturação caindo a 0,06. O cubo do seno
(`pow(…, 3)`, piso 0,12) acende só dois ou três por vez: **sete matizes
distintos** numa volta (38 → 161 → 180 → 184 → 138 → 345 → 359 → 100°). Expoente
2 com piso 0,2 e 2,5 com piso 0,18 deram menos matizes e o mesmo vale. Fica o
cubo. Os vales de saturação (~0,05 em duas das oito fases) são a lava respirando,
e ficam. Girar o matiz (`h + lava·360°`) foi
descartado: ciclaria a cor, mas as camadas deixariam de ser as paradas da marca e
a pilha andaria em bloco — "arco-íris rodando", não lava. Contraste remedido nas
192 células: **5,55** no claro, 6,70 no escuro. O script de contraste passou a varrer as oito rotações
da pilha com o ponteiro no centro do rótulo, além das cinco posições na ordem
padrão — 208 células.

#### Os testes

`button-primary.test.ts` foi reescrito: ficam a 1 (agora "o cursor não troca o
fundo"), a 2, a 6 (com `--button-wash` na lista de transição) e a 8; saem as da
tecla; entram chapado, o wash nos três estados, a órbita que pausa, os seis
tokens que não existem mais em tema nenhum, nada de pseudo-elemento (lendo o
`button-group.tsx`), e a anatomia da lava (cinco camadas, o vidro lendo
`--button-wash`, oito blobs lendo `--button-lava`, um por parada, as duas `@property`). A 9
mudou de sentido: o primário veste o arco-íris pela utility, o `brand` continua
sendo contorno e halo. `button-touch-response.test.ts` passou como estava —
`fundos()` conta `hover:bg-*`, e o primário deixou de ter qualquer um.

#### Fallout

`globals.css`, `button.tsx`, `button-group.tsx`, `button-primary.test.ts`, o
script novo, as páginas `button` e `colors` do catálogo (a seção da tecla virou a
da lava, com um espécime largo para ela ter onde andar; uma frase morta sobre a
varredura do link foi corrigida de passagem), a prosa do `bottom-bar.tsx` e o
`AGENTS.md`. Nenhuma rota, nenhuma jornada.

**O que ficou sem verificar:** o toque num telefone de verdade (o `pointerdown`
escrevendo a posição do dedo foi lido no código, não sentido), e o Safari do
iOS com `sin()`/`cos()` em `calc()` — a especificação e o Chromium cobrem, o
PWA roda lá.


### Rodada 99 — os outros pesos preenchem no hover, a partir do ponteiro

**O pedido.** "O hover do secundário, do terciário e de todas as outras versões
que não sejam o primary deve ter uma animação que preencha o botão com a cor do
hover — não simplesmente troque a cor —, de forma rápida." Duas decisões fechadas
antes: só os quatro que preenchem (`brand`/`brandOutline` já têm o giro do
arco-íris, `link` é texto), e o preenchimento **nasce no ponto onde o cursor
entrou** — coerente com o primário, e reusa o mesmo rastreio.

**O mecanismo foi validado antes do plano**: uma `@property` de
`<length-percentage>` interpola dentro de um `radial-gradient` (149% a meio
caminho, 150% no fim), com a curva da casa. `circle` sem tamanho é
`farthest-corner` — o raio do degradê é a distância ao canto mais longe —, então
**100% cobre a caixa a partir de qualquer ponto**, sem folga.

**O desenho.** `@utility button-fill`: um `radial-gradient` em `background-image`
centrado em `--button-mx`/`--button-my`, da cor `--button-fill-color` até
`--button-fill` e transparente 1px depois. Cada peso declara só a cor e liga o
raio no cursor, no toque (regra H) e, onde o expandido pintava, em
`aria-expanded`; sai o par `hover:bg-*`/`active:bg-*`. A lista de `transition` é
restatada com `--button-fill`, porque o `tailwind-merge` troca a classe em vez de
acrescentar. Pseudo-elemento, não: o `ButtonGroup` usa o `::before` de todo filho
como divisor, e um `::after` em `z` negativo fica atrás do `background` — as duas
medições das rodadas 97 e 98. O rastreio de ponteiro do `Button` deixou de ser só
do primário (`PESOS_COM_PONTEIRO`); o giro da lava continua só dele.

**Os alfas são compostos, não copiados.** O disco pinta **por cima** do fundo de
repouso, e copiar o alfa do hover antigo empilharia duas camadas: `destructive`
claro tem repouso 0,10 e hover 0,20, então `0,10 + a·0,90 = 0,20` dá **11%**;
escuro 0,20 → 0,30 dá **12,5%**; `outline` escuro 0,30 → 0,50 dá **29%**.
`secondary` recebe `--secondary-hover` opaco e `tertiary` recebe `--muted`
(escuro: `--muted` a 50%, como antes).

**A conta foi provada por pixel.** Um script descartável clonou cada peso duas
vezes — o disco a 100% sobre o repouso, e o hover antigo reproduzido pelos tokens
em `background-color` inline — e leu o pixel central dos dois, nos dois temas.
Desvio máximo **5/255** (o `tertiary` escuro: `--muted` a 50% em `oklab` composto
sobre a página, contra o alfa do Tailwind); no claro, 0 a 1. A primeira versão do
script media o repouso em vez do hover antigo, por dois motivos que valem
registrar: a classe do hover somada à do repouso deixa a **ordem da folha**
decidir, e `bg-secondary-hover` **deixou de ser emitida** assim que saiu do
fonte — o Tailwind só gera o que vê. A linha de base certa é a cor pelos tokens,
inline.

**`AlertAction` era o único consumidor que sobrescrevia o hover do `tertiary`**
(`hover:bg-current/10` mais o par `dark:` obrigatório, porque `&:hover` e
`&:is(.dark *)` empatam em especificidade). Sem o `hover:bg-muted` para anular,
ele passou a pôr `currentColor` a 10% em `--button-fill-color`: a mesma cor,
agora preenchendo. **A primeira versão veio sem o par `dark:`**, com o
argumento de que `currentColor` inverte sozinho — e a medição na página do
catálogo derrubou o argumento: no escuro o disco do alerta saía no cinza de
`--muted`, porque o `tertiary` declara a cor sob `dark:` e `.dark *` mais classe
vence a classe simples. O par entrou; a razão não é cor, é especificidade — a
mesma armadilha que o `hover:bg-current/10` anterior já tinha pago.

**Os testes.** O teste 1 de `button-touch-response.test.ts` trancava as quatro
classes literais do `tertiary` (`hover:bg-muted`…); a regra que ele guarda — o
toque pinta o que o cursor pinta — continua, no par `hover:`/`active:[--button-fill:100%]`.
Os testes 2 e 3 passaram como estavam (`fundos()` conta `hover:bg-*`, e os quatro
deixaram de ter). Entrou o teste 5: os quatro vestem `button-fill`, declaram a cor
(com par `dark:` em `color-mix` onde o hover antigo tinha `dark:`), a transição
resolvida carrega `--button-fill` **e** `translate`, `brand`/`brandOutline`/`link`
não vestem, e a `@property` existe com `<length-percentage>`.

**Um desvio de método**: ao reescrever o teste 1 por fatia de arquivo, a
constante `PENDENTES` — que morava entre o 1 e o 2 — foi junto, e os testes 2 e
3 quebraram por referência, não por regra. Restaurada com o comentário.

**"Quase imperceptível" — o ritmo virou exceção.** Com `--duration-fast` e
`--ease-out` o disco chegava a 95% do raio em 60ms dos 150 (lido no hover real)
e lia como um piscar. Os quatro pesos entraram em `RITMO_PROPRIO`, a tabela que a
asserção 6 mantém para quem foge do ritmo da casa com a razão escrita:
`--duration-slow` (300ms) com `--ease-emphasized` — tokens existentes. A mesma
duração alcança `color` e o `translate` de 1px do clique, que a 300ms não se
nota. O plano tinha dito "sem exceção nova" e estava errado: a exceção existe
para isto.

**Fallout:** `globals.css`, `button.tsx`, `alert.tsx`, `button-touch-response.test.ts`,
`button-primary.test.ts` (a tabela de ritmo), a página `button` do catálogo e o
`AGENTS.md`. Nenhuma rota, nenhuma jornada.


### Rodada 100 — o giro sai, a lava entra, o campo para de listrar

**O pedido, olhando `/designsystem/colors`.** Duas queixas numa mensagem.
A primeira: *"primeiro girando, não é uma animação que eu quero usar em nenhum
lugar de site, está péssimo, feio e horrível. A animação que a gente está usando
de rainbow é um efeito de lava, onde as cores transitam blobs dentro de um
componente."* A segunda: *"o brandfield eu quero que você melhore a transição
para cada cor pra que elas fiquem mais integradas nas transições, para que não
fique fios bem aparentes de cada cor."*

**Isto desfaz a rodada 83, que criou o giro, e a 88, que o fez pintar.** As duas
continuam verdadeiras sobre o que mediram — a cônica lia como roda de cores, e
um `var()` dentro de uma propriedade personalizada é resolvido onde ela é
declarada. O que caiu foi o movimento, não as medições.

**O fio não era o que parecia, e medir primeiro economizou a rodada errada.**
Três hipóteses foram à medição, em canvas, no tema escuro:

| hipótese | medida | veredito |
| --- | --- | --- |
| as paradas estão mal espaçadas | razão de velocidade perceptual entre segmentos **1,29×**; pior quebra de derivada **1,37×** (coral) | **não é** |
| alguma parada estoura o gamut | pior perda de croma **0,012** (coral) | **não é** |
| o matiz não corre parelho | pico **36,1°/5%** em 65–70% contra vale de 9,0° — razão **4,01×** | **é** |

A travessia magenta→coral gasta quatro vezes mais matiz por pixel que o azul, e
é ela o traço que se via cortando o campo. A causa é a interpolação: um
`linear-gradient` sem espaço declarado interpola em **sRGB**, que corta a corda
do arco de matiz em vez de percorrê-lo. `in oklch shorter hue` derruba o pico
para **26,3°** (razão 2,96×) — **uma linha**, e ela conserta os três consumidores
de uma vez, porque todos leem `--brand-rainbow`.

Uma primeira medição deu números absurdos (razão de velocidade 18×, magenta→coral
com 56% da rampa) e foi descartada: `getComputedStyle(el).color` devolve **a
string oklch**, não `rgb()`, e o regex de dígitos estava lendo `0.72, 0.28, 335`
como se fossem canais. *Um resultado extremo demais é sintoma* — a mesma lição
que a rodada 98 registrou com o `17,18` do zsh. A medição válida rasteriza o
degradê num `CanvasGradient` e lê pixel.

**A rampa de taxa constante existe, foi vista e foi recusada.** Largura
proporcional ao matiz percorrido dá `0 · 8,5 · 22,7 · 31,5 · 47,4 · 68,8 · 86,4 ·
100` e zera a razão — mas rebalanceia a marca para o quente, com magenta e coral
ganhando banda e teal e azul encolhendo pela metade. O dono ficou com as posições
de hoje.

**O vale de claridade ficou para depois, com candidatos.** O segundo mecanismo do
fio não é matiz: a luminosidade vai **0,82 (teal) → 0,656 (violeta) → 0,88
(lima)**, um vale de **0,224**, que sai como faixa escura no meio e platô claro no
fim. Mexer nisso atinge wordmark, botão, badge, `ColorTile` e identidades, e
arrasta remedição de `primary-wash-contrast`, `tile-contrast` e `brand-grain-ab`.
O dono pediu para **ver antes**, pelo método da rodada 84 — faixas de largura
cheia, não objeto pequeno. Nenhum token se mexeu.

**A receita da lava do botão não se transplanta, e isso foi medido antes de
escrever.** Em caixa de 468×96, a composição do `primary-wash` sai errada por
dois motivos independentes:

- o raio da órbita está em **px** (24–38) e as elipses medem `80% 190%`: numa
  região cada blob cobre a caixa inteira e a lava sai **de uma cor só**;
- o alfa pulsante (`sin³`, piso 0,12) soma oito matizes translúcidos e o
  resultado é **pastel** — na tela, mais lavado que o degradê que ele veio
  substituir. Foram quatro variantes até o diagnóstico: alfa cheio, piso 0,35,
  piso 0,55 e cor crua sem o `--button-lava-l`; todas pastel.

`@utility brand-lava` é outra geometria: **raio em `%`** (a lava acompanha a
caixa em vez de encolher quando ela cresce), **núcleo opaco** até 38% com só a
franja translúcida, e **nenhum pulso de alfa** — quem faz a cor mudar é a
sobreposição andando, que é o que a palavra lava quer dizer. As âncoras avançam
da esquerda para a direita **na ordem do degradê** (6 · 18 · 30 · 42 · 54 · 66 ·
78 · 92), ziguezagueando na vertical: é o que preserva a leitura da marca agora
que o degradê linear não está mais embaixo. A rodada 98 já tinha medido o avesso
disso no botão — oito blobos empilhados no ponteiro na ordem da rampa saíam
**ciano**.

As âncoras começaram em `4 · 16 · 31 · 45 · 58 · 72 · 86 · 98` e a lima não lia:
um blob de 32% de largura ancorado em 98% joga metade fora da caixa. Puxadas para
dentro, as oito cores aparecem.

**Cobertura, sem base para segurar.** O dono escolheu a lava **substituindo** o
degradê, e não sobre ele — então preto vaza onde nenhum blob alcança. Verificado
em quatro proporções (468×96, 240×240 quadrado, 160×420 alto, 64×64): **nenhum
vazamento**. O quadro 0 também tem que ser um quadro bom, porque
`prefers-reduced-motion` congela a órbita ali e não há degradê embaixo — as fases
`i/8` garantem que em `--brand-lava: 0` os oito já estão espalhados.

**Nomes próprios, e a razão é um teste.** `--brand-lava` e `@keyframes brand-lava`
não reusam os do botão: `button-primary.test.ts` (asserção 11) conta exatamente
**24** ocorrências de `var(--button-lava)` dentro de `primary-wash` e trava o
formato literal dos oito blobos. Pela mesma razão `primary-wash` **não** foi
refatorada para compor a lava da marca: são dois papéis, e o do botão existe para
segurar o contraste de um rótulo (`--button-lava-l`, `calc(c * --button-lava-c)`)
que aqui não existe.

**Posição no arquivo é carga estrutural, de novo.** A utility nasce depois de
`@utility brand-field`, com doc-comment `/**` próprio. A faixa entre
`@utility glass` e `no-scrollbar` está interditada: `glass.test.ts` fatia ali e a
asserção 8 reprova até a **palavra** `background` num comentário, e
`sidebar-ladder.test.ts` fatia a mesma região outra vez.

**A pintura acompanha a variável — o defeito da 88 não voltou.** Medido no
elemento: `--brand-lava` andando (0,993 → 0,134 → 0,277) **e** o
`background-image` computado resolvendo a posição (`at 5,15% 33,71%`). Em 88, o
ângulo andava de 0 a 212deg com o degradê cravado em `135deg`.

**O grão do campo foi remedido, porque a base sob ele mudou.** σ da diferença
entre pixels vizinhos, `scripts/brand-grain-ab.mjs`: **9,58/9,82 → 9,47/9,77**.
Praticamente parado, e era a previsão — o `overlay` rende pela luminosidade da
base, e a interpolação move o **matiz**. A tabela no comentário de
`@utility brand-field` foi atualizada.

**O botão de marca não ficou inerte.** Com o giro fora, `brand` e `brandOutline`
mantêm o halo acendendo no cursor (`hover:after:opacity-80`, medido 0,5 em
repouso) e o preenchimento trocando de `--brand-fill`. Saiu só a animação.

**A coluna morta.** A tabela `ESCALA` da página `brand` tinha uma quinta coluna,
"gira/parado", e com o giro fora ela passaria a dizer "parado" quatro vezes.
Coluna com um valor só não carrega decisão: saiu.

**Fallout:** `globals.css` (fora: `@property --brand-angle`,
`@keyframes brand-rotate`, `@utility brand-rainbow-live`, `--brand-spin`; dentro:
`@property --brand-lava`, `@keyframes brand-lava`, `@utility brand-lava`, e a
interpolação em `brand-rainbow-image`), `button.tsx`, `app-wordmark.tsx`,
`app-logo.tsx`, as páginas `colors` e `brand` do catálogo, e o `AGENTS.md`.
`npx tsc --noEmit`, `npm run lint` (0 erros) e `npm run test:unit` (70 arquivos,
635 testes) passam sem nenhum teste tocado. Nenhuma rota, nenhuma jornada.

**O suporte virou `@supports`, e a razão é sutil.** As fontes divergem sobre o
Firefox (113 ou 127), e o modo de falha aqui **não** é degradar para sRGB: o
degradê mora numa **propriedade personalizada**, cujo valor não é validado na
análise — é um fluxo de tokens. Um `in oklch` desconhecido só é descoberto no
**uso**, onde vira inválido-em-tempo-de-valor-computado e o `background-image`
cai para `none`. A marca sumiria inteira. `brand-rainbow-image` declara o sRGB
primeiro e sobrepõe o oklch dentro de
`@supports (background-image: linear-gradient(in oklch, red, blue))` — o único
lugar onde a pergunta pode ser feita antes.

**De quebra, a página `colors` emagreceu 27%** a pedido do dono, de "Como ler os
ladrilhos" para baixo (5.283 → 3.907 caracteres de prosa). A régua do corte: a
página carrega a **regra**, e a história das rodadas mora neste arquivo — saiu a
narração ("na rodada 89", "por três rodadas a identidade foi uma mancha
radial"), ficou o que alguém precisa para usar o token. O desequilíbrio era num
bloco só: "O arco-íris mora só na marca" tinha **964 caracteres**, 2,5× o
seguinte, e foi para 543; a distribuição ficou 118–543, sem outlier. Nenhuma
decisão perdeu a única cópia — `text-primary` proibido, a 1.4.11 reprovando de
propósito, a exceção do `--chart-1`, a inversão de "ninguém é dono de uma cor".
E "As seis cores, e de onde elas vieram" virou "As seis cores", porque o título
prometia a origem que o corte tirou.

**Ficou por fazer:** o vale de claridade, com os candidatos pendentes.


### Rodada 101 — o anel de foco desce de 70% para 45%

**O pedido.** *"Deixe os indicadores dos actives dos inputs mais suaves."*
Olhando um `Input` focado no escuro, o anel é um marca-texto: 3px de `--ring`
(quase branco) a 70% contra um cartão quase preto.

**Medir contra o cartão é medir metade — e a primeira leitura caiu nisso.**
Ela deu 3,16 para o 45% no claro e foi apresentada ao dono assim. A régua certa
são as **sete** superfícies em que um campo focado pode pousar (`--background`,
`--card`, `--popover`, `--muted`, `--secondary`, `--accent`, `--sidebar`), nos
dois temas, e a pior delas é `--secondary`/`--accent` no claro:

| alfa | pior caso claro | pior caso escuro |
| --- | --- | --- |
| 70% (antes) | 6,94 | 7,83 |
| 50% | 3,55 | 4,74 |
| **45% (hoje)** | **3,05** | **4,12** |
| 40% | **2,63 ✗** | 3,57 |

**45 é o último valor que passa nos dois temas.** A WCAG pede 3:1, e o anel
entregava mais que o dobro disso. A correção do número foi dita ao dono antes
de qualquer código, e ele escolheu ficar no 45 — **0,05 de folga, de olhos
abertos**.

**A folga ficou sem guarda, por decisão.** Foi oferecido um script no molde de
`tone-contrast.mjs` e `tile-contrast.mjs` (7 superfícies × 2 temas), e o dono
recusou: *"45% e pronto"*. Fica registrado o que isso custa — quem empurrar
`--secondary` ou `--accent` derruba o foco da norma e **nenhum teste cai**.

**O escopo é o sistema inteiro, e são 37 grafias.** O anel não é importado
fora dos oito controles de campo, e isso é decisão antiga (`radio.tsx`:
"importar só o anel esconderia que o resto diverge"). Então a troca passou por
`field-classes.ts` (as duas constantes, campo e moldura — `field-classes.test.ts`
exige bijeção), 25 componentes de `ui/`, `disclosure-classes.ts`, três arquivos
do catálogo, e o bloco de CSS cru do Sonner, que reimplementa o anel à mão
porque `ring-3` sozinho apaga a sombra de elevação do toast.

**Oito arquivos de app estavam em alfa cheio**, com `ring-2` + `ring-offset-2`:
as faturas do dashboard, os cartões de conta e de categoria, o tile de cartão e
`transaction-form-fields`. Eles entraram **só pelo alfa**. Deixá-los de fora
faria deles o indicador mais duro do app depois da rodada, que é o inverso do
pedido; a divergência de **geometria** (a única grafia de `ring-2` viva fora do
`Tabs`, que já migrou) fica nomeada e não consertada de passagem.

**Dois testes gravavam o 70% e mudaram junto** — `field-control-ladder.test.ts`
(asserção 8) e `bottom-bar-ladder.test.ts` (asserção 8). Eles codificavam o
valor antigo; atualizá-los é parte da mudança, não efeito colateral. O que
**não** se mexeu: as asserções que travam `ring-3` (`tabs-size-ladder`,
`item-size-ladder`) e os valores literais de `--ring` nos dois temas.

**A transição ficou de fora, e é o teto conhecido desta rodada.** O anel do
campo é o único que **estala**: `fieldSurfaceClassName` declara
`transition-colors`, que não cobre `box-shadow` — onde o anel vive —, enquanto
o `Button` transiciona `box-shadow` e o dele esmaece. Medido nos dois. É o
ganho de suavidade que não custa contraste nenhum, e o dono escolheu *"não, só
baixar a tinta"*.

**Verificação de que a classe chegou ao CSS**, que é a armadilha que esta casa
já pagou: lidas as regras geradas na folha de estilo — 9 regras com
`color-mix(in oklab, var(--ring) 45%, transparent)` e **zero** com 70% —, e o
`box-shadow` computado de um campo focado nos dois temas
(`oklab(0.985 0 0 / 0.45) 0 0 0 3px` no escuro, `oklab(0.145 0 0 / 0.45)` no
claro). Armadilha de método anotada: o painel do navegador roda **sem foco de
janela**, então `document.hasFocus()` é falso e `:focus-visible` não casa —
`.focus()` por script não pinta o anel, e a medição precisa de um clique real.

**Fallout:** 42 arquivos. `field-classes.ts` (com a tabela das sete
superfícies), `globals.css`, 25 componentes de `ui/`, 8 de app, 3 do catálogo,
`disclosure-classes.ts`, os 2 testes e o `AGENTS.md`. `npx tsc --noEmit`,
`npm run lint` (0 erros) e `npm run test:unit` (70 arquivos, 635 testes)
passam. Nenhuma rota, nenhuma jornada.

**Ficou por fazer:** a transição do anel; o script de guarda das sete
superfícies; a geometria dos oito (`ring-2` + `ring-offset-2` → `ring-3`); e
`--sidebar-ring`, que é uma segunda grafia dos mesmos dois valores de `--ring`,
mantida à mão e sem teste.


### Rodada 102 — o `Progress` vai buscar as barras que nunca o usaram

**O pedido.** Melhorar o `Progress` e adequá-lo ao branding novo. O
levantamento mudou o problema antes de qualquer desenho: **o caso de uso que o
componente descreve não tinha um único consumidor.**

Os dois usos reais eram "parcelas pagas" (`success` + `sm`), e os tons de
dinheiro — criados na revisão anterior justamente para a barra de orçamento —
estavam em **zero**. Enquanto isso, **cinco barras feitas à mão** faziam o
trabalho dele: uso do orçamento na listagem e no detalhe da categoria,
participação nas despesas, uso do limite estimado do cartão e uso da fatura
aberta no tile. As cinco com `bg-muted` no trilho — o token que o `Progress`
abandonou por sumir no tema claro —, quatro redeclarando a altura que o eixo
`size` existe para eliminar, e a do tile com `role="presentation"`, sem
anunciar nada.

**As duas rampas de limiar não eram uma duplicata, e a leitura do código
corrigiu a minha primeira descrição.** Orçamento: `≥85%` âmbar, `>100%`
vermelho. Limite de cartão: `<30%` verde, `<70%` âmbar, daí vermelho — com um
comentário que já justificava a diferença ("uso do limite é estado, não direção
de dinheiro"). São duas perguntas com a mesma forma, e por isso o componente
recebe os **cortes** em vez de cravar 85. Hoje elas moram lado a lado em
`lib/budget-bands.ts`, e um teste pergunta por quê se alguém as uniformizar.

**Quatro candidatos de forma, e dois reprovaram por razão escrita.** A barra
sem trilho diz "45", não "45% de" — é o defeito que o próprio componente já
tinha consertado. A trilha segmentada quantiza em degraus de 5%, e 90% e 92%
desenham igual. Sobraram a cesura do limiar e a faixa de excesso, que eram
complementares; a segunda volta as combinou e mediu **o caso que decide: hoje
104% e 400% desenhavam o mesmo pixel.** Venceu o excesso **transbordando** para
fora do trilho, e não dividindo-o: assim o trilho continua valendo o total
sempre, e duas categorias lado a lado continuam comparáveis — que é o caso
real, uma grade de cartões. A pastilha satura, então 400% e 1000% ainda
desenham igual: uma mentira menor que a anterior.

**O fio de arco-íris reprovou na altura real, e a conta é simples.** No
`Button` de 32px, 1px de contorno de cada lado é 1/16 da peça; num trilho de
6px é **2 de 6, um terço**, e em 8px um quarto. Na tela o fio engolia o
preenchimento: as faixas com contorno liam como barra de arco-íris com um risco
branco no meio. Só a partir de 14px ele começava a funcionar. O halo sobrevivia
nas três alturas — **e o dono escolheu nenhum dos dois: o arco-íris
preenchendo**, que era a faixa que eu tinha posto na grade só como comparação.

**Isso levantou duas objeções, e as duas foram medidas.** A primeira era
funcional: com arco-íris no preenchimento a cor deixa de codificar o valor. Ela
morreu com um segundo par de candidatos — **o degradê é do trilho, e o
preenchimento o revela**. Em 15% a barra é teal, em 72% chegou no coral, e o
arco-íris só fica completo em 100%: completar a barra completa a marca, e a cor
volta a dizer o valor. Escalado ao preenchido ele estaria sempre inteiro e não
diria nada. A conta que torna isso possível sem um nó a mais: o indicador mede
`pct%` do trilho, então `10000 / pct` por cento da largura **dele** é a largura
do trilho, e `background-size` em porcentagem resolve contra a caixa do próprio
elemento.

A segunda objeção era de contraste, e **vetou o tema claro**: contra o trilho
do sistema, **cinco das oito paradas reprovam** a 1.4.11 — lima 1,42, âmbar
1,51, teal 1,73, azul 1,87, coral 2,53 —, porque no claro o trilho é
`oklch(0.9)` e as paradas das pontas são quase tão claras quanto ele. No escuro
passava tudo, pior caso 4,52. A causa é histórica: **o arco-íris deste sistema
sempre morou sobre preto** (`brand-field`, `brand-lava`), e esta foi a primeira
vez que pediram ele sobre um cinza claro. O dono escolheu o leito preto nos
dois temas — `@utility brand-well` —, medido contra `--foreground` (3,68) e
`oklch(0.22)` (3,21): preto puro dá **3,91** e é o mesmo valor que as outras
duas peças de marca já usam.

**Uma medição que economizou uma mudança de token:** o ângulo. `--brand-rainbow`
é 135°, e a suspeita era que numa caixa de 8px ele precisasse virar 90°. Os dois
desenham **igual** — numa barra o eixo horizontal domina —, então
`brand-rainbow-image` entrou como está e o `globals.css` não ganhou parâmetro
nenhum.

**A rodada se paga na migração.** As cinco órfãs viraram `Progress`; saíram
`budgetFillColor` (duas cópias), `limitGaugeFillClass`, cinco alturas literais e
cinco trilhos em `bg-muted`. O `grep` por `role="progressbar"` fora de `ui/`
devolve **zero**, e é uma asserção de teste agora. De passagem, o número ao lado
da barra deixou de ser limitado a 100 nos dois arquivos de categoria: ele era
`Math.min(100, …)` junto com a barra, então **104% e 400% liam igual também no
texto** — que era justamente o argumento pelo qual a doc o chamava de
obrigatório.

**E a rede nasceu.** `progress.test.ts`, oito asserções: a escada de `bands`
com os cortes inclusivos, as duas políticas continuando diferentes, o estouro
vencendo os cortes, o clamp e o `aria-valuetext` (que já regrediu uma vez), o
piso de 1%, o trilho que não volta a `bg-muted`, o leito preto da marca, e a
varredura que impede as órfãs de voltarem. Eram **zero** testes tocando o
`Progress` em 11.9 mil linhas de histórico.

**Fallout:** `progress.tsx`, `globals.css` (`@utility brand-well`),
`lib/budget-bands.ts` (novo), `progress.test.ts` (novo), as cinco telas, a
página do catálogo e o `AGENTS.md` — cuja linha do `Progress` descrevia `tone`
sem `income`/`expense` e ignorava o eixo `size` inteiro desde a revisão passada.
`npx tsc --noEmit`, `npm run lint` (0 erros, 65 avisos — o baseline) e
`npm run test:unit` passam. Nenhuma rota, nenhuma jornada.

**Não verificado na tela:** as cinco telas migradas. O painel do navegador não
está autenticado e o dev aponta para o banco de produção, então a conferência
visual foi feita na página do catálogo, com o componente real, nos dois temas.

**Adendo, na mesma rodada: o leito preto durou o tempo de ser visto.** O dono
pediu o trilho do sistema de volta, primeiro no claro — *"mais claro, mesmo
fundo de outros"* — e em seguida no escuro também. A barra de marca veste o
mesmo `bg-input-fill` de todas as outras, e a razão é de desenho e não de
número: **uma peça de marca que destoa das vizinhas não é o desenho.**

O custo fica só no claro, e fica escrito: pior caso **1,42**, a **segunda
divergência consciente da 1.4.11** desta casa, ao lado do contorno de campo. No
escuro não há custo nenhum — lá o trilho do sistema sempre passou (4,52), e o
leito preto era supérfluo desde o começo.

**A `@utility brand-well` saiu junto**, porque ficou sem consumidor: ela nasceu
e morreu na mesma rodada, e `brand-field` e `brand-lava` já declaram o mesmo
preto inline. O caminho de volta à conformidade é uma declaração de
`background-color`, escrita no componente.

**E a simetria apagou um eixo.** Com o trilho igual nos dois casos, o `variant`
do `cva` do trilho não decidia mais nada: ele saiu, e `variant` passou a existir
só onde de fato muda alguma coisa — o preenchimento.

Uma nota de método que vale para a próxima medição: a razão da WCAG é **só de
luminância**, e um teal saturado sobre cinza neutro tem contraste cromático que
a fórmula não vê — na tela ele lê melhor que 1,73 sugere. Isso explica a
discordância entre o número e o olho; não a anula, porque a lima e o âmbar são
frágeis de verdade.

**Ficou por fazer:** o `variant="brand"` **não tem consumidor no app** — o lugar
natural são os dois usos de "parcelas pagas", que são progresso sem limiar, mas
trocá-los é decisão de produto. E duas decisões de token continuam abertas:
dar valor próprio a `--income`/`--expense` sólidos, e o `default` do `Progress`
ser `--primary`, que depois da rebrand é a cor mais forte da tela numa barra que
não tem estado nenhum.

### Rodada 103 — a marca desce para os controles de escolha

**O pedido.** Uma versão de marca para o `Checkbox` e o `Radio`. Duas decisões
do dono no caminho: o arco-íris aparece **só marcado**, e o escopo inclui o
cartão do `RadioGroup`.

**O `::after` já estava ocupado, e isso decidiu o desenho.** A receita do
`Button variant="brand"` tem duas camadas — o contorno no `::before` e um halo
borrado no `::after`. Nos dois átomos o `::after` **é** o alvo de toque de 44px
(`after:-inset-3.5`), e ele não se move. Sobrou o contorno, que é o precedente
do `brandOutline` — e nesta escala é o certo de qualquer forma: um halo a
`-inset-1` sangra 4px e encosta na linha vizinha de uma lista com `gap-3`.

**Nenhum token novo e nenhuma linha em `globals.css`.** `@utility
brand-rainbow-image` já existia e declara `--brand-rainbow` no próprio
elemento; a mudança inteira coube em três arquivos de componente.

**Quem liga e desliga é uma opacidade, não a troca da camada.**
`background-image` não interpola entre um degradê e `none`, então pintar e
despintar faria o contorno estalar. Com o pseudo sempre presente e a opacidade
indo a 1 em `data-[state=checked]`, ele esmaece em `--duration-fast`.

**O núcleo vai no pseudo, e tem de ser opaco.** Numa raiz de empilhamento o
fundo *e a borda* do elemento pintam **antes** dos filhos de `z` negativo, então
o `::before` a `-inset-px` cobre os dois — nada precisa ser anulado. Com
`transparent` a camada `border-box` apareceria no miolo e o controle inteiro
viraria degradê. O valor muda por peça: `--primary` na caixa (o tique continua
branco sobre a tecla, contraste **idêntico** ao de hoje), `--background` no anel
(que não se preenche — quem marca é o ponto) e `--card` no cartão.

**O cartão troca o realce, e não o soma.** `brandCard` larga
`has-data-checked:border-primary-accent/60` e a lavagem de 5%: um contorno de
arco-íris é sinal muito mais forte que um véu, e manter a lavagem exigiria
achatar `primary/5` sobre um pai desconhecido. O rádio dentro dele **não** veste
`brand` — dois contornos aninhados são o "dois anéis na mesma caixa" que o
`radioInCardClassName` já nomeia.

**Uma colisão de tipo, a única não óbvia.** `RadioGroupItem` consome o nome
`variant` para si e espalha o resto no `Radio`; com um eixo `variant` no átomo,
os dois se cruzavam. O tipo passou a `Omit<…, "children" | "variant">`. O custo
aceito: um `Radio variant="brand"` numa linha `plain` só é alcançável usando
`<Radio>` direto. Se aparecer consumidor, a saída é uma prop `radioVariant`.

**A rede.** `brand-contour.test.ts` tranca as cinco peças que desenham o
contorno: todas vestem `brand-rainbow-image`, nenhuma declara tinta no elemento
sob um variante de marcado, os dois átomos mantêm `after:-inset-3.5` e nenhum
ganha halo. Verificado por mutação — pôr `data-[state=checked]:bg-primary` na
caixa e trocar `after:-inset-3.5` por `-inset-2` derrubam uma asserção cada.

**Fora de escopo:** o `Switch` tem a mesma anatomia e receberia a receita sem
alteração; não foi pedido.

### Rodada 104 — o vidro da placa flutuante estava certo e invisível

**O pedido.** "O dropdown do `Select` não está transparente como os outros
overlays." Depois, no meio da investigação: "quero que ele fique igual o
background do header com efeito glass, e transparente."

**A premissa não se sustentava no fonte, e a medição disse por quê.**
`select.tsx` vestia `menuPanelSurfaceClassName` — byte a byte a mesma constante
de `Popover`, `Tooltip` e `HoverCard` —, e a asserção 25 do `glass.test.ts`
proíbe que ele divirja. Medido ao vivo: `backdrop-filter: blur(24px)
saturate(1.5)` ligado, fundo `oklab(0.205 0 0 / 0.6)`, e **nenhum ancestral
criando um backdrop root** (a velha teoria de que o `popper` do Radix mataria o
borrão não é o que acontece — o wrapper tem `transform`, que sozinho não cria
backdrop root).

A causa é aritmética, e a rodada 51 já a tinha diagnosticado e arquivado: o que
está pintado atrás do painel é um `Card` em `oklch(0.205 0 0)`, e `--popover`
**é** `oklch(0.205 0 0)`. Sessenta por cento de uma cor sobre ela mesma é ela
mesma — delta **0** em RGB. No claro o mesmo, com os dois em branco puro.

**A saída já estava escrita na casa, para outra peça.** `bar-classes` diz da
barra: *"no tema escuro `--popover` e `--card` são a mesma cor: uma barra
`--popover` pousada num cartão sumiria. Quem define uma barra é o contraste
contra a superfície em que ela pousa, e não a elevação."* Uma placa flutuante
pousa em cartão exatamente como uma barra pousa. `menuPanelTintClassName` virou
um **alias** de `barSurfaceClassName` — alias e não cópia, porque este
repositório já pagou a quarta cópia da mesma forma.

**Os números, placa sobre um `Card` real:**

| | escuro antes | escuro | claro antes | claro |
| --- | --- | --- | --- | --- |
| delta RGB vs. cartão (vidro) | 0 | **24** | 0 | **9** |
| delta RGB vs. cartão (fallback 95%) | — | 36 | — | 15 |
| `--muted-foreground` | 6,94 | **7,42** | 4,74 | 4,62 |
| texto do painel | 17,18 | 18,36 | 19,80 | 19,30 |
| realce do item (`accent/60`) | 27 | **42** | 42 | 36 |

No escuro **tudo melhora**, inclusive o realce do item. O pior caso da rodada é
**4,54** — claro, sem `backdrop-filter`, sobre cartão —, e é o número que
reprova primeiro se alguém subir o alfa base. Confirmado na tela: a placa compõe
`rgb(15,15,15)` contra o cartão em `rgb(23,23,23)`.

**Duas mudanças de forma vieram junto.** A barra abre nos dois temas e a
flutuante abria só no escuro, então **o ramo `dark:` saiu** — o claro ganha
pouco (delta 9) e isso é dito em vez de escondido. E `text-popover-foreground`
virou `text-foreground`: zero pixel (os dois tokens têm o mesmo valor nos dois
temas) e a placa deixou de vestir `--popover`, então nomeá-lo apontaria para o
token errado.

**A saída que não foi tomada.** Antes do segundo pedido, o caminho desenhado era
**subir `--popover`** no escuro (0,205 → 0,24, delta 15). Ele foi abandonado por
ser pior de duas formas: mexe num token que o toast do sonner
(`--normal-bg: var(--popover)`) e quatro tooltips de gráfico também leem, e no
claro não tinha para onde subir — `--popover` já é branco puro, e descer a placa
para `oklch(0.975)` derruba o `--muted-foreground` para 4,46, abaixo do piso.
Trocar quem veste o token, em vez de mover o token, não toca em nenhum dos dois.

**O teto continua o mesmo, e é honesto dizê-lo:** aberta sobre a página nua, sem
conteúdo atrás, a placa volta a delta 0 — `--background` sobre `--background`. É
o teto do cabeçalho, e a lei que `globals.css` já escreve: borrar cor chapada
não desenha nada.

**A rede.** A asserção 23 era parametrizada por token e assumia que as duas
réguas tinham ramo `supports-backdrop-filter:dark:`; a flutuante deixou de ter.
Ela passou a cobrir **as duas tintas** (barra e modal) e a afirmar que
`menuPanelTintClassName === barSurfaceClassName`. A 23b é nova e guarda o único
espelho manual da receita: a seta do `HoverCard`, que se pinta com `fill` e não
com `background` — medido depois da troca, seta e placa saem na mesma cor.

**Ficou por fazer:** os tooltips de gráfico (`chart.tsx` mais três cópias em
`credit-cards/` e `dashboard/`) usam `bg-popover` **opaco**, flutuam sobre
gráficos dentro de cartões e sofrem exatamente o mesmo delta 0 — depois desta
rodada são as únicas superfícies flutuantes com a tinta antiga.

### Rodada 105 — o slider de marca, e a receita do `Progress` que não transplanta

**O pedido.** "Crie um slider brand."

**O eixo é um só e mora na faixa.** `sliderRangeVariants` (`default` | `brand`)
é o primeiro `cva` do arquivo, então `ds:catalog` passa a mostrar o eixo; o
trilho e o punho não mudam. Nenhum token novo, nenhuma linha em `globals.css` —
`@utility brand-rainbow-image` já existia.

**O arco-íris é da faixa, e não do trilho — e a razão é dupla.** O
`Progress variant="brand"` ancora o degradê no trilho escalando
`background-size` por `10000 / pct`, e é isso que faz "completar a barra
completar a marca". Aqui a receita não serve:

1. **Mecânica.** O `Progress` é sempre controlado e sabe a porcentagem no
   render. Um `Slider` costuma ser **não controlado** (`defaultValue`), e um
   `background-size` calculado congelaria no valor inicial e erraria no primeiro
   arraste. A posição da faixa também não é legível em CSS: o Radix escreve
   `left`/`right` **inline**, em porcentagem do trilho, e nenhuma dessas medidas
   chega a uma classe. Verificado como impossível sem estado: não há caminho
   CSS-only que ancore o degradê no trilho.
2. **Semântica.** "Completar a barra completa a marca" só quer dizer algo onde
   há um fim — progresso vai de 0 a 100 e terminar é um evento. Um slider é um
   **ajuste**: não há "completo", e quem informa o valor é a posição do punho.

O custo aceito é que a cor não codifica o valor — num campo de entrada isso é
correto, e não uma perda. **A alternativa foi considerada e descartada por
medição de tela**, não por argumento: a dúvida era o valor baixo, onde oito
paradas se comprimiriam em poucos pixels. Renderizado em 8, 25, 50 e 100% mais
um intervalo, o 8% sai como uma lasca teal-azul limpa, não como ruído.

**A divergência da 1.4.11 foi medida nesta peça, não herdada de papel.** O
trilho é `--input-fill`, o mesmo token do `Progress`:

| tema | trilho compositado | pior caso | reprovam 3:1 |
| --- | --- | --- | --- |
| escuro | `rgb(58,58,58)` | **3,40** (violeta) | **zero** |
| claro | `rgb(222,222,222)` | **1,42** (lima) | **cinco** |

As cinco do claro são lima 1,42, âmbar 1,51, teal 1,73, azul 1,87 e coral 2,53
— **idênticas às que o `Progress` registrou**, o que é a confirmação de que os
dois dividem o trilho. O leito preto que resolveria já foi recusado na tela no
`Progress`, e recusá-lo aqui é a mesma decisão: uma peça que destoa das vizinhas
não é o desenho.

**Uma medição errada que vale guardar.** No tema escuro `--input-fill` é
`oklch(1 0 0 / 15%)` — **translúcido**. A primeira leitura mediu as paradas
contra o token cru e acusou **seis** reprovando no escuro, o que contradizia o
`Progress`. O trilho tem de ser compositado sobre a superfície de baixo antes da
razão; feito isso, nenhuma reprova. Quando um número novo contradiz um registro
antigo da mesma peça, o instrumento é o primeiro suspeito — é a terceira vez que
esta casa paga essa lição.

**A rede.** `brand-contour.test.ts` ganhou a asserção 8, para a família do
**preenchimento**: as duas peças declaram `brand-rainbow-image` (é ela que
publica `--brand-rainbow`; sem ela o `bg-(image:…)` cai para `none` e a faixa
fica transparente, sem erro nenhum), dividem `bg-input-fill`, e o `Slider`
**não** pode conter a conta do `Progress` (`10000`, `backgroundSize`). Verificado
por mutação: tirar `brand-rainbow-image` da variante derruba a asserção.

**Ficou por fazer:** o punho não veste marca — ele continua
`border-primary-accent/50`, e sobre uma faixa de arco-íris isso lê limpo. Dar-lhe
o contorno de marca seria a segunda peça de marca no mesmo componente, e é
decisão de desenho, não de implementação.

### Rodada 106 — o arco-íris do slider vai para trás do trilho

**O pedido.** *"Ajuste para que o Rainbow fique atrás, ocupando toda a largura.
o que está ativo no slider só mostra o rainbow que está atrás porque senão, por
exemplo, quando fica curto ou pequeno o slider, ele mostra todas as cores e
fica estranho."*

**A rodada 105 estava certa sobre um mecanismo e errada sobre a saída.** Ela
registrou que a receita do trilho do `Progress` "não transplanta", e a parte
verdadeira continua verdadeira: **recalcular pelo `value` não serve**, porque o
`Progress` é sempre controlado e um slider costuma ser `defaultValue` — um
`background-size` calculado no render congelaria no valor inicial e erraria no
primeiro arraste. O erro foi concluir daí que a **leitura** não era possível. A
saída é **medir a caixa renderizada** em vez de recalcular, que é o padrão que
esta casa já tinha em três lugares (o marcador do `Tabs`, o `useScrollFade`, o
`--collapsible-full`) e que a própria 105 citou sem usar.

A razão semântica que a 105 também deu — "um slider é ajuste, não há completo,
então a cor não precisa acompanhar o valor" — **caiu por decisão do dono**, e é
o tipo de argumento que só se sustenta enquanto ninguém olha a tela: com a faixa
curta, as oito paradas comprimidas em poucos pixels leem como ruído colorido.

**Sem JavaScript não há caminho, e foi verificado por eliminação** (três vezes,
ao longo de duas rodadas): o arco-íris no `Track` com a faixa transparente
pinta também a parte **não** preenchida, e não há elemento que cubra o
complemento; um `::before` da faixa tem a **própria faixa** como bloco
contentor, não o trilho; um `overflow-hidden` na faixa não recorta um absoluto
ancorado acima dela na cadeia de bloco contentor; e um `background-size` fixo em
`rem` deixa trilho sem pintura num slider largo (com `repeat`, ladrilha). O
Radix escreve `left`/`right` **inline**, e CSS não lê o valor de outra
propriedade.

**A medição.** O trilho publica quatro variáveis, as de posição **já negadas**
para a classe ser um `var()` puro em vez de um `calc()` com sinal:
`--slider-rainbow-w/h` (a própria caixa) e `--slider-rainbow-x/y` (o
deslocamento da faixa). `offsetLeft`/`offsetTop` **relativos ao trilho**, e não
`getBoundingClientRect` — a regra que o `Tabs` já trancava, porque com a página
rolada o retângulo do viewport escorrega. Dois observadores, cobrindo coisas
diferentes: `ResizeObserver` no trilho **e** na faixa (janela, fonte, a faixa
crescendo) e `MutationObserver` em `style` na faixa, que é o único que pega a
faixa **andando sem mudar de tamanho** — o caso do slider de intervalo. O efeito
é condicionado a `variant === "brand"`: um slider comum não ganha observador
nenhum.

**Os fallbacks são carga estrutural, não zelo.** `var(--slider-rainbow-w,100%)`
faz o degradê preencher a faixa antes da primeira medição e sem JavaScript — a
peça **degrada para a versão da rodada 105** em vez de derrubar a declaração. É
a mesma garantia que a rampa do `Command` explora ("uma variável indefinida
derruba a propriedade para `none` — desliga o fade em vez de apagar o
componente") e a mesma postura do `Tabs`, que sem JS ainda pinta o gatilho ativo.

**Medido na tela, num trilho de 384px:**

| valor | faixa | `background-size` | `background-position-x` |
| --- | --- | --- | --- |
| 8% | 31px | **384px** | 0px |
| 25% | 96px | **384px** | 0px |
| 100% | 384px | **384px** | 0px |
| 30–75% | 173px, offset 115 | **384px** | **−115px** |

O `background-size` é a largura do **trilho** em todos, e não a da faixa. No
slider **não controlado**, mover pelo teclado levou a faixa de 96 para 100px com
o tamanho **constante** em 384px — que é exatamente o que uma versão baseada em
`value` erraria. No de intervalo, o punho de baixo indo de 30 para 31 levou o
offset de 115 a 119 e a âncora acompanhou para −119px. Em 375px de janela o
trilho cai para 293px e o `background-size` segue: o `ResizeObserver` dispara.

**Dois desvios ficam nomeados, e os dois são de ordem de cor e não de
ancoragem.** Num slider **vertical** o Radix preenche de baixo para cima contra
um `linear-gradient(135deg)` fixo, então o valor baixo revela a **lima** (o fim
do degradê) e não o teal; `inverted` e `dir="rtl"` são a mesma classe de desvio.
A ancoragem continua correta nos três, porque é medida e não deduzida do valor.
`orientation="vertical"` não tem consumidor no app.

**A rede.** A asserção 8 de `brand-contour.test.ts` mudou de forma: saiu o
`not.toMatch(/backgroundSize/)` (a peça agora **precisa** ancorar) e entraram as
quatro variáveis **com fallback**, o `bg-no-repeat`, o `offsetLeft` sem
`getBoundingClientRect`, os dois observadores e o `variant !== "brand"` que
isenta o slider comum. Verificado por mutação: tirar o `MutationObserver` e
tirar o fallback de uma `var()` derrubam uma asserção cada.

### Rodada 107 — `HistogramSlider`, a faixa de valor sobre uma distribuição

**O pedido.** Uma segunda versão de slider igual à referência do 21st
(`@ravikatiyar162/range-slider`): histograma atrás, colunas dentro da seleção
acesas, duas caixas com mínimo e máximo.

**O código da referência não foi copiado, e o motivo é factual.** Os metadados
trazem `license: ""` (vazia), `license_url: null` e `copyright_notice: null`, e
a fonte mora em `r2://components-code-private/…` — bucket **privado**, com
`copyGuard` na API. Isso é diferente dos dois precedentes desta casa, que são
**MIT com autor nomeado** (o `border-beam` de Jakub Antalik, o `link-button` de
Hyperiux). Um range slider com histograma é padrão conhecido de filtro de
preço; a peça foi construída sobre as nossas primitivas a partir do
comportamento observado na tela.

**A peça é composição, e por isso é organismo.** `Slider` (o alvo de 44px, o
anel de foco, as setas, os rótulos em pt-BR dos punhos), `StatCard` +
`StatCardLabel` + `StatCardValue` > `MoneyDisplay` para as caixas. Importar
`StatCard` já define a camada: quem contém organismo é organismo.

**O controle é o histograma.** A primeira montagem empilhava gráfico e
controle — as colunas em cima, o slider embaixo —, e o dono pediu o gatilho
**dentro** das colunas, e não embaixo. Hoje o `Slider` cobre a mesma caixa das
colunas (que ficam `pointer-events-none` por baixo), então clicar em qualquer
ponto move um punho, e os punhos pousam no meio da crista. O trilho e a faixa
somem: quem mostra o intervalo são as colunas, e pintar uma barra por cima
seria o mesmo dado desenhado duas vezes. **Apagar a faixa exige sumir com a cor
e a imagem** — `bg-transparent` sozinho não apaga o degradê da variante de
marca, que é `background-image`.

**A coluna acende por sobreposição, e não pelo centro.** A faixa `i` cobre
`[min + i·w, min + (i+1)·w)` e acende quando **intersecta** a seleção. É o que
a faz acender assim que o punho entra nela; pela regra do centro ela só
acenderia na metade do caminho, e o controle pareceria atrasado em relação ao
dedo. O fim é **aberto**, senão um punho na fronteira acende as duas vizinhas;
só a última fecha no `max`, senão o punho no topo não acende a barra que
encosta. Medido na tela com 40 faixas em [0, 5000] e seleção [500, 3500]:
primeira ativa **4**, última **27** — exatamente `500/125` e `3500/125 − 1`.

**A âncora do arco-íris é aritmética, e é o contraste com a rodada 106.** Lá a
mesma ancoragem precisou de `ResizeObserver` + `MutationObserver`, porque a
largura da faixa preenchida é arbitrária. Aqui as colunas são uma divisão
**igual e conhecida**, então a posição sai do índice: `background-size` de
`N × 100%` e `background-position-x` de `100i/(N−1)` — o posicionamento
percentual do CSS resolvido para este caso (`P%` alinha `P%` da imagem com `P%`
do elemento, logo `offset = P/100 · (E − W)`; com `E = W/N` e
`offset = −i·W/N`, sai `P = 100i/(N−1)`). Medido com 64 colunas:
`background-size: 6400%` e as posições batendo com a conta até a terceira casa,
com `no-repeat` e nenhum degradê nas inativas. **Medir não é um reflexo**: é o
que se usa quando a geometria não se sabe.

**As barras não são `ChartSparkline`, e é exceção nomeada.** Ela é a primitiva
de distribuição decorativa da casa e seria a escolha certa se as barras fossem
só desenho — mas **não expõe `<Cell>`**, e "barra fora da seleção apaga" é
exatamente uma decisão por barra. As colunas são elementos próprios por um
limite medido da primitiva, não por desconhecê-la, e são `aria-hidden` porque
quem carrega a semântica é o slider.

**O desenho se afinou na tela, em quatro passadas do dono:** colunas mais finas,
topo em domo (`rounded-t-full` no lugar de um canto de 2px — com a coluna fina,
o domo faz o conjunto ler como crista e não como cerca de tijolos), gatilho
dentro das colunas, e colunas mais finas **e grudadas**. A largura da coluna é
função da contagem e do contêiner, não uma medida cravada: o respiro foi a
`gap-px` e a demo passou de 40 para **64 faixas**, que é o que deixa a coluna
em 6px. A distribuição da demo também trocou — a primeira era um decaimento
liso, que lê como rampa; a de hoje é irregular, como distribuição de verdade.

**A rede.** `histogram-slider.test.ts` cobre só o que é próprio daqui, que é a
aritmética: a faixa ativa nas bordas (incluindo o fim aberto e a última
fechando no `max`), o piso da altura (contagem 1 contra máximo 200 não pode
sair em 0%, e zero continua zero) e a âncora (`i = 0` → 0%, `i = N−1` → 100%,
`N = 1` sem divisão por zero). O resto é composição, e quem o guarda são os
testes das peças compostas.

**Ficou por fazer:** o Radix anuncia o valor cru do punho (`1800`), e não
"R$ 1.800,00". O `Slider` não escreve `aria-valuetext` e não repassa props por
punho; o conserto é uma prop nele, que é `src/components/ui/` e pede
autorização. Fica registrado em vez de varrido. E a peça **não tem consumidor
no app**: o filtro de valor das transações
(`transactions-filters-panel.tsx:723`) continua com dois `Input money`, e
trocá-lo exige uma ponte `string` ↔ `[number, number]` no controller mais uma
fonte real de distribuição — decisão de produto, fora desta rodada por escolha
do dono.

### Rodada 108 — a linha-guia do punho, e a travessia que deixa de estalar

**O pedido.** Uma linha do punho até o fim das colunas, para ficar visível onde
o corte está; e melhorar a animação das colunas durante o arraste, "para ficar
mais integrado".

**O segundo pedido escondia um defeito, e ele era medível.** A coluna carregava
`transition-colors`, e o `transition-property` computado é `color,
background-color, border-color, outline-color, text-decoration-color, fill,
stroke, --tw-gradient-*` — **`background-image` não está na lista**. Na variante
de marca a tinta ativa *é* um `background-image`, então o degradê aparecia e
sumia de estalo **enquanto** o `background-color` da coluna apagada dissolvia em
150ms (o `backgroundColor` de uma coluna de marca ativa é `rgba(0,0,0,0)`). O
pior dos dois: metade suave, metade pulando.

É a lição da rodada 103 chegando numa peça nova: **degradê não interpola entre
si e `none`, e quem liga e desliga é uma opacidade.**

**Duas camadas.** A coluna passou a ser a superfície apagada (`--input-fill`,
sem transição nenhuma) com a tinta acesa num `<span>` por cima, **sempre
montada**, indo de `opacity-0` a `opacity-100` em `--duration-base` com
`--ease-out`. Montar e desmontar a camada não serviria: não há o que esmaecer
num nó que acabou de nascer. E é filho, e não `::before`, porque a âncora do
arco-íris é `backgroundSize`/`backgroundPositionX` em estilo **inline**, que não
alcança pseudo-elemento — pelo pseudo seria preciso passar as duas medidas por
propriedade personalizada só para reencontrá-las do outro lado.

**200ms e não 150:** a 150ms a travessia ainda lê como troca, e o pedido era
integração.

**Sem onda.** Um escalonamento por índice saindo do punho seria bonito parado e
**atrasado no arraste** — as colunas ficariam devendo à posição do dedo, que é
o oposto de integrado. Considerado e recusado.

**A linha mora no `::before` do punho.** O `::after` já é o alvo de toque de
44px (verificado: `content: ""`, 44px; o `::before` vinha com `content: none`,
livre). Pendurá-la no punho é o que garante a posição **exata**: o Radix escreve
`left: calc(10% + 5.6px)` — uma porcentagem com correção de meia-largura de
punho —, e uma linha posicionada por conta própria erraria pixels nas pontas.
Ela nasce na borda de baixo (`top-full`) e vale metade do histograma menos o
raio do punho. Medido: começa em **39** e termina em **64**, que é exatamente o
fim das colunas.

A altura sai de uma fonte só — o invólucro publica
`[--histogram-h:--spacing(16)]`, no precedente do `[--card-strip-py:--spacing(3)]`
do `Card` — e o `-` binário do `calc()` vai escapado (`_-_`), pela regra que o
`AGENTS.md` já registrava.

**O fio de contraste é o que faz a linha existir, e os tokens dizem por quê:**

| tema | `--primary-accent` (a linha) | `--primary` (a coluna acesa) |
| --- | --- | --- |
| escuro | `oklch(0.985)` | `oklch(0.985)` — **a mesma cor** |
| claro | `oklch(0.145)` | `oklch(0.205)` — quase |

E o punho fica justamente na fronteira, com uma coluna acesa de um lado. Com um
`outline` de 1px em `--background`, ela se lê sobre qualquer coluna — é o mesmo
recurso que o punho já usa, preenchimento com anel de contraste.

**Ela não transiciona**, porque tem de acompanhar o dedo no mesmo quadro; quem
esmaece é a coluna, que é estado, e a linha é posição. E **não veste arco-íris**
na variante de marca: um fio de 2px corta o degradê num ponto só e sairia de uma
cor arbitrária, que não é a marca — é uma fatia dela.

**Uma nota de instrumento.** A linha nasceu com `w-px` e, sobre as colunas
acesas, não dava para afirmar na captura se ela chegava à tela. O teste decisivo
foi pintá-la de vermelho com contorno verde por injeção de CSS: ela renderizava,
e o problema era só **força**. Foi para `w-0.5`, e aí se lê. Quando a captura
não decide, o caminho é tornar o efeito grosseiro de propósito até a pergunta
virar binária — e não olhar mais forte para o mesmo pixel.

**A rede.** A asserção 4 de `histogram-slider.test.ts` tranca as duas coisas: a
camada acesa transiciona `opacity` e a coluna **não** volta a escrever
`transition-colors`; e a linha usa o `::before` do punho e **nunca** o
`::after` — escrever ali apagaria a área de contato sem erro nenhum, que é o
jeito silencioso de quebrar isto. Verificado por mutação: trocar a opacidade por
`transition-colors` e trocar o `before:` por `after:` derrubam uma asserção cada.

### Rodada 109 — as guias mandam, e a onda sai delas

**O pedido**, em quatro partes: linha mais fina e levemente transparente, com
visibilidade melhor — *"no brand fica bom porém na versão normal não tá
legal"*; a linha nascendo no **centro** do punho; **só as colunas entre as duas
guias** acesas; e um fade com **delay** para a animação ficar melhor.

**Por que a linha falhava só na variante padrão, e os tokens dizem.** No escuro
`--primary-accent` (a linha) e `--primary` (a coluna acesa) são **a mesma cor**,
`oklch(0.985)` — então na padrão a linha sumia dentro da coluna e só o fio
escuro em volta aparecia, lendo como um corte sujo. Na marca as colunas são
coloridas, e por isso lá ela ia bem. O fio de contraste da rodada 108 resolvia o
caso, mas **um `outline` de 1px em volta de um fio de 1px é metade da peça sendo
moldura** — e o pedido era justamente afiná-la.

**`mix-blend-difference` substitui o fio, e não escolhe cor nenhuma.** Sobre
coluna clara o traço sai escuro; sobre a superfície escura, claro. Os 70% de
alfa fazem a inversão ser **parcial**, que é o "levemente transparente": ela
marca sem cortar a coluna. Com isso a linha desceu para `w-px` e perdeu o
`outline`, ficando mais fina *e* mais legível — que era o pedido inteiro.

**As guias viraram a fronteira, e a regra de acender inverteu.** A rodada 107
tinha escolhido **sobreposição** de propósito, para a coluna da ponta acender
assim que o punho entrasse nela. Com a linha desenhada na tela isso passou a
mentir: a coluna sob o punho acendia **metade para fora** da guia, e o olho lia
a borda da seleção num lugar e o corte em outro. Agora é **contenção** — acende
quem cabe inteira entre as duas linhas. O custo é o inverso do de lá (a coluna
da ponta só acende quando o punho a ultrapassa por inteiro), e a troca é o que
se vê aceso ser exatamente o que as guias delimitam. Uma seleção mais estreita
que uma faixa não acende nada, e isso é verdade, não buraco.

**A onda sai das guias.** O atraso de cada coluna cresce com a distância até a
linha mais próxima — 9ms por coluna, **teto de 130ms** —, então a cor corre das
duas bordas para o meio em vez de o bloco piscar de uma vez. O teto é o que
separa isto de um defeito: sem ele, o meio de uma seleção larga esperaria
centenas de milissegundos e ficaria devendo ao dedo, que foi exatamente a razão
de a rodada 108 ter recusado o escalonamento. E o atraso **só vale acendendo**:
ao apagar, a seleção sai junta, senão o rastro fica devendo ao punho que já
passou.

**O atraso quase virou uma regressão de acessibilidade.** O bloco global de
`prefers-reduced-motion` zera `transition-duration` e **não**
`transition-delay` — verificado no `globals.css`. Com o atraso em `style`
inline, quem pede menos movimento trocaria a animação por uma **espera** de até
130ms: pior que as duas. Por isso ele entra por propriedade personalizada
(`--bar-delay`) e o par `delay-(--bar-delay) motion-reduce:delay-0` o anula —
nenhuma classe venceria um inline. Confirmado na folha emitida, e não suposto:
`.motion-reduce\:delay-0` sai no byte 330801 contra 177831 da base, e **classe
contra classe quem decide é a ordem de emissão**, não a especificidade.

**Uma nota de método.** A linha, a 1px sobre colunas acesas, não se deixava
julgar por captura. O que resolveu foi tornar o efeito grosseiro de propósito —
pintá-la de vermelho com contorno verde por injeção de CSS — até a pergunta
"ela chega à tela?" virar binária. Ela chegava; faltava força. É a mesma lição
que a rodada 108 já tinha registrado, e ela se pagou duas vezes.

**A rede.** As asserções 1 e 4 de `histogram-slider.test.ts` foram reescritas
para a verdade nova — contenção nas bordas (incluindo a seleção estreita demais
que não acende nada) e o par `delay-(--bar-delay)` + `motion-reduce:delay-0`,
com a proibição explícita de `transitionDelay:` inline. Verificado por mutação:
tirar o `motion-reduce` e trocar a contenção por interseção derrubam uma
asserção cada.

### Rodada 110 — a guia larga o punho e se ancora na coluna

**O relato.** *"A linha não está no meio das colunas."*

**Medido antes de mexer, e o número deu razão ao relato:** a guia caía **dentro**
da coluna, mas fora do eixo dela — **1,73px** e 0,9px de desvio numa coluna de
**6,02px**. Numa peça dessa escala, um terço de coluna de erro se vê.

**A causa é estrutural, e estava escrita como virtude.** A rodada 108 pendurou a
guia no `::before` do punho *justamente* para garantir a posição, com o
argumento de que o Radix escreve `left: calc(10% + 5.6px)` e uma linha
posicionada por conta própria erraria pixels. O argumento estava certo sobre o
mecanismo e **invertido sobre a conclusão**: é exatamente essa correção de
meia-largura que faz o centro do punho **não** coincidir com o eixo da coluna.
Presa ao punho, a guia nunca acertaria o meio — ela seguia fielmente uma
posição que não é a da coluna.

**A guia virou elemento próprio, ancorado na grade das colunas.** A primeira
versão a pôs no **eixo** da coluna, e o dono corrigiu: *"a linha tem que estar
exatamente **entre** as colunas"*. E está certo pela semântica, não só pelo
gosto — a guia marca a **fronteira** da seleção, e com a contenção da rodada
109 o corte é a aresta entre a última apagada e a primeira acesa. Uma linha no
eixo diria que o corte passa pelo meio da coluna, que é o que ele não faz.

Então ela pousa na **fresta**: antes da primeira acesa e depois da última.
Medido: as duas caem dentro do vão de 1px. A conta é `index / total`, e o erro
contra a fresta real é no máximo **meio pixel** — o respiro entra no passo, e
corrigi-lo exigiria a fresta em pixels dentro da conta, tirando da `left` a
porcentagem pura por meio pixel. Sem nenhuma coluna acesa (seleção mais
estreita que uma faixa), a guia cai na fresta mais próxima do valor, para a
linha existir mesmo quando não há o que acender.

**O custo, dito:** a guia pode se afastar do punho em até **meia coluna** —
3,5px com passo de 7px, num punho de 14px, então ela continua por baixo dele. É
o inverso do custo de antes, e é o lado certo da troca: a linha marca **dado**
(qual coluna), e o punho é o **controle**.

Ela ficou `pointer-events-none`, porque agora é irmã do slider que a cobre e
não mais parte dele — sem isso, disputaria o arraste.

**A rede.** A asserção 4 mudou de forma: a guia tem `data-slot` próprio, usa
`eixoDaBarra(`, e **não** pode voltar a ser pseudo do punho — nem `::before`
nem `::after`, porque o segundo é o alvo de toque de 44px e escrever ali o
apagaria sem erro nenhum. Ficam também o `mix-blend-difference`, o
`pointer-events-none` e o `top-1/2 bottom-0`.

**A lição que vale além desta peça:** um comentário que explica *por que uma
escolha é a certa* é uma afirmação, e envelhece como qualquer outra. O da
rodada 108 descrevia corretamente o `calc(10% + 5.6px)` e concluía o oposto do
que aquele `calc` implica. Foi preciso medir o desvio para ver — a prosa
sozinha se lia como fundamentada.

### Rodada 111 — o slider trava na grade, e punho e guia param de brigar

**O relato.** "Centralize nas linhas" — o punho e a guia não coincidiam.

**A tensão, dita antes de escolher.** Medido: 1,39px e −0,56px naquele momento,
mas o pior caso é maior — a guia salta de fresta em fresta (passo 7,02px), então
ela pode ficar a meia coluna do punho, e nas pontas o recuo de 7px do Radix soma
a isso. E o ponto que precisava ser dito: **uma linha presa às frestas não pode
estar sempre sob um punho que anda contínuo.** As duas coisas pedidas em
rodadas diferentes só coexistem se o slider parar de coluna em coluna. O dono
escolheu travar na grade.

**Três mudanças que só funcionam juntas.**

1. **O passo é a largura de uma faixa, e `step` saiu da API.** O punho só para
   em fronteira de coluna. Como API é honesto: num filtro de faixa quem escolhe
   escolhe **faixas**, e a resolução do histograma já diz qual é a menor delas.
2. **A régua das colunas recua meio punho (7px) em cada ponta.** O centro do
   punho do Radix viaja de `7px` a `largura − 7px` — a correção que ele aplica
   para o punho não sair do trilho. Uma grade que encosta nas bordas vive noutro
   sistema de coordenadas, e era daí que vinha a parcela do desvio que aparecia
   nas pontas. Recuada, a grade ocupa **exatamente** a faixa que o punho
   percorre.
3. **O estado nasce na grade.** Este foi um defeito meu no meio da rodada, e
   ele ensina: eu calculei o valor encaixado, passei ao `Slider` — e iniciei o
   `useState` com o valor **cru**. O punho lia 468,75 e as guias liam 500, e o
   desvio medido *piorou* para ±6,63px, meio punho exato. Dois consumidores da
   mesma grandeza com origens diferentes é sempre isso.

**Medido depois, em seis posições seguidas de teclado:** desvio **0px** em
todas, guia sempre dentro do vão de 1px, e a faixa acesa avançando exatamente
uma coluna por passo.

**E travar na grade cobra um preço que aparece no dinheiro.** O passo é
`(max − min) / bins.length`, e se essa conta não fecha redondo os valores saem
quebrados: com 64 faixas em R$ 0–5.000 o passo vira **R$ 78,125** e a leitura
saiu `R$ 468,75` — o que num filtro de dinheiro é regressão, não detalhe. A
regra que ficou: **a contagem de faixas tem de dividir a escala**. A demo chegou a ir
para 100 faixas (passo de R$ 50, leitura redonda), mas isso afinou a coluna de
5,8px para 3,35px — efeito colateral que ninguém pediu, apresentado na hora
como bônus. O dono mandou voltar para **64**, e a demo assume a troca: coluna
fina e passo de R$ 78,125, com a nota dizendo o preço e as duas saídas (50
faixas para R$ 100, ou `max` em R$ 6.400 mantendo as 64).

**A rede.** A asserção 5 tranca as três: o passo derivado (`step` não pode
voltar a ser prop), o `useState(inicialNaGrade)` e o `inset-x-1.75`. Verificado
por mutação: devolver o estado ao valor cru e zerar o recuo derrubam uma
asserção cada.

### Rodada 112 — a onda abre, porque o medo estava mal calibrado

**O pedido.** Aumentar o atraso da pintura das colunas, para a transição ficar
mais bonita.

**A rodada 108 tinha recusado o escalonamento por medo de atraso no arraste, e a
109 o pôs com passo curto (9ms) e teto baixo (130ms) pelo mesmo medo.** O medo
não era infundado, mas estava **mal calibrado**, e a pergunta que o corrige é
*qual* coluna muda de estado:

- **no arraste**, quem acende ou apaga está sempre **junto de uma guia** —
  distância 0 ou 1 —, então o atraso que se sente é 0 ou um passo. O meio da
  seleção não muda de estado enquanto se arrasta; ele já está aceso;
- os valores grandes só alcançam coluna **longe** da guia, e isso só acontece
  em **salto**: um clique no meio do trilho, uma mudança programática. Ali a
  onda é o efeito desejado, não uma dívida com o dedo.

Com isso o passo foi a **18ms** e o teto a **320ms**, e o fade de
`--duration-base` para **`--duration-slow`** — a 200ms a travessia ainda lê como
troca; a 300 ela lê como dissolução. O dono pediu mais uma vez, e os valores
fecharam em **30ms** de passo com **teto de 600ms**.

**Medido num salto de 18 colunas**, amostrando a opacidade ao longo do tempo:

| | col 63 | col 60 | col 55 | col 50 | col 46 |
| --- | --- | --- | --- | --- | --- |
| 100ms | 0,69 | 0 | 0 | 0 | 0 |
| 250ms | 1 | 0,94 | 0 | 0 | 0 |
| 450ms | 1 | 1 | 0,98 | 0,36 | 0 |
| 700ms | 1 | 1 | 1 | 1 | 0,96 |

A tinta sai da guia e corre para fora, e o conjunto assenta em cerca de 700ms.

O teto **não** saiu, e a guarda de `prefers-reduced-motion` tampouco: com o
atraso maior, ela passou a valer ainda mais — sem `motion-reduce:delay-0`, quem
pede menos movimento esperaria agora até 320ms por coluna.

### Rodada 113 — o escalonamento sai: a ordem já existia

**O pedido**, depois de duas rodadas pedindo *mais* atraso: *"todas as colunas
devem ter o mesmo tempo de transição entre o neutro e o pintado, porém,
obviamente, o que vai ditar quem vai ascender antes é a ordem que vai sendo
passado o slider por elas."*

**E isso derruba o escalonamento inteiro, não o ajusta.** As rodadas 109, 112 e
a primeira metade desta vinham calibrando um atraso por coluna, proporcional à
distância até a guia, para a cor "sair" das linhas. A frase acima diz que a
ordem de acender **não é um efeito a produzir** — ela já é um fato do gesto:
acende antes a coluna por onde o punho passou antes. Calcular um atraso era
recriar, em código, uma sequência que o arraste já entrega de graça.

Saíram `PASSO_DO_ATRASO`, `TETO_DO_ATRASO`, `atrasoDaBarra`, a variável
`--bar-delay` e o par `delay-(--bar-delay) motion-reduce:delay-0`. Sobrou uma
`transition-opacity duration-(--duration-slow)` igual para todas.

**A guarda de movimento reduzido saiu junto, e isso é correto** — ela existia
*por causa* do atraso (o bloco global zera duração e não atraso). Sem atraso
nenhum, não há o que anular, e o bloco global sozinho já cobre a duração.

**Medido depois:** as 64 colunas têm um único par de tempos, `0.3s | 0s` — a
mesma duração e atraso zero em todas. Um passo de teclado no punho acendeu a
coluna que ele cruzou e deixou a outra ponta intacta.

**A consequência, dita em vez de escondida:** num **salto** — clique longe do
punho, mudança programática — não há ordem de passagem, e a seleção inteira
dissolve junta. É o certo pela mesma regra: sem punho passando, não há quem
venha antes.

**A lição.** Três rodadas calibrando um número (9 → 18 → 30ms, teto 130 → 320 →
600) sem que ninguém perguntasse se o número devia existir. O pedido de "mais
delay" foi lido como "aumente o parâmetro", quando o que incomodava era a
transição ser curta — e a resposta certa era a **duração**, que é o que
`--duration-slow` já resolvia. Quando um ajuste precisa ser repetido, vale
duvidar do eixo antes de mexer na escala.

### Rodada 114 — a leitura larga os cartões e vira par termo/valor

**O pedido.** Deixar a parte de baixo mais compacta.

**Os dois `StatCard` cobravam 70px para mostrar duas linhas de texto** — moldura,
preenchimento, raio e recuo —, numa peça que já tem histograma, trilho e duas
guias. Era chrome empilhado sobre chrome.

Trocados por um `DescriptionList layout="grid"`, que é o componente certo pela
**semântica** e não só pelo tamanho: "Mínimo" é o **termo** de "R$ 468,75", não
o rótulo de um cartão. E o `DescriptionListItem` já traz a regra de par de
identidade (sem `gap` entre rótulo e valor) de fábrica, que era justamente o que
o `StatCard` também resolvia — a regra viaja, o cartão não precisava vir junto.

**Medido: 70px → 41px**, 41% a menos, sem perder nada da informação.

**E a leitura passou a apontar para onde pertence.** Mínimo à esquerda, máximo à
direita, no **mesmo recuo da régua das colunas** (`px-1.75`) — medido, as bordas
coincidem: 48 contra 48 na esquerda, 472 contra 472 na direita. Cada valor cai
sob a ponta do trilho a que ele pertence, em vez de flutuar centralizado numa
caixa que não diz de qual punho está falando.

**A camada não mudou.** A peça deixou de importar `StatCard` (organismo) e
passou a importar `DescriptionList` (molécula), mas continua `Organisms`: pela
régua do `LAYER`, quem é **feito de moléculas** é organismo, e ela segue sendo
uma seção com estrutura própria — histograma, controle e leitura.

### Rodada 115 — a demo pega a saída que a 111 já tinha nomeado

A rodada 111 travou o slider na grade e registrou o preço: com 64 faixas em
R$ 0–5.000 o passo vira R$ 78,125 e a leitura sai `R$ 468,75`. Ela nomeou as
duas saídas — 50 faixas para R$ 100, ou `max` em R$ 6.400 mantendo as 64 — e a
demo ficou pagando o preço por duas rodadas, para não trocar a coluna fina.

O dono pediu a segunda: **`max` em R$ 6.400**. Com 64 faixas o passo vira
exatamente R$ 100, o `defaultValue` de `[500, 3500]` já cai na grade, e a
leitura volta a `R$ 500,00` e `R$ 3.500,00` — com a coluna nos mesmos 5,64px e
o desvio punho↔guia em 0.

Fica a nota de uso, que é o que sobrevive à demo: **a contagem de faixas e o
`max` decidem juntos o passo em dinheiro**, e quem escolhe um escolhe o outro.

**E a página do catálogo encolheu junto.** As dez notas tinham acumulado 1.178
palavras ao longo de oito rodadas, narrando cada reviravolta — "a primeira
versão fazia X", "isto inverte a regra anterior", o passo a passo de cada
medição. Foram a **565** (−52%), guardando a regra, o número que a sustenta e o
porquê de não ter sido feito do jeito óbvio. O resto já mora aqui, que é o lugar
dele: **catálogo é referência, histórico é diário**, e confundir os dois faz a
página de um componente crescer sem parar.

### Rodada 116 — o alternador vira trilho de três, e a troca fica orgânica

Pedido do dono, em três tempos: refazer o alternador de tema do zero pensando na
marca nova, **descartar o vidro**, **implementar o tema do sistema** e dar à
troca um movimento orgânico — "um bloco às vezes grudando um pedaço ali na
animação". No meio do caminho, o arco-íris foi recusado na tela.

#### O que o arco-íris ia ser, e por que não é

A proposta aceita era a **janela sobre o trilho**: o polegar vestiria o contorno
de marca (1px de `border-box` sobre miolo chapado, a receita dos controles de
escolha) e o degradê seria ancorado ao **trilho**, não ao polegar —
`background-size: 300%` e a posição andando com a viagem, de modo que o anel
mostrasse a fatia do arco-íris sob ele. Sem observador: o polegar é exatamente
1/3 do trilho, então a conta fecha em aritmética, como no `HistogramSlider`.

Duas coisas ficaram medidas antes de o dono recusar, e valem fora daqui:

- **`--brand-rainbow` não existe no `:root`.** Sondado no navegador: a variável
  vem **vazia** até `brand-rainbow-image` entrar no elemento. É a rodada 88
  outra vez, agora com número.
- **A janela interpola de verdade.** Com `--ttx` registrada por `@property` como
  `<percentage>`, a posição do degradê lia **50,016%** a 150ms de uma transição
  linear de 300. O mecanismo funciona; foi a **aparência** que foi recusada.

O polegar ficou, então, com as três classes do `tabs-indicator`. A ligação com a
marca passou a ser o **movimento**, que é o que o `AGENTS.md` já declara: o
movimento da marca é a lava.

#### A anatomia: 88 × 32, três paradas de 28, polegar circular

Ordem **Sistema · Claro · Escuro**, escolhida pelo dono — a do menu do macOS —,
com o custo dito na hora: **o eixo do trilho não significa escuro→claro**, então
nenhuma posição carrega sentido próprio.

O polegar deixou de ser estádio (34 × 28) e virou **círculo de 28**. A conta
fecha exata e foi conferida na tela: cabeça em **2 · 30 · 58**, `translate`
**0 · 28 · 56**, e cada face começando no mesmo x da cabeça que a ocupa.

`role="switch"` saiu: três estados não cabem num booleano. É
`RadioGroup` do Radix direto — uma parada de tabulação, setas navegando —, e
**não** o `ToggleGroup` de `ui/`, que é Molécula e tiraria o componente de
Átomos.

#### A viagem orgânica, e a curva que a fez existir

Três peças do **mesmo** `bg-background`: cabeça, rastro e pescoço. A fusão é de
**cor**, e não de filtro — medido: discos sobrepostos do mesmo token fundem sem
costura. O pescoço é mais fino (18 contra 28), então em repouso ele cabe dentro
de um disco e não existe na tela; as bordas entram **0,7 do raio** em cada
disco, que é o que faz a emenda reta morrer sob a curva. Sem essa sobreposição o
encontro é um canto convexo visível — visto ampliado, antes de corrigir.

**O filtro goo foi montado e rejeitado.** `feGaussianBlur` + `feColorMatrix` de
alfa é a técnica canônica e preserva o RGB da fonte (só o canal alfa é
comprimido), mas no raio que faz pescoço num disco de 28 (σ≈4) ele **come a
gota**: a peça pequena some. E ainda pediria exceção em `DRAWN_SVG_FILES`. A
cápsula chega no mesmo lugar sem filtro e sem exceção.

**O erro que custou a rodada, e a lição que fica: as duas curvas da casa são
curvas de saída, e nenhuma serve a um rastro.** `--ease-out` é
`cubic-bezier(0.16, 1, 0.3, 1)` e `--ease-emphasized` é
`cubic-bezier(0.32, 0.72, 0, 1)`; as duas gastam quase todo o caminho no começo.
Com `--ease-out` no rastro, medido no navegador:

| salto | vão máximo entre os discos | separavam? |
| --- | --- | --- |
| uma parada (28px) | **10,9** | não — 17px de sobreposição |
| duas paradas (56px) | **21,8** | não — os discos têm 28 |

Ou seja: **o pescoço ficava escondido dentro dos discos a viagem inteira**, e o
rompimento apagava um fio que nunca esteve à vista. O que faltava não era
duração, era uma curva que **saísse devagar** — e a casa não tem nenhuma. O
rastro ganhou ritmo próprio: `cubic-bezier(0.65, 0, 0.35, 1)`, 60ms de atraso e
`--duration-slow + 240ms`. Medido depois:

| salto | vão máximo | separavam? |
| --- | --- | --- |
| uma parada | **25,9** | não, por 2px — estica e recolhe |
| duas paradas | **52** | **sim** — a gota solta e é reabsorvida |

E é isso que faz a regra do dono ("às vezes gruda um pedaço") sair da **física**
em vez de um `if`: a mesma dupla de curvas, distâncias diferentes, e um salto
estica enquanto o outro rompe. O apagamento do fio roda entre 200 e 340ms, que é
a janela medida em que o vão passa dos 28px do disco.

#### O teclado estava inerte, e a causa é o React 19

Medido: a seta **movia o foco e não trocava o tema**, e o Espaço também não
pegava. A causa está no `RadioGroup` do Radix — ele marca uma flag num `keydown`
de `document` e, no `onFocus` do item, clica se a flag estiver de pé:

```js
document.addEventListener("keydown", handleKeyDown)   // levanta a flag
onFocus: () => { if (isArrowKeyPressedRef.current) ref.current?.click() }
```

O React 19 delega os eventos no **contêiner da raiz**, que fica abaixo de
`document`: o `onKeyDown` do item move o foco *antes* de o listener de
`document` levantar a flag, e o `onFocus` a lê como falsa. O conserto é ler o
**foco** como fonte de verdade — `onFocus` na raiz, `data-parada` no item —, que
é a seleção-segue-o-foco da WAI-ARIA e não depende de ordem de entrega. Conferido
com teclas reais: → escolhe Claro, →→ escolhe Escuro, ← volta para Claro.

#### O tema do sistema

`enableSystem={false}` → `enableSystem`, e `defaultTheme="dark"` →
`defaultTheme="system"`. Conferido na tela: com "Sistema" marcado, trocar o
esquema do sistema emulado de escuro para claro troca a classe do `<html>` e a
parada marcada **continua** "Sistema".

Nenhum consumidor mudou, e isso foi verificado antes: `sonner.tsx` e
`theme-color-sync.tsx` já liam `resolvedTheme`, o `ds-frame` espelha o tema por
`MutationObserver` na classe (e o teste dele proíbe `useTheme` ali), e o
`layout.tsx` não crava classe de tema no `<html>`.

**O custo é dito:** quem nunca escolheu tema e está no claro no aparelho **troca
de tema na próxima visita**. Era a opção escolhida entre as duas.

#### O que saiu

O prop `glass`, a constante `GLASS_SHEEN`, o import de
`glassRoundSurfaceClassName` e a entrada `"theme-toggle"` em `COM_MODO` de
`glass.test.ts` — que é o teste que cobrava o eixo, e reprovaria com ele
removido. Sai pela mesma linha que tirou o `ColorTile` na rodada 95: **um modo
que ninguém veste é uma linha a manter.** Os dois alternadores do `ds-shell`
perderam o vidro junto, que é o que "descartar o vidro" significa.

#### O teste, e as três coisas que ele tranca

[`theme-toggle.test.ts`](../../src/components/ui/theme-toggle.test.ts), 9
asserções: as três paradas e a ordem; a primitiva (`radiogroup`, nunca
`switch`); a aritmética (88 = 4 + 3 × 28, e a viagem no mesmo 28); **as três
peças no mesmo token de fundo, com fio e sombra só na cabeça**; **a curva do
rastro, com a proibição explícita de devolver uma curva de saída** — que é o
defeito que apaga o efeito sem quebrar nada; o vidro e a marca fora, com
`COM_MODO` conferido no arquivo vizinho; o alvo de 44px e o par `active:`; a
seleção-segue-o-foco; e nenhum bloco de `prefers-reduced-motion` próprio.

#### Notas de método

- **`getComputedStyle` devolve `oklch()`, e ler aqueles três números como RGB dá
  razão 1,000 em tudo.** A primeira leitura de contraste desta rodada reportou
  exatamente isso. A rasterização por canvas 1×1 é o que os quatro scripts de
  contraste da casa já fazem, e é a única leitura válida. Os números certos:
  `--background` contra `--muted` dá **1,308** (ΔRGB 28) no escuro e **1,142**
  (ΔRGB 15) no claro — o pescoço lê bem no escuro e é sutil no claro, e isso
  fica registrado em vez de escondido.
- **`offsetLeft` não enxerga `translate`.** Uma medição inteira da viagem saiu
  como "2 · 2 · 2" por isso. Quem mede deslocamento por transform usa
  `getBoundingClientRect`, relativo à raiz.
- **`requestAnimationFrame` não corre quando a aba não pinta.** Sob automação,
  o adiamento de dois quadros faz `--tt-i` parecer **uma parada atrasado**; com
  quadros de verdade ele alcança na hora. Duas leituras desta rodada foram
  descartadas por isso antes de virarem "defeito".

#### Adendo — o polegar não andava, e o culpado era o adiamento por rAF

Reportado logo depois: "não está rodando a animação". As primeiras medições
mostravam o trajeto interpolando bonito, e foi preciso notar o que elas tinham
em comum — **todas rodavam com um laço `requestAnimationFrame` meu ligado**.
Sem esse laço, a mesma sequência dava: clique, 1400ms de espera, cabeça parada
em 2, `document.getAnimations()` **vazio**.

A causa é o próprio conserto do `disableTransitionOnChange`. O next-themes
injeta `* { transition: none !important }` durante a troca de classe, e a
versão herdada da rodada 79 fugia disso aplicando a posição **dois
`requestAnimationFrame` depois**. Isso torna o movimento refém de o rAF correr:
aba que não pinta, quadro perdido, throttling — e o `setState` adiado nunca
roda. O polegar fica simplesmente parado, sem erro nenhum no console.

A saída é não usar transição de CSS para o que se desloca. **A WAAPI não é uma
transição, então o `!important` do next-themes não a alcança**: a posição de
repouso é aplicada na hora por `--tt-i`, e o trajeto é uma animação explícita do
valor antigo para o novo com `fill: "none"` — o estilo manda no repouso, a
animação só cobre o caminho. Saíram o adiamento, os dois estados (`visual` e
`viagem`), o `setTimeout` de fim de viagem e a transição inline que dependia do
sentido; o pescoço agora estica porque as duas bordas correm em relógios
diferentes, cada uma numa animação própria, o que **dispensa saber o sentido**.

Medido depois, **sem** laço nenhum segurando a página: em t=120ms a cabeça está
em 49,8 e o rastro em 2,2, com 15 animações correndo; no fim os dois em 58. O
salto curto estica até **25,7** e não rompe; o longo vai a **47,6** e rompe.
E o movimento começa no mesmo quadro da troca de tema, em vez de 45ms depois
dela.

**O que isso custa, e está dito no catálogo:** o bloco global de
`prefers-reduced-motion` encurta *transição*, e a WAAPI escapa dele — a
pergunta passou a ser feita à mão, com `matchMedia`, e sem movimento não há o
que fazer porque `--tt-i` já pôs tudo no lugar. As faces continuam em transição
de CSS de propósito: ali o que muda é tinta, e trocar de estalo junto com a
página é o compasso certo.

**A lição de método:** uma medição que só reproduz o sucesso quando o medidor
está segurando a página não mediu o componente — mediu a si mesma. O sinal foi
`document.getAnimations()` devolver **0** numa sonda e ser descartado como
ruído; era o achado.

**E um segundo defeito caiu junto: o polegar animava na montagem.** O gate de
montagem leva `indice` de 0 para a parada real, e o efeito lia isso como uma
viagem — o polegar entrava deslizando da esquerda **toda vez que o componente
nascia**. No catálogo isso é uma vez por carga; **no app é toda abertura do menu
da conta**, porque o conteúdo de um `DropdownMenu` desmonta ao fechar. A guarda
é uma linha (`jaPintou`), e a regra é "nascer é chegar, não viajar". Medido
depois: **zero** animações durante a hidratação, com o polegar já na parada
certa na primeira pintura.

### Rodada 117 — a viagem vira uma peça só, e o esticão entra em fase

Reportado pelo dono depois da 116: *"parece que tem duas bolas transitando
totalmente diferentes"*. Estava certo, e a causa é de construção: cabeça, rastro
e pescoço são **três nós**, e fundir por cor apaga a costura sem fazer uma forma
só. A referência dada — o
[apple-liquid-glass-switcher](https://21st.dev/community/components?q=glass&preview=%2F%40dennysdionigi%2Fcomponents%2Fapple-liquid-glass-switcher)
de Dennys Dionigi — resolve o mesmo problema com **uma pílula**, e o bundle do
preview mostra que a animação dela é exatamente três coisas: trajeto com
inércia (`cubic-bezier(1,0,.4,1)`), esticão em `scale` com pico no meio, e
`transform-origin` na borda **de trás** — que é para o que serve o
`data-previous` do trilho, e nada mais.

**Duas coisas que a leitura do bundle desmentiu.** A referência declara dois
filtros SVG (`feImage` + `feDisplacementMap`), e é tentador copiar a refração:
ela **não está ligada** — `filter` e `backdrop-filter` computam `none` nos
elementos. O "líquido" dali é a aresta em camadas mais o esticão. E o esticão
dela **não** depende da distância: o pico sai do destino (1,1 nas pontas, 1,2 no
meio).

#### O esticão da referência sai anticorrelacionado com a velocidade

Copiado como está — pico em 50% do relógio da escala, relógios diferentes
(0,44 contra 0,40) — o resultado é pior do que parece. Medido contra a
velocidade da própria curva de trajeto:

| fração do caminho | velocidade (do máximo) | escala |
| --- | --- | --- |
| 0,30 | **6%** | **1,33** |
| 0,50 | 19% | 1,13 |
| 0,70 | **68%** | **1,04** |

Quase um espelho. Na tela: a forma **estica parada** — no filme de quadros, aos
90ms ela estava em `x=1` já com 1,21 de escala — e depois atravessa contraída.
É o contrário do que matéria faz.

**O conserto é de fase, não de valor.** Os dois relógios passam a ser o mesmo
(400ms), o perfil da escala vira uma meia-senoide de cada lado com pico em
**0,58** — a velocidade desta curva pica em 0,667 —, e o efeito roda `linear`,
que é o que faz cada `offset` do perfil valer a fração de tempo que ele diz.
Meia-senoide e não triângulo: vértice reto no auge lê como repuxão.

#### A amplitude é a velocidade, e o teto é a borda do trilho

As duas viagens duram o mesmo e a longa percorre o dobro, então ela corre ao
dobro e estica o dobro: **1,11** e **1,22**. Não é gosto — é o que cabe. Com a
origem na borda de trás, o esticão empurra a forma para a frente, e com o pico
em 0,58 a borda dianteira chega a **87,7** dos 88px do trilho no salto longo.
Em **1,26** ela passa, e a peça sai da pílula. Medido depois, por scrubbing da
animação real: largura 28 → **34,2** → 28, dianteira máxima em **84**.

Nota de método: a primeira leitura disto foi **errada**. Uma maquete estática
aplicou o pico do esticão na posição de **chegada** e a forma saiu escandalosa,
8px para fora do trilho — e eu chamei de defeito. O pico acontece no meio do
caminho, onde há espaço; varrendo a curva de verdade o transbordo era de
**0,1px**. Maquete que escolhe o instante errado mede a maquete.

#### O que saiu

`theme-toggle-trail` e `theme-toggle-neck` inteiros, com os refs, as constantes
do pescoço, as quatro animações de `left`/`right` e **o rompimento da gota** —
que era, literalmente, a segunda bola. E a **borda** do polegar, por decisão do
dono: o fio duro é o que denuncia a distorção quando a forma estica, porque o
contorno deixa de ser circular. Quem segura a peça contra a bandeja passou a ser
a sombra, e essa é a conta apertada do tema claro (`--background` contra
`--muted`, ΔRGB 15 contra 28 no escuro) — conferido na tela a 3,4×, e ela
sustenta.

#### Adendo — "deixe mais elástico", e o que faltava era o eixo Y

A forma esticava só em X (`scale: 1.22 1`), e isso não lê como matéria: lê como
uma pílula que **engorda**. Elástico conserva volume — estica num eixo, afina no
outro. O acoplamento entrou em 0,45 do esticão (e não o `1/√x` da física, que a
1,22 daria 0,905: numa peça de 28px tirar 3px de altura é mais do que o olho
aceita num controle).

Com ele veio o **pouso**: o relógio da escala passou a 560 contra os 400 do
trajeto, e os 160 que sobram são uma oscilação amortecida em torno de 1. Medido
na animação real, no salto longo:

| momento | largura × altura |
| --- | --- |
| repouso | 28 × 28 |
| auge do esticão | **34,1 × 25,2** |
| chegada | 28 × 28 |
| fundo do pouso | **26,8 × 28,6** |
| assenta | 27,6 × 28,2 → 28 × 28 |

**A virada de origem é o que liberou a amplitude do pouso.** Ancorada atrás, a
oscilação crescia *contra* a borda do trilho e tinha de ser tímida. Hoje a
origem troca para a borda **da frente** na chegada, e o corpo se acomoda para
dentro: bateu na parada, o resto empilha atrás. A troca cai exatamente onde `k`
cruza zero — escala 1, transformação identidade, origem que não pinta nada —,
então **é invisível por construção**. Os dois quadros a 0,0001 de distância
fazem disso um degrau: interpolada, a origem deslizaria com a escala fora de 1,
e isso se vê.

Medido depois nos dois sentidos, e simétrico: a borda dianteira chega a **87,7**
dos 88px indo para a direita e a peça para a **0,3** indo para a esquerda. **A
folga é de 0,3px, e é o teto real desta animação** — quem quiser mais elástico
não tem para onde crescer sem encurtar a cauda do esticão, que é o que ainda
está largo quando a forma chega na parada.

**O pouso virou um mergulho só.** A primeira versão dele oscilava três vezes em
160ms (`+0,5 · −0,28 · +0,12`) e ficava estalada — o dono pediu mais suave.
Hoje o relógio da escala é 640 contra os 400 do trajeto, e os 240 que sobram são
**uma** compressão que vai e volta: a forma bate na parada, o corpo compacta
atrás e relaxa. Medido: **uma** travessia da largura de repouso depois da
chegada, com o fundo em 26,8 × 28,6 por volta dos 500ms. E `VIRADA` deixou de
ser um número solto — é `TRAJETO.duration / ESTICAO.duration`, senão ela sai de
fase calada quando alguém mexer numa das duas durações.

**A bandeja virou sobreposição.** `bg-muted` é opaco, e medido ele pintava
**38,38,38** tanto na barra do catálogo quanto dentro do painel de um cartão —
o mesmo pixel nos dois, ignorando o que está atrás. O `TabsList` pode ser
chapado porque sabe onde mora; este controle não sabe: ele vive na barra de
vidro, no painel do `DropdownMenu`, no `Popover` do telefone e solto num cartão.
Chapado, ele lia como um bloco estrangeiro colado sobre o preto do app.

A superfície passou a ser a do **campo**, `bg-input-fill/50` — a mesma de
`field-classes`, então a placa lê como o fundo de um `Input`. No escuro
`--input-fill` é branco a 15%, e a `/50` são 7,5% de sobreposição:

| onde | antes (chapado) | agora (sobreposição) |
| --- | --- | --- |
| sobre a página (cabeçalho) | 38 | **28** |
| sobre o cartão (painel da demo) | 38 | **40** |

O custo está no claro, e é dito: o token é opaco naquele tema por construção, e
a placa sai a **238** sobre o cartão contra o polegar em 250 — ΔRGB **12**,
contra os 15 de antes. Conferido na tela a 3×: com a sombra do polegar, sustenta.

### Rodada 118 — a marca ganha voz no aviso, e a barra paga a rodada 99

O pedido foi revisar o `Alert` para o novo branding, e depois juntar a
`AnnouncementBar`. **Não havia verde a tirar**: os dois já estavam
brand-neutros — o `Alert` não toca `--primary` em lugar nenhum, a barra pinta
`bg-muted` no tom neutro, e as duas ações saem de `currentColor`. A adequação
não era remoção, e foi isso que mudou a pergunta.

O buraco era outro: **os dois avisos são as únicas superfícies do sistema onde
o produto fala sobre si mesmo, e nenhum dos dois tinha voz.** A prova estava na
própria demonstração do catálogo, que anunciava "uma nova versão está
disponível" em `tone="info"` — o azul da rampa de **estado** carregando o
produto se anunciando. `info` é fato sobre o dinheiro da pessoa; a novidade não
é um estado dela.

Decisões do dono nesta rodada: a régua nos **dois** componentes; a variante
**nasce sem consumidor no app** (só catálogo, como o `Stepper` já está); e os
três consertos de tabela entram junto.

#### A régua é a terceira família de peça de marca

O arco-íris entra como fio na **aresta** do aviso: 2px na borda inline-start do
`Alert`, 1px na base da `AnnouncementBar`, onde ele **substitui** o fio do
`sticky`. Ao lado do contorno (`Button`, `Badge`, os controles de escolha) e do
preenchimento (`Progress`, `Slider`).

**Contorno foi descartado por degenerar.** Numa faixa de largura total,
esquerda e direita ficam fora da tela e o topo encosta na borda do viewport —
sobra exatamente o que a régua já é, mais uma linha no topo que não marca nada.
E em volta de um parágrafo o contorno lê como enfeite, que é o que a página de
marca trata em "o que não fazer". A régua é a forma que o sistema já nomeia
para traço fino: a barra lateral de citação.

#### Um token só nas duas orientações, contra a previsão oposta

Previ que um degradê de 135° num fio de 2×60px clamparia as pontas e pediria um
ângulo próprio ou `background-size`. **Quatro sondas rasterizadas derrubaram a
previsão**: a linha do degradê é `|W·sin θ| + |H·cos θ|`, definida para cobrir a
caixa **de canto a canto em qualquer ângulo**. A rampa completa aparece na
vertical e na horizontal com o mesmo `--brand-rainbow`, sem override.

| sonda | caixa | linha do degradê | resultado |
| --- | --- | --- | --- |
| barra, 135° | 1440×1 | 1019px, 145,6 por parada | rampa completa |
| alerta, 135° | 2×60 | 44px, 6,3 por parada | rampa completa |
| `background-size: 100% 200%` + center | 2×60 | — | **pior**: corta em coral |
| `background-size: 100% 200%` sem center | 2×60 | — | **pior**: corta em violeta |

As duas "correções" que eu ia propor saem piores que fazer nada. Ficou escrito
no componente e na página de marca: **quem for consertar o ângulo, meça
primeiro.** O ganho prático é que nenhum token novo entrou em `globals.css` — e
uma segunda lista de oito paradas teria de existir **em dobro**, por causa do
par sRGB/`@supports` do `brand-rainbow-image`.

#### O raio proíbe o degrau `sm`, e isso é resposta de desenho

O recuo vertical da régua não é escolha: num `rounded-xl` de 12px, a 8px do topo
a aresta da caixa recua 0,69px e a ponta arredondada absorve a sobra; **a 4px
ela recua 3,06px**, e um fio de 2px em `start-0` ficaria inteiramente fora da
superfície pintada, flutuando na margem. Oito pixels é o piso.

Medido no `sm`: caixa de 34px, régua de 16px — **47% da altura**, que lê como
tracinho. No `md` são 92 de 110 (84%) e 28 de 46 (61%) no mínimo, que ainda é
régua.

Baixar o raio no degrau é o desvio que o próprio arquivo já recusou, e recortar
o fio pelo raio (`overflow-hidden` com `inset-y-0`) o transforma numa lente de
~10px de miolo cheio. **Não há geometria boa porque não há caso**: `sm` é o
aviso que fala com um campo, e a marca fala uma vez por tela, no corpo inteiro.
O tipo proíbe o par em vez de entregar um degrau torto — junto de `tone`, pelo
precedente do `Progress`.

#### Quem faz a marca vencer o tom é o `tailwind-merge`, não a cascata

Medição que quase passou como defeito do componente: pondo as classes da marca
e do tom cruas no mesmo `class` — sem passar pelo `cn` —, a faixa saía com o
texto **azul** (`oklch(0.36 0.1 240)`, o `--info-muted-foreground`). O motivo é
que `text-foreground` e `text-info-muted-foreground` empatam em (0,1,0) e quem
decide é a **ordem de emissão do Tailwind**, não a ordem no atributo.

No componente real não acontece, porque o `cn` **remove** o perdedor — medido
no DOM: sobram `bg-muted`, `text-foreground` e `border-b-0`, e nenhuma classe
tonal. Mas a garantia é a remoção, e não a disputa: quem montar as variantes à
mão traz o defeito de volta. `brand-contour.test.ts` passou a afirmar o
resultado **mesclado**, e não só a saída do `cva`.

Pela mesma aritmética, a ordem das chaves no `cva` da barra é carga estrutural:
`variant` é declarado **depois** de `sticky`, senão o `border-b` do `sticky`
vence o `border-b-0` da marca e a faixa sai com duas linhas de 1px empilhadas,
uma cinza e uma de arco-íris.

#### O contraste da régua, reportado

Oito paradas contra as duas superfícies que ela toca:

| | pior | melhor | abaixo de 3:1 |
| --- | --- | --- | --- |
| escuro · alerta (`--card`) | violeta **5,35** | lima 13,01 | nenhuma |
| escuro · barra (`--muted`) | violeta **4,52** | lima 10,98 | nenhuma |
| claro · alerta (`--card`) | lima **1,91** | violeta 5,37 | teal, azul, âmbar, lima |
| claro · barra (`--muted`) | lima **1,60** | violeta 4,51 | +coral |

**Não é um caso de 1.4.11, e a razão é o papel.** A norma pede 3:1 para o que
*identifica* a peça, e quem identifica o aviso é a caixa mais o ícone. A régua é
acento — a categoria do halo do `Badge` e do arco-íris do `Progress`, que já
registra cinco de oito paradas reprovando no claro (pior caso 1,42). Conferido
na tela nos dois temas: no claro o fio é mais delicado, e o contraste cromático
o sustenta onde a fórmula de luminância não vê. O caminho de reforço, se ele
ler fraco demais, é o que o `Progress` documenta — leito escuro sob o fio —, e
lá foi recusado na tela.

#### E os dois botões da barra nunca migraram para o disco da rodada 99

O achado que não tem nada a ver com marca, e apareceu medindo os arquivos.
`AnnouncementBarAction` e o × de dispensar mantinham `hover:bg-current/10` e
`/15` e **nunca declaravam `--button-fill-color`** — então herdavam o cinza de
`--muted` do `tertiary`. Confirmado no DOM: nos dois, a variável resolvia para
`color-mix(in oklab, oklch(0.269 0 0) 50%, transparent)`.

O realce pintava **duas** camadas: a tinta tonal chapada na caixa toda, e um
disco cinza crescendo por cima.

| tom | superfície | hover antes | hover depois |
| --- | --- | --- | --- |
| claro · info | `200,241,255` | **`235,235,235`** | `180,224,240` |
| claro · warning | `255,234,186` | **`235,235,235`** | `240,217,167` |
| claro · success | `206,247,216` | **`235,235,235`** | `185,229,197` |
| claro · destructive | `255,219,212` | **`235,235,235`** | `245,200,194` |

No tema claro `--muted` é **opaco** (`oklch(0.94 0 0)`), e os quatro tons
convergiam no **mesmo cinza**: o realce não realçava o tom, apagava. No escuro o
disco é 50% e o efeito era dessaturação — `warning` ia de `78,45,0` para
`67,50,28`.

**Ninguém viu porque a razão de luminância é 1,007–1,078** — nada. O defeito é
**cromático**, e os scripts desta casa só medem luminância; é a nota de método
que a rodada do `Progress` já registrou, aqui cobrando o preço. Depois do
conserto, medido no DOM: **1,299** na ação e **1,45** no × (a assimetria de
área, 10% contra 15%, continua), dentro da faixa que o `bg-current/N` sempre
registrou nesta casa.

Saiu junto um defeito vizinho no ×: ele carregava só `text-current` (0,1,0)
contra o `hover:text-foreground` (0,2,0) do `tertiary`, então **trocava a tinta
do tom pelo cinza neutro no cursor**. O par `hover:text-current
active:text-current` é o mesmo que o `AlertAction` já tinha.

#### Os dois consertos de tabela

- **`docs/alert.tsx` documentava o `role` errado**: dizia que `destructive` *e*
  `warning` saem assertivos, e o componente só faz isso com o destrutivo. A
  documentação estava errada, não o código.
- **As linhas de import do registry omitiam `AlertAction` e
  `AnnouncementBarAction`** — a linha que a pessoa copia do catálogo não
  construía a demonstração "Com ação" que o próprio catálogo publica.

#### O que ficou de fora

Nenhuma tela migrou, por decisão do dono. `globals.css` não foi tocado — a
medição da geometria tirou a necessidade de token novo. Não entrou script de
contraste para a régua: ela é acento de 1–2px, e o precedente do `Progress`
registra os números no histórico sem guarda própria. E o `offline-banner`
continua posicionando à mão, pelo motivo de sempre: exige sessão autenticada
para verificar.

`docs/JORNADAS.md` não mudou — nenhuma rota, redirecionamento, destino,
parâmetro de URL, diálogo, RPC ou navegação global foi tocado.

### Rodada 119 — o arco-íris acende na borda do aviso quando o mouse passa

O pedido: no `Alert variant="brand"`, conforme o mouse passa pela tela, as
bordas se iluminam com o arco-íris da marca, com um leve blur, como o
`GlowingEffect` da Aceternity. Números do dono, de uma captura do painel de
controles da referência: **blur 2, spread 40, proximity 50, borda 2, zona morta
0,01**. Decisões dele nesta rodada: o brilho **substitui** a régua que a 118
tinha acabado de pôr no alerta; **só o alerta** (a barra fica com a régua); e o
efeito mora no componente, não num `GlowingEffect` solto.

#### O precedente, dito antes de escrever

Três recusas do histórico passam perto, e foram postas na mesa antes:

- a **rodada 100**, sobre o degradê que girava — *"não é uma animação que eu
  quero usar em nenhum lugar de site, está péssimo, feio e horrível"*;
- o **`border-beam` do 21st** (feixe animado na borda), uma das cinco
  tentativas recusadas no campo, hoje travada por
  `field-control-ladder.test.ts`;
- a **rodada 90**, que montou o `button-colorful` do 21st (arco-íris a
  `blur(8px)`) e não mandou nada para o código.

**E por que isto não é a repetição de nenhuma das três.** O banimento do
`border-beam` é escopado aos oito controles de **campo**, e um aviso não é
campo. A rodada 100 matou o **laço autônomo**, não a reação ao ponteiro — o
próprio commit dela diz "o botão de marca não ficou inerte: o halo continua
acendendo no cursor", e o que entrou no lugar do giro foi a lava, que é
movimento ancorado no mouse. E a rodada 98 **inverteu** a 90 de propósito,
pondo o arco-íris atrás de uma lâmina no `primary`. O risco que resta é de
aparência, e essa é decisão de tela.

#### O que não deu para copiar

**`mask-composite` está banido nesta casa, e é medido.** A referência compõe
duas camadas de máscara (`mask-composite: intersect` mais
`mask-clip: padding-box, border-box`). O `AGENTS.md` já registrava que
`mask-composite` e `-webkit-mask-composite` são propriedades distintas cuja
ordem de emissão o Tailwind não deixa o autor controlar, e que uma camada
`none` num `intersect` dá alfa zero e **apaga a peça inteira**.

A substituição dispensa a máscara inteira: o `conic-gradient` **já nasce**
transparente → arco-íris → transparente, e girá-lo por `--alert-glow-start`
*é* mover o arco. Uma propriedade em vez de quatro, e nada para compor.
`lucide-react` também não entrou (a regra de ícone é fechada em Heroicons) e
nenhum componente novo foi criado.

#### E a primeira versão não funcionava — o dono viu antes de mim

Ela mascarava o `--brand-rainbow`, que é **linear a 135°**. A janela revelava
só o pedaço da rampa que calhava de estar naquela aresta, então o que acendia
era um borrão de **uma cor**: teal à esquerda, lima à direita. Mecanicamente
tudo certo — medido, `--alert-glow-active` ia a 1, a opacidade a 1, o ângulo
perseguia o ponteiro —, e mesmo assim o efeito não existia, porque o que se via
não lia como marca.

**As minhas duas verificações mentiram, e vale registrar como.** A primeira
porque eu disparei um `window.dispatchEvent(new Event('scroll'))` à mão no
mesmo script que depois testou o hover, refrescando um cache que na vida real
podia estar velho. A segunda porque sondas anteriores tinham deixado
`--alert-glow-active: 1` **inline** na página: o arco aparecia nos screenshots
com e sem o efeito ligado, e eu li isso como "funciona". **O teste que valeu
foi o único que começou com reload e não escreveu variável nenhuma.**

O conserto é o cônico: ancorado no mesmo ângulo do arco, as oito paradas cabem
**dentro** da janela e a paleta inteira viaja junto. A lista de paradas se
repete na utility de propósito — um arco-íris comprimido em 80° não é o mesmo
degradê que uma rampa de canto a canto — e a interpolação fica em sRGB, porque
num fio de 2px já borrado o ganho do oklch não se vê e o par sRGB/`@supports`
do `brand-rainbow-image` custaria duas listas.

#### Quatro medições, e cada uma mudou o código

Todas no DOM real do servidor de desenvolvimento, antes de escrever o arquivo.

1. **A `@property` tem de ser `inherits: true`.** As quatro que já existiam são
   `inherits: false`, e copiá-las teria sido o caminho natural. Medido: com
   `false`, o **pseudo-elemento não herda** a variável — a `opacity` ficou em
   `0` com o elemento valendo `1`. O `Button` pode ser `false` porque o
   `primary-wash` mora **no próprio elemento**; aqui quem lê é o `::before`.
2. **`z-index: -1` sem `isolate` some.** O pseudo cai atrás do fundo de um
   ancestral — medido, invisível na página do catálogo. O `Alert` passou a
   declarar `isolate`.
3. **Com `isolate`, o pseudo de `z` negativo pinta POR CIMA do `bg-card`.** É a
   ordem de pintura da raiz de empilhamento, e sem correção o degradê cobriria
   o texto com sete matizes. A saída é a receita já travada da casa: núcleo
   chapado em `padding-box` sobre o arco-íris em `border-box`, com o núcleo em
   `--card` — onde a máscara apaga, o que se vê é a cor do próprio cartão.
4. **O arco acende onde deve, e a 2px ele some num screenshot reduzido.** Duas
   leituras saíram em branco antes de o `inset` ser exagerado para conferir; a
   causa era o screenshot de 1440 chegando a 800. **Quem for conferir isto
   mede pixel ou emula 1:1** — a olho, num print reduzido, a peça parece morta.

Dois presentes do que já existia: **`--ease-out` já é
`cubic-bezier(0.16, 1, 0.3, 1)`**, exatamente a ease da referência, e
`--brand-rainbow` serve de cor do anel sem precisar de uma segunda lista das
oito paradas — que teria de existir em dobro, pelo par sRGB/`@supports`.

#### O ângulo acumula, e a referência erra essa conta

Ao cruzar 180° o ângulo cru salta de 179 para −179, e uma transição
interpolaria o caminho longo: o arco daria a volta pelo lado errado. A conta
envolve a diferença em [−180, 180) **com módulo duplo**, porque o `%` do
JavaScript preserva o sinal — a referência escreve
`((alvo - atual + 180) % 360) - 180`, que devolve valores abaixo de −180 quando
a diferença é bem negativa.

Medido nos dois lados: ponteiro à esquerda → **−449,9**; à direita → **−270,1**.
A diferença é +179,8°, o caminho **curto**, atravessando o topo.

#### E depois ele estava alto demais

Com o cônico no lugar o efeito passou a existir, e a segunda leitura do dono foi
que ele destoava da referência: lá o fio é **fraco e fino**, e o daqui saía em
opacidade cheia com as pontas cortando seco — a travessia de `transparent` para
o teal acontecia em 12° e a ponta lia como aresta, não como brilho.

Dois ajustes, e a divisão entre eles é a decisão: **`--alert-glow-opacity`
(0,5) baixa a peça inteira**, e um **envelope de alfa** faz o arco nascer e
morrer (as extremidades entram em 20% e 60% antes do miolo opaco, que é o que a
referência consegue pela máscara, `#00000000 → #fff → #00000000`). O miolo fica
cheio de propósito: baixar as paradas do meio tiraria a **cor** junto com a
força, e a cor é o que o cônico veio consertar. **Quem for mexer no volume mexe
no multiplicador, nunca nas paradas.**

#### O único listener em `document` do design system

O `Button` segue o ponteiro com handlers no próprio elemento, porque a lava
dele só existe sob o cursor. Aqui `proximity: 50` quer dizer que o aviso acende
com o mouse **perto, não em cima**, e handler local nunca vê o que acontece
fora da caixa. Então há um listener em `document` — escopado: só monta com
`variant="brand"`, só sob `(hover: hover)`, sai no unmount, e "uma por tela" o
mantém em um. **A caixa é medida uma vez** e remedida em rolagem e resize, e
não a cada movimento: `getBoundingClientRect` por `pointermove` global forçaria
layout pela tela inteira, o que no `Button` é barato só porque lá o evento
dispara sobre o botão. Sem `requestAnimationFrame` em laço, que é precedente
proibido, e sem estado React.

#### A razão do `size="sm"` mudou, e a antiga foi apagada

A 118 proibia `brand` com `sm` por **geometria**: a régua precisava de 8px de
recuo para não encostar no `rounded-xl`, e numa caixa `sm` de 34px sobravam 16
de fio, 47% da altura. **Com o brilho, essa razão deixou de existir** — um arco
na borda funciona em qualquer altura. A proibição fica, agora só pela razão
semântica, que sempre foi a mais forte: `sm` é o aviso que fala com um campo, e
a marca fala uma vez por tela. A justificativa velha saiu da documentação em
vez de ficar apodrecendo ao lado da nova.

#### O custo, dito e não escondido

**No telefone o `Alert variant="brand"` fica sem marca nenhuma.** Não há
ponteiro, logo não há brilho; e como ele substituiu a régua, o que sobra é a
caixa neutra, visualmente igual ao `soft` de `tone="default"`. Isso contraria o
princípio 3 do `PRODUCT.md` ("o telefone é o aparelho, não a versão reduzida"),
e é a consequência direta da opção escolhida pelo dono entre três. Reverter é
uma linha: devolver a régua como repouso. Em `prefers-reduced-motion` o bloco
global corta a transição para 0,01ms e o arco passa a saltar em vez de
perseguir — seguir o ponteiro continua, porque não é animação nem transição.

#### Os testes

O bloco 9 de `brand-contour.test.ts` **se dividiu**: ele proibia `blur` nas
duas peças e travava a geometria da régua do alerta por classe exata, então o
alerta saiu para um bloco 10, "a família do brilho". As asserções novas cobrem
os dois modos de falha silenciosa medidos — mutação confirmada nos dois: tirar
`isolate` reprova, e trocar `inherits: true` por `false` reprova.

`docs/JORNADAS.md` não mudou.

### Rodada 120 — a cor fica parada, e quem anda é a janela

O dono gravou a tela e disse: a animação não é a da referência. Mandou também o
link (`21st.dev/@manuarora700/components/glowing-effect`), e foi ele que
resolveu — **medi o bundle ao vivo em `cdn.21st.dev`, same-origin**, o mesmo
caminho que a rodada 90 já tinha usado. O que vale é o CSS computado dela, não
o código-fonte que o site publica.

#### O que a gravação mostrava

Quatro quadros, extraídos com AVFoundation (não há `ffmpeg` nesta máquina; um
script Swift de 20 linhas resolve): aos **2,05s** o arco está na aresta direita
do primeiro cartão, em **oliva e âmbar**; aos **6,15s** na base, em
**magenta → verde → teal**; aos **9,22s** na direita do segundo cartão, oliva e
teal; aos **13,32s** na esquerda dele, **magenta**.

**O arco troca de cor conforme viaja.** O nosso mostrava sempre a mesma
sequência e só mudava de lugar.

#### A inversão, lida do bundle

```
background-image:  repeating-conic-gradient(from 236.84deg at 50% 50%, …)   ← FIXO
mask-image:        conic-gradient(from 96.67deg, transparent, #fff, transparent 80deg)
--start: 136.67    e 136,67 − 40 (spread) = 96,67 → o `from` da máscara
```

O degradê de cor **nunca gira**; quem gira é a **máscara**. A janela revela
faixas diferentes de um arco-íris parado, e é daí que vem a troca de cor.

**Duas tentativas erraram isto de jeitos opostos, e as duas são minhas.** A
rodada 119 começou mascarando o `--brand-rainbow`, que é **linear** — a janela
revelava só o pedaço da rampa naquela aresta e acendia **uma cor**, um borrão
teal que lia como sujeira. Corrigi para cônico, mas girei o cônico **junto** com
o arco e tirei a máscara; com isso ele passou a carregar sempre a mesma ordem de
cores. O certo é o cônico **parado** com a janela andando por cima.

#### O resto do que o bundle entregou

- **A janela é um triângulo puro**: três paradas (`transparent`, `#fff` no meio,
  `transparent` em 80°), sem platô. O envelope de alfa que eu tinha posto nas
  paradas de cor saiu — ele existia para simular o fade que a máscara agora faz
  de verdade, e os dois juntos dobravam o escurecimento das pontas.
- **A máscara volta como uma camada só.** A referência compõe duas
  (`mask-composite: intersect, intersect`) apenas para recortar o anel; aqui
  esse trabalho já é do par `padding-box`/`border-box`, e onde a máscara apaga
  aparece o `bg-card` do próprio alerta, idêntico ao núcleo. O banimento desta
  casa é da **composição**, não da máscara: uma camada `none` num `intersect`
  apaga a peça.
- **`--blur` na referência ao vivo é `0px`**, não 2. A foto dos Controls que o
  dono mandou era a configuração **dele**. Ficou o 2 que ele pediu, e o 0 fica
  registrado para comparação.
- **O que já estava certo**: `spread` 40 (janela de 80°), `from = start −
  spread`, `opacity` em 0,3s, e a perseguição em 2s com
  `cubic-bezier(0.16, 1, 0.3, 1)` — o `movementDuration` padrão da referência,
  que por acaso é o `--ease-out` desta casa.
- `--alert-glow-repeat` (5) espelha o `--repeating-conic-gradient-times` de lá:
  4 cores × 5 voltas dão faixas de 18°; 8 × 5 dão faixas de 9° e ciclo de 72°,
  e a janela de 80° mostra ~1,1 ciclo — a mesma razão.

#### O teste que separa o certo dos dois erros

O bloco 10 passou a fatiar a utility em duas partes e afirmar o oposto em cada
uma: **a cor não pode** casar `--alert-glow-start`, e **a máscara tem** de
casar. Mutação confirmada nos dois sentidos — girar o cônico junto reprova, e
tirar a máscara reprova.

Junto saiu um defeito do próprio teste: `fonteCss()` lia o `globals.css` **com
comentários**, e a asserção `not.toMatch(/mask-composite/)` casava com a prosa
que explica justamente por que aquilo não está lá. Agora ele tira comentários,
como o `fonte()` de TSX já fazia.

#### Nota de método, porque me custou três rodadas

**A ferramenta certa era a referência ao vivo, e eu cheguei nela por último.**
Antes disso eu tinha o código-fonte dela colado na conversa e mesmo assim errei
duas vezes, porque o que decide é o **computado** — o `background-attachment:
fixed` do fonte, por exemplo, sai `scroll` no computado. Medir a referência
rodando custou uma chamada e resolveu o que duas rodadas de leitura não
resolveram.

### Rodada 122 — a rolagem recalcula o brilho, e as faixas ganham largura

O dono disse que a animação das bordas ainda não estava igual à referência e
mandou `npx @21st-dev/cli add manuarora700/glowing-effect`. O registry do 21st
pede autenticação (403), então o CLI não roda sem a chave dele — mas o fonte do
componente já estava verbatim na primeira mensagem da sessão, e o que decidiu
foi comparar **as duas rodando**, no bundle ao vivo.

Decisão dele nesta rodada: **o design atual fica** (opacidade 0,5, blur 2, borda
2px, proximity 50). O que se revisa é **comportamento**. E os quatro blobos
radiais entram, com cores da marca.

#### O bug: a rolagem não recalculava nada

Medido: rolando **260px com o ponteiro parado**, o alerta ia de `top 255` para
`-5` — longe do mouse — e o brilho **continuava aceso**, `--active` em `1` e o
ângulo em `-90`, apontando para onde o ponteiro não estava mais. Ele só voltava
ao normal no movimento seguinte do mouse.

A causa é uma linha que não foi portada. Na referência:

```js
const handleScroll = () => handleMove()          // sem evento
const handleMove = (e?) => { const mouseX = e?.x ?? lastPosition.current.x; … }
```

Ela guarda a **última posição do ponteiro** e, ao rolar, refaz a conta inteira a
partir dela. O daqui só remedia a caixa em `scroll`; `--active` e o ângulo
ficavam parados.

Consertado com a mecânica dela, mais **`capture: true`** — que é a única
divergência deliberada, e corrige um caso que a referência erra: `scroll` não
borbulha mas captura, então sem isso a rolagem **dentro de um container** passa
despercebida e só a da janela conta. É a mesma solução que
`use-close-on-scroll` já usa nesta casa.

Depois do conserto, com scroll de usuário real: o alerta sai de `top 405` para
`-95` e `--active` cai de **1 para 0**.

#### Nota de método: a rolagem programática mentiu duas vezes

As duas primeiras verificações do próprio conserto deram **falso negativo**.
`window.scrollBy()` e `documentElement.scrollTop = …` movem a página mas, neste
pane automatizado, **não despacharam evento de `scroll` de forma confiável** —
medido: a página foi de `scrollY 1496` para `1246` e nem `window` nem
`document`, em captura, receberam nada. Com scroll de entrada real (roda do
mouse), os dois receberam e o conserto apareceu.

É a terceira vez nesta sessão que o instrumento mente pelo mesmo motivo — antes
foram o `scroll` sintético disparado à mão e o `style` inline deixado por uma
sonda anterior. **O que vale é o caminho de entrada real, começando do zero.**

#### O `rAF` daqui coalesce, e o proibido é o laço

O trabalho de cada rajada de `pointermove` passou a ir para **um**
`requestAnimationFrame`, cancelado no anterior e no unmount. Isso obrigou a
trocar uma asserção que esta própria sessão havia escrito
(`not.toMatch(/requestAnimationFrame/)`): o precedente que esta casa recusou —
no marcador do `Tabs` — é o `rAF` que se **re-agenda** para fazer polling, não
coalescer um evento num quadro, que é o uso da referência. A asserção nova
cobra o que separa os dois: **um** ponto de agendamento e um cancelamento (um
laço não cancela, ele se renova).

Com o `rAF` no lugar, **o cache da caixa saiu**: ler
`getBoundingClientRect()` uma vez por quadro é barato, e mata a obsolescência de
**qualquer** origem — um acordeão abrindo, uma imagem carregando, um reflow —,
não só de rolagem e resize, que era o que o cache cobria.

#### Os quatro blobos, e a largura de faixa

Os quatro `radial-gradient` da referência entraram (`circle`, `at 40% 40%`,
`at 60% 60%`, `at 40% 60%`), com paradas da marca no lugar dos hexadecimais
dela, e **antes** do cônico na lista de camadas, como lá. São manchas presas à
caixa: é o que faz a cor variar por **posição**, e não só pelo ângulo do arco.
Sem elas o mesmo lado do aviso acendia sempre com as mesmas cores.

E apareceu a conta que explica o aspecto de borrão, que nenhuma das rodadas
anteriores tinha feito:

| | cores × voltas | largura de faixa | faixas na janela de 80° |
| --- | --- | --- | --- |
| referência | 4 × 5 = 20 | **18°** | 4,4 |
| daqui, antes | 8 × 5 = 40 | **9°** | 8,9 |
| daqui, agora | 8 × 2,5 = 20 | **18°** | 4,4 |

Copiar o `--repeating-conic-gradient-times: 5` da referência com **oito**
paradas em vez de quatro dava faixas com **metade da largura** e o dobro da
contagem — e sob o borrão de 2px elas se misturavam em lama em vez de ler como
bandas. `--alert-glow-repeat: 2.5` devolve os 18° dela com a paleta daqui.
**O que importa é a largura de faixa, não o número de voltas**, e essa é a
lição que o token agora carrega escrita.

### Rodada 123 — o pane não pinta, e a animação vira a da referência de verdade

O dono disse, com ênfase, que **não era o design e sim a animação**, e mandou
fazer exatamente igual à referência. Duas coisas saíram desta rodada: o port
literal do mecanismo dela, e a descoberta de que o instrumento de julgamento
estava quebrado desde o começo.

#### O pane roda a 0,2 fps

Medido, e é a peça que reenquadra as rodadas 119 a 122:

```
rAF no pane do app:                 0,2 fps  (1 quadro em 2s)
animação de `transform` (compositor): progride normal
document.visibilityState:            "visible"
document.hasFocus():                 true
```

O pane **não agenda quadros continuamente**. A varredura do arco depende de
rasterizar `mask-image` a cada quadro — trabalho de main thread —, então
**nenhum mecanismo pode animar suavemente ali**: nem a transição de CSS que
estava, nem o `animate()` da referência, nem nada. Só propriedades de
compositor (`transform`, `opacity`) passam.

Isso explica a série inteira de "continua igual": as três rodadas anteriores
mudaram cor, largura de faixa, blobos e comportamento de rolagem, e **nenhuma
delas podia mudar o que se via no pane**, porque o que faltava ali era quadro,
não código.

Também explica por que toda tentativa de medir suavidade falhou: `setInterval`
de 120ms disparando a cada ~1000ms, `rAF` amostrando 4 quadros em 3s, e um
`MutationObserver` registrando **uma** escrita do tween em vez de ~120. Os três
mediam a mesma starvation.

**Como julgar isto:** abrir `localhost:3000/designsystem/alert` no Chrome
próprio, onde o `rAF` roda a 60fps. No pane, o arco salta por construção.

#### O port literal

Com o instrumento desacreditado, não havia como sustentar "a minha mecânica é
equivalente à dela" — que era dedução minha, repetida por três rodadas. Então o
mecanismo passou a ser o dela:

- sai a `@property --alert-glow-start` e a `transition: … 2s` de CSS; a
  propriedade volta a ser **não registrada**, como na referência, porque quem
  interpola é o tween;
- entra o `animate` do `motion` (já dependência da casa, usada pelo `Tooltip`),
  com `duration: 2` e `ease: [0.16, 1, 0.3, 1]`, escrevendo a variável no
  `onUpdate`;
- **o ângulo atual sai do DOM** (`el.style.getPropertyValue`), e não de um
  acumulador. Este era um defeito real da versão anterior: um acumulador guarda
  o **alvo**, não onde a animação está.

Três divergências deliberadas, todas anotadas no arquivo: o módulo **duplo** no
caminho curto (o da referência devolve valores abaixo de −180 e o arco dá a
volta pelo lado errado); **parar o tween anterior** (ela não para, e deixa até
~120 tweens vivos escrevendo a mesma variável — a trajetória é a mesma, porque
cada tween novo parte do valor atual do DOM); e **movimento reduzido perguntado
à mão** com `matchMedia`, porque o bloco global encurta *transição* e um tween
de JS escapa dele — o precedente é o `ThemeToggle` ao trocar transição por
WAAPI.

#### E os quatro blobos da rodada 122 não pintam nada

Medido nesta rodada: eles são círculos no **interior** da caixa (`radial-gradient(circle, cor 10%, transparent 20%)`,
raio ~20% da menor dimensão) e o que se vê da peça é só o anel de 2px na
**aresta**. Eles nunca alcançam o anel — e o mesmo vale na referência, onde o
raio efetivo é ~44px num cartão de 374×230 contra um anel de 3px na borda. São
quatro camadas de `background-image` fiéis ao fonte e invisíveis nas duas
pontas. Ficam, com a nota, porque engrossar a borda ou trocar o anel por
preenchimento as tornaria visíveis.

### Rodada 124 — o arco nasce arco, e o alvo encosta

Duas coisas, e a primeira é o service worker.

#### Por que nada aparecia no Chrome do dono

Ele reportou que o brilho não aparecia no navegador dele. O código estava certo
e servido certo — o CSS em `:3000` continha `--alert-glow-repeat: 2.5` e 18
ocorrências de `alert-glow`, e numa aba nova do pane o efeito ligava. **O que
estava errado era o Chrome dele estar controlado por um service worker antigo**,
servindo o precache.

E o próprio repositório já documentava essa falha, em `sw-register.tsx`: *"não
registrar não é o mesmo que não estar registrado… a rota responde 200, o HTML
do servidor está certo, e a tela mostra o catálogo de ontem. Foi assim que
quatro componentes novos 'não apareceram' com tudo no lugar."* O pane é um
perfil separado, sem SW — daí funcionar aqui e não lá.

**Isso põe em dúvida o feedback das rodadas 119 a 123**: é possível que o dono
não tenha visto nenhuma delas, o que explica "continua igual" três vezes
seguidas. A lição operacional: quando algo "não aparece" e o servidor está
certo, a primeira pergunta é o service worker, não o código.

#### "A linha já aparece inteira em vez de crescer"

Com o cache limpo, o dono descreveu a diferença real com a referência, e era um
bug — medido e ignorado por mim duas rodadas antes.

`--alert-glow-start` **não tinha valor inicial**. A referência declara
`"--start": "0"` no style inline; aqui a `@property` dava o `initial-value`, e
quando ela saiu (rodada 123, o ângulo passou a ser animado por JS) nada repôs.
Sem valor, `calc((var(--alert-glow-start) - …) * 1deg)` é inválido e
**`mask-image` cai para `none`** — nenhuma máscara. O que se pintava era o anel
**inteiro**, e com o `--alert-glow-active` subindo de 0 a 1 em 300ms o anel
completo *aparecia*, colapsando em arco só quando o tween escrevia o primeiro
número.

Eu havia medido `mask_e_none: true` em repouso na rodada 123 e **não sinalizei**,
porque a opacidade era 0 e a peça parecia invisível. O defeito vivia justamente
na travessia entre 0 e 1.

Com `--alert-glow-start: 0` declarado na utility, o arco existe desde o repouso
— um segmento curto centrado no **topo**, como na referência — e ao aproximar
ele **viaja** até o ponteiro. Conferido: `mask-image` sai
`conic-gradient(from -40deg, …)` em repouso, e não mais `none`.

**É uma falha que não derruba nada**: o CSS é válido, o teste passava, o tipo
passava. Só o efeito ficava errado. `brand-contour.test.ts` passou a exigir o
valor inicial.

#### E o alvo encostou

`GLOW_PROXIMIDADE` de 50 para **24**, a pedido: o alvo grande acendia o aviso
antes de o ponteiro ter intenção de chegar nele. Limiar medido disparando
`pointermove` a distâncias crescentes da aresta: acende a 10 e 20px, apaga a 30
e 60. A referência usa 64.

### Rodada 125 — o `variant="plain"` do `Alert` sai

Pedido do dono, olhando a demonstração da seção "Forma" no catálogo. O eixo
`variant` do `Alert` passa de três valores para **dois**: `soft` (o padrão, com
moldura) e `brand` (a caixa neutra com o brilho de arco-íris na borda).

**O que o `plain` era, e por que ele existia.** O aviso tingido **sem borda**,
para dentro de formulário ou diálogo — a razão escrita no próprio componente
era que ali "a moldura já é de outro e mais uma só acrescenta um retângulo".
Ele tinha **8 chamadas em 4 telas de acesso**: `invites/accept` (3),
`login-form` (2), `signup-form` (2) e `password-recovery-form` (1).

**O custo, dito e não escondido:** essas oito passaram a desenhar a própria
borda dentro do formulário, que é exatamente o que o `plain` evitava. Se o
retângulo a mais incomodar na tela, o caminho de volta é uma linha
(`border-0`), e a razão de ele ter existido ficou escrita no JSDoc do eixo e
numa nota do catálogo — não se perdeu com o valor.

Saiu junto a seção "Forma" do catálogo, que existia **só** para contrastar
`soft` com `plain` (com uma moldura de mentira em volta, para o retângulo a
mais aparecer como retângulo a mais). Com um valor só do lado da moldura ela
não contrastava nada.

Nota de mecânica: o `plain` de `Card`, `EmptyState`, `PageHeader`, `TabsList`,
`Menubar`, `Accordion` e `ResizableHandle` **não se mexeu** — o nome é
compartilhado, o eixo não. E o tipo é que acusou a página do catálogo ainda
usando o valor removido: `variant={variant}` num `.map` sobre
`["soft", "plain"]` derrubou o `tsc` antes de qualquer teste.

### Rodada 126 — os quatro blobos saem, porque não pintavam nada

Eles entraram na rodada 122, portados da referência para fidelidade de cor: os
quatro `radial-gradient` que ela põe **antes** do cônico (`circle`,
`at 40% 40%`, `at 60% 60%`, `at 40% 60%`), aqui com paradas da marca. A hipótese
era que fariam a cor variar por **posição na caixa**, e não só pelo ângulo do
arco.

**Medido na rodada 124: eles não alcançam o anel.** São círculos no
**interior** da caixa, com o degradê morrendo em 15–20% do raio, e o que se vê
desta peça é só o anel de 2px na **aresta**. E vale igual na referência — num
cartão de 374×230 o raio efetivo é ~44px contra um anel de 3px na borda. São
decoração que nenhuma das duas mostra.

Ficaram por duas rodadas com a nota de que eram invisíveis, pelo argumento de
que engrossar a borda ou trocar o anel por preenchimento os tornaria visíveis.
O dono pediu para tirar, e é a decisão certa: **fidelidade a um trecho que a
própria referência não mostra é custo sem retorno** — quatro camadas de
`background-image` que a cada quadro entram na composição do pseudo e não
produzem pixel.

Conferido depois: as camadas do `::before` passaram de
`linear-gradient + 4 radial + repeating-conic` para
`linear-gradient + repeating-conic`, e o arco na tela ficou **idêntico** — que
é a prova de que eram invisíveis.

O caminho de volta está escrito na utility e no teste: **raio de 60–80% da
caixa** para cruzarem a aresta. Nesse ponto deixa de ser port e passa a ser
desenho nosso, e é uma decisão diferente da de portar.

### Rodada 127 — a faixa de marca troca a régua pelo véu

Referência: o `Banner` rainbow do Fumadocs (Fuma Nama, MIT), lido no fonte
(`packages/radix-ui/src/components/banner.tsx`). O dono pediu a
`AnnouncementBar variant="brand"` mais perto dele. O que foi portado:

- a superfície é a página (`bg-background`), não `bg-muted`;
- um `::before` em `-z-1` sob `isolate` pinta um
  `repeating-linear-gradient(70deg, …)` com paradas em `i·50/n %` e a primeira
  cor repetida no fim, em `background-size: 200% 100%`;
- a máscara é a da referência: `linear-gradient(to bottom)` **intersect**
  `radial-gradient(circle at top center)`;
- o laço é `background-position 0% → 100%`, 20s, linear, infinito.

Decisões do dono, as duas marcadas ⚠️ fora do padrão: **arco-íris sob texto**
(exceção à invariante 3) e **movimento autônomo** (a rodada 100 recusou o
giro; a lava já se movia sozinha). O layout **não** mudou: a referência
centraliza o texto, e aqui ele segue à esquerda, com as ações no fim.

O que ficou de fora: as quatro cores da referência (entram as oito paradas da
marca) e o `filter: saturate(2)` (as paradas já são saturadas).

**Contraste.** O alfa virou token por tema, `--brand-flow-alpha`, e foi
calibrado em `scripts/tone-contrast.mjs` contra o `--foreground` no alfa
máximo da máscara. Com 0,6 nos dois temas, o claro passava (pior 6,93) e o
escuro reprovava quatro paradas (lima 3,42, âmbar 3,58, teal 4,01, azul
4,27). Ficou **0,75 no claro** (pior 5,68, magenta) e **0,45 no escuro**
(pior 5,33, lima). A 0,35 o escuro passava folgado (7,36), mas lia apagado.

Emenda conhecida, herdada da referência: o deslocamento de um ciclo em x
(largura da caixa) não é exatamente um período do degradê a 70°. A diferença
é de ~0,17·altura ao longo da linha do degradê, um salto de poucos pixels a
cada 20s.

Na mesma rodada, a pedido do dono, a faixa perdeu o fundo: `bg-background`
virou `bg-transparent`, e atrás do véu aparece o que estiver atrás da barra.
O contraste medido não muda na página (é o `--background` que o script
compõe); sobre `--card` ou `--muted` a diferença é de um degrau de
luminosidade, e o pior caso tem folga (5,33 contra o piso de 4,5).

E a rampa vertical da máscara passou a fechar em **90%** da altura (70% na
primeira tentativa, que cortava cedo), e não em 100% como na referência: com o fundo transparente, o resto de cor na última
linha desenhava a aresta de baixo da faixa. O contraste não muda, porque o
pior caso é medido no topo, onde a máscara vale 1.

### Rodada 128 — o conteúdo da divulgação sobe em cascata

O dono pediu uma animação moderna para o conteúdo do `Collapsible`, e a
mesma para o `Accordion`, porque os dois são a mesma interação. A altura
continua nos keyframes do `tw-animate-css`. Por cima dela, `@utility
disclosure-reveal` faz cada filho subir 6px saindo de um desfoque de 4px e de
opacidade zero (`--duration-slow`, `--ease-out`), com 40ms entre um filho e o
seguinte e teto de 160ms. Ao fechar, os filhos afundam 4px e desfocam em
`--duration-fast`.

**A entrada roda na montagem, e não por estado.** O Radix só monta o conteúdo
ao abrir, então não é preciso seletor de `data-state=open`. A saída é por
estado, e ela não prende o fechamento: o Presence espera o `animationend` só
da própria `Content` (confere o `target`). Medido: o nó desmonta ao fim da
altura.

**O texto solto quase ficou de fora.** A primeira versão animava `& > *`, e o
acordeão do catálogo (texto direto no envelope) abria sem animação nenhuma:
`> *` não alcança nó de texto. A regra `:not(:has(> *))` anima o próprio
envelope, e exclui a `Content` do `Collapsible`, cuja animação é a de altura.

Medido no navegador: a opacidade vai de 0,55 a 0,91 e a 1 aos 30, 90 e
500ms, e o desfoque de 1,8px a 0. Os atrasos saem 0, 40, 80, 120, 160 e 160ms.
Ao fechar, a opacidade está em 0,04 aos 60ms.

Custo: quem nasce aberto (`defaultValue`/`defaultOpen`) toca a cascata no
carregamento. A espiada não veste a utility.

### Rodada 129 — a divulgação abre numa mola

O dono recusou a rodada 128 por mecânica e pediu o movimento "orgânico e
natural" dos outros lugares do sistema. O natural da casa é a **mola** da
`Tooltip` (`stiffness 300`, `damping 25`, no `motion`). Uma curva de Bézier
chega e para; a mola passa um pouco e volta.

A altura do Radix é animação de keyframes, não de JS, então a mola entrou
como **`linear()` de CSS**: integrei a equação da mola (massa 1, passo de
0,1ms) e amostrei 41 pontos. A mola passa **3,8%** do alvo e assenta em
**500ms** (tolerância de 0,002). Os tokens são `--ease-spring` e
`--duration-spring`. O `generateLinearEasing` do `motion` travou o
processo, e a integração à mão dá a mesma curva sem depender dele.

- **Abrir:** a altura e o conteúdo andam na mola. O desfoque saiu, e a
  cascata encolheu para 30ms, com teto de 120ms.
- **Fechar:** `--duration-base` com `--ease-out`. Uma mola até zero passaria
  por baixo de zero, e a altura negativa, cortada em 0, faria o bloco parar
  seco no meio do trajeto.

Medido no acordeão do catálogo: a altura sai 0,13, 0,43, 0,70, 0,89 e 0,99
aos 30, 70, 110, 150 e 190ms, chega a **1,037 aos 270ms** e volta a 1,000 aos
510ms. O fechamento vai a zero em 160ms e desmonta.

### Rodada 130 — a espiada desliza até o fim

O dono pediu que o "Continuar lendo" deslize até o fim, mostrando todo o
conteúdo. A espiada abria de uma vez desde que nasceu. As quatro tentativas
registradas no `collapsible.tsx` falharam pela mesma causa: a altura morava
no CSS, e o recálculo forçado do Radix a resolvia na mesma passagem em que o
`data-state` virava `open`.

O conserto foi tirar a altura do CSS. `useEspiada` escreve a altura da casca
como estilo inline, e um `MutationObserver` no `data-state` lê a altura atual,
que ainda é a de antes, e anima até o destino com o `animate` do `motion`.
Abrir é a `MOLA` da `Tooltip`, agora em `src/lib/spring.ts` para as duas peças
dividirem. Fechar é 200ms `--ease-out`, pela regra da rodada 129. Ao fim da
abertura a altura volta a `auto`, para um parágrafo que reflua não ser
recortado.

A quarta tentativa (WAAPI a partir de um `MutationObserver`) falhava ao
fechar porque a caixa lida no callback já era a nova. Com a altura inline,
não é.

Medido no degrau `sm`: 60, 79, 109, 136, 153, 162 e **165px** (a mola passa
do alvo) e assenta em 161, com o gatilho descendo de 527 para 627. Fechar vai
de 161 a 60px em 160ms. A `--collapsible-full` e o `useAlturaCheia` saíram.

### Rodada 131 — o EmptyState ganha uma forma por situação

Os 27 estados vazios do app eram o mesmo círculo cinza com um ícone. O dono
pediu um redesign com a cara da marca, e deu quatro referências do 21st:

- **shadcnui-blocks/empty-state-04:** linhas-fantasma da lista rolando atrás
  do título.
- **serafimcloud/empty-state:** três ladrilhos de ícone em leque.
- **efferd/not-found-2:** o "404" enorme dissolvendo para baixo.
- **nevsky118/not-found:** o "404" gigante como marca d'água atrás de um
  título grande.

O desenho foi aprovado em AskUserQuestion, com as três peças novas e os
erros com marca.

| Situação | Forma |
| --- | --- |
| primeiro uso | `variant="brand"` + `EmptyStateGhost` |
| filtro, período, lista vazia | `EmptyStateIcon variant="stack"` |
| não encontrado | `size="page"` + `EmptyStateCode` (`mask`) |
| erro de runtime | `size="page"` + `EmptyStateCode variant="watermark"` |

**Telas:**
- **Marca e fantasmas:** transações, as transações da categoria,
  assinaturas, contas, cartões, planos e categorias.
- **Leque:** os quatro "com esses filtros", atividade, os quatro cartões do
  painel, membros e convites, e o painel de notificações, que era feito à mão.
- **Página:** o 404 e o fallback de erro.
- **O resto:**
  - "cartão não encontrado" usa o numeral num corpo menor;
  - sessões ganhou `tone="success"` no lugar da cor escrita à mão;
  - as mensagens por aba de categorias viraram `EmptyState` pequeno;
  - nos três erros, saiu a moldura `card` recriada à mão, e o segundo botão
    virou `tertiary`, pela regra de par de ações.

**Três defeitos medidos no caminho:**
1. **O título do 404 sumia.** O `not-found-shell` é server component e
   passava `<h1>` por `asChild`: o `Slot` recebia uma referência preguiçosa
   do RSC, não um elemento, e não renderizava nada. No catálogo, que é
   cliente, funcionava. Conserto: no degrau `page` o título nasce `<h1>`.
2. **Os fantasmas não andavam.** Com `animate-[empty-state-drift_…]` o
   `animation-name` computado era o certo e a regra `@keyframes` não existia
   em folha nenhuma: o Tailwind v4 descarta keyframes que nenhuma utility
   referencia. Conserto: `@utility empty-state-drift` e `empty-state-sheen`.
   Medido depois: `translateY` de −12,5 para −31,8px em 1,5s, e parado com
   movimento reduzido.
3. **O auditor acusava a regra G** nos 2º e 3º ícones do leque. Ele só
   reconhecia o `EmptyStateIcon` como vizinho imediato, e passou a procurar
   o ancestral em aberto, como já fazia para o `ColorTile`.

Medido no leque: os ladrilhos saem de ±8° em repouso para ±14° e ±8px no
cursor, e o do meio sobe 6px.

**Correção na mesma rodada: o véu virou brilho.** A primeira versão reusava a
máscara da AnnouncementBar cortada numa linha reta a 45%, e dentro da caixa
arredondada ela lia como um painel colorido com borda. O dono pediu o
arco-íris "pulsando e passando igual o announcement bar". Agora é a
`@utility empty-state-veil`:
- o mesmo `brand-flow` (degradê e deslize de 20s);
- uma elipse que cabe **inteira** na caixa, `44% × 26%` centrada a 28%. A
  segunda tentativa, `55% × 34%` a 22%, passava do topo e dos lados, e o
  corte ali redesenhava a borda reta;
- a opacidade respirando entre 0,55 e 1 em 5s, na mesma lista de `animation`.

**E a elipse virou blobos.** O dono pediu "blobs que se movimentam, não uma
peça oval". O véu passou a ser cinco manchas radiais (teal, violeta,
magenta, âmbar, azul) orbitando pela `@property --brand-lava`, que já estava
registrada. É a mecânica da `brand-lava`, com três diferenças: as manchas
são translúcidas no `--brand-flow-alpha`, não há chão preto e não há máscara,
porque cada uma dissolve sozinha. A primeira passada, com raio vertical de
30%, deixava a de cima passar do topo da caixa e ser cortada reta ali. Com
raio de 20% (luz até 70% dele) e os centros andando entre 20% e 40%, a luz
fica entre 6% e 54% da altura. As manchas mudam de lugar entre quadros de 4s.

**E o arco-íris saiu do fundo.** O dono recusou os blobos ("ficou horrível"),
e numa pergunta com quatro caminhos escolheu **o arco-íris nos fantasmas**.
As três versões recusadas tinham o mesmo defeito: punham a cor *atrás* das
linhas, como forma solta. Agora ela corre no contorno de cada linha, pela
`@utility empty-state-contour`, com a receita da família do contorno: núcleo
`--card` opaco em `padding-box` sobre um degradê repetido em `border-box`.
O degradê desliza um período por volta, com `background-size` 200% e período
de 50% da imagem, e por isso não tem emenda. Cada linha anda numa fase, com
atraso negativo de 1,3s por índice. A moldura `brand` não pinta mais nada, e
os fantasmas leem a variante por contexto. Saíram o `empty-state-veil`, o
`empty-state-pulse` e o uso da `--brand-lava`.

**E o arco-íris saiu do primeiro uso.** O contorno também foi recusado
("horrível, remova o arco-íris"). Saíram a variante `brand`, a
`@utility empty-state-contour` e o contexto que a levava aos fantasmas, e as
sete telas voltaram a `variant="plain"`. Os fantasmas ficam neutros e
continuam subindo. A marca do `EmptyState` fica só no numeral das páginas de
erro, que não foi contestado. São quatro recusas seguidas de arco-íris
naquele lugar: atrás dos fantasmas, como degradê cortado, elipse e blobos, e
no contorno deles. Quem for tentar de novo deve ler isto antes.

**O "Ops" subiu.** O dono quis o erro de runtime igual ao 404: a palavra
acima do título, e não como marca d'água atrás dele. O texto virou "Ops!",
com exclamação, também a pedido dele. O ícone vermelho saiu, porque dois
elementos acima do título competiam. A variante `watermark` ficou sem
consumidor e saiu: o `EmptyStateCode` voltou a ter uma forma só, e o degrau
`page` deixou de precisar de `relative isolate`.

### Rodada 132 — a placa flutuante volta ao `--popover`, e as tintas moram juntas

O dono viu o calendário do `DatePicker` (em `/designsystem/field`) e
perguntou por que as superfícies de sobreposição não estavam mais
transparentes e com vidro. Medido ao vivo, o vidro estava ligado: o
`popover-content` computava `blur(24px) saturate(1.5)` e o calendário dentro
era transparente. O que tinha mudado era a **tinta**. A rodada 9f0ba8a trocou
a flutuante pela tinta da barra (`--background` 95/60) para a placa se
separar do cartão, e `--background` é mais escuro que o cartão: na tela a
placa virou uma chapa escura, sem vidro aparente.

Em AskUserQuestion, o dono escolheu **voltar ao de antes**: `bg-popover/85`,
com `supports-backdrop-filter:dark:bg-popover/60` e
`reduced-transparency:bg-popover`. A seta do `HoverCard` voltou aos mesmos
valores em `fill-*`. O custo foi aceito: sobre um cartão a placa se confunde
com ele (delta 0), e quem a separa é o anel e a sombra.

**E as tintas passaram a morar juntas.** `bar-classes.ts` e
`modal-classes.ts` foram apagados, e as três constantes (`barSurfaceClassName`,
`menuPanelTintClassName` e `modalSurfaceClassName`) ficam lado a lado em
`glass-classes.ts`, com os mesmos nomes. `menu-classes` reexporta a
flutuante para o `command.tsx`. A asserção 23 do `glass.test.ts` inverteu:
agora ela proíbe a flutuante de voltar a ser alias da barra e proíbe os dois
arquivos de voltarem.

### Rodada 133 — o Card ganha o brilho de marca, e o brilho vira primitiva

O dono pediu uma versão do `Card` com a borda que se ilumina, igual ao
`Alert variant="brand"`. O efeito estava preso ao alerta nas duas metades: a
`@utility alert-glow` e o `useAlertGlow` dentro do `alert.tsx`. As duas
viraram primitivas da família de marca, **sem mudança de comportamento**: a
`@utility brand-glow` (variáveis `--brand-glow-*`) e o `useBrandGlow`, em
`src/hooks/use-brand-glow.ts`, que leva junto o `composeRefs`.

Dois obstáculos medidos antes de escrever:
- **O `Card` tem `overflow-hidden`**, e o anel do alerta mora 2px **fora** da
  caixa (`inset: -2px`): ele seria recortado inteiro. A primeira saída pôs o
  anel **dentro** da borda. Na tela o brilho acendia (`--brand-glow-active`
  1, opacidade 0,5), mas quase não se via, porque o borrão de 2px sangra para
  fora e era cortado pela metade. A saída que ficou é trocar o recorte do
  cartão de marca por `overflow: clip` com `overflow-clip-margin`: o
  conteúdo continua recortado nos cantos e sobram 4px para o anel. Um
  detalhe medido: o Chrome rejeita `calc()` nessa propriedade.
  `calc(var(--spacing)*2)` computava `0px`, e `var(--spacing)` cru computa
  `4px`.
- **O hook exige cliente**, e o `card.tsx` não era `"use client"`. Nenhum
  server component usa `Card asChild`, então virar cliente não reabre o
  defeito do `Slot` com referência preguiçosa (o do 404 da rodada 131).

O `brand-contour.test.ts` ganhou o teste 11 (o `Card` veste o brilho com o
anel dentro), e o teste 10 passou a ler o hook no arquivo novo.

### Rodada 134 — a biblioteca de carrossel

O dono pediu uma biblioteca de carrossel a partir de onze referências. Os
pedidos foram:
- transição melhor e pontos redesenhados;
- temporizador e rotação automática;
- destaque no centro;
- setas no topo com título, e setas embaixo;
- de borda a borda;
- cartões colapsados que abrem;
- um cartão só com passos e setas dentro;
- hover, cartas de imagem e ações;
- a galeria curva, com `ogl` na referência;
- os passos nomeados com conteúdo.

As decisões dele, em AskUserQuestion:
- autoplay com hook próprio, sem plugin;
- a curva em CSS 3D e não em WebGL;
- a `CardMedia` como peça nova;
- tudo numa rodada.

**Um motor, e as versões são composição.** Nada virou componente paralelo:
- `Carousel` ganhou `effect`, `loop`, `autoplay`, `bleed` e `layout`;
- as setas ganharam `placement` e `appearance`;
- os pontos ganharam `pill`, `overlay` e `glass`, e o temporizador;
- o item ganhou `hover`;
- entraram `CarouselToolbar`, `CarouselCaption`, `CarouselPlayPause`,
  `CarouselSteps`/`Step` e `CarouselThumbs`/`Thumb`.

Passos e miniaturas nasceram em arquivos próprios, e o `taxonomy.test.ts`
cobrou página para cada um. Como nenhum dos dois se usa sem o `Carousel`,
eles foram para o `carousel.tsx`.

**Medido ao vivo:**
- **`spotlight`:** as distâncias saem 0, 1, 2, 2, 2 e 1. Com `loop`, o último
  slide mede a distância pelo lado esquerdo.
- **Autoplay:** avança sozinho. Com o cursor em cima, `data-autoplay`
  vira `paused`, o temporizador fica `animation-play-state: paused` e o
  índice não avança em 5,6s.
- **Acordeão:** as larguras vão de 395/105 a 105/395 no clique e nas
  setas.
- **Miniaturas:** sincronizam nos dois sentidos.
- **Passos em lista:** o marcador vai para `--steps-y: 138px`.

**Defeitos achados nas capturas:**
- a legenda da `CardMedia` usava `--card-px`, que vale 0 no cartão
  `padding="none"`, e passou a `--card-strip-px`;
- a dissolução apagava o próprio item nos carrosséis de um item por vez, que
  passaram a levar `fade={false}`;
- o arco da `curve` recortava a base dos itens, e o viewport ganhou `pb-12`;
- os rótulos colapsados do acordeão saíam cortados, e só o aberto mostra
  texto agora.

**No auditor:**
- a regra F passou a aceitar a `div` com `onClick` que já declara
  `tabIndex` e `onKeyDown`, o caso do item do acordeão, que ganhou foco e
  Enter;
- o catálogo passou a cobrar par de `--scrim`.

### Rodada 135 — o Chart ganha quatro formas e quatro melhorias

O dono trouxe 13 referências de gráfico e pediu que elas virassem versões do
`Chart`, adaptadas à marca. Todas entraram em `chart.tsx`, no precedente do
`Carousel`: uma entrada no registry e uma página só.

**Formas novas:**
- `ChartSplit`: a divisão de um total, com porcentagens pelo maior resto;
- `ChartRadial`: anéis de orçamento, com os cortes do `Progress`;
- `ChartHeatmap`: o calendário de gasto ou de entrada;
- `ChartRadar`: o perfil do mês contra a média, com a segunda série
  tracejada.

**Melhorias:**
- o tooltip veste `menuPanelSurfaceClassName`, e isso fecha a dívida da
  placa opaca com delta 0 contra o cartão;
- `ChartBars` ganhou `shape="pill"` e `track`;
- `ChartLine`/`ChartArea` ganharam `marker="last"`;
- `ChartSkeleton` ganhou `variant="wave"`.

**A marca não entra no dado.** O arco-íris sob série continua sendo a
invariante 3 violada sete vezes, e o conic já tinha sido recusado por ler como
pizza. A marca encosta no gráfico pelo `Card variant="brand"`, na borda.

**A intensidade do calendário é dinheiro**, por decisão do dono: cinco degraus
de `--chart-expense` ou `--chart-income` sobre `--muted`, cortados nos quartis
dos dias com valor.

**Medido:**
- **A mistura saía marrom.** Em `oklch`, `--muted` tem matiz 0 e os degraus
  do meio de `income` atravessavam o vermelho. Em `oklab` não há matiz a
  interpolar.
- **Degrau 4 contra `--card`:** 4,77 e 4,72 no claro, 6,21 e 7,12 no escuro.
- **Degraus vizinhos:** entre 1,35 e 1,62.
- **O halo do marcador:** fica centrado no ponto (`transform-box: fill-box`,
  origem 4px 4px). Sem isso, o `scale` do `ping` parte da origem do `<svg>`.
- **O tooltip:** `oklab(0.205 0 0 / 0.6)` com `blur(24px)` no escuro.
- **A 375px:** o ano rola e abre em hoje (`scrollLeft` 578 de 871), sem
  estouro horizontal da página.

**Duas coisas passaram a se mover dentro do gráfico**, e nenhuma é valor:
- o halo do ponto de hoje, que usa `animate-ping` pelo precedente do
  `BadgeDot pulse`;
- a onda do esqueleto, que é `@utility chart-wave`, depois de `no-scrollbar`.

O bloco global de movimento reduzido corta as duas.

**Consumidor migrado.** A composição da fatura
(`credit-card-invoice-analytics-panel.tsx`) trocou a rosca de duas fatias com
`oklch` cravado pela `ChartSplit` na rampa (`--chart-3`/`--chart-2`). A lista
embaixo perdeu o hover sincronizado com a rosca, que não existe mais.

**Fica para depois:**
- a ordem da legenda do Recharts, que sai alfabética e não na ordem das
  séries;
- as outras cinco telas com Recharts cru, que continuam no backlog da rodada
  30.

### Rodada 136 — todo gráfico chega e se ajusta

O dono pediu o leque completo de animação do `Chart`: entrada para todos os
gráficos e movimento quando um filtro troca o dado. Isso reverte a rodada 30,
cujo `CHART_ANIMATION = false` desligava as nove marcas.

**As duas razões da rodada 30 caíram na leitura do código instalado:**
- **"O Recharts não olha `prefers-reduced-motion`."** No 3.8, `isAnimationActive`
  é `'auto'` de fábrica, e o `JavascriptAnimate` faz
  `isActive = !Global.isSsr && !prefersReducedMotion`.
- **"A rosca só aparece quando a pessoa rola."** Não há observador de
  visibilidade nenhum no Recharts. O `Pie` espera 400ms de `animationBegin`,
  e cada re-render troca o `animationId` e reinicia do zero, gravando o quadro
  anterior já em t=0. Com `begin: 0`, medido: 0 setores no quadro da
  remontagem e 5, 5 e 2 aos 100ms, estáveis dali em diante.

**O mecanismo** são três fases por gráfico, e a de entrada é disparada pelo
`IntersectionObserver`, com uma remontagem única do `ResponsiveContainer`.

**Medido:**
- **Barra na entrada:** vai de 73 a 204px em ~500ms. A passagem para `idle`,
  que muda `duration` e `begin`, deixa a barra parada em 204,1.
- **Troca de filtro:** barra de 336 a 325, segmento de 233 a 277 e miolo de
  R$ 3.942 a R$ 2.957, monótonos e sem passar do alvo.
- **Rolagem:** a página inteira rolada termina com 0 caixas em `pending`, de 38.
- **Movimento reduzido:** o primeiro quadro já é o final.
- **Faísca:** não entra, e interpola na troca.
- **Legenda interativa:** a série religada cresce de 0 a 180px.

**Três defeitos achados na medição:**
1. **A entrada da divisão não se via.** Todos os segmentos subindo o
   `flex-grow` juntos a partir de 0 mantêm a proporção a cada quadro, e a
   barra saía pronta. Virou uma revelação da esquerda por `clip-path`.
2. **A impressão saía em branco.** O `print:data-[reveal=pending]:opacity-100`
   empata em especificidade com o `opacity-0` e perde pela ordem de emissão:
   as 46 caixas pendentes ficavam invisíveis. Todo esconder de `pending` passou
   a morar sob `not-print:`.
3. **A lint do React Compiler acusava leitura de ref.** O objeto da fase ia
   para um `ref` e tinha a fase lida no render. A caixa observada passou a
   receber `observe` e `fase` separados (`ChartRevealBox`).

**Fica para depois:** as cinco telas com Recharts cru não herdam nada disso
até migrarem para as formas. Três delas escrevem `isAnimationActive={false}` à
mão.

### Rodada 137 — a linha de lista acende como o link do catálogo

O dono pediu que o hover das listas de seleção não piscasse de uma linha para a
outra. Foram três versões, e só a terceira ficou.

1. **Um realce que viajava entre as linhas**, na mola da casa (`1fe277b`,
   `77a6a39`, `3110886`). Recusado e revertido (`65239b4`). O pedido passou a
   ser "igual à sidebar do catálogo".
2. **O disco do `button-fill` crescendo sob o ponteiro** (`6816d04`), porque o
   link do catálogo é um `Button tertiary`. Recusado: "o do sidebar não tem
   essa animação orgânica". **E ele tinha razão, medido:** no `DsNavLink` o
   `transition-colors` da tela derruba, pelo `tailwind-merge`, a lista de
   transição do `tertiary`. O `--button-fill` sai dela, e o disco **salta**
   para 100% no primeiro quadro. O que se vê é só a cor de fundo esmaecendo:
   transparente → `accent/60` em 300ms de `--ease-emphasized` (0,32 aos 50ms;
   0,53 aos 100ms; 0,6 aos 300ms). A segunda versão copiou o componente, e
   não o que a tela de fato mostrava.
3. **A que ficou:** `menuItemFadeClassName` =
   `transition-colors duration-(--duration-slow) ease-(--ease-emphasized)` nas
   linhas. O fundo continua o de sempre (`bg-accent`). Medido no
   `DropdownMenu`: 90% da cor aos 100ms e a cor cheia aos 300ms, a mesma curva
   do catálogo, que está a 88% aos 100ms.

**A lição:** para copiar o comportamento de uma tela, mede-se a tela, e não o
componente que ela veste. Uma contra-classe pode mudar o que o componente faz.

### Rodada 138 — o ícone do "tentar novamente" gira

O dono pediu que o ícone do "Tentar novamente" girasse. Ele escolheu a
meia-volta no hover e um prop no `Button`, e não uma utility que a tela
vestiria.

**O prop:** `iconMotion: none | spin`, um eixo novo do `cva`. Com `spin`, o
`svg` do botão transiciona `rotate` na mola e vai a 180° em `hover:` e em
`active:`. O `active:` é o par de toque, porque `hover:` compila dentro de
`(hover: hover)`.

**Medido:** 32° → 101° → 158° → 187° (passa 3,7%) → 180° aos ~500ms. O ícone
volta a `none` ao sair. Com movimento reduzido ele vai a 180° no primeiro
quadro.

**Onde entrou:**
- o "Tentar novamente" do `EmptyState` de erro e o do `Alert` no catálogo;
- o fallback de erro de rota (`route-error-fallback.tsx`), que ganhou o
  `ArrowPathIcon` que o catálogo já mostrava.

**Onde não entrou:**
- `global-error.tsx`, que é escrito sem o design system de propósito, porque
  roda quando o layout raiz caiu;
- o `AlertAction` do dashboard e o link do seletor de carteira, que não têm
  ícone.


### Rodada 139 — a paleta do catálogo abre por camadas

O dono pediu que o `⌘K` do catálogo abrisse mostrando só os grupos, cada um
com ícone, com as últimas pesquisas embaixo; que escolher um grupo pusesse a
busca "dentro" dele, com um sinal no campo como as skills do Claude; que sem
grupo a busca trouxesse páginas e histórico; e mais movimento, na língua do
app. Três decisões foram dele: recentes são **páginas abertas** (não termos),
os ícones entram também na sidebar, e **Esc sempre fecha**.

**O que entrou no `Command`:** o slot `leading` do `CommandInput`, a peça
`CommandScope` (o nome pintado como o destinatário de um e-mail depois de
digitado, no corpo do campo; foi `Badge` por uma rodada, em quatro variações
de canto, tamanho e recuo, e o dono pediu esta forma), a `@utility
command-reveal` na lista, e a casca abrindo em `--ease-spring` e fechando em
`--duration-fast`. O vazio sobe ao montar.

**Quem liga o movimento é a casca.** A utility lê `--command-reveal`, `0s`
por padrão; só o `CommandDialog` a declara em `--duration-spring`. É o mesmo
desenho de `--command-list-transition`, e é o que deixa o `Combobox` parado
(medido: `animation-duration: 0s` nos itens dele).

**Três medições:**
1. A subida: item 1 de 0 a 1 de opacidade em ~240ms, o quarto ~90ms atrás,
   assentando em ~500ms, nos dois temas.
2. **Movimento reduzido cortava a duração e não o atraso**: a quinta linha
   ficava invisível por 120ms. A utility ganhou o próprio bloco zerando
   `animation-delay`, como as do `Carousel`.
3. **Trocar de escopo não digita nada**, e o `useCommandIdleSelection` só
   volta ao ocioso em `input`: a linha "Organisms" seguia selecionada numa
   lista que já não a tinha. Um evento `input` sintético no campo, o mesmo
   truque do ×, devolve o ocioso — medido: zero linhas selecionadas depois
   do Enter.

**O escopo, na forma final:**
- **Tinta: uma parada do arco-íris por camada**, por decisão do dono — a
  marca como tinta de texto fora das peças de marca. Foundations teal, Atoms
  azul, Molecules violeta, Organisms magenta, Templates coral (`tint` em
  `category-meta.ts`), na ordem do degradê e pulando âmbar e lima. Passou por
  `info-muted`, `--info`, `--info` com croma ×1,35 e o violeta para todas.
  **No claro a luz é fixa em 0,47** e só matiz e croma vêm da parada: crua, a
  teal dava ~2:1, e a 0,5 teal e azul ficavam em 4,40 e 4,49. Medido em pixel
  contra o campo:

  | Camada | Claro | Escuro (parada crua) |
  | --- | --- | --- |
  | Foundations | 4,97 | 10,43 |
  | Atoms | 5,07 | 9,70 |
  | Molecules | 6,34 | 5,20 |
  | Organisms | 5,50 | 5,93 |
  | Templates | 6,18 | 6,93 |

- **Sem ×.** Com o campo vazio, o primeiro Backspace **arma** o escopo (o fundo
  acende a 20% da tinta) e o segundo o remove, voltando às camadas; qualquer
  tecla desarma. Uma região viva anuncia "Apague de novo para sair de …",
  porque o fundo não chega ao leitor de tela. O recuo do fundo existe também
  em repouso, compensado por margem negativa, para acender não empurrar o
  texto. Medido nos dois temas.

**A dedupe é carga estrutural:** uma página recente sai do grupo da camada
quando se digita, porque dois itens com o mesmo `value` acendem juntos no
cmdk. Com a mesma nota, o grupo Recentes fica na frente por ordem de DOM.

**Os recentes ficam abaixo das camadas, uma linha só** — seta (`ArrowUpRightIcon`) e nome, o desenho de "Go to …" que o dono trouxe; a primeira versão os punha em cima, com relógio e a camada em descrição, e ele pediu a troca.

**A busca continua só pelo nome** (decisão anterior); a descrição passou a
aparecer na linha. As camadas casam também pelo nome em português, por
`keywords` (nota 0,4): "átomo" acha Atoms.

**O hover não acendia nenhuma linha na paleta, e não era desta rodada.** O cmdk
seleciona a linha no `pointermove` do item; o `useCommandIdleSelection` recebia
o `onValueChange` com `navegou` em `false` e o tratava como auto-seleção,
devolvendo ao ocioso. O hook ganhou `onPointerMoveCapture` — em captura, para
rodar antes do handler do item — que marca o ponteiro como navegação. Medido:
a linha sob o ponteiro acende em `--accent`, digitar volta ao ocioso, a seta
entra na lista. **E sair com o mouse de cima da paleta apaga o realce** — só o
que o ponteiro acendeu (`onPointerLeave` no hook, guardado por `porPonteiro`);
uma seleção das setas fica, e parar sobre o rodapé ou o campo não apaga nada,
porque `pointerleave` só dispara ao sair do elemento inteiro. Medido.

**O campo cresceu a pedido do dono:** `CommandInput` ganhou `size` (`md` 32,
o padrão e o gatilho do cabeçalho; `lg` 36), e a faixa de
dissolução acompanha pelo `data-size` do wrapper — um `:has()` de dois
atributos, que pesa mais que o de um e vence sem depender da ordem. A paleta
do catálogo veste `lg`. Medido: campo de 36, faixa de 52 (foi 40 com texto de 16px por uma rodada; o dono pediu menor nos dois).

**A linha de camada é horizontal** (nome, contagem na ponta, seta), 36px como a
de recente: com duas linhas por camada a raiz passava da altura da paleta e
os recentes nasciam sob a dissolução. A série de ajustes na tela — recentes
abaixo das camadas com relógio e seta, sem ladrilho atrás do ícone, recuo
lateral de 8, 12px entre grupos e nas pontas — foi pedida linha a linha pelo
dono, e cada uma está medida.

**O gatilho do cabeçalho**, a partir de `lg`:
- **Brilha ao aproximar** — a primitiva `brand-glow` do `Card` e do `Alert`.
  Ela mora num invólucro, e não no botão: o `::before` fica em `z` negativo
  sob `isolate`, e no botão pintaria por cima do fundo dele. No invólucro o
  fundo translúcido do botão pinta por cima do núcleo. Para isso a utility
  ganhou `--brand-glow-core` (padrão `--card`), e o gatilho declara
  `--background`, a cor que a barra mostra atrás.
- **Não pinta o fundo nem acende o texto no hover**: o disco do `tertiary`
  fica sem cor e o texto fica no cinza do repouso, porque
  brilho e disco juntos eram demais, a pedido do dono. Abaixo de `lg`, sem
  brilho, o botão de ícone mantém o disco.
- **Diz "Busque componentes…"**, e troca por "Clique para buscar" no cursor e no foco
  de teclado **letra a letra** — medido: a onda cruza a frase em ~500ms, e a
  largura não muda. **E alinha à esquerda por declaração**: o
  `<button>` centraliza texto por padrão, e a frase curta ficava centrada na
  largura da longa, 40px à direita da lupa.

**O gatilho é uma pílula de 32px** (foi a 36 por uma rodada e voltou, a
pedido do dono), e o `ThemeToggle` ganhou nesse meio-tempo o degrau `lg`: `size` `md` 32 (o padrão) ou `lg` 36. A conta do
trilho é a mesma — 4 de recuo mais três paradas (28 ou 32), a viagem é uma
parada por índice, na classe e no `PASSO` da WAAPI — e o alvo de toque fica em
44 nos dois. Medido: trilho de 100 × 36, peça de 32, faces em 2 · 34 · 66, e
a peça para em 66 ao ir para o escuro. Na barra do catálogo o dono preferiu
o degrau menor, e ela voltou a `md`; o `lg` fica no componente.

**Ficou de fora:** `hover-card.tsx` usa `duration-` onde a casa usa
`animation-duration-*`, notado, não mexido.

### Rodada 140 — a legenda de teclado sai da paleta

Primeira mudança de uma etapa no `CommandDialog`. As dicas de teclado (↑↓
navegar, ⌫ voltar, ↵ abrir, esc fechar) moravam num `CommandFooter` dentro da
placa. O dono pediu que saíssem para baixo do diálogo, no padrão novo do iOS
da referência: cada uma na sua cápsula de vidro, soltas numa linha. Duas
decisões foram dele: **são legendas, não botões**, e a disposição é a de
sempre — navegar à esquerda, abrir e fechar à direita.

**A estrutura mudou, e o motivo é o vidro.** A placa era o próprio
`DialogContent`, com vidro e `overflow-hidden` no mesmo nó. Uma linha
embaixo dela ou seria recortada, ou moraria dentro de um elemento com
`backdrop-filter`, que é **raiz de fundo**: o borrão das cápsulas não
enxergaria a página. Hoje o `CommandDialog` monta o `Content` do Radix como
uma **coluna que não pinta** (`data-slot="command-dialog"`), com a placa
(`command-dialog-panel`) e o `dock` como irmãos. Posição, largura, camada e
animação são as de antes, e nenhum neutralizador foi escrito — a coluna
simplesmente não tem fundo, e o `glass.test.ts` 24 passa sem mudança. O
seletor que apaga o anel de foco do campo dentro do diálogo passou a ler
`command-dialog`.

**As peças:** `CommandDock` (a linha, `justify-between`, entrando 80ms depois
da placa na mesma mola, e `pointer-coarse:hidden`, porque no toque não há
teclado) e `CommandDockItem` (a cápsula, `rounded-full`, 32px, com o vidro
dos menus). O `CommandFooter` continua para a paleta solta numa página.

**Medido nos dois temas:** a linha fica 8px abaixo da placa e fora dela; as
cápsulas encostam nas bordas da placa, cada uma com `backdrop-filter`
próprio; o topo continua fixo ao filtrar, e a linha acompanha a base; dentro
de uma camada entra "⌫ voltar"; o foco segue preso na paleta, Esc fecha, e
com `pointer: coarse` a linha some. **Efeito colateral bom:** sem os 36px do
rodapé, a raiz inteira — camadas e recentes — cabe na placa sem rolar.

### Rodada 141 — o campo de busca vira uma pílula em cima da placa

A segunda mudança da etapa. O dono pediu o campo de busca separado da placa,
em cima dela, com as pontas 100% arredondadas como o gatilho do cabeçalho. A
paleta em diálogo virou uma pilha de três superfícies: pílula, placa, legenda.

**Não dava para embrulhar por fora.** O campo e a lista são peças do cmdk,
filhas da raiz `Command`, e quem as escreve é o consumidor. A placa também
**não podia** ir para a lista: ela é o elemento mascarado da dissolução, e o
elemento mascarado não desenha nada — a máscara recortaria fundo, anel e
sombra junto.

**A saída é um contexto** (`CommandDialogContext`), dado pelo `CommandDialog`:
- a raiz `Command` vira uma coluna que não pinta (`gap-2`, `overflow-visible`
  para o anel e a sombra da pílula não serem recortados);
- o `CommandInput` pinta a própria pílula (`rounded-full`, o vidro dos menus,
  anel e sombra), sem o recuo da faixa e sem anel de foco;
- o `CommandList` se embrulha na placa (`command-dialog-panel`) e zera a
  faixa do topo nela, porque não há mais nada por cima do conteúdo;
- fora do diálogo nada muda — medido no `Combobox`: canto de 10px, recuo de
  8px, sem placa própria.

**O teto da lista desconta a pílula e o respiro** (`--command-dialog-h` − 44),
para a pilha caber na altura de antes. Medido nos dois temas: pílula de 36px
alinhada às bordas da placa, 8px até a placa e 8px da placa até a legenda,
cada superfície com `backdrop-filter` próprio, topo fixo ao filtrar, e escopo,
Backspace duplo, hover e Esc funcionando. O `glass.test.ts` 24 passou a cobrar
a tinta nas duas faixas, e não mais na casca.

**As três superfícies ficaram sem sombra**, a pedido do dono: elas estão no
mesmo plano, e a sombra (`shadow-lg` na pílula e na placa, `shadow-md` nas
cápsulas) dizia que uma flutuava sobre a outra. Quem as separa da página é o
anel de 1px e o vidro. Depois, com o aval do dono, voltou **uma sombra só,
atrás das três** (`shadow-xl` num `::before` da coluna, em `z` negativo): o
conjunto se levanta da página e as peças continuam no mesmo plano. É
`box-shadow` e não `filter: drop-shadow`, porque um `filter` na coluna seria
raiz de fundo e apagaria o vidro das três.

**As três peças viraram um conjunto só no código**, com mais respiro: a
legenda passou a morar **dentro** da raiz `Command`, depois do campo e da
lista, e a raiz é a coluna das três, com `gap-3` (12px, eram 8). O `max-h`
saiu da raiz — com a legenda dentro ele encurtaria a lista —, e o teto da
lista continua descontando 44: com 48 a raiz aberta rolava 4px, medido; com
44 a pilha cresce 4px e cabe inteira.

**As teclas da legenda perderam a pastilha**, a pedido do dono: dentro de
uma cápsula, a pastilha do `Kbd` era uma caixa dentro de outra caixa. Quem
tira é o `CommandDockItem`, por seletor de descendente, e só ali — o `Kbd`
continua igual no resto do sistema.

### Rodada 142 — o feixe espera a primeira tecla

O dono pediu, para a pílula de busca da paleta, a animação do `BeamSearch` do
21st (Spectrum UI, sobre o preset `line` do `border-beam` de Jakub Antalík,
MIT): uma luz viajando pela borda de baixo do campo. A decisão de quando ela
corre foi dele: **só com o campo vazio**, enquanto espera a pessoa digitar.

**O precedente, dito antes.** O `border-beam` foi uma das cinco tentativas
recusadas no campo de formulário, e `field-control-ladder.test.ts` proíbe
marca nos oito controles de campo. O `command.tsx` não está entre eles, e o
pedido é explícito e desta peça. É uma exceção nomeada, não uma reabertura.

**Portado, não instalado.** O componente de referência pede `border-beam` e
`lucide-react`; o segundo é proibido pelo ESLint, e o primeiro injeta um
`<style>` por instância com paletas próprias. O preset `line` é CSS puro, lido
no fonte (`border-beam@1.4.1`), e virou `@utility command-beam` com cinco
`@property` e três `@keyframes`, com os números dele: `x` de 0,06 a 0,94 em
3,1s linear, a largura crescendo no meio, as pontas apagadas e a altura
respirando em 4s.

**Duas divergências, pelas lições da casa:** a cor é o arco-íris da marca na
horizontal e **parado**, e quem anda é a máscara (a referência anima
`hue-rotate`) — o feixe troca de cor enquanto viaja; e **uma máscara por
pseudo**, sem `mask-composite`: o traço é uma faixa de 1px na base, porque
onde o feixe acende a base da pílula é reta.

**O liga-desliga é `data-waiting`**, escrito pelo `CommandInput` a partir de
`useCommandState` do cmdk (vale com o campo controlado ou não). Sem ele a
animação **pausa no lugar**, e `--command-beam-on` esmaece em 300ms; tirar a
animação faria o feixe saltar para o começo enquanto apaga. Volumes por tema:
traço 0,9 e brilho 0,35 no escuro, 0,5 e 0,2 no claro.

**Medido nos dois temas:** vazio, `x` percorre de 0,25 a 0,92 em 2,4s e volta,
com o traço em 0,90 (escuro) e 0,50 (claro) no meio do trajeto e em 0 nas
pontas; ao digitar, `data-waiting` sai, a opacidade vai a 0 em ~200ms e a
animação pausa em `x` 0,40; ao apagar, volta a correr. Com escopo e o campo
vazio, corre. Com movimento reduzido o traço fica em 0. O `Combobox` não veste
nada disso.

**A troca do texto do gatilho ficou mais discreta** (ajuste da rodada 139): o
dono gostou do gesto letra a letra, mas achou que chamava atenção demais, e
escolheu a onda **por palavra**. São três ou quatro movimentos em vez de
dezoito: cada palavra desliza 4px (eram 10), sem desfoque, em
`--duration-slow` com `--ease-out` — sem mola, então não passa do alvo —, 40ms
depois da anterior. Medido: a primeira palavra chega em ~200ms, a última em
~300ms, e o deslize nunca passa de 4px.

**E depois ficou orgânica, com frases novas.** O deslize de 4px era discreto
mas mecânico, e o dono pediu algo mais orgânico. Hoje as frases **trocam de
foco no mesmo lugar**, como uma lente: a que sai desfoca (3px), cresce 2% e
some; a que entra vem do desfoque, de 98% e 1px abaixo, até ficar nítida. Cada
palavra começa 45ms depois da anterior, em `--duration-slow` com
`--ease-emphasized`. As frases também mudaram: em repouso, **"Buscar
componentes e tokens…"** (diz o que o catálogo tem, no infinitivo do campo da
paleta); no hover e no foco, **"Abrir a busca"** (um convite que vale para o
clique e para o Enter, ao contrário de "Clique para buscar"). Medido: a troca
cruza em ~250ms, a última palavra nítida em ~450ms, as duas frases cabem no
campo e a largura não muda.

### Rodada 143 — a pilha vira a linguagem do `Command`

O dono pediu uma revisão completa das outras versões do `Command` com o
desenho do diálogo como base, e decidiu duas coisas: a paleta solta numa
página vira a mesma pilha, e o `Combobox` também, inteiro.

**A pilha é a variante `panel`.** Ela era a placa inteira da régua com o
campo dentro; hoje é a coluna que não pinta, `gap-3`, `overflow-visible`, e
é ela que liga `--command-reveal`. A raiz provê o contexto (que era
`CommandDialogContext` e virou `CommandStackContext`) quando é `panel`, e
quem monta a pilha é o `CommandDialog`, o `ComboboxContent` e quem escrever
`<Command variant="panel">`. `plain` fica para quem hospeda o `Command` numa
superfície própria.

**O que a tela escrevia virou componente.** O `ds-search` escrevia à mão a
linha de 36 (`min-h-9`, três vezes), a caixa de 24 do ícone (três vezes), a
seta de ir, o lado direito, o recuo de 8 da placa e o respiro dos grupos num
`div` em volta. Hoje:
- a linha de 36, o `px-2` da placa e o respiro (16px entre grupos, 4 entre o
  rótulo e a primeira linha) são da pilha, lidos do contexto;
- o respiro de cima e de baixo mora **dentro** do conteúdo medido (um
  `command-list-body` com `py-1.5`), porque o cmdk mede o conteúdo e a
  altura da lista soma só os recuos que ela conhece — um `py` na lista a faria
  rolar 12px à toa;
- `CommandItemIcon`, `CommandItemMeta` e `CommandItemArrow` são peças novas;
- o campo nasce `lg` (36) na pilha e `md` (32) fora dela.

**A legenda virou filha.** O prop `dock` saiu: `<CommandDock>` é o último
filho da pilha, no diálogo e fora dele. `CommandFooter` e `CommandHint`
saíram, sem nenhum consumidor além de uma demo, e a regra do rodapé saiu da
raiz.

**O `Combobox` abre a pilha num popover que não pinta.** O `PopoverContent`
ganhou o eixo `surface` — `plate`, o padrão e a placa de sempre, e `none`,
sem placa, anel, sombra nem recorte. A placa saiu da base do `cva` e foi para
`plate`. A altura da lista continua sem transição fora do diálogo (num
popover ela faria o painel perseguir o gatilho), mas as linhas sobem ao
aparecer.

**Medido nos dois temas:** o diálogo com as mesmas medidas de antes (12px
entre as peças, linhas de 36, a raiz sem rolar, escopo funcionando); as
cinco demos de `panel` sem pintar a raiz, com placa, linhas de 36 e pílula e
legenda onde há; o `Combobox` com o popover transparente, a largura do
gatilho (224), a pílula a 12px da placa, o feixe aceso com o campo vazio, e
escolher um valor fechando; um popover comum com a placa de sempre.

**O feixe ficou só no diálogo**, a pedido do dono: na paleta solta e no
`Combobox` a pílula não acende. Quem liga é um segundo contexto,
`CommandBeamContext`, provido só pelo `CommandDialog`; a pilha continua a
mesma nas três.

**O `Combobox` voltou às medidas de dropdown**, a pedido do dono: a pilha
ganhou o eixo `density` — `palette` (o padrão: pílula de 36, linhas de 36,
respiro largo, 12px entre as peças) e `menu` (pílula de 32, linhas de 28, o
recuo de 4 e o respiro dos menus, 4px entre as peças — o afastamento do
popover até o gatilho; foi 8 por uma rodada). O contexto da pilha
passou a carregar a densidade, e só a `palette` aplica a linha de 36, o recuo
de 8 e o respiro dos grupos. Medido: a linha do `Combobox` tem 28 e nasce a
4px da placa, as mesmas medidas do `DropdownMenu`.

**E o `Combobox` ganhou a sombra do conjunto**, a pedido do dono, para se
destacar do fundo: a mesma receita do diálogo — um `::before` em `z` negativo
atrás das duas peças, `box-shadow` e nunca `filter` —, em `shadow-lg`: o
`shadow-md` dos menus quase não se via no tema claro com as peças soltas.

**A sombra do `Combobox` passou a acompanhar cada peça.** O retângulo único
atrás do conjunto deixava a aresta reta aparecendo onde a pílula arredonda —
"a sombra ficou para fora". Hoje são dois pseudo-elementos com a forma exata
de cada peça (a cápsula da pílula e a placa `rounded-xl`), os dois em `z`
negativo: pintam abaixo das duas, e a sombra de uma não cai sobre a outra.

**A pílula do `Combobox` ganhou o preenchimento de campo.** Flutuando sobre a
página, a tinta flutuante sozinha saía no mesmo tom dela — medido, 23 contra
23 no escuro e 255 contra 255 no claro: a pílula sumia. Na densidade `menu`
ela leva por cima do vidro uma camada de `--input-fill` a 50% (imagem, para
não trocar a cor da tinta), e passou a medir o mesmo tom do gatilho que a
abre: 40 no escuro e 238 no claro. O diálogo não muda — ali a pílula pousa
sobre o véu, e já se destaca.

**E voltou**, a pedido do dono: a pílula do `Combobox` veste de novo só a
tinta da placa, igual ao fundo do dropdown. Quem a separa da página é o anel
de 1px e a sombra com a forma dela.

**A paleta em diálogo ficou centrada de verdade.** O topo era calculado pela
altura da placa, de quando ela era a caixa inteira; com a pílula e a legenda
soltas a pilha cheia mede a placa mais 48, e ficava 24px abaixo do meio. Hoje
`--command-dialog-top` centraliza a pilha cheia (no toque, sem a legenda, a
sobra cai para 4), e o topo continua fixo quando a busca encolhe a lista.
Medido a 860 e a 700 de altura: 214 e 134px acima e abaixo com a raiz aberta,
e o topo parado ao buscar.


### Rodada 144 — o `Badge` de marca troca de família

O `Badge variant="brand"` era da família do **contorno**: a tecla preta do
`primary`, o degradê em 1px de `border-box` e um halo borrado atrás, sempre
aceso. O dono o quis **neutro**, com a borda acendendo só quando o ponteiro
chega perto — o brilho do `Alert` e do `Card`.

- Em repouso é um chip `muted` com a tinta do texto e o fio do sistema.
- O arco é o `@utility brand-glow` e o ponteiro é `useBrandGlow`, como nas
  outras duas peças do brilho. `--brand-glow-core` é `--muted`, a cor que está
  atrás do anel; com o padrão (`--card`) a região que a máscara apaga leria
  como outra superfície em volta do chip.
- A intensidade é cheia, `--brand-glow-opacity: 1` só no chip (o alerta e o
  cartão seguem em 0,5). Medido lado a lado a 3×: num chip de 22px o arco tem
  poucos pixels, e a meia força lia como sujeira na borda. O computado confere
  que a classe vence a declaração da utility (1, não 0,5).
- O `Badge` virou componente de cliente para chamar o hook. Antes de trocar,
  conferido: nenhum módulo de servidor consome as constantes `tagChip*` do
  arquivo (só componentes de cliente e um teste), então elas não viram
  referências de cliente em lugar nenhum.
- `useBrandGlow` ganhou um genérico (`<T extends HTMLElement>`, padrão
  `HTMLDivElement`) para servir um `<span>` sem cast.
- `brand-contour.test.ts`: o `Badge` saiu das asserções do contorno e entrou na
  10, a do brilho, que cobra o chip neutro, o núcleo em `--muted` e a ausência
  do halo.

### Rodada 145 — o `Button` de marca vira neutro, e a pílula entra na forma

**`variant="brand"` troca de família**, como o `Badge` na 144. Era a tecla
preta do `primary` com o degradê em 1px e um halo borrado sempre aceso; agora
é a superfície do `secondary` com o fio do sistema, e o arco-íris acende num
arco da borda conforme o ponteiro chega perto (`brand-glow` + `useBrandGlow`,
intensidade cheia como no `Badge`).

- **O fundo não muda no cursor, e isso é mecânico, não gosto.** Com `isolate`
  o anel pinta por cima do fundo do elemento, e o núcleo chapado dele cobre a
  fatia onde o arco está aceso. O disco do `button-fill` (ou qualquer troca de
  cor) sumiria justamente na fatia virada para o ponteiro. A resposta ao
  cursor é o próprio brilho; o clique afunda 1px pela base.
- Medido: em repouso `--brand-glow-active` 0 e o anel em opacidade 0; com o
  ponteiro 8px à direita, 1 e 1; com o ponteiro sobre o botão (30%, 50% e 80%
  da largura), 1. Só o centro exato cai na zona morta do hook (0,01).
- **`brandOutline` guarda o desenho antigo, sem o halo**: a tecla preta com o
  arco-íris sempre aceso, para quando a marca não pode depender do ponteiro.
  Ele não é mais "o brand onde o halo não cabe" — o brand não tem halo.
- `Button` passa a compor o `ref` de quem chama com o do hook
  (`composeRefs`), e o hook usa o genérico da 144 (`HTMLButtonElement`).

**`shape` é um eixo novo**: `rounded` (o padrão, o `rounded-lg` da base) e
`pill` (`rounded-full`). Na pílula o recuo lateral sobe meio degrau por
variantes compostas — `xs` 10, `sm` 12, `md` 14, `lg` 16, `xl` 18px —, porque
a curva come o canto e, com o recuo do retângulo, o rótulo fica espremido
contra ela; o `twMerge` deixa só o recuo da pílula. Nos `icon-*` vira círculo.
Medido: raio computado de metade da altura e recuo de 14px no `md`.

`button-primary.test.ts` (9 e 9b) e `brand-contour.test.ts` (o `Button brand`
saiu do contorno e entrou na asserção 10, do brilho) trancam as duas coisas.

### Rodada 146 — a lava do primário fica em três cores, e firme

O dono: o hover e o clique do `primary` viravam "uma mistura de cores ruim de
ver". Duas causas, as duas na `@utility primary-wash`: **oito cores** passando
ao mesmo tempo (teal, âmbar e lima ao lado de magenta) e uma opacidade que
**pulsava de 12% a 100%**, o que embaralhava as camadas o tempo todo.

- **Três cores, vizinhas:** violeta, magenta e coral. Três matizes vizinhos se
  fundem num degradê, não numa lama. `LAVA_STOPS` no `Button` e a varredura de
  contraste seguem a mesma lista.
- **Lado a lado, e não empilhadas:** uma à esquerda do ponteiro (−38%), uma
  sob ele, uma à direita (+38%). Na primeira tentativa as três cobriam o botão
  inteiro e, com a opacidade firme, só aparecia a de cima — magenta chapado.
  Postas lado a lado, as três leem juntas como faixas que acompanham o mouse.
- **Opacidade firme:** respira só entre 85% e 100%. A órbita fica mais lenta
  (12s em vez de 8s).
- **Croma recalibrado:** a 3× (claro) as três estouravam o sRGB e o recorte
  puxava tudo para o vermelho — o violeta sumia. Varrido: 0,36 / 3 dava 4,77;
  0,36 / 1,4 dava 8,80; o escolhido, **0,50 / 1,6**, dá **5,47**. No escuro
  0,87 / 2 saía pastel e lavado; **0,78 / 1,5** dá **5,96**. Piso 4,5, em 112
  células.

### Rodada 147 — o hover do primário vira o brilho do Shiny Button

O dono trouxe o Shiny Button (21st, `designali-in/shiny-button`) como
referência para a animação que mostra a cor do `primary`, **sem a borda que
gira**. A referência tem quatro camadas, e só uma veio:

| Camada | O que faz | Veio? |
|---|---|---|
| Borda `conic-gradient` com o ângulo animado | gira sempre; no hover alarga | não — a borda girando, recusada |
| `::before` de pontos com máscara cônica | gira preso ao mesmo ângulo | não |
| `::after` shimmer | sempre visível, girando | não |
| `span::before` com `inset` glow | 0 → 1 no hover, respirando | **sim** |

- **A lava saiu inteira**: o vidro, os blobos, a órbita, o seguir o ponteiro,
  `girarLava`/`LAVA_STOPS` e os tokens `--button-lava-l`/`-c` e
  `--button-glass-min`/`-max`. No lugar, `--button-glow-strength` por tema.
- **No próprio botão, nunca num pseudo**: o `ButtonGroup` esconde o `::before`
  do primário, e o rótulo só é `<span>` quando o filho é texto.
- **Portado ao pé da letra, alagava.** Com `inset 0 -1ex 2rem 4px`, num botão
  de 32–40px o brilho enchia a caixa inteira: na referência o pseudo é 1rem
  maior que o botão, então a sombra começa fora da borda e só a base aparece.
  Três geometrias foram comparadas lado a lado nos dois temas; a escolhida
  troca a folga por **espalhamento negativo** e divide as cores — magenta
  subindo da base (a sombra da referência), violeta pela esquerda, coral pela
  direita —, com o centro no preto (branco) do botão.
- **Respiração**: a escala 1 → 1,2 da referência vira o borrão crescendo 20%
  (`@property --button-breathe`, 4,5s), pausada em repouso.
- **Ritmo**: a referência acende em 800ms; sem token para isso, o
  `--button-wash` usa `--duration-spring` (500ms). A duração é uma lista casada
  com as propriedades, para o clique de 1px continuar em `--duration-fast`.
- **Contraste**: o script passou a medir dois botões (o `xl` largo e o `md`) em
  três fases da respiração — o `md` é o pior, porque o borrão é o mesmo em todo
  degrau. Força cheia nos dois temas: **7,25** no claro e **9,01** no escuro.
  A primeira geometria, a que alagava, dava 5,33 e 5,98.

### Rodada 148 — o primário fica cru

O dono pediu o `primary` sem nenhum dos efeitos das últimas rodadas: "cru, com
o hover padrão igual aos outros botões, sem cores, sem arco-íris".

- **O hover é o dos outros pesos**: o disco de `button-fill` nascendo sob o
  ponteiro, na cor de `--primary-hover`, em `--duration-slow` com
  `--ease-emphasized`. O `primary` voltou a `PESOS_COM_PONTEIRO`, porque o
  disco lê `--button-mx`/`--button-my`.
- **O fundo continua em `padding-box`** (a `bg-clip-padding` da base), e não em
  `border-box` como no `secondary`: é o vão de 1px da borda transparente que
  desenha a emenda do primário no `ButtonGroup`.
- **Saíram** `@utility primary-wash`, `@property --button-wash`,
  `@property --button-breathe`, `@keyframes button-breathe`,
  `--button-glow-strength` nos dois temas e `scripts/primary-wash-contrast.mjs`
  — sem cor por baixo do rótulo, não há o que medir: o texto fica sobre o
  preto (o branco) do botão ou sobre `--primary-hover`, que escurece nos dois
  temas na direção do contraste.
- `button-primary.test.ts`: os testes do brilho viraram os do disco, e o 5
  cobra que nem a lava nem o brilho voltem. `button-touch-response.test.ts`
  conta cinco pesos que preenchem.

### Rodada 149 — o primário vira o Button Colorful, e o disco sai dos outros pesos

O dono trouxe o **Button Colorful** da Kokonut UI (21st, `kokonutd/button-colorful`,
MIT) como referência do `primary`, e pediu o hover dos outros botões de volta ao
padrão, sem o "efeito orgânico".

**A referência**, lida do bundle do preview (`cdn.21st.dev/bundled/3.html`, o
código na página é travado): `bg-zinc-900 dark:bg-zinc-100 overflow-hidden`,
e uma camada `absolute inset-0 bg-gradient-to-r from-indigo-500 via-purple-500
to-pink-500 blur`, a `opacity-40` em repouso e `group-hover:opacity-80`, em
`transition-opacity duration-500`.

| Referência | Aqui | Por quê |
| --- | --- | --- |
| camada filha `<div>` | `::after` do botão | sem JSX novo; o `::before` o `ButtonGroup` esconde |
| `relative` no conteúdo | `isolate` no botão, camada em `-z-10` | acima do fundo, abaixo do rótulo |
| indigo-500, purple-500, pink-500 | `--brand-indigo`, `--brand-violet`, `--brand-magenta` | zero literal, luz por tema |
| `blur` (8px na v3) | `blur-sm` (8px na v4) | o mesmo borrão |
| `duration-500` | `--duration-spring` (500ms), `--ease-out` | o token da casa com esse tempo |
| `group-hover:` | `hover:`, `active:`, `aria-expanded:` | regra H, e o menu aberto |

**Contraste**, medido lendo os pixels atrás do rótulo com a camada a 80% (rótulo
escondido, linha do meio): claro **5,81** no pior ponto da caixa (6,22 no
miolo), escuro **7,62**. A própria referência reprovaria na ponta rosa (cerca
de 4,2), mas o rótulo fica no meio. Nenhum token de controle foi preciso.

**O disco sai.** `@utility button-fill`, `@property --button-fill`, o rastreio
do ponteiro no `Button` (`PESOS_COM_PONTEIRO`, `--button-mx/-my`) e o ritmo
próprio (`--duration-slow` com `--ease-emphasized`, em `RITMO_PROPRIO`). Os
pesos voltam a `hover:bg-*` com o par `active:` e o par `dark:hover:`, nos
valores de antes da rodada 99 — os alfas compostos (11%, 12,5%, 29%) voltam aos
diretos (20, 30, 50). `AlertAction` e os dois botões da `AnnouncementBar`
trocam `--button-fill-color` por `hover:bg-current/10` (15 no ×), e o gatilho
da busca do catálogo segura o hover no fundo de repouso com
`lg:hover:bg-input-fill/30`.

- `button-primary.test.ts` tranca a camada, as três paradas, o 40/80, o `::after`
  (nunca `::before`) e o `RITMO_PROPRIO` vazio; `button-touch-response.test.ts`
  volta a medir os pares `hover:`/`active:` e cobra que o disco não volte.
- A página de marca ganhou a nona família, "Degradê".

### Rodada 150 — o primário guarda a cor para o cursor

Perguntado se o botão da 149 condizia com o branding, a resposta foi que não, por
três razões, e o dono pediu as três correções:

1. **Cor de marca em toda tela.** A marca é preta e branca, e a única cor dela é
   o arco-íris, uma peça por tela. Com o degradê a 40% em repouso, todo primário
   era cor de marca, e disputava com `Button brand`, `Badge brand` e
   `Alert brand`. **Agora o repouso é a tecla chapada** (`after:opacity-0`), e a
   cor sobe no cursor, no toque e em `aria-expanded`.
2. **Três paradas roxas liam como template.** Indigo → violeta → magenta é só a
   fatia roxa do arco-íris. **Agora são cinco paradas**: teal, azul, violeta,
   magenta, coral.
3. **O repouso turvo.** A 40% sobre o preto o botão parado lia azul-marinho
   sujo, e o desabilitado virava uma mancha lilás. Com o repouso chapado, os
   dois voltam ao preto e ao cinza.

**O teal e o azul custaram contraste no claro.** A 0,80 da referência, o rótulo
branco do `salvar` media **4,26** sobre eles. Varredura sob a caixa do rótulo:
0,75 → 4,67, **0,70 → 5,09**, 0,65 → 5,60. A força virou token por tema,
`--button-colorful-opacity`: 0,70 no claro, 0,80 no escuro (7,70). O volume se
mexe no token, nunca nas paradas.

No `ButtonGroup`, só o segmento sob o cursor acende; em repouso o grupo é uma
peça preta só.

### Rodada 151 — as cores do primário florescem do centro

O dono pediu uma entrada orgânica para as cores do primário, que até aqui só
subiam a opacidade.

**O desenho**: o degradê nasce **comprimido e borrado no meio do botão** — 30% da
largura, 60% da altura, 16px de borrão — e se abre até as bordas ganhando foco
(8px) enquanto a cor sobe. Comprimidas, as cinco paradas aparecem juntas num
núcleo pequeno e se desdobram para os lados, que é o que lê como flor e não
como um fade. **Entra na mola da casa** (`--ease-spring`, 500ms — o leve
passar-e-assentar) e **sai sem ela**, recolhendo para o centro em
`--duration-slow` com `--ease-out`: uma mola até zero passaria de zero.

**Um número só anima tudo.** A pintura saiu das classes da variante para a
`@utility button-colorful`, e a camada lê `--button-colorful` (0 → 1), uma
`@property <number>` com **`inherits: true`** — quem a lê é o `::after`, e pseudo
não herda propriedade registrada como `false` (a medição do brilho da marca).
Escala, borrão e opacidade derivam dela, então andam na mesma curva e ninguém
chega antes. O `Button` só a liga em `hover:`, `active:` e `aria-expanded:`,
enumera a variável na `transition` e escolhe o ritmo de cada lado; o primário
entrou em `RITMO_PROPRIO` pela saída lenta.

Medido quadro a quadro (transição pausada e posicionada pelo Web Animations
API): a 120ms a variável está em 0,74 — escala 0,82 × 0,90, borrão 10px —, a
250ms a flor está quase aberta e a 500ms assenta. No pico da mola a opacidade
passa 3,8% do alvo (0,727 no claro), abaixo dos 0,75 que ainda deixam o rótulo
em 4,67; no repouso final continua 5,09.

O custo dito: no toque, o `translate` de 1px do clique anda no mesmo ritmo da
mola, porque a duração é da transição inteira. Em 1px não se nota.

### Rodada 152 — a flor do primário em todos os pesos

O dono pediu a animação do primário "em todas as outras variantes". Ela entrou
nos quatro pesos que mudam de fundo no hover — `secondary`, `tertiary`,
`outline`, `destructive` —, cada um na própria cor de hover. `brand`,
`brandOutline` e `link` mantêm o hover próprio: o `brand` não pode trocar de
fundo (o anel do brilho pinta por cima), o `brandOutline` já tem o arco-íris no
`::before`, e o `link` é o traço.

**A mesma flor, outra pintura.** No primário a camada é um `::after` borrado;
nos outros pesos **não pode ser pseudo-elemento**, e é medido no código: o
`::after` do `tertiary` já é o alvo de toque ampliado do `PageHeader`
(`pointer-coarse:after:-inset-2`), do `Breadcrumb`, do × da `AnnouncementBar` e
das setas do `Carousel` — com `pointer-events: none` e recorte, a flor
apagaria esses alvos —, e o `::before` é o divisor do `ButtonGroup`. A saída é
uma **elipse no próprio fundo** (`@utility button-bloom`): `radial-gradient`
`ellipse farthest-corner` a partir do centro — a 100% cobre a caixa de canto a
canto —, com a borda indo de 40% de rampa a nítida enquanto cresce e a cor
subindo de transparente. É o borrão do primário sem `filter`.

**Uma variável para os cinco.** `--button-colorful` virou `--button-bloom`, e as
duas utilities a leem; o `Button` liga-a pelo `FLORESCER` (cursor e toque, e
`aria-expanded` onde o peso realçava o menu aberto), com a mola ao entrar e
`--ease-out` ao sair. Os quatro pesos entraram em `RITMO_PROPRIO`. Medido quadro
a quadro nos dois temas: a 500ms canto e centro têm o mesmo pixel.

**Quem pintava o hover por fora foi migrado**, porque `hover:bg-*` numa chamada
pinta por baixo da elipse e some: `AlertAction` e os dois botões da
`AnnouncementBar` (`currentColor` a 10% e 15%), o `WorkspaceSwitcher` (accent a
80%, com `group-active:` ligando a flor), os chips de filtro ativos (success a
20%, onde o toque ia a 25%), a linha de resultado da página inicial do catálogo
(accent a 50%) e a busca do catálogo (flor transparente no campo largo). O
`active:bg-accent` do voltar do `PageHeader` saiu — o `tertiary` já responde ao
toque. **O link da lateral do catálogo não floresce**: ele é linha de lista, e
a rodada 137 recusou cor crescendo em linha; a flor fica sem cor e o
esmaecer dele continua. Duas chamadas perderam `transition-colors`, que trocava
a lista de transição e fazia a flor estalar.

### Rodada 153 — o `brandOutline` vira o Rainbow Button

O dono trouxe o **Rainbow Button** da Magic UI (21st, `dillionverma/rainbow-button`,
MIT) para o segundo botão de marca, o `brandOutline`: "o arco-íris ficando
embaixo e movimentando".

**A referência**, lida do bundle do preview (`cdn.21st.dev/bundled/1346.html`):
três camadas de fundo no próprio botão com `background-size: 200%` e
`background-clip: padding-box, border-box, border-box` — o miolo chapado, a
mesma cor cobrindo a borda até 50% e desbotando (60% a 80%, transparente no
fim), e o arco-íris —, borda transparente de 0,08rem; um `::before` de 60% ×
20% em `bottom: -20%` com o arco-íris e `blur(0.8rem)`; e `@keyframes rainbow`
levando `background-position` de 0% a 200% em 2s, linear, sem fim.

| Referência | Aqui | Por quê |
| --- | --- | --- |
| camadas no fundo do botão | `::before` com `inset: -1px` sobre a borda da base | a base declara `bg-clip-padding`, que disputaria com o recorte de três camadas por ordem de emissão |
| brilho no `::before` | brilho no `::after` | o `::before` ficou com a borda |
| `z-0` | `isolate` e `-z-10` nos dois | acima do fundo, abaixo do rótulo |
| vermelho, lima, azul, céu, roxo | `--brand-coral`, `-green`, `-blue`, `-teal`, `-violet` | as paradas da marca de matiz mais perto |
| a lista termina no roxo | a lista **fecha no coral** | a referência tem uma emenda roxo→vermelho passando pela borda a cada volta |
| `#121213` / `#fff` | `--brand-fill` = `--primary`, `--primary-hover` no cursor | a tecla da casa, que escurece no cursor |

**É a terceira peça da marca que se move sozinha**, depois da `brand-lava` e do
véu da `AnnouncementBar` — e a regra "o degradê não gira" (rodada 100) continua
de pé: o arco-íris **desliza**, não gira, e só nesta peça, por pedido do dono.
Movimento reduzido: o bloco global roda uma passada de 0,01ms, e o laço para no
quadro final, que com a lista fechada é igual ao inicial.

O `brandOutline` saiu da família do contorno — `brand-contour.test.ts` não o
lista mais, e `button-primary.test.ts` (9c) tranca a utility, as três camadas, o
brilho, o laço de 2s e a lista fechada. A página de marca ganhou a décima
família, "Deslize"; a do contorno ficou com os três controles de escolha, que só
acendem marcados.

### Rodada 154 — o Checkbox floresce ao marcar, e a marca dele desliza

O dono pediu "a mesma coisa com o checkbox", e escolheu as três leituras: revisar
a página, levar o florescer dos botões ao marcar, e trocar o contorno parado da
versão de marca pelo arco-íris deslizando do `brandOutline`.

**Marcar floresce.** O preenchimento marcado deixou de ser `bg-primary`: a caixa
veste `button-bloom` com `--button-bloom-fill: var(--primary)`, e
`data-[state=checked]` (e `indeterminate`) liga `--button-bloom`, na mola ao
marcar e em `--ease-out` ao desmarcar. A lista de `transition` enumera a
variável; o `transition-colors` da base a deixaria de fora. A borda vira
`--primary` no mesmo ritmo.

**O tique nascia escuro, medido quadro a quadro.** Ele era `text-current`, e a
cor da raiz faz transição do texto para `--primary-foreground`: no quadro 0 um
tique preto a 50% aparecia sobre a caixa ainda branca. Cravado em
`--primary-foreground`, ele tem a cor do fundo desmarcado e só aparece quando a
flor passa por baixo. Ele entra com `zoom-in-50` na mesma mola.

**A marca desliza.** O `::before` do `brand` pinta três camadas: a flor
(`--button-bloom-image`, que a `button-bloom` agora publica numa variável,
substituída no elemento a cada quadro), `--background` para o miolo ser opaco
enquanto a flor é pequena, e o arco-íris que desliza em `border-box` com 200% de
largura e `brand-rainbow-slide 2s`, pausado desmarcado. A lista saiu da
`brand-rainbow-button` para uma `@utility brand-rainbow-slide`, que o
`brandOutline` e o `Checkbox` vestem. **O anel é inteiro**, e não só a borda de
baixo com brilho embaixo: o brilho exigiria o `::after`, que é o alvo de 44px, e
numa caixa de 16px a metade de baixo de um anel de 1px são poucos pixels.

**A página** ganhou "Marcar floresce" (caixas para marcar), "Selecionar todas"
(o cabeçalho parcial da tabela de transações e das assinaturas, interativo),
medidas (caixa 16, tique 14, alvo 44) e "Onde o app usa", conferido no código:
seleção em massa de transações e assinaturas, filtros de transação e o
formulário de conta a pagar — todos na caixa do sistema; a de marca não tem
tela. O texto que citava o `brandOutline` como precedente do contorno foi
corrigido. `brand-contour.test.ts` cobra a camada deslizante e a flor no miolo, e
o 9c do `button-primary.test.ts` passou a ler a lista na utility nova — ele
passava por vazio depois da mudança, e a asserção de seis cores o impede.

### Rodada 155 — o Checkbox de marca veste o brilho

O deslize da 154 durou uma rodada: o dono pediu a versão de marca "com as bordas
que iluminam como todos os que mexemos nessa sessão" — a família do brilho, a
do `Alert`, do `Card`, do `Badge` e do `Button brand`. O `Checkbox brand` agora
é `brand-glow` com `useBrandGlow`, e a borda acende perto do ponteiro,
**marcada ou não** — a regra "só acende marcado" era do contorno, e o brilho,
como nas outras peças, é do ponteiro. No toque não há brilho.

**O núcleo não podia ser chapado.** Com `isolate`, o anel do `::before` pinta
por cima do fundo da caixa, e o núcleo chapado da utility cobriria o
preenchimento marcado na fatia acesa. A `brand-glow` ganhou uma camada
opcional, **`--brand-glow-overlay`**, em `padding-box` por cima do núcleo e
transparente por padrão — as outras quatro peças não mudam. O `Checkbox` põe
ali a flor do marcado (`--button-bloom-image`) sobre `--background`, e o que
está atrás do arco é idêntico à caixa, marcada ou não.

**E o núcleo acompanha o hover, medido na tela.** O ponteiro que acende o arco a
12px da borda já está dentro do alvo de 44px, então a caixa estava em
`hover:bg-muted/60` enquanto o núcleo seguia `--background`: a fatia acesa
abria uma janela branca no claro e preta no escuro. Com `hover:` e `active:`
trocando o núcleo para `muted` a 60% sobre o fundo, a janela sumiu no escuro e
virou resíduo no claro (a caixa compõe o `muted` sobre o cartão da prévia, e
não sobre `--background`).

O `::after` continua sendo o alvo de toque. A `brand-rainbow-slide` ficou só com
o `brandOutline`. `brand-contour.test.ts` tira o `Checkbox` da família do
contorno e o cobra no teste 10 com as outras quatro, junto da camada nova na
utility.

### Rodada 156 — o brilho de marca acende só na borda

O dono via, nas peças do brilho, "o feixe de luz surgindo do centro" com a borda
colorida e **preto no meio**, e pediu a animação só nas bordas.

**A causa.** A janela da `brand-glow` é um `conic-gradient` sem centro
declarado, ou seja, uma **cunha que sai do centro da caixa**. Dentro dela o
`::before` pintava, além do arco-íris, um **núcleo chapado** em `padding-box`
(`--brand-glow-core`, `--card` por padrão; mais o `--brand-glow-overlay` da
rodada 155), borrado em 2px. O núcleo existia para esconder o arco-íris do
meio e tinha de bater pixel a pixel com o fundo real de cada peça — e não
batia. No campo de busca do catálogo, no escuro, o núcleo era `oklch(0.145)` (o
preto da página) sobre um campo `input-fill/30`, mais claro: a cunha aparecia
como um feixe preto. Cada peça nova exigia adivinhar a cor de trás, e o
`Checkbox` já tinha precisado de dois remendos.

**Medido antes**, com Playwright, pixels do miolo (a caixa recuada 3px) que
mudam entre ponteiro longe e ponteiro perto, em três posições:

| Peça | Claro | Escuro |
| --- | --- | --- |
| busca do catálogo | — | 978 |
| `Button brand` | 404 | 446 |
| `Badge brand` | 297 | 323 |
| `Checkbox brand` marcado | 46 | 39 |
| `Card brand` | 1.536 | 1.663 |
| `Alert brand` | 4.567 | 4.748 |

**A mudança** é a da referência (`GlowingEffect`): **sem núcleo**, a máscara
recorta o anel. Três camadas de `mask-image`, compostas de baixo para cima — a
caixa inteira (`border-box`), menos a `padding-box` (`exclude`), intersectada
com a janela (`intersect`); no prefixado, `-webkit-mask-composite: source-in,
xor`. O `background` do pseudo ficou só com o `repeating-conic-gradient`.

**Por que compor deixou de ser proibido.** O banimento era por uma camada `none`
num `intersect` apagar a peça. A janela é a única camada com variável, e ela lê
`var(--brand-glow-start, 0)` — o fallback no próprio `var()`, além do valor
declarado na utility; as duas camadas do anel são literais.

**Medido depois**: **zero** pixel do miolo muda nas seis peças, nos dois temas.
A conta exclui os cantos arredondados, por onde o anel faz a curva e entra na
janela de 3px (sem excluir, sobravam 13 a 63 pixels, todos em canto). O
`Checkbox` desmarcado muda 351 pixels — e a caixa do sistema, sem brilho
nenhum, muda os mesmos 351: é o hover do alvo de 44px, não o brilho. Numa linha
no meio do `Button brand` a mudança fica só nos 2px do anel, com ou sem o
borrão — ele roda antes da máscara e não vaza para dentro.

**Saíram** `--brand-glow-core` (do `Button`, do `Badge`, do `Checkbox` e do
gatilho da busca), `--brand-glow-overlay` e o remendo de hover do núcleo do
`Checkbox`. O `Button brand` perdeu a razão **mecânica** para não ter hover de
fundo; ficou a decisão, sem a trava.

### Rodada 157 — as páginas do Code e do ColorTile revisadas contra o código

**Code.**
- **Contradição corrigida:** a página mostrava `⌘K` num `Code` enquanto o próprio "Quando usar" dizia que tecla de atalho é `Kbd`. O exemplo virou um caminho de arquivo.
- **Seções novas:**
  - "As duas aparências, medidas": `inline` 12px, `--foreground`, sem fundo; `chip` 11px, `--muted-foreground`, `bg-muted`, raio 6px, 6×2 de recuo. Conferido contra `codeVariants` e contra o `[&_code]:text-xs` da prosa em `ds-doc`.
  - "Code, Kbd ou texto": comando, atalho (`<Kbd keys="mod+k" />`) e rótulo, lado a lado.
- **Onde se usa, contado:** 56 chamadas em 14 arquivos, 52 nas páginas de documentação, **nenhuma no app**.

**ColorTile.**
- **Números conferidos com `scripts/tile-contrast.mjs`:** faixa de **10,64 a 11,73**; a página e o componente diziam 10,63 a 11,74, por arredondamento. Os neutros medem **11,28**, e a página dizia 11,2. O `AGENTS.md` foi alinhado.
- **Seção nova, "Da cor gravada ao ladrilho":** roda o `tileColorFor` de verdade sobre cinco valores — dois presets antigos, o cinza antigo que vira `null`, uma parada da marca e um hexadecimal digitado, que atravessa intacto.
- **Texto desatualizado corrigido:** a nota "Ausência de cor não é a marca" dizia que o arco-íris mora "no wordmark, no campo de acesso e nas variantes brand do Button e do Badge". Hoje são muitas mais peças, e a nota aponta para `/designsystem/brand`.
- **Página reorganizada:** as notas sobre o corpo do ícone passaram para depois de "Tamanhos", de quem elas falam. Os extremos usam `Code` em vez de `<code>` com classes à mão.
- **"Onde o app usa", conferido em cada consumidor:**
  - `md` na fatura, no onboarding e no detalhe de categoria;
  - `lg` nos cartões de categoria e na marca da carteira;
  - `2xl` nas três peças de conta a pagar.
- **Achado registrado, não corrigido:** a fatura escreve `sm:size-9` por cima do `md`, porque o degrau não é responsivo.

### Rodada 158 — a página do Container revisada contra o código

- **"Cinco larguras, cada uma com um consumidor. Não há degrau sem tela" era falso para o `full`**: nenhuma tela o usa, só a própria página. A descrição diz agora o que é verdade: as quatro com teto foram contadas nas telas, e `full` é a saída para quem já recebe a largura de fora.
- **A tabela "quem pediu" era a da época da contagem.** Ela virou "quem usa", conferida em cada chamada:
  - `sm`: as telas de erro e a coluna do `SplitShell`, que as telas de acesso vestem pelo `AuthShell`. Não só "as duas cascas de erro".
  - `md`: configurações, conta, membros, planos e o aceite de convite. Cinco, não "seis das nove cascas".
  - Os comentários de `containerSizes` foram alinhados.
- **A guarda cobria duas das três tabelas.** `page-chrome-ladder.test.ts` conferia `containerSizes` e `containerGutters` contra o `cva`, mas não `containerStacks`, que a página também itera para desenhar os exemplos. Agora confere as três.
- **Demonstração nova, "Dentro da casca do app":** uma moldura com `px-4` no papel da casca, e dentro dela as duas calhas. Medido: 696px sem calha e 648 com `gutter="page"`, 24px por lado acima de 768. No telefone são 16 por lado, e 343 viram 311. Antes o defeito só era descrito numa nota.
- **Ajustes de forma:**
  - `<code>` com classes à mão virou `Code`;
  - quatro prévias com `p-0` deixavam o conteúdo encostado na moldura;
  - a nota de implementação desceu para o fim.
- **Nota nova, "Onde o app usa".** Registra um achado não corrigido: o `route-error-fallback` escreve o ritmo à mão (`space-y-6`, 24px, fora da escala `--space-*`) em vez de `stack`. Migrar muda o respiro daquela tela, e fica para decisão.

### Rodada 159 — o DragHandle deixa de ser uma página

O dono pediu que a alça não tivesse página própria e ficasse incorporada onde é
usada. Ela continua um componente com nome, mas mora no `drawer.tsx`.

- **O que a regra permitia.** `taxonomy.test.ts` exige entrada **e** página para
  todo `.tsx` de `ui/`. Um `drag-handle.tsx` sem página reprovaria, e afrouxar a
  regra por uma peça seria a exceção que ela existe para impedir. A saída foi
  tirar o arquivo: `DragHandle` e `dragHandleClassName` mudaram, sem mudança de
  código, para o `drawer.tsx`. Saíram a entrada do registry, a camada em
  `LAYER` e a página, e o `docs-map` foi regenerado (87 páginas).
- **Não era um lugar só.** O `DrawerContent` e o `Sheet` no ramo gaveta vestem a
  alça, e os dois são gavetas do vaul. O `Sheet` passou a importar do
  `drawer.tsx`.
- **Sem import circular.** O `drawer.tsx` importava o `SHEET_OVERLAY_CLASS` do
  `sheet.tsx`, e com a alça os dois se importariam. O véu mudou junto para o
  `drawer.tsx`, e a dependência corre num sentido só: o `Sheet` importa a alça e
  o véu da gaveta. O `sheet.tsx` continua reexportando o véu. O
  `sheet.test.ts` usava a declaração dele como fim da fatia do `cva` e passou a
  usar `type SheetSurface`.
- **A documentação virou a seção "A alça" da página do `Drawer`.** Uma
  demonstração com as duas direções e a área de acerto desenhada — 44px no dedo,
  20 no mouse —, duas notas com as medições que a página tinha (o `!` contra a
  folha sem camada do vaul, a tinta a 75% sobre o vidro, o no-op do clique, o
  `aria-hidden`) e uma linha na tabela de props.
- **O teste da alça continua**, renomeado para `drawer-drag-handle.test.ts` e
  lendo do `drawer.tsx`. As seis asserções valem como antes.

### Rodada 160 — o componente `Glass` sai

O dono pediu o fim do componente de vidro. O `Glass` (`components/ui/glass.tsx`)
era conveniência sobre a receita, e **nenhuma tela o usava** — o único consumidor
era a própria página do catálogo. Saíram o arquivo, a página
(`/designsystem/glass`), a entrada e a camada no registry, e o `docs-map` foi
regenerado (86 páginas).

**O vidro continua.** A receita é a `@utility glass` com a régua de
`lib/glass-classes.ts`, e é ela que a `Sidebar`, o `Tabs`, a `TopBar`, o
`Carousel`, os menus e a paleta vestem — ninguém passava pelo componente.
`glass.test.ts` segue trancando a receita; só o comentário da asserção que citava
o `glass.tsx` mudou.

**Ficou sem consumidor o modo material** (o vidro borrado estilo iOS):
`GLASS_MATERIALS` em `lib/glass-classes.ts`, as `@utility glass-material*` e os
tokens `--glass-material-*`. O único caminho até ele era o eixo `material` do
componente. Ele não foi apagado nesta rodada, por ser decisão à parte; fica
registrado como código sem uso.

### Rodada 161 — a página do Input revisada contra o código

- **O último campo de dinheiro escrito à mão virou `money`.** A página afirma que
  todo valor em reais que o app recebe passa pelo modo, e o "Valor estimado" da
  conta a pagar (`bill-form-fields.tsx`) era um `FormInput` com
  `inputMode="decimal"` e `onChange` cru — sem máscara e sem renormalização no
  `onBlur`, as duas coisas que o modo existe para garantir. A troca é segura: a
  tela já lia o valor com `parseMoneyBrl` e o preenchia com
  `formatMoneyBrlInput`. Nenhum caminho mudou.
- **"53 chamadas do app importam `InputProps`"**, no comentário do componente, era
  falso — um arquivo cita o tipo. A frase saiu.
- **Duas demonstrações novas, as duas saindo das funções reais**:
  - "A máscara, tecla a tecla" (`formatMoneyBrlTyping`: `4290` → `42,90`,
    `123456` → `1.234,56`);
  - "Ao sair do campo" (`normalizeMoneyBrlOnBlur`: `250` → `250,00`, lido como
    reais; `1234.5` → `1.234,50`; `R$ 99` → `99,00`; `12,345` → `12,35`;
    `abc` → vazio). Conferidas por uma sonda antes de escritas.
- **Notas novas**:
  - "O contorno quase não existe, e é decisão": o fill identifica o campo, o
    fio e o fill ficam abaixo da 1.4.11 por decisão registrada, e o anel a 45%
    mede 3,05 e 4,12;
  - "Com ícone ou botão acoplado, é `InputGroup`";
  - "Onde o app usa", contado: `FormInput` 41 em 15 arquivos, `Input` cru 19 em
    13 e `money` em 16 campos de 10 arquivos.

### Rodada 162 — o campo focado fica mais suave

O dono pediu "a versão active mais suave" na página do Input — o campo focado.
Perguntado, escolheu duas alavancas: **anel mais fino** e **anel mais claro**. O
anel do campo (`fieldFocusRingClassName` e o par `fieldGroupFocusRingClassName`
do `InputGroup`, os oito controles de campo) foi de `ring-3` a 45% para `ring-2`
a 30% e, visto na tela, **voltou a 3px a pedido dele**: ficou `ring-3` a
**30%**. A borda de 1px continua indo para `--ring` cheio.

**O custo foi dito antes e medido depois**, contra as sete superfícies nos dois
temas:

| alfa | pior caso claro | pior caso escuro |
| --- | --- | --- |
| 45% (antes) | 3,05 | 4,10 |
| 35% | 2,30 | 3,05 |
| **30% (hoje)** | **1,99** | **2,53** |
| 25% | 1,75 | 2,10 |

É a terceira divergência consciente da 1.4.11, ao lado do contorno de campo e do
trilho claro do `Progress brand`, e a primeira num indicador de foco. A 2.4.7
continua atendida: o foco é visível pela borda e pelo anel. O caminho de volta
é `/45`.

Os outros anéis do sistema (`Button`, `Switch`, `Checkbox`, `Radio`, menus…)
continuam `ring-3` a 45%, porque o pedido foi o do campo. O `Radio` copiava o
anel do campo à mão; ele segue o dos controles de escolha, e o comentário foi
corrigido. `field-control-ladder.test.ts` tranca os valores novos.

### Rodada 163 — as páginas do InputOTP e do Kbd revisadas contra o código

**InputOTP.**
- **O estado de erro nunca aparecia, medido.** O `aria-invalid` cai no `<input>`
  do `OTPInput`, que é **irmão** dos grupos no contêiner. O
  `has-aria-invalid` do `InputOTPGroup` e o `aria-invalid:` do `InputOTPSlot`
  nunca casavam: marcando o campo inválido, a borda da casa ficava
  `oklch(0.9)` e o grupo sem anel. É o caso da recuperação de senha, onde o
  `FieldControl` escreve o `aria-invalid`. Agora o `InputOTP` lê o prop e o
  desce por contexto, como já descia o `size`; a casa carimba `data-invalid`
  e o grupo lê `has-data-invalid`. Medido depois: borda `destructive` e anel
  de 3px no grupo, nos dois temas.
- **A nota "Passe inputMode e autoComplete" era falsa.** A biblioteca já
  declara `inputMode="numeric"` e `autoComplete="one-time-code"` por padrão. O
  que ela **não** faz é restringir a dígitos: sem `pattern`, uma letra do
  teclado físico entra na casa. A recuperação de senha passou a
  `pattern={REGEXP_ONLY_DIGITS}`; medido, `a1b2` vira `12`.
- **O anel da casa ativa** era uma cópia do anel de campo antigo, a 45%, e
  acompanhou a rodada 162: `ring-3` a 30%.
- **Página**:
  - demonstração "Com erro" dentro de um `Field`;
  - notas novas sobre o erro por contexto e o anel;
  - "Onde o app usa": só a recuperação de senha;
  - tabela de props, que a página não tinha;
  - `Code` no lugar de `<code>` com classes à mão.

**Kbd.**
- **"A pastilha é `aria-hidden`" era falso para o componente**: quem o põe é a
  chamada do gatilho da busca. A nota foi reescrita. O componente não o põe de
  propósito: uma tecla citada numa frase de ajuda é conteúdo.
- **A legenda da paleta escrevia `<Kbd>esc</Kbd>`**, em minúscula, contra o `Esc`
  que o `formatKey` e a página usam. Virou `Esc`.
- **Página**:
  - demonstração nova "Ao lado de um controle", o padrão real: `Button` com
    `aria-keyshortcuts` e a pastilha `aria-hidden`;
  - nota com as medições da pastilha no claro (1,04 sumia, 8,3:1 no glifo);
  - "Onde se usa": só o catálogo;
  - `aria-hidden` na tabela de props.

### Rodada 164 — as páginas do Label e do MoneyDisplay revisadas contra o código

**Label.**
- **O motivo do rótulo ao lado da caixa estava velho.** A página dizia que sem
  ele "o checkbox sozinho é alvo pequeno demais"; a caixa tem alvo de 44px
  pelo `::after` desde antes. O rótulo é o nome e a área a mais.
- **O desabilitado não estava documentado.** O átomo apaga por
  `peer-disabled`, que só casa com irmão anterior que carrega `peer`: o
  `Checkbox` e o `Switch`. Medido: rótulo a 0,5 depois dos dois
  desabilitados, 1 depois de um habilitado. Um `Input` desabilitado ao lado
  de um `Label` solto não o apaga; a saída é `Field disabled`.
- **Página**: demonstração "Desabilitado", o `Switch` ao lado do `Checkbox`,
  notas sobre o `peer`, a entrelinha zero e onde o app usa, tabela de props.
- **O "Mês e ano" de `budget-month-selects.tsx` era um `<label>` sem
  controle ligado**, nomeando o par de `Select` (cada um com `aria-label`
  próprio). Virou `FieldSet size="sm"` com `FieldLegend variant="label"`. **A
  legenda renderizada não é item de flex**, então o `gap-2` do `FieldSet` não
  a alcança: medido, 0px entre ela e os seletores contra os 8 de antes. O
  `mb-2` na legenda devolve os 8. Vale para todo `FieldSet` com legenda.

**MoneyDisplay.**
- **A tabela de props descrevia o `compact` errado**: "1,2 mil em vez de
  1.234,50". A saída é `R$ 1,23 mil` (duas casas sempre). Faltavam
  `currency` e as casas decimais.
- **O compacto aparecia em duas seções**. A de sinal passou a mostrar o zero
  com `signed`, que não leva sinal.
- **A face é decidida pelo prop `size`, não pela classe.** 20 das 38 chamadas
  do app redimensionam por `className`, e os quatro valores de topo do painel
  (`text-xl md:text-2xl` sobre o `size` padrão) saem em Inter, contra a regra
  de que o herói da tela é Geist Mono. Corrigido com `size="2xl"` nas quatro
  chamadas, mantendo `text-xl md:text-2xl` na classe: o `tailwind-merge` tira
  o `text-2xl` do degrau e o telefone continua em `text-xl`, agora em Geist
  Mono. O `font-semibold` saiu da classe porque o degrau já o traz.
- **Página**: nota "Onde o app usa" com a contagem, a nota da face explicando
  o `size`, `Code` no lugar do `<code>` com classes à mão.

### Rodada 165 — o NativeSelect muda para a página do Select, e a página é revisada

**A fusão.** `NativeSelect`, `NativeSelectOption` e `NativeSelectOptGroup`
saíram de `native-select.tsx` para `select.tsx`, no precedente da `DragHandle`
no `drawer.tsx`: é o mesmo controle com outro motor (o `<select>` do sistema),
e nenhuma tela o usa — só os controles da página da `Sidebar`. Saíram o
arquivo, a página, a entrada do registro e a chave do `LAYER`; o catálogo tem
85 páginas e `ui/` tem 78 componentes. `field-control-ladder.test.ts` e
`brand-contour.test.ts` passaram a ler o `NativeSelect` dentro de `select.tsx`.
Medido lado a lado no `md`: altura, fundo, borda, raio, corpo e recuo
**iguais** aos do `SelectTrigger`.

**A regra das "dez opções" era contradita pelo app, com razão.** O fechamento
e o vencimento do cartão são `Select` de 31 opções, e o mês do orçamento é de
12. O Radix salta pela digitação: medido, "25" com a lista aberta leva ao 25.
O critério virou quem procura: número, mês e periodicidade são `Select`; nome
lembrado pela metade (categoria, carteira) é `Combobox`. A página do
`Combobox` e o `AGENTS.md` acompanharam. As páginas do `Calendar` e do
`DatePicker` mandavam usar `NativeSelect` de 1 a 31 para dia recorrente; o app
usa `Select`, e elas passaram a dizer isso.

**Página.**
- "Num campo", com `Field` e `FieldControl`, na periodicidade da assinatura.
- A escada inteira (`sm` a `xl`), que a página mostrava só em `sm`.
- A opção desabilitada falava de "plano pago", que o produto não tem; virou o
  "Cartão de crédito — cadastre um cartão" das formas de pagamento.
- A opção destrutiva era um menu de ações ("Renomear", "Arquivar") num
  `Select`, que é o trabalho do `DropdownMenu`; virou uma escolha com
  consequência ("As transações: apagar junto").
- As opções do `NativeSelect` vestem `Canvas`/`CanvasText`, e o
  `next-themes` escreve `color-scheme: dark` na página: medido no escuro,
  opção `rgb(18,18,18)` com texto branco.
- Nota de que o `className` do `NativeSelect` veste a casca, e tabela de props.

**Achados, não corrigidos:** doze `SelectItem` do app reescrevem a geometria
por `className` (`py-2 pl-2 pr-8`, e `py-2.5 pl-3 pr-9` no mês do orçamento);
o pagamento de conta pinta o gatilho com `bg-background shadow-xs` sobre a
superfície de campo e usa "— Escolha —" como opção com valor em vez de
`placeholder`.

### Rodada 166 — a lista longa do Select dissolve nas pontas

O dono pediu os fades no dropdown dos 31 dias. O `Select` estava fora da
dissolução "por mecanismo": em `item-aligned` o Radix escreve `scrollTop` à
mão e o item escolhido abriria dentro da zona. Com `popper` como padrão desde
antes, o mecanismo é o `scrollIntoView`, que respeita o `scroll-padding` que a
`scroll-fade-y` já declara (a zona inteira + 4px).

- O `SelectPrimitive.Viewport` veste `scrollFadeViewportClassName` e
  `useScrollFade()`; ele não pinta nada, então vale a invariante 2.
- `SelectScrollUpButton` e `SelectScrollDownButton` **saíram**, do render e
  das exportações: nenhuma chamada fora de `select.tsx`, e seriam o segundo
  sinal para a mesma borda.
- Medido nos 31 dias: fechado no 10, a zona de baixo liga (`--scroll-fade-end`
  252) e a de cima fica em 0; rolando 200px as duas abrem; reaberto no 25, o
  item fica a **48px** da base, fora dos 44 da zona.
- **Achado, não corrigido**: digitar no mesmo instante em que a lista abre
  lança `Cannot read properties of null (reading 'focus')` no
  `useTypeaheadSearch` do Radix — o item ainda não registrou a ref. Reproduzido
  igual **sem** o fade.

### Rodada 167 — o Progress ganha quatro versões, e a página para de se repetir

O dono pediu mais versões, com referências (checklist de primeiros passos,
fila de arquivos, armazenamento com zona, etapas segmentadas, anel de
conclusão, passos e linha do tempo, divisão de um total). Mapeadas antes de
escrever: **passos com nome e data já são a `Timeline`**, na vertical e na
horizontal; **a divisão Apples/Oranges é o `ChartSplit`**; checklist, fila e
roadmap são composições. Entraram quatro versões, escolhidas por ele:

- **Cabeçalho e rodapé** (`ProgressHeader`, `ProgressLabel`, `ProgressValue`,
  `ProgressFooter`). O rótulo se registra e a barra só aponta
  `aria-labelledby` quando ele existe; o `ProgressValue` escreve a
  porcentagem **bruta** (104%, não 100) e é `aria-hidden`, porque quem anuncia
  é a barra. As linhas entram pelas props `header` e `footer`, e a barra fica
  entre as duas **no DOM**, não por `order`, para o leitor de tela ler "75%"
  depois dela. A primeira versão separava os filhos por `c.type ===
  ProgressFooter`, e `table-ladder.test.ts` (26) a reprovou: o Fast Refresh
  troca a função a cada edição e a comparação deixa de bater calada. Sem as
  duas props, o `Progress` é o de sempre — nenhuma chamada do app mudou.
  Cinco barras do app escrevem essa linha à mão; não foram migradas.
- **`segments`**: a barra em N casas, cada uma acesa quando coberta inteira
  (`Math.floor`, com `1e-9` contra o erro de ponto flutuante). Medido: 7 de
  12 acende 7, 2 de 4 acende 2. Na marca cada casa mostra a sua fatia do
  arco-íris, pela conta aritmética do `HistogramSlider`. É o caso das
  parcelas pagas, que o app mostra hoje como barra contínua.
- **`zones`** (só com `bands`): as faixas de aviso e de perigo pintadas no
  trilho a 30% do tom, atrás do preenchimento (que ganhou `relative`), e o
  traço do corte sai. Medido no limite do cartão: aviso de 30% a 70%, perigo
  de 70% a 100%. No orçamento o perigo começa no próprio limite, e só a faixa
  de aviso aparece.
- **`ProgressRing`**: o anel de um valor só, no mesmo arquivo e na mesma
  página. Diâmetro 32 · 64 · 128 (o `sm` não escreve texto), `pathLength` 100
  para o traço valer a porcentagem, ponta redonda para o 1% ser um ponto, e o
  mesmo estouro (cheio, `destructive`, número real no `aria-valuetext`). **Sem
  marca**: um arco-íris dobrado troca de cor pela volta e não diz nada sobre o
  valor. Não é o `ChartRadial`, que é gráfico de várias categorias. O `<svg>`
  do anel entrou em `DRAWN_SVG_FILES` do auditor, ao lado do `Spinner`: a
  geometria do traço é o valor.

**Página.** Uma demonstração por ideia: as quatro barras de "Tons" e as duas
de "Dinheiro" viraram uma grade só, as quatro barras de marca viraram uma, e
"Tamanho" e "Começou" viraram uma seção. A tabela de props dizia "arco-íris
sobre leito preto", que foi recusado; corrigida. O "Limiar" misturava a rampa
do orçamento com um "Cartão" a 400%; hoje usa `BUDGET_BANDS` e o cartão está
em "Zonas". Duas composições das referências: a lista de passos num `Card` e a
fila de importações em linha. Medido nos dois temas: 25 barras, todas com
nome acessível, e nenhum erro no console.

### Rodada 168 — as telas vestem as peças do Progress

As cinco barras que escreviam à mão a linha de rótulo e porcentagem passaram a
`header` (e a participação da categoria, também `footer`), e as duas barras de
parcelas pagas passaram a `segments`:

- `credit-card-tile`, `credit-card-invoice-analytics-panel` (limite),
  `expense-category-card` (orçamento e participação) e
  `category-detail-summary-section`: `ProgressHeader` com `ProgressLabel` e
  `ProgressValue`. Onde o texto da esquerda é uma frase e não um nome (o
  `shareInsight` do cartão de categoria), ele fica num `span`.
- `credit-card-invoice-analytics-panel` (parcelas) e
  `dashboard-installments-ending-soon`: `value={pagas} max={total}
  segments={total}` no lugar da porcentagem calculada à mão; o `pctDone` do
  painel inicial saiu.

**Duas regras do componente nasceram da migração.**
- **O `aria-label` da chamada vence o `ProgressLabel`.** As cinco barras já
  traziam nomes mais ricos que o rótulo visível ("Uso do orçamento na
  categoria Mercado: 45% de R$ 800,00"), e o `aria-labelledby` os apagaria.
- **`segments` acima de 24 volta a ser barra contínua**, e o vão entre as
  casas é de 2px no `sm`. Um parcelamento de 48 vezes numa barra de 200px
  daria casas de 2px entre 47 frestas; a do painel inicial mede 96px.

**O que muda na tela, e é do sistema:** o rótulo passa a `font-medium
text-foreground` e o número a `text-muted-foreground` (era o contrário), o
corpo sobe de `text-2xs` para `text-xs` no `sm`, e o cartão de categoria passa
a barra de `md` para `sm`, como o detalhe e o cartão de crédito. O cartão de
crédito mostrava o uso **limitado a 100%**; o `ProgressValue` mostra o bruto,
então um limite estourado passa a dizer 120% e não 100%.
**Não verificado na tela**: as cinco telas pedem login, e a sessão não entra
na conta do dono.

### Rodada 169 — o Radio acende e floresce, e a marca dele vira brilho

A mesma rodada do `Checkbox` (153 a 156), no rádio.

**Marcar.** O anel passa de `--input` para `--primary-accent` e o ponto nasce
na mola da casa (`zoom-in-0`, `--duration-spring`, `--ease-spring`), a entrada
do tique do `Checkbox`. Medido: `animation-name: enter`, 0,5s, a curva
`linear()` da mola; o anel marcado mede `oklch(0.145)` no claro e
`oklch(0.985)` no escuro. O rádio ganhou o par de toque do `Checkbox`
(`hover:`/`active:` `bg-muted/60`, com o par `dark:hover:`, porque `dark:`
empata com `hover:` e vence). **Passar o ponteiro sobre o texto do rótulo
acende o anel**: o Chrome marca o controle rotulado como `:hover` quando o
`<label>` está em hover, e a linha inteira já é o alvo.

**A marca.** `Radio brand` e `RadioGroupItem brandCard` saíram do contorno
parado (1px de `border-box` sobre núcleo chapado, aceso só marcado) e vestem o
brilho: `brand-glow isolate` + `useBrandGlow`, no rádio com intensidade cheia
como a caixa. **Com isso a família do contorno acabou**: teve cinco peças, e
`brand-contour.test.ts` (1 e 2) impede a volta.
- Medido nos dois temas, ponteiro longe × perto em três posições fora do alvo
  de toque: **zero** pixel muda no miolo do anel (raio de 5,5px), e 187 a 442
  mudam no anel.
- **O `brandCard` soma o brilho ao realce do `card`**, que o contorno
  substituía: o brilho acende pelo ponteiro e não pelo estado, e a seleção
  precisa de sinal próprio. O arco vive na aresta e a lavagem no miolo, e não
  disputam, porque a máscara recorta só o anel.
- O fundo `dark:bg-input-fill/30` subiu para a base: a marca o dividia com a
  caixa do sistema só quando o contorno cobria o elemento inteiro.

**Páginas.** A do `Radio` ganhou "Marcar acende o anel e faz o ponto nascer",
a versão de marca no brilho, e "Onde o app usa" (quatro `FormRadioGroup` em
dois arquivos de transação; nenhum `Radio` à mão, nenhuma marca). A do
`RadioGroup` e a da marca trocaram o cartão "Grátis / Pro — R$ 29/mês", um
plano que o produto não tem, pelo "Esta parcela / Plano da compra" do
formulário de transação; e o "Pix" do cartão virou "PIX", como em
`lib/payment-methods`. A tabela de famílias da página de marca perdeu a linha
"Contorno".

### Rodada 170 — a página do Resizable revisada, e ele redimensiona colunas

**Colunas de tabela**, a pedido do dono: `useResizableColumns` e
`ResizableColumnHandle`, no `resizable.tsx`, e uma classe no `TableHead`.
- **O arraste é nosso.** Os painéis da lib são flex; numa tabela, quem manda
  na coluna é a célula da primeira linha sob `table-layout: fixed`. `pointer`
  com captura e `touch-action: none` (o dedo não rola a tabela), setas de 8px
  (32 com `Shift`), `Home`/`End` nos limites, `Enter` e duplo-clique voltam ao
  padrão, e o clique não chega ao botão de ordenar da mesma célula.
- **Uma coluna fica sem largura e é a folga.** Sem ela, a tabela a 100%
  repartiria a sobra entre todas e a costura escorregaria do cursor. Medido:
  arrastar 40px leva a coluna de 88 a 128px e a costura anda os mesmos 40.
- **Memória com `id`**, lida depois da hidratação (a lição do
  `useResizableLayout`). Medido: 112px guardados voltam após recarregar.
- **O `TableHead` só vira `relative` com a costura dentro**
  (`has-[>[data-slot=resizable-column-handle]]`), e **não trunca**: a
  primeira versão trazia `truncate`, e o `overflow: hidden` cortaria a metade
  da costura que passa da borda.
- **Alvo de 10px no mouse e 24 no dedo**, abaixo dos 44 da casa, e é teto
  consciente: numa coluna de 88px, 44 cobririam metade do rótulo.

**A página.** Os sete splits quase iguais de "Extrato / Detalhe" em cinza
viraram cinco demonstrações com conteúdo do app: o extrato ao lado do detalhe
(`DescriptionList`), já lembrando a proporção; as três costuras num grupo só,
de quatro painéis; os grupos aninhados, que cobrem a vertical; os limites em
`rem` (medido: `12rem` dá 192px); o colapso com as categorias; e as colunas.
A demonstração "No telefone ele empilha" saiu — no desktop ela era idêntica à
primeira — e virou nota. Entraram a tabela de props do `ResizablePanel`
(`minSize`, `maxSize`, `collapsible`, unidades), que faltava, e "Onde o app
usa": nenhuma tela; o único consumidor é a `Sidebar resizable` do catálogo.

### Rodada 171 — o ScrollFade vira variante do ScrollArea

O dono pediu os dois juntos, com o fade como variação. Eram dois átomos que
respondiam à mesma pergunta — como uma região rolável avisa que continua —, e
a página do `ScrollArea` mandava somá-los. Nenhum dos dois tinha tela: o
`ScrollArea` não tinha consumidor, e o `ScrollFade` tinha um, a grade do
`ChartHeatmap`.

- **`ScrollArea variant`**: `plain` (a barra, o padrão), `fade` (a máscara),
  `blur` (máscara + borrão) e `material` (o borrão no lugar da máscara), mais
  `orientation`, que decide a barra **e** o eixo do fade, e `sides`. A máscara
  mora no **viewport do Radix**, que é quem rola e não pinta nada (a invariante
  2); as camadas de borrão e a barra são irmãs dele na raiz, que já é
  `relative`, e o hook espelha as variáveis nela (`shell`). Medido nos dois
  temas: `fade` e `blur` com a rampa ligada e `--scroll-fade-end` em 324px,
  `material` sem máscara, seis camadas de borrão nos dois últimos.
- O `rounded-[inherit]` do viewport saiu: o elemento mascarado não desenha
  nada, e o `overflow-hidden` da raiz já recorta o canto.
- **Na vertical nada truncava, e a ponta direita sumia** — defeito do
  `ScrollArea` de antes, que ninguém via por falta de consumidor. O Radix
  embrulha o conteúdo num `<div style="display: table; min-width: 100%">`,
  que cresce até a largura natural; com o eixo X cortado, "R$ 1.284,60" saía
  "R$ 1.284,6". Na vertical o invólucro vira bloco (`[&>div]:block!`, com `!`
  porque o `display` do Radix é inline) e tem a largura do viewport (214 de
  214px, medido); na horizontal a tabela fica, porque é ela que deixa a
  fileira crescer.
- **O `ChartHeatmap` achava o rolável por `parentElement`**, e no Radix há um
  invólucro `display: table` entre o viewport e o conteúdo. Passou a
  `closest("[data-radix-scroll-area-viewport]")`. Medido a 390px: abre rolado
  até hoje, 563 de 563px.
- **O polegar era `bg-border`**, a cor do fio. Medido contra a página, 45% de
  `--muted-foreground` dava 1,94 no claro e 2,38 no escuro (a primeira versão
  desta rodada escreveu 45% "por ler como alça", sem medir); **70% é o
  primeiro degrau acima de 3:1 nos dois** (3,06 e 4,24), o mesmo da pega do
  `Resizable`. Ao pousar, tinta cheia. A barra ganhou `z-10` para ficar acima
  das camadas de borrão.
- Saíram `scroll-fade.tsx`, a página dele e a entrada do registro: 84
  páginas, 77 componentes. `scroll-fade.test.ts` lê o `scroll-area.tsx`.
- **Página**: as quatro variantes lado a lado sobre a mesma lista de
  categorias (eram sete demonstrações em duas páginas), a horizontal com
  `sides="end"`, o popover de carteiras, a tinta do material, e "Onde o app
  usa".

### Rodada 172 — os dropdowns ganham a seta de "tem mais"

O dono pediu, sobre a lista de carteiras num popover: quando houver rolagem,
uma seta indicando que há mais conteúdo. A dissolução dizia que a lista
continua; a seta diz **para onde**.

- **`useScrollFade({ arrows: true })`** marca o rolável com
  `data-scroll-more-start` e `-end` (1px de folga, a de `medir`) e escreve no
  pai `--scroll-fade-box-top`/`-bottom`, a posição do rolável dentro dele.
  Opt-in, como o `shell`.
- **`ScrollFadeArrows`** (`lib/scroll-fade-arrows.tsx`): dois chevrons do
  `16/solid`, irmãos logo depois do rolável, que acendem por
  `[data-scroll-more-end] ~ &` e pousam na borda da **lista** — a caixa mais
  as faixas por onde ela sangra (`--scroll-fade-band-h`, `-foot-h`). Sem
  isso, no `FormPickerPopover`, a seta de baixo cairia sobre "Cadastrar
  cartão"; medido, ela para acima do rodapé. Sem altura, sem clique
  (`pointer-events-none`), `aria-hidden`.
- **Onde**: `Select`, `DropdownMenu`, `ContextMenu` e `Menubar` (conteúdo e
  submenu), a pilha do `Command` (paleta e `Combobox`), o
  `FormPickerPopoverList`, o `PopoverBody` e o `ScrollArea` com a prop nova
  `arrows` (só na vertical e nas variantes de borda). A superfície dos menus e
  o `PopoverContent` ganharam `relative`, para as setas terem onde pousar.
- **Medido**: no popover de carteiras e nos 31 dias do `Select`, ao abrir só
  a seta de baixo; rolado ao meio, as duas; no fim, só a de cima. Os menus e
  o `Combobox` usam o mesmo mecanismo, mas nenhuma demonstração deles rola,
  nem numa janela de 380px — não foram vistos na tela.
- **A peça não mora em `ui/`**: o `Select` é átomo e já importa o seu único
  componente (`Caption`); um segundo reprovaria a asserção 2 do
  `taxonomy.test.ts`. Ela morou por um momento no próprio hook, com o arquivo
  renomeado para `.tsx`, e o servidor de desenvolvimento, já de pé, continuou
  procurando o `.ts` e derrubou as páginas: o hook voltou a `.ts`, e a peça
  foi para `lib/`, ao lado das classes da dissolução.
- **Não é a volta do `ScrollUpButton` do Radix** que a rodada 166 tirou: lá
  era uma faixa de 24px que ocupava a lista e rolava ao pousar.

### Rodada 173 — o Select ganha a ausência, a cor e a descrição, e as telas param de reescrevê-lo

O dono pediu a rodada completa no `Select`, e escolheu as quatro propostas.

**Opção "nenhum"** (`SelectItem variant="none"`). Oito seletores escreviam a
ausência à mão, em seis grafias: "— Sem categoria —", "— Não definido —",
"— Não especificado —", "Não informado", "Qualquer plano"/"Qualquer
assinatura" e a "Nenhuma" bandeira. Hoje ela sai esmaecida **na lista e no
gatilho** — o `SelectValue` copia o conteúdo do `ItemText`, então a tinta mora
num `span` dentro dele — e com o próprio `SelectSeparator`. As três formas de
pagamento passaram a dizer "Não informado". Medido: `oklch(0.708)` na lista e
no gatilho, separador logo depois.
- **A oitava não era ausência**: o "— Escolha —" do pagamento de conta era um
  `placeholder` disfarçado de opção — ali a categoria é obrigatória, e
  escolhê-lo reprovava com "Selecione uma categoria.". Virou o `placeholder`
  "Escolha uma categoria", com o valor vazio.

**Categoria com cor.** `ColorTile` ganhou `size="xs"` (24px, o nome da
escada) e entra antes do nome da categoria nos seletores da conta e do
pagamento de conta. Medido: o gatilho `md` continua com 32px, a opção sobe de
28 para 32.

**Opção com descrição** (`SelectItem description`): uma linha embaixo do
nome, fora do `ItemText`, então o gatilho mostra só o nome. Medido: a opção
tem 44px, e o gatilho diz "PIX". Nenhuma tela usa ainda.
- **O `ItemText` do Radix descarta `className` e `style`** — só atributos
  chegam ao `span`. Por isso a regra que o dispõe em linha (ícone, ladrilho e
  nome) era um seletor `*:[span]:last:` no item, que deixava de casar quando
  o texto ganhava um irmão; ela passou a achar o `ItemText` por
  `data-slot="select-item-text"`, em qualquer profundidade.

**Os desvios da rodada 165.** Doze opções escreviam `py-2 pl-2 pr-8` (ou
`py-2.5 pl-3 pr-9 text-sm` no mês) e perdiam o piso de 44px no toque; oito
listas repetiam `p-1`, que somava 4px ao respiro do viewport, e o `min-w` do
gatilho, que o viewport já declara. Saíram; ficaram o teto de altura e o que
é do conteúdo (`capitalize` nos meses, `nums` nos anos). O pagamento de conta
perdeu `bg-background shadow-xs` nos três gatilhos e o `data-slot` que
repetia o do componente. **Não verificado nas telas**, que pedem login.

**Página.** Doze seções viraram oito: "Tamanhos" e "Estados" juntos, "Grupos",
"ícone", "desabilitada" e "destrutiva" numa só, e o `NativeSelect` com e sem
`optgroup` lado a lado com o `Select`. Entraram "Categoria: a cor e a
ausência", "Opção com descrição" e a nota de quando a ausência é opção e
quando é `placeholder`.

### Rodada 174 — os dropdowns ganham um teto de altura

O dono pediu, sobre os 31 dias do `Select`, que abriam com mais de 1.000px:
o dropdown não pode ficar tão grande, mesmo com muito conteúdo.

- **`--menu-max-h`**, declarado na superfície flutuante
  (`menuPanelSurfaceClassName`) com `--spacing(72)` — 288px, umas nove linhas,
  o mesmo teto que a lista do `Command` já usava na paleta e no `Combobox`. O
  `Select`, o `DropdownMenu`, o `ContextMenu` e o `Menubar` o leem num
  `min()` com a altura disponível do Radix, então a janela baixa continua
  mandando quando é menor. A lista longa rola com a dissolução e a seta da
  rodada 172.
- **O `FormPickerPopoverContent` para em 384px**: ele soma a busca e o
  rodapé, e é o que deixa a lista nos mesmos ~288.
- **O `DropdownMenu variant="panel"` fica de fora**: é o cabeçalho de conta e
  blocos, que não rolam — ele devolve o teto à altura disponível com
  `[--menu-max-h:100dvh]`.
- **Medido**: os 31 dias abrem com 288px (eram ~1.030 numa janela alta), com
  as duas setas acesas porque o dia escolhido abre no meio; o seletor de
  cartão, 384; os menus do catálogo continuam abaixo do teto; o painel lê
  522px de `max-height`, a altura disponível.
- `anchored-surface.test.ts` (3) passou a aceitar o teto dentro do `min()`,
  como já aceitava para a largura.

### Rodada 175 — o Separator ganha desenho, borda e rótulo, e as telas param de desenhá-lo

O dono pediu a rodada completa no `Separator` e escolheu as quatro versões.

- **`variant`**: `solid` (o padrão), `dashed` (a linha de extrato antes de
  um total) e `fade` (some nas pontas; com rótulo, cada metade some na ponta
  de fora). **O peso passou a morar numa variável** (`--separator-color`),
  porque os três desenhos o leem de jeitos diferentes — fundo, borda e o meio
  de um degradê — e assim `tone` e `variant` se combinam sem classe a mais.
- **`bleed`**: atravessa o recuo da superfície lendo o que ela publica,
  `--card-px` antes de `--dialog-px` (um cartão dentro de um diálogo tem o
  recuo dele), ou `--separator-bleed`. Medido num `Card`: a régua vai de 322
  a 704 num cartão de 321 a 705 (1px de borda). Os cinco separadores dos
  filtros de transação usavam `-mx-4 w-[calc(100%+2rem)] sm:-mx-5
  sm:w-[calc(100%+2.5rem)]`, e **erravam no desktop**: a folha recua 16px em
  toda largura, e o `sm:-mx-5` sangrava 4px a mais, cortados pelo
  `overflow-hidden`. Hoje é `bleed`.
- **`children`, o rótulo do meio**: duas meias-réguas e o texto, sem
  retângulo mascarando uma linha inteira. O `FieldSeparator` passou a
  compor esta peça em vez de desenhar a própria; medido, 20px de altura e o
  "ou" entre duas metades, como antes.
- **As telas**: o painel da fatura e o esqueleto dele desenhavam a régua com
  `<div role="separator" className="border-t">` (o esqueleto ainda com
  `aria-hidden` junto, papel e silêncio ao mesmo tempo); viraram `Separator`.
  O menu da conta no telefone pesava as três réguas com `bg-border/60` pela
  constante `MOBILE_GLASS_MENU_SEPARATOR_CLASSNAME`; viraram `tone="soft"`
  (a constante continua servindo os `DropdownMenuSeparator` do app). O menu de
  workspaces repetia o `decorative`, que é o padrão.
  `separator.test.ts` tranca as três coisas. **Não verificado nas telas**,
  que pedem login.
- **O comentário do componente estava velho**: dizia que o `soft` servia o
  `Dialog` e o `AlertDialog`, que perderam os fios na dissolução.
- **Página**: horizontal e vertical juntas, peso e desenho num quadro só, e
  uma seção por versão nova com conteúdo do app — a soma da fatura, os dias
  de uma lista, os filtros num cartão.

### Rodada 176 — o Skeleton ganha as formas das peças, o brilho, o texto e o atraso

O dono pediu a rodada completa e escolheu as quatro versões. O `Skeleton` era
um `div` de 13 linhas, e o app escrevia **403 ossos à mão em 32 arquivos**.

- **`shape` e `size`**: `block`, `text`, `circle` (Avatar: 24 a 56), `tile`
  (ColorTile: 24 a 44) e `pill` (Badge). As formas mais repetidas eram peças
  com outro nome — `size-8 shrink-0 rounded-md` 18 vezes é o `ColorTile md`
  — e viraram `shape`: **23 ladrilhos e 6 pílulas**. A pílula tinha 20px; o
  `Badge md` mede **22** na tela (xs 14, sm 18), e o osso passou a ter a
  medida dele. Medido: as treze formas batem com as peças.
- **`text` tem a entrelinha em volta**: a caixa ocupa `1lh` do corpo em que
  está e o osso pinta 0,8em no meio, por margem e não por `background-clip`,
  que deixaria os cantos do pintado retos. A geometria mora em `@utility
  skeleton-text`: escrita como `h-[0.8em]` ela era valor arbitrário para o
  auditor, e não há degrau da escala que meça em `em`.
  `SkeletonText lines` empilha as linhas, a última com 60%. Medido: 20px por
  linha em `text-sm`, a entrelinha do texto real.
- **`animation="shimmer"`**: `@utility skeleton-shimmer`, um degradê do tamanho
  da janela com `background-attachment: fixed`, então **uma faixa só** passa
  por todos os ossos, em vez de cada um ter a sua fora de fase. O token novo
  `--skeleton-highlight` (branco a 60% no claro, 7% no escuro) tem par nos dois
  temas. **Movimento reduzido**: o bloco global isenta `animate-pulse`, e o
  osso de brilho carrega essa classe sempre, trocando para a faixa só sob
  `motion-safe:` — quem pede menos movimento vê o pulso.
- **`SkeletonGroup`**: o contêiner que espera, com `role="status"`,
  `aria-busy` e o `label` lido; os ossos passaram a ser `aria-hidden`. O
  `delay` o esconde nos primeiros 300ms por `@starting-style` (medido:
  opacidade 0 a 30 e a 200ms, 1 a 450ms), sem timer — um dado que chega antes
  nunca mostra esqueleto. **Os onze esqueletos de página** vestem
  `SkeletonGroup delay`: nove escreviam o papel à mão, cada um de um jeito
  (`aria-live`, `aria-label`, `sr-only`, um `h2` escondido), e dois — o
  detalhe da categoria e os membros — não anunciavam nada.
- **Não verificado nas telas**, que pedem login.
- **Página**: as formas numa régua só, o `SkeletonText` ao lado do texto
  real, a linha de transação montada com as formas, o pulso ao lado do brilho,
  e a demonstração do atraso com "recarregar".
- **O brilho ficou mais lento, a pedido do dono**: de 1,8s para 3s. A faixa
  atravessa duas larguras de janela, e em 1,8s corria ~1.400px/s numa tela
  de 1280; em 3s, ~850px/s.
- **E o brilho saiu, a pedido do dono**, na mesma rodada: "por que temos dois
  padrões?". Nenhuma tela usava o `shimmer` — os onze esqueletos de página
  pulsavam —, e a prop `animation` deixaria cada tela escolher o seu, com
  esqueletos vizinhos se mexendo diferente. Saíram a prop do `Skeleton` e do
  `SkeletonGroup` (e o contexto que a descia), a `@utility
  skeleton-shimmer`, o `@keyframes` e o token `--skeleton-highlight`. Todo
  osso pulsa; a `wave` do `ChartSkeleton` fica, porque ali o osso tem a forma
  das barras.
- **E a remoção levou junto a linha de texto**: a `@utility skeleton-text`
  morava entre o comentário do brilho e a utility dele, e o corte apagou o
  trecho inteiro. A classe continuou nos elementos, a regra deixou de existir,
  e todo `shape="text"` ficou com altura zero — o dono viu os buracos nas
  demonstrações. Voltou, depois do `chart-wave`, e `skeleton.test.ts` agora
  reprova se ela sumir. Nenhuma tela do app usava `shape="text"`, então o
  defeito ficou no catálogo.

### Rodada 177 — o Slider ganha cabeçalho, marcas, balão e zonas

O dono pediu a rodada completa e escolheu as quatro versões. Nenhuma tela usa
o `Slider` direto; o único consumidor é o `HistogramSlider`.

- **`label` e o valor**: o cabeçalho do `Progress` — o nome à esquerda, que
  nomeia os punhos por `aria-labelledby`, e o valor atual à direita, que
  acompanha o arraste (a peça passou a guardar o valor, controlada ou não). A
  página dizia "o valor precisa aparecer em algum lugar" e não dava como.
  **`format`** escreve o número no cabeçalho, no balão e no `aria-valuetext`
  de cada punho. Medido: uma seta leva o cabeçalho e o punho a "85%".
- **`marks`**: traços no trilho, com rótulo embaixo. **Caem sob o centro do
  punho**, que anda de 7px a `largura − 7px` (a conta do Radix,
  `getThumbInBoundsOffset`, a mesma do `HistogramSlider`) —
  `calc(7px + (100% − 14px) × p)`. Medido: centro do punho e da marca em 513
  no meio e em 698 no fim. As que a faixa cobre acendem.
- **`bubble`**: o valor num balão sobre o punho no `:active` (vale no dedo) e
  no foco **de teclado** — não no foco que o Radix dá ao punho num clique, que
  o deixaria aceso depois de soltar.
- **`bands`**: os cortes do `Progress` (`progressToneForBands`), com as zonas
  a 30% no trilho e a faixa na cor do valor. Medido com `CARD_LIMIT_BANDS`:
  âmbar em 60 e 40, verde em 20. O `Slider` passou a importar o `Progress` —
  átomo importando um átomo, o que a taxonomia aceita.
- **O `HistogramSlider` passa `format={currencyBRL}`**, e os punhos dele são
  anunciados em reais: a lacuna "o Radix anuncia o número cru" fechou.
- **Página**: os cinco sliders de marca viraram dois, as quatro notas longas
  da marca viraram duas, e entrou a tabela de props, que ela não tinha.

### Rodada 178 — o Spinner vira roda desenhada, com escada, bloco de espera e marca

O dono pediu a rodada completa e escolheu as quatro versões.

- **A roda desenhada**: até aqui o spinner era o `ArrowPathIcon` girando — e no
  app essa seta **é o "tentar novamente"** (a tela de erro, o
  `Button iconMotion="spin"`). Um botão salvando e um de atualizar desenhavam o
  mesmo glifo. Agora é um arco de 25% (`pathLength` 100, `strokeDasharray
  "25 100"`) sobre um trilho a 20% de `currentColor`, traço de 3 em 24 — a
  exceção `DRAWN_SVG_FILES` do auditor, que sempre nomeou o spinner.
- **`size`**: a escada do ícone, `sm` 14 · **`md` 16** · `lg` 20 · `xl` 24 ·
  `2xl` 32 — os corpos que o app escrevia à mão (`size-3.5`, `size-6`,
  `size-8`).
- **`SpinnerBlock`**: a roda com o texto, centrada numa região, e é ele quem
  anuncia (`role="status"`, `aria-live`). O atraso é o do `SkeletonGroup`,
  `@starting-style` com `transitionDelay` (300ms por padrão): medido, opacidade
  0 em 100 e 250ms, 1 em 500ms.
- **`variant="brand"`**: um anel em `conic-gradient` com cinco paradas da marca
  e cauda transparente, recortado por máscara radial (`@utility
  spinner-brand`). Mora na tela de abertura, que trocou o `useState` +
  `setTimeout` + opacidade por um `SpinnerBlock` de marca com `delay={600}`.
- **O `label` passa a valer**: sem ele a roda é `aria-hidden`; com ele,
  `role="status"` com nome. Antes a peça declarava `role` e o `<svg>` do ícone
  carregava `aria-hidden`, e o papel nunca chegou a ninguém.
- **Telas**: dez rodas dentro de botões tinham `mr-2` ou `mr-1.5`, somando
  margem ao `gap` do `Button` — saíram. `size-3.5` virou `size="sm"`, e os
  `aria-hidden` repetidos saíram.
- **Correção de página**: ela dizia que o spinner parava com movimento
  reduzido. O bloco global **isenta** `animate-spin`; ele gira.

### Rodada 179 — o Switch ganha escada, salvando, ícones no polegar e marca

O dono pediu a rodada completa e escolheu as quatro versões.

- **`size`**: `sm` 14×24 · **`md` 18×32** · `lg` 24×44. `size="default"` saiu
  do tipo, como saiu de `Button`, `Input` e `Select`. O polegar é a altura
  menos a borda, e a viagem `largura − altura` é o mesmo `calc(100% − 2px)`
  nos três degraus: uma classe serve a escada. Medido: polegar de 12, 16 e 22,
  1px da borda nos três.
- **O alvo era 34px de altura** (`after:-inset-y-2`), 30 no `sm` — abaixo dos
  44 do `Checkbox` e do `Radio`. Agora é centrado com 44 nos três degraus:
  46 · 54 · 66 × 44, medidos. A página de toque dizia 56 × 34; os dois números
  estavam errados (a largura era 54 já antes, porque `-inset-x-3` conta da
  borda de dentro).
- **`pending`**: o `Spinner` dentro do polegar, `disabled` do Radix sem a
  opacidade (`data-disabled:not-aria-busy:opacity-50`) e `aria-busy`. Medido:
  opacidade 1, `aria-busy="true"`, roda presente; ao fim, volta ao normal. A
  folha da assinatura trocava o texto "Ativa"/"Pausada" por uma roda ao lado
  enquanto salvava — o estado sumia justo quando mudava. Agora o texto fica.
- **`icons`**: tique no ligado, × no desligado, micro (`16/solid`), com a tinta
  medida contra o polegar nos dois temas (`text-foreground` serve os dois
  ligados, porque o polegar ligado é `--background` no claro e
  `--primary-foreground` no escuro).
- **`variant="brand"`**: o brilho (`brand-glow` + `useBrandGlow`) com
  intensidade cheia, a do `Checkbox`. O `::after` continua sendo o alvo; o
  brilho mora no `::before`.
- **O polegar anda na mola** (`--ease-spring`), e o trilho troca de cor em
  `--duration-slow`; antes era `transition-all` com a duração padrão.
- **Página**: a nota que dizia que `--input` voltou à 1.4.11 estava errada (ele
  voltou para fora, por decisão do dono); a linha de configuração passou a ser
  o `Field` horizontal que o app usa, e entrou a tabela de props.

### Rodada 180 — o Textarea mede em linhas, conta caracteres e cresce em todo navegador

O dono pediu a rodada completa e escolheu as quatro versões. Não há versão de
marca: o campo não veste marca.

- **`rows` não fazia nada.** Com `field-sizing-content` o navegador ignora o
  atributo — medido, `rows={3}` e `rows={10}` dão a mesma caixa de 38px. O
  único consumidor do app, as observações de uma conta, passava `rows={3}`.
  **`minRows` e `maxRows`** dizem a altura em linhas: `calc(n·1lh + 1rem +
  2px)`, então acompanham o corpo do texto. Medido: piso de 2 linhas 58px,
  teto de 4 linhas 98px com o conteúdo de 136 rolando.
- **O teto não dissolve num `Textarea` solto**, e é mecânica: a máscara
  recorta o elemento inteiro, e o textarea pinta a própria borda e o
  preenchimento. No `InputGroupTextarea` o grupo pinta e o textarea é
  transparente, e ali `maxRows` liga `scroll-fade-y` + `useScrollFade`
  (medido: `data-scroll-fade="on"`, máscara aplicada). Para isso os refs
  passaram a repassar a limpeza que o React 19 devolve — sem ela o ref seria
  chamado com `null` e os ouvintes do fade ficariam vivos.
- **Contador**: com `maxLength`, "n/máx" embaixo à direita, em
  `--warning-muted-foreground` nos últimos 10% ou 20 caracteres. O número é
  `aria-hidden`; uma região viva só fala nessa faixa ("Restam 5 caracteres",
  medido), para não anunciar cada tecla.
- **Crescer em todo navegador**: onde `CSS.supports("field-sizing",
  "content")` falha (Firefox, Safari antigo), a altura segue o `scrollHeight`
  a cada digitação. Verificado só no Chromium, onde o ramo não roda.
- **`resize`**: `none` por padrão, `vertical` sob pedido. A alça do navegador
  arrastava nos dois eixos e, arrastada, cravava uma altura que desligava o
  crescimento.
- **Telas**: as observações da conta trocam `rows={3}` e um `shadow-xs` que
  nenhum outro campo tem por `minRows={3} maxRows={8}`.
- **Página**: nota do ⌘/Ctrl+Enter, a nota da dissolução, o crescimento sem
  `field-sizing`, o grupo com teto e a tabela de props completa.

### Rodada 181 — o ThemeToggle ganha o degrau sm, rótulos, a revelação circular e marca

O dono pediu a rodada completa e escolheu as quatro versões.

- **A geometria virou uma tabela só**: altura por degrau, parada = altura − 4,
  trilho = 4 + 3 paradas. Ela desce por estilo inline — é número calculado,
  e classe montada em tempo de execução não chega ao CSS. Medido: `sm` 76×28,
  `md` 88×32, `lg` 100×36, alvo de 44 nos três.
- **`labels`**: ícone e texto, paradas de largura igual (76 · 88 · 100). A
  amplitude do esticão é multiplicada por `parada de ícone / parada larga`,
  então a pílula estica os mesmos pixels da versão de ícone — sem isso a de
  88px esticava 19px e lia como elástico. Com o texto à vista, a face deixa o
  `aria-label` e o nome é o texto.
- **`reveal`**, ligado por padrão: a troca abre num círculo a partir da
  parada tocada (View Transitions API), animando o `clip-path` do
  `::view-transition-new(root)` em 560ms na curva do brilho. **O `flushSync`
  é o que faz funcionar**: o next-themes aplica a classe num efeito, e medido,
  com ele a classe `dark` já está no `<html>` quando a foto nova é tirada. O
  CSS que tira o esmaecer padrão da API mora em `globals.css`, escopado por
  `.theme-reveal`, que o componente põe e tira do `<html>` durante a
  transição. Sem a API, com movimento reduzido ou com `reveal={false}`, troca
  na hora.
- **`variant="brand"`**: o brilho (`brand-glow` + `useBrandGlow`) na borda do
  trilho; o `::after` segue sendo o alvo de toque. **Primeira versão não
  acendia**, medido com o ponteiro colado: o hook liga o ponteiro num efeito
  de montagem, e na montagem quem está na tela é o `Skeleton` — o ref é nulo e
  o efeito não volta a rodar. A condição passou a ser
  `variant === "brand" && montado`. Vale para qualquer peça de brilho que nasça
  depois de um portão de montagem.
- **Página**: ela dizia que existia um controle no app (são dois: o menu da
  conta no desktop e o do telefone) e que o esticão e o trajeto rodam no mesmo
  relógio de 400ms (são 640 e 400; os 240 a mais são o pouso). As nove notas
  longas viraram seis.

### Rodada 182 — o brilho de marca deixa de acender o anel inteiro do lado oposto

O dono viu, no `ThemeToggle brand`: acendendo um lado, o outro ficava com uma
borda fina das cores, "parecendo um erro".

- **Medido**: arco aceso à esquerda, **253 pixels** da ponta direita mudavam,
  com diferença de até 59 — o anel inteiro, bem fino, onde a janela vale zero.
  Isolando as camadas: a janela sozinha **não** vaza (zero); o vazamento vinha
  da composição de três camadas da rodada 156 (a caixa, `exclude` da
  `padding-box`, `intersect` com a janela), com ou sem o borrão.
- **O conserto são duas camadas**: a janela **menos** a `padding-box`
  (`mask-composite: subtract`; prefixado, `source-out`). Mesmo resultado
  geométrico, sem o resto: zero na ponta oposta, zero no miolo, e o arco do
  lado aceso igual (2.401 pixels contra 2.411).
- **Conferido nas sete peças do brilho, nos dois temas** — `ThemeToggle`,
  `Switch`, `Checkbox`, `Badge`, `Button`, `Card` e `Alert`: zero pixel muda
  no lado oposto ao ponteiro. (A primeira leitura do `Checkbox` acusou 643: o
  ponteiro a 12px caía dentro do alvo de toque de 44px e acendia o hover. A
  20px, zero.)
- **Nota de método**: no Chrome `-webkit-mask-image` e `mask-image` são a
  mesma propriedade. Um teste que escreve `-webkit-mask: none` para "desligar
  só o prefixado" apaga a máscara inteira, e a medição sai toda errada — foi o
  que a primeira bateria de variantes fez.
- `brand-contour.test.ts` passa a exigir as duas camadas e a proibir a volta
  de `intersect, exclude` / `source-in, xor`.

### Rodada 183 — o Toggle ganha amostra de cor, pílula, degraus de ícone e o ícone que acende

O dono pediu a rodada completa e escolheu as quatro versões. Nenhuma tela usa o
`Toggle` solto: as cinco chamadas são `ToggleGroup`, e três delas escreviam a
peça à mão.

- **`variant="swatch"` com `color`**: os seletores de cor da categoria e do
  workspace eram **dois desenhos** (um círculo com borda de `--foreground`, um
  quadrado com borda e anel de `--primary`) e os dois pintavam o hex cru por
  `style`, enquanto o ladrilho que a cor escolhida veste mostra
  `oklch(from … 0.86 min(c, 0.12) h)`. A amostra agora é uma, com a superfície
  do `ColorTile` — medido, a mesma cor computada que um ladrilho com o mesmo
  `--tile-color`: `oklch(0.86 0.079 250.5)` nos dois. A escolhida ganha
  contorno de `--foreground` afastado 2px e o tique. **O contorno saiu `none`
  na primeira medição**: a base declara `outline-none`, e o `outline-2` só
  mexe na largura; `outline-solid` explícito o conserta. A paleta do workspace
  passou a dizer o nome da cor ao leitor de tela, e não o hexadecimal.
- **`shape="pill"`**: o eixo do `Button`, com meio degrau de recuo; nos
  degraus de ícone, círculo. Os filtros da atividade escreviam
  `rounded-full px-3`.
- **`size="icon-sm…icon-xl"`**: 28 · 32 · 36 · 40, medidos. As grades de ícone
  escreviam `size-9` (categoria, que já era `lg` e repetia a medida) e `size-11`
  (workspace, 44 — passou a 40, o degrau da escada).
- **`icon` + `iconOn`**: contorno desligado, sólido ligado, trocando por
  opacidade (medido: `[1, 0]` → `[0, 1]` ao ligar). É prop e não derivação,
  pela razão da `BottomBar`.
- O miolo (ícones e tique) e a variável da cor moram em `ToggleContent` e
  `toggleStyle`, divididos com o `ToggleGroupItem`; o `Toggle` continua átomo
  sem importar nenhum componente de `ui/`.
- **Páginas**: a do `Toggle` punha `aria-label` que trocava o nome visível
  (o toggle escrito "plain" era anunciado como "Negrito" — WCAG 2.5.3); o
  comentário do componente tinha uma frase truncada. A do `ToggleGroup` dizia
  que clicar no item ativo desmarca e deixa o valor vazio, e o componente
  engole essa troca desde que ganhou o guarda — a nota foi invertida.

### Rodada 184 — as cores de identidade e de ladrilho deixam de ser pastel, e ganham duas versões

O dono recusou o pastel dos avatares e das amostras: "ou deixe elas bem
clarinhas ou no tom do arco-íris original". Um comparativo com quatro caminhos
(clarinhas com tinta neutra, clarinhas com a tinta da cor, as paradas exatas da
marca, e o arco-íris numa claridade só) foi rasterizado com o contraste de
cada célula; as paradas exatas reprovavam no magenta (4,2) e trocavam a tinta
entre branca e escura por cor. O dono escolheu **duas**: o arco-íris vivo e a
clarinha com a tinta da cor, **como variantes, em todo componente que usa essas
cores**.

- **Tokens**: `--identity-N` passa a ser a viva (0,76, croma 0,17), e entram
  `--identity-N-soft` (0,95, 0,05) e `--identity-N-ink` (0,42, 0,13), nos dois
  blocos de tema, com os mesmos matizes.
- **Utilities que publicam variáveis, e não pintam**: `identity-N` declara
  `--identity-surface`, `--identity-surface-soft` e `--identity-ink`;
  `tile-vivid` e `tile-soft` declaram `--tile-surface` e `--tile-ink` a partir
  de `--tile-color`. Quem pinta é o componente, com `bg-(--…)`. Pintar na
  utility faria o `hover:bg-muted` do `Toggle` disputar com ela por ordem de
  emissão — grupos que o `tailwind-merge` não sabe que conflitam.
- **O croma do ladrilho vivo é um degrau**: `clamp(0, (c − 0,02) × 10, 0,2)`.
  Os hexadecimais gravados vão de 0,079 (índigo) a 0,12 de croma, e a marca de
  0,13 a 0,28 — nenhum multiplicador único leva um ao outro. Com o degrau,
  qualquer cor com matiz vai ao croma cheio e cinza continua cinza.
- **O padrão do `AvatarFallback` é por fallback do `var()`**, e não por uma
  classe `identity-1`: duas `identity-N` no mesmo elemento seriam decididas
  por ordem de emissão, e a da pessoa perderia para a 1. `IDENTITY_TONES` passa
  a ser `identity-N bg-(--identity-surface)`, que continua pintando sozinho nos
  dois `div` que não são avatar (o painel e o diálogo de perfil).
- **`tint` em três componentes**: `AvatarFallback`, `ColorTile` e o `Toggle` /
  `ToggleGroup` com `variant="swatch"`. O padrão é `vivid` em todos, e nenhuma
  tela do app foi mudada para `soft`.
- **Medido**: avatar viva 7,44–8,95 e suave 6,50–7,68; ladrilho viva 6,66–9,44
  e suave 6,48–7,64 (192 células), nos dois temas.
- **Os dois scripts de contraste mediam errado depois da troca**:
  `identity-contrast.mjs` trocava `bg-identity-N` na classe do clone, que não
  existe mais, e mediu a família 1 seis vezes — 7,65 em todas, sem acusar
  nada. Ele passou a trocar `identity-N`, a medir as duas versões e a ler a
  tinta de cada clone; o `tile-contrast.mjs` também mede as duas.
- **Um erro da rodada 183**: o `toggle.test.ts` usava a flag `/s` de regex,
  que o alvo do `tsc` do projeto não aceita — o `tsc` tinha rodado antes de o
  arquivo existir. O `[^>]` já atravessa linhas, e a flag saiu.

### Rodada 185 — o Tooltip confirma o clique, alcança o desabilitado, mostra o atalho e ganha contraste

O dono pediu a rodada completa e escolheu as quatro versões. Duas delas vieram
de defeitos medidos antes de propor.

- **O clique fecha a dica.** O Radix fecha o conteúdo no `pointerdown` do
  gatilho — medido: a dica aberta some depois do clique. As duas telas de
  convite (membros e o diálogo, três botões de copiar link) trocavam o texto
  da dica para "Copiado", que **nunca apareceu**. `Tooltip confirmation` força
  a dica aberta mostrando a confirmação enquanto ela existir, e a anuncia por
  uma região viva — mudar um `aria-describedby` não fala nada. Quem a liga é
  a tela, pelo resultado (`linkCopied`, que só vira `true` depois de o
  `writeText` dar certo); a falha continua no toast. Medido: "Link copiado"
  aberto depois do clique, anunciado, e fechado depois dos 2s da tela.
- **Botão desabilitado não abre dica.** A demonstração "Só o owner remove
  membros" da página estava morta. Com `asChild` e um filho `disabled`, o
  `TooltipTrigger` o embrulha num `span` focável (`aria-disabled`, com o
  `aria-label` do filho); o `disabled:pointer-events-none` do `Button` deixa o
  ponteiro chegar ao `span`. Medido no cursor e no Tab.
- **`shortcut`**: o `Kbd` à direita do texto, com ⌘ ou Ctrl pela plataforma. O
  `SidebarTrigger` passa a ter dica com ⌘B — o atalho existia e nada na tela
  dizia. (O cabeçalho do app pede login, e esse caso não foi visto na tela;
  a peça é a mesma medida na página.)
- **`variant="contrast"`**: a pílula `--primary`, sem vidro. Ela **não veste a
  placa por baixo**: a placa traz `supports-backdrop-filter:dark:bg-popover/60`
  e o `glass-surface`, que venceriam o `bg-primary`. O `Kbd` dentro dela
  precisou do par `dark:` — o `dark:bg-muted` do próprio `Kbd` empatava e
  vencia pela ordem, e a tecla saía cinza-escura sobre a pílula branca.
- **Página**: as notas citavam `max-w-xs`, que saiu quando o teto virou
  `min(20rem, largura disponível)`; as seis notas viraram quatro, e os ícones
  de copiar perderam o `h-4 w-4` que o `Button` já dá.

### Rodada 186 — o Alert traz o ícone do tom, dispensa, põe a ação na linha e entra suave

O dono pediu a rodada completa e escolheu as quatro versões.

- **O ícone é do tom.** Seis telas escreviam o `svg` como filho, cada uma
  escolhendo: o destrutivo saía triângulo em cinco (o do `warning`) e círculo
  com × no catálogo, e as telas de acesso (login, cadastro, recuperação,
  convite) não tinham ícone nenhum. Hoje `info` ⓘ, `success` ✓, `warning` ⚠,
  `destructive` ⊗ e `brand` ✦ vêm sozinhos; `default` fica sem. `icon` troca,
  `icon={false}` tira. `alert-icon.test.ts` reprova o `svg` escrito como filho
  em qualquer `.tsx` de `src/`. Medido: um `svg` por alerta nos 13 da página, e
  o aviso de sessão encerrada do login com o ícone.
- **Dispensar**: `onDismiss` põe o × no canto, com a receita do × da
  `AnnouncementBar` (flor em `currentColor`, alvo de 46 no dedo; sem a borda no cursor, a pedido do dono). O
  texto recua pela presença (`pe-10`, `pe-8` no `sm`), como o título do
  `Dialog`. Medido: centro do × igual ao centro da primeira linha (0px). Nenhuma
  tela usa.
- **Ação na linha**: `AlertActions placement="inline"`. **A primeira versão não
  funcionou, e a razão é regra de CSS**: `@md/alert:grid-cols-*` no próprio
  alerta nunca casava, porque uma container query não enxerga o próprio
  contêiner. A grade ganha a terceira coluna `auto` sempre que há ação na
  linha, e quem pergunta a largura são os filhos: estreita, a ação atravessa
  texto e `auto` (que mede 0) e desce ao pé; larga, ocupa a `auto`. Com a
  terceira coluna, uma peça sem coluna declarada cairia nela por
  auto-posicionamento, então título, descrição e ações leem
  `--alert-text-col` (2 com ícone, 1 sem) em vez do `col-start-2` condicional.
  O contêiner só existe com a ação na linha (`inline-size` num pai que encolhe
  ao conteúdo levaria o alerta a 0). O respiro título→descrição passou de
  `gap-y-0.5` a margem da descrição, para a linha vazia da ação não somar 2px.
  Medido: o erro do painel foi de 96 para 68px, com a ação centrada no texto
  (0px); a 375px ela fica 14px abaixo da descrição.
- **Entrada**: `starting:opacity-0 starting:translate-y-1`, sem prop e sem
  timer. Medido: opacidade 0 → 0,42 → 0,86 → 0,99 em 160ms.
- **`wrap-break-word`** no título e na descrição; três diálogos escreviam
  `break-words` no título, e a tela de erro na descrição.
- **Página**: a nota "Três medições" dizia que a `@property
  --brand-glow-start` é `inherits: true` e que um núcleo chapado protege o
  texto — a propriedade não é registrada desde a troca pelo tween, e o núcleo
  saiu na 156. O AGENTS.md repetia a primeira (medição 1). As seis notas do
  mecanismo do brilho foram para a página `brand`, que é a da primitiva; o
  alerta fica com os dois custos que são dele. As demonstrações da marca
  foram de duas para uma, e "Sem ícone" virou a seção do ícone. O cabeçalho
  do `alert.tsx` ainda descrevia a régua de 2px, e o tipo justificava a
  proibição do `sm` pela geometria dela.

### Rodada 187 — a AnnouncementBar ganha o ícone do tom, a posição fixa, a entrada e o centro

O dono pediu a rodada completa e escolheu as quatro versões.

- **Ícone do tom**, com a API do `Alert` da rodada 186: `info` ⓘ, `success` ✓,
  `warning` ⚠, `destructive` ⊗, `brand` ✦, `default` sem; `icon` troca e
  `icon={false}` tira. O `OfflineBanner` passa o sinal cortado por `icon`.
  `alert-icon.test.ts` passou a cobrir as duas peças.
- **`position`** (`static` | `sticky` | `fixed`) no lugar do booleano
  `sticky`. O `fixed` traz `inset-x-0 top-0`, `--z-banner` e o fio do tom — as
  quatro classes que o `OfflineBanner` escrevia —, e ele fica com o `top` do
  cabeçalho do telefone. **Defeito achado no caminho**: o `relative` que o véu
  de marca pede morava na variante `brand`, declarada depois do `sticky`, e o
  `tailwind-merge` o deixava vencer — `variant="brand" sticky` nunca prendeu.
  O `relative` passou para o `static`; `sticky` e `fixed` já posicionam.
  `brand-contour.test.ts` cobra o `sticky` na barra de marca mesclada.
- **Entrada**: esmaece e desce por `starting:`, a altura inteira em `sticky` e
  `fixed`, 4px no fluxo. Medido: `translate` de −100% a `none` e opacidade de
  0 a 1 em ~200ms.
- **`align="center"`**: texto e ações juntos no meio; o × sai do fluxo
  (`absolute`, a 12px da borda) e o recuo fica simétrico (`px-11`). Medido: o
  miolo centrado com 0,01px de desvio, o × no eixo da barra.
- **Página**: o cabeçalho dizia "dispensável por padrão" (o × só existe com
  `onDismiss`); o `AnnouncementBarAction` dizia ser "o disco da rodada 99" (o
  disco saiu na 148, é a flor); a nota do véu falava em "uma linha cinza e uma
  de arco-íris" (a régua saiu na 127). As notas de fio, realce e offline se
  fundiram; `success` entrou nos tons; a posição tem demonstração numa caixa
  que rola, com a entrada.
- **O × perdeu a borda do cursor**, a pedido do dono, como o do `Alert`: fica
  a flor a 15% em `currentColor`.

### Rodada 188 — o ButtonGroup ganha degrau, orientação vertical, texto e campo

O dono pediu a rodada completa e escolheu as quatro versões.

- **`size` no grupo**, pelo `ButtonSizeContext` que o `Button` passou a ler (o
  `useContext` fica fora do `??`, porque hook não é condicional). O `size` do
  próprio botão vence. Medido: `sm`, `md` e `lg` dão 28, 32 e 36 nos três
  filhos sem nenhum deles declarar. O grupo passou a importar o `Button` — é
  molécula, e agora é feita do átomo que ela junta.
- **`orientation="vertical"`**: `flex-col`, cantos de cima e de baixo, `-mt-px`
  e o filete deitado (`before:h-px`); o `secondary` tem o vão de 1px em cima.
  Medido: passo de 33px no `secondary` (32 + vão) e de 31 no `outline` (32 −
  sobreposição).
- **`ButtonGroupText`**: fundo `muted` e borda própria (o filete se esconde
  nele), altura da fileira por `self-stretch`, corpo que desce com `xs`/`sm`.
- **Campo no grupo**: o `Input` ocupa a sobra (`flex-1`) e o grupo vira `flex
  w-full`; no dedo o campo sobe a 40 pela régua de campo e os botões iam ficar
  em 32 — o grupo iguala (`pointer-coarse:has-[>[data-slot=input]]:*:h-10`).
  Medido a 375px com toque: 40 e 40. O foco do campo sobe a `z-10`.
- **Telas**: a paginação da tabela de transações era um grupo escrito à mão
  (bandeja `border-border/80 bg-background/80 p-0.5 shadow-sm`, setas
  `tertiary` com `size-8 rounded-md` cravados e `disabled:opacity-40`, e o
  "Página 2 / 5" solto do lado de fora); virou `ButtonGroup size="icon-md"`
  com `outline` e `ButtonGroupText`. O botão de nova transação deixou `w-8
  px-0` e os `h-4 w-4` dos ícones: a seta é `icon-md` com
  `toolbarIconControlClassName` — no telefone ela passa de 32×40 a 40×40. A
  altura continua a da barra (`--toolbar-control`), que o `size` do grupo não
  expressa. As duas telas pedem login e não foram vistas; as peças foram
  medidas na página.
- **Página**: a nota da emenda misturava "botão cheio com filete" e "primário e
  `secondary` com vão" sem dizer que o cheio que sobra é o `destructive`; a
  demonstração agora mostra os quatro pesos lado a lado.

### Rodada 189 — o Collapsible ganha a linha, o cartão, o ⌘F e o rótulo que troca

O dono pediu a rodada completa e escolheu as quatro versões.

- **`CollapsibleRow`**: o gatilho desenhado com `disclosureRowClassName`,
  `disclosureRowFocusClassName` e `disclosureLabelClassName`, a régua que só o
  `Accordion` vestia. Degrau `md`/`lg`/`xl` (32/36/40, medido), `trailing`,
  `markerSide`, recuo por `--collapsible-px`.
- **`variant="card"`**: a superfície `outline` do `Card` (`rounded-xl border
  border-border bg-card`), escrita no arquivo porque o `Collapsible` é molécula
  e o `Card` é organismo. Linha e conteúdo recuam 16px, **sem fio** entre eles.
  O recuo de baixo é um `::after` de 16px no conteúdo: `padding-bottom` no nó
  cuja altura anima deixaria o piso em 16 e o fechamento estalaria no fim; o
  pseudo entra na altura e a cascata (`& > *`) não o alcança.
- **O estado passou a morar no `Collapsible`**, que controla o Radix e publica
  `{ open, setOpen, variant }`; `open`/`defaultOpen`/`onOpenChange` seguem
  valendo.
- **`findable`**: o Radix 1.1 não tem `hiddenUntilFound`. O conteúdo fica
  montado e o componente escreve `hidden="until-found"` no `animationend` do
  próprio nó (os filhos da cascata também disparam o evento), e o tira no
  `setOpen(true)`, **antes** do estado mudar: o Radix mede a altura de abrir
  num efeito de layout de um filho, que roda antes de qualquer efeito do
  conteúdo, e com o atributo ainda lá `content-visibility: hidden` media 0.
  `beforematch` abre. Medido: fechado com altura 0 e o texto no DOM; o
  `beforematch` abre; fechar devolve o atributo; abrir pelo gatilho anima 0 →
  9 → 22 → 32 → 36 → 37 (a mola passa e volta). O ⌘F real não foi exercitado
  — o Playwright não aciona a busca do navegador —, e o evento foi simulado.
  O hook guarda o nó por `useState`, e não por `useRef`: passar um `RefObject`
  ao `composeRefs` no render acusava "acessar ref durante o render".
- **`CollapsibleLabel`**: o texto aberto e fechado, pelo estado do contexto.
  Ele empresta `data-slot="button-label"` para, dentro de um `Button`, ganhar
  a maiúscula inicial e o traço do `link`. A demonstração do "mostrar mais"
  deixou de guardar `useState`.
- **Telas**: o formulário de cartão trocou o `Button tertiary` com `h-9 w-full
  justify-between gap-2 px-2 text-xs font-medium text-muted-foreground
  hover:text-foreground` por `CollapsibleRow` (agora `text-sm` na tinta cheia,
  como toda linha de divulgação); o painel da fatura trocou o cartão à mão
  (`rounded-xl border-border/70 shadow-sm`), o gatilho cru `px-4 py-3` e o
  `border-t border-border/60 px-4 pb-4 pt-4` do conteúdo por `variant="card"`
  com `CollapsibleRow size="xl"`. Os dois são `findable`. As duas telas pedem
  login e não foram vistas; as peças foram medidas na página.
- **Página**: a seção "A espiada" repetia o `md` que "Os três degraus" também
  mostrava — viraram uma; o "Padrão" virou "Com um botão", depois da linha
  pronta; a nota do ⌘F dizia que só `peek` mantinha o texto montado.

### Rodada 190 — o DescriptionList ganha sobrancelha, destaque, nota, colunas e alinhamento

O dono escolheu as quatro versões propostas "e o que mais achar importante":
entrou o `align="end"` no item.

- **O que as telas escreviam à mão**: o rótulo em caixa alta (`text-2xs
  uppercase tracking-wide text-muted-foreground`) em sete termos, em três pesos
  (`medium`, `semibold`, e sem caixa alta no cartão); o valor grande em
  `text-base`/`text-xl font-semibold`; a nota miúda em `text-2xs`; e as
  colunas por `className` (`grid-cols-2`, `grid-cols-3`), contra o
  `sm:grid-cols-2` do componente.
- **`term="eyebrow"`**, aplicado pela `<dl>` num seletor de um nível (`[&>*>
  [data-slot=description-term]]`), e não por contexto: o painel de acesso é
  server component. O `Caption` do termo declara `text-xs`, e o seletor
  (0,2,0) vence a classe dele. Medido: 11px, caixa alta, peso 500, e o termo
  de uma lista `caption` na mesma página segue 12px.
- **`size="xl"`** no valor (20px semibold, `tracking-tight`) e
  **`DescriptionHint`**, que desfaz o peso e o espaçamento do degrau —
  medido: nota a 11px, peso 400, sobre um valor de 600.
- **`columns={2|3}`** e **`align="end"`**. O painel de faturas tem a grade
  inversa (duas colunas no telefone, uma a partir de `sm`), e fica com
  `columns={2}` mais `sm:grid-cols-1` — o teste proíbe só a sobrescrita sem
  degrau.
- **Telas**: cartão de crédito, painel da fatura (hábitos e tickets, que
  também perderam o `space-y-1` entre termo e valor — o par de identidade não
  tem gap), as duas contas a pagar, o painel de faturas do início (o total
  deixou a quebra em 480px escrita à mão pelo `layout="inline"`, que quebra em
  640px), o resumo da categoria, o painel de acesso e o `HistogramSlider`. O
  termo do cartão era `text-2xs font-medium` sem caixa alta e passou a
  sobrancelha, como os outros. Medido a 375px no `/login`: duas colunas.
  As outras telas pedem login e não foram vistas.
- **Página**: a demonstração do extrato desenhava um cartão à mão (`rounded-xl
  border px-4 py-3`) e agora é `Card`; entraram o destaque com nota e as três
  colunas com `align="end"`.

### Rodada 191 — o EmptyState ganha as ações no degrau, a versão em linha, o "tudo em dia" e o numeral no degrau

O dono pediu a rodada completa e escolheu as quatro versões.

- **Ações no degrau**: `EmptyStateActions` envolve os filhos no
  `ButtonSizeContext` da rodada 188. A tabela é a que o app já usava — `sm` e
  `md` dão `sm` (os vazios dos cartões do painel), `lg` e `page` dão `xl`.
  Saíram de dez telas `size="xl"`, `size="sm"`, `gap-1.5`, `min-w-[10rem]
  text-xs` (um `text-xs` num botão `xl`) e os `size-3.5`/`mr-1.5 size-3.5` dos
  ícones; a de cartões perdeu `size="sm" h-8 gap-2 text-xs`. Mudou de degrau:
  o cartão não encontrado (`sm` → `xl`) e a 404 (`md` → `xl`), medidos em 40.
- **`layout="inline"`**: grade de duas colunas com o ícone atravessando as
  linhas, poço de 32, alinhado à esquerda, declarado depois do `size` para o
  `tailwind-merge` trocar o respiro. Os dois avisos de cartão (transação e
  assinatura) o vestem, e o link estilizado à mão no meio da frase virou a
  ação (`Button variant="link"`); o recuo lateral do `link` saía 22px para
  dentro do texto e as ações em linha o zeram. **O auditor aprendeu o poço**:
  ele supunha todo ícone de `EmptyStateIcon` em 24px e acusava o 16/solid
  certo; agora lê o `layout="inline"` do bloco em aberto, e o tique padrão do
  próprio `empty-state.tsx`. A regra G segue em zero no projeto.
- **`variant="done"`**: o círculo nasce na mola (`starting:scale-50`) e o tique
  (`CheckIcon` 24/outline, o padrão sem filho) se desenha por `clip-path` —
  sem SVG à mão, então a regra G não abre exceção. Medido: `inset(0 25.8% 0
  0)` a 220ms, `inset(0)` no fim. O tom padrão do `done` é `success`. As
  sessões encerradas e as parcelas terminando o vestem.
- **`EmptyStateCode` no degrau**: `CODE_DEGRAU` guarda corpo e recuo juntos
  (o recuo é o que faz o título pousar no numeral). O cartão não encontrado
  deixou `-mb-6 text-7xl sm:-mb-8 sm:text-8xl`.
- **Página**: "Molduras" dizia mostrar as três e mostrava só `plain` — agora
  mostra `dashed` e `card` lado a lado; os "quatro estados" desenhavam o
  esqueleto à mão e vestem `Skeleton shape="circle"` e `SkeletonText`.
- **Um tropeço desta rodada**: o teste novo foi escrito por cima do
  `empty-state.test.ts` da rodada 131 (cinco testes), e a contagem caindo de
  750 para 748 denunciou. O arquivo voltou e os três testes novos entraram
  nele.
- A 404 mostra um aviso do Next ("Encountered a script tag while rendering
  React component") que já existia antes desta rodada.

### Rodada 192 — o Field ganha o cabeçalho, o contador, a lista de requisitos e a linha que não empilha

O dono pediu a rodada completa e escolheu as quatro versões. A página estava
certa; as quatro saíram de padrões escritos à mão nas telas.

- **`FieldHeader`**: o login (`div flex items-center justify-between` com o
  "Esqueceu a senha?") e o nome da carteira (o mesmo em `items-baseline`, com
  o contador) viraram a peça. Linha de base, e o vizinho fora do `<label>`.
  Medido no `/login`: o `for` do rótulo segue `password`.
- **`FieldCounter`**: aparece nos últimos 10% ou 20 caracteres, em âmbar, com
  o número `aria-hidden` e a região viva dizendo quantos restam — a régua do
  `Textarea` (rodada 180), que lá é sempre visível e só troca de tinta. O
  contador do nome da carteira aparecia a 20 do teto, em cinza, sem anúncio.
  Medido: 34/40 visível, "Casa" sem contador.
- **`FieldChecklist`**: a lista viva, com `checklistId` no contexto do `Field`
  e somada ao `aria-describedby` pelo `FieldControl`, depois da descrição e
  antes do erro. O `PasswordRequirements` do cadastro e da redefinição passou
  a vesti-la, e o diálogo de trocar senha, que tinha **a própria lista**
  (`ReqRow`, um componente declarado na tela, com um sexto item "senha forte"
  que repetia a conjunção dos outros cinco — o mesmo que a rodada do cadastro
  já tinha tirado) **e a própria cópia da política** (a interface, o
  `checkPasswordRequirements` e o `isPasswordValid`, iguais aos de
  `lib/password-policy`), passou a usar os dois compartilhados. Medido no
  `/register`: o `aria-describedby` do campo aponta para a lista.
- **`FieldRow stack={false}`**: a validade do cartão (MM/AAAA) era `grid
  grid-cols-2 gap-3`. O padrão continua empilhando; a exceção é para o par
  curto. Medido a 375px: a linha padrão com 1 coluna, a `stack={false}` com 2.
- **O teste da rodada é `field-versions.test.ts`, um arquivo novo** — o
  `field-size-ladder.test.ts` existente ficou intacto.
- O diálogo de trocar senha e o nome da carteira pedem login e não foram
  vistos; as peças foram medidas na página, no `/login` e no `/register`.
- **Defeito visto pelo dono na página**: no `orientation="responsive"`
  empilhado (e no `vertical`), o `*:w-full` do `Field` esticava o `Switch` até
  a coluna — um trilho de 406px. Os filhos diretos esticam, **menos** `switch`,
  `checkbox` e `radio`, que têm medida própria. Medido a 375px: 32×18.

### Rodada 193 — o InputGroup ganha a senha que se mostra, o contador, o carregando e o seletor no começo

O dono pediu a rodada completa e escolheu as quatro versões.

- **Os seis grupos do app eram o mesmo campo de senha**: login, cadastro,
  redefinição e os três do diálogo de trocar senha, cada um com o botão, o
  `aria-pressed`, o rótulo que troca, o ícone que troca e um `useState` —
  ~22 linhas por campo. `InputGroupPasswordToggle` guarda o estado no
  contexto do grupo, e o `InputGroupInput type="password"` vira `text`
  sozinho. Medido no `/login`: `password` → `text` no clique, com "Ocultar
  senha" e `aria-pressed="true"`.
- **Contador, e um defeito latente**: o `Textarea` com `maxLength` embrulha o
  campo numa `div` para o contador (rodada 180), e dentro do grupo o textarea
  deixaria de ser filho direto — o `has-[>textarea]:h-auto` cairia e o grupo
  travaria na altura de uma linha. Ninguém usava a combinação, e o "0/280" da
  página era texto fixo. Agora o `InputGroupTextarea` desliga o contador do
  `Textarea` e põe a contagem num addon `block-end` (sempre visível); o
  `InputGroupInput` põe na ponta, só perto do teto. A régua dos três
  contadores (`Textarea`, `FieldCounter`, grupo) virou `lib/char-count`.
  Medido: textarea de 140 com 108px de altura e "125/140" em âmbar.
- **`pending`**: `aria-busy` no grupo e o `Spinner` num addon `inline-end`
  marcado `data-pending`; os outros addons da ponta saem com `hidden`, sem
  desmontar.
- **`InputGroupSelect`**: `<select>` nativo (a roda do sistema no telefone),
  16px no telefone contra o zoom do iOS, emenda na borda de campo. Ele também
  carrega `data-slot="input-group-control"`, porque é por esse slot que o anel
  do grupo acende — medido no foco por teclado: o anel de 3px aparece.
- **Página**: o exemplo de `block-end` era a contagem fixa "0/280", que ensina
  a escrever o contador à mão; virou uma dica de teclado, e a contagem é o
  `maxLength`. Entraram a tabela de props e o "onde o app usa".
- O diálogo de trocar senha, o cadastro e a redefinição usam a mesma peça que
  foi exercitada no `/login`; não foram abertos um a um.

### Rodada 194 — o Item ganha a linha rente, a selecionada, a seta e deixa de quebrar sem faixa

O dono pediu a rodada completa e escolheu as quatro versões. A página estava
certa; as versões saíram de doze telas que reescreviam o componente por
`className`.

- **Não quebra por padrão**: a base era `flex-wrap`, e seis linhas escreviam
  `flex-nowrap`; sete linhas-botão escreviam `text-left`. Agora a linha só
  quebra com `ItemHeader`/`ItemFooter` (que são `basis-full`), `text-start`
  vem de fábrica e o `ItemContent` ganhou `min-w-0` para o título truncar em
  vez de empurrar as ações. **O efeito colateral foi visto e consertado na
  mesma rodada**: a 360px um `Badge` dentro do `ItemTitle` era espremido em três
  linhas; o título ganhou `flex-wrap` e o selo desce inteiro.
- **`variant="flush"`**: sem borda nem canto, com `px-4` e o `py` do degrau por
  `compoundVariants` (que vêm depois e vencem o recuo do `size`). Medido: o
  título da linha alinha com o do `CardToolbar` (1px), e num `divided` o fio
  continua. As transações recentes e as parcelas do painel deixaram
  `rounded-none border-0 px-4 py-3`.
- **`selected`**: `--primary-accent` a 60% e `--primary` a 5/10%, a receita do
  cartão de escolha do `FieldLabel`, com `aria-current`. A sessão atual a
  escrevia a **30%**, abaixo dos 3:1. A categoria acesa no painel de despesas
  **não** entrou: ela acende porque o ponteiro está na legenda do gráfico, e
  `aria-current` ali mentiria.
- **`ItemChevron`**: parada em `--muted-foreground`, e numa linha
  `interactive` ela ganha a tinta cheia e anda 2px. A primeira versão usava
  `group-hover/item`, e andaria também na linha que não navega; como
  `group-hover` + `group-data-[interactive]` no mesmo ancestral não casa (a
  medição do alternador de tema), o `interactive` publica `--item-nudge` e
  `--item-chevron`, e a seta os lê. Medido: `0px`/`oklch(0.5)` em repouso,
  `2px`/`oklch(0.145)` no cursor. As transações recentes (a seta a 70%) e as
  categorias da fatura (com a própria animação por `group/row`) a vestem.
- **Página**: entraram a linha rente num cartão, a sessão selecionada e a seta
  na linha que navega. O auditor leu o texto `ComponentProps<svg>` da tabela de
  props como um `<svg>` à mão; o texto mudou.
- As telas do app pedem login e não foram vistas; as peças foram medidas na
  página, incluindo a 360px.

### Rodada 195 — o KbdGroup diz o gesto: sequência, alternativa, e a tecla que acende

O dono pediu a rodada completa e escolheu as quatro versões.

- **Defeito**: cada passo de `keys` passava só por `formatKey`, que não conhece
  modificadora — `["mod+k", "s"]`, o atalho de dois tempos do VS Code, sairia
  com o texto "mod+k". O passo com modificadora (ou com `+`) agora vai para o
  `Kbd keys`, que resolve ⌘ ou Ctrl pela plataforma. Medido: "⌘K depois S".
- **Contradição**: a regra do grupo diz que pastilhas lado a lado são
  sequência, e a legenda da paleta do catálogo (e a página do `Command`)
  escreviam `<Kbd>↑</Kbd><Kbd>↓</Kbd>` com o sentido de "↑ ou ↓".
  `mode="either"` põe um / entre as opções; as três ocorrências o vestem.
- **O leitor de tela ouve o gesto**: um `sr-only` " depois " entre os passos
  e " ou " entre as opções, com ou sem separador à vista. `separator` põe o ›
  na sequência, para quem não conhece a convenção. Com `children` os
  separadores entram igual.
- **`live`**: escuta `keydown`/`keyup` só quando ligado. Na sequência acende o
  progresso (errar volta ao começo, ou ao primeiro passo se a tecla errada for
  ele), apaga 600ms depois de completa e 1,5s depois de parada; nas
  alternativas acende a tecla descida. A pastilha acesa é `--primary`, por um
  seletor do grupo com mais especificidade que o `dark:bg-muted` do `Kbd` (um
  `data-lit:` empataria com ele). Medido com teclado real: G acende, H
  completa, tudo apaga; ↑ acende a seta; `oklch(0.205)` no claro e
  `oklch(0.985)` no escuro.
- **Página**: as legendas das demonstrações eram `span text-2xs
  text-muted-foreground` escritos à mão e viraram `Caption`.
- Nenhuma tela do app usa o `KbdGroup`; ele vive no catálogo.

### Rodada 196 — o Pagination troca por estado, gera a fileira, compacta no telefone e carrega mais

O dono pediu a rodada completa e escolheu as quatro versões.

- **Nenhuma tela usava o componente**, e a razão era o tipo: ele só aceitava
  `href`, e as duas listas paginadas do app (a tabela de transações e o
  detalhe da categoria, que a reusa) trocam de página por estado. Sem `href`,
  número e extremo viram `<button>`; o extremo desabilitado é `button
  disabled`, e não o `span role="link"` do modo de links.
- **Fileira gerada**: `page` + `total` com `getHref` ou `onPageChange`.
  `janelaDePaginas` guarda a primeira, a última, a atual e as vizinhas, e a
  reticência que esconderia uma página só vira a página (`1 2 3 4 … 18` e não
  `1 … 3 4 … 18`). As pontas desabilitam sozinhas. Medido: clicar 6, voltar e
  ir à 18 atualiza a janela, e na 18 a "Próxima" fica desabilitada.
- **Compacta no telefone**: o defeito aberto da página — a fileira de sete
  peças a 44px transbordava a 375px. Na fileira gerada, abaixo de `sm` os
  números saem e a posição fica entre as setas (`‹ 5 de 18 ›`). Medido a 375px
  com toque: sem transbordo. `variant="compact"` a força em qualquer largura.
  A fileira montada à mão não sabe o total e continua com os números.
- **`PaginationMore`**: rótulo "mostrar mais N" (o que falta, até o passo),
  contagem "30 de 57" em `Caption`, `pending` com `Spinner` e `aria-busy`, e
  some quando tudo está à vista. O histórico de pagamentos da conta o veste —
  era um `Button` com `text-xs` à mão, sem contagem.
- **A tabela de transações troca de novo**: na rodada 188 ela virou
  `ButtonGroup` com `ButtonGroupText`; agora é `Pagination size="md"` gerada
  por estado, com o `PaginationStatus` ao lado. As páginas do `ButtonGroup` e
  o AGENTS.md foram corrigidos para não citarem mais esse uso.
- **Um teste antigo pegou uma regressão**: `pagination-ladder.test.ts` proíbe
  interpolação em template literal no arquivo (classe montada em tempo de
  execução não existe), e o rótulo do "mostrar mais" usava uma. Virou
  concatenação.
- As duas telas pedem login e não foram vistas; as peças foram medidas na
  página, no desktop e a 375px.

### Rodada 197 — o RadioGroup ganha a ficha, a nota na linha, o valor na ponta e o ícone

O dono pediu a rodada completa e escolheu as quatro versões.

- **Uma escolha única estava escrita como seis interruptores.** A forma de
  pagamento do formulário de transação era `role="group"` com seis `Button
  aria-pressed`: o leitor de tela anunciava botões de alternar independentes,
  e cada ficha era uma parada de Tab. Virou `FormRadioGroup variant="chip"`:
  uma parada só, as setas trocam, e o rótulo "Forma de pagamento" nomeia o
  grupo pelo `aria-labelledby` do campo (antes era um `FieldTitle` visual mais
  um `aria-label`).
- **A ficha é, classe a classe, o chip de filtro do `Badge`**
  (`tagChipNeutral` em repouso, `tagChipFilterSelected` na escolha, reescritas
  sob `has-data-checked:` porque uma constante não se prefixa), e
  `radio-group-versions.test.ts` cobra a igualdade. O foco é `outline`, porque
  o anel de 1px da escolha já é `ring`. Medido: 32px no desktop, 40 no dedo.
- **O rádio `sr-only` ficava no fluxo.** `sr-only` não é do grupo de posição
  do `tailwind-merge`, então o `relative` do átomo sobrevivia e vencia: o
  rádio de 1px, mais o `gap`, empurrava o rótulo para a direita (visto na
  captura). Com `absolute` junto, o merge tira o `relative`; medido depois,
  12px de cada lado do texto nas cinco fichas.
- **`deselectable`**: o Radix só marca o que não está marcado, então o clique
  na marcada chega intacto ao nosso `onClick`, que chama o grupo com `""`.
  Sem `value`, o grupo guarda o estado; sem `deselectable`, o Radix continua
  dono dele, como antes. Medido: tocar na escolhida dá `""`, Espaço na marcada
  também.
- **A nota na linha simples**: o cabeçalho dizia que ela "não cabia sem virar
  cartão". Cabe: o `Label` troca `items-center` por `items-start` e ganha
  entrelinha (`leading-none` colaria as duas linhas), e o rádio desce 2px.
  Medido: o centro do rádio a 10px de uma linha de 19,25.
- **`trailing`**: o valor na ponta, em algarismos tabulares, dentro do
  `<label>` — entra no nome acessível, como a nota. A página troca o PIX/cartão
  por um parcelamento com a parcela na ponta.
- **`icon` em 16px, em toda forma.** A primeira versão desenhava 20px no
  cartão, com `24/outline` pela regra do "ícone passado como valor", e o
  auditor acusou os cinco usos da tela: ele supõe 16 para ícone sem tamanho, e
  o `icon` do `Alert`, da `AnnouncementBar` e da `Timeline` já é desenhado em
  16 com `16/solid` de quem chama. Seguir o contrato da casa foi mais barato
  que ensinar outra exceção ao auditor. Num grupo horizontal de cartões a
  opção vira **ladrilho**: ícone em cima, rádio no canto do recuo. O tipo do
  lançamento (Despesa, Parcelada, Receita) e o tipo na edição o vestem.
- **A página tinha duas demonstrações do mesmo par** ("Total e parcelas" /
  "Valor da parcela", na horizontal e no formulário); a horizontal saiu, e o
  formulário diz o que ela dizia. A nota "Onde o app usa" entrou.
- O formulário de transação pede login e não foi visto; as peças foram
  medidas na página, nos dois temas e a 375px com toque.

### Rodada 198 — a busca é uma pílula só: SearchInput, CommandInput e o gatilho do cabeçalho

O dono pediu o `SearchInput` reformulado a partir das buscas que já usava — o
gatilho do cabeçalho do catálogo, o `CommandDialog` e o `Combobox` —, tudo
padronizado, e escolheu as quatro versões.

- **As três referências concordavam por cópia, e o `SearchInput` discordava.**
  O gatilho e a pílula da paleta escreviam à mão a mesma forma (pílula, lupa a
  70%, `gap-2`/`px-3` no 32, `gap-2.5`/`px-3.5` no 36); o `SearchInput` era um
  `InputGroup`, caixa `rounded-lg` de formulário. A receita foi para
  `lib/search-field-classes` e os três a vestem. Medido depois: gatilho e
  `SearchInput` com a mesma altura (32), o mesmo raio, o mesmo fio e o mesmo
  preenchimento, lupa a 13px da borda nos dois; a paleta em 36, lupa a 14.
- **Nenhum pode ser o outro**: o gatilho é um `<button>`, o campo da paleta é o
  `Command.Input` do cmdk, e o `SearchInput` é um `<input>`. Divide-se a régua,
  no precedente de `menu-classes` e `field-classes`.
- **O gatilho do cabeçalho virou dois botões.** Ele mudava de cara por `lg:` (a
  pílula só a partir de `lg`, ícone abaixo), e uma constante não se prefixa —
  `lg:` montado em tempo de execução não existe. Hoje é o ícone com
  `lg:hidden` e a pílula com `hidden lg:flex`, e só um aparece por vez (medido
  a 375px: um gatilho visível).
- **O `CommandInput` solto mudou um pouco**: era `rounded-lg` com o anel de
  foco a 45%, e passou à pílula com o anel de campo (30%, a decisão da rodada
  162). O × dos dois ficou redondo, como a pílula.
- **`surface="plate"`**: a pílula de vidro da pilha, para dentro de painel
  flutuante. O `FormPickerPopoverSearch` (os seletores de categoria da
  transação e da assinatura) e a busca de categoria do filtro de transações a
  vestem — era um campo preenchido sobre a placa, a segunda superfície que o
  dono já tinha tirado do `Combobox` na rodada 143.
- **`shortcut`**: a tecla à direita sem pastilha (a do gatilho) e o atalho que
  foca e seleciona o campo, com `aria-keyshortcuts`. Sem modificadora ele não
  dispara com o foco num campo de texto. Medido na página com `F` (⌘K e `/`
  são da paleta do catálogo): F foca, e digitar `ff` no campo escreve `ff`.
  Com texto, o lugar é do ×.
- **`variant="brand"`**: o brilho do gatilho, só na superfície `field`; o tipo
  proíbe com `plate`. **`pending`**: o `Spinner` no lugar da lupa e
  `aria-busy`, sem mudar a altura (medido, 32).
- **No dedo**: os quatro degraus sobem a 40 e o texto fica em 16px (sem zoom
  do iOS), medido a 375px com toque.
- **Dois testes antigos liam o texto do `CommandInput`** procurando a tinta da
  placa escrita ali (`command-dock` e a asserção 24 do `glass`). Eles agora
  seguem a indireção: o campo veste `searchFieldSurfaceClassName.plate`, e a
  receita importa `menuPanelTintClassName` da régua.
- O filtro de transações pede login e não foi visto; as peças foram medidas na
  página do catálogo, no cabeçalho, no `Combobox` e no `Command`, nos dois
  temas e a 375px.
- **O `Combobox` ainda não era o `SearchInput`** — o dono apontou na tela: a
  pílula dele dividia a receita, mas não o componente, e por isso não tinha o
  anel de foco nem o ×. A divisão por régua tinha parado cedo demais: o
  `Command.Input` do cmdk não pode ser trocado por outro `<input>`, mas pode
  ser **filho** do `SearchInput`, que o recebe por `Slot`. Agora o
  `CommandInput` monta o `SearchInput` (`surface` `plate` na pilha, `field`
  solto), com quatro props para ele: `leading` (o escopo), `focusRing` (a
  paleta o desliga), `touchFloor` (a pilha o desliga — o teto da lista
  desconta a pílula de 36) e `rootProps` (o `data-waiting` do feixe). O
  `onClear` passou a receber o evento, para o × da paleta disparar o `input`
  que devolve a paleta ao ocioso. E o `CommandInput` guarda o texto quando
  ninguém o controla — o `Combobox` não controla, e sem isso o × nunca
  aparecia. Medido no `Combobox`: a pílula é o `search-input` `plate`, filtra
  8 → 2 com "sa", o × limpa, volta às 8 e devolve o foco, e o anel acende com
  o campo focado. Na paleta: sem anel, o feixe apaga ao digitar e volta ao
  limpar, e o escopo entra e sai pelo Backspace como antes.
- **O dropdown do `Combobox` ficou igual ao popover da demonstração**, a
  pedido do dono ("exatamente o mesmo"): uma placa só, a do popover, com a
  pílula e a lista dentro. Até aqui ele era a pilha da paleta (rodada 143):
  pílula e placa soltas, o popover sem pintar, uma sombra por peça. Agora o
  `Command` de dentro é `plain`, o `CommandInput` ganhou `surface` (o
  `Combobox` pede `plate`), a lista recua 8px (`px-2 pb-2`) e a linha tem 32
  (`py-1.5`, e não `min-h-8`: `field-control-ladder.test.ts` reprovou o
  `h-8` como degrau escrito à mão, e a linha não é degrau). A primeira linha
  nascia 4px abaixo da demonstração — a folga do recuo da dissolução —, e
  ela passou para baixo, com a mesma soma na altura da lista. Medido nos dois
  temas: placa de raio 10 com a mesma tinta, pílula em 8/8 com 32, linhas em
  48, 80, 112 com o texto a 16px — os mesmos números da demonstração. As
  setas de "tem mais", que só a pilha ligava, vieram por `CommandList
  arrows`. O piso de toque saiu do `CommandInput` em todo lugar: a raiz
  publica a altura da faixa de busca (32 + 16), e a pílula a 40 no dedo
  ficaria 8px por baixo da lista. `density="menu"` e `PopoverContent
  surface="none"` ficaram sem consumidor no app.

### Rodada 199 — o ToggleGroup ganha a bandeja segmentada, a ficha, a contagem e as partes iguais

O dono pediu a rodada completa e escolheu as quatro versões.

- **O seletor de período das transações era escrito à mão nas duas formas**
  (`transactions-date-presets.tsx`): um `role="group"` de `Button
  aria-pressed`, a ficha com as constantes `tagChipFilter` e a bandeja com
  `bg-background shadow-sm` e uma sombra em `rgb()` cru no escuro. Virou
  `ToggleGroup type="single"`, com setas e o escolhido anunciado como rádio.
  **A pergunta da rodada errou num ponto**: ela dizia que a bandeja era "o
  seletor de período da tabela", e a bandeja (`variant="compact"`) não tem
  tela — o único uso é a folha de filtros, com as fichas. As duas formas
  migraram.
- **`variant="segmented"`**: a bandeja, com o marcador que desliza — a
  mecânica do `Tabs` (`ResizeObserver` mais `MutationObserver` em
  `data-state`, `offsetLeft` relativo à trilha, `--toggle-indicator-*`) e a
  superfície do marcador do `Tabs solid`. A bandeja é o item mais 4px (`sm`
  faz 32). Sem medida — servidor, primeira pintura — a escolhida se pinta
  sozinha. Nenhuma escolhida vale (o período personalizado), e o marcador
  some. Medido: o marcador a 9px do destino aos 60ms e encaixado (Δx 0, Δw
  0) depois; clicar no ativo não desmarca; com `shape="pill"` a bandeja e o
  marcador viram pílula.
- **`variant="chip"`**, no `Toggle` e no grupo: a superfície da ficha do
  `RadioGroup`, com o foco em `outline` porque o anel de 1px da escolha já é
  `ring`. `toggle-group-versions.test.ts` cobra a igualdade com o `Badge`.
- **`count`**: a contagem tabular no peso normal, sem opacidade (a tinta
  apagada a 70% cairia abaixo de 4,5:1). **A primeira versão dizia
  "Transações8" ao leitor de tela** — o `textContent` do item, medido, colava
  o rótulo ao número, porque o respiro era só o `gap`. Um espaço de texto
  antes do número resolve, e num flex ele não ocupa lugar (medido: o vão
  continua 8px, e o nome passou a ser "Transações 8"). Os filtros da
  atividade o usam no lugar de "(8)".
- **`stretch`**: partes iguais. Medido a 375px: 95px cada, sem transbordo.
- A página trocou a demonstração de PIX/Cartão/Dinheiro por uma só seção de
  "uma ou várias" e ganhou as quatro versões, as notas "Segmentado não é
  Tabs" e "Onde o app usa" e as tabelas de props. A pílula da página do
  `Toggle` passou a usar `count`.
- A folha de filtros e a atividade pedem login e não foram vistas; as peças
  foram medidas na página, nos dois temas e a 375px.

### Rodada 200 — o Accordion ganha o ⌘F, ícone e descrição no gatilho e o "abrir todos"

O dono pediu a rodada completa e escolheu as quatro versões.

- **Nenhuma tela usa o `Accordion`**, e não há acordeão escrito à mão: os
  blocos que expandem no app são um só por vez (o ciclo do cartão, o período
  da fatura, o "Ver mais" da ficha do cartão), território do `Collapsible`. A
  página dizia que `contained` era "a forma que este app usa", e o cabeçalho do
  componente também; os dois foram corrigidos, e a página ganhou a nota "Onde
  o app usa". Ela também citava o `ThemeToggle` como precedente do empurrão
  por variável — o par de variáveis de lá não existe mais; o vivo é o
  `--disclosure-nudge` da própria linha.
- **`findable`**: a mecânica do `Collapsible` (rodada 189) saiu dele para
  `hooks/use-until-found`, e os dois a usam. Para o `Accordion` abrir o item
  que o ⌘F achou, **o estado passou a morar na raiz**: ele controla o Radix
  sempre, com `defaultValue` como semente, e quem abre tira o `until-found`
  do conteúdo antes de o Radix medir (`revelar`). Medido: fechado, o
  conteúdo é `until-found` com 0px e o texto no DOM; o `beforematch` abre o
  item certo (32px) e deixa o outro fechado; fechando, volta a
  `until-found`. O `Collapsible` continua igual, medido depois da extração.
- **`icon` e `description`** no gatilho. Medido: ícone de 16px, a descrição
  colada ao rótulo (base do rótulo = topo da descrição), sublinhado só no
  rótulo, e o nome acessível com os espaços ("Mercado 4 transações · última
  em 12/03 −R$ 612,40") — o `textContent` sai colado, mas os blocos em flex
  contam como bloco no cálculo do nome.
- **`AccordionToggleAll`**: os itens se registram na raiz; o botão lê se
  todos estão abertos e troca o rótulo. Só no `multiple`. Medido: abre os 3,
  "Fechar todos", fecha os 3.
- **O conteúdo começava sob a seta** com `markerSide="start"`, 28px antes do
  rótulo que o encabeça — e o `icon` novo repetiu o defeito, visto na
  captura. O recuo virou uma soma de variáveis: a raiz publica a parcela da
  seta, o item com ícone publica a dele. Medido: diferença 0 nos três casos
  (sem nada, com a seta antes, com ícone).
- A página trocou os três acordeões da escada por um, com um segmentado de
  degrau (32 · 36 · 40, medidos), juntou o `trailing` ao ícone e à descrição
  numa seção só e somou estrutura com "abrir todos" e o ⌘F.

### Rodada 201 — o AlertDialog ganha o andamento, o ícone, a lista, o erro e o "digite para confirmar"

O dono pediu a rodada completa e escolheu as quatro versões.

- **Dez telas escreviam o andamento à mão** — `disabled={deleting}` nos dois
  botões, `e.preventDefault()` e `deleting ? "Excluindo…" : "Excluir"` (uma,
  a de membros, com um `Spinner` à mão) —, e **nenhuma segurava o Esc**:
  apertá-lo no meio da exclusão fechava a confirmação com a ação correndo.
  `pending` na raiz faz as três coisas e marca `aria-busy`; `pendingLabel` é
  o rótulo do andamento. A exclusão de conta (bills) nem tinha estado de
  andamento: o clique duplo disparava duas exclusões, e ela ganhou um.
  Medido: com `pending`, a ação mostra a roda e "excluindo…" e trava, o
  Cancelar trava, o Esc não fecha, e o diálogo fecha quando a ação termina.
- **A lista de consequências era `asChild` + `<div>` + `<ul list-disc>`**,
  em oito diálogos, porque a descrição era um `<p>` e uma lista não cabe num
  parágrafo. A `AlertDialogDescription` virou `<div>` (com 8px entre os
  parágrafos) e a lista é `AlertDialogList`, dentro dela — o leitor de tela a
  lê como parte do aviso (`aria-describedby` medido apontando para ela). O
  corpo compartilhado da exclusão de categoria virou um fragmento.
- **`AlertDialogError`**: os `<p className="text-sm text-destructive">` da
  saída e da exclusão de carteira, agora com `role="alert"`.
- **`AlertDialogMedia`**: o poço de 40 com o ícone de 20 do tom (lixeira no
  `destructive`). **O auditor tinha dois furos aqui**, e os dois foram
  consertados: lia `<AlertDialogContext.Provider>` como um ícone renderizado
  sem tamanho (o `= React.createContext` o fazia entrar como apelido, e o
  regex parava antes do ponto), e não via o ícone que sai de uma tabela
  indexada (`const Icone = MEDIA_ICONE[tone]`). A regra G continua em zero
  no projeto.
- **`AlertDialogConfirmInput`**: a ação trava até o texto conferir (sem
  espaços nas pontas), e o campo volta vazio ao reabrir — medido. A
  exclusão de carteira, que era um `Dialog` com uma `Sheet` à parte no
  telefone, o campo e a regra à mão e o Cancelar em `outline` (contra a
  hierarquia do rodapé), virou `AlertDialog size="lg"` com ele. Medido a
  375×667: 460px, sem rolar, a ação em cima da pilha.
- **O conteúdo ganhou um teto** (`100dvh − 2rem`, rolando): o `auto` do
  `Dialog` não tem, e a confirmação com campo podia sair da tela com o
  teclado do telefone aberto. Uma confirmação curta nunca o alcança.
- A página dizia que a superfície tinha "o vidro do cabeçalho", que não
  existe mais; foi corrigida, e as demonstrações foram reorganizadas: o
  padrão e o que não destrói lado a lado, o andamento de verdade (1,5s, com
  o Esc preso), a lista com o erro, e o "digite".
- As telas pedem login e não foram vistas; as peças foram medidas na página,
  nos dois temas e a 375px.
- **O ícone foi para a esquerda do texto**, a pedido do dono, depois de nascer
  em cima do título. O `AlertDialogHeader` vira uma grade de duas colunas
  quando tem `AlertDialogMedia` (`has-[>…]`), o ícone fica na primeira, preso
  ao topo, e todo o resto na segunda; ele ocupa as duas linhas só quando há
  descrição, senão o `gap` da linha vazia somaria 8px sob o título. Medido no
  desktop e a 375px: ícone em 0/0, título e descrição em 56px (40 + 16), e o
  campo de confirmar e o erro continuam na largura toda, fora do cabeçalho.
- **E o ícone mudou de desenho mais duas vezes, pelas referências do dono.**
  Primeiro ele pediu o ícone menor ao lado do texto, e trouxe uma referência:
  medida, ela era um poço de 44 com um glifo de **16** (o que encolhe é o
  glifo, não o poço), 16px até o texto e o centro do título no centro do
  poço — implementado e medido (centros a 22px). Depois trouxe outra, que ele
  julgou melhor, e é a que ficou: **sem poço**, o glifo de 16 na linha do
  título e na cor dele, 8px antes do título, e a descrição atravessando a
  largura toda embaixo, a partir da borda do ícone. A grade de duas colunas
  ficou; o título vai na segunda coluna e todo o resto atravessa as duas.
  Medido nos dois temas e a 375px: centros do ícone e do título a 8px, o
  título em 24px, a descrição em 0 com a largura do cabeçalho. O `tone`
  passou a escolher só o glifo. Os botões da referência (contorno e
  preenchido) não foram copiados: o rodapé segue a hierarquia do sistema.

### Rodada 202 — o Breadcrumb troca de irmão, volta no telefone, leva ícone e separador por nome

O dono pediu a rodada completa e escolheu as quatro versões.

- **A barra do app escrevia a trilha à mão** (`components/layout/
  breadcrumb.tsx`): um `Link`, um `ChevronRightIcon` e o `<h1>`, com
  `max-w-[45%]` no ancestral no lugar da regra do sistema (quem cede é o
  caminho, nunca o destino). Para migrar, o `BreadcrumbPage` ganhou
  `asChild`: a página atual da barra é o `<h1>` da tela. O mesmo arquivo
  exportava um `SubPageBackButton` que ninguém importava, e ele saiu.
- **`BreadcrumbSwitcher`**: a página atual com um menu dos irmãos, com
  `aria-current` no gatilho e o tique e `aria-current` no irmão de agora.
  **A primeira versão crescia a linha de 20 para 26px** — o recuo vertical e
  a borda transparente do `Button` —, e o gatilho passou a ter a caixa do
  texto (medido: 20). A seta gira ao abrir; uma captura no meio do giro
  parecia um defeito e não era (medida parada, `rotate: none`).
- **`collapse="back"`**: abaixo de `sm`, só "‹ Pai" (o link do degrau de
  cima, clonado com a seta); acima, a trilha inteira. A primeira versão
  embrulhava os degraus num `<span class="contents">`, que deixaria o `<ol>`
  com filhos que não são `<li>`; a classe passou a ir em cada degrau. Medido
  a 375px: só "‹ Segurança" visível, sem transbordo; no desktop, os três
  degraus.
- **`icon`** no `BreadcrumbLink` (16px no `md`, 14 no `sm`), e o degrau só
  com ícone leva o nome em `aria-label` — medido, a linha continua em 20.
- **`separator`** por nome: `chevron` (o padrão), `slash` e `dot` — a barra
  e o ponto em texto quieto (`/60`).
- A página deixou de dizer "telas de três níveis ou mais" (a barra do app
  usa trilhas de dois), juntou tamanho e separador numa seção só e ganhou o
  trocador e o voltar. A barra do app pede login e não foi vista; o teste
  da rodada confere a migração no fonte e a trilha renderizada.

### Rodada 203 — o Calendar ganha marcadores, agenda, o Hoje e os atalhos de intervalo

O dono pediu a rodada completa e escolheu as quatro versões.

- **O calendário de pagamentos do dashboard escrevia duas grades de mês à
  mão**: a do telefone com `<button>` crus, os pontos por tipo de evento em
  `after:` com cinco cores cruas (`bg-info`, `bg-warning`, `bg-primary`…
  escritas por classe longa) e o "hoje" num anel; a do desktop com células
  `min-h-24`, as fichas do dia e **um `Popover` por célula** (42 popovers
  montados). As duas viraram o `Calendar` — `markers` no telefone, `variant=
  "agenda"` no desktop —, com `weekStartsOn={1}` (a grade antiga começava na
  segunda), a navegação escondida (o mês vem de fora) e **um popover só**,
  ancorado no dia clicado por `virtualRef`, servindo os dois tamanhos. Os
  dias sem evento não abrem nada (antes eram `disabled`; aqui ficam
  focáveis e inertes, para não esmaecer o mês inteiro). Saíram o
  `buildCells`, a grade do telefone e as cinco classes de ponto.
- **`markers`**: os pontos viram modificadores do `react-day-picker`
  (`marker-0`…), até três por dia, na base da célula, com a legenda embaixo
  e os rótulos somados ao nome do dia ("5 de março de 2026, Assinatura,
  Parcela", medido). Os tons são os tokens semânticos, mais `primary` (o
  acento) e `default`.
- **Um furo medido**: a primeira versão desenhava os pontos e a agenda **no
  botão** do dia, e o `react-day-picker` só desenha o dia como botão quando
  a grade é interativa (`mode` ou `onDayClick`). Sem eles a célula recebe o
  número em texto — medido, a agenda da página saía só com "12" na célula.
  O miolo (`DiaConteudo`) passou a entrar também no dia estático
  (`components.Day`), e o nome dele usa `labelGridcell`.
- **`variant="agenda"`**: a célula alta, o número no canto (hoje numa
  pastilha `primary`) e o conteúdo por `renderDay`; o cabeçalho em versalete
  ganhou o mesmo vão de 4px das semanas (medido: alinhamento 0).
- **`showToday`** volta ao mês atual e marca o dia na escolha única
  (medido: de março a outubro de 2026, com o dia 1 marcado). **`presets`**
  põe os atalhos ao lado do intervalo, com o que coincide aceso, e dois
  meses no desktop (um no telefone, sem transbordo). O mês só passa a ser
  controlado pelo `Calendar` quando um dos dois existe — o `DatePicker`
  continua igual (medido: um mês, os seletores, fecha ao escolher).
- A página trocou os três calendários da escada por um com um segmentado
  de degrau (28 · 32 · 36, medidos). O dashboard pede login e não foi
  visto; o teste da rodada confere a migração no fonte e as peças
  renderizadas.


### Rodada 204 — o Card ganha estados, forma horizontal, link esticado, campo, mensagem e esqueleto

O pedido: o componente mais genérico do sistema com "bastante versões e
exemplos". Tudo o que entrou já existia escrito à mão em alguma tela.

- **`tone` entrou e saiu na mesma rodada.** O cartão tingido de estado
  (borda a 30% e a superfície `-muted`) ficou, na tela, igual ao `Alert`, e o
  dono pediu a remoção. Aviso é `Alert`: as notas da análise da fatura, que
  moram dentro de um cartão, viraram `Alert size="sm"`. Com ele saiu o
  `Omit<…, "tone">` que o `StatCard` precisou por um momento.
- **`inactive`** (`opacity-80`, `data-inactive`): as contas a pagar
  pausadas e o cartão de crédito desativado escreviam `opacity-[0.82]`.
- **`selected`**: o contorno de `--primary-accent` e a tinta de 5%/10%. O
  membro que é você usa, com `aria-current`.
- **`orientation="horizontal"`**: a `CardMedia` à esquerda (2/5, até 224px,
  sangrando) e o `CardBody` com o respiro do casco; empilha abaixo de `sm`.
- **`variant="dashed"`**: o lugar vazio. O histórico da conta e o passo do
  assistente de categorias desenhavam a caixa tracejada à mão.
- **`CardHeader media`**: a terceira coluna da grade, centrada nas duas
  linhas — e **só** ocupa duas linhas quando há descrição; sem ela a segunda
  linha vazia somava o `gap` sob o título (medido). Categorias, contas a
  pagar, plano atual e PWA migraram.
- **`CardTitle size`** (`sm` · **`md`** · `lg`): seis títulos escreviam
  `text-base` por cima.
- **`CardLink`**: o link esticado. O título leva o link (ou o botão que abre
  o detalhe) e o `::after` cobre o cartão; o casco, por `has-[]`, ergue os
  outros botões a `z-10` e acende sombra e anel de foco. Medido na página: o
  clique no meio do cartão cai no link, o botão do rodapé continua por cima.
  É o que os cartões de categoria (com menu) e de conta a pagar (com
  "pagar") precisavam e `interactive asChild` não podia dar — botão não
  aninha em link.
- **`CardField`**: o ladrilho rótulo/valor das três folhas de detalhe
  (transação, assinatura, evento do calendário, que tinha um `FieldCard`
  local). O rótulo é opcional, para as observações, que a seção já nomeia.
- **`CardMessage`**: o erro (`role="alert"`) ou o vazio curto; 15 trechos
  `CardContent py-6/py-8` em seis telas.
- **`CardSkeleton`**: o esqueleto do painel (barra, linhas, rodapé). Sem
  consumidor no app — os esqueletos de página têm formas próprias e passaram
  a vestir `Card` em vez de cascas locais (`CardSectionShell` saiu).
- **Limpeza**: 28 `p-0` mortos em `CardContent` sob `padding="none"`.
- **A página** foi reescrita: superfícies, marca, tom, ritmo, painel,
  cabeçalho com mídia, tamanho do título, rodapé, os dois clicáveis,
  estados, horizontal, capa, campos, mensagem, carregando, cinco exemplos
  completos e a anatomia. Verificada no Playwright, nos dois temas e a 375px.
- **Ficou de fora**: as linhas de link da segurança da conta (são linhas de
  lista, caso de `Item`) e o `dl` das faturas abertas do dashboard (outro
  desenho). As telas do app pedem login e não foram vistas; o teste confere
  as peças renderizadas e proíbe as grafias à mão.

### Rodada 205 — o Carousel ganha a grade no desktop, o arraste livre, a roda, a dissolução, a tela cheia e as peças de borda

O pedido: a mesma rodada para o `Carousel`, com as onze versões escolhidas
pelo dono. Ele continua com **zero consumidores no app** — nenhuma tela tem
tira horizontal escrita à mão para migrar (as faturas abertas do dashboard são
lista) —, então tudo foi verificado na página do catálogo.

- **`until="md" | "lg"`**: o `breakpoints` do embla com `active: false`, o
  trilho em `grid` de colunas de 16rem com o `gap` do carrossel (literal por
  degrau e calha), e as peças de controle com
  `group-data-[until=…]/carousel:…:hidden` — a raiz ganhou `group/carousel`.
  Medido a 1280: `display: grid`, sem transform, pontos escondidos; a 375,
  `flex` e pontos visíveis. O teclado e a roda conferem `matchMedia` e saem.
- **`snap="free"`** (`dragFree`) e **`CarouselProgress`**: o polegar mede
  viewport ÷ trilho e anda `progresso × (1/fração − 1)` larguras. Medido:
  52,7% de largura, de 0% a 89,9% depois de um arraste. Some quando tudo cabe.
- **`selectOnClick`, ligado**: em captura, o item cujo filho sai do viewport
  (o filho, porque o item carrega a calha e o primeiro começa 16px antes)
  engole o clique e o embla rola ao encaixe dele, achado no `slideRegistry`.
  Medido a 375: o clique em "Pagar fatura" do cartão cortado **não** chegou
  ao botão, e o cartão foi de 247–437 para 93–283, dentro de 41–334.
- **`wheel`, ligado**: um passo por gesto, acumulando 40px de `deltaX` e
  travando até 160ms de silêncio — a inércia do trackpad continua mandando
  eventos por quase um segundo. Só quando o gesto é mais horizontal que
  vertical. Medido: doze eventos de 30px passaram do item 1 ao 2, um só.
- **`effect="fade"`**: a `@utility carousel-effect-fade` desloca o **item**
  `−s` larguras (com `gap="none"` e `basis-full`, uma largura é um passo) e
  apaga por `d`; só o selecionado recebe o ponteiro. Medido: os três itens em
  `x = 440`, opacidades 1/0/0 e, depois da seta, 0/1/0. A asserção 13 do
  `carousel-ladder` passou a abrir a exceção, com o motivo.
- **`CarouselMore`**, **`CarouselSkeleton`**, **`CarouselStatus
  placement="overlay"`** e **`CarouselThumbs orientation="vertical"`** (o eixo
  troca pelo `breakpoints` do embla; medido 80×460 ao lado da foto).
- **`CarouselFullscreen`**: um `Dialog` com outro `Carousel` em
  `startIndex`, que devolve o índice com `scrollTo(i, true)`. Medido: abriu
  em "2 de 6", a seta do teclado foi a "3 de 6" com o foco no ×, e ao fechar
  a galeria estava em "3 de 6". **A placa modal é vidro** (85% no claro, 40%
  no escuro), e a primeira captura mostrou a página atrás da foto: a tela
  cheia declara `bg-background dark:bg-background`.
- **Comentário falso corrigido**: o cabeçalho do alvo de toque das setas dizia
  que o × da `AnnouncementBar` e os degraus do `Breadcrumb` estavam no backlog;
  os dois já tinham sido pagos.
- **A página tinha 30 carrosséis** e passou a 21: superfície, controles,
  calha, indicador, galeria, miniaturas e rotação viraram uma demo com um
  segmentado; o "Padrão" subiu para o topo; todo carrossel da página ganhou
  `aria-label`. Verificada a 1280 e a 375 no tema claro, e a galeria e a
  tela cheia no escuro — sem erros no console e sem transbordo.
