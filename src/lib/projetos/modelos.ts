import type { WorkspacePurpose, WorkspaceSplitMode } from "@/lib/supabase"

/** A regra mostrada ao escolher (spec §12, literal). */
export const REGRA_DA_ESCOLHA =
    "Vai usar o cartão da casa e são as mesmas pessoas? É um projeto. Gente de fora ou dinheiro separado? É uma carteira."

/** O `p_modelo` de `criar_carteira_de_modelo`. */
export type ModeloDeCarteira = "casa" | "casal" | "pessoal" | "viagem" | "reforma" | "evento"

export type DefinicaoDeModelo = {
    id: ModeloDeCarteira
    rotulo: string
    descricao: string
    purpose: WorkspacePurpose
    split_mode: WorkspaceSplitMode
}

/** Os seis modelos (spec §12, Decisão 3): os pares batem com a RPC. */
export const MODELOS_DE_CARTEIRA: readonly DefinicaoDeModelo[] = [
    { id: "casa", rotulo: "Casa", descricao: "O dia a dia da casa, num pote único.", purpose: "everyday", split_mode: "pooled" },
    { id: "casal", rotulo: "Casal", descricao: "O dia a dia a dois, com as despesas divididas.", purpose: "everyday", split_mode: "split" },
    { id: "pessoal", rotulo: "Pessoal", descricao: "A sua carteira pessoal, que já existe.", purpose: "everyday", split_mode: "pooled" },
    { id: "viagem", rotulo: "Viagem", descricao: "Uma viagem com dinheiro separado, dividida.", purpose: "project", split_mode: "split" },
    { id: "reforma", rotulo: "Reforma", descricao: "Uma obra com orçamento próprio, dividida.", purpose: "project", split_mode: "split" },
    { id: "evento", rotulo: "Evento", descricao: "Uma festa ou evento, com as despesas divididas.", purpose: "project", split_mode: "split" },
]
