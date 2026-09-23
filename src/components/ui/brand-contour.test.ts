import { readFileSync } from "node:fs"
import { join } from "node:path"
import { describe, expect, it } from "vitest"

import { cn } from "@/lib/utils"

import { alertVariants } from "./alert"
import { announcementBarVariants } from "./announcement-bar"
import { badgeVariants } from "./badge"
import { buttonVariants } from "./button"
import { checkboxVariants } from "./checkbox"
import { radioVariants } from "./radio"
import { radioGroupItemVariants } from "./radio-group"
import { sliderRangeVariants } from "./slider"

/**
 * O contorno de marca, e o que ele não pode virar.
 *
 * Cinco peças desenham o arco-íris da marca por **contorno**: os dois pesos do
 * `Button`, o `Badge`, e agora o `Checkbox`, o `Radio` e o cartão do
 * `RadioGroup`. A receita é uma só — 1px de `border-box` sobre um núcleo
 * chapado em `padding-box` — e ela tem três jeitos conhecidos de quebrar
 * calada:
 *
 * 1. alguém declara `bg-*` no próprio elemento e o núcleo some, porque numa
 *    raiz de empilhamento o fundo pinta **antes** dos filhos de `z` negativo;
 * 2. alguém apaga `brand-rainbow-image` por parecer decoração, e `--brand-rainbow`
 *    deixa de ser declarado no elemento (rodada 88);
 * 3. alguém acrescenta o halo do botão ao `Checkbox` ou ao `Radio`, onde o
 *    `::after` **já é o alvo de toque de 44px**.
 *
 * Nenhum dos três derruba tipo nem lint.
 */

const RAIZ = join(process.cwd(), "src/components/ui")
/** O CSS sem comentários — senão uma asserção de ausência casa com a prosa
 *  que explica justamente por que aquilo não está lá. */
const fonteCss = () =>
  readFileSync(join(process.cwd(), "src/app/globals.css"), "utf8").replace(
    /\/\*[\s\S]*?\*\//g,
    " "
  )
const fonte = (nome: string) =>
  readFileSync(join(RAIZ, `${nome}.tsx`), "utf8").replace(
    /\/\*[\s\S]*?\*\/|\/\/.*$/gm,
    " "
  )

/** As classes de cada peça que veste a marca. */
const PORTADORES = {
  "button/brand": buttonVariants({ variant: "brand" }),
  "button/brandOutline": buttonVariants({ variant: "brandOutline" }),
  "badge/brand": badgeVariants({ variant: "brand" }),
  "checkbox/brand": checkboxVariants({ variant: "brand" }),
  "radio/brand": radioVariants({ variant: "brand" }),
  "radio-group/brandCard": radioGroupItemVariants({ variant: "brandCard" }),
} as const

describe("contorno de marca", () => {
  it("1. toda peça de marca declara `--brand-rainbow` no próprio elemento", () => {
    for (const [nome, classes] of Object.entries(PORTADORES)) {
      // É `brand-rainbow-image` quem declara a variável no elemento; os
      // pseudo-elementos herdam daqui o valor já substituído. Um `var()` dentro
      // de uma propriedade personalizada resolve onde ela é **declarada**.
      expect(classes.split(/\s+/), nome).toContain("brand-rainbow-image")
      expect(classes, nome).toContain("--brand-fill:")
      expect(classes, nome).toContain("_border-box]")
    }
  })

  it("2. o núcleo mora no pseudo, e nunca no elemento", () => {
    // Só conta `bg-` que **pinta**: os modificadores (`bg-clip-padding`,
    // `bg-origin-*`, posição, repetição) não põem cor nenhuma.
    const NAO_PINTA =
      /^bg-(clip|origin|blend|repeat|no-repeat|auto|cover|contain|fixed|local|scroll|top|bottom|left|right|center)/
    const pinta = (classe: string) =>
      /(^|:)bg-/.test(classe) &&
      !/before:|after:/.test(classe) &&
      !NAO_PINTA.test(classe.replace(/^.*:/, ""))

    for (const [nome, classes] of Object.entries(PORTADORES)) {
      expect(classes.split(/\s+/), nome).toContain("isolate")
    }

    // A armadilha de empilhamento: tinta no **próprio elemento** pinta antes do
    // `::before` a `-z-10` e o esconde. A régua é o estado em que o contorno
    // aparece.
    //
    // No `Button` e no `Badge` a marca está sempre acesa, então o elemento não
    // pinta em repouso — nenhum `bg-` sem pseudo.
    for (const nome of ["button/brand", "button/brandOutline", "badge/brand"] as const) {
      expect(PORTADORES[nome].split(/\s+/).filter(pinta), nome).toEqual([])
    }

    // Nos três controles de escolha ela só acende marcada, e desmarcado é a
    // superfície do sistema — `bg-background` na caixa é o que se **deve** ver
    // enquanto o pseudo está a zero. O que não pode existir é tinta sob o
    // contorno: nenhum `bg-` atrás de um variante de marcado.
    for (const nome of [
      "checkbox/brand",
      "radio/brand",
      "radio-group/brandCard",
    ] as const) {
      const sobMarcado = PORTADORES[nome]
        .split(/\s+/)
        .filter((c) => /checked/.test(c))
        .filter(pinta)
      expect(sobMarcado, nome).toEqual([])
    }
  })

  it("3. o alvo de toque de 44px dos dois átomos sobrevive à marca", () => {
    for (const nome of ["checkbox", "radio"]) {
      // Ele mora na **base** do `cva`, e por isso aparece nas duas variantes.
      const variantes =
        nome === "checkbox"
          ? [checkboxVariants({ variant: "default" }), PORTADORES["checkbox/brand"]]
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

  it("5. o arco-íris só aparece marcado, e ele esmaece", () => {
    expect(PORTADORES["checkbox/brand"]).toContain(
      "data-[state=checked]:before:opacity-100"
    )
    expect(PORTADORES["radio/brand"]).toContain(
      "data-[state=checked]:before:opacity-100"
    )
    expect(PORTADORES["radio-group/brandCard"]).toContain(
      "has-data-checked:before:opacity-100"
    )
    for (const nome of [
      "checkbox/brand",
      "radio/brand",
      "radio-group/brandCard",
    ] as const) {
      // Desmarcado é o fio do sistema, e a passagem é uma transição e não um
      // estalo: `background-image` não interpola entre um degradê e `none`, e é
      // por isso que quem liga e desliga é a opacidade.
      expect(PORTADORES[nome], nome).toContain("before:opacity-0")
      expect(PORTADORES[nome], nome).toContain("before:transition-opacity")
      expect(PORTADORES[nome], nome).toContain(
        "before:duration-(--duration-fast)"
      )
    }
  })

  it("6. o cartão de marca troca o realce, e não o soma", () => {
    const marca = PORTADORES["radio-group/brandCard"]
    const sistema = radioGroupItemVariants({ variant: "card" })
    // A lavagem de 5% e o contorno `primary-accent` são o realce do `card`.
    // Somá-los à marca daria dois sinais de seleção na mesma aresta.
    expect(sistema).toContain("has-data-checked:border-primary-accent/60")
    expect(marca).not.toContain("has-data-checked:border-primary-accent")
    expect(marca).not.toContain("has-data-checked:bg-primary")
    // E o que os dois cartões dividem continua dividido.
    for (const classe of [
      "min-h-11",
      "has-[:focus-visible]:ring-3",
      "has-[:disabled]:cursor-not-allowed",
    ]) {
      expect(marca, classe).toContain(classe)
    }
  })

  it("7. os oito controles de campo seguem sem marca", () => {
    // A régua de `field-control-ladder` não muda com esta rodada: a marca entra
    // nos controles de **escolha**, e o campo de texto continua fora — cinco
    // tentativas recusadas na tela, e `fieldFocusRingClassName` é o anel dele.
    for (const nome of [
      "input",
      "textarea",
      "native-select",
      "select",
      "combobox",
      "date-picker",
      "form-picker-popover",
      "input-group",
    ]) {
      expect(fonte(nome), nome).not.toMatch(/--brand-|brand-rainbow/)
    }
  })

  it("8. a família do preenchimento — `Progress` e `Slider` — declara a variável", () => {
    // Estas duas não desenham contorno: o arco-íris **preenche**, e o que as
    // liberta da invariante 3 é não haver rótulo em cima. O modo de quebrar
    // calado é outro e é o mesmo dos dois: apagar `brand-rainbow-image` por
    // parecer decoração. É ela que declara `--brand-rainbow` no elemento — sem
    // ela `bg-(image:--brand-rainbow)` cai para `none` e a faixa fica
    // transparente, sem erro nenhum.
    const faixa = sliderRangeVariants({ variant: "brand" })
    expect(faixa.split(/\s+/)).toContain("brand-rainbow-image")
    expect(faixa).toContain("bg-(image:--brand-rainbow)")
    // O `default` não veste marca nenhuma.
    expect(sliderRangeVariants({ variant: "default" })).not.toMatch(/brand/)
    // E o `Progress` continua na mesma receita.
    expect(fonte("progress")).toContain("brand-rainbow-image")

    // O trilho é o **mesmo token** nos dois, e é isso que faz os números do
    // claro coincidirem (pior caso 1,42 na lima, cinco paradas abaixo de 3:1).
    for (const nome of ["progress", "slider"]) {
      expect(fonte(nome), nome).toContain("bg-input-fill")
    }

    // **O arco-íris do `Slider` é ancorado no trilho, e por medição.** A conta
    // do `Progress` (`background-size: 10000 / pct`) continua proibida aqui:
    // ela exige saber a porcentagem no render, e um slider não controlado não a
    // tem — congelaria no valor inicial. Quem ancora é a caixa medida.
    const src = fonte("slider")
    expect(src).not.toMatch(/10000/)

    // As quatro variáveis, **todas com fallback**: é o fallback que faz a peça
    // degradar para "degradê preenche a faixa" antes da primeira medição e sem
    // JavaScript, em vez de derrubar a declaração.
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

  it("9. a família da régua — `AnnouncementBar`", () => {
    // A terceira família de peça de marca. O contorno vive em 1px de
    // `border-box` sobre um núcleo chapado; o preenchimento (`Progress`,
    // `Slider`) revela o degradê numa barra; a **régua** põe o arco-íris num
    // fio na **aresta** do aviso — aqui, horizontal, na base da faixa.
    //
    // Ela existe porque o contorno degenera numa faixa de largura total:
    // esquerda e direita saem da tela e o topo encosta na borda do viewport,
    // sobrando exatamente os dois fios horizontais.
    //
    // **O `Alert` saiu desta família na rodada 119** e virou a quarta, a do
    // brilho — teste 10. A barra ficou, e a razão é a mesma geometria: um arco
    // correndo pelas quatro bordas de uma faixa full-bleed degenera igual.
    const barra = announcementBarVariants({ variant: "brand" })
    const PECAS = { "announcement-bar/brand": barra }

    for (const [nome, classes] of Object.entries(PECAS)) {
      // Modo de falha nº 2 do cabeçalho deste arquivo: sem esta utility o
      // token não é declarado no elemento, o `background-image` cai para
      // `none` e a régua desaparece **sem erro nenhum**.
      expect(classes.split(/\s+/), nome).toContain("brand-rainbow-image")

      // O degradê mora no pseudo, e nunca no elemento: arco-íris sob texto é a
      // invariante 3 violada com sete matizes de uma vez, e é o que o fio de
      // 1–2px evita por construção.
      const pinturas = classes
        .split(/\s+/)
        .filter((c) => c.includes("bg-(image:--brand-rainbow)"))
      expect(pinturas.length, nome).toBeGreaterThan(0)
      for (const c of pinturas) {
        expect(c, nome).toMatch(/^(before|after):/)
      }

      // Nem contorno nem halo. As duas primeiras absências separam esta
      // família da do contorno (que sempre traz um núcleo chapado em
      // `--brand-fill` sob uma camada `border-box`); a terceira é o motivo de o
      // `brandOutline` existir — o `::after` borrado sangra 4px e encosta no
      // vizinho, que num aviso é o conteúdo da tela.
      expect(classes, nome).not.toContain("--brand-fill:")
      expect(classes, nome).not.toContain("_border-box]")
      expect(classes, nome).not.toMatch(/blur/)
    }

    // A geometria: o fio é horizontal, na base, e tem a espessura do fio que
    // substitui.
    for (const c of ["after:inset-x-0", "after:bottom-0", "after:h-px"]) {
      expect(barra.split(/\s+/), c).toContain(c)
    }

    // **O fio da marca substitui o do `sticky`, e não se soma a ele.** Duas
    // linhas de 1px empilhadas — uma cinza e uma de arco-íris — é o defeito
    // que isto evita.
    expect(barra.split(/\s+/)).toContain("border-b-0")

    // E a ordem das chaves no `cva` é **carga estrutural**, não estilo: o `cva`
    // concatena na ordem em que os eixos são declarados e o `tailwind-merge`
    // resolve por último-vence. Com `variant` antes de `sticky`, o `border-b`
    // do `sticky` venceria o `border-b-0` daqui e o fio cinza voltaria.
    const src = fonte("announcement-bar")
    expect(src.indexOf("sticky: {")).toBeGreaterThan(0)
    expect(src.indexOf("variant: {")).toBeGreaterThan(src.indexOf("sticky: {"))

    // Pelo mesmo mecanismo, a superfície neutra da marca vence a tonal — e é
    // por isso que os dois tipos proíbem `tone` junto de `brand`, em vez de
    // deixar a tela escrever uma cor que não pinta. O precedente é o
    // `Progress`, com `tone`, `bands` e `brand`.
    for (const nome of ["alert", "announcement-bar"]) {
      expect(fonte(nome), nome).toMatch(/variant: "brand"; tone\?: never/)
    }

    // **E quem garante esse "vence" é o `tailwind-merge`, não a cascata.**
    // Medido: pondo as duas classes cruas no mesmo `class` — sem passar pelo
    // `cn` —, a faixa de marca saía com o texto **azul**
    // (`oklch(0.36 0.1 240)`, o `--info-muted-foreground`), porque
    // `text-foreground` e `text-info-muted-foreground` empatam em (0,1,0) e
    // quem decide é a ordem de emissão do Tailwind, não a ordem no atributo.
    // O `cn` **remove** o perdedor, e é essa remoção que a peça depende.
    // Quem montar as variantes à mão traz o defeito de volta.
    const barraMesclada = cn(
      announcementBarVariants({ tone: "info", variant: "brand", sticky: true })
    ).split(/\s+/)
    expect(barraMesclada).toContain("text-foreground")
    expect(barraMesclada).not.toContain("text-info-muted-foreground")
    expect(barraMesclada).toContain("bg-muted")
    expect(barraMesclada).not.toContain("bg-info-muted")
    // O fio cinza do `sticky` tem de ter **desaparecido**, não perdido a
    // disputa: duas linhas de 1px empilhadas é o defeito.
    expect(barraMesclada).toContain("border-b-0")
    expect(barraMesclada).not.toContain("border-b")

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
    // A quarta família: o arco-íris acende num **arco da borda** conforme o
    // ponteiro passa, com um leve borrão. Ela nasceu da referência
    // `GlowingEffect` da Aceternity, e **não** é o giro da rodada 100 — lá o
    // degradê rodava sozinho num laço e o dono o recusou inteiro; aqui nada se
    // move sem o ponteiro se mover, que é a forma que a rodada 98 sancionou.
    const alerta = alertVariants({ variant: "brand" })
    const classes = alerta.split(/\s+/)
    const CSS = fonteCss()

    // A cor sai do mesmo token das outras peças, e `brand-rainbow-image` é
    // quem o declara no elemento — sem ela o `background` cai para `none` e o
    // brilho some sem erro nenhum.
    expect(classes).toContain("brand-rainbow-image")
    expect(classes).toContain("alert-glow")

    // **`isolate` é obrigatório, e foi medido.** Sem ele o pseudo de `z`
    // negativo cai atrás do fundo de um ancestral e não aparece.
    expect(classes).toContain("isolate")

    // A régua saiu: quem herdar este arquivo não pode achar que as duas
    // convivem. Uma marca em repouso **e** um arco aceso seriam dois
    // arco-íris na mesma caixa.
    expect(alerta).not.toContain("before:w-0.5")
    expect(alerta).not.toContain("before:rounded-full")

    // A utility existe, e as quatro decisões medidas estão nela.
    const util = CSS.slice(
      CSS.indexOf("@utility alert-glow"),
      CSS.indexOf("@property --alert-glow-start")
    )
    expect(util.length).toBeGreaterThan(0)

    // **A cor fica parada e a janela é que anda — e eu errei isto duas vezes.**
    // Medido no bundle ao vivo da referência (21st): o `background-image` dela
    // é um `repeating-conic-gradient(from 236.84deg …)`, de ângulo **fixo**, e
    // quem carrega o `--start` é o `mask-image`. É isso que faz o arco **trocar
    // de cor** conforme viaja: a janela revela faixas diferentes de um
    // arco-íris parado.
    //
    // A 1ª tentativa mascarava o `--brand-rainbow`, que é **linear**, e a
    // janela revelava sempre a mesma cor naquela aresta. A 2ª girou o cônico
    // **junto** com o arco, e aí ele carrega sempre a mesma sequência e só muda
    // de lugar. As duas asserções abaixo são a invariante que separa o certo
    // dos dois erros.
    const corpoBg = util.slice(
      util.indexOf("background:"),
      util.indexOf("filter:")
    )
    const corpoMask = util.slice(util.indexOf("-webkit-mask-image:"))
    expect(corpoBg).toContain("repeating-conic-gradient")
    expect(corpoBg).not.toMatch(/--alert-glow-start/) // a cor NÃO gira
    expect(corpoMask).toMatch(/--alert-glow-start/) // a janela gira

    // **Uma camada de máscara, e `mask-composite` continua proibido.** A
    // referência compõe duas (`intersect, intersect`) só para recortar o anel;
    // aqui esse trabalho é do par `padding-box`/`border-box`, e onde a máscara
    // apaga aparece o `bg-card` do alerta, idêntico ao núcleo. O banimento
    // medido é da composição: uma camada `none` num `intersect` apaga a peça.
    expect(util).not.toMatch(/mask-composite/)
    expect(corpoMask.match(/conic-gradient/g)?.length).toBe(2) // mask + -webkit

    // A janela é um **triângulo puro**: três paradas, opaco no meio, fechando
    // em `spread * 2` — o `transparent, #fff, transparent 80deg` da
    // referência. Com platô no miolo ela lê como bloco aceso, não como brilho.
    expect(corpoMask).toMatch(/transparent,\s*#000,\s*transparent/)
    expect(corpoMask).toMatch(/var\(--alert-glow-spread\) \* 2deg/)

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
    expect(util).toMatch(/--alert-glow-spread/)

    // O núcleo é o **mesmo token** da superfície da variante, e é essa
    // igualdade que faz a região apagada pela máscara ficar invisível.
    expect(util).toMatch(/var\(--card\)/)
    expect(classes).toContain("bg-card")

    // O núcleo chapado em `padding-box` é o que impede o degradê de cobrir o
    // texto: numa raiz de empilhamento o filho de `z` negativo pinta **por
    // cima** do fundo do elemento.
    expect(util).toMatch(/padding-box/)
    expect(util).toMatch(/border-box/)
    expect(util).toMatch(/z-index:\s*-10/)

    // O borrão é o efeito, e aqui ele é legítimo — ao contrário da régua, que
    // o proíbe (teste 9).
    expect(util).toMatch(/filter:\s*blur/)

    // **`inherits: true` é carga estrutural.** As outras quatro `@property` da
    // casa são `inherits: false` porque são lidas no próprio elemento; esta é
    // lida num pseudo, e pseudo não herda propriedade registrada como
    // `false` — medido, a opacidade ficava em 0 com a variável valendo 1.
    const prop = CSS.slice(
      CSS.indexOf("@property --alert-glow-start"),
      CSS.indexOf("@property --alert-glow-start") + 200
    )
    expect(prop).toMatch(/inherits:\s*true/)
    expect(prop).toMatch(/syntax:\s*"<number>"/)

    // O lado React: sem ponteiro fino não monta nada, o listener sai no
    // unmount, e não há `requestAnimationFrame` em laço (precedente proibido).
    const src = fonte("alert")
    expect(src).toMatch(/\(hover: hover\)/)
    expect(src).toMatch(/removeEventListener\("pointermove"/)
    expect(src).not.toMatch(/requestAnimationFrame/)
    // E nada de estado React para a posição: é `setProperty`, como no `Button`.
    expect(src).toMatch(/setProperty\("--alert-glow-start"/)

    // A barra **não** ganhou nada disso.
    const barra = announcementBarVariants({ variant: "brand" })
    expect(barra).not.toContain("alert-glow")
    expect(barra).not.toMatch(/blur/)
  })
})
