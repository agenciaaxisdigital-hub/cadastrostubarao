import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { toast } from "sonner";
import { UserPlus, Shield, Trash2, KeyRound, Edit, Eye, Users } from "lucide-react";

const CARGO_OPTIONS = ["admin", "usuario"];

const formatDate = (d: string | null) => {
  if (!d) return "—";
  try { return new Date(d).toLocaleDateString("pt-BR"); } catch { return d || "—"; }
};

const Usuarios = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [nome, setNome] = useState("");
  const [senha, setSenha] = useState("");
  const [cargo, setCargo] = useState("usuario");
  const [loading, setLoading] = useState(false);

  const [editUser, setEditUser] = useState<{ id: string; nome: string; cargo: string } | null>(null);
  const [editCargo, setEditCargo] = useState("");

  const [resetUser, setResetUser] = useState<{ id: string; nome: string } | null>(null);
  const [novaSenha, setNovaSenha] = useState("");

  const [viewUser, setViewUser] = useState<{ id: string; nome: string } | null>(null);

  const { data: usuarios, refetch } = useQuery({
    queryKey: ["sindspag_usuarios"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sindspag_usuarios")
        .select("id, nome, cargo, criado_em")
        .order("criado_em");
      if (error) throw error;
      return data;
    },
  });

  const { data: userAssociados } = useQuery({
    queryKey: ["user_associados", viewUser?.id],
    queryFn: async () => {
      if (!viewUser) return [];
      const { data, error } = await supabase
        .from("sindspag_associados")
        .select("id, nome, telefone, municipio, uf, status, eh_socio_atual, criado_em")
        .eq("criado_por", viewUser.id)
        .order("nome");
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!viewUser,
  });

  if (user?.cargo !== "admin") return <Navigate to="/associados" replace />;

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedNome = nome.trim();
    const trimmedSenha = senha.trim();
    if (!trimmedNome || !trimmedSenha) {
      toast.error("Preencha nome e senha");
      return;
    }
    if (trimmedNome.length < 3) {
      toast.error("Nome deve ter pelo menos 3 caracteres");
      return;
    }
    if (trimmedSenha.length < 4) {
      toast.error("Senha deve ter pelo menos 4 caracteres");
      return;
    }
    setLoading(true);
    const { data, error } = await supabase.rpc("sindspag_criar_usuario", {
      p_nome: trimmedNome,
      p_senha: trimmedSenha,
      p_cargo: cargo,
    });
    setLoading(false);
    const result = data as any;
    if (error || !result?.success) {
      toast.error(result?.message || "Erro ao criar usuário");
    } else {
      toast.success("Usuário criado!");
      setNome("");
      setSenha("");
      setCargo("usuario");
      refetch();
    }
  };

  const handleDelete = async (id: string, nomeUsuario: string) => {
    if (id === user?.id) {
      toast.error("Você não pode excluir seu próprio usuário");
      return;
    }
    if (!confirm(`Deseja realmente excluir o usuário "${nomeUsuario}"?`)) return;
    const { data, error } = await (supabase.rpc as any)("sindspag_deletar_usuario", { p_user_id: id });
    const result = data as any;
    if (error || !result?.success) {
      toast.error("Erro ao excluir usuário");
    } else {
      toast.success("Usuário excluído!");
      refetch();
    }
  };

  const handleEditCargo = async () => {
    if (!editUser) return;
    const { data, error } = await (supabase.rpc as any)("sindspag_atualizar_cargo", {
      p_user_id: editUser.id,
      p_cargo: editCargo,
    });
    const result = data as any;
    if (error || !result?.success) {
      toast.error("Erro ao atualizar cargo");
    } else {
      toast.success("Cargo atualizado!");
      setEditUser(null);
      refetch();
    }
  };

  const handleResetSenha = async () => {
    if (!resetUser) return;
    const trimmed = novaSenha.trim();
    if (!trimmed) {
      toast.error("Digite a nova senha");
      return;
    }
    if (trimmed.length < 4) {
      toast.error("Senha deve ter pelo menos 4 caracteres");
      return;
    }
    const { data, error } = await (supabase.rpc as any)("sindspag_resetar_senha", {
      p_user_id: resetUser.id,
      p_nova_senha: trimmed,
    });
    const result = data as any;
    if (error || !result?.success) {
      toast.error("Erro ao resetar senha");
    } else {
      toast.success("Senha resetada!");
      setResetUser(null);
      setNovaSenha("");
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto space-y-4 sm:space-y-6 min-w-0">
      <div>
        <h1 className="text-xl sm:text-2xl font-extrabold text-foreground">Usuários</h1>
        <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">Gerencie os usuários do sistema</p>
      </div>

      {/* Create user */}
      <Card className="shadow-card border-0 overflow-hidden">
        <CardHeader className="pb-3 sm:pb-4">
          <CardTitle className="flex items-center gap-2.5 text-sm sm:text-base">
            <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg gradient-primary flex items-center justify-center">
              <UserPlus className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-white" />
            </div>
            <span className="font-bold">Criar Novo Usuário</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Nome</Label>
                <Input
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Nome do usuário"
                  required
                  className="h-10 sm:h-11 rounded-xl border-0 bg-muted/50 focus:bg-background"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Senha</Label>
                <Input
                  type="password"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  placeholder="Senha (mín. 4 chars)"
                  required
                  className="h-10 sm:h-11 rounded-xl border-0 bg-muted/50 focus:bg-background"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Cargo</Label>
                <Select value={cargo} onValueChange={setCargo}>
                  <SelectTrigger className="h-10 sm:h-11 rounded-xl border-0 bg-muted/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CARGO_OPTIONS.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end">
              <Button type="submit" disabled={loading} className="rounded-xl h-10 sm:h-11 px-5 sm:px-6 gradient-primary border-0 shadow-elevated font-bold text-sm">
                {loading ? "Criando..." : "Criar Usuário"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* User list */}
      <Card className="shadow-card border-0 overflow-hidden">
        <CardHeader className="pb-3 sm:pb-4">
          <CardTitle className="flex items-center gap-2.5 text-sm sm:text-base">
            <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg bg-primary flex items-center justify-center">
              <Shield className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-white" />
            </div>
            <span className="font-bold">Usuários Cadastrados</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {/* Mobile cards */}
          <div className="block sm:hidden divide-y">
            {usuarios?.map((u) => (
              <div key={u.id} className="p-3 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-semibold text-sm text-foreground truncate">{u.nome}</p>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold mt-1 ${
                    u.cargo === "admin"
                      ? "bg-primary/10 text-primary"
                      : "bg-muted text-muted-foreground"
                  }`}>
                    {u.cargo}
                  </span>
                </div>
                <div className="flex gap-0.5 shrink-0">
                  <Button variant="ghost" size="icon" onClick={() => setViewUser({ id: u.id, nome: u.nome })} className="rounded-xl h-8 w-8 hover:bg-primary/10 hover:text-primary" title="Ver cadastros">
                    <Eye className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => { setEditUser(u); setEditCargo(u.cargo); }} className="rounded-xl h-8 w-8" title="Editar cargo">
                    <Edit className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => { setResetUser(u); setNovaSenha(""); }} className="rounded-xl h-8 w-8" title="Resetar senha">
                    <KeyRound className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(u.id, u.nome)} disabled={u.id === user?.id} className="rounded-xl h-8 w-8 hover:text-destructive" title="Excluir">
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
            {(!usuarios || usuarios.length === 0) && (
              <div className="text-center text-muted-foreground py-8 text-sm">
                Nenhum usuário cadastrado
              </div>
            )}
          </div>

          {/* Desktop table */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full min-w-[500px]">
              <thead>
                <tr className="bg-muted/50 border-b">
                  <th className="text-left font-bold text-foreground text-sm py-3 px-4">Nome</th>
                  <th className="text-left font-bold text-foreground text-sm py-3 px-4">Cargo</th>
                  <th className="text-left font-bold text-foreground text-sm py-3 px-4 w-44">Ações</th>
                </tr>
              </thead>
              <tbody>
                {usuarios?.map((u) => (
                  <tr key={u.id} className="border-b hover:bg-muted/30 transition-colors">
                    <td className="py-3 px-4 font-semibold text-sm">{u.nome}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        u.cargo === "admin" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                      }`}>
                        {u.cargo}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => setViewUser({ id: u.id, nome: u.nome })} className="rounded-xl hover:bg-primary/10 hover:text-primary h-8 w-8" title="Ver cadastros">
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => { setEditUser(u); setEditCargo(u.cargo); }} className="rounded-xl hover:bg-primary/10 hover:text-primary h-8 w-8" title="Editar cargo">
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => { setResetUser(u); setNovaSenha(""); }} className="rounded-xl h-8 w-8" title="Resetar senha">
                          <KeyRound className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(u.id, u.nome)} disabled={u.id === user?.id} className="rounded-xl hover:bg-destructive/10 hover:text-destructive h-8 w-8" title="Excluir">
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {(!usuarios || usuarios.length === 0) && (
                  <tr>
                    <td colSpan={3} className="text-center text-muted-foreground py-8">
                      Nenhum usuário cadastrado
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* View user associados sheet */}
      <Sheet open={!!viewUser} onOpenChange={(open) => !open && setViewUser(null)}>
        <SheetContent className="w-[100vw] sm:w-full sm:max-w-lg overflow-y-auto p-0">
          {viewUser && (
            <div className="flex flex-col h-full">
              <div className="gradient-primary p-5 pb-6">
                <SheetHeader>
                  <SheetTitle className="text-white text-xl font-extrabold text-left">
                    Cadastros de {viewUser.nome}
                  </SheetTitle>
                </SheetHeader>
                <p className="text-white/70 text-sm mt-1">
                  {userAssociados?.length ?? 0} associado(s) cadastrado(s)
                </p>
              </div>

              <div className="flex-1 p-4 space-y-2">
                {userAssociados && userAssociados.length > 0 ? (
                  userAssociados.map((a) => (
                    <Card key={a.id} className="shadow-card border-0">
                      <CardContent className="p-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <p className="font-bold text-sm text-foreground truncate">{a.nome}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">{a.telefone || "Sem telefone"}</p>
                            {a.municipio && <p className="text-[10px] text-muted-foreground">{a.municipio}/{a.uf}</p>}
                            <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                a.status === "Ativo" ? "bg-emerald-500/10 text-emerald-700" : "bg-red-500/10 text-red-700"
                              }`}>{a.status || "—"}</span>
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                a.eh_socio_atual ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                              }`}>{a.eh_socio_atual ? "Sócio" : "Não sócio"}</span>
                            </div>
                            <p className="text-[10px] text-muted-foreground mt-1">Cadastrado em {formatDate(a.criado_em)}</p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => { setViewUser(null); navigate(`/associado/${a.id}`); }}
                            className="rounded-xl hover:bg-primary/10 hover:text-primary h-8 w-8 shrink-0"
                            title="Editar"
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <div className="text-center text-muted-foreground py-12">
                    <Users className="h-8 w-8 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">Nenhum cadastro realizado</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Edit cargo dialog */}
      <Dialog open={!!editUser} onOpenChange={(open) => !open && setEditUser(null)}>
        <DialogContent className="rounded-2xl max-w-[90vw] sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg">Editar Cargo — {editUser?.nome}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Cargo</Label>
            <Select value={editCargo} onValueChange={setEditCargo}>
              <SelectTrigger className="h-11 rounded-xl border-0 bg-muted/50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CARGO_OPTIONS.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setEditUser(null)} className="rounded-xl">Cancelar</Button>
            <Button onClick={handleEditCargo} className="rounded-xl gradient-primary border-0 font-bold">Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset password dialog */}
      <Dialog open={!!resetUser} onOpenChange={(open) => !open && setResetUser(null)}>
        <DialogContent className="rounded-2xl max-w-[90vw] sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg">Resetar Senha — {resetUser?.nome}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Nova Senha</Label>
            <Input
              type="password"
              value={novaSenha}
              onChange={(e) => setNovaSenha(e.target.value)}
              placeholder="Mínimo 4 caracteres"
              className="h-11 rounded-xl border-0 bg-muted/50 focus:bg-background"
            />
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setResetUser(null)} className="rounded-xl">Cancelar</Button>
            <Button onClick={handleResetSenha} className="rounded-xl gradient-primary border-0 font-bold">Resetar Senha</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Usuarios;
