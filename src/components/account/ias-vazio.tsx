import { PlusIcon, ShieldCheckIcon } from "@heroicons/react/16/solid"

import { Capa, type Marca } from "@/components/account/marcas-de-ia"
import { Button } from "@/components/ui/button"

/**
 * O que protege a conta, do que o código impõe: o token da IA só lê e insere
 * lançamento marcado (`ia_somente_leitura_*`, a guarda das RPCs), o lançamento
 * entra com `needs_review`, e a conexão é um consentimento revogável.
 */
const GARANTIAS = [
    "Não edita nem apaga nada no Finance",
    "O que ela lança espera você conferir",
    "Você desconecta quando quiser",
]

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
 * inclinados atrás dele, sobre duas órbitas, e uma pergunta para cada IA), o
 * convite e o que protege a conta. A cena fica sempre no topo do cartão; ela é
 * ilustração, e o leitor de tela lê só o texto.
 */
export function IasVazio({ onConectar }: { onConectar: () => void }) {
    return (
        <div className="flex flex-col gap-5 p-4">
                <div
                    aria-hidden="true"
                    className="relative isolate flex flex-col items-center gap-5 pt-7"
                >
                    <div className="relative flex items-center">
                        {/* As órbitas e o halo moram atrás das capas, centrados nelas. */}
                        <span className="absolute top-1/2 left-1/2 -z-10 size-40 -translate-1/2 rounded-full border border-foreground/4" />
                        <span className="absolute top-1/2 left-1/2 -z-10 size-30 -translate-1/2 rounded-full border border-foreground/6" />
                        <span className="absolute top-1/2 left-1/2 -z-10 h-32 w-48 -translate-1/2 bg-radial from-foreground/8 to-transparent to-70%" />
                        <Capa marca="claude" className="translate-x-3 translate-y-2.5 -rotate-12" />
                        <Capa marca="finance" tamanho="grande" className="z-10" />
                        <Capa marca="chatgpt" className="-translate-x-3 translate-y-2.5 rotate-12" />
                    </div>
                    <div className="flex flex-col items-center gap-1.5">
                        <Sugestao marca="claude">Onde dá para cortar este mês?</Sugestao>
                        <Sugestao marca="chatgpt">Resuma meu mês em 3 pontos</Sugestao>
                    </div>
                </div>
                <div className="flex min-w-0 flex-col items-start">
                    <p className="text-base font-semibold">Uma IA que entende o seu dinheiro</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Conecte o Claude ou o ChatGPT e peça análises, o resumo do mês e onde cortar. Ela também lê seus lançamentos e lança o que você pedir.
                    </p>
                    <ul className="mt-3 flex flex-col gap-1.5">
                        {GARANTIAS.map((g) => (
                            <li key={g} className="flex items-start gap-2 text-xs text-muted-foreground">
                                <ShieldCheckIcon aria-hidden="true" className="mt-px size-4 shrink-0 text-foreground" />
                                {g}
                            </li>
                        ))}
                    </ul>
                    <Button variant="primary" className="mt-4" onClick={onConectar}>
                        <PlusIcon aria-hidden data-icon="inline-start" />
                        Conectar uma IA
                    </Button>
                </div>
        </div>
    )
}
