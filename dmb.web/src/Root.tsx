import { useState } from "react";
import App from "./App";
import Login from "./login";

export default function Root() {
  const [token, setToken] = useState<string | null>(() =>
    localStorage.getItem("token")
  );

  const handleLoginSuccess = (newToken: string) => {
    localStorage.setItem("token", newToken);
    setToken(newToken);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    setToken(null);
  };

  if (!token) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  return <App onLogout={handleLogout} />;
}
