import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Crown, Heart, Trophy, Search, Share2, Eye } from "lucide-react";
import { copyPublicLink } from "@/lib/shareLink";

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

  if (user?.cargo !== "admin") return <Navigate to="/social" replace />;

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

      // Busca contagens em paralelo
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
      <div>
        <h1 className="text-xl sm:text-2xl font-extrabold text-foreground">Lideranças</h1>
        <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
          {lideres.length} lideranças · {totalGeralSocial} Social · {totalGeralTime} Time
        </p>
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
        <div className="space-y-2">
          {filtered.map((l) => (
            <Card key={l.id} className="shadow-card border-0">
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-sm sm:text-base text-foreground truncate">{l.nome}</p>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                        l.cargo === "admin" ? "bg-primary/10 text-primary" : "bg-accent/10 text-accent"
                      }`}>
                        {l.cargo === "admin" ? "Admin" : "Liderança"}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-1.5 text-xs">
                      <span className="flex items-center gap-1 text-rose-600 font-semibold">
                        <Heart className="h-3 w-3" /> {l.total_social} Social
                      </span>
                      <span className="flex items-center gap-1 text-amber-600 font-semibold">
                        <Trophy className="h-3 w-3" /> {l.total_time} Time
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => copyPublicLink("social", l.id, l.nome)}
                      className="rounded-xl h-9 w-9 hover:bg-rose-500/10 hover:text-rose-600"
                      title="Copiar link Social"
                    >
                      <Heart className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => copyPublicLink("time", l.id, l.nome)}
                      className="rounded-xl h-9 w-9 hover:bg-amber-500/10 hover:text-amber-600"
                      title="Copiar link Time"
                    >
                      <Trophy className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setViewLider(l)}
                      className="rounded-xl h-9 w-9 hover:bg-primary/10 hover:text-primary"
                      title="Ver cadastros"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
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
