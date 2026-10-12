/** Um número só: o cadastro pedia 8 e a redefinição de senha aceitava 6. */
export const MIN_PASSWORD_LENGTH = 8

/**
 * A política inteira, num lugar só.
 *
 * Ela morava dentro de `signup-form.tsx`, e por isso **só o cadastro a
 * aplicava**: a redefinição de senha conferia o comprimento e mais nada. Dava
 * para cadastrar com uma senha forte e, pelo "esqueci minha senha", trocá-la
 * por uma que o cadastro teria recusado — o caminho de recuperação
 * enfraquecendo a regra que o de criação impõe.
 */
export type PasswordRule = {
    id: string
    /** O rótulo na lista viva, em minúscula: ele não é frase. */
    label: string
    test: (password: string) => boolean
}

export const PASSWORD_RULES: readonly PasswordRule[] = [
    {
        id: "length",
        label: `${MIN_PASSWORD_LENGTH}+ caracteres`,
        test: (p) => p.length >= MIN_PASSWORD_LENGTH,
    },
    { id: "lowercase", label: "minúscula", test: (p) => /[a-z]/.test(p) },
    { id: "uppercase", label: "maiúscula", test: (p) => /[A-Z]/.test(p) },
    { id: "digit", label: "número", test: (p) => /\d/.test(p) },
    {
        id: "symbol",
        label: "símbolo",
        test: (p) => /[!@#$%^&*(),.?":{}|<>]/.test(p),
    },
] as const

/** As regras que a senha ainda não cumpre. Vazio quer dizer válida. */
export function failedPasswordRules(password: string): PasswordRule[] {
    return PASSWORD_RULES.filter((rule) => !rule.test(password))
}

export type PasswordStrengthTone = "destructive" | "warning" | "success"

/** Quantas regras a senha cumpre, e o tom da barra: a régua é a política. */
export function passwordStrength(password: string): { score: number; tone: PasswordStrengthTone } {
    const score = PASSWORD_RULES.length - failedPasswordRules(password).length
    const tone: PasswordStrengthTone =
        score === PASSWORD_RULES.length ? "success" : score >= 3 ? "warning" : "destructive"
    return { score, tone }
}

export function isPasswordValid(password: string): boolean {
    return failedPasswordRules(password).length === 0
}

/**
 * A mensagem de campo. Uma frase que nomeia o que falta, e não um "senha
 * inválida" que manda a pessoa adivinhar — o piso do craft-floor para erro é
 * nomear o problema **e** a recuperação.
 */
export function passwordErrorMessage(password: string): string | undefined {
    if (!password) return "Senha é obrigatória"
    const failed = failedPasswordRules(password)
    if (failed.length === 0) return undefined
    if (failed.length === 1 && failed[0].id === "length") {
        return `A senha precisa de pelo menos ${MIN_PASSWORD_LENGTH} caracteres`
    }
    return `Falta na senha: ${failed.map((rule) => rule.label).join(", ")}`
}
