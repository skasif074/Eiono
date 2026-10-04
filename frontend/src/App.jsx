import { useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { runResearch } from "./api";
import PipelineStatus from "./components/PipelineStatus";
import Panel from "./components/Panel";
import RotatingType from "./components/RotatingType";
import TypedMarkdown from "./components/TypedMarkdown";
import ScoreRing from "./components/ScoreRing";
import "./App.css";

const PHRASES = [
  "Ask anything. Eiono researches it.",
  "Search. Read. Write. Critique.",
  "From a question to a report in minutes.",
];

const EXAMPLES = [
  "Quantum computing breakthroughs in 2026",
  "Future of solid-state batteries",
  "How CRISPR is changing medicine",
];

const FEATURES = [
  { i: "🔎", t: "Search" },
  { i: "🕸️", t: "Read" },
  { i: "✍️", t: "Write" },
  { i: "🧐", t: "Critique" },
];

const STAGE_TIMINGS = [
  { status: "reading", after: 5000 },
  { status: "writing", after: 12000 },
  { status: "criticizing", after: 22000 },
];

const initial = {
  topic: "",
  isLoading: false,
  status: "idle",
  searchResults: "",
  scrapedContent: "",
  report: "",
  feedback: "",
  error: "",
};

export default function App() {
  const [state, setState] = useState(initial);
  const [pdfBusy, setPdfBusy] = useState(false);
  const timers = useRef([]);
  const pdfRef = useRef(null);

  const update = (patch) => setState((s) => ({ ...s, ...patch }));

  const clearTimers = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };

  const handleRun = async () => {
    const topic = state.topic.trim();
    if (!topic || state.isLoading) return;

    clearTimers();
    setState({ ...initial, topic, isLoading: true, status: "searching" });
    STAGE_TIMINGS.forEach(({ status, after }) =>
      timers.current.push(setTimeout(() => update({ status }), after))
    );

    try {
      const data = await runResearch(topic);
      clearTimers();
      update({
        isLoading: false,
        status: "done",
        searchResults: data.search_results,
        scrapedContent: data.scraped_content,
        report: data.report,
        feedback: data.feedback,
      });
    } catch (err) {
      clearTimers();
      update({ isLoading: false, status: "idle", error: err.message });
    }
  };

  const handleDownload = () => {
    const blob = new Blob([state.report], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `eiono_report_${new Date().toISOString().replace(/[:.]/g, "-")}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePdf = async () => {
    if (!pdfRef.current) return;
    setPdfBusy(true);
    try {
      const html2pdf = (await import("html2pdf.js")).default;
      const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
      await html2pdf()
        .set({
          margin: [14, 14, 14, 14],
          filename: `eiono_report_${stamp}.pdf`,
          image: { type: "jpeg", quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true, backgroundColor: "#ffffff" },
          jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
          pagebreak: { mode: ["css", "legacy"], avoid: ["h1", "h2", "h3", "li"] },
        })
        .from(pdfRef.current)
        .save();
    } catch (e) {
      update({ error: "PDF export failed: " + e.message });
    } finally {
      setPdfBusy(false);
    }
  };

  return (
    <>
      <div className="aurora" aria-hidden="true">
        <span /><span /><span /><span /><span />
      </div>

      <main className="app">
        <header className="hero">
          <div className="badge"><i className="live" /> AI Research Agent</div>
          <h1 className="logo">Eiono</h1>
          <p className="tagline"><RotatingType phrases={PHRASES} /></p>
          <div className="chips">
            {FEATURES.map((f, i) => (
              <span key={f.t} className="fchip" style={{ animationDelay: `${i * 0.4}s` }}>
                {f.i} {f.t}
              </span>
            ))}
          </div>
        </header>

        <div className="search-card">
          <svg className="search-icon" viewBox="0 0 24 24" width="22" height="22" fill="none"
               stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" />
          </svg>
          <input
            type="text"
            placeholder="What do you want to research?"
            value={state.topic}
            onChange={(e) => update({ topic: e.target.value })}
            onKeyDown={(e) => e.key === "Enter" && handleRun()}
            disabled={state.isLoading}
          />
          <button className="primary" onClick={handleRun}
                  disabled={state.isLoading || !state.topic.trim()}>
            {state.isLoading ? <span className="spinner" /> : "Research"}
          </button>
        </div>

        {state.status === "idle" && (
          <div className="examples">
            {EXAMPLES.map((ex) => (
              <button key={ex} className="ex" onClick={() => update({ topic: ex })}>{ex}</button>
            ))}
          </div>
        )}

        {state.status !== "idle" && <PipelineStatus status={state.status} />}
        {state.error && <div className="error">⚠ {state.error}</div>}

        {state.isLoading && (
          <div className="results">
            <div className="skeleton tall" />
            <div className="skeleton" />
          </div>
        )}

        {state.status === "done" && (
          <>
            <div className="results">
              <div className="toolbar">
                <button className="primary small" onClick={handlePdf} disabled={pdfBusy}>
                  {pdfBusy ? "Generating..." : "⬇ Download PDF"}
                </button>
                <button className="ghost small" onClick={handleDownload}>Download .md</button>
              </div>

              <Panel title="Final Report" icon="📄" accent="#7c5cff" defaultOpen>
                <TypedMarkdown text={state.report} />
              </Panel>

              <Panel title="Critic Feedback" icon="🧐" accent="#ffb454" defaultOpen>
                <ScoreRing text={state.feedback} />
                <TypedMarkdown text={state.feedback} />
              </Panel>

              <Panel title="Search Results" icon="🔎" accent="#00d4ff">
                <pre>{state.searchResults}</pre>
              </Panel>

              <Panel title="Scraped Source" icon="🕸️" accent="#34d399">
                <pre>{state.scrapedContent}</pre>
              </Panel>
            </div>

            {/* Hidden PDF source: outside .results so no fade animation touches it */}
            <div className="pdf-offscreen" aria-hidden="true">
              <div ref={pdfRef} className="pdf-doc">
                <div className="pdf-brand">Eiono</div>
                <div className="pdf-meta">
                  Research report · {state.topic} · {new Date().toLocaleDateString()}
                </div>
                <ReactMarkdown>{state.report}</ReactMarkdown>
              </div>
            </div>
          </>
        )}

        <footer className="foot">Built with <span className="spark">✦</span> Eiono</footer>
      </main>
    </>
  );
}