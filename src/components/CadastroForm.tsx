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
import { ArrowLeft, User, AlertCircle } from "lucide-react";

interface Props {
  table: "tubarao_social" | "tubarao_time";
  title: string;
  basePath: string;
}

const maskPhone = (v: string) => {
  const d = v.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2) return d.length ? `(${d}` : "";
  if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
};

interface FormData {
  nome: string;
  telefone: string;
  email: string;
  observacoes: string;
}

const defaultForm: FormData = { nome: "", telefone: "", email: "", observacoes: "" };

const CadastroForm = ({ table, title, basePath }: Props) => {
  const { id } = useParams();
  const isNew = !id || id === "novo";
  const navigate = useNavigate();
  const { user } = useAuth();
  const [form, setForm] = useState<FormData>(defaultForm);
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
              telefone: data.telefone || "",
              email: data.email || "",
              observacoes: data.observacoes || "",
            });
          }
        });
    }
  }, [id, isNew, table]);

  const set = (key: keyof FormData, value: string) => {
    setForm((f) => ({ ...f, [key]: value }));
    if (submitted)
      setErrors((prev) => {
        const { [key]: _, ...rest } = prev;
        return rest;
      });
  };

  const validate = (): Record<string, string> => {
    const errs: Record<string, string> = {};
    if (!form.nome.trim()) errs.nome = "Nome é obrigatório";
    if (!form.telefone.trim()) errs.telefone = "Telefone é obrigatório";
    if (form.email && !/^\S+@\S+\.\S+$/.test(form.email)) errs.email = "E-mail inválido";
    return errs;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) {
      toast.error("Preencha os campos obrigatórios");
      return;
    }
    setLoading(true);
    const payload: any = {
      nome: form.nome.trim(),
      telefone: form.telefone.trim() || null,
      email: form.email.trim() || null,
      observacoes: form.observacoes.trim() || null,
    };
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
        <Card className="shadow-card border-0 overflow-hidden">
          <CardHeader className="pb-3 sm:pb-4 px-4 sm:px-6">
            <CardTitle className="flex items-center gap-2.5 text-sm sm:text-base">
              <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg gradient-primary flex items-center justify-center shrink-0">
                <User className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-white" />
              </div>
              <span className="font-bold text-foreground">DADOS DO CADASTRO</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 sm:space-y-4 px-4 sm:px-6">
            <div>
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Nome completo *
              </Label>
              <Input
                value={form.nome}
                onChange={(e) => set("nome", e.target.value)}
                placeholder="Nome completo"
                className={`mt-1.5 h-11 rounded-xl border-0 bg-muted/50 focus:bg-background ${inputErr("nome")}`}
              />
              <FieldError field="nome" />
            </div>
            <div>
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Telefone / WhatsApp *
              </Label>
              <Input
                value={form.telefone}
                onChange={(e) => set("telefone", maskPhone(e.target.value))}
                placeholder="(00) 00000-0000"
                inputMode="tel"
                maxLength={15}
                className={`mt-1.5 h-11 rounded-xl border-0 bg-muted/50 focus:bg-background ${inputErr("telefone")}`}
              />
              <FieldError field="telefone" />
            </div>
            <div>
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                E-mail
              </Label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => set("email", e.target.value)}
                placeholder="email@exemplo.com"
                className={`mt-1.5 h-11 rounded-xl border-0 bg-muted/50 focus:bg-background ${inputErr("email")}`}
              />
              <FieldError field="email" />
            </div>
            <div>
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Observações
              </Label>
              <Textarea
                value={form.observacoes}
                onChange={(e) => set("observacoes", e.target.value)}
                placeholder="Informações adicionais..."
                rows={4}
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
