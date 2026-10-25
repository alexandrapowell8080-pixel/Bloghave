"use client";

import { useEffect, useState } from "react";

export function TypeLine({ lines, className }: { lines: string[]; className?: string }) {
  const [shown, setShown] = useState("");
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setReduced(media.matches);
    apply();
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, []);

  useEffect(() => {
    if (reduced) return;
    let line = 0;
    let index = 0;
    let deleting = false;
    let timer = 0;

    const tick = () => {
      const full = lines[line] || "";
      if (!deleting) {
        index += 1;
        setShown(full.slice(0, index));
        if (index >= full.length) {
          deleting = true;
          timer = window.setTimeout(tick, 1600);
          return;
        }
        timer = window.setTimeout(tick, 74);
        return;
      }
      index -= 1;
      setShown(full.slice(0, Math.max(index, 0)));
      if (index <= 0) {
        deleting = false;
        line = (line + 1) % lines.length;
        timer = window.setTimeout(tick, 460);
        return;
      }
      timer = window.setTimeout(tick, 40);
    };

    timer = window.setTimeout(tick, 360);
    return () => window.clearTimeout(timer);
  }, [reduced, lines]);

  return (
    <p className={className} aria-label={lines.join(" ")}>
      <span className="type-text" aria-hidden="true">{reduced ? lines[0] : shown}</span>
      {reduced ? null : <span className="type-caret" aria-hidden="true" />}
    </p>
  );
}
