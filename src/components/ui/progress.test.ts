import { join } from "node:path"
import { describe, expect, it } from "vitest"
import { arquivosTsx, lerFonte } from "@/test/fonte"

import {
  progressIndicatorVariants,
  progressToneForBands,
  progressVariants,
} from "./progress"
import { BUDGET_BANDS, CARD_LIMIT_BANDS } from "@/lib/budget-bands"

/**
 * A rede de guarda do `Progress`: o piso de 1%, o clamp e o `aria-valuetext` do estouro, que só
 * aparece para quem usa leitor de tela.
 */

const RAIZ = join(process.cwd(), "src")
const FONTE = lerFonte(join(RAIZ, "components/ui/progress.tsx"))

describe("Progress", () => {
  it("1. a escada de `bands` produz o tom certo em cada faixa", () => {
    const [aviso, perigo] = BUDGET_BANDS
    expect(progressToneForBands(0, BUDGET_BANDS)).toBe("success")
    expect(progressToneForBands(aviso - 0.01, BUDGET_BANDS)).toBe("success")
    // O corte é inclusivo: 85% já é o aviso, não o último ponto do verde.
    expect(progressToneForBands(aviso, BUDGET_BANDS)).toBe("warning")
    expect(progressToneForBands(perigo - 0.01, BUDGET_BANDS)).toBe("warning")
    expect(progressToneForBands(perigo, BUDGET_BANDS)).toBe("destructive")

    // A rampa do cartão é outra política, com os mesmos degraus.
    expect(progressToneForBands(29, CARD_LIMIT_BANDS)).toBe("success")
    expect(progressToneForBands(30, CARD_LIMIT_BANDS)).toBe("warning")
    expect(progressToneForBands(70, CARD_LIMIT_BANDS)).toBe("destructive")
  })

  it("2. as duas políticas continuam diferentes, e é de propósito", () => {
    // Elas têm a mesma forma e respondem a perguntas diferentes: um orçamento é
    // uma meta que a pessoa escolheu gastar, o limite do cartão é uma margem
    // que ela não quer encostar. Se alguém "uniformizar" os números, este teste
    // é quem pergunta por quê.
    expect(BUDGET_BANDS).toStrictEqual([85, 100])
    expect(CARD_LIMIT_BANDS).toStrictEqual([30, 70])
    expect(BUDGET_BANDS).not.toStrictEqual(CARD_LIMIT_BANDS)
  })

  it("3. o estouro vence os cortes", () => {
    // `value > max` é sempre `destructive`, qualquer que seja a rampa: no
    // cartão, 70% já seria destructive; o que o teste tranca é que o caminho do
    // estouro não passa pela escada.
    expect(FONTE).toMatch(/excedeu\s*\n?\s*\?\s*"destructive"/)
  })

  it("4. o clamp e o `aria-valuetext` do estouro", () => {
    // O Radix trata `value > max` como indeterminado e zera o `aria-valuenow`,
    // justamente na categoria que estourou.
    expect(FONTE).toContain("Math.min(max, Math.max(0, value))")
    expect(FONTE).toContain('"aria-valuetext"')
    // O spread condicional: um `aria-valuetext={undefined}` explícito apagava o
    // texto padrão do Radix. Já regrediu uma vez.
    expect(FONTE).toMatch(/\{\.\.\.\(excedeu \? \{ "aria-valuetext"/)
    // E o número anunciado é o **bruto**, não o limitado.
    expect(FONTE).toContain("`${Math.round(bruto)}%`")
  })

  it("5. o piso de largura de 1% é a altura da barra", () => {
    const sm = progressIndicatorVariants({ size: "sm" })
    const md = progressIndicatorVariants({ size: "md" })
    expect(sm).toContain("data-filled:min-w-1.5")
    expect(md).toContain("data-filled:min-w-2")
    // O piso combina com a altura do trilho: o mínimo é um ponto redondo.
    expect(progressVariants({ size: "sm" })).toContain("h-1.5")
    expect(progressVariants({ size: "md" })).toContain("h-2")
  })

  it("6. o trilho não volta a `bg-muted`", () => {
    // Com `bg-muted` a parte não consumida sumia no tema claro, e a barra lia
    // como um traço solto em vez de uma proporção: não diz "45% de", diz "45".
    const trilho = progressVariants({})
    expect(trilho).toContain("bg-input-fill")
    expect(trilho).not.toContain("bg-muted")
  })

  it("7. a marca usa o trilho de todo mundo, e o arco-íris é do trilho", () => {
    // O trilho da marca é o mesmo das outras barras, nos dois temas; um leito próprio aqui é a
    // regressão que este teste pergunta (a divergência da 1.4.11 está registrada em
    // `progress.tsx`).
    expect(progressVariants({ size: "md" })).toContain("bg-input-fill")
    expect(FONTE).not.toMatch(/brand-well|bg-black/)
    // `brand-rainbow-image` declara `--brand-rainbow` no elemento; sem ela a variável não
    // existe ali.
    expect(FONTE).toContain("brand-rainbow-image")
    // O degradê tem a largura do **trilho**, não a do preenchido: é isso que
    // faz completar a barra completar a marca.
    expect(FONTE).toContain("10000 / pct")
    // E a medição que justifica a divergência fica escrita no componente.
    expect(FONTE).toContain("1,42")
  })

  it("9. as versões novas: casa inteira, zonas no lugar do traço, rótulo registrado", () => {
    // A casa só acende coberta inteira — 7 de 12 são sete, nunca sete e meia.
    expect(FONTE).toContain("Math.floor((pct / 100) * casas + 1e-9)")
    // Com zonas o corte já está pintado: o traço sairia como segundo sinal.
    expect(FONTE).toContain("bands && !zones")
    // A barra só aponta `aria-labelledby` quando o rótulo existe; apontar para
    // um `id` ausente deixa o nome vazio.
    // E um `aria-label` da chamada vence, porque costuma ser o mais rico.
    expect(FONTE.match(/aria-labelledby=\{[^}]*hasLabel \? labelId : undefined\}/g)).toHaveLength(2)
    expect(FONTE).toContain('const nomeado = props["aria-label"] != null')
    // Acima de 24 casas a barra volta a ser contínua.
    expect(FONTE).toContain("const MAX_CASAS = 24")
    // O rodapé vai depois da barra no DOM, e não por `order`.
    expect(FONTE).not.toMatch(/\border-(?:first|last)\b/)
  })

  it("8. nenhuma tela desenha uma barra de progresso à mão", () => {
    // Barras de orçamento e de limite feitas com `div` + `bg-muted`, com o mapa de limiar
    // duplicado, não voltam.
    const culpados = arquivosTsx(join(RAIZ, "components"))
      .filter((f) => !f.includes(join("components", "ui")))
      .filter((f) => lerFonte(f).includes('role="progressbar"'))
    expect(culpados).toStrictEqual([])
  })
})
