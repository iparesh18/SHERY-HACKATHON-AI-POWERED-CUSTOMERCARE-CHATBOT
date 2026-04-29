const Input = ({ label, className = "", ...props }) => {
  return (
    <label className="block text-sm text-white/80">
      {label && <span className="mb-2 block">{label}</span>}
      <input
        className={`w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-ember/60 ${className}`}
        {...props}
      />
    </label>
  );
};

export default Input;
