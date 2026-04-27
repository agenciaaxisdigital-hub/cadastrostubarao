import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { ArrowLeft, ExternalLink, User, Vote, Building2, AlertCircle } from "lucide-react";

const maskCPF = (v: string) => {
  const d = v.replace(/\D/g, "").slice(0, 11);
  return d.replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d{1,2})$/, "$1-$2");
};

const maskPhone = (v: string) => {
  const d = v.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2) return d.length ? `(${d}` : "";
  if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
};

const isValidCPF = (cpf: string): boolean => {
  const d = cpf.replace(/\D/g, "");
  if (d.length !== 11 || /^(\d)\1{10}$/.test(d)) return false;
  for (let t = 9; t < 11; t++) {
    let sum = 0;
    for (let i = 0; i < t; i++) sum += parseInt(d[i]) * (t + 1 - i);
    const rest = (sum * 10) % 11;
    if ((rest === 10 ? 0 : rest) !== parseInt(d[t])) return false;
  }
  return true;
};


const STATUS_OPTIONS = ["Ativo", "Inativo", "Suspenso"];
const UF_OPTIONS = ["AC","AL","AM","AP","BA","CE","DF","ES","GO","MA","MG","MS","MT","PA","PB","PE","PI","PR","RJ","RN","RO","RR","RS","SC","SE","SP","TO"];

interface FormData {
  nome: string; cpf: string; whatsapp: string;
  instagram: string; titulo_eleitor: string; zona_eleitoral: string;
  secao_eleitoral: string; municipio: string; uf: string; colegio_eleitoral: string;
  situacao_titulo: string; ligacao_politica: string; status: string;
  observacoes: string; eh_socio_atual: boolean;
  socio_desde: string; ja_foi_socio: boolean; foi_socio_quando: string;
}

const defaultForm: FormData = {
  nome: "", cpf: "", whatsapp: "", instagram: "",
  titulo_eleitor: "", zona_eleitoral: "", secao_eleitoral: "", municipio: "", uf: "GO",
  colegio_eleitoral: "", situacao_titulo: "", ligacao_politica: "", status: "Ativo",
  observacoes: "", eh_socio_atual: false, socio_desde: "", ja_foi_socio: false, foi_socio_quando: "",
};

const SectionCard = ({ icon: Icon, title, color, children }: { icon: any; title: string; color: string; children: React.ReactNode }) => (
  <Card className="shadow-card border-0 overflow-hidden">
    <CardHeader className="pb-3 sm:pb-4 px-4 sm:px-6">
      <CardTitle className="flex items-center gap-2 sm:gap-2.5 text-sm sm:text-base">
        <div className={`h-7 w-7 sm:h-8 sm:w-8 rounded-lg flex items-center justify-center shrink-0 ${color}`}>
          <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-white" />
        </div>
        <span className="font-bold text-foreground">{title}</span>
      </CardTitle>
    </CardHeader>
    <CardContent className="space-y-3 sm:space-y-4 px-4 sm:px-6">{children}</CardContent>
  </Card>
);

const AssociadoForm = () => {
  const { id } = useParams();
  const isNew = !id;
  const navigate = useNavigate();
  const { user } = useAuth();
  const [form, setForm] = useState<FormData>(defaultForm);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!isNew && id) {
      supabase.from("sindspag_associados").select("*").eq("id", id).single().then(({ data, error }) => {
        if (error) {
          toast.error("Erro ao carregar associado: " + error.message);
          return;
        }
        if (data) {
          setForm({
            nome: data.nome || "", cpf: data.cpf || "",
            whatsapp: data.whatsapp || "", instagram: [data.instagram, data.facebook].filter(Boolean).join(" / ") || "",
            titulo_eleitor: data.titulo_eleitor || "",
            zona_eleitoral: data.zona_eleitoral || "", secao_eleitoral: data.secao_eleitoral || "",
            municipio: data.municipio || "", uf: data.uf || "GO",
            colegio_eleitoral: data.colegio_eleitoral || "", situacao_titulo: data.situacao_titulo || "",
            ligacao_politica: data.ligacao_politica || "", status: data.status || "Ativo",
            observacoes: data.observacoes || "",
            eh_socio_atual: data.eh_socio_atual || false, socio_desde: data.socio_desde || "",
            ja_foi_socio: data.ja_foi_socio || false, foi_socio_quando: data.foi_socio_quando || "",
          });
        }
      });
    }
  }, [id, isNew]);

  const set = (key: keyof FormData, value: any) => {
    setForm((f) => ({ ...f, [key]: value }));
    if (submitted) setErrors((prev) => { const { [key]: _, ...rest } = prev; return rest; });
  };

  const FieldError = ({ field }: { field: string }) =>
    submitted && errors[field] ? (
      <p className="flex items-center gap-1 text-destructive text-xs mt-1">
        <AlertCircle className="h-3 w-3 shrink-0" /> {errors[field]}
      </p>
    ) : null;

  const inputErr = (field: string) =>
    submitted && errors[field] ? "ring-2 ring-destructive/50 bg-destructive/5" : "";

  const validate = (): Record<string, string> => {
    const errs: Record<string, string> = {};
    if (!form.nome.trim()) errs.nome = "Nome é obrigatório";
    const cpfDigits = form.cpf.replace(/\D/g, "");
    if (!cpfDigits) errs.cpf = "CPF é obrigatório";
    else if (cpfDigits.length < 11) errs.cpf = "CPF incompleto";
    else if (!isValidCPF(cpfDigits)) errs.cpf = "CPF inválido";
    if (!form.whatsapp.trim()) errs.whatsapp = "WhatsApp é obrigatório";
    if (!form.instagram.trim()) errs.instagram = "Rede Social é obrigatória";
    if (form.eh_socio_atual && !form.socio_desde) errs.socio_desde = "Informe desde quando é sócio";
    if (!form.eh_socio_atual && form.ja_foi_socio && !form.foi_socio_quando.trim()) errs.foi_socio_quando = "Informe quando foi sócio";
    if (!form.titulo_eleitor.trim()) errs.titulo_eleitor = "Título de eleitor é obrigatório";
    if (!form.zona_eleitoral.trim()) errs.zona_eleitoral = "Zona é obrigatória";
    if (!form.secao_eleitoral.trim()) errs.secao_eleitoral = "Seção é obrigatória";
    if (!form.municipio.trim()) errs.municipio = "Município é obrigatório";
    if (!form.colegio_eleitoral.trim()) errs.colegio_eleitoral = "Colégio eleitoral é obrigatório";
    if (!form.ligacao_politica.trim()) errs.ligacao_politica = "Ligação política é obrigatória";
    return errs;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    const errs = validate();
    setErrors(errs);

    if (Object.keys(errs).length > 0) {
      const missing = Object.values(errs);
      toast.error(`Preencha os campos obrigatórios (${missing.length} pendente${missing.length > 1 ? "s" : ""})`, {
        description: missing.slice(0, 3).join(", ") + (missing.length > 3 ? ` e mais ${missing.length - 3}...` : ""),
      });
      return;
    }
    setLoading(true);

    const payload = {
      ...form,
      telefone: form.whatsapp,
      email: null,
      facebook: form.instagram,
      criado_por: isNew ? user?.id : undefined,
      socio_desde: form.eh_socio_atual && form.socio_desde ? form.socio_desde : null,
      ja_foi_socio: !form.eh_socio_atual ? form.ja_foi_socio : false,
      foi_socio_quando: !form.eh_socio_atual && form.ja_foi_socio ? form.foi_socio_quando : null,
    };

    let error;
    if (isNew) {
      ({ error } = await supabase.from("sindspag_associados").insert(payload));
    } else {
      ({ error } = await supabase.from("sindspag_associados").update(payload).eq("id", id));
    }

    setLoading(false);
    if (error) {
      toast.error("Erro ao salvar: " + error.message);
    } else {
      toast.success(isNew ? "Associado cadastrado!" : "Associado atualizado!");
      navigate("/associados");
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto space-y-4 sm:space-y-5 min-w-0">
      {id && (
        <Button variant="ghost" onClick={() => navigate("/associados")} className="gap-2 rounded-xl hover:bg-muted h-9 text-sm">
          <ArrowLeft className="h-4 w-4" /> Voltar
        </Button>
      )}

      <div>
        <h1 className="text-xl sm:text-2xl font-extrabold text-foreground">
          {isNew ? "Cadastrar Associado" : "Editar Associado"}
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
          {isNew ? "Preencha os dados para cadastrar um novo associado" : "Atualize as informações do associado"}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
        {/* DADOS PESSOAIS */}
        <SectionCard icon={User} title="DADOS PESSOAIS" color="gradient-primary">
          <div>
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Nome completo *</Label>
            <Input value={form.nome} onChange={(e) => set("nome", e.target.value)} placeholder="Nome do associado" className={`mt-1.5 h-11 rounded-xl border-0 bg-muted/50 focus:bg-background ${inputErr("nome")}`} />
            <FieldError field="nome" />
          </div>
          <div>
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">CPF *</Label>
            <Input value={form.cpf} onChange={(e) => set("cpf", maskCPF(e.target.value))} placeholder="000.000.000-00" inputMode="numeric" maxLength={14} className={`mt-1.5 h-11 rounded-xl border-0 bg-muted/50 focus:bg-background ${inputErr("cpf")}`} />
            <FieldError field="cpf" />
          </div>
          <div>
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">WhatsApp *</Label>
            <Input value={form.whatsapp} onChange={(e) => set("whatsapp", maskPhone(e.target.value))} placeholder="(00) 00000-0000" inputMode="tel" maxLength={15} className={`mt-1.5 h-11 rounded-xl border-0 bg-muted/50 focus:bg-background ${inputErr("whatsapp")}`} />
            <FieldError field="whatsapp" />
          </div>
          <div>
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Rede Social *</Label>
            <Input value={form.instagram} onChange={(e) => set("instagram", e.target.value)} placeholder="@usuario ou link" className={`mt-1.5 h-11 rounded-xl border-0 bg-muted/50 focus:bg-background ${inputErr("instagram")}`} />
            <FieldError field="instagram" />
          </div>
        </SectionCard>

        {/* VÍNCULO SINDICAL */}
        <SectionCard icon={Building2} title="VÍNCULO SINDICAL" color="bg-emerald-600">
          <div>
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">É sócio atualmente? *</Label>
            <Select value={form.eh_socio_atual ? "sim" : "nao"} onValueChange={(v) => set("eh_socio_atual", v === "sim")}>
              <SelectTrigger className="mt-1.5 h-11 rounded-xl border-0 bg-muted/50"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="sim">Sim</SelectItem>
                <SelectItem value="nao">Não</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {form.eh_socio_atual && (
            <div>
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Sócio desde *</Label>
              <Input type="date" value={form.socio_desde} onChange={(e) => set("socio_desde", e.target.value)} className={`mt-1.5 h-11 rounded-xl border-0 bg-muted/50 focus:bg-background ${inputErr("socio_desde")}`} />
              <FieldError field="socio_desde" />
            </div>
          )}
          {!form.eh_socio_atual && (
            <>
              <div>
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Já foi sócio?</Label>
                <Select value={form.ja_foi_socio ? "sim" : "nao"} onValueChange={(v) => set("ja_foi_socio", v === "sim")}>
                  <SelectTrigger className="mt-1.5 h-11 rounded-xl border-0 bg-muted/50"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sim">Sim</SelectItem>
                    <SelectItem value="nao">Não</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {form.ja_foi_socio && (
                <div>
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Quando foi sócio? *</Label>
                  <Input value={form.foi_socio_quando} onChange={(e) => set("foi_socio_quando", e.target.value)} placeholder="Ex: 2018 a 2021" className={`mt-1.5 h-11 rounded-xl border-0 bg-muted/50 focus:bg-background ${inputErr("foi_socio_quando")}`} />
                  <FieldError field="foi_socio_quando" />
                </div>
              )}
            </>
          )}
        </SectionCard>

        {/* DADOS ELEITORAIS */}
        <SectionCard icon={Vote} title="DADOS ELEITORAIS" color="bg-blue-600">
          <a
            href="https://www.tse.jus.br/servicos-eleitorais/autoatendimento-eleitoral#/atendimento-eleitor"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors"
          >
            <ExternalLink className="h-4 w-4" /> Consultar dados no TSE
          </a>
          <p className="text-xs text-muted-foreground">Abra o site do TSE, consulte os dados e preencha abaixo.</p>
          <div>
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Título de eleitor *</Label>
            <Input value={form.titulo_eleitor} onChange={(e) => set("titulo_eleitor", e.target.value)} placeholder="Número do título" className={`mt-1.5 h-11 rounded-xl border-0 bg-muted/50 focus:bg-background ${inputErr("titulo_eleitor")}`} />
            <FieldError field="titulo_eleitor" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Zona *</Label>
              <Input value={form.zona_eleitoral} onChange={(e) => set("zona_eleitoral", e.target.value)} placeholder="045" className={`mt-1.5 h-11 rounded-xl border-0 bg-muted/50 focus:bg-background ${inputErr("zona_eleitoral")}`} />
              <FieldError field="zona_eleitoral" />
            </div>
            <div>
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Seção *</Label>
              <Input value={form.secao_eleitoral} onChange={(e) => set("secao_eleitoral", e.target.value)} placeholder="0123" className={`mt-1.5 h-11 rounded-xl border-0 bg-muted/50 focus:bg-background ${inputErr("secao_eleitoral")}`} />
              <FieldError field="secao_eleitoral" />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Município *</Label>
              <Input value={form.municipio} onChange={(e) => set("municipio", e.target.value)} placeholder="Cidade" className={`mt-1.5 h-11 rounded-xl border-0 bg-muted/50 focus:bg-background ${inputErr("municipio")}`} />
              <FieldError field="municipio" />
            </div>
            <div>
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">UF *</Label>
              <Select value={form.uf} onValueChange={(v) => set("uf", v)}>
                <SelectTrigger className="mt-1.5 h-11 rounded-xl border-0 bg-muted/50"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {UF_OPTIONS.map((uf) => (
                    <SelectItem key={uf} value={uf}>{uf}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Colégio eleitoral *</Label>
            <Input value={form.colegio_eleitoral} onChange={(e) => set("colegio_eleitoral", e.target.value)} placeholder="Nome da escola / local" className={`mt-1.5 h-11 rounded-xl border-0 bg-muted/50 focus:bg-background ${inputErr("colegio_eleitoral")}`} />
            <FieldError field="colegio_eleitoral" />
          </div>
          <div>
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Ligação política *</Label>
            <Input value={form.ligacao_politica} onChange={(e) => set("ligacao_politica", e.target.value)} placeholder="A quem é ligado politicamente" className={`mt-1.5 h-11 rounded-xl border-0 bg-muted/50 focus:bg-background ${inputErr("ligacao_politica")}`} />
            <FieldError field="ligacao_politica" />
          </div>
          <div>
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status *</Label>
            <Select value={form.status} onValueChange={(v) => set("status", v)}>
              <SelectTrigger className="mt-1.5 h-11 rounded-xl border-0 bg-muted/50"><SelectValue /></SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Observações</Label>
            <Textarea value={form.observacoes} onChange={(e) => set("observacoes", e.target.value)} placeholder="Anotações gerais..." rows={3} className="mt-1.5 rounded-xl border-0 bg-muted/50 focus:bg-background" />
          </div>
        </SectionCard>

        <div className="flex flex-col-reverse gap-2 pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))] sm:flex-row sm:justify-end sm:gap-3">
          <Button type="button" variant="outline" onClick={() => navigate("/associados")} className="rounded-xl h-11 px-6 w-full sm:w-auto">
            Cancelar
          </Button>
          <Button type="submit" disabled={loading} className="rounded-xl h-11 px-8 gradient-primary border-0 shadow-elevated font-bold w-full sm:w-auto">
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Salvando...
              </span>
            ) : isNew ? "Cadastrar" : "Salvar Alterações"}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default AssociadoForm;
