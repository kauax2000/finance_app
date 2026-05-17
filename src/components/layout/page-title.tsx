"use client"

import { DASHBOARD_PAGE_TITLES } from "@/config/navigation"
import {
    DashboardCategorySubrouteDesktopNav,
    isDashboardCategoriesSubroute,
} from "@/components/layout/dashboard-category-subroute-title"

type DashboardPageTitleProps = {
    pathname: string
}

export function DashboardPageTitle({ pathname }: DashboardPageTitleProps) {
    const mapped = DASHBOARD_PAGE_TITLES[pathname]
    if (mapped) {
        return <h1 className="truncate text-base font-medium leading-none">{mapped}</h1>
    }
    if (isDashboardCategoriesSubroute(pathname)) {
        return <DashboardCategorySubrouteDesktopNav pathname={pathname} />
    }
    return <h1 className="truncate text-base font-medium leading-none">Dashboard</h1>
}
