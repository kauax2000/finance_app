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
 * O contorno de marca, e o que ele não pode virar.
 *
 * Cinco peças desenharam o arco-íris da marca por **contorno** — os dois pesos
 * do `Button`, o `Badge`, o `Checkbox`, o `Radio` e o cartão do `RadioGroup`
 * —, e desde a rodada 169 nenhuma desenha: todas foram para o brilho, o véu ou
 * o Rainbow Button. As asserções 1 e 2 impedem a volta. A receita tinha três
 * jeitos conhecidos de quebrar calada, e o terceiro ainda vale:
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
  semComentarios(lerFonte("src/app/globals.css"), "bloco")
const fonte = (nome: string) => semComentarios(lerFonte(join(RAIZ, `${nome}.tsx`)), "numa-passada")

/** As classes de cada peça que veste a marca. */
const PORTADORES = {
  "radio/brand": radioVariants({ variant: "brand" }),
  "radio-group/brandCard": radioGroupItemVariants({ variant: "brandCard" }),
} as const

describe("contorno de marca", () => {
  it("1. o contorno parado saiu da casa, e os dois rádios vestem o brilho", () => {
    // A família do contorno — 1px de `border-box` sobre um núcleo chapado,
    // acendendo só marcada — teve cinco membros e perdeu o último na rodada
    // 169: o `Radio brand` e o `brandCard` foram para o brilho, como o
    // `Checkbox brand` na 155. Duas peças de escolha falando marcas
    // diferentes era o defeito; o contorno de volta num deles é a regressão.
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
    // Rodada 169: a mesma entrada do tique do `Checkbox`.
    const base = radioVariants({ variant: "default" })
    expect(base).toContain("data-[state=checked]:border-primary-accent")
    expect(fonte("radio")).toMatch(/zoom-in-0 animation-duration-\(--duration-spring\) ease-\(--ease-spring\)/)
    // E o par `dark:hover:`, sem o qual o realce morre no escuro.
    expect(base).toContain("dark:hover:bg-muted/60")
  })

  it("6. o cartão de marca soma o brilho ao realce do cartão", () => {
    // Até a 168 o contorno **substituía** o realce de seleção. O brilho acende
    // pelo ponteiro, e não pelo estado, então quem diz "selecionado" volta a
    // ser o realce do `card` — e os dois não disputam: arco na aresta, lavagem
    // no miolo.
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
    // A régua de `input-versions` não muda com esta rodada: a marca entra
    // nos controles de **escolha**, e o campo de texto continua fora — cinco
    // tentativas recusadas na tela, e `fieldFocusRingClassName` é o anel dele.
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

  it("9. a família do véu — `AnnouncementBar`", () => {
    // A barra saiu da família da régua (um fio de 1px na base) e virou o véu
    // do `Banner` rainbow do Fumadocs: o arco-íris translúcido **atrás** do
    // texto, mascarado a partir do topo central e deslizando em 20s. É a
    // exceção consciente à invariante 3, paga pelo alfa `--brand-flow-alpha`
    // e medida em `scripts/tone-contrast.mjs`.
    const barra = announcementBarVariants({ variant: "brand" })
    const classes = barra.split(/\s+/)
    const CSS = fonteCss()

    // O véu mora num pseudo em `z` negativo, e o `isolate` é o que o mantém
    // visível: sem raiz de empilhamento própria o pseudo cai atrás do fundo
    // de um ancestral (barra não `sticky`) e some sem erro nenhum.
    for (const c of ["isolate", "before:-z-1", "before:inset-0", "before:brand-flow"]) {
      expect(classes, c).toContain(c)
    }

    // A régua saiu: dois arco-íris na mesma faixa seria o defeito.
    expect(barra).not.toContain("after:bg-(image:--brand-rainbow)")
    expect(barra).not.toMatch(/blur/)

    // A utility existe, com a máscara de duas camadas da referência, e mora
    // depois de `no-scrollbar` — a faixa `glass-control…no-scrollbar` é
    // fatiada pelo `glass.test.ts` e reprova utility nova.
    const bloco = esperarDepoisDeNoScrollbar(CSS, "@utility brand-flow", { fecha: "@utility" })
    expect(bloco).toMatch(/mask-composite: intersect/)
    expect(bloco).toMatch(/var\(--brand-flow-alpha\)/)
    expect(bloco).toMatch(/animation: brand-flow 20s linear infinite/)

    // O alfa é por tema: é ele que segura o contraste do texto.
    expect(CSS.match(/--brand-flow-alpha:/g)?.length).toBe(2)

    // **O véu substitui o fio do `sticky`, e não se soma a ele.**
    expect(classes).toContain("border-b-0")

    // E a ordem das chaves no `cva` é **carga estrutural**, não estilo: o `cva`
    // concatena na ordem em que os eixos são declarados e o `tailwind-merge`
    // resolve por último-vence. Com `variant` antes de `sticky`, o `border-b`
    // do `sticky` venceria o `border-b-0` daqui e o fio cinza voltaria.
    const src = fonte("announcement-bar")
    expect(src.indexOf("position: {")).toBeGreaterThan(0)
    expect(src.indexOf("variant: {")).toBeGreaterThan(src.indexOf("position: {"))

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
    // E ela continua **presa**: o `relative` que o véu pedia morava na marca e
    // vencia o `sticky` pelo mesmo último-vence (rodada 187).
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
    expect(classes).toContain("brand-glow")

    // **`isolate` é obrigatório, e foi medido.** Sem ele o pseudo de `z`
    // negativo cai atrás do fundo de um ancestral e não aparece.
    expect(classes).toContain("isolate")

    // A régua saiu: quem herdar este arquivo não pode achar que as duas
    // convivem. Uma marca em repouso **e** um arco aceso seriam dois
    // arco-íris na mesma caixa.
    expect(alerta).not.toContain("before:w-0.5")
    expect(alerta).not.toContain("before:rounded-full")

    // A utility existe, e as quatro decisões medidas estão nela.
    // A fatia termina na `@utility` seguinte. Ela já terminou no
    // `@property --brand-glow-start`, e quando esse bloco saiu (o ângulo
    // passou a ser animado por JS) o `indexOf` devolveu −1, a fatia engoliu o
    // resto do arquivo e a asserção de ausência casou com outro componente.
    const iniUtil = CSS.indexOf("@utility brand-glow")
    const util = CSS.slice(
      iniUtil,
      CSS.indexOf("@utility ", iniUtil + 20)
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
    expect(corpoBg).not.toMatch(/--brand-glow-start/) // a cor NÃO gira
    expect(corpoMask).toMatch(/--brand-glow-start/) // a janela gira

    // **A máscara recorta o anel, e o meio nunca é pintado** (rodada 156).
    // Até a 155 o anel vinha com um núcleo chapado em `padding-box`, e a
    // janela — uma cunha que sai do centro — o mostrava como um feixe: com o
    // ponteiro perto, de 297 a 4.748 pixels do miolo mudavam. Hoje são três
    // camadas: a janela menos a `padding-box` (rodada 182). As três de antes
    // (caixa, `exclude` da `padding-box`, `intersect` com a janela) deixavam,
    // no Chrome, o anel inteiro bem fino do lado oposto ao arco — 253 pixels
    // medidos na ponta de um `ThemeToggle brand`. Esta forma mede zero.
    expect(corpoMask.match(/conic-gradient/g)?.length).toBe(2) // mask + -webkit
    expect(util).toMatch(/-webkit-mask-clip: border-box, padding-box;/)
    expect(util).toMatch(/-webkit-mask-composite: source-out;/)
    expect(util).toMatch(/\bmask-clip: border-box, padding-box;/)
    expect(util).toMatch(/\bmask-composite: subtract;/)
    expect(util).not.toMatch(/intersect, exclude|source-in, xor/)
    // O risco que baniu a composição era uma camada `none`: a janela é a única
    // com variável, e o fallback mora no próprio `var()`.
    expect(corpoMask).toMatch(/var\(--brand-glow-start, 0\)/)
    expect(corpoMask).not.toMatch(/var\(--brand-glow-start\)/)
    // E o pseudo não pinta miolo nenhum: só o arco-íris, na `border-box`.
    expect(corpoBg).not.toMatch(/padding-box|--brand-glow-core|--brand-glow-overlay/)

    // A janela é um **triângulo puro**: três paradas, opaco no meio, fechando
    // em `spread * 2` — o `transparent, #fff, transparent 80deg` da
    // referência. Com platô no miolo ela lê como bloco aceso, não como brilho.
    expect(corpoMask).toMatch(/transparent,\s*#000,\s*transparent/)
    expect(corpoMask).toMatch(/var\(--brand-glow-spread\) \* 2deg/)

    // **Nenhum `radial-gradient`, e isso é medição e não esquecimento.** A
    // referência tem quatro aqui; eles foram portados e saíram porque **não
    // pintam nada**: são círculos no interior da caixa (degradê morrendo em
    // 15–20% do raio) e o que se vê desta peça é só o anel de 2px na aresta.
    // Vale igual na referência — num cartão de 374×230 o raio efetivo é ~44px
    // contra um anel de 3px na borda. Repô-las exige raio de 60–80% da caixa,
    // e aí deixa de ser port.
    expect(corpoBg).not.toMatch(/radial-gradient/)

    // A largura de faixa é o que importa, e ela vem do par cores × voltas. A
    // referência: 4 cores × 5 = 20 faixas de 18°. Com as 8 paradas da marca, 5
    // voltas dariam 40 faixas de 9° — metade da largura, que sob o borrão vira
    // lama. 2,5 devolve os 18°.
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

    // A máscara que recorta o anel é o que impede o degradê de cobrir o
    // texto: numa raiz de empilhamento o filho de `z` negativo pinta **por
    // cima** do fundo do elemento.
    expect(classes).toContain("bg-card")
    expect(util).not.toMatch(/--brand-glow-core|--brand-glow-overlay/)
    expect(util).toMatch(/border-box/)
    expect(util).toMatch(/z-index:\s*-10/)

    // O borrão é o efeito, e aqui ele é legítimo — ao contrário da régua, que
    // o proíbe (teste 9).
    expect(util).toMatch(/filter:\s*blur/)

    // **O ângulo é animado por JavaScript, e a propriedade NÃO é registrada** —
    // exatamente como na referência, que escreve `--start` a cada quadro com o
    // `animate` do `motion`. Aqui houve uma `@property` registrada com
    // `transition: … 2s`, defendida por três rodadas como equivalente; era
    // dedução, não medição, e o dono disse três vezes que não era a animação
    // dela. Registrar de novo não quebra, mas ressuscita a dúvida.
    expect(CSS).not.toMatch(/@property --brand-glow-start/)
    expect(util).not.toMatch(/transition:\s*--brand-glow-start/)

    // **E o ângulo tem valor inicial na utility**, porque a `@property` que o
    // dava saiu com o registro. Sem ele o `calc()` é inválido, `mask-image`
    // cai para `none` — nenhuma máscara — e o anel aparece **inteiro** até o
    // tween escrever o primeiro número. Era o "a linha já aparece inteira em
    // vez de crescer" do dono, e é uma falha que não derruba nada: o CSS é
    // válido, o efeito só fica errado.
    expect(util).toMatch(/--brand-glow-start:\s*0;/)

    // O lado React: sem ponteiro fino não monta nada, e o listener sai no
    // unmount.
    // O hook saiu do `alert.tsx` na rodada 133 (`useBrandGlow`), quando o
    // `Card` quis a mesma borda. As asserções leem o arquivo dele.
    const src = semComentarios(lerFonte("src/hooks/use-brand-glow.ts"), "numa-passada")
    expect(fonte("alert")).toMatch(/useBrandGlow\(variant === "brand"\)/)
    expect(src).toMatch(/\(hover: hover\)/)
    expect(src).toMatch(/removeEventListener\("pointermove"/)
    // E nada de estado React para a posição: é `setProperty`, como no `Button`.
    expect(src).toMatch(/setProperty\("--brand-glow-start"/)

    // **A animação é a da referência, literalmente**: o `animate` do `motion`,
    // com a duração e a ease dela, escrevendo a variável no `onUpdate`.
    expect(src).toMatch(/from "motion\/react"/)
    expect(src).toMatch(/animate\(atual, atual \+ delta/)
    expect(src).toMatch(/duration: GLOW_DURACAO/)
    expect(src).toMatch(/GLOW_DURACAO = 2/)
    expect(src).toMatch(/GLOW_EASE = \[0\.16, 1, 0\.3, 1\]/)
    // E o ângulo atual sai do DOM, não de um acumulador — um acumulador guarda
    // o *alvo*, não onde a animação está.
    expect(src).toMatch(/getPropertyValue\("--brand-glow-start"\)/)
    // **Movimento reduzido é perguntado à mão**, porque o bloco global da casa
    // encurta transição de CSS e um tween de JS escapa dele — o precedente do
    // `ThemeToggle` ao trocar transição por WAAPI.
    expect(src).toMatch(/prefers-reduced-motion: reduce/)
    expect(src).toMatch(/if \(semMovimento\)/)
    expect(src).not.toMatch(/let angulo/)
    // O tween anterior para antes do novo, e no unmount: a referência não
    // para, e deixa ~120 tweens vivos escrevendo a mesma variável.
    expect(src.match(/tween\?\.stop\(\)/g)?.length).toBe(2)

    // **A rolagem recalcula o estado, e não só a geometria.** Medido antes do
    // conserto: rolando 260px com o ponteiro parado, a caixa ia de `top 255`
    // para `-5` e `--brand-glow-active` continuava em `1` — o aviso ficava
    // aceso apontando para onde o mouse não estava mais. O conserto é o da
    // referência: guardar a última posição do ponteiro e refazer a conta.
    expect(src).toMatch(/ultimaX/)
    expect(src).toMatch(/const aoRolar = \(\) => agendar\(\)/)
    // E `capture: true`, que é a divergência deliberada: `scroll` não borbulha
    // mas captura, então sem isto a rolagem **dentro de um container** passa
    // despercebida — o caso que a própria referência erra.
    expect(src).toMatch(/addEventListener\("scroll", aoRolar, \{ capture: true/)

    // **`rAF` aqui coalesce, e o precedente proibido é o laço.** O que esta
    // casa recusou (no marcador do `Tabs`) é o `rAF` que se **re-agenda** para
    // fazer polling. Coalescer uma rajada de `pointermove` num quadro é outra
    // coisa, e é o que a referência faz. O que separa os dois: **um** ponto de
    // agendamento, e um cancelamento — um laço não cancela, ele se renova.
    expect(src.match(/requestAnimationFrame\(/g)?.length).toBe(1)
    expect(src).toMatch(/cancelAnimationFrame/)
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
    // A segunda peça da família do brilho (rodada 133). O casco tem
    // `overflow-hidden` para recortar os cantos dos filhos, e o anel mora 2px
    // **fora** da caixa: recortado ali, sumia. O cartão de marca troca por
    // `overflow: clip` com 4px de margem — `var(--spacing)` cru, porque o
    // Chrome rejeita `calc()` nessa propriedade (medido: computava `0px`).
    const cartao = cn(cardVariants({ variant: "brand" })).split(/\s+/)
    for (const c of ["brand-rainbow-image", "brand-glow", "isolate", "overflow-clip", "[overflow-clip-margin:var(--spacing)]"]) {
      expect(cartao, c).toContain(c)
    }
    // O `overflow-hidden` da base tem de ter perdido a disputa, não coexistido.
    expect(cartao).not.toContain("overflow-hidden")
    expect(fonte("card")).toMatch(/useBrandGlow\(variant === "brand"\)/)

    // A terceira: o `Badge`, que era do contorno até o dono o querer neutro.
    // Em repouso é um chip `muted`; o núcleo do anel é a mesma cor, senão a
    // região que a máscara apaga lê como outra superfície. E o halo sempre
    // aceso do contorno não pode sobreviver ao lado do brilho.
    const chip = cn(badgeVariants({ variant: "brand" })).split(/\s+/)
    for (const c of ["brand-rainbow-image", "brand-glow", "relative", "isolate", "bg-muted", "[--brand-glow-opacity:1]"]) {
      expect(chip, c).toContain(c)
    }
    expect(chip.join(" ")).not.toMatch(/after:blur|--brand-fill/)
    expect(fonte("badge")).toMatch(/useBrandGlow<HTMLSpanElement>\(variant === "brand"\)/)

    // A quarta: o `Button brand` (rodada 145), neutro sobre o `secondary`.
    const botao = cn(buttonVariants({ variant: "brand" })).split(/\s+/)
    for (const c of ["brand-rainbow-image", "brand-glow", "relative", "isolate", "bg-secondary"]) {
      expect(botao, c).toContain(c)
    }
    expect(fonte("button")).toMatch(/useBrandGlow<HTMLButtonElement>\(variant === "brand"\)/)

    // A quinta: o `Checkbox brand` (rodada 155; foi do contorno até a 153 e
    // deslizou na 154). Só o anel acende, e o preenchimento marcado aparece
    // intacto sob ele.
    const caixa = cn(checkboxVariants({ variant: "brand" })).split(/\s+/)
    for (const c of ["brand-glow", "isolate", "[--brand-glow-opacity:1]"]) {
      expect(caixa, c).toContain(c)
    }
    // O `::after` continua sendo o alvo de toque, e nada do contorno sobrou.
    expect(caixa).toContain("after:-inset-3.5")
    expect(caixa.join(" ")).not.toMatch(/(^|\s)before:|brand-rainbow-slide|--brand-fill/)
    expect(fonte("checkbox")).toMatch(/useBrandGlow<HTMLButtonElement>\(variant === "brand"\)/)

    // A sexta e a sétima: o `Radio brand` e o `brandCard` (rodada 169).
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
