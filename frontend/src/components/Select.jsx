const Select = ({ label, className = "", options = [], ...props }) => {
  return (
    <label className="block text-sm text-white/80">
      {label && <span className="mb-2 block">{label}</span>}
      <div className="relative">
        <select
          className={`select-field pr-10 ${className}`}
          {...props}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value} className="select-option">
              {option.label}
            </option>
          ))}
        </select>
        <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs text-white/70">
          ▾
        </span>
      </div>
    </label>
  );
};

export default Select;
