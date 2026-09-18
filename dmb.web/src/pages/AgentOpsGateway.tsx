import { useEffect } from "react";

/** Full navigation so Vercel can proxy /agent to the Agent ops app instead of the username route. */
export default function AgentOpsGateway() {
  useEffect(() => {
    window.location.replace("/agent/");
  }, []);
  return null;
}
