"use client"

import * as React from "react"

import { Checkbox } from "@/components/ui/checkbox"
import { GlassCheckbox } from "@/components/ui/glass-checkbox"
import { Label } from "@/components/ui/label"
import { Muted } from "@/components/ui/typography"

import { DocNote, DocSection, PropsTable, Usage } from "../ds-doc"

export default function GlassCheckboxDoc() {
    const [marcado, setMarcado] = React.useState(true)

    return (
        <>
            <Usage>
                A caixa de marcar de vidro. <strong>É a menor das quatro, e a
                escala é o assunto</strong>: ela mede 16×16px, contra os ~32px
                para que o preset <code>control</code> foi calibrado.
                <br />
                <br />
                A página é honesta sobre o que sobra: nessa caixa a nuvem não
                existe como nuvem, e quem carrega a peça é a aresta.
            </Usage>

            <DocSection
                title="Os três estados"
                previewClassName="bg-background p-6"
                code={`<GlassCheckbox checked />`}
            >
                <div className="flex items-center gap-6">
                    {[
                        { rotulo: "desmarcada", props: {} },
                        { rotulo: "marcada", props: { checked: true } },
                        { rotulo: "indeterminada", props: { checked: "indeterminate" as const } },
                    ].map(({ rotulo, props }) => (
                        <div key={rotulo} className="flex flex-col items-center gap-2">
                            <GlassCheckbox {...props} />
                            <Muted className="text-2xs">{rotulo}</Muted>
                        </div>
                    ))}
                </div>
            </DocSection>

            <DocSection
                title="Ao lado da caixa normal"
                description="A comparação que decide se a peça se paga: a 16px, quanto do vidro sobrevive."
                previewClassName="bg-background p-6"
                code={`<Checkbox checked />
<GlassCheckbox checked />`}
            >
                <div className="flex items-center gap-8">
                    <div className="flex flex-col items-center gap-2">
                        <div className="flex gap-3">
                            <Checkbox />
                            <Checkbox checked />
                        </div>
                        <Muted className="text-2xs">normal</Muted>
                    </div>
                    <div className="flex flex-col items-center gap-2">
                        <div className="flex gap-3">
                            <GlassCheckbox />
                            <GlassCheckbox checked />
                        </div>
                        <Muted className="text-2xs">vidro</Muted>
                    </div>
                </div>
            </DocSection>

            <DocSection
                title="Numa linha de formulário"
                previewClassName="bg-background p-6"
                code={`<GlassCheckbox id="lembrar" checked={x} onCheckedChange={setX} />
<Label htmlFor="lembrar">Lembrar deste dispositivo</Label>`}
            >
                <div className="flex items-center gap-2">
                    <GlassCheckbox
                        id="lembrar"
                        checked={marcado}
                        onCheckedChange={(v) => setMarcado(v === true)}
                    />
                    <Label htmlFor="lembrar">Lembrar deste dispositivo</Label>
                </div>
            </DocSection>

            <DocNote title="A 16px a nuvem não existe, e a conta está aqui">
                A nuvem do preset <code>control</code> é 70% da altura —{" "}
                <strong>11px</strong> numa caixa de 16. E o eixo do aro numa caixa
                de 16 mede ~20px, com a zona clara em 16%, ou seja{" "}
                <strong>3px</strong> de brilho de canto.
                <br />
                <br />
                Nessa escala a nuvem vira um degradê de canto indistinguível do
                próprio aro. <strong>O que carrega a peça é a aresta</strong>, e
                isso é dito aqui em vez de a peça fingir ter três camadas de luz
                que ninguém enxerga.
            </DocNote>

            <DocNote title="O marcado pintava em três propriedades, e duas falham sobre vidro">
                O <code>Checkbox</code> pinta o estado marcado com{" "}
                <code>border-primary</code>, <code>bg-primary</code> e{" "}
                <code>text-primary-foreground</code> de uma vez. Sobre vidro:
                <br />
                <br />
                <strong>O fundo falha calado</strong> — <code>bg-primary</code>{" "}
                declara só <code>background-color</code>, o shorthand não o apaga,
                e ele passa a pintar atrás das camadas. <strong>A tinta perde o
                par</strong> — branco sobre um preenchimento que não existe mais.
                <br />
                <br />
                Aqui o marcado vira <strong>tom da lâmina</strong> e a tinta vai
                para o <code>-muted-foreground</code>, que é o par calibrado do
                mesmo <code>-muted</code>. <strong>O contorno verde fica</strong>:
                é a única das três que sobrevive intacta, e numa caixa de 16px é
                ele que torna o estado legível.
            </DocNote>

            <DocNote title="O alvo de toque não muda">
                O <code>after:-inset-3.5</code> do <code>Checkbox</code> leva a
                área de acerto a 44×44 sem tocar no layout, e o vidro não mexe
                nele — <code>::after</code> não é fundo.
            </DocNote>

            <PropsTable
                rows={[
                    {
                        prop: "…",
                        type: "`ComponentProps<typeof Checkbox>`",
                        description:
                            "Tudo é do `Checkbox` — `checked`, `onCheckedChange`, `disabled`, `indeterminate`. A peça só troca a superfície e traduz o estado marcado.",
                    },
                ]}
            />
        </>
    )
}
