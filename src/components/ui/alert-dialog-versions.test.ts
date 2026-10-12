import { createElement as h } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"
import { lerFonte, semComentarios } from "@/test/fonte"

import {
  AlertDialog,
  AlertDialogError,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogList,
  AlertDialogMedia,
  AlertDialogTitle,
} from "./alert-dialog"

/** As versões da rodada 201. */

const FONTE = lerFonte("src/components/ui/alert-dialog.tsx")

const TELAS = [
  "src/app/(app)/credit-cards/[cardId]/page-client.tsx",
  "src/app/(app)/subscriptions/page-client.tsx",
  "src/app/(app)/dashboard/page-client.tsx",
  "src/app/(app)/transactions/page-client.tsx",
  "src/app/(app)/categories/page-client.tsx",
  "src/app/(app)/members/page-client.tsx",
  "src/app/(app)/bills/page-client.tsx",
  "src/components/settings/workspace-leave-dialog.tsx",
  "src/components/settings/workspace-delete-dialog.tsx",
  "src/components/categories/detail/category-embedded-transactions.tsx",
  "src/components/categories/detail/category-detail-dialogs.tsx",
]

describe("AlertDialog, rodada 201", () => {
  it("pending trava os dois botões e segura o Esc", () => {
    expect(FONTE).toMatch(/disabled=\{disabled \|\| pending \|\| bloqueado\}/)
    expect(FONTE).toMatch(/AlertDialogCancel[\s\S]*disabled=\{disabled \|\| pending\}/)
    expect(FONTE).toMatch(/if \(pending\) event\.preventDefault\(\)/)
    expect(FONTE).toContain("<Spinner />")
  })

  it("nenhuma tela escreve o andamento, a lista ou o erro à mão", () => {
    for (const tela of TELAS) {
      const codigo = lerFonte(tela)
      const blocos = codigo.match(/<AlertDialog[\s>][\s\S]*?<\/AlertDialog>/g) ?? []
      for (const bloco of blocos) {
        expect(bloco, tela).not.toMatch(/\? "(Excluindo|Removendo|Saindo)…" :/)
        expect(bloco, tela).not.toMatch(/<AlertDialog(Action|Cancel)[^>]*disabled=\{(deleting|leaving|deleteDeleting|deletingTransaction)\}/)
        expect(bloco, tela).not.toContain("AlertDialogDescription asChild")
        expect(bloco, tela).not.toMatch(/<ul className="[^"]*list-disc/)
        expect(bloco, tela).not.toMatch(/<p className="text-sm text-destructive">/)
      }
    }
  })

  it("a exclusão de carteira é um AlertDialog com o digite-para-confirmar", () => {
    const codigo = lerFonte("src/components/settings/workspace-delete-dialog.tsx")
    expect(codigo).toContain("<AlertDialogConfirmInput")
    expect(codigo).not.toMatch(/from "@\/components\/ui\/dialog"|from "@\/components\/ui\/sheet"/)
    expect(codigo).not.toContain("confirmName")
  })

  it("o ícone vai na linha do título, na cor dele, sem poço", () => {
    const html = renderToStaticMarkup(h(AlertDialogMedia, { tone: "destructive" }))
    expect(html).toMatch(/<span data-slot="alert-dialog-media" data-tone="destructive"[^>]*class="[^"]*text-foreground/)
    expect(html).not.toMatch(/rounded-full|bg-/)
    expect(html).toContain('aria-hidden="true"')
    expect(html).toMatch(/<svg[^>]*class="size-4"/)
  })

  it("com o ícone, a descrição atravessa as duas colunas", () => {
    // A grade é a do `DialogHeader`, que casa o sufixo do slot.
    const dialog = lerFonte("src/components/ui/dialog.tsx")
    expect(dialog).toContain("has-[>[data-slot$=-media]]:grid has-[>[data-slot$=-media]]:grid-cols-[auto_minmax(0,1fr)]")
    expect(dialog).toContain("[&>[data-slot$=-title]]:col-start-2")
    expect(dialog).toContain("[&>:not([data-slot$=-media]):not([data-slot$=-title])]:col-span-2")
    expect(renderToStaticMarkup(h(AlertDialogMedia))).toMatch(/class="col-start-1 row-start-1 [^"]*self-center/)
  })

  it("a lista e o erro", () => {
    expect(renderToStaticMarkup(h(AlertDialogList, null, h("li", null, "a")))).toMatch(
      /<ul data-slot="alert-dialog-list" class="[^"]*list-disc[^"]*text-foreground/
    )
    expect(renderToStaticMarkup(h(AlertDialogError, null, "falhou"))).toContain('role="alert"')
  })

  it("a descrição é um div, para a lista caber", () => {
    expect(FONTE).toMatch(/<Muted\s+asChild[\s\S]*?<div>\{children\}<\/div>/)
  })

  it("o cabeçalho, o rodapé e o título são os do Dialog (sem gap, leading-snug, 40 no dedo)", () => {
    const html = renderToStaticMarkup(
      h(AlertDialog, null,
        h(AlertDialogHeader, null, h(AlertDialogTitle, null, "Excluir carteira?")),
        h(AlertDialogFooter, null, "x"))
    )
    const classe = (slot: string) =>
      html.match(new RegExp(`data-slot="${slot}"[^>]*class="([^"]*)"`))?.[1] ??
      html.match(new RegExp(`class="([^"]*)"[^>]*data-slot="${slot}"`))?.[1] ?? ""
    expect(classe("alert-dialog-header")).not.toMatch(/\bgap-2\b/)
    expect(classe("alert-dialog-title")).toContain("leading-snug")
    expect(classe("alert-dialog-footer")).toContain("pointer-coarse:[&amp;_button]:min-h-10")
    // Compõem as peças do Dialog em vez de repetir a receita.
    const codigo = semComentarios(FONTE, "tudo")
    expect(codigo).toMatch(/<DialogHeader/)
    expect(codigo).toMatch(/<DialogFooter/)
    expect(codigo).toContain("dialogTitleClassName")
  })
})
