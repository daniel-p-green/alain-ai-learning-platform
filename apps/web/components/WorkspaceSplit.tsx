"use client";
import { useCallback, useEffect, useRef, useState } from "react";

function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia(query);
    const handle = (event: MediaQueryListEvent | MediaQueryList) => {
      setMatches(event.matches);
    };
    setMatches(mq.matches);
    const listener = (event: MediaQueryListEvent) => handle(event);
    mq.addEventListener("change", listener);
    return () => mq.removeEventListener("change", listener);
  }, [query]);

  return matches;
}

type WorkspaceSplitProps = {
  left: React.ReactNode;
  right: React.ReactNode;
  minLeft?: number;
  minRight?: number;
  initialLeftPercent?: number;
  className?: string;
};

export default function WorkspaceSplit({
  left,
  right,
  minLeft = 320,
  minRight = 380,
  initialLeftPercent = 42,
  className = "",
}: WorkspaceSplitProps) {
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [leftPercent, setLeftPercent] = useState(initialLeftPercent);
  const [dragging, setDragging] = useState(false);

  const updateFromClientX = useCallback(
    (clientX: number) => {
      const container = containerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const total = rect.width;
      if (total <= 0) return;
      let nextLeftPx = clientX - rect.left;
      nextLeftPx = Math.max(minLeft, Math.min(total - minRight, nextLeftPx));
      const nextPercent = (nextLeftPx / total) * 100;
      setLeftPercent(nextPercent);
    },
    [minLeft, minRight]
  );

  useEffect(() => {
    if (!dragging) return;

    const handleMouseMove = (event: MouseEvent) => {
      updateFromClientX(event.clientX);
    };
    const handleTouchMove = (event: TouchEvent) => {
      if (event.touches.length === 0) return;
      updateFromClientX(event.touches[0].clientX);
    };
    const handleUp = () => setDragging(false);

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("touchmove", handleTouchMove, { passive: false });
    window.addEventListener("mouseup", handleUp);
    window.addEventListener("touchend", handleUp);
    window.addEventListener("touchcancel", handleUp);

    const originalUserSelect = document.body.style.userSelect;
    document.body.style.userSelect = "none";

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("mouseup", handleUp);
      window.removeEventListener("touchend", handleUp);
      window.removeEventListener("touchcancel", handleUp);
      document.body.style.userSelect = originalUserSelect;
    };
  }, [dragging, updateFromClientX]);

  if (!isDesktop) {
    return (
      <div className={`flex flex-col gap-6 ${className}`}>
        {left}
        {right}
      </div>
    );
  }

  return (
    <div ref={containerRef} className={`flex h-[calc(100vh-180px)] max-h-[860px] min-h-[520px] ${className}`}>
      <div
        className="flex-shrink-0 overflow-y-auto pr-4"
        style={{ width: `${leftPercent}%` }}
      >
        {left}
      </div>
      <div
        className={`relative w-3 cursor-col-resize select-none self-stretch px-1 ${dragging ? "bg-alain-blue/10" : "bg-transparent"}`}
        role="separator"
        aria-orientation="vertical"
        aria-label="Resize workspace"
        tabIndex={0}
        onMouseDown={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDoubleClick={() => setLeftPercent(initialLeftPercent)}
        onTouchStart={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
      >
        <div className="pointer-events-none absolute left-1/2 top-1/2 h-20 w-px -translate-x-1/2 -translate-y-1/2 bg-ink-200" />
      </div>
      <div className="flex-1 overflow-hidden">
        {right}
      </div>
    </div>
  );
}
