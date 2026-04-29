const EmptyState = ({ title, subtitle }) => {
  return (
    <div className="glass-card rounded-2xl p-8 text-center">
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="mt-2 text-sm text-muted">{subtitle}</p>
    </div>
  );
};

export default EmptyState;
