"use client"

import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState, type ComponentProps, type KeyboardEvent, type ReactNode } from "react"
import {
    animate,
    AnimatePresence,
    motion,
    stagger,
    useIsPresent,
    useReducedMotion,
    type AnimationPlaybackControlsWithThen,
} from "motion/react"
import { Dialog as DialogPrimitive } from "radix-ui"
import {
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
import { Badge, BadgeDot } from "@/components/ui/badge"
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
import { Calendar } from "@/components/ui/calendar"
import {
    Dialog,
    DialogBody,
    DialogCloseButton,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogOverlay,
    DialogPortal,
    DialogTitle,
} from "@/components/ui/dialog"
import { Field, FieldControl, FieldLabel } from "@/components/ui/field"
import { Form, FormSubmit } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
    Item,
    ItemActions,
    ItemChevron,
    ItemContent,
    ItemGroup,
    ItemMedia,
    ItemSeparator,
    ItemTitle,
} from "@/components/ui/item"
import { MoneyDisplay } from "@/components/ui/money-display"
import { SearchInput } from "@/components/ui/search-input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Caption, Muted } from "@/components/ui/typography"
import { useAlturaAnimada } from "@/hooks/use-altura-animada"
import { useIsMobile } from "@/hooks/use-mobile"
import { ImpactoDaParcela } from "@/components/transactions/impacto-da-parcela"
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
import { quandoPintar, TINTA_DO_VOO } from "@/lib/header-morph"
import {
    ABRE_EM,
    ABSORVER,
    caixa,
    cascata,
    CASCATA_MS,
    COLADO_EM,
    insetDe,
    quadroDoAbrir,
    quadroDoColar,
    quadroDoMais,
    recorteDoAbsorver,
    REVELA_EASE,
    VOLTA_DA_PILULA,
} from "@/lib/lancamento-gesto"
import { ACOPLAMENTO_Y } from "@/lib/liquid-move"
import { formatMoneyBrlInput } from "@/lib/money-brl"
import { paymentMethodLabel, type PaymentMethod } from "@/lib/payment-methods"
import { searchFieldSurfaceClassName } from "@/lib/search-field-classes"
import { MOLA, MOLA_PALCO, SAIDA, SEPARACAO } from "@/lib/spring"
import { addDaysYmd, formatYmdPtBr, localYmdFromDate, parseYmdLocal } from "@/lib/transaction-date"
import { cn } from "@/lib/utils"

type Leitura = ReturnType<typeof useLeituraDoLancamento>
type FormDoLancamento = ReturnType<typeof useTransactionForm>

const NAO_IDENTIFICADO = "Não identificado"

/**
 * As linhas da lista agrupada, na ordem do painel, cada uma com o ladrilho no
 * tom dela. O tipo é a pílula do topo e o valor é o destaque; as parcelas só
 * aparecem na parcelada.
 */
const CAMPOS: {
    campo: CampoDoLancamento
    rotulo: string
    icone: ReactNode
    tom: "neutral" | "info" | "warning" | "destructive"
}[] = [
    { campo: "descricao", rotulo: "Descrição", icone: <PencilIcon aria-hidden />, tom: "neutral" },
    { campo: "categoria", rotulo: "Categoria", icone: <TagIcon aria-hidden />, tom: "warning" },
    { campo: "forma", rotulo: "Forma", icone: <CreditCardIcon aria-hidden />, tom: "info" },
    { campo: "data", rotulo: "Data", icone: <CalendarIcon aria-hidden />, tom: "destructive" },
    { campo: "parcelas", rotulo: "Parcelas", icone: <QueueListIcon aria-hidden />, tom: "neutral" },
]

/** Todos os campos da revisão: os dois do topo e as linhas. */
const TODOS_OS_CAMPOS: CampoDoLancamento[] = ["tipo", "valor", ...CAMPOS.map((x) => x.campo)]

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

/** O tom do ponto do indicador do tipo. */
const TOM_DO_TIPO = {
    despesa: "expense",
    receita: "income",
    parcelada: "info",
    estorno: "warning",
} as const satisfies Record<TipoDoLancamento, ComponentProps<typeof Badge>["tone"]>

/** As escolhas: montam o seletor aberto, e escolher (ou fechá-lo) volta à linha, sem "ok". A Data não entra: o calendário abre num diálogo. */
const ESCOLHAS: CampoDoLancamento[] = ["categoria", "forma", "parcelas"]

function abreDireto(campo: CampoDoLancamento) {
    return ESCOLHAS.includes(campo)
}

function abreEmDialogo(campo: CampoDoLancamento) {
    return campo === "data"
}

/** Quanto o círculo fica à vista no dia tocado antes de o diálogo sair. */
const POUSO_DO_DIA_MS = 160

/** Os atalhos do calendário da Data. */
const ATALHOS_DA_DATA = [
    { label: "hoje", date: () => new Date() },
    {
        label: "ontem",
        date: () => {
            const dia = new Date()
            dia.setDate(dia.getDate() - 1)
            return dia
        },
    },
]

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

/** A cor do traço que pinta a silhueta no voo: `--foreground` a `k`%, numa camada que o `clip-path` recorta junto. */
const tintaDoVoo = (k: number) => {
    const c = `color-mix(in oklab, var(--foreground) ${k}%, transparent)`
    return `linear-gradient(${c}, ${c})`
}

/** Liga e desliga o material de um vidro (o fundo, o borrão e o anel), para outro vidro pintar por ele. */
function vidroDesligado(el: HTMLElement, desligado: boolean) {
    el.style.backgroundColor = desligado ? "transparent" : ""
    el.style.setProperty("-webkit-backdrop-filter", desligado ? "none" : "")
    el.style.backdropFilter = desligado ? "none" : ""
    el.style.boxShadow = desligado ? "none" : ""
    if (desligado) el.style.backgroundImage = "none"
}

function semEstilo(el: HTMLElement | null | undefined, props: string[]) {
    if (el) for (const k of props) el.style.removeProperty(k)
}

const ESTILOS_DO_VOO = [
    "clip-path",
    "border-radius",
    "transform",
    "transform-origin",
    "background-image",
    "background-color",
    "-webkit-backdrop-filter",
    "backdrop-filter",
    "box-shadow",
    "opacity",
    "filter",
    "visibility",
    "flex",
    "animation",
    "--morph-radius",
]

/**
 * O lançamento inteligente: o campo da frase (a pílula da busca) com a pílula
 * redonda do recibo ao lado, e nada mais até o Enter. O Enter lê a frase (a IA
 * uma vez, se o valor ou a descrição ficarem em dúvida) e o campo **vira** o
 * painel da revisão: o tipo, o valor em destaque e a lista agrupada dos
 * campos, cada um editável no lugar, e o "Aprovar". Só apresentação — a
 * leitura é do `useLeituraDoLancamento`, que quem monta a tela chama uma vez, e
 * salvar é o `salvar()` do formulário.
 *
 * O gesto é o aprovado quadro a quadro
 * (`docs/superpowers/specs/2026-10-28-lancamento-gesto-final.md`), pelos
 * quadros puros de `lib/lancamento-gesto`: **colar** (a busca do telefone
 * fechando, a câmera colada no campo, um vidro só com o vão zero),
 * **absorver** (a ponta da câmera recua para dentro do campo) e **abrir** (o
 * campo vira o painel por recorte — a altura na `MOLA`, a largura na
 * `MOLA_PALCO` —, o conteúdo andando com o vidro e as peças chegando em
 * cascata). No desktop a linha fica no alto e o painel cresce para baixo; no
 * telefone a linha mora 12px acima do teclado (o viewport visual) e o painel
 * cresce para cima, até a área segura do topo. Não é o `CommandDialog` porque
 * o cmdk chama `preventDefault` em todo Enter e nas setas, e a revisão é um
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
    const linhaRef = useRef<HTMLDivElement>(null)
    const vidroRef = useRef<HTMLDivElement>(null)
    const cabecaRef = useRef<HTMLDivElement>(null)
    const cameraRef = useRef<HTMLButtonElement>(null)
    const uniaoRef = useRef<HTMLDivElement>(null)
    const placaRef = useRef<HTMLDivElement>(null)
    const fundoRef = useRef<HTMLDivElement>(null)
    const recorteRef = useRef<HTMLDivElement>(null)
    const conteudoRef = useRef<HTMLDivElement>(null)

    // Fechar zera a leitura no mesmo instante, mas o painel precisa sair com o
    // que mostrava: a saída guarda os campos e a frase da última revisão aberta.
    const [naSaida, setNaSaida] = useState<{ campos: CamposDaFrase; texto: string } | null>(null)
    const aberta = revisao ? { campos, texto: leitura.texto } : null
    if (open && (naSaida?.campos !== aberta?.campos || naSaida?.texto !== aberta?.texto)) setNaSaida(aberta)
    const camposDaPlaca = revisao ? campos : open ? null : (naSaida?.campos ?? null)
    const placa = camposDaPlaca != null
    const texto = open ? leitura.texto : (naSaida?.texto ?? leitura.texto)
    // Com o painel pousado, a linha some (e sai da ordem do foco); volta com uma leitura nova.
    const [recolhida, setRecolhida] = useState(false)
    if (!placa && recolhida) setRecolhida(false)

    // No telefone o campo não fica na tela sem o teclado. O ✓ da barra do teclado
    // do iOS só tira o foco, sem tecla nem toque: com frase lê, vazio fecha. Um
    // toque (na câmera, no véu) também tira, mas resolve sozinho: marca `tocou`, e
    // o blur dele não conta.
    const tocou = useRef(false)
    useEffect(() => {
        if (!open || !telefone) return
        let espera = 0
        const marcar = () => {
            tocou.current = true
            window.clearTimeout(espera)
            espera = window.setTimeout(() => (tocou.current = false), 400)
        }
        document.addEventListener("pointerdown", marcar, true)
        // Câmera cancelada: o campo volta ao foco (sem teclado ele não fica na tela).
        const arquivo = arquivoRef.current
        const voltar = () =>
            casca?.querySelector<HTMLInputElement>("[data-slot=search-input-control]")?.focus({ preventScroll: true })
        arquivo?.addEventListener("cancel", voltar)
        return () => {
            arquivo?.removeEventListener("cancel", voltar)
            document.removeEventListener("pointerdown", marcar, true)
            window.clearTimeout(espera)
            tocou.current = false
        }
    }, [open, telefone, casca])

    // No telefone a linha mora no viewport visual: a base dela fica 12px acima
    // do teclado do iOS (que só encolhe ele) e o acompanha; sem teclado, 12px
    // acima da área segura de baixo (`data-teclado` troca o pé). No gesto a
    // linha fica parada (`congelada`) enquanto o teclado desce, como no
    // protótipo; o painel lê o viewport vivo (`--lancamento-placa-*`).
    const congelada = useRef(false)
    const medirRef = useRef<() => void>(() => {})
    useLayoutEffect(() => {
        const vv = window.visualViewport
        if (!casca || !telefone || !vv) return
        // O iOS rola a página por baixo para mostrar o campo acima do teclado, e a
        // camada fixa se desloca junto (no app instalado o campo sumia atrás do
        // teclado, e ao fechar a página ficava rolada). Aberto, a rolagem fica onde
        // estava; quem acompanha o teclado é a medida do viewport visual.
        const rolagem = window.scrollY
        const medir = () => {
            if (window.scrollY !== rolagem) window.scrollTo(0, rolagem)
            casca.style.setProperty("--lancamento-placa-vh", `${vv.height}px`)
            casca.style.setProperty("--lancamento-placa-vy", `${vv.offsetTop}px`)
            // O painel com o teclado aberto (uma edição): colado na barra de cima dele.
            casca.toggleAttribute("data-teclado-placa", window.innerHeight - vv.height > 120)
            if (congelada.current) return
            const teclado = window.innerHeight - vv.height > 120
            casca.style.setProperty("--lancamento-vh", `${vv.height}px`)
            casca.style.setProperty("--lancamento-vy", `${vv.offsetTop}px`)
            casca.toggleAttribute("data-teclado", teclado)
        }
        // O iOS mede o viewport visual primeiro sem a barra de cima do teclado
        // (setas e ✓) e só desconta a barra depois, às vezes sem novo `resize`: a
        // linha ficava atrás dela. A cada mudança, mede de novo até o teclado assentar.
        let reMedidas: number[] = []
        const assentar = () => {
            medir()
            for (const t of reMedidas) window.clearTimeout(t)
            reMedidas = [120, 300, 600, 1000].map((ms) => window.setTimeout(medir, ms))
        }
        medirRef.current = medir
        assentar()
        vv.addEventListener("resize", assentar)
        vv.addEventListener("scroll", medir)
        casca.addEventListener("focusin", assentar)
        return () => {
            medirRef.current = () => {}
            for (const t of reMedidas) window.clearTimeout(t)
            vv.removeEventListener("resize", assentar)
            vv.removeEventListener("scroll", medir)
            casca.removeEventListener("focusin", assentar)
        }
    }, [casca, telefone])

    // A abertura no telefone: a linha nasce do "+" da barra de baixo como uma
    // gota que se separa em duas (`quadroDoMais`, na `SEPARACAO`). Sem o "+" à
    // vista, as pílulas entram no lugar; com movimento reduzido, só esmaecem.
    // Uma vez por abertura, e nunca com o painel já aberto.
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

    // O campo vira o painel: colar → absorver → abrir, cada fase no relógio do
    // `motion`, escrita nos vidros e nos filhos deles, nunca num ancestral (um
    // `transform` ou `clip-path` ali desligaria o `backdrop-filter`). Fechar é o
    // caminho curto: o painel recolhe e some no `menu-unmorph`.
    const placaAntes = useRef(false)
    const pousada = useRef(false)
    useLayoutEffect(() => {
        const linha = linhaRef.current
        const vidro = vidroRef.current
        const cabeca = cabecaRef.current
        const camera = cameraRef.current
        const uniao = uniaoRef.current
        const placaEl = placaRef.current
        const fundo = fundoRef.current
        const recorte = recorteRef.current
        const conteudo = conteudoRef.current
        const abriu = placa && !placaAntes.current
        placaAntes.current = placa
        if (!casca || !linha || !vidro || !cabeca || !camera || !uniao) return
        if (!placa) {
            pousada.current = false
            linha.style.visibility = linha.style.opacity = ""
            return
        }
        if (!placaEl || !fundo || !recorte || !conteudo) return
        const iconeCamera = camera.querySelector<SVGElement>("svg")
        const pecas = [...conteudo.querySelectorAll<HTMLElement>("[data-revela]")]
        let ativa = true
        let cancelar = () => {}
        const controles: AnimationPlaybackControlsWithThen[] = []

        const linhaEmRepouso = () => {
            for (const el of [vidro, camera]) semEstilo(el, ESTILOS_DO_VOO)
            semEstilo(cabeca, ["opacity", "filter", "transform"])
            semEstilo(iconeCamera as HTMLElement | null, ["opacity", "filter", "transform"])
            uniao.style.cssText = ""
        }
        const placaEmRepouso = () => {
            for (const el of [placaEl, fundo, recorte, conteudo, ...pecas]) semEstilo(el, ESTILOS_DO_VOO)
            for (const k of ["inset", "left", "top", "width", "height"]) fundo.style.removeProperty(k)
        }
        /** O painel pousado: a linha some sem piscar (o inline antes da classe) e o foco vai a ele. */
        const pousar = () => {
            pousada.current = true
            linha.style.visibility = "hidden"
            linhaEmRepouso()
            placaEmRepouso()
            congelada.current = false
            medirRef.current()
            setRecolhida(true)
            placaEl.focus({ preventScroll: true })
        }

        if (!open) {
            // Fechar no meio do gesto: a linha sai pela classe, e o painel nem aparece.
            if (!pousada.current) placaEl.style.visibility = "hidden"
            else if (reduzido) controles.push(animate([fundo, recorte], { opacity: 0 }, SAIDA))
            else {
                // O caminho curto: o conteúdo esmaece, e o vidro recolhe e some.
                controles.push(animate(recorte, { opacity: 0 }, SAIDA))
                fundo.style.setProperty("--morph-radius", "0px")
                fundo.style.transformOrigin = telefone ? "50% 100%" : "50% 0%"
                fundo.style.animation = "menu-unmorph 210ms linear both"
            }
        } else if (abriu) {
            // O campo perde o foco: no telefone o teclado desce no mesmo instante, e
            // o foco vai ao painel quando ele pousa.
            cabeca.querySelector("input")?.blur()
            if (reduzido) {
                // Sem viagem: a linha e o painel trocam num esmaecer.
                controles.push(animate(linha, { opacity: [1, 0] }, SAIDA))
                const troca = animate([fundo, recorte], { opacity: [0, 1] }, SAIDA)
                controles.push(troca)
                troca.then(() => {
                    if (ativa) pousar()
                })
            } else {
                congelada.current = telefone
                placaEl.style.visibility = "hidden"
                for (const el of pecas) {
                    el.style.opacity = "0"
                    el.style.filter = "blur(10px)"
                }
                const r = vidro.getBoundingClientRect()
                const k = camera.getBoundingClientRect()
                const campo = caixa(r.left, r.top, r.width, r.height)
                const cam = caixa(k.left, k.top, k.width, k.height)
                const R = campo.height / 2
                const dpr = window.devicePixelRatio || 1
                let fase: "colar" | "absorver" | "abrir" = "colar"

                const colar = (p: number) => {
                    const { f, uniao: u } = quadroDoColar(campo, cam, p, dpr)
                    vidro.style.borderRadius = `${f.R}px 0px 0px ${f.R}px`
                    camera.style.borderRadius = `0px ${f.R}px ${f.R}px 0px`
                    vidro.style.transform = `translateX(${f.dx}px)`
                    vidro.style.clipPath = `inset(${f.topo}px 0px ${f.base}px ${f.esquerda}px round ${f.Rh}px ${f.emendaH}px ${f.emendaH}px ${f.Rh}px / ${f.R}px ${f.emenda}px ${f.emenda}px ${f.R}px)`
                    camera.style.transformOrigin = "right center"
                    camera.style.transform = `translate(${f.xdx}px, ${f.xdy}px) scale(${f.escalaX}, ${1 - f.puxao * ACOPLAMENTO_Y})`
                    camera.style.clipPath = `inset(0px round ${f.emenda}px ${f.R}px ${f.R}px ${f.emenda}px)`
                    if (iconeCamera) {
                        iconeCamera.style.opacity = `${f.icone}`
                        iconeCamera.style.filter = `blur(${6 * (1 - f.icone)}px)`
                        iconeCamera.style.transform = `scale(${0.7 + 0.3 * f.icone})`
                    }
                    // Encostados, um vidro só (a união), com um contorno só: dois
                    // vidros lado a lado mostravam a costura num fio escuro.
                    for (const el of [vidro, camera]) vidroDesligado(el, u != null)
                    if (!u) {
                        vidro.style.backgroundImage = camera.style.backgroundImage = tintaDoVoo(TINTA_DO_VOO * f.tinta)
                        uniao.style.cssText = ""
                        return
                    }
                    const l = linha.getBoundingClientRect()
                    Object.assign(uniao.style, {
                        display: "block",
                        left: `${u.left - l.left}px`,
                        top: `${u.top - l.top}px`,
                        width: `${u.width}px`,
                        height: `${u.height}px`,
                        clipPath: `path("${u.path}")`,
                        backgroundImage: tintaDoVoo(TINTA_DO_VOO * f.tinta),
                    })
                }

                const abrir = () => {
                    fase = "abrir"
                    const agora = vidro.getBoundingClientRect()
                    const C = caixa(agora.left, agora.top, campo.width, agora.height)
                    // O painel lê o viewport vivo: o teclado já desceu.
                    medirRef.current()
                    placaEl.style.visibility = ""
                    const p = placaEl.getBoundingClientRect()
                    const F = caixa(p.left, p.top, p.width, p.height)
                    const raio = { de: R, ate: parseFloat(getComputedStyle(fundo).borderTopLeftRadius) || 28 }
                    // O vidro do painel cobre o campo e o painel, com folga para o passe da mola.
                    const folga = 20
                    const box = caixa(
                        Math.min(C.left, F.left) - folga,
                        Math.min(C.top, F.top) - folga,
                        Math.max(C.right, F.right) - Math.min(C.left, F.left) + 2 * folga,
                        Math.max(C.bottom, F.bottom) - Math.min(C.top, F.top) + 2 * folga
                    )
                    Object.assign(fundo.style, {
                        inset: "auto",
                        left: `${box.left - F.left}px`,
                        top: `${box.top - F.top}px`,
                        width: `${box.width}px`,
                        height: `${box.height}px`,
                        borderRadius: "0px",
                        boxShadow: "none",
                    })
                    // O campo para de pintar vidro: quem pinta é o do painel. A frase fica, e sai no desfoque.
                    vidroDesligado(vidro, true)
                    vidro.style.clipPath = ""
                    let py = 0
                    let px = 0
                    const desenhar = () => {
                        const f = quadroDoAbrir(py, px, C, F, raio)
                        fundo.style.clipPath = insetDe(f.vidro, box, f.raio)
                        fundo.style.backgroundImage = tintaDoVoo(f.tinta)
                        recorte.style.clipPath = insetDe(f.vidro, F, f.raio)
                        conteudo.style.transform = `translate(${f.conteudo.dx}px, ${f.conteudo.dy}px)`
                        cabeca.style.opacity = `${f.frase.opacidade}`
                        cabeca.style.filter = `blur(${f.frase.desfoque}px)`
                        cabeca.style.transform = `translateY(${f.frase.dy}px)`
                    }
                    desenhar()
                    const c = cascata(pecas.length)
                    const altura = animate(0, 1, {
                        ...MOLA,
                        onUpdate: (v) => {
                            py = v
                            desenhar()
                        },
                    })
                    const largura = animate(0, 1, {
                        ...MOLA_PALCO,
                        onUpdate: (v) => {
                            px = v
                            desenhar()
                        },
                    })
                    const chegam = animate(
                        pecas,
                        { opacity: [0, 1], filter: ["blur(10px)", "blur(0px)"] },
                        {
                            duration: c.duracao / 1000,
                            ease: REVELA_EASE,
                            delay: stagger(CASCATA_MS / 1000, { startDelay: c.comeca / 1000 }),
                        }
                    )
                    controles.push(altura, largura, chegam)
                    void Promise.all([altura, largura, chegam]).then(() => {
                        if (ativa) pousar()
                    })
                }

                const absorver = () => {
                    fase = "absorver"
                    camera.style.visibility = "hidden"
                    uniao.style.cssText = ""
                    vidroDesligado(vidro, false)
                    vidro.style.transform = ""
                    vidro.style.borderRadius = "0px"
                    vidro.style.flex = `0 0 ${campo.width + cam.width}px`
                    vidro.style.backgroundImage = tintaDoVoo(TINTA_DO_VOO)
                    const recolhe = animate(0, 1, {
                        ...ABSORVER,
                        onUpdate: (u) => {
                            if (fase !== "absorver") return
                            vidro.style.clipPath = recorteDoAbsorver(u, cam.width, R)
                            if (u >= ABRE_EM) abrir()
                        },
                    })
                    controles.push(recolhe)
                }

                colar(1)
                cancelar = quandoPintar(() => {
                    const cola = animate(1, 0, {
                        ...VOLTA_DA_PILULA,
                        onUpdate: (p) => {
                            if (fase !== "colar") return
                            colar(p)
                            if (p <= COLADO_EM) absorver()
                        },
                    })
                    controles.push(cola)
                })
            }
        }
        return () => {
            ativa = false
            cancelar()
            for (const c of controles) c.stop()
            congelada.current = false
            linhaEmRepouso()
            placaEmRepouso()
        }
    }, [open, placa, casca, telefone, reduzido])

    return (
        <Dialog open={open} onOpenChange={onOpenChange} pending={saving}>
            <DialogPortal>
                <DialogOverlay />
                {/* A casca não pinta: a linha e o painel são vidros soltos sobre o véu,
                    como no `CommandDialog`. Não é o `DialogContent`, porque ali o painel
                    é o próprio `Content` (vidro e `overflow-hidden`), e um elemento com
                    `backdrop-filter` é raiz de fundo: o borrão dos vidros não veria a
                    página. A casca não anima (transform ou opacidade num ancestral
                    desligaria o borrão dos filhos) e só segura a saída deles. */}
                <DialogPrimitive.Content
                    ref={setCasca}
                    data-slot="lancamento-inteligente"
                    aria-busy={saving || undefined}
                    // O vão entre o vidro e o resto é do véu: tocar nele fecha. Vai no
                    // `style` porque o Radix escreve `pointer-events: auto` inline.
                    style={{ pointerEvents: "none" }}
                    // O foco vai ao campo sem rolar a página (o `autoFocus` deixava o iOS rolá-la).
                    onOpenAutoFocus={(e) => {
                        e.preventDefault()
                        casca
                            ?.querySelector<HTMLInputElement>("[data-slot=search-input-control]")
                            ?.focus({ preventScroll: true })
                    }}
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

                    {/* O painel: preso à tela, e não à casca (a linha fica parada no gesto
                        enquanto o teclado desce). No telefone, 16 de calha e a borda de cima
                        na área segura + 16; no desktop, 448 no alto, crescendo para baixo. O
                        vidro (`lancamento-fundo`) é irmão do conteúdo, e não pai: o recorte
                        de cada um é escrito em separado. */}
                    {camposDaPlaca ? (
                        <div
                            data-slot="lancamento-area"
                            style={{ pointerEvents: "none" }}
                            className={cn(
                                // No telefone o painel termina no centro da tela (com o teclado já
                                // descido, a área é a tela inteira): o gesto lê a caixa final daqui.
                                // Com o teclado aberto numa edição, ele cola 12px acima da barra do
                                // teclado (o pé da área segura fica atrás do teclado).
                                "fixed inset-x-4 flex flex-col justify-center",
                                "top-[calc(var(--lancamento-placa-vy,0px)+max(--spacing(4),env(safe-area-inset-top)))]",
                                "h-[calc(var(--lancamento-placa-vh,100dvh)-max(--spacing(4),env(safe-area-inset-top))-env(safe-area-inset-bottom,0px)-(--spacing(3)))]",
                                "group-data-teclado-placa/lancamento:justify-end",
                                "group-data-teclado-placa/lancamento:h-[calc(var(--lancamento-placa-vh,100dvh)-max(--spacing(4),env(safe-area-inset-top))-(--spacing(3)))]",
                                "md:inset-x-0 md:top-24 md:mx-auto md:h-[calc(100dvh-(--spacing(48)))] md:max-w-md md:justify-start"
                            )}
                        >
                            <div
                                ref={placaRef}
                                data-slot="lancamento-placa"
                                tabIndex={-1}
                                className="pointer-events-auto relative flex max-h-full min-h-0 flex-col outline-none"
                            >
                                <div
                                    ref={fundoRef}
                                    aria-hidden
                                    data-slot="lancamento-fundo"
                                    className={cn("absolute inset-0 rounded-modal", searchFieldSurfaceClassName.modal)}
                                />
                                <div ref={recorteRef} className="relative flex min-h-0 flex-col">
                                    <div
                                        ref={conteudoRef}
                                        className="relative flex min-h-0 flex-col [--dialog-bleed:0px] [--dialog-px:--spacing(4)]"
                                    >
                                        <Revisao
                                            campos={camposDaPlaca}
                                            leitura={leitura}
                                            form={form}
                                            cartoes={cartoes}
                                            saving={saving}
                                            onAbrirFormulario={onAbrirFormulario}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : null}

                    {/* A linha: o vidro da frase e a gota da câmera ao lado; a união é o
                        vidro único das duas coladas. Depois do painel, por cima dele: a
                        frase sai no desfoque sobre o vidro que cresce. */}
                    <div
                        ref={linhaRef}
                        data-slot="lancamento-pilulas"
                        inert={recolhida}
                        className={cn("relative flex shrink-0 gap-2", recolhida && "invisible")}
                    >
                        <div
                            ref={uniaoRef}
                            aria-hidden
                            className={cn("pointer-events-none absolute hidden", searchFieldSurfaceClassName.modal)}
                        />
                        {/* Sem o contorno de foco: a pílula já é o único campo da tela, e o
                            feixe diz que ela está ativa (pedido do dono, 29/10). */}
                        <div
                            ref={vidroRef}
                            data-slot="lancamento-vidro"
                            className={cn(
                                "flex min-w-0 flex-1 items-center overflow-hidden rounded-full",
                                searchFieldSurfaceClassName.modal,
                                !telefone && PILULA_ENTRA,
                                !recolhida && PILULA_SAI
                            )}
                        >
                            <div ref={cabecaRef} data-slot="lancamento-cabeca" className="flex min-w-0 flex-1 items-center">
                                {/* A frase não pinta vidro próprio: o vidro é o de fora. */}
                                {/* O feixe do `CommandDialog` (a segunda exceção nomeada ao campo
                                    sem marca): aceso enquanto a frase é pílula, vazia ou digitada;
                                    com a IA lendo, corre mais rápido; sai quando o gesto começa. A
                                    lista de durações segue a da utility: entrada, trajeto, pontas e
                                    respiro. */}
                                <SearchInput
                                    surface="field"
                                    focusRing={false}
                                    size="xl"
                                    className={cn(
                                        "border-0 bg-transparent",
                                        !placa && "command-beam",
                                        "data-lendo:[animation-duration:0s,1.2s,1.2s,1.6s]"
                                    )}
                                    rootProps={
                                        {
                                            "data-waiting": !placa || undefined,
                                            "data-lendo": lendoIA || undefined,
                                        } as ComponentProps<"div">
                                    }
                                    type="text"
                                    enterKeyHint="go"
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
                                            // O teclado fica enquanto lê: quem o desce é o gesto, com a
                                            // linha já presa (descer antes a levava junto).
                                            leitura.interpretar()
                                        }
                                    }}
                                    onBlur={() => {
                                        // O ✓ do teclado: com frase, lê como o Enter; vazio, fecha.
                                        if (!open || !telefone || placa || lendoIA || saving || tocou.current) return
                                        if (texto.trim()) leitura.interpretar()
                                        else onOpenChange(false)
                                    }}
                                />
                            </div>
                        </div>
                        <Button
                            ref={cameraRef}
                            variant="tertiary"
                            size="icon-xl"
                            aria-label="Adicionar recibo"
                            disabled={saving}
                            onClick={() => arquivoRef.current?.click()}
                            // O círculo no mesmo vidro da frase, como o × da busca do telefone.
                            className={cn(
                                searchFieldSurfaceClassName.modal,
                                "shrink-0 bg-clip-border",
                                !telefone && PILULA_ENTRA,
                                !recolhida && PILULA_SAI
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

/**
 * A entrada de cada pílula no desktop, a do `CommandDialog`: abre na mola. O
 * desfoque do `tw-animate` vira `none` (um `blur(0)` desligaria o borrão). No
 * telefone a entrada é do efeito (a gota do "+").
 */
const PILULA_ENTRA = cn(
    "[--tw-enter-blur:none]",
    "animate-in fade-in-0 zoom-in-95 slide-in-from-top-1 animation-duration-(--duration-spring) ease-(--ease-spring)"
)

/** A saída de cada pílula sem o painel pousado: curta. Com o painel, a saída é do efeito. */
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
        <Item variant="flush" size="sm" data-revela className="px-0">
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

/** O anel de foco do sistema numa peça clicável que não é um `Button` (a pílula do tipo, o valor). */
const FOCO = "outline-none focus-visible:ring-3 focus-visible:ring-ring/45"

/** De onde quem entra no painel surge: no desfoque, 4px abaixo, como as linhas da paleta (`menu-content-in`). */
const SURGE_DE = { opacity: 0, filter: "blur(10px)", y: 4 }
/** O mesmo, sem descer: o gatilho que um seletor mede ao montar (Categoria, Forma, Parcelas). */
const SURGE_NO_LUGAR = { opacity: 0, filter: "blur(10px)" }
/** Quem entra assenta na mola; em repouso, sem `filter` (ele faria um contexto de empilhamento). */
const ENTRA = { opacity: 1, filter: "blur(0px)", y: 0, transition: { ...MOLA }, transitionEnd: { filter: "none" } }
/** Quem sai esmaece no desfoque, curto. */
const SAI = { opacity: 0, filter: "blur(6px)", transition: SAIDA }
/** As peças do editor chegam em escada: o rótulo, o campo, o "ok". */
const ESCADA_DO_EDITOR = 0.04

/**
 * Um filho de `AnimatePresence` que fica inerte enquanto sai: o fantasma do
 * `popLayout` pinta por cima de quem entra, e não recebe clique nem foco (o
 * Radix devolveria o foco ao gatilho do editor que sai).
 */
function Presenca({ ref, ...props }: ComponentProps<typeof motion.div>) {
    const presente = useIsPresent()
    return <motion.div {...props} ref={ref} inert={!presente} />
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
    const telefone = useIsMobile()
    const [editando, setEditando] = useState<CampoDoLancamento | null>(null)
    // O dia já tocado no calendário: pousa nele antes de gravar e fechar.
    const [diaEscolhido, setDiaEscolhido] = useState<Date | null>(null)
    const pousoDoDia = useRef(0)
    useEffect(() => () => window.clearTimeout(pousoDoDia.current), [])
    const formId = useId()
    // A altura do corpo anda na mola quando um editor abre ou uma peça entra e
    // sai; o vidro (`lancamento-fundo`) acompanha a placa sozinho.
    const corpoRef = useAlturaAnimada<HTMLDivElement>()
    // O editor que abre leva o foco ao controle dele (o `DatePicker` não tem `autoFocus`).
    const editorRef = useRef<HTMLDivElement | null>(null)
    // Na troca rápida de A para B os dois editores estão montados: o que sai só
    // apaga o ref se ele ainda for o dele.
    const prenderEditor = useCallback((el: HTMLDivElement | null) => {
        if (!el) return
        editorRef.current = el
        return () => {
            if (editorRef.current === el) editorRef.current = null
        }
    }, [])
    useEffect(() => {
        // O seletor aberto já tem o foco: focar o gatilho o fecharia.
        if (editando && !abreDireto(editando))
            editorRef.current?.querySelector<HTMLElement>("input, button")?.focus()
    }, [editando])
    // A máscara do valor em edição: o `Input money` é controlado pela string digitada.
    const [valorDigitado, setValorDigitado] = useState("")
    const hoje = localYmdFromDate(new Date())

    const { categories } = form.fieldsProps
    const cartoesAtivos = cartoes.filter((c) => c.is_active)
    const falta = faltaParaLancar(campos, cartoesAtivos.length)
    const tipo = tipoDoLancamento(campos)
    const plano = planoDaFrase(campos)
    const categoriasDoTipo = categories.filter((c) => c.type === campos.tipo)
    const categoria = categories.find((c) => c.id === campos.categoryId)
    const cartao = cartoes.find((x) => x.id === campos.creditCardId)?.name
    const leuComIA = campos.duvidas.includes("ia")
    // A frase do campo mudou depois do Enter: a revisão é da frase velha até o próximo Enter.
    const desatualizada = leitura.texto.trim() !== "" && leitura.texto !== leitura.fraseLida
    const motivo = desatualizada ? "Enter para atualizar" : falta ? MOTIVO_DA_FALTA[falta] : null
    const rotuloDoTipo = TIPOS.find((t) => t.tipo === tipo)?.rotulo ?? NAO_IDENTIFICADO

    function rotuloDaData(ymd: string) {
        if (ymd === hoje) return "Hoje"
        if (ymd === addDaysYmd(hoje, -1)) return "Ontem"
        return formatYmdPtBr(ymd)
    }

    function rotuloDaForma(c: CamposDaFrase) {
        if (c.paymentMethod === "credit_card" || (c.estorno && cartao)) return cartao ?? "Crédito"
        return c.paymentMethod ? paymentMethodLabel(c.paymentMethod) : null
    }

    /** O rótulo da linha, que muda com o tipo e a forma. */
    function rotuloDaLinha(campo: CampoDoLancamento, rotulo: string) {
        if (campo === "forma" && campos.paymentMethod === "credit_card") return "Cartão"
        if (campo === "data" && tipo === "parcelada") return "Primeira cobrança"
        return rotulo
    }

    /** O que a linha mostra; `null` é o que falta. */
    function valorDaLinha(campo: CampoDoLancamento): string | null {
        switch (campo) {
            case "tipo":
                return rotuloDoTipo
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

    /** A linha abaixo do valor só existe na parcelada; nos outros tipos as linhas da lista já dizem o resto. */
    const legenda =
        tipo === "parcelada" && campos.valor != null && campos.parcelas
            ? `${campos.parcelas}× de ${currencyBRL(campos.valor / campos.parcelas)}${cartao ? ` no ${cartao}` : ""}`
            : null

    // Uma linha cujo valor mudou sem a pessoa (uma leitura nova) pisca do
    // desfoque no lugar. A que estava em edição não conta (quem a mudou foi a
    // pessoa, à vista).
    const reduzido = useReducedMotion()
    // A linha e o editor trocam no lugar: quem entra surge do desfoque e quem
    // sai esmaece nele. Com movimento reduzido, só a opacidade.
    const presenca = reduzido
        ? { initial: { opacity: 0 }, animate: { opacity: 1, transition: SAIDA }, exit: { opacity: 0, transition: SAIDA } }
        : { initial: SURGE_DE, animate: ENTRA, exit: SAI }
    // O editor sai inteiro, e as peças dele chegam em escada.
    const editorVariantes = {
        antes: {},
        entra: { transition: { staggerChildren: ESCADA_DO_EDITOR } },
        sai: presenca.exit,
    }
    const pecaDoEditor = { antes: presenca.initial, entra: presenca.animate }
    const pecaNoLugar = { antes: reduzido ? presenca.initial : SURGE_NO_LUGAR, entra: presenca.animate }
    // A altura do rodapé também anda na mola quando o motivo entra e sai.
    const rodapeRef = useAlturaAnimada<HTMLDivElement>()
    const valoresAntes = useRef<Partial<Record<CampoDoLancamento, string | null>>>({})
    useEffect(() => {
        const agora: Partial<Record<CampoDoLancamento, string | null>> = {}
        for (const campo of TODOS_OS_CAMPOS) {
            // A Data edita num diálogo: a linha recebe o valor novo à vista, quando ele volta a ela.
            if (editando === campo && !abreEmDialogo(campo)) continue
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

    function fecharData() {
        window.clearTimeout(pousoDoDia.current)
        fechar()
    }

    /** O círculo pousa no dia, à vista, e só então o diálogo fecha e a linha recebe a data. */
    function escolherDia(dia: Date | undefined) {
        if (!dia) return fecharData()
        setDiaEscolhido(dia)
        window.clearTimeout(pousoDoDia.current)
        pousoDoDia.current = window.setTimeout(() => {
            leitura.editar("data", { data: localYmdFromDate(dia) })
            setDiaEscolhido(null)
            fecharData()
        }, POUSO_DO_DIA_MS)
    }

    /** O Enter de um campo em edição confirma a edição, e não aprova o lançamento. */
    function confirmaComEnter(e: KeyboardEvent) {
        if (e.key === "Enter" && !e.nativeEvent.isComposing) {
            e.preventDefault()
            fechar()
        }
    }

    /** A dúvida do parser que a linha confere ("Confira"); a categoria sem palpite também se confere. */
    function confira(campo: CampoDoLancamento) {
        const duvida = DUVIDA_DA_LINHA[campo]
        return (duvida != null && campos.duvidas.includes(duvida)) || (campo === "categoria" && !campos.categoryId)
    }

    /**
     * O selo da linha: "Confira" vence o "IA"; campo editado à mão perde o selo
     * IA. Ele entra e sai no desfoque, fora do fluxo ao sair (`popLayout`).
     */
    function qualSelo(campo: CampoDoLancamento, valor: string | null) {
        if (confira(campo)) return "confira"
        if (leuComIA && valor && !campoEditado(campo, leitura.editados)) return "ia"
        return null
    }

    function selo(campo: CampoDoLancamento, valor: string | null) {
        const qual = qualSelo(campo, valor)
        return (
            <AnimatePresence mode="popLayout" initial={false}>
                {qual ? (
                    <motion.span key={qual} className="flex" {...presenca}>
                        {qual === "confira" ? (
                            <Badge tone="warning">
                                Confira
                            </Badge>
                        ) : (
                            <Badge tone="info">
                                IA
                            </Badge>
                        )}
                    </motion.span>
                ) : null}
            </AnimatePresence>
        )
    }

    /** O campo em edição, no lugar da linha (ou do valor), filho da presença dela. */
    function emEdicao(campo: CampoDoLancamento, rotulo: string, className?: string) {
        return (
            <Presenca
                key={`${campo}-editor`}
                className={className}
                variants={editorVariantes}
                initial="antes"
                animate="entra"
                exit="sai"
            >
                <Field size="sm" data-revela={campo === "valor" || undefined}>
                    <motion.div variants={pecaDoEditor}>
                        <FieldLabel>{rotulo}</FieldLabel>
                    </motion.div>
                    <div className="flex items-center gap-2">
                        <motion.div
                            ref={prenderEditor}
                            variants={abreDireto(campo) ? pecaNoLugar : pecaDoEditor}
                            className="min-w-0 flex-1"
                        >
                            {editor(campo)}
                        </motion.div>
                        {abreDireto(campo) ? null : (
                            <motion.div variants={pecaDoEditor}>
                                <Button variant="secondary" onClick={fechar}>
                                    ok
                                </Button>
                            </motion.div>
                        )}
                    </div>
                </Field>
            </Presenca>
        )
    }

    function editor(campo: CampoDoLancamento): ReactNode {
        switch (campo) {
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
                        defaultOpen
                        onOpenChange={(aberto) => {
                            if (!aberto) fechar()
                        }}
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
                                <ComboboxTrigger className="w-full">
                                    <ComboboxValue
                                        placeholder="Escolher categoria"
                                        media={categoria ? <ColorTile size="xs" color={categoria.color} /> : undefined}
                                    >
                                        {categoria?.name}
                                    </ComboboxValue>
                                </ComboboxTrigger>
                            </FieldControl>
                        </ComboboxField>
                        {/* No telefone abre para baixo, onde sobra espaço, e sem focar a busca: o
                            teclado subiria por cima da lista. Tocar na busca a abre. */}
                        <ComboboxContent
                            side="bottom"
                            onOpenAutoFocus={telefone ? (e) => e.preventDefault() : undefined}
                        >
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
                        defaultOpen
                        onOpenChange={(aberto) => {
                            if (!aberto) fechar()
                        }}
                        value={valorDaForma(campos)}
                        onValueChange={(v) => leitura.editar("forma", formaDoValor(v))}
                    >
                        <FieldControl>
                            <SelectTrigger className="w-full">
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
            case "parcelas":
                return (
                    <Select
                        defaultOpen
                        onOpenChange={(aberto) => {
                            if (!aberto) fechar()
                        }}
                        value={campos.parcelas != null ? String(campos.parcelas) : ""}
                        // Escolher parcelas faz da despesa uma parcelada.
                        onValueChange={(v) =>
                            leitura.editar("parcelas", edicaoDoTipo(campos, "parcelada", categories, Number(v)))
                        }
                    >
                        <FieldControl>
                            <SelectTrigger className="w-full">
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

    // As linhas da lista agrupada: as parcelas só na parcelada.
    const linhas = CAMPOS.filter((x) => x.campo !== "parcelas" || tipo === "parcelada")

    return (
        // O corpo e o rodapé do painel. O corpo rola e o rodapé fica preso: a
        // revisão longa rola e o "Aprovar" fica à vista. Cada peça com
        // `data-revela` chega na cascata do gesto.
        <>
            <DialogCloseButton data-revela />
            <DialogBody className="pt-5">
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
                    <div data-slot="lancamento-revisao-corpo" ref={corpoRef} className="relative flex flex-col gap-(--space-block)">
                        {/* O tipo é só um indicador: corrigir o tipo é pelo formulário completo. */}
                        <div data-revela className="flex flex-wrap items-center gap-2 pe-10">
                            <Badge id="lancamento-tipo" tone={TOM_DO_TIPO[tipo]}>
                                <BadgeDot />
                                {rotuloDoTipo}
                            </Badge>
                            {campos.motivoDoTipo ? <Caption>por causa de “{campos.motivoDoTipo}”</Caption> : null}
                            {leuComIA ? (
                                <Badge tone="info">
                                    IA
                                </Badge>
                            ) : null}
                        </div>

                        {/* O valor em destaque; tocá-lo edita o valor. */}
                        <AnimatePresence mode="popLayout" initial={false}>
                            {editando === "valor" ? (
                                emEdicao("valor", "Valor")
                            ) : (
                                <Presenca key="valor-linha" {...presenca}>
                                    <div data-revela className="flex flex-col">
                                        <div className="relative flex items-center gap-2">
                                            <button
                                                type="button"
                                                id="lancamento-valor"
                                                disabled={saving}
                                                onClick={() => abrir("valor")}
                                                className={cn("min-h-11 w-full rounded-row text-start", FOCO)}
                                            >
                                                {campos.valor != null ? (
                                                    <MoneyDisplay
                                                        value={campos.valor}
                                                        size="2xl"
                                                        mono={false}
                                                        className="text-4xl font-bold tracking-tight"
                                                    />
                                                ) : (
                                                    <span className="text-2xl font-semibold text-muted-foreground">
                                                        {NAO_IDENTIFICADO}
                                                    </span>
                                                )}
                                            </button>
                                            {selo("valor", valorDaLinha("valor"))}
                                        </div>
                                        <AnimatePresence initial={false}>
                                            {legenda ? (
                                                <motion.div key="legenda" {...presenca}>
                                                    <Muted>{legenda}</Muted>
                                                </motion.div>
                                            ) : null}
                                        </AnimatePresence>
                                    </div>
                                </Presenca>
                            )}
                        </AnimatePresence>

                        <AnimatePresence initial={false}>
                            {leitura.foto ? (
                                <Presenca key="recibo" {...presenca}>
                                    <MiniaturaDoRecibo foto={leitura.foto} onTirar={leitura.tirarFoto} disabled={saving} />
                                </Presenca>
                            ) : null}
                        </AnimatePresence>

                        {/* A lista agrupada: a superfície funda, linhas de 50 com a divisória
                            recuada até o texto (16 + o ladrilho de 28 + 8). */}
                        <ItemGroup
                            data-revela
                            className="relative shrink-0 gap-0 overflow-hidden rounded-row-lg bg-foreground/5 has-data-[size=sm]:gap-0"
                        >
                            {/* A linha Parcelas entra e sai com o tipo. */}
                            <AnimatePresence initial={false}>
                                {linhas.map((x, i) => {
                                    const rotulo = rotuloDaLinha(x.campo, x.rotulo)
                                    const valor = valorDaLinha(x.campo)
                                    return (
                                        <Presenca key={x.campo} {...presenca}>
                                            {i > 0 ? <ItemSeparator className="my-0 ms-13 w-auto" /> : null}
                                            <AnimatePresence mode="popLayout" initial={false}>
                                                {editando === x.campo && !abreEmDialogo(x.campo) ? (
                                                    emEdicao(x.campo, rotulo, "px-4 py-2")
                                                ) : (
                                                    <Presenca key={`${x.campo}-linha`} {...presenca}>
                                                        <Item variant="flush" size="sm" interactive asChild className="min-h-12.5">
                                                            <button
                                                                type="button"
                                                                id={`lancamento-${x.campo}`}
                                                                disabled={saving}
                                                                onClick={() => abrir(x.campo)}
                                                            >
                                                                <ItemMedia variant="tile" tone={x.tom} tint="vivid">
                                                                    {x.icone}
                                                                </ItemMedia>
                                                                <ItemContent className="min-w-fit">
                                                                    <ItemTitle>{rotulo}</ItemTitle>
                                                                </ItemContent>
                                                                <ItemActions className="relative min-w-0 max-w-3/5">
                                                                    {selo(x.campo, valor)}
                                                                    {/* O selo entra e sai fora do fluxo: o ladrilho e o valor deslizam até o lugar novo. */}
                                                                    {x.campo === "categoria" && categoria ? (
                                                                        <motion.span
                                                                            layout="position"
                                                                            layoutDependency={qualSelo(x.campo, valor)}
                                                                            transition={MOLA}
                                                                            className="flex"
                                                                        >
                                                                            <ColorTile size="xs" color={categoria.color} />
                                                                        </motion.span>
                                                                    ) : null}
                                                                    <motion.span
                                                                        layout="position"
                                                                        layoutDependency={qualSelo(x.campo, valor)}
                                                                        transition={MOLA}
                                                                        className={cn(
                                                                            "min-w-0 truncate text-sm",
                                                                            valor
                                                                                ? "nums text-muted-foreground"
                                                                                : "text-warning-muted-foreground"
                                                                        )}
                                                                    >
                                                                        {valor ?? "Escolher"}
                                                                    </motion.span>
                                                                    <ItemChevron />
                                                                </ItemActions>
                                                            </button>
                                                        </Item>
                                                    </Presenca>
                                                )}
                                            </AnimatePresence>
                                        </Presenca>
                                    )
                                })}
                            </AnimatePresence>
                        </ItemGroup>

                        {plano ? <ImpactoDaParcela proposto={plano} /> : null}
                    </div>
                </Form>
                {/* O calendário não cabe na linha nem numa terceira gaveta: um diálogo por cima do painel. */}
                <Dialog
                    open={editando !== null && abreEmDialogo(editando)}
                    onOpenChange={(aberto) => {
                        if (!aberto) fecharData()
                    }}
                >
                    <DialogContent
                        size="sm"
                        // A abertura do `Dialog` ao contrário: a mesma duração, o mesmo zoom e a
                        // mesma subida, e o conteúdo volta ao desfoque.
                        className={cn(
                            !reduzido &&
                                "data-closed:slide-out-to-top-1 data-closed:animation-duration-(--duration-spring)! data-closed:ease-(--ease-in-out)! data-closed:*:[animation:menu-content-in_var(--duration-spring)_var(--ease-in-out)_reverse_both]"
                        )}
                    >
                        <DialogHeader>
                            <DialogTitle>{rotuloDaLinha("data", "Data")}</DialogTitle>
                            <DialogDescription className="sr-only">Escolha o dia do lançamento.</DialogDescription>
                        </DialogHeader>
                        <Calendar
                            mode="single"
                            selected={diaEscolhido ?? parseYmdLocal(campos.data)}
                            defaultMonth={parseYmdLocal(campos.data)}
                            presets={ATALHOS_DA_DATA}
                            stretch
                            className="bg-transparent p-0"
                            onSelect={escolherDia}
                        />
                    </DialogContent>
                </Dialog>
            </DialogBody>

            {/* O rodapé fica preso fora do corpo que rola; o "Aprovar" é do formulário pelo `form=`. */}
            <DialogFooter className="flex-col gap-1 pt-0 sm:flex-col sm:justify-start">
                {/* O motivo fica no fluxo ao sair, e a altura do rodapé anda na mola. O
                    "Aprovar" mora junto, para a caixa medida nunca chegar a zero. */}
                <div ref={rodapeRef} className="flex flex-col gap-1">
                    <AnimatePresence initial={false}>
                        {motivo ? (
                            <Presenca key="motivo" {...presenca}>
                                <Caption id="lancamento-motivo" data-revela className="pb-2 text-center">
                                    {motivo}
                                </Caption>
                            </Presenca>
                        ) : null}
                    </AnimatePresence>
                    <FormSubmit
                        form={formId}
                        size="xl"
                        data-revela
                        className="w-full"
                        pending={saving}
                        disabled={motivo != null}
                        aria-describedby={motivo ? "lancamento-motivo" : undefined}
                    >
                        Aprovar
                    </FormSubmit>
                </div>
                <Button
                    variant="tertiary"
                    data-revela
                    className="w-full"
                    disabled={saving}
                    onClick={onAbrirFormulario}
                >
                    formulário completo
                </Button>
            </DialogFooter>
        </>
    )
}
