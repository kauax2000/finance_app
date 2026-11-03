"use client"

import Image from "next/image"
import { motion, useReducedMotion } from "motion/react"

import orbe from "./assets/siri-orbe.webp"

/**
 * A esfera de luz do vazio de "Lançar sem abrir o app": lembra a Siri pelas
 * cores do brilho dela, sem o logo da Apple (marca registrada). A imagem sai de
 * `scripts/atalho/cenas.py --orbe`; ela respira devagar, e com movimento
 * reduzido fica parada.
 */
export function OrbeDaSiri() {
    const reduzido = useReducedMotion()
    return (
        <motion.div
            aria-hidden
            className="mx-auto size-20"
            animate={reduzido ? undefined : { scale: [1, 1.08, 1] }}
            transition={{ duration: 4, ease: "easeInOut", repeat: Infinity }}
        >
            <Image src={orbe} alt="" sizes="80px" className="size-full" />
        </motion.div>
    )
}
