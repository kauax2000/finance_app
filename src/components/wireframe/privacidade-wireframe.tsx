import Link from "next/link"
import { ROUTES } from "@/config/navigation"
import { WireframeBox } from "@/components/wireframe/wireframe-box"

/** Atualize a data sempre que o texto da política mudar. */
const ATUALIZADA_EM = "26/10/2026"

/**
 * A política de privacidade mínima (Bloco 3B, Decisão 13): pública, sem
 * sessão. Diz só o que o código faz hoje — a cadeia de IA mora em
 * `supabase/functions/_shared/ia-config.ts` e a redação em `_shared/redigir.ts`.
 */
export function PrivacidadeWireframe() {
    return (
        <main className="mx-auto max-w-2xl px-4 py-8">
            <WireframeBox bloco="3" titulo="Privacidade">
                <h1 className="text-base font-bold text-foreground">Privacidade</h1>
                <p>Atualizada em {ATUALIZADA_EM}.</p>

                <h2 className="font-bold text-foreground">O que o app guarda</h2>
                <ul className="list-disc space-y-1 pl-5">
                    <li>A conta: nome, e-mail e foto do perfil.</li>
                    <li>As carteiras e quem é membro de cada uma.</li>
                    <li>
                        Os lançamentos (valor, data, descrição, categoria e forma de pagamento), as categorias, os
                        orçamentos, as contas a pagar e as assinaturas.
                    </li>
                    <li>
                        Os cartões: apelido, os 4 últimos dígitos, validade, limite e os dias de fechamento e
                        vencimento. O número inteiro do cartão nunca é guardado.
                    </li>
                    <li>
                        Os anexos (foto ou PDF), num armazenamento privado: só abrem por um link que vale uma hora.
                    </li>
                    <li>Os convites para uma carteira: o e-mail de quem foi convidado.</li>
                    <li>
                        O código do link de convite, para conferir o convite quando ele é aberto. Fica só uma
                        impressão dele (hash): o link em si não é guardado.
                    </li>
                    <li>As notificações do app e as preferências de aviso de cada carteira.</li>
                    <li>
                        As sessões e os aparelhos conectados: tipo de aparelho, navegador, sistema, endereço IP e
                        último acesso.
                    </li>
                    <li>
                        O registro de atividade da conta (mudanças de perfil, e-mail, senha e da família), com o
                        endereço IP e o aparelho.
                    </li>
                    <li>A inscrição de cada aparelho nas notificações push, quando você as liga.</li>
                    <li>
                        O seu plano: o tipo, a situação e a data do fim do período. O teste grátis de 14 dias não
                        pede cartão.
                    </li>
                    <li>
                        Os tokens de captura do Atalho do iPhone: só uma impressão digital (hash) de cada um, nunca
                        o token.
                    </li>
                </ul>
                <p>
                    Os dados moram no Supabase, o banco e o armazenamento do app. Os membros de uma carteira veem os
                    dados dela. Ninguém de fora vê.
                </p>

                <h2 className="font-bold text-foreground">A cobrança do plano</h2>
                <ul className="list-disc space-y-1 pl-5">
                    <li>
                        O pagamento é feito pelo <strong>Asaas</strong>, a empresa brasileira de pagamentos que processa
                        a cobrança. O cartão você digita na página do Asaas: ele nunca passa pelo app.
                    </li>
                    <li>
                        O CPF que você informa em Planos vai direto ao Asaas, que o exige para a cobrança, junto com o
                        nome e o e-mail. O app não guarda o CPF.
                    </li>
                    <li>
                        Do Asaas, guardamos só o token do cartão (um código que o Asaas devolve e que só ele sabe
                        usar), os 4 últimos dígitos, a bandeira e o identificador do seu cadastro lá. Guardamos também o
                        endereço IP da compra, porque o Asaas o pede na renovação anual.
                    </li>
                    <li>
                        A nota fiscal de serviço (NFS-e) de cada ano pago é emitida pelo Asaas, com os dados do
                        cadastro de lá.
                    </li>
                </ul>

                <h2 className="font-bold text-foreground">Inteligência artificial</h2>
                <p>
                    A IA lê uma frase confusa, a foto de um recibo e o texto da fatura em PDF quando a leitura
                    normal não fecha. Ela só preenche: todo lançamento que passou por ela fica &quot;a conferir&quot;.
                </p>
                <ul className="list-disc space-y-1 pl-5">
                    <li>
                        O provedor principal é a <strong>Groq</strong>, nos Estados Unidos. Se ela falhar, a
                        reserva é a <strong>Cloudflare</strong> (Workers AI), também dos Estados Unidos. Por isso o
                        que vai à IA sai do Brasil: é uma transferência internacional de dados.
                    </li>
                    <li>Nenhum dos dois treina modelos com os seus dados. Os dois são usados no plano grátis.</li>
                    <li>
                        A Groq não guarda o que recebe quando a retenção zero (ZDR) está ligada na conta do app. A
                        Cloudflare guarda pelo prazo da política dela.
                    </li>
                </ul>

                <h2 className="font-bold text-foreground">O que sai antes do envio</h2>
                <p>Do texto (a frase e a fatura), o app tenta tirar automaticamente, antes de enviar:</p>
                <ul className="list-disc space-y-1 pl-5">
                    <li>o número do cartão (ficam só os 4 últimos dígitos);</li>
                    <li>CPF e CNPJ;</li>
                    <li>e-mail e telefone;</li>
                    <li>CEP e endereço;</li>
                    <li>o nome dos membros da carteira.</li>
                </ul>
                <p>
                    <strong>
                        A remoção é automática e pode falhar em formatos incomuns: não escreva dados pessoais no
                        texto. Fotos vão como estão.
                    </strong>{" "}
                    Numa imagem não há como tirar nada. Recibos e comprovantes costumam mostrar o cartão mascarado.
                </p>

                <h2 className="font-bold text-foreground">Limite e cache</h2>
                <ul className="list-disc space-y-1 pl-5">
                    <li>
                        Cada pessoa tem até 30 chamadas de IA por dia (no horário de Brasília). Uma fatura longa
                        gasta várias, uma por pedaço. Depois disso, o app segue sem IA até o dia seguinte.
                    </li>
                    <li>
                        A resposta da IA fica guardada, presa a uma impressão digital (hash) do que foi enviado, e
                        não ao seu nome. O mesmo pedido repetido é respondido daí, sem nova chamada e sem contar no
                        limite. Uma limpeza semanal apaga o que passou de 30 dias.
                    </li>
                    <li>
                        O app conta quantas vezes cada pessoa usou a IA por dia, e quantas chamadas cada provedor
                        atendeu, sem dizer de quem.
                    </li>
                </ul>

                <h2 className="font-bold text-foreground">Exportar e apagar</h2>
                <ul className="list-disc space-y-1 pl-5">
                    <li>
                        No <strong>Cofre aberto</strong> você vê tudo o que o app guarda, baixa todos os seus dados
                        (um arquivo ZIP de planilhas CSV) e apaga a conta. Exportar e apagar seguem liberados mesmo
                        sem plano.
                    </li>
                    <li>
                        Em <strong>Minha conta</strong>, &quot;Excluir conta&quot; apaga a conta, as carteiras que você
                        criou (também para os outros membros), os lançamentos, as categorias, as preferências e o
                        perfil. A exclusão pede a sua senha e não tem volta.
                    </li>
                </ul>

                <p className="space-x-4">
                    <Link href={ROUTES.COFRE} className="text-foreground underline">
                        Abrir o Cofre aberto (precisa entrar)
                    </Link>
                    <Link href={ROUTES.ACCOUNT} className="text-foreground underline">
                        Abrir Minha conta (precisa entrar)
                    </Link>
                </p>

                <h2 className="font-bold text-foreground">Contato</h2>
                <p>Dúvidas sobre os seus dados: &lt;EMAIL_DE_CONTATO&gt;.</p>
            </WireframeBox>
        </main>
    )
}
