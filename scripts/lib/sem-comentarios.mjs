/**
 * Apaga os comentários de linha e de bloco de um fonte TS/JS **sem mexer em strings**,
 * e **preserva os índices**: cada caractere de comentário vira espaço e a
 * quebra de linha fica, então o resultado tem o mesmo comprimento e as mesmas
 * linhas do original. O auditor e o catálogo do design system usam esta função.
 *
 * Entende `'…'`, `"…"` e `` `…` `` com `${…}` aninhado. Não entende literal de
 * regex: um `//` dentro de `/…/` seria lido como comentário.
 */
export function semComentariosPreservando(texto) {
  let saida = ""
  let aspas = null // ' " ou ` quando dentro de string
  const pilha = [] // um item por `${` aberto: a profundidade de `{` dentro dele
  for (let i = 0; i < texto.length; i++) {
    const c = texto[i]
    const n = texto[i + 1]
    if (aspas) {
      saida += c
      if (c === "\\" && n !== undefined) {
        saida += n
        i++
      } else if (c === aspas) {
        aspas = null
      } else if (aspas === "`" && c === "$" && n === "{") {
        saida += "{"
        i++
        pilha.push(0)
        aspas = null
      }
      continue
    }
    if (c === '"' || c === "'" || c === "`") {
      aspas = c
      saida += c
    } else if (c === "/" && n === "/") {
      while (i < texto.length && texto[i] !== "\n") {
        saida += " "
        i++
      }
      i-- // o \n volta a ser lido pelo laço
    } else if (c === "/" && n === "*") {
      saida += "  "
      i += 2
      while (i < texto.length && !(texto[i] === "*" && texto[i + 1] === "/")) {
        saida += texto[i] === "\n" ? "\n" : " "
        i++
      }
      if (i < texto.length) saida += "  "
      i++
    } else {
      if (pilha.length && c === "{") pilha[pilha.length - 1]++
      else if (pilha.length && c === "}") {
        if (pilha[pilha.length - 1] === 0) {
          pilha.pop()
          aspas = "`"
        } else pilha[pilha.length - 1]--
      }
      saida += c
    }
  }
  return saida
}
