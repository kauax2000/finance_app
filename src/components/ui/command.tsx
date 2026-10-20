"use client"

import * as React from "react"
import { ArrowUpRightIcon, PlusIcon, XMarkIcon } from "@heroicons/react/16/solid"
import { cva, type VariantProps } from "class-variance-authority"
import { Command as CommandPrimitive, useCommandState } from "cmdk"
import { animate, useReducedMotion, type AnimationPlaybackControls } from "motion/react"

import { SearchInput } from "@/components/ui/search-input"
import { Kbd } from "@/components/ui/kbd"
import { Button } from "@/components/ui/button"
import { MOLA, SAIDA, SEPARACAO } from "@/lib/spring"
import { ACOPLAMENTO_Y } from "@/lib/liquid-move"
import { lerp, preso, suave, TINTA_DO_VOO } from "@/lib/header-morph"
import { useIsMobile } from "@/hooks/use-mobile"
import { ehCursor } from "@/lib/pointer"
import { cn } from "@/lib/utils"
import { ariaShortcut, matchShortcut } from "@/lib/shortcut"
import { Caption, P } from "@/components/ui/typography"
import {
  menuItemGeometryClassName,
  menuSeparatorClassName,
  menuItemFadeClassName, menuPanelTintClassName } from "@/lib/menu-classes"
import { modalSurfaceClassName } from "@/lib/glass-classes"
import { searchFieldSurfaceClassName } from "@/lib/search-field-classes"
import {
  scrollFadeBandsClassName,
  scrollFadeBleedClassName,
  scrollFadeViewportClassName,
} from "@/lib/scroll-fade-classes"
import { useScrollFade } from "@/hooks/use-scroll-fade"
import { ScrollFadeArrows } from "@/lib/scroll-fade-arrows"
import { useCommandIdleSelection } from "@/hooks/use-command-idle-selection"
import { Dialog as DialogPrimitive } from "radix-ui"
import {
  Dialog,
  DialogCloseButton,
  DialogDescription,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  overlayClassName,
} from "@/components/ui/dialog"
/**
 * O eixo é a moldura (quem desenha a borda), não só o raio. `plain` (padrão) é
 * o caso do `Combobox`: dentro do anel do popover, uma segunda borda faria duas
 * linhas a 1px. Solta numa página a moldura é da própria paleta (`panel`);
 * dentro de um `CommandDialog` é do `DialogContent`.
 *
 * `CommandPages` + `CommandPage` + `useCommandPages` são as sub-páginas (a
 * trilha no campo como `CommandScope`, Backspace com o campo vazio volta em dois
 * toques); `CommandHighlight` negrita o trecho que casou; `CommandSplit` +
 * `CommandPreview` é a coluna da linha selecionada (some abaixo de `md`);
 * `CommandGroup count`; `CommandItem shortcut` dispara a ação com o foco na
 * paleta. No telefone o `CommandDialog` é a barra: a pílula nasce da lupa
 * (`origin`) e se estica até a largura, com o teclado aberto. Os ganchos
 * `useCommandRecents` e `useCommandSearch` moram em `hooks/`.
 */
const commandVariants = cva(
  [
    // O `Command` hospedado não pinta, quem pinta é a casca: num `Popover`
    // seriam duas placas a 60% empilhadas (regra "uma placa por superfície" de
    // `lib/menu-classes`). Só a variante `panel` pinta a própria.
    // `relative` é estrutural: as camadas de borrão das pontas são irmãs
    // absolutas do rolável, e o `overflow-hidden` as apara no canto.
    "relative flex size-full flex-col overflow-hidden text-popover-foreground",
    "[--command-list-max-h:--spacing(72)]",
    // A casca só publica as duas medidas estruturais (ela é a única que vê as
    // faixas como irmãs do rolável); a dissolução mora na própria lista. A
    // altura da faixa de busca é campo (32) + recuo (16).
    //
    // As duas são condicionais à presença da faixa, nunca à rolagem: demos
    // montam `CommandList` sem `CommandInput`, e condicionar o rodapé a
    // `data-scrollable` realimentava a condição (`pb` é `foot-h + 4`, então
    // declarar "rola" acrescentava 36px ao conteúdo).
    scrollFadeBandsClassName,
    "has-[[data-slot=command-input-wrapper]]:[--scroll-fade-band-h:calc(--spacing(8)+--spacing(4))]",
    // O campo `lg` (36) publica a própria faixa; o `:has()` com dois atributos pesa mais que o de um.
    "has-[[data-slot=command-input-wrapper][data-size=lg]]:[--scroll-fade-band-h:calc(--spacing(9)+--spacing(4))]",
    // O campo com piso de toque sobe a 40 no dedo e a faixa acompanha (40 + 16);
    // três atributos no `:has()` vencem os dois do `lg`.
    "pointer-coarse:has-[[data-slot=command-input-wrapper][data-touch-floor][data-size]]:[--scroll-fade-band-h:calc(--spacing(11)+--spacing(4))]",
  ],
  {
    variants: {
      variant: {
        /** Sem moldura e sem canto próprio: ele herda o de quem contém (popover, diálogo), sem copiar um número do contêiner. */
        plain: "[border-radius:inherit]",
        /**
         * A pilha: a raiz é uma coluna que não pinta, e cada peça pinta a sua
         * superfície (pílula de busca, placa da lista, cápsulas da legenda, a
         * 12px uma da outra, no mesmo plano). `overflow-visible` devolve o que a
         * base recorta (o anel da pílula fica fora da caixa).
         */
        panel: "gap-3 overflow-visible [--command-reveal:var(--duration-spring)]",
      },
      /**
       * A densidade da pilha: `palette` (pílula de 36, linhas de 36, respiro
       * largo) ou `menu` (pílula de 32, linhas de 28; sem consumidor hoje).
       */
      density: {
        palette: "",
        menu: "gap-1",
      },
    },
    defaultVariants: { variant: "plain", density: "palette" },
  }
)

/** Se a peça está na pilha (`Command variant="panel"`, a do `CommandDialog` e da paleta solta); na pilha campo, lista, grupo e linha vestem as três superfícies. */
const CommandStackContext = React.createContext<"palette" | "menu" | null>(null)

/** Se a pilha está num `CommandDialog`: o único lugar que acende o feixe da pílula, e onde as três peças vestem o fundo do `Dialog` (`modalSurfaceClassName`). */
const CommandBeamContext = React.createContext(false)

/**
 * `autoSelectFirst={false}` abre a paleta sem nada selecionado (mecanismo em
 * [`use-command-idle-selection`](src/hooks/use-command-idle-selection.ts)). O
 * padrão é `true`, o que serve o `Combobox` (um seletor de valor); o
 * `CommandDialog`, destino de busca, liga o modo ocioso. Ele é dono do `value`:
 * um `value` controlado por fora seria sobrescrito, por isso o hook devolve `{}`
 * quando desligado.
 */
function Command({
  className,
  variant,
  density,
  autoSelectFirst = true,
  children,
  ...props
}: React.ComponentProps<typeof CommandPrimitive> &
  VariantProps<typeof commandVariants> & {
    /** Abrir com a primeira linha já selecionada. `false` = modo ocioso. */
    autoSelectFirst?: boolean
  }) {
  const resolvida = variant ?? "plain"
  const pilha = resolvida === "panel" ? (density ?? "palette") : null
  const ocioso = useCommandIdleSelection(!autoSelectFirst)

  return (
    <CommandPrimitive
      data-slot="command"
      data-variant={resolvida}
      className={cn(commandVariants({ variant: resolvida, density }), className)}
      {...props}
      // Os três handlers são compostos, não sobrescritos; o de quem chama roda
      // primeiro, para poder prevenir (o do hook confere `defaultPrevented`).
      value={ocioso.value ?? props.value}
      onValueChange={ocioso.onValueChange ?? props.onValueChange}
      onKeyDown={(event) => {
        props.onKeyDown?.(event)
        ocioso.onKeyDown?.(event)
      }}
      onInput={(event) => {
        props.onInput?.(event)
        ocioso.onInput?.(event)
      }}
      onPointerMoveCapture={(event) => {
        // O cmdk acende a linha no `pointermove` e o dedo rolando a acendia: a
        // seleção pelo ponteiro é do cursor. Em captura o item não recebe o toque.
        if (!ehCursor(event)) {
          event.stopPropagation()
          return
        }
        props.onPointerMoveCapture?.(event)
        ocioso.onPointerMoveCapture?.(event)
      }}
      onPointerLeave={(event) => {
        props.onPointerLeave?.(event)
        ocioso.onPointerLeave?.(event)
      }}
    >
      <CommandStackContext.Provider value={pilha}>
        {children}
      </CommandStackContext.Provider>

      {/* Sem camadas de borrão nas pontas: dentro de um casco que já borra, cada
          `backdrop-filter` aninhado re-borrava a placa e a aresta saía como uma
          linha de tom. A máscara sozinha faz o trabalho. */}
    </CommandPrimitive>
  )
}

/** A origem só vale com caixa: a lupa escondida (`display: none`) mede 0 e faria a pílula nascer em 0,0. */
function origemValida(r: DOMRect | null | undefined): r is DOMRect {
  return !!r && r.width > 0 && r.height > 0
}

/**
 * A caixa de layout de `el`: a pintada, sem o `transform` em voo dele e dos
 * ancestrais. O gesto do header escreve inline na lupa e na gota do filtro, e
 * a busca que abre no meio dele parte de onde cada um pousa, não de onde está
 * pintado. Zera, mede e devolve no mesmo passo: nada pinta no meio.
 */
function caixaDeLayout(el: HTMLElement): DOMRect {
  const emVoo: [HTMLElement, string][] = []
  for (let n: HTMLElement | null = el; n; n = n.parentElement) {
    if (!n.style.transform) continue
    emVoo.push([n, n.style.transform])
    n.style.transform = ""
  }
  const caixa = el.getBoundingClientRect()
  for (const [n, t] of emVoo) n.style.transform = t
  return caixa
}

type Caixa = Pick<DOMRect, "left" | "right" | "top" | "bottom" | "width" | "height">
/**
 * As fases no mesmo progresso: a emenda arredonda (pinça) antes de o vão abrir
 * (parte). Na `SEPARACAO`, a cintura (de 0,1 a 0,6) dura 95ms e a pinça 119ms.
 */
const PINCA = [0.1, 0.7] as const
const PARTE = [0.6, 1] as const
const ICONE = [0.1, 0.7] as const
/**
 * O conteúdo da pílula (a lupa, o campo, o ×) acende depois que o vão abre: em
 * p 0 a borda é só vidro, e fundido a costura cortava o texto ("Buscar, o|").
 * Até lá, na cápsula, o fantasma da lupa segura a bolha da esquerda.
 */
const CONTEUDO = [PARTE[0], 0.85] as const
/** A tinta do voo (ver `desenharBolhas`) some no fim da chegada, antes de os anéis voltarem. */
const TINTA = [0.85, 1] as const
/** O × puxado para a pílula enquanto a emenda afina (fração da largura): 2,2px a 44. 0 desliga. */
const PUXAO_DO_X = 0.05

/**
 * Um quadro das duas bolhas, no progresso `p` (0 é a cápsula do header, 1 a
 * barra e o ×). A cápsula `[lupa | filtro]` é uma gota só: a metade da
 * esquerda corre até a calha ainda colada à da direita por uma emenda reta,
 * a emenda arredonda até a cintura virar um ponto (o × se inclina para a
 * pílula, preso pela tensão), e o vão de 8 se abre. Sem filtro é outro gesto
 * (`quadroDaGota`). Puro, para o teste: quem escreve é o `desenharBolhas`.
 */
function quadroDasBolhas(
  m: { lupa: Caixa; deX: Caixa; pilula: Caixa; x: Caixa; dpr: number },
  p: number
) {
  const q = Math.min(Math.max(p, 0), 1), resto = 1 - p, R = m.pilula.height / 2
  const pinca = suave(q, PINCA), parte = suave(q, PARTE)
  const puxao = PUXAO_DO_X * pinca * (1 - parte)
  const vao = (m.x.left - m.pilula.right) * parte
  const xdx = (m.deX.left - m.x.left) * resto, xdy = (m.deX.top - m.x.top) * resto
  const livre = m.x.left + xdx - m.x.width * puxao - vao       // a pílula nunca passa do ×
  // Fundidas, a costura cai num pixel do aparelho, a mesma para os dois vidros:
  // numa fração, as duas bordas meio cobertas somavam menos que um e o fundo
  // vazava num fio claro. A largura do × sai da mesma costura (`escalaX`, com a
  // origem na direita); com o vão aberto, é o `1 + puxao` de antes.
  const direita = vao === 0 ? Math.round(livre * m.dpr) / m.dpr : livre
  const escalaX = (m.x.right + xdx - direita - vao) / m.x.width
  const visivel = m.lupa.left + (m.pilula.left - m.lupa.left) * p
  const largura = Math.max(0, direita - visivel)
  const emenda = R * pinca
  // Mais estreita que os dois cantos, a fatia visível encolheria os quatro
  // raios juntos no CSS. Só o raio horizontal cabe na largura; o vertical
  // fica, e a emenda segue casando com a do ×.
  const cabe = Math.min(1, largura / (R + emenda))
  // O fantasma da lupa anda com a borda visível (`visivel - lupa.left`): o
  // centro dele e o da lupa da pílula (o recuo de 14 e meia lupa de 16) caem
  // juntos, e as duas se trocam no lugar.
  return { R, Rh: R * cabe, dx: direita - m.pilula.right, esquerda: m.pilula.width - largura,
    lupaDx: (m.pilula.left - m.lupa.left) * p,
    topo: (m.lupa.top - m.pilula.top) * resto, base: (m.pilula.bottom - m.lupa.bottom) * resto,
    emenda, emendaH: emenda * cabe, puxao, escalaX, vao, xdx, xdy,
    icone: suave(q, ICONE), conteudo: suave(q, CONTEUDO), tinta: 1 - suave(q, TINTA) }
}

/**
 * As fases da busca sem filtro, no mesmo progresso: a borda esquerda do campo
 * repousa na calha aos 0,7 (o passe vem só da mola), a direita anda de 0,15 a
 * 0,75, a gota nasce e corre de 0,45 a 1, a lupa do header se troca pela da
 * pílula de 0,5 a 0,8, o conteúdo acende de 0,55 a 0,85 e o X de 0,7 a 1.
 */
const ESTICA = 0.7
const PONTA = [0.15, 0.75] as const
const GOTA = [0.45, 1] as const
const LUPA_TROCA = [0.5, 0.8] as const
const CONTEUDO_DA_GOTA = [0.55, 0.85] as const
const X_ACENDE = [0.7, 1] as const
/** A gota nasce com 35% do raio, escondida dentro da ponta. */
const GOTA_NASCE = 0.35

/**
 * Um quadro da busca sem filtro, no progresso `p` (0 a lupa sozinha, 1 a barra
 * e o ×), em coordenadas de tela, R meia pílula. O círculo inteiro da lupa se
 * estica e vira o campo: a borda esquerda corre até a calha levando o ícone
 * (`lupaX`, o centro dele), a direita recua até a ponta da barra. O × nasce
 * como uma gota da ponta direita: colada por dentro dela (centro em `direita −
 * R`) com 35% do raio, cresce até o raio inteiro e desliza até o lugar do ×,
 * e o vão é o que sobra entre a ponta e ela (0 enquanto presa). Presa, a ponta
 * cai num pixel do aparelho: é a costura dos dois vidros, e numa fração duas
 * bordas meio cobertas somavam menos que um e o fundo vazava num fio claro.
 * Puro, para o teste: quem escreve é o `desenharGota`.
 */
function quadroDaGota(m: { lupa: Caixa; pilula: Caixa; x: Caixa; dpr: number }, p: number) {
  const R = m.pilula.height / 2
  const esquerda = lerp(m.lupa.left, m.pilula.left, Math.min(p / ESTICA, 1) + Math.max(0, p - 1))
  const livre = lerp(m.lupa.right, m.pilula.right, suave(p, PONTA))
  const g = suave(p, GOTA)
  const r = R * Math.min(1, GOTA_NASCE + g)
  const presa = lerp(livre - R, m.x.left + R, g) - r <= livre
  const direita = presa ? Math.round(livre * m.dpr) / m.dpr : livre
  const cx = lerp(direita - R, m.x.left + R, g)
  return {
    esquerda,
    direita,
    gota: { cx, r },
    vao: presa ? 0 : cx - r - direita,
    lupaX: esquerda + R,
    lupaTroca: suave(p, LUPA_TROCA),
    icone: suave(p, X_ACENDE),
    conteudo: suave(p, CONTEUDO_DA_GOTA),
  }
}

/**
 * A volta à cápsula: 260ms, e a casca segura a desmontagem até os 300
 * (`--duration-slow`): o pouso fica parado dois quadros antes de sumir. Na
 * curva enfática (`--ease-emphasized`) a cauda passava ~100ms abaixo de p 0,02
 * sem pintar diferença, e a desmontagem vinha como um salto; esta começa macia
 * (o vão fecha aos 43ms), a cintura se refaz até os 141ms e a cauda cai a 59ms.
 */
const VOLTA_DA_PILULA = { duration: 0.26, ease: [0.2, 0, 0, 1] } as const

/**
 * Chama `comecar` quando a pintura volta a correr. Entre o toque e o primeiro
 * quadro pintado o WebKit para 100–240ms (montando a paleta ou subindo e
 * descendo o teclado); o `animate` conta o tempo, e o gesto voltava já no fim.
 * Dois rAF seguidos a até 34ms dizem que a pintura voltou (até seis, se ela
 * seguir engasgando). Devolve o cancelamento.
 */
function quandoPintar(comecar: () => void) {
  let quadros = 0
  let antes = 0
  let id = 0
  const esperar = (agora: number) => {
    quadros++
    if (quadros < 2 || (agora - antes > 34 && quadros < 6)) {
      antes = agora
      id = requestAnimationFrame(esperar)
      return
    }
    comecar()
  }
  id = requestAnimationFrame(esperar)
  return () => cancelAnimationFrame(id)
}

/**
 * A pílula volta ao começo da rolagem: o `overflow: hidden` do feixe faz dela
 * um contêiner que rola, e com os filhos transladados no voo um `focus()` a
 * rolava (o conteúdo ~165pt fora do lugar). O campo junto.
 */
function rolarAoInicio(pilula: HTMLElement) {
  pilula.scrollLeft = 0
  const campo = pilula.querySelector("input")
  if (campo) campo.scrollLeft = 0
}

/**
 * Escreve um quadro nos dois vidros e nos filhos deles, nunca num ancestral:
 * lá, o `transform` e o `clip-path` desligariam o `backdrop-filter`. A pílula
 * anda (`translateX`) e o recorte esconde o que passa da borda visível, com a
 * emenda nos cantos da direita; o conteúdo anda com a borda e acende com o
 * progresso (em p 0 a borda é só vidro: nem a lupa cinza da pílula nem uma
 * fatia do placeholder na costura). O × é recortado (e não arredondado: o
 * recorte tira o anel durante o voo, como na pílula) com a emenda nos cantos
 * da esquerda, e se inclina pela origem da direita (`origin-right`). Os dois
 * fantasmas (o que a lupa e a origem do × mostravam) esmaecem no desfoque
 * enquanto o conteúdo e o X chegam deles; o da lupa corre com a borda, por
 * cima da lupa da pílula. O desfoque nos filhos não toca o
 * borrão do vidro.
 *
 * A silhueta no voo: o recorte tira o anel, e no escuro o vidro sobre o header
 * velado é o próprio fundo (sozinho, o vidro media 10/255). A tinta dos dois
 * sobe para o `--foreground` (`TINTA_DO_VOO`), numa camada de `background-image`
 * que o `clip-path` recorta junto: ela desenha exatamente a forma visível, com
 * a borda que anda e a cintura, e fundidas as duas tintas são uma só. Um anel
 * por `box-shadow inset` seguiria a caixa, e não o recorte: a borda esquerda da
 * pílula é do recorte (o anel não passaria ali), e fundidas as duas metades
 * desenhariam um fio na costura.
 */
function desenharBolhas(
  pilula: HTMLElement,
  x: HTMLElement,
  iconeX: SVGElement | null,
  fantasma: HTMLElement | null,
  origemLupa: HTMLElement | null,
  f: ReturnType<typeof quadroDasBolhas>
) {
  // O recorte só tira pixels: com o `rounded-full` dos dois, a emenda reta não
  // aparecia (dois círculos se tocando num ponto desde o primeiro quadro). O
  // raio próprio zera só do lado da emenda: os cantos de fora ficam no R,
  // porque no passe da mola o recorte da esquerda sai da caixa, e só a caixa
  // pinta (a ponta saía reta por ~150ms).
  pilula.style.borderRadius = `${f.R}px 0px 0px ${f.R}px`
  x.style.borderRadius = `0px ${f.R}px ${f.R}px 0px`
  pilula.style.transform = `translateX(${f.dx}px)`
  pilula.style.clipPath = `inset(${f.topo}px 0px ${f.base}px ${f.esquerda}px round ${f.Rh}px ${f.emendaH}px ${f.emendaH}px ${f.Rh}px / ${f.R}px ${f.emenda}px ${f.emenda}px ${f.R}px)`
  for (const filho of pilula.children as HTMLCollectionOf<HTMLElement>) {
    // No passe da mola o recorte sai da caixa, mas só a caixa pinta: a borda
    // para na calha, e o conteúdo para com ela.
    filho.style.transform = `translateX(${Math.max(0, f.esquerda)}px)`
    // `filter`, e não `opacity`: o filtro multiplica a opacidade da classe (a
    // lupa da pílula é `opacity-70`), e o inline a trocaria, com um salto ao pousar.
    filho.style.filter = `opacity(${f.conteudo})`
    // O cursor nativo do iOS não obedece ao `filter` dos filhos: some no voo.
    filho.style.caretColor = "transparent"
  }
  // O feixe do campo vazio acende com o conteúdo: sobre a cápsula que encolhe
  // ele era uma mancha âmbar (o multiplicador mora no `command-beam`).
  pilula.style.setProperty("--command-beam-flight", `${f.conteudo}`)
  const tinta = `color-mix(in oklab, var(--foreground) ${TINTA_DO_VOO * f.tinta}%, transparent)`
  pilula.style.backgroundImage = x.style.backgroundImage = `linear-gradient(${tinta}, ${tinta})`
  x.style.transform = `translate(${f.xdx}px, ${f.xdy}px) scale(${f.escalaX}, ${1 - f.puxao * ACOPLAMENTO_Y})`
  x.style.clipPath = `inset(0px round ${f.emenda}px ${f.R}px ${f.R}px ${f.emenda}px)`
  if (fantasma) {
    fantasma.style.opacity = `${1 - f.icone}`
    fantasma.style.filter = `blur(${6 * f.icone}px)`
    fantasma.style.transform = `scale(${1 - 0.3 * f.icone})`
  }
  if (origemLupa) {
    origemLupa.style.opacity = `${1 - f.conteudo}`
    origemLupa.style.filter = `blur(${6 * f.conteudo}px)`
    origemLupa.style.transform = `translateX(${f.lupaDx}px) scale(${1 - 0.3 * f.conteudo})`
  }
  if (iconeX) {
    iconeX.style.opacity = `${f.icone}`
    iconeX.style.filter = `blur(${6 * (1 - f.icone)}px)`
    iconeX.style.transform = `scale(${0.7 + 0.3 * f.icone})`
  }
}

/**
 * Escreve um quadro da busca sem filtro (`quadroDaGota`) nos dois vidros e nos
 * filhos deles, nunca num ancestral. A pílula anda com a ponta (`translateX`)
 * e o recorte esconde o que fica à esquerda da borda (no passe da mola ele sai
 * da caixa, e só a caixa pinta); o conteúdo anda com a borda e acende por
 * `conteudo`, menos a lupa da pílula, que acende por `lupaTroca` no lugar em
 * que o fantasma da lupa do header se apaga (os dois centrados em `lupaX`). O
 * × é a gota: o próprio vidro dele, levado ao centro e ao raio do quadro por
 * `translate`/`scale` pela origem da direita, recortado onde cairia dentro da
 * pílula (vidro sobre vidro pintaria duas vezes) e com a cintura nos cantos da
 * esquerda, pela técnica da emenda: assomando da ponta eles são retos (a
 * junção é a fatia inteira) e arredondam até o raio conforme a gota sai, e a
 * junção afina até o ponto em que o vão abre. A emenda é dividida pela escala
 * da gota, e só o raio horizontal encolhe quando a fatia visível é mais
 * estreita que ele (como em `quadroDasBolhas`). O X acende do desfoque por
 * `icone`; o fantasma do × fica vazio. O recorte tira o anel dos dois, e a
 * silhueta é a tinta do voo (`TINTA_DO_VOO`), que some no fim (`TINTA`).
 */
function desenharGota(
  pilula: HTMLElement,
  x: HTMLElement,
  iconeX: SVGElement | null,
  origemLupa: HTMLElement | null,
  m: { lupa: Caixa; pilula: Caixa; x: Caixa },
  f: ReturnType<typeof quadroDaGota>,
  p: number
) {
  const R = m.pilula.height / 2
  const s = f.gota.r / R
  const dx = f.direita - m.pilula.right
  const esquerda = f.esquerda - m.pilula.left - dx
  const lupaDaPilula = pilula.querySelector(":scope > svg")
  pilula.style.transform = `translateX(${dx}px)`
  pilula.style.clipPath = `inset(0px 0px 0px ${esquerda}px round ${R}px)`
  for (const filho of pilula.children as HTMLCollectionOf<HTMLElement>) {
    filho.style.transform = `translateX(${Math.max(0, esquerda)}px)`
    filho.style.filter = `opacity(${filho === lupaDaPilula ? f.lupaTroca : f.conteudo})`
    filho.style.caretColor = "transparent"
  }
  pilula.style.setProperty("--command-beam-flight", `${f.conteudo}`)
  const tinta = `color-mix(in oklab, var(--foreground) ${TINTA_DO_VOO * (1 - suave(p, TINTA))}%, transparent)`
  pilula.style.backgroundImage = x.style.backgroundImage = `linear-gradient(${tinta}, ${tinta})`
  // A gota: a borda direita dela em `cx + r`, e a escala pela origem da direita.
  const W = m.x.width
  x.style.borderRadius = `0px ${R}px ${R}px 0px`
  x.style.transform = `translateX(${f.gota.cx + f.gota.r - m.x.right}px) scale(${s})`
  // Onde a ponta da pílula acaba, nas coordenadas da gota antes do `transform`; toda dentro, não sobra nada.
  const corte = preso(W + (f.direita - f.gota.cx - f.gota.r) / s, 0, W)
  const fora = preso((f.gota.cx + f.gota.r - f.direita) / (2 * f.gota.r), 0, 1)
  const emenda = Math.min(R, (R * fora) / s)
  const cabe = Math.min(1, (W - corte) / (R + emenda))
  x.style.clipPath =
    `inset(0px 0px 0px ${corte}px round ${emenda * cabe}px ${R * cabe}px ${R * cabe}px ${emenda * cabe}px / ${emenda}px ${R}px ${R}px ${emenda}px)`
  if (origemLupa) {
    origemLupa.style.opacity = `${1 - f.lupaTroca}`
    origemLupa.style.filter = `blur(${6 * f.lupaTroca}px)`
    origemLupa.style.transform = `translateX(${f.lupaX - R - m.lupa.left}px) scale(${1 - 0.3 * f.lupaTroca})`
  }
  if (iconeX) {
    iconeX.style.opacity = `${f.icone}`
    iconeX.style.filter = `blur(${6 * (1 - f.icone)}px)`
    iconeX.style.transform = `scale(${0.7 + 0.3 * f.icone})`
  }
}

/** A barra e o × prontos: nada inline, o raio e o recorte no mesmo quadro (o `opacity-0` da classe esconde os fantasmas). */
function bolhasEmRepouso(
  pilula: HTMLElement,
  x: HTMLElement,
  iconeX: SVGElement | null,
  fantasma: HTMLElement | null,
  origemLupa: HTMLElement | null
) {
  pilula.style.borderRadius = x.style.borderRadius = ""
  pilula.style.transform = ""
  pilula.style.clipPath = ""
  for (const filho of pilula.children as HTMLCollectionOf<HTMLElement>)
    filho.style.transform = filho.style.filter = filho.style.caretColor = ""
  pilula.style.removeProperty("--command-beam-flight")
  pilula.style.backgroundImage = x.style.backgroundImage = ""
  rolarAoInicio(pilula)
  x.style.transform = ""
  x.style.clipPath = ""
  for (const el of [iconeX, fantasma]) if (el) el.style.opacity = el.style.filter = el.style.transform = ""
  if (origemLupa) origemLupa.style.cssText = ""
}

/**
 * A paleta em diálogo, dona do próprio `Command` (`CommandInput` e
 * `CommandList` exigem o contexto da raiz; sem ela o cmdk estoura com `Cannot
 * read properties of undefined (reading 'subscribe')`). Monta-o transparente
 * (`plain`); `commandProps` é a saída para o que a raiz precisa receber (o
 * `filter` próprio do `ds-search`).
 */
function CommandDialog({
  title = "Paleta de comandos",
  description = "Busque uma tela, uma ação ou um registro.",
  children,
  className,
  showCloseButton = false,
  commandProps,
  size = "md",
  origin,
  closeOrigin,
  ...props
}: React.ComponentProps<typeof Dialog> & {
  title?: string
  description?: string
  /** Classes da raiz `Command`, a pilha (não pinta). */
  className?: string
  showCloseButton?: boolean
  /** O que a raiz `Command` precisa receber: `filter`, `shouldFilter`, `loop`. */
  commandProps?: Omit<React.ComponentProps<typeof Command>, "children">
  /** `lg` é a paleta larga, para a pré-visualização ao lado (`CommandSplit` + `CommandPreview`); no telefone é a barra. */
  size?: "md" | "lg"
  /** No telefone, o elemento de onde a pílula nasce (a lupa do header); sem ele, ela entra no lugar. */
  origin?: React.RefObject<HTMLElement | null>
  /**
   * No telefone, de onde o × nasce: o filtro colado à lupa (`origin`), pelas
   * caixas de layout. Sem ele, sem caixa, longe da lupa ou inerte (a gota do
   * header voltando à lupa), o círculo da lupa vira o campo e o × pinga da
   * ponta dele.
   */
  closeOrigin?: React.RefObject<HTMLElement | null>
}) {
  const isMobile = useIsMobile()
  const reduzido = useReducedMotion()
  const aberto = props.open
  // A camada do telefone num estado, e não num ref: o `Portal` do Radix só
  // monta o conteúdo num segundo commit, e o efeito precisa rodar quando ele chega.
  const [camada, setCamada] = React.useState<HTMLDivElement | null>(null)
  // Onde o gesto está (0 a cápsula do header, 1 a barra e o ×), para fechar de
  // onde a abertura parou e reabrir de onde o fechamento parou.
  const progresso = React.useRef(0)

  // A altura que sobra acima do teclado do iOS (o viewport visual), na camada
  // enquanto ela existe. Sem `visualViewport`, vale o `100dvh` de reserva.
  React.useLayoutEffect(() => {
    const vv = window.visualViewport
    if (!camada || !vv) return
    const medir = () => camada.style.setProperty("--command-search-vh", `${vv.height}px`)
    medir()
    vv.addEventListener("resize", medir)
    vv.addEventListener("scroll", medir)
    return () => {
      vv.removeEventListener("resize", medir)
      vv.removeEventListener("scroll", medir)
    }
  }, [camada])

  // O gesto do telefone: com o filtro colado, a cápsula do header `[lupa |
  // filtro]` se divide em duas bolhas (a metade da lupa corre até a calha e
  // vira a pílula; a do filtro fica no lugar e vira o ×); sem filtro, o
  // círculo da lupa vira o campo e o × pinga da ponta dele. Fechar é o mesmo
  // filme ao contrário, e a casca segue montada pelo `presence-hold`. Um
  // progresso só escreve cada quadro (`quadroDasBolhas` ou `quadroDaGota`)
  // nos dois vidros; nada mexe no layout do cmdk, e tudo sai no fim.
  React.useLayoutEffect(() => {
    const pilula = camada?.querySelector<HTMLElement>("[data-slot=search-input]")
    const x = camada?.querySelector<HTMLElement>("[data-slot=command-search-cancel]")
    if (!camada || !pilula || !x) return
    const iconeX = x.querySelector<SVGElement>(":scope > svg")
    const fantasma = x.querySelector<HTMLElement>("[data-slot=command-search-cancel-origin]")
    const origemLupaEl = camada.querySelector<HTMLElement>("[data-slot=command-search-origin]")
    const placa = camada.querySelector<HTMLElement>("[data-slot=command-dialog-panel]")
    const lupaEl = origin?.current
    // As origens pelas caixas de layout, sem o voo do header: a busca aberta
    // com o filtro ainda pingando parte de onde a lupa e ele pousam.
    const lupa = lupaEl ? caixaDeLayout(lupaEl) : null
    const viaja = !!lupaEl && origemValida(lupa) && !reduzido
    let ativa = true
    let controle: AnimationPlaybackControls | undefined
    let cancelar = () => {}
    if (viaja) {
      pilula.style.opacity = x.style.opacity = ""
      // O × nasce do filtro só quando ele está colado à lupa, na mesma linha;
      // inerte, ele está saindo (a gota voltando à lupa) e não conta.
      const filtroEl = closeOrigin?.current
      const filtro = filtroEl && !filtroEl.closest("[inert]") ? caixaDeLayout(filtroEl) : null
      const colado =
        origemValida(filtro) && Math.abs(filtro.left - lupa.right) <= 1 && Math.abs(filtro.top - lupa.top) <= 1
      // A caixa final da pílula sem o `transform` de um gesto interrompido.
      const final = caixaDeLayout(pilula)
      // O × pelo lugar de layout na camada (ele é `absolute` nela), e não pela
      // caixa pintada: fechar pelo × mede no meio do aperto do toque (o
      // `translate` do AFUNDAR e do `active:translate-y-px`), e ele pousava 1px
      // abaixo e pulava. O `offset*` ignora transformações; o aperto segue.
      const c = camada.getBoundingClientRect()
      const xFinal = {
        left: c.left + x.offsetLeft,
        top: c.top + x.offsetTop,
        width: x.offsetWidth,
        height: x.offsetHeight,
        right: c.left + x.offsetLeft + x.offsetWidth,
        bottom: c.top + x.offsetTop + x.offsetHeight,
      }
      // O fantasma do × mostra o que o filtro mostrava, clonado de novo a cada
      // gesto para nunca empilhar; sem filtro fica vazio (o × é a gota).
      if (colado && filtroEl) fantasma?.replaceChildren(...[...filtroEl.children].map((n) => n.cloneNode(true)))
      else fantasma?.replaceChildren()
      // O fantasma da lupa segura o desenho do header (o branco de 20, e não
      // a lupa cinza de 16 da pílula) até a da pílula acender, e é nele que a
      // volta pousa: na cápsula, parado na metade dela; sem filtro, andando
      // com a borda esquerda do campo.
      if (origemLupaEl) {
        origemLupaEl.replaceChildren(...[...lupaEl.children].map((n) => n.cloneNode(true)))
        Object.assign(origemLupaEl.style, {
          left: `${lupa.left - c.left}px`,
          top: `${lupa.top - c.top}px`,
          width: `${lupa.width}px`,
          height: `${lupa.height}px`,
        })
      }
      rolarAoInicio(pilula)
      const dpr = window.devicePixelRatio || 1
      const desenhar = colado && filtro
        ? (p: number) => {
            const f = quadroDasBolhas({ lupa, deX: filtro, pilula: final, x: xFinal, dpr }, p)
            desenharBolhas(pilula, x, iconeX, fantasma, origemLupaEl, f)
            return f
          }
        : (p: number) => {
            const m = { lupa, pilula: final, x: xFinal, dpr }
            const f = quadroDaGota(m, p)
            desenharGota(pilula, x, iconeX, origemLupaEl, m, f, p)
            return f
          }
      const quadro = (p: number) => {
        progresso.current = p
        const f = desenhar(p)
        // A placa brota quando o vão abre, no progresso, e não no relógio do
        // CSS: ele corre durante a montagem, e a placa terminava de brotar
        // antes de as bolhas se separarem.
        if (f.vao > 0 && placa) placa.style.animationPlayState = ""
      }
      if (aberto) {
        // Com um gesto no ar (a camada ainda fechando), a abertura segue de
        // onde ele está, sem voltar à lupa; em repouso ou numa camada nova,
        // da cápsula. O primeiro quadro já sai daqui, antes da pintura: a
        // cápsula do header, que parada lê como o aperto.
        const de = pilula.style.clipPath ? progresso.current : 0
        if (placa) placa.style.animationPlayState = "paused"
        quadro(de)
        // O relógio só começa quando a pintura volta (`quandoPintar`): a
        // mola contaria o tempo da montagem e voltaria já sem a divisão. O
        // foco não espera: ele vai ao campo no `onOpenAutoFocus`, no toque.
        cancelar = quandoPintar(() => {
          const abrindo = animate(de, 1, { ...SEPARACAO, onUpdate: quadro })
          // Um número animado não escreve no elemento: o repouso escrito à mão
          // é a última palavra (animando o `clip-path` do elemento, o valor do
          // motion o reescrevia no render seguinte).
          abrindo.then(() => {
            if (ativa) bolhasEmRepouso(pilula, x, iconeX, fantasma, origemLupaEl)
          })
          controle = abrindo
        })
      } else {
        // Fechar no meio da abertura volta de onde ela estava, e pousa na
        // cápsula sem passar dela: uma mola até zero cruzaria o círculo. O
        // teclado descendo para a pintura como a montagem ao abrir: a volta
        // também espera a pintura, e a casca segura 400ms para caber.
        const de = progresso.current
        quadro(de)
        cancelar = quandoPintar(() => {
          controle = animate(de, 0, { ...VOLTA_DA_PILULA, onUpdate: quadro })
        })
      }
    } else {
      bolhasEmRepouso(pilula, x, iconeX, fantasma, origemLupaEl)
      progresso.current = aberto ? 1 : 0
      if (aberto) {
        // Sem lupa à vista, a pílula e o × entram no lugar; com movimento
        // reduzido, só esmaecem.
        pilula.style.opacity = x.style.opacity = "0"
        controle = reduzido
          ? animate([pilula, x], { opacity: [0, 1] }, SAIDA)
          : animate([pilula, x], { opacity: [0, 1], scale: [0.95, 1] }, MOLA)
      } else {
        controle = animate([pilula, x], { opacity: 0 }, SAIDA)
      }
    }
    return () => {
      ativa = false
      cancelar()
      controle?.stop()
      if (placa) placa.style.animationPlayState = ""
    }
  }, [aberto, camada, origin, closeOrigin, reduzido])

  // No telefone a lupa vira a barra: uma camada de tela cheia sobre o véu, com
  // a pílula e o × na linha do header e a placa 12px abaixo. Era uma
  // gaveta de baixo, longe da lupa que a abria.
  if (isMobile) {
    return (
      <Dialog {...props}>
        <DialogPortal>
          {/* O véu cobre header, página e barra de baixo; tocar nele fecha. Ao
              fechar ele não esmaece pela opacidade: no WebKit o borrão de
              fundo some de uma vez quando a opacidade anima, e o header nítido
              aparecia sob as bolhas no primeiro quadro (contorno duplo). O
              `veil-out` desce o raio do borrão e a tinta até zero, depois de
              100ms, dentro dos 400 da casca. */}
          <DialogPrimitive.Overlay
            data-slot="dialog-overlay"
            className={cn(
              // A entrada é a do véu do `Dialog`; só a saída troca (com `!`,
              // por cima do `animate-out` dele).
              overlayClassName("modal"),
              "data-closed:[animation:veil-out_var(--duration-slow)_var(--ease-out)_var(--duration-instant)_both]!"
            )}
          />
          <DialogPrimitive.Content
            ref={setCamada}
            data-slot="command-search"
            // A casca não recebe toque, para o vão entre a linha e a placa
            // chegar ao véu. Vai no `style` porque o Radix escreve
            // `pointer-events: auto` inline e o espalha antes do nosso.
            style={{ pointerEvents: "none" }}
            // O foco vai ao campo no próprio commit do toque, sem esperar a
            // mola: fora do gesto, o iOS não abre o teclado.
            // Sem `DialogTrigger`, o Radix devolvia o foco ao body. Só se mexe
            // no foco que ficou sem dono (no body ou na camada que sai), e ele
            // vai ao diálogo que a paleta abriu, se houver: a armadilha da
            // camada o segurava até aqui, e a lupa ficaria atrás da folha.
            onCloseAutoFocus={(e) => {
              if (!origin?.current) return
              e.preventDefault()
              const doc = origin.current.ownerDocument
              const ativo = doc.activeElement
              if (ativo !== doc.body && !camada?.contains(ativo)) return
              const outro = [...doc.querySelectorAll<HTMLElement>("[role=dialog],[role=alertdialog]")]
                .filter((d) => d !== camada)
                .at(-1)
              ;(outro ?? origin.current).focus()
            }}
            onOpenAutoFocus={(e) => {
              e.preventDefault()
              // Sem rolar: no voo os filhos da pílula estão transladados, e o
              // `focus()` rolava o `overflow: hidden` dela até o campo.
              ;(e.currentTarget as HTMLElement | null)
                ?.querySelector<HTMLInputElement>("[data-slot=command-input]")
                ?.focus({ preventScroll: true })
            }}
            className={cn(
              // A altura é a do viewport visual: o teclado do iOS só encolhe ele, e com
              // `100dvh` o fim da placa ficava atrás do teclado.
              "fixed inset-x-0 top-0 z-(--z-modal) flex h-[var(--command-search-vh,100dvh)] flex-col px-4 text-sm outline-none",
              // A linha da busca na altura da do header: a barra `sm` mede 56 e
              // a pílula 44, então 6px abaixo da área segura.
              "[--command-search-top:calc(env(safe-area-inset-top,0px)+6px)] pt-(--command-search-top)",
              "pb-[max(--spacing(3),env(safe-area-inset-bottom))]",
              // A casca segura a saída até a pílula pousar na lupa: a espera da
              // pintura (até ~100ms com o teclado descendo), a `VOLTA_DA_PILULA`
              // (260ms) e o pouso parado; 400ms ao todo.
              "data-closed:[animation:presence-hold_calc(var(--duration-slow)+var(--duration-instant))]",
              // A placa brota como os menus do app (`menu-morph`, o gesto do iOS
              // 26 medido quadro a quadro), do canto de cima à direita, sob a
              // lupa e o ×: tudo nasce e volta ao mesmo lugar (pedido do dono;
              // era do alto ao centro, longe da cápsula que se divide), 60ms
              // depois de o vão abrir (no gesto, o efeito a segura pausada até
              // lá); as linhas surgem do desfoque em cascata (`command-reveal`). Na
              // volta, o `menu-unmorph` a recolhe ao mesmo ponto em 210ms. O ×
              // não brota: é a segunda bolha do gesto. A animação é de cada
              // vidro, nunca da casca: no ancestral, o `transform` desligaria o
              // borrão deles.
              "[&_[data-slot=command-dialog-panel]]:origin-top-right",
              "data-open:[&_[data-slot=command-dialog-panel]]:[animation:menu-morph_380ms_linear_60ms_backwards]",
              "data-closed:[&_[data-slot=command-dialog-panel]]:[animation:menu-unmorph_210ms_linear_both]",
            )}
          >
            <DialogHeader className="sr-only">
              <DialogTitle>{title}</DialogTitle>
              <DialogDescription>{description}</DialogDescription>
            </DialogHeader>
            <CommandBeamContext.Provider value>
              <Command
                // O `CommandInput` é o primeiro filho que o consumidor passa:
                // ninguém reordena filhos, a pílula só deixa 52px à direita
                // para o × (44 e o respiro de 8).
                variant="panel"
                autoSelectFirst={false}
                className={cn(
                  "[&_[data-slot=command-input-wrapper]]:me-13",
                  // A pílula mede 44, a altura da linha e do ×, com
                  // ou sem dedo (uma janela estreita de mouse também cai aqui).
                  "[&_[data-slot=search-input]]:h-11",
                  "[&_:is([data-slot=command-input-wrapper],[data-slot=command-dialog-panel])]:pointer-events-auto",
                  "[&_[data-slot=command-list]]:max-h-none [&_[data-slot=command-list]]:min-h-0",
                  // A placa vai até o pé da tela: tudo menos o topo, a linha
                  // de 44, o respiro de 12 e a área segura de baixo.
                  "[--command-list-ceiling:calc(var(--command-search-vh,100dvh)_-_var(--command-search-top)_-_--spacing(11)_-_--spacing(3)_-_max(--spacing(3),env(safe-area-inset-bottom)))]",
                  "[--command-list-transition:var(--duration-base)]",
                  className
                )}
                {...commandProps}
              >
                {children}
              </Command>
            </CommandBeamContext.Provider>
            {/* O fantasma da lupa: o desenho da lupa do header sobre a metade
                dela na cápsula, ou andando com a borda do campo sem filtro,
                posto e preenchido pelo gesto. Fora da raiz do cmdk, como o ×. `z-20`: a faixa da pílula
                é `relative z-10`, e sem ele o fantasma pintava por baixo do
                vidro (borrado, quase invisível). */}
            <span aria-hidden data-slot="command-search-origin" className="pointer-events-none absolute z-20 grid place-items-center opacity-0 [&_svg]:size-5" />
            {/* A linha, para os testes e a medida do topo. */}
            <div
              aria-hidden
              data-slot="command-search-bar"
              className="pointer-events-none absolute inset-x-4 top-(--command-search-top) h-11"
            />
            {/* O × que fecha: o círculo de 44 no mesmo vidro da pílula (a
                superfície `modal` da busca), e não o botão sem fundo. Fora
                da raiz do cmdk: lá dentro o Enter seleciona a linha e nunca
                chegaria ao botão. */}
            <Button
              type="button"
              variant="tertiary"
              size="icon-lg"
              aria-label="Fechar busca"
              data-slot="command-search-cancel"
              onClick={() => props.onOpenChange?.(false)}
              className={cn(
                "pointer-events-auto absolute top-(--command-search-top) right-4 size-11",
                searchFieldSurfaceClassName.modal,
                // Inclina-se pela borda de fora, e o vidro chega à aresta: com o
                // `bg-clip-padding` do botão, a emenda com a pílula mostrava um fio.
                "origin-right bg-clip-border"
              )}
            >
              {/* O fantasma: o que a origem do × mostrava (o filtro, com o ponto,
                  ou a lupa), clonado pelo gesto e apagado em repouso. O React
                  não escreve filhos aqui, então não toca nos clones. */}
              <span
                aria-hidden
                data-slot="command-search-cancel-origin"
                className="pointer-events-none absolute inset-0 grid place-items-center opacity-0 [&_svg]:size-5"
              />
              <XMarkIcon aria-hidden />
            </Button>
          </DialogPrimitive.Content>
        </DialogPortal>
      </Dialog>
    )
  }

  return (
    <Dialog {...props}>
      <DialogPortal>
        <DialogOverlay />
        {/* O `Content` é uma coluna que não pinta: a placa é um filho e a legenda
            de teclado (`dock`) é a irmã dela, embaixo. Não é o `DialogContent`
            porque ali a placa é o `Content` (vidro e `overflow-hidden` no mesmo
            nó), e um elemento com `backdrop-filter` é raiz de fundo: o borrão
            das cápsulas não veria a página. Posição, largura e camada são as do
            `dialogContentVariants`. */}
        <DialogPrimitive.Content
          data-slot="command-dialog"
          className={cn(
            "fixed left-1/2 z-(--z-modal) flex w-full max-w-[calc(100%-2rem)] -translate-x-1/2 flex-col text-sm outline-none sm:max-w-md",
            size === "lg" && "sm:max-w-3xl",
            // Sem sombra atrás do conjunto: pílula, placa e legenda são formas
            // soltas, e a sombra de um retângulo que não é nenhuma delas
            // aparecia como mancha; quem separa a paleta da página é o véu com
            // borrão. A posição precisa de conta própria: centralizar pela
            // altura real fazia o campo subir e descer a cada tecla, então o
            // topo é fixado onde a placa cheia começaria (`50% - altura-máxima/2`)
            // e só a borda de baixo encolhe. 24rem de teto.
            "[--command-dialog-h:min(60dvh,24rem)]",
            // O topo centraliza a pilha cheia (a placa mais 48: a pílula, os
            // respiros e a legenda de 32), não só a placa. No toque a legenda
            // some (`pointer-coarse:hidden`).
            "[--command-dialog-stack:calc(var(--command-dialog-h)+--spacing(12))]",
            "pointer-coarse:[--command-dialog-stack:calc(var(--command-dialog-h)+--spacing(1))]",
            "[--command-dialog-top:calc(50%-var(--command-dialog-stack)/2)]",
            "top-(--command-dialog-top)",
            // A paleta abre na mola e fecha curto em `--ease-out` (uma mola até
            // zero passa por baixo de zero). É a exceção ao gesto do menu
            // (rodada 287): o dono preferiu a entrada dela de antes.
            // Quem se move é cada vidro (a pílula, a placa e as cápsulas da
            // legenda), nunca a coluna: transform, opacidade ou filter animado
            // num ancestral desliga o `backdrop-filter` dos filhos até a
            // animação acabar, e o fundo deles acendia atrasado. A coluna só
            // segura o fechamento (`presence-hold`), e o blur do `tw-animate`
            // vira `none` (um `blur(0)` também desligava).
            "data-closed:[animation:presence-hold_var(--duration-fast)]",
            "[&_:is([data-slot=search-input],[data-slot=command-dialog-panel],[data-slot=command-dock-item])]:[--tw-enter-blur:none] [&_:is([data-slot=search-input],[data-slot=command-dialog-panel],[data-slot=command-dock-item])]:[--tw-exit-blur:none]",
            // A pílula entra pela primeira animação da lista do feixe (`command-beam`).
            "data-open:**:data-[slot=search-input]:[--command-beam-intro:enter_var(--duration-spring)_var(--ease-spring)] data-open:**:data-[slot=search-input]:fade-in-0 data-open:**:data-[slot=search-input]:zoom-in-95 data-open:**:data-[slot=search-input]:slide-in-from-top-1",
            "data-open:**:data-[slot=command-dialog-panel]:animate-in data-open:**:data-[slot=command-dialog-panel]:fade-in-0 data-open:**:data-[slot=command-dialog-panel]:zoom-in-95 data-open:**:data-[slot=command-dialog-panel]:slide-in-from-top-1 data-open:**:data-[slot=command-dialog-panel]:animation-duration-(--duration-spring) data-open:**:data-[slot=command-dialog-panel]:ease-(--ease-spring)",
            "data-closed:[&_:is([data-slot=command-dialog-panel],[data-slot=command-dock-item])]:animate-out data-closed:[&_:is([data-slot=command-dialog-panel],[data-slot=command-dock-item])]:fade-out-0 data-closed:[&_:is([data-slot=command-dialog-panel],[data-slot=command-dock-item])]:zoom-out-95 data-closed:[&_:is([data-slot=command-dialog-panel],[data-slot=command-dock-item])]:animation-duration-(--duration-fast) data-closed:[&_:is([data-slot=command-dialog-panel],[data-slot=command-dock-item])]:ease-(--ease-out) data-closed:[&_:is([data-slot=command-dialog-panel],[data-slot=command-dock-item])]:fill-mode-forwards",
            "data-closed:**:data-[slot=search-input]:[--command-beam-intro:exit_var(--duration-fast)_var(--ease-out)_forwards] data-closed:**:data-[slot=search-input]:fade-out-0 data-closed:**:data-[slot=search-input]:zoom-out-95"
          )}
        >
          {/* O nome acessível mora dentro do `Content`: fora dele o `DialogHeader`
              (`w-full` vence o `width: 1px` do `sr-only`) empurrava o documento
              em 40px e criava rolagem horizontal a 320px. */}
          <DialogHeader className="sr-only">
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>
          <CommandBeamContext.Provider value>
          <Command
            // A pilha: pílula, placa e, se o consumidor puser um `CommandDock`
            // como último filho, a legenda. Abre sem nada selecionado; vem antes
            // do spread para `commandProps` poder voltar atrás.
            variant="panel"
            autoSelectFirst={false}
            className={cn(
              "[&_[data-slot=command-list]]:max-h-none",
              "[&_[data-slot=command-list]]:min-h-0",
              // O teto da lista e a transição são declarados pela casca: o teto
              // é o da paleta menos 44 (pílula de 36 e 8 de respiro); com 12 de
              // respiro a raiz aberta (camadas e dois recentes) continua cabendo
              // sem rolar, e descontar 48 a fazia rolar 4px.
              "[--command-list-ceiling:calc(var(--command-dialog-h)_-_--spacing(11))]",
              // Só o diálogo anima a altura: o `Combobox` mora num popover que se
              // reposiciona, e uma altura em movimento faria o painel perseguir o gatilho.
              "[--command-list-transition:var(--duration-base)]",
              className
              // Sem `flex-1`: `flex: 1 1 0%` faz o `flex-basis: 0` vencer
              // qualquer `height`, e a altura derivada da lista nunca chegaria ao layout.
            )}
            {...commandProps}
          >
            {children}
          </Command>
          </CommandBeamContext.Provider>
          {showCloseButton ? <DialogCloseButton /> : null}
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  )
}

/* Sub-páginas */

type CommandPageEntry = { id: string; label: string; icon?: React.ReactNode }

type CommandPagesValue = {
  /** A pilha de páginas abertas; vazia é a raiz. */
  stack: CommandPageEntry[]
  /** A página atual, ou `undefined` na raiz. */
  current: string | undefined
  push: (page: CommandPageEntry) => void
  pop: () => void
  reset: () => void
  /** O primeiro Backspace com o campo vazio: o próximo volta. */
  armed: boolean
  setArmed: (armed: boolean) => void
}

const CommandPagesContext = React.createContext<CommandPagesValue | null>(null)

/**
 * As sub-páginas da paleta. Não desenha nada: embrulha o campo e a lista e
 * guarda a pilha. O campo a lê sozinho (a trilha vira o `CommandScope`, o
 * Backspace com o campo vazio volta em dois toques, o texto esvazia a cada
 * passo) e cada `CommandPage` mostra o que é seu. É o gesto do escopo da busca
 * do catálogo.
 */
function CommandPages({
  children,
  onPageChange,
}: {
  children: React.ReactNode
  /** A página atual mudou — para quem quer gravar recente ou medir. */
  onPageChange?: (page: string | undefined) => void
}) {
  const [stack, setStack] = React.useState<CommandPageEntry[]>([])
  const [armed, setArmed] = React.useState(false)
  const avisar = React.useRef(onPageChange)
  React.useEffect(() => {
    avisar.current = onPageChange
  })

  const value = React.useMemo<CommandPagesValue>(() => {
    const mudar = (proxima: CommandPageEntry[]) => {
      setStack(proxima)
      setArmed(false)
      avisar.current?.(proxima.at(-1)?.id)
    }
    return {
      stack,
      current: stack.at(-1)?.id,
      push: (page) => mudar([...stack, page]),
      pop: () => mudar(stack.slice(0, -1)),
      reset: () => mudar([]),
      armed,
      setArmed,
    }
  }, [stack, armed])

  return <CommandPagesContext.Provider value={value}>{children}</CommandPagesContext.Provider>
}

/** A pilha das sub-páginas, para o item que abre uma (`push`) ou volta. */
function useCommandPages() {
  const ctx = React.useContext(CommandPagesContext)
  if (!ctx) throw new Error("useCommandPages precisa estar dentro de <CommandPages>")
  return ctx
}

/** O conteúdo de uma página: aparece só quando ela é a atual. Sem `id` é a raiz. Remonta a cada troca, e é isso que faz as linhas subirem ao entrar. */
function CommandPage({ id, children }: { id?: string; children: React.ReactNode }) {
  const { current } = useCommandPages()
  if (current !== id) return null
  return <React.Fragment key={id ?? "raiz"}>{children}</React.Fragment>
}

/**
 * A faixa de busca. A pílula, a escada, a lupa e o × vêm de
 * `lib/search-field-classes`, a receita que o gatilho do cabeçalho e o
 * `SearchInput` também vestem (quem abre a paleta vem de clicar naquele campo).
 * A superfície é a da casca: o `CommandDialog` veste a placa modal e o `Command`
 * de dentro não pinta (uma placa por superfície).
 */
function CommandInput({
  className,
  value,
  onValueChange,
  leading,
  size: sizeProp,
  surface,
  touchFloor = false,
  caret = false,
  "aria-label": ariaLabel = "Buscar",
  onKeyDown,
  ...props
}: Omit<React.ComponentProps<typeof CommandPrimitive.Input>, "size"> & {
  /** O que fica entre a lupa e o texto — o `CommandScope` da busca por camada. */
  leading?: React.ReactNode
  /** `md` (32) é o gatilho do cabeçalho do catálogo; `lg` (36) é a pílula da pilha, e o padrão dentro dela. A faixa de dissolução acompanha (`data-size` no wrapper). */
  size?: "md" | "lg"
  /** A superfície da pílula: `plate` na pilha (`modal` no `CommandDialog`); fora dela `field`, menos num popover (o `Combobox`), que pede `plate`. */
  surface?: "field" | "plate" | "modal"
  /** O piso de toque: 40 no dedo, e a faixa de busca da raiz acompanha. Desligado por padrão (a paleta tem medidas próprias); o `FilterBar` liga. */
  touchFloor?: boolean
  /** O cursor desenhado do `SearchInput`, que segue o texto (controlado ou não): a paleta que se digita sozinha numa vitrine. */
  caret?: boolean
}) {
  const pilha = React.useContext(CommandStackContext)
  const naPilha = pilha !== null
  // Na paleta o campo nasce `lg` (36); na densidade de menu e solto, `md` (32).
  const size = sizeProp ?? (pilha === "palette" ? "lg" : "md")
  const noDialogo = React.useContext(CommandBeamContext)
  const comFeixe = naPilha && noDialogo
  // A busca vazia, lida do cmdk (vale controlado ou não); liga o feixe da pílula.
  const busca = useCommandState((estado) => estado.search)
  const esperando = (value != null ? String(value) : busca) === ""
  // Sem dono, o texto mora aqui: o × do `SearchInput` precisa saber se há texto
  // e limpá-lo. O conteúdo de um popover desmonta ao fechar, e ela recomeça vazia.
  const [interno, setInterno] = React.useState("")
  const controlado = value !== undefined
  const texto = controlado ? value : interno
  const mudar = (proximo: string) => {
    if (!controlado) setInterno(proximo)
    onValueChange?.(proximo)
  }

  // As sub-páginas: a trilha é o escopo do campo, o texto esvazia a cada
  // passo, e o Backspace com o campo vazio volta em dois toques.
  const paginas = React.useContext(CommandPagesContext)
  const profundidade = paginas?.stack.length ?? 0
  const mudarRef = React.useRef(mudar)
  React.useEffect(() => {
    mudarRef.current = mudar
  })
  React.useEffect(() => {
    if (paginas) mudarRef.current("")
    // Só quando a página muda, não a cada render do contexto.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profundidade])
  const topo = paginas?.stack.at(-1)
  const escopo =
    leading ??
    (topo ? (
      <CommandScope icon={topo.icon} armed={paginas?.armed}>
        {topo.label}
      </CommandScope>
    ) : null)

  return (
    <div
      data-slot="command-input-wrapper"
      // `relative z-10`: a faixa fica sobre a lista, e o conteúdo rola por trás
      // do campo. Sem fio e sem tinta: repintar a placa aqui empilharia dois
      // 85% (97,75%) e viraria um retângulo mais claro com aresta na base.
      data-size={size}
      data-touch-floor={touchFloor || undefined}
      className={cn(
        "relative z-10 flex shrink-0 items-center",
        // Na pilha a pílula é solta, sem o recuo da faixa.
        !naPilha && "p-2"
      )}
    >
      {/* O campo é o `SearchInput` com o `Command.Input` do cmdk como filho (o
          cmdk precisa do campo dele para filtrar). Na pilha é a superfície
          `plate`; solto é a `field`, menos no `Combobox`, que pede `plate`. Na
          paleta não há anel nem piso de toque: o campo é autofocado e o anel
          nasceria aceso (quem carrega o foco visível é a linha selecionada), e
          a pilha tem medidas próprias. No `Combobox` e solto, quem chega por
          teclado vê o anel do campo. */}
      <SearchInput
        surface={surface ?? (naPilha ? (noDialogo ? "modal" : "plate") : "field")}
        size={size}
        focusRing={pilha !== "palette"}
        // Sem piso de toque por padrão: a faixa de busca é publicada pela raiz
        // (`--scroll-fade-band-h`, 32 + 16), e a pílula crescendo no dedo sem
        // ela ficaria 8px por baixo da lista. `touchFloor` leva a faixa junto.
        touchFloor={touchFloor}
        caret={caret}
        leading={escopo}
        value={texto}
        onClear={(event) => {
          mudar("")
          // Limpar pelo × não dispara `input` no campo, e a raiz lê `onInput`
          // para voltar ao ocioso. O evento sai do botão para não reentrar no
          // `onChange` com o texto velho.
          event.currentTarget.dispatchEvent(new Event("input", { bubbles: true }))
        }}
        // O feixe da borda de baixo, aceso por `data-waiting`, só no diálogo (ver `globals.css`).
        className={cn(comFeixe && "command-beam")}
        rootProps={{ "data-waiting": (comFeixe && esperando) || undefined } as React.ComponentProps<"div">}
      >
        <CommandPrimitive.Input
          data-slot="command-input"
          aria-label={ariaLabel}
          value={texto}
          onValueChange={mudar}
          onKeyDown={(e) => {
            onKeyDown?.(e)
            if (e.defaultPrevented || !paginas || profundidade === 0) return
            if (e.key === "Backspace" && !texto) {
              e.preventDefault()
              if (paginas.armed) paginas.pop()
              else paginas.setArmed(true)
              return
            }
            if (paginas.armed && e.key !== "Shift") paginas.setArmed(false)
          }}
          className={cn("disabled:opacity-50", className)}
          {...props}
        />
      </SearchInput>
    </div>
  )
}

/**
 * O escopo da busca: o texto pintado antes do que se digita (como o destinatário
 * de um e-mail), no mesmo corpo do campo. Não há ×: com o campo vazio o
 * primeiro Backspace arma o escopo (`armed`, o fundo acende) e o segundo o
 * remove; quem conta os toques é quem tem o estado, e uma região viva diz o que
 * o próximo toque faz. A tinta é uma parada do arco-íris por escopo (`tint`),
 * exceção registrada à invariante de marca. O recuo de 4px vive nos dois
 * estados, compensado por margem negativa, para acender o fundo não empurrar o
 * texto.
 */
function CommandScope({
  icon,
  armed = false,
  tint,
  children,
  className,
  style,
  ...props
}: React.ComponentProps<"span"> & {
  icon?: React.ReactNode
  /** O primeiro Backspace com o campo vazio: o próximo remove o escopo. */
  armed?: boolean
  /** A cor do escopo, um `var(--brand-*)`. Violeta por padrão. */
  tint?: string
}) {
  return (
    <span
      data-slot="command-scope"
      data-armed={armed || undefined}
      style={tint ? ({ "--command-scope-tint": tint, ...style } as React.CSSProperties) : style}
      className={cn(
        // `tint` é uma parada do arco-íris (violeta por padrão). No claro a luz
        // é fixa em 0,47 (as paradas claras davam ~2:1 contra o campo); no
        // escuro todas passam cruas.
        "[--command-scope-ink:oklch(from_var(--command-scope-tint,var(--brand-violet))_0.47_c_h)] dark:[--command-scope-ink:var(--command-scope-tint,var(--brand-violet))]",
        "-mx-1 inline-flex shrink-0 items-center gap-1 rounded-sm px-1 py-0.5 leading-tight font-semibold text-(--command-scope-ink)",
        "[&_svg:not([class*='size-'])]:size-4",
        "transition-colors duration-(--duration-base) ease-(--ease-out)",
        "data-armed:bg-(--command-scope-ink)/20",
        "animate-in fade-in-0 animation-duration-(--duration-base) ease-(--ease-out)",
        className
      )}
      {...props}
    >
      {icon}
      {children}
      <span aria-live="polite" className="sr-only">
        {armed
          ? `Apague de novo para sair de ${typeof children === "string" ? children : "o escopo"}.`
          : ""}
      </span>
    </span>
  )
}

/**
 * A lista, com a altura medida. O cmdk publica a altura do conteúdo em
 * `--cmdk-list-height` (a API oficial para animar altura) e a lista a lê. Como
 * o projeto roda `border-box` e a lista carrega o `pt`/`pb` de
 * `scrollFadeBleedClassName`, a altura da caixa soma os dois recuos mais os 4px
 * de folga de cada um.
 *
 * O teto e a transição são da casca: `--command-list-ceiling` cai no
 * `--command-list-max-h` e `--command-list-transition` em `0s` quando ninguém
 * diz nada (o `CommandDialog` sobrescreve as duas). A transição não vale na
 * primeira pintura: a variável do cmdk só existe depois de dois quadros, e sem
 * a espera a lista deslizaria do teto até o tamanho certo (dois
 * `requestAnimationFrame` encadeados, como no `ThemeToggle`).
 */
function CommandList({
  className,
  children,
  arrows,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.List> & {
  /** As setas de "tem mais": na pilha vêm sempre; fora dela quem é lista suspensa as pede (o `Combobox`). */
  arrows?: boolean
}) {
  const [medido, setMedido] = React.useState(false)

  React.useEffect(() => {
    let segundo: number | null = null
    const primeiro = requestAnimationFrame(() => {
      segundo = requestAnimationFrame(() => setMedido(true))
    })
    return () => {
      cancelAnimationFrame(primeiro)
      if (segundo !== null) cancelAnimationFrame(segundo)
    }
  }, [])

  const pilha = React.useContext(CommandStackContext)
  const noDialogo = React.useContext(CommandBeamContext)
  const naPilha = pilha !== null
  const naPaleta = pilha === "palette"
  // As setas só na pilha pousam na placa (o pai `relative); o `Combobox` as pede por `arrows`.
  const setas = arrows ?? naPilha
  const fadeRef = useScrollFade({ arrows: setas })
  const lista = (
    <CommandPrimitive.List
      ref={fadeRef}
      data-slot="command-list"
      data-medido={medido || undefined}
      className={cn(
        "no-scrollbar overflow-x-hidden overflow-y-auto p-1 outline-none",
        // As linhas surgem do desfoque ao aparecer, só onde a casca declara `--command-reveal` (`0s` por padrão).
        "command-reveal",
        // A dissolução das duas pontas (âncoras, rampa, máscara, folga de
        // rolagem) mora aqui, no elemento que rola; a casca só publica as alturas.
        scrollFadeViewportClassName,
        // O conteúdo sobe para trás das faixas e devolve o mesmo tanto em
        // recuo: o primeiro item nasce abaixo do campo e o que rola passa por
        // baixo, o que dá à rampa o que dissolver.
        scrollFadeBleedClassName,
        // A lista só lê o teto; quem o declara é a casca (variante por seletor
        // perderia a disputa: o `in-*` compila com `:where()`).
        "max-h-(--command-list-max-h)",
        // Os padrões moram no `var()` e não numa declaração aqui: uma local
        // venceria a herdada e a casca nunca mandaria. O `_-_` do `calc()`: o
        // Tailwind não normaliza espaço em torno de `-`.
        "h-[min(calc(var(--cmdk-list-height,var(--command-list-ceiling,var(--command-list-max-h)))_+_var(--scroll-fade-band-h)_+_var(--scroll-fade-foot-h)_+_--spacing(2)),var(--command-list-ceiling,var(--command-list-max-h)))]",
        // Só transiciona depois da primeira medida (ver o cabeçalho).
        "data-medido:transition-[height] data-medido:duration-[var(--command-list-transition,0s)] data-medido:ease-(--ease-out)",
        // Na pilha a placa recua 8px dos lados, para a linha acesa alinhar com as bordas da pílula.
        naPaleta && "px-2",
        className
      )}
      {...props}
    >
      {naPaleta ? (
        // O respiro de cima e de baixo mora dentro do conteúdo medido: um `py`
        // na lista a faria rolar 12px sem precisar.
        <div data-slot="command-list-body" className="py-1.5">
          {children}
        </div>
      ) : (
        children
      )}
    </CommandPrimitive.List>
  )

  // Fora da pilha, as setas pousam na raiz do `Command`, que é `relative`.
  if (!naPilha)
    return setas ? (
      <>
        {lista}
        <ScrollFadeArrows />
      </>
    ) : (
      lista
    )

  // No diálogo a lista mora numa placa própria, porque o campo saiu dela. A
  // placa é um embrulho e não a lista: a lista é o elemento mascarado, e a
  // máscara recortaria fundo, anel e sombra. A faixa do topo zera aqui (não há
  // nada por cima). O canto é a superfície (22) e as linhas são concêntricas com
  // o recuo real da lista (22 − 8 = 14 numa linha de 36).
  return (
    <div
      data-slot="command-dialog-panel"
      className={cn(
        "relative flex min-h-0 flex-col overflow-hidden rounded-surface ring-1 ring-foreground/10 [--scroll-fade-band-h:0px] [--radius-parent:var(--radius-surface)] [--radius-inset:--spacing(2)]",
        noDialogo ? modalSurfaceClassName : menuPanelTintClassName
      )}
    >
      {lista}
      <ScrollFadeArrows />
    </div>
  )
}

/** O vazio. Em coluna, porque um vazio de paleta costuma ter título e dica; `text-muted-foreground` para não competir com os comandos. */
function CommandEmpty({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Empty>) {
  return (
    <CommandPrimitive.Empty
      data-slot="command-empty"
      className={cn(
        // Sem `gap`: título sobre descrição é o mesmo dado em duas linhas.
        "flex flex-col items-center px-6 text-center text-sm text-muted-foreground",
        // O recuo próprio é curto porque a lista já reserva as faixas quando existem.
        "py-6",
        // A ação é outra coisa e ganha respiro (gap entre coisas diferentes).
        "[&_button]:mt-4",
        // O vazio só monta quando a contagem zera, então sobe ao nascer.
        "animate-in fade-in-0 slide-in-from-bottom-1 animation-duration-(--duration-base) ease-(--ease-out)",
        className
      )}
      {...props}
    />
  )
}

/** A linha forte do vazio: o que não foi encontrado. */
function CommandEmptyTitle({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <P
      data-slot="command-empty-title"
      className={cn("font-medium text-balance", className)}
      {...props}
    />
  )
}

/** A saída: o que a pessoa pode tentar em vez disso. */
function CommandEmptyDescription({
  className,
  ...props
}: React.ComponentProps<"p">) {
  return (
    <Caption
      data-slot="command-empty-description"
      className={cn("max-w-xs text-balance", className)}
      {...props}
    />
  )
}

/**
 * O estado de busca assíncrona.
 *
 * O cmdk sempre teve `Command.Loading` e o projeto nunca o expôs — então uma
 * paleta que consulta o servidor não tinha como dizer que está consultando, e
 * a lista vazia se passava por "nada encontrado" enquanto o dado vinha.
 */
function CommandLoading({
  className,
  children,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Loading>) {
  return (
    <CommandPrimitive.Loading
      data-slot="command-loading"
      className={cn(
        // O cmdk embrulha os filhos num `<div aria-hidden>` próprio: é nele
        // que a roda e o texto ficam lado a lado, não na raiz.
        "flex justify-center py-6 text-sm text-muted-foreground [&>div]:flex [&>div]:items-center [&>div]:gap-2",
        className
      )}
      {...props}
    >
      {children}
    </CommandPrimitive.Loading>
  )
}

function CommandGroup({
  className,
  count = false,
  heading,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Group> & {
  /** Quantas linhas casaram, no rótulo ("Transações · 12"): o cmdk desmonta as que não casam e não expõe a contagem por grupo, então ela é contada no DOM do grupo. */
  count?: boolean
}) {
  const naPaleta = React.useContext(CommandStackContext) === "palette"
  const ref = React.useRef<HTMLDivElement | null>(null)
  const [quantas, setQuantas] = React.useState<number | null>(null)
  React.useEffect(() => {
    const no = ref.current
    if (!count || !no) return
    const contar = () => setQuantas(no.querySelectorAll("[cmdk-item]").length)
    contar()
    const observador = new MutationObserver(contar)
    observador.observe(no, { childList: true, subtree: true })
    return () => observador.disconnect()
  }, [count])

  return (
    <CommandPrimitive.Group
      ref={ref}
      heading={
        count && heading != null ? (
          <>
            {heading}
            {quantas != null ? (
              // A contagem não é rótulo: sai da caixa alta e do espaçamento.
              <span data-slot="command-group-count" className="nums font-normal tracking-normal normal-case">
                {" · "}
                {quantas}
              </span>
            ) : null}
          </>
        ) : (
          heading
        )
      }
      data-slot="command-group"
      className={cn(
        // O recuo do cabeçalho acompanha o do item (`px-1.5`), senão o texto do
        // grupo ficava 2px à direita das linhas. `p-0` no grupo porque a casca já recua.
        "overflow-hidden p-0 text-foreground **:[[cmdk-group-heading]]:px-1.5 **:[[cmdk-group-heading]]:text-2xs **:[[cmdk-group-heading]]:font-semibold **:[[cmdk-group-heading]]:tracking-wider **:[[cmdk-group-heading]]:uppercase **:[[cmdk-group-heading]]:text-muted-foreground",
        // O cabeçalho não é um item apagado: caixa alta com `tracking-wider` (a
        // régua `labels="caps"` do `TableHead`) é rótulo, e `text-xs font-medium`
        // é a receita de "linha desabilitada". O respiro é assimétrico, para ele
        // pertencer à lista abaixo e não ficar equidistante dos dois grupos.
        "**:[[cmdk-group-heading]]:pt-1 **:[[cmdk-group-heading]]:pb-0.5",
        // A folga entre grupos é margem no grupo, não recuo no cabeçalho (um
        // `pt` base mais um sob variante seria a mesma propriedade decidida pela
        // ordem de emissão). O primeiro grupo visível não recebe a folga, por
        // `~` e não `+`: o cmdk esconde grupos sem resultado com `hidden` sem
        // tirá-los do DOM, e a adjacência perderia o segundo grupo visível.
        "[[cmdk-group]:not([hidden])~&]:mt-2.5",
        // Na pilha as linhas são de 36, e o respiro cresce junto: 16px entre
        // grupos e 6px entre o rótulo e a primeira linha. Margem, pela mesma razão.
        naPaleta && "[[cmdk-group]:not([hidden])~&]:mt-4 [&>[cmdk-group-items]]:mt-1",
        className
      )}
      {...props}
    />
  )
}

function CommandSeparator({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Separator>) {
  return (
    <CommandPrimitive.Separator
      data-slot="command-separator"
      className={cn(menuSeparatorClassName, className)}
      {...props}
    />
  )
}

/**
 * A linha da paleta. Não desenha tique: o cmdk não emite `data-checked`, e quem
 * marca seleção é quem sabe o que está selecionado (o `Combobox` desenha o
 * próprio check). A geometria vem de `menuItemGeometryClassName`; os estados
 * ficam aqui porque o cmdk os escreve diferente (a linha ativa é
 * `data-selected`, e `data-disabled="false"` fica sempre presente, o que a
 * regra por presença dos menus trataria como desabilitado).
 */
function CommandItem({
  className,
  shortcut,
  children,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Item> & {
  /**
   * A tecla que dispara a linha, na grafia do `Kbd` (`"mod+e"`); aparece na
   * ponta e funciona com o foco na paleta. Evite as do navegador (`mod+n`,
   * `mod+t`, `mod+w`): o Chrome não deixa cancelá-las.
   */
  shortcut?: string
}) {
  const naPaleta = React.useContext(CommandStackContext) === "palette"
  const ref = React.useRef<HTMLDivElement | null>(null)
  const selecionar = React.useRef(props.onSelect)
  React.useEffect(() => {
    selecionar.current = props.onSelect
  })
  const valor = props.value

  React.useEffect(() => {
    if (!shortcut) return
    const aoTeclar = (e: KeyboardEvent) => {
      if (e.defaultPrevented || !matchShortcut(shortcut, e)) return
      // Só com o foco dentro desta paleta: duas paletas numa página não disputam a tecla.
      const raiz = ref.current?.closest("[cmdk-root]")
      if (!raiz || !raiz.contains(document.activeElement)) return
      e.preventDefault()
      selecionar.current?.(valor ?? "")
    }
    document.addEventListener("keydown", aoTeclar)
    return () => document.removeEventListener("keydown", aoTeclar)
  }, [shortcut, valor])

  return (
    <CommandPrimitive.Item
      ref={ref}
      aria-keyshortcuts={shortcut ? ariaShortcut(shortcut) : undefined}
      data-slot="command-item"
      className={cn(
        "group/command-item",
        menuItemGeometryClassName,
        // O acender dos menus (`menuItemFadeClassName`).
        menuItemFadeClassName,
        // Os tons da barra lateral, como todo menu (ver `menu-classes`).
        "data-selected:bg-sidebar-accent/50 active:bg-sidebar-accent data-selected:text-accent-foreground data-selected:*:[svg]:text-accent-foreground",
        // `=true` e não por presença: ver o comentário acima.
        "data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50",
        // Na pilha a linha tem 36; isto garante o piso se a geometria dos menus mudar.
        naPaleta && "min-h-9",
        className
      )}
      {...props}
    >
      {children}
      {shortcut ? (
        <CommandShortcut>
          <Kbd keys={shortcut} />
        </CommandShortcut>
      ) : null}
    </CommandPrimitive.Item>
  )
}

/**
 * O trecho que casou, em negrito, sem acento dos dois lados como o
 * `commandFilter` ("saude" acende "Saú"). Exportada para teste. Anda letra a
 * letra sobre o texto original para manter os índices alinhados; uma letra que
 * vire duas ao perder o acento desliga o destaque em vez de acender o trecho errado.
 */
export function highlightParts(texto: string, busca: string): { text: string; match: boolean }[] {
  const consulta = semAcento(busca.trim())
  if (!consulta) return [{ text: texto, match: false }]
  const letras = [...texto].map(semAcento)
  if (letras.some((l) => l.length !== 1)) return [{ text: texto, match: false }]
  const i = letras.join("").indexOf(consulta)
  if (i < 0) return [{ text: texto, match: false }]
  const original = [...texto]
  const partes = [
    { text: original.slice(0, i).join(""), match: false },
    { text: original.slice(i, i + consulta.length).join(""), match: true },
    { text: original.slice(i + consulta.length).join(""), match: false },
  ]
  return partes.filter((p) => p.text !== "")
}

function semAcento(s: string) {
  return s.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase()
}

function CommandHighlight({ children, className }: { children: string; className?: string }) {
  const busca = useCommandState((estado) => estado.search)
  return (
    <>
      {highlightParts(children, busca).map((parte, i) =>
        parte.match ? (
          <mark
            key={i}
            data-slot="command-highlight"
            className={cn("bg-transparent font-semibold text-inherit", className)}
          >
            {parte.text}
          </mark>
        ) : (
          <React.Fragment key={i}>{parte.text}</React.Fragment>
        )
      )}
    </>
  )
}

/** A lista e a pré-visualização lado a lado (`CommandDialog size="lg"`); abaixo de `md` a pré-visualização some. */
function CommandSplit({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="command-split"
      className={cn(
        "flex min-h-0 items-stretch gap-3",
        "*:data-[slot=command-dialog-panel]:min-w-0 *:data-[slot=command-dialog-panel]:flex-1",
        "*:data-[slot=command-list]:min-w-0 *:data-[slot=command-list]:flex-1",
        className
      )}
      {...props}
    />
  )
}

/**
 * O detalhe da linha selecionada, numa placa ao lado da lista. Lê o valor
 * realçado do cmdk e chama `children` com ele; sem linha realçada mostra
 * `empty`. É região nomeada e não viva: o `aria-activedescendant` já anuncia a
 * linha, e repetir o detalhe a cada seta atropelaria o leitor de tela.
 */
function CommandPreview({
  children,
  empty = null,
  className,
}: {
  children: (value: string) => React.ReactNode
  /** O que mostrar sem linha realçada. */
  empty?: React.ReactNode
  className?: string
}) {
  const valor = useCommandState((estado) => estado.value)
  const naPilha = React.useContext(CommandStackContext) !== null
  const noDialogo = React.useContext(CommandBeamContext)
  return (
    <div
      data-slot="command-preview"
      role="region"
      aria-label="Pré-visualização"
      className={cn(
        "hidden w-72 shrink-0 flex-col gap-3 overflow-y-auto p-4 text-sm md:flex",
        naPilha && cn("rounded-surface ring-1 ring-foreground/10", noDialogo ? modalSurfaceClassName : menuPanelTintClassName),
        className
      )}
    >
      {valor ? (
        <div key={valor} className="flex flex-col gap-3 animate-in fade-in-0 animation-duration-(--duration-base) ease-(--ease-out)">
          {children(valor)}
        </div>
      ) : (
        empty
      )}
    </div>
  )
}

/** A pilha de texto de uma linha de duas linhas (`Content`, `Title`, `Description`, a gramática do `Item`). */
function CommandItemContent({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="command-item-content"
      // Sem `gap`: nome sobre descrição é o mesmo dado em duas linhas.
      className={cn("flex min-w-0 flex-col", className)}
      {...props}
    />
  )
}

function CommandItemTitle({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="command-item-title"
      className={cn("truncate font-medium", className)}
      {...props}
    />
  )
}

function CommandItemDescription({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="command-item-description"
      className={cn(
        "truncate text-xs text-muted-foreground group-data-selected/command-item:text-accent-foreground/80",
        className
      )}
      {...props}
    />
  )
}

/**
 * O ícone da linha, numa caixa de 24 de largura que alinha o nome na mesma
 * coluna em qualquer grupo, e 20 de altura: com os 8 de recuo da linha, ela
 * mede os 36 da pilha (24 de altura levava a linha a 40). Fica cinza e acende com a linha selecionada; quem o tinge é o
 * `group`, não a regra de filho direto do `CommandItem`.
 */
function CommandItemIcon({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="command-item-icon"
      aria-hidden
      className={cn(
        "flex h-5 w-6 shrink-0 items-center justify-center text-muted-foreground transition-colors duration-(--duration-base) ease-(--ease-out) group-data-selected/command-item:text-accent-foreground",
        "[&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}
    />
  )
}

/** O lado direito da linha (contagem, descrição, seta): empurrado para a ponta, com 16px de folga do nome, e cortando antes de encostar nele. */
function CommandItemMeta({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="command-item-meta"
      className={cn("ml-auto flex min-w-0 items-center gap-2 pl-4", className)}
      {...props}
    />
  )
}

/**
 * O sinal da ação, só na linha selecionada: diz o que o Enter faz. `go` (o
 * padrão) é a seta de "ir", que entra na diagonal em que aponta; `add` é o +
 * de criar (as ações de "Nova despesa", "Novo cartão"…), que cresce no lugar.
 */
function CommandItemArrow({
  variant = "go",
  className,
  ...props
}: React.ComponentProps<typeof ArrowUpRightIcon> & { variant?: "go" | "add" }) {
  const Icone = variant === "add" ? PlusIcon : ArrowUpRightIcon
  return (
    <Icone
      data-slot="command-item-arrow"
      data-variant={variant}
      aria-hidden
      className={cn(
        "ml-auto size-4 shrink-0 opacity-0 duration-(--duration-base) ease-(--ease-out) group-data-selected/command-item:opacity-100",
        variant === "add"
          ? "scale-75 transition-[opacity,scale] group-data-selected/command-item:scale-100"
          : "-translate-x-0.5 translate-y-0.5 transition-[opacity,translate] group-data-selected/command-item:translate-x-0 group-data-selected/command-item:translate-y-0",
        className
      )}
      {...props}
    />
  )
}

/**
 * A legenda de teclado da pilha: cada dica é uma cápsula de vidro solta, fora
 * da placa e embaixo dela. É irmã da placa porque um ancestral com
 * `backdrop-filter` é raiz de fundo e o borrão das cápsulas não veria a
 * página. São legendas, não botões, e somem no toque (sem teclado). Último
 * filho de qualquer `Command variant="panel"`.
 */
function CommandDock({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="command-dock"
      className={cn(
        "flex items-center justify-between gap-2 pointer-coarse:hidden",
        className
      )}
      {...props}
    />
  )
}

/** Uma cápsula da legenda: a tecla e o que ela faz, no vidro dos menus. */
function CommandDockItem({ className, ...props }: React.ComponentProps<"span">) {
  const noDialogo = React.useContext(CommandBeamContext)
  return (
    <span
      data-slot="command-dock-item"
      className={cn(
        // Uma linha só: com a pastilha das teclas, a legenda quebrava em duas
        // na paleta de 448; o recuo de 10 dá folga às quatro.
        "inline-flex h-8 items-center gap-1.5 rounded-full px-2.5 text-xs whitespace-nowrap text-muted-foreground ring-1 ring-foreground/10",
        // A cápsula entra sozinha, e não a fileira: um ancestral que se move ou
        // esmaece desliga o borrão dela até a animação acabar.
        "animate-in fade-in-0 slide-in-from-top-2 animation-duration-(--duration-spring) ease-(--ease-spring) [animation-delay:80ms] fill-mode-both [--tw-enter-blur:none]",
        // As teclas com a pastilha do `Kbd` (o fundo dele), a pedido do dono.
        // No `CommandDialog` as três peças vestem o fundo do `Dialog`.
        noDialogo ? modalSurfaceClassName : menuPanelTintClassName,
        className
      )}
      {...props}
    />
  )
}

function CommandShortcut({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="command-shortcut"
      className={cn(
        // Some no toque: sem teclado físico, a tecla não diz nada.
        "ml-auto text-xs tracking-widest text-muted-foreground group-data-selected/command-item:text-accent-foreground pointer-coarse:hidden",
        className
      )}
      {...props}
    />
  )
}

export {
  Command,
  commandVariants,
  CommandDialog,
  origemValida,
  quadroDasBolhas,
  quadroDaGota,
  CommandHighlight,
  CommandPage,
  CommandPages,
  CommandPreview,
  CommandSplit,
  useCommandPages,
  CommandDock,
  CommandDockItem,
  CommandEmpty,
  CommandEmptyDescription,
  CommandEmptyTitle,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandItemContent,
  CommandItemArrow,
  CommandItemDescription,
  CommandItemIcon,
  CommandItemMeta,
  CommandItemTitle,
  CommandList,
  CommandLoading,
  CommandScope,
  CommandSeparator,
  CommandShortcut,
}
