"use client"

import { useQuery } from "@tanstack/react-query"
import { createElement, useMemo } from "react"
import { CategoryIconPreview, normalizeCategoryIcon } from "@/components/categories/category-appearance-fields"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ColorTile } from "@/components/ui/color-tile"
import type { FilterField, FilterOption, FilterValue } from "@/components/ui/filter-bar"
import { useWorkspace } from "@/components/workspace-provider"
import { identityToneFor } from "@/lib/avatar"
import type { Adulto } from "@/lib/divisao/dados"
import { useAdultos } from "@/lib/divisao/use-adultos"
import { PAYMENT_METHOD_VALUES, paymentMethodLabel } from "@/lib/payment-methods"
import { listarProjetos } from "@/lib/projetos/dados"
import { fetchDespesasPorMes } from "@/lib/queries/transacoes-filtradas"
import { useCategoriesQuery } from "@/lib/queries/use-categories"
import { useCreditCardsQuery } from "@/lib/queries/use-credit-cards"
import { useMemberDirectoryQuery, type MemberDirectoryRow } from "@/lib/queries/use-member-directory"
import { useTransactionsWorkspaceAuxQuery } from "@/lib/queries/use-transactions-workspace-aux-query"
import type { Category, CreditCard, Project } from "@/lib/supabase"
import { CAMPOS_BASE, SEM_CATEGORIA, type CampoId, type EstadoDaLista } from "@/lib/transactions/filtros"
import { cn, getInitials } from "@/lib/utils"

export type DadosDosCampos = {
    type: EstadoDaLista["type"]
    categorias: Pick<Category, "id" | "name" | "type" | "color" | "icon">[]
    cartoes: Pick<CreditCard, "id" | "name" | "last_four">[]
    membros: MemberDirectoryRow[]
    convidado: boolean
    adultos: Adulto[]
    /** A carteira é `split`. */
    divide: boolean
    projetos: Pick<Project, "id" | "name" | "archived_at">[]
    planos: { id: string; description: string | null }[]
    assinaturas: { id: string; name: string }[]
    /** Com a carteira, o período mostra o total de despesas por mês. */
    workspaceId?: string | null
}

function avatarDe(m: MemberDirectoryRow) {
    const nome = m.full_name || m.email
    const tom = identityToneFor(m.avatar_color, m.email || nome)
    return createElement(
        Avatar,
        { size: "xs", "aria-hidden": true },
        m.avatar_url ? createElement(AvatarImage, { src: m.avatar_url, alt: "" }) : null,
        createElement(AvatarFallback, { className: cn("font-semibold", tom.surface, tom.ink) }, getInitials(nome)),
    )
}

/** Os campos com as opções; um campo sem o que escolher (ou que não vale para quem lê) sai. */
export function montarCampos(d: DadosDosCampos): FilterField[] {
    const opcoes: Partial<Record<CampoId, FilterOption[] | null>> = {
        categoria: [
            ...d.categorias
                .filter((c) => d.type === "all" || c.type === d.type)
                .map((c) => ({
                    value: c.id,
                    label: c.name,
                    media: createElement(
                        ColorTile,
                        { size: "xs", color: c.color },
                        createElement(CategoryIconPreview, { name: normalizeCategoryIcon(c.icon) }),
                    ),
                })),
            { value: SEM_CATEGORIA, label: "Sem categoria" },
        ],
        pagamento: PAYMENT_METHOD_VALUES.map((v) => ({ value: v, label: paymentMethodLabel(v) })),
        cartao: d.cartoes.length
            ? d.cartoes.map((c) => ({ value: c.id, label: c.last_four ? `${c.name} · ${c.last_four}` : c.name }))
            : null,
        pessoa:
            !d.convidado && d.membros.length >= 2
                ? d.membros.map((m) => ({ value: m.user_id, label: m.full_name || m.email, media: avatarDe(m) }))
                : null,
        pagou: d.divide && d.adultos.length ? d.adultos.map((a) => ({ value: a.user_id, label: a.nome })) : null,
        projeto: (() => {
            const ativos = d.projetos.filter((p) => !p.archived_at)
            return ativos.length ? ativos.map((p) => ({ value: p.id, label: p.name })) : null
        })(),
        plano: d.planos.map((p) => ({ value: p.id, label: p.description?.trim() || "Sem descrição" })),
        assinatura: d.assinaturas.map((s) => ({ value: s.id, label: s.name })),
    }
    return CAMPOS_BASE.flatMap((campo) => {
        const id = campo.id as CampoId
        if (id === "periodo" && campo.type === "period" && d.workspaceId) {
            const workspaceId = d.workspaceId
            return [{ ...campo, totals: (year, signal) => fetchDespesasPorMes({ workspaceId, year, signal }) }]
        }
        if (!(id in opcoes)) return [campo]
        const lista = opcoes[id]
        return lista && campo.type === "enum" ? [{ ...campo, options: lista }] : []
    })
}

/** Ao trocar de aba, a categoria guarda só as do tipo novo (e "Sem categoria"); sem nenhuma, o token sai. */
export function podarCategoriasDoTipo(
    filtros: FilterValue[],
    type: EstadoDaLista["type"],
    categorias: Pick<Category, "id" | "type">[],
): FilterValue[] {
    if (type === "all") return filtros
    const doTipo = new Set([SEM_CATEGORIA, ...categorias.filter((c) => c.type === type).map((c) => c.id)])
    return filtros.flatMap((f) => {
        if (f.field !== "categoria") return [f]
        const values = f.values.filter((v) => doTipo.has(v))
        return values.length ? [{ ...f, values }] : []
    })
}

/**
 * Sem os tokens de campo que a barra não mostra (o `f=` escrito à mão com
 * `pessoa` para o convidado, um cartão numa carteira sem cartão): filtrar por
 * um campo invisível deixaria a lista filtrada sem nada para tirar o filtro.
 */
export function semCamposOcultos(filtros: FilterValue[], campos: Pick<FilterField, "id">[]): FilterValue[] {
    const visiveis = new Set(campos.map((c) => c.id))
    return filtros.every((f) => visiveis.has(f.field)) ? filtros : filtros.filter((f) => visiveis.has(f.field))
}

/** Os campos do `FilterBar` de Transações, das mesmas consultas (em cache) que a tela já faz. */
export function useCamposDeFiltro(type: EstadoDaLista["type"]): {
    campos: FilterField[]
    carregando: boolean
    /** Todas as consultas que decidem quais campos existem terminaram: só aí se poda. */
    prontos: boolean
} {
    const { currentWorkspaceId: ws, currentWorkspace, papel } = useWorkspace()
    const divide = currentWorkspace?.split_mode === "split"
    const categorias = useCategoriesQuery(ws)
    const cartoes = useCreditCardsQuery(ws)
    const aux = useTransactionsWorkspaceAuxQuery(ws, Boolean(ws))
    const membros = useMemberDirectoryQuery(ws)
    const adultos = useAdultos(divide && ws ? ws : "")
    // A mesma chave do wireframe de projetos: um cache só.
    const projetos = useQuery({
        queryKey: ["projetos", ws] as const,
        enabled: Boolean(ws),
        queryFn: () => listarProjetos(ws as string),
    })

    const campos = useMemo(
        () =>
            montarCampos({
                type,
                categorias: categorias.data ?? [],
                cartoes: cartoes.data ?? [],
                membros: membros.data ?? [],
                convidado: papel === "guest",
                adultos: adultos.lista,
                divide,
                projetos: projetos.data?.disponivel ? projetos.data.dados : [],
                planos: aux.data?.installmentPlans ?? [],
                assinaturas: aux.data?.subscriptions ?? [],
                workspaceId: ws,
            }),
        [type, ws, categorias.data, cartoes.data, membros.data, papel, adultos.lista, divide, projetos.data, aux.data],
    )
    const carregando = categorias.isPending || cartoes.isPending || aux.isPending || membros.isPending
    const prontos = Boolean(ws) && !carregando && !projetos.isPending && !adultos.carregando
    return { campos, carregando, prontos }
}
