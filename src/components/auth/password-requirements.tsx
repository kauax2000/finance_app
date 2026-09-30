"use client"

import { FieldChecklist } from "@/components/ui/field"
import { PASSWORD_RULES } from "@/lib/password-policy"

/**
 * A lista viva de regras da senha, sobre o `FieldChecklist` (rodada 192).
 *
 * Ela era markup inline no cadastro — cinco blocos idênticos de doze linhas
 * cada, mais um sexto ("senha forte") que só repetia a conjunção dos outros
 * cinco e nunca dizia nada novo. O sexto saiu. Serve cadastro, redefinição e,
 * desde a rodada 192, o diálogo de trocar senha, que tinha a própria cópia.
 */
export function PasswordRequirements({ password }: { password: string }) {
    if (!password) return null

    return (
        <FieldChecklist
            title="Requisitos da senha"
            className="mt-1"
            items={PASSWORD_RULES.map((rule) => ({
                id: rule.id,
                label: rule.label,
                met: rule.test(password),
            }))}
        />
    )
}
