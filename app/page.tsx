"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/auth-provider"
import { FormServicos } from "@/components/form-servicos"
import { FormMigracao } from "@/components/form-migracao"
import { Navbar } from "@/components/navbar"
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
    <div className="min-h-screen bg-background relative">
      {/* Background interativo */}
      <div className="fixed inset-0 bg-grid-pattern opacity-20 pointer-events-none" />
      <div className="fixed inset-0 bg-gradient-radial pointer-events-none" />
      <div className="fixed inset-0 bg-gradient-radial-bottom pointer-events-none" />
      
      {/* Elementos decorativos */}
      <div className="fixed top-40 -left-20 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-pulse-glow pointer-events-none" />
      <div className="fixed bottom-40 -right-20 w-80 h-80 bg-accent/5 rounded-full blur-3xl animate-pulse-glow pointer-events-none" style={{ animationDelay: '2s' }} />
      
      <Navbar />
      
      <main className="container py-8 px-4 relative z-10">
        <div className="max-w-5xl mx-auto">
          {!selectedForm ? (
            <>
              <div className="text-center mb-10">
                <h1 className="text-3xl font-bold text-foreground mb-3 text-balance">
                  Gerador de Relatórios Técnicos
                </h1>
                <p className="text-muted-foreground max-w-xl mx-auto">
                  Selecione o tipo de relatório que deseja gerar. Preencha as informações 
                  e o sistema criará um PDF profissional automaticamente.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card 
                  className="group cursor-pointer card-glow bg-card/80 backdrop-blur-sm"
                  onClick={() => setSelectedForm("servicos")}
                >
                  <CardHeader className="text-center pb-2">
                    <div className="mx-auto mb-4 h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                      <Server className="h-8 w-8 text-primary" />
                    </div>
                    <CardTitle className="text-xl">Relatório de Serviços</CardTitle>
                    <CardDescription>
                      Para serviços técnicos, manutenções e atendimentos em campo
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="text-sm text-muted-foreground space-y-2 mb-6">
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
                    <Button className="w-full group-hover:bg-primary group-hover:text-primary-foreground">
                      Selecionar <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>

                <Card 
                  className="group cursor-pointer card-glow bg-card/80 backdrop-blur-sm"
                  onClick={() => setSelectedForm("migracao")}
                >
                  <CardHeader className="text-center pb-2">
                    <div className="mx-auto mb-4 h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                      <Database className="h-8 w-8 text-primary" />
                    </div>
                    <CardTitle className="text-xl">Relatório de Migração</CardTitle>
                    <CardDescription>
                      Para processos de migração de dados e sistemas
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="text-sm text-muted-foreground space-y-2 mb-6">
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
                    <Button className="w-full group-hover:bg-primary group-hover:text-primary-foreground">
                      Selecionar <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <Button variant="ghost" size="sm" onClick={() => setSelectedForm(null)}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Voltar
                </Button>
                <div>
                  <h1 className="text-2xl font-bold text-foreground">
                    {selectedForm === "servicos" ? "Relatório de Serviços" : "Relatório de Migração"}
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    Preencha todas as etapas para gerar o relatório
                  </p>
                </div>
              </div>

              <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
                <CardContent className="p-6">
                  {selectedForm === "servicos" ? <FormServicos /> : <FormMigracao />}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </main>

      <footer className="border-t border-border/40 py-6 mt-10">
        <div className="container text-center text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} Rarotec Tecnologia. Todos os direitos reservados.
        </div>
      </footer>
    </div>
  )
}
