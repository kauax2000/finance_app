import { Container } from "@/components/ui/container"
import type { ReactNode } from "react"

export default function CreditCardDetailLayout({
    children,
}: {
    children: ReactNode
}) {
    return (
        <Container size="lg">{children}</Container>
    )
}
