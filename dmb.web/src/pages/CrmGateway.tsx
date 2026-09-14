import { useEffect } from "react";

/** Full navigation so Vercel can proxy /crm to the CRM app instead of the username route. */
export default function CrmGateway() {
  useEffect(() => {
    window.location.replace("/crm/");
  }, []);
  return null;
}
