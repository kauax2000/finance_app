import { createElement as h } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"
import { lerFonte, semComentarios } from "@/test/fonte"

import { DialogFooter, DialogHeader, DialogHeaderRow, DialogMedia, DialogSteps } from "./dialog"

/** As versões do `Dialog`. */

const CODIGO = lerFonte("src/components/ui/dialog.tsx")

describe("as versões do Dialog", () => {
  it("aberto de dentro de uma folha, o diálogo (véu e placa) sobe à camada dela", () => {
    expect(CODIGO).toMatch(/const dentroDeFolha = React\.useContext\(DrawerRaizContext\) != null/)
    expect(CODIGO).toContain('<DialogOverlay className={dentroDeFolha ? "z-(--z-sheet)" : undefined} />')
    expect(CODIGO).toContain('dentroDeFolha && "z-(--z-sheet)"')
  })

  it("o centro do cabeçalho: centrado na placa, escondido até centerShown, fora da leitura", () => {
    const fechado = renderToStaticMarkup(h(DialogHeaderRow, { center: "Uber" }, null))
    expect(fechado).toContain('data-slot="dialog-header-center"')
    expect(fechado).toContain('aria-hidden="true"')
    expect(fechado).toMatch(/data-slot="dialog-header-center"[^>]*inert/)
    expect(fechado).not.toContain("data-shown=")
    const aberto = renderToStaticMarkup(h(DialogHeaderRow, { center: "Uber", centerShown: true }, null))
    expect(aberto).toContain("data-shown=")
    expect(aberto).not.toMatch(/data-slot="dialog-header-center"[^>]*inert/)
    expect(renderToStaticMarkup(h(DialogHeaderRow, {}, null))).not.toContain("dialog-header-center")
  })

  it("o centro entra como o título que sobe à barra: 6px, do desfoque, sem movimento no reduzido", () => {
    expect(CODIGO).toContain("translate-y-1.5 opacity-0 blur-xs")
    expect(CODIGO).toContain("data-shown:translate-y-0 data-shown:opacity-100 data-shown:blur-none")
    expect(CODIGO).toContain("motion-reduce:translate-y-0 motion-reduce:blur-none")
  })

  it("useDialogHeaderDock observa contra o corpo do diálogo", () => {
    expect(CODIGO).toMatch(/function useDialogHeaderDock/)
    expect(CODIGO).toMatch(/export \{[^}]*useDialogHeaderDock/)
    expect(CODIGO).toContain('closest<HTMLElement>(\'[data-slot="dialog-body"]\')')
  })

  it("o cabeçalho sem título (só controles) recua 8 embaixo, e não 16", () => {
    expect(CODIGO).toContain('"group-data-[layout=fixed]/dialog-content:pb-4"')
    expect(CODIGO).toContain('"group-data-[layout=fixed]/dialog-content:not-has-[[data-slot$=-title]]:pb-2"')
  })

  it("no layout auto o corpo sangra até o recuo da placa, e o conteúdo alinha com o cabeçalho", () => {
    expect(CODIGO).toContain('"group-data-[layout=auto]/dialog-content:-mx-(--dialog-px)"')
  })

  it("a altura anda na mola quando o conteúdo muda, e o ref de quem chama continua valendo", () => {
    expect(CODIGO).toContain("const alturaAnimada = useAlturaAnimada<HTMLDivElement>()")
    expect(CODIGO).toContain("const placaRef = useComposedRefs(ref, alturaAnimada)")
    expect(CODIGO).toMatch(/<DialogPrimitive\.Content\s+ref=\{placaRef\}/)
    const gancho = lerFonte("src/hooks/use-altura-animada.ts")
    expect(gancho).toContain('"height var(--duration-gentle) var(--ease-emphasized), width var(--duration-gentle) var(--ease-emphasized)"')
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
    expect(CODIGO).toContain("has-[[data-slot=dialog-steps]]:h-(--dialog-max-h) has-[[data-slot=dialog-steps]]:[--dialog-max-h:min(90dvh,36rem)]")
    // Sem passos, o teto é a janela: o diálogo só rola com conteúdo maior que a tela.
    expect(CODIGO).toContain("[--dialog-max-h:calc(100dvh-4rem)]")
  })

  it("no telefone, a gaveta com passos só trava na altura alta no fixed", () => {
    // No `auto` a gaveta mede cada passo e anda entre eles, como a placa do desktop
    // (o Importar extrato); no `fixed` ela fica na altura alta e não pula.
    const fonte = semComentarios(CODIGO)
    expect(fonte).toContain('layout === "fixed" && "has-[[data-slot=dialog-steps]]:h-(--drawer-h)"')
    expect(fonte.split("has-[[data-slot=dialog-steps]]:h-(--drawer-h)")).toHaveLength(2)
  })

  it("o cabeçalho centrado: align, o poço com o tom e os passos em pontos, opcionais", () => {
    // Os padrões continuam os de antes.
    expect(renderToStaticMarkup(h(DialogHeader, null, "x"))).toContain('data-align="start"')
    const inline = renderToStaticMarkup(h(DialogMedia, null, h("svg")))
    expect(inline).toContain('data-variant="inline"')
    expect(inline).toContain("[&amp;&gt;svg]:size-4")
    expect(inline).not.toContain("rounded-full")
    const barra = renderToStaticMarkup(h(DialogSteps, { current: 0, total: 2 }))
    expect(barra).toContain('data-variant="bar"')
    expect(barra).toContain('role="progressbar"')

    const centro = renderToStaticMarkup(h(DialogHeader, { align: "center" }, "x"))
    expect(centro).toContain('data-align="center"')
    expect(centro).toContain("text-center")
    // O recuo do × dos dois lados: o título já desvia à direita, e ganha a esquerda.
    expect(centro).toContain("[&amp;&gt;[data-slot$=-title]]:ps-[max(0px,calc(var(--dialog-close)-var(--dialog-px)))]")

    const poco = renderToStaticMarkup(h(DialogMedia, { variant: "well", tone: "destructive" }, h("svg")))
    expect(poco).toContain('data-variant="well"')
    expect(poco).toMatch(/\bsize-14\b/)
    expect(poco).toContain("bg-destructive-muted text-destructive-muted-foreground")
    expect(poco).toContain("[&amp;&gt;svg]:size-6")
    for (const tom of ["success", "warning"] as const) {
      expect(renderToStaticMarkup(h(DialogMedia, { variant: "well", tone: tom }, h("svg")))).toContain(`bg-${tom}-muted text-${tom}-muted-foreground`)
    }
    // O tom não pinta o ícone na linha do título.
    expect(renderToStaticMarkup(h(DialogMedia, { tone: "destructive" }, h("svg")))).not.toContain("bg-destructive-muted")

    const pontos = renderToStaticMarkup(h(DialogSteps, { variant: "dots", current: 1, total: 2, labels: ["Aviso", "Confirmação"] }))
    expect(pontos).toContain('role="img"')
    expect(pontos).toContain('aria-label="Passo 2 de 2 · Confirmação"')
    expect(pontos).not.toContain("progressbar")
    expect(pontos.match(/rounded-full/g)?.length).toBe(2)
    expect(pontos).toContain("w-4 bg-foreground")
    expect(pontos).toContain("motion-reduce:transition-none")
  })

  it("start encosta uma ação à esquerda, e vem antes no DOM — embaixo no telefone", () => {
    const html = renderToStaticMarkup(h(DialogFooter, { start: h("b", null, "voltar") }, h("i", null, "ok")))
    expect(html.indexOf("dialog-footer-start")).toBeLessThan(html.indexOf("<i>"))
    expect(html).toContain("sm:me-auto")
  })

  it("no dedo, os botões do rodapé sobem ao piso de 40", () => {
    expect(CODIGO).toContain('"pointer-coarse:[&_button]:min-h-11"')
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

describe("o ✕ flutuante fica por cima do cabeçalho translúcido", () => {
  it("o canto leva z acima do z-index 10 do cabeçalho", () => {
    // Atrás do cabeçalho (`dialog-header-translucent`, z-index 10), o toque no ✕ caía nele e a gaveta não fechava.
    expect(semComentarios(CODIGO)).toContain('floating: "absolute top-2.5 right-2.5 z-20"')
    expect(lerFonte("src/app/globals.css")).toMatch(/@utility dialog-header-translucent[\s\S]*?z-index: 10;/)
  })
})

describe("na gaveta, o cabeçalho é a barra das folhas do iOS", () => {
  const fonte = semComentarios(CODIGO)
  it("o DialogHeaderRow sobe à linha do ✕, com o título no centro entre duas reservas iguais", () => {
    expect(fonte).toContain('barra && "max-md:-mt-8"')
    expect(fonte).toContain("const barra = endAdornment != null || startAdornment != null")
    expect(fonte).toContain("max-md:has-[[data-slot=dialog-title]]:grid-cols-[5.75rem_minmax(0,1fr)_5.75rem]")
    expect(fonte).toContain("max-md:[&_[data-slot=dialog-title]]:col-start-2 max-md:[&_[data-slot=dialog-title]]:row-start-1 max-md:[&_[data-slot=dialog-title]]:truncate max-md:[&_[data-slot=dialog-title]]:text-center")
    expect(fonte).toContain("max-md:[&_[data-slot=dialog-description]]:col-span-full max-md:[&_[data-slot=dialog-description]]:row-start-2")
    expect(fonte).toContain("max-md:group-has-[[data-slot=dialog-title]]/dialog-header-row:contents")
  })
  it("a ação da esquerda (startAdornment) ocupa a reserva da esquerda na gaveta", () => {
    expect(fonte).toContain('data-slot="dialog-header-start"')
    expect(fonte).toContain("max-md:col-start-1 max-md:row-start-1 max-md:justify-self-start")
    expect(fonte).toContain('data-slot="dialog-header-end"')
  })
  it("o título solto no cabeçalho da gaveta também sobe ao centro da linha do ✕", () => {
    expect(fonte).toContain("max-md:[[data-slot=sheet-content]_[data-slot=dialog-header]>&]:-mt-8 max-md:[[data-slot=sheet-content]_[data-slot=dialog-header]>&]:px-13")
  })
  it("os botões da barra ficam sem fundo (o dono recusou o círculo cinza)", () => {
    expect(fonte).not.toContain("bg-secondary")
  })
})
