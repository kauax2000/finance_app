import { createElement as h } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"
import { lerFonte } from "@/test/fonte"

import {
  OnboardingCard,
  OnboardingChecklist,
  OnboardingHotspot,
  OnboardingMedia,
  OnboardingSkeleton,
  folgaDoLeque,
  ladoDaDoca,
  lequeDaMidia,
  passoGuardado,
  irisDe,
  passoAlcancavel,
  recorteDoAlvo,
} from "./onboarding"

/** O Onboarding. */

const CODIGO = lerFonte("src/components/ui/onboarding.tsx")

const ITENS = [
  { id: "conta", title: "Conectar a conta do Nubank", done: true },
  { id: "despesa", title: "Registrar a primeira despesa", description: "Leva dez segundos.", action: { label: "registrar", href: "/transactions" } },
  { id: "cartao", title: "Cadastrar o cartão Inter Gold", action: { label: "cadastrar" } },
  { id: "orcamento", title: "Definir o orçamento de março" },
  { id: "convite", title: "Convidar quem divide a casa", action: { label: "convidar", href: "/members" } },
]

const lista = (props: Record<string, unknown> = {}) =>
  renderToStaticMarkup(h(OnboardingChecklist, { title: "Primeiros passos", items: ITENS, ...props } as never))

describe("Onboarding — as peças puras", () => {
  it("o recorte é a caixa mais a folga, com o raio do alvo mais a folga", () => {
    // A folga é 4: o anel de marca cola no alvo.
    expect(recorteDoAlvo({ left: 634, top: 8, width: 224, height: 32 }, 16)).toEqual({
      x: 630,
      y: 4,
      w: 232,
      h: 40,
      r: 20,
    })
    // O raio nunca passa da metade da altura: uma cápsula continua cápsula.
    expect(recorteDoAlvo({ left: 0, top: 0, width: 200, height: 20 }, 999, 4).r).toBe(14)
    // Um cartão de 22 ganha 26.
    expect(recorteDoAlvo({ left: 272, top: 112, width: 448, height: 338 }, 22).r).toBe(26)
  })

  it("para a frente, o tour não passa por cima de um passo que avança pelo clique", () => {
    const passos = [{}, {}, { advanceOn: "target" as const }, { advanceOn: "target" as const }, {}]
    // A pílula do último, a partir do primeiro, para no passo do clique.
    expect(passoAlcancavel(passos, 0, 4)).toBe(2)
    // No passo do clique, a seta não sai do lugar.
    expect(passoAlcancavel(passos, 2, 3)).toBe(2)
    // Para trás, e para a frente sem clique no caminho, vai direto.
    expect(passoAlcancavel(passos, 4, 1)).toBe(1)
    expect(passoAlcancavel(passos, 0, 2)).toBe(2)
    // Retomar o tour guardado no passo 5 recomeça no clique que faltou.
    expect(passoAlcancavel(passos, 0, 4)).toBe(2)
  })

  it("a íris cobre a janela inteira em volta do recorte", () => {
    const r = { x: 10, y: 20, w: 100, h: 40, r: 12 }
    const iris = irisDe(r, 300, 400)
    expect(iris).toEqual({ x: -490, y: -480, w: 1100, h: 1040, r: 512 })
    // O buraco passa das quatro bordas: o véu não aparece no começo da abertura.
    expect(iris.x).toBeLessThan(0)
    expect(iris.y).toBeLessThan(0)
    expect(iris.x + iris.w).toBeGreaterThan(300)
    expect(iris.y + iris.h).toBeGreaterThan(400)
  })

  it("a placa do telefone prende do lado oposto ao alvo", () => {
    expect(ladoDaDoca({ top: 743, bottom: 799 }, 815)).toBe("top")
    expect(ladoDaDoca({ top: 64, bottom: 156 }, 815)).toBe("bottom")
    expect(ladoDaDoca(null, 815)).toBe("bottom")
  })

  it("o leque tem os números da referência", () => {
    expect(lequeDaMidia(0, 3)).toEqual({ rotate: -5, x: -20, y: -10, scale: 0.95 })
    expect(lequeDaMidia(1, 3)).toEqual({ rotate: 0, x: 0, y: -5, scale: 0.97 })
    expect(lequeDaMidia(2, 3)).toMatchObject({ rotate: 5, x: 20, y: 0 })
    // Duas imagens se abrem em volta do meio; uma só (o vídeo) só sobe.
    expect(lequeDaMidia(0, 2)).toMatchObject({ rotate: -2.5, x: -10 })
    expect(lequeDaMidia(0, 1)).toEqual({ rotate: 0, x: 0, y: -5, scale: 1 })
  })

  it("o leque aberto reserva em cima e embaixo o espaço que ele ocupa, e não mais", () => {
    expect(folgaDoLeque(3)).toEqual({ paddingTop: 16, paddingBottom: 8 })
    expect(folgaDoLeque(2)).toEqual({ paddingTop: 12, paddingBottom: 0 })
    expect(folgaDoLeque(1)).toEqual({ paddingTop: 6, paddingBottom: 0 })
    // A altura aberta é a da imagem medida mais a folga, e não 150px fixos nem `height: "auto"`
    // animado junto com o padding (que saltava de 120 para 144).
    expect(CODIGO).toContain("new ResizeObserver(() => alturaImagem.set(el.offsetHeight))")
    expect(CODIGO).toContain("animate(abertura, aberto ? 1 : 0, MOLA_LEQUE)")
    expect(CODIGO).not.toContain("height: aberto ? 150 : 75")
    expect(CODIGO).not.toMatch(/height: "auto", \.\.\.folgaDoLeque/)
    // A máscara da mídia é quadrada: um raio nela recortava os cantos do leque.
    expect(CODIGO).toContain('"relative block w-full text-left outline-none"')
  })

  it("o passo guardado é um número dentro do tour, e o resto volta ao começo", () => {
    expect(passoGuardado("3", 5)).toBe(3)
    expect(passoGuardado("9", 5)).toBe(4)
    expect(passoGuardado("completed", 5)).toBe(0)
    expect(passoGuardado(null, 5)).toBe(0)
  })
})

describe("Onboarding — o checklist", () => {
  it("conta o que foi feito, e a primeira pendente nasce aberta", () => {
    const html = lista()
    expect(html).toContain("1 de 5 concluídos")
    expect(html).toMatch(/data-state="open"[^>]*data-slot="accordion-item" data-value="despesa"/)
    expect(html.match(/data-state="open"[^>]*data-slot="accordion-item"/g)).toHaveLength(1)
    expect(html).toContain('data-slot="progress-ring"')
  })

  it("o estado de cada item é dito, não só desenhado", () => {
    const html = lista()
    expect(html).toContain(", concluído")
    expect(html).toContain(", pendente")
    expect(html).toMatch(/data-slot="onboarding-check"[^>]*data-done="true"/)
  })

  it("list: links e botões de verdade, riscados quando feitos, a seta só nas pendentes", () => {
    const html = lista({ variant: "list" })
    expect(html).toMatch(/<a[^>]*href="\/transactions"/)
    expect(html).toMatch(/<button[^>]*type="button"[^>]*>[\s\S]*Cadastrar o cartão Inter Gold/)
    expect(html).toContain("line-through")
    expect(html.match(/data-slot="item-chevron"/g)).toHaveLength(3)
    expect(html).toContain('data-slot="progress"')
  })

  it("tudo feito celebra, com o tique que se desenha e o dispensar", () => {
    const html = lista({ items: ITENS.map((i) => ({ ...i, done: true })) })
    expect(html).toContain("Tudo pronto")
    expect(html).toMatch(/data-slot="empty-state-icon"[^>]*data-variant="done"|data-variant="done"[^>]*data-slot="empty-state-icon"/)
    expect(html).toContain(">Dispensar<")
  })

  it("com storageKey, nada aparece antes de ler o que foi visto", () => {
    expect(lista({ storageKey: "primeiros-passos" })).toBe("")
  })

  it("tem o gesto dele: a persiana que desenrola ao aparecer e enrola ao fechar", () => {
    const html = lista({ variant: "list" })
    // O espaço que recorta, o cartão, e cada linha como um gomo da persiana:
    // a barra e as cinco linhas da lista.
    expect(html).toContain('data-slot="onboarding-checklist-space"')
    expect(html).toContain('data-slot="onboarding-checklist-motion"')
    expect(html.match(/data-onboarding-row/g)).toHaveLength(6)
    // Não é a saída do card: fecha enrolando (as linhas de baixo para cima) e
    // aparece desenrolando (de cima para baixo).
    expect(CODIGO).toContain("else await enrolar(espaco, cartao)")
    expect(CODIGO).toContain("void desenrolar(espaco, cartao)")
    expect(CODIGO.match(/await sairPelaEsquerda\(espaco, cartao\)/g)).toHaveLength(1)
    // Mede depois de a altura assentar, e o espaço abre só até o cabeçalho.
    expect(CODIGO).toContain("if (altura > 0 && altura === anterior) break")
    expect(CODIGO).toContain("const cabeca = cartao.offsetHeight - alturas.reduce(")
  })
})

describe("Onboarding — o card, o ponto, a mídia e o esqueleto", () => {
  const card = (props: Record<string, unknown> = {}) =>
    renderToStaticMarkup(
      h(OnboardingCard, {
        title: "Faturas por categoria",
        media: [{ type: "image", src: "/a.png", alt: "A fatura de março" }],
        action: { label: "saiba mais", href: "/novidades" },
        ...props,
      } as never)
    )

  it("o card: o dispensar é um botão, o saiba mais é um link, e a mídia abre por botão", () => {
    const html = card()
    // O × fecha a qualquer momento, com nome, na linha do título.
    expect(html).toMatch(/data-slot="onboarding-card-close"[^>]*type="button"|type="button"[^>]*data-slot="onboarding-card-close"/)
    expect(html).toMatch(/data-slot="onboarding-card-close"[\s\S]*?<span class="sr-only">Dispensar<\/span>/)
    expect(CODIGO).toMatch(/data-slot="onboarding-card-close"\s*onClick=\{dispensar\}/)
    expect(html).toMatch(/type="button"><span data-slot="button-label">Dispensar</)
    expect(html).toMatch(/<a[^>]*href="\/novidades"/)
    expect(html).toMatch(/data-slot="onboarding-card-media"[^>]*aria-expanded="false"|aria-expanded="false"[^>]*data-slot="onboarding-card-media"/)
    expect(card({ storageKey: "novidade" })).toBe("")
  })

  it("o ponto é um botão com nome, sobre o botão real", () => {
    const html = renderToStaticMarkup(
      h(OnboardingHotspot, { title: "Avisos de fatura", label: "Novidade no sino" } as never, h("button", { type: "button" }, "Sino"))
    )
    expect(html).toMatch(/<button[^>]*data-slot="onboarding-hotspot-dot"[^>]*aria-label="Novidade no sino"/)
    expect(html).toContain('data-slot="badge-dot"')
    expect(html).toContain(">Sino<")
  })

  it("o balão do ponto brota do ponto ao abrir e fecha como o card no entendi", () => {
    // A entrada: brota (escala, opacidade, desfoque na mola do token) e as
    // faixas se desdobram; a entrada genérica do popover sai.
    expect(CODIGO).toContain('{ opacity: 0, transform: "scale(0.6)", filter: "blur(6px)" }')
    expect(CODIGO).toContain('estilo.getPropertyValue("--ease-spring")')
    // A entrada do popover sai: a dica brota pela Web Animations API.
    expect(CODIGO.match(/motion="none"/g)).toHaveLength(2)
    // Uma vez por balão: o Radix recompõe a ref a cada render.
    expect(CODIGO).toContain("if (!balao || balao === brotou.current) return")
    // O entendi é o avesso da entrada, e não a saída do card: as faixas dobram
    // de baixo para cima, o balão volta para dentro do ponto (60%, desfoque,
    // a mesma origem), e o ponto pulsa e se apaga.
    expect(CODIGO).toContain("else await recolherNoPonto(balao)")
    expect(CODIGO).not.toContain("sairPelaEsquerda(balao, balao)")
    expect(CODIGO).toContain('{ opacity: 0, transform: "scale(0.6)", filter: "blur(6px)" }')
    expect(CODIGO).toContain("scale: [1, 1.35, 0]")
    const html = renderToStaticMarkup(
      h(OnboardingHotspot, { title: "Avisos de fatura", description: "Três dias antes.", label: "Novidade" } as never, h("button", { type: "button" }, "Sino"))
    )
    expect(html).toContain('data-slot="onboarding-hotspot-dot"')
  })

  it("a mídia: imagem com alt, vídeo em linha com pôster, e a ilustração inerte", () => {
    expect(renderToStaticMarkup(h(OnboardingMedia, { media: { type: "image", src: "/a.png", alt: "A fatura" } }))).toMatch(
      /<img[^>]*alt="A fatura"/
    )
    const video = renderToStaticMarkup(h(OnboardingMedia, { media: { type: "video", src: "/v.mp4", poster: "/p.png" } }))
    expect(video).toMatch(/<video[^>]*muted=""[^>]*playsinline=""/i)
    expect(video).toContain('poster="/p.png"')
    expect(video).toContain("loop")
    expect(renderToStaticMarkup(h(OnboardingMedia, { media: h("span", null, "Ilustração") }))).toMatch(/inert=""[^>]*aria-hidden="true"/)
  })

  it("o esqueleto anuncia, menos com group={false}", () => {
    expect(renderToStaticMarkup(h(OnboardingSkeleton))).toContain('role="status"')
    expect(renderToStaticMarkup(h(OnboardingSkeleton, { variant: "card", group: false }))).not.toContain('role="status"')
  })
})

describe("Onboarding — o mecanismo, pela fonte", () => {
  it("o diálogo: gaveta no telefone, um índice só (o carrossel), o clique fora não pula", () => {
    expect(CODIGO).toContain('surface="auto"')
    expect(CODIGO).toContain("onPointerDownOutside={(e) => e.preventDefault()}")
    expect(CODIGO).toContain("data-vaul-no-drag")
    expect(CODIGO).toContain("setApi={setApi}")
    expect(CODIGO).toContain('api.on("select"')
    // Os passos dividem uma célula da grade; os inativos não recebem foco.
    expect(CODIGO).toContain("col-start-1 row-start-1")
    expect(CODIGO).toContain("inert={!ativo}")
  })

  it("as pílulas alargam de 16 a 24 e dizem o passo", () => {
    expect(CODIGO).toContain("width: i === atual ? 24 : 16")
    expect(CODIGO).toContain('aria-current={i === atual ? "step" : undefined}')
    expect(CODIGO).toContain("aria-label={`Ir para ${titulo}`}")
  })

  it("o tour abre dentro da moldura, espera o alvo e acompanha", () => {
    expect(CODIGO).toContain("useViewportWindow()")
    expect(CODIGO).toContain("new MutationObserver(")
    expect(CODIGO).toMatch(/observador\?\.disconnect\(\)/)
    expect(CODIGO).toContain("new ResizeObserver(acompanhar)")
    expect(CODIGO).toContain('"scrollend"')
    expect(CODIGO).toContain("getClientRects().length")
  })

  it("o clique no próprio elemento avança: pointerdown em captura, click em bolha", () => {
    expect(CODIGO).toContain('doc.addEventListener("pointerdown", aoBaixar, true)')
    expect(CODIGO).toContain('doc.addEventListener("click", aoClicar)')
    expect(CODIGO).not.toMatch(/addEventListener\("click", aoClicar, (true|\{)/)
    expect(CODIGO).toContain("el.contains(origem)")
    // O véu não recebe eventos; os bloqueios ficam em volta do buraco.
    expect(CODIGO).toContain("shadow-[0_0_0_100vmax_var(--overlay)]")
    expect(CODIGO.match(/className=\{BLOQUEIO\}/g)).toHaveLength(4)
  })

  it("a placa segue o recorte: âncora virtual, posição a cada quadro, seta, um degrau acima", () => {
    expect(CODIGO).toContain("virtualRef={ancoraRef}")
    expect(CODIGO).toContain('updatePositionStrategy="always"')
    expect(CODIGO).toContain("<PopoverArrow />")
    expect(CODIGO).toContain("z-[calc(var(--z-popover)+1)]")
    expect(CODIGO).toContain("z-[calc(var(--z-popover)+2)]")
  })

  it("no telefone a placa prende acima da barra de baixo ou sob a de cima, pela área segura em variável", () => {
    expect(CODIGO).toContain('[data-slot="bottom-bar"]:not([data-hidden])')
    expect(CODIGO).toContain('[data-slot="top-bar"]')
    expect(CODIGO.match(/env\(safe-area/g)).toHaveLength(2)
    expect(CODIGO).toContain("[--onboarding-safe-top:env(safe-area-inset-top,0px)]")
    expect(lerFonte("src/app/designsystem/ds-frame.tsx")).toContain("--onboarding-safe-bottom")
  })

  it("o gesto do tour é o foco: a íris fecha e abre, a placa espera o pouso, o anel é de marca", () => {
    // A viagem é em curva, não na mola (que passava do alvo e espremia a placa),
    // e o destino é o alvo ao vivo.
    expect(CODIGO).not.toContain("animate(valores[i], v, MOLA)")
    expect(CODIGO).toContain("viajar(irisDe(r, win.innerWidth, win.innerHeight), r, IRIS_FECHA)")
    expect(CODIGO).toContain("if (viagem) alvo = r")
    expect(CODIGO).toContain("animate(mx, fim.x, IRIS_ABRE)")
    // A placa: a anterior some com a âncora congelada; a nova monta quando o
    // buraco pousa, e surge do lado do alvo.
    expect(CODIGO).toContain("congelado.current ?? new DOMRect(")
    expect(CODIGO).toContain("aberto && pousou === passo ? passo : null")
    expect(CODIGO).toContain("key={placaPasso ?? undefined}")
    expect(CODIGO).toContain("void surgirDoAlvo(placa)")
    expect(CODIGO).toContain("sumirNoAlvo(placa)")
    // A seta mora fora do recorte porque quem rola é o viewport do popover, e
    // não a casca: a placa não precisa mais do `overflow-visible` (que perdia o teto).
    expect(CODIGO).toContain("className={CAMADA_PLACA}")
    expect(CODIGO).not.toContain('"overflow-visible"')
    // O rodapé com a mesma forma em todos os passos: o × pula, o voltar some
    // sem sair do lugar.
    expect(CODIGO).toContain('data-slot="onboarding-tour-close"')
    expect(CODIGO).toContain('className={cn("pointer-coarse:size-11", passo === 0 && "invisible")}')
    // O "próximo" leva a seta que anda, nos dois rodapés; o "concluir", não.
    expect(
      CODIGO.match(/\{ultimo \? null : <ChevronRightIcon aria-hidden data-icon="inline-end" className=\{SETA_QUE_ANDA\} \/>\}/g)
    ).toHaveLength(2)
    // No telefone: o card abre pelo toque (também o da moldura do iPhone, pelo
    // `data-pointer`) e rola até aparecer; a gaveta põe o par numa linha; os
    // alvos sobem a 40–44 no dedo.
    expect(CODIGO).toContain('import { deDedo } from "@/lib/pointer"')
    expect(CODIGO).toContain('if (e.pointerType === "mouse" && !deDedo(e.currentTarget)) setAberto(true)')
    expect(CODIGO).toContain('el.scrollIntoView({ block: "nearest", behavior: reduzido ? "auto" : "smooth" })')
    expect(CODIGO).toContain('className={gaveta ? "flex-row" : undefined}')
    expect(CODIGO.match(/pointer-coarse:h-11/g)?.length).toBeGreaterThanOrEqual(7)
    expect(CODIGO.match(/pointer-coarse:after:-inset-2/g)?.length).toBeGreaterThanOrEqual(3)
    // No telefone o card tem o cabeçalho do checklist (o mesmo ×, o mesmo
    // título); na barra lateral do desktop, o compacto.
    expect(CODIGO.match(/className=\{X_DO_CARTAO\}|cn\(\s*X_DO_CARTAO,/g)).toHaveLength(2)
    expect(CODIGO).toContain('"gap-0 p-4 text-xs md:p-3"')
    expect(CODIGO).toContain('<CardTitle size="sm" className="min-w-0 flex-1 md:text-xs md:font-medium">')
    // O × do diálogo mora no canto da ilustração; o da gaveta, acima dela, na
    // faixa da alça (a ilustração desce para baixo dele).
    // O invólucro da ilustração é item da grade do diálogo: sem `min-w-0`, o
    // trilho do carrossel estourava a janela (a imagem, o texto e o rodapé).
    expect(CODIGO).toContain('<div className={cn("relative m-2 mb-0 min-w-0", gaveta && "mt-6")}>')
    expect(CODIGO).toContain('"top-2 right-2 z-10 shadow-sm ring-1 ring-foreground/10"')
    expect(CODIGO).toContain("{temMidia && !gaveta ? null : <DialogCloseButton label={skipLabel} className={FECHAR_NO_DEDO} />}")
    // O diálogo não tem botão de pular no rodapé: pular é o × do canto.
    expect(CODIGO).not.toContain('onClick={() => fechar(DISPENSADO)}>\n              {skipLabel}')
    expect(CODIGO).toContain('skipLabel = "pular as boas-vindas"')
    // E o "voltar" leva a dele, que anda para trás.
    expect(CODIGO).toContain('<ChevronLeftIcon aria-hidden data-icon="inline-start" className={SETA_QUE_VOLTA} />')
    expect(CODIGO).toContain("<ChevronLeftIcon className={SETA_QUE_VOLTA} />")
    // O anel é o degradê da marca (e não as vinte faixas do brilho), num traço nítido
    // concêntrico com o buraco e parado.
    expect(CODIGO).toContain('const ARCO_IRIS_DO_ANEL = "brand-rainbow-image bg-(image:--brand-rainbow)"')
    expect(CODIGO).toContain("rounded-[var(--onboarding-raio)] p-0.5")
    expect(CODIGO).toContain("const raioDoAnel = useTransform(() => `${mr.get() + 2}px`)")
    expect(CODIGO).not.toMatch(/onboarding-giro|BRILHO_DO_ANEL/)
    expect(CODIGO).not.toContain("ring-2 ring-ring")
    expect(CODIGO).not.toMatch(/ANEL_DE_MARCA|brand-glow-spread:180/)
    // Pular o clique não vale: a seta e as pílulas pulsam o anel; só o clique
    // no alvo avança. Voltar a um passo que espera o alvo volta ao clique.
    expect(CODIGO).toContain('if (step?.advanceOn === "target" && !peloAlvo) return pulsar()')
    expect(CODIGO).toContain("acoes.current.avancar(true)")
    expect(CODIGO).toContain("onAvancar={() => avancar()}")
    expect(CODIGO).toContain("const inicio = passoAlcancavel(steps, 0, passoGuardado(guardado, total))")
    expect(CODIGO).toContain("if (alvo < passo && steps[alvo]?.waitFor && !resolverAlvo(")
    // O pulso do pouso e o anel que se dissolve ao fechar.
    expect(CODIGO).toContain("animate(pulso, 1, PULSO)")
    expect(CODIGO).toContain('anelRef.current.style.opacity = "0"')
  })

  it("o foco: a cada passo, comparado com o passo anterior, e devolvido ao fechar", () => {
    // Pelo ponteiro, a placa recebe o foco sem anel — e só se ninguém o tem.
    expect(CODIGO).toContain("if (!peloTeclado.current) {")
    expect(CODIGO).toContain("if (!ativo || ativo === win.document.body) placaEl.current?.focus(")
    expect(CODIGO).toContain("focadoNoPasso.current === passo")
    expect(CODIGO).toContain("focoAntes.current?.focus(")
    expect(CODIGO).toContain("[data-onboarding-primary]")
  })

  it("o card veste o brilho de marca, e o par de ações divide a linha", () => {
    expect(CODIGO).toContain('variant={variant === "beam" ? "outline" : "brand"}')
    expect(CODIGO).toMatch(/variant="tertiary" size="sm" className="flex-1 pointer-coarse:h-11"[^>]*onClick=\{dispensar\}/)
    expect(CODIGO).toContain('<Button asChild variant="primary" size="sm" className="flex-1 pointer-coarse:h-11">')
    // O leque aberto para na borda de dentro do cartão, e não 4px além dela: um
    // recorte quadrado que anima junto (de inset(0) a inset(-12px)), e não uma
    // troca de `overflow` por classe, que saltava ao abrir e ao fechar.
    expect(CODIGO).toContain("inset(${-12 * t.get()}px)")
    expect(CODIGO).not.toMatch(/aberto \? "overflow-clip/)
    // O brilho escuta o documento do elemento, para acender dentro da moldura.
    expect(lerFonte("src/hooks/use-brand-glow.ts")).toContain("const doc = el.ownerDocument")
  })

  it("o card tem três superfícies: o brilho no ponteiro, o arco que dá a volta e o invertido", () => {
    const html = (variant: string) =>
      renderToStaticMarkup(
        h(OnboardingCard, {
          title: "Faturas por categoria",
          media: [{ type: "image", src: "/a.png", alt: "A fatura" }],
          action: { label: "saiba mais", href: "/novidades" },
          variant,
        } as never)
      )
    expect(html("brand")).toMatch(/data-slot="onboarding-card-surface" data-variant="brand"[^>]*class="[^"]*brand-glow/)
    // O beam: o casco do brilho, sempre aceso, sem o gancho do ponteiro.
    const beam = html("beam")
    expect(beam).toMatch(/data-variant="beam"/)
    expect(beam).toContain("[--brand-glow-active:1]")
    expect(CODIGO).toContain('repeat: Infinity')
    expect(CODIGO).toContain('el.style.setProperty("--brand-glow-start", String(v))')
    // O invertido é o brand **dentro do tema oposto**: uma ilha `.light` no
    // escuro e `.dark` no claro, lida do <html> do próprio documento — e por
    // isso ele espera o cliente (no servidor não há tema a ler).
    expect(html("contrast")).toBe("")
    expect(CODIGO).toContain('contraste && (escuro ? "light" : "dark")')
    expect(CODIGO).toContain('html().classList.contains("dark")')
    expect(CODIGO).not.toContain("--onboarding-ink")
  })

  it("o card fecha colapsando, diminuindo e saindo pela esquerda, numa sequência da WAAPI", () => {
    // As faixas colapsam de verdade (altura e recuo a zero), de baixo para cima.
    expect(CODIGO).toContain('querySelectorAll<HTMLElement>("[data-onboarding-collapse]")].reverse()')
    expect(CODIGO).toMatch(/\{ height: "0px", paddingTop: "0px", opacity: 0 \}/)
    // O cartão: impulso para a direita, depois diminui e sai pela esquerda.
    expect(CODIGO).toContain('{ transform: "translateX(1.5%) scale(0.96)", transformOrigin: "0% 50%", offset: 0.4')
    expect(CODIGO).toContain('{ transform: "translateX(-115%) scale(0.72)", transformOrigin: "0% 50%" }')
    expect(CODIGO).toContain('transformOrigin: "0% 50%"')
    // O que sobra do espaço é medido depois do colapso.
    expect(CODIGO).toContain("[{ height: `${espaco.offsetHeight}px` }, { height: \"0px\" }]")
    // A WAAPI do próprio elemento, e não o animate imperativo do motion (que
    // não reconhece um nó de iframe), nem o exit do AnimatePresence (que fixava
    // a altura do espaço).
    expect(CODIGO).not.toContain("useAnimate")
    expect(CODIGO).not.toContain('exit="saindo"')
    // Grava só no fim, e uma vez.
    expect(CODIGO).toMatch(/await sairPelaEsquerda\(espaco, cartao\)[\s\S]{0,200}gravar\(DISPENSADO\)/)
    expect(CODIGO).toContain("if (saindo.current) return")
  })

  it("o card abre pelo cursor, pelo foco e pelo toque", () => {
    expect(CODIGO).toContain('e.pointerType === "mouse"')
    // O foco abre só quando é de teclado; o toque alterna (o da moldura também).
    expect(CODIGO).toContain('if (!(e.target as HTMLElement).matches(":focus-visible")) return')
    expect(CODIGO).toContain('if (e.detail !== 0 && ponteiro.current === "mouse" && !deDedo(e.currentTarget)) return')
    // O mouse saindo fecha, mesmo depois de um clique dentro; só o foco de
    // teclado o segura aberto.
    expect(CODIGO).toContain('foco.matches(":focus-visible")')
  })

  it("proibições: sem cor crua, sem achar peça pelo tipo, sem classe montada, sem z-50, storage num lugar só", () => {
    expect(CODIGO).not.toMatch(/#[0-9a-fA-F]{3,8}\b/)
    expect(CODIGO).not.toMatch(/\b(child|filho|c)\.type\s*===/)
    expect(CODIGO).not.toMatch(/className=\{`/)
    expect(CODIGO).not.toMatch(/\bz-50\b/)
    expect(CODIGO.match(/window\.(local|session)Storage/g)).toHaveLength(2)
  })
})
