import { join } from "node:path"
import { describe, expect, it } from "vitest"
import { lerFonte, semComentarios } from "@/test/fonte"
import { esperarDepoisDeNoScrollbar } from "@/test/regras"

import { cn } from "@/lib/utils"

import { alertVariants } from "./alert"
import { announcementBarVariants } from "./announcement-bar"
import { badgeVariants } from "./badge"
import { cardVariants } from "./card"
import { buttonVariants } from "./button"
import { checkboxVariants } from "./checkbox"
import { radioVariants } from "./radio"
import { radioGroupItemVariants } from "./radio-group"
import { sliderRangeVariants } from "./slider"

/**
 * O contorno de marca não volta: as peças de escolha vestem o brilho. Três coisas quebram
 * calado: `bg-*` no próprio elemento, apagar `brand-rainbow-image` e halo no `::after` de
 * `Checkbox`/`Radio`, que já é o alvo de toque de 44px.
 */

const RAIZ = join(process.cwd(), "src/components/ui")
/** O CSS sem comentários — senão uma asserção de ausência casa com a prosa
 *  que explica justamente por que aquilo não está lá. */
const fonteCss = () =>
  semComentarios(lerFonte("src/app/globals.css"), "bloco")
const fonte = (nome: string) => semComentarios(lerFonte(join(RAIZ, `${nome}.tsx`)), "numa-passada")

/** As classes de cada peça que veste a marca. */
const PORTADORES = {
  "radio/brand": radioVariants({ variant: "brand" }),
  "radio-group/brandCard": radioGroupItemVariants({ variant: "brandCard" }),
} as const

describe("contorno de marca", () => {
  it("1. o contorno parado saiu da casa, e os dois rádios vestem o brilho", () => {
    // O contorno parado não volta: os dois rádios vestem o brilho, como o `Checkbox brand`.
    for (const [nome, classes] of Object.entries(PORTADORES)) {
      const lista = classes.split(/\s+/)
      expect(lista, nome).toContain("brand-glow")
      expect(lista, nome).toContain("isolate")
      expect(classes, nome).not.toMatch(/--brand-fill|_border-box\]|brand-rainbow-image/)
      expect(classes, nome).not.toMatch(/(^|\s)before:/)
    }
  })

  it("3. o alvo de toque de 44px dos dois átomos sobrevive à marca", () => {
    for (const nome of ["checkbox", "radio"]) {
      // Ele mora na **base** do `cva`, e por isso aparece nas duas variantes.
      const variantes =
        nome === "checkbox"
          ? [checkboxVariants({ variant: "default" }), checkboxVariants({ variant: "brand" })]
          : [radioVariants({ variant: "default" }), PORTADORES["radio/brand"]]
      for (const classes of variantes) {
        expect(classes, nome).toContain("after:-inset-3.5")
      }
    }
  })

  it("4. nenhum dos dois átomos ganha halo — o `::after` já está ocupado", () => {
    for (const nome of ["checkbox", "radio"]) {
      const src = fonte(nome)
      expect(src, nome).not.toMatch(/after:blur|after:-inset-1\b|after:-inset-0\.5/)
      expect(src, nome).not.toContain("after:bg-(image:--brand-rainbow)")
    }
  })

  it("5. o rádio marcado acende o anel e faz o ponto nascer na mola", () => {
    // Mesma entrada do tique do `Checkbox`.
    const base = radioVariants({ variant: "default" })
    expect(base).toContain("data-[state=checked]:border-primary-accent")
    expect(fonte("radio")).toMatch(/zoom-in-0 animation-duration-\(--duration-spring\) ease-\(--ease-spring\)/)
    // E o par `dark:hover:`, sem o qual o realce morre no escuro.
    expect(base).toContain("dark:hover:bg-muted/60")
  })

  it("6. o cartão de marca soma o brilho ao realce do cartão", () => {
    // O brilho soma ao realce de seleção do `card`, e não o substitui: ele acende pelo ponteiro, não pelo estado.
    const marca = PORTADORES["radio-group/brandCard"]
    const sistema = radioGroupItemVariants({ variant: "card" })
    for (const classe of [
      "has-data-checked:border-primary-accent/60",
      "has-data-checked:bg-primary/5",
      "min-h-11",
      "has-[:focus-visible]:ring-3",
      "has-[:disabled]:cursor-not-allowed",
    ]) {
      expect(sistema, classe).toContain(classe)
      expect(marca, classe).toContain(classe)
    }
    expect(fonte("radio-group")).toMatch(/useBrandGlow<HTMLLabelElement>\(resolvido === "brandCard"\)/)
  })

  it("7. os oito controles de campo seguem sem marca", () => {
    // A marca entra nos controles de escolha; o campo de texto fica fora (o anel dele é `fieldFocusRingClassName`).
    for (const nome of [
      "input",
      "textarea",
      "select",
      "combobox",
      "date-picker",
      "form",
      "input-group",
    ]) {
      expect(fonte(nome), nome).not.toMatch(/--brand-|brand-rainbow/)
    }
  })

  it("8. a família do preenchimento — `Progress` e `Slider` — declara a variável", () => {
    // Sem `brand-rainbow-image` o `--brand-rainbow` não é declarado no elemento e a faixa fica
    // transparente, sem erro.
    const faixa = sliderRangeVariants({ variant: "brand" })
    expect(faixa.split(/\s+/)).toContain("brand-rainbow-image")
    expect(faixa).toContain("bg-(image:--brand-rainbow)")
    // O `default` não veste marca nenhuma.
    expect(sliderRangeVariants({ variant: "default" })).not.toMatch(/brand/)
    // E o `Progress` continua na mesma receita.
    expect(fonte("progress")).toContain("brand-rainbow-image")

    // O trilho é o mesmo token nos dois.
    for (const nome of ["progress", "slider"]) {
      expect(fonte(nome), nome).toContain("bg-input-fill")
    }

    // O arco-íris do `Slider` é ancorado na caixa medida do trilho; a conta `10000 / pct` do
    // `Progress` não serve a um slider não controlado.
    const src = fonte("slider")
    expect(src).not.toMatch(/10000/)

    // As quatro variáveis, todas com fallback: sem medição ou sem JS o degradê preenche a faixa.
    for (const v of [
      "--slider-rainbow-w,100%",
      "--slider-rainbow-h,100%",
      "--slider-rainbow-x,0px",
      "--slider-rainbow-y,0px",
    ]) {
      expect(src, v).toContain(v)
    }
    // Sem isto o degradê ladrilha quando a imagem é menor que a faixa.
    expect(faixa.split(/\s+/)).toContain("bg-no-repeat")

    // A regra que o marcador do `Tabs` já tranca: `offsetLeft` relativo ao
    // trilho, nunca o retângulo do viewport — com a página rolada ele escorrega.
    expect(src).toMatch(/offsetLeft/)
    expect(src).not.toMatch(/getBoundingClientRect/)

    // Os dois observadores cobrem coisas diferentes, e o de `style` é o que
    // pega a faixa **andando sem mudar de tamanho** (slider de intervalo).
    expect(src).toMatch(/new ResizeObserver/)
    expect(src).toMatch(/attributeFilter: \["style"\]/)

    // E um slider comum não paga observador nenhum.
    expect(src).toMatch(/variant !== "brand"/)
  })

  it("9. a família do véu — `AnnouncementBar`", () => {
    // O véu do `AnnouncementBar` é a exceção consciente à invariante 3, paga pelo alfa `--brand-flow-alpha`.
    const barra = announcementBarVariants({ variant: "brand" })
    const classes = barra.split(/\s+/)
    const CSS = fonteCss()

    // O véu mora num pseudo em `z` negativo; sem `isolate` ele some atrás do fundo de um ancestral.
    for (const c of ["isolate", "before:-z-1", "before:inset-0", "before:brand-flow"]) {
      expect(classes, c).toContain(c)
    }

    // Dois arco-íris na mesma faixa seria o defeito.
    expect(barra).not.toContain("after:bg-(image:--brand-rainbow)")
    expect(barra).not.toMatch(/blur/)

    // A utility mora depois de `no-scrollbar`: a faixa anterior é fatiada pelo `glass.test.ts`.
    const bloco = esperarDepoisDeNoScrollbar(CSS, "@utility brand-flow", { fecha: "@utility" })
    expect(bloco).toMatch(/mask-composite: intersect/)
    expect(bloco).toMatch(/var\(--brand-flow-alpha\)/)
    expect(bloco).toMatch(/animation: brand-flow 20s linear infinite/)

    // O alfa é por tema: é ele que segura o contraste do texto.
    expect(CSS.match(/--brand-flow-alpha:/g)?.length).toBe(2)

    // **O véu substitui o fio do `sticky`, e não se soma a ele.**
    expect(classes).toContain("border-b-0")

    // A ordem das chaves no `cva` é carga estrutural: com `variant` antes de `position`, o
    // `border-b` do `sticky` venceria o `border-b-0`.
    const src = fonte("announcement-bar")
    expect(src.indexOf("position: {")).toBeGreaterThan(0)
    expect(src.indexOf("variant: {")).toBeGreaterThan(src.indexOf("position: {"))

    // A superfície neutra da marca vence a tonal, por isso o tipo proíbe `tone` junto de `brand`.
    for (const nome of ["alert", "announcement-bar"]) {
      expect(fonte(nome), nome).toMatch(/variant: "brand"; tone\?: never/)
    }

    // Quem garante o "vence" é o `tailwind-merge` (`cn`), não a cascata: sem ele `text-foreground` e `text-info-muted-foreground` empatam.
    const barraMesclada = cn(
      announcementBarVariants({ tone: "info", variant: "brand", position: "sticky" })
    ).split(/\s+/)
    expect(barraMesclada).toContain("text-foreground")
    expect(barraMesclada).not.toContain("text-info-muted-foreground")
    expect(barraMesclada).toContain("bg-transparent")
    expect(barraMesclada).not.toContain("bg-info-muted")
    // O fio cinza do `sticky` tem de ter **desaparecido**, não perdido a
    // disputa: duas linhas de 1px empilhadas é o defeito.
    expect(barraMesclada).toContain("border-b-0")
    expect(barraMesclada).not.toContain("border-b")
    // A barra continua presa: o `relative` do véu não pode vencer o `sticky`.
    expect(barraMesclada).toContain("sticky")
    expect(barraMesclada).not.toContain("relative")

    // O mesmo no alerta: o tipo proíbe `tone` em `brand`, e no runtime a
    // combinação ainda degrada para a superfície neutra em vez de misturar.
    const alertaMesclado = cn(
      alertVariants({ tone: "destructive", variant: "brand" })
    ).split(/\s+/)
    expect(alertaMesclado).toContain("bg-card")
    expect(alertaMesclado).not.toContain("bg-destructive-muted")
    expect(alertaMesclado).not.toContain("text-destructive-muted-foreground")
  })

  it("10. a família do brilho — `Alert`", () => {
    // A família do brilho: o arco-íris acende num arco da borda conforme o ponteiro passa; nada se move sem o ponteiro.
    const alerta = alertVariants({ variant: "brand" })
    const classes = alerta.split(/\s+/)
    const CSS = fonteCss()

    // `brand-rainbow-image` declara o token no elemento; sem ela o `background` cai para `none`.
    expect(classes).toContain("brand-rainbow-image")
    expect(classes).toContain("brand-glow")

    // `isolate` é obrigatório: sem ele o pseudo de `z` negativo some atrás do fundo de um ancestral.
    expect(classes).toContain("isolate")

    // Marca em repouso e arco aceso seriam dois arco-íris na mesma caixa.
    expect(alerta).not.toContain("before:w-0.5")
    expect(alerta).not.toContain("before:rounded-full")

    // A fatia da utility termina na `@utility` seguinte (um `indexOf` de −1 engoliria o resto do arquivo).
    const iniUtil = CSS.indexOf("@utility brand-glow")
    const util = CSS.slice(
      iniUtil,
      CSS.indexOf("@utility ", iniUtil + 20)
    )
    expect(util.length).toBeGreaterThan(0)

    // A cor fica parada e a janela é que anda: o `background` é um cônico de ângulo fixo e só o `mask-image` carrega `--brand-glow-start`.
    const corpoBg = util.slice(
      util.indexOf("background:"),
      util.indexOf("filter:")
    )
    const corpoMask = util.slice(util.indexOf("-webkit-mask-image:"))
    expect(corpoBg).toContain("repeating-conic-gradient")
    expect(corpoBg).not.toMatch(/--brand-glow-start/) // a cor NÃO gira
    expect(corpoMask).toMatch(/--brand-glow-start/) // a janela gira

    // A máscara recorta o anel (janela menos `padding-box`) e o meio nunca é pintado; a forma de três camadas deixava o anel fino do lado oposto ao arco.
    expect(corpoMask.match(/conic-gradient/g)?.length).toBe(2) // mask + -webkit
    expect(util).toMatch(/-webkit-mask-clip: border-box, padding-box;/)
    expect(util).toMatch(/-webkit-mask-composite: source-out;/)
    expect(util).toMatch(/\bmask-clip: border-box, padding-box;/)
    expect(util).toMatch(/\bmask-composite: subtract;/)
    expect(util).not.toMatch(/intersect, exclude|source-in, xor/)
    // Uma camada `none` num `intersect` apagaria a peça: a janela é a única com variável, e o
    // fallback mora no próprio `var()`.
    expect(corpoMask).toMatch(/var\(--brand-glow-start, 0\)/)
    expect(corpoMask).not.toMatch(/var\(--brand-glow-start\)/)
    // E o pseudo não pinta miolo nenhum: só o arco-íris, na `border-box`.
    expect(corpoBg).not.toMatch(/padding-box|--brand-glow-core|--brand-glow-overlay/)

    // A janela é um triângulo puro: três paradas, opaco no meio, fechando em `spread * 2`.
    expect(corpoMask).toMatch(/transparent,\s*#000,\s*transparent/)
    expect(corpoMask).toMatch(/var\(--brand-glow-spread\) \* 2deg/)

    // Sem `radial-gradient`: círculos no interior da caixa não alcançam o anel de 2px da aresta.
    expect(corpoBg).not.toMatch(/radial-gradient/)

    // 8 paradas × 2,5 voltas = 20 faixas de 18°, a largura de banda da referência.
    expect(util).toMatch(/--brand-glow-repeat:\s*2\.5/)

    // A rampa linear do token não serve aqui: ela não é cônica. As oito
    // paradas da marca continuam sendo a fonte de cor.
    expect(util).not.toMatch(/var\(--brand-rainbow\)/)
    for (const parada of [
      "teal",
      "blue",
      "indigo",
      "violet",
      "magenta",
      "coral",
      "amber",
      "green",
    ]) {
      expect(util, parada).toContain(`var(--brand-${parada})`)
    }

    // A abertura sai do `spread`, e não de medidas soltas.
    expect(util).toMatch(/--brand-glow-spread/)

    // A máscara que recorta o anel impede o degradê de cobrir o texto.
    expect(classes).toContain("bg-card")
    expect(util).not.toMatch(/--brand-glow-core|--brand-glow-overlay/)
    expect(util).toMatch(/border-box/)
    expect(util).toMatch(/z-index:\s*-10/)

    // O borrão é o efeito aqui.
    expect(util).toMatch(/filter:\s*blur/)

    // O ângulo é animado por JavaScript e a propriedade não é registrada: nada de `@property` com `transition`.
    expect(CSS).not.toMatch(/@property --brand-glow-start/)
    expect(util).not.toMatch(/transition:\s*--brand-glow-start/)

    // O ângulo tem valor inicial na utility: sem ele o `calc()` é inválido, `mask-image` vira `none` e o anel aparece inteiro.
    expect(util).toMatch(/--brand-glow-start:\s*0;/)

    // Sem ponteiro fino não monta nada, e o listener sai no unmount.
    const src = semComentarios(lerFonte("src/hooks/use-brand-glow.ts"), "numa-passada")
    expect(fonte("alert")).toMatch(/useBrandGlow\(variant === "brand"\)/)
    expect(src).toMatch(/\(hover: hover\)/)
    expect(src).toMatch(/removeEventListener\("pointermove"/)
    // E nada de estado React para a posição: é `setProperty`, como no `Button`.
    expect(src).toMatch(/setProperty\("--brand-glow-start"/)

    // A animação é o `animate` do `motion`, com a duração e a ease da referência, escrevendo a variável no `onUpdate`.
    expect(src).toMatch(/from "motion\/react"/)
    expect(src).toMatch(/animate\(atual, atual \+ delta/)
    expect(src).toMatch(/duration: GLOW_DURACAO/)
    expect(src).toMatch(/GLOW_DURACAO = 2/)
    expect(src).toMatch(/GLOW_EASE = \[0\.16, 1, 0\.3, 1\]/)
    // O ângulo atual sai do DOM, não de um acumulador: ele guarda o alvo, não onde a animação está.
    expect(src).toMatch(/getPropertyValue\("--brand-glow-start"\)/)
    // Movimento reduzido é perguntado à mão: um tween de JS escapa do bloco global que encurta transição de CSS.
    expect(src).toMatch(/prefers-reduced-motion: reduce/)
    expect(src).toMatch(/if \(semMovimento\)/)
    expect(src).not.toMatch(/let angulo/)
    // O tween anterior para antes do novo, e no unmount.
    expect(src.match(/tween\?\.stop\(\)/g)?.length).toBe(2)

    // A rolagem recalcula o estado, não só a geometria: guarda a última posição do ponteiro e refaz a conta.
    expect(src).toMatch(/ultimaX/)
    expect(src).toMatch(/const aoRolar = \(\) => agendar\(\)/)
    // `capture: true`: `scroll` não borbulha mas captura, e sem isso a rolagem dentro de um container passa despercebida.
    expect(src).toMatch(/addEventListener\("scroll", aoRolar, \{ capture: true/)
    // Sair da janela não manda `pointermove`: o arco da peça no topo (a busca da barra)
    // ficava aceso na última posição. Sair sem destino, ou perder o foco, apaga.
    expect(src).toMatch(/addEventListener\("pointerout", aoSair/)
    expect(src).toMatch(/if \(!e\.relatedTarget\) esquecer\(\)/)
    expect(src).toMatch(/addEventListener\("blur", esquecer\)/)
    expect(src).toMatch(/removeEventListener\("pointerout", aoSair\)/)

    // O `rAF` coalesce uma rajada de `pointermove` num quadro (um ponto de agendamento, e um cancelamento); não é o laço de polling.
    expect(src.match(/requestAnimationFrame\(/g)?.length).toBe(1)
    expect(src).toMatch(/cancelAnimationFrame/)
    // O quadro pendente não é cancelado a cada evento: com um `pointermove` por quadro, a
    // conta nunca rodava enquanto o mouse andava, e o arco ficava aceso longe da peça.
    expect(src).toMatch(/if \(!quadro\) quadro = requestAnimationFrame\(calcular\)/)
    // O tween e o quadro pendentes morrem no unmount, junto dos listeners.
    expect(src).toMatch(
      /return \(\) => \{\s*tween\?\.stop\(\)\s*if \(quadro\) cancelAnimationFrame/
    )

    // A barra **não** ganhou nada disso.
    const barra = announcementBarVariants({ variant: "brand" })
    expect(barra).not.toContain("brand-glow")
    expect(barra).not.toMatch(/blur/)
  })

  it("11. o Card veste o mesmo brilho, e o recorte deixa folga para o anel", () => {
    // O casco recorta com `overflow: clip` e 4px de margem (`var(--spacing)` cru, o Chrome rejeita `calc()` ali) para o anel, 2px fora da caixa, não sumir.
    const cartao = cn(cardVariants({ variant: "brand" })).split(/\s+/)
    for (const c of ["brand-rainbow-image", "brand-glow", "isolate", "overflow-clip", "[overflow-clip-margin:var(--spacing)]"]) {
      expect(cartao, c).toContain(c)
    }
    // O `overflow-hidden` da base tem de ter perdido a disputa, não coexistido.
    expect(cartao).not.toContain("overflow-hidden")
    expect(fonte("card")).toMatch(/useBrandGlow\(variant === "brand"\)/)

    // O `Badge` em repouso é um chip `muted`; o núcleo do anel é a mesma cor, e o halo do contorno não pode sobreviver ao lado do brilho.
    const chip = cn(badgeVariants({ variant: "brand" })).split(/\s+/)
    for (const c of ["brand-rainbow-image", "brand-glow", "relative", "isolate", "bg-muted", "[--brand-glow-opacity:1]"]) {
      expect(chip, c).toContain(c)
    }
    expect(chip.join(" ")).not.toMatch(/after:blur|--brand-fill/)
    expect(fonte("badge")).toMatch(/useBrandGlow<HTMLSpanElement>\(variant === "brand"\)/)

    // O `Button brand`, neutro sobre o `secondary`.
    const botao = cn(buttonVariants({ variant: "brand" })).split(/\s+/)
    for (const c of ["brand-rainbow-image", "brand-glow", "relative", "isolate", "bg-secondary"]) {
      expect(botao, c).toContain(c)
    }
    expect(fonte("button")).toMatch(/useBrandGlow<HTMLButtonElement>\(variant === "brand"\)/)

    // O `Checkbox brand`: só o anel acende, e o preenchimento marcado aparece intacto sob ele.
    const caixa = cn(checkboxVariants({ variant: "brand" })).split(/\s+/)
    for (const c of ["brand-glow", "isolate", "[--brand-glow-opacity:1]"]) {
      expect(caixa, c).toContain(c)
    }
    // O `::after` continua sendo o alvo de toque, e nada do contorno sobrou.
    expect(caixa).toContain("after:-inset-3.5")
    expect(caixa.join(" ")).not.toMatch(/(^|\s)before:|brand-rainbow-slide|--brand-fill/)
    expect(fonte("checkbox")).toMatch(/useBrandGlow<HTMLButtonElement>\(variant === "brand"\)/)

    // O `Radio brand` e o `brandCard`.
    const anel = cn(radioVariants({ variant: "brand" })).split(/\s+/)
    for (const c of ["brand-glow", "isolate", "[--brand-glow-opacity:1]", "after:-inset-3.5"]) {
      expect(anel, c).toContain(c)
    }
    expect(fonte("radio")).toMatch(/useBrandGlow<HTMLButtonElement>\(variant === "brand"\)/)

    // Nenhuma peça declara mais um núcleo: ele é o que virava o feixe.
    for (const nome of ["button", "badge", "checkbox", "alert", "card", "radio", "radio-group"]) {
      expect(fonte(nome), nome).not.toMatch(/\[--brand-glow-(core|overlay):/)
    }
  })
})
