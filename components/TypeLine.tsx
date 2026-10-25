"use client";

import { useEffect, useState } from "react";

const LINES = [
  "Welcome to the house desk.",
  "Write it once. It arrives intact.",
  "Stories and questions, sent intact.",
];

export function TypeLine() {
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
      const full = LINES[line];
      if (!deleting) {
        index += 1;
        setShown(full.slice(0, index));
        if (index >= full.length) {
          deleting = true;
          timer = window.setTimeout(tick, 1500);
          return;
        }
        timer = window.setTimeout(tick, 68);
        return;
      }
      index -= 1;
      setShown(full.slice(0, Math.max(index, 0)));
      if (index <= 0) {
        deleting = false;
        line = (line + 1) % LINES.length;
        timer = window.setTimeout(tick, 420);
        return;
      }
      timer = window.setTimeout(tick, 36);
    };

    timer = window.setTimeout(tick, 480);
    return () => window.clearTimeout(timer);
  }, [reduced]);

  return (
    <h1 className="story-title type-line" aria-label={LINES.join(" ")}>
      <span className="type-text" aria-hidden="true">{reduced ? LINES[0] : shown}</span>
      {reduced ? null : <span className="type-caret" aria-hidden="true" />}
    </h1>
  );
}
