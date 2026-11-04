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
import { supabase, type WorkspaceDeleteImpact } from "@/lib/supabase"
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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
    CustomForm,
    FormInput,
    FormSubmit,
} from "@/components/ui/form"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { Muted } from "@/components/ui/typography"
import { CheckCircleIcon, TrashIcon } from "@heroicons/react/16/solid"

import { BanknotesIcon, UserCircleIcon, WalletIcon } from "@heroicons/react/20/solid"
import { CheckCircleIcon as CheckCircleOutlineIcon } from "@heroicons/react/24/outline"

const DATA_LOSS_ITEMS = [
    { label: "Todos os lançamentos", icon: BanknotesIcon },
    { label: "Carteiras e categorias", icon: WalletIcon },
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

    // Carteiras compartilhadas criadas pela pessoa somem para todos os membros.
    // Busca ao abrir: a lista em cache pode não ter uma carteira criada em outro aparelho.
    const { fetchWorkspaceDeleteImpact, workspaces } = useWorkspace()
    const [sharedOwned, setSharedOwned] = useState<
        { id: string; name: string; impact: WorkspaceDeleteImpact | null | undefined }[]
    >([])
    useEffect(() => {
        if (!open || !user) return
        let cancelled = false
        void (async () => {
            const { data } = await supabase
                .from("workspaces")
                .select("id,name")
                .eq("type", "shared")
                .eq("created_by", user.id)
            const rows = (data ?? []) as { id: string; name: string }[]
            if (cancelled) return
            setSharedOwned(rows.map((w) => ({ ...w, impact: undefined })))
            const withImpact = await Promise.all(
                rows.map(async (w) => {
                    const res = await fetchWorkspaceDeleteImpact(w.id)
                    return { ...w, impact: res.ok ? res.impact : null }
                }),
            )
            if (!cancelled) setSharedOwned(withImpact)
        })()
        return () => {
            cancelled = true
        }
    }, [open, user, fetchWorkspaceDeleteImpact])

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
    // diálogo a gaveta do telefone. Os passos somem na tela de sucesso, que não
    // é um passo — é o fim do fluxo.
    const header = (
        <DialogHeader>
            {success ? null : (
                <DialogSteps
                    current={step === "warning" ? 0 : 1}
                    total={2}
                    labels={["Aviso", "Confirmação"]}
                />
            )}
            <DialogMedia
                className={
                    success ? "text-success" : step === "warning" ? "text-destructive" : undefined
                }
            >
                {success ? <CheckCircleIcon /> : <TrashIcon />}
            </DialogMedia>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
    )

    const bodySuccess = (
        <DialogBody>
            <div className="flex flex-col items-center justify-center py-4">
                <div className="mb-4 rounded-full bg-success-muted p-4">
                    <CheckCircleOutlineIcon className="size-12 text-success" />
                </div>
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

    // O vermelho fica no poço do ícone e no botão final; o resto é uma lista calma.
    const bodyWarning = (
        <DialogBody>
            <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                    <Muted id="delete-account-loss-title">O que será apagado</Muted>
                    <Card padding="none">
                        <ItemGroup
                            variant="divided"
                            role="list"
                            aria-labelledby="delete-account-loss-title"
                        >
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
                    </Card>
                </div>
                {sharedOwned.length > 0 ? (
                    <Alert tone="warning">
                        <AlertTitle>Carteiras compartilhadas criadas por você</AlertTitle>
                        <AlertDescription>
                            <ul className="flex list-none flex-col gap-1" role="list">
                                {sharedOwned.map((w) => {
                                    const i = w.impact
                                    return (
                                        <li key={w.id}>
                                            {i === undefined ? (
                                                <>
                                                    <strong>{w.name}</strong> · Contando…
                                                </>
                                            ) : i ? (
                                                <>
                                                    <strong>{w.name}</strong>
                                                    {i.other_members > 0 ? (
                                                        <>
                                                            {" "}some para{" "}
                                                            {plural(i.other_members, "outro membro", "outros membros")}
                                                        </>
                                                    ) : null}
                                                    {" "}· {plural(i.transactions, "lançamento", "lançamentos")}
                                                </>
                                            ) : (
                                                <strong>{w.name}</strong>
                                            )}
                                        </li>
                                    )
                                })}
                            </ul>
                        </AlertDescription>
                    </Alert>
                ) : null}
                {/* Sozinho no corpo, o botão é `secondary`: a regra do par vale para o rodapé.
                    No telefone o botão desce para baixo do texto, na largura toda. */}
                <Card padding="none">
                    <Item variant="flush" className="max-sm:flex-col max-sm:items-stretch">
                        <ItemContent>
                            <ItemTitle>Quer guardar uma cópia antes?</ItemTitle>
                            {exportError ? (
                                <ItemDescription role="alert" className="text-destructive">
                                    {exportError}
                                </ItemDescription>
                            ) : null}
                        </ItemContent>
                        <ItemActions className="max-sm:w-full">
                            <Button
                                type="button"
                                variant="secondary"
                                className="max-sm:w-full"
                                disabled={exportando || workspaces.length === 0}
                                aria-busy={exportando || undefined}
                                onClick={() => void handleExport()}
                            >
                                {exportando ? <Spinner /> : null}
                                {exportando ? "Exportando meus dados…" : "Exportar meus dados"}
                            </Button>
                        </ItemActions>
                    </Item>
                </Card>
            </div>
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
