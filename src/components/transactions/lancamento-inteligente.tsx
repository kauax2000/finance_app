"use client"

import { useEffect, useId, useLayoutEffect, useRef, useState, type KeyboardEvent, type ReactNode } from "react"
import { animate, stagger, useReducedMotion, type AnimationPlaybackControlsWithThen } from "motion/react"
import { Dialog as DialogPrimitive } from "radix-ui"
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
import {
    Dialog,
    DialogBody,
    DialogDescription,
    DialogFooter,
    DialogOverlay,
    DialogPortal,
    DialogTitle,
} from "@/components/ui/dialog"
import { Field, FieldControl, FieldLabel } from "@/components/ui/field"
import { Form, FormSubmit } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Item, ItemActions, ItemContent, ItemDescription, ItemGroup, ItemMedia, ItemTitle } from "@/components/ui/item"
import { SearchInput } from "@/components/ui/search-input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Caption, H4 } from "@/components/ui/typography"
import { useWorkspace } from "@/components/workspace-provider"
import { useIsMobile } from "@/hooks/use-mobile"
import { ImpactoDaParcela } from "@/components/wireframe/impacto-parcela-wireframe"
import type { useTransactionForm } from "@/components/transactions/transaction-form-use"
import type { useLeituraDoLancamento } from "@/components/transactions/use-leitura-do-lancamento"
import type { CartaoParaCasar } from "@/lib/captura/frase"
import type { CamposDaFrase } from "@/lib/captura/frase-no-form"
import {
    campoEditado,
    edicaoDoTipo,
    faltaParaLancar,
    MOTIVO_DA_FALTA,
    planoDaFrase,
    tipoDoLancamento,
    type CampoDoLancamento,
    type TipoDoLancamento,
} from "@/lib/captura/lancamento-inteligente"
import { currencyBRL } from "@/lib/formatters"
import { quandoPintar, suave, TINTA_DO_VOO } from "@/lib/header-morph"
import { quadroDaFusao, quadroDaPlaca, quadroDoMais, VAO_DAS_PILULAS } from "@/lib/lancamento-morph"
import { formatMoneyBrlInput } from "@/lib/money-brl"
import { paymentMethodLabel, type PaymentMethod } from "@/lib/payment-methods"
import { searchFieldFocusClassName, searchFieldSurfaceClassName } from "@/lib/search-field-classes"
import { MOLA, MOLA_PALCO, SAIDA, SEPARACAO } from "@/lib/spring"
import { addDaysYmd, formatYmdPtBr, localYmdFromDate, parseYmdLocal } from "@/lib/transaction-date"
import { cn } from "@/lib/utils"

type Leitura = ReturnType<typeof useLeituraDoLancamento>
type FormDoLancamento = ReturnType<typeof useTransactionForm>

const NAO_IDENTIFICADO = "Não identificado"

/** As linhas da revisão, na ordem do spec: todas aparecem, lidas ou não. */
const CAMPOS: { campo: CampoDoLancamento; rotulo: string; icone: ReactNode }[] = [
    {
        campo: "tipo",
        rotulo: "Tipo",
        icone: <ArrowsRightLeftIcon aria-hidden />,
    },
    { campo: "valor", rotulo: "Valor", icone: <BanknotesIcon aria-hidden /> },
    {
        campo: "descricao",
        rotulo: "Descrição",
        icone: <PencilIcon aria-hidden />,
    },
    { campo: "categoria", rotulo: "Categoria", icone: <TagIcon aria-hidden /> },
    { campo: "forma", rotulo: "Forma", icone: <CreditCardIcon aria-hidden /> },
    { campo: "data", rotulo: "Data", icone: <CalendarIcon aria-hidden /> },
    {
        campo: "parcelas",
        rotulo: "Parcelas",
        icone: <QueueListIcon aria-hidden />,
    },
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
    if (v.startsWith("cartao:"))
        return {
            paymentMethod: "credit_card",
            creditCardId: v.slice("cartao:".length),
        }
    return { paymentMethod: v as PaymentMethod, creditCardId: null }
}

function primeiraImagem(arquivos: FileList | null | undefined) {
    return Array.from(arquivos ?? []).find((f) => f.type.startsWith("image/"))
}

/**
 * O lançamento inteligente: o campo da frase (a pílula da busca) com a pílula
 * redonda do recibo ao lado, e nada mais até o Enter. O Enter lê a frase (a IA
 * uma vez, se o valor ou a descrição ficarem em dúvida) e o campo **vira** a
 * placa da revisão: todos os campos, cada um editável no lugar, e o "Aprovar".
 * Só apresentação — a leitura é do `useLeituraDoLancamento`, que quem monta a
 * tela chama uma vez, e salvar é o `salvar()` do formulário.
 *
 * Um vidro só, no espírito do Liquid Glass: a pílula da frase **é** a placa.
 * Com a revisão, o vidro já está no lugar final (o cabeçalho é a frase, o
 * corpo rola e o rodapé fica preso) e o que anda é o recorte dele, da pílula
 * à caixa inteira (`quadroDaPlaca`); a câmera é uma segunda gota que se funde
 * ao campo antes (`quadroDaFusao`). No desktop a pilha fica no alto e a placa
 * cresce para baixo; no telefone a linha mora colada ao teclado (o viewport
 * visual) e a placa cresce para cima, até a área segura do topo, nascendo do
 * "+" da barra de baixo (`quadroDoMais`). Não é o `CommandDialog` porque o
 * cmdk chama `preventDefault` em todo Enter e nas setas, e a revisão é um
 * `Form` com `Select`, `Combobox` e `DatePicker` dentro.
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
    const revisao = campos != null && !lendoIA
    const telefone = useIsMobile()
    const reduzido = useReducedMotion() ?? false
    // A casca num estado, e não num ref: o `Portal` do Radix monta o conteúdo
    // num segundo commit, e os efeitos precisam rodar quando ele chega.
    const [casca, setCasca] = useState<HTMLDivElement | null>(null)
    const vidroRef = useRef<HTMLDivElement>(null)
    const cabecaRef = useRef<HTMLDivElement>(null)
    const cameraRef = useRef<HTMLButtonElement>(null)
    const cameraPequenaRef = useRef<HTMLButtonElement>(null)

    // Fechar zera a leitura no mesmo instante, mas a placa precisa voltar à
    // pílula com o que mostrava: a saída guarda os campos e a frase da última
    // revisão aberta.
    const [naSaida, setNaSaida] = useState<{ campos: CamposDaFrase; texto: string } | null>(null)
    const aberta = revisao ? { campos, texto: leitura.texto } : null
    if (open && (naSaida?.campos !== aberta?.campos || naSaida?.texto !== aberta?.texto)) setNaSaida(aberta)
    const camposDaPlaca = revisao ? campos : open ? null : (naSaida?.campos ?? null)
    const placa = camposDaPlaca != null
    const texto = open ? leitura.texto : (naSaida?.texto ?? leitura.texto)

    // No telefone a linha mora no viewport visual: a base dela fica 12px acima
    // do teclado do iOS (que só encolhe ele) e o acompanha; sem teclado, 12px
    // acima da área segura de baixo (`data-teclado` troca o pé).
    useLayoutEffect(() => {
        const vv = window.visualViewport
        if (!casca || !telefone || !vv) return
        const medir = () => {
            casca.style.setProperty("--lancamento-vh", `${vv.height}px`)
            casca.style.setProperty("--lancamento-vy", `${vv.offsetTop}px`)
            casca.toggleAttribute("data-teclado", window.innerHeight - vv.height > 120)
        }
        medir()
        vv.addEventListener("resize", medir)
        vv.addEventListener("scroll", medir)
        return () => {
            vv.removeEventListener("resize", medir)
            vv.removeEventListener("scroll", medir)
        }
    }, [casca, telefone])

    // A abertura no telefone: a linha nasce do "+" da barra de baixo como uma
    // gota que se separa em duas (`quadroDoMais`, na `SEPARACAO`). Sem o "+" à
    // vista, as pílulas entram no lugar; com movimento reduzido, só esmaecem.
    // Uma vez por abertura, e nunca com a placa já aberta (a frase
    // compartilhada): o gesto da placa é outro.
    const entrou = useRef(false)
    useLayoutEffect(() => {
        if (!open) {
            entrou.current = false
            return
        }
        const vidro = vidroRef.current
        const cabeca = cabecaRef.current
        const camera = cameraRef.current
        if (!casca || !telefone || !vidro || !cabeca || !camera || entrou.current) return
        entrou.current = true
        if (placa) return
        let ativa = true
        let controle: AnimationPlaybackControlsWithThen | undefined
        let cancelar = () => {}
        const repouso = () => {
            vidro.style.transform = vidro.style.clipPath = vidro.style.opacity = ""
            cabeca.style.filter = cabeca.style.caretColor = ""
            camera.style.transform = camera.style.opacity = ""
        }
        const mais = document.querySelector<HTMLElement>("[data-slot=bottom-bar-action]")?.getBoundingClientRect()
        if (reduzido || !mais || mais.width === 0) {
            controle = reduzido
                ? animate([vidro, camera], { opacity: [0, 1] }, SAIDA)
                : animate([vidro, camera], { opacity: [0, 1], scale: [0.95, 1] }, MOLA)
        } else {
            const m = { mais, campo: vidro.getBoundingClientRect(), camera: camera.getBoundingClientRect() }
            const R = (m.campo.bottom - m.campo.top) / 2
            const quadro = (p: number) => {
                const f = quadroDoMais(p, m)
                vidro.style.transform = `translate(${f.campo.dx}px, ${f.campo.dy}px)`
                vidro.style.clipPath = `inset(0px 0px 0px ${f.campo.esquerda}px round ${R}px)`
                // `filter`, e não `opacity`: no próprio vidro a opacidade animada apaga o borrão.
                cabeca.style.filter = `opacity(${f.campo.conteudo})`
                // O cursor nativo do iOS não obedece ao `filter`: some no voo.
                cabeca.style.caretColor = "transparent"
                camera.style.transform = `translate(${f.camera.dx}px, ${f.camera.dy}px) scale(${f.camera.escala})`
                camera.style.opacity = `${f.camera.opacidade}`
            }
            quadro(0)
            // O relógio só começa quando a pintura volta: o teclado subindo para
            // a pintura do WebKit, e a mola chegaria já no fim.
            cancelar = quandoPintar(() => {
                controle = animate(0, 1, { ...SEPARACAO, onUpdate: quadro })
                controle.then(() => {
                    if (ativa) repouso()
                })
            })
        }
        return () => {
            ativa = false
            cancelar()
            controle?.stop()
            repouso()
        }
    }, [open, casca, telefone, reduzido, placa])

    // O campo vira a placa (e volta). Um progresso para a fusão (`n`) e outro
    // para o crescimento (`g`), escritos no vidro e nos filhos dele, nunca na
    // casca: um `transform` num ancestral desligaria o `backdrop-filter`. Fechar
    // segue de onde a abertura parou.
    const progresso = useRef({ n: 1, g: 1 })
    const placaAntes = useRef(false)
    useLayoutEffect(() => {
        const vidro = vidroRef.current
        const cabeca = cabecaRef.current
        const camera = cameraRef.current
        if (!casca || !vidro || !cabeca || !camera) return
        const abriu = placa && !placaAntes.current
        placaAntes.current = placa
        if (!placa) return
        const iconeCamera = camera.querySelector<SVGElement>("svg")
        const pequena = cameraPequenaRef.current
        const corpo = [...vidro.querySelectorAll<HTMLElement>("[data-slot=dialog-body], [data-slot=dialog-footer]")]
        const linhas = [
            ...vidro.querySelectorAll<HTMLElement>(
                "[data-slot=dialog-body] form > :not([data-slot=item-group]), [data-slot=item-group] > *, [data-slot=dialog-footer]"
            ),
        ]
        let ativa = true
        let cancelar = () => {}
        const controles: AnimationPlaybackControlsWithThen[] = []

        const desenhar = (n: number, g: number) => {
            progresso.current = { n, g }
            const W = vidro.offsetWidth
            const H = vidro.offsetHeight
            const h = cabeca.offsetHeight
            const R = h / 2
            const fusao = quadroDaFusao(n, { largura: camera.offsetWidth, raio: R })
            const de = telefone
                ? { esquerda: 0, topo: H - h, direita: W, base: H }
                : { esquerda: 0, topo: 0, direita: W, base: h }
            const f = quadroDaPlaca(g, de, { esquerda: 0, topo: 0, direita: W, base: H }, telefone)
            const { esquerda, topo, direita, base } = f.recorte
            // Antes de fundir, a ponta do vidro para no vão e a costura (os cantos
            // da direita) vai a reta enquanto a câmera estica até ele: a silhueta
            // das duas é a cápsula de ponta a ponta quando a câmera some.
            const fora = fusao.fundida ? 0 : camera.offsetWidth + VAO_DAS_PILULAS
            const emenda = fusao.fundida ? f.raio : fusao.emenda
            // O recorte manda no raio: o próprio fica reto (o do `rounded-surface`
            // cortaria os cantos de cima a 22 com a pílula a 18).
            vidro.style.borderRadius = "0px"
            vidro.style.clipPath = `inset(${topo}px ${direita + fora}px ${base}px ${esquerda}px round ${f.raio}px ${emenda}px ${emenda}px ${f.raio}px)`
            vidro.style.transform = f.ty ? `translateY(${f.ty}px)` : ""
            // O recorte tira o anel: a silhueta no voo é a tinta do voo.
            const peso = fusao.fundida ? f.tinta : suave(n, [0, 0.3])
            const tinta = `color-mix(in oklab, var(--foreground) ${TINTA_DO_VOO * peso}%, transparent)`
            vidro.style.backgroundImage = camera.style.backgroundImage = `linear-gradient(${tinta}, ${tinta})`
            // A frase viaja com a borda de cima.
            cabeca.style.transform = f.cabeca ? `translateY(${f.cabeca}px)` : ""
            camera.style.opacity = fusao.fundida ? "0" : "1"
            camera.style.transformOrigin = "right"
            camera.style.transform = `scaleX(${fusao.escalaX})`
            camera.style.borderRadius = `${fusao.emenda}px ${R}px ${R}px ${fusao.emenda}px`
            if (iconeCamera) {
                iconeCamera.style.opacity = `${fusao.icone.opacidade}`
                iconeCamera.style.filter = `blur(${fusao.icone.desfoque}px)`
                iconeCamera.style.transform = `scale(${fusao.icone.escala})`
            }
            if (pequena) pequena.style.opacity = `${suave(g, [0, 0.35])}`
        }
        const repouso = () => {
            for (const k of ["clip-path", "border-radius", "transform", "background-image", "animation", "transform-origin", "opacity", "--morph-radius"])
                vidro.style.removeProperty(k)
            cabeca.style.transform = ""
            for (const k of ["opacity", "transform", "transform-origin", "border-radius", "background-image"])
                camera.style.removeProperty(k)
            if (iconeCamera) iconeCamera.style.opacity = iconeCamera.style.filter = iconeCamera.style.transform = ""
            if (pequena) pequena.style.opacity = ""
            for (const el of [...corpo, ...linhas]) el.style.opacity = el.style.filter = ""
        }

        if (open) {
            if (!abriu) return
            if (reduzido) {
                // Sem viagem: o vidro troca de forma num esmaecer, e as linhas chegam juntas.
                controles.push(animate(corpo, { opacity: [0, 1] }, SAIDA))
            } else {
                for (const el of linhas) el.style.opacity = "0"
                desenhar(0, 0)
                cancelar = quandoPintar(() => {
                    const fusao = animate(0, 1, {
                        duration: 0.18,
                        ease: [0.2, 0, 0, 1],
                        onUpdate: (n) => desenhar(n, 0),
                    })
                    controles.push(fusao)
                    fusao.then(() => {
                        if (!ativa) return
                        // Telefone: a subida estica e assenta num passe; desktop: sóbria, sem passe.
                        const cresce = animate(0, 1, {
                            ...(telefone ? SEPARACAO : MOLA_PALCO),
                            onUpdate: (g) => desenhar(1, g),
                        })
                        // As linhas chegam do desfoque, de cima para baixo, 30ms
                        // entre elas (o `menu-content-in`); o rodapé por último.
                        const chegam = animate(
                            linhas.slice(0, -1),
                            { opacity: [0, 1], filter: ["blur(10px)", "blur(0px)"] },
                            { duration: 0.32, ease: [0.16, 1, 0.3, 1], delay: stagger(0.03, { startDelay: 0.08 }) }
                        )
                        const rodape = animate(
                            linhas.slice(-1),
                            { opacity: [0, 1], filter: ["blur(10px)", "blur(0px)"] },
                            { duration: 0.32, ease: [0.16, 1, 0.3, 1], delay: 0.34 }
                        )
                        controles.push(cresce, chegam, rodape)
                        void Promise.all([cresce, chegam, rodape]).then(() => {
                            if (!ativa) return
                            progresso.current = { n: 1, g: 1 }
                            repouso()
                        })
                    })
                })
            }
        } else if (reduzido) {
            controles.push(animate(vidro, { opacity: 0 }, SAIDA))
        } else {
            // O inverso curto: as linhas saem juntas, o vidro volta à pílula e
            // some no `menu-unmorph`, recolhendo ao centro dela.
            const { g } = progresso.current
            controles.push(animate(corpo, { opacity: 0 }, SAIDA))
            desenhar(1, g)
            const volta = animate(g, 0, { ...VOLTA_DA_PLACA, onUpdate: (x) => desenhar(1, x) })
            controles.push(volta)
            volta.then(() => {
                if (!ativa) return
                const R = cabeca.offsetHeight / 2
                const centroY = telefone ? vidro.offsetHeight - R : R
                vidro.style.setProperty("--morph-radius", "0px")
                vidro.style.transformOrigin = `${vidro.offsetWidth / 2}px ${centroY}px`
                vidro.style.animation = "menu-unmorph 210ms linear both"
            })
        }
        return () => {
            ativa = false
            cancelar()
            for (const c of controles) c.stop()
            repouso()
        }
    }, [open, placa, casca, telefone, reduzido])

    return (
        <Dialog open={open} onOpenChange={onOpenChange} pending={saving}>
            <DialogPortal>
                <DialogOverlay />
                {/* A casca não pinta: o vidro e a câmera são vidros soltos sobre o véu,
                    como no `CommandDialog`. Não é o `DialogContent`, porque ali a placa é
                    o próprio `Content` (vidro e `overflow-hidden`), e um elemento com
                    `backdrop-filter` é raiz de fundo: o borrão dos vidros não veria a
                    página. A casca não anima (transform ou opacidade num ancestral
                    desligaria o borrão dos filhos) e só segura a saída deles: a volta
                    da placa (200ms) e o `menu-unmorph` (210ms). */}
                <DialogPrimitive.Content
                    ref={setCasca}
                    data-slot="lancamento-inteligente"
                    aria-busy={saving || undefined}
                    // O vão entre o vidro e o resto é do véu: tocar nele fecha. Vai no
                    // `style` porque o Radix escreve `pointer-events: auto` inline.
                    style={{ pointerEvents: "none" }}
                    className={cn(
                        "group/lancamento fixed inset-0 z-(--z-modal) mx-auto flex max-w-md flex-col gap-3 text-sm outline-none",
                        // Telefone: o viewport visual, com a linha embaixo (acima do teclado).
                        "max-md:bottom-auto max-md:top-[var(--lancamento-vy,0px)] max-md:h-[var(--lancamento-vh,100dvh)] max-md:justify-end",
                        "px-4 pt-[max(--spacing(4),env(safe-area-inset-top))] pb-[calc(env(safe-area-inset-bottom,0px)+--spacing(3))] data-teclado:pb-3 md:px-0 md:py-24",
                        "*:pointer-events-auto",
                        "data-closed:[animation:presence-hold_460ms]"
                    )}
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
                    {/* O título e a descrição ficam para o leitor de tela: quem fala é o campo. */}
                    <DialogTitle className="sr-only">Lançamento inteligente</DialogTitle>
                    <DialogDescription className="sr-only">
                        Escreva o lançamento numa frase ou fotografe o recibo, dê Enter, confira o que o app entendeu e
                        aprove.
                    </DialogDescription>

                    {/* A linha: o vidro da frase (que vira a placa) e a gota da câmera ao
                        lado. Com a placa, a câmera sai do fluxo e fica por cima da ponta do
                        vidro até se fundir a ele. */}
                    <div
                        data-slot="lancamento-pilulas"
                        className={cn("relative flex shrink-0 gap-2", placa && "min-h-0 shrink max-md:flex-1")}
                    >
                        <div
                            ref={vidroRef}
                            data-slot="lancamento-vidro"
                            className={cn(
                                "flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-surface",
                                searchFieldSurfaceClassName.modal,
                                "[--dialog-bleed:0px] [--dialog-px:--spacing(4)]",
                                !placa && searchFieldFocusClassName,
                                !telefone && PILULA_ENTRA,
                                !placa && PILULA_SAI
                            )}
                        >
                            <div ref={cabecaRef} data-slot="lancamento-cabeca" className="flex shrink-0 items-center">
                                {/* A frase não pinta vidro próprio: o vidro é o de fora, que vira a placa. */}
                                <SearchInput
                                    surface="field"
                                    focusRing={false}
                                    className="border-0 bg-transparent"
                                    type="text"
                                    enterKeyHint="go"
                                    autoFocus
                                    aria-label="Frase do lançamento"
                                    placeholder="Ex.: 42 mercado nubank"
                                    value={texto}
                                    onChange={(e) => leitura.setTexto(e.target.value)}
                                    pending={lendoIA}
                                    disabled={saving}
                                    onKeyDown={(e) => {
                                        // Enter lê a frase (não salva); o que fecha um acento (IME do Mac e do iOS) não lê.
                                        if (e.key === "Enter" && !e.nativeEvent.isComposing) {
                                            e.preventDefault()
                                            leitura.interpretar()
                                            // No telefone o teclado desce: a placa cresce para cima no lugar dele.
                                            if (telefone) e.currentTarget.blur()
                                        }
                                    }}
                                />
                                {placa ? (
                                    <Button
                                        ref={cameraPequenaRef}
                                        variant="tertiary"
                                        size="icon-md"
                                        aria-label="Adicionar recibo"
                                        disabled={saving}
                                        onClick={() => arquivoRef.current?.click()}
                                        className="me-1 shrink-0"
                                    >
                                        <CameraIcon aria-hidden />
                                    </Button>
                                ) : null}
                            </div>

                            {camposDaPlaca ? (
                                <Revisao
                                    campos={camposDaPlaca}
                                    leitura={leitura}
                                    form={form}
                                    cartoes={cartoes}
                                    saving={saving}
                                    onAbrirFormulario={onAbrirFormulario}
                                />
                            ) : null}
                        </div>
                        <Button
                            ref={cameraRef}
                            variant="tertiary"
                            size="icon-lg"
                            aria-label="Adicionar recibo"
                            disabled={saving}
                            inert={placa}
                            onClick={() => arquivoRef.current?.click()}
                            // O círculo no mesmo vidro da frase, como o × da busca do telefone.
                            className={cn(
                                searchFieldSurfaceClassName.modal,
                                "shrink-0 bg-clip-border",
                                placa && "pointer-events-none absolute end-0 top-0 opacity-0 max-md:top-auto max-md:bottom-0",
                                !telefone && PILULA_ENTRA,
                                !placa && PILULA_SAI
                            )}
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

                    {/* Cota, rede, imagem que não abre, "Lendo com IA…": vazio, não ocupa lugar. No telefone, acima da linha. */}
                    <Caption role="status" className="shrink-0 px-4 empty:hidden max-md:-order-1">
                        {lendoIA ? (foto ? "Lendo o recibo com IA…" : "Lendo com IA…") : leitura.aviso}
                    </Caption>
                </DialogPrimitive.Content>
            </DialogPortal>
        </Dialog>
    )
}

/** A volta da placa à pílula: curta, começando macia (a curva da `VOLTA_DA_PILULA` da busca). */
const VOLTA_DA_PLACA = { duration: 0.2, ease: [0.2, 0, 0, 1] } as const

/**
 * A entrada de cada pílula no desktop, a do `CommandDialog`: abre na mola. O
 * desfoque do `tw-animate` vira `none` (um `blur(0)` desligaria o borrão). No
 * telefone a entrada é do efeito (a gota do "+").
 */
const PILULA_ENTRA = cn(
    "[--tw-enter-blur:none]",
    "animate-in fade-in-0 zoom-in-95 slide-in-from-top-1 animation-duration-(--duration-spring) ease-(--ease-spring)"
)

/** A saída de cada pílula sem placa: curta. Com a placa, a volta é do efeito. */
const PILULA_SAI = cn(
    "[--tw-exit-blur:none]",
    "group-data-closed/lancamento:animate-out group-data-closed/lancamento:fade-out-0 group-data-closed/lancamento:zoom-out-95 group-data-closed/lancamento:animation-duration-(--duration-fast) group-data-closed/lancamento:ease-(--ease-out) group-data-closed/lancamento:fill-mode-forwards"
)

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
                <Button
                    variant="tertiary"
                    size="icon-md"
                    aria-label="Tirar a foto"
                    disabled={disabled}
                    onClick={onTirar}
                >
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
    const formId = useId()
    // O editor que abre leva o foco ao controle dele (o `DatePicker` não tem `autoFocus`).
    const editorRef = useRef<HTMLDivElement>(null)
    useEffect(() => {
        if (editando) editorRef.current?.querySelector<HTMLElement>("input, button")?.focus()
    }, [editando])
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
    // A frase do campo mudou depois do Enter: a revisão é da frase velha até o próximo Enter.
    const desatualizada = leitura.texto.trim() !== "" && leitura.texto !== leitura.fraseLida
    const motivo = desatualizada ? "Enter para atualizar" : falta ? MOTIVO_DA_FALTA[falta] : null

    function rotuloDaData(ymd: string) {
        if (ymd === hoje) return "Hoje"
        if (ymd === addDaysYmd(hoje, -1)) return "Ontem"
        return formatYmdPtBr(ymd)
    }

    function rotuloDaForma(c: CamposDaFrase) {
        const cartao = cartoes.find((x) => x.id === c.creditCardId)?.name
        if (c.paymentMethod === "credit_card" || (c.estorno && cartao))
            return cartao ? `Crédito · ${cartao}` : "Crédito"
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

    // Reenviar a frase com a placa aberta não refaz a viagem: a linha cujo valor
    // mudou pisca do desfoque no lugar. A que estava em edição não conta (quem a
    // mudou foi a pessoa, à vista).
    const reduzido = useReducedMotion()
    const valoresAntes = useRef<Partial<Record<CampoDoLancamento, string | null>>>({})
    useEffect(() => {
        const agora: Partial<Record<CampoDoLancamento, string | null>> = {}
        for (const { campo } of CAMPOS) {
            if (editando === campo) continue
            agora[campo] = valorDaLinha(campo)
            const antes = valoresAntes.current[campo]
            const linha = document.getElementById(`lancamento-${campo}`)
            if (antes === undefined || antes === agora[campo] || !linha) continue
            void animate(
                linha,
                reduzido ? { opacity: [0, 1] } : { opacity: [0, 1], filter: ["blur(10px)", "blur(0px)"] },
                { duration: 0.32, ease: [0.16, 1, 0.3, 1] }
            ).then(() => {
                linha.style.opacity = linha.style.filter = ""
            })
        }
        valoresAntes.current = agora
    })

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
                        onValueChange={(v) =>
                            leitura.editar("tipo", edicaoDoTipo(campos, v as TipoDoLancamento, categories))
                        }
                    >
                        <FieldControl>
                            <SelectTrigger>
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
                                <ComboboxTrigger>
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
                                        <ComboboxItem
                                            key={c.id}
                                            value={c.id}
                                            media={<ColorTile size="xs" color={c.color} />}
                                        >
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
                    <Select
                        value={valorDaForma(campos)}
                        onValueChange={(v) => leitura.editar("forma", formaDoValor(v))}
                    >
                        <FieldControl>
                            <SelectTrigger>
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
                            onChange={(d) =>
                                leitura.editar("data", {
                                    data: localYmdFromDate(d ?? new Date()),
                                })
                            }
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
                            <SelectTrigger>
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
        // O corpo e o rodapé da placa: moram no vidro da frase, abaixo do
        // cabeçalho. O corpo rola e o rodapé fica preso: a revisão longa rola e o
        // "Aprovar" fica à vista.
        <>
            <DialogBody>
                <Form
                    id={formId}
                    pending={saving}
                    // A frase mudou depois do Enter: a revisão esmaece até o próximo Enter.
                    className={desatualizada ? "opacity-60" : undefined}
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
                                            <div ref={editorRef} className="min-w-0 flex-1">
                                                {editor(x.campo)}
                                            </div>
                                            <Button variant="secondary" onClick={fechar}>
                                                ok
                                            </Button>
                                        </div>
                                    </Field>
                                )
                            }
                            const valor = valorDaLinha(x.campo)
                            const duvida = DUVIDA_DA_LINHA[x.campo]
                            // A categoria sem palpite também se confere, como no aviso da IA (`textoDasDuvidas`).
                            const confira =
                                (duvida != null && campos.duvidas.includes(duvida)) ||
                                (x.campo === "categoria" && !campos.categoryId)
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
                                            ) : leuComIA && valor && !campoEditado(x.campo, leitura.editados) ? (
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
                </Form>
            </DialogBody>

            {/* O rodapé fica preso fora do corpo que rola; o "Aprovar" é do formulário pelo `form=`. */}
            <DialogFooter
                start={
                    motivo ? (
                        <Caption id="lancamento-motivo" className="self-center">
                            {motivo}
                        </Caption>
                    ) : null
                }
            >
                <Button variant="tertiary" disabled={saving} onClick={onAbrirFormulario}>
                    formulário completo
                </Button>
                <FormSubmit
                    form={formId}
                    pending={saving}
                    disabled={motivo != null}
                    aria-describedby={motivo ? "lancamento-motivo" : undefined}
                >
                    Aprovar
                </FormSubmit>
            </DialogFooter>
        </>
    )
}
