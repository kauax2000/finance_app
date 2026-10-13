/**
 * O roteiro das cenas animadas do painel de marca: a paleta ⌘K sendo
 * digitada no login e a senha mascarada da recuperação.
 *
 * **Lógica pura**: nenhum React, nenhum relógio, nenhum sorteio. O roteiro é
 * uma lista de quadros com o instante (`at`, em ms desde a entrada na cena) e
 * a batida; quem toca é o `useSceneScript`, por uma cadeia de `setTimeout`. O
 * mesmo id dá sempre o mesmo roteiro — o "tremor" da digitação é uma tabela
 * fixa, para o teste e a captura de tela verem a mesma coisa.
 */

export type SceneScriptId = "palette-login" | "palette-session" | "palette-security" | "masked-password"

/**
 * A batida de um quadro. `idle` é o quadro antes do primeiro: a cena parada,
 * sem cursor e sem paleta (o plano não o listava; sem ele o executor não teria
 * o que devolver antes de começar).
 */
export type ScriptBeat =
    | "idle"
    | "cursor"
    | "press"
    | "open"
    | "type"
    | "select"
    | "close"
    | "swap"
    | "morph"
    | "morph-back"
    | "done"

export type ScriptFrame = { at: number; beat: ScriptBeat; text?: string; selected?: string }

/** `index` é o último quadro tocado; `-1` antes do primeiro. */
export type ScriptState = { status: "idle" | "running" | "done"; index: number }

export type ScriptEvent = { type: "start" } | { type: "tick" } | { type: "skip" } | { type: "hidden" } | { type: "scene" }

export const SCRIPT_IDLE: ScriptState = { status: "idle", index: -1 }

const QUADRO_PARADO: ScriptFrame = { at: 0, beat: "idle" }

/**
 * O intervalo antes de cada tecla, em ms. As seis primeiras são as do
 * "fatura" do plano (termina em 1.915); as catorze cobrem a senha. Texto mais
 * longo recomeça a tabela.
 */
export const TYPING_DELAYS = [70, 95, 60, 120, 80, 90, 110, 75, 130, 65, 100, 85, 140, 90] as const

/** Uma batida `type` por caractere, cada uma com o prefixo já digitado. */
function digitar(texto: string, inicio: number): ScriptFrame[] {
    const letras = Array.from(texto)
    let at = inicio
    return letras.map((_, i) => {
        at += TYPING_DELAYS[i % TYPING_DELAYS.length]
        return { at, beat: "type", text: letras.slice(0, i + 1).join("") }
    })
}

/** Cursor, clique, abrir, digitar, escolher e fechar — o esqueleto das três paletas. */
function paleta(consulta: string, escolhida: string): ScriptFrame[] {
    const digitacao = digitar(consulta, 1400)
    const fim = digitacao[digitacao.length - 1].at
    const select = Math.max(2000, fim + 60)
    return [
        { at: 500, beat: "cursor" },
        { at: 900, beat: "press" },
        { at: 1000, beat: "open" },
        ...digitacao,
        { at: select, beat: "select", selected: escolhida },
        { at: select + 400, beat: "close" },
    ]
}

/** O roteiro de um id: uma lista nova a cada chamada, sempre igual. */
export function planScript(script: SceneScriptId): ScriptFrame[] {
    switch (script) {
        case "palette-login":
            // A paleta fecha em 2.400; a fatura entra; a janela vira celular e volta (D8).
            return [
                ...paleta("fatura", "Fatura de outubro"),
                { at: 2650, beat: "swap" },
                { at: 3050, beat: "morph" },
                { at: 4000, beat: "morph-back" },
                { at: 4650, beat: "done" },
            ]
        case "palette-session": {
            const quadros = paleta("painel", "Continuar de onde parou")
            return [...quadros, { at: quadros[quadros.length - 1].at + 250, beat: "done" }]
        }
        case "palette-security": {
            const quadros = paleta("segurança", "Senha alterada")
            return [...quadros, { at: quadros[quadros.length - 1].at + 250, beat: "done" }]
        }
        case "masked-password": {
            const digitacao = digitar("Casa*2026verão", 300)
            return [...digitacao, { at: digitacao[digitacao.length - 1].at + 200, beat: "done" }]
        }
    }
}

/** O quadro `index` com o `text` e o `selected` mais recentes até ele. */
export function frameAt(plan: readonly ScriptFrame[], index: number): ScriptFrame {
    if (index < 0 || plan.length === 0) return QUADRO_PARADO
    const ultimo = Math.min(index, plan.length - 1)
    let text: string | undefined
    let selected: string | undefined
    for (let i = 0; i <= ultimo; i++) {
        text = plan[i].text ?? text
        selected = plan[i].selected ?? selected
    }
    const quadro: ScriptFrame = { at: plan[ultimo].at, beat: plan[ultimo].beat }
    if (text !== undefined) quadro.text = text
    if (selected !== undefined) quadro.selected = selected
    return quadro
}

/** O fim do roteiro, com tudo o que foi digitado e escolhido: movimento reduzido, pulo e aba escondida. */
export function finalFrame(plan: readonly ScriptFrame[]): ScriptFrame {
    return frameAt(plan, plan.length - 1)
}

/**
 * - `start` só tira do repouso;
 * - `tick` avança um quadro e, no último, termina;
 * - `skip` (foco num campo da coluna) e `hidden` (aba escondida) vão ao fim,
 *   também de antes de começar — não há o que animar com a pessoa digitando;
 * - `scene` volta ao repouso: a marca de pulo não sobrevive à troca de cena.
 */
export function reduceScript(state: ScriptState, event: ScriptEvent, plan: readonly ScriptFrame[]): ScriptState {
    const fim: ScriptState = { status: "done", index: plan.length - 1 }
    switch (event.type) {
        case "scene":
            return SCRIPT_IDLE
        case "skip":
        case "hidden":
            return state.status === "done" ? state : fim
        case "start":
            if (state.status !== "idle") return state
            return plan.length === 0 ? fim : { status: "running", index: -1 }
        case "tick": {
            if (state.status !== "running") return state
            const index = state.index + 1
            return index >= plan.length - 1 ? fim : { status: "running", index }
        }
    }
}
