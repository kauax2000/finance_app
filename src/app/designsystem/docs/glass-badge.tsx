"use client"

import { Badge } from "@/components/ui/badge"
import { GlassBadge } from "@/components/ui/glass-badge"
import { Muted } from "@/components/ui/typography"

import { DocNote, DocSection, PropsTable, Usage } from "../ds-doc"

const TONS = ["primary", "neutral", "success", "warning", "destructive", "income", "expense"] as const

export default function GlassBadgeDoc() {
    return (
        <>
            <Usage>
                A pastilha de vidro. Mesma tradução do{" "}
                <code>GlassButton</code>: o vidro apaga o{" "}
                <code>background-color</code>, então os sete{" "}
                <code>bg-{"{tom}"}-muted</code> do <code>Badge soft</code>{" "}
                sumiriam. O tom vira <code>--glass-tone</code>, e a tinta continua
                sendo o <code>-muted-foreground</code> que já pareia com ele.
            </Usage>

            <DocSection
                title="Os sete tons"
                previewClassName="bg-background p-6"
                code={`<GlassBadge tone="success">Paga</GlassBadge>`}
            >
                <div className="flex flex-wrap gap-2">
                    {TONS.map((tone) => (
                        <GlassBadge key={tone} tone={tone}>
                            {tone}
                        </GlassBadge>
                    ))}
                </div>
            </DocSection>

            <DocSection
                title="Ao lado da pastilha normal"
                previewClassName="bg-background p-6"
                code={`<Badge tone="success">Paga</Badge>
<GlassBadge tone="success">Paga</GlassBadge>`}
            >
                <div className="flex flex-col gap-3">
                    {(["success", "warning", "destructive"] as const).map((tone) => (
                        <div key={tone} className="flex items-center gap-3">
                            <Badge tone={tone}>soft</Badge>
                            <Badge tone={tone} variant="outline">outline</Badge>
                            <GlassBadge tone={tone}>vidro</GlassBadge>
                        </div>
                    ))}
                </div>
            </DocSection>

            <DocSection
                title="Os três degraus"
                description="14, 18 e 22px de altura — e é essa escala que decide o que sobra do vidro."
                previewClassName="bg-background p-6"
                code={`<GlassBadge size="xs">42</GlassBadge>`}
            >
                <div className="flex items-center gap-4">
                    {(["xs", "sm", "md"] as const).map((size) => (
                        <div key={size} className="flex flex-col items-center gap-1">
                            <GlassBadge size={size} tone="success">
                                Paga
                            </GlassBadge>
                            <Muted className="text-2xs">{size}</Muted>
                        </div>
                    ))}
                </div>
            </DocSection>

            <DocNote title="Não há eixo `variant`, e é decisão">
                O <code>Badge</code> tem <code>soft</code> (preenchido) e{" "}
                <code>outline</code> (contornado). <strong>Vidro é a terceira
                superfície, não um cruzamento das outras duas</strong>: ele já
                traz o aro como aresta própria, e um <code>outline</code> de vidro
                seria uma segunda borda para a mesma pastilha.
            </DocNote>

            <DocNote title="A 22px a nuvem não cabe, e quem carrega é o aro">
                O <code>Badge</code> mede 14px (<code>xs</code>), 18 (
                <code>sm</code>) e 22 (<code>md</code>) — bem abaixo dos ~32px
                para que o preset <code>control</code> foi calibrado. Nessa escala
                a nuvem vira um degradê de canto indistinguível do próprio aro.
                <br />
                <br />
                Numa pastilha de 22px o eixo do aro tem ~24px, e a zona clara
                dele, 16%, dá <strong>~4px</strong> — um brilho de canto, que é
                exatamente o que uma pastilha de vidro tem.{" "}
                <strong>Não há degrau novo porque não há o que ajustar</strong>: a
                nuvem não cabe, e dizer isso é melhor que fingir que cabe.
            </DocNote>

            <DocNote title="O anel de foco do `Badge` é hostil ao vidro">
                A base traz <code>focus-visible:ring-offset-2 ring-offset-background</code>{" "}
                — uma calha <strong>opaca</strong>, com a cor da página, desenhada
                em volta da pastilha. Sobre uma superfície translúcida ela lê como
                um recorte na peça. Aqui ela é anulada, e o anel encosta na aresta.
            </DocNote>

            <PropsTable
                rows={[
                    {
                        prop: "tone",
                        type: "os sete tons",
                        default: `"primary"`,
                        description: "O tom da lâmina e a tinta que o acompanha.",
                    },
                    {
                        prop: "size",
                        type: `"xs" | "sm" | "md"`,
                        default: `"md"`,
                        description: "14, 18 e 22px de altura — o mesmo do `Badge`.",
                    },
                ]}
            />
        </>
    )
}
