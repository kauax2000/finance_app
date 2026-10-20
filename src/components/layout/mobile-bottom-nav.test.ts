import { describe, expect, it } from "vitest"
import { lerFonte, semComentarios } from "@/test/fonte"
import { quemSai } from "@/lib/overflow"

const NAV = semComentarios(lerFonte("src/components/layout/mobile-bottom-nav.tsx"))

/** Rodada 342: a aba que não cabe com folga sai, do fim para o começo; desde a 346 ela aparece na página Você. */
describe("abas que não cabem vão para a página Você", () => {
  it("a régua: o nome + 16, piso de 44, pela regra do quemSai, do fim, com a primeira e a Você fixas", () => {
    expect(NAV).toContain("const FOLGA_DO_ROTULO = 16")
    expect(NAV).toContain("const PISO_DA_ABA = 44")
    expect(NAV).toContain('ponta: "fim",')
    expect(NAV).toContain("fixos: new Set([0, ordem.length - 1])")
    // O nome é medido no canvas, nunca guardado da primeira pintura: no app
    // instalado do iOS ela vinha antes do CSS, e a aba que saía não voltava.
    expect(NAV).toContain("contexto.measureText(nome).width + FOLGA_DO_ROTULO")
    expect(NAV).not.toContain("new Map")
  })

  it("a última aba é Você: o avatar, a página /me, e quem saiu é publicado para ela", () => {
    expect(NAV).toContain('href={ROUTES.ME}')
    expect(NAV).toContain('label="Você"')
    expect(NAV).toContain('media={<VoceAvatar size="xs" />}')
    expect(NAV).toContain("isVoceTabActive(pathname,")
    expect(NAV).toContain("publicarAbasFora(")
    expect(NAV).not.toContain("MobileAccountMenu")
    expect(NAV).not.toContain("BottomBarSlot")
  })

  it("sem caixa (desktop, md:hidden) ninguém sai, e desmontar limpa a lista", () => {
    const medir = NAV.slice(NAV.indexOf("const medir = () => {"), NAV.indexOf("quemSai(larguras"))
    expect(medir).toMatch(/if \(pilula\.clientWidth === 0\) \{\s*setSaem\(0\)\s*return\s*\}/)
    expect(NAV).toContain("React.useEffect(() => () => publicarAbasFora([]), [])")
  })

  it("o avatar não espera em esqueleto", () => {
    const AVATAR = semComentarios(lerFonte("src/components/layout/voce-avatar.tsx"))
    expect(AVATAR).not.toContain("Skeleton")
    expect(AVATAR).toContain("identityToneFor")
  })

  it("num telefone de 320 sai só Categorias; de 375, ninguém", () => {
    // Painel, Transações, Categorias e Você medidos na barra (nome + 16, piso 44).
    const larguras = [52, 76, 74, 44]
    const opcoes = { ponta: "fim" as const, fixos: new Set([0, 3]), reserva: 0, gap: 2 }
    expect(quemSai(larguras, 204, opcoes)).toEqual([2])
    expect(quemSai(larguras, 255, opcoes)).toEqual([])
  })
})
