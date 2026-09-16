export type DeltaDirection = "up" | "down" | "flat"

/**
 * O tom de uma variação de total em dinheiro. Ele fala a língua do dinheiro
 * (`income`/`expense`), não a de estado (`success`/`destructive`): gasto que
 * sobe é mais saída, receita que sobe é mais entrada.
 */
export function deltaTone(
    direction: DeltaDirection,
    kind: "expense" | "income",
): "income" | "expense" | "neutral" {
    if (direction === "flat") return "neutral"
    return (direction === "up") === (kind === "expense") ? "expense" : "income"
}
