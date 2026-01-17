import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { KonvertaCard } from "@/components/ui/konverta-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ArrowLeft, Plus, Search, MoreHorizontal, Edit, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { useCustosFixos, useCustosVariaveis } from "@/hooks/useFinanceiro";
import { useAuth } from "@/hooks/use-auth";

const categoriaColors: Record<string, string> = {
  ferramenta: "bg-info text-info-foreground",
  pessoal: "bg-success text-success-foreground",
  infraestrutura: "bg-warning text-warning-foreground",
  midia: "bg-primary text-primary-foreground",
  freelancer: "bg-purple-500 text-white",
  outros: "bg-muted text-muted-foreground",
};

const meses = [
  { value: "1", label: "Janeiro" },
  { value: "2", label: "Fevereiro" },
  { value: "3", label: "Março" },
  { value: "4", label: "Abril" },
  { value: "5", label: "Maio" },
  { value: "6", label: "Junho" },
  { value: "7", label: "Julho" },
  { value: "8", label: "Agosto" },
  { value: "9", label: "Setembro" },
  { value: "10", label: "Outubro" },
  { value: "11", label: "Novembro" },
  { value: "12", label: "Dezembro" },
];

export default function Custos() {
  const { isAdmin } = useAuth();
  const currentDate = new Date();
  const [tab, setTab] = useState("fixos");
  const [searchFixo, setSearchFixo] = useState("");
  const [searchVariavel, setSearchVariavel] = useState("");
  const [mes, setMes] = useState(String(currentDate.getMonth() + 1));
  const [ano, setAno] = useState(String(currentDate.getFullYear()));

  const { data: custosFixos, isLoading: loadingFixos } = useCustosFixos();
  const { data: custosVariaveis, isLoading: loadingVariaveis } = useCustosVariaveis({
    mes: Number(mes),
    ano: Number(ano),
  });

  const filteredFixos = custosFixos?.filter(c =>
    c.nome.toLowerCase().includes(searchFixo.toLowerCase())
  );

  const filteredVariaveis = custosVariaveis?.filter(c =>
    c.nome.toLowerCase().includes(searchVariavel.toLowerCase())
  );

  const totalFixos = custosFixos?.filter(c => c.ativo).reduce((sum, c) => sum + c.valor, 0) || 0;
  const totalVariaveis = custosVariaveis?.reduce((sum, c) => sum + c.valor, 0) || 0;

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/financeiro">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div className="flex-1">
            <h1>Custos</h1>
            <p className="text-muted-foreground">Gerencie os custos fixos e variáveis</p>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={tab} onValueChange={setTab}>
          <div className="flex items-center justify-between">
            <TabsList>
              <TabsTrigger value="fixos">
                Custos Fixos
                <Badge variant="secondary" className="ml-2">{custosFixos?.length || 0}</Badge>
              </TabsTrigger>
              <TabsTrigger value="variaveis">
                Custos Variáveis
                <Badge variant="secondary" className="ml-2">{custosVariaveis?.length || 0}</Badge>
              </TabsTrigger>
            </TabsList>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              {tab === "fixos" ? "Adicionar Custo Fixo" : "Lançar Custo Variável"}
            </Button>
          </div>

          {/* Custos Fixos */}
          <TabsContent value="fixos" className="space-y-4 mt-4">
            <KonvertaCard>
              <div className="flex items-center justify-between mb-4">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar custo fixo..."
                    value={searchFixo}
                    onChange={(e) => setSearchFixo(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  Total mensal: <span className="font-semibold text-foreground">R$ {totalFixos.toLocaleString("pt-BR")}</span>
                </p>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Recorrente</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loadingFixos ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        Carregando...
                      </TableCell>
                    </TableRow>
                  ) : filteredFixos?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        Nenhum custo fixo encontrado
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredFixos?.map(custo => (
                      <TableRow key={custo.id}>
                        <TableCell className="font-medium">{custo.nome}</TableCell>
                        <TableCell>
                          <Badge className={categoriaColors[custo.categoria]}>
                            {custo.categoria}
                          </Badge>
                        </TableCell>
                        <TableCell>R$ {custo.valor.toLocaleString("pt-BR")}</TableCell>
                        <TableCell>{custo.recorrente ? "Sim" : "Não"}</TableCell>
                        <TableCell>
                          <Badge variant={custo.ativo ? "default" : "secondary"}>
                            {custo.ativo ? "Ativo" : "Inativo"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>
                                <Edit className="h-4 w-4 mr-2" />
                                Editar
                              </DropdownMenuItem>
                              {isAdmin && (
                                <DropdownMenuItem className="text-destructive">
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Excluir
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </KonvertaCard>
          </TabsContent>

          {/* Custos Variáveis */}
          <TabsContent value="variaveis" className="space-y-4 mt-4">
            <KonvertaCard>
              <div className="flex flex-wrap items-center gap-4 mb-4">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar custo variável..."
                    value={searchVariavel}
                    onChange={(e) => setSearchVariavel(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={mes} onValueChange={setMes}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {meses.map(m => (
                      <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={ano} onValueChange={setAno}>
                  <SelectTrigger className="w-[100px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[2024, 2025, 2026, 2027].map(y => (
                      <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  Total: <span className="font-semibold text-foreground">R$ {totalVariaveis.toLocaleString("pt-BR")}</span>
                </p>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loadingVariaveis ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        Carregando...
                      </TableCell>
                    </TableRow>
                  ) : filteredVariaveis?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        Nenhum custo variável encontrado
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredVariaveis?.map(custo => (
                      <TableRow key={custo.id}>
                        <TableCell className="font-medium">{custo.nome}</TableCell>
                        <TableCell>
                          {custo.cliente?.nome_fantasia || custo.cliente?.razao_social || "-"}
                        </TableCell>
                        <TableCell>
                          <Badge className={categoriaColors[custo.categoria]}>
                            {custo.categoria}
                          </Badge>
                        </TableCell>
                        <TableCell>R$ {custo.valor.toLocaleString("pt-BR")}</TableCell>
                        <TableCell>
                          {format(new Date(custo.data_referencia), "dd/MM/yyyy")}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>
                                <Edit className="h-4 w-4 mr-2" />
                                Editar
                              </DropdownMenuItem>
                              {isAdmin && (
                                <DropdownMenuItem className="text-destructive">
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Excluir
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </KonvertaCard>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
