"use client"

import { Fragment } from "react"
import { Alert, AlertTitle } from "@/components/ui/alert"
import { Card, CardToolbar } from "@/components/ui/card"
import { FormSwitch } from "@/components/ui/form"
import { PageHeader, PageHeaderTitle, PageHeaderTitleRow } from "@/components/ui/page-header"
import { Separator } from "@/components/ui/separator"
import { Muted } from "@/components/ui/typography"
import { NotificacoesTelaSkeleton } from "@/components/settings/notificacoes-tela-skeleton"
import { useWorkspace } from "@/components/workspace-provider"
import { ROUTES } from "@/config/navigation"
import { useIsMobile } from "@/hooks/use-mobile"
import { useWorkspaceNotificationPrefs } from "@/hooks/use-workspace-notification-prefs"
import { temaLigado, type TemaDeNotificacao } from "@/lib/notificacoes-resumo"

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

/** Sobre o quê avisar. As chaves salvam ao tocar, então a tela não tem rodapé. */
export function NotificacoesTemasTela() {
    const isMobile = useIsMobile()
    const { currentWorkspace } = useWorkspace()
    const { prefs, loading, error, patch } = useWorkspaceNotificationPrefs()

    if (loading) return <NotificacoesTelaSkeleton linhas={7} />

    // No telefone o título é o da casca (`TituloDaTela`).
    const topo = isMobile ? null : (
        <PageHeader collapse>
            <PageHeaderTitleRow back={`${ROUTES.SETTINGS}#notificacoes`} backHistory={false}>
                <PageHeaderTitle asChild>
                    {/* O `<h1>` da página é o da barra do topo. */}
                    <p aria-hidden="true">Sobre o quê</p>
                </PageHeaderTitle>
            </PageHeaderTitleRow>
        </PageHeader>
    )

    if (!prefs || !currentWorkspace) {
        return (
            <div className="min-w-0 space-y-4">
                {topo}
                <Alert tone="destructive" size="sm">
                    <AlertTitle>{error ?? "Não foi possível carregar as preferências."}</AlertTitle>
                </Alert>
            </div>
        )
    }

    return (
        <div className="min-w-0 space-y-4">
            {topo}
            <Muted>Vale para você em {currentWorkspace.name}.</Muted>
            {error ? (
                <Alert tone="destructive" size="sm">
                    <AlertTitle>{error}</AlertTitle>
                </Alert>
            ) : null}
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
    )
}
