import { Container } from "@/components/ui/container"
import { Suspense } from "react"
import AcceptInvitePageClient from "./page-client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

type RouteParams = Record<string, string | string[] | undefined>

export default async function Page(props: {
    params: Promise<RouteParams>
    searchParams: Promise<RouteParams>
}) {
    await Promise.all([props.params, props.searchParams])
    return (
        <Suspense
            fallback={
                <Container>
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Aceitar convite</CardTitle>
                            <CardDescription>Carregando...</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground">Processando convite...</p>
                        </CardContent>
                    </Card>
                </Container>
            }
        >
            <AcceptInvitePageClient />
        </Suspense>
    )
}
