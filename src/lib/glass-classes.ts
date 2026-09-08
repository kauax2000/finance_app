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
 * ## 4. O modo material exige conteúdo atrás
 *
 * Esta é a única das quatro que não é de mecânica. `glass-material` abre a
 * lâmina para o borrão aparecer — e onde não há nada por baixo, o borrão não
 * desenha nada e a abertura só enfraquece a peça. A régua de escolha é a mesma
 * que `globals.css` escreve entre os dois vidros da casa, e ela é por premissa.
 *
 * ## 3. O raio é herdado, e é isso que torna a peça portátil
 *
 * A utility **não declara `border-radius`**. Ela usa o do consumidor, então
 * `rounded-full` num controle e `rounded-xl` num painel funcionam sem eixo
 * nenhum. É a mesma decisão que a variante `bare` do `Command` registrou: um
 * número do contêiner copiado para dentro do componente é o defeito, e herdar é
 * o conserto.
 *
 * ## O que a utility lê
 *
 * Cinco tokens de tema (`--glass-tint`, `--glass-cloud`, `--glass-rim`,
 * `--glass-rim-shade`, `--glass-rim-angle`) e duas variáveis de geometria com
 * fallback (`--glass-cloud-rx`, `--glass-cloud-ry`). O preset de controle
 * sobrescreve **só a variável**, nunca a propriedade — duas utilities
 * escrevendo `background` seriam decididas por ordem de emissão do Tailwind e
 * não pelo que se escreveu.
 */

/** A superfície, na medida de painel. É o padrão. */
export const glassSurfaceClassName = "glass"

/**
 * A superfície numa caixa pequena.
 *
 * **Porcentagem escala; percepção não.** A nuvem do painel é `100% 18%` — numa
 * placa de 424px são 76px de luz difusa, e num controle de 32px são **5,7px**,
 * que lê como aresta dura. A fração óptica é idêntica e o resultado não é; o
 * preset corrige a medida absoluta, e não a proporção.
 */
export const glassControlSurfaceClassName = "glass glass-control"

/**
 * O modo material — o vidro com **borrão de verdade**, nos três degraus do iOS.
 *
 * **Ele tem premissa, e ela é o oposto da do pintado.** A receita base desenha
 * a luz porque parte de que não há conteúdo atrás; este modo parte de que há.
 * Ligá-lo onde nada passa por baixo — a placa flutuante, que reserva a própria
 * calha — não desenha nada **e** abre a lâmina, deixando a peça pior do que o
 * pintado. É a quarta armadilha, e a única que não é de mecânica: é de
 * julgamento.
 *
 * O que separa os degraus é a opacidade da lâmina, e não o raio: um material
 * mais fino deixa passar mais do que está atrás. É como o iOS os separa.
 *
 * As nuvens **saem** no modo — elas simulam luz atrás de uma placa que não tem
 * nada atrás, e com conteúdo real e borrado ali o simulacro disputa com a
 * coisa. Quem mantém a peça lendo como vidro é o aro.
 */
export const GLASS_MATERIALS = {
    thin: "glass-material glass-material-thin",
    regular: "glass-material",
    thick: "glass-material glass-material-thick",
} as const

export type GlassMaterial = keyof typeof GLASS_MATERIALS

/**
 * A superfície numa peça **redonda**.
 *
 * Ela existe por um defeito medido: o aro é um gradiente **linear**, e num
 * círculo as duas pontas dele — o pico e o extremo aceso — caem nos **cantos**
 * da caixa, que ali não existem. Amostrando 720 pontos do perímetro de um
 * avatar de 40px: **0%** via o pico, e **57,5%** via só o vale. O vidro redondo
 * nunca teve brilho.
 *
 * O preset troca o aro por um `conic-gradient`, que acompanha o perímetro, e
 * acende o especular na camada de cima — a única que sobrevive a um tom opaco.
 *
 * **Ela se soma à de controle, não a substitui:** `glass glass-control
 * glass-round`. O `glass-control` corrige a medida absoluta da nuvem; este
 * corrige a forma do aro. São eixos diferentes, e o `ColorTile` — que é
 * `rounded-md` — usa só o primeiro.
 */
export const glassRoundSurfaceClassName = "glass glass-control glass-round"

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
 * consumidor inventado na documentação é a pior das duas coisas: o eixo mora no
 * `cva` de `glass.tsx`, que é onde `cva` pode morar (a regra A2 do auditor o
 * reprova fora de `components/ui/`), e ele lê as duas constantes acima.
 */

/**
 * ## O tom — vidro colorido
 *
 * O vidro apaga o `background-color` de quem o veste (armadilha nº 1), então
 * uma peça colorida não pode manter a `bg-*` dela: ela perderia a cor. O tom
 * entra pela **variável** `--glass-tone`, que a receita pinta como a camada de
 * cima, acima da lâmina.
 *
 * **A cor vem dos pares `-muted` que já existem**, e não de uma receita nova. O
 * **E o tom é opaco.** Ele já foi translúcido — 75%/65% nos semânticos, 80% na
 * identidade —, e o efeito era medível: a lâmina abaixo dele compõe para
 * **rgb 2** sobre a página, então os 20% que atravessavam puxavam o corpo para
 * baixo. O avatar de vidro saía **20% mais escuro** que o opaco da mesma
 * identidade (41,2 contra 51,3 de média nas seis): a mesma pessoa lia com duas
 * cores conforme o material.
 *
 * Clarear a lâmina não resolvia — de 82% para 20% de preto o corpo só ia de
 * 41,2 para 42,4, porque a página atrás já é `rgb 10`. A alavanca era o alfa do
 * tom, e a 100% o corpo passa a ser **idêntico** ao da versão opaca.
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
 * runtime com percentual por tema. A diferença é que aqui a cor não é de
 * runtime: são os sete tons do sistema.
 *
 * ## O aro e as nuvens também puxam a cor — mas por outra variável
 *
 * Cada entrada declara `--glass-ink`, a **fonte de matiz** que a
 * `@utility glass` mistura no aro e nas nuvens, mais `--glass-ink-amount: 20%`.
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
 * `var(--glass-sheen, transparent)`. Ela é ponto de contrato, não código morto:
 * hoje não há produtor, e a primeira peça de vidro **clicável** que aparecer
 * volta a precisar dela. As duas que sobraram — `Avatar` e `ColorTile` — não
 * são clicáveis.
 */

/**
 * Os seis tons de identidade, para o avatar de vidro.
 *
 * Eles não estão em `GLASS_TONES` porque não são tons **semânticos**: identidade
 * distingue uma pessoa de outra e não significa estado. A régua do sistema
 * separa as duas famílias, e o vidro não é razão para juntá-las.
 *
 * A tinta continua sendo `text-identity-N`, exatamente como no avatar normal —
 * o par já é calibrado, e o vidro só troca a superfície opaca por uma lâmina.
 */
/*
 * **O tom abre, e o que passa por baixo é a lâmina — não a página.**
 *
 * Ele foi a 100% na rodada 44 por uma razão medida: a 80% o avatar de vidro
 * saía 20% mais escuro que o opaco da mesma identidade. O efeito colateral que
 * aquela rodada anotou pela metade é que, **opaco, ele apaga as quatro camadas
 * de luz** — lâmina e nuvens ficam por baixo dele e não pintam nada.
 *
 * **A abertura é diferente por tema, e o número saiu do contraste.** Ela compõe
 * com a lâmina, que troca de polaridade: no escuro é preta e o corpo afunda; no
 * claro é branca e ele **sobe**, empurrando as iniciais para perto do piso.
 *
 * Varridos os seis tons no claro contra os 4,5:1 da norma: a 92% dois deles
 * reprovam (4,48 e **4,37**), a 97% um deles ainda cai a **4,47** no ponto
 * em que a letra encontra o especular, e **98%** é a abertura máxima que passa.
 * No escuro os 92% passam com folga: 6,36 a 6,80 no centro e 5,93 no pior ponto
 * onde há letra, com desvio de 4,5 unidades contra o opaco.
 *
 * Ou seja: **no claro a abertura quase não se paga**, e é o contraste que manda.
 * É a mesma assimetria que os degraus do material encontraram — a lâmina e a
 * tinta andam em direções opostas nos dois temas.
 */
export const GLASS_IDENTITY_TONES = [
    "[--glass-tone:color-mix(in_srgb,var(--identity-1-surface)_98%,transparent)] dark:[--glass-tone:color-mix(in_srgb,var(--identity-1-surface)_92%,transparent)] [--glass-ink:var(--identity-1-surface)] dark:[--glass-ink:var(--identity-1)] [--glass-ink-amount:20%]",
    "[--glass-tone:color-mix(in_srgb,var(--identity-2-surface)_98%,transparent)] dark:[--glass-tone:color-mix(in_srgb,var(--identity-2-surface)_92%,transparent)] [--glass-ink:var(--identity-2-surface)] dark:[--glass-ink:var(--identity-2)] [--glass-ink-amount:20%]",
    "[--glass-tone:color-mix(in_srgb,var(--identity-3-surface)_98%,transparent)] dark:[--glass-tone:color-mix(in_srgb,var(--identity-3-surface)_92%,transparent)] [--glass-ink:var(--identity-3-surface)] dark:[--glass-ink:var(--identity-3)] [--glass-ink-amount:20%]",
    "[--glass-tone:color-mix(in_srgb,var(--identity-4-surface)_98%,transparent)] dark:[--glass-tone:color-mix(in_srgb,var(--identity-4-surface)_92%,transparent)] [--glass-ink:var(--identity-4-surface)] dark:[--glass-ink:var(--identity-4)] [--glass-ink-amount:20%]",
    "[--glass-tone:color-mix(in_srgb,var(--identity-5-surface)_98%,transparent)] dark:[--glass-tone:color-mix(in_srgb,var(--identity-5-surface)_92%,transparent)] [--glass-ink:var(--identity-5-surface)] dark:[--glass-ink:var(--identity-5)] [--glass-ink-amount:20%]",
    "[--glass-tone:color-mix(in_srgb,var(--identity-6-surface)_98%,transparent)] dark:[--glass-tone:color-mix(in_srgb,var(--identity-6-surface)_92%,transparent)] [--glass-ink:var(--identity-6-surface)] dark:[--glass-ink:var(--identity-6)] [--glass-ink-amount:20%]",
] as const
