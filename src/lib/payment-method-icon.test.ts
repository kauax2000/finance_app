import { ArrowsRightLeftIcon, BanknotesIcon, CreditCardIcon, EllipsisHorizontalIcon } from "@heroicons/react/16/solid"
import { BanknotesIcon as BanknotesOutline, EllipsisHorizontalIcon as EllipsisHorizontalOutline } from "@heroicons/react/24/outline"
import { describe, expect, it } from "vitest"

import { PixIcon } from "@/components/icons/pix-icon"

import { paymentMethodIcon } from "./payment-method-icon"

describe("paymentMethodIcon", () => {
  it("dá um ícone por forma, e o desconhecido cai nas reticências", () => {
    expect(paymentMethodIcon("pix")).toBe(PixIcon)
    expect(paymentMethodIcon("cash")).toBe(BanknotesIcon)
    expect(paymentMethodIcon("credit_card")).toBe(CreditCardIcon)
    expect(paymentMethodIcon("debit_card")).toBe(CreditCardIcon)
    expect(paymentMethodIcon("ted")).toBe(ArrowsRightLeftIcon)
    expect(paymentMethodIcon("other")).toBe(EllipsisHorizontalIcon)
    expect(paymentMethodIcon("sem-forma")).toBe(EllipsisHorizontalIcon)
    expect(paymentMethodIcon(null)).toBe(EllipsisHorizontalIcon)
  })

  it("no corpo lg (o miolo do anel) usa o 24/outline, e o PIX segue o desenhado", () => {
    expect(paymentMethodIcon("cash", "lg")).toBe(BanknotesOutline)
    expect(paymentMethodIcon("pix", "lg")).toBe(PixIcon)
    expect(paymentMethodIcon(null, "lg")).toBe(EllipsisHorizontalOutline)
  })
})
