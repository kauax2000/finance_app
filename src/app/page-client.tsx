"use client"

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
        router.push("/dashboard")
      } else {
        router.push("/login")
      }
    }
  }, [user, loading, router])

  return <AppBootstrapScreen />
}
