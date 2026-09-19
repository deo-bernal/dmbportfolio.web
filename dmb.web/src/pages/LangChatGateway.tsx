import { useEffect } from "react";

/** Full navigation so Vercel can proxy /langchat to LangChat instead of the username route. */
export default function LangChatGateway() {
  useEffect(() => {
    window.location.replace("/langchat/");
  }, []);
  return null;
}
