"use client"

import { useTimeout } from "@/hooks/use-timeout"
import {
    Item,
} from "@/components/ui/item"
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
import { CheckCircleIcon, TrashIcon } from "@heroicons/react/16/solid"

import { CheckCircleIcon as CheckCircleOutlineIcon } from "@heroicons/react/24/outline"
const DATA_LOSS_ITEMS = [
    "Todas as transações",
    "Todas as carteiras",
    "Todas as categorias",
    "Suas preferências de notificação",
    "Seu perfil de usuário",
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
    const [confirmEmail, setConfirmEmail] = useState("")
    const [password, setPassword] = useState("")
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)

    const userEmail = user?.email || ""

    // Carteiras compartilhadas criadas pela pessoa somem para todos os membros.
    // Busca ao abrir: a lista em cache pode não ter uma carteira criada em outro aparelho.
    const { fetchWorkspaceDeleteImpact } = useWorkspace()
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
    const emailsMatch = confirmEmail.toLowerCase() === userEmail.toLowerCase()

    const resetState = () => {
        setStep("warning")
        setConfirmEmail("")
        setPassword("")
        setError(null)
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
        if (!emailsMatch) {
            setError("O email não confere")
            return
        }

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
          : "Confirmar exclusão"

    const description = success
        ? "Sua conta foi excluída com sucesso. Redirecionando..."
        : step === "warning"
          ? "Esta ação é irreversível."
          : "Digite seu email e senha para confirmar a exclusão."

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
            <DialogTitle className={!success && step === "warning" ? "text-destructive" : undefined}>
                {title}
            </DialogTitle>
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

    const bodyWarning = (
        <DialogBody>
            <div className="space-y-3">
                <Alert tone="destructive" size="sm">
                    <AlertTitle>Atenção</AlertTitle>
                    <AlertDescription>
                        Não será possível recuperar sua conta nem os dados abaixo.
                    </AlertDescription>
                </Alert>
                <p className="text-sm text-muted-foreground">
                    Ao excluir sua conta, os seguintes dados serão removidos permanentemente:
                </p>
                <ul className="flex list-none flex-col gap-2" role="list">
                    {DATA_LOSS_ITEMS.map((item) => (
                        <li key={item}>
                            <Item variant="outline">{item}</Item>
                        </li>
                    ))}
                </ul>
                {sharedOwned.length > 0 ? (
                    <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">
                            Estas carteiras compartilhadas foram criadas por você e serão apagadas para
                            todos os membros:
                        </p>
                        <ul className="flex list-none flex-col gap-2" role="list">
                            {sharedOwned.map((w) => {
                                const i = w.impact
                                return (
                                    <li
                                        key={w.id}
                                        className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-sm"
                                    >
                                        <span className="block font-medium text-foreground">{w.name}</span>
                                        {i === undefined ? (
                                            <span className="text-xs text-muted-foreground">Contando…</span>
                                        ) : i ? (
                                            <span className="text-xs text-muted-foreground">
                                                {plural(i.other_members, "outro membro", "outros membros")} ·{" "}
                                                {plural(i.transactions, "lançamento", "lançamentos")}
                                            </span>
                                        ) : null}
                                    </li>
                                )
                            })}
                        </ul>
                    </div>
                ) : null}
            </div>
        </DialogBody>
    )

    // Cancelar (`tertiary`, pelo `showCloseButton`) e a ação que o passo propõe.
    // "Continuar" ainda não exclui nada: o `destructive` fica para o último passo.
    const footerWarning = (
        <DialogFooter showCloseButton>
            <Button type="button" onClick={handleContinue}>
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
                    {/* O "não confere" era um `<p>` solto, sem `aria-invalid` e sem
                        ligação com o campo; como `error` ele marca o campo e é
                        anunciado. */}
                    <FormInput
                        id="confirm-email"
                        label="Confirme seu email"
                        type="email"
                        placeholder={userEmail}
                        value={confirmEmail}
                        onChange={(e) => setConfirmEmail(e.target.value)}
                        className={emailsMatch && confirmEmail ? "border-success/50" : ""}
                        error={confirmEmail && !emailsMatch ? "O email não confere" : undefined}
                    />

                    <FormInput
                        id="delete-password"
                        label="Sua senha"
                        type="password"
                        placeholder="Digite sua senha"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        description="Necessário confirmar sua identidade para excluir a conta."
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
                    disabled={!emailsMatch || !password}
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
