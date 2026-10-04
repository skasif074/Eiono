
const STEPS = [
  { id: "searching", label: "Aggregating" },
  { id: "reading", label: "Parsing" },
  { id: "writing", label: "Synthesizing" },
  { id: "criticizing", label: "Auditing" },
];

export default function PipelineStatus({ status }) {
  const getActiveIndex = () => {
    if (status === "done") return STEPS.length;
    const index = STEPS.findIndex((s) => s.id === status);
    return index === -1 ? 0 : index;
  };

  const activeIndex = getActiveIndex();
  
  // Calculate percentage for the continuous bar
  const progressPercentage = activeIndex === STEPS.length 
    ? 100 
    : (activeIndex / (STEPS.length - 1)) * 100;

  return (
    <div className="pipeline-container">
      <div className="pipeline-header">
        <span className="pipeline-title">Engine Status</span>
        <span className="pipeline-percentage">
          {Math.min(Math.round((activeIndex / STEPS.length) * 100), 100)}%
        </span>
      </div>
      
      <div className="pipeline-bar-wrapper">
        <div 
          className="pipeline-bar-fill" 
          style={{ width: `${Math.min(progressPercentage, 100)}%` }} 
        />
      </div>

      <div className="pipeline-steps-row">
        {STEPS.map((step, index) => {
          const isCompleted = index < activeIndex;
          const isActive = index === activeIndex;
          
          let stepClass = "pipeline-step-text";
          if (isCompleted) stepClass += " completed";
          if (isActive) stepClass += " active";

          return (
            <span key={step.id} className={stepClass}>
              {step.label}
            </span>
          );
        })}
      </div>
    </div>
  );
}