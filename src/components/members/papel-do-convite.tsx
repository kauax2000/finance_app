"use client"

import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

export type PapelDoConvite = { role: "member" | "guest"; menor: boolean; consentimento: boolean }

export const PAPEL_DO_CONVITE_INICIAL: PapelDoConvite = { role: "member", menor: false, consentimento: false }

/**
 * O papel do convite por e-mail: membro ou convidado. `menor` e `consentimento`
 * seguem no valor, sempre falsos. O link de convite leva o mesmo papel.
 */
export function PapelDoConvite({
    valor,
    onChange,
    disabled,
}: {
    valor: PapelDoConvite
    onChange: (v: PapelDoConvite) => void
    disabled?: boolean
}) {
    return (
        <div className="space-y-3">
            <RadioGroup
                aria-label="Entra como"
                variant="card"
                orientation="horizontal"
                value={valor.role}
                disabled={disabled}
                onValueChange={(v) => onChange({ ...PAPEL_DO_CONVITE_INICIAL, role: v === "guest" ? "guest" : "member" })}
            >
                <RadioGroupItem value="member" description="Vê e lança tudo da casa">
                    Membro
                </RadioGroupItem>
                <RadioGroupItem value="guest" description="Lança e vê só o seu">
                    Convidado
                </RadioGroupItem>
            </RadioGroup>
        </div>
    )
}
