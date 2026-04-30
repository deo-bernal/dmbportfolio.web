import type { RouteObject } from "react-router";
import { Navigate } from "react-router-dom";
import Login from "../login";
import PortfolioPage from "../pages/PortfolioPage";
import ResumePage from "../pages/ResumePage";
import AccentSidebarLayout from "../layouts/AccentSidebarLayout";

type RouterConfig = {
  token: string | null;
  onLoginSuccess: (token: string) => void;
  onLogout: () => void;
};

export default function createRouter({
  token,
  onLoginSuccess,
  onLogout,
}: RouterConfig): RouteObject[] {
  return [
    {
      path: "/login",
      element: token ? <Navigate to="/" replace /> : <Login onLoginSuccess={onLoginSuccess} />,
    },
    {
      path: "/",
      element: token ? <Navigate to="/accent-sidebar" replace /> : <Navigate to="/login" replace />,
    },
    {
      path: "/accent-sidebar",
      element: token ? <AccentSidebarLayout /> : <Navigate to="/login" replace />,
      children: [
        {
          path: "",
          element: <Navigate to="portfolio" replace />,
        },
        {
          path: "portfolio",
          element: <PortfolioPage onLogout={onLogout} />,
        },
        {
          path: "resume",
          element: <ResumePage />,
        },
      ],
    },
    {
      path: "*",
      element: <Navigate to={token ? "/accent-sidebar" : "/login"} replace />,
    },
  ];
}
