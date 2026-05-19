import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { api } from "../services/api";

type Oficina = {
  id: number;
  nome: string;
  responsavel: string;
  logoUrl?: string | null;
};

type User = {
  id: number;
  nome: string;
  email: string;
  role: string;
  oficinaId: number | null;
};

type LoginResponse = {
  token: string;
  user: User;
  oficina?: Oficina | null;
};

type AuthContextType = {
  token: string | null;
  user: User | null;
  oficina: Oficina | null;
  // Oficina que o superadmin está acessando no momento
  selectedOficina: Oficina | null;
  loading: boolean;
  isSuperAdmin: boolean;
  isAdmin: boolean;
  // Oficina efetiva (selectedOficina quando superadmin, oficina quando admin/mecânico)
  oficinaAtiva: Oficina | null;
  login: (email: string, senha: string) => Promise<void>;
  logout: () => void;
  enterOficina: (oficina: Oficina) => void;
  exitOficina: () => void;
  refreshOficina: (novaOficina: Oficina) => void;
};

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [oficina, setOficina] = useState<Oficina | null>(null);
  const [selectedOficina, setSelectedOficina] = useState<Oficina | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedToken = localStorage.getItem("@carbuapp:token");
    const savedUser = localStorage.getItem("@carbuapp:user");
    const savedOficina = localStorage.getItem("@carbuapp:oficina");
    const savedSelected = localStorage.getItem("@carbuapp:selectedOficina");

    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
      if (savedOficina) setOficina(JSON.parse(savedOficina));
      if (savedSelected) setSelectedOficina(JSON.parse(savedSelected));
    }
    setLoading(false);
  }, []);

  async function login(email: string, senha: string) {
    const { data } = await api.post<LoginResponse>("/auth/login", { email, senha });

    localStorage.setItem("@carbuapp:token", data.token);
    localStorage.setItem("@carbuapp:user", JSON.stringify(data.user));

    if (data.oficina) {
      localStorage.setItem("@carbuapp:oficina", JSON.stringify(data.oficina));
      setOficina(data.oficina);
    } else {
      localStorage.removeItem("@carbuapp:oficina");
      setOficina(null);
    }

    setToken(data.token);
    setUser(data.user);
    setSelectedOficina(null);
    localStorage.removeItem("@carbuapp:selectedOficina");
  }

  function logout() {
    localStorage.removeItem("@carbuapp:token");
    localStorage.removeItem("@carbuapp:user");
    localStorage.removeItem("@carbuapp:oficina");
    localStorage.removeItem("@carbuapp:selectedOficina");
    setToken(null);
    setUser(null);
    setOficina(null);
    setSelectedOficina(null);
  }

  // Superadmin entra em uma oficina para operar como admin dela
  function enterOficina(o: Oficina) {
    setSelectedOficina(o);
    localStorage.setItem("@carbuapp:selectedOficina", JSON.stringify(o));
  }

  // Superadmin sai da oficina e volta para o painel global
  function exitOficina() {
    setSelectedOficina(null);
    localStorage.removeItem("@carbuapp:selectedOficina");
  }

  // Atualiza dados da oficina após upload de logo, por exemplo
  function refreshOficina(novaOficina: Oficina) {
    if (user?.role === "SUPERADMIN" && selectedOficina?.id === novaOficina.id) {
      setSelectedOficina(novaOficina);
      localStorage.setItem("@carbuapp:selectedOficina", JSON.stringify(novaOficina));
    } else {
      setOficina(novaOficina);
      localStorage.setItem("@carbuapp:oficina", JSON.stringify(novaOficina));
    }
  }

  const isSuperAdmin = user?.role === "SUPERADMIN";
  const isAdmin = user?.role === "ADMIN" || user?.role === "SUPERADMIN";
  const oficinaAtiva = isSuperAdmin ? selectedOficina : oficina;

  const value = useMemo(
    () => ({
      token, user, oficina, selectedOficina, loading,
      isSuperAdmin, isAdmin, oficinaAtiva,
      login, logout, enterOficina, exitOficina, refreshOficina,
    }),
    [token, user, oficina, selectedOficina, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
