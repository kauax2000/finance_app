import { describe, expect, it } from "vitest"
import { lerFonte, semComentarios } from "@/test/fonte"

// O `accept="image/*"` abriria um comentário de bloco no corte e engoliria o resto do arquivo.
const fonte = semComentarios(
    lerFonte("src/components/transactions/lancamento-inteligente.tsx").replaceAll('"image/*"', '"image"')
)

describe("a tela do lançamento inteligente (v2)", () => {
    it("é um Dialog com a pílula da busca, e não a paleta do cmdk", () => {
        expect(fonte).toContain("<Dialog open={open}")
        expect(fonte).toContain("<SearchInput")
        expect(fonte).not.toContain("CommandDialog")
        expect(fonte).not.toContain("CommandDock")
        expect(fonte).not.toContain("CommandPage")
        expect(fonte).not.toContain("EXEMPLOS")
    })

    it("ao lado do campo, a pílula redonda do recibo, no mesmo vidro", () => {
        expect(fonte).toMatch(/size="icon-lg"\s+aria-label="Adicionar recibo"/)
        expect(fonte).toContain("<CameraIcon")
        expect(fonte).toMatch(/data-slot="lancamento-vidro"[\s\S]{0,200}searchFieldSurfaceClassName\.modal/)
        expect(fonte).toMatch(/aria-label="Adicionar recibo"[\s\S]{0,400}searchFieldSurfaceClassName\.modal/)
    })

    it("um vidro só: a frase não pinta o dela, e com a placa ela é o cabeçalho", () => {
        expect(fonte).toMatch(/<SearchInput\s+surface="field"\s+focusRing=\{false\}\s+className=\{cn\(\s+"border-0 bg-transparent"/)
        expect(fonte).toMatch(/data-slot="lancamento-vidro"[\s\S]*data-slot="lancamento-cabeca"[\s\S]*<SearchInput[\s\S]*<Revisao/)
        expect(fonte).toMatch(/size="icon-md"\s+aria-label="Adicionar recibo"/)
    })

    it("a casca não pinta: as pílulas e a placa são vidros soltos sobre o véu", () => {
        expect(fonte).toContain("<DialogOverlay />")
        expect(fonte).toContain("<DialogPrimitive.Content")
        expect(fonte).not.toContain("<DialogContent")
        expect(fonte).not.toMatch(/data-slot="lancamento-inteligente"[\s\S]{0,400}modalSurfaceClassName/)
    })

    it("a pílula da frase veste o feixe da paleta, mais rápido lendo, e o perde com a placa", () => {
        // A segunda exceção nomeada ao campo sem marca (a primeira é o `CommandDialog`).
        expect(fonte).toContain('!placa && "command-beam"')
        expect(fonte).toContain('"data-waiting": !placa || undefined')
        // Lendo (a frase ou o recibo), as durações da utility encurtam.
        expect(fonte).toContain('"data-lendo": lendoIA || undefined')
        expect(fonte).toContain('"data-lendo:[animation-duration:0s,1.2s,1.2s,1.6s]"')
        // Uma peça de marca por tela: nada mais aqui veste marca.
        expect(fonte).not.toMatch(/variant="brand|brandColorful|brandOutline|brand-glow|brand-rainbow/)
    })

    it("o Enter no campo lê a frase, não salva; o de um acento (IME) não lê", () => {
        expect(fonte).toMatch(/e\.key === "Enter" && !e\.nativeEvent\.isComposing\) \{\s*e\.preventDefault\(\)\s*leitura\.interpretar\(\)/)
        expect(fonte).not.toContain("leitura.lancar")
    })

    it("a revisão só aparece com os campos lidos, e é um Form com um submit só", () => {
        expect(fonte).toContain("const revisao = campos != null && !lendoIA")
        expect(fonte).toContain("const camposDaPlaca = revisao ? campos : open ? null")
        expect(fonte).toContain("{camposDaPlaca ? (")
        expect(fonte).toContain("<Form")
        expect(fonte.match(/<FormSubmit/g)).toHaveLength(1)
        expect(fonte).toContain("return leitura.aprovar()")
        expect(fonte).not.toContain('type="submit"')
    })

    it("todos os campos aparecem, e o não lido diz \"Não identificado\"", () => {
        for (const campo of ["tipo", "valor", "descricao", "categoria", "forma", "data", "parcelas"]) {
            expect(fonte).toContain(`campo: "${campo}"`)
        }
        expect(fonte).toContain('"Não identificado"')
        expect(fonte).toContain("{CAMPOS.map(")
    })

    it("o Enter de um campo em edição confirma a edição, e não aprova", () => {
        expect(fonte).toMatch(/function confirmaComEnter[\s\S]{0,160}e\.preventDefault\(\)\s*fechar\(\)/)
        expect((fonte.match(/onKeyDown=\{confirmaComEnter\}/g) ?? []).length).toBe(2)
    })

    it("o \"Aprovar\" trava com o motivo, e o formulário completo é a ação ao lado", () => {
        expect(fonte).toContain("faltaParaLancar(")
        expect(fonte).toContain("MOTIVO_DA_FALTA[falta]")
        expect(fonte).toMatch(/<FormSubmit[\s\S]{0,120}form=\{formId\}[\s\S]{0,120}disabled=\{motivo != null\}/)
        expect(fonte).toMatch(/variant="tertiary"[^>]*onClick=\{onAbrirFormulario\}/)
    })

    it("o campo vira a placa: o corpo rola e o rodapé fica", () => {
        expect(fonte).toMatch(/data-slot="lancamento-pilulas"[\s\S]*<SearchInput/)
        expect(fonte).toMatch(/data-slot="lancamento-vidro"[\s\S]{0,120}min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-surface/)
        expect(fonte).not.toContain("lancamento-revisao")
        expect(fonte).toMatch(/<DialogBody>\s*<Form/)
        expect(fonte).toMatch(/<\/DialogBody>[\s\S]*<DialogFooter[\s\S]*<FormSubmit/)
    })

    it("o movimento: recorte e transform no vidro, pelos quadros puros, na mola da casa", () => {
        for (const q of ["quadroDaPlaca(", "quadroDaFusao(", "quadroDoMais(", "quandoPintar("]) expect(fonte).toContain(q)
        expect(fonte).toContain("vidro.style.clipPath")
        expect(fonte).toContain("SEPARACAO")
        expect(fonte).toContain("MOLA_PALCO")
        expect(fonte).toContain("menu-unmorph")
        expect(fonte).toContain("useReducedMotion")
        expect(fonte).toContain("window.visualViewport")
        expect(fonte).toContain("[data-slot=bottom-bar-action]")
        // A casca nunca anima: no ancestral, o transform desligaria o borrão dos vidros.
        expect(fonte).not.toMatch(/casca\.style\.(transform|opacity|filter)/)
        expect(fonte).not.toContain("requestAnimationFrame(quadro")
    })

    it("frase mudada depois do Enter: a revisão esmaece e o Aprovar pede o Enter", () => {
        expect(fonte).toContain("leitura.texto !== leitura.fraseLida")
        expect(fonte).toContain('"Enter para atualizar"')
    })

    it("campo editado à mão perde o selo IA; categoria sem palpite pede Confira", () => {
        expect(fonte).toContain("!campoEditado(x.campo, leitura.editados)")
        expect(fonte).toContain('x.campo === "categoria" && !campos.categoryId')
    })

    it("a foto entra colada e solta, e todo botão cru declara o tipo", () => {
        expect(fonte).toContain("onPaste")
        expect(fonte).toContain("onDrop")
        expect(fonte).not.toMatch(/<button(?![^>]*type=)/)
    })

    it("não é wireframe, e só usa tokens e Heroicons", () => {
        expect(fonte).not.toContain("WireframeBox")
        expect(fonte).not.toMatch(/#[0-9a-f]{3,6}\b/i)
        expect(fonte).not.toContain("lucide")
    })
})

const hook = semComentarios(lerFonte("src/components/transactions/use-leitura-do-lancamento.ts"))
const dialogo = semComentarios(lerFonte("src/components/transactions/transaction-form-dialog.tsx"))

describe("a leitura do lançamento inteligente", () => {
    it("o convidado não vê Receita nem Estorno, e a leitura vira despesa", () => {
        expect(fonte).toMatch(/papel === "guest"[\s\S]*TIPOS\.filter/)
        expect(fonte).toContain("tipos.map(")
        expect(hook).toContain('papel === "guest"')
        expect(hook).toContain("soDespesa(")
    })

    it("Receita e Parcelada pedidas pelo ⌘K abrem o formulário; o compartilhar segue na paleta", () => {
        expect(dialogo).toMatch(/\(ligado && defaultLaunchKind === "expense"\) \|\| Boolean\(fraseInicial \|\| fotoInicial\)/)
    })

    it("inativa (fechada ou trocada pelo formulário), nada se aplica e o histórico não carrega", () => {
        expect(dialogo).toContain("ativo: usarPaleta && open")
        expect(hook).toContain("if (!ativo || !campos) return")
        expect(hook).toMatch(/if \(!ativo\) return\s+let vivo = true/)
        expect(hook).toContain("}, [ativo, queryClient, currentWorkspaceId])")
    })
})
