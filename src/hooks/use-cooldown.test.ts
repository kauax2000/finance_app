import { describe, expect, it } from "vitest"
import { formatCooldown } from "./use-cooldown"

describe("a contagem do reenviar", () => {
  it("minutos e segundos com dois dígitos", () => {
    expect(formatCooldown(60)).toBe("1:00")
    expect(formatCooldown(42)).toBe("0:42")
    expect(formatCooldown(5)).toBe("0:05")
  })

  it("nunca negativa nem fracionada", () => {
    expect(formatCooldown(0)).toBe("0:00")
    expect(formatCooldown(-3)).toBe("0:00")
    expect(formatCooldown(9.4)).toBe("0:10")
  })
})
