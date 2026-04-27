import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Heart, Trophy, User, Vote, AlertCircle, CheckCircle2, ExternalLink, Users, Baby, Waves } from "lucide-react";
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
  tipo: "social" | "time";
}

const TIPO_META = {
  social: { label: "Tubarão Social", table: "tubarao_social" as const, icon: Heart },
  time: { label: "Tubarão Time", table: "tubarao_time" as const, icon: Trophy },
};

const PublicCadastro = ({ tipo }: Props) => {
  const { liderId } = useParams<{ liderId: string }>();
  const meta = TIPO_META[tipo];
  const Icon = meta.icon;

  const [liderNome, setLiderNome] = useState<string | null>(null);
  const [liderCargo, setLiderCargo] = useState<string | null>(null);
  const [liderInvalido, setLiderInvalido] = useState(false);
  const [carregandoLider, setCarregandoLider] = useState(true);

  const [form, setForm] = useState<CadastroFormData>(defaultCadastroForm);
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
          setLiderCargo(data[0].cargo);
        }
      }
    );
  }, [liderId]);

  const set = (key: keyof CadastroFormData, value: string) => {
    setForm((f) => ({ ...f, [key]: value }));
    if (submitted) {
      setErrors((prev) => {
        const { [key]: _, ...rest } = prev;
        return rest;
      });
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    const errs = validateCadastro(form);
    setErrors(errs);
    if (Object.keys(errs).length > 0) {
      toast.error("Preencha os campos obrigatórios");
      return;
    }
    setLoading(true);
    const { error } = await (supabase.from as any)(meta.table).insert({
      ...buildPayload(form),
      criado_por: liderId,
    });
    setLoading(false);
    if (error) {
      toast.error("Erro ao enviar: " + error.message);
    } else {
      setSucesso(true);
    }
  };

  useEffect(() => {
    if (sucesso) {
      const timer = setTimeout(() => {
        window.location.href = "https://www.instagram.com/drafernandasarelli/";
      }, 6000);
      return () => clearTimeout(timer);
    }
  }, [sucesso]);

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
      <div className="min-h-[100dvh] flex flex-col items-center justify-center p-4 bg-[#0a192f] relative overflow-hidden">
        {/* Background Decorative Elements */}
        <div className="absolute top-[-10%] right-[-10%] w-64 h-64 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-[-10%] left-[-10%] w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        
        <Card className="max-w-md w-full shadow-2xl border-0 overflow-hidden bg-white/95 backdrop-blur-sm relative z-10">
          <div className="h-2 w-full bg-muted overflow-hidden">
            <div className="h-full bg-emerald-500 animate-[progress_6s_linear_forwards]" style={{ width: '0%' }} />
          </div>
          
          <CardContent className="p-8 text-center space-y-6">
            <div className="relative">
              <div className="h-20 w-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto ring-8 ring-emerald-50/50">
                <CheckCircle2 className="h-12 w-12 text-emerald-600 animate-bounce" />
              </div>
            </div>

            <div className="space-y-2">
              <h1 className="text-3xl font-black text-[#0a192f] tracking-tight">
                CONCLUÍDO!
              </h1>
              <p className="text-muted-foreground font-medium">
                Seja bem-vindo(a), <span className="text-primary font-bold">{form.nome.split(' ')[0]}</span>!
              </p>
            </div>

            <div className="p-5 bg-[#0a192f]/5 rounded-2xl border border-[#0a192f]/10 space-y-4">
              <div className="space-y-1">
                <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Importante</p>
                <p className="text-sm font-bold text-[#0a192f]">
                  Siga agora a Dra. Fernanda Sarelli no Instagram para validar seu acesso e acompanhar as novidades:
                </p>
              </div>

              <Button 
                onClick={() => window.location.href = "https://www.instagram.com/drafernandasarelli/"}
                className="w-full h-12 rounded-xl bg-gradient-to-r from-[#833ab4] via-[#fd1d1d] to-[#fcb045] hover:opacity-90 text-white font-bold gap-2 shadow-lg transition-all active:scale-95"
              >
                <ExternalLink className="h-4 w-4" /> @drafernandasarelli
              </Button>
            </div>

            <div className="space-y-3 pt-2">
              <p className="text-xs text-muted-foreground flex items-center justify-center gap-2">
                <span className="h-1.5 w-1.5 bg-emerald-500 rounded-full animate-ping" />
                Redirecionando automaticamente...
              </p>
            </div>
          </CardContent>
        </Card>
        
        <p className="mt-8 text-white/30 text-[10px] font-bold tracking-widest uppercase">
          Tubarão Cadastros · Inteligência em Gestão
        </p>

        <style>{`
          @keyframes progress {
            from { width: 0%; }
            to { width: 100%; }
          }
        `}</style>
      </div>
    );
  }

  const labelCls = "text-xs font-semibold uppercase tracking-wider text-muted-foreground";
  const inputCls = (field: string) =>
    `h-11 rounded-xl border-0 bg-muted/50 focus:bg-background ${
      submitted && errors[field] ? "ring-2 ring-destructive/50 bg-destructive/5" : ""
    }`;

  return (
    <div className="min-h-[100dvh] relative overflow-hidden bg-[#020817] font-sans">
      {/* Premium Background Elements */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[-5%] left-[-5%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[100px]" />
        <div className="absolute bottom-[-5%] right-[-5%] w-[40%] h-[40%] bg-accent/10 rounded-full blur-[100px]" />
        <div 
          className="absolute inset-0 opacity-20 bg-cover bg-center mix-blend-overlay"
          style={{ backgroundImage: 'url("/login_background.png")' }}
        />
      </div>

      <header className="px-4 pt-12 pb-10 text-center relative z-10 animate-in fade-in slide-in-from-top-4 duration-700">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-accent shadow-lg shadow-primary/20 mb-6 mx-auto">
          <Waves className="h-7 w-7 text-white" />
        </div>
        <h1 className="text-3xl font-black text-white tracking-tighter uppercase sm:text-4xl mb-2">
          Tubarão <span className="text-primary-glow">Cadastros</span>
        </h1>
        <p className="text-slate-400 text-[10px] font-black tracking-[0.3em] uppercase mb-6">
          {meta.label}
        </p>
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Indicação de</span>
          <span className="text-xs font-black text-white uppercase tracking-tight">{liderNome}</span>
        </div>
      </header>

      <div className="px-4 pb-12 relative z-10">
        {/* Seleção de Tipo */}
        <div className="max-w-lg mx-auto mb-10 animate-in fade-in zoom-in duration-700 delay-200">
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] text-center mb-4">
            Selecione seu perfil
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { id: "jogador", label: "Jogador", icon: Trophy, roles: ["diretor"] },
              { id: "comissao_tecnica", label: "Comissão", icon: Users, roles: ["diretor"] },
              { id: "familia", label: "Família", icon: Baby, roles: ["diretor", "jogador", "comissao_tecnica"] },
              { id: "torcida", label: "Torcida", icon: Heart, roles: ["diretor", "jogador", "comissao_tecnica"] },
            ]
              .filter((t) => !liderCargo || t.roles.includes(liderCargo))
              .map((t) => {
                const Icon = t.icon;
                const active = form.tipo === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => set("tipo", t.id)}
                    className={`flex flex-col items-center justify-center p-3 rounded-2xl border-2 transition-all ${
                      active
                        ? "border-white bg-white/20 text-white shadow-lg scale-[1.05]"
                        : "border-white/10 bg-white/5 text-white/50 hover:border-white/30"
                    }`}
                  >
                    <Icon className={`h-5 w-5 mb-1.5 ${active ? "text-white" : "text-white/40"}`} />
                    <span className="text-[10px] font-black uppercase tracking-tight">{t.label}</span>
                  </button>
                );
              })}
          </div>
          {submitted && errors.tipo && (
            <p className="text-rose-400 text-[10px] font-bold text-center mt-2 flex items-center justify-center gap-1">
              <AlertCircle className="h-3 w-3" /> Selecione uma opção acima
            </p>
          )}
        </div>

        <div className={`${!form.tipo ? "opacity-30 pointer-events-none grayscale" : "transition-all duration-300"}`}>
          <Card className="max-w-lg mx-auto shadow-elevated border-0 overflow-hidden mb-4">
          <CardHeader className="pb-3 px-4 sm:px-6">
            <CardTitle className="flex items-center gap-2.5 text-base">
              <div className="h-9 w-9 rounded-lg gradient-primary flex items-center justify-center shrink-0">
                <User className="h-4 w-4 text-white" />
              </div>
              <span className="font-bold text-foreground">DADOS PESSOAIS</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 sm:px-6 pb-5 space-y-3">
            <Field label="Nome completo *" error={submitted ? errors.nome : undefined}>
              <Input
                value={form.nome}
                onChange={(e) => set("nome", e.target.value)}
                placeholder="Seu nome completo"
                className={inputCls("nome")}
              />
            </Field>
            <Field label="CPF *" error={submitted ? errors.cpf : undefined}>
              <Input
                value={form.cpf}
                onChange={(e) => set("cpf", maskCPF(e.target.value))}
                placeholder="000.000.000-00"
                inputMode="numeric"
                maxLength={14}
                className={inputCls("cpf")}
              />
            </Field>
            <Field label="WhatsApp *" error={submitted ? errors.telefone : undefined}>
              <Input
                value={form.telefone}
                onChange={(e) => set("telefone", maskPhone(e.target.value))}
                placeholder="(00) 00000-0000"
                inputMode="tel"
                maxLength={15}
                className={inputCls("telefone")}
              />
            </Field>
            <Field label="Instagram *" error={submitted ? errors.instagram : undefined}>
              <Input
                value={form.instagram}
                onChange={(e) => set("instagram", maskInstagram(e.target.value))}
                placeholder="@usuario"
                className={inputCls("instagram")}
              />
            </Field>
          </CardContent>
        </Card>

        <Card className="max-w-lg mx-auto shadow-elevated border-0 overflow-hidden">
          <CardHeader className="pb-3 px-4 sm:px-6">
            <CardTitle className="flex items-center gap-2.5 text-base">
              <div className="h-9 w-9 rounded-lg gradient-primary flex items-center justify-center shrink-0">
                <Vote className="h-4 w-4 text-white" />
              </div>
              <span className="font-bold text-foreground">DADOS ELEITORAIS</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 sm:px-6 pb-6">
            <form onSubmit={submit} className="space-y-3">
              <a
                href="https://www.tse.jus.br/eleitor/autoatendimento-eleitoral"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full h-11 rounded-xl bg-primary/5 hover:bg-primary/10 text-primary text-sm font-semibold transition-colors"
              >
                <ExternalLink className="h-4 w-4" /> Consultar dados no TSE
              </a>
              <Field label="Título de eleitor *" error={submitted ? errors.titulo_eleitor : undefined}>
                <Input
                  value={form.titulo_eleitor}
                  onChange={(e) => set("titulo_eleitor", onlyDigits(e.target.value, 13))}
                  inputMode="numeric"
                  className={inputCls("titulo_eleitor")}
                />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Zona *" error={submitted ? errors.zona : undefined}>
                  <Input
                    value={form.zona}
                    onChange={(e) => set("zona", onlyDigits(e.target.value, 4))}
                    inputMode="numeric"
                    className={inputCls("zona")}
                  />
                </Field>
                <Field label="Seção *" error={submitted ? errors.secao : undefined}>
                  <Input
                    value={form.secao}
                    onChange={(e) => set("secao", onlyDigits(e.target.value, 4))}
                    inputMode="numeric"
                    className={inputCls("secao")}
                  />
                </Field>
              </div>
              <div className="grid grid-cols-[1fr_auto] gap-3">
                <Field label="Município *" error={submitted ? errors.municipio : undefined}>
                  <Input
                    value={form.municipio}
                    onChange={(e) => set("municipio", e.target.value)}
                    className={inputCls("municipio")}
                  />
                </Field>
                <div className="w-20">
                  <Label className={labelCls}>UF</Label>
                  <div className="mt-1.5">
                    <Input
                      value={form.uf}
                      onChange={(e) => set("uf", upperLetters(e.target.value))}
                      maxLength={2}
                      className={`${inputCls("uf")} text-center font-bold uppercase`}
                    />
                  </div>
                </div>
              </div>
              <Field
                label="Colégio eleitoral *"
                error={submitted ? errors.colegio_eleitoral : undefined}
              >
                <Input
                  value={form.colegio_eleitoral}
                  onChange={(e) => set("colegio_eleitoral", e.target.value)}
                  className={inputCls("colegio_eleitoral")}
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
        </div>

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
