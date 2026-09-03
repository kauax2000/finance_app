import { Container } from "@/components/ui/container"

export default function MembersLayout({
    children,
}: {
    children: React.ReactNode
}) {
    // `size="md"` é 576 — a mesma largura que estes quatro layouts declaravam à
    // mão, na mesma string (`mx-auto w-full min-w-0 max-w-xl`). Sem calha: quem
    // é dono dela aqui é a casca do app.
    return <Container>{children}</Container>
}
