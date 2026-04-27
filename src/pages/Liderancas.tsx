import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Crown, Heart, Trophy, Search, Share2, Eye, FileDown } from "lucide-react";
import { copyPublicLink } from "@/lib/shareLink";
import { toast } from "sonner";
import * as XLSX from "xlsx";

type LiderRow = {
  id: string;
  nome: string;
  cargo: string;
  total_social: number;
  total_time: number;
};

type CadastroSimples = {
  id: string;
  nome: string;
  telefone: string | null;
  criado_em: string;
};

const Liderancas = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [viewLider, setViewLider] = useState<LiderRow | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  if (user?.cargo !== "admin") return <Navigate to="/social" replace />;

  const handleExportAll = async () => {
    setIsExporting(true);
    try {
      // Busca todos os dados necessários
      const [socialData, timeData, usersData] = await Promise.all([
        (supabase.from as any)("tubarao_social").select("*"),
        (supabase.from as any)("tubarao_time").select("*"),
        supabase.from("sindspag_usuarios").select("id, nome"),
      ]);

      if (socialData.error || timeData.error) throw new Error("Erro ao buscar dados");

      const userMap = (usersData.data || []).reduce((acc: any, u: any) => {
        acc[u.id] = u.nome;
        return acc;
      }, {});

      const formatRow = (r: any) => ({
        ...r,
        criado_por_nome: userMap[r.criado_por] || "Desconhecido",
        criado_em: r.criado_em ? new Date(r.criado_em).toLocaleString("pt-BR") : "",
      });

      const wb = XLSX.utils.book_new();
      
      // Aba Social
      const wsSocial = XLSX.utils.json_to_sheet(socialData.data.map(formatRow));
      XLSX.utils.book_append_sheet(wb, wsSocial, "Tubarão Social");

      // Aba Time
      const wsTime = XLSX.utils.json_to_sheet(timeData.data.map(formatRow));
      XLSX.utils.book_append_sheet(wb, wsTime, "Tubarão Time");

      // Aba Lideranças (Resumo)
      const wsLideres = XLSX.utils.json_to_sheet(lideres.map(l => ({
        Nome: l.nome,
        Cargo: l.cargo,
        Social: l.total_social,
        Time: l.total_time,
        Total: l.total_social + l.total_time
      })));
      XLSX.utils.book_append_sheet(wb, wsLideres, "Resumo Lideranças");

      XLSX.writeFile(wb, `relatorio_geral_tubarao_${new Date().toISOString().split('T')[0]}.xlsx`);
      toast.success("Relatório exportado com sucesso!");
    } catch (error) {
      console.error(error);
      toast.error("Falha ao exportar relatório");
    } finally {
      setIsExporting(false);
    }
  };

  const { data: lideres = [], isLoading } = useQuery({
    queryKey: ["liderancas-com-totais"],
    queryFn: async () => {
      const { data: usuarios, error } = await supabase
        .from("sindspag_usuarios")
        .select("id, nome, cargo")
        .in("cargo", ["admin", "lideranca"])
        .order("nome");
      if (error) throw error;

      const ids = (usuarios ?? []).map((u) => u.id);
      if (!ids.length) return [];

      const [socialCount, timeCount] = await Promise.all([
        (supabase.from as any)("tubarao_social")
          .select("criado_por", { count: "exact", head: false })
          .in("criado_por", ids),
        (supabase.from as any)("tubarao_time")
          .select("criado_por", { count: "exact", head: false })
          .in("criado_por", ids),
      ]);

      const socialBy: Record<string, number> = {};
      (socialCount.data ?? []).forEach((r: any) => {
        if (r.criado_por) socialBy[r.criado_por] = (socialBy[r.criado_por] || 0) + 1;
      });
      const timeBy: Record<string, number> = {};
      (timeCount.data ?? []).forEach((r: any) => {
        if (r.criado_por) timeBy[r.criado_por] = (timeBy[r.criado_por] || 0) + 1;
      });

      return (usuarios ?? []).map<LiderRow>((u) => ({
        id: u.id,
        nome: u.nome,
        cargo: u.cargo,
        total_social: socialBy[u.id] || 0,
        total_time: timeBy[u.id] || 0,
      }));
    },
  });

  const { data: cadastrosLider = [] } = useQuery({
    queryKey: ["cadastros-do-lider", viewLider?.id],
    queryFn: async () => {
      if (!viewLider) return { social: [], time: [] };
      const [s, t] = await Promise.all([
        (supabase.from as any)("tubarao_social")
          .select("id, nome, telefone, criado_em")
          .eq("criado_por", viewLider.id)
          .order("criado_em", { ascending: false }),
        (supabase.from as any)("tubarao_time")
          .select("id, nome, telefone, criado_em")
          .eq("criado_por", viewLider.id)
          .order("criado_em", { ascending: false }),
      ]);
      return {
        social: (s.data ?? []) as CadastroSimples[],
        time: (t.data ?? []) as CadastroSimples[],
      };
    },
    enabled: !!viewLider,
  });

  const filtered = lideres.filter((l) =>
    !search || l.nome.toLowerCase().includes(search.toLowerCase())
  );

  const totalGeralSocial = lideres.reduce((acc, l) => acc + l.total_social, 0);
  const totalGeralTime = lideres.reduce((acc, l) => acc + l.total_time, 0);

  return (
    <div className="space-y-4 sm:space-y-6 w-full min-w-0">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-foreground tracking-tight uppercase">Lideranças</h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 font-medium">
            Painel de Controle e Desempenho
          </p>
        </div>
        <Button 
          disabled={isExporting} 
          onClick={handleExportAll}
          className="rounded-xl gradient-primary border-0 shadow-elevated font-bold gap-2 text-xs sm:text-sm h-10 sm:h-11 px-4 sm:px-6 transition-all active:scale-95"
        >
          <FileDown className="h-4 w-4" />
          {isExporting ? "Gerando..." : "Exportar Geral"}
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        <Card className="shadow-card border-0">
          <CardContent className="p-3 sm:p-4 flex items-center gap-2 sm:gap-3">
            <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl gradient-primary flex items-center justify-center shrink-0">
              <Crown className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
            </div>
            <div className="min-w-0">
              <p className="text-lg sm:text-2xl font-extrabold leading-none">{lideres.length}</p>
              <p className="text-[10px] sm:text-[11px] text-muted-foreground font-medium">Lideranças</p>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-card border-0">
          <CardContent className="p-3 sm:p-4 flex items-center gap-2 sm:gap-3">
            <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl bg-rose-500/10 flex items-center justify-center shrink-0">
              <Heart className="h-4 w-4 sm:h-5 sm:w-5 text-rose-600" />
            </div>
            <div className="min-w-0">
              <p className="text-lg sm:text-2xl font-extrabold leading-none">{totalGeralSocial}</p>
              <p className="text-[10px] sm:text-[11px] text-muted-foreground font-medium">Cad. Social</p>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-card border-0">
          <CardContent className="p-3 sm:p-4 flex items-center gap-2 sm:gap-3">
            <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0">
              <Trophy className="h-4 w-4 sm:h-5 sm:w-5 text-amber-600" />
            </div>
            <div className="min-w-0">
              <p className="text-lg sm:text-2xl font-extrabold leading-none">{totalGeralTime}</p>
              <p className="text-[10px] sm:text-[11px] text-muted-foreground font-medium">Cad. Time</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar liderança..."
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
            <Crown className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">Nenhuma liderança encontrada</p>
            <p className="text-xs mt-1">
              Crie em <button onClick={() => navigate("/usuarios")} className="text-primary underline">Usuários</button>
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
          {filtered.map((l) => (
            <Card key={l.id} className="shadow-card border-0 hover:shadow-lg transition-shadow overflow-hidden group">
              <CardContent className="p-0">
                <div className="flex flex-col">
                  <div className="p-4 flex items-center justify-between bg-muted/30">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary border border-primary/20">
                        {l.nome.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-bold text-sm sm:text-base text-foreground leading-tight">{l.nome}</p>
                        <span className={`text-[9px] px-2 py-0.5 rounded-full font-black uppercase tracking-tighter mt-1 inline-block ${
                          l.cargo === "admin" ? "bg-primary text-white shadow-sm" : "bg-accent/20 text-accent"
                        }`}>
                          {l.cargo === "admin" ? "Admin" : "Liderança"}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setViewLider(l)}
                        className="rounded-xl h-9 w-9 bg-white shadow-sm hover:bg-primary/10 hover:text-primary transition-all"
                        title="Ver detalhamento"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="p-4 grid grid-cols-2 gap-3 bg-white">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 text-rose-600">
                        <Heart className="h-3 w-3 fill-rose-600/10" />
                        <span className="text-[10px] font-bold uppercase tracking-wider">Social</span>
                      </div>
                      <p className="text-xl font-black text-slate-800 leading-none">{l.total_social}</p>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 text-amber-600">
                        <Trophy className="h-3 w-3 fill-amber-600/10" />
                        <span className="text-[10px] font-bold uppercase tracking-wider">Time</span>
                      </div>
                      <p className="text-xl font-black text-slate-800 leading-none">{l.total_time}</p>
                    </div>
                  </div>

                  <div className="px-4 py-3 bg-muted/10 border-t flex items-center justify-between">
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyPublicLink("social", l.id, l.nome)}
                        className="rounded-lg h-8 text-[10px] font-bold gap-1.5 border-rose-200 text-rose-700 hover:bg-rose-50"
                      >
                        <Share2 className="h-3 w-3" /> Link Social
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyPublicLink("time", l.id, l.nome)}
                        className="rounded-lg h-8 text-[10px] font-bold gap-1.5 border-amber-200 text-amber-700 hover:bg-amber-50"
                      >
                        <Share2 className="h-3 w-3" /> Link Time
                      </Button>
                    </div>
                    <div className="text-[10px] font-black text-slate-400">
                      TOTAL: {l.total_social + l.total_time}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Drill-down sheet */}
      <Sheet open={!!viewLider} onOpenChange={(o) => !o && setViewLider(null)}>
        <SheetContent className="w-[100vw] sm:w-full sm:max-w-lg overflow-y-auto p-0">
          {viewLider && (
            <div className="flex flex-col h-full">
              <div className="gradient-deep p-5 pb-6">
                <SheetHeader>
                  <SheetTitle className="text-white text-xl font-extrabold text-left">
                    Cadastros de {viewLider.nome}
                  </SheetTitle>
                </SheetHeader>
                <div className="flex gap-3 mt-2 text-white/90 text-sm">
                  <span className="flex items-center gap-1"><Heart className="h-3 w-3" /> {cadastrosLider && (cadastrosLider as any).social?.length || 0} Social</span>
                  <span className="flex items-center gap-1"><Trophy className="h-3 w-3" /> {cadastrosLider && (cadastrosLider as any).time?.length || 0} Time</span>
                </div>
                <div className="flex gap-2 mt-3">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => copyPublicLink("social", viewLider.id, viewLider.nome)}
                    className="rounded-xl gap-1.5 h-8 text-xs"
                  >
                    <Share2 className="h-3 w-3" /> Link Social
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => copyPublicLink("time", viewLider.id, viewLider.nome)}
                    className="rounded-xl gap-1.5 h-8 text-xs"
                  >
                    <Share2 className="h-3 w-3" /> Link Time
                  </Button>
                </div>
              </div>

              <div className="flex-1 p-4 space-y-4">
                <Section title="Tubarão Social" icon={Heart} items={(cadastrosLider as any).social || []} basePath="/social" />
                <Section title="Tubarão Time" icon={Trophy} items={(cadastrosLider as any).time || []} basePath="/time" />
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
};

const Section = ({
  title,
  icon: Icon,
  items,
  basePath,
}: {
  title: string;
  icon: any;
  items: CadastroSimples[];
  basePath: string;
}) => {
  const navigate = useNavigate();
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 mb-2">
        <Icon className="h-3 w-3" /> {title} ({items.length})
      </p>
      {items.length === 0 ? (
        <p className="text-xs text-muted-foreground italic">Nenhum cadastro</p>
      ) : (
        <div className="space-y-1.5">
          {items.map((c) => (
            <button
              key={c.id}
              onClick={() => navigate(`${basePath}/${c.id}`)}
              className="w-full text-left p-2.5 rounded-xl bg-muted/40 hover:bg-muted transition-colors"
            >
              <p className="text-sm font-semibold truncate">{c.nome}</p>
              <p className="text-[11px] text-muted-foreground">
                {c.telefone || "Sem telefone"} · {new Date(c.criado_em).toLocaleDateString("pt-BR")}
              </p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default Liderancas;
