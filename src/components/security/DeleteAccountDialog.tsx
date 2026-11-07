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
import { useEffect, useLayoutEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/providers"
import { useWorkspace } from "@/components/workspace-provider"
import { numberBR } from "@/lib/formatters"
import { supabase } from "@/lib/supabase"
import { brotarPassoNoLugar, recolherPassoNoLugar, segurarTecladoDe, semMovimento } from "@/lib/viagem-de-passo"
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
import { Muted } from "@/components/ui/typography"
import { ArrowDownTrayIcon, TrashIcon } from "@heroicons/react/16/solid"

import { BanknotesIcon, TagIcon, UserCircleIcon, WalletIcon } from "@heroicons/react/20/solid"
import { CheckCircleIcon, TrashIcon as TrashOutlineIcon } from "@heroicons/react/24/outline"

type Totais = { lancamentos: number; carteiras: number; categorias: number }

// O que some com a conta, com o total à direita (a RPC conta as carteiras que a
// pessoa criou: a pessoal e as compartilhadas, que vão juntas pela cascata).
const DATA_LOSS_ITEMS = [
    { label: "Lançamentos", icon: BanknotesIcon, total: "lancamentos" },
    { label: "Carteiras", icon: WalletIcon, total: "carteiras" },
    { label: "Categorias", icon: TagIcon, total: "categorias" },
    { label: "Perfil e preferências", icon: UserCircleIcon, total: null },
] as const satisfies ReadonlyArray<{ label: string; icon: unknown; total: keyof Totais | null }>

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

    // O tamanho do que some, numa chamada só ao abrir. Sem a contagem (erro de
    // rede), a lista aparece sem os números.
    const { workspaces } = useWorkspace()
    const [totais, setTotais] = useState<Totais | null>(null)
    useEffect(() => {
        if (!open || !user) return
        let cancelled = false
        void (async () => {
            const { data, error } = await supabase.rpc("get_account_delete_impact")
            if (cancelled || error || !data || typeof data !== "object" || Array.isArray(data)) return
            const d = data as Record<string, unknown>
            setTotais({
                lancamentos: Number(d.lancamentos) || 0,
                carteiras: Number(d.carteiras) || 0,
                categorias: Number(d.categorias) || 0,
            })
        })()
        return () => {
            cancelled = true
        }
    }, [open, user])

    // A cópia antes de apagar: um `.zip` com um CSV por tabela. Só baixa; o diálogo fica aberto.
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

    // A troca de passo é o gesto de `viagem-de-passo`: o corpo e o rodapé recolhem,
    // o cabeçalho fica (o poço assenta, o título sobe do desfoque) e o passo novo
    // brota do botão tocado. As entradas rodam no layout do passo novo.
    const cabecalhoRef = useRef<HTMLDivElement>(null)
    const corpoRef = useRef<HTMLDivElement>(null)
    const rodapeRef = useRef<HTMLDivElement>(null)
    const origem = useRef<DOMRect | null>(null)
    const troca = useRef(0)
    const soltarTeclado = useRef<(() => void) | null>(null)
    const [trocando, setTrocando] = useState(false)

    useLayoutEffect(() => {
        // O `autoFocus` da senha já pegou o foco: a ponte do teclado sai.
        soltarTeclado.current?.()
        soltarTeclado.current = null
        const [cab, corpo, pe, de] = [cabecalhoRef.current, corpoRef.current, rodapeRef.current, origem.current]
        origem.current = null
        if (de && cab && corpo && pe && !semMovimento()) brotarPassoNoLugar(corpo, cab, pe, de)
    }, [step])

    const irPara = async (next: "warning" | "confirm", botao: HTMLElement) => {
        if (trocando) return
        const [cab, corpo, pe] = [cabecalhoRef.current, corpoRef.current, rodapeRef.current]
        if (cab && corpo && pe && !semMovimento()) {
            const minha = ++troca.current
            origem.current = botao.getBoundingClientRect()
            // O iOS só abre o teclado com o foco dado no toque; a senha monta depois da saída.
            if (next === "confirm") soltarTeclado.current = segurarTecladoDe(corpo, "text")
            setTrocando(true)
            await recolherPassoNoLugar(corpo, cab, pe)
            setTrocando(false)
            // Fechado no meio da saída: o diálogo já recomeçou do aviso.
            if (minha !== troca.current) return
        }
        setError(null)
        setStep(next)
    }

    const resetState = () => {
        troca.current++
        origem.current = null
        soltarTeclado.current?.()
        soltarTeclado.current = null
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
        <DialogHeader ref={cabecalhoRef} align="center">
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
        <DialogBody ref={corpoRef}>
            <div data-passo>
                <Card variant="plain" padding="none">
                    <div className="flex flex-col pt-3">
                        <Muted id="delete-account-loss-title" className="px-4 text-xs">
                            Será apagado
                        </Muted>
                        <ItemGroup role="list" aria-labelledby="delete-account-loss-title" className="gap-0">
                            {DATA_LOSS_ITEMS.map(({ label, icon: Icon, total }) => (
                                <Item key={label} variant="flush" role="listitem">
                                    <ItemMedia variant="icon">
                                        <Icon className="size-5 text-muted-foreground" aria-hidden />
                                    </ItemMedia>
                                    <ItemContent>
                                        <ItemTitle>{label}</ItemTitle>
                                    </ItemContent>
                                    {total && totais ? (
                                        <ItemActions>
                                            <Muted className="nums">{numberBR(totais[total])}</Muted>
                                        </ItemActions>
                                    ) : null}
                                </Item>
                            ))}
                        </ItemGroup>
                    </div>
                    {/* A cópia é a saída, não mais uma coisa que some: um bloco à parte. */}
                    <Item variant="muted" size="lg" className="mt-3">
                        <ItemMedia variant="tile" tone="neutral">
                            <ArrowDownTrayIcon aria-hidden />
                        </ItemMedia>
                        <ItemContent>
                            <ItemTitle>Guarde uma cópia</ItemTitle>
                            {exportError ? (
                                <ItemDescription role="alert" className="text-destructive">
                                    {exportError}
                                </ItemDescription>
                            ) : (
                                <ItemDescription>Tudo num .zip</ItemDescription>
                            )}
                        </ItemContent>
                        <ItemActions>
                            <Button
                                type="button"
                                variant="secondary"
                                size="sm"
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
            </div>
        </DialogBody>
    )

    // Cancelar (`tertiary`, pelo `showCloseButton`) e a ação que o passo propõe.
    // "Continuar" ainda não exclui nada: o `destructive` fica para o último passo.
    const footerWarning = (
        <DialogFooter ref={rodapeRef} showCloseButton>
            {/* Sair para o passo 2 no meio da exportação perderia a cópia. */}
            <Button type="button" disabled={exportando} onClick={(e) => void irPara("confirm", e.currentTarget)}>
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
            <DialogBody ref={corpoRef}>
                <div data-passo className="space-y-4">
                    <FormInput
                        id="delete-password"
                        label="Sua senha"
                        type="password"
                        autoFocus
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
                ref={rodapeRef}
                start={
                    <Button
                        type="button"
                        variant="tertiary"
                        disabled={loading}
                        onClick={(e) => void irPara("warning", e.currentTarget)}
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
