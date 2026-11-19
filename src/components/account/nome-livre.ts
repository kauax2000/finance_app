const SUFIXO_DE_MODO = / · (Voz|Toque)$/

/** O nome já termina num modo, então a lista não precisa repeti-lo. */
export const nomeTemModo = (nome: string) => SUFIXO_DE_MODO.test(nome)
