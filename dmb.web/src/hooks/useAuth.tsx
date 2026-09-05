import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import api from "../services/http.service";
import type { LoginRequest, LoginResponse } from "models";
import { clearAccountFirstName } from "../utils/accountGreeting";

type UseAuthResult = {
  token: string | null;
  isAuthenticated: boolean;
  isInitialized: boolean;
  onLoginSuccess: (newToken: string) => void;
  onLogout: () => void;
  login: (username: string, password: string) => Promise<boolean>;
};

const AuthContext = createContext<UseAuthResult | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("token"));

  const onLoginSuccess = useCallback((newToken: string) => {
    localStorage.setItem("token", newToken);
    setToken(newToken);
  }, []);

  const login = useCallback(
    async (username: string, password: string) => {
      const payload: LoginRequest = { username, password };
      const res = await api.post<LoginResponse>("/auth/login", payload);
      onLoginSuccess(res.data.token);
      return true;
    },
    [onLoginSuccess]
  );

  const onLogout = useCallback(() => {
    localStorage.removeItem("token");
    clearAccountFirstName();
    setToken(null);
  }, []);

  const value = useMemo(
    () => ({
      token,
      isAuthenticated: Boolean(token),
      isInitialized: true,
      onLoginSuccess,
      onLogout,
      login,
    }),
    [token, onLoginSuccess, onLogout, login]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export default function useAuth(): UseAuthResult {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
