"use client"

import * as React from "react"

import { Code } from "@/components/ui/code"
import { cn } from "@/lib/utils"
import { DocNote, DocSection, Usage } from "../ds-doc"
import { Group, Spec } from "../ds-kit"

/**
 * A escala do raio (rodadas 240 e 240c), o modelo do iOS 26. **O raio de um
 * componente se muda aqui**: ele veste um destes degraus, e quem quer outro
 * raio troca o degrau ou ajusta o degrau em `globals.css` — nunca escreve um
 * número no arquivo do componente. Quem veste cada degrau: contado em
 * `components/ui` e `lib/`, não desejado.
 */
const ESCALA = [
  {
    cls: "rounded-full",
    token: null,
    use: "cápsula: metade da altura — todo controle",
    who: ["Button", "Input", "Select", "Combobox", "DatePicker", "InputGroup", "InputOTP", "SearchInput", "Toggle", "ToggleGroup", "Tabs", "Menubar", "NavigationMenu", "Badge", "TopBar floating", "Calendar (dia)"],
  },
  {
    cls: "rounded-surface",
    token: "--radius-surface",
    use: "superfície: o que contém. O CSS limita o raio à metade do lado, então até 44px de altura já sai cápsula",
    who: ["Card", "Accordion", "Toast", "Table", "EmptyState", "Carousel", "Tabs vertical", "Popover", "DropdownMenu", "Select (lista)", "HoverCard", "Command", "Combobox"],
  },
  {
    cls: "rounded-modal",
    token: "--radius-modal",
    use: "modal: a placa que cobre a tela",
    who: ["Dialog", "AlertDialog", "Sheet", "Drawer", "Sidebar floating", "SplitShell"],
  },
  {
    cls: "rounded-row",
    token: "--radius-row",
    use: "linha: a linha de lista selecionável — retângulo de canto arredondado numa linha de 32 (a cápsula seria 16)",
    who: ["Accordion separated", "Alert sm", "Tooltip md", "SidebarMenuButton", "SidebarMenuSubButton", "ColorTile (md a 2xl)", "Item sm"],
  },
  {
    cls: "rounded-row-lg",
    token: "--radius-row-lg",
    use: "linha alta: a linha selecionável de 44 — retângulo arredondado onde a superfície daria cápsula (22 é a metade)",
    who: ["Item", "DropdownMenu panel", "Alert md", "CardField", "Collapsible card", "Textarea", "InputGroup com bloco", "lista de seleção (Checkbox)", "RadioGroup card", "cartão de escolha (Field)", "FormPickerPopoverItem"],
  },
  {
    cls: "concentric",
    token: null,
    use: "o que está dentro: o raio do contêiner menos o recuo, com mínimo de 6px — acompanha sozinho",
    who: ["item de menu", "item do Select", "item do Command"],
  },
] as const

/** O valor dos degraus como o navegador o resolve agora, em px. */
function useEscalaAoVivo() {
  const [valores, setValores] = React.useState<Record<string, string>>({})
  React.useEffect(() => {
    const raiz = getComputedStyle(document.documentElement)
    const sonda = document.createElement("div")
    document.body.append(sonda)
    const lidos: Record<string, string> = {}
    for (const d of ESCALA) {
      if (!d.token) continue
      sonda.style.borderTopLeftRadius = raiz.getPropertyValue(d.token).trim()
      lidos[d.cls] = getComputedStyle(sonda).borderTopLeftRadius
    }
    sonda.remove()
    setValores(lidos)
  }, [])
  return valores
}

/** A forma fixa pequena: a escada t-shirt, derivada de `--radius` (10px). */
const RADII = [
  { cls: "rounded-xs", calc: "0,2 ×", px: "2px", use: "o menor marcador", who: ["legenda do Chart"] },
  { cls: "rounded-sm", calc: "0,6 ×", px: "6px", use: "a peça miúda dentro de texto", who: ["Checkbox"] },
  { cls: "rounded-md", calc: "0,8 ×", px: "8px", use: "o ladrilho pequeno e a miniatura", who: ["ColorTile xs", "Kbd", "Code chip", "Skeleton", "Carousel thumb"] },
  { cls: "rounded-lg", calc: "1 ×", px: "10px", use: "o ícone do StatCard, a amostra do Toggle e a dica sm", who: ["Tooltip sm", "StatCard icon", "amostra do Toggle"] },
]

const SHADOWS = [
  { cls: "shadow-xs", use: "o controle marcado sobe um fio", who: ["Checkbox", "Radio", "Toggle", "Tabs", "Menubar"] },
  { cls: "shadow-sm", use: "apoiado na página", who: ["Card elevated", "Slider", "ThemeToggle", "Sidebar"] },
  { cls: "shadow-md", use: "flutua sobre o conteúdo, ancorado", who: ["DropdownMenu", "ContextMenu", "Select", "HoverCard", "Card no hover"] },
  { cls: "shadow-lg", use: "cobre a tela", who: ["Dialog", "Sheet", "Drawer", "Combobox", "BottomBar"] },
  { cls: "shadow-xl", use: "o conjunto que para tudo", who: ["CommandDialog"] },
]

/** Três formas de encaixar uma placa numa superfície de 22 com 12px de recuo. */
const ENCAIXES = [
  { rotulo: "22 dentro de 22", inner: "rounded-surface", certo: false, nota: "o canto de dentro engorda" },
  { rotulo: "concentric", inner: "concentric", certo: true, nota: "fora − recuo: 22 − 12 = 10" },
  { rotulo: "full dentro de full", inner: "rounded-full", outer: "rounded-full", certo: true, nota: "a cápsula não faz conta" },
]

export default function ShapeElevationDoc() {
  const aoVivo = useEscalaAoVivo()
  return (
    <>
      <Usage>
        Forma e altura dizem o que a peça é antes do texto dizer. O raio segue o iOS 26: três formas — a cápsula do controle, a superfície, o modal e a linha de raio fixo, e o concêntrico do que está dentro. A sombra é o eixo da altura: quanto mais alto, mais a peça cobre e menos dura na tela.
      </Usage>

      <Group
        title="Raio"
        description="O raio de um componente se muda aqui, e não no componente: ele veste um degrau desta escala, e quem quer outro raio troca o degrau ou ajusta o degrau em globals.css — nunca escreve um número no arquivo do componente. Controle é cápsula, o que contém é superfície ou modal, a linha de lista selecionável é linha, e o que está dentro é concêntrico. A escada t-shirt fica para a forma fixa pequena."
        layout="flow"
      >
        <Spec title="A escala" meta="--radius-surface · --radius-modal · --radius-row · --radius-row-lg" className="mb-0" bodyClassName="flex flex-col gap-4">
          {ESCALA.map((d) => (
            <div key={d.cls} className="flex items-center gap-4">
              <span
                aria-hidden
                className={cn(
                  "shrink-0 border border-border bg-muted",
                  d.cls === "rounded-full" ? "h-10 w-24" : d.cls === "rounded-row" ? "h-8 w-28" : d.cls === "rounded-row-lg" ? "h-11 w-28" : "h-20 w-28",
                  d.cls === "concentric" ? "[--radius-parent:var(--radius-surface)] [--radius-inset:0px]" : null,
                  d.cls
                )}
              />
              <div className="flex min-w-0 flex-col">
                <div className="flex flex-wrap items-baseline gap-x-2">
                  <Code variant="inline">{d.cls}</Code>
                  <span className="nums text-2xs text-muted-foreground">
                    {d.cls === "rounded-full" ? "½ da altura" : d.cls === "concentric" ? "pai − recuo" : (aoVivo[d.cls] ?? "…")}
                  </span>
                </div>
                <span className="text-xs text-muted-foreground">{d.use}</span>
                <div className="mt-1.5 flex flex-wrap gap-1">
                  {d.who.map((w) => (
                    <Code key={w}>{w}</Code>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </Spec>
        <Spec title="A forma fixa pequena" meta="--radius: 0.625rem" className="mb-0" bodyClassName="flex flex-col gap-4">
          {RADII.map((r) => (
            <div key={r.cls} className="flex items-center gap-4">
              <span aria-hidden className={cn("size-10 shrink-0 border border-border bg-muted", r.cls)} />
              <div className="flex min-w-0 flex-col">
                <div className="flex flex-wrap items-baseline gap-x-2">
                  <Code variant="inline">{r.cls}</Code>
                  <span className="nums text-2xs text-muted-foreground">
                    {r.calc} · {r.px}
                  </span>
                </div>
                <span className="text-xs text-muted-foreground">{r.use}</span>
                <div className="mt-1.5 flex flex-wrap gap-1">
                  {r.who.map((w) => (
                    <Code key={w}>{w}</Code>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </Spec>
      </Group>

      <DocSection
        title="Raio concêntrico"
        description="Uma placa dentro de outra tem o raio de fora menos o recuo, senão os dois arcos não correm paralelos. A utility concentric faz a conta: quem contém publica --radius-parent e --radius-inset, e o de dentro lê. Numa linha baixa a conta passa da metade da altura e o item sai cápsula — o realce do menu do iOS. Com rounded-full a conta some."
        previewClassName="flex-wrap items-start gap-8"
      >
        {ENCAIXES.map((e) => (
          <div key={e.rotulo} className="flex flex-col items-center gap-2">
            <div
              className={cn(
                "flex w-40 border border-border bg-muted",
                e.outer === "rounded-full"
                  ? "h-16 rounded-full p-3"
                  : "h-28 rounded-surface p-3 [--radius-parent:var(--radius-surface)] [--radius-inset:--spacing(3)]"
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
                className={cn("h-16 w-24 shrink-0 rounded-surface bg-card", s.cls)}
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

      <DocNote title="Por que não o squircle">
        O canto do iOS é contínuo — a curvatura cresce devagar, sem o degrau do arco de círculo. O CSS tem isso em <code>corner-shape: superellipse()</code>, mas só o Chrome e o Edge desenham: Safari e iOS não. Justamente no iPhone ele não apareceria, então a rodada 240 ficou só no raio. O passo futuro é um <code>@supports</code> com o raio compensado em cerca de 1,5× (o squircle lê menos redondo), sem tocar cápsula nem círculo.
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
