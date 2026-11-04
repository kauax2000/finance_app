"use client"

import { useTimeout } from "@/hooks/use-timeout"
import {
    Item,
    ItemActions,
    ItemContent,
    ItemDescription,
    ItemGroup,
    ItemMedia,
    ItemTitle,
} from "@/components/ui/item"
import { Card } from "@/components/ui/card"
import { baixarExportacao } from "@/lib/cofre/baixar"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/providers"
import { useWorkspace } from "@/components/workspace-provider"
import { supabase } from "@/lib/supabase"
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogMedia,
  DialogSteps,
  DialogTitle,
} from "@/components/ui/dialog"
import { Alert, AlertTitle } from "@/components/ui/alert"
import {
    CustomForm,
    FormInput,
    FormSubmit,
} from "@/components/ui/form"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { Separator } from "@/components/ui/separator"
import { Muted } from "@/components/ui/typography"
import { TrashIcon } from "@heroicons/react/16/solid"

import { BanknotesIcon, UserCircleIcon } from "@heroicons/react/20/solid"
import { CheckCircleIcon, TrashIcon as TrashOutlineIcon } from "@heroicons/react/24/outline"

const DATA_LOSS_ITEMS = [
    { label: "Lançamentos, carteiras e categorias", icon: BanknotesIcon },
    { label: "Perfil e preferências", icon: UserCircleIcon },
] as const

function plural(n: number, one: string, many: string): string {
    return `${n} ${n === 1 ? one : many}`
}

interface DeleteAccountDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function DeleteAccountDialog({ open, onOpenChange }: DeleteAccountDialogProps) {
    const { user, deleteAccount } = useAuth()
    const router = useRouter()
    const later = useTimeout()
    const [step, setStep] = useState<"warning" | "confirm">("warning")
    const [password, setPassword] = useState("")
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)

    // Carteiras compartilhadas criadas pela pessoa somem com a conta (cascata em
    // `created_by`), seja ela dona ou não hoje. Busca ao abrir, numa chamada só:
    // a lista em cache pode não ter uma carteira criada em outro aparelho.
    const { workspaces } = useWorkspace()
    const [sharedOwned, setSharedOwned] = useState<
        { id: string; name: string; impact: { other_members: number; transactions: number } | null | undefined }[]
    >([])
    useEffect(() => {
        if (!open || !user) return
        let cancelled = false
        void (async () => {
            const { data, error } = await supabase.rpc("get_account_delete_impact")
            if (cancelled) return
            if (error) {
                // Sem a contagem, ainda dá para mostrar os nomes: a lista simples.
                const { data: rows } = await supabase
                    .from("workspaces")
                    .select("id,name")
                    .eq("type", "shared")
                    .eq("created_by", user.id)
                if (!cancelled) setSharedOwned(((rows ?? []) as { id: string; name: string }[]).map((w) => ({ ...w, impact: null })))
                return
            }
            const lista = (Array.isArray(data) ? data : []) as {
                id: string
                name: string
                other_members: number
                transactions: number
            }[]
            setSharedOwned(
                lista.map((w) => ({
                    id: w.id,
                    name: w.name,
                    impact: { other_members: Number(w.other_members), transactions: Number(w.transactions) },
                })),
            )
        })()
        return () => {
            cancelled = true
        }
    }, [open, user])

    // A cópia antes de apagar: o mesmo `.zip` do Cofre aberto. Só baixa; o diálogo fica aberto.
    const [exportando, setExportando] = useState(false)
    const [exportError, setExportError] = useState<string | null>(null)
    const handleExport = async () => {
        if (exportando) return
        setExportando(true)
        setExportError(null)
        try {
            await baixarExportacao(workspaces.map((w) => ({ id: w.id, name: w.name })))
        } catch (e) {
            console.error("baixarExportacao:", e)
            setExportError("Não foi possível exportar agora. Tente novamente.")
        } finally {
            setExportando(false)
        }
    }

    const resetState = () => {
        setStep("warning")
        setPassword("")
        setError(null)
        setExportError(null)
        setSuccess(false)
    }

    const handleOpenChange = (next: boolean) => {
        if (!next && loading) return
        if (!next) {
            resetState()
        }
        onOpenChange(next)
    }

    const handleContinue = () => {
        setError(null)
        setStep("confirm")
    }

    const handleDelete = async () => {
        if (!password) {
            setError("Digite sua senha")
            return
        }

        setLoading(true)
        setError(null)

        const { error: deleteError } = await deleteAccount(password)

        if (deleteError) {
            setError(deleteError)
            setLoading(false)
            return
        }

        setSuccess(true)
        setLoading(false)

        later(() => {
            router.push("/")
            router.refresh()
        }, 2000)
    }

    const handleDeleteFormSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        void handleDelete()
    }

    const title = success
        ? "Conta excluída"
        : step === "warning"
          ? "Excluir conta"
          : "Confirme com sua senha"

    const description = success
        ? "Sua conta foi excluída com sucesso. Redirecionando..."
        : step === "warning"
          ? "Não dá para desfazer."
          : "Sua conta e os dados acima serão apagados."

    // Um cabeçalho só para as duas superfícies: `surface="auto"` faz do mesmo
    // diálogo a gaveta do telefone. O topo é o centrado do iOS: o poço, o
    // título, a descrição e os pontos. Os passos somem na tela de sucesso, que
    // não é um passo — é o fim do fluxo.
    const header = (
        <DialogHeader align="center">
            <DialogMedia variant="well" tone={success ? "success" : "destructive"}>
                {success ? <CheckCircleIcon /> : <TrashOutlineIcon />}
            </DialogMedia>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
            {success ? null : (
                <DialogSteps
                    variant="dots"
                    current={step === "warning" ? 0 : 1}
                    total={2}
                    labels={["Aviso", "Confirmação"]}
                />
            )}
        </DialogHeader>
    )

    const bodySuccess = (
        <DialogBody>
            {/* O tique mora no poço do cabeçalho: aqui fica só a frase. */}
            <div className="flex flex-col items-center justify-center py-4">
                <p className="text-center text-sm text-muted-foreground">
                    Todos os seus dados foram removidos permanentemente.
                </p>
            </div>
        </DialogBody>
    )

    // Sozinho, o botão é `secondary` — a regra do par não se aplica.
    const footerSuccess = (
        <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => handleOpenChange(false)}>
                Fechar
            </Button>
        </DialogFooter>
    )

    // Um painel só: o que se apaga, as carteiras que somem para outros e a cópia antes.
    // O vermelho fica no poço do ícone e no botão final; o âmbar, só nas carteiras.
    const bodyWarning = (
        <DialogBody>
            <Card variant="plain" padding="none">
                <div className="flex flex-col pt-3">
                    <Muted id="delete-account-loss-title" className="px-4 text-xs">
                        Será apagado
                    </Muted>
                    <ItemGroup role="list" aria-labelledby="delete-account-loss-title" className="gap-0">
                        {DATA_LOSS_ITEMS.map(({ label, icon: Icon }) => (
                            <Item key={label} variant="flush" role="listitem">
                                <ItemMedia variant="icon">
                                    <Icon className="size-5 text-muted-foreground" aria-hidden />
                                </ItemMedia>
                                <ItemContent>
                                    <ItemTitle>{label}</ItemTitle>
                                </ItemContent>
                            </Item>
                        ))}
                    </ItemGroup>
                </div>
                {sharedOwned.length > 0 ? (
                    <>
                        <Separator />
                        <div className="flex flex-col pt-3">
                            <Muted
                                id="delete-account-shared-title"
                                className="px-4 text-xs text-warning-muted-foreground"
                            >
                                Carteiras compartilhadas que você criou
                            </Muted>
                            <ItemGroup
                                role="list"
                                aria-labelledby="delete-account-shared-title"
                                className="gap-0"
                            >
                                {sharedOwned.map((w) => {
                                    const i = w.impact
                                    const meta =
                                        i === undefined
                                            ? "Contando…"
                                            : i
                                              ? i.other_members > 0
                                                  ? `${plural(i.other_members, "membro", "membros")} · ${i.transactions} lanç.`
                                                  : `${i.transactions} lanç.`
                                              : null
                                    return (
                                        // Linha baixa e sem ícone: o aviso é do rótulo da seção, e cinco
                                        // triângulos repetidos pesavam mais que os nomes.
                                        <Item key={w.id} variant="flush" size="sm" role="listitem">
                                            <ItemContent>
                                                <ItemTitle>{w.name}</ItemTitle>
                                            </ItemContent>
                                            {meta ? (
                                                <ItemActions>
                                                    <Muted className="nums">{meta}</Muted>
                                                </ItemActions>
                                            ) : null}
                                        </Item>
                                    )
                                })}
                            </ItemGroup>
                        </div>
                    </>
                ) : null}
                <Separator />
                <Item variant="flush">
                    <ItemContent>
                        <ItemTitle>Guardar uma cópia antes</ItemTitle>
                        {exportError ? (
                            <ItemDescription role="alert" className="text-destructive">
                                {exportError}
                            </ItemDescription>
                        ) : null}
                    </ItemContent>
                    <ItemActions>
                        <Button
                            type="button"
                            variant="link"
                            disabled={exportando || workspaces.length === 0}
                            aria-busy={exportando || undefined}
                            onClick={() => void handleExport()}
                        >
                            {exportando ? <Spinner /> : null}
                            {exportando ? "Exportando…" : "Exportar"}
                        </Button>
                    </ItemActions>
                </Item>
            </Card>
        </DialogBody>
    )

    // Cancelar (`tertiary`, pelo `showCloseButton`) e a ação que o passo propõe.
    // "Continuar" ainda não exclui nada: o `destructive` fica para o último passo.
    const footerWarning = (
        <DialogFooter showCloseButton>
            {/* Sair para o passo 2 no meio da exportação perderia a cópia. */}
            <Button type="button" disabled={exportando} onClick={handleContinue}>
                Continuar
            </Button>
        </DialogFooter>
    )

    const bodyConfirm = (
        <CustomForm
            onSubmit={handleDeleteFormSubmit}
            pending={loading}
            className="flex min-h-0 flex-1 flex-col"
        >
            <DialogBody>
                <div className="space-y-4">
                    <FormInput
                        id="delete-password"
                        label="Sua senha"
                        type="password"
                        placeholder="Digite sua senha"
                        value={password}
                        autoComplete="current-password"
                        onChange={(e) => setPassword(e.target.value)}
                    />

                    {error ? (
                        <Alert tone="destructive" size="sm">
                            <AlertTitle>{error}</AlertTitle>
                        </Alert>
                    ) : null}
                </div>
            </DialogBody>

            <DialogFooter
                start={
                    <Button
                        type="button"
                        variant="tertiary"
                        disabled={loading}
                        onClick={() => {
                            setStep("warning")
                            setError(null)
                        }}
                    >
                        Voltar
                    </Button>
                }
            >
                <FormSubmit
                    variant="destructive"
                    pendingLabel="Excluindo…"
                    disabled={!password}
                >
                    <TrashIcon />
                    Excluir conta
                </FormSubmit>
            </DialogFooter>
        </CustomForm>
    )

    return (
        <Dialog surface="auto" open={open} onOpenChange={handleOpenChange} pending={loading}>
            <DialogContent layout="fixed">
                {header}
                {success ? (
                    <>
                        {bodySuccess}
                        {footerSuccess}
                    </>
                ) : step === "warning" ? (
                    <>
                        {bodyWarning}
                        {footerWarning}
                    </>
                ) : (
                    bodyConfirm
                )}
            </DialogContent>
        </Dialog>
    )
}
