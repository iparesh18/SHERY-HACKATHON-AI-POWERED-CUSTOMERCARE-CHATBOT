const toneMap = {
  open: "bg-lagoon/20 text-lagoon",
  "in-progress": "bg-ember/20 text-ember",
  resolved: "bg-white/20 text-white"
};

const Badge = ({ label, tone }) => {
  return (
    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${toneMap[tone] || "bg-white/10 text-white"}`}>
      {label}
    </span>
  );
};

export default Badge;
