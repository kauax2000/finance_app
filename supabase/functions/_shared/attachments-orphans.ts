const UM_DIA_MS = 24 * 60 * 60 * 1000

/**
 * Os objetos do bucket `attachments` que não têm linha em `attachments` e já
 * passaram de 24 h. A folga cobre o envio em andamento: o objeto sobe antes da
 * linha, e um órfão recente pode ser só a linha que ainda vai chegar.
 */
export function orfaos(
  objetos: Array<{ name: string; created_at: string }>,
  caminhosComLinha: Set<string>,
  agoraIso: string,
): string[] {
  const corte = Date.parse(agoraIso) - UM_DIA_MS
  return objetos
    .filter((o) => !caminhosComLinha.has(o.name) && Date.parse(o.created_at) < corte)
    .map((o) => o.name)
}
