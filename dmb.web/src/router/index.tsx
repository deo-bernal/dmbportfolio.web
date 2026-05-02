import type { RouteObject } from "react-router";
import { Navigate } from "react-router-dom";
import Login from "../pages/Auth/Login";
import ForgotPassword from "../pages/Auth/ForgotPassword";
import ResetPassword from "../pages/Auth/ResetPassword";
import PortfolioPage from "../pages/PortfolioPage";
import ResumePage from "../pages/ResumePage";
import AccentSidebarLayout from "../layouts/AccentSidebarLayout";

type RouterConfig = {
  token: string | null;
  onLogout: () => void;
};

export default function createRouter({
  token,
  onLogout,
}: RouterConfig): RouteObject[] {
  return [
    {
      path: "/login",
      element: token ? <Navigate to="/" replace /> : <Login />,
    },
    {
      path: "/forgot-password",
      element: token ? <Navigate to="/" replace /> : <ForgotPassword />,
    },
    {
      path: "/reset-password",
      element: <ResetPassword />,
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
