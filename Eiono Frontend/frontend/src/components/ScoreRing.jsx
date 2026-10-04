import { useEffect, useState } from "react";

export default function ScoreRing({ text }) {
  const m = text?.match(/score\s*[:-]?\s*(\d+(?:\.\d+)?)\s*\/\s*10/i);
  const score = m ? Math.min(10, Math.max(0, parseFloat(m[1]))) : null;
  const [shown, setShown] = useState(0);

  useEffect(() => {
    if (score === null) return;
    const t = setTimeout(() => setShown(score), 80);
    return () => clearTimeout(t);
  }, [score]);

  if (score === null) return null;

  const C = 2 * Math.PI * 45;

  return (
    <div className="score">
      <svg viewBox="0 0 100 100" aria-hidden="true">
        <defs>
          <linearGradient id="sg" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#ffb454" />
            <stop offset="100%" stopColor="#ff4fd8" />
          </linearGradient>
        </defs>
        <circle className="ring-bg" cx="50" cy="50" r="45" />
        <circle
          className="ring-fg"
          cx="50" cy="50" r="45"
          strokeDasharray={C}
          strokeDashoffset={C * (1 - shown / 10)}
          transform="rotate(-90 50 50)"
        />
      </svg>
      <div className="score-num">
        {score}
        <small>/10</small>
      </div>
    </div>
  );
}