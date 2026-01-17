import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Loader2, Check, ChevronLeft, ChevronRight, PartyPopper } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import confetti from "canvas-confetti";

interface ModalAtivacaoClienteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (data: ClienteData) => Promise<void>;
  onCancel: () => void;
  leadId: string;
  leadNome: string;
  leadTelefone: string;
  leadEmail?: string;
  valorProposta?: number;
  sdrId?: string;
  closerId?: string;
}

interface ServicoSelecionado {
  servico_id: string;
  nome: string;
  valor: number;
  responsavel_id: string;
}

export interface ClienteData {
  // Step 1 - Dados
  razao_social: string;
  nome_fantasia?: string;
  cnpj?: string;
  cpf?: string;
  telefone: string;
  email: string;
  endereco?: string;
  cidade?: string;
  estado?: string;
  cep?: string;
  // Step 2 - Serviços
  servicos: ServicoSelecionado[];
  fee_mensal: number;
  // Step 3 - Financeiro
  modelo_cobranca: "fee" | "fee_percentual" | "avulso";
  percentual?: number;
  dia_vencimento: number;
  forma_pagamento: "boleto" | "pix" | "cartao";
  // Step 4 - Comissões
  comissao_sdr?: number;
  comissao_closer?: number;
  // Step 5 - Options
  criar_no_asaas: boolean;
  disparar_onboarding: boolean;
  enviar_email_boas_vindas: boolean;
}

const STEPS = [
  { id: 1, label: "Dados" },
  { id: 2, label: "Serviços" },
  { id: 3, label: "Financeiro" },
  { id: 4, label: "Comissões" },
  { id: 5, label: "Confirmar" },
];

const ESTADOS_BR = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA",
  "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN",
  "RS", "RO", "RR", "SC", "SP", "SE", "TO"
];

export function ModalAtivacaoCliente({
  open,
  onOpenChange,
  onConfirm,
  onCancel,
  leadId,
  leadNome,
  leadTelefone,
  leadEmail,
  valorProposta,
  sdrId,
  closerId,
}: ModalAtivacaoClienteProps) {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Step 1 - Dados
  const [razaoSocial, setRazaoSocial] = useState(leadNome);
  const [nomeFantasia, setNomeFantasia] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [cpf, setCpf] = useState("");
  const [telefone, setTelefone] = useState(leadTelefone);
  const [email, setEmail] = useState(leadEmail || "");
  const [endereco, setEndereco] = useState("");
  const [cidade, setCidade] = useState("");
  const [estado, setEstado] = useState("");
  const [cep, setCep] = useState("");

  // Step 2 - Serviços
  const [servicosSelecionados, setServicosSelecionados] = useState<ServicoSelecionado[]>([]);

  // Step 3 - Financeiro
  const [modeloCobranca, setModeloCobranca] = useState<"fee" | "fee_percentual" | "avulso">("fee");
  const [percentual, setPercentual] = useState<number>(0);
  const [diaVencimento, setDiaVencimento] = useState<number>(10);
  const [formaPagamento, setFormaPagamento] = useState<"boleto" | "pix" | "cartao">("boleto");

  // Step 4 - Comissões
  const [comissaoSdr, setComissaoSdr] = useState<number>(0);
  const [comissaoCloser, setComissaoCloser] = useState<number>(0);

  // Step 5 - Options
  const [criarNoAsaas, setCriarNoAsaas] = useState(true);
  const [dispararOnboarding, setDispararOnboarding] = useState(true);
  const [enviarEmailBoasVindas, setEnviarEmailBoasVindas] = useState(false);

  // Fetch servicos
  const { data: servicos } = useQuery({
    queryKey: ["servicos-ativos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("servicos")
        .select("*")
        .eq("ativo", true);
      if (error) throw error;
      return data;
    },
  });

  // Fetch profiles for responsaveis by setor
  const { data: profiles } = useQuery({
    queryKey: ["profiles-responsaveis"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, nome, setor, cargo")
        .eq("ativo", true);
      if (error) throw error;
      return data;
    },
  });

  // Fetch SDR and Closer names
  const { data: sdrProfile } = useQuery({
    queryKey: ["profile", sdrId],
    queryFn: async () => {
      if (!sdrId) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("nome")
        .eq("id", sdrId)
        .single();
      if (error) return null;
      return data;
    },
    enabled: !!sdrId,
  });

  const { data: closerProfile } = useQuery({
    queryKey: ["profile", closerId],
    queryFn: async () => {
      if (!closerId) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("nome")
        .eq("id", closerId)
        .single();
      if (error) return null;
      return data;
    },
    enabled: !!closerId,
  });

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      setStep(1);
      setRazaoSocial(leadNome);
      setTelefone(leadTelefone);
      setEmail(leadEmail || "");
    }
  }, [open, leadNome, leadTelefone, leadEmail]);

  const feeMensal = servicosSelecionados.reduce((sum, s) => sum + (s.valor || 0), 0);

  const toggleServico = (servico: { id: string; nome: string }) => {
    const exists = servicosSelecionados.find((s) => s.servico_id === servico.id);
    if (exists) {
      setServicosSelecionados(servicosSelecionados.filter((s) => s.servico_id !== servico.id));
    } else {
      setServicosSelecionados([
        ...servicosSelecionados,
        { servico_id: servico.id, nome: servico.nome, valor: 0, responsavel_id: "" },
      ]);
    }
  };

  const updateServicoValor = (servicoId: string, valor: number) => {
    setServicosSelecionados(
      servicosSelecionados.map((s) =>
        s.servico_id === servicoId ? { ...s, valor } : s
      )
    );
  };

  const updateServicoResponsavel = (servicoId: string, responsavelId: string) => {
    setServicosSelecionados(
      servicosSelecionados.map((s) =>
        s.servico_id === servicoId ? { ...s, responsavel_id: responsavelId } : s
      )
    );
  };

  const getResponsaveisPorSetor = (setorServico: string) => {
    return profiles?.filter((p) => p.setor === setorServico) || [];
  };

  const canProceed = () => {
    switch (step) {
      case 1:
        return razaoSocial && telefone && email;
      case 2:
        return servicosSelecionados.length > 0 &&
          servicosSelecionados.every((s) => s.valor > 0 && s.responsavel_id);
      case 3:
        return diaVencimento && formaPagamento;
      case 4:
        return true;
      case 5:
        return true;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (step < 5) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      // Trigger celebration confetti
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        zIndex: 9999,
      });

      await onConfirm({
        razao_social: razaoSocial,
        nome_fantasia: nomeFantasia || undefined,
        cnpj: cnpj || undefined,
        cpf: cpf || undefined,
        telefone,
        email,
        endereco: endereco || undefined,
        cidade: cidade || undefined,
        estado: estado || undefined,
        cep: cep || undefined,
        servicos: servicosSelecionados,
        fee_mensal: feeMensal,
        modelo_cobranca: modeloCobranca,
        percentual: modeloCobranca === "fee_percentual" ? percentual : undefined,
        dia_vencimento: diaVencimento,
        forma_pagamento: formaPagamento,
        comissao_sdr: comissaoSdr || undefined,
        comissao_closer: comissaoCloser || undefined,
        criar_no_asaas: criarNoAsaas,
        disparar_onboarding: dispararOnboarding,
        enviar_email_boas_vindas: enviarEmailBoasVindas,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    onCancel();
    onOpenChange(false);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: 2,
    }).format(value);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="p-6 pb-4 border-b">
          <DialogTitle>Ativar Cliente</DialogTitle>
          <DialogDescription>
            Preencha os dados para ativar <strong>{leadNome}</strong> como cliente.
          </DialogDescription>
        </DialogHeader>

        {/* Steps indicator */}
        <div className="px-6 py-3 border-b bg-muted/30">
          <div className="flex items-center justify-center gap-2">
            {STEPS.map((s, index) => (
              <div key={s.id} className="flex items-center gap-2">
                <div
                  className={cn(
                    "flex items-center gap-2 px-3 py-1.5 rounded-full text-sm transition-colors",
                    step === s.id
                      ? "bg-primary text-primary-foreground"
                      : step > s.id
                      ? "bg-success/10 text-success"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {step > s.id ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <span className="w-4 h-4 flex items-center justify-center text-xs font-medium">
                      {s.id}
                    </span>
                  )}
                  <span className="hidden sm:inline">{s.label}</span>
                </div>
                {index < STEPS.length - 1 && (
                  <div
                    className={cn(
                      "w-8 h-0.5",
                      step > s.id ? "bg-success" : "bg-border"
                    )}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <ScrollArea className="flex-1 px-6 py-4">
          {/* Step 1: Dados do Cliente */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="razao-social">Razão Social *</Label>
                  <Input
                    id="razao-social"
                    value={razaoSocial}
                    onChange={(e) => setRazaoSocial(e.target.value)}
                    placeholder="Nome da empresa"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nome-fantasia">Nome Fantasia</Label>
                  <Input
                    id="nome-fantasia"
                    value={nomeFantasia}
                    onChange={(e) => setNomeFantasia(e.target.value)}
                    placeholder="Nome fantasia"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cnpj">CNPJ</Label>
                  <Input
                    id="cnpj"
                    value={cnpj}
                    onChange={(e) => setCnpj(e.target.value)}
                    placeholder="00.000.000/0000-00"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cpf">CPF</Label>
                  <Input
                    id="cpf"
                    value={cpf}
                    onChange={(e) => setCpf(e.target.value)}
                    placeholder="000.000.000-00"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="telefone">Telefone *</Label>
                  <Input
                    id="telefone"
                    value={telefone}
                    onChange={(e) => setTelefone(e.target.value)}
                    placeholder="(00) 00000-0000"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">E-mail *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="email@empresa.com"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="endereco">Endereço</Label>
                <Input
                  id="endereco"
                  value={endereco}
                  onChange={(e) => setEndereco(e.target.value)}
                  placeholder="Rua, número, complemento"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cidade">Cidade</Label>
                  <Input
                    id="cidade"
                    value={cidade}
                    onChange={(e) => setCidade(e.target.value)}
                    placeholder="Cidade"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="estado">Estado</Label>
                  <Select value={estado} onValueChange={setEstado}>
                    <SelectTrigger id="estado">
                      <SelectValue placeholder="UF" />
                    </SelectTrigger>
                    <SelectContent>
                      {ESTADOS_BR.map((uf) => (
                        <SelectItem key={uf} value={uf}>
                          {uf}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cep">CEP</Label>
                  <Input
                    id="cep"
                    value={cep}
                    onChange={(e) => setCep(e.target.value)}
                    placeholder="00000-000"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Serviços */}
          {step === 2 && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Selecione os serviços contratados:
              </p>

              <div className="space-y-3">
                {servicos?.map((servico) => {
                  const isSelected = servicosSelecionados.some(
                    (s) => s.servico_id === servico.id
                  );
                  const servicoData = servicosSelecionados.find(
                    (s) => s.servico_id === servico.id
                  );
                  const responsaveis = getResponsaveisPorSetor(servico.setor_responsavel);

                  return (
                    <div
                      key={servico.id}
                      className={cn(
                        "border rounded-lg p-4 transition-colors",
                        isSelected ? "border-primary bg-primary/5" : "border-border"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <Checkbox
                          id={`servico-${servico.id}`}
                          checked={isSelected}
                          onCheckedChange={() => toggleServico(servico)}
                        />
                        <Label
                          htmlFor={`servico-${servico.id}`}
                          className="flex-1 cursor-pointer font-medium"
                        >
                          {servico.nome}
                        </Label>
                      </div>

                      {isSelected && (
                        <div className="mt-3 pt-3 border-t border-border/50 grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Valor mensal *</Label>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                                R$
                              </span>
                              <Input
                                type="number"
                                className="pl-10"
                                value={servicoData?.valor || ""}
                                onChange={(e) =>
                                  updateServicoValor(servico.id, Number(e.target.value))
                                }
                                placeholder="0,00"
                              />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label>Responsável *</Label>
                            <Select
                              value={servicoData?.responsavel_id || ""}
                              onValueChange={(v) =>
                                updateServicoResponsavel(servico.id, v)
                              }
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione" />
                              </SelectTrigger>
                              <SelectContent>
                                {responsaveis.map((r) => (
                                  <SelectItem key={r.id} value={r.id}>
                                    {r.nome}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <Separator />

              <div className="flex items-center justify-between text-lg font-semibold">
                <span>Fee Mensal Total:</span>
                <span className="text-success">{formatCurrency(feeMensal)}</span>
              </div>
            </div>
          )}

          {/* Step 3: Financeiro */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="space-y-4">
                <Label>Modelo de Cobrança *</Label>
                <RadioGroup
                  value={modeloCobranca}
                  onValueChange={(v) => setModeloCobranca(v as "fee" | "fee_percentual" | "avulso")}
                  className="space-y-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="fee" id="fee" />
                    <Label htmlFor="fee" className="cursor-pointer">
                      Fee Mensal
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="fee_percentual" id="fee_percentual" />
                    <Label htmlFor="fee_percentual" className="cursor-pointer">
                      Fee + Percentual de Resultado
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="avulso" id="avulso" />
                    <Label htmlFor="avulso" className="cursor-pointer">
                      Cobrança Avulsa
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {modeloCobranca === "fee_percentual" && (
                <div className="space-y-2">
                  <Label htmlFor="percentual">Percentual sobre resultado (%)</Label>
                  <Input
                    id="percentual"
                    type="number"
                    value={percentual}
                    onChange={(e) => setPercentual(Number(e.target.value))}
                    placeholder="0"
                    className="max-w-[120px]"
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="dia-vencimento">Dia de Vencimento *</Label>
                <Select
                  value={String(diaVencimento)}
                  onValueChange={(v) => setDiaVencimento(Number(v))}
                >
                  <SelectTrigger id="dia-vencimento" className="max-w-[120px]">
                    <SelectValue placeholder="Dia" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 31 }, (_, i) => i + 1).map((dia) => (
                      <SelectItem key={dia} value={String(dia)}>
                        {dia}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-4">
                <Label>Forma de Pagamento *</Label>
                <RadioGroup
                  value={formaPagamento}
                  onValueChange={(v) => setFormaPagamento(v as "boleto" | "pix" | "cartao")}
                  className="flex gap-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="boleto" id="boleto" />
                    <Label htmlFor="boleto" className="cursor-pointer">
                      Boleto
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="pix" id="pix" />
                    <Label htmlFor="pix" className="cursor-pointer">
                      Pix
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="cartao" id="cartao" />
                    <Label htmlFor="cartao" className="cursor-pointer">
                      Cartão de Crédito
                    </Label>
                  </div>
                </RadioGroup>
              </div>
            </div>
          )}

          {/* Step 4: Comissões */}
          {step === 4 && (
            <div className="space-y-6">
              <p className="text-sm text-muted-foreground">
                Comissões serão pagas enquanto o cliente estiver ativo.
              </p>

              {sdrId && (
                <div className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">SDR: {sdrProfile?.nome || "Carregando..."}</p>
                      <p className="text-sm text-muted-foreground">Comissão mensal</p>
                    </div>
                  </div>
                  <div className="relative max-w-[200px]">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                      R$
                    </span>
                    <Input
                      type="number"
                      className="pl-10"
                      value={comissaoSdr || ""}
                      onChange={(e) => setComissaoSdr(Number(e.target.value))}
                      placeholder="0,00"
                    />
                  </div>
                </div>
              )}

              {closerId && (
                <div className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Closer: {closerProfile?.nome || "Carregando..."}</p>
                      <p className="text-sm text-muted-foreground">Comissão mensal</p>
                    </div>
                  </div>
                  <div className="relative max-w-[200px]">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                      R$
                    </span>
                    <Input
                      type="number"
                      className="pl-10"
                      value={comissaoCloser || ""}
                      onChange={(e) => setComissaoCloser(Number(e.target.value))}
                      placeholder="0,00"
                    />
                  </div>
                </div>
              )}

              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-muted text-[10px]">
                  i
                </span>
                Valores definidos pelo Administrador
              </p>
            </div>
          )}

          {/* Step 5: Confirmação */}
          {step === 5 && (
            <div className="space-y-6">
              <div className="space-y-4">
                <h3 className="font-semibold">Resumo do Cliente</h3>
                <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Empresa:</span>
                    <span className="font-medium">{razaoSocial}</span>
                  </div>
                  {cnpj && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">CNPJ:</span>
                      <span className="font-medium">{cnpj}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Fee Mensal:</span>
                    <span className="font-medium text-success">{formatCurrency(feeMensal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Serviços:</span>
                    <span className="font-medium">
                      {servicosSelecionados.map((s) => s.nome).join(", ")}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Vencimento:</span>
                    <span className="font-medium">Dia {diaVencimento}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Pagamento:</span>
                    <span className="font-medium capitalize">{formaPagamento}</span>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="criar-asaas"
                    checked={criarNoAsaas}
                    onCheckedChange={(c) => setCriarNoAsaas(c === true)}
                  />
                  <Label htmlFor="criar-asaas" className="cursor-pointer">
                    Criar cliente no Asaas
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="disparar-onboarding"
                    checked={dispararOnboarding}
                    onCheckedChange={(c) => setDispararOnboarding(c === true)}
                  />
                  <Label htmlFor="disparar-onboarding" className="cursor-pointer">
                    Disparar tarefas de onboarding
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="enviar-email"
                    checked={enviarEmailBoasVindas}
                    onCheckedChange={(c) => setEnviarEmailBoasVindas(c === true)}
                  />
                  <Label htmlFor="enviar-email" className="cursor-pointer">
                    Enviar e-mail de boas-vindas
                  </Label>
                </div>
              </div>
            </div>
          )}
        </ScrollArea>

        {/* Footer */}
        <DialogFooter className="p-6 pt-4 border-t gap-2">
          {step > 1 && (
            <Button type="button" variant="outline" onClick={handleBack}>
              <ChevronLeft className="w-4 h-4 mr-1" />
              Voltar
            </Button>
          )}
          <div className="flex-1" />
          <Button type="button" variant="ghost" onClick={handleCancel}>
            Cancelar
          </Button>
          {step < 5 ? (
            <Button onClick={handleNext} disabled={!canProceed()}>
              Próximo
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="bg-success hover:bg-success/90"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <PartyPopper className="w-4 h-4 mr-2" />
              )}
              Ativar Cliente
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
