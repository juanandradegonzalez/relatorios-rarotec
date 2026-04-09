"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/auth-provider"
import { FormServicos } from "@/components/form-servicos"
import { FormMigracao } from "@/components/form-migracao"
import { Navbar } from "@/components/navbar"
import { AnimatedBackground } from "@/components/animated-background"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText, ArrowRight, ArrowLeft, Server, Database, Loader2 } from "lucide-react"

export default function Page() {
  const router = useRouter()
  const { user, isLoading } = useAuth()
  const [selectedForm, setSelectedForm] = useState<"servicos" | "migracao" | null>(null)

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
          {!selectedForm ? (
            <>
              <div className="text-center mb-10">
                <h1 className="text-3xl font-bold text-gray-900 mb-3 text-balance">
                  Gerador de Relatórios Técnicos
                </h1>
                <p className="text-gray-600 max-w-xl mx-auto">
                  Selecione o tipo de relatório que deseja gerar. Preencha as informações 
                  e o sistema criará um PDF profissional automaticamente.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card 
                  className="group cursor-pointer bg-white border-gray-200 shadow-lg hover:shadow-xl hover:border-primary/30 transition-all"
                  onClick={() => setSelectedForm("servicos")}
                >
                  <CardHeader className="text-center pb-2">
                    <div className="mx-auto mb-4 h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                      <Server className="h-8 w-8 text-primary" />
                    </div>
                    <CardTitle className="text-xl text-gray-900">Relatório de Serviços</CardTitle>
                    <CardDescription className="text-gray-600">
                      Para serviços técnicos, manutenções e atendimentos em campo
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="text-sm text-gray-700 space-y-2 mb-6">
                      <li className="flex items-center gap-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                        Dados do cliente e local
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                        Descrição dos serviços realizados
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                        Equipamentos e materiais
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                        Anexos e fotos
                      </li>
                    </ul>
                    <Button className="w-full">
                      Selecionar <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>

                <Card 
                  className="group cursor-pointer bg-white border-gray-200 shadow-lg hover:shadow-xl hover:border-primary/30 transition-all"
                  onClick={() => setSelectedForm("migracao")}
                >
                  <CardHeader className="text-center pb-2">
                    <div className="mx-auto mb-4 h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                      <Database className="h-8 w-8 text-primary" />
                    </div>
                    <CardTitle className="text-xl text-gray-900">Relatório de Migração</CardTitle>
                    <CardDescription className="text-gray-600">
                      Para processos de migração de dados e sistemas
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="text-sm text-gray-700 space-y-2 mb-6">
                      <li className="flex items-center gap-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                        Informações do ambiente
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                        Processo de migração
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                        Verificações e testes
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                        Relatório completo
                      </li>
                    </ul>
                    <Button className="w-full">
                      Selecionar <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <Button variant="outline" size="sm" onClick={() => setSelectedForm(null)} className="text-gray-700 border-gray-300 hover:bg-gray-100">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Voltar
                </Button>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    {selectedForm === "servicos" ? "Relatório de Serviços" : "Relatório de Migração"}
                  </h1>
                  <p className="text-sm text-gray-600">
                    Preencha todas as etapas para gerar o relatório
                  </p>
                </div>
              </div>

              <Card className="border-gray-200 bg-white shadow-lg">
                <CardContent className="p-6">
                  {selectedForm === "servicos" ? <FormServicos /> : <FormMigracao />}
                </CardContent>
              </Card>
            </div>
          )}
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
