import { AppLayout } from "@/components/layout";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { KonvertaCard, KonvertaCardHeader, KonvertaCardTitle } from "@/components/ui/konverta-card";
import { KonvertaBadge } from "@/components/ui/konverta-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { KonvertaAvatar } from "@/components/ui/konverta-avatar";
import {
  Users,
  Plus,
  Search,
  MoreHorizontal,
  Mail,
  Building,
  Briefcase,
  Copy,
  Check,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

type Cargo = "sdr" | "closer" | "gestor_trafego" | "social_media" | "financeiro";
type Setor = "comercial" | "trafego" | "social_media" | "financeiro";
type Role = "admin" | "colaborador";

interface Profile {
  id: string;
  email: string;
  nome: string;
  avatar_url: string | null;
  cargo: Cargo | null;
  setor: Setor | null;
  ativo: boolean;
  created_at: string;
}

const cargoLabels: Record<Cargo, string> = {
  sdr: "SDR",
  closer: "Closer",
  gestor_trafego: "Gestor de Tráfego",
  social_media: "Social Media",
  financeiro: "Financeiro",
};

const setorLabels: Record<Setor, string> = {
  comercial: "Comercial",
  trafego: "Tráfego",
  social_media: "Social Media",
  financeiro: "Financeiro",
};

const cargoToSetor: Record<Cargo, Setor> = {
  sdr: "comercial",
  closer: "comercial",
  gestor_trafego: "trafego",
  social_media: "social_media",
  financeiro: "financeiro",
};

function generateToken(): string {
  return crypto.randomUUID().replace(/-/g, "") + crypto.randomUUID().replace(/-/g, "");
}

export default function Equipe() {
  const { isAdmin } = useAuth();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterSetor, setFilterSetor] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  
  // Modal states
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  
  // Invite form
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteNome, setInviteNome] = useState("");
  const [inviteCargo, setInviteCargo] = useState<Cargo>("sdr");
  const [inviteRole, setInviteRole] = useState<Role>("colaborador");
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  
  // Edit form
  const [editNome, setEditNome] = useState("");
  const [editCargo, setEditCargo] = useState<Cargo | "">("");
  const [editAtivo, setEditAtivo] = useState(true);
  const [editLoading, setEditLoading] = useState(false);

  useEffect(() => {
    fetchProfiles();
  }, []);

  const fetchProfiles = async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .order("nome");

    if (!error && data) {
      setProfiles(data as Profile[]);
    }
    setLoading(false);
  };

  const filteredProfiles = profiles.filter((profile) => {
    const matchesSearch =
      profile.nome.toLowerCase().includes(search.toLowerCase()) ||
      profile.email.toLowerCase().includes(search.toLowerCase());
    const matchesSetor = filterSetor === "all" || profile.setor === filterSetor;
    const matchesStatus =
      filterStatus === "all" ||
      (filterStatus === "ativo" && profile.ativo) ||
      (filterStatus === "inativo" && !profile.ativo);
    return matchesSearch && matchesSetor && matchesStatus;
  });

  const handleInvite = async () => {
    if (!inviteEmail || !inviteNome || !inviteCargo) {
      toast.error("Preencha todos os campos");
      return;
    }

    setInviteLoading(true);
    
    const token = generateToken();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const { error } = await supabase.from("convites").insert({
      email: inviteEmail,
      nome: inviteNome,
      cargo: inviteCargo,
      setor: cargoToSetor[inviteCargo],
      role: inviteRole,
      token,
      expires_at: expiresAt.toISOString(),
    });

    if (error) {
      toast.error("Erro ao criar convite");
      setInviteLoading(false);
      return;
    }

    const link = `${window.location.origin}/convite/${token}`;
    setInviteLink(link);
    setInviteLoading(false);
    toast.success("Convite criado com sucesso!");
  };

  const copyLink = async () => {
    if (inviteLink) {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const resetInviteForm = () => {
    setInviteEmail("");
    setInviteNome("");
    setInviteCargo("sdr");
    setInviteRole("colaborador");
    setInviteLink(null);
    setCopied(false);
  };

  const handleEdit = (profile: Profile) => {
    setSelectedProfile(profile);
    setEditNome(profile.nome);
    setEditCargo(profile.cargo || "");
    setEditAtivo(profile.ativo);
    setIsEditOpen(true);
  };

  const saveEdit = async () => {
    if (!selectedProfile) return;
    
    setEditLoading(true);
    
    const updates: Partial<Profile> = {
      nome: editNome,
      ativo: editAtivo,
    };
    
    if (editCargo) {
      updates.cargo = editCargo as Cargo;
      updates.setor = cargoToSetor[editCargo as Cargo];
    }

    const { error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", selectedProfile.id);

    if (error) {
      toast.error("Erro ao atualizar colaborador");
    } else {
      toast.success("Colaborador atualizado!");
      fetchProfiles();
      setIsEditOpen(false);
    }
    
    setEditLoading(false);
  };

  const toggleStatus = async (profile: Profile) => {
    const { error } = await supabase
      .from("profiles")
      .update({ ativo: !profile.ativo })
      .eq("id", profile.id);

    if (error) {
      toast.error("Erro ao atualizar status");
    } else {
      fetchProfiles();
      toast.success(profile.ativo ? "Colaborador desativado" : "Colaborador ativado");
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      </AppLayout>
    );
  }

  const activeCount = profiles.filter((p) => p.ativo).length;
  const bySetor = profiles.reduce((acc, p) => {
    if (p.setor && p.ativo) {
      acc[p.setor] = (acc[p.setor] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1>Equipe</h1>
            <p className="text-muted-foreground mt-1">
              Gerencie os colaboradores da sua agência
            </p>
          </div>
          
          <Dialog open={isInviteOpen} onOpenChange={(open) => {
            setIsInviteOpen(open);
            if (!open) resetInviteForm();
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4" />
                Convidar Colaborador
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border/40">
              <DialogHeader>
                <DialogTitle>Convidar Colaborador</DialogTitle>
              </DialogHeader>
              
              {inviteLink ? (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Compartilhe este link com o colaborador:
                  </p>
                  <div className="flex gap-2">
                    <Input value={inviteLink} readOnly className="text-xs" />
                    <Button variant="secondary" onClick={copyLink}>
                      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                  <Button
                    variant="secondary"
                    className="w-full"
                    onClick={() => {
                      resetInviteForm();
                    }}
                  >
                    Criar novo convite
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">E-mail*</label>
                    <Input
                      type="email"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      icon={<Mail className="h-4 w-4" />}
                      placeholder="colaborador@email.com"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Nome*</label>
                    <Input
                      value={inviteNome}
                      onChange={(e) => setInviteNome(e.target.value)}
                      placeholder="Nome completo"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Cargo*</label>
                    <Select value={inviteCargo} onValueChange={(v) => setInviteCargo(v as Cargo)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-border/40">
                        {Object.entries(cargoLabels).map(([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Setor</label>
                    <Input
                      value={setorLabels[cargoToSetor[inviteCargo]]}
                      readOnly
                      className="bg-background"
                      icon={<Building className="h-4 w-4" />}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Permissão*</label>
                    <Select value={inviteRole} onValueChange={(v) => setInviteRole(v as Role)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-border/40">
                        <SelectItem value="colaborador">Colaborador</SelectItem>
                        <SelectItem value="admin">Administrador</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <Button
                    className="w-full"
                    onClick={handleInvite}
                    disabled={inviteLoading}
                  >
                    {inviteLoading ? <LoadingSpinner size="sm" /> : "Enviar Convite"}
                  </Button>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KonvertaCard>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-semibold">{activeCount}</p>
                <p className="text-sm text-muted-foreground">Colaboradores ativos</p>
              </div>
            </div>
          </KonvertaCard>
          
          {Object.entries(bySetor).map(([setor, count]) => (
            <KonvertaCard key={setor}>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-info/10">
                  <Building className="h-5 w-5 text-info" />
                </div>
                <div>
                  <p className="text-2xl font-semibold">{count}</p>
                  <p className="text-sm text-muted-foreground">{setorLabels[setor as Setor]}</p>
                </div>
              </div>
            </KonvertaCard>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <Input
              type="search"
              placeholder="Buscar por nome ou e-mail..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              icon={<Search className="h-4 w-4" />}
            />
          </div>
          <Select value={filterSetor} onValueChange={setFilterSetor}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Setor" />
            </SelectTrigger>
            <SelectContent className="bg-card border-border/40">
              <SelectItem value="all">Todos os setores</SelectItem>
              {Object.entries(setorLabels).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-full sm:w-32">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent className="bg-card border-border/40">
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="ativo">Ativos</SelectItem>
              <SelectItem value="inativo">Inativos</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Team List */}
        {filteredProfiles.length === 0 ? (
          <KonvertaCard>
            <EmptyState
              icon={Users}
              title="Nenhum colaborador encontrado"
              description="Convide novos colaboradores para sua equipe."
            />
          </KonvertaCard>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProfiles.map((profile) => (
              <KonvertaCard key={profile.id} className="hover:border-border/40 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <KonvertaAvatar
                      name={profile.nome}
                      src={profile.avatar_url || undefined}
                      size="md"
                    />
                    <div className="min-w-0">
                      <p className="font-medium text-foreground truncate">
                        {profile.nome}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {profile.email}
                      </p>
                    </div>
                  </div>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-card border-border/40">
                      <DropdownMenuItem onClick={() => handleEdit(profile)}>
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => toggleStatus(profile)}>
                        {profile.ativo ? "Desativar" : "Ativar"}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                
                <div className="mt-4 flex flex-wrap gap-2">
                  {profile.cargo && (
                    <KonvertaBadge variant="info">
                      <Briefcase className="h-3 w-3 mr-1" />
                      {cargoLabels[profile.cargo]}
                    </KonvertaBadge>
                  )}
                  {profile.setor && (
                    <KonvertaBadge variant="secondary">
                      <Building className="h-3 w-3 mr-1" />
                      {setorLabels[profile.setor]}
                    </KonvertaBadge>
                  )}
                  <KonvertaBadge variant={profile.ativo ? "success" : "secondary"}>
                    {profile.ativo ? "Ativo" : "Inativo"}
                  </KonvertaBadge>
                </div>
              </KonvertaCard>
            ))}
          </div>
        )}

        {/* Edit Modal */}
        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogContent className="bg-card border-border/40">
            <DialogHeader>
              <DialogTitle>Editar Colaborador</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Nome</label>
                <Input
                  value={editNome}
                  onChange={(e) => setEditNome(e.target.value)}
                  placeholder="Nome completo"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Cargo</label>
                <Select value={editCargo} onValueChange={(v) => setEditCargo(v as Cargo)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o cargo" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border/40">
                    {Object.entries(cargoLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {editCargo && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Setor</label>
                  <Input
                    value={setorLabels[cargoToSetor[editCargo as Cargo]]}
                    readOnly
                    className="bg-background"
                  />
                </div>
              )}
              
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Status</label>
                <Button
                  variant={editAtivo ? "default" : "secondary"}
                  size="sm"
                  onClick={() => setEditAtivo(!editAtivo)}
                >
                  {editAtivo ? "Ativo" : "Inativo"}
                </Button>
              </div>
              
              <Button
                className="w-full"
                onClick={saveEdit}
                disabled={editLoading}
              >
                {editLoading ? <LoadingSpinner size="sm" /> : "Salvar Alterações"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
