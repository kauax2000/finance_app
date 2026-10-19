import { createElement as h } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"
import { lerFonte } from "@/test/fonte"

import { DialogFooter, DialogHeader, DialogMedia, DialogSteps } from "./dialog"

/** As versões do `Dialog`. */

const CODIGO = lerFonte("src/components/ui/dialog.tsx")

describe("as versões do Dialog", () => {
  it("a altura anda na mola quando o conteúdo muda, e o ref de quem chama continua valendo", () => {
    expect(CODIGO).toContain("const alturaAnimada = useAlturaAnimada<HTMLDivElement>()")
    expect(CODIGO).toContain("const placaRef = useComposedRefs(ref, alturaAnimada)")
    expect(CODIGO).toMatch(/<DialogPrimitive\.Content\s+ref=\{placaRef\}/)
    const gancho = lerFonte("src/hooks/use-altura-animada.ts")
    expect(gancho).toContain('"height var(--duration-spring) var(--ease-spring)"')
    expect(gancho).toContain('"(prefers-reduced-motion: reduce)"')
    // A altura volta a ser do conteúdo no fim da viagem.
    expect(gancho).toMatch(/transitionend[\s\S]*transitioncancel/)
  })

  it("todo pedido de fechar passa pela trava: salvando não fecha, alterado pergunta", () => {
    expect(CODIGO).toMatch(/const pedir = \(proximo: boolean\) => \{\s*if \(proximo\) return mudar\(true\)\s*if \(pending\) \{\s*destino\.current = null\s*return\s*\}\s*if \(dirty && confirmDiscard\) \{/)
    // A raiz entrega `pedir`, e não o `onOpenChange` cru, aos dois ramos.
    expect(CODIGO.match(/onOpenChange=\{pedir\}/g)?.length).toBe(2)
    // Fechar, o × e o Cancelar do rodapé ficam desabilitados enquanto salva.
    expect(CODIGO).toContain("disabled={pending || disabled}")
    expect(CODIGO).toContain("disabled={pending || props.disabled}")
  })

  it("no telefone, com surface auto, o conteúdo é a gaveta do Sheet", () => {
    expect(CODIGO).toContain('const gaveta = surface === "auto" && isMobile')
    expect(CODIGO).toMatch(/if \(gaveta\) \{\s*return \(\s*<SheetContent\s*ref=\{ref\}\s*onClickCapture=\{onClickCapture\}\s*fillMobileViewport=\{layout === "fixed" \|\| size === "full"\}/)
  })

  it("a pergunta de descartar não importa o AlertDialog da casa — ele importa este arquivo", () => {
    expect(CODIGO).not.toMatch(/from "@\/components\/ui\/alert-dialog"/)
    expect(CODIGO).toContain("AlertDialog as AlertDialogPrimitive")
    expect(CODIGO).toContain('"z-(--z-sheet)"')
  })

  it("título sobre descrição não tem gap: quem separa é a entrelinha", () => {
    const html = renderToStaticMarkup(h(DialogHeader, null, "x"))
    expect(html).not.toMatch(/class="[^"]*\bgap-2\b/)
    expect(CODIGO).toContain("leading-snug font-medium text-balance")
    expect(CODIGO).not.toContain("text-base leading-none font-medium")
  })

  it("o ícone vai na linha do título, e os passos desviam do ×", () => {
    expect(renderToStaticMarkup(h(DialogMedia, null, h("svg")))).toContain('data-slot="dialog-media"')
    const passos = renderToStaticMarkup(h(DialogSteps, { current: 1, total: 3, labels: ["A", "B", "C"] }))
    expect(passos).toContain("Passo 2 de 3 · B")
    expect(passos).toContain("pe-[max(0px,calc(var(--dialog-close)-var(--dialog-px)))]")
    // Com passos, o `fixed` ocupa o teto e não pula de um passo para outro.
    expect(CODIGO).toContain("has-[[data-slot=dialog-steps]]:h-(--dialog-max-h)")
  })

  it("start encosta uma ação à esquerda, e vem antes no DOM — embaixo no telefone", () => {
    const html = renderToStaticMarkup(h(DialogFooter, { start: h("b", null, "voltar") }, h("i", null, "ok")))
    expect(html.indexOf("dialog-footer-start")).toBeLessThan(html.indexOf("<i>"))
    expect(html).toContain("sm:me-auto")
  })

  it("no dedo, os botões do rodapé sobem ao piso de 40", () => {
    expect(CODIGO).toContain('"pointer-coarse:[&_button]:min-h-10"')
  })

  it("as telas não trocam mais Dialog por Sheet à mão", () => {
    for (const arquivo of [
      "src/app/(app)/credit-cards/[cardId]/page-client.tsx",
      "src/app/(app)/credit-cards/page-client.tsx",
      "src/app/(app)/categories/page-client.tsx",
      "src/components/settings/workspace-appearance-edit-dialog.tsx",
      "src/components/credit-cards/credit-card-create-dialog.tsx",
      "src/components/security/ChangePasswordDialog.tsx",
      "src/components/security/DeleteAccountDialog.tsx",
      "src/components/workspace/project-form-dialog.tsx",
      "src/components/members/workspace-invite-dialog.tsx",
      "src/components/account/edit-profile-dialog.tsx",
      "src/components/transactions/transaction-form-dialog.tsx",
      "src/components/subscriptions/subscription-form-dialog.tsx",
      "src/components/bills/bill-form-dialog.tsx",
      "src/components/bills/pay-bill-dialog.tsx",
      "src/components/categories/category-create-dialog.tsx",
      "src/components/categories/detail/category-detail-dialogs.tsx",
      "src/components/categories/categories-onboarding-wizard.tsx",
    ]) {
      const codigo = lerFonte(arquivo)
      expect(codigo, arquivo).toContain('surface="auto"')
      expect(codigo, arquivo).not.toContain("<SheetContent")
      // O "Salvando…" é do `FormSubmit`, não de um ternário.
      expect(codigo, arquivo).not.toMatch(/\? "Salvando…?\.{0,3}" :/)
    }
  })

  it("o rascunho do lançamento: trocar a aba ou o tipo não é alteração", () => {
    const uso = lerFonte("src/components/transactions/transaction-form-use.tsx")
    const foto = uso.slice(uso.indexOf("function fotografar("), uso.indexOf("function fotografar(") + 400)
    expect(foto).not.toMatch(/formKind|r\.type|installmentEditScope|installmentValueMode/)
    expect(lerFonte("src/components/transactions/transaction-form-dialog.tsx")).toMatch(/dirty=\{isDirty\}\s*confirmDiscard/)
  })
})

describe("um link de dentro do diálogo fecha antes de abrir a tela", () => {
  const SHEET = lerFonte("src/components/ui/sheet.tsx")

  it("o casco pega o clique simples num link interno e entrega ao pedido de fechar", () => {
    expect(CODIGO).toContain("function useLinkQueFecha(")
    expect(CODIGO).toMatch(/if \(e\.metaKey \|\| e\.ctrlKey \|\| e\.shiftKey \|\| e\.altKey\) return/)
    expect(CODIGO).toContain('link.getAttribute("target") === "_blank" || link.hasAttribute("download")')
    expect(CODIGO).toContain("if (url.origin !== window.location.origin) return")
    // O seletor ancorado de onde veio o link fecha também (o Esc chega só à camada de cima).
    expect(CODIGO).toContain('link.closest("[data-radix-popper-content-wrapper]")')
    // Diálogo, gaveta e painel vestem o mesmo `onClickCapture`.
    expect(CODIGO).toContain("onClickCapture={aoClicarLink}")
    expect(SHEET.match(/onClickCapture=\{aoClicarLink\}/g)?.length).toBe(2)
  })

  it("a tela abre só depois que o diálogo fechou de fato e saiu do DOM", () => {
    expect(CODIGO).toMatch(/if \(open \|\| !destino\.current\) return/)
    expect(CODIGO).toContain("abrirDepoisDeSair(() => router.push(href), casco)")
    expect(CODIGO).toContain("if (!casco.isConnected || performance.now() - inicio > 800) abrir()")
    // "Continuar editando" esquece o link; "descartar" não (o `Action` também
    // fecha a pergunta, e sem a marca o link se perdia antes de a tela abrir).
    expect(CODIGO).toMatch(/if \(!aberta && !descartando\.current\) destino\.current = null/)
    expect(CODIGO).toMatch(/onDiscard=\{\(\) => \{\s*descartando\.current = true/)
  })

  it("a raiz mais de fora responde", () => {
    expect(CODIGO).toContain("value={navegarDeFora ?? navegarFechando}")
    expect(SHEET).toContain("value={navegarDeFora ?? navegarFechando}")
  })
})
