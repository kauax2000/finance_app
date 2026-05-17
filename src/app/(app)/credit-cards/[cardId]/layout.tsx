import type { ReactNode } from "react"

export default function CreditCardDetailLayout({
    children,
}: {
    children: ReactNode
}) {
    return (
        <div className="mx-auto w-full min-w-0 max-w-2xl px-1 sm:px-0">{children}</div>
    )
}
