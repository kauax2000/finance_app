import { exportarTudo } from "@/lib/cofre/exportar"
import { localYmdFromDate } from "@/lib/transaction-date"

/**
 * Exporta as carteiras e baixa o `.zip`. Usada pelo Cofre aberto e pelo Excluir conta.
 * O erro sobe: quem chama mostra a mensagem.
 */
export async function baixarExportacao(carteiras: Array<{ id: string; name: string }>): Promise<void> {
    const blob = await exportarTudo(carteiras)
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `finance-app-${localYmdFromDate(new Date())}.zip`
    // Anexada e revogada um minuto depois: o Safari do iOS cancela o download de um
    // link solto e já cancelou o de uma URL revogada na hora.
    document.body.appendChild(a)
    a.click()
    a.remove()
    setTimeout(() => URL.revokeObjectURL(url), 60_000)
}
