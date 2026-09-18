import { useEffect } from "react";

/** Full navigation so Vercel can proxy /commerce to the Commerce app instead of the username route. */
export default function CommerceGateway() {
  useEffect(() => {
    window.location.replace("/commerce/");
  }, []);
  return null;
}
