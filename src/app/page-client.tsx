"use client"

import { ROUTES } from "@/config/navigation"
import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { AppBootstrapScreen } from "@/components/layout/app-bootstrap-screen"
import { useAuth } from "@/components/providers"

export default function HomePage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading) {
      if (user) {
        router.push(ROUTES.DASHBOARD)
      } else {
        router.push(ROUTES.LOGIN)
      }
    }
  }, [user, loading, router])

  return <AppBootstrapScreen />
}
