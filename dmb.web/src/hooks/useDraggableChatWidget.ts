import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";

const STORAGE_KEY = "dmb:chat-widget-pos";
const DRAGGED_KEY = "dmb:chat-widget-dragged";
const MARGIN = 8;
const DRAG_THRESHOLD = 10;

export type WidgetPos = { left: number; top: number };

function launcherSize(): number {
  return window.innerWidth < 600 ? 72 : 88;
}

function panelSize(): { width: number; height: number } {
  return {
    width: window.innerWidth < 600 ? Math.max(MARGIN * 2, window.innerWidth - 32) : 380,
    height: window.innerWidth < 600 ? 500 : 550,
  };
}

function viewportSize(): { width: number; height: number } {
  return {
    width: window.visualViewport?.width ?? window.innerWidth,
    height: window.visualViewport?.height ?? window.innerHeight,
  };
}

function clamp(left: number, top: number, width: number, height: number): WidgetPos {
  const view = viewportSize();
  const maxLeft = Math.max(MARGIN, view.width - width - MARGIN);
  const maxTop = Math.max(MARGIN, view.height - height - MARGIN);
  return {
    left: Math.min(Math.max(MARGIN, left), maxLeft),
    top: Math.min(Math.max(MARGIN, top), maxTop),
  };
}

function defaultLauncherPos(): WidgetPos {
  const size = launcherSize();
  const view = viewportSize();
  const margin = view.width < 600 ? 16 : 24;
  return clamp(view.width - margin - size, view.height - margin - size, size, size);
}

function hasUserDragged(): boolean {
  try {
    return localStorage.getItem(DRAGGED_KEY) === "1";
  } catch {
    return false;
  }
}

function markUserDragged(): void {
  try {
    localStorage.setItem(DRAGGED_KEY, "1");
  } catch {
    // Ignore quota errors.
  }
}

function readStoredLauncherPos(): WidgetPos | null {
  if (!hasUserDragged()) return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as WidgetPos;
    if (typeof parsed?.left !== "number" || typeof parsed?.top !== "number") return null;
    const size = launcherSize();
    return clamp(parsed.left, parsed.top, size, size);
  } catch {
    return null;
  }
}

function writeStoredLauncherPos(pos: WidgetPos): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(pos));
  } catch {
    // Ignore quota errors.
  }
}

function toLauncherPos(pos: WidgetPos, isOpen: boolean): WidgetPos {
  const size = launcherSize();
  if (!isOpen) return clamp(pos.left, pos.top, size, size);
  const panel = panelSize();
  return clamp(pos.left + panel.width - size, pos.top + panel.height - size, size, size);
}

function toPanelPos(launcher: WidgetPos): WidgetPos {
  const size = launcherSize();
  const panel = panelSize();
  return clamp(launcher.left + size - panel.width, launcher.top + size - panel.height, panel.width, panel.height);
}

export function useDraggableChatWidget(isOpen: boolean) {
  const [pos, setPos] = useState<WidgetPos>(() =>
    typeof window === "undefined" ? { left: 24, top: 24 } : readStoredLauncherPos() ?? defaultLauncherPos()
  );
  const [dragging, setDragging] = useState(false);
  const dragRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    origLeft: number;
    origTop: number;
    moved: boolean;
  } | null>(null);
  const draggedRef = useRef(false);
  const isOpenRef = useRef(isOpen);
  const visiblePosRef = useRef<WidgetPos>({ left: 0, top: 0 });

  const visiblePos = isOpen ? toPanelPos(toLauncherPos(pos, false)) : toLauncherPos(pos, false);
  visiblePosRef.current = visiblePos;
  isOpenRef.current = isOpen;

  const persistFromVisible = useCallback((nextVisible: WidgetPos, open: boolean) => {
    const launcher = toLauncherPos(nextVisible, open);
    setPos(launcher);
    writeStoredLauncherPos(launcher);
  }, []);

  useEffect(() => {
    if (!hasUserDragged()) {
      setPos(defaultLauncherPos());
    }

    const onResize = () => {
      setPos((prev) => {
        const next = hasUserDragged()
          ? clamp(toLauncherPos(prev, false).left, toLauncherPos(prev, false).top, launcherSize(), launcherSize())
          : defaultLauncherPos();
        if (hasUserDragged()) writeStoredLauncherPos(next);
        return next;
      });
    };
    window.addEventListener("resize", onResize);
    window.visualViewport?.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      window.visualViewport?.removeEventListener("resize", onResize);
    };
  }, []);

  const onPointerDown = useCallback((event: ReactPointerEvent) => {
    if (event.button !== 0) return;
    const target = event.target as HTMLElement;
    if (target.closest(".dmb-chat-dismiss")) return;
    if (isOpenRef.current && target.closest("button, a, input, textarea, [role='button']")) {
      return;
    }

    const current = visiblePosRef.current;
    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      origLeft: current.left,
      origTop: current.top,
      moved: false,
    };

    const onMove = (moveEvent: PointerEvent) => {
      const drag = dragRef.current;
      if (!drag || moveEvent.pointerId !== drag.pointerId) return;
      const dx = moveEvent.clientX - drag.startX;
      const dy = moveEvent.clientY - drag.startY;
      if (!drag.moved && Math.hypot(dx, dy) < DRAG_THRESHOLD) return;
      drag.moved = true;
      setDragging(true);
      const open = isOpenRef.current;
      const size = open ? panelSize() : { width: launcherSize(), height: launcherSize() };
      persistFromVisible(clamp(drag.origLeft + dx, drag.origTop + dy, size.width, size.height), open);
    };

    const onUp = (upEvent: PointerEvent) => {
      const drag = dragRef.current;
      if (!drag || upEvent.pointerId !== drag.pointerId) return;
      dragRef.current = null;
      if (drag.moved) {
        draggedRef.current = true;
        markUserDragged();
      }
      setDragging(false);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
  }, [persistFromVisible]);

  const wasDragged = useCallback(() => {
    const dragged = draggedRef.current;
    draggedRef.current = false;
    return dragged;
  }, []);

  return {
    pos: visiblePos,
    dragging,
    onPointerDown,
    wasDragged,
  };
}
