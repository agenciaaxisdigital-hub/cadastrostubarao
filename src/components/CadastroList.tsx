import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Search, Plus, Edit, Trash2, Users, Share2, Heart, Trophy, Baby, Filter } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { copyPublicLink } from "@/lib/shareLink";
import { maskCPF, maskPhone } from "@/lib/cadastroFields";

export type CadastroBase = {
  id: string;
  nome: string;
  cpf: string | null;
  telefone: string | null;
  instagram: string | null;
  titulo_eleitor: string | null;
  zona: string | null;
  secao: string | null;
  municipio: string | null;
  uf: string | null;
  colegio_eleitoral: string | null;
  observacoes: string | null;
  tipo: string | null;
  criado_em: string;
  criado_por: string | null;
};

interface Props {
  /** Nome da tabela no Supabase, ex: 'tubarao_social' */
  table: "tubarao_social" | "tubarao_time";
  /** Título exibido no topo da página */
  title: string;
  /** Subtítulo */
  subtitle: string;
  /** Rota base, ex: '/social' ou '/time' */
  basePath: string;
  /** Cor de destaque do gradiente do header do drawer */
  accentClass?: string;
}

const formatDate = (d: string | null) => {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleDateString("pt-BR");
  } catch {
    return d;
  }
};

const CadastroList = ({ table, title, subtitle, basePath }: Props) => {
  const [search, setSearch] = useState("");
  const [viewItem, setViewItem] = useState<CadastroBase | null>(null);
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.cargo === "diretor";

  const { data: items = [], isLoading, error, refetch } = useQuery({
    queryKey: [table, user?.id, isAdmin],
    queryFn: async () => {
      // Cast to any while migration is pending; types will be regenerated after SQL is applied.
      let query = (supabase.from as any)(table).select("*").order("nome");
      if (!isAdmin && user?.id) query = query.eq("criado_por", user.id);
      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as CadastroBase[];
    },
  });

  const filtered = useMemo(() => {
    const s = search.toLowerCase();
    return (items as CadastroBase[]).filter(
      (a) =>
        !s ||
        a.nome?.toLowerCase().includes(s) ||
        a.telefone?.toLowerCase().includes(s) ||
        a.tipo?.toLowerCase().includes(s)
    );
  }, [items, search]);

  const counts = useMemo(() => {
    return (items as CadastroBase[]).reduce((acc: Record<string, number>, curr) => {
      const t = curr.tipo || "outro";
      acc[t] = (acc[t] || 0) + 1;
      return acc;
    }, {});
  }, [items]);

  const TIPO_LABEL: Record<string, string> = {
    jogador: "Jogador",
    comissao_tecnica: "Comissão",
    familia: "Família",
    torcida: "Torcida",
  };

  const TIPO_ICON: Record<string, any> = {
    jogador: Trophy,
    comissao_tecnica: Users,
    familia: Baby,
    torcida: Heart,
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Deseja realmente excluir?")) return;
    const { error } = await (supabase.from as any)(table).delete().eq("id", id);
    if (error) toast.error("Erro ao excluir");
    else {
      toast.success("Excluído com sucesso");
      refetch();
    }
  };

  if (error)
    return (
      <div className="flex items-center justify-center py-16">
        <p className="text-sm text-destructive">
          Erro ao carregar dados. Verifique se a tabela <code>{table}</code> existe.
        </p>
      </div>
    );

  return (
    <div className="space-y-4 sm:space-y-6 w-full min-w-0">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-foreground">{title}</h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            {filtered.length} de {items.length} {subtitle}
          </p>
        </div>
        <div className="flex gap-2">
          {user?.id && (
            <Button
              variant="outline"
              onClick={() => copyPublicLink(table === "tubarao_social" ? "social" : "time", user.id, user.nome)}
              className="rounded-xl h-10 sm:h-11 px-3 shadow-card border-0 bg-card font-bold text-xs sm:text-sm gap-1.5"
              title="Compartilhar link de cadastro"
            >
              <Share2 className="h-4 w-4" />
              <span className="hidden sm:inline">Link</span>
            </Button>
          )}
          <Button
            onClick={() => navigate(`${basePath}/novo`)}
            className="rounded-xl h-10 sm:h-11 px-3 sm:px-5 gradient-primary border-0 shadow-elevated font-bold text-xs sm:text-sm gap-1.5"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Novo</span>
          </Button>
        </div>
      </div>

      {/* Summary Tags */}
      <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar scroll-smooth">
        {Object.entries(TIPO_LABEL).map(([id, label]) => {
          const count = counts[id] || 0;
          const Icon = TIPO_ICON[id];
          return (
            <div
              key={id}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-card border border-muted shadow-sm shrink-0"
            >
              <Icon className="h-3 w-3 text-primary" />
              <span className="text-[10px] font-bold text-foreground">{label}</span>
              <span className="text-[10px] font-black text-primary bg-primary/10 px-1.5 rounded-md">{count}</span>
            </div>
          );
        })}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar nome ou telefone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 h-11 rounded-xl bg-card shadow-card border-0"
        />
      </div>

      {/* List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <span className="h-6 w-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <Card className="shadow-card border-0">
          <CardContent className="p-10 text-center text-muted-foreground">
            <Users className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">Nenhum cadastro encontrado</p>
            <p className="text-xs mt-1">Clique em "Novo" para começar</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((a) => (
            <Card
              key={a.id}
              className="shadow-card border-0 active:scale-[0.99] transition-all cursor-pointer hover:shadow-md group"
              onClick={() => setViewItem(a)}
            >
              <CardContent className="p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-4 min-w-0 flex-1">
                  <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center shrink-0 group-hover:bg-primary/10 transition-colors">
                    {(() => {
                      const Icon = TIPO_ICON[a.tipo || ""] || Users;
                      return <Icon className="h-5 w-5 text-slate-400 group-hover:text-primary transition-colors" />;
                    })()}
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-sm sm:text-base text-slate-900 truncate leading-tight">{a.nome}</p>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <p className="text-xs text-slate-500 truncate font-medium">
                        {a.telefone ? maskPhone(a.telefone) : "Sem telefone"}
                      </p>
                      <span className="h-1 w-1 rounded-full bg-slate-300" />
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 text-[9px] text-slate-600 font-black uppercase tracking-tighter">
                        {TIPO_LABEL[a.tipo || ""] || "Outro"}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => navigate(`${basePath}/${a.id}`)}
                    className="rounded-xl h-9 w-9 hover:bg-primary/10 hover:text-primary"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(a.id)}
                    className="rounded-xl h-9 w-9 hover:bg-rose-100 hover:text-rose-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Detail sheet */}
      <Sheet open={!!viewItem} onOpenChange={(open) => !open && setViewItem(null)}>
        <SheetContent className="w-[100vw] sm:w-full sm:max-w-lg overflow-y-auto p-0">
          {viewItem && (
            <div className="flex flex-col h-full">
              <div className="gradient-deep p-5 pb-6">
                <SheetHeader>
                  <SheetTitle className="text-white text-xl font-extrabold text-left">
                    {viewItem.nome}
                  </SheetTitle>
                </SheetHeader>
                <p className="text-white/70 text-sm mt-1">{title}</p>
              </div>
              <div className="flex-1 p-4 space-y-3">
                <DetailRow 
                  label="Tipo de Cadastro" 
                  value={viewItem.tipo ? (TIPO_LABEL[viewItem.tipo] || viewItem.tipo) : null} 
                  icon={viewItem.tipo ? TIPO_ICON[viewItem.tipo] : undefined}
                />
                <DetailRow label="CPF" value={viewItem.cpf} mask={maskCPF} />
                <DetailRow label="WhatsApp" value={viewItem.telefone} mask={maskPhone} />
                <DetailRow label="Instagram" value={viewItem.instagram} />
                <DetailRow label="Título de eleitor" value={viewItem.titulo_eleitor} />
                <div className="grid grid-cols-2 gap-3">
                  <DetailRow label="Zona" value={viewItem.zona} />
                  <DetailRow label="Seção" value={viewItem.secao} />
                </div>
                <div className="grid grid-cols-[1fr_auto] gap-3">
                  <DetailRow label="Município" value={viewItem.municipio} />
                  <DetailRow label="UF" value={viewItem.uf} />
                </div>
                <DetailRow label="Colégio eleitoral" value={viewItem.colegio_eleitoral} />
                <DetailRow label="Observações" value={viewItem.observacoes} />
                <DetailRow label="Cadastrado em" value={formatDate(viewItem.criado_em)} />
                <Button
                  onClick={() => {
                    navigate(`${basePath}/${viewItem.id}`);
                    setViewItem(null);
                  }}
                  className="w-full rounded-xl h-11 gradient-primary border-0 shadow-elevated font-bold mt-2"
                >
                  <Edit className="h-4 w-4 mr-2" /> Editar cadastro
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
};

const DetailRow = ({ 
  label, 
  value, 
  mask,
  icon: Icon
}: { 
  label: string; 
  value: string | null; 
  mask?: (v: string) => string;
  icon?: any;
}) => (
  <div className="py-2 border-b last:border-0">
    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
      {Icon && <Icon className="h-3 w-3" />} {label}
    </p>
    <p className="text-sm text-foreground font-medium mt-0.5 whitespace-pre-wrap">
      {value ? (mask ? mask(value) : value) : "—"}
    </p>
  </div>
);

export default CadastroList;
