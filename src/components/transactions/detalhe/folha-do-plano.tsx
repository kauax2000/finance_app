"use client"

import { useState } from "react"
import { CategoryIconPreview, normalizeCategoryIcon } from "@/components/categories/category-appearance-fields"
import type { InstallmentSummary } from "@/components/transactions/installment-purchase-section"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ColorTile } from "@/components/ui/color-tile"
import {
  DescriptionDetails,
  DescriptionList,
  DescriptionListItem,
  DescriptionTerm,
} from "@/components/ui/description-list"
import {
  DialogBody,
  DialogCloseButton,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogHeaderRow,
  DialogTitle,
} from "@/components/ui/dialog"
import { Item, ItemActions, ItemContent, ItemGroup, ItemLink, ItemTitle } from "@/components/ui/item"
import { MoneyDisplay } from "@/components/ui/money-display"
import { Progress } from "@/components/ui/progress"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import { SkeletonGroup, SkeletonText } from "@/components/ui/skeleton"
import { Caption, Muted } from "@/components/ui/typography"
import { diaMesCurto, mesPorExtenso } from "@/lib/detalhe/blocos"
import { estadoDoPlano, fimDoPlano, linhasDoPlano, type LinhaDoPlano } from "@/lib/detalhe/plano"
import { currencyBRL } from "@/lib/formatters"
import { paymentMethodLabel } from "@/lib/payment-methods"
import type { Transaction, TransactionInstallmentPlanRef } from "@/lib/supabase"
import { toastError, toastSuccess } from "@/lib/toast"
import { encerrarInstallmentPlan } from "@/lib/transactions/mutations"

const ESTADO: Record<LinhaDoPlano["estado"], { rotulo: string; badge: Parameters<typeof Badge>[0] }> = {
  lancada: { rotulo: "lançada", badge: { tone: "neutral" } },
  prevista: { rotulo: "prevista", badge: { tone: "warning" } },
  "nao-sera-lancada": { rotulo: "não será lançada", badge: { variant: "outline" } },
}

/**
 * A folha do plano parcelado, aberta pelo "ver parcelas" do detalhe, por cima
 * dele (o `Sheet` empilha; no telefone vira a gaveta). Lê o plano e o resumo
 * que o detalhe já carregou: nada de consulta nova para a lista.
 */
export function FolhaDoPlano({
  open,
  onOpenChange,
  transaction: t,
  plano,
  resumo,
  kn,
  onEditar,
  onExcluir,
  onAbrirParcela,
  onEncerrado,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  transaction: Transaction
  plano: TransactionInstallmentPlanRef
  resumo: InstallmentSummary
  kn: { k: number; n: number } | null
  onEditar: () => void
  onExcluir: () => void
  /** Sem ela, as parcelas lançadas não são clicáveis. */
  onAbrirParcela?: (transactionId: string) => void
  onEncerrado: () => void
}) {
  const [confirmar, setConfirmar] = useState(false)
  const [encerrando, setEncerrando] = useState(false)

  const n = plano.total_installments
  const estado = estadoDoPlano(plano)
  const linhas = resumo.scheduleRows ? linhasDoPlano(plano, resumo.scheduleRows) : null
  const lancadas = linhas?.filter((l) => l.estado === "lancada").length ?? 0
  const slotAberto = linhas?.find((l) => l.transactionId === t.id)?.slot ?? kn?.k ?? null
  const fim = linhas ? fimDoPlano(linhas) : null

  const descricao = (plano.description?.trim() || t.description?.trim() || "Compra parcelada").replace(/ \(\d+\/\d+\)$/, "")
  const cartao = t.payment_method === "credit_card" ? t.payment_card?.name : null
  const meio = [t.category?.name ?? "Sem categoria", cartao ?? paymentMethodLabel(plano.payment_method ?? t.payment_method)]
    .filter(Boolean)
    .join(" · ")

  const encerrar = async () => {
    setEncerrando(true)
    const r = await encerrarInstallmentPlan(plano.id)
    setEncerrando(false)
    if (!r.ok) {
      toastError(r.errorMessage)
      return
    }
    setConfirmar(false)
    toastSuccess("Parcelamento encerrado")
    onEncerrado()
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" size="md" className="flex w-full flex-col gap-0 overflow-hidden p-0">
        <DialogHeader>
          <DialogHeaderRow endAdornment={<DialogCloseButton placement="inline" />}>
            <DialogTitle>Compra parcelada</DialogTitle>
          </DialogHeaderRow>
        </DialogHeader>
        <DialogDescription className="sr-only">
          {descricao}, {n} parcelas de {currencyBRL(Number(plano.installment_amount))}.
        </DialogDescription>

        <DialogBody className="flex flex-col gap-6">
          <div className="flex min-w-0 items-center gap-3">
            <ColorTile size="xl" color={t.category?.color}>
              <CategoryIconPreview name={normalizeCategoryIcon(t.category?.icon)} />
            </ColorTile>
            <div className="min-w-0">
              <p className="truncate font-medium">{descricao}</p>
              <Muted className="truncate">{meio}</Muted>
            </div>
          </div>

          <div className="flex flex-col gap-1">
            {estado === "ativo" ? (
              <>
                <MoneyDisplay size="lg" value={resumo.remaining ?? resumo.totalPurchase} />
                <Caption>
                  faltam {n - lancadas} de {n} · de {currencyBRL(resumo.totalPurchase)}
                </Caption>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <MoneyDisplay
                  size="lg"
                  value={estado === "quitado" ? resumo.totalPurchase : (resumo.posted ?? 0)}
                />
                <Badge tone={estado === "quitado" ? "success" : "neutral"}>{estado}</Badge>
              </div>
            )}
          </div>

          <Progress
            value={lancadas}
            max={n}
            segments={n}
            highlight={slotAberto != null ? { from: slotAberto - 1, to: slotAberto } : undefined}
            aria-label={`${lancadas} de ${n} parcelas lançadas`}
          />

          <DescriptionList>
            <DescriptionListItem>
              <DescriptionTerm>parcela</DescriptionTerm>
              <DescriptionDetails>
                <MoneyDisplay value={Number(plano.installment_amount)} />
              </DescriptionDetails>
            </DescriptionListItem>
            {estado === "ativo" && plano.next_billing_date ? (
              <DescriptionListItem>
                <DescriptionTerm>próxima</DescriptionTerm>
                <DescriptionDetails>{diaMesCurto(plano.next_billing_date)}</DescriptionDetails>
              </DescriptionListItem>
            ) : null}
            <DescriptionListItem>
              <DescriptionTerm>termina em</DescriptionTerm>
              {/* Ativo sem próxima data: o fim não se sabe, e o "—" não finge que acabou. */}
              <DescriptionDetails>{fim ? `${mesPorExtenso(fim.slice(0, 7))} de ${fim.slice(0, 4)}` : "—"}</DescriptionDetails>
            </DescriptionListItem>
          </DescriptionList>

          {linhas == null ? (
            <SkeletonGroup label="Carregando parcelas">
              <SkeletonText lines={4} />
            </SkeletonGroup>
          ) : (
            <ItemGroup variant="divided">
              {linhas.map((l) => {
                const clicavel = l.estado === "lancada" && l.transactionId != null && onAbrirParcela != null
                const rotulo = `${l.slot}/${n}`
                return (
                  // A lançada abre o detalhe dela: o `ItemLink` estica o botão sobre a linha (sem bloco dentro de botão).
                  <Item key={l.slot} variant="flush" interactive={clicavel} selected={l.slot === slotAberto}>
                    <ItemContent>
                      <ItemTitle className="nums">
                        {clicavel ? (
                          <ItemLink onClick={() => onAbrirParcela(l.transactionId!)}>{rotulo}</ItemLink>
                        ) : (
                          rotulo
                        )}
                      </ItemTitle>
                      <Caption>{l.data ? diaMesCurto(l.data) : "—"}</Caption>
                    </ItemContent>
                    <ItemActions>
                      <Badge size="xs" {...ESTADO[l.estado].badge}>
                        {ESTADO[l.estado].rotulo}
                      </Badge>
                      <MoneyDisplay value={l.valor} />
                    </ItemActions>
                  </Item>
                )
              })}
            </ItemGroup>
          )}
        </DialogBody>

        <DialogFooter
          start={
            <Button type="button" variant="tertiary" onClick={onExcluir}>
              excluir compra
            </Button>
          }
        >
          {estado === "ativo" ? (
            <Button type="button" variant="tertiary" onClick={() => setConfirmar(true)}>
              encerrar parcelamento
            </Button>
          ) : null}
          <Button type="button" variant="primary" onClick={onEditar}>
            editar plano
          </Button>
        </DialogFooter>

        <AlertDialog pending={encerrando} open={confirmar} onOpenChange={setConfirmar}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Encerrar o parcelamento?</AlertDialogTitle>
              <AlertDialogDescription>
                As {lancadas} parcelas lançadas ficam. As próximas não serão lançadas.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>cancelar</AlertDialogCancel>
              <AlertDialogAction
                variant="primary"
                onClick={(e) => {
                  e.preventDefault()
                  void encerrar()
                }}
              >
                encerrar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </SheetContent>
    </Sheet>
  )
}
