import { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface User {
  id: string;
  nome: string;
  cargo: string;
}

interface AuthContextType {
  user: User | null;
  login: (nome: string, senha: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
};

import { supabase } from "@/integrations/supabase/client";

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("sindspag_user");
    if (stored) setUser(JSON.parse(stored));
    setIsLoading(false);
  }, []);

  const login = async (nome: string, senha: string) => {
    const { data, error } = await supabase.rpc("sindspag_login", {
      p_nome: nome,
      p_senha: senha,
    });
    if (error) return { success: false, message: "Erro ao conectar" };
    const result = data as any;
    if (!result.success) return { success: false, message: result.message };
    const u: User = { id: result.user_id, nome: result.nome, cargo: result.cargo };
    setUser(u);
    localStorage.setItem("sindspag_user", JSON.stringify(u));
    return { success: true };
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("sindspag_user");
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};
