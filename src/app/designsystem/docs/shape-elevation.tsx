"use client"

import { Code } from "@/components/ui/code"
import { cn } from "@/lib/utils"
import { DocNote, DocSection, Usage } from "../ds-doc"
import { Group, Spec } from "../ds-kit"

/**
 * A escada do raio, com o valor resolvido para `--radius: 0.625rem` (10px) e
 * quem o veste hoje em `components/ui` e `lib/` — contado, não desejado.
 */
const RADII = [
  { cls: "rounded-xs", calc: "0,2 ×", px: "2px", use: "o menor marcador", who: ["legenda do Chart"] },
  { cls: "rounded-sm", calc: "0,6 ×", px: "6px", use: "a peça miúda dentro de texto", who: ["Kbd", "Code", "Breadcrumb"] },
  { cls: "rounded-md", calc: "0,8 ×", px: "8px", use: "o que mora dentro de uma placa", who: ["item de menu", "Select", "Tabs", "Skeleton"] },
  { cls: "rounded-lg", calc: "1 ×", px: "10px", use: "o padrão dos controles e das placas pequenas", who: ["Input", "Button", "Toggle", "Popover", "DropdownMenu"] },
  { cls: "rounded-xl", calc: "1,4 ×", px: "14px", use: "a superfície que contém outras", who: ["Card", "Dialog", "Sheet", "Alert", "Accordion"] },
  { cls: "rounded-2xl", calc: "1,8 ×", px: "18px", use: "a peça grande e solta", who: ["Drawer", "CommandDialog", "Sidebar floating"] },
  { cls: "rounded-3xl", calc: "2,2 ×", px: "22px", use: "reservado", who: ["a moldura de telefone do catálogo"] },
  { cls: "rounded-4xl", calc: "2,6 ×", px: "26px", use: "reservado — nenhum componente usa hoje", who: [] },
  { cls: "rounded-full", calc: "metade", px: "½ da menor aresta", use: "pílula e círculo: concêntrico por definição", who: ["Badge", "Avatar", "Switch", "BottomBar", "busca do Command"] },
]

const SHADOWS = [
  { cls: "shadow-xs", use: "o controle marcado sobe um fio", who: ["Checkbox", "Radio", "Toggle", "Tabs", "Menubar"] },
  { cls: "shadow-sm", use: "apoiado na página", who: ["Card elevated", "Slider", "ThemeToggle", "Sidebar"] },
  { cls: "shadow-md", use: "flutua sobre o conteúdo, ancorado", who: ["DropdownMenu", "ContextMenu", "Select", "HoverCard", "Card no hover"] },
  { cls: "shadow-lg", use: "cobre a tela", who: ["Dialog", "Sheet", "Drawer", "Combobox", "BottomBar"] },
  { cls: "shadow-xl", use: "o conjunto que para tudo", who: ["CommandDialog"] },
]

/** Três formas de encaixar uma placa numa moldura de `rounded-2xl` com 12px de recuo. */
const ENCAIXES = [
  { rotulo: "18 dentro de 18", inner: "rounded-2xl", certo: false, nota: "o canto de dentro engorda" },
  { rotulo: "6 dentro de 18", inner: "rounded-sm", certo: true, nota: "fora − recuo: 18 − 12 = 6" },
  { rotulo: "full dentro de full", inner: "rounded-full", outer: "rounded-full", certo: true, nota: "a pílula não faz conta" },
]

export default function ShapeElevationDoc() {
  return (
    <>
      <Usage>
        Forma e altura dizem o que a peça é antes do texto dizer. O raio é uma escala derivada de <code>--radius</code> — mudar a marca é mudar uma linha — e a sombra é o eixo da altura: quanto mais alto, mais a peça cobre e menos dura na tela.
      </Usage>

      <Group
        title="Raio"
        description="Cresce com o tamanho do que contém: a peça miúda é quase quadrada, a superfície que abriga outras é a mais redonda."
        layout="flow"
      >
        <Spec title="A escada" meta="--radius: 0.625rem" className="mb-0" bodyClassName="flex flex-col gap-4">
          {RADII.map((r) => (
            <div key={r.cls} className="flex items-center gap-4">
              <span
                aria-hidden
                className={cn(
                  "h-16 w-24 shrink-0 border border-border bg-muted",
                  r.cls
                )}
              />
              <div className="flex min-w-0 flex-col">
                <div className="flex flex-wrap items-baseline gap-x-2">
                  <Code variant="inline">{r.cls}</Code>
                  <span className="nums text-2xs text-muted-foreground">
                    {r.calc} · {r.px}
                  </span>
                </div>
                <span className="text-xs text-muted-foreground">{r.use}</span>
                {r.who.length ? (
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {r.who.map((w) => (
                      <Code key={w}>{w}</Code>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>
          ))}
        </Spec>
      </Group>

      <DocSection
        title="Raio concêntrico"
        description="Uma placa dentro de outra tem o raio de fora menos o recuo, senão os dois arcos não correm paralelos. Com rounded-full a conta some: metade da menor aresta, dos dois lados."
        previewClassName="flex-wrap items-start gap-8"
      >
        {ENCAIXES.map((e) => (
          <div key={e.rotulo} className="flex flex-col items-center gap-2">
            <div
              className={cn(
                "flex w-40 border border-border bg-muted p-3",
                e.outer === "rounded-full" ? "h-16 rounded-full" : "h-28 rounded-2xl"
              )}
            >
              <div className={cn("flex-1 bg-card ring-1 ring-border", e.inner)} />
            </div>
            <span
              className={cn(
                "text-2xs",
                e.certo ? "font-medium text-foreground" : "text-muted-foreground"
              )}
            >
              {e.certo ? "✓ " : "✕ "}
              {e.rotulo}
            </span>
            <span className="text-2xs text-muted-foreground">{e.nota}</span>
          </div>
        ))}
      </DocSection>

      <Group
        title="Elevação"
        description="Cinco alturas. A sombra cresce em distância e borrão, e a peça mais alta é a que some mais rápido da tela."
        layout="flow"
      >
        <Spec title="A escada" meta="--shadow-*" className="mb-0" bodyClassName="flex flex-col gap-5 bg-background">
          {SHADOWS.map((s) => (
            <div key={s.cls} className="flex items-center gap-4">
              <span
                aria-hidden
                className={cn("h-16 w-24 shrink-0 rounded-lg bg-card", s.cls)}
              />
              <div className="flex min-w-0 flex-col">
                <Code variant="inline">{s.cls}</Code>
                <span className="text-xs text-muted-foreground">{s.use}</span>
                <div className="mt-1.5 flex flex-wrap gap-1">
                  {s.who.map((w) => (
                    <Code key={w}>{w}</Code>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </Spec>
      </Group>

      <DocNote title="O raio é do componente, não da variante">
        Canto não é moldura. O <code>Alert</code> já levou o raio dentro do <code>variant</code> — um com <code>rounded-xl</code>, outro com <code>rounded-lg</code> — e dois alertas lado a lado saíam com 14px e 10px. E o raio não desce com o <code>size</code>: raio por degrau é desvio, e nenhum controle do sistema o faz.
      </DocNote>

      <DocNote title="Superfície flutuante é anel e sombra, não borda">
        Menus, popover e diálogo vestem <code>ring-1 ring-foreground/10</code> com a sombra do degrau. O anel não ocupa espaço no layout, e a <code>/10</code> sobre o próprio texto funciona nos dois temas sem par em <code>.dark</code>.
      </DocNote>

      <DocNote title="Sombra é box-shadow, nunca filter">
        <code>filter: drop-shadow</code> segue o contorno de graça, mas transforma o elemento numa raiz de fundo: o <code>backdrop-filter</code> de qualquer filho de vidro passa a borrar só o que está dentro dele, e o vidro some. A sombra que precisa acompanhar uma forma é um pseudo-elemento com <code>box-shadow</code> e o mesmo raio.
      </DocNote>

      <DocNote title="A sombra troca de valor no tema escuro">
        Uma sombra preta a 4% sobre um fundo quase preto não existe. Os cinco degraus são declarados em <code>:root</code> e em <code>.dark</code>: o <code>xs</code> vai de 4% a 35%, o <code>xl</code> de 14% a 70%. A geometria — distância e borrão — é a mesma nos dois.
      </DocNote>
    </>
  )
}
