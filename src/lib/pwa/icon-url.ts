import { PWA_ICON_VERSION } from "./constants"

export function pwaIconSrc(name: string) {
    return `/icons/${name}?v=${PWA_ICON_VERSION}`
}
