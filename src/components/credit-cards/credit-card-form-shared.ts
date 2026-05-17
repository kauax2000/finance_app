export function parseExpiryFields(
    monthStr: string,
    yearStr: string
): { ok: true; month: number | null; year: number | null } | { ok: false; message: string } {
    const mTrim = monthStr.trim()
    const yTrim = yearStr.trim()
    if (!mTrim && !yTrim) {
        return { ok: true, month: null, year: null }
    }
    if (!mTrim || !yTrim) {
        return {
            ok: false,
            message: "Informe mês e ano de validade, ou deixe os dois em branco.",
        }
    }
    const m = parseInt(mTrim, 10)
    const y = parseInt(yTrim, 10)
    if (Number.isNaN(m) || m < 1 || m > 12) {
        return { ok: false, message: "Mês de validade deve ser entre 1 e 12." }
    }
    if (Number.isNaN(y) || y < 2000 || y > 2100) {
        return { ok: false, message: "Ano de validade deve ser entre 2000 e 2100." }
    }
    return { ok: true, month: m, year: y }
}
