"use client"

import Link from "next/link"
import { useQuery } from "@tanstack/react-query"

import { WireframeBox } from "@/components/wireframe/wireframe-box"
import { aConferirKeys } from "@/lib/queries/keys"
import { supabase } from "@/lib/supabase"

/**
 * A contagem do Painel (Bloco 3A): quantos lançamentos esperam conferência na
 * carteira, com o link para a lista. Com zero, não aparece.
 */
export function AConferirContagemWireframe({ workspaceId }: { workspaceId: string }) {
    const contagem = useQuery({
        queryKey: aConferirKeys.count(workspaceId),
        queryFn: async () => {
            const { count, error } = await supabase
                .from("transactions")
                .select("id", { count: "exact", head: true })
                .eq("workspace_id", workspaceId)
                .eq("needs_review", true)
            if (error) throw error
            return count ?? 0
        },
    })

    const n = contagem.data ?? 0
    if (n === 0) return null

    return (
        <WireframeBox bloco={3} titulo="A conferir">
            <Link href="/transactions?conferir=1" className="text-foreground underline">
                {`A conferir: ${n}`}
            </Link>
        </WireframeBox>
    )
}
