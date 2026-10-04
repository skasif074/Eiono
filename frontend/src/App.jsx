import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { runResearch } from "./api";
import PipelineStatus from "./components/PipelineStatus";
import Panel from "./components/Panel";
import RotatingType from "./components/RotatingType";
import TypedMarkdown from "./components/TypedMarkdown";
import ScoreRing from "./components/ScoreRing";
import "./Emergent.css";

const PHRASES = [
  "Synthesizing global intelligence.",
  "Autonomous research at scale.",
  "From raw data to executive briefing.",
];

const EXAMPLES = [
  "Post-quantum cryptography protocols 2026",
  "Commercial viability of fusion reactors",
  "AGI governance frameworks",
];

const FEATURES = [
  { i: "01", t: "Aggregating" },
  { i: "02", t: "Parsing" },
  { i: "03", t: "Synthesizing" },
  { i: "04", t: "Auditing" },
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
  const [backendReady, setBackendReady] = useState(false);
  const [bootMessage, setBootMessage] = useState("ESTABLISHING SECURE UPLINK...");
  
  const timers = useRef([]);
  const pdfRef = useRef(null);

  // --- COLD START HANDLER ---
  useEffect(() => {
    let isMounted = true;
    
    const wakeUpBackend = async () => {
      // Change the message if it takes longer than 5 seconds (typical for Render cold starts)
      const messageTimer = setTimeout(() => {
        if (isMounted) setBootMessage("WAKING UP ENGINE. THIS MAY TAKE 50 SECONDS...");
      }, 5000);

      try {
        // Ping your backend base URL or a specific /health endpoint.
        // Render holds this request open until the server boots.
        // Replace with your actual backend URL from your api.js
        await fetch(import.meta.env.VITE_BACKEND_URL || "https://eiono.onrender.com/");
      } catch (e) {
        console.warn("Backend wake up ping network error (safe to ignore if CORS blocked):", e);
      } finally {
        clearTimeout(messageTimer);
        if (isMounted) setBackendReady(true);
      }
    };

    wakeUpBackend();

    return () => {
      isMounted = false;
    };
  }, []);

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
    a.download = `EIONO_Intelligence_Report_${new Date().toISOString().replace(/[:.]/g, "-")}.md`;
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
          margin: [16, 16, 16, 16],
          filename: `EIONO_Intelligence_Report_${stamp}.pdf`,
          image: { type: "jpeg", quality: 1.0 },
          html2canvas: { scale: 2, useCORS: true, backgroundColor: "#0A0A0A" },
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

  // --- BOOT SCREEN RENDER ---
  if (!backendReady) {
    return (
      <div className="emergent-root">
        <div className="ambient-grid" aria-hidden="true" />
        <div className="startup-screen">
          <h1 className="startup-logo">EIONO</h1>
          <div className="loader-bar startup-loader" />
          <p className="startup-text">{bootMessage}</p>
        </div>
      </div>
    );
  }

  // --- MAIN APP RENDER ---
  return (
    <div className="emergent-root">
      <div className="ambient-grid" aria-hidden="true" />

      <main className="emergent-layout">
        <header className="emergent-header">
          <div className="system-status">
            <span className="status-dot pulsing" /> SYSTEM ONLINE
          </div>
          <h1 className="emergent-logo">EIONO</h1>
          <div className="emergent-tagline">
            <RotatingType phrases={PHRASES} />
          </div>
          <div className="emergent-capabilities">
            {FEATURES.map((f, i) => (
              <span key={f.t} className="capability-node" style={{ animationDelay: `${i * 0.2}s` }}>
                <span className="node-id">{f.i}</span> {f.t}
              </span>
            ))}
          </div>
        </header>

        <section className="emergent-command-center">
          <div className="command-input-wrapper">
            <span className="command-prompt">~/query $</span>
            <input
              type="text"
              className="command-input"
              placeholder="Initialize research parameter..."
              value={state.topic}
              onChange={(e) => update({ topic: e.target.value })}
              onKeyDown={(e) => e.key === "Enter" && handleRun()}
              disabled={state.isLoading}
              autoFocus
            />
            <button 
              className="emergent-btn primary" 
              onClick={handleRun}
              disabled={state.isLoading || !state.topic.trim()}
            >
              {state.isLoading ? <span className="loader-bar" /> : "EXECUTE"}
            </button>
          </div>
        </section>

        {state.status === "idle" && (
          <div className="emergent-suggestions">
            <span className="suggestions-label">SUGGESTED VECTORS:</span>
            {EXAMPLES.map((ex) => (
              <button key={ex} className="suggestion-btn" onClick={() => update({ topic: ex })}>
                {ex}
              </button>
            ))}
          </div>
        )}

        {state.status !== "idle" && (
          <div className="emergent-telemetry">
            <PipelineStatus status={state.status} />
          </div>
        )}
        
        {state.error && <div className="emergent-alert alert-critical">ERR: {state.error}</div>}

        {state.isLoading && (
          <div className="emergent-skeleton-grid">
            <div className="skeleton-block main-block" />
            <div className="skeleton-block sub-block" />
          </div>
        )}

        {state.status === "done" && (
          <>
            <section className="emergent-output-dashboard">
              <header className="dashboard-actions">
                <button className="emergent-btn solid" onClick={handlePdf} disabled={pdfBusy}>
                  {pdfBusy ? "COMPILING..." : "EXPORT PDF"}
                </button>
                <button className="emergent-btn outline" onClick={handleDownload}>
                  EXPORT RAW (.MD)
                </button>
              </header>

              <Panel accent="#FFFFFF" defaultOpen icon="▣" title="INTELLIGENCE REPORT">
                <TypedMarkdown text={state.report} />
              </Panel>

              <Panel accent="#A3A3A3" defaultOpen icon="◩" title="SYSTEM AUDIT & CRITIQUE">
                <ScoreRing text={state.feedback} />
                <TypedMarkdown text={state.feedback} />
              </Panel>

              <Panel accent="#555555" icon="▤" title="RAW SEARCH VECTORS">
                <pre className="terminal-output">{state.searchResults}</pre>
              </Panel>

              <Panel accent="#555555" icon="▦" title="DATA INGESTION LOG">
                <pre className="terminal-output">{state.scrapedContent}</pre>
              </Panel>
            </section>

            <div className="pdf-offscreen" aria-hidden="true">
              <div ref={pdfRef} className="pdf-document-emergent">
                <div className="pdf-header-emergent">
                  <span className="pdf-brand">EIONO // INTELLIGENCE</span>
                  <span className="pdf-timestamp">{new Date().toISOString()}</span>
                </div>
                <h1 className="pdf-title">{state.topic}</h1>
                <div className="pdf-content">
                  <ReactMarkdown>{state.report}</ReactMarkdown>
                </div>
              </div>
            </div>
          </>
        )}

        <footer className="emergent-footer">
          EIONO ENGINE v2.0 <span className="separator">|</span> SECURE CONNECTION
        </footer>
      </main>
    </div>
  );
}