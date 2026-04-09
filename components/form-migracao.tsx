"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { MultiSelectSimple } from "@/components/multi-select-simple"
import { DatePickerSimple } from "@/components/date-picker-simple"
import { FileUploader } from "@/components/file-uploader"
import { generatePDF } from "@/lib/pdf-generator"
import { format } from "date-fns"
import { useToast } from "@/hooks/use-toast"
import { Stepper, StepContent } from "@/components/ui/stepper"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form"
import { Card, CardContent } from "@/components/ui/card"
import { Loader2, Plus, Trash2, Search, Flag, ChevronLeft, ChevronRight, FileCheck, Mail, Download, Send } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { estados, estadosBandeiras, getMunicipiosPorEstado } from "@/lib/estados-municipios"
import { cn } from "@/lib/utils"

const etapaSchema = z.object({
  nome: z.string(),
  situacao: z.string(),
  inicio: z.date(),
  fim: z.date(),
})

const solucaoSchema = z.object({
  data: z.date(),
  descricao: z.string(),
})

const formSchema = z.object({
  emails: z.string().optional(),
  emailCliente: z.string().email("Email inválido").optional().or(z.literal("")),
  estado: z.string().min(1, "Selecione o estado"),
  municipio: z.string().min(1, "Selecione o município"),
  entidadesOrgaos: z
    .array(
      z.object({
        entidade: z.string(),
        cnpj: z.string(),
      }),
    )
    .min(1, "Adicione pelo menos uma entidade"),
  modulos: z.array(z.string()).min(1, "Selecione pelo menos um módulo"),
  outroModulo: z.string().optional(),
  etapas: z.array(etapaSchema).optional(),
  situacoesCriticas: z.array(z.string()).optional(),
  outraSituacaoCritica: z.string().optional(),
  solucoes: z.array(solucaoSchema).optional(),
  detalhamentoAdicional: z.string().optional(),
  dataServico: z.date({ required_error: "Selecione a data do serviço" }),
  tecnicos: z.array(z.string()).min(1, "Selecione pelo menos um técnico"),
  clienteNomeCpf: z
    .array(
      z.object({
        nome: z.string(),
        cpf: z.string(),
      }),
    )
    .optional(),
})

type FormValues = z.infer<typeof formSchema>

const entidadesOptions = [
  "Prefeitura Municipal",
  "Câmara Municipal",
  "Instituto de Previdência",
  "Secretaria/Fundo de Saúde",
  "Secretaria/Fundo de Educação",
  "Secretaria/Fundo de Assistência Social (Idosos, Criança e Adolescente)",
  "Secretaria/Fundo de Transporte",
  "Secretaria/Fundo de Agricultura e Abastecimento",
  "Secretaria/Fundo de Energia e Iluminação",
  "Secretaria/Fundo de Águas e Esgoto",
  "Consórcio",
  "Governo Estadual (Executivo, Legislativo e Autarquia)",
  "Escritório Contábil/Jurídico",
]

const modulosOptions = [
  "Contabilidade",
  "Controle Interno",
  "Assinatura Digital",
  "Recursos Humanos",
  "Portal do Servidor",
  "Patrimônio",
  "Almoxarifado",
  "Contratos e Convênios",
  "Plano de Contratações Anuais",
  "Licitação e Pregão Gerencial",
  "Frota de Veículos",
  "Protocolo",
  "Processos e Documentos Digitais (Município Digital)",
  "Gerenciador Eletrônico de Documentos",
  "Aplicativo de Business Intelligence",
  "Tributos",
  "Nota Fiscal Eletrônica",
  "Rimob",
  "PagTributos",
  "Portal da Transparência",
  "Outro",
]

const etapasOptions = [
  "Análise da Infraestrutura Tecnológica do Município",
  "Solicitação dos Bancos de Dados do(s) Módulo(s) Contratado(s)",
  "Estudo do Banco de Dados",
  "Higienização e Estruturação do Banco de Dados",
  "Inserção dos Dados no Software da Rarotec",
  "Confronto dos Dados Inseridos no Software da Rarotec x Software Anterior/Relatórios",
  "Validação da Equipe Técnica do Cliente",
  "Entrega Definitiva do(s) Módulo(s)",
]

const situacoesEtapaOptions = [
  "Não Iniciado",
  "Em Planejamento",
  "Em Execução",
  "Pausado",
  "Cancelado",
  "Finalizado",
  "Homologado",
]

const situacoesCriticasOptions = [
  "Banco de Dados com falta de informações",
  "Banco de Dados com Difícil Entendimento (Desorganizado, Colunas Resumidas, Sem Vínculos entre Tabelas, Etc)",
  "Sistema Anterior com Cálculo/Fórmula Errado(a)",
  "Sistema Anterior com Registros Errados",
  "Procedimento Equivocado de Uso do Sistema Anterior",
  "Falta de acesso as informações do sistema anterior para conferência",
  "Falta de uso do Sistema por parte dos funcionários do Setor Demandante",
  "Outro",
]

interface Funcionario {
  id: string
  name: string
  email: string
}

export function FormMigracao() {
  const { toast } = useToast()

  const steps = [
    { title: "Localização", description: "Estado e município" },
    { title: "Entidades", description: "Órgãos e CNPJs" },
    { title: "Módulos", description: "Sistemas contratados" },
    { title: "Etapas", description: "Etapas da migração" },
    { title: "Situações", description: "Críticas e soluções" },
    { title: "Equipe", description: "Técnicos e data" },
    { title: "Anexos", description: "Documentos e email" },
  ]
  
  const [currentStep, setCurrentStep] = useState(0)
  const [isGenerating, setIsGenerating] = useState(false)
  const [anexos, setAnexos] = useState<File[]>([])
  const [clienteTemp, setClienteTemp] = useState({ nome: "", cpf: "" })
  const [entidadeTemp, setEntidadeTemp] = useState({ entidade: "", cnpj: "" })
  const [etapaTemp, setEtapaTemp] = useState<{
    nome: string
    situacao: string
    inicio: Date | undefined
    fim: Date | undefined
  }>({
    nome: "",
    situacao: "",
    inicio: undefined,
    fim: undefined,
  })
  const [solucaoTemp, setSolucaoTemp] = useState<{
    data: Date | undefined
    descricao: string
  }>({
    data: undefined,
    descricao: "",
  })
  const [municipiosDisponiveis, setMunicipiosDisponiveis] = useState<string[]>([])
  const [estadoBusca, setEstadoBusca] = useState("")
  const [municipioBusca, setMunicipioBusca] = useState("")
  const [imagemErros, setImagemErros] = useState<Record<string, boolean>>({})
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([])
  const [loadingFuncionarios, setLoadingFuncionarios] = useState(true)
  const [showPreview, setShowPreview] = useState(false)
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null)
  const [pdfData, setPdfData] = useState<{ base64: string; blob: Blob } | null>(null)
  const [isSendingEmail, setIsSendingEmail] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)

  // Buscar funcionários do banco de dados
  useEffect(() => {
    async function fetchFuncionarios() {
      try {
        const res = await fetch('/api/funcionarios')
        const data = await res.json()
        if (data.funcionarios) {
          setFuncionarios(data.funcionarios)
        }
      } catch (error) {
        console.error('Erro ao buscar funcionários:', error)
      } finally {
        setLoadingFuncionarios(false)
      }
    }
    fetchFuncionarios()
  }, [])

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      emails: "",
      emailCliente: "",
      estado: "",
      municipio: "",
      entidadesOrgaos: [],
      modulos: [],
      outroModulo: "",
      etapas: [],
      situacoesCriticas: [],
      outraSituacaoCritica: "",
      solucoes: [],
      detalhamentoAdicional: "",
      tecnicos: [],
      clienteNomeCpf: [],
    },
  })

  useEffect(() => {
    const estadoSelecionado = form.watch("estado")
    if (estadoSelecionado) {
      const municipios = getMunicipiosPorEstado(estadoSelecionado)
      setMunicipiosDisponiveis(municipios)
      form.setValue("municipio", "")
    } else {
      setMunicipiosDisponiveis([])
    }
  }, [form.watch("estado"), form])

  const handleFileChange = (files: File[]) => {
    setAnexos(files)
  }

  const formatCNPJ = (value: string) => {
    return value
      .replace(/\D/g, "")
      .replace(/(\d{2})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1/$2")
      .replace(/(\d{4})(\d)/, "$1-$2")
      .replace(/(-\d{2})\d+?$/, "$1")
  }

  const formatCPF = (value: string) => {
    return value
      .replace(/\D/g, "")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})/, "$1-$2")
      .replace(/(-\d{2})\d+?$/, "$1")
  }

  const handleCNPJChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCNPJ(e.target.value)
    setEntidadeTemp({ ...entidadeTemp, cnpj: formatted })
  }

  const handleCPFChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setClienteTemp({ ...clienteTemp, cpf: formatCPF(e.target.value) })
  }

  const adicionarEntidade = () => {
    if (entidadeTemp.entidade && entidadeTemp.cnpj) {
      const entidadesOrgaos = form.getValues("entidadesOrgaos") || []
      form.setValue("entidadesOrgaos", [...entidadesOrgaos, { ...entidadeTemp }])
      setEntidadeTemp({ entidade: "", cnpj: "" })
    } else {
      toast({
        title: "Erro",
        description: "Selecione a entidade e informe o CNPJ",
        variant: "destructive",
      })
    }
  }

  const removerEntidade = (index: number) => {
    const entidadesOrgaos = form.getValues("entidadesOrgaos") || []
    form.setValue(
      "entidadesOrgaos",
      entidadesOrgaos.filter((_, i) => i !== index),
    )
  }

  const adicionarCliente = () => {
    if (clienteTemp.nome && clienteTemp.cpf) {
      const clientes = form.getValues("clienteNomeCpf") || []
      form.setValue("clienteNomeCpf", [...clientes, { ...clienteTemp }])
      setClienteTemp({ nome: "", cpf: "" })
    } else {
      toast({
        title: "Erro",
        description: "Preencha o nome e CPF do cliente",
        variant: "destructive",
      })
    }
  }

  const removerCliente = (index: number) => {
    const clientes = form.getValues("clienteNomeCpf") || []
    form.setValue(
      "clienteNomeCpf",
      clientes.filter((_, i) => i !== index),
    )
  }

  const adicionarEtapa = () => {
    if (etapaTemp.nome && etapaTemp.situacao && etapaTemp.inicio && etapaTemp.fim) {
      const etapas = form.getValues("etapas") || []
      form.setValue("etapas", [...etapas, { ...etapaTemp } as z.infer<typeof etapaSchema>])
      setEtapaTemp({
        nome: "",
        situacao: "",
        inicio: undefined,
        fim: undefined,
      })
    } else {
      toast({
        title: "Erro",
        description: "Preencha todos os campos da etapa",
        variant: "destructive",
      })
    }
  }

  const removerEtapa = (index: number) => {
    const etapas = form.getValues("etapas") || []
    form.setValue(
      "etapas",
      etapas.filter((_, i) => i !== index),
    )
  }

  const adicionarSolucao = () => {
    if (solucaoTemp.data && solucaoTemp.descricao) {
      const solucoes = form.getValues("solucoes") || []
      form.setValue("solucoes", [...solucoes, { ...solucaoTemp } as z.infer<typeof solucaoSchema>])
      setSolucaoTemp({
        data: undefined,
        descricao: "",
      })
    } else {
      toast({
        title: "Erro",
        description: "Preencha a data e descrição da solução",
        variant: "destructive",
      })
    }
  }

  const removerSolucao = (index: number) => {
    const solucoes = form.getValues("solucoes") || []
    form.setValue(
      "solucoes",
      solucoes.filter((_, i) => i !== index),
    )
  }

  const onSubmit = async (data: FormValues) => {
    try {
      setIsGenerating(true)

      const result = await generatePDF({
        tipoRelatorio: "migracao",
        dados: data,
        anexos,
      })

      if (result.success && result.pdfBlob && result.pdfBase64) {
        const previewUrl = URL.createObjectURL(result.pdfBlob)
        setPdfPreviewUrl(previewUrl)
        setPdfData({ base64: result.pdfBase64, blob: result.pdfBlob })
        
        // Salvar relatório no banco de dados
        try {
          const clienteNome = data.entidadesOrgaos?.[0]?.entidade || "Cliente"
          const tecnicosNomes = data.tecnicos || []
          const dataAtendimento = data.dataServico 
            ? (data.dataServico instanceof Date 
                ? data.dataServico.toISOString().split('T')[0] 
                : data.dataServico)
            : new Date().toISOString().split('T')[0]
          
          await fetch("/api/relatorios", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              tipo: "migracao",
              cliente: clienteNome,
              municipio: data.municipio,
              estado: data.estado,
              dataAtendimento: dataAtendimento,
              tecnicos: tecnicosNomes,
              dados: data,
            }),
          })
        } catch (saveError) {
          console.error("Erro ao salvar relatório no histórico:", saveError)
        }
        
        setShowPreview(true)
      } else {
        throw new Error(result.message || "Erro ao gerar o relatório")
      }
    } catch (error) {
      console.error("Erro ao gerar relatório:", error)
      toast({
        title: "Erro ao gerar relatório",
        description: "Ocorreu um erro ao gerar o relatório. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const handleDownloadPDF = () => {
    if (pdfData) {
      const link = document.createElement("a")
      link.href = URL.createObjectURL(pdfData.blob)
      link.download = `relatorio-migracao-${format(new Date(), "dd-MM-yyyy")}.pdf`
      link.click()
      toast({
        title: "Download iniciado",
        description: "O relatório está sendo baixado.",
      })
    }
  }

  const handleSendEmail = async () => {
    const emails = form.getValues("emails")
    const emailCliente = form.getValues("emailCliente")
    
    const allEmails: string[] = []
    if (emails && emails.trim()) {
      allEmails.push(...emails.split(",").map(e => e.trim()).filter(e => e))
    }
    if (emailCliente && emailCliente.trim()) {
      allEmails.push(emailCliente.trim())
    }
    
    if (allEmails.length === 0) {
      toast({
        title: "Email não informado",
        description: "Informe pelo menos um email para enviar o relatório.",
        variant: "destructive",
      })
      return
    }
    
    if (!pdfData) {
      toast({
        title: "PDF não disponível",
        description: "Gere o relatório antes de enviar por email.",
        variant: "destructive",
      })
      return
    }
    
    setIsSendingEmail(true)
    try {
      const data = form.getValues()
      
      const response = await fetch("/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          emails: allEmails,
          pdfBase64: pdfData.base64,
          tipoRelatorio: "migracao",
          municipio: data.municipio,
          dataServico: data.dataServico ? format(new Date(data.dataServico), "dd/MM/yyyy") : null,
          cliente: data.entidadesOrgaos?.[0]?.entidade || "Cliente",
        }),
      })

      const result = await response.json()
      
      if (response.ok) {
        toast({
          title: "Email enviado com sucesso!",
          description: `Relatório enviado para ${allEmails.join(", ")}`,
        })
      } else {
        throw new Error(result.error || "Erro ao enviar email")
      }
    } catch (error) {
      console.error("Erro ao enviar email:", error)
      toast({
        title: "Erro ao enviar email",
        description: "Não foi possível enviar o email. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setIsSendingEmail(false)
    }
  }

  const handleClosePreview = () => {
    setShowPreview(false)
  }

  const handleConfirmAndClose = () => {
    setShowPreview(false)
    if (pdfPreviewUrl) {
      URL.revokeObjectURL(pdfPreviewUrl)
      setPdfPreviewUrl(null)
    }
    setPdfData(null)
    limparFormulario()
    toast({
      title: "Relatório concluído",
      description: "Você pode criar um novo relatório.",
    })
  }

  const limparFormulario = () => {
    form.reset({
      emails: "",
      emailCliente: "",
      estado: "",
      municipio: "",
      entidadesOrgaos: [],
      modulos: [],
      outroModulo: "",
      etapas: [],
      situacoesCriticas: [],
      outraSituacaoCritica: "",
      solucoes: [],
      detalhamentoAdicional: "",
      dataServico: undefined,
      tecnicos: [],
      clienteNomeCpf: [],
    })
    setAnexos([])
    setClienteTemp({ nome: "", cpf: "" })
    setEntidadeTemp({ entidade: "", cnpj: "" })
    setEtapaTemp({ nome: "", situacao: "", inicio: undefined, fim: undefined })
    setSolucaoTemp({ data: undefined, descricao: "" })
    setEstadoBusca("")
    setMunicipioBusca("")
    setMunicipiosDisponiveis([])
    setImagemErros({})
    setCurrentStep(0)
  }

  const validateCurrentStep = async () => {
    const fieldsToValidate: (keyof FormValues)[][] = [
      ["estado", "municipio"],
      ["entidadesOrgaos"],
      ["modulos"],
      [],
      [],
      ["tecnicos", "dataServico"],
      [],
    ]

    const fields = fieldsToValidate[currentStep]
    if (fields.length === 0) return true

    const result = await form.trigger(fields)
    return result
  }

  const handleNext = async () => {
    const isValid = await validateCurrentStep()
    if (isValid && currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  // Filtrar estados com base na busca
  const estadosFiltrados = estadoBusca
    ? estados.filter((estado) => estado.toLowerCase().includes(estadoBusca.toLowerCase()))
    : estados

  // Filtrar municípios com base na busca
  const municipiosFiltrados = municipioBusca
    ? municipiosDisponiveis.filter((municipio) => municipio.toLowerCase().includes(municipioBusca.toLowerCase()))
    : municipiosDisponiveis

  // Função para renderizar a bandeira ou um ícone de fallback
  const renderizarBandeira = (estado: string) => {
    if (imagemErros[estado]) {
      return <Flag className="h-4 w-4 mr-2 text-gray-500" />
    }

    return (
      <img
        src={estadosBandeiras[estado] || "/placeholder.svg"}
        alt={`Bandeira de ${estado}`}
        className="w-6 h-4 mr-2 object-contain"
        onError={() => {
          setImagemErros((prev) => ({ ...prev, [estado]: true }))
        }}
      />
    )
  }

  // Lista de técnicos (combinando funcionários do banco + fallback)
  const tecnicosOptions = loadingFuncionarios
    ? []
    : funcionarios.length > 0
    ? funcionarios.map((f) => f.name)
    : [
        "Alan Fernandes",
        "Michaelly Brandão",
        "Altarlê Macedo",
        "Danielle Tavares",
        "Fábio Júnior",
        "Felipe Santos",
        "Gerlane",
        "Iago Folgado",
        "Igor Umeda",
        "Jairo Filho",
        "Jeferson Santana",
        "Jhennyfer França",
        "Leobaldo Henrique",
        "Lúcio Monteiro",
        "Larrisa Ferreira",
        "Manoel Cabral",
        "Itiberê Mariovith",
        "Vivian Lima",
        "Felipe Falleiros",
        "Juan Gonzalez",
        "Eugênio Albuquerque",
      ];

  return (
    <Form {...form}>
      <form ref={formRef} onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Stepper */}
        <Stepper steps={steps} currentStep={currentStep} />

        {/* Step 0 - Localização */}
        {currentStep === 0 && (
        <StepContent>
          <Card className="border-gray-200 bg-white shadow-lg">
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="estado"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700">Estado *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-white border-gray-300 text-gray-900">
                            <SelectValue placeholder="Selecione o estado">
                              {field.value && (
                                <div className="flex items-center">
                                  {renderizarBandeira(field.value)}
                                  {field.value}
                                </div>
                              )}
                            </SelectValue>
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-white">
                          <div className="flex items-center px-3 pb-2">
                            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                            <Input
                              placeholder="Buscar estado..."
                              className="h-8 w-full bg-white"
                              value={estadoBusca}
                              onChange={(e) => setEstadoBusca(e.target.value)}
                            />
                          </div>
                          {estadosFiltrados.map((estado) => (
                            <SelectItem key={estado} value={estado}>
                              <div className="flex items-center">
                                {renderizarBandeira(estado)}
                                {estado}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="municipio"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700">Município *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value} disabled={!form.watch("estado")}>
                        <FormControl>
                          <SelectTrigger className="bg-white border-gray-300 text-gray-900">
                            <SelectValue placeholder="Selecione primeiro o estado" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-white">
                          <div className="flex items-center px-3 pb-2">
                            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                            <Input
                              placeholder="Buscar município..."
                              className="h-8 w-full bg-white"
                              value={municipioBusca}
                              onChange={(e) => setMunicipioBusca(e.target.value)}
                            />
                          </div>
                          {municipiosFiltrados.map((municipio) => (
                            <SelectItem key={municipio} value={municipio}>
                              {municipio}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>
</StepContent>
        )}
        
        {/* Step 1 - Entidades */}
        {currentStep === 1 && (
        <StepContent>
          <Card className="border-gray-200 bg-white shadow-lg">
            <CardContent className="pt-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-1">
                  <FormLabel className="text-gray-700">Entidade</FormLabel>
                  <Select
                    value={entidadeTemp.entidade}
                    onValueChange={(val) => setEntidadeTemp({ ...entidadeTemp, entidade: val })}
                  >
                    <SelectTrigger className="bg-white border-gray-300 text-gray-900">
                      <SelectValue placeholder="Selecione a entidade" />
                    </SelectTrigger>
                    <SelectContent className="bg-white">
                      {entidadesOptions.map((ent) => (
                        <SelectItem key={ent} value={ent}>
                          {ent}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="md:col-span-1">
                  <FormLabel className="text-gray-700">CNPJ</FormLabel>
                  <Input
                    placeholder="00.000.000/0000-00"
                    value={entidadeTemp.cnpj}
                    onChange={handleCNPJChange}
                    maxLength={18}
                    className="bg-white border-gray-300 text-gray-900"
                  />
                </div>
                <div className="md:col-span-1 flex items-end">
                  <Button type="button" onClick={adicionarEntidade} className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Órgão
                  </Button>
                </div>
              </div>

              {/* Lista de entidades adicionadas */}
              {(form.watch("entidadesOrgaos") || []).length > 0 && (
                <div className="space-y-2">
                  <FormLabel className="text-gray-700">Entidades adicionadas:</FormLabel>
                  <ul className="space-y-2">
                    {(form.watch("entidadesOrgaos") || []).map((ent, index) => (
                      <li key={index} className="flex justify-between items-center p-3 rounded-lg bg-blue-50 border border-blue-100">
                        <span className="text-gray-800">
                          {ent.entidade} - {ent.cnpj}
                        </span>
                        <Button type="button" variant="ghost" size="sm" onClick={() => removerEntidade(index)}>
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <FormField
                control={form.control}
                name="entidadesOrgaos"
                render={() => <FormMessage />}
              />
            </CardContent>
          </Card>
</StepContent>
        )}
        
        {/* Step 2 - Módulos */}
        {currentStep === 2 && (
        <StepContent>
          <Card className="border-gray-200 bg-white shadow-lg">
            <CardContent className="pt-6 space-y-4">
              <FormField
                control={form.control}
                name="modulos"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700">Módulo(s) *</FormLabel>
                    <FormDescription className="text-gray-600">
                      Selecione os módulos do sistema que estão sendo migrados
                    </FormDescription>
                    <FormControl>
                      <MultiSelectSimple
                        options={modulosOptions}
                        selected={field.value || []}
                        onChange={field.onChange}
                        placeholder="Selecione os módulos"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {(form.watch("modulos") || []).includes("Outro") && (
                <FormField
                  control={form.control}
                  name="outroModulo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700">Especifique o outro módulo</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Descreva o módulo" className="bg-white border-gray-300 text-gray-900" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </CardContent>
          </Card>
</StepContent>
        )}
        
        {/* Step 3 - Etapas */}
        {currentStep === 3 && (
        <StepContent>
          <Card className="border-gray-200 bg-white shadow-lg">
            <CardContent className="pt-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <FormLabel className="text-gray-700">Etapa</FormLabel>
                  <Select
                    value={etapaTemp.nome}
                    onValueChange={(val) => setEtapaTemp({ ...etapaTemp, nome: val })}
                  >
                    <SelectTrigger className="bg-white border-gray-300 text-gray-900">
                      <SelectValue placeholder="Selecione a etapa" />
                    </SelectTrigger>
                    <SelectContent className="bg-white">
                      {etapasOptions.map((etapa) => (
                        <SelectItem key={etapa} value={etapa}>
                          {etapa}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <FormLabel className="text-gray-700">Situação</FormLabel>
                  <Select
                    value={etapaTemp.situacao}
                    onValueChange={(val) => setEtapaTemp({ ...etapaTemp, situacao: val })}
                  >
                    <SelectTrigger className="bg-white border-gray-300 text-gray-900">
                      <SelectValue placeholder="Selecione a situação" />
                    </SelectTrigger>
                    <SelectContent className="bg-white">
                      {situacoesEtapaOptions.map((situacao) => (
                        <SelectItem key={situacao} value={situacao}>
                          {situacao}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <FormLabel className="text-gray-700">Data Início</FormLabel>
                  <DatePickerSimple
                    selected={etapaTemp.inicio}
                    onSelect={(date) => setEtapaTemp({ ...etapaTemp, inicio: date })}
                    placeholder="Selecione a data"
                  />
                </div>
                <div>
                  <FormLabel className="text-gray-700">Data Fim</FormLabel>
                  <DatePickerSimple
                    selected={etapaTemp.fim}
                    onSelect={(date) => setEtapaTemp({ ...etapaTemp, fim: date })}
                    placeholder="Selecione a data"
                  />
                </div>
                <div className="flex items-end">
                  <Button type="button" onClick={adicionarEtapa} className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Etapa
                  </Button>
                </div>
              </div>

              {/* Lista de etapas adicionadas */}
              {(form.watch("etapas") || []).length > 0 && (
                <div className="space-y-2">
                  <FormLabel className="text-gray-700">Etapas adicionadas:</FormLabel>
                  <ul className="space-y-2">
                    {(form.watch("etapas") || []).map((etapa, index) => (
                      <li key={index} className="flex justify-between items-center p-3 rounded-lg bg-blue-50 border border-blue-100">
                        <div className="text-gray-800">
                          <span className="font-medium">{etapa.nome}</span>
                          <span className="text-gray-600 ml-2">({etapa.situacao})</span>
                          <span className="text-gray-500 text-sm ml-2">
                            {format(new Date(etapa.inicio), "dd/MM/yyyy")} - {format(new Date(etapa.fim), "dd/MM/yyyy")}
                          </span>
                        </div>
                        <Button type="button" variant="ghost" size="sm" onClick={() => removerEtapa(index)}>
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
</StepContent>
        )}
        
        {/* Step 4 - Situações Críticas e Soluções */}
        {currentStep === 4 && (
        <StepContent>
          <Card className="border-gray-200 bg-white shadow-lg">
            <CardContent className="pt-6 space-y-6">
              {/* Situações Críticas */}
              <FormField
                control={form.control}
                name="situacoesCriticas"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700">Situações Críticas Encontradas</FormLabel>
                    <FormDescription className="text-gray-600">
                      Selecione as situações críticas identificadas durante a migração
                    </FormDescription>
                    <FormControl>
                      <MultiSelectSimple
                        options={situacoesCriticasOptions}
                        selected={field.value || []}
                        onChange={field.onChange}
                        placeholder="Selecione as situações críticas"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {(form.watch("situacoesCriticas") || []).includes("Outro") && (
                <FormField
                  control={form.control}
                  name="outraSituacaoCritica"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700">Especifique a outra situação crítica</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Descreva a situação" className="bg-white border-gray-300 text-gray-900" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {/* Soluções */}
              <div className="border-t pt-6">
                <FormLabel className="text-gray-700 text-lg">Soluções Aplicadas</FormLabel>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                  <div>
                    <FormLabel className="text-gray-700">Data</FormLabel>
                    <DatePickerSimple
                      selected={solucaoTemp.data}
                      onSelect={(date) => setSolucaoTemp({ ...solucaoTemp, data: date })}
                      placeholder="Selecione a data"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <FormLabel className="text-gray-700">Descrição da Solução</FormLabel>
                    <Input
                      placeholder="Descreva a solução aplicada"
                      value={solucaoTemp.descricao}
                      onChange={(e) => setSolucaoTemp({ ...solucaoTemp, descricao: e.target.value })}
                      className="bg-white border-gray-300 text-gray-900"
                    />
                  </div>
                </div>
                <Button type="button" onClick={adicionarSolucao} className="mt-4">
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Solução
                </Button>

                {/* Lista de soluções adicionadas */}
                {(form.watch("solucoes") || []).length > 0 && (
                  <div className="space-y-2 mt-4">
                    <FormLabel className="text-gray-700">Soluções adicionadas:</FormLabel>
                    <ul className="space-y-2">
                      {(form.watch("solucoes") || []).map((solucao, index) => (
                        <li key={index} className="flex justify-between items-center p-3 rounded-lg bg-green-50 border border-green-100">
                          <div className="text-gray-800">
                            <span className="text-gray-500 text-sm mr-2">
                              {format(new Date(solucao.data), "dd/MM/yyyy")}
                            </span>
                            <span>{solucao.descricao}</span>
                          </div>
                          <Button type="button" variant="ghost" size="sm" onClick={() => removerSolucao(index)}>
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Detalhamento Adicional */}
              <FormField
                control={form.control}
                name="detalhamentoAdicional"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700">Detalhamento Adicional</FormLabel>
                    <FormDescription className="text-gray-600">
                      Informações adicionais sobre o processo de migração
                    </FormDescription>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Descreva detalhes adicionais relevantes..."
                        className="min-h-[100px] bg-white border-gray-300 text-gray-900"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>
</StepContent>
        )}
        
        {/* Step 5 - Equipe */}
        {currentStep === 5 && (
        <StepContent>
          <Card className="border-gray-200 bg-white shadow-lg">
            <CardContent className="pt-6 space-y-6">
              <FormField
                control={form.control}
                name="tecnicos"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700">Técnico(s) Responsável(is) *</FormLabel>
                    <FormDescription className="text-gray-600">
                      Selecione os técnicos que participaram da migração
                    </FormDescription>
                    <FormControl>
                      {loadingFuncionarios ? (
                        <div className="flex items-center justify-center p-4">
                          <Loader2 className="h-6 w-6 animate-spin text-primary" />
                          <span className="ml-2 text-gray-600">Carregando funcionários...</span>
                        </div>
                      ) : (
                        <MultiSelectSimple
                          options={tecnicosOptions}
                          selected={field.value || []}
                          onChange={field.onChange}
                          placeholder="Selecione os técnicos"
                        />
                      )}
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="dataServico"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700">Data do Serviço *</FormLabel>
                    <FormControl>
                      <DatePickerSimple
                        selected={field.value}
                        onSelect={field.onChange}
                        placeholder="Selecione a data"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Clientes (opcional) */}
              <div className="border-t pt-6">
                <FormLabel className="text-gray-700">Clientes Responsáveis (opcional)</FormLabel>
                <FormDescription className="text-gray-600 mb-4">
                  Adicione os clientes responsáveis pelo acompanhamento da migração
                </FormDescription>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <FormLabel className="text-gray-700">Nome</FormLabel>
                    <Input
                      placeholder="Nome do cliente"
                      value={clienteTemp.nome}
                      onChange={(e) => setClienteTemp({ ...clienteTemp, nome: e.target.value })}
                      className="bg-white border-gray-300 text-gray-900"
                    />
                  </div>
                  <div>
                    <FormLabel className="text-gray-700">CPF</FormLabel>
                    <Input
                      placeholder="000.000.000-00"
                      value={clienteTemp.cpf}
                      onChange={handleCPFChange}
                      maxLength={14}
                      className="bg-white border-gray-300 text-gray-900"
                    />
                  </div>
                  <div className="flex items-end">
                    <Button type="button" onClick={adicionarCliente} variant="outline" className="w-full">
                      <Plus className="h-4 w-4 mr-2" />
                      Adicionar Cliente
                    </Button>
                  </div>
                </div>

                {/* Lista de clientes adicionados */}
                {(form.watch("clienteNomeCpf") || []).length > 0 && (
                  <div className="space-y-2 mt-4">
                    <FormLabel className="text-gray-700">Clientes adicionados:</FormLabel>
                    <ul className="space-y-2">
                      {(form.watch("clienteNomeCpf") || []).map((cliente, index) => (
                        <li key={index} className="flex justify-between items-center p-3 rounded-lg bg-blue-50 border border-blue-100">
                          <span className="text-gray-800">
                            {cliente.nome} - {cliente.cpf}
                          </span>
                          <Button type="button" variant="ghost" size="sm" onClick={() => removerCliente(index)}>
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
</StepContent>
        )}
        
        {/* Step 6 - Anexos e Email */}
        {currentStep === 6 && (
        <StepContent>
          <Card className="border-gray-200 bg-white shadow-lg">
            <CardContent className="pt-6 space-y-6">
              <FormField
                control={form.control}
                name="emailCliente"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2 text-gray-700">
                      <Mail className="h-4 w-4" />
                      Email do Cliente
                    </FormLabel>
                    <FormDescription className="text-gray-600">
                      O cliente receberá uma cópia do relatório em PDF neste email
                    </FormDescription>
                    <FormControl>
                      <Input placeholder="cliente@empresa.com" {...field} className="bg-white border-gray-300 text-gray-900" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="emails"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2 text-gray-700">
                      <Mail className="h-4 w-4" />
                      Email(s) internos da Rarotec
                    </FormLabel>
                    <FormDescription className="text-gray-600">
                      Emails internos que também receberão o relatório (separados por vírgula)
                    </FormDescription>
                    <FormControl>
                      <Input placeholder="exemplo@rarotec.com.br, outro@rarotec.com.br" {...field} className="bg-white border-gray-300 text-gray-900" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-4">
                <FormLabel className="text-gray-700">Anexar Documento(s)</FormLabel>
                <FormDescription className="text-gray-600">
                  Adicione fotos, PDFs ou outros documentos relevantes. As imagens serão incluídas no relatório.
                </FormDescription>
                <FileUploader onFilesChange={handleFileChange} />
              </div>
            </CardContent>
          </Card>
</StepContent>
        )}
        
        {/* Navegação */}
        <div className="flex items-center justify-between pt-4 border-t">
          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" onClick={handlePrev} disabled={currentStep === 0}>
              <ChevronLeft className="h-4 w-4 mr-1" />
              Anterior
            </Button>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button type="button" variant="ghost" className="text-red-600 hover:text-red-700 hover:bg-red-50">
                  Limpar Dados
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="bg-white">
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-gray-900">Limpar formulário?</AlertDialogTitle>
                  <AlertDialogDescription className="text-gray-600">
                    Esta ação irá apagar todos os dados preenchidos. Deseja continuar?
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={limparFormulario} className="bg-red-600 hover:bg-red-700">
                    Limpar
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>

          {currentStep < steps.length - 1 ? (
            <Button type="button" onClick={handleNext}>
              Próximo
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          ) : (
            <Button type="submit" disabled={isGenerating}>
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Gerando...
                </>
              ) : (
                <>
                  <FileCheck className="h-4 w-4 mr-2" />
                  Gerar Relatório
                </>
              )}
            </Button>
          )}
        </div>
      </form>

      {/* Modal de Sucesso */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-gray-900">
              <FileCheck className="h-5 w-5 text-green-600" />
              Relatório Gerado com Sucesso!
            </DialogTitle>
            <DialogDescription className="text-gray-600">
              O que você deseja fazer agora?
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-3 py-4">
            <Button onClick={handleDownloadPDF} className="w-full justify-start" variant="outline">
              <Download className="h-4 w-4 mr-3" />
              Baixar PDF no computador
            </Button>
            
            <Button 
              onClick={handleSendEmail} 
              disabled={isSendingEmail}
              className="w-full justify-start"
              variant="outline"
            >
              {isSendingEmail ? (
                <>
                  <Loader2 className="h-4 w-4 mr-3 animate-spin" />
                  Enviando email...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-3" />
                  Enviar por email
                </>
              )}
            </Button>
          </div>

          <DialogFooter>
            <Button onClick={handleConfirmAndClose} className="w-full">
              Concluir e Criar Novo Relatório
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Form>
  )
}
