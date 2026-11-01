"use client"

import { Card, CardContent } from "@/components/ui/card"
import { PageSection, PageSectionHeader, PageSectionTitle } from "@/components/ui/page-section"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import { useBuscaDoCabecalho, type BuscaDoCabecalho } from "@/hooks/use-busca-do-cabecalho"

/**
 * O tema do app neste aparelho. No telefone é o único lugar dele (rodada 278).
 * A busca do cabeçalho mora junto porque também é aparência deste aparelho; ela
 * só existe do `lg` para cima (abaixo, as duas formas são a mesma lupa).
 */
export function ThemeSettings() {
    const [busca, definirBusca] = useBuscaDoCabecalho()
    return (
        <PageSection>
            <PageSectionHeader>
                <PageSectionTitle>Aparência</PageSectionTitle>
            </PageSectionHeader>
            <Card padding="none">
                <CardContent className="flex items-center justify-between gap-3 px-4 py-3 sm:py-3.5">
                    <div className="min-w-0">
                        <p className="text-sm font-medium">Tema</p>
                        <p className="text-xs text-muted-foreground">Vale só neste aparelho.</p>
                    </div>
                    <ThemeToggle className="shrink-0" />
                </CardContent>
                <div className="max-lg:hidden">
                    <Separator />
                    <CardContent className="flex items-center justify-between gap-3 px-4 py-3 sm:py-3.5">
                        <div className="min-w-0">
                            <p className="text-sm font-medium">Busca no cabeçalho</p>
                            <p className="text-xs text-muted-foreground">
                                A barra no centro ou um botão ao lado das notificações. Vale só neste aparelho.
                            </p>
                        </div>
                        <Tabs
                            value={busca}
                            onValueChange={(proxima) => definirBusca(proxima as BuscaDoCabecalho)}
                            className="shrink-0"
                        >
                            <TabsList aria-label="Busca no cabeçalho">
                                <TabsTrigger value="barra">Barra</TabsTrigger>
                                <TabsTrigger value="botao">Botão</TabsTrigger>
                            </TabsList>
                        </Tabs>
                    </CardContent>
                </div>
            </Card>
        </PageSection>
    )
}
