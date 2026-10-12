import { describe, expect, it } from "vitest"
import { arquivosTsx, lerFonte, semComentarios } from "@/test/fonte"

const fonte = (c: string) => semComentarios(lerFonte(c), "linha-inteira")

const FORMULARIOS = [
  "src/components/login-form.tsx",
  "src/components/signup-form.tsx",
  "src/components/password-recovery-form.tsx",
  "src/app/(auth)/invites/accept/page-client.tsx",
]

const PAGINAS = [
  "src/app/(auth)/login/page.tsx",
  "src/app/(auth)/register/page.tsx",
  "src/app/(auth)/forgot-password/page.tsx",
  "src/app/(auth)/reset-password/page.tsx",
  "src/app/(auth)/invites/accept/page.tsx",
]

describe("o casco das telas de acesso", () => {
  it("no telefone, só o wordmark — e quem decide é o frame do layout", () => {
    expect(fonte("src/components/layout/auth-frame.tsx")).toContain('asideMobile="logo"')
    expect(fonte("src/components/layout/auth-shell.tsx")).not.toContain("asideMobile")
  })

  it("o painel desenha a cena que recebe, e não uma fixa", () => {
    const painel = fonte("src/components/layout/auth-brand-panel.tsx")
    expect(painel).toContain("{children}")
    expect(painel).not.toContain("const SALDO")
  })

  it("as cenas só compõem o design system: nenhuma cor crua", () => {
    for (const arq of arquivosTsx("src/components/auth/scenes")) {
      expect(fonte(arq)).not.toMatch(/#[0-9a-f]{3,8}\b|rgb\(|oklch\(|(?:text|bg)-(?:gray|zinc|slate|neutral|green|red)-\d/)
    }
  })
})

describe("a continuidade entre rotas", () => {
  it("o layout de (auth) monta o frame, e o frame não lê a query", () => {
    expect(fonte("src/app/(auth)/layout.tsx")).toContain("<AuthFrame>")
    const frame = fonte("src/components/layout/auth-frame.tsx")
    expect(frame).toContain("<SplitShellRoot")
    expect(frame).toContain("defaultSceneFor(")
    expect(frame).not.toContain("useSearchParams")
  })

  it("o AuthShell é só a coluna: o pé depois do conteúdo, nunca no slot do Main", () => {
    const shell = fonte("src/components/layout/auth-shell.tsx")
    expect(shell).toContain("<SplitShellMain")
    expect(shell).not.toContain("<SplitShellRoot")
    expect(shell).not.toMatch(/<SplitShell[\s>]/)
    expect(shell).toContain("useAuthScene(scene)")
    expect(shell).not.toMatch(/\sfooter=/)
    const corpo = shell.slice(shell.indexOf("<SplitShellMain"))
    expect(corpo.indexOf("{footer}")).toBeGreaterThan(corpo.indexOf("children"))
  })

  it("a tela de status não existe mais como componente à parte", () => {
    for (const arq of arquivosTsx("src")) {
      const s = fonte(arq)
      expect(s, arq).not.toContain("<AuthStatus")
      expect(s, arq).not.toContain("auth-status")
    }
  })

  it("todo retorno dos formulários é um AuthShell com o id da cena", () => {
    for (const arq of FORMULARIOS) {
      const s = fonte(arq)
      const raizes = [...s.matchAll(/return \(\s*<([A-Za-z.]+)/g)].map((m) => m[1])
      expect(raizes.length, arq).toBeGreaterThan(0)
      expect(new Set(raizes), arq).toEqual(new Set(["AuthShell"]))
      const shells = s.match(/<AuthShell\b/g)?.length ?? 0
      const comCena = s.match(/<AuthShell\s+scene=["{]/g)?.length ?? 0
      expect(comCena, arq).toBe(shells)
    }
  })

  it("os fallbacks das páginas vestem a coluna com o id, sem cena desenhada", () => {
    for (const arq of PAGINAS) {
      const s = fonte(arq)
      expect(s, arq).toMatch(/<AuthShell\s+scene="/)
      expect(s, arq).not.toContain("components/auth/scenes")
    }
  })

  it("o login muda de passo com o motivo, para o foco ir ao título", () => {
    expect(fonte("src/components/login-form.tsx")).toContain('step={reason ?? "default"}')
  })

  it("o cadastro só promete o convite quando o next é de convite", () => {
    const s = fonte("src/components/signup-form.tsx")
    expect(s).toContain('startsWith("/invites/accept")')
    expect(s).toContain('"register.confirm-invite"')
  })
})
