import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Heart, Trophy, User, AlertCircle, CheckCircle2 } from "lucide-react";

const maskPhone = (v: string) => {
  const d = v.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2) return d.length ? `(${d}` : "";
  if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
};

interface Props {
  tipo: "social" | "time";
}

const TIPO_META = {
  social: {
    label: "Tubarão Social",
    table: "tubarao_social" as const,
    icon: Heart,
    accent: "text-rose-600",
  },
  time: {
    label: "Tubarão Time",
    table: "tubarao_time" as const,
    icon: Trophy,
    accent: "text-amber-600",
  },
};

const PublicCadastro = ({ tipo }: Props) => {
  const { liderId } = useParams<{ liderId: string }>();
  const meta = TIPO_META[tipo];
  const Icon = meta.icon;

  const [liderNome, setLiderNome] = useState<string | null>(null);
  const [liderInvalido, setLiderInvalido] = useState(false);
  const [carregandoLider, setCarregandoLider] = useState(true);

  const [form, setForm] = useState({ nome: "", telefone: "", email: "", observacoes: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sucesso, setSucesso] = useState(false);

  useEffect(() => {
    if (!liderId) {
      setLiderInvalido(true);
      setCarregandoLider(false);
      return;
    }
    (supabase.rpc as any)("tubarao_get_lider_publico", { p_user_id: liderId }).then(
      ({ data, error }: any) => {
        setCarregandoLider(false);
        if (error || !data || data.length === 0) {
          setLiderInvalido(true);
        } else {
          setLiderNome(data[0].nome);
        }
      }
    );
  }, [liderId]);

  const set = (key: keyof typeof form, value: string) => {
    setForm((f) => ({ ...f, [key]: value }));
    if (submitted) {
      setErrors((prev) => {
        const { [key]: _, ...rest } = prev;
        return rest;
      });
    }
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.nome.trim()) errs.nome = "Nome é obrigatório";
    if (!form.telefone.trim()) errs.telefone = "Telefone é obrigatório";
    if (form.email && !/^\S+@\S+\.\S+$/.test(form.email)) errs.email = "E-mail inválido";
    return errs;
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) {
      toast.error("Preencha os campos obrigatórios");
      return;
    }
    setLoading(true);
    const { error } = await (supabase.from as any)(meta.table).insert({
      nome: form.nome.trim(),
      telefone: form.telefone.trim() || null,
      email: form.email.trim() || null,
      observacoes: form.observacoes.trim() || null,
      criado_por: liderId,
    });
    setLoading(false);
    if (error) {
      toast.error("Erro ao enviar: " + error.message);
    } else {
      setSucesso(true);
    }
  };

  if (carregandoLider) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center gradient-deep">
        <span className="h-8 w-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  if (liderInvalido) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center gradient-deep p-4">
        <Card className="max-w-md w-full shadow-elevated border-0">
          <CardContent className="p-8 text-center">
            <AlertCircle className="h-12 w-12 mx-auto text-destructive mb-3" />
            <h1 className="text-xl font-extrabold text-foreground">Link inválido</h1>
            <p className="text-sm text-muted-foreground mt-2">
              Este link de cadastro não é válido ou foi removido. Entre em contato com quem te enviou.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (sucesso) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center gradient-deep p-4">
        <Card className="max-w-md w-full shadow-elevated border-0">
          <CardContent className="p-8 text-center space-y-3">
            <CheckCircle2 className="h-14 w-14 mx-auto text-emerald-600" />
            <h1 className="text-2xl font-extrabold text-foreground">Cadastro recebido!</h1>
            <p className="text-sm text-muted-foreground">
              Obrigado, <span className="font-semibold">{form.nome}</span>! Seu cadastro de{" "}
              <span className="font-semibold">{meta.label}</span> foi enviado para{" "}
              <span className="font-semibold">{liderNome}</span>.
            </p>
            <Button
              onClick={() => {
                setSucesso(false);
                setSubmitted(false);
                setForm({ nome: "", telefone: "", email: "", observacoes: "" });
              }}
              variant="outline"
              className="rounded-xl mt-2"
            >
              Cadastrar outra pessoa
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] gradient-deep">
      <header className="px-4 pt-8 pb-6 text-center">
        <Link to="/" className="inline-block">
          <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
            TUBARÃO CADASTROS
          </h1>
        </Link>
        <p className="text-white/70 text-xs sm:text-sm mt-1">
          {meta.label} · indicação de{" "}
          <span className="font-semibold text-white">{liderNome}</span>
        </p>
      </header>

      <div className="px-4 pb-12">
        <Card className="max-w-lg mx-auto shadow-elevated border-0 overflow-hidden">
          <CardHeader className="pb-3 px-4 sm:px-6">
            <CardTitle className="flex items-center gap-2.5 text-base">
              <div className="h-9 w-9 rounded-lg gradient-primary flex items-center justify-center shrink-0">
                <Icon className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="font-bold text-foreground leading-tight">Faça seu cadastro</p>
                <p className="text-xs text-muted-foreground font-normal">
                  Preencha os dados abaixo
                </p>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 sm:px-6 pb-6">
            <form onSubmit={submit} className="space-y-3">
              <Field label="Nome completo *" error={submitted ? errors.nome : undefined}>
                <Input
                  value={form.nome}
                  onChange={(e) => set("nome", e.target.value)}
                  placeholder="Seu nome completo"
                  className="h-11 rounded-xl border-0 bg-muted/50 focus:bg-background"
                />
              </Field>
              <Field label="WhatsApp *" error={submitted ? errors.telefone : undefined}>
                <Input
                  value={form.telefone}
                  onChange={(e) => set("telefone", maskPhone(e.target.value))}
                  placeholder="(00) 00000-0000"
                  inputMode="tel"
                  maxLength={15}
                  className="h-11 rounded-xl border-0 bg-muted/50 focus:bg-background"
                />
              </Field>
              <Field label="E-mail" error={submitted ? errors.email : undefined}>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => set("email", e.target.value)}
                  placeholder="email@exemplo.com (opcional)"
                  className="h-11 rounded-xl border-0 bg-muted/50 focus:bg-background"
                />
              </Field>
              <Field label="Observações">
                <Textarea
                  value={form.observacoes}
                  onChange={(e) => set("observacoes", e.target.value)}
                  rows={3}
                  placeholder="Algo que queira nos contar (opcional)"
                  className="rounded-xl border-0 bg-muted/50 focus:bg-background resize-none"
                />
              </Field>

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 rounded-xl gradient-primary border-0 shadow-elevated font-bold text-base mt-2"
              >
                {loading ? "Enviando..." : "Enviar cadastro"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-white/40 text-[10px] mt-4">
          Tubarão Cadastros · Sistema de Gestão
        </p>
      </div>
    </div>
  );
};

const Field = ({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) => (
  <div>
    <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
      {label}
    </Label>
    <div className="mt-1.5">{children}</div>
    {error && (
      <p className="flex items-center gap-1 text-destructive text-xs mt-1">
        <AlertCircle className="h-3 w-3 shrink-0" /> {error}
      </p>
    )}
  </div>
);

export default PublicCadastro;
