"use client"

import { GlassButton } from "@/components/ui/glass-button"
import { Button } from "@/components/ui/button"
import { Muted } from "@/components/ui/typography"

import { DocNote, DocSection, PropsTable, Usage } from "../ds-doc"

const TONS = ["primary", "neutral", "success", "warning", "destructive", "income", "expense"] as const

export default function GlassButtonDoc() {
    return (
        <>
            <Usage>
                O botão de vidro. Ele <strong>não é o `Button` com uma classe</strong>:
                o vidro apaga o <code>background-color</code> de quem o veste, então
                um <code>primary</code> perderia o verde. Aqui a hierarquia deixa de
                ser preenchimento e vira <strong>tom da lâmina</strong>.
                <br />
                <br />
                O mecanismo do vidro está em <code>/designsystem/glass</code>; esta
                página é sobre o que a tradução de cor custa e entrega.
            </Usage>

            <DocSection
                title="Os sete tons"
                description="Os mesmos nomes do `Badge`. Não há eixo `variant`: peso é preenchimento, e vidro não tem como ser mais preenchido."
                previewClassName="bg-background p-6"
                code={`<GlassButton tone="success">salvar</GlassButton>`}
            >
                <div className="flex flex-wrap gap-2">
                    {TONS.map((tone) => (
                        <GlassButton key={tone} tone={tone}>
                            {tone}
                        </GlassButton>
                    ))}
                </div>
            </DocSection>

            <DocSection
                title="Ao lado do botão normal"
                description="A comparação que importa: vidro é um peso próprio, não uma repintura do primeiro degrau."
                previewClassName="bg-background p-6"
                code={`<Button>salvar</Button>
<GlassButton>salvar</GlassButton>`}
            >
                <div className="flex flex-wrap items-center gap-3">
                    <Button>salvar</Button>
                    <GlassButton>salvar</GlassButton>
                    <Button variant="secondary">cancelar</Button>
                    <GlassButton tone="neutral">cancelar</GlassButton>
                </div>
            </DocSection>

            <DocSection
                title="A escada não muda"
                description="`size` é o do `Button` — os mesmos cinco degraus de texto e os cinco de ícone."
                previewClassName="bg-background p-6"
                code={`<GlassButton size="sm">salvar</GlassButton>`}
            >
                <div className="flex flex-wrap items-center gap-3">
                    {(["xs", "sm", "md", "lg", "xl"] as const).map((size) => (
                        <div key={size} className="flex flex-col items-center gap-1">
                            <GlassButton size={size}>salvar</GlassButton>
                            <Muted className="text-2xs">{size}</Muted>
                        </div>
                    ))}
                </div>
            </DocSection>

            <DocNote title="Um botão de vidro `primary` não é um botão verde">
                Ele é uma lâmina verde translúcida com tinta verde — escura no
                tema claro, clara no escuro. Mais perto de um{" "}
                <code>Badge soft</code> que de um <code>Button primary</code>.
                <br />
                <br />
                Isso é consequência e não escolha: sobre uma lâmina translúcida
                não há preenchimento para o texto branco parear. A tinta vem do{" "}
                <code>-muted-foreground</code>, que é o par já calibrado do mesmo{" "}
                <code>-muted</code> de que o tom é derivado — então ela acompanha
                os dois temas sem medição nova.
                <br />
                <br />
                <strong>Vidro é um peso próprio.</strong> Uma tela continua tendo
                um <code>primary</code> só, e um botão de vidro não o substitui.
            </DocNote>

            <DocNote title="O realce é variável, porque `hover:bg-*` falha calado sobre vidro">
                As classes de estado declaram <strong>só</strong>{" "}
                <code>background-color</code>, então o shorthand da utility{" "}
                <em>não as apaga</em> — elas passam a pintar <strong>atrás</strong>{" "}
                das camadas de gradiente, e com a lâmina a 82% o realce
                simplesmente não aparece. Nada quebra, nada avisa.
                <br />
                <br />
                Por isso o estado mora em <code>--glass-sheen</code>, uma camada
                própria acima de todas. Ela é <strong>branca neutra</strong>, e
                não o tom: assim uma variável serve os sete tons e os dois temas,
                e o realce lê como o material pegando mais luz em vez de mudar de
                cor.
                <br />
                <br />
                E o <code>hover:bg-muted</code> que a base <code>tertiary</code>{" "}
                traz é anulado com <code>hover:bg-transparent</code> — escrito
                como classe para o <code>twMerge</code> o <strong>remover</strong>,
                e não para disputar com ele por ordem de emissão.
            </DocNote>

            <PropsTable
                rows={[
                    {
                        prop: "tone",
                        type: `"primary" | "neutral" | "success" | "warning" | "destructive" | "income" | "expense"`,
                        default: `"primary"`,
                        description:
                            "O tom da lâmina, e a tinta que o acompanha. Os mesmos sete nomes do `Badge`.",
                    },
                    {
                        prop: "size",
                        type: "o `size` do `Button`",
                        default: `"md"`,
                        description: "A escada de controle não muda: 24 · 28 · 32 · 36 · 40, mais a coluna de ícone.",
                    },
                    {
                        prop: "…",
                        type: "`ComponentProps<typeof Button>`",
                        description:
                            "Tudo o mais é do `Button` — `asChild`, `disabled`, `type`, a maiúscula inicial do CTA.",
                    },
                ]}
            />
        </>
    )
}
