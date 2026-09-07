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
export const GLASS_IDENTITY_TONES = [
    "[--glass-tone:var(--identity-1-surface)] [--glass-ink:var(--identity-1-surface)] dark:[--glass-ink:var(--identity-1)] [--glass-ink-amount:20%]",
    "[--glass-tone:var(--identity-2-surface)] [--glass-ink:var(--identity-2-surface)] dark:[--glass-ink:var(--identity-2)] [--glass-ink-amount:20%]",
    "[--glass-tone:var(--identity-3-surface)] [--glass-ink:var(--identity-3-surface)] dark:[--glass-ink:var(--identity-3)] [--glass-ink-amount:20%]",
    "[--glass-tone:var(--identity-4-surface)] [--glass-ink:var(--identity-4-surface)] dark:[--glass-ink:var(--identity-4)] [--glass-ink-amount:20%]",
    "[--glass-tone:var(--identity-5-surface)] [--glass-ink:var(--identity-5-surface)] dark:[--glass-ink:var(--identity-5)] [--glass-ink-amount:20%]",
    "[--glass-tone:var(--identity-6-surface)] [--glass-ink:var(--identity-6-surface)] dark:[--glass-ink:var(--identity-6)] [--glass-ink-amount:20%]",
] as const
