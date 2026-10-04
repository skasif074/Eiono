import { useState } from "react";

export default function Panel({ title, icon, accent = "#7c5cff", defaultOpen = false, children }) {
  const [open, setOpen] = useState(defaultOpen);

  const onMove = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty("--mx", `${e.clientX - r.left}px`);
    e.currentTarget.style.setProperty("--my", `${e.clientY - r.top}px`);
  };

  return (
    <section
      className={`panel ${open ? "open" : ""}`}
      style={{ "--accent": accent }}
      onMouseMove={onMove}
    >
      <button className="panel-header" onClick={() => setOpen(!open)}>
        <span className="panel-title">
          {icon && <span className="panel-icon">{icon}</span>}
          {title}
        </span>
        <span className="chevron">›</span>
      </button>
      {open && <div className="panel-body">{children}</div>}
    </section>
  );
}