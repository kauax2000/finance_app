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
        expect(fonte).toMatch(/size="icon-xl"\s+aria-label="Adicionar recibo"/)
        expect(fonte).toContain("<CameraIcon")
        expect(fonte).toMatch(/data-slot="lancamento-vidro"[\s\S]{0,200}searchFieldSurfaceClassName\.modal/)
        expect(fonte).toMatch(/aria-label="Adicionar recibo"[\s\S]{0,400}searchFieldSurfaceClassName\.modal/)
    })

    it("um vidro só: a frase não pinta o dela, e o painel tem o vidro irmão do conteúdo", () => {
        expect(fonte).toMatch(/<SearchInput\s+surface="field"\s+focusRing=\{false\}\s+size="xl"\s+className=\{cn\(\s+"border-0 bg-transparent"/)
        expect(fonte).toMatch(/data-slot="lancamento-vidro"[\s\S]*data-slot="lancamento-cabeca"[\s\S]*<SearchInput/)
        // O vidro do painel é irmão do conteúdo: o recorte e o transform do conteúdo não desligam o borrão.
        expect(fonte).toMatch(/data-slot="lancamento-fundo"[\s\S]{0,160}searchFieldSurfaceClassName\.modal[\s\S]*ref=\{recorteRef\}[\s\S]*ref=\{conteudoRef\}[\s\S]*<Revisao/)
        // A união das duas pílulas coladas é um vidro só, no mesmo material.
        expect(fonte).toMatch(/ref=\{uniaoRef\}[\s\S]{0,240}searchFieldSurfaceClassName\.modal/)
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

    it("o tipo é um trilho de abas, e o motivo é uma legenda", () => {
        expect(fonte).toMatch(/<Tabs[\s\S]{0,200}value=\{tipo\}/)
        expect(fonte).toMatch(/<TabsList[^>]*id="lancamento-tipo"/)
        expect(fonte).not.toContain('emEdicao("tipo"')
        expect(fonte).not.toMatch(/case "tipo":\s*return \(\s*<Select/)
        expect(fonte).toMatch(/<Caption[\s\S]{0,200}por causa de/)
        expect(fonte).toMatch(/t\.tipo !== "estorno" \|\| tipo === "estorno"/)
    })

    it("o painel em lista agrupada: o tipo no trilho, o valor em destaque e as linhas", () => {
        for (const campo of ["descricao", "categoria", "forma", "data", "parcelas"]) {
            expect(fonte).toContain(`campo: "${campo}"`)
        }
        expect(fonte).toContain('["tipo", "valor", ...CAMPOS.map((x) => x.campo)]')
        expect(fonte).toContain('x.campo !== "parcelas" || tipo === "parcelada"')
        expect(fonte).toContain("<MoneyDisplay")
        expect(fonte).toMatch(/<ItemGroup[\s\S]{0,160}rounded-row-lg bg-foreground\/5/)
        expect(fonte).toContain('<ItemMedia variant="tile" tone={x.tom} tint="vivid">')
        expect(fonte).toContain("<ItemChevron />")
        expect(fonte).toContain('{valor ?? "Escolher"}')
        expect(fonte).toContain('"Primeira cobrança"')
        expect(fonte).toContain("<DialogCloseButton")
        expect(fonte).toContain('"Não identificado"')
    })

    it("o Enter de um campo em edição confirma a edição, e não aprova", () => {
        expect(fonte).toMatch(/function confirmaComEnter[\s\S]{0,160}e\.preventDefault\(\)\s*fechar\(\)/)
        expect((fonte.match(/onKeyDown=\{confirmaComEnter\}/g) ?? []).length).toBe(2)
    })

    it("o \"Aprovar\" trava com o motivo, e o formulário completo é a ação ao lado", () => {
        expect(fonte).toContain("faltaParaLancar(")
        expect(fonte).toContain("MOTIVO_DA_FALTA[falta]")
        expect(fonte).toMatch(/<FormSubmit[\s\S]{0,40}form=\{formId\}[\s\S]{0,40}size="xl"[\s\S]{0,80}className="w-full"[\s\S]{0,80}disabled=\{motivo != null\}/)
        expect(fonte).toMatch(/variant="tertiary"[^>]*onClick=\{onAbrirFormulario\}/)
    })

    it("o campo vira o painel: o corpo rola e o rodapé fica", () => {
        expect(fonte).toMatch(/data-slot="lancamento-pilulas"[\s\S]*<SearchInput/)
        expect(fonte).toMatch(/data-slot="lancamento-vidro"[\s\S]{0,120}flex min-w-0 flex-1 items-center overflow-hidden rounded-full/)
        expect(fonte).not.toContain("lancamento-revisao")
        expect(fonte).toMatch(/<DialogBody className="pt-5">\s*<Form/)
        expect(fonte).toMatch(/<\/DialogBody>[\s\S]*<DialogFooter[\s\S]*<FormSubmit/)
    })

    it("o movimento: colar, absorver e abrir, pelos quadros puros, no relógio do motion", () => {
        for (const q of ["quadroDoColar(", "recorteDoAbsorver(", "quadroDoAbrir(", "cascata(", "quadroDoMais(", "quandoPintar("])
            expect(fonte).toContain(q)
        expect(fonte).toContain("...VOLTA_DA_PILULA")
        expect(fonte).toContain("...ABSORVER")
        expect(fonte).toContain("...MOLA,")
        expect(fonte).toContain("...MOLA_PALCO,")
        expect(fonte).toContain("if (p <= COLADO_EM) absorver()")
        expect(fonte).toContain("if (u >= ABRE_EM) abrir()")
        expect(fonte).toContain("vidro.style.clipPath")
        expect(fonte).toContain("SEPARACAO")
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
        expect(fonte).toContain("!campoEditado(campo, leitura.editados)")
        expect(fonte).toContain('campo === "categoria" && !campos.categoryId')
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
        expect(fonte).toMatch(/tipos\s*\.filter\([\s\S]{0,120}\.map\(/)
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
    it("as linhas têm o mesmo ladrilho, e o valor trunca", () => {
        expect(fonte).not.toMatch(/<ItemMedia>\s*<ColorTile/)
        expect(fonte).toMatch(/<ItemActions[\s\S]{0,400}<ColorTile size="xs"/)
        expect(fonte).toMatch(/min-w-0 truncate[\s\S]{0,600}valor \?\? "Escolher"/)
        expect(fonte).toMatch(/tipo === "parcelada"[\s\S]{0,200}`\$\{campos\.parcelas\}× de/)
        expect(fonte).not.toContain('.filter(Boolean).join(" · ")')
    })
})
