"use client"

import Link from "next/link"
import type { LucideIcon } from "lucide-react"
import {
    mobileNavTabIconClass,
    mobileNavTabInnerClass,
    mobileNavTabRootClass,
} from "@/components/layout/mobile-nav-tab-classes"

type MobileNavTabProps = {
    href: string
    name: string
    icon: LucideIcon
    active: boolean
}

export function MobileNavTab({ href, name, icon: Icon, active }: MobileNavTabProps) {
    return (
        <Link
            href={href}
            aria-current={active ? "page" : undefined}
            aria-label={name}
            className={mobileNavTabRootClass}
        >
            <span className={mobileNavTabInnerClass(active)}>
                <Icon className={mobileNavTabIconClass(active)} aria-hidden />
            </span>
        </Link>
    )
}
