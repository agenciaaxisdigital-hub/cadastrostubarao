import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Lock, User, MessageCircle, Waves } from "lucide-react";

const STORAGE_KEY = "sindspag_remember";

const Login = () => {
  const { login, user, isLoading } = useAuth();
  const navigate = useNavigate();
  const [nome, setNome] = useState("");
  const [senha, setSenha] = useState("");
  const [lembrar, setLembrar] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.nome) setNome(parsed.nome);
        setLembrar(true);
      } catch {}
    }
  }, []);

  if (!isLoading && user) return <Navigate to="/social" replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const trimmedNome = nome.trim();
    const trimmedSenha = senha.trim();
    if (!trimmedNome || !trimmedSenha) {
      setError("Preencha usuário e senha");
      return;
    }
    if (trimmedSenha.length < 4) {
      setError("Senha deve ter pelo menos 4 caracteres");
      return;
    }
    if (lembrar) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ nome: trimmedNome }));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
    setLoading(true);
    try {
      const result = await login(trimmedNome, trimmedSenha);
      if (result.success) {
        navigate("/social", { replace: true });
        setTimeout(() => {
          if (window.location.pathname === "/") {
            window.location.href = "/social";
          }
        }, 300);
      } else {
        setError(result.message || "Erro ao fazer login");
      }
    } catch {
      setError("Erro de conexão. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen min-h-[100dvh] flex flex-col items-center justify-center relative overflow-hidden bg-[#020617]">
      <div className="w-full max-w-md px-6 relative z-10 animate-in fade-in zoom-in duration-700">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-black text-white tracking-tighter uppercase sm:text-5xl">
            Tubarão <span className="text-primary">Cadastros</span>
          </h1>
          <p className="text-slate-500 text-[10px] font-black mt-3 tracking-[0.4em] uppercase">
            Inteligência em Gestão de Dados
          </p>
        </div>

        <div className="bg-slate-900/40 backdrop-blur-3xl rounded-[2.5rem] border border-white/5 shadow-2xl p-10">
          <div className="mb-10 text-center">
            <h2 className="text-xl font-bold text-white tracking-tight">Bem-vindo</h2>
            <p className="text-slate-400 text-sm mt-1">Acesse sua conta para continuar</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="nome" className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Usuário</Label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500">
                  <User className="h-5 w-5" />
                </div>
                <Input
                  id="nome"
                  type="text"
                  autoComplete="off"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Seu nome de usuário"
                  className="h-14 pl-12 rounded-2xl border-0 bg-slate-800/50 text-white placeholder:text-slate-600 focus:bg-slate-800 focus:ring-2 focus:ring-primary/20 transition-all"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="senha" className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Senha</Label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500">
                  <Lock className="h-5 w-5" />
                </div>
                <Input
                  id="senha"
                  type="password"
                  autoComplete="new-password"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  placeholder="••••••••"
                  className="h-14 pl-12 rounded-2xl border-0 bg-slate-800/50 text-white placeholder:text-slate-600 focus:bg-slate-800 focus:ring-2 focus:ring-primary/20 transition-all"
                  required
                />
              </div>
            </div>

            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-3">
                <Checkbox
                  id="lembrar"
                  checked={lembrar}
                  onCheckedChange={(checked) => setLembrar(checked === true)}
                  className="border-slate-700 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                />
                <Label htmlFor="lembrar" className="text-sm text-slate-400 cursor-pointer select-none font-medium">
                  Manter conectado
                </Label>
              </div>
            </div>

            {error && (
              <div className="bg-rose-500/10 text-rose-400 text-xs font-bold px-4 py-3 rounded-2xl border border-rose-500/20 text-center animate-shake">
                {error}
              </div>
            )}

            <Button
              type="submit"
              className="w-full h-14 rounded-2xl text-base font-black uppercase tracking-widest gradient-primary shadow-xl shadow-primary/20 hover:shadow-primary/40 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center gap-3">
                  <span className="h-5 w-5 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                  Autenticando...
                </span>
              ) : (
                "Entrar no Sistema"
              )}
            </Button>
          </form>
        </div>

        <div className="mt-10 flex flex-col items-center gap-6">
          <a
            href="https://wa.me/5562993885258?text=Oi%2C%20preciso%20de%20suporte%20no%20Tubar%C3%A3o%20Cadastros"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 px-6 py-3 rounded-full bg-white/5 border border-white/10 text-white/70 hover:text-white hover:bg-white/10 text-xs sm:text-sm font-bold transition-all"
          >
            <MessageCircle className="h-4 w-4" />
            Central de Suporte
          </a>

          <p className="text-slate-600 text-[10px] font-black uppercase tracking-[0.3em] text-center">
            Tubarão Cadastros · Intelligence Hub
          </p>
        </div>
      </div>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-4px); }
          75% { transform: translateX(4px); }
        }
        .animate-shake {
          animation: shake 0.2s ease-in-out 0s 2;
        }
      `}</style>
    </div>
  );
};

export default Login;
