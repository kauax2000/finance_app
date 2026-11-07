/**
 * A troca de passo orgânica de um diálogo ou gaveta (a versão B escolhida pelo
 * dono em 07/11/2026, nascida no "Adicionar limite"): ao escolher, as outras
 * linhas afundam e somem, o nome da linha tocada viaja na mola até o título, e o
 * conteúdo e os botões do passo novo brotam de onde a linha estava
 * (`menu-morph`). Voltar desfaz: o passo recolhe (`menu-unmorph`) e as linhas
 * sobem de novo na mola.
 *
 * O contrato é por atributo, nos nós que a tela entrega (cabeçalho, corpo e
 * rodapé, remontados pela chave do passo):
 * - `data-linha` em cada linha escolhível do passo da escolha;
 * - `data-nome` no texto que viaja: na linha tocada e no título do passo novo;
 * - `data-prefixo` no resto do título novo ("Limite de "), que surge do desfoque;
 * - `data-passo` no embrulho do conteúdo do passo, dentro do corpo.
 *
 * Sem linha tocada (um passo que só avança, como aviso → confirmação), use
 * `sairDoValor` / `chegarAEscolha` no sentido que couber: recolher e brotar.
 *
 * Funções de DOM soltas: a tela só entrega os nós. Movimento reduzido não anima
 * nada (quem chama pergunta `semMovimento()`). Referência viva:
 * `components/members/adicionar-limite-dialog.tsx`.
 */

/** O que a viagem precisa lembrar da linha tocada, medido antes da troca. */
export type OrigemDaViagem = { nome: DOMRect; linha: DOMRect }

const SAIDA_MS = 220
const ENTRADA_MS = 500

export function semMovimento(): boolean {
    return typeof window === "undefined" || window.matchMedia("(prefers-reduced-motion: reduce)").matches
}

function mola(): string {
    const v = getComputedStyle(document.documentElement).getPropertyValue("--ease-spring").trim()
    return v || "cubic-bezier(0.16, 1, 0.3, 1)"
}

/** Espera as animações, mas nunca mais que `ms`: em aba de fundo elas congelam, e a troca não pode travar. */
function noMaximo(vao: Promise<unknown>[], ms: number): Promise<void> {
    return Promise.race([Promise.all(vao), new Promise((fim) => window.setTimeout(fim, ms))]).then(() => undefined)
}

/** Roda um keyframe do `globals.css` (`menu-morph`, `menu-unmorph`) e espera acabar. */
function porKeyframe(el: HTMLElement, nome: string, ms: number, atraso = 0, origem?: string): Promise<void> {
    return new Promise((fim) => {
        if (origem) el.style.transformOrigin = origem
        el.style.animation = `${nome} ${ms}ms linear ${atraso}ms ${nome === "menu-morph" ? "backwards" : "forwards"}`
        const pronto = () => {
            el.removeEventListener("animationend", pronto)
            if (nome === "menu-morph") {
                el.style.animation = ""
                el.style.transformOrigin = ""
            }
            fim()
        }
        el.addEventListener("animationend", pronto)
        // Rede de segurança: sem o evento (aba em segundo plano), não trava a troca.
        window.setTimeout(pronto, ms + atraso + 100)
    })
}

function surgir(el: Element | null | undefined, atraso = 0) {
    el?.animate(
        [
            { opacity: 0, filter: "blur(8px)" },
            { opacity: 1, offset: 0.45 },
            { filter: "blur(0)" },
        ],
        { duration: 400, delay: atraso, easing: "cubic-bezier(0.16, 1, 0.3, 1)", fill: "backwards" }
    )
}

/** Passo 1 → 2, antes da troca: as outras linhas afundam, a mídia da tocada recolhe. */
export function sairDaEscolha(corpo: HTMLElement, cabecalho: HTMLElement, rodape: HTMLElement, tocada: HTMLElement) {
    const vao: Promise<unknown>[] = []
    const linhas = Array.from(corpo.querySelectorAll<HTMLElement>("[data-linha]"))
    linhas
        .filter((l) => l !== tocada)
        .forEach((l, i) => {
            vao.push(
                l.animate(
                    [
                        { opacity: 1, transform: "none" },
                        { opacity: 0, transform: "translateY(24px) scale(0.94)" },
                    ],
                    { duration: SAIDA_MS, delay: i * 30, easing: "cubic-bezier(0.4, 0, 1, 1)", fill: "forwards" }
                ).finished
            )
        })
    // Da linha tocada fica só o nome: ele é quem viaja.
    tocada.querySelectorAll<HTMLElement>(":scope > :not([data-slot=item-content]), [data-slot=item-description]").forEach((p) => {
        vao.push(p.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 160, fill: "forwards" }).finished)
    })
    tocada.style.pointerEvents = "none"
    tocada.style.background = "transparent"
    for (const parte of Array.from(cabecalho.children)) {
        vao.push(parte.animate([{ opacity: 1, filter: "blur(0)" }, { opacity: 0, filter: "blur(6px)" }], { duration: 180, easing: "ease-in", fill: "forwards" }).finished)
    }
    vao.push(porKeyframe(rodape, "menu-unmorph", 210, 0, "50% 100%"))
    return noMaximo(vao, SAIDA_MS + 60 + 120)
}

/** Passo 2 montado: o nome pousa no título vindo da linha; campo e botões brotam dela. */
export function chegarAoValor(corpo: HTMLElement, cabecalho: HTMLElement, rodape: HTMLElement, origem: OrigemDaViagem) {
    const nome = cabecalho.querySelector<HTMLElement>("[data-nome]")
    if (nome) {
        const alvo = nome.getBoundingClientRect()
        const dx = origem.nome.left - alvo.left
        const dy = origem.nome.top - alvo.top
        const s = alvo.height ? origem.nome.height / alvo.height : 1
        nome.style.display = "inline-block"
        nome.style.transformOrigin = "0 0"
        nome.animate([{ transform: `translate(${dx}px, ${dy}px) scale(${s})` }, { transform: "none" }], {
            duration: ENTRADA_MS,
            easing: mola(),
        })
    }
    surgir(cabecalho.querySelector("[data-prefixo]"), 120)
    surgir(cabecalho.querySelector("[data-slot=dialog-description]"), 160)
    const caixa = corpo.getBoundingClientRect()
    const origemCss = `${origem.linha.left - caixa.left + 40}px ${origem.linha.top - caixa.top + origem.linha.height / 2}px`
    const campo = corpo.querySelector<HTMLElement>("[data-passo]")
    if (campo) void porKeyframe(campo, "menu-morph", 380, 60, origemCss)
    void porKeyframe(rodape, "menu-morph", 380, 120, "50% 100%")
}

/** Passo 2 → 1, antes da troca: o passo do valor recolhe. */
export function sairDoValor(corpo: HTMLElement, cabecalho: HTMLElement, rodape: HTMLElement) {
    const passo = corpo.querySelector<HTMLElement>("[data-passo]")
    return noMaximo(
        [
            passo ? porKeyframe(passo, "menu-unmorph", 210) : Promise.resolve(),
            porKeyframe(cabecalho, "menu-unmorph", 210, 0, "0 50%"),
            porKeyframe(rodape, "menu-unmorph", 210, 0, "50% 100%"),
        ],
        330
    )
}

/** Passo 1 montado de volta: as pessoas sobem na mola, uma atrás da outra. */
export function chegarAEscolha(corpo: HTMLElement, cabecalho: HTMLElement, rodape: HTMLElement) {
    surgir(cabecalho.querySelector("[data-slot=dialog-title]"))
    surgir(cabecalho.querySelector("[data-slot=dialog-description]"), 40)
    corpo.querySelectorAll<HTMLElement>("[data-linha]").forEach((l, i) => {
        l.animate(
            [
                { opacity: 0, transform: "translateY(24px) scale(0.94)" },
                { opacity: 1, transform: "none" },
            ],
            { duration: ENTRADA_MS, delay: 40 + i * 40, easing: mola(), fill: "backwards" }
        )
    })
    void porKeyframe(rodape, "menu-morph", 380, 100, "50% 100%")
}

/**
 * O iOS só abre o teclado com o foco dado dentro do toque, e o campo do valor
 * monta depois da saída (220ms). Um campo invisível recebe o foco no próprio
 * toque e segura o teclado aberto até o `autoFocus` do campo de verdade
 * assumir; então sai. Mesmo `inputMode` do valor, para o teclado não trocar.
 */
export function segurarTeclado(dentro: HTMLElement): () => void {
    const ponte = document.createElement("input")
    ponte.setAttribute("aria-hidden", "true")
    ponte.tabIndex = -1
    ponte.inputMode = "decimal"
    ponte.style.cssText = "position:absolute;opacity:0;width:1px;height:1px;left:0;top:0;pointer-events:none;font-size:16px"
    dentro.appendChild(ponte)
    ponte.focus({ preventScroll: true })
    return () => ponte.remove()
}

/**
 * Um passo que só avança ou volta, sem linha tocada, montado: o título surge do
 * desfoque e o conteúdo (`data-passo`) e os botões brotam (`menu-morph`), o
 * conteúdo do alto, os botões do pé. É o par de `sairDoValor` nos dois sentidos.
 */
export function chegarAoPasso(corpo: HTMLElement, cabecalho: HTMLElement, rodape: HTMLElement) {
    Array.from(cabecalho.children).forEach((parte, i) => surgir(parte, i * 40))
    const passo = corpo.querySelector<HTMLElement>("[data-passo]")
    if (passo) void porKeyframe(passo, "menu-morph", 380, 60, "50% 0")
    void porKeyframe(rodape, "menu-morph", 380, 120, "50% 100%")
}

/**
 * Passo que só avança ou volta (aviso ⇄ confirmação), antes da troca: o corpo
 * (`[data-passo]`) e o rodapé recolhem (`menu-unmorph`); do cabeçalho, que fica
 * montado, só o título e a descrição saem no desfoque. O poço e os pontos ficam.
 */
export function recolherPassoNoLugar(corpo: HTMLElement, cabecalho: HTMLElement, rodape: HTMLElement) {
    const passo = corpo.querySelector<HTMLElement>("[data-passo]")
    const vao: Promise<unknown>[] = [
        passo ? porKeyframe(passo, "menu-unmorph", 210) : Promise.resolve(),
        porKeyframe(rodape, "menu-unmorph", 210, 0, "50% 100%"),
    ]
    for (const t of Array.from(cabecalho.querySelectorAll("[data-slot=dialog-title], [data-slot=dialog-description]"))) {
        vao.push(
            t.animate([{ opacity: 1, filter: "blur(0)", transform: "none" }, { opacity: 0, filter: "blur(6px)", transform: "translateY(-4px)" }], {
                duration: 180,
                easing: "ease-in",
                fill: "forwards",
            }).finished
        )
    }
    return noMaximo(vao, 330)
}

/**
 * O passo novo montado (par de `recolherPassoNoLugar`): o poço assenta na mola, o
 * título e a descrição sobem do desfoque, e o corpo e o rodapé brotam
 * (`menu-morph`) de `de` (o botão tocado, medido antes) ou do pé do corpo.
 */
export function brotarPassoNoLugar(corpo: HTMLElement, cabecalho: HTMLElement, rodape: HTMLElement, de?: DOMRect | null) {
    for (const t of Array.from(cabecalho.querySelectorAll("[data-slot=dialog-title], [data-slot=dialog-description]"))) {
        t.getAnimations().forEach((a) => a.cancel())
    }
    cabecalho
        .querySelector("[data-slot$=-media]")
        ?.animate([{ transform: "scale(0.9)" }, { transform: "none" }], { duration: ENTRADA_MS, easing: mola() })
    for (const [i, t] of Array.from(cabecalho.querySelectorAll("[data-slot=dialog-title], [data-slot=dialog-description]")).entries()) {
        t.animate(
            [
                { opacity: 0, filter: "blur(8px)", transform: "translateY(8px)" },
                { opacity: 1, offset: 0.45 },
                { filter: "blur(0)", transform: "none" },
            ],
            { duration: ENTRADA_MS, delay: 40 + i * 40, easing: mola(), fill: "backwards" }
        )
    }
    const caixa = corpo.getBoundingClientRect()
    const origemCss = de
        ? `${de.left + de.width / 2 - caixa.left}px ${de.top + de.height / 2 - caixa.top}px`
        : "50% 100%"
    const passo = corpo.querySelector<HTMLElement>("[data-passo]")
    if (passo) void porKeyframe(passo, "menu-morph", 380, 60, origemCss)
    void porKeyframe(rodape, "menu-morph", 380, 120, "50% 100%")
}

/** `segurarTeclado` com o `inputMode` do campo que vai assumir ("text" para senha e texto), posto antes do foco. */
export function segurarTecladoDe(dentro: HTMLElement, modo: HTMLInputElement["inputMode"]): () => void {
    const ponte = document.createElement("input")
    ponte.setAttribute("aria-hidden", "true")
    ponte.tabIndex = -1
    ponte.inputMode = modo
    ponte.style.cssText = "position:absolute;opacity:0;width:1px;height:1px;left:0;top:0;pointer-events:none;font-size:16px"
    dentro.appendChild(ponte)
    ponte.focus({ preventScroll: true })
    return () => ponte.remove()
}

/**
 * A mesma viagem entre superfícies: a linha da lista abre um diálogo ou gaveta
 * sobre o item, e o nome dela (`data-nome` na linha) pousa no `data-nome` do
 * título enquanto a superfície entra; o resto do título, a descrição, o corpo e
 * o rodapé brotam em seguida. Chame com o `DialogContent` recém-montado.
 *
 * O título anda junto com a entrada (a gaveta sobe, o diálogo cresce): quem voa
 * é um fantasma fixo no `body`, que segue o título a cada quadro só durante a
 * viagem, e o título de verdade fica invisível até ele pousar. Um relógio
 * encerra tudo mesmo com os quadros parados (aba em segundo plano).
 */
export function viajarParaOTitulo(origem: HTMLElement, conteudo: HTMLElement) {
    if (semMovimento()) return
    const nome = conteudo.querySelector<HTMLElement>("[data-slot=dialog-title] [data-nome]")
    const de = origem.getBoundingClientRect()
    if (!nome || !de.height) return
    const alvo = nome.getBoundingClientRect()
    const estilo = getComputedStyle(nome)
    const fantasma = document.createElement("span")
    fantasma.textContent = nome.textContent
    fantasma.setAttribute("aria-hidden", "true")
    fantasma.dataset.viagemFantasma = ""
    Object.assign(fantasma.style, {
        position: "fixed",
        left: `${alvo.left}px`,
        top: `${alvo.top}px`,
        margin: "0",
        display: "inline-block",
        whiteSpace: "nowrap",
        pointerEvents: "none",
        zIndex: "var(--z-toast)",
        transformOrigin: "0 0",
        fontFamily: estilo.fontFamily,
        fontSize: estilo.fontSize,
        fontWeight: estilo.fontWeight,
        lineHeight: estilo.lineHeight,
        letterSpacing: estilo.letterSpacing,
        color: estilo.color,
    })
    document.body.appendChild(fantasma)
    origem.style.opacity = "0"
    nome.style.opacity = "0"

    const s = alvo.height ? de.height / alvo.height : 1
    const voo = fantasma.animate(
        [{ transform: `translate(${de.left - alvo.left}px, ${de.top - alvo.top}px) scale(${s})` }, { transform: "none" }],
        { duration: ENTRADA_MS, easing: mola() }
    )
    let quadro = 0
    let acabou = false
    const acabar = () => {
        if (acabou) return
        acabou = true
        cancelAnimationFrame(quadro)
        voo.cancel()
        fantasma.remove()
        origem.style.opacity = ""
        nome.style.opacity = ""
    }
    // O deslocamento do voo é relativo ao título no início; seguir o título leva o fantasma junto com a entrada.
    const seguir = () => {
        if (acabou) return
        if (!nome.isConnected) return acabar()
        const r = nome.getBoundingClientRect()
        fantasma.style.left = `${r.left}px`
        fantasma.style.top = `${r.top}px`
        quadro = requestAnimationFrame(seguir)
    }
    quadro = requestAnimationFrame(seguir)
    void voo.finished.then(acabar, acabar)
    window.setTimeout(acabar, ENTRADA_MS + 200)

    const titulo = nome.closest<HTMLElement>("[data-slot=dialog-title]")
    surgir(titulo?.querySelector("[data-prefixo]"), 120)
    surgir(conteudo.querySelector("[data-slot=dialog-description]"), 160)
    const corpo = conteudo.querySelector<HTMLElement>("[data-slot=dialog-body]")
    if (corpo) void porKeyframe(corpo, "menu-morph", 380, 60, "50% 0")
    const rodape = conteudo.querySelector<HTMLElement>("[data-slot=dialog-footer]")
    if (rodape) void porKeyframe(rodape, "menu-morph", 380, 120, "50% 100%")
}

/**
 * Como `sairDaEscolha`, para a linha cujo miolo a tela não marca (o cartão do
 * `RadioGroupItem`, um `<label>` dentro de quem leva `data-linha`): da tocada fica
 * só o `[data-nome]`. Cada irmão no caminho dele até a linha some, e a moldura de
 * cada nível (fundo, borda, anel) fica transparente.
 */
export function sairDaEscolhaPeloNome(corpo: HTMLElement, cabecalho: HTMLElement, rodape: HTMLElement, tocada: HTMLElement) {
    const vao: Promise<unknown>[] = []
    Array.from(corpo.querySelectorAll<HTMLElement>("[data-linha]"))
        .filter((l) => l !== tocada)
        .forEach((l, i) => {
            vao.push(
                l.animate(
                    [
                        { opacity: 1, transform: "none" },
                        { opacity: 0, transform: "translateY(24px) scale(0.94)" },
                    ],
                    { duration: SAIDA_MS, delay: i * 30, easing: "cubic-bezier(0.4, 0, 1, 1)", fill: "forwards" }
                ).finished
            )
        })
    const nome = tocada.querySelector<HTMLElement>("[data-nome]")
    for (let el = nome; el && el !== tocada; el = el.parentElement) {
        const pai = el.parentElement
        for (const irmao of Array.from(pai?.children ?? [])) {
            if (irmao !== el) vao.push(irmao.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 160, fill: "forwards" }).finished)
        }
        if (pai) {
            pai.animate([{ backgroundColor: "transparent", borderColor: "transparent", boxShadow: "none" }], { duration: 160, fill: "forwards" })
        }
    }
    tocada.style.pointerEvents = "none"
    for (const parte of Array.from(cabecalho.children)) {
        vao.push(parte.animate([{ opacity: 1, filter: "blur(0)" }, { opacity: 0, filter: "blur(6px)" }], { duration: 180, easing: "ease-in", fill: "forwards" }).finished)
    }
    vao.push(porKeyframe(rodape, "menu-unmorph", 210, 0, "50% 100%"))
    return noMaximo(vao, SAIDA_MS + 60 + 120)
}

/** Um guia que só avança (passo 2 → 3), antes da troca: o passo recolhe para o alto; cabeçalho e rodapé ficam. */
export function recolherPasso(corpo: HTMLElement) {
    const passo = corpo.querySelector<HTMLElement>("[data-passo]")
    return noMaximo([passo ? porKeyframe(passo, "menu-unmorph", 210, 0, "50% 0") : Promise.resolve()], 330)
}

/** O passo seguinte montado: brota do alto, no lugar do que recolheu. */
export function brotarPasso(corpo: HTMLElement) {
    const passo = corpo.querySelector<HTMLElement>("[data-passo]")
    if (passo) void porKeyframe(passo, "menu-morph", 380, 0, "50% 0")
}
