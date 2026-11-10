import type { ImportarExtrato } from "@/components/transactions/importar/use-importar-extrato"
import { WireframeBox } from "@/components/wireframe/wireframe-box"

const botao = "rounded-row border border-dashed border-muted-foreground/60 px-2 py-1 text-foreground"

/** A faixa da IA acima das abas da conferência (Bloco 2): lendo, sugeriu ou falhou. Ocioso e indisponível não mostram nada. */
export function FaixaDaIaWireframe({
    ia,
    onVer,
    onTentar,
}: {
    ia: ImportarExtrato["ia"]
    onVer: () => void
    onTentar: () => void
}) {
    if (ia.estado === "ocioso" || ia.estado === "indisponivel") return null
    return (
        <WireframeBox bloco={2} titulo="Categorias pela IA">
            {ia.estado === "lendo" ? <p role="status">A IA está lendo os lançamentos sem categoria…</p> : null}
            {ia.estado === "pronto" ? (
                <div className="flex flex-wrap items-center gap-2">
                    <p role="status">
                        {ia.sugeridas === 0
                            ? "A IA não achou categoria para estas linhas."
                            : `${ia.sugeridas === 1 ? "A IA sugeriu 1 categoria." : `A IA sugeriu ${ia.sugeridas} categorias.`} Revise antes de importar.`}
                        {ia.ficaram > 0 ? ` ${ia.ficaram} ficaram para você.` : ""}
                    </p>
                    {ia.sugeridas > 0 ? (
                        <button type="button" className={botao} onClick={onVer}>
                            Ver sugeridas
                        </button>
                    ) : null}
                </div>
            ) : null}
            {ia.estado === "falhou" ? (
                <div className="flex flex-wrap items-center gap-2">
                    <p role="alert">{ia.mensagem}</p>
                    <button type="button" className={botao} onClick={onTentar}>
                        Tentar de novo
                    </button>
                </div>
            ) : null}
        </WireframeBox>
    )
}

/** A etiqueta "IA" ao lado da categoria que a IA sugeriu. */
export function MarcaIaWireframe() {
    return (
        <span
            title="Sugerida pela IA"
            className="shrink-0 rounded-row border border-dashed border-muted-foreground/60 bg-muted/40 px-1 font-mono text-2xs text-muted-foreground"
        >
            IA
        </span>
    )
}
