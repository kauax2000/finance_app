"use client"

import { useState } from "react"
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
import { Form, FormCancel, FormControl, FormField, FormSubmit } from "@/components/ui/form"
import { numberBR } from "@/lib/formatters"
import type { Category } from "@/lib/supabase"
import { toastError, toastSuccess } from "@/lib/toast"
import { categorizarEmLote } from "@/lib/transactions/mutations"

const SEM_CATEGORIA = "__sem__"

export type CategorizarEmLoteDialogProps = {
    /** As ids marcadas; `null` fecha. */
    ids: string[] | null
    tipo: "expense" | "income"
    categorias: Pick<Category, "id" | "name" | "type" | "color">[]
    /** `true` depois de gravar; `false` ao cancelar. */
    onDone: (gravou: boolean) => void
}

/** Uma categoria para o lote todo (spec §6.4): grava a categoria e tira o "a conferir". */
export function CategorizarEmLoteDialog({ ids, tipo, categorias, onDone }: CategorizarEmLoteDialogProps) {
    const [escolha, setEscolha] = useState("")
    const [gravando, setGravando] = useState(false)
    const aberto = ids != null
    // Fechou: a próxima abertura começa vazia.
    if (!aberto && escolha) setEscolha("")
    const doTipo = categorias.filter((c) => c.type === tipo)
    const escolhida = doTipo.find((c) => c.id === escolha)
    const n = ids?.length ?? 0

    async function gravar() {
        if (!ids || !escolha) return
        setGravando(true)
        try {
            await categorizarEmLote(ids, escolha === SEM_CATEGORIA ? null : escolha)
        } catch (e) {
            toastError(e instanceof Error ? e.message : "Não foi possível categorizar os lançamentos.")
            return
        } finally {
            setGravando(false)
        }
        const rotulo = `${numberBR(n)} ${n === 1 ? "lançamento" : "lançamentos"}`
        toastSuccess(escolhida ? `${rotulo} em ${escolhida.name}` : `${rotulo} sem categoria`)
        onDone(true)
    }

    return (
        <Dialog open={aberto} pending={gravando} onOpenChange={(o) => (o ? undefined : onDone(false))}>
            <DialogContent size="sm">
                <Form
                    layout="none"
                    pending={gravando}
                    onSubmit={(e) => {
                        e.preventDefault()
                        void gravar()
                    }}
                >
                    <DialogHeader>
                        <DialogTitle>Categorizar {numberBR(n)} {n === 1 ? "lançamento" : "lançamentos"}</DialogTitle>
                        <DialogDescription>A categoria vale para todos os marcados.</DialogDescription>
                    </DialogHeader>
                    <DialogBody>
                        <FormField label="Categoria">
                            <Combobox value={escolha} onValueChange={setEscolha}>
                                <ComboboxField>
                                    <FormControl>
                                        <ComboboxTrigger>
                                            <ComboboxValue
                                                placeholder="Escolha uma categoria"
                                                media={
                                                    escolhida ? <ColorTile size="xs" color={escolhida.color} /> : undefined
                                                }
                                            >
                                                {escolhida?.name ?? (escolha === SEM_CATEGORIA ? "Sem categoria" : undefined)}
                                            </ComboboxValue>
                                        </ComboboxTrigger>
                                    </FormControl>
                                </ComboboxField>
                                <ComboboxContent>
                                    <ComboboxInput placeholder="Buscar categoria…" />
                                    <ComboboxList>
                                        <ComboboxEmpty>Nenhuma categoria com esse nome.</ComboboxEmpty>
                                        <ComboboxGroup>
                                            {doTipo.map((c) => (
                                                <ComboboxItem
                                                    key={c.id}
                                                    value={c.id}
                                                    media={<ColorTile size="xs" color={c.color} />}
                                                >
                                                    {c.name}
                                                </ComboboxItem>
                                            ))}
                                            <ComboboxItem value={SEM_CATEGORIA} variant="none">
                                                Sem categoria
                                            </ComboboxItem>
                                        </ComboboxGroup>
                                    </ComboboxList>
                                </ComboboxContent>
                            </Combobox>
                        </FormField>
                    </DialogBody>
                    <DialogFooter>
                        <DialogClose asChild>
                            <FormCancel>Cancelar</FormCancel>
                        </DialogClose>
                        <FormSubmit disabled={!escolha}>Categorizar</FormSubmit>
                    </DialogFooter>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
