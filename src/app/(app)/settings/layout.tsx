import { Container } from "@/components/ui/container"

export default function SettingsLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <Container size="full" className="max-w-4xl">
            {children}
        </Container>
    )
}
