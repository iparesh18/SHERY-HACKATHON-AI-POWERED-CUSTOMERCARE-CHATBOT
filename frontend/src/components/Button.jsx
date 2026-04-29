const Button = ({ children, label, variant = "primary", className = "", ...props }) => {
  const base = "inline-flex items-center justify-center rounded-xl px-4 py-2 text-base font-semibold tracking-wide transition";
  const styles = {
    primary: "bg-ember text-white shadow-glow hover:translate-y-[-1px]",
    ghost: "bg-white/10 text-white hover:bg-white/20",
    outline: "border border-white/20 text-white hover:border-white/40",
    danger: "bg-red-500/80 text-white hover:bg-red-500"
  };
  const content = children ?? label;
  const ariaLabel = props["aria-label"] || label;

  return (
    <button
      className={`${base} ${styles[variant] || styles.primary} ${className}`}
      aria-label={ariaLabel}
      title={label}
      {...props}
    >
      {content}
    </button>
  );
};

export default Button;
