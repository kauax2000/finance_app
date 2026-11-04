import { PlusIcon } from "@heroicons/react/16/solid"

import { CapaDaIa } from "@/components/account/marcas-de-ia"
import { CapaDoApp } from "@/components/settings/neste-celular-grupo"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Caption } from "@/components/ui/typography"

/** O traço tracejado entre duas capas: a conexão. */
function Elo() {
    return <span className="w-4 shrink-0 border-t-2 border-dashed border-border @xl/ias-vazio:w-6" />
}

/**
 * O vazio de IAs conectadas: a cena (Claude · Finance · ChatGPT, com duas
 * perguntas de exemplo) e o convite. A cena fica em cima no estreito e à direita
 * a partir de 36rem do próprio bloco; ela é ilustração, e o leitor de tela lê só
 * o texto. As perguntas ficam no fluxo, nunca por cima do texto.
 */
export function IasVazio({ onConectar }: { onConectar: () => void }) {
    return (
        <div className="@container/ias-vazio">
            <div className="flex flex-col gap-6 p-4 @xl/ias-vazio:flex-row-reverse @xl/ias-vazio:items-center @xl/ias-vazio:justify-between">
                <div aria-hidden="true" className="flex shrink-0 flex-col gap-3 @xl/ias-vazio:w-72">
                    <Card variant="muted" padding="sm" className="max-w-full self-start text-sm">
                        Quanto gastei com mercado este mês?
                    </Card>
                    <div className="flex items-center justify-center gap-2">
                        <CapaDaIa ia="claude" />
                        <Elo />
                        <CapaDoApp grande />
                        <Elo />
                        <CapaDaIa ia="chatgpt" />
                    </div>
                    <Card variant="muted" padding="sm" className="max-w-full self-end text-sm">
                        Lance R$ 32 de almoço no Nubank
                    </Card>
                </div>
                <div className="flex min-w-0 flex-col items-start @xl/ias-vazio:max-w-xs">
                    <p className="text-base font-semibold">Pergunte à sua IA sobre o seu dinheiro</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Conecte o Finance ao Claude ou ao ChatGPT: a IA lê seus gastos e lança o que você pedir, sempre para você conferir.
                    </p>
                    <Caption className="mt-2">Funciona com o Claude, o ChatGPT e outras IAs.</Caption>
                    <Button variant="primary" className="mt-4" onClick={onConectar}>
                        <PlusIcon aria-hidden data-icon="inline-start" />
                        Conectar uma IA
                    </Button>
                </div>
            </div>
        </div>
    )
}
