"use client"

import { Glass } from "@/components/ui/glass"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Caption, Muted, Small } from "@/components/ui/typography"

import { cn } from "@/lib/utils"

import { DocNote, DocSection, PropsTable, Usage } from "../ds-doc"

/** Linhas falsas, só para a placa ter conteúdo por cima. */
function LinhasDeMenu() {
    return (
        <div className="flex flex-col gap-1 p-2">
            <Small className="px-2 py-1 text-muted-foreground">Finanças</Small>
            {["Início", "Transações", "Carteiras", "Cartões"].map((rotulo, i) => (
                <div
                    key={rotulo}
                    className={`rounded-md px-2 py-1.5 text-sm ${i === 0 ? "bg-current/12 font-medium" : ""}`}
                >
                    {rotulo}
                </div>
            ))}
        </div>
    )
}

/**
 * O palco do modo material: conteúdo com **detalhe** por baixo da placa.
 *
 * Cor chapada não serve para julgar borrão — borrar uma cor uniforme devolve a
 * mesma cor. O que revela um material é textura: tipografia miúda e blocos de
 * cor com aresta.
 */
function ConteudoAtras() {
    return (
        <div aria-hidden className="absolute inset-0 overflow-hidden rounded-lg">
            <div className="flex flex-col gap-1.5 p-3">
                {[
                    ["#16a34a", "Mercado", "R$ 224,40"],
                    ["#e11d48", "Farmácia", "R$ 87,90"],
                    ["#2563eb", "Transporte", "R$ 42,10"],
                    ["#d97706", "Assinatura", "R$ 19,90"],
                    ["#7c3aed", "Restaurante", "R$ 156,00"],
                    ["#0891b2", "Mercado", "R$ 311,25"],
                ].map(([cor, nome, valor]) => (
                    <div key={nome + valor} className="flex items-center gap-2">
                        <span
                            className="size-6 shrink-0 rounded-md"
                            style={{ background: cor }}
                        />
                        <span className="text-xs">{nome}</span>
                        <span className="nums ms-auto text-xs text-muted-foreground">
                            {valor}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    )
}

/** Uma placa de material sobre o palco, para os degraus ficarem lado a lado. */
function PalcoDeMaterial({
    material,
    rotulo,
}: {
    material: React.ComponentProps<typeof Glass>["material"]
    rotulo: string
}) {
    return (
        <div className="flex flex-col gap-2">
            <Caption>{rotulo}</Caption>
            <div className="relative h-40 w-full overflow-hidden rounded-lg border border-border">
                <ConteudoAtras />
                <Glass
                    material={material}
                    className="absolute inset-x-6 inset-y-8 rounded-xl"
                />
            </div>
        </div>
    )
}

/**
 * Uma pastilha na caixa de um switch de tema — 72×32.
 *
 * Ela **espalha as props na raiz**, e isso não é cerimônia: sem o espalhamento,
 * o `Slot` entrega a `className` e ninguém a aplica. Foi o que aconteceu na
 * primeira escrita desta página — o espécime saiu sem vidro nenhum, calado.
 */
function PastilhaDeControle({
    className,
    ...props
}: React.ComponentProps<"div">) {
    return (
        <div
            className={cn("relative h-8 w-18 shrink-0 rounded-full p-0.5", className)}
            {...props}
        >
            <div className="absolute inset-y-0.5 left-0.5 w-[calc(50%-0.125rem)] rounded-full border border-border/80 bg-background shadow-xs" />
        </div>
    )
}

export default function GlassDoc() {
    return (
        <>
            <Usage>
                A superfície de vidro <strong>pintada</strong>: lâmina translúcida, nuvens de luz nos cantos e um aro inclinado. Ela supõe que <em>não há conteúdo atrás</em>; quando algo passa por baixo, use <code>material</code> ou a <code>.mobile-glass-surface</code>, que borram de verdade. Toda superfície elevada é uma placa só: quem hospeda pinta, o hospedado não.
            </Usage>

            <DocSection
                title="A superfície"
                description="O degrau `panel`, o padrão: lâmina no corpo, nuvens nos cantos superior-esquerdo e inferior-direito, aro na diagonal."
                code={`<Glass className="w-60 rounded-xl shadow-sm">
  …
</Glass>`}
            >
                <Glass className="h-64 w-60 rounded-xl shadow-sm">
                    <LinhasDeMenu />
                </Glass>
            </DocSection>

            <DocSection
                title="Numa caixa pequena"
                description="O degrau `control`, para controles pequenos. Numa caixa de 32px a nuvem de `panel` leria como aresta dura."
                code={`<Glass size="control" className="h-8 w-18 rounded-full" />`}
            >
                <div className="flex items-center gap-8">
                    <div className="flex flex-col items-center gap-2">
                        <Glass size="control" className="h-8 w-18 rounded-full" />
                        <Muted className="text-2xs">control</Muted>
                    </div>
                    <div className="flex flex-col items-center gap-2">
                        <Glass className="h-8 w-18 rounded-full" />
                        <Muted className="text-2xs">panel, na mesma caixa</Muted>
                    </div>
                </div>
            </DocSection>

            <DocSection
                title="Vestindo uma peça que já existe"
                description="Com `asChild` o `Slot` mescla as classes no filho, sem criar nó: dá vidro a um controle sem tocar na `className` dele."
                code={`<Glass asChild size="control">
  <ThemeToggle />
</Glass>`}
            >
                <Glass asChild size="control">
                    <PastilhaDeControle />
                </Glass>
            </DocSection>

            <DocSection
                title="Os três degraus do material"
                description="Com `material` a peça borra o que está atrás. Os degraus diferem na opacidade da lâmina, nunca no raio. Ao lado, o pintado, sem borrão."
                code={`<Glass material="thin" />
<Glass material="regular" />
<Glass material="thick" />`}
                previewClassName="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4 items-stretch"
            >
                <PalcoDeMaterial material={undefined} rotulo="sem material — o pintado" />
                <PalcoDeMaterial material="thin" rotulo="thin" />
                <PalcoDeMaterial material="regular" rotulo="regular" />
                <PalcoDeMaterial material="thick" rotulo="thick" />
            </DocSection>

            <DocNote title="`material` só onde há conteúdo atrás">
                Numa superfície que reserva a própria calha o borrão não tem o que borrar. No material as nuvens saem, porque disputariam com o conteúdo real; quem mantém a leitura de vidro é o aro.
            </DocNote>

            <DocNote title="A lâmina vai por cima das nuvens">
                É a atenuação da lâmina que faz a luz ler como <em>atrás</em>. Os dois alfas andam juntos: escurecer a lâmina sem subir a nuvem apaga a luz.
            </DocNote>

            <DocNote title="A lâmina puxa para o chão do próprio tema">
                Preto no escuro, a família neutra no claro — preto com alfa ali seria um cinza que o tema não tem.
                <Table className="mt-2">
                    <TableHeader>
                        <TableRow>
                            <TableHead> </TableHead>
                            <TableHead>escuro</TableHead>
                            <TableHead>claro</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        <TableRow>
                            <TableCell>lâmina</TableCell>
                            <TableCell className="nums">preto 82% → rgb 2</TableCell>
                            <TableCell className="nums">branco 92% → rgb 255</TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell>razão da página</TableCell>
                            <TableCell className="nums">1,049</TableCell>
                            <TableCell className="nums">1,040</TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell>pico do aro</TableCell>
                            <TableCell className="nums">luz, sup-esq</TableCell>
                            <TableCell className="nums">sombra, inf-dir</TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell>nuvens</TableCell>
                            <TableCell className="nums">23 e 23</TableCell>
                            <TableCell className="nums">não registram</TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
                <br />
                Luz de verdade no claro exige baixar <code>--background</code>, que é decisão de sistema.
            </DocNote>

            <DocNote title="O aro é um eixo só, e o claro tem par próprio">
                <code>--glass-rim-angle</code> vale 165° no escuro e 345° no claro — a mesma geometria, sombra no canto oposto ao brilho. No claro o pico é sombra, e <code>--glass-rim-far</code> é token próprio para o outro extremo ser luz: é o par que lê como bisel.
            </DocNote>

            <DocNote title="A pegada das nuvens espelha a do aro">
                <code>100% 18%</code> nos cantos opostos reflete a zona clara do aro; a inclinação fica só no aro, porque <code>radial-gradient</code> não rotaciona a elipse.
            </DocNote>

            <DocNote title="`asChild` só funciona se o filho repassar props">
                O <code>Slot</code> entrega a <code>className</code>; se o filho não a aplica na raiz, a peça sai sem vidro e nada avisa. Antes de vestir, confira <code>className={"{cn(…, className)}"}</code>. O <code>data-slot</code> do filho vence o da peça.
            </DocNote>

            <DocNote title="Vestir vidro substitui o preenchimento">
                O shorthand <code>background</code> apaga o <code>background-color</code> da peça. A borda transparente de 1px é onde o aro mora, e encolhe o conteúdo 2px. O raio é herdado: a utility não declara <code>border-radius</code>.
            </DocNote>

            <DocNote title="`size` move só a variável">
                O preset <code>control</code> sobrescreve só <code>--glass-cloud-ry</code>, lida com fallback; duas utilities escrevendo <code>background</code> seriam decididas pela ordem de emissão.
            </DocNote>

            <DocNote title="Sem eixo de intensidade">
                Para mais ou menos vidro, sobrescreva os tokens no próprio elemento — são variáveis e herdam.
            </DocNote>

            <PropsTable
                rows={[
                    {
                        prop: "size",
                        type: `"panel" | "control"`,
                        default: `"panel"`,
                        description:
                            "A medida da caixa; `control` para controles pequenos.",
                    },
                    {
                        prop: "material",
                        type: '"thin" | "regular" | "thick"',
                        default: "—",
                        description:
                            "Liga o borrão; ausente, é o pintado.",
                    },
                    {
                        prop: "asChild",
                        type: "boolean",
                        default: "false",
                        description:
                            "Veste o filho em vez de renderizar um `div`.",
                    },
                    {
                        prop: "className",
                        type: "string",
                        description:
                            "Raio, sombra e caixa são de quem chama.",
                    },
                ]}
            />

            <PropsTable
                title="Tokens"
                rows={[
                    {
                        prop: "--glass-tint",
                        type: "cor com alfa",
                        description:
                            "A lâmina: preto no escuro, branco no claro.",
                    },
                    {
                        prop: "--glass-cloud",
                        type: "cor com alfa",
                        description:
                            "A luz atrás, branca, lida através da lâmina — daí o alfa alto.",
                    },
                    {
                        prop: "--glass-rim",
                        type: "cor com alfa",
                        description:
                            "O pico do aro: luz no escuro, sombra no claro. Piso de 28% no escuro.",
                    },
                    {
                        prop: "--glass-rim-shade",
                        type: "cor com alfa",
                        description: "O vale do aro, nos lados.",
                    },
                    {
                        prop: "--glass-rim-angle",
                        type: "ângulo",
                        description:
                            "O eixo: 165° no escuro, 345° no claro.",
                    },
                    {
                        prop: "--glass-material-thin / -regular / -thick",
                        type: "cor com alfa",
                        default: "—",
                        description:
                            "A lâmina de cada degrau do material: escuro 40 / 55 / 70%, claro 60 / 72 / 84%.",
                    },
                    {
                        prop: "--glass-tone",
                        type: "cor",
                        default: "transparent",
                        description:
                            "O vidro colorido, acima da lâmina; sem valor, não pinta nada.",
                    },
                    {
                        prop: "--glass-ink / -amount / -boost",
                        type: "cor / % / número",
                        default: "— / 0% / 4",
                        description:
                            "A cor que o aro e as nuvens puxam; sem tinta, nada muda.",
                    },
                    {
                        prop: "--glass-rim-far",
                        type: "cor com alfa",
                        default: "—",
                        description:
                            "O outro extremo do bisel; no claro é luz, contra o pico de sombra.",
                    },
                    {
                        prop: "--glass-sheen",
                        type: "cor",
                        default: "transparent",
                        description:
                            "O realce de estado, na camada mais de cima.",
                    },
                    {
                        prop: "--glass-rim-image / --glass-sheen-image",
                        type: "imagem",
                        default: "o linear do aro / o chapado do realce",
                        description:
                            "O aro e o realce como contrato; glass-round os troca por cônico e especular, porque num círculo não há cantos.",
                    },
                    {
                        prop: "--glass-spec",
                        type: "%",
                        default: "14%",
                        description:
                            "O pico do especular do preset redondo.",
                    },
                    {
                        prop: "--glass-cloud-rx / -ry",
                        type: "medida",
                        default: "100% / 18%",
                        description:
                            "A pegada das nuvens; o preset `control` move só a `-ry`.",
                    },
                ]}
            />
        </>
    )
}
