"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/providers"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetFooter,
    SheetTitle,
} from "@/components/ui/sheet"
import {
    MobileSheetFormDragStrip,
    MobileSheetFormStickyHeader,
    mobileFormSheetContentClassName,
} from "@/components/ui/mobile-sheet-form-chrome"
import { useIsMobile } from "@/hooks/use-mobile"
import { cn } from "@/lib/utils"
import { CustomForm } from "@/components/ui/form"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { CheckCircle2 } from "lucide-react"
import {
    ExclamationTriangleIcon,
    ArrowPathIcon,
    TrashIcon,
} from "@heroicons/react/24/outline"

const dialogFooterClass =
    "!mx-0 !mb-0 mt-0 shrink-0 flex flex-row flex-wrap justify-end gap-2 border-t border-border bg-background px-6 py-4 sm:flex-row"

const sheetFooterMobileClass =
    "mt-0 shrink-0 flex-col gap-2 border-t border-border bg-background px-4 py-4"

const DATA_LOSS_ITEMS = [
    "Todas as transações",
    "Todas as carteiras",
    "Todas as categorias",
    "Suas preferências de notificação",
    "Seu perfil de usuário",
] as const

interface DeleteAccountDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function DeleteAccountDialog({ open, onOpenChange }: DeleteAccountDialogProps) {
    const isMobile = useIsMobile()
    const { user, deleteAccount } = useAuth()
    const router = useRouter()
    const [step, setStep] = useState<"warning" | "confirm">("warning")
    const [confirmEmail, setConfirmEmail] = useState("")
    const [password, setPassword] = useState("")
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)

    const userEmail = user?.email || ""
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

        setTimeout(() => {
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
        <MobileSheetFormStickyHeader>
            <>
                <SheetTitle
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
                        <CheckCircle2 className="h-5 w-5 shrink-0 text-green-600" aria-hidden />
                    ) : (
                        <TrashIcon className="h-5 w-5 shrink-0" aria-hidden />
                    )}
                    {title}
                </SheetTitle>
                <SheetDescription className="mt-1 text-sm text-muted-foreground">
                    {description}
                </SheetDescription>
            </>
        </MobileSheetFormStickyHeader>
    )

    const scrollPadding = cn("min-h-0 flex-1 overflow-y-auto py-4", isMobile ? "px-4" : "px-6")

    const headerDesktop = (
        <DialogHeader className="shrink-0 px-6 py-4 text-left">
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
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-green-600" aria-hidden />
                ) : (
                    <TrashIcon className="h-5 w-5 shrink-0" aria-hidden />
                )}
                {title}
            </DialogTitle>
            <DialogDescription className="text-xs leading-snug">{description}</DialogDescription>
        </DialogHeader>
    )

    const bodySuccess = (
        <div className={scrollPadding}>
            <div className="flex flex-col items-center justify-center py-4">
                <div className="mb-4 rounded-full bg-green-500/15 p-4 dark:bg-green-950/40">
                    <CheckCircle2 className="h-12 w-12 text-green-600 dark:text-green-400" />
                </div>
                <p className="text-center text-sm text-muted-foreground">
                    Todos os seus dados foram removidos permanentemente.
                </p>
            </div>
        </div>
    )

    const footerSuccess = isMobile ? null : (
        <DialogFooter className={dialogFooterClass}>
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
        <div className={scrollPadding}>
            <div className="space-y-3">
                <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                    <ExclamationTriangleIcon className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    <p className="min-w-0 leading-relaxed">
                        <span className="font-medium">Atenção:</span> não será possível recuperar sua conta nem os dados abaixo.
                    </p>
                </div>
                <p className="text-sm text-muted-foreground">
                    Ao excluir sua conta, os seguintes dados serão removidos permanentemente:
                </p>
                <ul className="flex list-none flex-col gap-2" role="list">
                    {DATA_LOSS_ITEMS.map((item) => (
                        <li key={item}>
                            <div className="rounded-lg border border-border/80 bg-muted/20 px-3 py-2.5 text-sm text-foreground">
                                {item}
                            </div>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    )

    const footerWarning = isMobile ? (
        <SheetFooter className={sheetFooterMobileClass}>
            <Button type="button" variant="destructive" className="h-10 w-full" onClick={handleContinue}>
                Continuar
            </Button>
        </SheetFooter>
    ) : (
        <DialogFooter className={dialogFooterClass}>
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
            <div className={scrollPadding}>
                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="confirm-email">Confirme seu email</Label>
                        <Input
                            id="confirm-email"
                            type="email"
                            placeholder={userEmail}
                            value={confirmEmail}
                            onChange={(e) => setConfirmEmail(e.target.value)}
                            className={emailsMatch && confirmEmail ? "border-green-600/50" : ""}
                        />
                        {confirmEmail && !emailsMatch ? (
                            <p className="text-xs text-destructive">O email não confere</p>
                        ) : null}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="delete-password">Sua senha</Label>
                        <Input
                            id="delete-password"
                            type="password"
                            placeholder="Digite sua senha"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                        <p className="text-xs text-muted-foreground">
                            Necessário confirmar sua identidade para excluir a conta.
                        </p>
                    </div>

                    {error ? (
                        <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                            <ExclamationTriangleIcon className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                            <span className="min-w-0 break-words">{error}</span>
                        </div>
                    ) : null}
                </div>
            </div>

            {isMobile ? (
                <SheetFooter className={sheetFooterMobileClass}>
                    <Button
                        type="submit"
                        variant="destructive"
                        className="h-10 w-full"
                        disabled={loading || !emailsMatch || !password}
                    >
                        {loading ? (
                            <>
                                <ArrowPathIcon className="mr-2 h-4 w-4 animate-spin" />
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
                </SheetFooter>
            ) : (
                <DialogFooter className={dialogFooterClass}>
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
                                <ArrowPathIcon className="mr-2 h-4 w-4 animate-spin" />
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
            <MobileSheetFormDragStrip />
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
                    showCloseButton
                    className={mobileFormSheetContentClassName}
                >
                    {shellMobile}
                </SheetContent>
            </Sheet>
        )
    }

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="flex max-h-[min(90dvh,36rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-md">
                {shellDesktop}
            </DialogContent>
        </Dialog>
    )
}
