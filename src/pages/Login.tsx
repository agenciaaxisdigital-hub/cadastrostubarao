import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Lock, User, MessageCircle } from "lucide-react";


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

  if (!isLoading && user) return <Navigate to="/associados" replace />;

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
        // Use both navigate and fallback to ensure redirect always works
        navigate("/associados", { replace: true });
        // Fallback: if navigate didn't trigger re-render, force it
        setTimeout(() => {
          if (window.location.pathname === "/") {
            window.location.href = "/associados";
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
    <div className="min-h-screen min-h-[100dvh] flex flex-col items-center justify-center bg-gradient-to-br from-[hsl(10,85%,48%)] via-[hsl(15,80%,42%)] to-[hsl(0,60%,30%)] p-4 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-48 sm:w-72 h-48 sm:h-72 bg-white/5 rounded-full -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-64 sm:w-96 h-64 sm:h-96 bg-white/5 rounded-full translate-x-1/3 translate-y-1/3" />

      <div className="w-full max-w-sm sm:max-w-md relative z-10">
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">SINDSPAG</h1>
          <p className="text-white/70 text-xs sm:text-sm mt-1.5">Sistema de Gestão de Associados</p>
        </div>

        <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl p-6 sm:p-8">
          <h2 className="text-lg sm:text-xl font-semibold text-foreground text-center mb-5 sm:mb-6">Acessar o sistema</h2>

          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="nome" className="text-sm font-medium text-foreground">Usuário</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="nome"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Nome de usuário"
                  autoComplete="username"
                  className="pl-10 h-11 sm:h-12 rounded-xl border-border/60 focus:border-primary focus:ring-primary/20"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="senha" className="text-sm font-medium text-foreground">Senha</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="senha"
                  type="password"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  placeholder="Sua senha"
                  autoComplete="current-password"
                  className="pl-10 h-11 sm:h-12 rounded-xl border-border/60 focus:border-primary focus:ring-primary/20"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                id="lembrar"
                checked={lembrar}
                onCheckedChange={(checked) => setLembrar(checked === true)}
              />
              <Label htmlFor="lembrar" className="text-xs sm:text-sm text-muted-foreground cursor-pointer select-none">
                Lembrar meu usuário
              </Label>
            </div>

            {error && (
              <div className="bg-destructive/10 text-destructive text-xs sm:text-sm px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl border border-destructive/20 text-center">
                {error}
              </div>
            )}

            <Button
              type="submit"
              className="w-full h-11 sm:h-12 rounded-xl text-sm sm:text-base font-semibold shadow-lg shadow-primary/30 hover:shadow-primary/40 transition-all duration-200"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Entrando...
                </span>
              ) : (
                "Entrar"
              )}
            </Button>
          </form>
        </div>

        <a
          href="https://wa.me/5562993885258?text=Oi%20Gustavo%2C%20estou%20precisando%20de%20suporte%20com%20o%20SINDSPAG"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 text-white/70 hover:text-white text-xs sm:text-sm mt-5 sm:mt-6 transition-colors"
        >
          <MessageCircle className="h-4 w-4" />
          Fale com o suporte
        </a>

        <p className="text-white/40 text-[10px] sm:text-xs text-center mt-3 px-4">
          Sindicato dos Servidores Públicos Municipais de Aparecida de Goiânia
        </p>
      </div>
    </div>
  );
};

export default Login;
