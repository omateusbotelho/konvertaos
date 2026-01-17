import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  useTemplatesOnboarding,
  useTemplateTarefas,
  useUpdateTemplate,
  useCreateTemplateTarefa,
  useUpdateTemplateTarefa,
  useDeleteTemplateTarefa,
  type TemplateTarefa,
} from "@/hooks/useProjetos";
import {
  ClipboardList,
  MoreVertical,
  Pencil,
  Trash2,
  Plus,
  GripVertical,
  Loader2,
  Clock,
  CheckSquare,
} from "lucide-react";
import { cn } from "@/lib/utils";

const SETORES = [
  { value: "trafego", label: "Tráfego" },
  { value: "social_media", label: "Social Media" },
  { value: "financeiro", label: "Financeiro" },
];

export default function OnboardingConfig() {
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isTarefaModalOpen, setIsTarefaModalOpen] = useState(false);
  const [editingTarefa, setEditingTarefa] = useState<TemplateTarefa | null>(null);

  // Form states
  const [tarefaTitulo, setTarefaTitulo] = useState("");
  const [tarefaDescricao, setTarefaDescricao] = useState("");
  const [tarefaPrazoDias, setTarefaPrazoDias] = useState<number>(1);
  const [tarefaSetor, setTarefaSetor] = useState("");

  const { data: templates, isLoading } = useTemplatesOnboarding();
  const { data: tarefas } = useTemplateTarefas(selectedTemplateId || "");
  const updateTemplate = useUpdateTemplate();
  const createTarefa = useCreateTemplateTarefa();
  const updateTarefa = useUpdateTemplateTarefa();
  const deleteTarefa = useDeleteTemplateTarefa();

  const selectedTemplate = templates?.find((t) => t.id === selectedTemplateId);

  const handleOpenSheet = (templateId: string) => {
    setSelectedTemplateId(templateId);
    setIsSheetOpen(true);
  };

  const handleCloseSheet = () => {
    setIsSheetOpen(false);
    setSelectedTemplateId(null);
  };

  const handleToggleAtivo = (templateId: string, ativo: boolean) => {
    updateTemplate.mutate({ id: templateId, ativo });
  };

  const handleOpenTarefaModal = (tarefa?: TemplateTarefa) => {
    if (tarefa) {
      setEditingTarefa(tarefa);
      setTarefaTitulo(tarefa.titulo);
      setTarefaDescricao(tarefa.descricao || "");
      setTarefaPrazoDias(tarefa.prazo_dias || 1);
      setTarefaSetor(tarefa.setor_responsavel || "");
    } else {
      setEditingTarefa(null);
      setTarefaTitulo("");
      setTarefaDescricao("");
      setTarefaPrazoDias(1);
      setTarefaSetor("");
    }
    setIsTarefaModalOpen(true);
  };

  const handleSaveTarefa = () => {
    if (!selectedTemplateId || !tarefaTitulo.trim()) return;

    if (editingTarefa) {
      updateTarefa.mutate({
        id: editingTarefa.id,
        titulo: tarefaTitulo,
        descricao: tarefaDescricao || undefined,
        prazo_dias: tarefaPrazoDias,
        setor_responsavel: tarefaSetor || undefined,
      });
    } else {
      const novaOrdem = (tarefas?.length || 0) + 1;
      createTarefa.mutate({
        template_id: selectedTemplateId,
        titulo: tarefaTitulo,
        descricao: tarefaDescricao || undefined,
        ordem: novaOrdem,
        prazo_dias: tarefaPrazoDias,
        setor_responsavel: tarefaSetor || undefined,
      });
    }

    setIsTarefaModalOpen(false);
  };

  const handleDeleteTarefa = (tarefaId: string) => {
    if (confirm("Tem certeza que deseja excluir esta tarefa do template?")) {
      deleteTarefa.mutate(tarefaId);
    }
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold">Templates de Onboarding</h1>
          <p className="text-muted-foreground mt-1">
            Configure as tarefas automáticas para cada serviço
          </p>
        </div>

        {/* Templates List */}
        <div className="space-y-4">
          {templates?.map((template) => (
            <Card key={template.id} className="hover:border-primary/30 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <ClipboardList className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium">{template.nome}</h3>
                        <Badge
                          variant={template.ativo ? "default" : "secondary"}
                          className={cn(
                            "text-xs",
                            template.ativo
                              ? "bg-success/10 text-success border-success/20"
                              : "bg-muted text-muted-foreground"
                          )}
                        >
                          {template.ativo ? "Ativo" : "Inativo"}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <CheckSquare className="w-4 h-4" />
                          {template.tarefas_count || 0} tarefas
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {template.duracao_estimada || 0} dias
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Switch
                      checked={template.ativo}
                      onCheckedChange={(ativo) => handleToggleAtivo(template.id, ativo)}
                    />
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleOpenSheet(template.id)}>
                          <Pencil className="w-4 h-4 mr-2" />
                          Editar tarefas
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {templates?.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              Nenhum template encontrado. Templates são criados automaticamente para cada serviço.
            </div>
          )}
        </div>
      </div>

      {/* Sheet: Editar Template */}
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent className="w-[500px] sm:max-w-[500px]">
          <SheetHeader>
            <SheetTitle>Template: {selectedTemplate?.nome}</SheetTitle>
            <SheetDescription>
              Configure as tarefas que serão criadas automaticamente
            </SheetDescription>
          </SheetHeader>

          <div className="mt-6 space-y-4">
            <div className="flex items-center justify-between">
              <Label>Status</Label>
              <div className="flex items-center gap-2">
                <Switch
                  checked={selectedTemplate?.ativo ?? true}
                  onCheckedChange={(ativo) =>
                    selectedTemplateId && handleToggleAtivo(selectedTemplateId, ativo)
                  }
                />
                <span className="text-sm">
                  {selectedTemplate?.ativo ? "Ativo" : "Inativo"}
                </span>
              </div>
            </div>

            <div className="border-t pt-4">
              <div className="flex items-center justify-between mb-4">
                <Label>Tarefas do Onboarding</Label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleOpenTarefaModal()}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar
                </Button>
              </div>

              <ScrollArea className="h-[400px]">
                <div className="space-y-2">
                  {tarefas?.map((tarefa, index) => (
                    <div
                      key={tarefa.id}
                      className="flex items-start gap-2 p-3 rounded-lg border bg-card"
                    >
                      <div className="flex items-center gap-2 text-muted-foreground cursor-grab">
                        <GripVertical className="w-4 h-4" />
                        <span className="text-sm font-medium w-4">{index + 1}.</span>
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-sm">{tarefa.titulo}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Prazo: {tarefa.prazo_dias} dia{tarefa.prazo_dias !== 1 ? "s" : ""} após ativação
                          {tarefa.setor_responsavel && (
                            <> • {SETORES.find((s) => s.value === tarefa.setor_responsavel)?.label}</>
                          )}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleOpenTarefaModal(tarefa)}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => handleDeleteTarefa(tarefa.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}

                  {(!tarefas || tarefas.length === 0) && (
                    <p className="text-center text-muted-foreground py-8">
                      Nenhuma tarefa configurada
                    </p>
                  )}
                </div>
              </ScrollArea>
            </div>
          </div>

          <SheetFooter className="mt-6">
            <Button variant="outline" onClick={handleCloseSheet}>
              Fechar
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* Modal: Adicionar/Editar Tarefa */}
      <Dialog open={isTarefaModalOpen} onOpenChange={setIsTarefaModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingTarefa ? "Editar Tarefa" : "Nova Tarefa do Template"}
            </DialogTitle>
            <DialogDescription>
              Defina os detalhes da tarefa que será criada automaticamente
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="titulo">Título *</Label>
              <Input
                id="titulo"
                value={tarefaTitulo}
                onChange={(e) => setTarefaTitulo(e.target.value)}
                placeholder="Ex: Receber acessos do Business Manager"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="descricao">Descrição</Label>
              <Textarea
                id="descricao"
                value={tarefaDescricao}
                onChange={(e) => setTarefaDescricao(e.target.value)}
                placeholder="Instruções detalhadas para a tarefa..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="prazo">Prazo em dias *</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="prazo"
                    type="number"
                    min={1}
                    value={tarefaPrazoDias}
                    onChange={(e) => setTarefaPrazoDias(parseInt(e.target.value) || 1)}
                    className="w-20"
                  />
                  <span className="text-sm text-muted-foreground">
                    dias após ativação
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="setor">Setor Responsável</Label>
                <Select value={tarefaSetor} onValueChange={setTarefaSetor}>
                  <SelectTrigger id="setor">
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {SETORES.map((setor) => (
                      <SelectItem key={setor.value} value={setor.value}>
                        {setor.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsTarefaModalOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleSaveTarefa}
              disabled={!tarefaTitulo.trim()}
            >
              {editingTarefa ? "Salvar" : "Adicionar Tarefa"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
