import { useQuery } from "@tanstack/react-query"

import { lerAdultos } from "@/lib/divisao/dados"

const QUEM_SAIU = "Ex-membro"

export const chaves = {
    adultos: (ws: string) => ["divisao", "adultos", ws] as const,
    partes: (id: string) => ["divisao", "partes", id] as const,
    pesos: (ws: string) => ["divisao", "pesos", ws] as const,
    saldos: (ws: string) => ["divisao", "saldos", ws] as const,
}

export function useAdultos(workspaceId: string) {
    const q = useQuery({ queryKey: chaves.adultos(workspaceId), queryFn: () => lerAdultos(workspaceId), staleTime: 60_000 })
    const nome = (id: string | null | undefined) => q.data?.find((a) => a.user_id === id)?.nome ?? QUEM_SAIU
    return { lista: q.data ?? [], nome }
}
