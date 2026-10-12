import { describe, expect, it } from "vitest"
import { PASSWORD_RULES, failedPasswordRules, passwordStrength } from "./password-policy"

describe("a força da senha", () => {
  it("conta as regras cumpridas", () => {
    expect(passwordStrength("").score).toBe(0)
    expect(passwordStrength("abc").score).toBe(1)
    expect(passwordStrength("Abcdefg1!").score).toBe(PASSWORD_RULES.length)
  })

  it("tom pela nota: < 3 destrutivo, 3–4 aviso, 5 sucesso", () => {
    expect(passwordStrength("ab").tone).toBe("destructive")
    expect(passwordStrength("Abc1").tone).toBe("warning")
    expect(passwordStrength("Abcdefg1").tone).toBe("warning")
    expect(passwordStrength("Abcdefg1!").tone).toBe("success")
  })

  it("um símbolo fora da lista não conta", () => {
    expect(failedPasswordRules("Abcdefg1_").map((r) => r.id)).toEqual(["symbol"])
  })
})
