"use client"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { GlassAvatar } from "@/components/ui/glass-avatar"
import { Muted } from "@/components/ui/typography"
import { IDENTITY_TONES } from "@/lib/avatar"
import { cn } from "@/lib/utils"

import { DocNote, DocSection, PropsTable, Usage } from "../ds-doc"

const PESSOAS = ["AC", "BM", "KL", "RS", "TF", "VP"]

export default function GlassAvatarDoc() {
    return (
        <>
            <Usage>
                O avatar de vidro. <strong>É a peça em que o vidro não tinha onde
                morar</strong>, e a tradução de cor é o que resolve: a identidade
                da pessoa vira o tom da lâmina, o fallback fica transparente, e a
                tinta continua sendo a mesma.
            </Usage>

            <DocSection
                title="As seis identidades"
                previewClassName="bg-background p-6"
                code={`<GlassAvatar seed={2} size="md">KL</GlassAvatar>`}
            >
                <div className="flex flex-wrap items-center gap-3">
                    {PESSOAS.map((iniciais, i) => (
                        <GlassAvatar key={iniciais} seed={i} size="md">
                            {iniciais}
                        </GlassAvatar>
                    ))}
                </div>
            </DocSection>

            <DocSection
                title="Ao lado do avatar normal"
                description="O de cima é opaco; o de baixo é lâmina. A diferença de material aparece na aresta."
                previewClassName="bg-background p-6"
                code={`<Avatar size="md"><AvatarFallback className={cn(tom.surface, tom.ink)}>KL</AvatarFallback></Avatar>
<GlassAvatar seed={2} size="md">KL</GlassAvatar>`}
            >
                <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-3">
                        {PESSOAS.map((iniciais, i) => (
                            <Avatar key={iniciais} size="md">
                                <AvatarFallback
                                    className={cn(
                                        IDENTITY_TONES[i].surface,
                                        IDENTITY_TONES[i].ink
                                    )}
                                >
                                    {iniciais}
                                </AvatarFallback>
                            </Avatar>
                        ))}
                        <Muted className="text-2xs">normal</Muted>
                    </div>
                    <div className="flex items-center gap-3">
                        {PESSOAS.map((iniciais, i) => (
                            <GlassAvatar key={iniciais} seed={i} size="md">
                                {iniciais}
                            </GlassAvatar>
                        ))}
                        <Muted className="text-2xs">vidro</Muted>
                    </div>
                </div>
            </DocSection>

            <DocSection
                title="Os cinco degraus, e as duas formas"
                previewClassName="bg-background p-6"
                code={`<GlassAvatar seed={0} size="lg" shape="rounded">AC</GlassAvatar>`}
            >
                <div className="flex flex-wrap items-end gap-4">
                    {(["xs", "sm", "md", "lg", "xl"] as const).map((size, i) => (
                        <div key={size} className="flex flex-col items-center gap-1">
                            <GlassAvatar seed={i} size={size}>
                                AC
                            </GlassAvatar>
                            <Muted className="text-2xs">{size}</Muted>
                        </div>
                    ))}
                    <GlassAvatar seed={3} size="lg" shape="rounded">
                        RS
                    </GlassAvatar>
                </div>
            </DocSection>

            <DocNote title="O vidro não tinha onde morar, e os dois caminhos óbvios falham">
                Medido: a raiz do <code>Avatar</code> <strong>não pinta fundo
                nenhum</strong>, e o <code>AvatarFallback</code> é{" "}
                <code>h-full w-full</code> com superfície <strong>opaca</strong>.
                <br />
                <br />
                Vidro na <strong>raiz</strong> fica escondido atrás do fallback.
                Vidro no <strong>fallback</strong> apaga o{" "}
                <code>bg-identity-N-surface</code> e sobra a identidade sem cor. E
                o terceiro caminho — tornar a superfície de identidade translúcida
                — está <strong>rejeitado por escrito</strong> no sistema: avatares
                empilhados mostrariam o de baixo, e as iniciais leriam sobre a cor
                do vizinho.
                <br />
                <br />
                A saída é a tradução: <strong>a identidade vira o tom</strong>. E a
                objeção do empilhamento não se aplica aqui —{" "}
                <em>é por isso que a peça é separada</em>. Um{" "}
                <code>GlassAvatar</code> é opt-in, e quem o escolhe aceita a
                translucidez; o <code>Avatar</code> normal segue opaco.
            </DocNote>

            <DocNote title="A foto encolhe 2px, e o preço é a aresta">
                O vidro traz <code>border: 1px solid transparent</code>, que é onde
                o aro mora. Com <code>box-sizing: border-box</code> a caixa externa
                não cresce — <strong>o conteúdo encolhe 2px</strong>. Num avatar{" "}
                <code>sm</code> de 32px, são 30px de imagem.
                <br />
                <br />
                Numa peça circular com foto isso é visível, e por isso está dito em
                vez de descoberto depois.
            </DocNote>

            <PropsTable
                rows={[
                    {
                        prop: "seed",
                        type: "number",
                        default: "0",
                        description:
                            "Qual das seis identidades. O mesmo papel do argumento de `identityToneFor`.",
                    },
                    {
                        prop: "src / alt",
                        type: "string",
                        description: "A foto, quando há. Sem ela, as iniciais sobre a lâmina.",
                    },
                    {
                        prop: "size / shape",
                        type: "os eixos do `Avatar`",
                        default: `"md" / "circle"`,
                        description: "24 · 32 · 40 · 48 · 56px, círculo ou canto arredondado.",
                    },
                ]}
            />
        </>
    )
}
