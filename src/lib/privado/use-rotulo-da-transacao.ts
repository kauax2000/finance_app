"use client"

import { useCallback, useMemo } from "react"
import { useAuth } from "@/components/providers"
import { useWorkspace } from "@/components/workspace-provider"
import { rotuloDaTransacao } from "@/lib/privado/detalhes"
import { useMemberDirectoryQuery, type MemberDirectoryRow } from "@/lib/queries/use-member-directory"

/** O nome de quem lançou, como o Painel o escreve: nome, o começo do e-mail, ou "Membro". */
export function nomeDoMembro(m: Pick<MemberDirectoryRow, "full_name" | "email"> | undefined): string {
    const nome = m?.full_name?.trim()
    if (nome) return nome
    return m?.email?.trim().split("@")[0] || "Membro"
}

type Linha = { is_private?: boolean | null; user_id: string; description: string | null }

/**
 * `rotuloDaTransacao` com o diretório da carteira e quem está na sessão: na
 * privada de outra pessoa, "Gasto pessoal de {nome}"; senão, a descrição
 * (vazia sem uma, para o `||` de quem chama cair na categoria).
 */
export function useRotuloDaTransacao(): (t: Linha) => string {
    const { user } = useAuth()
    const { currentWorkspaceId } = useWorkspace()
    const diretorio = useMemberDirectoryQuery(currentWorkspaceId)
    const porId = useMemo(
        () => new Map((diretorio.data ?? []).map((m) => [m.user_id, m])),
        [diretorio.data],
    )
    const meuId = user?.id ?? ""
    return useCallback((t: Linha) => rotuloDaTransacao(t, nomeDoMembro(porId.get(t.user_id)), meuId), [porId, meuId])
}
