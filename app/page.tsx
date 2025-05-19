"use client"
import { FormServicos } from "@/components/form-servicos"
import { FormMigracao } from "@/components/form-migracao"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { FileText, ArrowRight } from "lucide-react"

export default function Page() {
  const [selectedForm, setSelectedForm] = useState<"servicos" | "migracao" | null>(null)

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-10 px-4">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-3xl font-bold mb-6 text-center text-gray-800">Gerador de Relatórios Técnicos</h1>
          <p className="text-center text-gray-600 mb-8">Selecione o tipo de relatório que deseja gerar para começar.</p>

          {!selectedForm ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
              <div
                className="bg-white rounded-lg shadow-md p-6 border border-gray-200 hover:border-blue-500 hover:shadow-lg transition-all cursor-pointer"
                onClick={() => setSelectedForm("servicos")}
              >
                <div className="flex items-center justify-center mb-4">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                    <FileText className="h-8 w-8 text-blue-600" />
                  </div>
                </div>
                <h2 className="text-xl font-semibold text-center mb-2">Relatório de Serviços</h2>
                <p className="text-gray-600 text-center mb-4">
                  Gere relatórios detalhados para serviços técnicos realizados.
                </p>
                <div className="flex justify-center">
                  <Button className="w-full">
                    Selecionar <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div
                className="bg-white rounded-lg shadow-md p-6 border border-gray-200 hover:border-blue-500 hover:shadow-lg transition-all cursor-pointer"
                onClick={() => setSelectedForm("migracao")}
              >
                <div className="flex items-center justify-center mb-4">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                    <FileText className="h-8 w-8 text-blue-600" />
                  </div>
                </div>
                <h2 className="text-xl font-semibold text-center mb-2">Relatório de Migração</h2>
                <p className="text-gray-600 text-center mb-4">
                  Gere relatórios detalhados para processos de migração de dados.
                </p>
                <div className="flex justify-center">
                  <Button className="w-full">
                    Selecionar <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-200">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-semibold">
                  {selectedForm === "servicos" ? "Formulário de Serviços" : "Formulário de Migração"}
                </h2>
                <Button variant="outline" onClick={() => setSelectedForm(null)}>
                  Voltar
                </Button>
              </div>

              {selectedForm === "servicos" ? <FormServicos /> : <FormMigracao />}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
