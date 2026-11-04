import { PlusIcon } from "@heroicons/react/16/solid"

import { Capa, type Marca } from "@/components/account/marcas-de-ia"
import { Button } from "@/components/ui/button"
import { Caption } from "@/components/ui/typography"

/** Uma pergunta de exemplo, com o selo da IA que a recebe. */
function Sugestao({ marca, children }: { marca: Marca; children: string }) {
    return (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/80 py-1 ps-1 pe-2.5 text-xs text-foreground backdrop-blur-sm">
            <Capa marca={marca} tamanho="selo" />
            {children}
        </span>
    )
}

/**
 * O vazio de IAs conectadas: a cena (o Finance no centro, o Claude e o ChatGPT
 * inclinados atrás dele, sobre duas órbitas, e uma pergunta para cada IA) e o
 * convite. A cena fica em cima no estreito e à direita a partir de 32rem do
 * próprio bloco; ela é ilustração, e o leitor de tela lê só o texto.
 */
export function IasVazio({ onConectar }: { onConectar: () => void }) {
    return (
        <div className="@container/ias-vazio">
            <div className="flex flex-col gap-5 p-4 @lg/ias-vazio:flex-row-reverse @lg/ias-vazio:items-center @lg/ias-vazio:gap-4">
                <div
                    aria-hidden="true"
                    className="relative isolate flex min-h-52 flex-1 flex-col items-center justify-center gap-5 overflow-hidden pt-2"
                >
                    {/* As órbitas e o halo moram atrás das capas, centrados nelas. */}
                    <span className="absolute top-2/5 left-1/2 -z-10 size-40 -translate-1/2 rounded-full border border-foreground/4" />
                    <span className="absolute top-2/5 left-1/2 -z-10 size-30 -translate-1/2 rounded-full border border-foreground/6" />
                    <span className="absolute top-2/5 left-1/2 -z-10 h-32 w-48 -translate-1/2 bg-radial from-foreground/8 to-transparent to-70%" />
                    <div className="flex items-center">
                        <Capa marca="claude" className="translate-x-3 translate-y-2.5 -rotate-12" />
                        <Capa marca="finance" tamanho="grande" className="z-10" />
                        <Capa marca="chatgpt" className="-translate-x-3 translate-y-2.5 rotate-12" />
                    </div>
                    <div className="flex flex-wrap justify-center gap-1.5">
                        <Sugestao marca="claude">Quanto gastei com mercado?</Sugestao>
                        <Sugestao marca="chatgpt">Lance R$ 32 de almoço</Sugestao>
                    </div>
                </div>
                <div className="flex min-w-0 flex-col items-start @lg/ias-vazio:max-w-64">
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
