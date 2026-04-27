import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { ArrowLeft, User, AlertCircle, Vote, ExternalLink } from "lucide-react";
import {
  CadastroFormData,
  defaultCadastroForm,
  maskCPF,
  maskPhone,
  maskInstagram,
  onlyDigits,
  upperLetters,
  validateCadastro,
  buildPayload,
} from "@/lib/cadastroFields";

interface Props {
  table: "tubarao_social" | "tubarao_time";
  title: string;
  basePath: string;
}

const CadastroForm = ({ table, title, basePath }: Props) => {
  const { id } = useParams();
  const isNew = !id || id === "novo";
  const navigate = useNavigate();
  const { user } = useAuth();
  const [form, setForm] = useState<CadastroFormData>(defaultCadastroForm);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!isNew && id) {
      (supabase.from as any)(table)
        .select("*")
        .eq("id", id)
        .single()
        .then(({ data, error }: any) => {
          if (error) {
            toast.error("Erro ao carregar: " + error.message);
            return;
          }
          if (data) {
            setForm({
              nome: data.nome || "",
              cpf: data.cpf || "",
              telefone: data.telefone || "",
              instagram: data.instagram || "",
              email: data.email || "",
              titulo_eleitor: data.titulo_eleitor || "",
              zona: data.zona || "",
              secao: data.secao || "",
              municipio: data.municipio || "",
              uf: data.uf || "GO",
              colegio_eleitoral: data.colegio_eleitoral || "",
              observacoes: data.observacoes || "",
            });
          }
        });
    }
  }, [id, isNew, table]);

  const set = (key: keyof CadastroFormData, value: string) => {
    setForm((f) => ({ ...f, [key]: value }));
    if (submitted)
      setErrors((prev) => {
        const { [key]: _, ...rest } = prev;
        return rest;
      });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    const errs = validateCadastro(form);
    setErrors(errs);
    if (Object.keys(errs).length > 0) {
      toast.error("Preencha os campos obrigatórios");
      return;
    }
    setLoading(true);
    const payload: any = buildPayload(form);
    if (isNew) payload.criado_por = user?.id ?? null;

    const { error } = isNew
      ? await (supabase.from as any)(table).insert(payload)
      : await (supabase.from as any)(table).update(payload).eq("id", id);

    setLoading(false);
    if (error) {
      toast.error("Erro ao salvar: " + error.message);
    } else {
      toast.success(isNew ? "Cadastrado com sucesso!" : "Atualizado com sucesso!");
      navigate(basePath);
    }
  };

  const FieldError = ({ field }: { field: string }) =>
    submitted && errors[field] ? (
      <p className="flex items-center gap-1 text-destructive text-xs mt-1">
        <AlertCircle className="h-3 w-3 shrink-0" /> {errors[field]}
      </p>
    ) : null;

  const inputErr = (field: string) =>
    submitted && errors[field] ? "ring-2 ring-destructive/50 bg-destructive/5" : "";

  const inputCls = (field: string) =>
    `mt-1.5 h-11 rounded-xl border-0 bg-muted/50 focus:bg-background ${inputErr(field)}`;

  const labelCls = "text-xs font-semibold uppercase tracking-wider text-muted-foreground";

  return (
    <div className="w-full max-w-3xl mx-auto space-y-4 sm:space-y-5 min-w-0">
      <Button
        variant="ghost"
        onClick={() => navigate(basePath)}
        className="gap-2 rounded-xl hover:bg-muted h-9 text-sm"
      >
        <ArrowLeft className="h-4 w-4" /> Voltar
      </Button>

      <div>
        <h1 className="text-xl sm:text-2xl font-extrabold text-foreground">
          {isNew ? `Novo Cadastro - ${title}` : `Editar - ${title}`}
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
          Preencha os dados abaixo
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
        {/* Dados pessoais */}
        <Card className="shadow-card border-0 overflow-hidden">
          <CardHeader className="pb-3 sm:pb-4 px-4 sm:px-6">
            <CardTitle className="flex items-center gap-2.5 text-sm sm:text-base">
              <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg gradient-primary flex items-center justify-center shrink-0">
                <User className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-white" />
              </div>
              <span className="font-bold text-foreground">DADOS PESSOAIS</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 sm:space-y-4 px-4 sm:px-6">
            <div>
              <Label className={labelCls}>Nome completo *</Label>
              <Input
                value={form.nome}
                onChange={(e) => set("nome", e.target.value)}
                placeholder="Nome completo"
                className={inputCls("nome")}
              />
              <FieldError field="nome" />
            </div>
            <div>
              <Label className={labelCls}>CPF *</Label>
              <Input
                value={form.cpf}
                onChange={(e) => set("cpf", maskCPF(e.target.value))}
                placeholder="000.000.000-00"
                inputMode="numeric"
                maxLength={14}
                className={inputCls("cpf")}
              />
              <FieldError field="cpf" />
            </div>
            <div>
              <Label className={labelCls}>WhatsApp *</Label>
              <Input
                value={form.telefone}
                onChange={(e) => set("telefone", maskPhone(e.target.value))}
                placeholder="(00) 00000-0000"
                inputMode="tel"
                maxLength={15}
                className={inputCls("telefone")}
              />
              <FieldError field="telefone" />
            </div>
            <div>
              <Label className={labelCls}>Instagram *</Label>
              <Input
                value={form.instagram}
                onChange={(e) => set("instagram", maskInstagram(e.target.value))}
                placeholder="@usuario"
                className={inputCls("instagram")}
              />
              <FieldError field="instagram" />
            </div>
            <div>
              <Label className={labelCls}>E-mail</Label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => set("email", e.target.value)}
                placeholder="email@exemplo.com"
                className={inputCls("email")}
              />
              <FieldError field="email" />
            </div>
          </CardContent>
        </Card>

        {/* Dados eleitorais */}
        <Card className="shadow-card border-0 overflow-hidden">
          <CardHeader className="pb-3 sm:pb-4 px-4 sm:px-6">
            <CardTitle className="flex items-center gap-2.5 text-sm sm:text-base">
              <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg gradient-primary flex items-center justify-center shrink-0">
                <Vote className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-white" />
              </div>
              <span className="font-bold text-foreground">DADOS ELEITORAIS</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 sm:space-y-4 px-4 sm:px-6">
            <a
              href="https://www.tse.jus.br/eleitor/autoatendimento-eleitoral"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full h-11 rounded-xl bg-primary/5 hover:bg-primary/10 text-primary text-sm font-semibold transition-colors"
            >
              <ExternalLink className="h-4 w-4" /> Consultar dados no TSE
            </a>
            <div>
              <Label className={labelCls}>Título de eleitor *</Label>
              <Input
                value={form.titulo_eleitor}
                onChange={(e) => set("titulo_eleitor", onlyDigits(e.target.value, 13))}
                inputMode="numeric"
                className={inputCls("titulo_eleitor")}
              />
              <FieldError field="titulo_eleitor" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className={labelCls}>Zona *</Label>
                <Input
                  value={form.zona}
                  onChange={(e) => set("zona", onlyDigits(e.target.value, 4))}
                  inputMode="numeric"
                  className={inputCls("zona")}
                />
                <FieldError field="zona" />
              </div>
              <div>
                <Label className={labelCls}>Seção *</Label>
                <Input
                  value={form.secao}
                  onChange={(e) => set("secao", onlyDigits(e.target.value, 4))}
                  inputMode="numeric"
                  className={inputCls("secao")}
                />
                <FieldError field="secao" />
              </div>
            </div>
            <div className="grid grid-cols-[1fr_auto] gap-3">
              <div>
                <Label className={labelCls}>Município *</Label>
                <Input
                  value={form.municipio}
                  onChange={(e) => set("municipio", e.target.value)}
                  className={inputCls("municipio")}
                />
                <FieldError field="municipio" />
              </div>
              <div className="w-20">
                <Label className={labelCls}>UF</Label>
                <Input
                  value={form.uf}
                  onChange={(e) => set("uf", upperLetters(e.target.value))}
                  maxLength={2}
                  className={`${inputCls("uf")} text-center font-bold uppercase`}
                />
              </div>
            </div>
            <div>
              <Label className={labelCls}>Colégio eleitoral *</Label>
              <Input
                value={form.colegio_eleitoral}
                onChange={(e) => set("colegio_eleitoral", e.target.value)}
                className={inputCls("colegio_eleitoral")}
              />
              <FieldError field="colegio_eleitoral" />
            </div>
            <div>
              <Label className={labelCls}>Observações</Label>
              <Textarea
                value={form.observacoes}
                onChange={(e) => set("observacoes", e.target.value)}
                placeholder="Informações adicionais..."
                rows={3}
                className="mt-1.5 rounded-xl border-0 bg-muted/50 focus:bg-background resize-none"
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-2 pb-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate(basePath)}
            className="rounded-xl h-11 px-5 font-bold"
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={loading}
            className="rounded-xl h-11 px-6 gradient-primary border-0 shadow-elevated font-bold"
          >
            {loading ? "Salvando..." : isNew ? "Cadastrar" : "Salvar"}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default CadastroForm;
