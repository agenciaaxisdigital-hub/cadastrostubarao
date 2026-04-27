import { useAuth } from "@/contexts/AuthContext";
import { Navigate, Outlet, Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Heart, Trophy, LogOut, Settings, Crown, MessageCircle, Users, LayoutDashboard, Waves, Share2 } from "lucide-react";
import { copyPublicLink } from "@/lib/shareLink";
import SplashScreen from "./SplashScreen";

const AppLayout = () => {
  const { user, logout, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) return <SplashScreen />;
  if (!user) return <Navigate to="/" replace />;

  const isAdmin = user.cargo === "diretor" || user.cargo === "admin";
  const navItems = [
    { to: "/social", label: "Social", icon: Heart, match: ["/social"] },
    { to: "/time", label: "Time", icon: Trophy, match: ["/time"] },
    ...(isAdmin
      ? [
          { to: "/liderancas", label: "Equipe", icon: Users, match: ["/liderancas"] },
          { to: "/usuarios", label: "Usuários", icon: Settings, match: ["/usuarios"] },
        ]
      : []),
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Premium Top Header */}
      <header className="bg-slate-900 sticky top-0 z-40 border-b border-white/5 shadow-lg">
        <div className="container mx-auto px-4 h-16 sm:h-20 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl gradient-primary flex items-center justify-center shadow-lg shadow-primary/20">
              <Trophy className="h-5 w-5 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="font-black text-white text-base sm:text-lg tracking-tighter leading-none uppercase">
                Tubarão <span className="text-primary-glow">Cadastros</span>
              </span>
              <span className="text-[10px] text-slate-400 font-bold tracking-widest uppercase mt-0.5">Intelligence Hub</span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <div className="hidden sm:flex flex-col items-end mr-2">
              <span className="text-sm font-bold text-white leading-none">{user.nome}</span>
              <span className="text-[10px] text-primary-glow font-black uppercase tracking-tighter mt-1">{user.cargo}</span>
            </div>
            
            <div className="flex items-center gap-1.5">
              <div className="hidden md:flex gap-1 mr-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyPublicLink("social", user.id, user.nome)}
                  className="rounded-xl h-9 text-[10px] font-black gap-1.5 bg-primary/20 text-white border border-primary/40 hover:bg-primary transition-all"
                >
                  <Share2 className="h-3.5 w-3.5" /> LINK SOCIAL
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyPublicLink("time", user.id, user.nome)}
                  className="rounded-xl h-9 text-[10px] font-black gap-1.5 bg-accent/20 text-white border border-accent/40 hover:bg-accent transition-all"
                >
                  <Share2 className="h-3.5 w-3.5" /> LINK TIME
                </Button>
              </div>

              <a
                href="https://wa.me/5562993885258?text=Oi%2C%20preciso%20de%20suporte%20no%20Tubar%C3%A3o%20Cadastros"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-slate-400 hover:text-white hover:bg-white/10 rounded-xl h-10 w-10 transition-all"
                >
                  <MessageCircle className="h-5 w-5" />
                </Button>
              </a>

              <Button
                variant="ghost"
                size="icon"
                onClick={logout}
                className="text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl h-10 w-10 transition-all"
              >
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 w-full max-w-5xl mx-auto px-4 py-6 sm:py-10 pb-32">
        <Outlet />
      </main>

      {/* Modern Bottom Navigation */}
      <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-md bg-slate-900/90 backdrop-blur-2xl border border-white/10 rounded-[2rem] shadow-2xl z-50 overflow-hidden px-2 py-2">
        <div className="flex items-center justify-between">
          {navItems.map((item) => {
            const isActive = item.match.some(
              (m) => location.pathname === m || location.pathname.startsWith(m + "/")
            );
            return (
              <Link key={item.to} to={item.to} className="flex-1">
                <div
                  className={`flex flex-col items-center gap-1 py-2 transition-all duration-300 relative ${
                    isActive ? "text-white" : "text-slate-500 hover:text-slate-300"
                  }`}
                >
                  {isActive && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="w-12 h-12 bg-primary/20 rounded-2xl blur-xl" />
                    </div>
                  )}
                  <item.icon className={`h-5 w-5 sm:h-6 sm:w-6 transition-all duration-300 ${isActive ? "scale-110" : ""}`} />
                  <span className={`text-[10px] font-black uppercase tracking-tighter ${isActive ? "opacity-100" : "opacity-60"}`}>
                    {item.label}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
};

export default AppLayout;
