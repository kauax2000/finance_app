/**
 * ZIP sem compressão ("store"), escrito à mão para a exportação do Cofre: CSV
 * é pequeno e a exportação é rara, então não vale uma dependência.
 * Nome e conteúdo em UTF-8; a flag 0x0800 diz isso ao descompactador.
 */

const TABELA = (() => {
    const t = new Uint32Array(256)
    for (let n = 0; n < 256; n++) {
        let c = n
        for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
        t[n] = c >>> 0
    }
    return t
})()

export function crc32(bytes: Uint8Array): number {
    let c = 0xffffffff
    for (const b of bytes) c = TABELA[(c ^ b) & 0xff] ^ (c >>> 8)
    return (c ^ 0xffffffff) >>> 0
}

function dataHoraDos(d: Date): { hora: number; data: number } {
    return {
        hora: (d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1),
        data: ((Math.max(d.getFullYear(), 1980) - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate(),
    }
}

export function zipSemCompressao(arquivos: Array<{ nome: string; conteudo: string }>): Uint8Array {
    const enc = new TextEncoder()
    const { hora, data } = dataHoraDos(new Date())
    const itens = arquivos.map((a) => {
        const nome = enc.encode(a.nome)
        const bytes = enc.encode(a.conteudo)
        return { nome, bytes, crc: crc32(bytes) }
    })

    const locais = itens.reduce((s, i) => s + 30 + i.nome.length + i.bytes.length, 0)
    const central = itens.reduce((s, i) => s + 46 + i.nome.length, 0)
    const saida = new Uint8Array(locais + central + 22)
    const dv = new DataView(saida.buffer)
    let p = 0
    const u16 = (v: number) => (dv.setUint16(p, v, true), (p += 2))
    const u32 = (v: number) => (dv.setUint32(p, v, true), (p += 4))
    const bruto = (b: Uint8Array) => (saida.set(b, p), (p += b.length))

    const deslocamentos: number[] = []
    for (const i of itens) {
        deslocamentos.push(p)
        u32(0x04034b50)
        u16(20) // versão necessária
        u16(0x0800) // nome em UTF-8
        u16(0) // método: store
        u16(hora)
        u16(data)
        u32(i.crc)
        u32(i.bytes.length)
        u32(i.bytes.length)
        u16(i.nome.length)
        u16(0)
        bruto(i.nome)
        bruto(i.bytes)
    }

    const inicioCentral = p
    itens.forEach((i, idx) => {
        u32(0x02014b50)
        u16(20) // versão de quem fez
        u16(20)
        u16(0x0800)
        u16(0)
        u16(hora)
        u16(data)
        u32(i.crc)
        u32(i.bytes.length)
        u32(i.bytes.length)
        u16(i.nome.length)
        u16(0) // extra
        u16(0) // comentário
        u16(0) // disco
        u16(0) // atributos internos
        u32(0) // atributos externos
        u32(deslocamentos[idx])
        bruto(i.nome)
    })

    u32(0x06054b50)
    u16(0)
    u16(0)
    u16(itens.length)
    u16(itens.length)
    u32(central)
    u32(inicioCentral)
    u16(0)
    return saida
}
