"use client"

import { useMemo } from "react"
import { CREDIT_CARD_BILLING_FORM } from "@/lib/credit-card-billing-copy"
import { computeBillingFormPreview } from "@/lib/credit-card-billing-form-preview"
import { formatDatePtBr } from "@/lib/credit-card-billing"

function parseDay(s: string): number {
    const n = parseInt(s, 10)
    return Number.isFinite(n) && n >= 1 ? n : 0
}

export type CreditCardBillingFormPreviewProps = {
    closingDay: string
    dueDay: string
}

export function CreditCardBillingFormPreview({
    closingDay,
    dueDay,
}: CreditCardBillingFormPreviewProps) {
    const preview = useMemo(() => {
        const c = parseDay(closingDay)
        const d = parseDay(dueDay)
        if (!c || !d) return null
        return computeBillingFormPreview(c, d)
    }, [closingDay, dueDay])

    if (!preview) return null

    return (
        <p
            className="rounded-md border border-border/50 bg-background/80 px-2.5 py-2 text-[11px] leading-snug text-muted-foreground dark:bg-background/40"
            role="status"
            aria-live="polite"
        >
            <span className="font-medium text-foreground">
                {CREDIT_CARD_BILLING_FORM.previewIntro}
            </span>{" "}
            {CREDIT_CARD_BILLING_FORM.previewClose}{" "}
            <span className="font-medium tabular-nums text-foreground">
                {formatDatePtBr(preview.closeDate)}
            </span>
            ; {CREDIT_CARD_BILLING_FORM.previewDue}{" "}
            <span className="font-medium tabular-nums text-foreground">
                {formatDatePtBr(preview.dueDate)}
            </span>
            .
        </p>
    )
}
