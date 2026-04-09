"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/auth-provider"
import { FormServicos } from "@/components/form-servicos"
import { Navbar } from "@/components/navbar"
import { AnimatedBackground } from "@/components/animated-background"
import { Card, CardContent } from "@/components/ui/card"
import { Loader2 } from "lucide-react"

export default function Page() {
  const router = useRouter()
  const { user, isLoading } = useAuth()

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login")
    }
  }, [user, isLoading, router])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen relative">
      <AnimatedBackground />
      <Navbar />
      
      <main className="container py-8 px-4 relative z-10">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-3 text-balance">
              Gerador de Relatórios Técnicos
            </h1>
            <p className="text-gray-600 max-w-xl mx-auto">
              Preencha as informações e o sistema criará um PDF profissional automaticamente.
            </p>
          </div>

          <Card className="border-gray-200 bg-white shadow-lg">
            <CardContent className="p-6">
              <FormServicos />
            </CardContent>
          </Card>
        </div>
      </main>

      <footer className="border-t border-gray-200 py-6 mt-10">
        <div className="container text-center text-sm text-gray-500">
          &copy; {new Date().getFullYear()} Rarotec Tecnologia. Todos os direitos reservados.
        </div>
      </footer>
    </div>
  )
}
