import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { api } from "../services/api";

type Oficina = {
  id: number;
  nome: string;
  responsavel: string;
};

type User = {
  id: number;
  nome: string;
  email: string;
  role: string;
  oficinaId: number;
};

type LoginResponse = {
  token: string;
  user: User;
  oficina?: {
    id: number;
    nome: string;
    responsavel: string;
  };
};

type AuthContextType = {
  token: string | null;
  user: User | null;
  oficina: Oficina | null;
  loading: boolean;
  login: (email: string, senha: string, oficinaId: number) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [oficina, setOficina] = useState<Oficina | null>(null);
  const [loading, setLoading] = useState(true);

  // Carrega sessão do localStorage ao iniciar
  useEffect(() => {
    const savedToken = localStorage.getItem("@carbuapp:token");
    const savedUser = localStorage.getItem("@carbuapp:user");
    const savedOficina = localStorage.getItem("@carbuapp:oficina");

    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
      if (savedOficina) setOficina(JSON.parse(savedOficina));
    }

    setLoading(false);
  }, []);

  async function login(email: string, senha: string, oficinaId: number) {
    const { data } = await api.post<LoginResponse>("/auth/login", {
      email,
      senha,
      oficinaId,
    });

    localStorage.setItem("@carbuapp:token", data.token);
    localStorage.setItem("@carbuapp:user", JSON.stringify(data.user));

    // oficina pode vir do backend (melhor). se não vier, a gente busca depois.
    if (data.oficina) {
      localStorage.setItem("@carbuapp:oficina", JSON.stringify(data.oficina));
      setOficina(data.oficina);
    } else {
      localStorage.removeItem("@carbuapp:oficina");
      setOficina(null);
    }

    setToken(data.token);
    setUser(data.user);
  }

  function logout() {
    localStorage.removeItem("@carbuapp:token");
    localStorage.removeItem("@carbuapp:user");
    localStorage.removeItem("@carbuapp:oficina");
    setToken(null);
    setUser(null);
    setOficina(null);
  }

  const value = useMemo(
    () => ({ token, user, oficina, loading, login, logout }),
    [token, user, oficina, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}