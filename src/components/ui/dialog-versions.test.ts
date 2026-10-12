import { createElement as h } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"
import { lerFonte } from "@/test/fonte"

import { DialogFooter, DialogHeader, DialogMedia, DialogSteps } from "./dialog"

/** A rodada 211: as versões novas do `Dialog`. */

const CODIGO = lerFonte("src/components/ui/dialog.tsx")

describe("as versões do Dialog", () => {
  it("todo pedido de fechar passa pela trava: salvando não fecha, alterado pergunta", () => {
    expect(CODIGO).toMatch(/const pedir = \(proximo: boolean\) => \{\s*if \(proximo\) return mudar\(true\)\s*if \(pending\) return\s*if \(dirty && confirmDiscard\) \{/)
    // A raiz entrega `pedir`, e não o `onOpenChange` cru, aos dois ramos.
    expect(CODIGO.match(/onOpenChange=\{pedir\}/g)?.length).toBe(2)
    // Fechar, o × e o Cancelar do rodapé ficam desabilitados enquanto salva.
    expect(CODIGO).toContain("disabled={pending || disabled}")
    expect(CODIGO).toContain("disabled={pending || props.disabled}")
  })

  it("no telefone, com surface auto, o conteúdo é a gaveta do Sheet", () => {
    expect(CODIGO).toContain('const gaveta = surface === "auto" && isMobile')
    expect(CODIGO).toMatch(/if \(gaveta\) \{\s*return \(\s*<SheetContent\s*ref=\{ref\}\s*fillMobileViewport=\{layout === "fixed" \|\| size === "full"\}/)
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

  it("os comentários não contam mais o que deixou de ser verdade", () => {
    expect(CODIGO).not.toContain("as sete telas que ainda anulam")
    expect(CODIGO).not.toContain("já está separado por um\n * fio")
    expect(CODIGO).not.toContain("são 13 das 25 telas")
  })
})
