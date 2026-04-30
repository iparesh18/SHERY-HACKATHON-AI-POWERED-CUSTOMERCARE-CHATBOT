import "./SkeletonMessage.css";

/**
 * Premium skeleton loader for AI chat messages
 * Displays while AI is generating a response
 * @param {number} lines - Number of skeleton lines (2-4)
 */
const SkeletonMessage = ({ lines = 3 }) => {
  const generateWidths = (count) => {
    const widths = [];
    for (let i = 0; i < count; i++) {
      // Last line shorter, others varied
      if (i === count - 1) {
        widths.push("w-2/3");
      } else if (i === 0) {
        widths.push("w-full");
      } else {
        widths.push(i % 2 === 0 ? "w-5/6" : "w-4/5");
      }
    }
    return widths;
  };

  const lineWidths = generateWidths(Math.max(2, Math.min(lines, 4)));

  return (
    <div className="flex justify-start animate-fade-in">
      <div className="max-w-[75%] rounded-2xl px-4 py-3 bg-slate-200 dark:bg-slate-700 space-y-2.5 w-64">
        {lineWidths.map((width, idx) => (
          <div
            key={idx}
            className={`${width} h-4 rounded-full skeleton-shimmer bg-slate-300 dark:bg-slate-600`}
          />
        ))}
      </div>
    </div>
  );
};

export default SkeletonMessage;
