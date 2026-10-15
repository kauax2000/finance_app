"use client"

import * as React from "react"

import { Button } from "@/components/ui/button"
import { Code } from "@/components/ui/code"
import { cn } from "@/lib/utils"
import { DocNote, DocSection, Usage } from "../ds-doc"
import { Group, Spec } from "../ds-kit"

/**
 * A escala em ordem de duração. Os consumidores são os que declaram o token
 * hoje (`grep "--duration-"`), não os que deveriam.
 */
const DURATIONS = [
  { token: "--duration-instant", ms: 100, use: "o menu que abre sob o cursor", who: ["DropdownMenu", "Select", "Popover", "HoverCard", "NavigationMenu"] },
  { token: "--duration-fast", ms: 150, use: "hover, foco, troca de cor", who: ["Tabs", "Radio", "Slider", "Card", "Command", "BottomBar"] },
  { token: "--duration-base", ms: 200, use: "abrir, expandir, girar um marcador", who: ["Collapsible", "Accordion", "Tabs", "Sidebar", "Chart"] },
  { token: "--duration-slow", ms: 300, use: "folha subindo, diálogo, troca de dado", who: ["Sheet", "Dialog", "AlertDialog", "Progress", "ThemeToggle", "TopBar"] },
  { token: "--duration-spring", ms: 500, use: "a mola — a duração é consequência do trajeto", who: ["Accordion", "Collapsible", "EmptyState", "Carousel", "Chart", "CommandDialog"] },
]

const EASINGS = [
  { token: "--ease-out", use: "entra rápido e assenta devagar — o padrão", who: ["o resto do sistema"] },
  { token: "--ease-emphasized", use: "a curva das folhas, com peso de iOS", who: ["Sheet", "Sidebar", "TopBar", "ThemeToggle", "Button"] },
  { token: "--ease-spring", use: "passa 3,8% do alvo e volta", who: ["Accordion", "Collapsible", "Chart", "EmptyState", "Carousel", "CommandDialog"] },
]

/** Os pares que o sistema usa de verdade, do mais curto ao mais longo. */
const PARES = [
  { label: "Hover", duration: "--duration-fast", ease: "--ease-out", cls: "duration-(--duration-fast) ease-(--ease-out)" },
  { label: "Popover", duration: "--duration-base", ease: "--ease-out", cls: "duration-(--duration-base) ease-(--ease-out)" },
  { label: "Folha", duration: "--duration-slow", ease: "--ease-emphasized", cls: "duration-(--duration-slow) ease-(--ease-emphasized)" },
  { label: "Divulgação", duration: "--duration-spring", ease: "--ease-spring", cls: "duration-(--duration-spring) ease-(--ease-spring)" },
]

/**
 * Lê as curvas do `globals.css` em vez de copiar os números: o desenho sai da
 * mesma fonte que a animação, e não desatualiza quando alguém ajustar a mola.
 */
function lerCurva(valor: string): number[][] {
  const n = (valor.match(/-?\d*\.?\d+/g) ?? []).map(Number)
  if (valor.startsWith("cubic-bezier") && n.length === 4) {
    const [x1, y1, x2, y2] = n
    return Array.from({ length: 41 }, (_, i) => {
      const t = i / 40
      const b = (a: number, c: number) =>
        3 * (1 - t) ** 2 * t * a + 3 * (1 - t) * t ** 2 * c + t ** 3
      return [b(x1, x2), b(y1, y2)]
    })
  }
  return n.map((v, i) => [i / (n.length - 1), v])
}

// O teto é 1,1 para a volta da mola caber sem cortar.
const traco = (pontos: number[][]) =>
  pontos
    .map(([x, y], i) => `${i ? "L" : "M"}${(4 + x * 112).toFixed(1)},${(66 - y * 52).toFixed(1)}`)
    .join(" ")

export default function MotionDoc() {
  const [on, setOn] = React.useState(false)
  const [curvas, setCurvas] = React.useState<Record<string, string>>({})

  React.useEffect(() => {
    const css = getComputedStyle(document.documentElement)
    setCurvas(
      Object.fromEntries(
        EASINGS.map((e) => [e.token, css.getPropertyValue(e.token).replace(/\s+/g, " ").trim()])
      )
    )
  }, [])

  return (
    <>
      <Usage>
        Movimento explica uma mudança de estado: de onde a folha veio, o que acabou de aparecer. Se a animação não responde a isso, é decoração e custa quadros. São cinco durações e três curvas, e quase tudo no sistema é um de quatro pares.
      </Usage>

      <Group title="Os tokens" layout="flow">
        <Spec title="Durações" meta="globals.css" bodyClassName="flex flex-col gap-4">
          {DURATIONS.map((d) => (
            <div key={d.token} className="grid grid-cols-[3rem_minmax(0,1fr)] gap-x-3">
              <span className="nums text-right text-sm font-medium text-foreground">
                {d.ms}
                <span className="text-2xs font-normal text-muted-foreground">ms</span>
              </span>
              <div className="flex min-w-0 flex-col">
                <div className="flex items-center gap-3">
                  <Code variant="inline" className="w-36 shrink-0">{d.token}</Code>
                  <span className="h-1.5 flex-1 rounded-full bg-muted">
                    <span
                      className="block h-full rounded-full bg-foreground/70"
                      style={{ width: `${(d.ms / 500) * 100}%` }}
                    />
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

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {EASINGS.map((e) => (
            <Spec key={e.token} title={e.token} className="mb-0">
              <svg
                viewBox="0 0 120 72"
                className="h-auto w-full overflow-visible"
                aria-hidden
              >
                <line x1="4" x2="116" y1="14" y2="14" className="stroke-border" strokeDasharray="2 2" />
                <line x1="4" x2="116" y1="66" y2="66" className="stroke-border" />
                {curvas[e.token] ? (
                  <path
                    d={traco(lerCurva(curvas[e.token]))}
                    className="fill-none stroke-foreground"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                ) : null}
              </svg>
              <p className="mt-3 text-xs text-muted-foreground">{e.use}</p>
              <Code variant="inline" className="mt-1 block truncate text-2xs text-muted-foreground">
                {curvas[e.token]?.startsWith("linear")
                  ? `linear(${lerCurva(curvas[e.token]).length} pontos)`
                  : curvas[e.token]}
              </Code>
              <div className="mt-2 flex flex-wrap gap-1">
                {e.who.map((w) => (
                  <Code key={w}>{w}</Code>
                ))}
              </div>
            </Spec>
          ))}
        </div>
      </Group>

      <DocSection
        title="Os quatro pares"
        description={
          <>
            Duração e curva andam juntas, e estes são os pares que o sistema usa — lado a lado, a mola é a única que passa do fim e volta. O Tailwind v4 lê a variável direto (<code>duration-(--duration-base)</code>); não invente um número em milissegundos. A classe <code>ease-out</code> já entrega <code>--ease-out</code>, porque o token sobrescreve a curva do tema de propósito.
          </>
        }
        code={`// CSS: duração e curva do mesmo par
<div className="transition-transform duration-(--duration-slow) ease-(--ease-emphasized)" />

// JS: a mesma mola, para o que o CSS não anima
import { MOLA } from "@/lib/spring"
animate(el, { height: "auto" }, MOLA)`}
        previewClassName="flex-col items-stretch gap-4"
      >
        <Button
          type="button"
          variant="outline"
          className="self-start"
          onClick={() => setOn((v) => !v)}
        >
          {on ? "voltar" : "tocar"}
        </Button>
        <div className="flex flex-col gap-3">
          {PARES.map((p) => (
            <div key={p.label} className="grid grid-cols-[9rem_minmax(0,1fr)] items-center gap-3 max-sm:grid-cols-1 max-sm:gap-1">
              <div className="flex flex-col">
                <span className="text-xs font-medium text-foreground">{p.label}</span>
                <span className="font-mono text-2xs text-muted-foreground">
                  {p.duration.replace("--duration-", "")} · {p.ease.replace("--ease-", "")}
                </span>
              </div>
              <div className="relative h-8 rounded-full bg-muted/60">
                <span
                  className={cn(
                    "absolute top-1 left-1 size-6 rounded-full bg-primary transition-[left]",
                    p.cls,
                    on && "left-[calc(100%-1.75rem)]"
                  )}
                />
              </div>
            </div>
          ))}
        </div>
      </DocSection>

      <DocNote title="O que se sobrepõe à tela tem um gesto por peça">
        Desde a rodada 248, cada superfície flutuante se move de um jeito que diz o que ela é, e não com o zoom genérico de 95% do shadcn. Entrar é mola; sair é curva e volta ao gatilho. O <code>DropdownMenu</code> e os submenus <strong>brotam do botão</strong> (ou do item), com as linhas em cascata; o <code>ContextMenu</code> <strong>abre do cursor</strong>; o <code>Select</code>, o <code>Combobox</code> e o seletor do <code>Form</code> <strong>desdobram do campo</strong>, o gesto do calendário do <code>DatePicker</code>; o <code>Popover</code> é <strong>a placa do tour</strong>; o <code>HoverCard</code> <strong>se desvela</strong>, sem pulo, e dissolve no lugar; o <code>Tooltip</code> <strong>estala</strong>; o <code>Dialog</code> e o <code>AlertDialog</code> <strong>crescem do próprio centro</strong>, onde moram; o <code>Sheet</code> desliza da borda inteira. As utilities moram no <code>globals.css</code> (<code>menu-sprout</code>, <code>context-menu-burst</code>, <code>field-bloom</code>, <code>popover-sprout</code>, <code>hover-card-unveil</code>, <code>dialog-sprout</code>, <code>overlay-cascade</code>) e animam <code>transform</code>, nunca <code>translate</code> e <code>scale</code> soltos: o <code>Select</code> desloca o popper com <code>translate-y-1</code> e o <code>Dialog</code> se centra com <code>translate</code>.
      </DocNote>

      <DocNote title="A mola vem com a própria duração">
        <code>--ease-spring</code> só anda com <code>--duration-spring</code>. Uma mola não tem duração, tem rigidez — os 500ms são o tempo que o trajeto leva para assentar. Com outra duração, a volta fica comprimida ou arrastada, e deixa de ser a mesma mola. No JS ela é <code>MOLA</code>, em <code>lib/spring.ts</code> — rigidez 300, amortecimento 25 —, e <code>--ease-spring</code> é essa mesma mola amostrada num <code>linear()</code>.
      </DocNote>

      <DocNote title="Fechar é curva, não mola">
        Uma mola até zero passa por baixo de zero, e numa altura isso corta o conteúdo seco no meio do trajeto. A divulgação abre na mola e fecha em <code>--ease-out</code>.
      </DocNote>

      <DocNote title="Movimento reduzido preserva o que é estado">
        O bloco global encurta transições e desliga animações de uma passada, mas preserva as que se repetem — <code>animate-spin</code>, <code>animate-pulse</code>. Elas dizem &ldquo;está carregando&rdquo;, e um spinner congelado não informa nada. Duas coisas escapam do bloco: o <code>transition-delay</code>, que ele não zera (quem escalona zera à mão com <code>motion-reduce:[transition-delay:0ms]</code>), e todo tween de JS, que pergunta por <code>matchMedia</code>.
      </DocNote>
    </>
  )
}
