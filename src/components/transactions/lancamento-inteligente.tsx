"use client"

import { useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from "react"
import {
    ArrowsRightLeftIcon,
    BanknotesIcon,
    CalendarIcon,
    CameraIcon,
    CreditCardIcon,
    PencilIcon,
    PhotoIcon,
    QueueListIcon,
    TagIcon,
    XMarkIcon,
} from "@heroicons/react/16/solid"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ColorTile } from "@/components/ui/color-tile"
import {
    Combobox,
    ComboboxContent,
    ComboboxEmpty,
    ComboboxField,
    ComboboxGroup,
    ComboboxInput,
    ComboboxItem,
    ComboboxList,
    ComboboxTrigger,
    ComboboxValue,
} from "@/components/ui/combobox"
import { DatePicker } from "@/components/ui/date-picker"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Field, FieldControl, FieldLabel } from "@/components/ui/field"
import { Form, FormActions, FormSubmit } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
    Item,
    ItemActions,
    ItemContent,
    ItemDescription,
    ItemGroup,
    ItemMedia,
    ItemTitle,
} from "@/components/ui/item"
import { SearchInput } from "@/components/ui/search-input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Caption, H4 } from "@/components/ui/typography"
import { useWorkspace } from "@/components/workspace-provider"
import { ImpactoDaParcela } from "@/components/wireframe/impacto-parcela-wireframe"
import type { useTransactionForm } from "@/components/transactions/transaction-form-use"
import type { useLeituraDoLancamento } from "@/components/transactions/use-leitura-do-lancamento"
import type { CartaoParaCasar } from "@/lib/captura/frase"
import type { CamposDaFrase } from "@/lib/captura/frase-no-form"
import {
    edicaoDoTipo,
    faltaParaLancar,
    planoDaFrase,
    tipoDoLancamento,
    type CampoDoLancamento,
    type TipoDoLancamento,
} from "@/lib/captura/lancamento-inteligente"
import { currencyBRL } from "@/lib/formatters"
import { formatMoneyBrlInput } from "@/lib/money-brl"
import { paymentMethodLabel, type PaymentMethod } from "@/lib/payment-methods"
import { addDaysYmd, formatYmdPtBr, localYmdFromDate, parseYmdLocal } from "@/lib/transaction-date"

type Leitura = ReturnType<typeof useLeituraDoLancamento>
type FormDoLancamento = ReturnType<typeof useTransactionForm>

const NAO_IDENTIFICADO = "Não identificado"

/** As linhas da revisão, na ordem do spec: todas aparecem, lidas ou não. */
const CAMPOS: { campo: CampoDoLancamento; rotulo: string; icone: ReactNode }[] = [
    { campo: "tipo", rotulo: "Tipo", icone: <ArrowsRightLeftIcon aria-hidden /> },
    { campo: "valor", rotulo: "Valor", icone: <BanknotesIcon aria-hidden /> },
    { campo: "descricao", rotulo: "Descrição", icone: <PencilIcon aria-hidden /> },
    { campo: "categoria", rotulo: "Categoria", icone: <TagIcon aria-hidden /> },
    { campo: "forma", rotulo: "Forma", icone: <CreditCardIcon aria-hidden /> },
    { campo: "data", rotulo: "Data", icone: <CalendarIcon aria-hidden /> },
    { campo: "parcelas", rotulo: "Parcelas", icone: <QueueListIcon aria-hidden /> },
]

/** A dúvida do parser que cada linha confere ("Confira"). */
const DUVIDA_DA_LINHA: Partial<Record<CampoDoLancamento, string>> = {
    valor: "valor",
    descricao: "descricao",
    categoria: "categoria",
    forma: "cartao",
    data: "data",
    parcelas: "parcelas",
}

const MOTIVO_DA_FALTA: Partial<Record<CampoDoLancamento, string>> = {
    valor: "Falta o valor",
    forma: "Falta o cartão",
}

const TIPOS: { tipo: TipoDoLancamento; rotulo: string }[] = [
    { tipo: "despesa", rotulo: "Despesa" },
    { tipo: "receita", rotulo: "Receita" },
    { tipo: "parcelada", rotulo: "Parcelada" },
    { tipo: "estorno", rotulo: "Estorno" },
]

/** Pix e débito antes do crédito; dinheiro por último. */
const FORMAS_ANTES_DO_CREDITO: PaymentMethod[] = ["pix", "debit_card"]

/** De 2 a 48, a régua do formulário. */
const PARCELAS = Array.from({ length: 47 }, (_, i) => i + 2)

const SEM_CATEGORIA = "__sem__"

/** O valor do `Select` da forma: o cartão leva o id junto. */
function valorDaForma(c: CamposDaFrase): string {
    if (c.paymentMethod === "credit_card" && c.creditCardId) return `cartao:${c.creditCardId}`
    return c.paymentMethod ?? ""
}

function formaDoValor(v: string): Partial<CamposDaFrase> {
    if (v.startsWith("cartao:")) return { paymentMethod: "credit_card", creditCardId: v.slice("cartao:".length) }
    return { paymentMethod: v as PaymentMethod, creditCardId: null }
}

function primeiraImagem(arquivos: FileList | null | undefined) {
    return Array.from(arquivos ?? []).find((f) => f.type.startsWith("image/"))
}

/**
 * O lançamento inteligente: o campo da frase (a pílula da busca) com a pílula
 * redonda do recibo ao lado, e nada mais até o Enter. O Enter lê a frase (a IA
 * uma vez, se o valor ou a descrição ficarem em dúvida) e abre a revisão
 * embaixo: todos os campos, cada um editável no lugar, e o "Aprovar". Só
 * apresentação — a leitura é do `useLeituraDoLancamento`, que quem monta a
 * tela chama uma vez, e salvar é o `salvar()` do formulário.
 *
 * A casca é o `Dialog` (gaveta no telefone) e não o `CommandDialog`: o cmdk
 * chama `preventDefault` em todo Enter e nas setas, e a revisão é um `Form` com
 * `Select`, `Combobox` e `DatePicker` dentro.
 */
export function LancamentoInteligente({
    open,
    onOpenChange,
    leitura,
    form,
    cartoes,
    onAbrirFormulario,
    saving,
}: {
    open: boolean
    onOpenChange: (open: boolean) => void
    leitura: Leitura
    form: FormDoLancamento
    cartoes: CartaoParaCasar[]
    onAbrirFormulario: () => void
    saving: boolean
}) {
    const arquivoRef = useRef<HTMLInputElement>(null)
    const { lerFoto, lendoIA, campos, foto } = leitura

    return (
        <Dialog surface="auto" open={open} onOpenChange={onOpenChange} pending={saving}>
            <DialogContent
                showCloseButton={false}
                onPaste={(e) => {
                    // Texto colado vence: copiar de um app traz o texto e, às vezes, a imagem dele.
                    if (e.clipboardData.getData("text/plain").trim()) return
                    const imagem = primeiraImagem(e.clipboardData?.files)
                    if (!imagem) return
                    e.preventDefault()
                    void lerFoto(imagem)
                }}
                onDragOver={(e) => {
                    // Sem o `preventDefault` do arrastar, o navegador não entrega o soltar.
                    if (e.dataTransfer.types.includes("Files")) e.preventDefault()
                }}
                onDrop={(e) => {
                    const imagem = primeiraImagem(e.dataTransfer.files)
                    if (!imagem) return
                    e.preventDefault()
                    void lerFoto(imagem)
                }}
            >
                <DialogHeader className="sr-only">
                    <DialogTitle>Lançamento inteligente</DialogTitle>
                    <DialogDescription>
                        Escreva o lançamento numa frase ou fotografe o recibo, dê Enter, confira o que o app entendeu e
                        aprove.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex min-w-0 flex-col">
                    <div className="flex items-center gap-2">
                        <SearchInput
                            surface="modal"
                            type="text"
                            enterKeyHint="go"
                            autoFocus
                            aria-label="Frase do lançamento"
                            placeholder="Ex.: 42 mercado nubank"
                            value={leitura.texto}
                            onChange={(e) => leitura.setTexto(e.target.value)}
                            pending={lendoIA}
                            disabled={saving}
                            onKeyDown={(e) => {
                                // Enter lê a frase (não salva); o que fecha um acento (IME do Mac e do iOS) não lê.
                                if (e.key === "Enter" && !e.nativeEvent.isComposing) {
                                    e.preventDefault()
                                    leitura.interpretar()
                                }
                            }}
                        />
                        <Button
                            variant="floating"
                            size="icon-lg"
                            aria-label="Adicionar recibo"
                            disabled={saving}
                            onClick={() => arquivoRef.current?.click()}
                        >
                            <CameraIcon aria-hidden />
                        </Button>
                    </div>

                    <Input
                        ref={arquivoRef}
                        type="file"
                        accept="image/*"
                        capture="environment"
                        className="hidden"
                        onChange={(e) => {
                            const imagem = e.target.files?.[0]
                            // Escolher a mesma foto de novo precisa disparar o `change`.
                            e.target.value = ""
                            if (imagem) void leitura.lerFoto(imagem)
                        }}
                    />

                    {/* Cota, rede, imagem que não abre, "Lendo com IA…": vazio, não ocupa lugar. */}
                    <Caption role="status" className="mt-2 px-1.5 empty:mt-0">
                        {lendoIA ? (foto ? "Lendo o recibo com IA…" : "Lendo com IA…") : leitura.aviso}
                    </Caption>

                    {campos && !lendoIA ? (
                        <Revisao
                            campos={campos}
                            leitura={leitura}
                            form={form}
                            cartoes={cartoes}
                            saving={saving}
                            onAbrirFormulario={onAbrirFormulario}
                        />
                    ) : null}
                </div>
            </DialogContent>
        </Dialog>
    )
}

/** A miniatura do recibo no topo da revisão, com o × que a tira. */
function MiniaturaDoRecibo({ foto, onTirar, disabled }: { foto: File; onTirar: () => void; disabled: boolean }) {
    const [url, setUrl] = useState<string | null>(null)
    /* eslint-disable react-hooks/set-state-in-effect -- a URL do arquivo nasce e é revogada com ele */
    useEffect(() => {
        const criada = URL.createObjectURL(foto)
        setUrl(criada)
        return () => URL.revokeObjectURL(criada)
    }, [foto])
    /* eslint-enable react-hooks/set-state-in-effect */
    return (
        <Item variant="flush" size="sm">
            <ItemMedia>
                <Avatar size="md">
                    {url ? <AvatarImage src={url} alt="Foto do recibo" /> : null}
                    <AvatarFallback>
                        <PhotoIcon aria-hidden />
                    </AvatarFallback>
                </Avatar>
            </ItemMedia>
            <ItemContent>
                <ItemTitle>Recibo</ItemTitle>
            </ItemContent>
            <ItemActions>
                <Button variant="tertiary" size="icon-md" aria-label="Tirar a foto" disabled={disabled} onClick={onTirar}>
                    <XMarkIcon aria-hidden />
                </Button>
            </ItemActions>
        </Item>
    )
}

function Revisao({
    campos,
    leitura,
    form,
    cartoes,
    saving,
    onAbrirFormulario,
}: {
    campos: CamposDaFrase
    leitura: Leitura
    form: FormDoLancamento
    cartoes: CartaoParaCasar[]
    saving: boolean
    onAbrirFormulario: () => void
}) {
    const [editando, setEditando] = useState<CampoDoLancamento | null>(null)
    // A máscara do valor em edição: o `Input money` é controlado pela string digitada.
    const [valorDigitado, setValorDigitado] = useState("")
    const hoje = localYmdFromDate(new Date())
    // O convidado não lança receita, como no formulário (a leitura já a vira despesa).
    const tipos =
        useWorkspace().papel === "guest" ? TIPOS.filter((t) => t.tipo !== "receita" && t.tipo !== "estorno") : TIPOS

    const { categories } = form.fieldsProps
    const cartoesAtivos = cartoes.filter((c) => c.is_active)
    const falta = faltaParaLancar(campos, cartoesAtivos.length)
    const tipo = tipoDoLancamento(campos)
    const plano = planoDaFrase(campos)
    const categoriasDoTipo = categories.filter((c) => c.type === campos.tipo)
    const categoria = categories.find((c) => c.id === campos.categoryId)
    const leuComIA = campos.duvidas.includes("ia")

    function rotuloDaData(ymd: string) {
        if (ymd === hoje) return "Hoje"
        if (ymd === addDaysYmd(hoje, -1)) return "Ontem"
        return formatYmdPtBr(ymd)
    }

    function rotuloDaForma(c: CamposDaFrase) {
        const cartao = cartoes.find((x) => x.id === c.creditCardId)?.name
        if (c.paymentMethod === "credit_card" || (c.estorno && cartao)) return cartao ? `Crédito · ${cartao}` : "Crédito"
        return c.paymentMethod ? paymentMethodLabel(c.paymentMethod) : null
    }

    /** O que a linha mostra; `null` é o "Não identificado". */
    function valorDaLinha(campo: CampoDoLancamento): string | null {
        switch (campo) {
            case "tipo":
                return TIPOS.find((t) => t.tipo === tipo)?.rotulo ?? null
            case "valor":
                return campos.valor != null ? currencyBRL(campos.valor) : null
            case "descricao":
                return campos.descricao || null
            case "categoria":
                return categoria?.name ?? null
            case "forma":
                return rotuloDaForma(campos)
            case "data":
                return rotuloDaData(campos.data)
            case "parcelas":
                return campos.parcelas != null ? `${campos.parcelas}×` : null
        }
    }

    function abrir(campo: CampoDoLancamento) {
        if (campo === "valor") setValorDigitado(campos.valor != null ? formatMoneyBrlInput(campos.valor) : "")
        setEditando(campo)
    }

    /** Confirmar volta à linha, com o foco nela. */
    function fechar() {
        const campo = editando
        setEditando(null)
        requestAnimationFrame(() => document.getElementById(`lancamento-${campo}`)?.focus())
    }

    /** O Enter de um campo em edição confirma a edição, e não aprova o lançamento. */
    function confirmaComEnter(e: KeyboardEvent) {
        if (e.key === "Enter" && !e.nativeEvent.isComposing) {
            e.preventDefault()
            fechar()
        }
    }

    function editor(campo: CampoDoLancamento): ReactNode {
        switch (campo) {
            case "tipo":
                return (
                    <Select
                        value={tipo}
                        onValueChange={(v) => leitura.editar("tipo", edicaoDoTipo(campos, v as TipoDoLancamento, categories))}
                    >
                        <FieldControl>
                            <SelectTrigger autoFocus>
                                <SelectValue />
                            </SelectTrigger>
                        </FieldControl>
                        <SelectContent>
                            {tipos.map((t) => (
                                <SelectItem key={t.tipo} value={t.tipo}>
                                    {t.rotulo}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                )
            case "valor":
                return (
                    <FieldControl>
                        <Input
                            money
                            autoFocus
                            placeholder="0,00"
                            value={valorDigitado}
                            onValueChange={(texto, reais) => {
                                setValorDigitado(texto)
                                leitura.editar("valor", { valor: reais })
                            }}
                            onKeyDown={confirmaComEnter}
                        />
                    </FieldControl>
                )
            case "descricao":
                return (
                    <FieldControl>
                        <Input
                            autoFocus
                            placeholder="Ex.: Mercado"
                            value={campos.descricao}
                            onChange={(e) => leitura.editar("descricao", { descricao: e.target.value })}
                            onKeyDown={confirmaComEnter}
                        />
                    </FieldControl>
                )
            case "categoria":
                return (
                    <Combobox
                        value={campos.categoryId ?? SEM_CATEGORIA}
                        onValueChange={(v: string) =>
                            leitura.editar("categoria", {
                                categoryId: v === SEM_CATEGORIA ? null : v,
                                motivoDaCategoria: null,
                            })
                        }
                    >
                        <ComboboxField>
                            <FieldControl>
                                <ComboboxTrigger autoFocus>
                                    <ComboboxValue
                                        placeholder="Escolher categoria"
                                        media={categoria ? <ColorTile size="xs" color={categoria.color} /> : undefined}
                                    >
                                        {categoria?.name}
                                    </ComboboxValue>
                                </ComboboxTrigger>
                            </FieldControl>
                        </ComboboxField>
                        <ComboboxContent>
                            <ComboboxInput placeholder="Buscar categoria…" />
                            <ComboboxList>
                                <ComboboxEmpty>Nenhuma categoria com esse nome.</ComboboxEmpty>
                                <ComboboxGroup>
                                    <ComboboxItem value={SEM_CATEGORIA} variant="none">
                                        Sem categoria
                                    </ComboboxItem>
                                    {categoriasDoTipo.map((c) => (
                                        <ComboboxItem key={c.id} value={c.id} media={<ColorTile size="xs" color={c.color} />}>
                                            {c.name}
                                        </ComboboxItem>
                                    ))}
                                </ComboboxGroup>
                            </ComboboxList>
                        </ComboboxContent>
                    </Combobox>
                )
            case "forma":
                return (
                    <Select value={valorDaForma(campos)} onValueChange={(v) => leitura.editar("forma", formaDoValor(v))}>
                        <FieldControl>
                            <SelectTrigger autoFocus>
                                <SelectValue placeholder="Escolher a forma" />
                            </SelectTrigger>
                        </FieldControl>
                        <SelectContent>
                            {FORMAS_ANTES_DO_CREDITO.map((f) => (
                                <SelectItem key={f} value={f}>
                                    {paymentMethodLabel(f)}
                                </SelectItem>
                            ))}
                            {cartoesAtivos.length > 0 ? (
                                cartoesAtivos.map((c) => (
                                    <SelectItem key={c.id} value={`cartao:${c.id}`}>
                                        Crédito · {c.name}
                                    </SelectItem>
                                ))
                            ) : (
                                <SelectItem value="credit_card">Crédito</SelectItem>
                            )}
                            <SelectItem value="cash">{paymentMethodLabel("cash")}</SelectItem>
                        </SelectContent>
                    </Select>
                )
            case "data":
                return (
                    <FieldControl>
                        <DatePicker
                            value={parseYmdLocal(campos.data)}
                            onChange={(d) => leitura.editar("data", { data: localYmdFromDate(d ?? new Date()) })}
                            displayStyle="relative"
                            presets
                        />
                    </FieldControl>
                )
            case "parcelas":
                return (
                    <Select
                        value={campos.parcelas != null ? String(campos.parcelas) : ""}
                        // Escolher parcelas faz da despesa uma parcelada.
                        onValueChange={(v) =>
                            leitura.editar("parcelas", edicaoDoTipo(campos, "parcelada", categories, Number(v)))
                        }
                    >
                        <FieldControl>
                            <SelectTrigger autoFocus>
                                <SelectValue placeholder="Escolher parcelas" />
                            </SelectTrigger>
                        </FieldControl>
                        <SelectContent>
                            {PARCELAS.map((n) => (
                                <SelectItem key={n} value={String(n)}>
                                    {n}×
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                )
        }
    }

    return (
        <Form
            className="mt-4"
            pending={saving}
            onSubmit={(e) => {
                e.preventDefault()
                return leitura.aprovar()
            }}
        >
            {leitura.foto ? (
                <MiniaturaDoRecibo foto={leitura.foto} onTirar={leitura.tirarFoto} disabled={saving} />
            ) : null}

            <div className="flex items-center gap-2">
                <H4>Confira o lançamento</H4>
                {leuComIA ? (
                    <Badge size="xs" tone="info">
                        IA
                    </Badge>
                ) : null}
            </div>

            <ItemGroup variant="divided">
                {CAMPOS.map((x) => {
                    if (editando === x.campo) {
                        return (
                            <Field key={x.campo} size="sm">
                                <FieldLabel>{x.rotulo}</FieldLabel>
                                <div className="flex items-center gap-2">
                                    <div className="min-w-0 flex-1">{editor(x.campo)}</div>
                                    <Button variant="secondary" onClick={fechar}>
                                        ok
                                    </Button>
                                </div>
                            </Field>
                        )
                    }
                    const valor = valorDaLinha(x.campo)
                    const duvida = DUVIDA_DA_LINHA[x.campo]
                    const confira = duvida != null && campos.duvidas.includes(duvida)
                    return (
                        <Item key={x.campo} variant="flush" size="sm" interactive asChild>
                            <button
                                type="button"
                                id={`lancamento-${x.campo}`}
                                disabled={saving}
                                onClick={() => abrir(x.campo)}
                            >
                                <ItemMedia variant="icon">
                                    {x.campo === "categoria" && categoria ? (
                                        <ColorTile size="xs" color={categoria.color} />
                                    ) : (
                                        x.icone
                                    )}
                                </ItemMedia>
                                <ItemContent>
                                    <ItemTitle>{x.rotulo}</ItemTitle>
                                    {x.campo === "tipo" && campos.motivoDoTipo ? (
                                        <ItemDescription>por causa de “{campos.motivoDoTipo}”</ItemDescription>
                                    ) : null}
                                </ItemContent>
                                <ItemActions>
                                    {confira ? (
                                        <Badge size="xs" tone="warning">
                                            Confira
                                        </Badge>
                                    ) : leuComIA && valor ? (
                                        <Badge size="xs" tone="info">
                                            IA
                                        </Badge>
                                    ) : null}
                                    <span className={valor ? "nums text-sm" : "text-sm text-muted-foreground"}>
                                        {valor ?? NAO_IDENTIFICADO}
                                    </span>
                                </ItemActions>
                            </button>
                        </Item>
                    )
                })}
            </ItemGroup>

            {plano ? <ImpactoDaParcela proposto={plano} /> : null}

            <FormActions>
                {falta ? (
                    <Caption id="lancamento-falta" className="self-center sm:me-auto">
                        {MOTIVO_DA_FALTA[falta]}
                    </Caption>
                ) : null}
                <Button variant="tertiary" disabled={saving} onClick={onAbrirFormulario}>
                    formulário completo
                </Button>
                <FormSubmit disabled={falta != null} aria-describedby={falta ? "lancamento-falta" : undefined}>
                    Aprovar
                </FormSubmit>
            </FormActions>
        </Form>
    )
}
