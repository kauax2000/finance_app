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
  DialogCloseButton,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Sheet,
  SheetContent,
} from "@/components/ui/sheet"
import { useIsMobile } from "@/hooks/use-mobile"
import { cn } from "@/lib/utils"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
    CustomForm,
    FormInput,
} from "@/components/ui/form"
import { Spinner } from "@/components/ui/spinner"
import { Button } from "@/components/ui/button"
import { CheckCircleIcon, ExclamationTriangleIcon, TrashIcon } from "@heroicons/react/16/solid"

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
    const isMobile = useIsMobile()
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

    const stickyHeader = (
        <DialogHeader>
            <>
            <DialogTitle
            className={cn(
            "flex items-center gap-2 font-heading text-base font-medium leading-tight",
            success
            ? undefined
            : step === "warning"
            ? "text-destructive"
            : undefined,
            )}
            >
            {success ? (
            <CheckCircleIcon className="h-5 w-5 shrink-0 text-success" aria-hidden />
            ) : (
            <TrashIcon className="h-5 w-5 shrink-0" aria-hidden />
            )}
            {title}
            </DialogTitle>
            <DialogDescription className="mt-1 text-sm text-muted-foreground">
            {description}
            </DialogDescription>
            </>
        </DialogHeader>
    )


    const headerDesktop = (
        <DialogHeader>
            <DialogTitle
                className={
                    success
                        ? "flex items-center gap-2"
                        : step === "warning"
                          ? "flex items-center gap-2 text-destructive"
                          : "flex items-center gap-2"
                }
            >
                {success ? (
                    <CheckCircleIcon className="h-5 w-5 shrink-0 text-success" aria-hidden />
                ) : (
                    <TrashIcon className="h-5 w-5 shrink-0" aria-hidden />
                )}
                {title}
            </DialogTitle>
            <DialogDescription className="text-xs leading-snug">{description}</DialogDescription>
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

    const footerSuccess = isMobile ? null : (
        <DialogFooter>
            <Button
                type="button"
                variant="outline"
                className="w-full sm:w-auto"
                onClick={() => handleOpenChange(false)}
            >
                Fechar
            </Button>
        </DialogFooter>
    )

    const bodyWarning = (
        <DialogBody>
            <div className="space-y-3">
                <Alert tone="destructive" size="sm">
                    <ExclamationTriangleIcon />
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

    const footerWarning = isMobile ? (
        <DialogFooter className="flex-col">
            <Button type="button" variant="destructive" size="xl" className="w-full" onClick={handleContinue}>
                Continuar
            </Button>
        </DialogFooter>
    ) : (
        <DialogFooter>
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
                Cancelar
            </Button>
            <Button type="button" variant="destructive" onClick={handleContinue}>
                Continuar
            </Button>
        </DialogFooter>
    )

    const bodyConfirm = (
        <CustomForm onSubmit={handleDeleteFormSubmit} className="flex min-h-0 flex-1 flex-col">
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
                            <ExclamationTriangleIcon />
                            <AlertTitle className="break-words">{error}</AlertTitle>
                        </Alert>
                    ) : null}
                </div>
            </DialogBody>

            {isMobile ? (
                <DialogFooter className="flex-col">
                    <Button
                        type="submit"
                        variant="destructive"
                        size="xl" className="w-full"
                        disabled={loading || !emailsMatch || !password}
                    >
                        {loading ? (
                            <>
                                <Spinner className="mr-2" />
                                Excluindo...
                            </>
                        ) : (
                            <>
                                <TrashIcon className="mr-2 h-4 w-4" />
                                Excluir conta
                            </>
                        )}
                    </Button>
                    <Button
                        type="button"
                        variant="outline"
                        className="w-full"
                        onClick={() => {
                            setStep("warning")
                            setError(null)
                        }}
                        disabled={loading}
                    >
                        Voltar
                    </Button>
                </DialogFooter>
            ) : (
                <DialogFooter>
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                            setStep("warning")
                            setError(null)
                        }}
                        disabled={loading}
                    >
                        Voltar
                    </Button>
                    <Button
                        type="submit"
                        variant="destructive"
                        size="sm"
                        disabled={loading || !emailsMatch || !password}
                    >
                        {loading ? (
                            <>
                                <Spinner className="mr-2" />
                                Excluindo...
                            </>
                        ) : (
                            <>
                                <TrashIcon className="mr-2 h-4 w-4" />
                                Excluir conta
                            </>
                        )}
                    </Button>
                </DialogFooter>
            )}
        </CustomForm>
    )

    const shellDesktop = (
        <>
            {headerDesktop}
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
        </>
    )

    const shellMobile = (
        <>
            {stickyHeader}
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
        </>
    )

    if (isMobile) {
        return (
            <Sheet open={open} onOpenChange={handleOpenChange}>
                <SheetContent
                    side="bottom"
                    fillMobileViewport
                >
                    {shellMobile}
                <DialogCloseButton />
                </SheetContent>
            </Sheet>
        )
    }

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent layout="fixed">
                {shellDesktop}
            </DialogContent>
        </Dialog>
    )
}
