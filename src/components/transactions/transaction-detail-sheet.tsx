"use client"

import Link from "next/link"
import { type CSSProperties, useEffect, useMemo, useRef, useState } from "react"
import {
    ArrowPathRoundedSquareIcon,
    BanknotesIcon,
    ChevronDownIcon,
    ChevronUpIcon,
    CreditCardIcon,
    FolderIcon,
    EllipsisHorizontalIcon,
    PencilIcon,
    TrashIcon,
} from "@heroicons/react/16/solid"
import { CategoryIconPreview, normalizeCategoryIcon } from "@/components/categories/category-appearance-fields"
import { AConferirNoDetalhe, temAConferir } from "@/components/transactions/a-conferir-no-detalhe"
import { AnexosDoLancamento } from "@/components/transactions/anexos-do-lancamento"
import {
    direcaoDaTecla,
    ehCampoDeTexto,
    podeNavegar,
    rotuloDaRecorrencia,
} from "@/components/transactions/detalhe-regras"
import type { FatiaDaManchete } from "@/components/transactions/detalhe/bloco-contexto"
import { BlocoCategoria } from "@/components/transactions/detalhe/bloco-categoria"
import { BlocoFatura } from "@/components/transactions/detalhe/bloco-fatura"
import { BlocoHistorico } from "@/components/transactions/detalhe/bloco-historico"
import { BlocoParcelada } from "@/components/transactions/detalhe/bloco-parcelada"
import { BlocoReceitas } from "@/components/transactions/detalhe/bloco-receitas"
import { BlocoReceitasNoTempo } from "@/components/transactions/detalhe/bloco-receitas-no-tempo"
import { BlocoSaldoDoMes } from "@/components/transactions/detalhe/bloco-saldo-do-mes"
import { RodapeDaOrigem } from "@/components/transactions/detalhe/rodape-da-origem"
import { FolhaDoPlano } from "@/components/transactions/detalhe/folha-do-plano"
import { FotoDoMembro } from "@/components/transactions/foto-do-membro"
import { ImpactoDaParcela } from "@/components/transactions/impacto-da-parcela"
import { PartesDaDespesa } from "@/components/transactions/partes-da-despesa"
import {
    summarizeInstallmentPlan,
    useInstallmentSlices,
} from "@/components/transactions/installment-purchase-section"
import { valorComSinal } from "@/components/transactions/transacoes-tabela-regras"
import type {
    InstallmentPlanUpdatePayload,
    TransactionFormSavePayload,
    TransactionSaveResult,
} from "@/components/transactions/transaction-form-types"
import { TransactionFormSurface } from "@/components/transactions/transaction-form-surface"
import { useTransactionForm } from "@/components/transactions/transaction-form-use"
import { useTrocaDeSubtela } from "@/components/transactions/importar/transicao-da-subtela"
import { Alert, AlertAction, AlertActions, AlertDescription } from "@/components/ui/alert"
import { Badge, BadgeDot } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ColorTile } from "@/components/ui/color-tile"
import {
    DialogBody,
    DialogCloseButton,
    DialogDescription,
    DialogHeader,
    DialogHeaderRow,
    DialogTitle,
    useDialogHeaderDock,
} from "@/components/ui/dialog"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoneyDisplay } from "@/components/ui/money-display"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { Caption } from "@/components/ui/typography"
import { useWorkspace } from "@/components/workspace-provider"
import { corDaCategoria, tileColorFor } from "@/lib/tile-palette"
import { projetoDetailPath } from "@/config/navigation"
import { useIsMobile } from "@/hooks/use-mobile"
import { formatYearMonth } from "@/lib/budget-month"
import { escolherManchete } from "@/lib/detalhe/contexto"
import { currencyBRL } from "@/lib/formatters"
import { paymentMethodLabel } from "@/lib/payment-methods"
import { useMemberDirectoryQuery } from "@/lib/queries/use-member-directory"
import type { Category, CreditCard, Transaction, TransactionInstallmentPlanRef } from "@/lib/supabase"
import { supabase } from "@/lib/supabase"
import { toastError } from "@/lib/toast"
import { fetchTransactionForDetailSheet } from "@/lib/transactions-detail-sheet-query"
import { formatRelativeDayPtBr, formatTransactionDayPtBr, formatWeekdayDayMonthShortPtBr, transactionLocalYmd } from "@/lib/transaction-date"
import { resolveInstallmentKn } from "@/lib/transaction-installment"
import { cn } from "@/lib/utils"

export type TransactionDetailSheetProps = {
    transaction: Transaction | null
    open: boolean
    onOpenChange: (open: boolean) => void
    creditCards: CreditCard[]
    categories: Category[]
    categoriesHref: string
    creditCardsHref: string
    subscriptionsHref: string
    saving: boolean
    onSave: (payload: TransactionFormSavePayload) => Promise<TransactionSaveResult>
    onUpdateInstallmentPlan: (planId: string, payload: InstallmentPlanUpdatePayload) => Promise<boolean>
    onDelete: (t: Transaction) => void
    /** When the sheet opens with this true, switch to edit mode once (e.g. table “Editar”). */
    launchInEditMode?: boolean
    onLaunchEditConsumed?: () => void
    /** A linha de cima e a de baixo na página da lista; sem elas, as setas não aparecem. */
    anterior?: Transaction | null
    seguinte?: Transaction | null
    /** Troca o lançamento mostrado, sem fechar a folha (setas, ↑/↓ e J/K). */
    onNavegar?: (t: Transaction) => void
}

export function TransactionDetailSheet({
    transaction,
    open,
    onOpenChange,
    creditCards,
    categories,
    categoriesHref,
    creditCardsHref,
    subscriptionsHref,
    saving,
    onSave,
    onUpdateInstallmentPlan,
    onDelete,
    launchInEditMode = false,
    onLaunchEditConsumed,
    anterior,
    seguinte,
    onNavegar,
}: TransactionDetailSheetProps) {
    const isMobile = useIsMobile()
    const [detailMode, setDetailMode] = useState<"view" | "edit">("view")
    // Entrar e sair da edição é o gesto da subtela do Importar, só no telefone.
    const trocar = useTrocaDeSubtela(isMobile)
    const [escopoAoEditar, setEscopoAoEditar] = useState<"slice" | "plan">("slice")
    const [versaoDasParcelas, setVersaoDasParcelas] = useState(0)
    const [versaoLida, setVersaoLida] = useState(0)
    const [planFallback, setPlanFallback] = useState<TransactionInstallmentPlanRef | null>(null)
    const [folhaDoPlano, setFolhaDoPlano] = useState(false)
    // Confirmado nesta folha: o selo "A conferir" do topo some antes de a lista recarregar.
    const [conferidoNaFolha, setConferidoNaFolha] = useState<string | null>(null)
    const { papel } = useWorkspace()
    const marca = useRef<HTMLDivElement>(null)
    // H2a/A5 (11/nov/2026): ao rolar, o resumo entra no centro da barra.
    const [nomeRef, nomeSubiu] = useDialogHeaderDock<HTMLDivElement>()
    const cabecalhoRef = useRef<HTMLDivElement>(null)
    // As fatias da manchete que os blocos mandam, só da chave atual dos blocos (a de outra é descartada).
    const [fatias, setFatias] = useState<{ chave: string; fatia: FatiaDaManchete }>({ chave: "", fatia: {} })

    const t = transaction
    const membros = useMemberDirectoryQuery(t?.workspace_id ?? null).data ?? []

    /* eslint-disable react-hooks/set-state-in-effect -- load/clear installment plan embed when sheet opens */
    useEffect(() => {
        if (!open || !t?.installment_plan_id) {
            setPlanFallback(null)
            return
        }
        // Depois de editar ou encerrar, o plano embutido no lançamento ficou velho: relê.
        if (t.installment_plan && versaoDasParcelas === 0) {
            setPlanFallback(null)
            return
        }
        let cancelled = false
        void (async () => {
            const { data, error } = await supabase
                .from("workspace_installment_plans")
                .select(
                    "id,total_installments,installment_amount,final_installment_amount,generated_count,is_active,next_billing_date,description,category_id,payment_method,payment_credit_card_id"
                )
                .eq("id", t.installment_plan_id!)
                .maybeSingle()
            if (cancelled) return
            setVersaoLida(versaoDasParcelas)
            if (!error && data) {
                setPlanFallback(data as TransactionInstallmentPlanRef)
            } else {
                setPlanFallback(null)
            }
        })()
        return () => {
            cancelled = true
        }
    }, [open, t?.installment_plan_id, t?.installment_plan, versaoDasParcelas])
    /* eslint-enable react-hooks/set-state-in-effect */

    const { slices, slicesLoading } = useInstallmentSlices(
        t?.installment_plan_id,
        open,
        versaoDasParcelas
    )

    // A leitura de outro plano (troca de lançamento em curso) não vale para este.
    const lendoPlano = versaoDasParcelas > 0 && versaoLida !== versaoDasParcelas
    const planoLido = planFallback && planFallback.id === t?.installment_plan_id ? planFallback : null
    const planoAtual = (versaoDasParcelas > 0 ? planoLido : null) ?? t?.installment_plan ?? planoLido

    const installmentBlock = useMemo(() => {
        const plan = planoAtual
        if (!t || t.type !== "expense" || !t.installment_plan_id || !plan) {
            return null
        }
        return {
            plan,
            kn: resolveInstallmentKn(t.installment_sequence, t.description, plan),
            summary: summarizeInstallmentPlan(plan, slices, slicesLoading),
        }
    }, [t, planoAtual, slices, slicesLoading])

    const txForForm = useMemo((): Transaction | null => {
        if (!t) return null
        if (!planoAtual || planoAtual === t.installment_plan) return t
        return { ...t, installment_plan: planoAtual }
    }, [t, planoAtual])

    const { handleSubmit, fieldsProps, formTitle, formDescription, showFooter, submitDisabled } = useTransactionForm({
        active: open && detailMode === "edit",
        saving,
        editingTransaction: txForForm,
        defaultLaunchKind: "expense",
        categories,
        creditCards,
        categoriesHref,
        creditCardsHref,
        onSave,
        onSaveInstallmentPlan: undefined,
        onUpdateInstallmentPlan,
        closeOnSuccess: false,
        onClose: () => trocar("volta", () => setDetailMode("view")),
        onSuccess: () =>
            trocar("volta", () => {
                setDetailMode("view")
                setVersaoDasParcelas((v) => v + 1)
            }),
        initialInstallmentEditScope: escopoAoEditar,
    })

    // O escopo do plano vale só para a edição em curso: ao sair dela, volta à parcela.
    useEffect(() => {
        if (detailMode === "view") {
            // eslint-disable-next-line react-hooks/set-state-in-effect -- volta ao escopo da parcela ao sair da edição
            setEscopoAoEditar("slice")
        }
    }, [detailMode])

    useEffect(() => {
        if (!open) {
            // eslint-disable-next-line react-hooks/set-state-in-effect -- reset edit mode when sheet closes
            setDetailMode("view")
            setFolhaDoPlano(false)
            setVersaoDasParcelas(0)
            setVersaoLida(0)
        }
    }, [open])

    // Outro plano (ou outro lançamento) começa do zero: a versão do anterior não vale.
    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- zera a versão ao trocar de plano
        setVersaoDasParcelas(0)
        setVersaoLida(0)
    }, [t?.installment_plan_id])

    const abertoAntes = useRef(false)
    useEffect(() => {
        const estavaAberto = abertoAntes.current
        abertoAntes.current = open
        if (!open || !launchInEditMode) return
        // Com o detalhe já aberto, entra com o gesto; abrindo já em edição, quem anima é a gaveta.
        const entrar = () => setDetailMode("edit")
        if (estavaAberto) trocar("entra", entrar)
        else entrar()
        onLaunchEditConsumed?.()
    }, [open, launchInEditMode, onLaunchEditConsumed, trocar])

    // As setas: só no desktop, só abertas pela lista, e desligadas enquanto edita.
    const setas = podeNavegar(isMobile || !onNavegar ? null : { anterior, seguinte }, detailMode === "edit")
    const { anterior: podeAnterior, seguinte: podeSeguinte } = setas
    const comSetas = !isMobile && Boolean(onNavegar) && (anterior !== undefined || seguinte !== undefined)

    useEffect(() => {
        if (!open || !onNavegar || (!podeAnterior && !podeSeguinte)) return
        const aoTeclar = (e: KeyboardEvent) => {
            if (e.defaultPrevented || ehCampoDeTexto(e.target)) return
            const direcao = direcaoDaTecla(e)
            if (!direcao) return
            // Só a folha: um menu ou uma confirmação portalizados por cima ficam com as setas.
            const casca = marca.current?.closest('[data-slot="sheet-content"]')
            const alvo = e.target as Node | null
            if (alvo && alvo !== document.body && !casca?.contains(alvo)) return
            const destino = direcao === "anterior" ? anterior : seguinte
            if (!destino || !(direcao === "anterior" ? podeAnterior : podeSeguinte)) return
            e.preventDefault()
            onNavegar(destino)
        }
        document.addEventListener("keydown", aoTeclar)
        return () => document.removeEventListener("keydown", aoTeclar)
    }, [open, onNavegar, anterior, seguinte, podeAnterior, podeSeguinte])

    if (!t) {
        return null
    }

    const paymentCard =
        t.payment_card ?? (t.payment_credit_card_id ? creditCards.find((c) => c.id === t.payment_credit_card_id) : null)
    const pagamento =
        t.payment_method === "credit_card" && paymentCard
            ? `${paymentCard.name} •• ${paymentCard.last_four}`
            : paymentMethodLabel(t.payment_method)

    const isIncome = t.type === "income"
    // "Há 14 dias · qua, 28 de out": o tempo que passou lê primeiro, o dia exato vem apagado.
    const relativo = formatRelativeDayPtBr(t.date)
    const quandoRelativo = relativo.charAt(0).toUpperCase() + relativo.slice(1)
    const exato = formatWeekdayDayMonthShortPtBr(t.date)
    const quandoExato = exato.charAt(0).toLowerCase() + exato.slice(1)
    const descricaoInteira = t.description?.trim() || t.category?.name || "Sem descrição"
    // A mesma regra da tabela: a parcela perde o "(1/2)" que o banco grava; o chip k/n o diz.
    const descricao = t.installment_plan_id ? descricaoInteira.replace(/ \(\d+\/\d+\)$/, "") : descricaoInteira
    const nomeDe = (id: string | null | undefined) => {
        const m = id ? membros.find((x) => x.user_id === id) : undefined
        return m ? m.full_name || m.email : null
    }
    const variosMembros = membros.length >= 2
    const autor = variosMembros ? nomeDe(t.user_id) : null
    const pagou = variosMembros && !isIncome ? nomeDe(t.paid_by) : null
    const membroDe = (id: string | null | undefined) => (id ? membros.find((x) => x.user_id === id) : undefined)
    const membroQuePagou = pagou ? membroDe(t.paid_by) : undefined
    const membroAutor = autor ? membroDe(t.user_id) : undefined

    // O que decide quais blocos valem: mudou (outro lançamento, ou este editado), os blocos remontam
    // e a manchete recomeça — um bloco que deixou de valer não manda nada, e a fatia velha não fica.
    const chaveDosBlocos = `${t.id}:${t.type}:${t.category_id}:${t.installment_plan_id}`
    const aoMudarManchete = (fatia: FatiaDaManchete) =>
        setFatias((p) => ({
            chave: chaveDosBlocos,
            fatia: p.chave === chaveDosBlocos ? { ...p.fatia, ...fatia } : fatia,
        }))
    const hoje = new Date()
    const manchete = escolherManchete({
        ...(fatias.chave === chaveDosBlocos ? fatias.fatia : {}),
        hoje,
        mesCorrente: (transactionLocalYmd(t.date) ?? "").slice(0, 7) === formatYearMonth(hoje),
    })

    const editar = () => trocar("entra", () => setDetailMode("edit"))
    const editarPlano = () =>
        trocar("entra", () => {
            setEscopoAoEditar("plan")
            setDetailMode("edit")
        })
    const excluir = () => onDelete(t)
    // Tocar numa parcela lançada: o dono da folha troca o lançamento mostrado; sem ele, não é clicável.
    const carteira = t.workspace_id
    const abrirParcela = onNavegar && carteira
        ? async (id: string) => {
              const r = await fetchTransactionForDetailSheet(supabase, {
                  transactionId: id,
                  workspaceId: carteira,
                  creditCards,
              })
              if (!r.transaction) {
                  toastError(r.errorMessage ?? "Não foi possível abrir a parcela.")
                  return
              }
              setFolhaDoPlano(false)
              onNavegar(r.transaction)
          }
        : undefined

    const seta = (direcao: "anterior" | "seguinte") => {
        const destino = direcao === "anterior" ? anterior : seguinte
        const rotulo = direcao === "anterior" ? "Lançamento anterior" : "Próximo lançamento"
        return (
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button
                        type="button"
                        variant="tertiary"
                        size="icon-md"
                        aria-label={rotulo}
                        disabled={!setas[direcao]}
                        onClick={() => destino && onNavegar?.(destino)}
                    >
                        {direcao === "anterior" ? <ChevronUpIcon aria-hidden /> : <ChevronDownIcon aria-hidden />}
                    </Button>
                </TooltipTrigger>
                <TooltipContent shortcut={direcao === "anterior" ? "up" : "down"}>{rotulo}</TooltipContent>
            </Tooltip>
        )
    }

    // O bloco que desliza na troca de subtela sobe sobre a faixa do puxador (e devolve a altura em
    // respiro): o título, que sobe à linha do ×, fica dentro da foto da transição e não é cortado.
    const viewBody = (
        <div ref={marca} data-subtela-conteudo="" className="flex min-h-0 flex-1 flex-col -mt-(--drawer-handle-h,0px) pt-(--drawer-handle-h,0px)">
            {/* Na gaveta o ícone começa rente à borda do cabeçalho (o corpo sem respiro, abaixo), e o
                degradê de 56px passava dela e apagava a metade de cima do ladrilho (27/11/2026). Aqui a
                placa cobre o cabeçalho inteiro e nasce apagada: com a rolagem ela acende e o degradê abaixo
                dela cresce, de 0 a 56px (`--dialog-header-tint` e `--dialog-header-fade-h`, escritos no nó
                a cada rolagem, sem render). Parado no topo não há fundo (acesa, a placa lia como uma faixa
                sobre a gaveta); rolando, o que passa por baixo some aos poucos. Com o degradê subindo por
                dentro da faixa, a placa ficava rala atrás do ⋯ e do resumo. */}
            <DialogHeader
                ref={cabecalhoRef}
                className="[--dialog-header-solid:100%]!"
                style={{ "--dialog-header-fade-h": "0px", "--dialog-header-tint": "transparent" } as CSSProperties}
            >
                <DialogHeaderRow
                    centerShown={nomeSubiu}
                    center={
                        // Como o título que sobe à barra do app: o nome vem antes do valor, e o que não
                        // cabe inteiro na linha (o valor) quebra para uma segunda linha recortada e some.
                        <span className="flex h-6 min-w-0 max-w-full flex-wrap content-start items-center justify-center gap-x-2 overflow-hidden">
                            <ColorTile size="xs" color={corDaCategoria(t.category, t.type)}>
                                <CategoryIconPreview name={normalizeCategoryIcon(t.category?.icon)} />
                            </ColorTile>
                            <span className="min-w-0 max-w-full truncate text-sm font-medium">{descricao}</span>
                            <MoneyDisplay size="md" signed tone="muted" value={valorComSinal(t)} className="shrink-0" />
                        </span>
                    }
                    endAdornment={
                        <>
                            {/* O ⋯ abre como menu também no telefone, na escala do toque. */}
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button type="button" variant="tertiary" size="icon-md" aria-label="Mais opções">
                                        <EllipsisHorizontalIcon aria-hidden />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" size="sm">
                                    <DropdownMenuItem onClick={editar}>
                                        <PencilIcon aria-hidden />
                                        Editar
                                    </DropdownMenuItem>
                                    <DropdownMenuItem variant="destructive" onClick={excluir}>
                                        <TrashIcon aria-hidden />
                                        Excluir
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                            <DialogCloseButton placement="inline" />
                        </>
                    }
                >
                    {comSetas ? (
                        <div className="flex items-center gap-1">
                            {seta("anterior")}
                            {seta("seguinte")}
                        </div>
                    ) : null}
                </DialogHeaderRow>
            </DialogHeader>
            <DialogDescription className="sr-only">
                {isIncome ? "Receita" : "Despesa"}. {formatTransactionDayPtBr(t.date)}. Valor {currencyBRL(Number(t.amount))}.
            </DialogDescription>

            {/* Na gaveta o ícone começa logo abaixo da linha do ⋯ e do ×, sem o respiro de 16 do corpo
                (pedido do dono, 18/11/2026: sobrava espaço entre o topo da gaveta e o ícone). */}
            <DialogBody
                className="flex flex-col gap-6 max-md:[--dialog-body-pt:0px]"
                onScroll={(e) => {
                    const no = cabecalhoRef.current
                    if (!no) return
                    // Parado no topo, sem placa nem degradê; rolando, os dois acendem juntos até os 56px.
                    const passo = Math.min(56, e.currentTarget.scrollTop)
                    no.style.setProperty("--dialog-header-fade-h", `${passo}px`)
                    no.style.setProperty(
                        "--dialog-header-tint",
                        `color-mix(in oklab, var(--background) ${Math.round((passo / 56) * 95)}%, transparent)`
                    )
                }}
            >
                {/* O topo (C1 + D4 + E2/E5, 11/nov/2026): o ladrilho, o nome sobre o valor grande, a data relativa embaixo dele e, embaixo, o pagamento e a categoria (com o ponto na cor dela) — tudo no mesmo eixo. */}
                <div className="flex flex-col items-center text-center gap-3">
                    <ColorTile size="2xl" color={corDaCategoria(t.category, t.type)}>
                        <CategoryIconPreview name={normalizeCategoryIcon(t.category?.icon)} />
                    </ColorTile>
                    <div className="flex min-w-0 flex-col items-center gap-1">
                        <div ref={nomeRef} className="flex min-w-0 flex-wrap items-center justify-center gap-2">
                            <DialogTitle tabIndex={-1} className="outline-none">{descricao}</DialogTitle>
                            {installmentBlock?.kn ? (
                                <Badge size="xs">{`${installmentBlock.kn.k}/${installmentBlock.kn.n}`}</Badge>
                            ) : null}
                        </div>
                        <MoneyDisplay size="3xl" signed value={valorComSinal(t)} tone={isIncome ? "income" : undefined} />
                        <Caption>
                            <span className="text-foreground">{quandoRelativo}</span>
                            {" · "}
                            {quandoExato}
                            {pagou ? (
                                <>
                                    {" · "}
                                    {/* Só a foto: o nome fica no nome acessível e na dica. */}
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            {/* `align-text-top`: o avatar de 16 fica no centro do texto de 12 (o `middle` o deixava 1px abaixo). */}
                                            <span role="img" aria-label={`Pago por ${pagou}`} className="inline-flex align-text-top">
                                                {membroQuePagou ? <FotoDoMembro membro={membroQuePagou} size="2xs" /> : pagou}
                                            </span>
                                        </TooltipTrigger>
                                        <TooltipContent>{pagou}</TooltipContent>
                                    </Tooltip>
                                </>
                            ) : null}
                        </Caption>
                    </div>
                    <div className="flex flex-wrap justify-center gap-2">
                        {/* O estado abre a fileira, antes de pagamento e categoria. */}
                        {t.needs_review && conferidoNaFolha !== t.id ? (
                            <Badge size="md" tone="info">
                                <BadgeDot />
                                A conferir
                            </Badge>
                        ) : null}
                        {pagamento ? (
                            <Badge size="md" tone="neutral">
                                {t.payment_method?.endsWith("_card") ? <CreditCardIcon /> : <BanknotesIcon />}
                                {pagamento}
                            </Badge>
                        ) : null}
                        {/* O ponto veste a cor da categoria pela mesma régua do ladrilho (`tile-vivid`), nunca crua. */}
                        <Badge
                            size="md"
                            tone="neutral"
                            className={t.category ? "tile-vivid [--badge-dot:var(--tile-surface)]" : undefined}
                            style={t.category ? ({ "--tile-color": tileColorFor(t.category.color) ?? "var(--muted-foreground)" } as CSSProperties) : undefined}
                        >
                            {t.category ? <BadgeDot /> : null}
                            {t.category?.name ?? "Sem categoria"}
                        </Badge>
                        {t.is_recurring ? (
                            <Badge size="md" tone="neutral">
                                <ArrowPathRoundedSquareIcon />
                                {rotuloDaRecorrencia(t.recurring_interval)}
                            </Badge>
                        ) : null}
                        {t.subscription_id ? (
                            <Link
                                href={`${subscriptionsHref}?sub=${encodeURIComponent(t.subscription_id)}`}
                                className="inline-flex items-center rounded-full focus:outline-none focus-visible:ring-3 focus-visible:ring-ring/45 pointer-coarse:min-h-11"
                            >
                                <Badge size="md" tone="neutral">
                                    <CreditCardIcon />
                                    {t.subscription?.name ?? "Assinatura"}
                                </Badge>
                            </Link>
                        ) : null}
                        {t.project_id ? (
                            <Link
                                href={projetoDetailPath(t.project_id)}
                                className="inline-flex items-center rounded-full focus:outline-none focus-visible:ring-3 focus-visible:ring-ring/45 pointer-coarse:min-h-11"
                            >
                                <Badge size="md" tone="neutral">
                                    <FolderIcon />
                                    Projeto
                                </Badge>
                            </Link>
                        ) : null}
                    </div>
                </div>

                {/* O a conferir (K2c, 13/11/2026) sobe para logo abaixo do topo, antes da manchete: o selo e o card que o resolve ficam juntos. */}
                {temAConferir(t) ? (
                    <AConferirNoDetalhe
                        // Confirmado na lista com o detalhe aberto: o bloco remonta, sem "Confirmar" velho.
                        key={`${t.id}:${t.needs_review}`}
                        transaction={t}
                        pagamento={pagamento}
                        onEditar={editar}
                        onFeito={(o) => {
                            if (o === "confirmado") setConferidoNaFolha(t.id)
                            if (o === "desfeito") onOpenChange(false)
                        }}
                    />
                ) : null}

                {manchete ? (
                    <Alert tone={manchete.tom}>
                        <AlertDescription>{manchete.texto}</AlertDescription>
                        {manchete.acao ? (
                            // Ao lado, a frase longa quebrava em 4 linhas: passando de 2 linhas na coluna estreita (~60 caracteres), o botão desce.
                            <AlertActions placement={manchete.texto.length > 60 ? "block" : "inline"}>
                                <AlertAction asChild>
                                    <Link href={manchete.acao.href}>{manchete.acao.label}</Link>
                                </AlertAction>
                            </AlertActions>
                        ) : null}
                    </Alert>
                ) : null}

                {/* Os blocos de contexto: cada um decide se aparece, lê o seu e manda a sua fatia da manchete. */}
                <div className="flex flex-col gap-3 empty:hidden">
                    <BlocoCategoria key={`categoria:${chaveDosBlocos}`} transaction={t} onManchete={aoMudarManchete} />
                    <BlocoFatura key={`fatura:${chaveDosBlocos}`} transaction={t} onManchete={aoMudarManchete} />
                    <BlocoHistorico key={`historico:${chaveDosBlocos}`} transaction={t} onManchete={aoMudarManchete} />
                    {installmentBlock ? (
                        <BlocoParcelada
                            key={`parcelada:${chaveDosBlocos}`}
                            transaction={t}
                            plano={installmentBlock.plan}
                            resumo={installmentBlock.summary}
                            kn={installmentBlock.kn}
                            onManchete={aoMudarManchete}
                            // O plano é invisível ao convidado (RLS): ele segue no link da lista.
                            onVerParcelas={papel === "guest" ? undefined : () => setFolhaDoPlano(true)}
                        />
                    ) : null}
                    {installmentBlock && t.installment_plan_id ? (
                        <ImpactoDaParcela planoId={t.installment_plan_id} />
                    ) : null}
                    <BlocoReceitas key={`receitas:${chaveDosBlocos}`} transaction={t} onManchete={aoMudarManchete} />
                    <BlocoSaldoDoMes key={`saldo:${chaveDosBlocos}`} transaction={t} />
                    <BlocoReceitasNoTempo key={`receitas-no-tempo:${chaveDosBlocos}`} transaction={t} />
                </div>

                {/* As partes (Bloco 7C): só na carteira dividida, para o adulto. */}
                <PartesDaDespesa transaction={t} />

                {/* Com a conta paga por este lançamento, o boleto da instância aparece junto. */}
                <AnexosDoLancamento key={t.id} transaction={t} />

                <RodapeDaOrigem
                    transaction={t}
                    autor={autor ? { nome: autor, foto: membroAutor ? <FotoDoMembro membro={membroAutor} size="2xs" /> : null } : null}
                    mesmaPessoa={t.paid_by === t.user_id}
                    pagou={pagou ? { nome: pagou, foto: membroQuePagou ? <FotoDoMembro membro={membroQuePagou} size="2xs" /> : null } : null}
                />
            </DialogBody>

            {installmentBlock && papel !== "guest" ? (
                <FolhaDoPlano
                    open={open && folhaDoPlano}
                    onOpenChange={setFolhaDoPlano}
                    transaction={t}
                    plano={installmentBlock.plan}
                    resumo={installmentBlock.summary}
                    kn={installmentBlock.kn}
                    editarDesabilitado={lendoPlano}
                    onEditar={() => {
                        setFolhaDoPlano(false)
                        editarPlano()
                    }}
                    onExcluir={() => {
                        setFolhaDoPlano(false)
                        excluir()
                    }}
                    onAbrirParcela={abrirParcela}
                    onEncerrado={() => setVersaoDasParcelas((v) => v + 1)}
                />
            ) : null}
        </div>
    )

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent
                // A folha flutuante, solta das bordas, como a das notificações (pedido do dono, 08/11/2026).
                side="right"
                size="md"
                // A rampa do corpo é a da folha de notificações e do Importar (48 em cima, 24 embaixo): a de 24 cortava o ladrilho seco sob os botões.
                fillMobileViewport={isMobile}
                onOpenAutoFocus={(e) => {
                    // O foco vai ao título, e não ao primeiro botão (a seta ↑, que abriria a dica).
                    const casca = e.currentTarget as HTMLElement | null
                    const titulo = casca?.querySelector<HTMLElement>('[data-slot="dialog-title"]')
                    if (!titulo) return
                    e.preventDefault()
                    titulo.focus()
                }}
                className={cn(
                    "flex w-full flex-col gap-0 overflow-hidden p-0",
                    "[--dialog-body-fade-h:--spacing(12)] [--dialog-body-fade-end-h:--spacing(6)]",
                    isMobile && "rounded-t-modal pt-0 sm:max-w-full"
                )}
            >
                {detailMode === "edit" ? (
                    // Na troca de subtela (`useTrocaDeSubtela`) desliza a raiz de cada ramo, e não um invólucro novo:
                    // a gaveta acharia nele o meio (`acharMeio`) e o rolaria, com cabeçalho e tudo.
                    // Sem `overflow-hidden`: o título sobe à linha do × (o `-mt-8` do cabeçalho da gaveta) e
                    // o recorte o cortava em cima. Quem rola é o corpo, como no ramo do detalhe.
                    <div data-subtela-conteudo="" className="flex min-h-0 flex-1 flex-col -mt-(--drawer-handle-h,0px) pt-(--drawer-handle-h,0px) gap-0">
                        <TransactionFormSurface
                            variant="detail-sheet"
                            handleSubmit={handleSubmit}
                            fieldsProps={fieldsProps}
                            formTitle={formTitle}
                            formDescription={formDescription}
                            showFooter={showFooter}
                            submitDisabled={submitDisabled}
                            saving={saving}
                            onCancel={() => trocar("volta", () => setDetailMode("view"))}
                        />
                    </div>
                ) : (
                    viewBody
                )}
            </SheetContent>
        </Sheet>
    )
}
