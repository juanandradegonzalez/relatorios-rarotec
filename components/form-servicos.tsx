"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
import { Loader2, Plus, Trash2, Search, Flag, ChevronLeft, ChevronRight, FileCheck, Mail, Download, Send, Database } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { estados, estadosBandeiras, getMunicipiosPorEstado } from "@/lib/estados-municipios"
import { cn } from "@/lib/utils"

const formSchema = z.object({
  tipoRelatorio: z.enum(["servicos", "migracao"], { required_error: "Selecione o tipo de relatório" }),
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
  servicosRealizados: z.array(z.string()).min(1, "Selecione pelo menos um serviço"),
  outroServico: z.string().optional(),
  resumoServicos: z.string().min(10, "Descreva os serviços realizados (mínimo 10 caracteres)"),
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

const steps = [
  { title: "Tipo", description: "Tipo de relatório" },
  { title: "Localização", description: "Estado e município" },
  { title: "Entidades", description: "Órgãos e CNPJs" },
  { title: "Serviços", description: "Módulos e atividades" },
  { title: "Detalhes", description: "Resumo e data" },
  { title: "Equipe", description: "Técnicos responsáveis" },
  { title: "Anexos", description: "Documentos e email" },
]

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

const servicosOptions = [
  "Visita Técnica",
  "Treinamento",
  "Reunião",
  "Cadastro de Usuário",
  "Atendimento Remoto",
  "Migração",
  "Outro",
]

interface Funcionario {
  id: string
  name: string
  email: string
}

export function FormServicos() {
  const { toast } = useToast()
  const [currentStep, setCurrentStep] = useState(0)
  const [isGenerating, setIsGenerating] = useState(false)
  const [anexos, setAnexos] = useState<File[]>([])
  const [clienteTemp, setClienteTemp] = useState({ nome: "", cpf: "" })
  const [entidadeTemp, setEntidadeTemp] = useState({ entidade: "", cnpj: "" })
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
      tipoRelatorio: undefined,
      emails: "",
      estado: "",
      municipio: "",
      entidadesOrgaos: [],
      modulos: [],
      outroModulo: "",
      servicosRealizados: [],
      outroServico: "",
      resumoServicos: "",
      tecnicos: [],
      clienteNomeCpf: [],
    },
  })

  // Atualizar emails internos quando técnicos forem selecionados
  const selectedTecnicos = form.watch("tecnicos")
  useEffect(() => {
    if (selectedTecnicos && selectedTecnicos.length > 0 && funcionarios.length > 0) {
      const emailsTecnicos = selectedTecnicos
        .map(tecnicoNome => {
          const func = funcionarios.find(f => f.name === tecnicoNome)
          return func?.email
        })
        .filter(Boolean)
        .join(", ")
      
      if (emailsTecnicos) {
        form.setValue("emails", emailsTecnicos)
      }
    }
  }, [selectedTecnicos, funcionarios, form])

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
        title: "Campos obrigatórios",
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
        title: "Campos obrigatórios",
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

const validateStep = async (step: number): Promise<boolean> => {
    const fieldsToValidate: (keyof FormValues)[][] = [
      ["tipoRelatorio"],
      ["estado", "municipio"],
      ["entidadesOrgaos"],
      ["modulos", "servicosRealizados"],
      ["resumoServicos", "dataServico"],
      ["tecnicos"],
      [],
    ]

    const fields = fieldsToValidate[step]
    if (fields.length === 0) return true

    const result = await form.trigger(fields)
    return result
  }

  const nextStep = async () => {
    const isValid = await validateStep(currentStep)
    if (isValid && currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const onSubmit = async (data: FormValues) => {
    // Só gera o PDF se estiver na última etapa
    if (currentStep !== steps.length - 1) {
      return
    }
    
    try {
      setIsGenerating(true)

      const result = await generatePDF({
        tipoRelatorio: data.tipoRelatorio,
        dados: data,
        anexos,
      })

      if (result.success && result.pdfBlob && result.pdfBase64) {
        // Criar URL para preview
        const previewUrl = URL.createObjectURL(result.pdfBlob)
        setPdfPreviewUrl(previewUrl)
        setPdfData({ base64: result.pdfBase64, blob: result.pdfBlob })
        
        // Salvar relatório no banco de dados
        try {
          const clienteNome = data.entidadesOrgaos?.[0]?.nome || "Cliente"
          const tecnicosNomes = data.tecnicosResponsaveis?.map(t => t.nome) || []
          const dataAtendimento = data.dataServico 
            ? (data.dataServico instanceof Date 
                ? data.dataServico.toISOString().split('T')[0] 
                : data.dataServico)
            : new Date().toISOString().split('T')[0]
          
          
          
          const saveResponse = await fetch("/api/relatorios", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              tipo: data.tipoRelatorio,
              cliente: clienteNome,
              municipio: data.municipio,
              estado: data.estado,
              dataAtendimento: dataAtendimento,
              tecnicos: tecnicosNomes,
              dados: data,
            }),
          })
          
          await saveResponse.json()
        } catch (saveError) {
          console.error("[v0] Erro ao salvar relatório no histórico:", saveError)
          // Continua mesmo se falhar ao salvar, pois o PDF já foi gerado
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
      const link = document.createElement('a')
      link.href = URL.createObjectURL(pdfData.blob)
      link.download = `relatorio-servicos-${format(new Date(), "dd-MM-yyyy")}.pdf`
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
    
    // Combinar emails internos + email do cliente
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
        description: "Informe pelo menos um email (cliente ou interno) para enviar o relatório.",
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
          tipoRelatorio: "servicos",
          municipio: data.municipio,
          dataServico: data.dataServico ? format(new Date(data.dataServico), "dd/MM/yyyy") : null,
          cliente: data.entidadesOrgaos?.[0]?.nome || "Cliente",
        }),
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: "Email enviado",
          description: result.message,
        })
      } else {
        throw new Error(result.error || "Erro ao enviar email")
      }
    } catch (error) {
      console.error("Erro ao enviar email:", error)
      toast({
        title: "Erro ao enviar email",
        description: "Não foi possível enviar o email. Verifique se o serviço de email está configurado.",
        variant: "destructive",
      })
    } finally {
      setIsSendingEmail(false)
    }
  }

  const handleClosePreview = () => {
    setShowPreview(false)
    if (pdfPreviewUrl) {
      URL.revokeObjectURL(pdfPreviewUrl)
      setPdfPreviewUrl(null)
    }
  }

  const handleConfirmAndClose = () => {
    handleClosePreview()
    setPdfData(null)
    limparFormulario()
    toast({
      title: "Relatório finalizado",
      description: "O relatório foi gerado com sucesso.",
    })
  }

  const limparFormulario = () => {
    form.reset()
    setAnexos([])
    setClienteTemp({ nome: "", cpf: "" })
    setEntidadeTemp({ entidade: "", cnpj: "" })
    setEstadoBusca("")
    setMunicipioBusca("")
    setMunicipiosDisponiveis([])
    setImagemErros({})
    setCurrentStep(0)
  }

  const estadosFiltrados = estadoBusca
    ? estados.filter((estado) => estado.toLowerCase().includes(estadoBusca.toLowerCase()))
    : estados

  const municipiosFiltrados = municipioBusca
    ? municipiosDisponiveis.filter((municipio) => municipio.toLowerCase().includes(municipioBusca.toLowerCase()))
    : municipiosDisponiveis

  const renderizarBandeira = (estado: string) => {
    if (imagemErros[estado]) {
      return <Flag className="h-4 w-4 mr-2 text-muted-foreground" />
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

  return (
    <Form {...form}>
      <form 
          ref={formRef} 
          onSubmit={form.handleSubmit(onSubmit)} 
          onKeyDown={(e) => {
            // Prevenir submit ao pressionar Enter (exceto no botão de submit)
            if (e.key === 'Enter' && e.target instanceof HTMLInputElement) {
              e.preventDefault()
            }
          }}
          className="space-y-8"
        >
        <Stepper steps={steps} currentStep={currentStep} />

{/* Step 0: Tipo de Relatório */}
        {currentStep === 0 && (
          <StepContent>
            <div className="space-y-6">
              <FormField
                control={form.control}
                name="tipoRelatorio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Relatório *</FormLabel>
                    <FormDescription>
                      Selecione o tipo de relatório que deseja gerar
                    </FormDescription>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                      <Card 
                        className={cn(
                          "cursor-pointer transition-all hover:shadow-md",
                          field.value === "servicos" 
                            ? "border-primary bg-primary/5 ring-2 ring-primary" 
                            : "border-gray-200 hover:border-primary/50"
                        )}
                        onClick={() => field.onChange("servicos")}
                      >
                        <CardContent className="p-6 text-center">
                          <div className="mx-auto mb-3 h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                            <FileCheck className="h-6 w-6 text-primary" />
                          </div>
                          <h3 className="font-semibold text-gray-900">Relatório de Serviços</h3>
                          <p className="text-sm text-gray-600 mt-1">
                            Serviços técnicos, manutenções e atendimentos
                          </p>
                        </CardContent>
                      </Card>
                      
                      <Card 
                        className={cn(
                          "cursor-pointer transition-all hover:shadow-md",
                          field.value === "migracao" 
                            ? "border-primary bg-primary/5 ring-2 ring-primary" 
                            : "border-gray-200 hover:border-primary/50"
                        )}
                        onClick={() => field.onChange("migracao")}
                      >
                        <CardContent className="p-6 text-center">
                          <div className="mx-auto mb-3 h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                            <Database className="h-6 w-6 text-primary" />
                          </div>
                          <h3 className="font-semibold text-gray-900">Relatório de Migração</h3>
                          <p className="text-sm text-gray-600 mt-1">
                            Processos de migração de dados e sistemas
                          </p>
                        </CardContent>
                      </Card>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </StepContent>
        )}

        {/* Step 1: Localização */}
        {currentStep === 1 && (
          <StepContent>
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="estado"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Estado *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className={cn(!field.value && "text-muted-foreground")}>
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
                        <SelectContent>
                          <div className="flex items-center px-3 pb-2">
                            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                            <Input
                              placeholder="Buscar estado..."
                              className="h-8 w-full"
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
                      <FormLabel>Município *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value} disabled={!form.watch("estado")}>
                        <FormControl>
                          <SelectTrigger className={cn(!field.value && "text-muted-foreground")}>
                            <SelectValue placeholder={form.watch("estado") ? "Selecione o município" : "Selecione primeiro o estado"} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <div className="flex items-center px-3 pb-2">
                            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                            <Input
                              placeholder="Buscar município..."
                              className="h-8 w-full"
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
            </div>
          </StepContent>
        )}

        {/* Step 2: Entidades */}
        {currentStep === 2 && (
          <StepContent>
            <div className="space-y-6">
              <div>
                <Label className="text-base">Adicionar Entidade *</Label>
                <p className="text-sm text-muted-foreground mb-4">
                  Adicione os órgãos/entidades envolvidos no serviço
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Select
                    value={entidadeTemp.entidade}
                    onValueChange={(value) => setEntidadeTemp({ ...entidadeTemp, entidade: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a entidade" />
                    </SelectTrigger>
                    <SelectContent>
                      {entidadesOptions.map((entidade) => (
                        <SelectItem key={entidade} value={entidade}>
                          {entidade}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    placeholder="00.000.000/0000-00"
                    value={entidadeTemp.cnpj}
                    onChange={handleCNPJChange}
                    maxLength={18}
                  />
                  <Button type="button" onClick={adicionarEntidade} variant="secondary">
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar
                  </Button>
                </div>
              </div>

              {form.watch("entidadesOrgaos")?.length > 0 && (
                <Card className="border-border/50">
                  <CardContent className="p-4">
                    <h4 className="font-medium mb-3 text-sm text-muted-foreground">Entidades adicionadas:</h4>
                    <ul className="space-y-2">
                      {form.watch("entidadesOrgaos")?.map((item, index) => (
                        <li key={index} className="flex justify-between items-center p-3 rounded-lg bg-blue-50 border border-blue-100">
                          <span className="text-sm">
                            <span className="font-medium">{item.entidade}</span>
                            <span className="text-muted-foreground ml-2">CNPJ: {item.cnpj}</span>
                          </span>
                          <Button type="button" variant="ghost" size="sm" onClick={() => removerEntidade(index)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {form.formState.errors.entidadesOrgaos && (
                <p className="text-sm text-destructive">{form.formState.errors.entidadesOrgaos.message}</p>
              )}
            </div>
          </StepContent>
        )}

        {/* Step 2: Serviços */}
        {currentStep === 3 && (
          <StepContent>
            <div className="space-y-6">
              <FormField
                control={form.control}
                name="modulos"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Módulo(s) *</FormLabel>
                    <FormDescription>Selecione os módulos relacionados ao serviço</FormDescription>
                    <FormControl>
                      <MultiSelectSimple
                        options={modulosOptions.map((option) => ({
                          label: option,
                          value: option,
                        }))}
                        selected={field.value || []}
                        onChange={field.onChange}
                        placeholder="Selecione os módulos"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {form.watch("modulos")?.includes("Outro") && (
                <FormField
                  control={form.control}
                  name="outroModulo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Especifique outro módulo</FormLabel>
                      <FormControl>
                        <Input placeholder="Descreva o módulo" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={form.control}
                name="servicosRealizados"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Serviço(s) Realizado(s) *</FormLabel>
                    <FormDescription>Selecione os tipos de serviço executados</FormDescription>
                    <FormControl>
                      <MultiSelectSimple
                        options={servicosOptions.map((option) => ({
                          label: option,
                          value: option,
                        }))}
                        selected={field.value || []}
                        onChange={field.onChange}
                        placeholder="Selecione os serviços"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {form.watch("servicosRealizados")?.includes("Outro") && (
                <FormField
                  control={form.control}
                  name="outroServico"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Especifique outro serviço</FormLabel>
                      <FormControl>
                        <Input placeholder="Descreva o serviço" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>
          </StepContent>
        )}

        {/* Step 3: Detalhes */}
        {currentStep === 4 && (
          <StepContent>
            <div className="space-y-6">
              <FormField
                control={form.control}
                name="resumoServicos"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Resumo do(s) Serviço(s) Realizado(s) *</FormLabel>
                    <FormDescription>Descreva detalhadamente os serviços realizados</FormDescription>
                    <FormControl>
                      <Textarea
                        placeholder="Descreva os serviços realizados, problemas encontrados, soluções aplicadas..."
                        className="min-h-[180px] resize-y"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="dataServico"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Data da Prestação do Serviço *</FormLabel>
                    <DatePickerSimple date={field.value} setDate={field.onChange} />
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </StepContent>
        )}

        {/* Step 4: Equipe */}
        {currentStep === 5 && (
          <StepContent>
            <div className="space-y-6">
              <FormField
                control={form.control}
                name="tecnicos"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Técnico(s) Especializado(s) da Rarotec *</FormLabel>
                    <FormDescription>Selecione os técnicos que realizaram o serviço</FormDescription>
                    <FormControl>
                      {loadingFuncionarios ? (
                        <div className="flex items-center gap-2 p-3 border rounded-md text-muted-foreground">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Carregando funcionários...
                        </div>
                      ) : (
                        <MultiSelectSimple
                          options={funcionarios.map((func) => ({
                            label: func.name,
                            value: func.name,
                          }))}
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

              {/* Mostrar emails dos técnicos selecionados */}
              {form.watch("tecnicos")?.length > 0 && (
                <Card className="border-primary/20 bg-primary/5">
                  <CardContent className="p-4">
                    <h4 className="font-medium mb-3 text-sm flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      Emails dos técnicos selecionados:
                    </h4>
                    <ul className="space-y-2">
                      {form.watch("tecnicos")?.map((tecnicoNome) => {
                        const funcionario = funcionarios.find(f => f.name === tecnicoNome)
                        return funcionario ? (
                          <li key={funcionario.id} className="flex items-center gap-2 text-sm">
                            <span className="font-medium">{funcionario.name}</span>
                            <span className="text-muted-foreground">-</span>
                            <span className="text-primary">{funcionario.email}</span>
                          </li>
                        ) : null
                      })}
                    </ul>
                  </CardContent>
                </Card>
              )}

              <div className="space-y-4">
                <div>
                  <Label className="text-base">Técnico(s)/Gestor(es) do Cliente</Label>
                  <p className="text-sm text-muted-foreground mb-4">
                    Adicione os responsáveis do cliente que acompanharam o serviço (opcional)
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Input
                    placeholder="Nome completo"
                    value={clienteTemp.nome}
                    onChange={(e) => setClienteTemp({ ...clienteTemp, nome: e.target.value })}
                  />
                  <Input 
                    placeholder="000.000.000-00" 
                    value={clienteTemp.cpf} 
                    onChange={handleCPFChange} 
                    maxLength={14} 
                  />
                  <Button type="button" onClick={adicionarCliente} variant="secondary">
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar
                  </Button>
                </div>

                {form.watch("clienteNomeCpf")?.length > 0 && (
                  <Card className="border-border/50">
                    <CardContent className="p-4">
                      <h4 className="font-medium mb-3 text-sm text-muted-foreground">
                        Técnicos/Gestores do cliente:
                      </h4>
                      <ul className="space-y-2">
                        {form.watch("clienteNomeCpf")?.map((cliente, index) => (
                          <li key={index} className="flex justify-between items-center p-3 rounded-lg bg-blue-50 border border-blue-100">
                            <span className="text-sm">
                              <span className="font-medium">{cliente.nome}</span>
                              <span className="text-muted-foreground ml-2">CPF: {cliente.cpf}</span>
                            </span>
                            <Button type="button" variant="ghost" size="sm" onClick={() => removerCliente(index)}>
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </StepContent>
        )}

        {/* Step 5: Anexos e Email */}
        {currentStep === 6 && (
          <StepContent>
            <div className="space-y-6">
              <FormField
                control={form.control}
                name="emailCliente"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      Email do Cliente
                    </FormLabel>
                    <FormDescription>
                      O cliente receberá uma cópia do relatório em PDF neste email
                    </FormDescription>
                    <FormControl>
                      <Input placeholder="cliente@empresa.com" {...field} />
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
                    <FormLabel className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      Email(s) internos da Rarotec
                    </FormLabel>
                    <FormDescription>
                      Emails internos que também receberão o relatório (separados por vírgula)
                    </FormDescription>
                    <FormControl>
                      <Input placeholder="exemplo@rarotec.com.br, outro@rarotec.com.br" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-4">
                <div>
                  <Label className="text-base">Anexar Documento(s)</Label>
                  <p className="text-sm text-muted-foreground mb-4">
                    Adicione fotos, PDFs ou outros documentos relevantes. As imagens serão incorporadas no relatório final.
                  </p>
                </div>
                <FileUploader onChange={handleFileChange} value={anexos} />
              </div>
            </div>
          </StepContent>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between pt-6 border-t border-border/50">
          <div className="flex items-center gap-2">
            {currentStep > 0 && (
              <Button type="button" variant="outline" onClick={prevStep}>
                <ChevronLeft className="h-4 w-4 mr-2" />
                Anterior
              </Button>
            )}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button type="button" variant="ghost" className="text-muted-foreground">
                  Limpar Dados
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Limpar formulário?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta ação irá limpar todos os dados preenchidos. Esta ação não pode ser desfeita.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={limparFormulario}>Limpar</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>

          <div>
            {currentStep < steps.length - 1 ? (
              <Button type="button" onClick={nextStep}>
                Próximo
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button type="submit" disabled={isGenerating} className="min-w-[180px]">
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Gerando...
                  </>
                ) : (
                  <>
                    <FileCheck className="mr-2 h-4 w-4" />
                    Gerar Relatório
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </form>

      {/* Modal de Sucesso - Baixar PDF ou Enviar Email */}
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
