"use client"

import * as React from "react"

import {
    Combobox,
    ComboboxContent,
    ComboboxEmpty,
    ComboboxField,
    ComboboxInput,
    ComboboxItem,
    ComboboxList,
    ComboboxTrigger,
    ComboboxValue,
} from "@/components/ui/combobox"
import {
    Dialog,
    DialogBody,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Form, FormCancel, FormControl, FormError, FormField, FormInput, FormSubmit, FormSwitch } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
    lancamentosDaRecorrencia,
    sugerirValorVariavel,
    virarAssinatura,
    virarConta,
    type Insight,
} from "@/lib/insights/acoes"
import { formatMoneyBrlInput, parseMoneyBrl } from "@/lib/money-brl"
import { toastSuccess } from "@/lib/toast"

type Destino = "assinatura" | "conta"
type Categoria = { id: string; name: string }

const DIAS = Array.from({ length: 31 }, (_, i) => String(i + 1))

/**
 * O "Criar com 1 toque" da recorrência: o destino vem sugerido pelo meio de pagamento e a pessoa
 * pode trocar. As RPCs `virar_*` já marcam o insight `acted` junto da criação (a falha desfaz as duas).
 */
export function DialogoDaRecorrencia({
    insight,
    categorias,
    onFechar,
    onFeito,
}: {
    insight: Insight | null
    categorias: Categoria[]
    onFechar: () => void
    onFeito: () => void
}) {
    // O último aberto fica montado enquanto o diálogo sai, para o conteúdo não sumir na animação.
    const [ultimo, setUltimo] = React.useState(insight)
    if (insight && insight !== ultimo) setUltimo(insight)
    const [salvando, setSalvando] = React.useState(false)

    return (
        <Dialog surface="auto" open={insight != null} pending={salvando} onOpenChange={(o) => (o ? undefined : onFechar())}>
            <DialogContent>
                {ultimo ? (
                    <Conteudo
                        key={ultimo.id}
                        insight={ultimo}
                        categorias={categorias}
                        salvando={salvando}
                        setSalvando={setSalvando}
                        onFeito={onFeito}
                    />
                ) : null}
            </DialogContent>
        </Dialog>
    )
}

function Conteudo({
    insight,
    categorias,
    salvando,
    setSalvando,
    onFeito,
}: {
    insight: Insight
    categorias: Categoria[]
    salvando: boolean
    setSalvando: (v: boolean) => void
    onFeito: () => void
}) {
    const p = insight.payload
    const [destino, setDestino] = React.useState<Destino>(p.destino === "assinatura" ? "assinatura" : "conta")
    const [nome, setNome] = React.useState(typeof p.nome === "string" ? p.nome : "")
    const [valor, setValor] = React.useState(() => (Number(p.valorMedio) > 0 ? formatMoneyBrlInput(Number(p.valorMedio)) : ""))
    const [dia, setDia] = React.useState(String(Math.min(31, Math.max(1, Number(p.dia) || 1))))
    const [categoryId, setCategoryId] = React.useState(typeof p.category_id === "string" ? p.category_id : "")
    const [valorVariavel, setValorVariavel] = React.useState(false)
    const [erro, setErro] = React.useState<string | null>(null)

    React.useEffect(() => {
        let vivo = true
        void lancamentosDaRecorrencia(insight).then((r) => {
            if (vivo && r.ok) setValorVariavel(sugerirValorVariavel(r.lancamentos.map((l) => Number(l.amount))))
        })
        return () => {
            vivo = false
        }
    }, [insight])

    const escolhida = categorias.find((c) => c.id === categoryId)

    async function salvar() {
        const reais = parseMoneyBrl(valor)
        if (destino === "assinatura" && !(reais != null && reais > 0)) {
            setErro("Informe um valor maior que zero.")
            return
        }
        setSalvando(true)
        setErro(null)
        const ajustes = { nome, valor: reais ?? 0, dia: Number(dia), categoryId: categoryId || null, valorVariavel }
        const r = await (destino === "assinatura" ? virarAssinatura : virarConta)(insight, ajustes)
        setSalvando(false)
        if (!r.ok) {
            setErro(r.erro)
            return
        }
        toastSuccess(destino === "assinatura" ? "Assinatura criada" : "Conta a pagar criada")
        onFeito()
    }

    return (
        <Form
            layout="none"
            pending={salvando}
            onSubmit={(e) => {
                e.preventDefault()
                void salvar()
            }}
        >
            <DialogHeader>
                <DialogTitle>{destino === "assinatura" ? "Virar assinatura" : "Virar conta a pagar"}</DialogTitle>
                <DialogDescription>Os lançamentos passados ficam ligados a ela.</DialogDescription>
            </DialogHeader>
            <DialogBody>
                <div className="flex flex-col gap-(--space-block) pb-2">
                    <Tabs value={destino} onValueChange={(v) => setDestino(v as Destino)}>
                        <TabsList aria-label="Virar em" stretch>
                            <TabsTrigger value="assinatura">Assinatura</TabsTrigger>
                            <TabsTrigger value="conta">Conta a pagar</TabsTrigger>
                        </TabsList>
                    </Tabs>
                    <FormInput label="Nome" required value={nome} onChange={(e) => setNome(e.target.value)} />
                    {destino === "assinatura" ? (
                        <FormInput label="Valor" money required value={valor} onValueChange={(raw) => setValor(raw)} />
                    ) : (
                        <FormSwitch
                            label="O valor muda todo mês"
                            description="A estimativa é a média dos lançamentos."
                            checked={valorVariavel}
                            onCheckedChange={setValorVariavel}
                        />
                    )}
                    <FormField label="Dia">
                        <Select value={dia} onValueChange={setDia}>
                            <FormControl>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                {DIAS.map((d) => (
                                    <SelectItem key={d} value={d}>
                                        Dia {d}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </FormField>
                    <FormField label="Categoria">
                        <Combobox value={categoryId} onValueChange={setCategoryId}>
                            <ComboboxField>
                                <FormControl>
                                    <ComboboxTrigger>
                                        <ComboboxValue placeholder="Sem categoria">{escolhida?.name}</ComboboxValue>
                                    </ComboboxTrigger>
                                </FormControl>
                            </ComboboxField>
                            <ComboboxContent>
                                <ComboboxInput placeholder="Buscar categoria…" />
                                <ComboboxList>
                                    <ComboboxEmpty>Nenhuma categoria com esse nome.</ComboboxEmpty>
                                    <ComboboxItem value="" variant="none">
                                        Sem categoria
                                    </ComboboxItem>
                                    {categorias.map((c) => (
                                        <ComboboxItem key={c.id} value={c.id}>
                                            {c.name}
                                        </ComboboxItem>
                                    ))}
                                </ComboboxList>
                            </ComboboxContent>
                        </Combobox>
                    </FormField>
                    <FormError>{erro}</FormError>
                </div>
            </DialogBody>
            <DialogFooter>
                <DialogClose asChild>
                    <FormCancel>Cancelar</FormCancel>
                </DialogClose>
                <FormSubmit>Criar</FormSubmit>
            </DialogFooter>
        </Form>
    )
}
