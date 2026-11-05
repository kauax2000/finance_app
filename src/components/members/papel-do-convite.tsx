"use client"

import { Checkbox } from "@/components/ui/checkbox"
import { Field, FieldControl, FieldLabel } from "@/components/ui/field"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Muted } from "@/components/ui/typography"

export type PapelDoConvite = { role: "member" | "guest"; menor: boolean; consentimento: boolean }

export const PAPEL_DO_CONVITE_INICIAL: PapelDoConvite = { role: "member", menor: false, consentimento: false }

/**
 * O papel do convite por e-mail: membro ou convidado, e o menor de idade com o
 * consentimento do responsável (LGPD, art. 14). O link não passa por aqui: ele
 * é sempre de membro.
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
                value={valor.role}
                disabled={disabled}
                onValueChange={(v) => onChange(v === "guest" ? { ...valor, role: "guest" } : PAPEL_DO_CONVITE_INICIAL)}
            >
                <RadioGroupItem value="member" description="Vê e lança tudo da casa">
                    Membro
                </RadioGroupItem>
                <RadioGroupItem value="guest" description="Lança e vê só o que é dele">
                    Convidado
                </RadioGroupItem>
            </RadioGroup>
            {valor.role === "guest" ? (
                <div className="space-y-2">
                    <Field orientation="horizontal">
                        <FieldControl>
                            <Checkbox
                                disabled={disabled}
                                checked={valor.menor}
                                onCheckedChange={(c) => onChange({ ...valor, menor: c === true, consentimento: false })}
                            />
                        </FieldControl>
                        <FieldLabel className="font-normal">É menor de idade</FieldLabel>
                    </Field>
                    {valor.menor ? (
                        <Field orientation="horizontal">
                            <FieldControl>
                                <Checkbox
                                    disabled={disabled}
                                    checked={valor.consentimento}
                                    onCheckedChange={(c) => onChange({ ...valor, consentimento: c === true })}
                                />
                            </FieldControl>
                            <FieldLabel className="font-normal">
                                Sou o responsável legal e autorizo o uso do app (LGPD, art. 14).
                            </FieldLabel>
                        </Field>
                    ) : null}
                </div>
            ) : null}
            <Muted>O link de convite é sempre de membro.</Muted>
        </div>
    )
}
