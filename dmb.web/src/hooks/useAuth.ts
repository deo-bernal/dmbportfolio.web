import { useCallback, useMemo, useState } from "react";

type UseAuthResult = {
  token: string | null;
  isAuthenticated: boolean;
  isInitialized: boolean;
  onLoginSuccess: (newToken: string) => void;
  onLogout: () => void;
};

export default function useAuth(): UseAuthResult {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("token"));

  const onLoginSuccess = useCallback((newToken: string) => {
    localStorage.setItem("token", newToken);
    setToken(newToken);
  }, []);

  const onLogout = useCallback(() => {
    localStorage.removeItem("token");
    setToken(null);
  }, []);

  return useMemo(
    () => ({
      token,
      isAuthenticated: Boolean(token),
      isInitialized: true,
      onLoginSuccess,
      onLogout,
    }),
    [token, onLoginSuccess, onLogout]
  );
}
