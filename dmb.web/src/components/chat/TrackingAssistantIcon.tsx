import { useEffect, useRef, useState } from "react";
import Box from "@mui/material/Box";

type LookDir = "center" | "left" | "right" | "up" | "down";

type AnimatedAssistantIconProps = {
  src: string;
  alt: string;
  size: { xs: number; sm: number } | number;
  outline?: string;
};

const LOOK_FRAMES: Record<Exclude<LookDir, "center">, string> = {
  left: "/images/icons/dmb-assistant-left.jpg?v=look",
  right: "/images/icons/dmb-assistant-right.jpg?v=look",
  up: "/images/icons/dmb-assistant-up.jpg?v=look",
  down: "/images/icons/dmb-assistant-down.jpg?v=look",
};

function pickLook(dx: number, dy: number): LookDir {
  const dead = 36;
  if (Math.hypot(dx, dy) < dead) return "center";
  if (Math.abs(dx) >= Math.abs(dy)) return dx < 0 ? "left" : "right";
  return dy < 0 ? "up" : "down";
}

export default function TrackingAssistantIcon({
  src,
  alt,
  size,
  outline = "2px solid rgba(185,28,28,0.7)",
}: AnimatedAssistantIconProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [look, setLook] = useState<LookDir>("center");

  useEffect(() => {
    Object.values(LOOK_FRAMES).forEach((href) => {
      const img = new Image();
      img.src = href;
    });

    const onPointer = (event: PointerEvent) => {
      const el = wrapRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const dx = event.clientX - (rect.left + rect.width / 2);
      const dy = event.clientY - (rect.top + rect.height / 2);
      const next = pickLook(dx, dy);
      setLook((prev) => (prev === next ? prev : next));
    };

    const onLeave = () => setLook("center");

    window.addEventListener("pointermove", onPointer);
    window.addEventListener("blur", onLeave);
    document.addEventListener("mouseleave", onLeave);
    return () => {
      window.removeEventListener("pointermove", onPointer);
      window.removeEventListener("blur", onLeave);
      document.removeEventListener("mouseleave", onLeave);
    };
  }, []);

  const frameSrc = look === "center" ? src : LOOK_FRAMES[look];

  return (
    <Box
      ref={wrapRef}
      sx={{
        width: size,
        height: size,
        position: "relative",
        borderRadius: "50%",
        flexShrink: 0,
      }}
    >
      <Box
        className="dmb-robo-ring"
        sx={{
          position: "absolute",
          inset: -4,
          borderRadius: "50%",
          pointerEvents: "none",
        }}
      />
      <Box
        sx={{
          position: "relative",
          width: "100%",
          height: "100%",
          borderRadius: "50%",
          overflow: "hidden",
          outline,
          bgcolor: "#fff",
          boxShadow: "0 8px 24px rgba(15,23,42,0.45)",
        }}
      >
        <Box
          component="img"
          src={frameSrc}
          alt={alt}
          draggable={false}
          sx={{
            display: "block",
            width: "100%",
            height: "100%",
            objectFit: "cover",
            objectPosition: "50% 18%",
            userSelect: "none",
            pointerEvents: "none",
            transition: "opacity 0.12s ease",
          }}
        />
        <Box className="dmb-robo-shine" />
        <Box className="dmb-robo-scan" />
      </Box>
    </Box>
  );
}
