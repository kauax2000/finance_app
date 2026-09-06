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
 * `Badge soft` já usa `bg-{tom}-muted` com `text-{tom}-muted-foreground`, e o
 * par é calibrado em contraste nos dois temas. Reusá-lo dá duas coisas de
 * graça: a tinta certa para cada tom, e a inversão por tema — no claro
 * `--success-muted` é um verde pálido, no escuro é um verde escuro.
 *
 * É o mecanismo do `ColorTile`, que deriva superfície e tinta de uma cor de
 * runtime com percentual por tema. A diferença é que aqui a cor não é de
 * runtime: são os sete tons do sistema.
 *
 * ## Duas coisas que o tom **não** faz
 *
 * **Ele não tinge o aro nem as nuvens.** Vidro colorido tinge o *corpo*; o
 * reflexo da aresta é a luz do ambiente, não a cor do material. Um aro verde
 * faria a peça ler como plástico pintado, e não como vidro.
 *
 * **E ele não some no `hover`.** Este é o achado que obriga o tom a ser
 * variável e não classe: as `bg-*` de estado (`hover:bg-*`, `active:bg-*`,
 * `data-[state=checked]:bg-*`) declaram **só `background-color`**, então o
 * shorthand da utility não as apaga — elas passam a pintar *atrás* das camadas
 * de gradiente, e com a lâmina a 82% o realce morre **calado**. Quem veste
 * vidro move o estado para `--glass-tone`, não para o fundo.
 */
/*
 * Os sete tons, **escritos por extenso**.
 *
 * A forma é sempre a mesma — `color-mix(in oklab, var(--{tom}-muted) N%,
 * transparent)`, com N maior no claro que no escuro —, e ainda assim cada um é
 * literal. **Uma classe montada em tempo de execução não existe**, porque o
 * Tailwind varre o código como texto.
 *
 * Isto foi verificado ao escrever este próprio arquivo: houve aqui um helper
 * `tomEm(cor, claro, escuro)` que devolvia a string por interpolação, com um
 * comentário dizendo que ele era só documentação da forma. **A asserção 10 de
 * `glass.test.ts` o reprovou** — e com razão: um helper desses no arquivo é um
 * convite a alguém usá-lo, e aí as classes somem do CSS sem nada quebrar. Este
 * projeto já pagou essa medição cinco vezes.
 */
export const GLASS_TONES = {
    primary:
        "[--glass-tone:color-mix(in_oklab,var(--primary-muted)_75%,transparent)] dark:[--glass-tone:color-mix(in_oklab,var(--primary-muted)_65%,transparent)]",
    neutral:
        "[--glass-tone:color-mix(in_oklab,var(--muted)_75%,transparent)] dark:[--glass-tone:color-mix(in_oklab,var(--muted)_65%,transparent)]",
    success:
        "[--glass-tone:color-mix(in_oklab,var(--success-muted)_75%,transparent)] dark:[--glass-tone:color-mix(in_oklab,var(--success-muted)_65%,transparent)]",
    warning:
        "[--glass-tone:color-mix(in_oklab,var(--warning-muted)_75%,transparent)] dark:[--glass-tone:color-mix(in_oklab,var(--warning-muted)_65%,transparent)]",
    destructive:
        "[--glass-tone:color-mix(in_oklab,var(--destructive-muted)_75%,transparent)] dark:[--glass-tone:color-mix(in_oklab,var(--destructive-muted)_65%,transparent)]",
    income: "[--glass-tone:color-mix(in_oklab,var(--income-muted)_75%,transparent)] dark:[--glass-tone:color-mix(in_oklab,var(--income-muted)_65%,transparent)]",
    expense:
        "[--glass-tone:color-mix(in_oklab,var(--expense-muted)_75%,transparent)] dark:[--glass-tone:color-mix(in_oklab,var(--expense-muted)_65%,transparent)]",
} as const

export type GlassTone = keyof typeof GLASS_TONES

/**
 * A tinta que acompanha cada tom.
 *
 * É a mesma do `Badge soft`, e é por isso que ela não precisa ser medida de
 * novo: o par `{tom}-muted` / `{tom}-muted-foreground` já é calibrado.
 */
export const GLASS_TONE_INKS = {
    primary: "text-primary-muted-foreground",
    neutral: "text-muted-foreground",
    success: "text-success-muted-foreground",
    warning: "text-warning-muted-foreground",
    destructive: "text-destructive-muted-foreground",
    income: "text-income-muted-foreground",
    expense: "text-expense-muted-foreground",
} as const

/**
 * O realce de estado, para uma superfície de vidro que se clica.
 *
 * **`hover:bg-*` não funciona sobre vidro, e falha calado.** Aquelas classes
 * declaram só `background-color`; o shorthand da utility não as apaga, então
 * elas passam a pintar *atrás* das camadas de gradiente — com a lâmina a 82%,
 * o realce não aparece e nada avisa. Quem veste vidro move o estado para
 * `--glass-sheen`.
 *
 * **Ele é branco neutro, e não o tom.** Assim uma variável serve os sete tons e
 * os dois temas, e o realce lê como o material pegando mais luz em vez de mudar
 * de cor. É o idioma do `bg-current/N` da barra, com a diferença de que aqui
 * ele é sempre luz: vidro não escurece ao ser tocado.
 *
 * O par `active:` não é opcional — `hover:` compila dentro de
 * `@media (hover: hover)` e não existe no dedo.
 */
export const glassInteractiveClassName =
    "hover:[--glass-sheen:oklch(1_0_0/9%)] active:[--glass-sheen:oklch(1_0_0/14%)]"

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
    "[--glass-tone:color-mix(in_oklab,var(--identity-1-surface)_80%,transparent)]",
    "[--glass-tone:color-mix(in_oklab,var(--identity-2-surface)_80%,transparent)]",
    "[--glass-tone:color-mix(in_oklab,var(--identity-3-surface)_80%,transparent)]",
    "[--glass-tone:color-mix(in_oklab,var(--identity-4-surface)_80%,transparent)]",
    "[--glass-tone:color-mix(in_oklab,var(--identity-5-surface)_80%,transparent)]",
    "[--glass-tone:color-mix(in_oklab,var(--identity-6-surface)_80%,transparent)]",
] as const
