import { Navigate, useSearchParams } from "react-router-dom";
import { getSafeRedirectPath } from "utils/navigation";

export default function AuthRedirect() {
  const [searchParams] = useSearchParams();
  const redirect = getSafeRedirectPath(searchParams.get("redirect"));
  return <Navigate to={redirect ?? "/accent-sidebar"} replace />;
}
