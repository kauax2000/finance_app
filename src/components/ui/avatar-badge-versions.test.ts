import { createElement as h } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"

import { lerFonte } from "@/test/fonte"

import { Avatar, AvatarFallback } from "./avatar"

/** O canto do `Avatar` (rodada 362): fora do recorte, o anel da superfície, e a foto que edita. */

const avatar = (props: Record<string, unknown> = {}) =>
  renderToStaticMarkup(h(Avatar, props as never, h(AvatarFallback, null, "KL")))

const classeDo = (html: string, slot: string) => {
  const tag = html.match(new RegExp(`<[^>]*data-slot="${slot}"[^>]*>`))?.[0] ?? ""
  return (tag.match(/class="([^"]*)"/)?.[1] ?? "").replaceAll("&amp;", "&")
}

describe("Avatar — o canto", () => {
  it("sem badge nem onEdit não há invólucro: a raiz é o avatar de sempre", () => {
    const html = avatar({ className: "x-pos" })
    expect(html).not.toContain("avatar-frame")
    expect(html).not.toContain("avatar-badge")
    expect(classeDo(html, "avatar")).toContain("x-pos")
  })

  it("o canto é irmão da raiz, fora do recorte, num invólucro relative que leva o className", () => {
    const html = avatar({ badge: h("svg"), className: "x-pos" })
    expect(html).toMatch(/<span[^>]*data-slot="avatar-frame"/)
    expect(classeDo(html, "avatar-frame")).toMatch(/(^|\s)relative(\s|$)/)
    expect(classeDo(html, "avatar-frame")).toContain("x-pos")
    expect(classeDo(html, "avatar")).not.toContain("x-pos")
    expect(html).toMatch(/data-slot="avatar"[^>]*>.*<\/span><span[^>]*data-slot="avatar-badge"/)
  })

  it("o canto é decorativo e recorta a foto com o anel da superfície", () => {
    const c = classeDo(avatar({ badge: h("svg") }), "avatar-badge")
    expect(avatar({ badge: h("svg") })).toMatch(/data-slot="avatar-badge"[^>]*aria-hidden="true"|aria-hidden="true"[^>]*data-slot="avatar-badge"/)
    expect(c).toContain("ring-(--avatar-badge-ring,var(--background))")
    expect(c).toContain("pointer-events-none")
  })

  it("o corpo do canto segue a escala do avatar", () => {
    expect(classeDo(avatar({ badge: h("svg"), size: "xl" }), "avatar-badge")).toMatch(/(^|\s)size-6(\s|$)/)
    expect(classeDo(avatar({ badge: h("svg"), size: "xs" }), "avatar-badge")).toMatch(/(^|\s)size-3(\s|$)/)
  })

  it("onEdit faz da foto o botão, com o nome e o lápis, e o realce chega ao canto no cursor e no toque", () => {
    const html = avatar({ onEdit: () => {}, editLabel: "Editar perfil" })
    expect(html).toMatch(/<button[^>]*type="button"[^>]*data-slot="avatar-frame"[^>]*aria-label="Editar perfil"/)
    expect(html).toContain('data-slot="avatar-badge"')
    expect(html).toMatch(/avatar-badge[^>]*><svg/)
    const c = classeDo(html, "avatar-frame")
    expect(c).toContain("hover:[&_[data-slot=avatar-badge]]:bg-secondary-hover")
    expect(c).toContain("active:[&_[data-slot=avatar-badge]]:bg-secondary-hover")
    expect(c).toContain("focus-visible:ring-3")
  })

  it("editLabel tem um padrão", () => {
    expect(avatar({ onEdit: () => {} })).toContain('aria-label="Editar foto"')
  })

  it("o 2xs é o círculo de 16px, sem canto nem edição", () => {
    const html = avatar({ size: "2xs", badge: h("svg"), onEdit: () => {} })
    expect(html).toContain('data-size="2xs"')
    expect(classeDo(html, "avatar")).toMatch(/(^|\s)size-4(\s|$)/)
    expect(html).not.toContain("avatar-badge")
    expect(html).not.toContain("avatar-frame")
    expect(html).not.toContain("<button")
  })

  it("a fonte declara o degrau 2xs de 16px", () => {
    expect(lerFonte("src/components/ui/avatar.tsx")).toContain('"2xs": "size-4')
  })
})
