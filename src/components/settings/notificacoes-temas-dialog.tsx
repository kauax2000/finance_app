"use client"

import { Fragment } from "react"
import { Alert, AlertTitle } from "@/components/ui/alert"
import { Card, CardToolbar } from "@/components/ui/card"
import { Dialog, DialogBody, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { FormSwitch } from "@/components/ui/form"
import { Separator } from "@/components/ui/separator"
import { temaLigado, type TemaDeNotificacao } from "@/lib/notificacoes-resumo"
import type {
    WorkspaceMemberNotificationPrefs,
    WorkspaceNotificationPrefsPatch,
} from "@/lib/workspace-notification-prefs"

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

type Props = {
    open: boolean
    onOpenChange: (open: boolean) => void
    prefs: WorkspaceMemberNotificationPrefs
    patch: (p: WorkspaceNotificationPrefsPatch) => Promise<void>
    disabled: boolean
    error: string | null
}

/** Sobre o quê avisar. As chaves salvam ao tocar, então o diálogo não tem rodapé. */
export function NotificacoesTemasDialog({ open, onOpenChange, prefs, patch, disabled, error }: Props) {
    return (
        <Dialog surface="auto" open={open} onOpenChange={onOpenChange}>
            <DialogContent layout="fixed">
                <DialogHeader>
                    <DialogTitle>Sobre o quê</DialogTitle>
                </DialogHeader>
                <DialogBody className="flex flex-col gap-4">
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
                                            disabled={disabled}
                                        />
                                    </div>
                                </Fragment>
                            ))}
                        </Card>
                    ))}
                </DialogBody>
            </DialogContent>
        </Dialog>
    )
}
