import { describe, expect, it } from "vitest"

import { lerFonte, semComentarios } from "@/test/fonte"

const fonte = semComentarios(lerFonte("src/components/members/limites-secao.tsx"))

describe("LimitesSecao", () => {
    it("a lista é Collapsible card + CollapsibleRow com o resumo + ItemGroup divided + Item", () => {
        expect(fonte).toContain("<Collapsible")
        expect(fonte).toContain('variant="card"')
        expect(fonte).toMatch(/<CollapsibleRow[^>]*trailing=\{/)
        expect(fonte).toContain("resumoDosLimites(")
        expect(fonte).toContain("<CollapsibleContent")
        const principal = fonte.slice(fonte.indexOf("<Collapsible "), fonte.indexOf("</Collapsible>"))
        expect(principal).toMatch(/^<Collapsible variant="card"[^>]*>\s*<CollapsibleRow[^>]*trailing=\{resumoDosLimites\(linhas\)\}>\s*Limites\s*<\/CollapsibleRow>\s*<CollapsibleContent>/)
        expect(principal).toContain('<ItemGroup variant="divided"')
        expect(principal).toContain("<LinhaDoLimiteItem")
        expect(principal).not.toContain("<PageSection")
        expect(fonte).toContain("<ItemGroup variant=\"divided\"")
        expect(fonte).toContain("<Item ")
        expect(fonte).toContain("Defina quanto cada pessoa pode gastar por mês. A pessoa e o dono recebem um aviso ao chegar a 80% e a 100% do limite.")
    })

    it("a linha diz o gasto e a barra usa as faixas 80/100", () => {
        expect(fonte).toContain("no mês · sem limite")
        expect(fonte).toContain("currencyBRL(linha.limite!)")
        expect(fonte).toContain("bands={[80, 100]}")
        expect(fonte).toContain("value={pct}")
        expect(fonte).not.toContain("Math.min(pct")
        expect(fonte).not.toContain("Deixe sem limite")
    })

    it("a linha tem avatar, situação e porcentagem; o botão de ícone (lápis) só para o dono", () => {
        for (const x of ["<AvatarDoMembro", '"Passou "', '"Sobram "', "sem limite", "text-destructive", "text-warning"]) {
            expect(fonte).toContain(x)
        }
        expect(fonte).not.toContain("ItemChevron")
        const dono = fonte.slice(fonte.indexOf("if (!podeEditar)"))
        expect(dono).toMatch(/<DialogTrigger asChild>\s*<Button[\s\S]*variant="tertiary"[\s\S]*<PencilIcon/)
        expect(dono).toContain('size="icon-lg"')
        expect(dono).toContain('situacao == null ? "Definir" : "Editar"} o limite de')
        const leitor = fonte.slice(fonte.indexOf("if (!podeEditar)"), fonte.indexOf("async function rodar"))
        expect(leitor).not.toContain("DialogTrigger")
    })

    it("indisponível tem o texto exato; não busca nem espera sozinha (os dados vêm no pacote da tela)", () => {
        expect(fonte).toContain("Os limites ainda não estão disponíveis nesta carteira.")
        expect(fonte).toMatch(/<Card padding="none" role="status">\s*<Item[^>]*>\s*<ItemContent>\s*<ItemDescription>Os limites ainda/)
        for (const s of ["<SkeletonGroup", "<Skeleton", "lerLimites(", "lerLancamentosDoMes("]) {
            expect(fonte).not.toContain(s)
        }
        expect(fonte).not.toContain("Carregando…</p>")
        expect(fonte).toContain("await onMudou()")
    })

    it("só quem edita abre o diálogo, com formulário, dinheiro, Salvar e Remover limite", () => {
        expect(fonte).toContain('surface="auto"')
        expect(fonte).toContain("Limite de ${")
        expect(fonte).toContain("<FormInput")
        expect(fonte).toContain("money")
        expect(fonte).toContain("<FormSubmit")
        expect(fonte).toContain("Remover limite")
        expect(fonte).toContain("lerLimiteDigitado(valor)")
        expect(fonte).toContain("Informe um valor maior que zero, até R$ 9.999.999.999,99.")
        expect(fonte).not.toContain('type="number"')
    })

    it("o ramo indisponível não mostra resumo", () => {
        const ramo = fonte.slice(fonte.indexOf("if (indisponivel)"), fonte.indexOf("<Collapsible "))
        expect(ramo).toContain("Os limites ainda não estão disponíveis nesta carteira.")
        expect(ramo).not.toContain("resumoDosLimites")
    })

    it("recolhida por padrão; abre com #limites (no carregar e no hashchange) e rola até a seção", () => {
        expect(fonte).toContain("useState(false)")
        expect(fonte).toMatch(/open=\{aberta\}\s*onOpenChange=\{setAberta\}/)
        expect(fonte).toMatch(/function abrir\(\) \{\s*setAberta\(true\)/)
        expect(fonte).toContain('if (window.location.hash === "#limites") abrir()')
        expect(fonte).toContain('addEventListener("hashchange"')
        expect(fonte).toContain('removeEventListener("hashchange"')
        expect(fonte).toContain('document.getElementById("limites")?.scrollIntoView({ block: "start" })')
    })

    it("abre também no link para #limites seguido na própria tela (o Next usa pushState, sem hashchange)", () => {
        expect(fonte).toMatch(/document\.addEventListener\("click", [^,]+, true\)/)
        expect(fonte).toMatch(/document\.removeEventListener\("click", [^,]+, true\)/)
        expect(fonte).toContain('closest("a")')
        expect(fonte).toContain('endsWith("#limites")')
    })

    it("o vazio: só quando ninguém tem limite, com a copy do dono e a de quem não é dono", () => {
        expect(fonte).toContain("<EmptyState")
        expect(fonte).toContain('variant="plain"')
        expect(fonte).toContain('size="sm"')
        expect(fonte).toContain("<BellAlertIcon")
        expect(fonte).toContain("@heroicons/react/24/outline")
        expect(fonte).toContain("linhas.every((l) => l.limite == null)")
        expect(fonte).not.toContain("limites.length === 0")
        expect(fonte).toContain("Sem limites por enquanto")
        expect(fonte).toContain("O dono da carteira pode definir quanto cada pessoa gasta por mês.")
        const vazio = fonte.slice(fonte.indexOf("<EmptyState"), fonte.indexOf("</EmptyState>"))
        expect(vazio).not.toContain("<Button")
        expect(vazio).not.toContain("EmptyStateActions")
    })

    it("não importa o wireframe", () => {
        expect(fonte).not.toContain("@/components/wireframe")
    })
})
