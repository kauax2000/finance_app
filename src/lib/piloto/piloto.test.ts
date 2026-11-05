import { describe, expect, it } from "vitest"

import { ROTULO_DA_ORIGEM } from "./piloto"

describe("ROTULO_DA_ORIGEM", () => {
    it("tem rótulo para as nove origens", () => {
        expect(Object.keys(ROTULO_DA_ORIGEM)).toHaveLength(9)
    })
})
