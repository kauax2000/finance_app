"use client"

import { WireframeBox } from "@/components/wireframe/wireframe-box"
import { useWorkspaceNotificationPrefs } from "@/hooks/use-workspace-notification-prefs"

/** O lembrete das 20h (Bloco 3A), por carteira: liga e desliga `notify_review`. */
export function LembreteConferirWireframe() {
    const { prefs, loading, updating, error, patch } = useWorkspaceNotificationPrefs()

    if (loading || !prefs) return null

    return (
        <WireframeBox bloco={3} titulo="Lembrete de itens a conferir">
            <label className="flex items-center gap-2 text-foreground">
                <input
                    type="checkbox"
                    checked={prefs.notify_review !== false}
                    disabled={updating}
                    onChange={(e) => void patch({ notify_review: e.target.checked })}
                />
                Lembrete às 20h de itens a conferir
            </label>
            <p>Vale para esta carteira, pelos canais ligados nas notificações.</p>
            {error ? (
                <p role="alert" className="text-destructive">
                    {error}
                </p>
            ) : null}
        </WireframeBox>
    )
}
