import { readdirSync, statSync } from "node:fs"
import { join } from "node:path"
import { describe, expect, it } from "vitest"
import { lerFonte } from "@/test/fonte"

/** A placa flutuante de vidro, os helpers novos e o app. */

const LIB = lerFonte("src/lib/toast.ts")
const PARTES = lerFonte("src/lib/toast-parts.tsx")
const TOASTER = lerFonte("src/components/ui/sonner.tsx")
const CSS = lerFonte("src/app/globals.css")
const BLOCO = CSS.slice(
  CSS.indexOf("/* ─── O toast: a placa flutuante"),
  CSS.indexOf("/* ── A dissolução das bordas de uma região rolável")
)

function arquivos(dir: string): string[] {
  return readdirSync(dir).flatMap((nome) => {
    const caminho = join(dir, nome)
    return statSync(caminho).isDirectory() ? arquivos(caminho) : [caminho]
  })
}

describe("a placa flutuante", () => {
  it("é a placa da casa: --popover, o anel de 1px, a sombra e o raio da superfície", () => {
    expect(BLOCO.length).toBeGreaterThan(2000)
    // A tinta de vidro dos flutuantes: 85% com borrão, 60% no escuro, e
    // chapada com transparência reduzida ou sem `backdrop-filter`.
    expect(BLOCO).toContain("--normal-bg: color-mix(in oklab, var(--popover) 85%, transparent);")
    expect(BLOCO).toContain("backdrop-filter: blur(24px) saturate(1.5);")
    expect(BLOCO).toContain("--normal-bg: color-mix(in oklab, var(--popover) 60%, transparent);")
    expect(BLOCO).toMatch(/prefers-reduced-transparency: reduce\)[\s\S]*?--normal-bg: var\(--popover\);/)
    expect(BLOCO).toContain("0 0 0 1px color-mix(in oklab, var(--foreground) 10%, transparent)")
    expect(BLOCO).toContain("border-radius: var(--radius-surface);")
  })

  it("o tom mora no poço do ícone, e nunca pinta a superfície", () => {
    for (const [tipo, tom] of [["success", "success"], ["info", "info"], ["warning", "warning"], ["error", "destructive"]]) {
      expect(BLOCO).toContain(`[data-type="${tipo}"] {\n  --toast-well: var(--${tom}-muted);`)
    }
    // Nenhum tipo troca o fundo da placa: o `--normal-bg` só é escrito pela
    // placa e pelos guardas de tema e transparência.
    expect(BLOCO).not.toMatch(/\[data-type="[a-z]+"\] \{\n  --normal-bg/)
    expect(BLOCO).toContain("background: var(--toast-well);")
  })

  it("entra e anda na mola, e sai sem ela", () => {
    expect(BLOCO).toContain("transform var(--duration-spring) var(--ease-spring)")
    expect(BLOCO).toMatch(/\[data-removed="true"\] \{\n  transition:\n    transform 200ms var\(--ease-out\)/)
  })
})

describe("o Desfazer", () => {
  it("sem barra de tempo; a contagem é a roda do Desfazer, que para quando o sonner para", () => {
    expect(PARTES).not.toContain("toast-timer")
    expect(BLOCO).not.toContain("toast-timer")
    expect(BLOCO).toContain("@property --toast-left {")
    expect(BLOCO).toContain("currentColor calc(var(--toast-left) * 1turn)")
    expect(BLOCO).toContain('[data-sonner-toast][data-expanded="true"],\n:root[data-toast-paused]')
    expect(TOASTER).toContain('toggleAttribute("data-toast-paused", document.hidden)')
    expect(LIB).toContain('className: "toast-undo"')
  })

  it("o botão sozinho cresce à linha inteira quando a quebra o leva para baixo", () => {
    expect(BLOCO).toContain("flex: 9999 1 auto;")
    expect(BLOCO).toContain("margin-inline: auto 0;\n  flex: 1 0 auto;")
  })

  it("o relógio recomeça quando a bolha volta: a fase alterna a duração", () => {
    expect(LIB).toContain("duration: temporizado ? duracao + fase : duracao")
  })

  it("o Desfazer troca a mesma bolha pelo resultado, sem empilhar", () => {
    expect(LIB).toContain("event.preventDefault()")
    expect(LIB).toContain('sonnerToast.loading(titulo("Desfazendo…"')
    expect(LIB).toContain("() => toastSuccess(feito, { id })")
  })
})

describe("os helpers", () => {
  it("repetidos viram ×N, e o assunto (id) substitui", () => {
    expect(LIB).toContain("const repete = anterior && ativo(anterior.id) && !opts.id")
    expect(PARTES).toContain('data-slot="toast-count"')
    // O ×N não quebra em duas linhas ao lado de um título longo.
    expect(BLOCO).toMatch(/\[data-slot="toast-count"\] \{[\s\S]*?flex-shrink: 0;\n  white-space: nowrap;/)
  })

  it("o Ver navega pelo roteador que o Toaster registra", () => {
    expect(LIB).toContain('"href" in a ? () => irPara(a.href) : a.onClick')
    expect(TOASTER).toContain("registrarNavegacaoDoToast((href) => router.push(href))")
  })

  it("erro interrompe o leitor de tela", () => {
    expect(PARTES).toContain('role={tipo === "error" ? "alert" : undefined}')
  })

  it("a pílula fica no canto dos outros avisos, sem ×, por dois segundos", () => {
    expect(LIB).not.toContain('position: "top-center"')
    expect(BLOCO).toContain(".toast-pill {\n  width: fit-content;\n  margin-inline: auto 0;")
    expect(LIB).toContain("export const TOAST_PILL_MS = 2000")
  })
})

describe("as duas ações", () => {
  it("vão juntas para a linha de baixo, dividindo a largura, e a segunda não sai cinza", () => {
    expect(BLOCO).toContain(':has([data-cancel]) [data-content] {\n  flex-basis: calc(100% - 40px);')
    expect(BLOCO).toContain(':has([data-cancel]) [data-button] {\n  flex: 1 1 0;')
    expect(BLOCO).toContain('[data-sonner-toaster][data-sonner-theme] [data-sonner-toast][data-styled="true"] [data-button][data-cancel] {')
  })
})

describe("o ×", () => {
  it("flutua fora do corpo, à esquerda e alinhado ao topo; no telefone volta ao canto", () => {
    expect(BLOCO).toContain("right: calc(100% + 8px);")
    expect(BLOCO).toContain("top: -1px;\n  transform: none;")
    expect(BLOCO).toMatch(/@media \(max-width: 600px\) \{[\s\S]*?transform: translate\(-35%, -35%\);/)
    // Visível sobre qualquer conteúdo: chapado, um degrau acima da placa.
    expect(BLOCO).toContain("width: 28px;\n  height: 28px;\n  background: var(--secondary);\n  color: var(--secondary-foreground);")
  })
})

describe("o lugar da pilha", () => {
  it("abaixo da barra do topo, pela variável — e não por cima dela", () => {
    expect(TOASTER).toContain('top: "max(calc(var(--top-bar-bottom) + 12px), 1rem)"')
    expect(TOASTER).toContain('top: "calc(max(var(--top-bar-bottom), env(safe-area-inset-top, 0px)) + 12px)"')
  })
})

describe("o Toaster", () => {
  it("pausa com o foco e fecha com Esc", () => {
    expect(TOASTER).toContain('new MouseEvent("mousemove", { bubbles: true })')
    expect(TOASTER).toContain('if (e.key !== "Escape") return')
    expect(TOASTER).toContain("visibleToasts={3}")
  })
})

describe("o app", () => {
  it("nenhuma tela importa o toast do sonner", () => {
    const fora = arquivos(join(process.cwd(), "src"))
      .filter((f) => /\.(ts|tsx)$/.test(f) && !f.endsWith(".test.ts"))
      .filter((f) => !/src\/lib\/toast\.ts$|src\/components\/ui\/sonner\.tsx$/.test(f))
      .filter((f) => /from "sonner"/.test(lerFonte(f)))
    expect(fora).toEqual([])
  })
})
