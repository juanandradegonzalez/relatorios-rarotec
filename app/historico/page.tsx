"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/auth-provider"
import { Navbar } from "@/components/navbar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { 
  Loader2, 
  Search, 
  FileText, 
  Calendar, 
  MapPin, 
  Users, 
  Filter,
  RefreshCw,
  Server,
  Database,
  ChevronLeft,
  ChevronRight,
  Eye
} from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import useSWR from "swr"

interface Relatorio {
  id: string
  tipo: string
  cliente: string
  municipio: string
  estado: string
  data_atendimento: string
  tecnicos: string[]
  dados: any
  pdf_url: string | null
  created_at: string
}

interface RelatoriosResponse {
  relatorios: Relatorio[]
  total: number
  limit: number
  offset: number
}

const fetcher = async (url: string) => {
  const res = await fetch(url)
  if (!res.ok) {
    const error = await res.json()
    throw new Error(error.error || 'Erro ao buscar dados')
  }
  return res.json()
}

export default function HistoricoPage() {
  const router = useRouter()
  const { user, isLoading: authLoading } = useAuth()

  // Filtros
  const [tipo, setTipo] = useState<string>("")
  const [cliente, setCliente] = useState("")
  const [estado, setEstado] = useState<string>("")
  const [page, setPage] = useState(0)
  const limit = 10

  // Construir URL com filtros
  const buildUrl = () => {
    const params = new URLSearchParams()
    if (tipo && tipo !== "todos") params.set("tipo", tipo)
    if (cliente) params.set("cliente", cliente)
    if (estado && estado !== "todos") params.set("estado", estado)
    params.set("limit", limit.toString())
    params.set("offset", (page * limit).toString())
    return `/api/relatorios?${params.toString()}`
  }

  const { data, error, isLoading, mutate } = useSWR<RelatoriosResponse>(
    user ? buildUrl() : null,
    fetcher,
    { refreshInterval: 30000 }
  )

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login")
    }
  }, [user, authLoading, router])

  useEffect(() => {
    setPage(0)
  }, [tipo, cliente, estado])

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!user) {
    return null
  }

  const totalPages = data ? Math.ceil(data.total / limit) : 0

  const getTypeBadge = (tipo: string) => {
    if (tipo === "servicos") {
      return (
        <Badge variant="secondary" className="gap-1">
          <Server className="h-3 w-3" />
          Serviços
        </Badge>
      )
    }
    return (
      <Badge variant="outline" className="gap-1">
        <Database className="h-3 w-3" />
        Migração
      </Badge>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="container py-8 px-4">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Histórico de Relatórios</h1>
              <p className="text-muted-foreground">
                {data?.total || 0} relatório(s) encontrado(s)
              </p>
            </div>
            <Button onClick={() => mutate()} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Atualizar
            </Button>
          </div>

          {/* Filtros */}
          <Card className="border-border/50">
            <CardHeader className="pb-4">
              <CardTitle className="text-base flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Filtros
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <label className="text-sm text-muted-foreground">Tipo</label>
                  <Select value={tipo} onValueChange={setTipo}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todos os tipos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos os tipos</SelectItem>
                      <SelectItem value="servicos">Serviços</SelectItem>
                      <SelectItem value="migracao">Migração</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm text-muted-foreground">Cliente</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar cliente..."
                      value={cliente}
                      onChange={(e) => setCliente(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm text-muted-foreground">Estado</label>
                  <Select value={estado} onValueChange={setEstado}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todos os estados" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos os estados</SelectItem>
                      <SelectItem value="AC">Acre</SelectItem>
                      <SelectItem value="AL">Alagoas</SelectItem>
                      <SelectItem value="AP">Amapá</SelectItem>
                      <SelectItem value="AM">Amazonas</SelectItem>
                      <SelectItem value="BA">Bahia</SelectItem>
                      <SelectItem value="CE">Ceará</SelectItem>
                      <SelectItem value="DF">Distrito Federal</SelectItem>
                      <SelectItem value="ES">Espírito Santo</SelectItem>
                      <SelectItem value="GO">Goiás</SelectItem>
                      <SelectItem value="MA">Maranhão</SelectItem>
                      <SelectItem value="MT">Mato Grosso</SelectItem>
                      <SelectItem value="MS">Mato Grosso do Sul</SelectItem>
                      <SelectItem value="MG">Minas Gerais</SelectItem>
                      <SelectItem value="PA">Pará</SelectItem>
                      <SelectItem value="PB">Paraíba</SelectItem>
                      <SelectItem value="PR">Paraná</SelectItem>
                      <SelectItem value="PE">Pernambuco</SelectItem>
                      <SelectItem value="PI">Piauí</SelectItem>
                      <SelectItem value="RJ">Rio de Janeiro</SelectItem>
                      <SelectItem value="RN">Rio Grande do Norte</SelectItem>
                      <SelectItem value="RS">Rio Grande do Sul</SelectItem>
                      <SelectItem value="RO">Rondônia</SelectItem>
                      <SelectItem value="RR">Roraima</SelectItem>
                      <SelectItem value="SC">Santa Catarina</SelectItem>
                      <SelectItem value="SP">São Paulo</SelectItem>
                      <SelectItem value="SE">Sergipe</SelectItem>
                      <SelectItem value="TO">Tocantins</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-end">
                  <Button 
                    variant="ghost" 
                    className="w-full"
                    onClick={() => {
                      setTipo("")
                      setCliente("")
                      setEstado("")
                    }}
                  >
                    Limpar filtros
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tabela de Relatórios */}
          <Card className="border-border/50">
            <CardContent className="p-0">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : error ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <FileText className="h-12 w-12 text-muted-foreground/50 mb-4" />
                  <p className="text-muted-foreground">Erro ao carregar relatórios</p>
                  <Button variant="outline" size="sm" className="mt-4" onClick={() => mutate()}>
                    Tentar novamente
                  </Button>
                </div>
              ) : data?.relatorios.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <FileText className="h-12 w-12 text-muted-foreground/50 mb-4" />
                  <p className="text-muted-foreground">Nenhum relatório encontrado</p>
                  <p className="text-sm text-muted-foreground/70">
                    Gere seu primeiro relatório para vê-lo aqui
                  </p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-4"
                    onClick={() => router.push("/")}
                  >
                    Criar Relatório
                  </Button>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[100px]">Tipo</TableHead>
                          <TableHead>Cliente</TableHead>
                          <TableHead className="hidden md:table-cell">Localização</TableHead>
                          <TableHead className="hidden lg:table-cell">Técnicos</TableHead>
                          <TableHead>Data</TableHead>
                          <TableHead className="w-[80px]">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {data?.relatorios.map((relatorio) => (
                          <TableRow key={relatorio.id}>
                            <TableCell>
                              {getTypeBadge(relatorio.tipo)}
                            </TableCell>
                            <TableCell>
                              <div className="font-medium">{relatorio.cliente}</div>
                            </TableCell>
                            <TableCell className="hidden md:table-cell">
                              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                <MapPin className="h-3 w-3" />
                                {relatorio.municipio && relatorio.estado
                                  ? `${relatorio.municipio}, ${relatorio.estado}`
                                  : relatorio.estado || "N/A"}
                              </div>
                            </TableCell>
                            <TableCell className="hidden lg:table-cell">
                              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                <Users className="h-3 w-3" />
                                <span className="max-w-[200px] truncate">
                                  {relatorio.tecnicos?.length > 0
                                    ? relatorio.tecnicos.slice(0, 2).join(", ") +
                                      (relatorio.tecnicos.length > 2 ? ` +${relatorio.tecnicos.length - 2}` : "")
                                    : "N/A"}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1 text-sm">
                                <Calendar className="h-3 w-3 text-muted-foreground" />
                                {format(new Date(relatorio.data_atendimento), "dd/MM/yyyy", {
                                  locale: ptBR,
                                })}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Button variant="ghost" size="sm">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Paginação */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between px-4 py-4 border-t border-border/50">
                      <p className="text-sm text-muted-foreground">
                        Mostrando {page * limit + 1} a {Math.min((page + 1) * limit, data?.total || 0)} de {data?.total || 0}
                      </p>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPage(page - 1)}
                          disabled={page === 0}
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <span className="text-sm text-muted-foreground">
                          Página {page + 1} de {totalPages}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPage(page + 1)}
                          disabled={page >= totalPages - 1}
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
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
