import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useLocation, useNavigate } from "react-router-dom";
import api from "../services/http.service";
import { clearAccountFirstName } from "../utils/accountGreeting";
import { isAppReservedPath } from "../utils/navigation";
import type { LoginRequest, LoginResponse } from "models";

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
  const navigate = useNavigate();
  const location = useLocation();

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

  useEffect(() => {
    const redirectToLogin = () => {
      onLogout();
      const current = `${location.pathname}${location.search}`;
      const shouldPreserve =
        isAppReservedPath(location.pathname) && !location.pathname.startsWith("/login");
      navigate(
        shouldPreserve
          ? `/login?redirect=${encodeURIComponent(current)}`
          : "/login",
        { replace: true }
      );
    };

    window.addEventListener("dmb:unauthorized", redirectToLogin);
    return () => window.removeEventListener("dmb:unauthorized", redirectToLogin);
  }, [location.pathname, location.search, navigate, onLogout]);

  useEffect(() => {
    if (!token) {
      return;
    }

    const IDLE_MS = 20 * 60 * 1000;
    let timer = 0;
    const resetIdleTimer = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        window.dispatchEvent(new Event("dmb:unauthorized"));
      }, IDLE_MS);
    };
    const events: Array<keyof WindowEventMap> = [
      "mousemove",
      "keydown",
      "click",
      "scroll",
      "touchstart",
    ];
    events.forEach((eventName) =>
      window.addEventListener(eventName, resetIdleTimer, { passive: true })
    );
    resetIdleTimer();
    return () => {
      window.clearTimeout(timer);
      events.forEach((eventName) => window.removeEventListener(eventName, resetIdleTimer));
    };
  }, [token]);

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
