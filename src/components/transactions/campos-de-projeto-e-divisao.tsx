"use client"

import { useQuery } from "@tanstack/react-query"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
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
import { FormControl, FormField, FormInput, FormSwitch } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Caption } from "@/components/ui/typography"
import { useWorkspace } from "@/components/workspace-provider"
import { identityToneFor } from "@/lib/avatar"
import { numberBR } from "@/lib/formatters"
import { pesosDigitados } from "@/lib/divisao/partes"
import { useAdultos } from "@/lib/divisao/use-adultos"
import { listarProjetos } from "@/lib/projetos/dados"
import { opcoesDoProjeto } from "@/lib/projetos/opcoes"
import { getInitials } from "@/lib/utils"

/** A carteira atual divide (`split`) e quem lê é adulto: só então a divisão aparece. */
function useDivisao(): string | null {
    const { currentWorkspace, isAdulto } = useWorkspace()
    return currentWorkspace?.split_mode === "split" && isAdulto ? currentWorkspace.id : null
}

function AvatarDoAdulto({ nome }: { nome: string }) {
    const tom = identityToneFor(null, nome)
    return (
        <Avatar size="xs" aria-hidden>
            <AvatarFallback className={`${tom.surface} ${tom.ink}`}>{getInitials(nome)}</AvatarFallback>
        </Avatar>
    )
}

/**
 * O projeto no formulário de despesa (Decisão 1): o convidado também escolhe
 * (a RLS deixa ler). Só os ativos, mais o atual se ele foi arquivado depois.
 * Sem projeto nenhum, ou sem a tabela no banco, não aparece. Quem esconde na
 * receita e na parcelada é o formulário (M7).
 */
export function ProjetoDoLancamento({ valor, onChange }: { valor: string; onChange: (id: string) => void }) {
    const { currentWorkspaceId } = useWorkspace()
    const lista = useQuery({
        queryKey: ["projetos", currentWorkspaceId] as const,
        enabled: Boolean(currentWorkspaceId),
        queryFn: () => listarProjetos(currentWorkspaceId as string),
    })
    if (!lista.data?.disponivel) return null
    const opcoes = opcoesDoProjeto(lista.data.dados, valor)
    if (opcoes.length === 0) return null
    const escolhido = opcoes.find((p) => p.id === valor)
    return (
        <FormField label="Projeto" optional>
            <Combobox value={valor} onValueChange={onChange}>
                <ComboboxField>
                    <FormControl>
                        <ComboboxTrigger>
                            <ComboboxValue placeholder="Sem projeto">{escolhido?.name}</ComboboxValue>
                        </ComboboxTrigger>
                    </FormControl>
                </ComboboxField>
                <ComboboxContent>
                    <ComboboxInput placeholder="Buscar projeto…" />
                    <ComboboxList>
                        <ComboboxEmpty>Nenhum projeto com esse nome.</ComboboxEmpty>
                        <ComboboxItem value="" variant="none">
                            Sem projeto
                        </ComboboxItem>
                        {opcoes.map((p) => (
                            <ComboboxItem key={p.id} value={p.id}>
                                {p.name}
                                {p.archived_at ? " (arquivado)" : ""}
                            </ComboboxItem>
                        ))}
                    </ComboboxList>
                </ComboboxContent>
            </Combobox>
        </FormField>
    )
}

/**
 * "Quem pagou" do formulário de despesa (Decisão 4): só numa carteira
 * dividida, só para o adulto, e só entre os adultos. O padrão é quem lança; o
 * salvar só manda a escolha quando ela muda alguma coisa.
 */
export function QuemPagou({ valor, onChange }: { valor: string; onChange: (id: string) => void }) {
    const ws = useDivisao()
    if (!ws) return null
    return <QuemPagouDaCarteira ws={ws} valor={valor} onChange={onChange} />
}

function QuemPagouDaCarteira({ ws, valor, onChange }: { ws: string; valor: string; onChange: (id: string) => void }) {
    const { lista } = useAdultos(ws)
    return (
        <FormField
            label="Quem pagou"
            description="A despesa vira partes entre os adultos; quem pagou fica com o crédito no saldo."
        >
            <Select value={valor} onValueChange={onChange}>
                <FormControl>
                    <SelectTrigger>
                        <SelectValue />
                    </SelectTrigger>
                </FormControl>
                <SelectContent>
                    {lista.some((a) => a.user_id === valor) ? null : (
                        <SelectItem value={valor}>
                            <AvatarDoAdulto nome="Você" />
                            Você
                        </SelectItem>
                    )}
                    {lista.map((a) => (
                        <SelectItem key={a.user_id} value={a.user_id}>
                            <AvatarDoAdulto nome={a.nome} />
                            {a.nome}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </FormField>
    )
}

/** A soma dos pesos digitados, para a `Caption`; vírgula decimal vale. */
export function somaDosPesos(valor: Record<string, string>): number | null {
    const pesos = pesosDigitados(valor)
    return pesos ? Math.round(pesos.reduce((s, p) => s + p.weight, 0) * 1e6) / 1e6 : null
}

/**
 * Os pesos de uma parcelada nova (Ruling 6): `null` usa os da carteira. Com
 * pesos próprios, o formulário os grava no plano logo depois de criá-lo.
 */
export function PesosDaParcelada({
    valor,
    onChange,
}: {
    valor: Record<string, string> | null
    onChange: (v: Record<string, string> | null) => void
}) {
    const ws = useDivisao()
    if (!ws) return null
    return <PesosDaCarteira ws={ws} valor={valor} onChange={onChange} />
}

function PesosDaCarteira({
    ws,
    valor,
    onChange,
}: {
    ws: string
    valor: Record<string, string> | null
    onChange: (v: Record<string, string> | null) => void
}) {
    const { lista } = useAdultos(ws)
    const soma = valor ? somaDosPesos(valor) : null
    return (
        <div className="flex flex-col gap-3">
            <FormSwitch
                label="Pesos próprios nesta compra"
                description={valor == null ? "Sem ligar, as parcelas dividem pelos pesos da carteira." : undefined}
                checked={valor != null}
                onCheckedChange={(on) =>
                    onChange(on ? Object.fromEntries(lista.map((a) => [a.user_id, "1"])) : null)
                }
            />
            {valor != null ? (
                <>
                    {lista.map((a) => (
                        <FormInput
                            key={a.user_id}
                            label={a.nome}
                            inputMode="decimal"
                            value={valor[a.user_id] ?? ""}
                            onChange={(e) => onChange({ ...valor, [a.user_id]: e.target.value })}
                        />
                    ))}
                    {soma == null ? (
                        <Caption role="alert" className="text-destructive">
                            Cada peso precisa ser maior que zero.
                        </Caption>
                    ) : (
                        <Caption>Soma dos pesos: {numberBR(soma)}</Caption>
                    )}
                </>
            ) : null}
        </div>
    )
}
