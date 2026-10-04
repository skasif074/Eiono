const STEPS = [
  { key: "searching", label: "Search", icon: "🔎", color: "#00d4ff" },
  { key: "reading", label: "Read", icon: "🕸️", color: "#7c5cff" },
  { key: "writing", label: "Write", icon: "✍️", color: "#ff4fd8" },
  { key: "criticizing", label: "Critique", icon: "🧐", color: "#ffb454" },
];

export default function PipelineStatus({ status }) {
  const activeIndex = STEPS.findIndex((s) => s.key === status);
  const fill = status === "done" ? 100 : (Math.max(activeIndex, 0) / (STEPS.length - 1)) * 100;

  return (
    <div className="pipeline">
      <div className="track">
        <div className="track-fill" style={{ width: `${fill}%` }} />
      </div>
      {STEPS.map((step, i) => {
        let state = "pending";
        if (status === "done" || (activeIndex !== -1 && i < activeIndex)) state = "done";
        else if (i === activeIndex) state = "active";

        return (
          <div key={step.key} className={`step ${state}`} style={{ "--c": step.color }}>
            <span className="dot">{state === "done" ? "✓" : step.icon}</span>
            <span className="step-label">{step.label}</span>
          </div>
        );
      })}
    </div>
  );
}