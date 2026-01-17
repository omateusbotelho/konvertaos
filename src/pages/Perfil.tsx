import { useState, useRef } from "react";
import { AppLayout } from "@/components/layout";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { KonvertaCard, KonvertaCardHeader, KonvertaCardTitle } from "@/components/ui/konverta-card";
import { KonvertaAvatar } from "@/components/ui/konverta-avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Camera, Lock, User, Mail, Building, Briefcase, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

const passwordSchema = z.object({
  newPassword: z.string().min(8, "Mínimo de 8 caracteres"),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "As senhas não coincidem",
  path: ["confirmPassword"],
});

const cargoLabels: Record<string, string> = {
  sdr: "SDR",
  closer: "Closer",
  gestor_trafego: "Gestor de Tráfego",
  social_media: "Social Media",
  financeiro: "Financeiro",
};

const setorLabels: Record<string, string> = {
  comercial: "Comercial",
  trafego: "Tráfego",
  social_media: "Social Media",
  financeiro: "Financeiro",
};

export default function Perfil() {
  const { profile, refreshProfile, user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [nome, setNome] = useState(profile?.nome || "");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  // Password form
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState<{
    newPassword?: string;
    confirmPassword?: string;
  }>({});

  const handleSaveProfile = async () => {
    if (!nome.trim()) {
      toast.error("Nome é obrigatório");
      return;
    }
    
    setSaving(true);
    
    const { error } = await supabase
      .from("profiles")
      .update({ nome })
      .eq("id", profile?.id);

    if (error) {
      toast.error("Erro ao salvar perfil");
    } else {
      await refreshProfile();
      toast.success("Perfil atualizado!");
    }
    
    setSaving(false);
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // Validate file
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      toast.error("Formato inválido. Use JPG, PNG ou WebP.");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error("Arquivo muito grande. Máximo 2MB.");
      return;
    }

    setUploading(true);

    const fileExt = file.name.split(".").pop();
    const fileName = `${user.id}/avatar.${fileExt}`;

    // Upload to storage
    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(fileName, file, { upsert: true });

    if (uploadError) {
      toast.error("Erro ao fazer upload");
      setUploading(false);
      return;
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from("avatars")
      .getPublicUrl(fileName);

    // Update profile
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ avatar_url: publicUrl })
      .eq("id", user.id);

    if (updateError) {
      toast.error("Erro ao atualizar avatar");
    } else {
      await refreshProfile();
      toast.success("Avatar atualizado!");
    }

    setUploading(false);
  };

  const handleChangePassword = async () => {
    setPasswordErrors({});
    
    const result = passwordSchema.safeParse({
      newPassword,
      confirmPassword,
    });

    if (!result.success) {
      const errors: typeof passwordErrors = {};
      result.error.errors.forEach((err) => {
        const key = err.path[0] as keyof typeof errors;
        errors[key] = err.message;
      });
      setPasswordErrors(errors);
      return;
    }

    setPasswordLoading(true);

    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (updateError) {
      toast.error("Erro ao alterar senha");
    } else {
      toast.success("Senha alterada com sucesso!");
      setNewPassword("");
      setConfirmPassword("");
    }

    setPasswordLoading(false);
  };

  if (!profile) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1>Meu Perfil</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie suas informações pessoais
          </p>
        </div>

        {/* Profile Card */}
        <KonvertaCard>
          <div className="flex flex-col items-center text-center pb-6 border-b border-border/20">
            {/* Avatar */}
            <div className="relative group">
              <KonvertaAvatar
                name={profile.nome}
                src={profile.avatar_url || undefined}
                size="xl"
                className="cursor-pointer"
                onClick={handleAvatarClick}
              />
              <div
                className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                onClick={handleAvatarClick}
              >
                {uploading ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  <Camera className="h-6 w-6 text-white" />
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>
            
            <h2 className="mt-4 text-xl font-semibold">{profile.nome}</h2>
            <p className="text-sm text-muted-foreground">{profile.email}</p>
          </div>

          <div className="pt-6 space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                Nome
              </label>
              <Input
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Seu nome"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                E-mail
              </label>
              <Input value={profile.email} readOnly className="bg-background" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-muted-foreground" />
                  Cargo
                </label>
                <Input
                  value={profile.cargo ? cargoLabels[profile.cargo] : "-"}
                  readOnly
                  className="bg-background"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Building className="h-4 w-4 text-muted-foreground" />
                  Setor
                </label>
                <Input
                  value={profile.setor ? setorLabels[profile.setor] : "-"}
                  readOnly
                  className="bg-background"
                />
              </div>
            </div>

            <Button
              className="w-full"
              onClick={handleSaveProfile}
              disabled={saving}
            >
              {saving ? <LoadingSpinner size="sm" /> : "Salvar Alterações"}
            </Button>
          </div>
        </KonvertaCard>

        {/* Password Card */}
        <KonvertaCard>
          <KonvertaCardHeader>
            <KonvertaCardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Alterar Senha
            </KonvertaCardTitle>
          </KonvertaCardHeader>

          <div className="space-y-4">

            <div className="space-y-2">
              <label className="text-sm font-medium">Nova senha</label>
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
              />
              {passwordErrors.newPassword && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {passwordErrors.newPassword}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Confirmar nova senha</label>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
              />
              {passwordErrors.confirmPassword && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {passwordErrors.confirmPassword}
                </p>
              )}
            </div>

            <Button
              variant="secondary"
              className="w-full"
              onClick={handleChangePassword}
              disabled={passwordLoading}
            >
              {passwordLoading ? <LoadingSpinner size="sm" /> : "Alterar Senha"}
            </Button>
          </div>
        </KonvertaCard>
      </div>
    </AppLayout>
  );
}
