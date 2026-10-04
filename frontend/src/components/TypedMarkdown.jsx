import { useState } from "react";
import ReactMarkdown from "react-markdown";
import { useTypewriter } from "../hooks/useTypewriter";

export default function TypedMarkdown({ text }) {
  const [skipped, setSkipped] = useState(false);
  const { shown, done } = useTypewriter(text, { enabled: !skipped });

  return (
    <div className="typed">
      {!done && (
        <button className="skip" onClick={() => setSkipped(true)}>
          Skip ›
        </button>
      )}
      <div className="markdown">
        <ReactMarkdown>{shown}</ReactMarkdown>
        {!done && <span className="caret" />}
      </div>
    </div>
  );
}