/**
 * A checagem de e-mail do lado do cliente, num lugar só.
 *
 * O mesmo literal estava declarado em três formulários de acesso. Ele não
 * valida e-mail de verdade — nenhuma regex valida —, e não é esse o trabalho:
 * quem diz se o endereço existe é a confirmação por e-mail. Aqui é só o filtro
 * de erro de digitação óbvio, antes de gastar uma ida ao servidor.
 */
const SHAPE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function isValidEmail(value: string): boolean {
    return SHAPE.test(value.trim())
}
