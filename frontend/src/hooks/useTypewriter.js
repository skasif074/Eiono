import { useEffect, useState } from "react";

export function useTypewriter(text, { speed = 10, enabled = true } = {}) {
  const [progress, setProgress] = useState({ text: "", count: 0 });

  // If the text changed, progress restarts from 0 (no reset effect needed)
  const count = progress.text === text ? progress.count : 0;

  useEffect(() => {
    if (!enabled || !text || count >= text.length) return;

    // Long reports type in bigger chunks so they never take forever
    const step = Math.max(1, Math.ceil(text.length / 1200));

    const id = setTimeout(() => {
      setProgress({ text, count: Math.min(count + step, text.length) });
    }, speed);

    return () => clearTimeout(id);
  }, [text, count, speed, enabled]);

  const done = !enabled || count >= text.length;
  const shown = enabled ? text.slice(0, count) : text;

  return { shown, done };
}