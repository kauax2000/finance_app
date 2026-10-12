/**
 * A régua do vidro — a superfície que a barra flutuante estreou e que qualquer
 * peça pode vestir.
 *
 * As classes de verdade moram em `globals.css`, na `@utility glass`, porque a
 * receita tem quatro camadas de fundo com dois `background-clip` diferentes e
 * precisa existir uma vez só para o sistema. Aqui ficam as combinações nomeadas
 * e — o que importa mais — **as três coisas que mordem quem vestir isto numa
 * superfície que já existe**. As três foram medidas, não previstas.
 *
 * ## 1. O shorthand `background` apaga o `background-color`
 *
 * A receita usa o shorthand para empilhar as quatro camadas com `padding-box` e
 * `border-box`, e o shorthand redefine a cor de fundo para o valor inicial.
 * Medido na barra: o `bg-sidebar` que continuava na string de classe resolvia
 * `rgba(0, 0, 0, 0)` sob a utility — código morto sem nenhum aviso.
 *
 * **Vestir vidro substitui o preenchimento da superfície; não soma a ele.** Uma
 * classe de fundo que sobreviva ao lado é sinal de que alguém achou que somava.
 *
 * ## 2. `border: 1px solid transparent` toma a borda
 *
 * O aro é pintado no `border-box`, então a peça precisa de uma borda para o aro
 * morar. Com `box-sizing: border-box` — o padrão do Tailwind — a caixa externa
 * não cresce: **o conteúdo encolhe 2px**. Numa superfície com filho absoluto
 * calibrado (o polegar de um switch em `inset-y-0.5`, por exemplo) isso desloca
 * 1px, e é o tipo de coisa que só aparece medindo.
 *
 * ## 3. O raio é herdado, e é isso que torna a peça portátil
 *
 * A utility **não declara `border-radius`**. Ela usa o do consumidor, então
 * `rounded-full` num controle e `rounded-xl` num painel funcionam sem eixo
 * nenhum. É a mesma decisão que a variante `plain` (antes `bare`) do `Command` registrou: um
 * número do contêiner copiado para dentro do componente é o defeito, e herdar é
 * o conserto.
 *
 * (Havia um modo material — `glass-material`, com os degraus `-thin` e
 * `-thick` — e um preset redondo, `glass-round`. Nenhuma peça os vestia, e
 * saíram com as constantes que os nomeavam.)
 *
 * ## O que a utility lê
 *
 * Seis tokens de tema (`--glass-tint`, `--glass-cloud`, `--glass-rim`,
 * `--glass-rim-shade`, `--glass-rim-far`, `--glass-rim-angle`) e duas variáveis de geometria com
 * fallback (`--glass-cloud-rx`, `--glass-cloud-ry`). O preset de controle
 * sobrescreve **só a variável**, nunca a propriedade — duas utilities
 * escrevendo `background` seriam decididas por ordem de emissão do Tailwind e
 * não pelo que se escreveu.
 */

/**
 * A superfície numa caixa pequena.
 *
 * **Porcentagem escala; percepção não.** A nuvem do painel é `100% 18%` — numa
 * placa de 424px são 76px de luz difusa, e num controle de 32px são **5,7px**,
 * que lê como aresta dura. A fração óptica é idêntica e o resultado não é; o
 * preset corrige a medida absoluta, e não a proporção.
 */
export const glassControlSurfaceClassName = "glass glass-control"

/*
 * **Onde morava o vidro da peça cheia.**
 *
 * `glassFillSurfaceClassName` e a `@utility glass-fill` serviram o
 * `Button variant="primary"`, e saíram com ele. Foram três desenhos em três
 * rodadas — gloss branco no corpo, depois anel claro na borda externa, depois
 * anel um pixel para dentro —, e os três foram reprovados na tela.
 *
 * **O que a medição deixou, e vale para a próxima tentativa:** um botão
 * preenchido com rótulo branco tem 0,72 de margem sobre o piso de 4,5, então
 * brilho branco no corpo reprova a partir de 8%; a luz cabe na faixa acima da
 * linha do texto, que nunca começa antes de 32% da altura; a aresta na própria
 * cor a +0.12 de L mede ~1,6 contra o corpo nos dois temas; e pintá-la na borda
 * **externa** deixa a silhueta 1px mais clara, o que se lê como o botão inteiro
 * mais claro.
 *
 * É a **segunda** vez que o vidro sai deste botão — a primeira foi quando ele
 * era peso próprio, com eixo de sete tons. As duas terminaram na tela, e não no
 * número.
 */


/*
 * Não há um `GLASS_SURFACES` aqui, e havia.
 *
 * Ele era um mapa `{ panel, control }` com um comentário dizendo que o catálogo
 * iterava a régua com ele — e o catálogo não iterava. Export morto com um
 * consumidor inventado na documentação é a pior das duas coisas: o eixo morava
 * num `cva` de `glass.tsx`, que é onde `cva` pode morar (a regra A2 do auditor o
 * reprova fora de `components/ui/`) — arquivo que também saiu.
 */

/**
 * ## O tom — vidro colorido
 *
 * O vidro apaga o `background-color` de quem o veste (armadilha nº 1), então
 * uma peça colorida não pode manter a `bg-*` dela: ela perderia a cor. O tom
 * entra pela **variável** `--glass-tone`, que a receita pinta como a camada de
 * cima, acima da lâmina.
 *
 * **A cor vem dos pares `-muted` que já existem**, e não de uma receita nova.
 *
 * **E o tom é opaco** — ou quase. Ele já foi translúcido — 75%/65% nos
 * semânticos —, e o efeito era medível: a lâmina abaixo dele compõe para
 * **rgb 2** sobre a página, então os 20% que atravessavam puxavam o corpo para
 * baixo. O avatar de vidro saía **20% mais escuro** que o opaco da mesma
 * identidade (41,2 contra 51,3 de média nas seis): a mesma pessoa lia com duas
 * cores conforme o material.
 *
 * Clarear a lâmina não resolvia — de 82% para 20% de preto o corpo só ia de
 * 41,2 para 42,4, porque a página atrás já é `rgb 10`. A alavanca era o alfa do
 * tom, e perto de 100% o corpo passa a ser praticamente **idêntico** ao da versão opaca.
 *
 * O que se perde é a translucidez do corpo, e o que ela deixava passar era a
 * lâmina preta — nada de útil. **Numa peça com tom as nuvens já chegavam a
 * 3,6%**: elas vivem no vidro *sem* cor, como a barra lateral. Aqui quem faz o
 * material é o aro. De brinde, o par `dark:` do tom sumiu, porque `-muted` e
 * `-surface` já são cientes de tema.
 *
 * `Badge soft` já usa `bg-{tom}-muted` com `text-{tom}-muted-foreground`, e o
 * par é calibrado em contraste nos dois temas. Reusá-lo dá duas coisas de
 * graça: a tinta certa para cada tom, e a inversão por tema — no claro
 * `--success-muted` é um verde pálido, no escuro é um verde escuro.
 *
 * É o mecanismo do `ColorTile`, que deriva superfície e tinta de uma cor de
 * runtime com percentual por tema — ele não veste mais vidro desde a rodada
 * 95, mas a conta continua sendo dele. A diferença é que aqui a cor não é de
 * runtime: são os sete tons do sistema.
 *
 * ## O aro e as nuvens também puxam a cor — mas por outra variável
 *
 * Cada entrada da tabela de tons (que saiu, abaixo) declarava `--glass-ink`, a
 * **fonte de matiz** que a `@utility glass` mistura no aro e nas nuvens, mais
 * `--glass-ink-amount: 20%`.
 *
 * **São duas variáveis, e não uma, porque dizem coisas diferentes**: o tom é
 * uma camada com alfa próprio que pinta o **corpo**; a tinta é só um matiz de
 * onde o material puxa cor, e a receita prende o alfa dela ao do neutro que ela
 * tinge.
 *
 * Este bloco já disse o contrário — *"ele não tinge o aro nem as nuvens; um aro
 * verde faria a peça ler como plástico pintado"*. **A objeção estava certa
 * sobre a mistura ingênua e errada sobre o tingimento.** Medido: misturar a cor
 * crua sobe o alfa junto com o matiz, e um aro a 45% ia de 0,341 para **0,635**
 * — 86% mais presente. É isso que lê como plástico: não a cor, a aresta ficar
 * mais pesada.
 *
 * **E quem resolve isso é o croma, não a dose.** O alfa da mistura depende só
 * da quantidade; o matiz depende do croma da tinta. Por isso a quantidade fica
 * baixa (20%) e a receita multiplica o croma (`--glass-ink-boost`, 4×): medido
 * no aro composto, com o alfa parado em 0,471, o espalhamento vai de **16,5**
 * para **56,8**. Três vezes e meia a cor pelo mesmo preço em presença.
 *
 * A regra que sobra: **cor se compra com croma; alfa é o que engrossa o
 * vidro.**
 *
 * A fonte é `--{tom}` e não `--{tom}-muted`: o matiz dele é idêntico nos dois
 * temas (166, 152, 78, 27), então basta **um** valor, sem `dark:`. Os `-muted`
 * invertem claridade entre os temas e exigiriam o par — como a identidade, que
 * o leva, porque ali o saturado é o `-surface` no claro e o `--identity-N` no
 * escuro.
 *
 * **`neutral` não precisa de exceção**: `--muted` é croma **0** nos dois temas,
 * e misturar cinza num branco não move matiz nenhum. Ele sai neutro por
 * construção, e não por um `if`.
 *
 * ## O que o tom não faz
 *
 * **Ele não some no `hover`.** Este é o achado que obriga o tom a ser
 * variável e não classe: as `bg-*` de estado (`hover:bg-*`, `active:bg-*`,
 * `data-[state=checked]:bg-*`) declaram **só `background-color`**, então o
 * shorthand da utility não as apaga — elas passam a pintar *atrás* das camadas
 * de gradiente, e com a lâmina a 82% o realce morre **calado**. Quem veste
 * vidro move o estado para `--glass-tone`, não para o fundo.
 */
/*
 * **Onde moravam os sete tons.**
 *
 * `GLASS_TONES`, `GLASS_TONE_INKS` e o tipo `GlassTone` viveram aqui enquanto o
 * vidro era um **peso próprio**: o `Badge` e o `Button` fechavam `variant`,
 * abriam um eixo `tone` e pintavam com os pares `-muted`. Os dois saíram — o
 * `Badge` perdeu o modo, e o `Button` passou a usar as cores do próprio variant
 * —, e a tabela ficou sem nenhum consumidor.
 *
 * A régua que sobra: **o vidro é acabamento sobre a cor da peça, e não uma
 * paleta paralela.** Quem veste vidro declara `--glass-tone` e `--glass-ink`
 * com a cor que já tem; não há tabela intermediária a consultar.
 */

/*
 * **Onde morava o realce de estado.**
 *
 * `glassInteractiveClassName` publicava `--glass-sheen` no `hover` e no
 * `active` — branco neutro, porque realce é a cor da **fonte de luz** e não do
 * material. Os consumidores eram o `Button` e o `Checkbox`, e os dois perderam
 * o modo de vidro; o export ficou sem ninguém.
 *
 * **A camada continua na `@utility`**, lida como
 * `var(--glass-sheen, transparent)`. Ela é ponto de contrato: hoje quem a
 * produz é o marcador de vidro do `Tabs`, que publica o realce da aba ativa
 * por variável.
 */

/**
 * Os seis tons de identidade, para o avatar de vidro (que saiu, abaixo).
 *
 * Eles não estavam em `GLASS_TONES` porque não são tons **semânticos**: identidade
 * distingue uma pessoa de outra e não significa estado. A régua do sistema
 * separa as duas famílias, e o vidro não é razão para juntá-las.
 *
 * A tinta continuava sendo `text-identity-N`, exatamente como no avatar normal —
 * o par já é calibrado, e o vidro só trocava a superfície opaca por uma lâmina.
 */
/* `GLASS_IDENTITY_TONES` morou aqui: o avatar de vidro. Saiu quando o avatar
 * passou a ter duas versões só (foto, ou iniciais sobre degradê de marca) —
 * ver `components/ui/avatar.tsx`. As medições dele estão no histórico. */

/*
 * ## As tintas de vidro por papel
 *
 * A casa tem três placas de vidro, e elas moram aqui juntas: a **barra**
 * (conteúdo passando por baixo: o cabeçalho, a fileira de menus), a
 * **flutuante** (a placa pequena ancorada sobre o conteúdo) e a **modal** (a
 * placa grande sobre o véu). Moravam em três arquivos — uma delas como alias
 * de outra —, e é por isso que a flutuante pôde virar a barra sem que ninguém
 * visse as duas lado a lado. As três vestem a `@utility glass-surface`; o que
 * as separa é o token e o alfa.
 */

/**
 * A superfície de uma **barra de chrome** — a que tem conteúdo passando por
 * baixo dela.
 *
 * A barra é uma das três tintas desta seção, e as três são diferentes de
 * propósito: a barra (`--background` 95/60), a flutuante (`--popover` 85/60) e
 * a modal (`--background` 85/40). O material é o mesmo nas três — a
 * `@utility glass-surface`, dona de uma propriedade só (`backdrop-filter`:
 * 24px e `saturate(1.5)`, com o guarda de `prefers-reduced-transparency`).
 *
 * Ela **não é nova**: é a receita que o cabeçalho do catálogo já rodava, e que
 * estava escrita à mão lá. Extrair é o precedente das outras duas, e é o que
 * impede a quarta cópia da mesma forma.
 *
 * ## As três escolhas, e por que cada uma diverge
 *
 * - **`--background`, e não `--popover`.** No tema escuro `--popover` e `--card`
 *   são a mesma cor (`oklch(0.205)`): uma barra `--popover` pousada num cartão
 *   sumiria. Quem define uma barra é o contraste contra a superfície em que ela
 *   pousa, e não a elevação.
 * - **95 de base, e não 85.** Sem `backdrop-filter` os 60% deixariam o conteúdo
 *   passar por trás do rótulo — e o fallback tem de ser legível sozinho. Opaco
 *   de base; translúcido só onde o borrão existe.
 * - **Sem `dark:`.** Ao contrário das outras duas, ela abre nos dois temas. No
 *   claro o efeito é quase nulo (`--background` 250 composto sobre `--card` 255
 *   dá Δ2), e isso é dito em vez de escondido: no tema claro o vidro quase não
 *   se paga, e é o mesmo teto que a rodada 47 já mediu.
 *
 * ## E ela só desenha onde há o que borrar
 *
 * `backdrop-filter` sobre cor chapada não desenha nada — a lei que
 * `globals.css` escreve. Uma barra sobre um cartão liso sai igual à opaca; o
 * material aparece quando o conteúdo passa por baixo, que é o caso do
 * cabeçalho fixo e o da fileira de menus no topo de uma região que rola.
 */
export const barSurfaceClassName = [
  "bg-background/95 glass-surface",
  "supports-backdrop-filter:bg-background/60",
  /** A cor sólida é de quem veste — a utility é dona de uma propriedade só. */
  "reduced-transparency:bg-background",
].join(" ")

/**
 * A tinta da **placa flutuante** — `Popover`, `Select`, `DropdownMenu`,
 * `ContextMenu`, `Menubar`, `HoverCard`, `Tooltip`, `Command` e o calendário
 * do `DatePicker`. Só a tinta e o material, sem raio, sombra nem fio: quem
 * quer a casca inteira veste `menuPanelSurfaceClassName`, em `menu-classes`.
 *
 * **`--popover` a 85%, abrindo a 60% no escuro onde o borrão existe.** É a
 * receita de antes da rodada `9f0ba8a`, que a tinha trocado pela da barra
 * (`--background` 95/60) para a placa se separar do cartão — `--popover` e
 * `--card` são a mesma cor, e 60% de uma cor sobre ela mesma é ela mesma. A
 * troca funcionava na medição e lia errado na tela: `--background` é mais
 * escuro que o cartão, e a placa virava uma chapa escura sem vidro nenhum. O
 * dono pediu a de antes de volta (rodada 132), sabendo o custo: **sobre um
 * cartão a placa se confunde com ele**, e quem a separa é o anel e a sombra.
 */
export const menuPanelTintClassName = [
  "bg-popover/85 glass-surface",
  "supports-backdrop-filter:dark:bg-popover/60",
  /** A cor sólida é de quem veste — a utility é dona de uma propriedade só. */
  "reduced-transparency:bg-popover",
].join(" ")

/**
 * A superfície das peças modais — uma só, para as quatro. **Não é** a da
 * superfície flutuante: esta pinta `--background`, aquela `--popover`.
 *
 * `Dialog`, `AlertDialog`, `Sheet` e `Drawer` pintam a mesma
 * placa. Ela já esteve escrita no `cva` do `dialog.tsx` mais `bg-background`
 * cru nos outros três arquivos, e extrair é o precedente de
 * [`menuPanelSurfaceClassName`](./menu-classes.ts): classe compartilhada é
 * `lib/`, sem `cva` (a regra A2 do auditor).
 *
 * ## `--background`, e não `--popover` — e a tela é que decidiu
 *
 * A flutuante é `--popover` (0.205); esta é `--background` (0.145). Uma rodada
 * as igualou em `--popover` para "todas ficarem iguais ao DatePicker", e o
 * resultado foi visto e reprovado: **a placa passou a ler como opaca**. A
 * conta explica — `--popover` a 60% sobre a página velada (~0.10) compõe para
 * ~0.16, bem acima de tudo que está atrás, então nada atravessa e o vidro some.
 * `--background` a 60% compõe para ~0.13, quase o próprio fundo velado: a placa
 * afunda no véu e o borrão é o que a distingue. Para um modal, que cobre a
 * página inteira, é este o tom que lê como material; o `--popover` é da
 * superfície pequena sobre conteúdo. A paleta (`CommandDialog`) é a exceção e
 * veste o tom do popover por cima — ela é uma superfície de comandos, não um
 * diálogo.
 *
 * ## O material é o do iOS, e aqui ele tem o véu atrás
 *
 * E a placa abre mais que a flutuante no escuro — 40% contra 60%. A 60% ela
 * lia como fosca sobre a página; a tela decidiu, com a sonda a 40% ao lado.
 *
 * O `backdrop-filter` renderiza na placa modal (não há wrapper transformado
 * acima dela), e o que ele vê é o `--overlay` a 40% mais a página: medido,
 * delta 0 sobre um card, 2 sobre a página, 15 sobre um botão `primary` no
 * escuro. Quem quiser o efeito mais visível mexe no véu (rodada 52c), não aqui.
 *
 * **E nenhuma tira pinta por cima dela.** Cor com alfa não tem "cor cheia"
 * pintável: um degradê opaco numa tira era mais claro que a
 * placa a 60% e saía como banda no topo da gaveta — medido. As tiras são
 * irmãs do corpo, que se mascara sozinho; o fundo delas já é a placa.
 */
export const modalSurfaceClassName = [
  "bg-background/85 glass-surface",
  // 40% no escuro, e não os 60% da flutuante: a placa modal cobre página quase
  // uniforme, e a 60% ela lia como fosca — visto na tela, e escolhido contra a
  // sonda a 40% lado a lado. Medido a 40%: `--muted-foreground` sobre a placa
  // sobre um botão `primary` dá 5,61, sobre um card 7,57. O claro fica em 85%,
  // onde 4,38 já é o teto (rodada 51c).
  "supports-backdrop-filter:dark:bg-background/40",
  /** A cor sólida é de quem veste — a utility é dona de uma propriedade só. */
  "reduced-transparency:bg-background",
].join(" ")
