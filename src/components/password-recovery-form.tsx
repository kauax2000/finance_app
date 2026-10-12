"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"

import { supabase } from "@/lib/supabase"
import { formatAuthErrorMessagePt } from "@/lib/supabase-errors"
import { passwordErrorMessage } from "@/lib/password-policy"
import { isValidEmail } from "@/lib/email"
import { useTimeout } from "@/hooks/use-timeout"
import { recoveryLinks } from "@/lib/recovery-links"
import { PasswordRequirements } from "@/components/auth/password-requirements"
import { AuthStatus } from "@/components/auth/auth-status"
import { ResendButton } from "@/components/auth/resend-button"
import { RecoveryScene } from "@/components/auth/scenes/recovery-scene"
import { AuthFormSkeleton, AuthShell } from "@/components/layout/auth-shell"
import { Alert, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { SplitShellFooter } from "@/components/ui/split-shell"
import { Form, FormInput, FormSubmit } from "@/components/ui/form"
import {
    InputOTP,
    InputOTPGroup,
    InputOTPSlot,
} from "@/components/ui/input-otp"
import { REGEXP_ONLY_DIGITS } from "input-otp"
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

const OTP_LENGTH = 6

/**
 * Recuperar a senha, numa implementação só.
 *
 * Havia **dois** formulários que faziam a mesma coisa e não se conversavam:
 * `/forgot-password` pedia para colar um token à mão e `/reset-password` lia
 * `access_token` do hash de um link de e-mail. Nenhuma tela levava à segunda,
 * as duas tratavam erro de um jeito e a redefinição aceitava senha de 6
 * caracteres enquanto o cadastro exigia 8. Era a lacuna 3 de
 * `docs/JORNADAS.md`.
 *
 * Agora é um componente com três passos e **duas portas de entrada**:
 *
 * - `/forgot-password` entra no passo `email` — o caminho normal, código de
 *   seis dígitos;
 * - `/reset-password` entra direto no passo `password` quando o link do e-mail
 *   trouxe tokens no hash.
 *
 * As duas portas existem porque **o template de e-mail do Supabase não está
 * neste repositório** (`supabase/config.toml` não tem seção `[auth]`), então
 * daqui não dá para saber se ele manda código ou link. Uma implementação, as
 * duas entradas: a lacuna fecha sem apostar num template que não podemos ler.
 */
type Step = "email" | "code" | "password" | "done"

export function PasswordRecoveryForm({
    /** `/reset-password` entra por aqui: ela só sabe ler o hash. */
    entry = "code",
}: {
    entry?: "code" | "link"
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
    const [code, setCode] = useState("")
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
    // é: ou há token no hash, ou já existe sessão de recuperação.
    useEffect(() => {
        if (entry !== "link") return
        let cancelled = false

        const read = async () => {
            const hash = new URLSearchParams(window.location.hash.slice(1))
            const query = new URLSearchParams(window.location.search)
            const accessToken =
                hash.get("access_token") ?? query.get("access_token")
            const refreshToken =
                hash.get("refresh_token") ?? query.get("refresh_token") ?? ""

            if (accessToken) {
                const { error } = await supabase.auth.setSession({
                    access_token: accessToken,
                    refresh_token: refreshToken,
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
    const requestCode = (address: string) =>
        supabase.auth.resetPasswordForEmail(address, {
            redirectTo: `${window.location.origin}${links.resetPath}`,
        })

    const sendCode = async (e: React.FormEvent) => {
        e.preventDefault()
        setError("")
        const trimmed = email.trim()
        if (!trimmed || !isValidEmail(trimmed)) {
            setFieldError("Digite um e-mail válido")
            return
        }
        setFieldError(undefined)
        setLoading(true)

        const { error } = await requestCode(trimmed)
        // Toda mensagem passa pelo tradutor. Antes estas duas telas mostravam o
        // `error.message` cru do GoTrue, em inglês — lacuna 4.
        if (error) return fail(error.message)

        setLoading(false)
        setStep("code")
    }

    const verifyCode = async (e: React.FormEvent) => {
        e.preventDefault()
        setError("")
        if (code.length !== OTP_LENGTH) {
            setFieldError(`O código tem ${OTP_LENGTH} dígitos`)
            return
        }
        setFieldError(undefined)
        setLoading(true)

        const { error } = await supabase.auth.verifyOtp({
            email: email.trim(),
            token: code,
            type: "recovery",
        })
        if (error) return fail(error.message)

        setLoading(false)
        setStep("password")
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
        // A sessão criada pelo `verifyOtp` serviu para trocar a senha e nada
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
                scene={<RecoveryScene step={step} />}
                title="Recuperar senha"
                description="Enviamos um código de seis dígitos para o seu e-mail."
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
                    <Form onSubmit={sendCode} pending={loading} noValidate>
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
                            Enviar código
                        </FormSubmit>
                    </Form>
                </div>
            </AuthShell>
        )
    }

    // ---- Passo 2: o código ----------------------------------------------
    if (step === "code") {
        return (
            <AuthShell
                scene={<RecoveryScene step={step} />}
                title="Digite o código"
                step={step}
                description={
                    <>
                        Enviamos seis dígitos para{" "}
                        <strong className="font-medium text-foreground">
                            {email.trim()}
                        </strong>
                        .
                    </>
                }
            >
                <div className="flex flex-col gap-(--space-block)">
                    {errorAlert}
                    <Form onSubmit={verifyCode} pending={loading} noValidate>
                        <Field>
                            <FieldLabel>Código</FieldLabel>
                            <FieldControl>
                                {/* `size="xl"` alinha as casas com os campos
                                    e o botão desta tela — o `md` padrão
                                    deixava a grade de dígitos visivelmente
                                    menor que tudo em volta, na tela em que o
                                    código é o assunto. */}
                                <InputOTP
                                    id="code"
                                    size="xl"
                                    maxLength={OTP_LENGTH}
                                    // O código do e-mail é só de dígitos, e a
                                    // biblioteca aceita qualquer caractere sem
                                    // `pattern` — no teclado físico uma letra
                                    // entrava na casa.
                                    pattern={REGEXP_ONLY_DIGITS}
                                    value={code}
                                    onChange={(value) => {
                                        setCode(value)
                                        setError("")
                                        setFieldError(undefined)
                                    }}
                                >
                                    <InputOTPGroup>
                                        {Array.from({ length: OTP_LENGTH }, (_, i) => (
                                            <InputOTPSlot key={i} index={i} />
                                        ))}
                                    </InputOTPGroup>
                                </InputOTP>
                            </FieldControl>
                            <FieldDescription>
                                O código vale por uma hora. Confira também o
                                spam.
                            </FieldDescription>
                            {fieldError ? <FieldError>{fieldError}</FieldError> : null}
                        </Field>
                        <FormSubmit size="xl" className="w-full" pendingLabel="Conferindo…">
                            Continuar
                        </FormSubmit>
                    </Form>
                </div>

                <ResendButton
                    label="Reenviar código"
                    successMessage="Código reenviado"
                    onResend={async () => {
                        const { error } = await requestCode(email.trim())
                        if (error) throw new Error(error.message)
                    }}
                />
                <Button
                    variant="tertiary"
                    size="xl"
                    className="w-full"
                    onClick={() => {
                        setStep("email")
                        setCode("")
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
                <AuthShell scene={<RecoveryScene step="password" />} title="Nova senha" step={step}>
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
                <AuthStatus
                    icon="expired"
                    title="Link expirado"
                    description="Este link de recuperação não vale mais. Peça um código novo."
                    scene={<RecoveryScene step="email" />}
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
                        <Link href={links.forgot}>Pedir novo código</Link>
                    </Button>
                </AuthStatus>
            )
        }

        return (
            <AuthShell
                scene={<RecoveryScene step={step} />}
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
        <AuthStatus
            icon="done"
            title="Senha atualizada"
            description="Entre com a senha nova. Levando você ao login…"
            scene={<RecoveryScene step="done" />}
            step={step}
        >
            <Button asChild size="xl" className="w-full">
                <Link href={links.loginUpdated}>Entrar agora</Link>
            </Button>
        </AuthStatus>
    )
}
