import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Edit, Trash2, Users, UserCheck, UserX, Plus, CalendarDays, ChevronDown, ChevronUp, X, MapPin, FileSpreadsheet } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import * as XLSX from "xlsx";

type Associado = {
  id: string;
  nome: string;
  cpf: string | null;
  telefone: string | null;
  whatsapp: string | null;
  email: string | null;
  instagram: string | null;
  facebook: string | null;
  titulo_eleitor: string | null;
  zona_eleitoral: string | null;
  secao_eleitoral: string | null;
  municipio: string | null;
  uf: string | null;
  colegio_eleitoral: string | null;
  situacao_titulo: string | null;
  ligacao_politica: string | null;
  eh_socio_atual: boolean | null;
  socio_desde: string | null;
  ja_foi_socio: boolean | null;
  foi_socio_quando: string | null;
  status: string | null;
  observacoes: string | null;
  criado_em: string;
  atualizado_em: string;
  criado_por: string | null;
  criado_por_nome?: string | null;
};

const formatDate = (d: string | null) => {
  if (!d) return "—";
  try { return new Date(d).toLocaleDateString("pt-BR"); } catch { return d; }
};

const Badge = ({ children, variant = "default" }: { children: React.ReactNode; variant?: "success" | "danger" | "primary" | "default" }) => {
  const styles = {
    success: "bg-emerald-500/10 text-emerald-700",
    danger: "bg-red-500/10 text-red-700",
    primary: "bg-primary/10 text-primary",
    default: "bg-muted text-muted-foreground",
  };
  return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-semibold ${styles[variant]}`}>{children}</span>;
};

const SectionTitle = ({ icon: Icon, children }: { icon: React.ElementType; children: React.ReactNode }) => (
  <div className="flex items-center gap-2 pt-3 pb-1">
    <div className="h-6 w-6 rounded-lg gradient-primary flex items-center justify-center shrink-0">
      <Icon className="h-3 w-3 text-white" />
    </div>
    <p className="text-xs font-bold text-foreground uppercase tracking-wide">{children}</p>
  </div>
);

const InfoItem = ({ label, value }: { label: string; value: string | null | undefined }) => {
  if (!value || value === "—" || value === "0") return null;
  return (
    <div className="py-1.5">
      <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">{label}</p>
      <p className="text-sm text-foreground font-medium mt-0.5">{value}</p>
    </div>
  );
};

const Dashboard = () => {
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [statusFilter, setStatusFilter] = useState("todos");
  const [socioFilter, setSocioFilter] = useState("todos");
  const [showFilters, setShowFilters] = useState(false);
  const [viewItem, setViewItem] = useState<Associado | null>(null);
  const navigate = useNavigate();
  const { user } = useAuth();

  const isAdmin = user?.cargo === "admin";

  const { data: associados = [], isLoading, error: queryError, refetch } = useQuery({
    queryKey: ["sindspag_associados", user?.id, isAdmin],
    queryFn: async () => {
      let query = supabase.from("sindspag_associados").select("*, sindspag_usuarios!sindspag_associados_criado_por_fkey(nome)").order("nome");
      if (!isAdmin && user?.id) {
        query = query.eq("criado_por", user.id);
      }
      const { data, error } = await query;
      if (error) throw error;
      return ((data ?? []) as any[]).map((a) => ({
        ...a,
        criado_por_nome: a.sindspag_usuarios?.nome || null,
      })) as Associado[];
    },
  });

  const safeAssociados = Array.isArray(associados) ? associados : [];

  const handleDelete = async (id: string) => {
    if (!confirm("Deseja realmente excluir?")) return;
    const { error } = await supabase.from("sindspag_associados").delete().eq("id", id);
    if (error) toast.error("Erro ao excluir");
    else { toast.success("Excluído com sucesso"); refetch(); }
  };

  const filtered = useMemo(() => {
    return safeAssociados.filter((a) => {
      const s = search.toLowerCase();
      const matchSearch = !search || a.nome?.toLowerCase().includes(s) || a.telefone?.toLowerCase().includes(s) || a.cpf?.toLowerCase().includes(s) || a.email?.toLowerCase().includes(s) || a.municipio?.toLowerCase().includes(s);
      const matchStatus = statusFilter === "todos" || a.status === statusFilter;
      const matchSocio = socioFilter === "todos" || (socioFilter === "sim" && a.eh_socio_atual) || (socioFilter === "nao" && !a.eh_socio_atual);
      const created = new Date(a.criado_em);
      const matchDateFrom = !dateFrom || created >= new Date(dateFrom);
      const matchDateTo = !dateTo || created <= new Date(dateTo + "T23:59:59");
      return matchSearch && matchStatus && matchSocio && matchDateFrom && matchDateTo;
    });
  }, [safeAssociados, search, statusFilter, socioFilter, dateFrom, dateTo]);

  const totalAssociados = safeAssociados.length;
  const totalSocios = safeAssociados.filter(a => a.eh_socio_atual).length;
  const totalNaoSocios = totalAssociados - totalSocios;

  const exportXLSX = () => {
    if (!filtered.length) return toast.error("Nenhum dado para exportar");

    const wb = XLSX.utils.book_new();

    // Summary sheet
    const summaryData = [
      ["RELATÓRIO DE ASSOCIADOS - SINDSPAG"],
      [],
      ["Gerado em", new Date().toLocaleString("pt-BR")],
      ["Total de Registros", filtered.length],
      ["Sócios Ativos", filtered.filter(a => a.eh_socio_atual).length],
      ["Não Sócios", filtered.filter(a => !a.eh_socio_atual).length],
      ["Ativos", filtered.filter(a => a.status === "Ativo").length],
      ["Inativos", filtered.filter(a => a.status === "Inativo").length],
      [],
      ["Filtros aplicados:"],
      ["Período", dateFrom ? `${formatDate(dateFrom)} até ${formatDate(dateTo || new Date().toISOString())}` : "Todos"],
      ["Status", statusFilter === "todos" ? "Todos" : statusFilter],
      ["Sócio", socioFilter === "todos" ? "Todos" : socioFilter === "sim" ? "Sim" : "Não"],
      ["Busca", search || "—"],
    ];
    const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
    wsSummary["!cols"] = [{ wch: 25 }, { wch: 40 }];
    XLSX.utils.book_append_sheet(wb, wsSummary, "Resumo");

    // Data sheet
    const headers = [
      "Nome", "CPF", "Telefone", "WhatsApp", "Email", "Instagram", "Facebook",
      "Título Eleitor", "Zona Eleitoral", "Seção Eleitoral", "Município", "UF",
      "Colégio Eleitoral", "Situação Título", "Ligação Política",
      "Sócio Atual", "Sócio Desde", "Já Foi Sócio", "Foi Sócio Quando",
      "Status", "Observações", "Cadastrado Em",
      ...(isAdmin ? ["Cadastrado Por"] : [])
    ];
    const rows = filtered.map(a => [
      a.nome, a.cpf || "", a.telefone || "", a.whatsapp || "", a.email || "",
      a.instagram || "", a.facebook || "", a.titulo_eleitor || "", a.zona_eleitoral || "",
      a.secao_eleitoral || "", a.municipio || "", a.uf || "", a.colegio_eleitoral || "",
      a.situacao_titulo || "", a.ligacao_politica || "",
      a.eh_socio_atual ? "Sim" : "Não", a.socio_desde || "",
      a.ja_foi_socio ? "Sim" : "Não", a.foi_socio_quando || "",
      a.status || "", a.observacoes || "", formatDate(a.criado_em),
      ...(isAdmin ? [a.criado_por_nome || ""] : [])
    ]);

    const wsData = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    wsData["!cols"] = headers.map((h) => ({ wch: Math.max(h.length + 2, 14) }));
    // Auto filter
    wsData["!autofilter"] = { ref: XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: rows.length, c: headers.length - 1 } }) };
    XLSX.utils.book_append_sheet(wb, wsData, "Associados");

    // By status breakdown
    const statusGroups: Record<string, number> = {};
    filtered.forEach(a => { const s = a.status || "Sem status"; statusGroups[s] = (statusGroups[s] || 0) + 1; });
    const statusRows = Object.entries(statusGroups).map(([k, v]) => [k, v]);
    const wsStatus = XLSX.utils.aoa_to_sheet([["Status", "Quantidade"], ...statusRows]);
    wsStatus["!cols"] = [{ wch: 20 }, { wch: 15 }];
    XLSX.utils.book_append_sheet(wb, wsStatus, "Por Status");

    // By municipality
    const munGroups: Record<string, number> = {};
    filtered.forEach(a => { const m = a.municipio || "Não informado"; munGroups[m] = (munGroups[m] || 0) + 1; });
    const munRows = Object.entries(munGroups).sort((a, b) => b[1] - a[1]).map(([k, v]) => [k, v]);
    const wsMun = XLSX.utils.aoa_to_sheet([["Município", "Quantidade"], ...munRows]);
    wsMun["!cols"] = [{ wch: 25 }, { wch: 15 }];
    XLSX.utils.book_append_sheet(wb, wsMun, "Por Município");

    const fileName = `SINDSPAG_Associados_${new Date().toISOString().slice(0, 10)}.xlsx`;
    XLSX.writeFile(wb, fileName);
    toast.success(`${filtered.length} registros exportados para Excel`);
  };

  const clearFilters = () => { setDateFrom(""); setDateTo(""); setStatusFilter("todos"); setSocioFilter("todos"); setSearch(""); };
  const hasActiveFilters = dateFrom || dateTo || statusFilter !== "todos" || socioFilter !== "todos";

  if (queryError) return (
    <div className="flex items-center justify-center py-16">
      <p className="text-sm text-destructive">Erro ao carregar dados. Tente novamente.</p>
    </div>
  );

  return (
    <div className="space-y-4 sm:space-y-6 w-full min-w-0">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-foreground">Associados</h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">{filtered.length} de {totalAssociados} registros</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportXLSX} className="rounded-xl h-10 sm:h-11 px-3 shadow-card border-0 bg-card font-bold text-xs sm:text-sm gap-1.5">
            <FileSpreadsheet className="h-4 w-4" />
            <span className="hidden sm:inline">Exportar Excel</span>
          </Button>
          <Button onClick={() => navigate("/cadastro")} className="rounded-xl h-10 sm:h-11 px-3 sm:px-5 gradient-primary border-0 shadow-elevated font-bold text-xs sm:text-sm gap-1.5">
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Novo</span>
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        <Card className="shadow-card border-0 bg-card">
          <CardContent className="p-3 sm:p-4 flex items-center gap-2 sm:gap-3">
            <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-xl gradient-primary flex items-center justify-center shrink-0">
              <Users className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
            </div>
            <div className="min-w-0">
              <p className="text-lg sm:text-2xl font-extrabold text-foreground leading-none">{totalAssociados}</p>
              <p className="text-[10px] sm:text-[11px] text-muted-foreground font-medium truncate">Total</p>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-card border-0 bg-card">
          <CardContent className="p-3 sm:p-4 flex items-center gap-2 sm:gap-3">
            <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0">
              <UserCheck className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-600" />
            </div>
            <div className="min-w-0">
              <p className="text-lg sm:text-2xl font-extrabold text-foreground leading-none">{totalSocios}</p>
              <p className="text-[10px] sm:text-[11px] text-muted-foreground font-medium truncate">Sócios</p>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-card border-0 bg-card">
          <CardContent className="p-3 sm:p-4 flex items-center gap-2 sm:gap-3">
            <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0">
              <UserX className="h-4 w-4 sm:h-5 sm:w-5 text-amber-600" />
            </div>
            <div className="min-w-0">
              <p className="text-lg sm:text-2xl font-extrabold text-foreground leading-none">{totalNaoSocios}</p>
              <p className="text-[10px] sm:text-[11px] text-muted-foreground font-medium truncate">Não sócios</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search + Filters */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar nome, telefone, CPF, email, município..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10 h-11 rounded-xl bg-card shadow-card border-0" />
        </div>
        <Button variant="outline" onClick={() => setShowFilters(!showFilters)} className={`rounded-xl h-11 px-3 shadow-card border-0 bg-card shrink-0 ${hasActiveFilters ? "text-primary" : ""}`}>
          <CalendarDays className="h-4 w-4" />
          {showFilters ? <ChevronUp className="h-3 w-3 ml-1" /> : <ChevronDown className="h-3 w-3 ml-1" />}
        </Button>
      </div>

      {showFilters && (
        <Card className="shadow-card border-0 animate-in slide-in-from-top-2 duration-200">
          <CardContent className="p-3 sm:p-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-foreground">Filtros</p>
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters} className="h-7 text-xs text-muted-foreground gap-1">
                  <X className="h-3 w-3" /> Limpar
                </Button>
              )}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div>
                <label className="text-[10px] font-medium text-muted-foreground mb-1 block">De</label>
                <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="h-9 rounded-lg text-xs bg-background" />
              </div>
              <div>
                <label className="text-[10px] font-medium text-muted-foreground mb-1 block">Até</label>
                <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="h-9 rounded-lg text-xs bg-background" />
              </div>
              <div>
                <label className="text-[10px] font-medium text-muted-foreground mb-1 block">Status</label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="h-9 rounded-lg text-xs bg-background"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    <SelectItem value="Ativo">Ativo</SelectItem>
                    <SelectItem value="Inativo">Inativo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-[10px] font-medium text-muted-foreground mb-1 block">Sócio</label>
                <Select value={socioFilter} onValueChange={setSocioFilter}>
                  <SelectTrigger className="h-9 rounded-lg text-xs bg-background"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    <SelectItem value="sim">Sim</SelectItem>
                    <SelectItem value="nao">Não</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <span className="h-6 w-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {/* Mobile */}
          <div className="block sm:hidden space-y-2">
            {filtered.map((a) => (
              <Card key={a.id} className="shadow-card border-0 active:scale-[0.98] transition-transform" onClick={() => setViewItem(a)} role="button">
                <CardContent className="p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-sm text-foreground truncate">{a.nome}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{a.telefone || "Sem telefone"}</p>
                      {a.municipio && <p className="text-[10px] text-muted-foreground">{a.municipio}/{a.uf}</p>}
                      <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                        <Badge variant={a.status === "Ativo" ? "success" : a.status === "Inativo" ? "danger" : "default"}>{a.status || "—"}</Badge>
                        <Badge variant={a.eh_socio_atual ? "primary" : "default"}>{a.eh_socio_atual ? "Sócio" : "Não sócio"}</Badge>
                        {a.ligacao_politica && <Badge>{a.ligacao_politica}</Badge>}
                      </div>
                      {isAdmin && a.criado_por_nome && (
                        <p className="text-[10px] text-muted-foreground mt-1">Por: {a.criado_por_nome}</p>
                      )}
                    </div>
                    <div className="flex gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="icon" onClick={() => navigate(`/associado/${a.id}`)} className="rounded-xl hover:bg-primary/10 hover:text-primary h-8 w-8">
                        <Edit className="h-3.5 w-3.5" />
                      </Button>
                        {isAdmin && (
                         <Button variant="ghost" size="icon" onClick={() => handleDelete(a.id)} className="rounded-xl hover:bg-destructive/10 hover:text-destructive h-8 w-8">
                           <Trash2 className="h-3.5 w-3.5" />
                         </Button>
                       )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {filtered.length === 0 && (
              <div className="text-center text-muted-foreground py-12">
                <Users className="h-8 w-8 mx-auto mb-2 opacity-30" />
                Nenhum associado encontrado
              </div>
            )}
          </div>

          {/* Desktop */}
          <Card className="hidden sm:block shadow-card border-0 overflow-hidden">
            <div className="overflow-x-auto -mx-0">
              <Table className="min-w-[700px]">
                <TableHeader>
                 <TableRow className="bg-muted/50 hover:bg-muted/50">
                     <TableHead className="font-bold text-foreground">Nome</TableHead>
                     <TableHead className="font-bold text-foreground">Telefone</TableHead>
                     <TableHead className="font-bold text-foreground">Município</TableHead>
                     <TableHead className="font-bold text-foreground">Status</TableHead>
                     <TableHead className="font-bold text-foreground">Sócio</TableHead>
                     <TableHead className="font-bold text-foreground">Ligação Política</TableHead>
                     {isAdmin && <TableHead className="font-bold text-foreground">Cadastrado por</TableHead>}
                     <TableHead className="font-bold text-foreground">Cadastro</TableHead>
                     <TableHead className="w-28 font-bold text-foreground">Ações</TableHead>
                   </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((a) => (
                    <TableRow key={a.id} className="hover:bg-muted/30 transition-colors cursor-pointer" onClick={() => setViewItem(a)}>
                      <TableCell className="font-semibold">{a.nome}</TableCell>
                      <TableCell className="text-muted-foreground">{a.telefone || "—"}</TableCell>
                      <TableCell className="text-muted-foreground">{a.municipio ? `${a.municipio}/${a.uf}` : "—"}</TableCell>
                      <TableCell>
                        <Badge variant={a.status === "Ativo" ? "success" : a.status === "Inativo" ? "danger" : "default"}>{a.status || "—"}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={a.eh_socio_atual ? "primary" : "default"}>{a.eh_socio_atual ? "Sim" : "Não"}</Badge>
                      </TableCell>
                     <TableCell className="text-muted-foreground text-xs">{a.ligacao_politica || "—"}</TableCell>
                      {isAdmin && <TableCell className="text-muted-foreground text-xs">{a.criado_por_nome || "—"}</TableCell>}
                      <TableCell className="text-muted-foreground text-xs">{formatDate(a.criado_em)}</TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" onClick={() => navigate(`/associado/${a.id}`)} className="rounded-xl hover:bg-primary/10 hover:text-primary">
                            <Edit className="h-4 w-4" />
                          </Button>
                          {isAdmin && (
                             <Button variant="ghost" size="icon" onClick={() => handleDelete(a.id)} className="rounded-xl hover:bg-destructive/10 hover:text-destructive">
                               <Trash2 className="h-4 w-4" />
                             </Button>
                           )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filtered.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={isAdmin ? 9 : 8} className="text-center text-muted-foreground py-12">
                        <Users className="h-8 w-8 mx-auto mb-2 opacity-30" />
                        Nenhum associado encontrado
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </Card>
        </>
      )}

      {/* Detail Sheet (slides from right) */}
      <Sheet open={!!viewItem} onOpenChange={(open) => !open && setViewItem(null)}>
        <SheetContent className="w-[100vw] sm:w-full sm:max-w-md overflow-y-auto p-0">
          {viewItem && (
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="gradient-primary p-5 pb-6">
                <SheetHeader>
                  <SheetTitle className="text-white text-xl font-extrabold text-left">{viewItem.nome}</SheetTitle>
                </SheetHeader>
                <div className="flex gap-2 mt-3">
                  <Badge variant={viewItem.status === "Ativo" ? "success" : viewItem.status === "Inativo" ? "danger" : "default"}>{viewItem.status || "—"}</Badge>
                  <Badge variant={viewItem.eh_socio_atual ? "primary" : "default"}>{viewItem.eh_socio_atual ? "Sócio Ativo" : "Não Sócio"}</Badge>
                  {viewItem.ligacao_politica && <Badge>{viewItem.ligacao_politica}</Badge>}
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 p-4 space-y-1">
                <SectionTitle icon={Users}>Dados Pessoais</SectionTitle>
                <div className="grid grid-cols-2 gap-x-4">
                  <InfoItem label="CPF" value={viewItem.cpf} />
                  <InfoItem label="Telefone" value={viewItem.telefone} />
                  <InfoItem label="WhatsApp" value={viewItem.whatsapp} />
                  <InfoItem label="Email" value={viewItem.email} />
                  <InfoItem label="Instagram" value={viewItem.instagram} />
                  <InfoItem label="Facebook" value={viewItem.facebook} />
                </div>

                <Separator className="my-2" />

                <SectionTitle icon={MapPin}>Dados Eleitorais</SectionTitle>
                <div className="grid grid-cols-2 gap-x-4">
                  <InfoItem label="Título Eleitor" value={viewItem.titulo_eleitor} />
                  <InfoItem label="Zona Eleitoral" value={viewItem.zona_eleitoral} />
                  <InfoItem label="Seção Eleitoral" value={viewItem.secao_eleitoral} />
                  <InfoItem label="Município" value={viewItem.municipio} />
                  <InfoItem label="UF" value={viewItem.uf} />
                  <InfoItem label="Colégio Eleitoral" value={viewItem.colegio_eleitoral} />
                  <InfoItem label="Situação Título" value={viewItem.situacao_titulo} />
                </div>

                <Separator className="my-2" />

                <SectionTitle icon={UserCheck}>Vínculo Sindical</SectionTitle>
                <div className="grid grid-cols-2 gap-x-4">
                  <InfoItem label="Sócio Atual" value={viewItem.eh_socio_atual ? "Sim" : "Não"} />
                  <InfoItem label="Sócio Desde" value={formatDate(viewItem.socio_desde)} />
                  <InfoItem label="Já Foi Sócio" value={viewItem.ja_foi_socio ? "Sim" : "Não"} />
                  <InfoItem label="Período Anterior" value={viewItem.foi_socio_quando} />
                </div>

                <Separator className="my-2" />

                <SectionTitle icon={MapPin}>Informações Adicionais</SectionTitle>
                <div className="grid grid-cols-2 gap-x-4">
                  <InfoItem label="Ligação Política" value={viewItem.ligacao_politica} />
                  <InfoItem label="Status" value={viewItem.status} />
                </div>

                {viewItem.observacoes && (
                  <>
                    <Separator className="my-2" />
                    <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider pt-2">Observações</p>
                    <p className="text-sm text-foreground bg-muted/50 rounded-lg p-3 mt-1">{viewItem.observacoes}</p>
                  </>
                )}

                <p className="text-[10px] text-muted-foreground pt-3">
                  Cadastrado em {formatDate(viewItem.criado_em)} · Atualizado em {formatDate(viewItem.atualizado_em)}
                  {isAdmin && viewItem.criado_por_nome && ` · Por: ${viewItem.criado_por_nome}`}
                </p>
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-border bg-card">
                <Button onClick={() => { setViewItem(null); navigate(`/associado/${viewItem.id}`); }} className="w-full rounded-xl gradient-primary border-0 font-bold gap-2 h-11">
                  <Edit className="h-4 w-4" /> Editar Associado
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default Dashboard;
