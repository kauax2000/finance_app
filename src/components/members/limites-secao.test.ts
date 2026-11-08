import { describe, expect, it } from "vitest"

import { lerFonte, semComentarios } from "@/test/fonte"

const fonte = semComentarios(lerFonte("src/components/members/limites-secao.tsx"))
const dialogo = semComentarios(lerFonte("src/components/members/adicionar-limite-dialog.tsx"))

describe("LimitesSecao", () => {
    it("seção com título e subtítulo soltos, fora de qualquer cartão", () => {
        const principal = fonte.slice(fonte.indexOf("const linhas"))
        expect(principal).toMatch(/<PageSectionHeader[\s\S]*<PageSectionTitle>Limites<\/PageSectionTitle>\s*<PageSectionDescription>/)
        expect(principal).toContain(
            "Defina quanto cada pessoa pode gastar por mês. A pessoa e o dono recebem um aviso ao chegar a 80% e a 100% do limite."
        )
        expect(principal.indexOf("<PageSectionDescription>")).toBeLessThan(principal.indexOf("<Card"))
        expect(principal.indexOf("<PageSectionDescription>")).toBeLessThan(principal.indexOf("<EmptyState"))
    })

    it("sem Collapsible, sem resumo e sem ouvintes de #limites", () => {
        for (const s of ["<Collapsible", "hashchange", "resumoDosLimites(", "addEventListener"]) {
            expect(fonte).not.toContain(s)
        }
    })

    it("Ver limite: rola uma vez até #limites quando os dados chegam (o hash do navegador passou antes)", () => {
        expect(fonte).toMatch(/useEffect\(\(\) => \{\s*if \(!ym \|\| rolou\.current\) return\s*rolou\.current = true\s*if \(window\.location\.hash === "#limites"\) document\.getElementById\("limites"\)\?\.scrollIntoView\(\{ block: "start" \}\)\s*\}, \[ym\]\)/)
        expect(fonte.indexOf("useEffect(")).toBeLessThan(fonte.indexOf("if (indisponivel)"))
    })

    it("a linha só existe com limite: sem ramo de sem limite nem Definir", () => {
        const linha = fonte.slice(fonte.indexOf("function LinhaDoLimiteItem"))
        for (const s of ["sem limite", '"Definir"', "situacao == null", "situacao != null", "linha.limite == null", "linha.limite != null"]) {
            expect(linha).not.toContain(s)
        }
        expect(linha).toContain("aria-label={`Editar o limite de ${linha.nome}`}")
    })

    it("a lista é só de quem tem limite, num Card padding none com ItemGroup divided", () => {
        expect(fonte).toContain("linhas.filter((l) => l.limite != null)")
        expect(fonte).toContain("linhas.filter((l) => l.limite == null)")
        const lista = fonte.slice(fonte.indexOf('<Card padding="none">'))
        expect(lista).toMatch(/^<Card padding="none">\s*<ItemGroup variant="divided">\s*\{comLimite\.map\(/)
        expect(lista).toContain("<LinhaDoLimiteItem")
    })

    it("Adicionar limite: só para o dono, só com alguém com limite e alguém sem, secondary com PlusIcon, sem size", () => {
        expect(fonte).toMatch(
            /actions=\{\s*podeEditar && comLimite\.length > 0 && semLimite\.length > 0 \? \(\s*<Button[^>]*variant="secondary"[\s\S]*?<PlusIcon[\s\S]*?Adicionar limite\s*<\/Button>\s*\) : undefined\s*\}/
        )
        const botao = fonte.slice(fonte.indexOf("actions={"), fonte.indexOf("Adicionar limite"))
        expect(botao).not.toContain("size=")
        expect(fonte).toMatch(/import \{[^}]*PlusIcon[^}]*\} from "@heroicons\/react\/16\/solid"/)
    })

    it("o vazio fica quando ninguém tem limite; o dono abre o diálogo de adicionar", () => {
        expect(fonte).toMatch(/comLimite\.length === 0 \? \(\s*<EmptyState variant="dashed"/)
        const vazio = fonte.slice(fonte.indexOf("<EmptyState"), fonte.indexOf("</EmptyState>"))
        expect(vazio).toContain("Controle o gasto de cada pessoa")
        expect(vazio).toContain("Escolha uma pessoa e o valor por mês.")
        expect(vazio).not.toContain("Defina um valor por mês")
        const dono = vazio.slice(vazio.indexOf("podeEditar ?"), vazio.indexOf(") : ("))
        const leitor = vazio.slice(vazio.indexOf(") : ("))
        expect(dono).toMatch(/<EmptyStateActions>\s*<Button[\s\S]*variant="secondary"[\s\S]*setAdicionando\(true\)[\s\S]*Definir limites/)
        expect(leitor).toContain("O dono da carteira pode definir quanto cada pessoa gasta por mês.")
        expect(leitor).not.toContain("<Button")
    })

    it("o diálogo de adicionar só existe para o dono, com as pessoas sem limite", () => {
        expect(fonte).toMatch(/\{podeEditar \? \(\s*<AdicionarLimiteDialog[\s\S]*semLimite=\{semLimite\}/)
        expect(fonte).toContain("await gravarLimite(workspaceId, userId, valor)")
    })

    it("a linha diz o gasto, a barra usa as faixas 80/100 e o lápis é só do dono", () => {
        for (const x of ["<AvatarDoMembro", '"Passou "', '"Sobram "', "text-destructive", "text-warning", "bands={[80, 100]}", "value={pct}"]) {
            expect(fonte).toContain(x)
        }
        const dono = fonte.slice(fonte.indexOf("if (!podeEditar)"))
        expect(dono).toMatch(/<DialogTrigger asChild>\s*<Button[\s\S]*variant="tertiary"[\s\S]*<PencilIcon/)
        expect(dono).toContain('size="icon-lg"')
        const leitor = fonte.slice(fonte.indexOf("if (!podeEditar)"), fonte.indexOf("async function rodar"))
        expect(leitor).not.toContain("DialogTrigger")
    })

    it("editar: formulário com dinheiro, Salvar e Remover limite", () => {
        expect(fonte).toContain('surface="auto"')
        expect(fonte).toContain("<span data-prefixo>Limite de </span>")
        expect(fonte).toContain("<FormInput")
        expect(fonte).toContain("<FormSubmit")
        expect(fonte).toContain("Remover limite")
        expect(fonte).toContain("lerLimiteDigitado(valor)")
        expect(fonte).toContain("setErro(ERRO_DO_LIMITE)")
        expect(fonte).not.toContain("Informe um valor")
    })

    it("indisponível fica como era: texto exato, sem vazio nem botão", () => {
        const ramo = fonte.slice(fonte.indexOf("if (indisponivel)"), fonte.indexOf("const linhas"))
        expect(ramo).toMatch(/<Card padding="none" role="status">\s*<Item[^>]*>\s*<ItemContent>\s*<ItemDescription>Os limites ainda não estão disponíveis nesta carteira\./)
        expect(ramo).not.toContain("EmptyState")
        expect(ramo).not.toContain("Adicionar limite")
    })

    it("não busca dados nem importa o wireframe", () => {
        for (const s of ["lerLimites(", "lerLancamentosDoMes(", "@/components/wireframe", "<Skeleton"]) {
            expect(fonte).not.toContain(s)
        }
        expect(fonte).toContain("await onMudou()")
    })
})

describe("AdicionarLimiteDialog", () => {
    it("passo 1: Adicionar limite, Escolha a pessoa., uma linha-botão por pessoa sem limite", () => {
        expect(dialogo).toContain('surface="auto"')
        expect(dialogo).toContain('"Adicionar limite"')
        expect(dialogo).toContain('"Escolha a pessoa."')
        expect(dialogo).toMatch(/<Item[^>]*interactive[^>]*asChild[^>]*>\s*<button\s+type="button"/)
        expect(dialogo).toContain("no mês")
        expect(dialogo).toContain("<ItemChevron")
    })

    it("passo 2: Limite de {nome}, FormInput money com foco, Voltar e Salvar", () => {
        expect(dialogo).toContain("`Limite de ${")
        expect(dialogo).toContain('"Quanto esta pessoa pode gastar por mês."')
        expect(dialogo).toMatch(/<FormInput\s[\s\S]*?money[\s\S]*?label="Limite mensal em R\$"/)
        expect(dialogo).toMatch(/autoFocus\b/)
        expect(dialogo).toContain("Voltar")
        expect(dialogo).toContain("<FormSubmit>Salvar</FormSubmit>")
        expect(dialogo).toContain("lerLimiteDigitado(valor)")
        expect(dialogo).toContain("setErro(ERRO_DO_LIMITE)")
        expect(dialogo).not.toContain("Informe um valor")
    })

    it("salvar relê o pacote antes de fechar: a pessoa e a lista ficam congeladas no diálogo", () => {
        expect(dialogo).toMatch(/if \(open\) \{\s*setLista\(semLimite\)/)
        expect(dialogo).toContain("setEscolhida(inicio === 2 ? (semLimite[0] ?? null) : null)")
        expect(dialogo).toContain("setEscolhida(l)")
        expect(dialogo).toContain("`Limite de ${escolhida?.nome")
        expect(dialogo).toContain("await onSalvar(escolhida.user_id, n)")
        const render = dialogo.slice(dialogo.indexOf("const titulo"))
        expect(render).not.toContain("semLimite")
        expect(render).toContain("lista.map(")
        expect(render).toContain("pessoas.length > 1 ?")
    })

    it("Voltar só aparece quando há passo 1 (mais de uma pessoa); senão é Cancelar", () => {
        expect(dialogo).toMatch(/passo === 2 && pessoas\.length > 1 \? \(\s*<Button[^>]*variant="tertiary"[\s\S]*?Voltar/)
        expect(dialogo).toContain("<FormCancel")
    })

    it("abrir recomeça: passo pelo passoInicial, pessoa e campo limpos", () => {
        expect(dialogo).toContain("passoInicial(pessoas.length)")
        expect(dialogo).toMatch(/if \(open\) \{[\s\S]*?setValor\(""\)[\s\S]*?setErro\(null\)/)
    })

    it("formulário: sem a caixa do maior passo (só dos tutoriais); o diálogo acompanha cada passo", () => {
        expect(dialogo).not.toContain("CaixaDoPasso")
        expect(dialogo).not.toContain("fantasma")
        expect(dialogo).toContain("{passo === 1 ? escolha : campo}")
    })
    it("a troca de passo é o gesto da pessoa que vira o título (viagem-do-passo)", () => {
        expect(dialogo).toContain("await sairDaEscolha(corpo, cab, pe, linha)")
        expect(dialogo).toContain("chegarAoValor(corpo, cab, pe, origem.current)")
        expect(dialogo).toContain("await sairDoValor(corpo, cab, pe)")
        expect(dialogo).toContain("chegarAEscolha(corpo, cab, pe)")
        // O nome tocado e o do título são os pontos da viagem.
        expect(dialogo.match(/<span data-nome>/g)?.length).toBe(2)
        // O teclado abre no toque: a ponte segura o foco até o campo montar.
        expect(dialogo).toContain("soltarTeclado.current = segurarTeclado(corpo)")
    })

    it("o passo 1 escolhe a pessoa em linhas de menu: sem fio, arredondadas, com a seta", () => {
        expect(dialogo).toContain('<ItemGroup className="-mx-3 w-auto gap-1">')
        expect(dialogo).not.toContain('variant="divided"')
        expect(dialogo).toMatch(/<Item key=\{l\.user_id\} interactive asChild>/)
        expect(dialogo).toContain("<ItemChevron />")
    })
    it("editar: Remover limite à esquerda do rodapé, só texto, com confirmação", () => {
        expect(fonte).toMatch(/<DialogFooter\s+start=\{[\s\S]*?variant="tertiary"[\s\S]*?className=\{tertiaryDestructiveClassName\}[\s\S]*?Remover limite/)
        // A tinta destrutiva do tertiary mora num lugar só.
        expect(lerFonte("src/lib/button-destructive-classes.ts")).toContain("text-destructive")
        expect(fonte).toContain("useConfirmDialog()")
        expect(fonte).toContain("Remover o limite de ${linha.nome}?")
        expect(fonte).not.toMatch(/variant="destructive"[\s\S]{0,120}Remover limite/)
    })
})
