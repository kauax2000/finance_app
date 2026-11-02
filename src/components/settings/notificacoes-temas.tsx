"use client"

import { Fragment } from "react"
import { Card, CardToolbar } from "@/components/ui/card"
import { FormSwitch } from "@/components/ui/form"
import { PageSection, PageSectionHeader, PageSectionTitle } from "@/components/ui/page-section"
import { Separator } from "@/components/ui/separator"
import type { WorkspaceNotificationPrefsState } from "@/hooks/use-workspace-notification-prefs"
import { temaLigado, type TemaDeNotificacao } from "@/lib/notificacoes-resumo"
import type { WorkspaceMemberNotificationPrefs } from "@/lib/workspace-notification-prefs"

// "Promoções e ofertas" saiu: nada envia promoção. O `notify_promotions`
// continua no banco e volta aqui junto com o primeiro produtor.
const GRUPOS: { titulo: string; temas: { tema: TemaDeNotificacao; label: string; description?: string }[] }[] = [
    {
        titulo: "Carteira",
        temas: [
            { tema: "notify_transactions", label: "Despesas de outros membros" },
            { tema: "notify_budget", label: "Orçamento" },
            { tema: "notify_bills", label: "Contas a pagar" },
        ],
    },
    {
        titulo: "Cartões",
        temas: [
            { tema: "notify_credit_cards", label: "Limite e categorias" },
            { tema: "notify_credit_card_calendar", label: "Fatura e vencimento" },
        ],
    },
    {
        titulo: "Rotina",
        temas: [
            { tema: "notify_review", label: "Itens a conferir", description: "Às 20h." },
            { tema: "notify_insights", label: "Insights", description: "No máximo 3 push por semana." },
        ],
    },
]

/**
 * Sobre o quê avisar, a segunda peça da seção. As chaves salvam ao tocar, então
 * não há rodapé; a seção cuida do erro e do carregamento.
 */
export function NotificacoesTemas({
    prefs,
    patch,
}: {
    prefs: WorkspaceMemberNotificationPrefs
    patch: WorkspaceNotificationPrefsState["patch"]
}) {
    return (
        <PageSection size="sm">
            <PageSectionHeader>
                <PageSectionTitle>Sobre o quê</PageSectionTitle>
            </PageSectionHeader>
            <div className="space-y-3">
                {GRUPOS.map((grupo) => (
                    <Card key={grupo.titulo} padding="none">
                        <CardToolbar variant="label">{grupo.titulo}</CardToolbar>
                        {grupo.temas.map(({ tema, label, description }, i) => (
                            <Fragment key={tema}>
                                {i > 0 ? <Separator /> : null}
                                <div className="px-4 py-3">
                                    <FormSwitch
                                        id={`pref-${tema}`}
                                        label={label}
                                        description={description}
                                        checked={temaLigado(prefs, tema)}
                                        onCheckedChange={(checked) => void patch({ [tema]: checked })}
                                    />
                                </div>
                            </Fragment>
                        ))}
                    </Card>
                ))}
            </div>
        </PageSection>
    )
}
