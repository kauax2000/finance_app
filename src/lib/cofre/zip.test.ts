import { describe, expect, it } from "vitest"
import { crc32, zipSemCompressao } from "./zip"

const u8 = (s: string) => new TextEncoder().encode(s)

describe("crc32", () => {
    it("bate com o valor conhecido de 'hello'", () => {
        expect(crc32(u8("hello"))).toBe(0x3610a686)
    })
})

describe("zipSemCompressao", () => {
    const zip = zipSemCompressao([
        { nome: "a.csv", conteudo: "Alimentação" },
        { nome: "LEIA-ME.txt", conteudo: "oi" },
    ])
    const dv = new DataView(zip.buffer, zip.byteOffset, zip.byteLength)

    it("começa com PK\\x03\\x04, tem diretório central e termina no PK\\x05\\x06 com 2 arquivos", () => {
        expect([...zip.slice(0, 4)]).toEqual([0x50, 0x4b, 0x03, 0x04])
        const fim = zip.length - 22
        expect(dv.getUint32(fim, true)).toBe(0x06054b50)
        expect(dv.getUint16(fim + 8, true)).toBe(2)
        expect(dv.getUint16(fim + 10, true)).toBe(2)
        const diretorio = dv.getUint32(fim + 16, true)
        expect(dv.getUint32(diretorio, true)).toBe(0x02014b50)
    })

    it("o diretório central aponta para o cabeçalho local de cada arquivo", () => {
        const fim = zip.length - 22
        let p = dv.getUint32(fim + 16, true)
        let esperado = 0
        for (const [nome, conteudo] of [["a.csv", "Alimentação"], ["LEIA-ME.txt", "oi"]]) {
            expect(dv.getUint32(p, true)).toBe(0x02014b50)
            const local = dv.getUint32(p + 42, true)
            expect(local).toBe(esperado)
            expect(dv.getUint32(local, true)).toBe(0x04034b50)
            expect(new TextDecoder().decode(zip.slice(local + 30, local + 30 + u8(nome).length))).toBe(nome)
            esperado = local + 30 + u8(nome).length + u8(conteudo).length
            p += 46 + dv.getUint16(p + 28, true)
        }
        expect(esperado).toBe(dv.getUint32(fim + 16, true))
    })

    it("os tamanhos são os bytes UTF-8 e a flag de nome UTF-8 está ligada", () => {
        const bytes = u8("Alimentação")
        expect(bytes.length).toBe(13)
        expect(dv.getUint16(6, true) & 0x0800).toBe(0x0800)
        expect(dv.getUint32(14, true)).toBe(crc32(bytes))
        expect(dv.getUint32(18, true)).toBe(13)
        expect(dv.getUint32(22, true)).toBe(13)
    })
})
