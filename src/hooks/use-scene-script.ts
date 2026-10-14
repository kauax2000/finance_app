"use client"

import * as React from "react"

import {
    finalFrame,
    frameAt,
    planScript,
    reduceScript,
    SCRIPT_IDLE,
    type SceneScriptId,
    type ScriptEvent,
    type ScriptFrame,
} from "@/lib/scene-script"

/**
 * O executor do roteiro de `lib/scene-script`: uma cadeia de `setTimeout`,
 * um por quadro, que despacha `tick`. Toda a regra mora na função pura.
 *
 * - começa quando `active` fica verdadeiro (o palco à vista) e pausa se ele
 *   cai no meio;
 * - com `reduced`, devolve o quadro final direto, sem timer;
 * - a aba escondida leva ao fim (`visibilitychange`, nunca `pointermove`);
 * - trocar `script` volta ao repouso e cancela o timer pendente;
 * - `skip()` vai ao fim — quem decide quando é o palco (o foco num campo da
 *   coluna).
 *
 * **Cena nova ⇒ roteiro novo.** `skip` e `hidden` levam ao fim também a partir
 * do repouso, e do fim nada volta: o roteiro só toca de novo quando `script`
 * troca (a troca devolve o estado ao repouso). Por isso quem monta passa um
 * `script` por cena — duas cenas seguidas com o mesmo id não repetem a
 * animação, e um `skip` dado numa cena não vaza para a próxima.
 *
 * O `frame` devolvido é o mesmo objeto enquanto `reduced`, o plano e o índice
 * não mudam: quem o põe numa dependência não re-renderiza a cada render do
 * palco.
 */
export function useSceneScript(
    script: SceneScriptId | null,
    { active, reduced }: { active: boolean; reduced: boolean },
): { frame: ScriptFrame; skip: () => void } {
    const plan = React.useMemo(() => (script ? planScript(script) : []), [script])
    const [state, setState] = React.useState(SCRIPT_IDLE)
    const [scriptAnterior, setScriptAnterior] = React.useState(script)

    if (scriptAnterior !== script) {
        setScriptAnterior(script)
        setState(SCRIPT_IDLE)
    }

    const despachar = React.useCallback(
        (event: ScriptEvent) => setState((s) => reduceScript(s, event, plan)),
        [plan],
    )

    React.useEffect(() => {
        if (reduced || !active || state.status !== "idle" || plan.length === 0) return
        despachar(document.visibilityState === "hidden" ? { type: "hidden" } : { type: "start" })
    }, [reduced, active, state.status, plan, despachar])

    React.useEffect(() => {
        if (reduced || !active || state.status !== "running") return
        const antes = state.index < 0 ? 0 : plan[state.index].at
        const id = setTimeout(() => despachar({ type: "tick" }), plan[state.index + 1].at - antes)
        return () => clearTimeout(id)
    }, [reduced, active, state, plan, despachar])

    React.useEffect(() => {
        if (reduced || plan.length === 0) return
        const aoEsconder = () => {
            if (document.visibilityState === "hidden") despachar({ type: "hidden" })
        }
        document.addEventListener("visibilitychange", aoEsconder)
        return () => document.removeEventListener("visibilitychange", aoEsconder)
    }, [reduced, plan, despachar])

    const skip = React.useCallback(() => despachar({ type: "skip" }), [despachar])
    const frame = React.useMemo(
        () => (reduced ? finalFrame(plan) : frameAt(plan, state.index)),
        [reduced, plan, state.index],
    )
    return { frame, skip }
}

const assinarMovimento = (avisar: () => void) => {
    const consulta = window.matchMedia("(prefers-reduced-motion: reduce)")
    consulta.addEventListener("change", avisar)
    return () => consulta.removeEventListener("change", avisar)
}

/**
 * O `reduced` de quem toca um roteiro na camada do app, que não importa `motion` (a paleta do login, a senha
 * mascarada da recuperação): a preferência do sistema, lida por `matchMedia`; no servidor, falso.
 */
export function useMovimentoReduzido(): boolean {
    return React.useSyncExternalStore(
        assinarMovimento,
        () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
        () => false,
    )
}
