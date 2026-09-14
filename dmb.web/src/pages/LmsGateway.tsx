import { useEffect } from "react";

/** Full navigation so Vercel can proxy /lms to the LMS app instead of the username route. */
export default function LmsGateway() {
  useEffect(() => {
    window.location.replace("/lms/");
  }, []);
  return null;
}
