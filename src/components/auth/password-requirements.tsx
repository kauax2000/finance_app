"use client"

import { CheckIcon, MinusIcon } from "@heroicons/react/16/solid"

import { PASSWORD_RULES } from "@/lib/password-policy"
import { Caption } from "@/components/ui/typography"
import { cn } from "@/lib/utils"

/**
 * A lista viva de regras da senha.
 *
 * Ela era markup inline no cadastro — cinco blocos idênticos de doze linhas
 * cada, mais um sexto ("senha forte") que só repetia a conjunção dos outros
 * cinco e nunca dizia nada novo. O sexto saiu.
 *
 * Agora ela serve **cadastro e redefinição**, que é a razão de existir: as duas
 * telas passaram a aplicar a mesma política (`lib/password-policy`), então as
 * duas mostram a mesma lista.
 *
 * `aria-live="polite"`: a lista muda a cada tecla e quem não a enxerga
 * precisava adivinhar o que ainda falta. `polite` e não `assertive` porque ela
 * não interrompe — ela acompanha.
 */
export function PasswordRequirements({ password }: { password: string }) {
    if (!password) return null

    return (
        <div className="mt-1 flex flex-col gap-2">
            <Caption>Requisitos da senha</Caption>
            <ul
                className="grid grid-cols-2 gap-x-3 gap-y-1"
                aria-live="polite"
            >
                {PASSWORD_RULES.map((rule) => {
                    const met = rule.test(password)
                    const Icon = met ? CheckIcon : MinusIcon
                    return (
                        <li
                            key={rule.id}
                            className={cn(
                                "flex items-center gap-1.5 text-xs",
                                met
                                    ? "text-success-muted-foreground"
                                    : "text-muted-foreground",
                            )}
                        >
                            <Icon className="size-3 shrink-0" />
                            <span>{rule.label}</span>
                            <span className="sr-only">
                                {met ? " — atendido" : " — falta"}
                            </span>
                        </li>
                    )
                })}
            </ul>
        </div>
    )
}
