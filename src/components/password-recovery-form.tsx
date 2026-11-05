"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"

import { supabase } from "@/lib/supabase"
import { formatAuthErrorMessagePt } from "@/lib/supabase-errors"
import { passwordErrorMessage } from "@/lib/password-policy"
import { isValidEmail } from "@/lib/email"
import { useTimeout } from "@/hooks/use-timeout"
import { lerLinkDeRecuperacao, recoveryLinks } from "@/lib/recovery-links"
import { PasswordRequirements } from "@/components/auth/password-requirements"
import { ResendButton } from "@/components/auth/resend-button"
import { AuthFormSkeleton, AuthShell } from "@/components/layout/auth-shell"
import { Alert, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { SplitShellFooter } from "@/components/ui/split-shell"
import { Form, FormInput, FormSubmit } from "@/components/ui/form"
import {
    InputGroup,
    InputGroupInput,
    InputGroupPasswordToggle,
} from "@/components/ui/input-group"
import {
    Field,
    FieldControl,
    FieldDescription,
    FieldError,
    FieldLabel,
} from "@/components/ui/field"

/**
 * Recuperar a senha, numa implementação só, **por link**.
 *
 * Uma porta pede o link e a outra o recebe:
 *
 * - `/forgot-password` entra no passo `email`: pede o e-mail, o Supabase manda
 *   o e-mail padrão com `{{ .ConfirmationURL }}` e o passo `sent` avisa;
 * - `/reset-password` é onde o link do e-mail cai, e entra direto no passo
 *   `password` quando o endereço trouxe tokens (ou o cliente já criou a
 *   sessão de recuperação). Link vencido ou com erro mostra "Link expirado".
 */
type Step = "email" | "sent" | "password" | "done"

export function PasswordRecoveryForm({
    /** `/reset-password` entra por aqui: ela só sabe ler o endereço do link. */
    entry = "request",
}: {
    entry?: "request" | "link"
}) {
    const router = useRouter()
    const later = useTimeout()
    const searchParams = useSearchParams()
    const links = useMemo(
        () => recoveryLinks(searchParams.get("next")),
        [searchParams],
    )

    const [step, setStep] = useState<Step>(entry === "link" ? "password" : "email")
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")
    const [fieldError, setFieldError] = useState<string>()
    /** Só no caminho do link: `null` enquanto o hash não foi lido. */
    const [linkValid, setLinkValid] = useState<boolean | null>(
        entry === "link" ? null : true,
    )

    // O hash só existe no cliente, e o Supabase pode consumi-lo antes de nós
    // (`detectSessionInUrl` é o padrão do cliente). Por isso a validade do link
    // é: sem erro no endereço, ou há token nele, ou já existe sessão de
    // recuperação.
    useEffect(() => {
        if (entry !== "link") return
        let cancelled = false

        const read = async () => {
            const link = lerLinkDeRecuperacao(window.location.hash, window.location.search)

            if (link.tipo === "erro") {
                if (!cancelled) setLinkValid(false)
                return
            }

            if (link.tipo === "tokens") {
                const { error } = await supabase.auth.setSession({
                    access_token: link.accessToken,
                    refresh_token: link.refreshToken,
                })
                if (!cancelled) setLinkValid(!error)
                return
            }

            const { data } = await supabase.auth.getSession()
            if (!cancelled) setLinkValid(Boolean(data.session))
        }

        void read()
        return () => {
            cancelled = true
        }
    }, [entry])

    const fail = (message: string) => {
        setError(formatAuthErrorMessagePt(message))
        setLoading(false)
    }

    // **`redirectTo` não é opcional aqui.** Sem ele o Supabase usa a Site
    // URL do projeto, que mora fora deste repositório — e se ela não
    // apontar para `/reset-password`, a porta do link nunca é alcançada.
    const requestLink = (address: string) =>
        supabase.auth.resetPasswordForEmail(address, {
            redirectTo: `${window.location.origin}${links.resetPath}`,
        })

    const sendLink = async (e: React.FormEvent) => {
        e.preventDefault()
        setError("")
        const trimmed = email.trim()
        if (!trimmed || !isValidEmail(trimmed)) {
            setFieldError("Digite um e-mail válido")
            return
        }
        setFieldError(undefined)
        setLoading(true)

        const { error } = await requestLink(trimmed)
        // Toda mensagem passa pelo tradutor. Antes estas duas telas mostravam o
        // `error.message` cru do GoTrue, em inglês — lacuna 4.
        if (error) return fail(error.message)

        setLoading(false)
        setStep("sent")
    }

    const savePassword = async (e: React.FormEvent) => {
        e.preventDefault()
        setError("")
        const message = passwordErrorMessage(password)
        if (message) {
            setFieldError(message)
            return
        }
        setFieldError(undefined)
        setLoading(true)

        const { error } = await supabase.auth.updateUser({ password })
        if (error) return fail(error.message)

        setLoading(false)
        setStep("done")
        // A sessão criada pelo link serviu para trocar a senha e nada
        // mais: entrar de novo com a senha nova é o que confirma que ela
        // funciona, e é o que fecha a sessão de recuperação.
        void supabase.auth.signOut()
        later(
            () => router.push(links.loginUpdated),
            3000,
        )
    }

    const errorAlert = error ? (
        <Alert tone="destructive">
            <AlertTitle>{error}</AlertTitle>
        </Alert>
    ) : null

    const passwordField = (
        <Field>
            <FieldLabel>Nova senha</FieldLabel>
            <InputGroup size="xl">
                <FieldControl>
                    <InputGroupInput
                        id="password"
                        type="password"
                        autoComplete="new-password"
                        placeholder="Crie uma senha"
                        value={password}
                        onChange={(e) => {
                            setPassword(e.target.value)
                            setError("")
                            setFieldError(undefined)
                        }}
                    />
                </FieldControl>
                <InputGroupPasswordToggle />
            </InputGroup>
            {fieldError ? <FieldError>{fieldError}</FieldError> : null}
            {!fieldError ? (
                <PasswordRequirements password={password} />
            ) : null}
        </Field>
    )

    // ---- Passo 1: para qual e-mail --------------------------------------
    if (step === "email") {
        return (
            <AuthShell
                scene="recovery.email"
                title="Recuperar senha"
                description="Enviamos um link para o seu e-mail."
                step={step}
                footer={
                    <SplitShellFooter>
                        <p>
                            Lembrou a senha?{" "}
                            <Link href={links.login}>Entrar</Link>
                        </p>
                    </SplitShellFooter>
                }
            >
                <div className="flex flex-col gap-(--space-block)">
                    {errorAlert}
                    <Form onSubmit={sendLink} pending={loading} noValidate>
                        <FormInput
                            id="email"
                            size="xl"
                            label="E-mail da conta"
                            type="email"
                            autoComplete="email"
                            placeholder="voce@email.com"
                            value={email}
                            onChange={(e) => {
                                setEmail(e.target.value)
                                setError("")
                                setFieldError(undefined)
                            }}
                            error={fieldError}
                        />
                        <FormSubmit size="xl" className="w-full">
                            Enviar link
                        </FormSubmit>
                    </Form>
                </div>
            </AuthShell>
        )
    }

    // ---- Passo 2: o link foi enviado ------------------------------------
    if (step === "sent") {
        return (
            <AuthShell
                scene="recovery.sent"
                icon="mail"
                title="Confira seu e-mail"
                step={step}
                description={
                    <>
                        Enviamos um link para{" "}
                        <strong className="font-medium text-foreground">
                            {email.trim()}
                        </strong>
                        . Abra no mesmo aparelho para criar a senha nova.
                    </>
                }
            >
                <FieldDescription>
                    O link vale por uma hora. Confira também o spam.
                </FieldDescription>

                <ResendButton
                    label="Reenviar link"
                    successMessage="Link reenviado"
                    onResend={async () => {
                        const { error } = await requestLink(email.trim())
                        if (error) throw new Error(error.message)
                    }}
                />
                <Button
                    variant="tertiary"
                    size="xl"
                    className="w-full"
                    onClick={() => {
                        setStep("email")
                        setError("")
                        setFieldError(undefined)
                    }}
                >
                    Usar outro e-mail
                </Button>
            </AuthShell>
        )
    }

    // ---- Passo 3: a senha nova ------------------------------------------
    if (step === "password") {
        // O caminho do link tem um estado a mais: o link pode ter expirado, e
        // aí não há nada a preencher.
        if (linkValid === null) {
            return (
                <AuthShell scene="recovery.link-checking" title="Nova senha" step={step}>
                    {/* Espera com forma, e não uma frase cinza: o esqueleto já
                        existe nesta mesma mudança, e `role="status"` é o que
                        faz o leitor de tela anunciar que algo está em curso —
                        o `AppBootstrapScreen` já fazia certo. */}
                    <div role="status" aria-live="polite" aria-busy="true">
                        <span className="sr-only">Conferindo o link…</span>
                        <AuthFormSkeleton fields={1} />
                    </div>
                </AuthShell>
            )
        }

        if (linkValid === false) {
            return (
                <AuthShell
                    scene="recovery.link-expired"
                    icon="expired"
                    title="Link expirado"
                    description="Este link de recuperação não vale mais. Peça um novo."
                    step="link-expired"
                    footer={
                        <SplitShellFooter>
                            <p>
                                Lembrou a senha?{" "}
                                <Link href={links.login}>Entrar</Link>
                            </p>
                        </SplitShellFooter>
                    }
                >
                    <Button asChild size="xl" className="w-full">
                        <Link href={links.forgot}>Pedir novo link</Link>
                    </Button>
                </AuthShell>
            )
        }

        return (
            <AuthShell
                scene="recovery.password"
                title="Nova senha"
                description="Ela precisa ser tão forte quanto a do cadastro."
                step={step}
            >
                <div className="flex flex-col gap-(--space-block)">
                    {errorAlert}
                    <Form onSubmit={savePassword} pending={loading} noValidate>
                        {passwordField}
                        <FormSubmit size="xl" className="w-full">
                            Salvar senha
                        </FormSubmit>
                    </Form>
                </div>
            </AuthShell>
        )
    }

    // ---- Fim -------------------------------------------------------------
    return (
        <AuthShell
            scene="recovery.done"
            icon="done"
            title="Senha atualizada"
            description="Entre com a senha nova. Levando você ao login…"
            step="done"
        >
            <Button asChild size="xl" className="w-full">
                <Link href={links.loginUpdated}>Entrar agora</Link>
            </Button>
        </AuthShell>
    )
}
