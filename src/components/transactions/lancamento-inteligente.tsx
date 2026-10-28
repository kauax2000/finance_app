"use client"

import { useEffect, useRef, useState, type ReactNode } from "react"
import {
    ArrowsRightLeftIcon,
    BanknotesIcon,
    CalendarIcon,
    CameraIcon,
    CreditCardIcon,
    DocumentTextIcon,
    PencilIcon,
    PhotoIcon,
    QueueListIcon,
    SparklesIcon,
    TagIcon,
    XMarkIcon,
} from "@heroicons/react/16/solid"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ColorTile } from "@/components/ui/color-tile"
import {
    CommandDialog,
    CommandDock,
    CommandDockItem,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandItemArrow,
    CommandItemDescription,
    CommandItemIcon,
    CommandItemMeta,
    CommandItemTitle,
    CommandList,
    CommandLoading,
    CommandPage,
    CommandPages,
    useCommandPages,
} from "@/components/ui/command"
import { Input } from "@/components/ui/input"
import { Kbd } from "@/components/ui/kbd"
import { KbdGroup } from "@/components/ui/kbd-group"
import { Spinner } from "@/components/ui/spinner"
import { Caption } from "@/components/ui/typography"
import { ImpactoDaParcela } from "@/components/wireframe/impacto-parcela-wireframe"
import type { useTransactionForm } from "@/components/transactions/transaction-form-use"
import type { useLeituraDoLancamento } from "@/components/transactions/use-leitura-do-lancamento"
import { DEFAULT_INSTALLMENT_COUNT } from "@/components/transactions/transaction-form-types"
import { interpretarFrase, type CartaoParaCasar } from "@/lib/captura/frase"
import type { CamposDaFrase } from "@/lib/captura/frase-no-form"
import {
    faltaParaLancar,
    planoDaFrase,
    precisaDeIA,
    rotuloDaAcao,
    tipoDoLancamento,
    type CampoDoLancamento,
    type TipoDoLancamento,
} from "@/lib/captura/lancamento-inteligente"
import { commandFilter } from "@/lib/command-filter"
import { currencyBRL } from "@/lib/formatters"
import { parseMoneyBrl } from "@/lib/money-brl"
import { paymentMethodLabel, type PaymentMethod } from "@/lib/payment-methods"
import { addDaysYmd, formatYmdPtBr, localYmdFromDate } from "@/lib/transaction-date"

type Leitura = ReturnType<typeof useLeituraDoLancamento>
type Form = ReturnType<typeof useTransactionForm>

const EXEMPLOS = ["42 mercado nubank", "salário 5000 dia 5", "tv 3000 em 10x no inter"]

const CAMPOS: { campo: CampoDoLancamento; rotulo: string; icone: ReactNode; placeholder: string }[] = [
    { campo: "valor", rotulo: "Valor", icone: <BanknotesIcon aria-hidden />, placeholder: "Digite o valor" },
    { campo: "descricao", rotulo: "Descrição", icone: <PencilIcon aria-hidden />, placeholder: "Digite a descrição" },
    { campo: "tipo", rotulo: "Tipo", icone: <ArrowsRightLeftIcon aria-hidden />, placeholder: "Escolha o tipo" },
    { campo: "categoria", rotulo: "Categoria", icone: <TagIcon aria-hidden />, placeholder: "Buscar categoria" },
    { campo: "forma", rotulo: "Forma", icone: <CreditCardIcon aria-hidden />, placeholder: "Escolha a forma" },
    { campo: "data", rotulo: "Data", icone: <CalendarIcon aria-hidden />, placeholder: "Hoje, ontem, dia 5, sexta…" },
    { campo: "parcelas", rotulo: "Parcelas", icone: <QueueListIcon aria-hidden />, placeholder: "De 2 a 48 parcelas" },
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

const PARCELAS_SUGERIDAS = [2, 3, 6, 10, 12]

/**
 * A paleta do lançamento inteligente: a frase (ou a foto do recibo) na pílula,
 * a revisão na placa e o "Lançar" em destaque. Só apresentação — a leitura é
 * do `useLeituraDoLancamento`, que quem monta a paleta chama uma vez, e salvar
 * é o `salvar()` do formulário. A lista da página de categoria vem do
 * formulário, que tem a cor.
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
    form: Form
    cartoes: CartaoParaCasar[]
    onAbrirFormulario: () => void
    saving: boolean
}) {
    // A linha selecionada é controlada: a cada frase nova volta ao "Lançar",
    // para o Enter aprovar. O cmdk escolhe a primeira linha habilitada quando
    // o texto muda, e o "Lançar" é a primeira.
    const [selecao, setSelecao] = useState({ texto: leitura.texto, valor: "" })
    const valor = selecao.texto === leitura.texto ? selecao.valor : leitura.campos ? "lancar" : ""
    const { lerFoto } = leitura

    function primeiraImagem(arquivos: FileList | null | undefined) {
        return Array.from(arquivos ?? []).find((f) => f.type.startsWith("image/"))
    }

    return (
        <CommandDialog
            open={open}
            onOpenChange={onOpenChange}
            pending={saving}
            title="Lançamento inteligente"
            description="Escreva o lançamento numa frase ou fotografe o recibo, confira o que o app entendeu e lance."
            commandProps={{
                shouldFilter: false,
                autoSelectFirst: true,
                value: valor,
                onValueChange: (v) => setSelecao({ texto: leitura.texto, valor: v }),
                onKeyDown: (e) => {
                    // O Enter que fecha um acento (IME do Mac e do iOS) não lança.
                    if (e.key === "Enter" && e.nativeEvent.isComposing) e.preventDefault()
                },
                onPaste: (e) => {
                    // Texto colado vence: copiar de um app traz o texto e, às vezes, a imagem dele.
                    if (e.clipboardData.getData("text/plain").trim()) return
                    const imagem = primeiraImagem(e.clipboardData?.files)
                    if (!imagem) return
                    e.preventDefault()
                    void lerFoto(imagem)
                },
                onDragOver: (e) => {
                    // Sem o `preventDefault` do arrastar, o navegador não entrega o soltar.
                    if (e.dataTransfer.types.includes("Files")) e.preventDefault()
                },
                onDrop: (e) => {
                    const imagem = primeiraImagem(e.dataTransfer.files)
                    if (!imagem) return
                    e.preventDefault()
                    void lerFoto(imagem)
                },
            }}
        >
            {/* O conteúdo desmonta ao fechar, e com ele a pilha das páginas. */}
            <CommandPages>
                <Paleta
                    leitura={leitura}
                    form={form}
                    cartoes={cartoes}
                    saving={saving}
                    onAbrirFormulario={onAbrirFormulario}
                />
            </CommandPages>
        </CommandDialog>
    )
}

/** A miniatura do recibo na pílula, com o × que a tira. */
function MiniaturaDoRecibo({ foto, onTirar }: { foto: File; onTirar: () => void }) {
    const [url, setUrl] = useState<string | null>(null)
    /* eslint-disable react-hooks/set-state-in-effect -- a URL do arquivo nasce e é revogada com ele */
    useEffect(() => {
        const criada = URL.createObjectURL(foto)
        setUrl(criada)
        return () => URL.revokeObjectURL(criada)
    }, [foto])
    /* eslint-enable react-hooks/set-state-in-effect */
    return (
        <span className="-ms-1 inline-flex shrink-0 items-center">
            <Avatar size="xs">
                {url ? <AvatarImage src={url} alt="Foto do recibo" /> : null}
                <AvatarFallback>
                    <PhotoIcon aria-hidden />
                </AvatarFallback>
            </Avatar>
            <Button variant="tertiary" size="icon-xs" aria-label="Tirar a foto" onClick={onTirar}>
                <XMarkIcon aria-hidden />
            </Button>
        </span>
    )
}

function Paleta({
    leitura,
    form,
    cartoes,
    saving,
    onAbrirFormulario,
}: {
    leitura: Leitura
    form: Form
    cartoes: CartaoParaCasar[]
    saving: boolean
    onAbrirFormulario: () => void
}) {
    const pages = useCommandPages()
    const pagina = pages.current as CampoDoLancamento | undefined
    const [busca, setBusca] = useState("")
    const inputRef = useRef<HTMLInputElement>(null)
    const arquivoRef = useRef<HTMLInputElement>(null)
    const { campos, lendoIA, foto } = leitura
    const hoje = localYmdFromDate(new Date())

    // O `CommandInput` esvazia o campo ao montar e a cada troca de página (num
    // efeito do filho, que roda antes deste). Na raiz o campo é a frase, e
    // essa limpeza a apagaria — a do compartilhar, ou a escrita antes de
    // editar um campo. A janela vai da limpeza deste efeito (que roda antes
    // dos efeitos novos, e no ensaio do modo estrito) até ele rodar de novo.
    const esperandoLimpeza = useRef(true)
    useEffect(() => {
        esperandoLimpeza.current = false
        return () => {
            esperandoLimpeza.current = true
        }
    }, [pages.stack.length])

    const cartoesAtivos = cartoes.filter((c) => c.is_active)
    const falta = campos ? faltaParaLancar(campos, cartoesAtivos.length) : null
    // Sem valor ou descrição, o "Lançar" pede à IA primeiro: travar o deixaria sem saída.
    const lancarTravado = saving || lendoIA || (falta != null && !(campos && precisaDeIA(campos)))
    const tipo = campos ? tipoDoLancamento(campos) : null
    const plano = planoDaFrase(campos)
    const categoriasDoTipo = form.fieldsProps.categories.filter((c) => c.type === (campos?.tipo ?? "expense"))

    const dias: { ymd: string; rotulo: string }[] = [
        { ymd: hoje, rotulo: "Hoje" },
        { ymd: addDaysYmd(hoje, -1), rotulo: "Ontem" },
        { ymd: addDaysYmd(hoje, -2), rotulo: "Anteontem" },
    ]
    const rotuloDaData = (ymd: string) => dias.find((d) => d.ymd === ymd)?.rotulo ?? formatYmdPtBr(ymd)

    function nomeDoCartao(id: string | null) {
        return cartoes.find((c) => c.id === id)?.name ?? null
    }

    function rotuloDaForma(c: CamposDaFrase) {
        const cartao = nomeDoCartao(c.creditCardId)
        if (c.paymentMethod === "credit_card" || (c.estorno && cartao)) return cartao ? `Crédito · ${cartao}` : "Crédito"
        return c.paymentMethod ? paymentMethodLabel(c.paymentMethod) : "Não informada"
    }

    function valorDaLinha(campo: CampoDoLancamento, c: CamposDaFrase): ReactNode {
        switch (campo) {
            case "valor":
                return c.valor != null ? currencyBRL(c.valor) : "Sem valor"
            case "descricao":
                return c.descricao || "Sem descrição"
            case "tipo":
                return TIPOS.find((t) => t.tipo === tipo)?.rotulo
            case "categoria":
                return form.fieldsProps.categories.find((x) => x.id === c.categoryId)?.name ?? "Sem categoria"
            case "forma":
                return rotuloDaForma(c)
            case "data":
                return rotuloDaData(c.data)
            case "parcelas":
                return c.parcelas != null ? `${c.parcelas}×` : "—"
        }
    }

    /** Editar volta à raiz, onde a frase continua escrita. */
    function escolher(campo: CampoDoLancamento, parcial: Partial<CamposDaFrase>) {
        leitura.editar(campo, parcial)
        pages.pop()
        inputRef.current?.focus()
    }

    function escolherTipo(novo: TipoDoLancamento) {
        const receita = novo === "receita" || novo === "estorno"
        const parcial: Partial<CamposDaFrase> = {
            tipo: receita ? "income" : "expense",
            estorno: novo === "estorno",
            parcelas:
                novo === "parcelada"
                    ? campos?.parcelas != null && campos.parcelas >= 2
                        ? campos.parcelas
                        : Number(DEFAULT_INSTALLMENT_COUNT)
                    : null,
        }
        // A categoria do outro tipo não serve.
        const categoria = form.fieldsProps.categories.find((x) => x.id === campos?.categoryId)
        if (categoria && categoria.type !== parcial.tipo) parcial.categoryId = null
        // O estorno abate uma fatura: a forma é o cartão.
        if (novo === "estorno") parcial.paymentMethod = "credit_card"
        escolher("tipo", parcial)
    }

    function abrirCampo(campo: CampoDoLancamento) {
        const meta = CAMPOS.find((x) => x.campo === campo)!
        pages.push({ id: campo, label: meta.rotulo, icon: meta.icone })
        inputRef.current?.focus()
    }

    function fotografar() {
        arquivoRef.current?.click()
    }

    const valorDigitado = parseMoneyBrl(busca)
    const parcelasDigitadas = /^\d+$/.test(busca.trim()) ? Number(busca.trim()) : null
    const dataDigitada = (() => {
        if (!busca.trim()) return null
        const lida = interpretarFrase(busca, hoje)
        // Sem palavra de data, o parser fica em hoje: "Hoje" já está na lista.
        return lida.duvidas.includes("data") || lida.data === hoje ? null : lida.data
    })()
    const categoriasVistas = busca.trim()
        ? categoriasDoTipo.filter((c) => commandFilter(c.name, busca) > 0)
        : categoriasDoTipo
    const metaDaPagina = CAMPOS.find((x) => x.campo === pagina)

    const linhaDaFoto = !foto ? (
        <CommandItem value="foto" onSelect={fotografar}>
            <CommandItemIcon>
                <CameraIcon />
            </CommandItemIcon>
            <CommandItemTitle>Fotografar recibo</CommandItemTitle>
            <CommandItemArrow />
        </CommandItem>
    ) : null

    return (
        <>
            <CommandInput
                ref={inputRef}
                autoFocus
                aria-label={metaDaPagina ? metaDaPagina.rotulo : "Frase do lançamento"}
                placeholder={metaDaPagina ? metaDaPagina.placeholder : "Ex.: 42 mercado nubank"}
                value={pagina ? busca : leitura.texto}
                onValueChange={(v) => {
                    if (pagina) setBusca(v)
                    else if (v || !esperandoLimpeza.current) leitura.setTexto(v)
                }}
                // Na raiz a miniatura do recibo; numa página, o escopo dela (do `CommandPages`).
                leading={!pagina && foto ? <MiniaturaDoRecibo foto={foto} onTirar={leitura.tirarFoto} /> : undefined}
            />

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

            <CommandList>
                <CommandPage>
                    {campos ? (
                        <CommandItem value="lancar" disabled={lancarTravado} onSelect={() => void leitura.lancar()}>
                            <CommandItemIcon>{saving ? <Spinner size="sm" /> : <SparklesIcon />}</CommandItemIcon>
                            <CommandItemTitle>{rotuloDaAcao(campos)}</CommandItemTitle>
                            <CommandItemMeta>
                                {falta ? (
                                    <CommandItemDescription>{MOTIVO_DA_FALTA[falta]}</CommandItemDescription>
                                ) : null}
                                <CommandItemArrow variant="add" />
                            </CommandItemMeta>
                        </CommandItem>
                    ) : null}

                    {/* Cota, rede, imagem que não abre: a falha aparece aqui, e a revisão segue usável. */}
                    <Caption role="status" className="px-1.5">
                        {leitura.aviso}
                    </Caption>

                    {lendoIA ? (
                        <CommandLoading label="Lendo com IA">
                            <Spinner size="sm" />
                            {foto ? "Lendo o recibo com IA…" : "Lendo com IA…"}
                        </CommandLoading>
                    ) : campos ? (
                        <CommandGroup
                            heading={
                                campos.duvidas.includes("ia") ? (
                                    <span className="inline-flex items-center gap-1.5">
                                        Entendi
                                        <Badge size="xs" tone="info">
                                            IA
                                        </Badge>
                                    </span>
                                ) : (
                                    "Entendi"
                                )
                            }
                        >
                            {CAMPOS.filter((x) => x.campo !== "parcelas" || tipo === "parcelada").map((x) => {
                                const duvida = DUVIDA_DA_LINHA[x.campo]
                                return (
                                    <CommandItem
                                        key={x.campo}
                                        value={`campo:${x.campo}`}
                                        disabled={saving}
                                        // O toque não tira o foco do campo: no telefone o teclado segue aberto.
                                        onMouseDown={(e) => e.preventDefault()}
                                        onSelect={() => abrirCampo(x.campo)}
                                    >
                                        <CommandItemIcon>
                                            {x.campo === "categoria" && campos.categoryId ? (
                                                <ColorTile
                                                    size="xs"
                                                    color={
                                                        form.fieldsProps.categories.find((c) => c.id === campos.categoryId)
                                                            ?.color ?? null
                                                    }
                                                />
                                            ) : (
                                                x.icone
                                            )}
                                        </CommandItemIcon>
                                        <CommandItemTitle>{x.rotulo}</CommandItemTitle>
                                        <CommandItemMeta>
                                            {duvida && campos.duvidas.includes(duvida) ? (
                                                <Badge size="xs" tone="warning">
                                                    Confira
                                                </Badge>
                                            ) : null}
                                            <CommandItemDescription className="nums">
                                                {valorDaLinha(x.campo, campos)}
                                                {x.campo === "tipo" && campos.motivoDoTipo
                                                    ? ` · por causa de “${campos.motivoDoTipo}”`
                                                    : null}
                                            </CommandItemDescription>
                                            <CommandItemArrow />
                                        </CommandItemMeta>
                                    </CommandItem>
                                )
                            })}
                        </CommandGroup>
                    ) : (
                        <CommandGroup heading="Experimente">
                            {EXEMPLOS.map((exemplo, i) => (
                                <CommandItem
                                    key={exemplo}
                                    value={`exemplo:${i}`}
                                    onMouseDown={(e) => e.preventDefault()}
                                    onSelect={() => leitura.setTexto(exemplo)}
                                >
                                    <CommandItemIcon>
                                        <SparklesIcon />
                                    </CommandItemIcon>
                                    <CommandItemTitle>{exemplo}</CommandItemTitle>
                                    <CommandItemArrow />
                                </CommandItem>
                            ))}
                            {linhaDaFoto}
                        </CommandGroup>
                    )}

                    {plano && !lendoIA ? <ImpactoDaParcela proposto={plano} /> : null}

                    {campos ? (
                        <CommandGroup>
                            {linhaDaFoto}
                            <CommandItem value="formulario" disabled={saving} onSelect={onAbrirFormulario}>
                                <CommandItemIcon>
                                    <DocumentTextIcon />
                                </CommandItemIcon>
                                <CommandItemTitle>Abrir formulário completo</CommandItemTitle>
                                <CommandItemArrow />
                            </CommandItem>
                        </CommandGroup>
                    ) : null}
                </CommandPage>

                <CommandPage id="tipo">
                    {TIPOS.map((t) => (
                        <CommandItem key={t.tipo} value={`tipo:${t.tipo}`} onSelect={() => escolherTipo(t.tipo)}>
                            <CommandItemTitle>{t.rotulo}</CommandItemTitle>
                            {t.tipo === tipo ? (
                                <CommandItemMeta>
                                    <CommandItemDescription>Atual</CommandItemDescription>
                                </CommandItemMeta>
                            ) : null}
                        </CommandItem>
                    ))}
                </CommandPage>

                <CommandPage id="valor">
                    {valorDigitado != null && valorDigitado > 0 ? (
                        <CommandItem value="usar:valor" onSelect={() => escolher("valor", { valor: valorDigitado })}>
                            <CommandItemTitle className="nums">Usar {currencyBRL(valorDigitado)}</CommandItemTitle>
                        </CommandItem>
                    ) : (
                        <Caption className="px-1.5 py-2">Digite o valor, como 42 ou 42,90.</Caption>
                    )}
                </CommandPage>

                <CommandPage id="descricao">
                    {busca.trim() ? (
                        <CommandItem
                            value="usar:descricao"
                            onSelect={() => escolher("descricao", { descricao: busca.trim() })}
                        >
                            <CommandItemTitle>Usar “{busca.trim()}”</CommandItemTitle>
                        </CommandItem>
                    ) : (
                        <Caption className="px-1.5 py-2">
                            {campos?.descricao ? `Atual: ${campos.descricao}` : "Digite a descrição."}
                        </Caption>
                    )}
                </CommandPage>

                <CommandPage id="categoria">
                    <CommandEmpty>Nenhuma categoria com esse nome.</CommandEmpty>
                    {categoriasVistas.map((c) => (
                        <CommandItem
                            key={c.id}
                            value={`categoria:${c.id}`}
                            onSelect={() => escolher("categoria", { categoryId: c.id, motivoDaCategoria: null })}
                        >
                            <CommandItemIcon>
                                <ColorTile size="xs" color={c.color} />
                            </CommandItemIcon>
                            <CommandItemTitle>{c.name}</CommandItemTitle>
                        </CommandItem>
                    ))}
                </CommandPage>

                <CommandPage id="forma">
                    {FORMAS_ANTES_DO_CREDITO.map((forma) => (
                        <ItemDaForma
                            key={forma}
                            valor={`forma:${forma}`}
                            rotulo={paymentMethodLabel(forma)}
                            onSelect={() => escolher("forma", { paymentMethod: forma, creditCardId: null })}
                        />
                    ))}
                    {cartoesAtivos.length > 0 ? (
                        cartoesAtivos.map((c) => (
                            <ItemDaForma
                                key={c.id}
                                valor={`forma:cartao:${c.id}`}
                                rotulo={`Crédito · ${c.name}`}
                                onSelect={() =>
                                    escolher("forma", { paymentMethod: "credit_card", creditCardId: c.id })
                                }
                            />
                        ))
                    ) : (
                        <ItemDaForma
                            valor="forma:credit_card"
                            rotulo="Crédito"
                            onSelect={() => escolher("forma", { paymentMethod: "credit_card", creditCardId: null })}
                        />
                    )}
                    <ItemDaForma
                        valor="forma:cash"
                        rotulo={paymentMethodLabel("cash")}
                        onSelect={() => escolher("forma", { paymentMethod: "cash", creditCardId: null })}
                    />
                </CommandPage>

                <CommandPage id="data">
                    {dataDigitada ? (
                        <CommandItem value="usar:data" onSelect={() => escolher("data", { data: dataDigitada })}>
                            <CommandItemTitle>Usar {rotuloDaData(dataDigitada)}</CommandItemTitle>
                        </CommandItem>
                    ) : null}
                    {dias.map((d) => (
                        <CommandItem key={d.ymd} value={`data:${d.ymd}`} onSelect={() => escolher("data", { data: d.ymd })}>
                            <CommandItemTitle>{d.rotulo}</CommandItemTitle>
                            <CommandItemMeta>
                                <CommandItemDescription className="nums">{formatYmdPtBr(d.ymd)}</CommandItemDescription>
                            </CommandItemMeta>
                        </CommandItem>
                    ))}
                </CommandPage>

                <CommandPage id="parcelas">
                    {parcelasDigitadas != null && parcelasDigitadas >= 2 && parcelasDigitadas <= 48 ? (
                        <CommandItem
                            value="usar:parcelas"
                            onSelect={() => escolher("parcelas", { parcelas: parcelasDigitadas })}
                        >
                            <CommandItemTitle>Usar {parcelasDigitadas} parcelas</CommandItemTitle>
                        </CommandItem>
                    ) : null}
                    {PARCELAS_SUGERIDAS.map((n) => (
                        <CommandItem key={n} value={`parcelas:${n}`} onSelect={() => escolher("parcelas", { parcelas: n })}>
                            <CommandItemTitle>{n} parcelas</CommandItemTitle>
                        </CommandItem>
                    ))}
                </CommandPage>
            </CommandList>

            <CommandDock>
                <div className="flex items-center gap-2">
                    <CommandDockItem>
                        <Kbd>↵</Kbd>
                        {pagina ? "usar" : "lançar"}
                    </CommandDockItem>
                    <CommandDockItem>
                        <KbdGroup mode="either" joined keys={["up", "down"]} />
                        campos
                    </CommandDockItem>
                </div>
                <div className="flex items-center gap-2">
                    <CommandDockItem>
                        <Button variant="link" size="xs" onClick={fotografar}>
                            <CameraIcon aria-hidden />
                            recibo
                        </Button>
                    </CommandDockItem>
                    <CommandDockItem>
                        <Kbd>Esc</Kbd>
                        fechar
                    </CommandDockItem>
                </div>
            </CommandDock>
        </>
    )
}

function ItemDaForma({ valor, rotulo, onSelect }: { valor: string; rotulo: string; onSelect: () => void }) {
    return (
        <CommandItem value={valor} onSelect={onSelect}>
            <CommandItemTitle>{rotulo}</CommandItemTitle>
        </CommandItem>
    )
}
