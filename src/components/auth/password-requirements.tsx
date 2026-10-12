"use client"

import { FieldChecklist } from "@/components/ui/field"
import { Progress } from "@/components/ui/progress"
import { PASSWORD_RULES, passwordStrength } from "@/lib/password-policy"

const ROTULO = { destructive: "fraca", warning: "quase lá", success: "forte" } as const

/**
 * A força da senha e a lista viva de regras. A barra é a mesma régua do
 * checklist (`passwordStrength` conta as regras cumpridas), então as duas
 * nunca discordam. Serve cadastro, redefinição e o diálogo de trocar senha.
 */
export function PasswordRequirements({ password }: { password: string }) {
    if (!password) return null
    const { score, tone } = passwordStrength(password)

    return (
        <div className="mt-1 flex flex-col gap-3">
            <Progress
                size="sm"
                value={score}
                max={PASSWORD_RULES.length}
                tone={tone}
                aria-label={`Força da senha: ${ROTULO[tone]}`}
            />
            <FieldChecklist
                title="Requisitos da senha"
                items={PASSWORD_RULES.map((rule) => ({
                    id: rule.id,
                    label: rule.label,
                    met: rule.test(password),
                }))}
            />
        </div>
    )
}
