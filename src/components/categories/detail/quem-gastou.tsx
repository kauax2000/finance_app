"use client"

import { CartaoDoGrafico } from "@/components/analise-do-mes/compartilhado"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { identityToneFor } from "@/lib/avatar"
import { currencyBRL } from "@/lib/formatters"
import type { MemberDirectoryRow } from "@/lib/queries/use-member-directory"
import { cn, getInitials } from "@/lib/utils"
import { reaisInteiros } from "./regua-do-mes-contas"

/** "Quem gastou": uma linha por pessoa que lançou no mês, com a barra pelo valor. Quem decide se aparece é a tela. */
export function QuemGastou({
    pessoas,
    diretorio,
    despesa,
}: {
    pessoas: { userId: string; valor: number }[]
    diretorio: MemberDirectoryRow[]
    despesa: boolean
}) {
    const total = pessoas.reduce((a, p) => a + p.valor, 0)
    if (pessoas.length < 2 || total <= 0) return null
    return (
        <CartaoDoGrafico titulo={despesa ? "Quem gastou" : "Quem recebeu"}>
            <ul className="grid gap-3">
                {pessoas.map((p) => {
                    const membro = diretorio.find((d) => d.user_id === p.userId)
                    const nome = membro?.full_name || membro?.email?.split("@")[0] || "Ex-membro"
                    const tom = identityToneFor(membro?.avatar_color, membro?.email || nome)
                    return (
                        <li key={p.userId} className="flex items-center gap-3 text-sm">
                            <Avatar size="sm" className="shrink-0" aria-hidden>
                                {membro?.avatar_url ? <AvatarImage src={membro.avatar_url} alt="" /> : null}
                                <AvatarFallback className={cn("font-semibold", tom.surface, tom.ink)}>{getInitials(nome)}</AvatarFallback>
                            </Avatar>
                            <span className="w-28 min-w-0 truncate">{nome}</span>
                            <Progress
                                size="sm"
                                value={p.valor}
                                max={total}
                                aria-label={`${nome}: ${currencyBRL(p.valor)} de ${currencyBRL(total)}`}
                                className="min-w-0 flex-1"
                            />
                            <span className="nums w-20 shrink-0 text-right font-mono font-semibold">{reaisInteiros(p.valor)}</span>
                        </li>
                    )
                })}
            </ul>
        </CartaoDoGrafico>
    )
}
