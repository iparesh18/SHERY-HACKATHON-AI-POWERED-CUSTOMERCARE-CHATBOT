const toneStyles = {
  info: "bg-white/10 text-white",
  success: "bg-lagoon/20 text-lagoon",
  warning: "bg-ember/20 text-ember",
  error: "bg-red-500/20 text-red-200"
};

const ToastStack = ({ toasts }) => {
  return (
    <div className="fixed bottom-6 right-6 z-50 space-y-3">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`glass-card rounded-xl px-4 py-3 text-sm shadow-soft ${toneStyles[toast.tone] || toneStyles.info}`}
        >
          {toast.message}
        </div>
      ))}
    </div>
  );
};

export default ToastStack;
